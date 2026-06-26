"use client";

import { Button } from "@matchachoice/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@matchachoice/ui/components/card";
import { Field, FieldDescription } from "@matchachoice/ui/components/field";
import { Input } from "@matchachoice/ui/components/input";
import { Label } from "@matchachoice/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";

export default function SignInForm() {
	const router = useRouter();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						router.push("/dashboard");
						toast.success("Sign in successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				}
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="flex h-full items-center justify-center p-6">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-xl">Sign in to MatchaChoice</CardTitle>
					<CardDescription>Welcome back.</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						className="space-y-4"
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<div>
							<form.Field name="email">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Email</Label>
										<Input
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											type="email"
											value={field.state.value}
										/>
										{field.state.meta.errors.map((error) => (
											<p className="text-red-500" key={error?.message}>
												{error?.message}
											</p>
										))}
									</div>
								)}
							</form.Field>
						</div>

						<div>
							<form.Field name="password">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Password</Label>
										<Input
											id={field.name}
											name={field.name}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											type="password"
											value={field.state.value}
										/>
										{field.state.meta.errors.map((error) => (
											<p className="text-red-500" key={error?.message}>
												{error?.message}
											</p>
										))}
									</div>
								)}
							</form.Field>
						</div>
						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<Field>
									<Button
										className="w-full"
										disabled={!canSubmit || isSubmitting}
										type="submit"
									>
										{isSubmitting ? "Submitting..." : "Sign In"}
									</Button>
									<FieldDescription className="text-center">
										Don&apos;t have an account? <a href="/signup">Sign up</a>
									</FieldDescription>
								</Field>
							)}
						</form.Subscribe>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
