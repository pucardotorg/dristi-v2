# CIS Batch Filing Bridge — Test Specification

**Version:** V1  
**Date:** 2026-06-13  
**Scope:** Steps 1–6 end-to-end flow + component-level edge cases  

---

## Status Lifecycle

```
DRAFT  ──▶  READY_FOR_CIS  ──▶  EXPORTED_FOR_CIS  ──▶  FILED_IN_CIS   ✅
                                        │
                                        └──▶  CIS_FAILED  ──▶  (re‑export after reset)
```

---

## 1. Wizard Submit → READY_FOR_CIS

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| WZ-01 | **Happy path: submit complete filing** | 1. Log in as advocate<br>2. Complete all wizard steps (party, case, evidence, affidavit, sign, pay)<br>3. Click "Save as Draft"<br>4. Click "Submit to Court" | • API returns `status: "READY_FOR_CIS"`<br>• DB: `case.status = 'READY_FOR_CIS'`<br>• UI shows "✅ Submitted to Court" |
| WZ-02 | **Submit without saving draft first** | Skip "Save as Draft", click "Submit to Court" directly | • Button disabled (requires `filingId`)<br>• If forced: store shows `submitError: "Save a draft first..."` |
| WZ-03 | **Submit with incomplete party details** | Fill only complainant, skip advocate, click through to last step, submit | • Validation should prevent reaching last step<br>• If bypassed: API returns 422 (Zod validation errors) |
| WZ-04 | **Submit with empty cheque details** | Leave cheque amount, number, date empty | • API returns 422 with field-level errors |
| WZ-05 | **Submit while unauthenticated** | Clear cookies, POST to `/api/filing/submit` | • API returns 401 Unauthorized |
| WZ-06 | **Submit with invalid JSON body** | POST to `/api/filing/submit` with `"not json"` | • API returns 400 Invalid JSON |
| WZ-07 | **Submit with valid but unknown filingId** | POST with `filingId: "nonexistent-xxx"` | • API returns 500 "Case not found" |
| WZ-08 | **Multiple submissions of same filing** | Submit same filing twice | • First: `READY_FOR_CIS`<br>• Second: still `READY_FOR_CIS` (idempotent — saves again) |
| WZ-09 | **Submit with multi-entity complainant** | Complainant type = "Entity" with company name | • DB stores entityName in individual.additional_details<br>• Export later picks up entityName correctly |
| WZ-10 | **Submit with PoA holder** | Complainant has PoA = Yes, fill PoA details | • DB stores PoA individual + addresses<br>• `case_poa_holder` row created |
| WZ-11 | **Submit with 2+ complainants** | Add second complainant c2, fill details | • Both stored as COMPLAINANT litigants<br>• Export picks first complainant (c1) only |
| WZ-12 | **Submit with 2+ accused** | Add second accused a2, fill details | • Both stored as ACCUSED litigants<br>• Export picks first accused (a1) only |
| WZ-13 | **Submit with 2+ cheques** | Add second cheque ch2 | • Export picks first cheque (ch1) |
| WZ-14 | **Submit with present address ≠ permanent** | Set presentSameAsPermanent = "no", fill present address | • Both PERMANENT and PRESENT addresses stored in DB |

---

