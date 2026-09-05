"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { FormField } from "@/components/shared/FormField";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "./schema";
import { forgotPasswordAction } from "./actions";

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await forgotPasswordAction(data);
      if (result.error) {
        setServerError(result.error);
      } else {
        setIsSuccess(true);
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Check your email
          </h2>
          <p className="text-sm text-muted-foreground">
            If an account exists, a reset link has been sent to your email address.
            Follow the link in the message to set a new password.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex w-full cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
        >
          Return to Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Reset Password</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter your registered email address to receive a secure password reset link.
        </p>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Email Address"
          name="email"
          type="email"
          placeholder="name@example.com.au"
          autoComplete="email"
          disabled={isPending}
          error={errors.email?.message}
          register={register("email")}
        />

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        <Link
          href="/login"
          className="cursor-pointer font-medium text-primary hover:underline"
        >
          Remember your password? Log in
        </Link>
      </div>
    </div>
  );
}
