#!/usr/bin/env bash
set -uo pipefail
BASE="http://localhost/swecourtis"
COURT_CODE="HRPK02"
CIS_USER="supuser"
CIS_PASSWORD="court123"
LOGIN_DATE="$(date +%d-%m-%Y)"
TMPDIR="$(mktemp -d)"
COOKIE="$TMPDIR/cookie.txt"
ENC_PASSWORD="$(printf '%s' "$CIS_PASSWORD" | openssl enc -aes-256-cbc -salt -md md5 -a -A -pass pass:myPassword 2>/dev/null)"

PSQL="docker compose -f /opt/cis/docker-deploy/docker-compose.yml exec -T db psql -U postgres"

echo "=== Clearing login lock ==="
cd /opt/cis/docker-deploy && $PSQL -d ecourtisuserdb -c "UPDATE users SET sessionuser='', ip='', password_change_date=current_date WHERE username='$CIS_USER';" >/dev/null

curl -sS -c "$COOKIE" "$BASE/" >/dev/null
curl -sS -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/loginajax1.php" \
  --data-urlencode "x=fetchdata" --data-urlencode "est_code=$COURT_CODE" >/dev/null
curl -sS -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/loginajax1.php" \
  --data-urlencode "databasetype=$COURT_CODE" \
  --data-urlencode "username=$CIS_USER" \
  --data-urlencode "pass_word=$ENC_PASSWORD" \
  --data-urlencode "logindate=$LOGIN_DATE" \
  --data-urlencode "lang_id=0" \
  --data-urlencode "hidd_otp=" \
  --data-urlencode "x=loginuser" \
  --data-urlencode "cloud_flag=N" >/dev/null

SESSSTORE="$(date +%s)"
curl -sS -L -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/o_index1.php?sessstore=$SESSSTORE" \
  --data-urlencode "databasetype=$COURT_CODE" \
  --data-urlencode "username=$CIS_USER" \
  --data-urlencode "pass_word=$ENC_PASSWORD" \
  --data-urlencode "logindate=$LOGIN_DATE" \
  --data-urlencode "lang_id=0" \
  --data-urlencode "hidd_otp=" >/dev/null

curl -sS -b "$COOKIE" -c "$COOKIE" "$BASE/filing/civil_filingnew.php?linkid=63&mode=0" > "$TMPDIR/form.html"

cat > "$TMPDIR/record.json" <<'JSON'
{
  "external_filing_id": "TESTCHQ",
  "complainant_name": "ABC TRADERS",
  "complainant_local_name": "एबीसी ट्रेडर्स",
  "accused_name": "RAJ KUMAR",
  "accused_local_name": "राज कुमार",
  "complainant_address": "Shop No. 1, Panchkula",
  "accused_address": "House No. 2, Panchkula",
  "complainant_mobile": "9999999999",
  "accused_mobile": "8888888888",
  "cheque_amount": "100000",
  "cheque_number": "123456",
  "cheque_date": "01-06-2026",
  "dishonour_date": "05-06-2026",
  "cause_of_action": "Cheque dishonoured due to insufficient funds.",
  "relief": "Complaint under Section 138 of Negotiable Instruments Act."
}
JSON

python3 - "$TMPDIR/form.html" "$TMPDIR/record.json" "$TMPDIR/post_data.txt" <<'PY'
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

amount=str(record.get('cheque_amount') or '0')
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

echo "=== Submitting test cheque filing to CIS ==="
curl -sS -b "$COOKIE" -c "$COOKIE" -X POST \
  "$BASE/filing/civil_filingajaxnew.php" \
  --data-binary "@$TMPDIR/post_data.txt" > "$TMPDIR/cis_response.json"

cat "$TMPDIR/cis_response.json"
echo ""

NEW_CNR=$(python3 - "$TMPDIR/cis_response.json" <<'PY' | tail -1
import json, re, sys, html
raw=open(sys.argv[1], encoding='utf-8', errors='ignore').read()
m=re.search(r'\{.*\}', raw, re.S)
if not m:
    print('')
    sys.exit(0)
d=json.loads(m.group(0))
if d.get('success') == 'Y' and d.get('cino'):
    print(d.get('cino'))
else:
    print('')
PY
)

if [ -n "$NEW_CNR" ]; then
  echo "=== New test case CNR: $NEW_CNR ==="
else
  echo "=== Failed to get CNR, skipping cleanup of new case ==="
fi

echo "=== Cleaning up test cases ==="
KNOWN_CNRS="'HRPK020006862026', 'HRPK020006872026'"
if [ -n "$NEW_CNR" ]; then
  KNOWN_CNRS="$KNOWN_CNRS, '$NEW_CNR'"
fi

$PSQL -d pklcjsd <<SQL
DELETE FROM civil_t WHERE cino IN ($KNOWN_CNRS);
DELETE FROM ecivil_t WHERE efilno LIKE 'TEST%' OR cino IN ($KNOWN_CNRS);
SQL

echo "=== Verifying cleanup ==="
$PSQL -d pklcjsd -c "SELECT cino FROM civil_t WHERE cino IN ($KNOWN_CNRS);"
$PSQL -d pklcjsd -c "SELECT efilno FROM ecivil_t WHERE efilno LIKE 'TEST%' OR cino IN ($KNOWN_CNRS);"

echo "=== Logging out of CIS ==="
curl -sS -b "$COOKIE" -c "$COOKIE" "$BASE/logout.php" -o /dev/null -w "Logout HTTP: %{http_code}\n"

echo "=== Done ==="
