# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: PUCAR Drishti v2

**What:** Case Filing 2.0 — e-filing wizard for Indian District Courts. Users file cases under Section 138 of Negotiable Instruments Act (cheque bounce).

**Tech:** Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript + Zustand + Zod. Package manager: pnpm.

**Deployed:** Vercel → [pucar-drishti-v2.vercel.app](https://pucar-drishti-v2.vercel.app)

**Handoff source:** `D:\kamba\deltaxy\pucar\drishti2-handoff\drishti2\project` — working prototype built as plain React (CDN-loaded, no bundler, JSX via Babel standalone). Being migrated into this Next.js app.

---

## Commands

```bash
pnpm dev       # dev server (Next.js + Turbopack)
pnpm build     # production build
pnpm start     # start production server
pnpm lint      # ESLint check
```

No test runner configured yet.

```bash
pnpm db:push     # push schema to DB (uses drizzle-kit push)
pnpm db:generate # generate migration files
pnpm db:migrate  # run migrations
pnpm db:studio   # open Drizzle Studio (DB browser)
```

---

## App Architecture

### Directory Layout

```
app/
  page.tsx                   # Home stub
  layout.tsx                 # Root layout — loads Inter + Roboto fonts
  globals.css                # Design tokens + Tailwind directives
  cases/new/
    layout.tsx               # Minimal flex wrapper
    page.tsx                 # Main filing wizard shell (AppHeader + Sidebar + body + footer)

src/
  components/
    form/                    # 15+ form primitives (Input, Select, Tabs, PhoneInput, etc.)
    pages/party/             # Step page components: complainant.tsx, advocate.tsx, accused.tsx
    shell/sidebar.tsx        # 7-step accordion navigator
  stores/filing-store.ts     # Zustand store — all global state
  data/
    steps.ts                 # STEPS array (7 main, 11 sub-steps)
    initial-state.ts         # INITIAL data shape
    lookups.ts               # Static dropdown data
  validation/
    complainant-schema.ts    # Zod schema (others pending)
  types.ts                   # Full type hierarchy: Address, Complainant, Advocate, Accused, Cheque, Demand, Jurisdiction, ADR, DocEntry, Affidavit, Sign, Payment → FilingData

components/ui/button.tsx     # shadcn-style UI components
lib/utils.ts                 # cn() utility
lib/filing-service.ts        # DB persistence layer: saveFiling(), getFilingById() — normalises FilingData into relational tables (litigants, addresses, advocates, documents)
lib/storage.ts               # S3-compatible file storage: upload(), download(), getPresignedUrl(), remove()
lib/db.ts                    # Drizzle + pg.Pool database client
lib/auth.ts                  # Better Auth server config
lib/auth-client.ts           # Better Auth client (signIn, signOut, useSession)

db/
  schema/                    # Drizzle table definitions (case, individual, advocate, documents, billing, auth)
  migrations/                # Drizzle migration files

docker-compose.yml           # Local dev: PostgreSQL + MinIO (S3-compatible)
```

Path alias: `@/*` → repo root.

### State Management

Zustand store at `src/stores/filing-store.ts` holds everything:
- `activeStep` / `activeSub` — wizard navigation position
- `openSteps` — sidebar accordion expand state
- `done` — completion map (step/sub → bool) drives sidebar checkmarks + tab badges
- `data: FilingData` — all form data as single object (see `src/types.ts`)

Key store actions: `goTo(stepId, subId)`, `nextStep()`, `prevStep()`, `toggleStep()`, `setData()`, `updateComplainant()`, `addComplainant()`, `removeComplainant()`.

Optional localStorage persistence: set `NEXT_PUBLIC_PERSIST_DRAFT=true` in `.env.local`.

### 7-Step Wizard Flow

1. **Party Details** — Complainant, Advocate, Accused (3 sub-steps)
2. **Case Details** — Cheque & Return Memo, Demand Notice, Jurisdiction & Limitation, ADR & Prayer (4 sub-steps)
3. **Evidence** — document checklist with upload
4. **Affidavit** — auto-drafted, editable rich text
5. **Preview** — read-only summary; edit buttons use `goTo()`
6. **Sign** — e-Sign via Aadhaar OTP or upload signed copy
7. **Pay Fees** — court fees + process fees, UPI/card/netbanking

### Key Patterns

- **Page-level data flow**: each step page reads from `useFilingStore().data.section` and writes via `setData()` / section-specific updaters.
- **Tabs for multiples**: `Tabs` component in `src/components/form/tabs.tsx` handles add/switch/remove for complainants, accused, cheques, demands.
- **Fetch Details**: `FetchDetails` component triggers lookup (IFSC → bank, bar number → advocate, phone → court DB) and shows result in `Banner`.
- **Address tables**: `AddressTable` + `AddressModal` (multi-address) and `SingleAddressTable` (single fixed address) — columns: Sl.No, Address, Pincode, District, State, Geolocation, Police Station.
- **All pages use `"use client"`** — wizard is client-side hydrated.

### Design Tokens

Defined in `app/globals.css`:
- Primary: `--teal` (#007e7e)
- Neutrals: `--slate-*` scale
- Success: `--green`, Warning: `--amber`, Muted: `#6b7280`
- Fonts: Inter (headings/labels), Roboto (body/inputs)
- Radius: 8px cards, 6px inputs/buttons
- Layout: sidebar 288px fixed, main area scrollable, sticky bottom bar (Back / Save as Draft / Next)

---

## Infrastructure

### Deployment: Vercel

- Auto-deploys on push to main
- Dockerfile exists but is NOT used by Vercel (only for self-hosting)
- `output: "standalone"` in next.config.ts is ignored by Vercel

### Database: Neon PostgreSQL

- Hosted on Neon (ap-southeast-1)
- **Uses pooled connection** (`-pooler` hostname) — required for Vercel serverless
- Driver: `pg.Pool` via `drizzle-orm/node-postgres` (works with pooled connection, no special driver needed)
- ORM: Drizzle
- Schema push: `pnpm db:push` (set `DATABASE_URL` env var first)

### File Storage: Cloudflare R2 (S3-compatible)

- Uses `@aws-sdk/client-s3` — swap providers by changing env vars only
- `lib/storage.ts` — thin wrapper: `upload()`, `download()`, `getPresignedUrl()`, `remove()`, `caseDocKey()`
- Upload API: `POST /api/upload` (multipart form: file + caseId + docType + tenantId)
- Download URL: `GET /api/upload/[filestoreId]` (returns presigned URL)
- Delete: `DELETE /api/upload/[filestoreId]`
- File metadata tracked in `filestore` table

| Environment | Provider | Config |
|---|---|---|
| Local dev | MinIO (via docker compose) | `S3_ENDPOINT=http://localhost:9000` |
| Production | Cloudflare R2 | `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com` |

### Auth: Better Auth

- Email + password auth
- Server: `lib/auth.ts`, Client: `lib/auth-client.ts`
- Route handler: `app/api/auth/[...all]/route.ts`
- Seed endpoint: `GET /api/auth/seed` (creates demo user, gated by `ALLOW_SEED=true`)
- Demo credentials: `demo@pucar.in` / `demo1234`

### Environment Variables

See `.env.example` for full list. Key vars:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `BETTER_AUTH_URL` | Server base URL (must match deployment URL) |
| `NEXT_PUBLIC_APP_URL` | Client base URL (must match deployment URL) |
| `S3_ENDPOINT` | S3-compatible endpoint |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret key |
| `S3_BUCKET` | Bucket name (`pucar-docs`) |
| `S3_REGION` | Region (`auto` for R2) |
| `ALLOW_SEED` | Set `true` to enable `/api/auth/seed` |

### Local Dev Setup

```bash
docker compose up -d       # starts PostgreSQL + MinIO
cp .env.example .env.local # fill in values
pnpm db:push               # create tables
pnpm dev                   # start dev server
# Visit http://localhost:3000/api/auth/seed to create demo user
```

---

## Prototype Architecture (Reference for Migration)

The prototype at the handoff source has the complete working implementation. Use it as the spec when building pages not yet migrated.

### Source files (prototype load order)
| File | Purpose |
|---|---|
| `src/icons.jsx` | ~15 SVG icon components on `window.Icon` |
| `src/atoms.jsx` | All form primitives on `window` |
| `src/shell.jsx` | `AppHeader` + `Sidebar` |
| `src/pages-party.jsx` | `ComplainantPage`, `AdvocatePage`, `AccusedPage` |
| `src/pages-case.jsx` | `ChequePage`, `DemandPage`, `JurisdictionPage`, `ADRPage` |
| `src/pages-finalize.jsx` | `EvidencePage`, `AffidavitPage`, `PreviewPage`, `SignPage`, `PayPage` |
| `src/home.jsx` | `HomeScreen` + `DocsModal` |
| `src/app.jsx` | Root `CaseFilingApp` — state, routing, navigation |

### Prototype state model
- `complainants`: c1/c2 — entity type, name, phone, email, addresses, authorized rep
- `advocate`: bar number, name, phone, email, vakalatnama file
- `accused`: a1/a2 — party type, salutation, name, guardian, contact, address
- `cheques`: ch1/ch2 — date, amount, number, IFSC, bank, branch, return memo
- `demands`: dn1/dn2 — nature of debt, dispatch date, mode, tracking, delivery/reply/payment status
- `jurisdiction`: place, court, cause date, limitation period, within-limit flag
- `adr`: preference (yes/no/maybe), other details RTE, interim relief RTE, final relief RTE
- `documents`: 6 required docs with upload status
- `affidavit`: deponent, place, date, notarised status
- `payment`: method (upi/card/netbanking)
- `sign`: mode (esign/upload), aadhaar number, consent, bail bond option

---

## Behavioral Guidelines

Reference: `agent.md` for task/workflow instructions.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.

### 3. Surgical Changes

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans: remove imports/variables/functions that YOUR changes made unused.

### 4. Goal-Driven Execution

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```
