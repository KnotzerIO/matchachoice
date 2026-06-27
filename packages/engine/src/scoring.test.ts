import type { QuestionOption, RuleGroup } from "@matchachoice/db/schema/types";
import { describe, expect, it } from "vitest";
import { scoreAnswers } from "./index";
import type { EngineCheck, EngineQuestion } from "./types";

const opt = (
	value: string,
	scores?: Record<string, number>
): QuestionOption => ({ id: value, label: value, value, scores });

const question = (
	id: string,
	options: QuestionOption[],
	visibility?: RuleGroup
): EngineQuestion => ({ id, config: { options }, visibility });

const check = (questions: EngineQuestion[]): EngineCheck => ({
	questions,
	results: [],
});

describe("scoreAnswers", () => {
	it("sums the scores of a chosen single-choice option", () => {
		const c = check([
			question("q1", [
				opt("a", { risk: 3, budget: 1 }),
				opt("b", { risk: 0, budget: 5 }),
			]),
		]);
		expect(scoreAnswers(c, { q1: "a" })).toEqual({ risk: 3, budget: 1 });
	});

	it("sums every chosen option for a multiple-choice (string[]) answer", () => {
		const c = check([
			question("q1", [
				opt("a", { risk: 2 }),
				opt("b", { risk: 3, budget: 4 }),
				opt("c", { risk: 10 }),
			]),
		]);
		expect(scoreAnswers(c, { q1: ["a", "b"] })).toEqual({ risk: 5, budget: 4 });
	});

	it("accumulates scores across multiple questions", () => {
		const c = check([
			question("q1", [opt("a", { risk: 2 })]),
			question("q2", [opt("x", { risk: 3, budget: 1 })]),
		]);
		expect(scoreAnswers(c, { q1: "a", q2: "x" })).toEqual({
			risk: 5,
			budget: 1,
		});
	});

	it("ignores questions hidden by their visibility rule", () => {
		const hidden: RuleGroup = {
			logic: "and",
			conditions: [{ operator: "equals", questionId: "gate", value: "yes" }],
		};
		const c = check([
			question("gate", [opt("no"), opt("yes")]),
			question("q2", [opt("x", { risk: 5 })], hidden),
		]);
		expect(scoreAnswers(c, { gate: "no", q2: "x" })).toEqual({});
	});

	it("contributes nothing for a missing or empty answer", () => {
		const c = check([question("q1", [opt("a", { risk: 5 })])]);
		expect(scoreAnswers(c, {})).toEqual({});
		expect(scoreAnswers(c, { q1: "" })).toEqual({});
	});

	it("handles a chosen option that has no scores", () => {
		const c = check([question("q1", [opt("a")])]);
		expect(scoreAnswers(c, { q1: "a" })).toEqual({});
	});

	it("ignores an answer that matches no option", () => {
		const c = check([question("q1", [opt("a", { risk: 5 })])]);
		expect(scoreAnswers(c, { q1: "zzz" })).toEqual({});
	});

	it("handles a question that defines no options", () => {
		const c: EngineCheck = check([{ id: "q1", config: {} }]);
		expect(scoreAnswers(c, { q1: 42 })).toEqual({});
	});
});
