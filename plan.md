# Plan — Case Filing 2.0 Rebuild

## Overview

Rebuild case-filing prototype from `D:\kamba\deltaxy\pucar\drishti2-handoff\drishti2\project` as a production Next.js 16 + React 19 + Tailwind 4 + shadcn/ui + TypeScript app.

**URL:** `/cases/new` — self-documenting REST-style path. Future: `/cases/:id`.

---

## ✅ Completed

### Scaffold
- [x] shadcn/ui init with deps (`clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`, `@base-ui/react`, `class-variance-authority`)
- [x] `components.json`, `components/ui/button.tsx`, `lib/utils.ts` with `cn()`
- [x] pnpm dev compiles

### Design Tokens & Fonts
- [x] `app/globals.css` — prototype colors (teal, orange, green-dot, info-bg, etc.) coexisting with shadcn neutral vars
- [x] `app/layout.tsx` — Inter + Roboto via `next/font/google`, `--font-inter` and `--font-roboto` CSS variables
- [x] Sidebar-specific CSS classes in `globals.css` (prototype-matched: `.sidebar`, `.step`, `.substep-dot`, etc.)

### Step Definitions
- [x] `src/data/steps.ts` — 7 steps with subs, Evidence has `Witnesses` + `Documents`

### Sidebar
- [x] `src/components/shell/sidebar.tsx` — accordion stepper with back-link, info-toast, 7 steps, sub-step dots (default/active-orange/done-green), checkmarks via lucide-react

### Route Shell
- [x] `app/cases/new/layout.tsx` — minimal flex-column wrapper for AppHeader + body
- [x] `app/cases/new/page.tsx` — renders AppHeader + Sidebar + main content + sticky bottom bar with state wiring (activeStep, activeSub, openSteps, done, navigation callbacks). Placeholder body text.
- [x] Home page at `/` keeps Next.js default stub — **HomeScreen deferred to later**

### Assets
- [x] `public/assets/govt-emblem.png` copied from handoff

---

## ⬜ Not Done — Next Up

### Phase 1: Form Primitives (`src/components/form/`)

| # | Component | File | Props | Used In |
|---|-----------|------|-------|---------|
| 1.1 | `PageTitle` | `page-title.tsx` | `title`, `children?` (right slot) | All 12 pages |
| 1.2 | `NumStepper` | `num-stepper.tsx` | `label`, `value`, `onChange`, `info?` | Complainant, Accused, Cheque |
| 1.3 | `FormRow` | `form-row.tsx` | `label?`, `required?`, `optional?`, `info?`, `hint?`, `error?`, `ok?`, `alignTop?`, `children` | All 12 pages |
| 1.4 | `Input` | `input.tsx` | `value`, `onChange`, `placeholder?`, `icon?`, `disabled?`, `type?` | All pages |
| 1.5 | `Select` | `select.tsx` | `value`, `onChange`, `options: string[]`, `placeholder?` | See lookups |
| 1.6 | `DateInput` | `date-input.tsx` | `value`, `onChange`, `placeholder?` | Cheque, Demand, Jurisdiction |
| 1.7 | `Textarea` | `textarea.tsx` | `value`, `onChange`, `placeholder?`, `rows?` | Jurisdiction (delay reason) |
| 1.8 | `Radios` | `radios.tsx` | `value`, `onChange`, `options: {value,label}[]` | Party-in-Person, Delivered, etc. |
| 1.9 | `PhoneInput` | `phone-input.tsx` | `value`, `onChange`, `ok?`, `error?` | Complainant, Advocate, Accused |
| 1.10 | `Tabs` | `tabs.tsx` | `tabs: {id,label,done}[]`, `activeId`, `onPick`, `onAdd?`, `addLabel?` | Complainant (c1/c2), Accused (a1/a2), Cheque (ch1/ch2), Demand (dn1/dn2) |
| 1.11 | `Banner` | `banner.tsx` | `children` | All pages |
| 1.12 | `Subhead` | `subhead.tsx` | `children`, `divider?: boolean` | Section breaks |
| 1.13 | `AddressTable` | `address-table.tsx` | `addresses: Address[]`, `columns` | Complainant, Accused |
| 1.14 | `RichTextEditor` | `rich-text-editor.tsx` | `value`, `placeholder?` | ADR page (prayer/relief), Affidavit |

