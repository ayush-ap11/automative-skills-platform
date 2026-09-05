import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormField } from "@/components/shared/FormField";
import { AU_STATES } from "@/app/(auth)/signup/schema";
import type { ProfileFormValues } from "@/app/(candidate)/profile/schema";

interface PersonalDetailsSectionProps {
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  disabled?: boolean;
}

export function PersonalDetailsSection({
  register,
  errors,
  disabled,
}: PersonalDetailsSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 space-y-4">
      <div className="border-b border-border pb-3">
        <h2 className="text-base font-bold text-foreground">1. Personal Details</h2>
        <p className="text-xs text-muted-foreground">
          Your primary identity and residential contact information.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Full Name"
          name="full_name"
          placeholder="First & Last Name"
          disabled={disabled}
          error={errors.full_name?.message}
          register={register("full_name")}
        />

        <FormField
          label="Preferred Name (Optional)"
          name="preferred_name"
          placeholder="Nickname or preferred name"
          disabled={disabled}
          error={errors.preferred_name?.message}
          register={register("preferred_name")}
        />

        <FormField
          label="Email Address (Read-only)"
          name="email"
          type="email"
          disabled={true}
          error={errors.email?.message}
          register={register("email")}
        />

        <FormField
          label="Mobile Number"
          name="mobile"
          type="tel"
          placeholder="0400 000 000"
          disabled={disabled}
          error={errors.mobile?.message}
          register={register("mobile")}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="state"
            className="block text-xs font-semibold uppercase tracking-wider text-foreground"
          >
            State / Territory
          </label>
          <select
            id="state"
            disabled={disabled}
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.state ? "border-destructive" : "border-border"
            }`}
            {...register("state")}
          >
            {AU_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.state && (
            <p className="text-xs font-medium text-destructive">
              {errors.state.message}
            </p>
          )}
        </div>

        <FormField
          label="Location / Suburb"
          name="location"
          placeholder="e.g. Parramatta, Sydney"
          disabled={disabled}
          error={errors.location?.message}
          register={register("location")}
        />
      </div>
    </div>
  );
}
