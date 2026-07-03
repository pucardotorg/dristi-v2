"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface InlineRadiosProps {
  value?: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}

export function InlineRadios({ value, onChange, options }: InlineRadiosProps) {
  return (
    <RadioGroup value={value ?? ""} onValueChange={onChange} className="flex gap-4">
      {options.map((opt) => (
        <div key={opt.value} className="flex items-center gap-2">
          <RadioGroupItem value={opt.value} />
          <Label className="font-normal cursor-pointer">{opt.label}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}
