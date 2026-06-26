import { createDb } from "@matchachoice/db";
// biome-ignore lint/performance/noNamespaceImport: Better Auth's drizzleAdapter needs the full set of auth tables as one object; the namespace import is the idiomatic way to hand them over.
import * as schema from "@matchachoice/db/schema/auth";
import { env } from "@matchachoice/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

export function createAuth() {
	const db = createDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",

			schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		plugins: [nextCookies()],
	});
}

export const auth = createAuth();
