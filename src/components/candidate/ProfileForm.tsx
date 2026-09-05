"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/app/(candidate)/profile/schema";
import { updateProfile } from "@/app/(candidate)/profile/actions";
import { PersonalDetailsSection } from "./profile/PersonalDetailsSection";
import { WorkRightsSection } from "./profile/WorkRightsSection";
import { AutomotiveExperienceSection } from "./profile/AutomotiveExperienceSection";
import { UsiSection } from "./profile/UsiSection";

interface ProfileFormProps {
  initialData: ProfileFormValues;
  initialCompletionPct?: number;
}

export function ProfileForm({
  initialData,
  initialCompletionPct = 0,
}: ProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [completionPct, setCompletionPct] = useState(initialCompletionPct);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema as any) as any,
    defaultValues: initialData,
  });

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const onSubmit = (data: ProfileFormValues) => {
    setServerError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await updateProfile(data);
      if (result?.error) {
        setServerError(result.error);
      } else if (result?.success) {
        setSuccessMessage("Profile updated successfully.");
        if (typeof result.completion_pct === "number") {
          setCompletionPct(result.completion_pct);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Profile Completion
          </span>
          <p className="text-sm font-semibold text-foreground">
            Complete all sections to unlock full assessment eligibility.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
          {completionPct}%
        </span>
      </div>

      <PersonalDetailsSection
        register={register}
        errors={errors}
        disabled={isPending}
      />

      <WorkRightsSection
        register={register}
        errors={errors}
        disabled={isPending}
      />

      <AutomotiveExperienceSection
        register={register}
        setValue={setValue}
        watch={watch}
        errors={errors}
        disabled={isPending}
      />

      <UsiSection register={register} errors={errors} disabled={isPending} />

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3.5 text-xs font-semibold text-success transition-opacity duration-300">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {serverError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