## 2. Staff Dashboard

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| SD-01 | **Happy path: authenticated staff user** | 1. Log in as staff user<br>2. Navigate to `/staff` | • Page renders with title "Staff Dashboard"<br>• 5 status tabs visible<br>• Default tab: "Ready for CIS" |
| SD-02 | **Unauthenticated access** | Clear cookies, navigate to `/staff` | • Redirected to `/login?next=/staff` (307) |
| SD-03 | **Tab switching** | Click each tab: Drafts, Ready for CIS, Exported, Filed in CIS, CIS Failed | • URL updates to `?status=DRAFT` etc.<br>• Active tab highlighted with teal border<br>• Badge shows correct count |
| SD-04 | **Count badges are correct** | Have: 2 DRAFT, 3 READY_FOR_CIS, 1 EXPORTED_FOR_CIS, 5 FILED_IN_CIS, 1 CIS_FAILED | • Each badge shows exact count<br>• Badge turns teal for active tab, grey for inactive |
| SD-05 | **Empty tab** | Click tab with 0 cases | • "No cases in this status." message shown<br>• Table not rendered |
| SD-06 | **Data table columns** | Click a tab with cases | • Columns: Filing No, Title, Date, Status<br>• Title = "Complainant vs Accused"<br>• Date in DD/MM/YYYY format<br>• Status badge: green for success, amber for warn |
| SD-07 | **Case with single party (only complainant)** | Case has complainant but no accused filled yet | • Title shows "Rajesh Verma vs (accused)" |
| SD-08 | **Case with neither party name** | Case exists but individual.given_name is empty | • Title shows filing number (fallback) |
| SD-09 | **Large dataset (50+ cases)** | Seed 50 DRAFT cases | • Table renders all rows<br>• No pagination (all in one scroll) |
| SD-10 | **Staff nav link visibility** | 1. Logged in → check header<br>2. Log out → check header | • Logged in: "Staff" link visible<br>• Logged out: no "Staff" link |
| SD-11 | **Staff nav link active state** | Navigate to `/staff` | • "Staff" link highlighted teal |
| SD-12 | **Different court_id isolation** | Create cases under court-A and court-B, log in as court-A staff | • Dashboard shows only court-A cases |
| SD-13 | **Staff header in dark mode** | Toggle dark mode, view dashboard | • All text/colors adapt to dark theme |
| SD-14 | **Concurrent tab updates** | Open 2 tabs, change status in one, refresh other | • Second tab shows updated counts |

---

## 3. CIS Daily Export

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| EX-01 | **Happy path: export 1 case** | 1. Set case to READY_FOR_CIS<br>2. GET `/api/cis/daily-export` | • Returns JSON array with 1 item<br>• All 16 bridge payload fields present<br>• DB: case status → EXPORTED_FOR_CIS |
| EX-02 | **Export with no READY_FOR_CIS cases** | GET export when no cases in that status | • Returns `[]` (empty array)<br>• No DB changes |
| EX-03 | **Atomicity: concurrent exports** | Two requests hit export simultaneously | • First request gets the cases<br>• Second request gets `[]` (cases already claimed) |
| EX-04 | **Export fields: individual complainant** | Complainant type = Individual | • `complainant_name` = repName from DB |
| EX-05 | **Export fields: entity complainant** | Complainant type = Entity with entityName | • `complainant_name` = entityName |
| EX-06 | **Export fields: accused company** | Accused type = Entity with companyName | • `accused_name` = companyName |
| EX-07 | **Export fields: missing address** | Complainant has no address row | • `complainant_address` = "" (empty string) |
| EX-08 | **Export fields: missing mobile** | Complainant has no phone | • `complainant_mobile` = "" (empty string) |
| EX-09 | **Export fields: date formats** | Cheque date stored as YYYY-MM-DD | • Exported as DD-MM-YYYY<br>• e.g. "2026-05-15" → "15-05-2026" |
| EX-10 | **Export fields: date already DD-MM-YYYY** | Date already in correct format | • Passed through unchanged (no double-conversion) |
| EX-11 | **Export fields: missing date** | No cheque date filled | • `cheque_date` = "" |
| EX-12 | **Export fields: cause_of_action text** | Cheque has all fields | • Template: "Cheque No. {number} dated {date} for Rs. {amount} was dishonoured due to {reason}." |
| EX-13 | **Export fields: relief (ADR text)** | ADR "other" field filled | • `relief` = ADR other text |
| EX-14 | **Export fields: relief (default)** | ADR not filled or empty | • `relief` = "Complaint under Section 138 of Negotiable Instruments Act." |
| EX-15 | **Export fields: court_code from DB** | Court has code in lookup table | • `court_code` = court.code |
| EX-16 | **Export fields: court_code fallback** | Court not found in lookup | • `court_code` = "UNKNOWN" |
| EX-17 | **Export: multiple cases in one batch** | 5 cases all READY_FOR_CIS | • Returns array of 5<br>• All 5 marked EXPORTED_FOR_CIS atomically |
| EX-18 | **Export: unauthenticated** | No session cookie | • Returns 401 Unauthorized |
| EX-19 | **Export: non-NI_ACT_138 cases excluded** | Case with case_type ≠ NI_ACT_138 and READY_FOR_CIS | • Not included in export |
| EX-20 | **Export: inactive cases excluded** | Case with lifecycle_status ≠ ACTIVE | • Not included in export |

