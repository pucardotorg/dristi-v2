# agent.md — Rebuild Workflow

## Mission

Rebuild the **Case Filing 2.0** prototype as a production Next.js 16 app.
The handoff prototype lives at `D:\kamba\deltaxy\pucar\drishti2-handoff\drishti2\project`.
Read `CLAUDE.md` for full architecture, data model, and component breakdown.

## Strategy: Vertical Slice First

Build a **single complete path** (Complainant → Cheque → Demand → Preview → Pay) end-to-end before expanding to all sub-steps and edge cases.

### Phase 1 — Scaffold & Shell

1. **Port design tokens** to Tailwind config.
   - Colors: `teal` (#007e7e), `slate` scale, `green`, `amber`, `muted` (#6b7280)
   - Fonts: `Inter` for headings/labels, `Roboto` for body — load via `next/font/google`
   - Radius: 8px cards, 6px inputs
   → verify: `pnpm dev` shows styled header + sidebar chrome

2. **Build `AppHeader` + `Sidebar`** components.
   - Header: government emblem (use `public/assets/govt-emblem.png` from handoff), language toggle, support link
   - Sidebar: 7-step accordion with sub-steps, active highlighting, time pills, "Go to Home" link
   - Wire `activeStep` + `activeSub` + `openSteps` state
   → verify: sidebar navigation renders, accordion toggle works, active states visible

3. **Build step routing** (client-side).
   - Central state in a context or hook (single object matching `INITIAL` shape from prototype)
   - `goTo`, `nextStep`, `prevStep`, `markDone` logic
   - Layout: sidebar (left, ~288px) + main content (scrollable) + sticky bottom nav (Back / Save Draft / Next)
   → verify: clicking Next/Back cycles through steps; sidebar highlights correct step

### Phase 2 — Form Primitives

4. **Port reusable form components** (`atoms.jsx` → `src/components/form/`).
   - `Row` (label + control + hint/error/ok)
   - `Input`, `Select`, `Textarea`, `DateInput`
   - `PhoneInput` (prefix +91, icon, confirm field)
   - `Radios` (Yes/No pill toggle)
   - `Tabs` (for multiple cheques, complainants, accused)
   - `Banner`, `Subhead`, `NumStepper`, `RichTextEditor`
   → verify: each component renders with mock data, styling matches prototype

### Phase 3 — Pages (Vertical Slice)

5. **Complainant page** (step 1, sub-step 1).
   - Entity/Individual type selector
   - Entity fields: type, name, phone (confirm), email
   - Address table (multi-row)
   - Authorized representative: phone, name, age, designation, email
   → verify: data writes to state, fields populate from INITIAL, next advances to advocate

6. **Cheque page** (step 2, sub-step 1).
   - Cheque tab system (add/remove cheques)
   - Date, amount (₹), number, IFSC + "Fetch Details", bank name, branch
   - Return memo: deposit date, return date, reason (select), info date
   → verify: cheque data persists in state, tab switching works

7. **Demand Notice page** (step 2, sub-step 2).
   - Demand notice tabs
   - Nature of debt (select), dispatch date, mode, tracking number
   - Delivered? Yes/No → shows delivery date
   - Replied? Yes/No
   - Part/full payment made → shows amount input
   → verify: data writes to state, conditional fields show/hide

8. **Preview page** (step 5).
   - Read-only KV grids per section: Complainant, Advocate, Accused, Cheque, Demand Notice
   - Each section has "Edit" button → calls `goTo(stepId, subId)`
   → verify: preview shows all entered data, edit buttons navigate correctly

9. **Pay Fees page** (step 7).
   - Fee breakdown table (Court Fees, Process Fees, Scrutiny, Convenience Fee)
   - Total calculation
   - Payment method picker: UPI, Card, Net Banking (radio cards)
   → verify: total computed correctly, method selection works, "Pay ₹ 425 & Submit" button visible

### Phase 4 — Remaining Pages

10. **Advocate, Accused pages** (party details).
11. **Jurisdiction, ADR pages** (case details).
12. **Evidence page** (document checklist with upload toggles).
13. **Affidavit page** (deponent selector, place/date, rich text editor, notarised toggle).
14. **Sign page** (e-Sign via Aadhaar OTP vs upload signed copy).
15. **Home/Dashboard** (drafts, case types grid, filed-cases table, document checklist modal).

### Phase 5 — Polish

16. Responsive sidebar (collapsible on mobile).
17. Save-as-draft persistence (localStorage).
18. Form validation (required fields, phone match, date ordering).
19. Loading/empty/error states.

## Tech Decisions (Pre-Made)

- **No external UI library.** Tailwind CSS 4 only. Port prototype styles.css directly.
- **No server components for wizard pages.** All client-side (`"use client"`). The wizard is interactive — no benefit from SSR.
- **State management:** React context or a single `useReducer` — not Zustand, not Redux. Prototype used one giant `useState`; match that simplicity.
- **Fonts:** `next/font/google` for Inter (`font-sans`) and Roboto (`font-body`).
- **TypeScript:** Yes. Define interfaces for `Complainant`, `Cheque`, `DemandNotice`, etc. in `src/types.ts`.
- **File structure:**
  ```
  app/
    layout.tsx          (fonts, metadata, html/body shell)
    page.tsx            (entry — home screen or wizard, TBD)
    globals.css         (Tailwind imports + custom tokens)
  src/
    types.ts            (all data interfaces)
    data/
      initial-state.ts  (INITIAL constant from prototype)
      steps.ts          (STEPS definition)
    components/
      shell/
        header.tsx
        sidebar.tsx
      form/
        row.tsx
        input.tsx
        select.tsx
        textarea.tsx
        date-input.tsx
        phone-input.tsx
        radios.tsx
        tabs.tsx
        banner.tsx
        subhead.tsx
        rich-text-editor.tsx
        ...
      pages/
        party/
          complainant.tsx
          advocate.tsx
          accused.tsx
        case/
          cheque.tsx
          demand.tsx
          jurisdiction.tsx
          adr.tsx
        evidence.tsx
        affidavit.tsx
        preview.tsx
        sign.tsx
        pay.tsx
      home/
        home-screen.tsx
    hooks/
      use-filing-state.ts  (central state + navigation hook)
    icons.tsx               (SVG icon components)
  ```

## When In Doubt

- Read the handoff source files directly. They are the spec.
- Prototype screenshots are at `screenshots/` in handoff folder.
- All design details (spacing, colors, states) are in `styles.css` — grep it.
- Do not deviate from prototype behavior unless explicitly asked.
- Keep state structure identical to `INITIAL` — do not normalize or split.