### Phase 2: Types & Lookups

| # | Task | File |
|---|------|------|
| 2.1 | TypeScript interfaces | `src/types.ts` — `Complainant`, `Advocate`, `Accused`, `Cheque`, `DemandNotice`, `Jurisdiction`, `ADR`, `Affidavit`, `Payment`, `Sign`, `Address`, `FilingData` |
| 2.2 | Lookup constants | `src/data/lookups.ts` — all Select/Radios options (see below) |
| 2.3 | Initial state | `src/data/initial-state.ts` — `INITIAL` constant matching prototype |

### Phase 3: State Management (Zustand + Redux)

**Primary choice: Zustand** — lightweight, matching prototype's simple state pattern. **Redux Toolkit** available as fallback if production needs grow (devtools, middleware, time-travel).

| # | Task | File |
|---|------|------|
| 3.1 | Zustand store — `useFilingStore` | `src/stores/filing-store.ts` |
| 3.2 | Redux Toolkit store (alternative) | `src/stores/redux/` — slice + store + provider |
| 3.3 | Install deps | `pnpm add zustand @reduxjs/toolkit react-redux` |

#### Zustand Store Shape

```ts
// src/stores/filing-store.ts
import { create } from "zustand";
import { STEPS } from "@/src/data/steps";
import { INITIAL } from "@/src/data/initial-state";

interface FilingState {
  // Navigation
  view: "home" | "filing";
  activeStep: string;
  activeSub: string | null;
  openSteps: Record<string, boolean>;
  done: Record<string, boolean>;

  // Data
  data: FilingData;

  // Actions
  setView: (v: "home" | "filing") => void;
  goTo: (stepId: string, subId?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  markDone: () => void;
  toggleStep: (stepId: string) => void;
  updateField: <K extends keyof FilingData>(key: K, patch: Partial<FilingData[K]>) => void;
  setData: (patch: Partial<FilingData>) => void;
  resetToNew: () => void;
}

export const useFilingStore = create<FilingState>((set, get) => ({
  view: "filing",
  activeStep: "party",
  activeSub: "complainant",
  openSteps: { party: true },
  done: {},
  data: INITIAL,

  setView: (v) => set({ view: v }),
  goTo: (stepId, subId) => {
    const step = STEPS.find((s) => s.id === stepId);
    set((state) => ({
      activeStep: stepId,
      activeSub: subId ?? step?.subs[0]?.id ?? null,
      openSteps: { ...state.openSteps, [stepId]: true },
    }));
  },
  nextStep: () => { /* logic from prototype */ },
  prevStep: () => { /* logic from prototype */ },
  markDone: () => {
    const { activeStep, activeSub } = get();
    set((state) => {
      const key = activeSub ? `${activeStep}/${activeSub}` : activeStep;
      return { done: { ...state.done, [key]: true } };
    });
  },
  toggleStep: (stepId) =>
    set((state) => ({ openSteps: { ...state.openSteps, [stepId]: !state.openSteps[stepId] } })),
  updateField: (key, patch) =>
    set((state) => ({ data: { ...state.data, [key]: { ...state.data[key], ...patch } } })),
  setData: (patch) =>
    set((state) => ({ data: { ...state.data, ...patch } })),
  resetToNew: () =>
    set({
      activeStep: "party", activeSub: "complainant", openSteps: { party: true },
      done: {}, data: INITIAL,
    }),
}));
```

#### Redux Toolkit Alternative (if needed)

```
src/stores/redux/
  store.ts          — configureStore
  filing-slice.ts   — createSlice with same shape + actions
  provider.tsx       — ReduxProvider wrapper ("use client")
```

**Choose Zustand** until:
- Need Redux DevTools time-travel debugging
- Multiple middleware required (persist, thunk, saga)
- Team already on Redux

