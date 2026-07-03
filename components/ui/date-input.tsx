"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Drop-in replacement for native `<input type="date">`.
 *
 * Keeps the same `{ value: string; onChange(v: string): void }` contract
 * so every existing call-site works without changes.
 *
 * `value` / `onChange` use ISO date strings ("YYYY-MM-DD").
 */
export function DateInput({
  value,
  onChange,
  disabled,
  placeholder = "Pick a date",
}: DateInputProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Convert ISO string → Date for the calendar
  const selected = React.useMemo(() => {
    if (!value) return undefined;
    try {
      return parse(value, "yyyy-MM-dd", new Date());
    } catch {
      return undefined;
    }
  }, [value]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          !value && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        {selected ? format(selected, "dd MMM yyyy") : placeholder}
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, "yyyy-MM-dd"));
              } else {
                onChange("");
              }
              setOpen(false);
            }}
            defaultMonth={selected}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
