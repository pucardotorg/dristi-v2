"use client";

import { useMemo, useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/src/components/shell/sidebar";
import { useFilingStore, STEPS } from "@/src/stores/filing-store";
import { ComplainantPage } from "@/src/components/pages/party/complainant";
import { AdvocatePage } from "@/src/components/pages/party/advocate";
import { AccusedPage } from "@/src/components/pages/party/accused";
import { ChequePage } from "@/src/components/pages/case/cheque";
import { DemandPage } from "@/src/components/pages/case/demand";
import { JurisdictionPage } from "@/src/components/pages/case/jurisdiction";
import { ADRPage } from "@/src/components/pages/case/adr";
import { AffidavitPage } from "@/src/components/pages/affidavit/affidavit";
import { PreviewPage } from "@/src/components/pages/preview/preview";
import { SignPage } from "@/src/components/pages/sign/sign";
import { WitnessesPage } from "@/src/components/pages/evidence/witnesses";
import { DocumentsPage } from "@/src/components/pages/evidence/documents";
import { PayPage } from "@/src/components/pages/pay/pay";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { FilingData } from "@/src/types";

function NewFilingPageInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [draftLoadError, setDraftLoadError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  useEffect(() => {
    function onToggle() { setSidebarOpen((v) => !v); }
    window.addEventListener("toggle-sidebar", onToggle);
    return () => window.removeEventListener("toggle-sidebar", onToggle);
  }, []);

  useEffect(() => {
    if (!draftId) return;
    setLoadingDraft(true);
    setDraftLoadError(null);
    fetch(`/api/cases/${draftId}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Draft not found." : "Failed to load draft.");
        return r.json() as Promise<{ filingId: string; filingNumber: string; data: FilingData }>;
      })
      .then(({ filingId, filingNumber, data }) => {
        loadDraft(filingId, filingNumber, data);
      })
      .catch((e: Error) => setDraftLoadError(e.message))
      .finally(() => setLoadingDraft(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  const activeStep = useFilingStore((s) => s.activeStep);
  const activeSub = useFilingStore((s) => s.activeSub);
  const openSteps = useFilingStore((s) => s.openSteps);
  const done = useFilingStore((s) => s.done);
  const goTo = useFilingStore((s) => s.goTo);
  const nextStep = useFilingStore((s) => s.nextStep);
  const prevStep = useFilingStore((s) => s.prevStep);
  const toggleStep = useFilingStore((s) => s.toggleStep);
  const saveDraft = useFilingStore((s) => s.saveDraft);
  const submitFiling = useFilingStore((s) => s.submitFiling);
  const loadDraft = useFilingStore((s) => s.loadDraft);
  const draftSaving = useFilingStore((s) => s.draftSaving);
  const draftError = useFilingStore((s) => s.draftError);
  const filingNumber = useFilingStore((s) => s.filingNumber);
  const submitting = useFilingStore((s) => s.submitting);
  const submitError = useFilingStore((s) => s.submitError);
  const submitted = useFilingStore((s) => s.submitted);

  const complainantValidatorRef = useRef<(() => boolean) | null>(null);

  const handleNext = () => {
    if (activeStep === "party" && activeSub === "complainant") {
      if (!complainantValidatorRef.current || !complainantValidatorRef.current()) return;
    }
    nextStep();
  };

  const handleSubmit = () => {
    submitFiling(TENANT_ID, COURT_ID);
  };

  const { data: session } = useSession();
  const TENANT_ID = (session?.user as { tenant_id?: string } | null)?.tenant_id ?? "kl";
  const COURT_ID = (session?.user as { court_id?: string } | null)?.court_id ?? "default-court";

  const sidebarSteps = useMemo(
    () =>
      STEPS.map((s) => ({
        ...s,
        subs: s.subs.map((sub) => ({
          ...sub,
          done: !!done[`${s.id}/${sub.id}`],
        })),
      })),
    [done]
  );

  const currentStep = useMemo(
    () => STEPS.find((s) => s.id === activeStep),
    [activeStep]
  );

  if (loadingDraft) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-0 text-sm text-slate-500">
        Loading draft…
      </div>
    );
  }

  // Step router
  let body: React.ReactNode = null;
  if (activeStep === "party" && activeSub === "complainant") {
    body = <ComplainantPage registerValidator={(fn) => { complainantValidatorRef.current = fn; }} />;
  } else if (activeStep === "party" && activeSub === "advocate") {
    body = <AdvocatePage />;
  } else if (activeStep === "party" && activeSub === "accused") {
    body = <AccusedPage />;
  } else if (activeStep === "case" && activeSub === "cheque") {
    body = <ChequePage />;
  } else if (activeStep === "case" && activeSub === "demand") {
    body = <DemandPage />;
  } else if (activeStep === "case" && activeSub === "jurisdiction") {
    body = <JurisdictionPage />;
  } else if (activeStep === "case" && activeSub === "adr") {
    body = <ADRPage />;
  } else if (activeStep === "evidence" && activeSub === "witnesses") {
    body = <WitnessesPage />;
  } else if (activeStep === "evidence" && activeSub === "documents") {
    body = <DocumentsPage />;
  } else if (activeStep === "affidavit" && activeSub === "affidavit") {
    body = <AffidavitPage />;
  } else if (activeStep === "preview") {
    body = <PreviewPage />;
  } else if (activeStep === "sign") {
    body = <SignPage />;
  } else if (activeStep === "pay") {
    body = <PayPage />;
  } else {
    body = (
      <div className="text-sm text-slate-500">
        Content coming soon.
      </div>
    );
  }

  const currentStepIdx = STEPS.findIndex((s) => s.id === activeStep);
  const currentSubIdx =
    currentStep?.subs.findIndex((s) => s.id === activeSub) ?? -1;
  const isFirstStep = currentStepIdx === 0 && currentSubIdx <= 0;
  const isLastStep =
    activeStep === "pay" &&
    (!currentStep || currentSubIdx === currentStep.subs.length - 1);

  return (
    <>
      {/* Body: sidebar + main */}
      <div className="flex flex-1 min-h-0">
        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-[39] max-[767px]:block hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className={`sticky top-0 h-screen overflow-y-auto flex-shrink-0 max-[767px]:fixed max-[767px]:top-0 max-[767px]:left-0 max-[767px]:bottom-0 max-[767px]:h-dvh max-[767px]:z-40 max-[767px]:transition-transform max-[767px]:duration-200 ${sidebarOpen ? "max-[767px]:translate-x-0" : "max-[767px]:-translate-x-full"}`}>
        <Sidebar
          steps={sidebarSteps}
          activeStepId={activeStep}
          activeSubId={activeSub}
          openSteps={openSteps}
          done={done}
          onToggle={toggleStep}
          onPick={(stepId, subId) => { goTo(stepId, subId); setSidebarOpen(false); }}
          onHome={() => (window.location.href = "/")}
        />
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col bg-white dark:bg-slate-950 min-w-0">
          <div className="flex-1 overflow-auto px-12 py-8 max-[767px]:px-6 max-[639px]:px-4 max-[639px]:py-5">
            {body}
          </div>

          {/* Sticky bottom bar */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-12 py-4 flex justify-end items-center gap-3 z-20 max-[767px]:px-6 max-[639px]:px-4">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={isFirstStep}
              className="h-11 px-3 gap-2 text-slate-500 dark:text-slate-400 hover:text-teal hover:bg-teal-soft dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => saveDraft(TENANT_ID, COURT_ID)}
              disabled={draftSaving}
              className="h-11 px-6 text-teal border-teal hover:bg-teal-soft hover:text-teal"
            >
              {draftSaving ? "Saving…" : "Save as Draft"}
            </Button>
            {draftError && (
              <span className="text-xs text-red-500">{draftError}</span>
            )}
            {submitError && (
              <span className="text-xs text-red-500">{submitError}</span>
            )}
            {draftLoadError && (
              <span className="text-xs text-red-500">{draftLoadError}</span>
            )}
            {filingNumber && !draftSaving && !submitted && (
              <span className="text-xs text-slate-400">Saved: {filingNumber}</span>
            )}
            {submitted ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">✅ Submitted to Court</span>
                <span className="text-slate-400">{filingNumber}</span>
              </div>
            ) : isLastStep ? (
              <div className="flex flex-col items-end gap-1">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !filingNumber}
                  className="h-11 px-6 gap-2 bg-teal text-white border-teal hover:bg-teal-dark"
                >
                  {submitting ? "Submitting…" : "Submit to Court"}
                </Button>
                {!filingNumber && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Save as Draft first to enable submission
                  </span>
                )}
              </div>
            ) : (
              <Button
                onClick={handleNext}
                className="h-11 px-6 gap-2 bg-teal text-white border-teal hover:bg-teal-dark"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default function NewFilingPage() {
  return (
    <Suspense>
      <NewFilingPageInner />
    </Suspense>
  );
}