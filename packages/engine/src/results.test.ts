import type {
	QuestionOption,
	RuleGroup,
	ScoreTargets,
} from "@matchachoice/db/schema/types";
import { describe, expect, it } from "vitest";
import { computeResults } from "./index";
import type { EngineCheck, EngineQuestion, EngineResult } from "./types";

const opt = (
	value: string,
	scores?: Record<string, number>
): QuestionOption => ({ id: value, label: value, value, scores });

const question = (id: string, options: QuestionOption[]): EngineQuestion => ({
	id,
	config: { options },
});

const res = (
	id: string,
	scoreTargets: ScoreTargets,
	exclusion?: RuleGroup
): EngineResult => ({ id, scoreTargets, exclusion });

const check = (
	questions: EngineQuestion[],
	results: EngineResult[]
): EngineCheck => ({ questions, results });

describe("computeResults — match%", () => {
	it("scores 100% when the user score equals the target", () => {
		const c = check(
			[question("q1", [opt("a", { risk: 10 }), opt("b", { risk: 0 })])],
			[res("r1", { risk: 10 })]
		);
		expect(computeResults(c, { q1: "a" })).toEqual([
			{ resultId: "r1", matchPct: 100, excluded: false },
		]);
	});

	it("scores 0% at maximum distance", () => {
		const c = check(
			[question("q1", [opt("a", { risk: 10 })])],
			[res("r1", { risk: 0 })]
		);
		expect(computeResults(c, { q1: "a" })[0]?.matchPct).toBe(0);
	});

	it("scores 50% at half the normalised distance", () => {
		const c = check(
			[question("q1", [opt("a", { risk: 5 }), opt("b", { risk: 10 })])],
			[res("r1", { risk: 10 })]
		);
		expect(computeResults(c, { q1: "a" })[0]?.matchPct).toBe(50);
	});

	it("averages the distance across the result's target categories", () => {
		const c = check(
			[
				question("q1", [opt("a", { risk: 10 })]),
				question("q2", [opt("x", { budget: 10 })]),
			],
			[res("r1", { risk: 10, budget: 0 })]
		);
		// risk dist 0, budget dist 1 -> avg 0.5 -> 50%
		expect(computeResults(c, { q1: "a", q2: "x" })[0]?.matchPct).toBe(50);
	});

	it("skips categories whose max achievable score is 0", () => {
		const c = check(
			[
				question("q1", [opt("a", { risk: 10 })]),
				question("q2", [opt("x", { flag: 0 })]),
			],
			[res("r1", { risk: 10, flag: 0 })]
		);
		// flag has range 0 -> skipped; only risk (dist 0) averaged -> 100%
		expect(computeResults(c, { q1: "a", q2: "x" })[0]?.matchPct).toBe(100);
	});

	it("returns 0% for a result without any targets", () => {
		const c = check(
			[question("q1", [opt("a", { risk: 10 })])],
			[res("r1", {})]
		);
		expect(computeResults(c, { q1: "a" })[0]?.matchPct).toBe(0);
	});

	it("treats a target category with no earned score as 0", () => {
		const c = check(
			[question("q1", [opt("a", { risk: 10 })])],
			[res("r1", { risk: 10 })]
		);
		// q1 unanswered -> risk score 0 -> dist |0-10|/10 = 1 -> 0%
		expect(computeResults(c, {})[0]?.matchPct).toBe(0);
	});

	it("ignores questions without options when computing the range", () => {
		const c: EngineCheck = {
			questions: [
				{ id: "info", config: {} },
				question("q1", [opt("a", { risk: 10 })]),
			],
			results: [res("r1", { risk: 10 })],
		};
		expect(computeResults(c, { q1: "a" })[0]?.matchPct).toBe(100);
	});

	it("returns 0% when every target category has range 0", () => {
		const c = check(
			[question("q1", [opt("a", { flag: 0 })])],
			[res("r1", { flag: 0 })]
		);
		expect(computeResults(c, { q1: "a" })[0]?.matchPct).toBe(0);
	});

	it("clamps an over-range score (multiple choice) to 0%", () => {
		const c = check(
			[question("q1", [opt("a", { risk: 10 }), opt("b", { risk: 10 })])],
			[res("r1", { risk: 0 })]
		);
		// range = highest option per question = 10; user picks both -> 20
		// dist = 20/10 = 2 -> 100*(1-2) = -100 -> clamped to 0
		expect(computeResults(c, { q1: ["a", "b"] })[0]?.matchPct).toBe(0);
	});
});

describe("computeResults — ranking", () => {
	it("sorts by match% descending and is stable on ties", () => {
		const c = check(
			[question("q1", [opt("a", { risk: 10 })])],
			[res("r1", { risk: 10 }), res("r2", { risk: 10 }), res("r3", { risk: 0 })]
		);
		const ranked = computeResults(c, { q1: "a" });
		expect(ranked.map((r) => r.resultId)).toEqual(["r1", "r2", "r3"]);
	});
});

describe("computeResults — hard exclusions", () => {
	const excludeIfA: RuleGroup = {
		logic: "and",
		conditions: [{ operator: "equals", questionId: "q1", value: "a" }],
	};

	it("flags a matching exclusion and sinks it below non-excluded results", () => {
		const c = check(
			[question("q1", [opt("a", { risk: 10 })])],
			[res("r1", { risk: 10 }, excludeIfA), res("r2", { risk: 0 })]
		);
		const ranked = computeResults(c, { q1: "a" });
		expect(ranked).toEqual([
			{ resultId: "r2", matchPct: 0, excluded: false },
			{ resultId: "r1", matchPct: 100, excluded: true },
		]);
	});

	it("does not exclude when the exclusion group is empty", () => {
		const empty: RuleGroup = { logic: "and", conditions: [] };
		const c = check(
			[question("q1", [opt("a", { risk: 10 })])],
			[res("r1", { risk: 10 }, empty)]
		);
		expect(computeResults(c, { q1: "a" })[0]?.excluded).toBe(false);
	});

	it("returns every result flagged when all are excluded", () => {
		const c = check(
			[question("q1", [opt("a", { risk: 10 })])],
			[res("r1", { risk: 10 }, excludeIfA), res("r2", { risk: 0 }, excludeIfA)]
		);
		const ranked = computeResults(c, { q1: "a" });
		expect(ranked).toHaveLength(2);
		expect(ranked.every((r) => r.excluded)).toBe(true);
	});
});