---

## 4. CIS Result Import

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| IM-01 | **Happy path: import success** | POST result with status=success, filing_no, cnr | • DB: status → FILED_IN_CIS<br>• DB: cnr_number set<br>• DB: additional_details.cis populated<br>• Response: `{filed: 1, failed: 0, skipped: 0}` |
| IM-02 | **Happy path: import failure** | POST result with status=failed, error | • DB: status → CIS_FAILED<br>• DB: additional_details.cis.error set<br>• Response: `{filed: 0, failed: 1, skipped: 0}` |
| IM-03 | **Skip: case not in EXPORTED_FOR_CIS** | Try to import for case that is DRAFT | • Skipped with reason "Case not in EXPORTED_FOR_CIS status"<br>• Status unchanged |
| IM-04 | **Skip: case not found** | Try to import with non-existent external_filing_id | • Skipped with reason |
| IM-05 | **Mixed batch (success + failed + skip)** | POST array with 1 success, 1 failed, 1 skip | • Each processed independently<br>• Summary: `{filed: 1, failed: 1, skipped: 1}` |
| IM-06 | **Import: missing cis_filing_no on success** | POST success without filing_no | • 422 "Success items must have cis_filing_no and cis_cnr" |
| IM-07 | **Import: missing error on failed** | POST failed without error field | • 422 "Failed items must have an error message" |
| IM-08 | **Import: missing external_filing_id** | POST item with only status field | • 422 "Each item must have external_filing_id and status" |
| IM-09 | **Import: non-array body** | POST `{"status": "success"}` | • 422 "Body must be a JSON array" |
| IM-10 | **Import: invalid JSON** | POST `not json` | • 400 "Invalid JSON" |
| IM-11 | **Import: unauthenticated** | No session cookie | • 401 Unauthorized |
| IM-12 | **Import: empty array** | POST `[]` | • `{total: 0, filed: 0, failed: 0, skipped: 0}` |
| IM-13 | **Import: duplicate import** | Import same result twice | • First: filed<br>• Second: skipped (not in EXPORTED_FOR_CIS) |
| IM-14 | **Import: raw_cis_response preserved** | POST with raw_cis_response object | • Stored in additional_details.cis.raw_response |
| IM-15 | **Import: additional_details preserved** | Case has existing additional_details (affidavit, sign) | • cis fields merged in, existing fields untouched |
| IM-16 | **Import: re-import after CIS_FAILED** | 1. Import as failed → CIS_FAILED<br>2. Admin resets to EXPORTED_FOR_CIS<br>3. Import success | • Status goes CIS_FAILED → EXPORTED_FOR_CIS (admin action) → FILED_IN_CIS |

---

