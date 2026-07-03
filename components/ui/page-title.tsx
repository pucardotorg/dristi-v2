import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  children?: ReactNode;
}

export function PageTitle({ title, children }: PageTitleProps) {
  return (
    <div className="page-title-wrap">
      <div className="page-title-inner">
        <h1 className="page-title-text">{title}</h1>
        {children}
      </div>
      <Separator className="mt-3" />
    </div>
  );
}
