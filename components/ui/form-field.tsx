"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

interface FormFieldProps {
  label?: ReactNode;
  required?: boolean;
  optional?: boolean;
  info?: boolean;
  hint?: string;
  error?: string;
  ok?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  optional,
  info,
  hint,
  error,
  ok,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-1.5 sm:grid-cols-[200px_1fr] sm:gap-x-6 md:grid-cols-[280px_1fr] items-start", className)}>
      {label !== undefined ? (
        <Label className="sm:pt-2 text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">
          <span>{label}</span>
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {optional && (
            <span className="text-slate-400 dark:text-slate-500 ml-1 font-normal text-xs">
              (optional)
            </span>
          )}
          {info && (
            <Info className="inline w-3.5 h-3.5 ml-1 align-middle text-slate-400 hover:text-blue-600 cursor-help" />
          )}
        </Label>
      ) : (
        <span />
      )}
      <div className="min-w-0">
        {children}
        {error && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
        {ok && !error && (
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{ok}</p>
        )}
        {hint && !error && !ok && (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
        )}
      </div>
    </div>
  );
}
