"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { FormField } from "@/components/shared/FormField";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "./schema";
import { resetPasswordAction } from "./actions";

export default function ResetPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(data);
      if (result?.error) {
        setServerError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Set New Password</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter and confirm your new password below.
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
          label="New Password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isPending}
          error={errors.password?.message}
          register={register("password")}
        />

        <FormField
          label="Confirm New Password"
          name="confirm_password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isPending}
          error={errors.confirm_password?.message}
          register={register("confirm_password")}
        />

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update password"
          )}
        </button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        <Link
          href="/login"
          className="cursor-pointer font-medium text-primary hover:underline"
        >
          Back to Log In
        </Link>
      </div>
    </div>
  );
}