## 5. Bridge Script (File Mode)

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| BR-01 | **Happy path: file mode** | Set INPUT_JSON + OUTPUT_JSON, run script | • Reads INPUT_JSON<br>• Logs into CIS<br>• Submits case<br>• Writes output JSON<br>• Logs out |
| BR-02 | **Happy path: API mode (backward compat)** | Set MODERN_PULL_URL + MODERN_CALLBACK_URL, no INPUT_JSON | • Pulls from API<br>• Posts callbacks<br>• Existing behavior unchanged |
| BR-03 | **No input source configured** | Run without INPUT_JSON or MODERN_PULL_URL | • Error: "Set INPUT_JSON (file mode) or MODERN_PULL_URL + MODERN_CALLBACK_URL" |
| BR-04 | **INPUT_JSON file not found** | Set INPUT_JSON=/nonexistent/file.json | • Error: "INPUT_JSON file not found: /nonexistent/file.json" |
| BR-05 | **CIS unreachable** | Set CIS_BASE_URL to non-existent server | • curl error during login<br>• Script exits with error |
| BR-06 | **Invalid CIS credentials** | Wrong CIS_USER or CIS_PASSWORD | • CIS login fails with JSON error<br>• Script exits |
| BR-07 | **Wrong court code** | COURT_CODE not registered in CIS | • CIS login: "Role Not Assigned to this Establishment" |
| BR-08 | **Empty INPUT_JSON** | INPUT_JSON contains `[]` | • "No pending cheque filings."<br>• Exits 0 (success, no-op) |
| BR-09 | **INPUT_JSON not a JSON array** | INPUT_JSON contains `{}` | • Python error: "Pull API must return a JSON array" |
| BR-10 | **Multiple items in INPUT_JSON** | Array with 3 cases | • All 3 processed sequentially<br>• All results in OUTPUT_JSON |
| BR-11 | **OUTPUT_JSON not set (file mode)** | Set INPUT_JSON but not OUTPUT_JSON | • Results not collected to file<br>• Script still processes cases |
| BR-12 | **CIS validation: invalid dates** | Cheque date not in DD-MM-YYYY | • CIS returns validation error<br>• Script marks as failed with "CIS submission failed" |
| BR-13 | **CIS validation: missing required fields** | Payload missing complainant_name | • CIS rejects filing<br>• Script marks as failed |
| BR-14 | **ONE case fails, others succeed** | 3 cases: case 2 fails validation | • Case 1: success<br>• Case 2: failed (error in output)<br>• Case 3: success<br>• OUTPUT_JSON has 3 results |
| BR-15 | **Python not available** | PYTHON_BIN not set, python3/python not in PATH | • Error: "Missing python3/python" |

---

## 6. Staff UI Export/Import Buttons

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| UI-01 | **Export: downloads JSON file** | Click "Download Today's CIS Batch" with 1 READY_FOR_CIS case | • Browser downloads `cis-daily-filings-YYYY-MM-DD.json`<br>• File contains valid JSON array |
| UI-02 | **Export: no cases available** | Click export when 0 READY_FOR_CIS cases | • Error toast: "No cases ready for CIS export."<br>• No download triggered |
| UI-03 | **Export: API error** | API returns 500 | • Error toast: "Export failed (HTTP 500)" |
| UI-04 | **Export: unauthenticated** | Session expired, click export | • Error toast: "Export failed (HTTP 401)" |
| UI-05 | **Export: button disabled while loading** | Click export, observe during request | • Button shows "Exporting…" and is disabled |
| UI-06 | **Import: upload valid results JSON** | Click "Import CIS Results", select valid file | • Summary shown: "1 processed: 1 filed"<br>• Success items in green, failed in red |
| UI-07 | **Import: upload invalid file** | Upload a `.txt` file (not JSON) | • Error: "File must contain a JSON array" |
| UI-08 | **Import: upload empty array** | Upload `[]` | • Summary: "0 processed:" |
| UI-09 | **Import: upload with 1 filed + 1 failed + 1 skipped** | Mixed result file | • Summary shows all three: "3 processed: 1 filed · 1 failed · 1 skipped"<br>• Skipped items show reason |
| UI-10 | **Import: API error** | API returns 500 | • Error toast: "Import failed (HTTP 500)" |
| UI-11 | **Import: button disabled while loading** | Select file, observe during request | • Label shows "Importing…" and file input disabled |
| UI-12 | **Import: re-upload same file** | Upload file, then upload same file again | • Both uploads work (file input reset after each) |
| UI-13 | **Import: unauthenticated** | Session expired, try import | • Error toast: "Import failed" |
| UI-14 | **Both buttons visible on all tabs** | Switch between all 5 status tabs | • Export and Import buttons always visible |
| UI-15 | **Dashboard counts update after export** | 1. "Ready for CIS" shows count 3<br>2. Click Export<br>3. Refresh | • "Ready for CIS" count → 0<br>• "Exported" count → 3 |

