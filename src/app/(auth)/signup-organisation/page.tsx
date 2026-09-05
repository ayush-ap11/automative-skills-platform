"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Building2 } from "lucide-react";
import { FormField } from "@/components/shared/FormField";
import {
  signupOrganisationSchema,
  type SignupOrganisationInput,
} from "./schema";
import { createOrganisationAccount } from "./actions";

export default function SignupOrganisationPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupOrganisationInput>({
    resolver: zodResolver(signupOrganisationSchema),
    defaultValues: {
      org_name: "",
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
      privacy_consent: false as unknown as true,
    },
  });

  const privacyConsent = watch("privacy_consent");

  const onSubmit = (data: SignupOrganisationInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createOrganisationAccount(data);
      if (result?.error) {
        setServerError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-4" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Register Organisation</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Create an organisation portal and become its first administrator.
        </p>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <FormField
          label="Organisation Name"
          name="org_name"
          placeholder="e.g. Apex Automotive Academy"
          disabled={isPending}
          error={errors.org_name?.message}
          register={register("org_name")}
        />

        <FormField
          label="Admin Full Name"
          name="full_name"
          placeholder="e.g. Jane Doe"
          disabled={isPending}
          error={errors.full_name?.message}
          register={register("full_name")}
        />

        <FormField
          label="Admin Email"
          name="email"
          type="email"
          placeholder="admin@organisation.com.au"
          autoComplete="email"
          disabled={isPending}
          error={errors.email?.message}
          register={register("email")}
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isPending}
          error={errors.password?.message}
          register={register("password")}
        />

        <FormField
          label="Confirm Password"
          name="confirm_password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isPending}
          error={errors.confirm_password?.message}
          register={register("confirm_password")}
        />

        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-foreground">
            <input
              type="checkbox"
              disabled={isPending}
              className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              {...register("privacy_consent")}
            />
            <span>
              I accept the{" "}
              <Link href="/privacy-notice" className="font-semibold text-primary underline">
                Privacy Notice
              </Link>{" "}
              for automotive skills assessment governance and data handling.
            </span>
          </label>
          {errors.privacy_consent && (
            <p className="mt-1 text-xs font-medium text-destructive">
              {errors.privacy_consent.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || !privacyConsent}
          className="flex w-full cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Creating organisation...
            </>
          ) : (
            "Create Organisation"
          )}
        </button>
      </form>

      <div className="flex flex-col space-y-2 text-center text-xs text-muted-foreground">
        <div>
          <span>Already have an account? </span>
          <Link href="/login" className="cursor-pointer font-medium text-primary hover:underline">
            Log in
          </Link>
        </div>
        <div>
          <span>Registering as a candidate? </span>
          <Link href="/signup" className="cursor-pointer font-medium text-secondary hover:underline">
            Candidate registration
          </Link>
        </div>
      </div>
    </div>
  );
}
