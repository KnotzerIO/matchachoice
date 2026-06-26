import { auth, ownerExists } from "@matchachoice/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (session?.user) {
		redirect("/dashboard");
	}

	// No owner yet → register; owner exists → login.
	redirect((await ownerExists()) ? "/login" : "/signup");
}