#### Page Integration

```tsx
// app/cases/new/page.tsx
"use client";
import { useFilingStore } from "@/src/stores/filing-store";

export default function NewFilingPage() {
  const activeStep = useFilingStore((s) => s.activeStep);
  const activeSub = useFilingStore((s) => s.activeSub);
  const goTo = useFilingStore((s) => s.goTo);
  // ... no useState needed in page — all in store
}
```

Pages import only what they need via selectors → no prop drilling.

### Phase 4: Page Components

Build bottom-up (most reusable → least). Each page is `"use client"`, receives `data` + `set` props, manages local tab/sub-step state.

| # | Page | Route step | File |
|---|------|------------|------|
| 4.1 | `ComplainantPage` | party/complainant | `src/components/pages/party/complainant.tsx` |
| 4.2 | `AdvocatePage` | party/advocate | `src/components/pages/party/advocate.tsx` |
| 4.3 | `AccusedPage` | party/accused | `src/components/pages/party/accused.tsx` |
| 4.4 | `ChequePage` | case/cheque | `src/components/pages/case/cheque.tsx` |
| 4.5 | `DemandPage` | case/demand | `src/components/pages/case/demand.tsx` |
| 4.6 | `JurisdictionPage` | case/jurisdiction | `src/components/pages/case/jurisdiction.tsx` |
| 4.7 | `ADRPage` | case/adr | `src/components/pages/case/adr.tsx` |
| 4.8 | `EvidenceWitnessesPage` | evidence/witnesses | `src/components/pages/evidence/witnesses.tsx` **(NEW — not in prototype)** |
| 4.9 | `EvidenceDocumentsPage` | evidence/documents | `src/components/pages/evidence/documents.tsx` |
| 4.10 | `AffidavitPage` | affidavit | `src/components/pages/affidavit.tsx` |
| 4.11 | `PreviewPage` | preview | `src/components/pages/preview.tsx` |
| 4.12 | `SignPage` | sign | `src/components/pages/sign.tsx` |
| 4.13 | `PayPage` | pay | `src/components/pages/pay.tsx` |

### Phase 5: Home Screen (DEFERRED)

| # | Task | File |
|---|------|------|
| 5.1 | `HomeScreen` | `src/components/home/home-screen.tsx` — drafts, case types grid, filed-cases table, docs modal — **build later** |

### Phase 6: Integration

| # | Task |
|---|------|
| 6.1 | Wire `useFilingState` hook into `/cases/new/page.tsx` |
| 6.2 | Replace placeholder body with step router (conditional rendering per activeStep/activeSub) |
| 6.3 | Wire `nextStep`/`prevStep` to sticky bottom buttons |
| 6.4 | `goHome()` → replace `window.location.href` with Next.js router |

---

## Lookup Data Catalog

All values extracted from prototype. Source file: `src/data/lookups.ts`.

| Key | Values | Used In |
|-----|--------|---------|
| `ENTITY_TYPES` | Sole Proprietorship, Partnership Firm, Private Limited Company, Public Limited Company, LLP, HUF, Trust, Society | Complainant |
| `ACCUSED_PARTY_TYPES` | Individual, Proprietorship, Partnership Firm, Company, HUF, Other | Accused |
| `SALUTATIONS` | Mr., Mrs., Ms., M/s | Accused |
| `RETURN_REASONS` | Funds insufficient, Account closed, Signature mismatch, Stop payment instructions issued, Drawer's signature differs, Other | Cheque |
| `DEBT_NATURES` | Friendly loan, Business loan, Sale consideration, Services rendered, Rent due, Salary / wages, Refund of advance, Other | Demand |
| `SERVICE_MODES` | Registered Post AD, Speed Post, Courier, Hand delivery, Email | Demand |
| `PAYMENT_STATUSES` | No payment made, Part payment made, Full payment made | Demand |
| `COURTS` | 24×7 ON Court Chandigarh, Chief Judicial Magistrate Chandigarh, District Court Mohali | Jurisdiction |
| `LIMITATION_PERIODS` | 1 month, Beyond 1 month — with application for condonation | Jurisdiction |
| `ADR_OPTIONS` | Yes, No, May be | ADR |
| `DEPONENTS` | Rajesh Verma (Complainant), Authorized Representative | Affidavit |
| `YES_NO` | Yes, No | Universal (Party-in-Person, Same Bank, Delivered, Replied, Within Limit, Notarised, Bail) |
| `SIGN_MODES` | esign (E-Sign recommended badge), upload (Upload Signed Copy) | Sign |
| `PAYMENT_METHODS` | upi (UPI), card (Debit/Credit Card), netbanking (Net Banking) | Pay |

