import type { UseFormRegisterReturn } from "react-hook-form";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  register?: UseFormRegisterReturn;
}

export function FormField({
  label,
  name,
  type = "text",
  error,
  helperText,
  placeholder,
  disabled,
  autoComplete,
  register,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-xs font-semibold uppercase tracking-wider text-foreground"
      >
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
            : "border-border"
        }`}
        {...register}
      />
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