---

## 7. End-to-End Integration Flows

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| E2E-01 | **Happy path: single case** | 1. Submit filing → READY_FOR_CIS<br>2. Export → EXPORTED_FOR_CIS<br>3. Bridge submits to CIS → success<br>4. Import result → FILED_IN_CIS | • CNR stored in DB<br>• Dashboard shows "Filed in CIS (1)" |
| E2E-02 | **Bridge failure and retry** | 1. Submit → READY_FOR_CIS<br>2. Export → EXPORTED_FOR_CIS<br>3. Bridge runs, CIS validation fails<br>4. Import failed result → CIS_FAILED<br>5. Admin resets case to EXPORTED_FOR_CIS<br>6. Fix data, re-export<br>7. Bridge runs again → success<br>8. Import → FILED_IN_CIS | • CIS_FAILED → re-export → FILED_IN_CIS |
| E2E-03 | **Batch of 10 cases** | All 10 submitted, exported, bridged, imported | • All 10 go READY_FOR_CIS → EXPORTED_FOR_CIS → FILED_IN_CIS |
| E2E-04 | **Batch with partial failure** | 5 cases: 3 bridge succeed, 2 fail | • Import shows: 3 filed, 2 failed |
| E2E-05 | **Idempotent export** | Export, don't bridge, export again | • Second export returns `[]` (cases already claimed) |
| E2E-06 | **Multiple court isolation** | Cases for court-A and court-B, staff from court-A exports | • Export returns only court-A cases |
| E2E-07 | **Status progression validation** | Try to jump from DRAFT → FILED_IN_CIS | • Should not be possible via API (only via EXPORTED_FOR_CIS) |

---

## 8. Cross-Cutting Concerns

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| CC-01 | **Concurrent exports (race condition)** | Two staff members export simultaneously | • No duplicate exports (atomic UPDATE RETURNING) |
| CC-02 | **Concurrent imports** | Two staff import same result file simultaneously | • One succeeds, one skips (status check) |
| CC-03 | **Session expiry mid-operation** | Start export, session expires, request in flight | • API returns 401 |
| CC-04 | **Large export payload (100+ cases)** | Export with 100 READY_FOR_CIS cases | • All exported in single response<br>• Marked atomically |
| CC-05 | **DB connection failure** | Stop PostgreSQL, attempt export | • API returns 500 |
| CC-06 | **CIS server timeout** | CIS responds slowly (>30s) | • Bridge script hangs or fails<br>• Import as failed |

---

## Implementation Notes for Testers

### Test Data Setup
```sql
-- Quick way to create a test case in READY_FOR_CIS status:
-- 1. Use the app at http://localhost:3000/cases/new
-- 2. OR use the API:
--    POST /api/filing/save-draft  (create draft)
--    POST /api/filing/submit      (promote to READY_FOR_CIS)

-- Quick way to reset status for re-testing:
UPDATE "case" SET status = 'READY_FOR_CIS', cnr_number = NULL
WHERE id = '<case-id>';

-- View all statuses:
SELECT status, COUNT(*) FROM "case"
WHERE case_type = 'NI_ACT_138' AND lifecycle_status = 'ACTIVE'
GROUP BY status;
```

### Test User Credentials
| User | Email | Password | Role |
|---|---|---|---|
| Staff | test-staff@court.gov.in | court123 | Court staff |

### CIS Server (Droplet)
```
URL:     http://168.144.70.80/swecourtis
Court:   HRPK02
User:    supuser
Pass:    court123
```

### Bridge Script (File Mode)
```bash
INPUT_JSON=/tmp/cis-daily-filings.json \
OUTPUT_JSON=/tmp/cis-results.json \
CIS_BASE_URL=http://168.144.70.80/swecourtis \
COURT_CODE=HRPK02 \
CIS_USER=supuser \
CIS_PASSWORD=court123 \
PYTHON_BIN=python \
bash Automation_Script/cheque_cis_bridge_template.sh
```