### Conditional Field Visibility

| Condition | Shows |
|-----------|-------|
| `payment === "Part payment made"` | Amount input (₹) |
| `withinLimit === "no"` | Delay reason textarea |
| `partyInPerson === "no"` → `complainantType === "Entity"` | Entity type + name fields |
| `notarised === "yes"` | File upload for notarised copy |
| `mode === "esign"` | Aadhaar number input + consent checkbox |
| `mode === "upload"` | File drop zone for signed complaint |
| `sameBank === "no"` | IFSC + bank name + branch inputs (Cheque page) |

---

## File Structure (Completed + Planned)

```
app/
  layout.tsx                          ✅ fonts, HTML shell
  globals.css                         ✅ tokens + sidebar styles
  page.tsx                            ⬜ stub — HomeScreen deferred
  cases/
    new/
      layout.tsx                      ✅ minimal flex-column
      page.tsx                        ⬜ needs useFilingState + step router
src/
  types.ts                            ⬜ all interfaces
  data/
    steps.ts                          ✅ 7-step definitions
    lookups.ts                        ⬜ all Select/Radios options
    initial-state.ts                  ⬜ INITIAL constant
  hooks/
    (pages use Zustand selectors instead)    ⬜
  stores/
    filing-store.ts                           ⬜ Zustand primary
    redux/
      filing-slice.ts                         ⬜ Redux fallback
      store.ts                                ⬜
      provider.tsx                            ⬜
  components/
    shell/
      sidebar.tsx                     ✅ accordion stepper
    form/
      page-title.tsx                  ⬜
      num-stepper.tsx                 ⬜
      form-row.tsx                    ⬜
      input.tsx                       ⬜
      select.tsx                      ⬜
      date-input.tsx                  ⬜
      textarea.tsx                    ⬜
      radios.tsx                      ⬜
      phone-input.tsx                 ⬜
      tabs.tsx                        ⬜
      banner.tsx                      ⬜
      subhead.tsx                     ⬜
      address-table.tsx               ⬜
      rich-text-editor.tsx            ⬜
    pages/
      party/
        complainant.tsx               ⬜
        advocate.tsx                  ⬜
        accused.tsx                   ⬜
      case/
        cheque.tsx                    ⬜
        demand.tsx                    ⬜
        jurisdiction.tsx              ⬜
        adr.tsx                       ⬜
      evidence/
        witnesses.tsx                 ⬜ **NEW**
        documents.tsx                 ⬜
      affidavit.tsx                   ⬜
      preview.tsx                     ⬜
      sign.tsx                        ⬜
      pay.tsx                         ⬜
    home/
      home-screen.tsx                 ⏳ DEFERRED
public/
  assets/
    govt-emblem.png                   ✅
```

---

## Design Decisions (Locked In)

- **No external UI library** — Tailwind 4 + shadcn primitives only
- **No server components for wizard** — all `"use client"`
- **State:** Zustand store (`useFilingStore`) — Redux Toolkit as fallback for production needs
- **Fonts:** Inter (headings) + Roboto (body) via `next/font/google`
- **TypeScript strict** — all components typed, no `any`
- **No Zustand/Redux** — match prototype's simple state pattern
- **Evidence = 2 sub-steps** (Witnesses + Documents) — deviation from prototype

---

## Next Step

**Phase 1.1 + 1.2**: Build `PageTitle` + `NumStepper` form primitives. Then continue bottom-up through the form component list.