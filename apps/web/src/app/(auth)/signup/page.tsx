import { auth, ownerExists } from "@matchachoice/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignUpForm from "@/components/sign-up-form";

export default async function SignupPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (session?.user) {
		redirect("/dashboard");
	}

	// Registration is a one-time event: once an owner exists, only login remains.
	if (await ownerExists()) {
		redirect("/login");
	}

	return <SignUpForm />;
}
