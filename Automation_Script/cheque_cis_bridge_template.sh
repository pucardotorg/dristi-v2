#!/usr/bin/env bash
set -euo pipefail

# Cheque-only CIS bridge template
#
# Purpose:
#   1. Pull pending cheque filings from your modern application API.
#   2. Login to old CIS using curl.
#   3. Submit Filing Counter -> Case and Caveat Filing as NACT / 138 NIA ACT.
#   4. Parse CIS Filing No. and CNR.
#   5. POST result back to your modern application API.
#
# Required commands: curl, openssl, python3/python
#
# Configure these environment variables before running:
#   (API mode — set MODERN_PULL_URL + MODERN_CALLBACK_URL)
#   CIS_BASE_URL="http://<cis-host>/swecourtis"
#   COURT_CODE="HRPK02"
#   CIS_USER="<cis-user>"
#   CIS_PASSWORD="<cis-password>"
#   MODERN_PULL_URL="https://your-app.example.com/api/cis/daily-export"
#   MODERN_CALLBACK_URL="https://your-app.example.com/api/cis/import-results"
#   MODERN_API_KEY="<shared-secret-or-token>"
#
#   (File mode — set INPUT_JSON + OUTPUT_JSON instead of API URLs)
#   INPUT_JSON="daily-filings-2026-06-13.json"
#   OUTPUT_JSON="cis-results-2026-06-13.json"
#
# Expected pull API response:
#   [
#     {
#       "external_filing_id": "APP-123",
#       "complainant_name": "ABC TRADERS",
#       "complainant_local_name": "एबीसी ट्रेडर्स",
#       "accused_name": "RAJ KUMAR",
#       "accused_local_name": "राज कुमार",
#       "complainant_address": "Address 1",
#       "accused_address": "Address 2",
#       "complainant_mobile": "9999999999",
#       "accused_mobile": "8888888888",
#       "cheque_amount": "100000",
#       "cheque_number": "123456",
#       "cheque_date": "01-06-2026",
#       "dishonour_date": "05-06-2026",
#       "cause_of_action": "Cheque dishonoured due to insufficient funds.",
#       "relief": "Complaint under Section 138 of Negotiable Instruments Act."
#     }
#   ]

CIS_BASE_URL="${CIS_BASE_URL:-http://168.144.70.80/swecourtis}"
COURT_CODE="${COURT_CODE:-HRPK02}"
CIS_USER="${CIS_USER:-supuser}"
CIS_PASSWORD="${CIS_PASSWORD:-court123}"
LOGIN_DATE="${LOGIN_DATE:-$(date +%d-%m-%Y)}"
LANG_ID="${LANG_ID:-0}"
CLOUD_FLAG="${CLOUD_FLAG:-N}"

MODERN_PULL_URL="${MODERN_PULL_URL:-}"
MODERN_CALLBACK_URL="${MODERN_CALLBACK_URL:-}"
MODERN_API_KEY="${MODERN_API_KEY:-}"
INPUT_JSON="${INPUT_JSON:-}"
OUTPUT_JSON="${OUTPUT_JSON:-}"

# CIS constants for cheque bounce case
NACT_CASE_TYPE="${NACT_CASE_TYPE:-55}"
NACT_CASE_NAME="${NACT_CASE_NAME:-NACT}"
GLOBALLINKID_FILING="${GLOBALLINKID_FILING:-63}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing command: $1" >&2; exit 1; }; }
need curl
need openssl
PYTHON_BIN="${PYTHON_BIN:-}"
if [[ -z "$PYTHON_BIN" ]]; then
  if command -v python3 >/dev/null 2>&1; then PYTHON_BIN=python3;
  elif command -v python >/dev/null 2>&1; then PYTHON_BIN=python;
  else echo "Missing python3/python" >&2; exit 1; fi
fi

# Validate input source — either API mode or file mode must be configured
if [[ -n "${INPUT_JSON:-}" ]]; then
  if [[ ! -f "$INPUT_JSON" ]]; then
    echo "INPUT_JSON file not found: $INPUT_JSON" >&2
    exit 1
  fi
elif [[ -z "$MODERN_PULL_URL" || -z "$MODERN_CALLBACK_URL" ]]; then
  echo "Set INPUT_JSON (file mode) or MODERN_PULL_URL + MODERN_CALLBACK_URL (API mode)" >&2
  exit 1
fi

