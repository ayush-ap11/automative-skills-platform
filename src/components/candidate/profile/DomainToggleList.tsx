import { Switch } from "@/components/ui/switch";
import type { UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { ProfileFormValues } from "@/app/(candidate)/profile/schema";

type DomainToggleKey = keyof Pick<
  ProfileFormValues,
  | "ev_experience"
  | "hybrid_experience"
  | "heavy_vehicle_experience"
  | "light_vehicle_experience"
  | "automotive_electrical_experience"
>;

const TOGGLES: Array<{
  name: DomainToggleKey;
  label: string;
  description: string;
}> = [
  {
    name: "ev_experience",
    label: "Electric Vehicle (EV) Experience",
    description: "High voltage battery disconnects, isolations, and diagnostics.",
  },
  {
    name: "hybrid_experience",
    label: "Hybrid Vehicle Experience",
    description: "HEV/PHEV regenerative braking and inverter systems.",
  },
  {
    name: "heavy_vehicle_experience",
    label: "Heavy Commercial Vehicle Experience",
    description: "Trucks, buses, air brakes, and diesel powertrain systems.",
  },
  {
    name: "light_vehicle_experience",
    label: "Light Vehicle Experience",
    description: "Passenger cars, SUVs, steering, suspension, and petrol EFI.",
  },
  {
    name: "automotive_electrical_experience",
    label: "Automotive Electrical Experience",
    description: "CAN bus networks, body electronics, sensors, and wiring.",
  },
];

interface DomainToggleListProps {
  watch: UseFormWatch<ProfileFormValues>;
  setValue: UseFormSetValue<ProfileFormValues>;
  disabled?: boolean;
}

export function DomainToggleList({
  watch,
  setValue,
  disabled,
}: DomainToggleListProps) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-background">
      {TOGGLES.map((item) => {
        const checked = !!watch(item.name);
        return (
          <div
            key={item.name}
            className="flex items-center justify-between p-3 sm:p-4 gap-4"
          >
            <div>
              <span className="block text-sm font-semibold text-foreground">
                {item.label}
              </span>
              <span className="block text-xs text-muted-foreground">
                {item.description}
              </span>
            </div>
            <Switch
              checked={checked}
              disabled={disabled}
              onCheckedChange={(val) =>
                setValue(item.name, val, { shouldDirty: true })
              }
              className="cursor-pointer shrink-0"
            />
          </div>
        );
      })}
    </div>
  );
}
