import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PhoneInput({ value, onChange, className }: PhoneInputProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <span className="inline-flex items-center h-9 px-2.5 rounded-l-lg border border-r-0 border-input bg-muted text-sm text-muted-foreground dark:bg-input/30">
        +91
      </span>
      <div className="relative flex-1">
        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=""
          className="rounded-l-none pl-9"
        />
      </div>
    </div>
  );
}
