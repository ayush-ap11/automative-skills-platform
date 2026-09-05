"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { FormField } from "@/components/shared/FormField";
import { loginSchema, type LoginInput } from "./schema";
import { loginAction } from "./actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const registeredSuccess = searchParams.get("registered") === "true";
  const defaultEmail = searchParams.get("email") || "";
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: "" },
  });

  const onSubmit = (data: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(data);
      if (result?.error) {
        setServerError(result.error);
        setValue("password", "");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Sign In</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter your credentials to access your assessment dashboard.
        </p>
      </div>

      {registeredSuccess && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-xs font-medium text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Account created successfully! Please log in with your password.</span>
        </div>
      )}

      {serverError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email Address" name="email" type="email" placeholder="name@workshop.com.au" autoComplete="email" disabled={isPending} error={errors.email?.message} register={register("email")} />
        <FormField label="Password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" disabled={isPending} error={errors.password?.message} register={register("password")} />

        <button type="submit" disabled={isPending} className="flex w-full cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? (<><Loader2 className="mr-2 size-4 animate-spin" />Logging in...</>) : ("Log In")}
        </button>
      </form>

      <div className="flex flex-col space-y-3 text-center text-xs text-muted-foreground">
        <p className="text-muted-foreground">
          Forgot your password? Contact your organisation admin to reset it.
        </p>
        <div>
          <span>New here? </span>
          <Link href="/signup" className="cursor-pointer font-medium text-secondary hover:underline">
            Create a candidate account
          </Link>
        </div>
        <div>
          <span>Starting a new organisation? </span>
          <Link href="/signup-organisation" className="cursor-pointer font-medium text-primary hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
