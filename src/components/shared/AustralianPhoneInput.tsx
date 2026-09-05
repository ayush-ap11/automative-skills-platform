import type { UseFormRegisterReturn } from "react-hook-form";
import { formatAustralianPhone } from "@/lib/utils/phone";

interface AustralianPhoneInputProps {
  label?: string;
  name: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  register?: UseFormRegisterReturn;
}

export function AustralianPhoneInput({
  label = "Mobile Number",
  name,
  error,
  helperText,
  placeholder = "0400 000 000",
  disabled = false,
  autoComplete = "tel",
  register,
}: AustralianPhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAustralianPhone(e.target.value);
    e.target.value = formatted;
    if (register?.onChange) {
      register.onChange(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formatAustralianPhone(e.target.value);
    e.target.value = formatted;
    if (register?.onBlur) {
      register.onBlur(e);
    }
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-xs font-semibold uppercase tracking-wider text-foreground"
      >
        {label}
      </label>
      <div
        className={`flex rounded-md border bg-background shadow-xs transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
          error
            ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
            : "border-border"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <div className="flex items-center gap-1.5 border-r border-border bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground select-none shrink-0 rounded-l-md">
          <span className="text-sm leading-none" role="img" aria-label="Australia flag">
            🇦🇺
          </span>
          <span className="font-medium text-foreground">Australia</span>
          <span className="font-mono text-muted-foreground font-semibold">+61</span>
        </div>
        <input
          id={name}
          type="tel"
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={14}
          className="w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
          {...register}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </div>
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
