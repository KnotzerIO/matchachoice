CREATE TYPE "public"."check_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."lead_capture_position" AS ENUM('before', 'after');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('single_choice', 'multiple_choice', 'short_text', 'number', 'slider', 'boolean', 'dropdown', 'email');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('view', 'start', 'complete', 'drop');--> statement-breakpoint
CREATE TABLE "check" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "check_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"theme" jsonb,
	"show_runners_up" boolean DEFAULT false NOT NULL,
	"lead_capture_enabled" boolean DEFAULT false NOT NULL,
	"lead_capture_position" "lead_capture_position",
	"consent_version" text,
	"webhook_url" text,
	"webhook_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_id" uuid NOT NULL,
	"type" "question_type" NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"required" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"visibility" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"position" integer NOT NULL,
	"score_targets" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"exclusion" jsonb,
	"primary_cta" jsonb,
	"secondary_cta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_id" uuid NOT NULL,
	"type" "event_type" NOT NULL,
	"question_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_id" uuid NOT NULL,
	"answers" jsonb NOT NULL,
	"result_snapshot" jsonb,
	"matched_result_id" uuid,
	"lead_email" text,
	"consent_version" text,
	"consent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "check" ADD CONSTRAINT "check_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_check_id_check_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."check"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result" ADD CONSTRAINT "result_check_id_check_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."check"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_check_id_check_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."check"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_check_id_check_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."check"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_matched_result_id_result_id_fk" FOREIGN KEY ("matched_result_id") REFERENCES "public"."result"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "check_slug_idx" ON "check" USING btree ("slug") WHERE "check"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "check_ownerId_idx" ON "check" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "question_checkId_idx" ON "question" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "result_checkId_idx" ON "result" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "event_checkId_idx" ON "event" USING btree ("check_id");--> statement-breakpoint
CREATE INDEX "event_type_idx" ON "event" USING btree ("type");--> statement-breakpoint
CREATE INDEX "submission_checkId_idx" ON "submission" USING btree ("check_id");