import { cn } from "@/lib/utils";

interface NativeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function NativeSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled,
  className,
}: NativeSelectProps) {
  return (
    <select
      className={cn(
        "h-9 w-full min-w-0 appearance-none rounded-lg border border-input bg-background px-3 pr-8 py-1.5 text-sm transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "text-foreground",
        !value && "text-muted-foreground",
        className
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        backgroundSize: "16px",
      }}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="text-foreground bg-background">
          {opt}
        </option>
      ))}
    </select>
  );
}
