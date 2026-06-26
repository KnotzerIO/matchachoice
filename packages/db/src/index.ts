// biome-ignore-all lint/performance/noNamespaceImport: Drizzle's relational query builder needs the complete schema (every table + relation) in one object. Aggregating the per-file namespaces is the idiomatic Drizzle pattern; this is a server-only module, so there is no bundle/tree-shaking impact.

import { env } from "@matchachoice/env/server";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

import * as authSchema from "./schema/auth";
import * as checksSchema from "./schema/checks";
import * as submissionsSchema from "./schema/submissions";

const schema = { ...authSchema, ...checksSchema, ...submissionsSchema };

export type Database = NodePgDatabase<typeof schema>;

export function createDb(): Database {
	return drizzle(env.DATABASE_URL, { schema });
}

export const db: Database = createDb();
