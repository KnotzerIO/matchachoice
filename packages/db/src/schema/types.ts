// Shapes stored in jsonb columns. Kept here so both the schema and the
// (pure-function) scoring engine can share the exact same types.

// Single source of truth for the supported question types. The pgEnum in
// checks.ts is built from this, so the DB enum and the TS union never drift.
export const QUESTION_TYPES = [
	"single_choice",
	"multiple_choice",
	"short_text",
	"number",
	"slider",
	"boolean",
	"dropdown",
	"email",
] as const;

export type QuestionTypeName = (typeof QUESTION_TYPES)[number];

export type AnswerValue = string | number | boolean | string[];

export interface CheckTheme {
	darkMode?: boolean;
	font?: string;
	logoUrl?: string;
	primaryColor?: string;
}

export interface QuestionOption {
	id: string;
	label: string;
	// points added per scoring category when this option is chosen
	scores?: Record<string, number>;
	value: string;
}

export interface QuestionConfig {
	max?: number;
	min?: number;
	multiple?: boolean;
	options?: QuestionOption[];
	placeholder?: string;
	step?: number;
}

export type ConditionOperator =
	| "equals"
	| "not_equals"
	| "greater_than"
	| "less_than"
	| "contains"
	| "empty";

export interface Condition {
	operator: ConditionOperator;
	questionId: string;
	value?: string | number | boolean;
}

export interface RuleGroup {
	conditions: Condition[];
	logic: "and" | "or";
}

// Question visibility and result hard-exclusion share the same condition shape.
export type VisibilityRule = RuleGroup;
export type ExclusionRule = RuleGroup;

// category name -> target score; engine ranks results by closeness
export type ScoreTargets = Record<string, number>;

export interface ResultCta {
	label: string;
	url: string;
}

// Immutable snapshots written into `submission` at submit time. Denormalized on
// purpose so a submission stays readable forever, even after the check (or a
// question/result) is edited or deleted.

export interface AnswerSnapshot {
	label: string;
	questionId: string;
	type: QuestionTypeName;
	value: AnswerValue;
}

export interface ResultSnapshot {
	body?: string;
	matchPct: number;
	resultId: string;
	title: string;
}
