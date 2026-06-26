import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import {
	type CheckTheme,
	type ExclusionRule,
	QUESTION_TYPES,
	type QuestionConfig,
	type ResultCta,
	type ScoreTargets,
	type VisibilityRule,
} from "./types";

export const checkStatus = pgEnum("check_status", ["draft", "published"]);

export const leadCapturePosition = pgEnum("lead_capture_position", [
	"before",
	"after",
]);

export const questionType = pgEnum("question_type", QUESTION_TYPES);

export const check = pgTable(
	"check",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		ownerId: text("owner_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		status: checkStatus("status").default("draft").notNull(),
		publishedAt: timestamp("published_at"),
		// scoring categories defined per check, e.g. ["risk", "budget_fit"]
		categories: jsonb("categories").$type<string[]>().default([]).notNull(),
		theme: jsonb("theme").$type<CheckTheme>(),
		showRunnersUp: boolean("show_runners_up").default(false).notNull(),
		leadCaptureEnabled: boolean("lead_capture_enabled")
			.default(false)
			.notNull(),
		leadCapturePosition: leadCapturePosition("lead_capture_position"),
		consentVersion: text("consent_version"),
		// one webhook per check, fired on submission with an HMAC signature
		webhookUrl: text("webhook_url"),
		webhookSecret: text("webhook_secret"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		// soft delete: hides the check but keeps its submissions readable
		deletedAt: timestamp("deleted_at"),
	},
	(table) => [
		// slug is unique among live checks only, so it can be reused after delete
		uniqueIndex("check_slug_idx")
			.on(table.slug)
			.where(sql`${table.deletedAt} IS NULL`),
		index("check_ownerId_idx").on(table.ownerId),
	]
);

export const question = pgTable(
	"question",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		checkId: uuid("check_id")
			.notNull()
			.references(() => check.id, { onDelete: "cascade" }),
		type: questionType("type").notNull(),
		label: text("label").notNull(),
		description: text("description"),
		required: boolean("required").default(false).notNull(),
		position: integer("position").notNull(),
		// options (+ per-option scoring), slider min/max/step, placeholder, etc.
		config: jsonb("config").$type<QuestionConfig>().default({}).notNull(),
		// show this question only when the condition group is satisfied
		visibility: jsonb("visibility").$type<VisibilityRule>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("question_checkId_idx").on(table.checkId)]
);

export const result = pgTable(
	"result",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		checkId: uuid("check_id")
			.notNull()
			.references(() => check.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		// body supports {{variable}} substitution from answers
		body: text("body"),
		position: integer("position").notNull(),
		// target score per category; engine ranks results by closeness
		scoreTargets: jsonb("score_targets")
			.$type<ScoreTargets>()
			.default({})
			.notNull(),
		// hard exclusion: disqualify this result when the group is satisfied
		exclusion: jsonb("exclusion").$type<ExclusionRule>(),
		primaryCta: jsonb("primary_cta").$type<ResultCta>(),
		secondaryCta: jsonb("secondary_cta").$type<ResultCta>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("result_checkId_idx").on(table.checkId)]
);

export const checkRelations = relations(check, ({ one, many }) => ({
	owner: one(user, {
		fields: [check.ownerId],
		references: [user.id],
	}),
	questions: many(question),
	results: many(result),
}));

export const questionRelations = relations(question, ({ one }) => ({
	check: one(check, {
		fields: [question.checkId],
		references: [check.id],
	}),
}));

export const resultRelations = relations(result, ({ one }) => ({
	check: one(check, {
		fields: [result.checkId],
		references: [check.id],
	}),
}));
