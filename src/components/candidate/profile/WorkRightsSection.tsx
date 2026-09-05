import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { ProfileFormValues } from "@/app/(candidate)/profile/schema";

interface WorkRightsSectionProps {
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  disabled?: boolean;
}

const WORK_RIGHTS_OPTIONS = [
  "Australian Citizen",
  "Permanent Resident",
  "Temporary Skill Shortage Visa (Subclass 482)",
  "Skilled Independent Visa (Subclass 189)",
  "Student Visa (Work Permitted)",
  "Working Holiday Visa (Subclass 417/462)",
  "Other / Bridging Visa",
];

export function WorkRightsSection({
  register,
  errors,
  disabled,
}: WorkRightsSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 space-y-4">
      <div className="border-b border-border pb-3">
        <h2 className="text-base font-bold text-foreground">2. Work Rights</h2>
        <p className="text-xs text-muted-foreground">
          Australian employment eligibility and residency status.
        </p>
      </div>

      <div className="space-y-1.5 max-w-md">
        <label
          htmlFor="work_rights_status"
          className="block text-xs font-semibold uppercase tracking-wider text-foreground"
        >
          Work Rights Status
        </label>
        <select
          id="work_rights_status"
          disabled={disabled}
          className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            errors.work_rights_status ? "border-destructive" : "border-border"
          }`}
          {...register("work_rights_status")}
        >
          <option value="">Select Work Rights Status</option>
          {WORK_RIGHTS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {errors.work_rights_status && (
          <p className="text-xs font-medium text-destructive">
            {errors.work_rights_status.message}
          </p>
        )}
      </div>
    </div>
  );
}
