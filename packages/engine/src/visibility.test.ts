import type { RuleGroup } from "@matchachoice/db/schema/types";
import { describe, expect, it } from "vitest";
import { evaluateVisibility } from "./index";

const rule = (
	logic: "and" | "or",
	...conditions: RuleGroup["conditions"]
): RuleGroup => ({ logic, conditions });

describe("evaluateVisibility — no rule", () => {
	it("treats an undefined rule as visible", () => {
		expect(evaluateVisibility(undefined, {})).toBe(true);
	});

	it("treats an empty condition group as visible", () => {
		expect(evaluateVisibility(rule("and"), {})).toBe(true);
	});
});

describe("evaluateVisibility — operators", () => {
	it("equals returns true on a match", () => {
		const r = rule("and", { operator: "equals", questionId: "q1", value: "a" });
		expect(evaluateVisibility(r, { q1: "a" })).toBe(true);
	});

	it("equals returns false on a mismatch", () => {
		const r = rule("and", { operator: "equals", questionId: "q1", value: "a" });
		expect(evaluateVisibility(r, { q1: "b" })).toBe(false);
	});

	it("equals compares booleans and numbers strictly", () => {
		const rBool = rule("and", {
			operator: "equals",
			questionId: "q1",
			value: true,
		});
		expect(evaluateVisibility(rBool, { q1: true })).toBe(true);
		const rNum = rule("and", {
			operator: "equals",
			questionId: "q1",
			value: 3,
		});
		expect(evaluateVisibility(rNum, { q1: 3 })).toBe(true);
	});

	it("not_equals returns true when different and false when equal", () => {
		const r = rule("and", {
			operator: "not_equals",
			questionId: "q1",
			value: "a",
		});
		expect(evaluateVisibility(r, { q1: "b" })).toBe(true);
		expect(evaluateVisibility(r, { q1: "a" })).toBe(false);
	});

	it("greater_than compares numerically", () => {
		const r = rule("and", {
			operator: "greater_than",
			questionId: "q1",
			value: 5,
		});
		expect(evaluateVisibility(r, { q1: 6 })).toBe(true);
		expect(evaluateVisibility(r, { q1: 5 })).toBe(false);
	});

	it("greater_than is false for non-numeric answers", () => {
		const r = rule("and", {
			operator: "greater_than",
			questionId: "q1",
			value: 5,
		});
		expect(evaluateVisibility(r, { q1: "abc" })).toBe(false);
	});

	it("less_than compares numerically", () => {
		const r = rule("and", {
			operator: "less_than",
			questionId: "q1",
			value: 5,
		});
		expect(evaluateVisibility(r, { q1: 4 })).toBe(true);
		expect(evaluateVisibility(r, { q1: 5 })).toBe(false);
	});

	it("contains matches a substring of a string answer", () => {
		const r = rule("and", {
			operator: "contains",
			questionId: "q1",
			value: "oo",
		});
		expect(evaluateVisibility(r, { q1: "food" })).toBe(true);
		expect(evaluateVisibility(r, { q1: "bar" })).toBe(false);
	});

	it("contains matches a member of a multiple-choice (string[]) answer", () => {
		const r = rule("and", {
			operator: "contains",
			questionId: "q1",
			value: "x",
		});
		expect(evaluateVisibility(r, { q1: ["x", "y"] })).toBe(true);
		expect(evaluateVisibility(r, { q1: ["y", "z"] })).toBe(false);
	});

	it("contains is false for a non-string, non-array answer", () => {
		const r = rule("and", {
			operator: "contains",
			questionId: "q1",
			value: "x",
		});
		expect(evaluateVisibility(r, { q1: 5 })).toBe(false);
	});

	it("empty is true for missing, empty-string and empty-array answers", () => {
		const r = rule("and", { operator: "empty", questionId: "q1" });
		expect(evaluateVisibility(r, {})).toBe(true);
		expect(evaluateVisibility(r, { q1: "" })).toBe(true);
		expect(evaluateVisibility(r, { q1: [] })).toBe(true);
	});

	it("empty is false for present values including 0 and false", () => {
		const r = rule("and", { operator: "empty", questionId: "q1" });
		expect(evaluateVisibility(r, { q1: "a" })).toBe(false);
		expect(evaluateVisibility(r, { q1: 0 })).toBe(false);
		expect(evaluateVisibility(r, { q1: false })).toBe(false);
	});
});

describe("evaluateVisibility — and / or combination", () => {
	it("and requires every condition to pass", () => {
		const r = rule(
			"and",
			{ operator: "equals", questionId: "q1", value: "a" },
			{ operator: "greater_than", questionId: "q2", value: 5 }
		);
		expect(evaluateVisibility(r, { q1: "a", q2: 6 })).toBe(true);
		expect(evaluateVisibility(r, { q1: "a", q2: 4 })).toBe(false);
	});

	it("or passes when at least one condition passes", () => {
		const r = rule(
			"or",
			{ operator: "equals", questionId: "q1", value: "a" },
			{ operator: "equals", questionId: "q2", value: "b" }
		);
		expect(evaluateVisibility(r, { q1: "x", q2: "b" })).toBe(true);
		expect(evaluateVisibility(r, { q1: "x", q2: "y" })).toBe(false);
	});
});
