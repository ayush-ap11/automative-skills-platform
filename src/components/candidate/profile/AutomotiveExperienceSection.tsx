import type {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { FormField } from "@/components/shared/FormField";
import { TagInput } from "./TagInput";
import { DomainToggleList } from "./DomainToggleList";
import type { ProfileFormValues } from "@/app/(candidate)/profile/schema";

interface AutomotiveExperienceSectionProps {
  register: UseFormRegister<ProfileFormValues>;
  setValue: UseFormSetValue<ProfileFormValues>;
  watch: UseFormWatch<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  disabled?: boolean;
}

export function AutomotiveExperienceSection({
  register,
  setValue,
  watch,
  errors,
  disabled,
}: AutomotiveExperienceSectionProps) {
  const specialisations = watch("specialisations") || [];
  const vehicleCategories = watch("vehicle_categories") || [];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 space-y-5">
      <div className="border-b border-border pb-3">
        <h2 className="text-base font-bold text-foreground">
          3. Automotive Experience & Trade Domains
        </h2>
        <p className="text-xs text-muted-foreground">
          Detail your trade background, vehicle competencies, and
          specialisations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Years of Experience"
          name="years_experience"
          type="number"
          placeholder="e.g. 5"
          disabled={disabled}
          error={errors.years_experience?.message}
          register={register("years_experience")}
        />

        <FormField
          label="Current / Most Recent Role"
          name="current_role"
          placeholder="e.g. Senior Diagnostic Technician"
          disabled={disabled}
          error={errors.current_role?.message}
          register={register("current_role")}
        />
      </div>

      <div className="space-y-4 pt-1">
        <TagInput
          label="Specialisations"
          placeholder="e.g. ADAS Calibration, Engine Rebuilds, Automatic Transmissions"
          tags={specialisations}
          onChange={(newTags) =>
            setValue("specialisations", newTags, { shouldDirty: true })
          }
          disabled={disabled}
        />

        <TagInput
          label="Vehicle Categories"
          placeholder="e.g. Light Commercial, European Luxury, 4WD/Offroad, Motorcycles"
          tags={vehicleCategories}
          onChange={(newTags) =>
            setValue("vehicle_categories", newTags, { shouldDirty: true })
          }
          disabled={disabled}
        />
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Domain Competency Flags
        </h3>
        <DomainToggleList
          watch={watch}
          setValue={setValue}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
