import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormField } from "@/components/shared/FormField";
import type { ProfileFormValues } from "@/app/(candidate)/profile/schema";

interface UsiSectionProps {
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  disabled?: boolean;
}

export function UsiSection({ register, errors, disabled }: UsiSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 space-y-4">
      <div className="border-b border-border pb-3">
        <h2 className="text-base font-bold text-foreground">
          4. Unique Student Identifier (USI)
        </h2>
        <p className="text-xs text-muted-foreground">
          Required by the Australian Government for national qualification issuance.
        </p>
      </div>

      <div className="max-w-md">
        <FormField
          label="Unique Student Identifier"
          name="usi"
          placeholder="e.g. 3AW88YH9U2"
          helperText="Don't have a USI? Get one free at usi.gov.au"
          disabled={disabled}
          error={errors.usi?.message}
          register={register("usi")}
        />
      </div>
    </div>
  );
}
