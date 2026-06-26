import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { check, question, result } from "./checks";
import type { AnswerSnapshot, ResultSnapshot } from "./types";

export const eventType = pgEnum("event_type", [
	"view",
	"start",
	"complete",
	"drop",
]);

export const submission = pgTable(
	"submission",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		checkId: uuid("check_id")
			.notNull()
			.references(() => check.id, { onDelete: "cascade" }),
		// immutable snapshots taken at submission time (answers + chosen result)
		answers: jsonb("answers").$type<AnswerSnapshot[]>().notNull(),
		resultSnapshot: jsonb("result_snapshot").$type<ResultSnapshot>(),
		// keep the row even if the result is later deleted in the editor
		matchedResultId: uuid("matched_result_id").references(() => result.id, {
			onDelete: "set null",
		}),
		leadEmail: text("lead_email"),
		consentVersion: text("consent_version"),
		consentAt: timestamp("consent_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("submission_checkId_idx").on(table.checkId)]
);

export const event = pgTable(
	"event",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		checkId: uuid("check_id")
			.notNull()
			.references(() => check.id, { onDelete: "cascade" }),
		type: eventType("type").notNull(),
		// set on `drop` events to attribute drop-off to a specific question
		questionId: uuid("question_id").references(() => question.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("event_checkId_idx").on(table.checkId),
		index("event_type_idx").on(table.type),
	]
);

export const submissionRelations = relations(submission, ({ one }) => ({
	check: one(check, {
		fields: [submission.checkId],
		references: [check.id],
	}),
	matchedResult: one(result, {
		fields: [submission.matchedResultId],
		references: [result.id],
	}),
}));

export const eventRelations = relations(event, ({ one }) => ({
	check: one(check, {
		fields: [event.checkId],
		references: [check.id],
	}),
	question: one(question, {
		fields: [event.questionId],
		references: [question.id],
	}),
}));
