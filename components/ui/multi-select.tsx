"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  allLabel?: string;
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  allLabel = "All",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = value ?? [];
  const allSelected = options.length > 0 && options.every((o) => selected.includes(o.value));

  const toggleAll = () => {
    onChange(allSelected ? [] : options.map((o) => o.value));
  };

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  };

  const label =
    selected.length === 0 || allSelected
      ? allLabel
      : options
          .filter((o) => selected.includes(o.value))
          .map((o) => o.label)
          .join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between h-9 px-3 font-normal"
          >
            <span className="truncate">{label || placeholder}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2 shrink-0 opacity-50"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </Button>
        }
      />
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="max-h-64 overflow-y-auto py-1">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
          >
            <span className="w-4 h-4 mr-2 inline-flex items-center justify-center rounded-sm border border-slate-300 dark:border-slate-600">
              {allSelected && <Check className="w-3 h-3" />}
            </span>
            {allLabel}
          </button>
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
              >
                <span className="w-4 h-4 mr-2 inline-flex items-center justify-center rounded-sm border border-slate-300 dark:border-slate-600">
                  {checked && <Check className="w-3 h-3" />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