BASE="${CIS_BASE_URL%/}"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
COOKIE="$TMPDIR/cookie.txt"

api_headers=()
if [[ -n "$MODERN_API_KEY" ]]; then
  api_headers=(-H "Authorization: Bearer $MODERN_API_KEY")
fi

# Determine mode
FILE_MODE=false
if [[ -n "${INPUT_JSON:-}" ]]; then
  FILE_MODE=true
fi

post_callback() {
  local json_file="$1"
  curl -sS -X POST "${api_headers[@]}" \
    -H "Content-Type: application/json" \
    --data-binary "@$json_file" \
    "$MODERN_CALLBACK_URL" >/dev/null
}

login_cis() {
  local enc_password
  enc_password="$(printf '%s' "$CIS_PASSWORD" | openssl enc -aes-256-cbc -salt -md md5 -a -A -pass pass:myPassword 2>/dev/null)"
  local sessstore="$(date +%s)"

  curl -sS -c "$COOKIE" "$BASE/" >/dev/null
  curl -sS -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/loginajax1.php" \
    --data-urlencode "x=fetchdata" \
    --data-urlencode "est_code=$COURT_CODE" >/dev/null

  local login_json="$TMPDIR/login.json"
  curl -sS -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/loginajax1.php" \
    --data-urlencode "databasetype=$COURT_CODE" \
    --data-urlencode "username=$CIS_USER" \
    --data-urlencode "pass_word=$enc_password" \
    --data-urlencode "logindate=$LOGIN_DATE" \
    --data-urlencode "lang_id=$LANG_ID" \
    --data-urlencode "hidd_otp=" \
    --data-urlencode "x=loginuser" \
    --data-urlencode "cloud_flag=$CLOUD_FLAG" > "$login_json"

  "$PYTHON_BIN" - "$login_json" <<'PY'
import json, re, sys
s=open(sys.argv[1], encoding='utf-8', errors='ignore').read()
m=re.search(r'\{.*\}', s, re.S)
if not m:
    raise SystemExit('CIS login failed: no JSON')
d=json.loads(m.group(0))
if d.get('output') != 'yes':
    raise SystemExit(f'CIS login failed: {d}')
PY

  curl -sS -L -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/o_index1.php?sessstore=$sessstore" \
    --data-urlencode "databasetype=$COURT_CODE" \
    --data-urlencode "username=$CIS_USER" \
    --data-urlencode "pass_word=$enc_password" \
    --data-urlencode "logindate=$LOGIN_DATE" \
    --data-urlencode "lang_id=$LANG_ID" \
    --data-urlencode "hidd_otp=" >/dev/null
}

logout_cis() {
  # Call CIS logout endpoint; ignore failures because session may already be expired.
  curl -sS -b "$COOKIE" -c "$COOKIE" "$BASE/logout.php" >/dev/null 2>&1 || true
}

