import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Case Filing — District Courts of India",
};

export default function NewFilingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {children}
    </div>
  );
}