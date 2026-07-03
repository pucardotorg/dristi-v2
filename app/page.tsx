import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDraftCases, getFiledCases, getCaseStats } from "@/lib/cases-query";
import { HeroSection } from "@/src/components/home/hero";
import { DraftsSection } from "@/src/components/home/drafts-section";
import { CaseTypesSection } from "@/src/components/home/case-types-section";
import { FiledSection } from "@/src/components/home/filed-section";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const userId = session?.user.id;

  const [drafts, filed, stats] = userId
    ? await Promise.all([
        getDraftCases(userId, 10),
        getFiledCases(userId, 20),
        getCaseStats(userId),
      ])
    : [[], [], { draftCount: 0, filedCount: 0 }];

  return (
    <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
      <HeroSection stats={stats} />
      <DraftsSection drafts={drafts} />
      <CaseTypesSection />
      <FiledSection filed={filed} />
    </main>
  );
}