submit_cheque_to_cis() {
  local filing_json="$1"
  local form_html="$TMPDIR/filing_form.html"
  local post_data="$TMPDIR/cis_post_data.txt"
  local cis_response="$TMPDIR/cis_response.json"

  # Open the real filing page first so CIS initializes session/link context and CSRF token.
  curl -sS -b "$COOKIE" -c "$COOKIE" \
    "$BASE/filing/civil_filingnew.php?linkid=63&mode=0" > "$form_html"

  "$PYTHON_BIN" - "$form_html" "$filing_json" "$post_data" <<'PY'
import json, sys
from datetime import datetime
from html.parser import HTMLParser
from urllib.parse import urlencode

form_html, filing_json, post_data = sys.argv[1:]
record=json.load(open(filing_json, encoding='utf-8'))
html=open(form_html, encoding='utf-8', errors='ignore').read()

class FormParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_form=False; self.in_textarea=None; self.textarea_text=''; self.items=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag=='form' and attrs.get('id')=='frm': self.in_form=True
        if not self.in_form: return
        if tag=='input':
            name=attrs.get('name')
            if not name: return
            typ=(attrs.get('type') or '').lower()
            if typ in ('button','submit','reset','file','image'): return
            if typ in ('radio','checkbox') and 'checked' not in attrs: return
            self.items.append((name, attrs.get('value','')))
        elif tag=='select':
            self.current_select=attrs.get('name')
            self.current_select_value=''
        elif tag=='option' and getattr(self,'current_select',None) and not self.current_select_value:
            self.current_select_value=attrs.get('value','')
        elif tag=='textarea':
            self.in_textarea=attrs.get('name'); self.textarea_text=''
    def handle_data(self, data):
        if self.in_textarea: self.textarea_text += data
    def handle_endtag(self, tag):
        if tag=='select' and getattr(self,'current_select',None):
            self.items.append((self.current_select, self.current_select_value))
            self.current_select=None; self.current_select_value=''
        elif tag=='textarea' and self.in_textarea:
            self.items.append((self.in_textarea, self.textarea_text))
            self.in_textarea=None; self.textarea_text=''
        elif tag=='form' and self.in_form:
            self.in_form=False

p=FormParser(); p.feed(html)
base=[]
# Drop fields that we override. Keep CSRF and other hidden fields.
override_names=set([
 'formaction','civ_cri_cav','ftype_of_filing','facktype','ffiling_no_type','ffiling_no','ffiling_no_year',
 'fdate_of_filing','ftime_of_filing','fpet_name','flpet_name','fres_name','flres_name','fpet_sex','fres_sex',
 'fpet_age','fres_age','fpet_mobile','fres_mobile','fpetadd','fresadd','flpetadd','flresadd','fpet_add',
 'fres_add','flpet_add','flres_add','fjuri_value','famount','court_fee_amt','payment_mode','frelief_offense',
 'flrelief_offense','fcause_of_action','flcause_of_action','fcause_of_action_date','submitdata','globallinkid'
])
for k,v in p.items:
    if k not in override_names:
        base.append((k,v))

amount=str(record.get('cheque_amount') or record.get('amount') or '0')
complainant=record.get('complainant_name') or 'TEST COMPLAINANT'
accused=record.get('accused_name') or 'TEST ACCUSED'
complainant_local=record.get('complainant_local_name') or complainant
accused_local=record.get('accused_local_name') or accused
complainant_address=record.get('complainant_address') or ''
accused_address=record.get('accused_address') or ''
relief=record.get('relief') or 'Complaint under Section 138 of Negotiable Instruments Act.'
cause=record.get('cause_of_action') or 'Cheque dishonoured.'
if record.get('cheque_number'):
    cause += f" Cheque No: {record.get('cheque_number')}"
if record.get('cheque_date'):
    cause += f" Cheque Date: {record.get('cheque_date')}"
if record.get('dishonour_date'):
    cause += f" Dishonour Date: {record.get('dishonour_date')}"

now=datetime.now()
base += [
 ('formaction','1'), ('civ_cri_cav','3'), ('ftype_of_filing','3'), ('facktype','1'),
 ('ffiling_no_type','55'), ('ffiling_no',''), ('ffiling_no_year',str(record.get('filing_year') or now.year)),
 ('fdate_of_filing',record.get('filing_date') or now.strftime('%d-%m-%Y')), ('ftime_of_filing',record.get('filing_time') or now.strftime('%H:%M:%S')),
 ('fpet_name',complainant), ('flpet_name',complainant_local),
 ('fres_name',accused), ('flres_name',accused_local),
 ('fpet_sex',str(record.get('complainant_gender_code') or '1')),
 ('fres_sex',str(record.get('accused_gender_code') or '1')),
 ('fpet_age',str(record.get('complainant_age') or '35')),
 ('fres_age',str(record.get('accused_age') or '40')),
 ('fpet_mobile',str(record.get('complainant_mobile') or '')),
 ('fres_mobile',str(record.get('accused_mobile') or '')),
 ('fpetadd',complainant_address), ('fresadd',accused_address),
 ('flpetadd',record.get('complainant_local_address') or complainant_address),
 ('flresadd',record.get('accused_local_address') or accused_address),
 ('fpet_add',complainant_address), ('fres_add',accused_address),
 ('flpet_add',record.get('complainant_local_address') or complainant_address),
 ('flres_add',record.get('accused_local_address') or accused_address),
 ('fjuri_value',amount), ('famount',amount), ('court_fee_amt','0'), ('payment_mode','1'),
 ('frelief_offense',relief), ('flrelief_offense',record.get('local_relief') or relief),
 ('fcause_of_action',cause), ('flcause_of_action',record.get('local_cause_of_action') or cause),
 ('fcause_of_action_date',record.get('cause_of_action_date') or record.get('dishonour_date') or ''),
 ('submitdata','Submit'), ('globallinkid','63')
]
open(post_data,'w',encoding='utf-8').write(urlencode(base))
PY

  curl -sS -b "$COOKIE" -c "$COOKIE" -X POST \
    "$BASE/filing/civil_filingajaxnew.php" \
    --data-binary "@$post_data" > "$cis_response"

  "$PYTHON_BIN" - "$filing_json" "$cis_response" <<'PY'
import json, re, sys, html
record=json.load(open(sys.argv[1], encoding='utf-8'))
raw=open(sys.argv[2], encoding='utf-8', errors='ignore').read()
m=re.search(r'\{.*\}', raw, re.S)
if not m:
    raise SystemExit(f'CIS filing failed: no JSON: {raw[:300]}')
d=json.loads(m.group(0))
if d.get('success') != 'Y' or not d.get('cino'):
    raise SystemExit(f'CIS filing failed: {d}')
filing_text=html.unescape(d.get('printfilingno',''))
filing_no=''
fm=re.search(r'Filing No\.?:-?\s*(.*)$', filing_text)
if fm: filing_no=fm.group(1).strip()
out={
  'external_filing_id': record.get('external_filing_id'),
  'status': 'success',
  'court_code': record.get('court_code'),
  'cis_case_type': 'NACT',
  'cis_case_type_code': 55,
  'cis_filing_no': filing_no,
  'cis_cnr': d.get('cino'),
  'raw_cis_response': d
}
print(json.dumps(out, ensure_ascii=False))
PY
}

