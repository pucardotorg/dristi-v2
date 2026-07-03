import { Separator } from "@/components/ui/separator";

interface SubheadProps {
  children: string;
}

export function Subhead({ children }: SubheadProps) {
  return (
    <>
      <h3 className="subhead-title">{children}</h3>
      <Separator className="mb-4" />
    </>
  );
}
