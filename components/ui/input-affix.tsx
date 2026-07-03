import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface InputAffixProps extends React.ComponentProps<typeof Input> {
  startAdornment?: ReactNode;
}

export function InputAffix({ startAdornment, className, ...props }: InputAffixProps) {
  return (
    <div className="relative">
      {startAdornment && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 dark:text-slate-400">
          {startAdornment}
        </span>
      )}
      <Input className={cn(startAdornment && "pl-8", className)} {...props} />
    </div>
  );
}