# Pull pending filings from modern app (API mode) or read from local file (file mode).
PENDING_JSON="$TMPDIR/pending.json"
if $FILE_MODE; then
  cp "$INPUT_JSON" "$PENDING_JSON"
else
  curl -sS "${api_headers[@]}" "$MODERN_PULL_URL" > "$PENDING_JSON"
fi

COUNT=$("$PYTHON_BIN" - "$PENDING_JSON" <<'PY'
import json, sys
d=json.load(open(sys.argv[1], encoding='utf-8'))
if not isinstance(d, list):
    raise SystemExit('Pull API must return a JSON array')
print(len(d))
PY
)

if [[ "$COUNT" == "0" ]]; then
  echo "No pending cheque filings."
  exit 0
fi

login_cis

for i in $(seq 0 $((COUNT-1))); do
  ITEM_JSON="$TMPDIR/item_$i.json"
  RESULT_JSON="$TMPDIR/result_$i.json"
  "$PYTHON_BIN" - "$PENDING_JSON" "$i" "$ITEM_JSON" <<'PY'
import json, sys
d=json.load(open(sys.argv[1], encoding='utf-8'))
idx=int(sys.argv[2])
json.dump(d[idx], open(sys.argv[3],'w',encoding='utf-8'), ensure_ascii=False)
PY

  if submit_cheque_to_cis "$ITEM_JSON" > "$RESULT_JSON"; then
    if $FILE_MODE; then
      : # skip callback — results collected at end
    else
      post_callback "$RESULT_JSON"
    fi
  else
    ERR="$TMPDIR/error_$i.json"
    "$PYTHON_BIN" - "$ITEM_JSON" "$ERR" <<'PY'
import json, sys, traceback
record=json.load(open(sys.argv[1], encoding='utf-8'))
out={
  'external_filing_id': record.get('external_filing_id'),
  'status': 'failed',
  'error': 'CIS submission failed; check bridge logs on court machine'
}
json.dump(out, open(sys.argv[2],'w',encoding='utf-8'), ensure_ascii=False)
PY
    if $FILE_MODE; then
      : # skip callback
    else
      post_callback "$ERR"
    fi
  fi
done

logout_cis
echo "CIS logout complete."

# In file mode, collect all results into a single output JSON file.
if $FILE_MODE && [[ -n "${OUTPUT_JSON:-}" ]]; then
  "$PYTHON_BIN" - "$TMPDIR" "$OUTPUT_JSON" <<'PY'
import json, os, glob, sys
results = []
for f in sorted(glob.glob(os.path.join(sys.argv[1], 'result_*.json'))):
    with open(f, encoding='utf-8') as fh:
        results.append(json.load(fh))
for f in sorted(glob.glob(os.path.join(sys.argv[1], 'error_*.json'))):
    with open(f, encoding='utf-8') as fh:
        results.append(json.load(fh))
with open(sys.argv[2], 'w', encoding='utf-8') as fh:
    json.dump(results, fh, ensure_ascii=False, indent=2)
print(f"Wrote {len(results)} results to {sys.argv[2]}")
PY
fi
