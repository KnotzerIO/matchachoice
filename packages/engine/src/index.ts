import type {
	AnswerValue,
	Condition,
	RuleGroup,
} from "@matchachoice/db/schema/types";
import type {
	Answers,
	CategoryScores,
	EngineCheck,
	EngineResult,
	RankedResult,
} from "./types";

function isEmptyAnswer(answer: AnswerValue | undefined): boolean {
	if (answer === undefined) {
		return true;
	}
	if (typeof answer === "string") {
		return answer.length === 0;
	}
	if (Array.isArray(answer)) {
		return answer.length === 0;
	}
	return false;
}

function evaluateCondition(condition: Condition, answers: Answers): boolean {
	const answer = answers[condition.questionId];
	// biome-ignore lint/style/useDefaultSwitchClause: The condition.operator is a discriminated union, so all cases are covered.
	switch (condition.operator) {
		case "empty":
			return isEmptyAnswer(answer);
		case "equals":
			return answer === condition.value;
		case "not_equals":
			return answer !== condition.value;
		case "greater_than":
			return Number(answer) > Number(condition.value);
		case "less_than":
			return Number(answer) < Number(condition.value);
		case "contains":
			if (Array.isArray(answer)) {
				return answer.includes(String(condition.value));
			}
			if (typeof answer === "string") {
				return answer.includes(String(condition.value));
			}
			return false;
	}
}

// Evaluates a non-empty condition group: `and` requires every condition, `or`
// requires at least one.
function evaluateGroup(rule: RuleGroup, answers: Answers): boolean {
	if (rule.logic === "and") {
		return rule.conditions.every((c) => evaluateCondition(c, answers));
	}
	return rule.conditions.some((c) => evaluateCondition(c, answers));
}

/**
 * A question is visible when it has no rule, an empty rule, or its condition
 * group is satisfied. An absent/empty rule means "always visible".
 */
export function evaluateVisibility(
	rule: RuleGroup | undefined,
	answers: Answers
): boolean {
	if (!rule || rule.conditions.length === 0) {
		return true;
	}
	return evaluateGroup(rule, answers);
}

// A result is excluded only when it has a non-empty exclusion group that
// matches. An absent/empty rule never excludes.
function isExcluded(rule: RuleGroup | undefined, answers: Answers): boolean {
	if (!rule || rule.conditions.length === 0) {
		return false;
	}
	return evaluateGroup(rule, answers);
}

// Choice answers reference option values: a single string, or an array for
// multiple-choice. Anything else (number/boolean/text) selects no option.
function selectedOptionValues(answer: AnswerValue | undefined): string[] {
	if (typeof answer === "string") {
		return answer.length > 0 ? [answer] : [];
	}
	if (Array.isArray(answer)) {
		return answer;
	}
	return [];
}

/**
 * Sums, per category, the points of every chosen option across all *visible*
 * questions. Hidden questions, unmatched answers and options without scores
 * contribute nothing. Categories that earn no points are simply absent.
 */
export function scoreAnswers(
	check: EngineCheck,
	answers: Answers
): CategoryScores {
	const totals: CategoryScores = {};
	for (const question of check.questions) {
		if (!evaluateVisibility(question.visibility, answers)) {
			continue;
		}
		const options = question.config.options;
		if (!options) {
			continue;
		}
		const selected = selectedOptionValues(answers[question.id]);
		for (const option of options) {
			if (!(selected.includes(option.value) && option.scores)) {
				continue;
			}
			for (const [category, points] of Object.entries(option.scores)) {
				totals[category] = (totals[category] ?? 0) + points;
			}
		}
	}
	return totals;
}

// Maximum score a category can reach in this check: the sum of the highest
// single option score per question. Derived from the definition, not the
// answers — this is the normalisation range for the match distance.
function maxAchievable(check: EngineCheck, category: string): number {
	let total = 0;
	for (const question of check.questions) {
		const options = question.config.options;
		if (!options) {
			continue;
		}
		let best = 0;
		for (const option of options) {
			const points = option.scores?.[category] ?? 0;
			if (points > best) {
				best = points;
			}
		}
		total += best;
	}
	return total;
}

// match% = 100 × (1 − average normalised distance over the result's target
// categories). Categories with range 0 are skipped; with no comparable
// categories the result scores 0. Clamped to [0, 100].
function matchPercent(
	check: EngineCheck,
	result: EngineResult,
	scores: CategoryScores
): number {
	let distanceSum = 0;
	let count = 0;
	for (const [category, target] of Object.entries(result.scoreTargets)) {
		const range = maxAchievable(check, category);
		if (range === 0) {
			continue;
		}
		const userScore = scores[category] ?? 0;
		distanceSum += Math.abs(userScore - target) / range;
		count += 1;
	}
	if (count === 0) {
		return 0;
	}
	const pct = 100 * (1 - distanceSum / count);
	return Math.max(0, Math.min(100, pct));
}

/**
 * Ranks every result by match%. Results whose hard-exclusion matches are kept
 * in the output flagged `excluded: true` but sorted below all non-excluded
 * ones. Ties preserve input order (stable).
 */
export function computeResults(
	check: EngineCheck,
	answers: Answers
): RankedResult[] {
	const scores = scoreAnswers(check, answers);
	const ranked: RankedResult[] = check.results.map((result) => ({
		resultId: result.id,
		matchPct: matchPercent(check, result, scores),
		excluded: isExcluded(result.exclusion, answers),
	}));
	ranked.sort(
		(a, b) => Number(a.excluded) - Number(b.excluded) || b.matchPct - a.matchPct
	);
	return ranked;
}

export type {
	Answers,
	CategoryScores,
	EngineCheck,
	EngineQuestion,
	EngineResult,
	RankedResult,
} from "./types";
