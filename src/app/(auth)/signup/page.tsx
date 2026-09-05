"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { FormField } from "@/components/shared/FormField";
import { AustralianPhoneInput } from "@/components/shared/AustralianPhoneInput";
import {
  signupSchema,
  type SignupInput,
  AU_STATES,
  AU_STATE_NAMES,
} from "./schema";
import { signupAction } from "./actions";

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      preferred_name: "",
      email: "",
      mobile: "",
      state: "" as any,
      invite_code: "",
      usi: "",
      password: "",
      confirm_password: "",
      privacy_consent: false as unknown as true,
    },
  });

  const privacyConsent = watch("privacy_consent");

  const onSubmit = (data: SignupInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signupAction(data);
      if (result?.error) {
        setServerError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Candidate Registration</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Create your profile to start automotive skills recognition and assessment.
        </p>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <FormField label="Full Name" name="full_name" placeholder="John Citizen" disabled={isPending} error={errors.full_name?.message} register={register("full_name")} />
        <FormField label="Preferred Name (Optional)" name="preferred_name" placeholder="Johnny" disabled={isPending} error={errors.preferred_name?.message} register={register("preferred_name")} />
        <FormField label="Email Address" name="email" type="email" placeholder="john@example.com.au" autoComplete="email" disabled={isPending} error={errors.email?.message} register={register("email")} />

        <AustralianPhoneInput
          label="Mobile Number"
          name="mobile"
          placeholder="0400 000 000"
          disabled={isPending}
          error={errors.mobile?.message}
          register={register("mobile")}
        />

        <div className="space-y-1.5">
          <label htmlFor="state" className="block text-xs font-semibold uppercase tracking-wider text-foreground">
            State / Territory
          </label>
          <select
            id="state"
            disabled={isPending}
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.state ? "border-destructive" : "border-border"}`}
            {...register("state")}
          >
            <option value="">Select State / Territory</option>
            {AU_STATES.map((s) => (
              <option key={s} value={s}>
                {AU_STATE_NAMES[s]}
              </option>
            ))}
          </select>
          {errors.state && <p className="text-xs font-medium text-destructive">{errors.state.message}</p>}
        </div>

        <FormField
          label="Organisation Invite Code"
          name="invite_code"
          placeholder="e.g. 8f3a9c2e"
          helperText="Get this from the organisation you're registering with"
          disabled={isPending}
          error={errors.invite_code?.message}
          register={register("invite_code")}
        />

        <FormField label="USI (Optional)" name="usi" placeholder="10-digit code" helperText="Don't have a USI? Get one free at usi.gov.au — you can add it later" disabled={isPending} error={errors.usi?.message} register={register("usi")} />
        <FormField label="Password" name="password" type="password" placeholder="••••••••" autoComplete="new-password" disabled={isPending} error={errors.password?.message} register={register("password")} />
        <FormField label="Confirm Password" name="confirm_password" type="password" placeholder="••••••••" autoComplete="new-password" disabled={isPending} error={errors.confirm_password?.message} register={register("confirm_password")} />

        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-foreground">
            <input type="checkbox" disabled={isPending} className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary cursor-pointer" {...register("privacy_consent")} />
            <span>I have read and accept the <Link href="/privacy-notice" className="font-semibold text-primary underline">Privacy Notice</Link> for skills assessment data handling.</span>
          </label>
          {errors.privacy_consent && <p className="mt-1 text-xs font-medium text-destructive">{errors.privacy_consent.message}</p>}
        </div>

        <button type="submit" disabled={isPending || !privacyConsent} className="flex w-full cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? (<><Loader2 className="mr-2 size-4 animate-spin" />Creating account...</>) : ("Create account")}
        </button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        <span>Already have an account? </span>
        <Link href="/login" className="cursor-pointer font-medium text-primary hover:underline">Log in</Link>
      </div>
    </div>
  );
}
