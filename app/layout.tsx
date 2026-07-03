import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/src/components/shell/theme-provider";
import { AppHeader } from "@/src/components/shell/app-header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Case Filing 2.0 — District Courts of India",
  description: "e-Filing wizard for District Courts of India",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = (await cookies()).get("theme")?.value === "dark" ? "dark" : "";
  return (
    <html
      lang="en"
      className={`${inter.variable} ${roboto.variable} h-full antialiased ${theme}`.trim()}
    >
      <body className="min-h-full flex flex-col font-body">
        <ThemeProvider>
          <AppHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
