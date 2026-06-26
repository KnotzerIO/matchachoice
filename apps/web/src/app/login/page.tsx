import { auth, ownerExists } from "@matchachoice/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SignInForm from "@/components/sign-in-form";

export default async function LoginPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (session?.user) {
		redirect("/dashboard");
	}

	// Fresh instance with no owner yet: funnel to registration.
	if (!(await ownerExists())) {
		redirect("/signup");
	}

	return <SignInForm />;
}
