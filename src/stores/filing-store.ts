import { create, type StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import type { FilingData, Complainant, Advocate, Accused, Cheque, Demand, Witness, DocUpload } from "@/src/types";
import { INITIAL, COMPLAINANT_TEMPLATE, ADVOCATE_TEMPLATE, ACCUSED_TEMPLATE, CHEQUE_TEMPLATE, DEMAND_TEMPLATE, WITNESS_TEMPLATE } from "@/src/data/initial-state";

const PERSIST_ENABLED = process.env.NEXT_PUBLIC_PERSIST_DRAFT === "true";

// ---------- Step definitions ----------

export interface StepDef {
  id: string;
  title: string;
  time: string;
  subs: { id: string; title: string }[];
}

export const STEPS: StepDef[] = [
  {
    id: "party",
    title: "Party details",
    time: "5m",
    subs: [
      { id: "complainant", title: "Complainant" },
      { id: "advocate", title: "Advocate (Complainant)" },
      { id: "accused", title: "Accused" },
    ],
  },
  {
    id: "case",
    title: "Case Details",
    time: "15m",
    subs: [
      { id: "cheque", title: "Cheque & Cheque return memo" },
      { id: "demand", title: "Demand notice & Nature of debt" },
      { id: "jurisdiction", title: "Jurisdiction & Limitation" },
      { id: "adr", title: "ADR, Other details, & Prayer" },
    ],
  },
  {
    id: "evidence",
    title: "Evidence",
    time: "5m",
    subs: [
      { id: "witnesses", title: "Witnesses" },
      { id: "documents", title: "Documents" },
    ],
  },
  { id: "affidavit", title: "Affidavit", time: "5m", subs: [{ id: "affidavit", title: "Affidavit" }] },
  { id: "preview", title: "Preview", time: "5m", subs: [] },
  { id: "sign", title: "Sign", time: "5m", subs: [] },
  { id: "pay", title: "Pay fees", time: "5m", subs: [] },
];

// ---------- State ----------

export interface FilingState {
  activeStep: string;
  activeSub: string | null;
  openSteps: Record<string, boolean>;
  done: Record<string, boolean>;
  data: FilingData;

  // Persisted after first save-draft
  filingId: string | null;
  filingNumber: string | null;
  draftSaving: boolean;
  draftError: string | null;
  submitting: boolean;
  submitError: string | null;
  submitted: boolean;

  goTo: (stepId: string, subId?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  toggleStep: (stepId: string) => void;

  setData: (patch: Partial<FilingData>) => void;
  updateComplainant: (id: string, patch: Partial<Complainant>) => void;
  addComplainant: () => void;
  removeComplainant: (id: string) => void;
  updateAdvocate: (id: string, patch: Partial<Advocate>) => void;
  addAdvocate: () => void;
  removeAdvocate: (id: string) => void;
  updateAccused: (id: string, patch: Partial<Accused>) => void;
  addAccused: () => void;
  removeAccused: (id: string) => void;
  updateCheque: (id: string, patch: Partial<Cheque>) => void;
  addCheque: () => void;
  removeCheque: (id: string) => void;
  updateDemand: (id: string, patch: Partial<Demand>) => void;
  addDemand: () => void;
  removeDemand: (id: string) => void;
  updateWitness: (id: string, patch: Partial<Witness>) => void;
  addWitness: () => void;
  removeWitness: (id: string) => void;
  updateDocUpload: (key: string, patch: Partial<DocUpload>) => void;
  addExtraCaseDoc: (name: string) => void;
  removeExtraCaseDoc: (index: number) => void;
  addExtraPartyDoc: (cId: string, name: string) => void;
  removeExtraPartyDoc: (cId: string, index: number) => void;
  resetToNew: () => void;
  loadDraft: (filingId: string, filingNumber: string, data: FilingData) => void;
  saveDraft: (tenantId: string, courtId: string) => Promise<void>;
  submitFiling: (tenantId: string, courtId: string) => Promise<void>;
}

const findStep = (id: string) => STEPS.find((s) => s.id === id);

type ApiIssue = { path?: Array<string | number>; message?: string };

function formatIssues(issues: ApiIssue[]) {
  const shown = issues.slice(0, 3).map((issue) => {
    const path = issue.path?.join(".");
    return path ? `${path}: ${issue.message ?? "Invalid value"}` : issue.message ?? "Invalid value";
  });
  const suffix = issues.length > 3 ? ` (+${issues.length - 3} more)` : "";
  return `${shown.join("; ")}${suffix}`;
}

async function getResponseError(res: Response) {
  try {
    const body = (await res.json()) as unknown;
    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      if (Array.isArray(record.errors)) {
        return `Validation failed: ${formatIssues(record.errors as ApiIssue[])}`;
      }
      if (typeof record.error === "string") return record.error;
    }
  } catch {
    // Fall back to HTTP status below.
  }
  return `HTTP ${res.status}`;
}

const impl: StateCreator<FilingState> = (set, get) => ({

  activeStep: "party",
  activeSub: "complainant",
  openSteps: { party: true },
  done: {},
  data: INITIAL,

  filingId: null,
  filingNumber: null,
  draftSaving: false,
  draftError: null,
  submitting: false,
  submitError: null,
  submitted: false,

  goTo: (stepId, subId) => {
    const step = findStep(stepId);
    set((state) => ({
      activeStep: stepId,
      activeSub: subId ?? step?.subs[0]?.id ?? null,
      openSteps: { ...state.openSteps, [stepId]: true },
    }));
  },

  nextStep: () => {
    const { activeStep, activeSub, done } = get();
    const doneKey = activeSub ? `${activeStep}/${activeSub}` : activeStep;
    set({ done: { ...done, [doneKey]: true } });

    const currentStep = findStep(activeStep);
    if (!currentStep) return;

    const subIdx = currentStep.subs.findIndex((s) => s.id === activeSub);
    if (currentStep.subs.length > 0 && subIdx >= 0 && subIdx < currentStep.subs.length - 1) {
      set({ activeSub: currentStep.subs[subIdx + 1].id });
    } else {
      const currentStepIdx = STEPS.findIndex((s) => s.id === activeStep);
      if (currentStepIdx >= 0 && currentStepIdx < STEPS.length - 1) {
        const ns = STEPS[currentStepIdx + 1];
        set((s) => ({
          activeStep: ns.id,
          activeSub: ns.subs[0]?.id ?? null,
          openSteps: { ...s.openSteps, [ns.id]: true },
        }));
      }
    }
  },

  prevStep: () => {
    const { activeStep, activeSub } = get();
    const currentStep = findStep(activeStep);
    if (!currentStep) return;

    const subIdx = currentStep.subs.findIndex((s) => s.id === activeSub);
    if (currentStep.subs.length > 0 && subIdx > 0) {
      set({ activeSub: currentStep.subs[subIdx - 1].id });
    } else {
      const currentStepIdx = STEPS.findIndex((s) => s.id === activeStep);
      if (currentStepIdx > 0) {
        const ps = STEPS[currentStepIdx - 1];
        set((s) => ({
          activeStep: ps.id,
          activeSub: ps.subs.length > 0 ? ps.subs[ps.subs.length - 1].id : null,
          openSteps: { ...s.openSteps, [ps.id]: true },
        }));
      }
    }
  },

  toggleStep: (stepId) =>
    set((state) => ({
      openSteps: { ...state.openSteps, [stepId]: !state.openSteps[stepId] },
    })),

  setData: (patch) => set((state) => ({ data: { ...state.data, ...patch } })),

  updateComplainant: (id, patch) =>
    set((state) => ({
      data: {
        ...state.data,
        complainants: {
          ...state.data.complainants,
          [id]: { ...state.data.complainants[id], ...patch },
        },
      },
    })),

  addComplainant: () =>
    set((state) => {
      const keys = Object.keys(state.data.complainants);
      const max = keys.reduce((m, k) => {
        const n = parseInt(k.replace("c", ""), 10);
        return n > m ? n : m;
      }, 0);
      const newId = `c${max + 1}`;
      return {
        data: {
          ...state.data,
          complainants: { ...state.data.complainants, [newId]: { ...COMPLAINANT_TEMPLATE } },
        },
      };
    }),

  removeComplainant: (id) =>
    set((state) => {
      const next = { ...state.data.complainants };
      delete next[id];
      return { data: { ...state.data, complainants: next } };
    }),

  updateAdvocate: (id, patch) =>
    set((state) => ({
      data: {
        ...state.data,
        advocates: {
          ...state.data.advocates,
          [id]: { ...state.data.advocates[id], ...patch },
        },
      },
    })),

  addAdvocate: () =>
    set((state) => {
      const keys = Object.keys(state.data.advocates);
      const max = keys.reduce((m, k) => {
        const n = parseInt(k.replace("av", ""), 10);
        return n > m ? n : m;
      }, 0);
      const newId = `av${max + 1}`;
      return {
        data: {
          ...state.data,
          advocates: { ...state.data.advocates, [newId]: { ...ADVOCATE_TEMPLATE } },
        },
      };
    }),

  removeAdvocate: (id) =>
    set((state) => {
      const next = { ...state.data.advocates };
      delete next[id];
      return { data: { ...state.data, advocates: next } };
    }),

  updateAccused: (id, patch) =>
    set((state) => ({
      data: {
        ...state.data,
        accused: {
          ...state.data.accused,
          [id]: { ...state.data.accused[id], ...patch },
        },
      },
    })),

  addAccused: () =>
    set((state) => {
      const keys = Object.keys(state.data.accused);
      const max = keys.reduce((m, k) => {
        const n = parseInt(k.replace("a", ""), 10);
        return n > m ? n : m;
      }, 0);
      const newId = `a${max + 1}`;
      return {
        data: {
          ...state.data,
          accused: { ...state.data.accused, [newId]: { ...ACCUSED_TEMPLATE } },
        },
      };
    }),

  removeAccused: (id) =>
    set((state) => {
      const next = { ...state.data.accused };
      delete next[id];
      return { data: { ...state.data, accused: next } };
    }),

  updateCheque: (id, patch) =>
    set((state) => ({
      data: {
        ...state.data,
        cheques: { ...state.data.cheques, [id]: { ...state.data.cheques[id], ...patch } },
      },
    })),

  addCheque: () =>
    set((state) => {
      const keys = Object.keys(state.data.cheques);
      const max = keys.reduce((m, k) => {
        const n = parseInt(k.replace("ch", ""), 10);
        return n > m ? n : m;
      }, 0);
      const newId = `ch${max + 1}`;
      return { data: { ...state.data, cheques: { ...state.data.cheques, [newId]: { ...CHEQUE_TEMPLATE } } } };
    }),

  removeCheque: (id) =>
    set((state) => {
      const next = { ...state.data.cheques };
      delete next[id];
      return { data: { ...state.data, cheques: next } };
    }),

  updateDemand: (id, patch) =>
    set((state) => ({
      data: {
        ...state.data,
        demands: { ...state.data.demands, [id]: { ...state.data.demands[id], ...patch } },
      },
    })),

  addDemand: () =>
    set((state) => {
      const keys = Object.keys(state.data.demands);
      const max = keys.reduce((m, k) => {
        const n = parseInt(k.replace("dn", ""), 10);
        return n > m ? n : m;
      }, 0);
      const newId = `dn${max + 1}`;
      return { data: { ...state.data, demands: { ...state.data.demands, [newId]: { ...DEMAND_TEMPLATE } } } };
    }),

  removeDemand: (id) =>
    set((state) => {
      const next = { ...state.data.demands };
      delete next[id];
      return { data: { ...state.data, demands: next } };
    }),

  updateWitness: (id, patch) =>
    set((state) => ({
      data: {
        ...state.data,
        witnesses: { ...(state.data.witnesses ?? {}), [id]: { ...(state.data.witnesses ?? {})[id], ...patch } },
      },
    })),

  addWitness: () =>
    set((state) => {
      const keys = Object.keys(state.data.witnesses ?? {});
      const max = keys.reduce((m, k) => {
        const n = parseInt(k.replace("w", ""), 10);
        return n > m ? n : m;
      }, 0);
      const newId = `w${max + 1}`;
      return { data: { ...state.data, witnesses: { ...(state.data.witnesses ?? {}), [newId]: { ...WITNESS_TEMPLATE } } } };
    }),

  removeWitness: (id) =>
    set((state) => {
      const next = { ...(state.data.witnesses ?? {}) };
      delete next[id];
      return { data: { ...state.data, witnesses: next } };
    }),

  updateDocUpload: (key, patch) =>
    set((state) => {
      const docs = state.data.docs ?? { uploads: {}, extraCase: [], extraParty: {} };
      return {
        data: {
          ...state.data,
          docs: {
            ...docs,
            uploads: {
              ...docs.uploads,
              [key]: Object.assign({ fileName: "", nativelyDigital: false }, docs.uploads[key], patch),
            },
          },
        },
      };
    }),

  addExtraCaseDoc: (name) =>
    set((state) => {
      const docs = state.data.docs ?? { uploads: {}, extraCase: [], extraParty: {} };
      return {
        data: {
          ...state.data,
          docs: {
            ...docs,
            extraCase: [...docs.extraCase, { name, fileName: "", nativelyDigital: false }],
          },
        },
      };
    }),

  removeExtraCaseDoc: (index) =>
    set((state) => {
      const docs = state.data.docs ?? { uploads: {}, extraCase: [], extraParty: {} };
      return {
        data: {
          ...state.data,
          docs: { ...docs, extraCase: docs.extraCase.filter((_, i) => i !== index) },
        },
      };
    }),

  addExtraPartyDoc: (cId, name) =>
    set((state) => {
      const docs = state.data.docs ?? { uploads: {}, extraCase: [], extraParty: {} };
      const prev = docs.extraParty[cId] ?? [];
      return {
        data: {
          ...state.data,
          docs: {
            ...docs,
            extraParty: { ...docs.extraParty, [cId]: [...prev, { name, fileName: "", nativelyDigital: false }] },
          },
        },
      };
    }),

  removeExtraPartyDoc: (cId, index) =>
    set((state) => {
      const docs = state.data.docs ?? { uploads: {}, extraCase: [], extraParty: {} };
      const prev = docs.extraParty[cId] ?? [];
      return {
        data: {
          ...state.data,
          docs: {
            ...docs,
            extraParty: { ...docs.extraParty, [cId]: prev.filter((_, i) => i !== index) },
          },
        },
      };
    }),

  resetToNew: () =>
    set({
      activeStep: "party",
      activeSub: "complainant",
      openSteps: { party: true },
      done: {},
      data: INITIAL,
      filingId: null,
      filingNumber: null,
      draftSaving: false,
      draftError: null,
      submitting: false,
      submitError: null,
      submitted: false,
    }),

  loadDraft: (filingId, filingNumber, data) =>
    set({
      filingId,
      filingNumber,
      data,
      activeStep: "party",
      activeSub: "complainant",
      openSteps: { party: true },
      done: {},
      draftSaving: false,
      draftError: null,
      submitting: false,
      submitError: null,
      submitted: false,
    }),

  saveDraft: async (tenantId, courtId) => {
    const { data, filingId } = get();
    set({ draftSaving: true, draftError: null });
    try {
      const res = await fetch("/api/filing/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filingId: filingId ?? undefined, tenantId, courtId, data }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { filingId: string; filingNumber: string };
      set({ filingId: json.filingId, filingNumber: json.filingNumber, draftSaving: false });
    } catch (err) {
      set({ draftSaving: false, draftError: err instanceof Error ? err.message : "Save failed" });
    }
  },

  submitFiling: async (tenantId, courtId) => {
    const { data, filingId } = get();
    if (!filingId) {
      set({ submitError: "Save a draft first before submitting." });
      return;
    }
    set({ submitting: true, submitError: null });
    try {
      const res = await fetch("/api/filing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filingId, tenantId, courtId, data }),
      });
      if (!res.ok) throw new Error(await getResponseError(res));
      const json = await res.json() as { filingId: string; filingNumber: string; status: string };
      set({ submitting: false, submitted: true, filingNumber: json.filingNumber });
    } catch (err) {
      set({ submitting: false, submitError: err instanceof Error ? err.message : "Submit failed" });
    }
  },
});

export const useFilingStore = PERSIST_ENABLED
  ? create<FilingState>()(
      persist(impl, {
        name: "pucar-filing-draft",
        version: 2,
      })
    )
  : create<FilingState>()(impl);
