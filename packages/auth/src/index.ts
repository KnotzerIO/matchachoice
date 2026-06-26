import { createDb, db } from "@matchachoice/db";
// biome-ignore lint/performance/noNamespaceImport: Better Auth's drizzleAdapter needs the full set of auth tables as one object; the namespace import is the idiomatic way to hand them over.
import * as schema from "@matchachoice/db/schema/auth";
import { env } from "@matchachoice/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

/**
 * MatchaChoice is single-user: the first person to register becomes the owner.
 * Returns true once any user exists, which permanently closes registration.
 */
export async function ownerExists(): Promise<boolean> {
	return (await db.$count(schema.user)) > 0;
}

export function createAuth() {
	const authDb = createDb();

	return betterAuth({
		database: drizzleAdapter(authDb, {
			provider: "pg",

			schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
		},
		databaseHooks: {
			user: {
				create: {
					// Enforce single-owner at the data layer so no endpoint can
					// create a second account, regardless of UI guards.
					before: async (newUser) => {
						if (await ownerExists()) {
							throw new APIError("FORBIDDEN", {
								message:
									"Registration is closed. This instance already has an owner.",
							});
						}
						return { data: newUser };
					},
				},
			},
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		plugins: [nextCookies()],
	});
}

export const auth = createAuth();
