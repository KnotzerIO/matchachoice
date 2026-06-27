// The engine is framework-free and has no runtime dependencies. It only
// borrows the shared domain shapes (type-only) so the editor, the DB schema
// and the engine agree on the exact same structures.
import type {
	AnswerValue,
	QuestionConfig,
	RuleGroup,
	ScoreTargets,
} from "@matchachoice/db/schema/types";

// questionId -> the value the respondent picked/entered
export type Answers = Record<string, AnswerValue>;

// categoryId -> accumulated score
export type CategoryScores = Record<string, number>;

// Minimal projection of a question the engine needs: its options (with
// per-option scoring live in `config`) and an optional visibility rule.
export interface EngineQuestion {
	config: QuestionConfig;
	id: string;
	visibility?: RuleGroup;
}

// Minimal projection of a result: its per-category targets and an optional
// hard-exclusion rule.
export interface EngineResult {
	exclusion?: RuleGroup;
	id: string;
	scoreTargets: ScoreTargets;
}

export interface EngineCheck {
	questions: EngineQuestion[];
	results: EngineResult[];
}

export interface RankedResult {
	excluded: boolean;
	matchPct: number;
	resultId: string;
}
