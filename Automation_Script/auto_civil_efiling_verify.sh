#!/usr/bin/env bash
set -euo pipefail

# Creates one pending Civil e-filing in ecivil_t, logs into CIS, verifies it,
# and prints the generated Filing No. / CNR No.
#
# Required tools: psql, curl, openssl, python3 (or python via PYTHON_BIN)
#
# Configure with environment variables, for example:
#   CIS_BASE_URL="http://localhost:8080/swecourtis" \
#   COURT_CODE="HRPK02" COURT_DB="pklcjsd" \
#   CIS_USER="supuser" CIS_PASSWORD="court123" \
#   DB_HOST="localhost" DB_USER="postgres" DB_PASSWORD="" \
#   bash scripts/auto_civil_efiling_verify.sh
#
# For local Docker in this repo, you may use:
#   PSQL_CMD="docker compose -f docker-deploy/docker-compose.yml exec -T web psql -h db -U postgres" \
#   bash scripts/auto_civil_efiling_verify.sh

CIS_BASE_URL="${CIS_BASE_URL:-http://localhost:8080/swecourtis}"
COURT_CODE="${COURT_CODE:-HRPK02}"
COURT_DB="${COURT_DB:-pklcjsd}"
USER_DB="${USER_DB:-ecourtisuserdb}"

CIS_USER="${CIS_USER:-supuser}"
CIS_PASSWORD="${CIS_PASSWORD:-court123}"
LOGIN_DATE="${LOGIN_DATE:-$(date +%d-%m-%Y)}"
LANG_ID="${LANG_ID:-0}"
CLOUD_FLAG="${CLOUD_FLAG:-N}"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

EFILNO="${EFILNO:-TESTCIV$(date +%Y%m%d%H%M%S)}"
PET_NAME="${PET_NAME:-Test Civil Petitioner}"
RES_NAME="${RES_NAME:-Test Civil Respondent}"

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }
}
need curl
need openssl
PYTHON_BIN="${PYTHON_BIN:-}"
if [[ -z "$PYTHON_BIN" ]]; then
  if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
  elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "Missing required command: python3 (or set PYTHON_BIN)" >&2
    exit 1
  fi
fi
if [[ -z "${PSQL_CMD:-}" ]]; then
  need psql
fi

run_psql() {
  local db="$1"
  if [[ -n "${PSQL_CMD:-}" ]]; then
    # shellcheck disable=SC2086
    $PSQL_CMD -d "$db"
  else
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db"
  fi
}

echo "Creating pending Civil e-filing: $EFILNO in DB: $COURT_DB"
run_psql "$COURT_DB" <<SQL
INSERT INTO ecivil_t (
    efilno, efil_dt, final_submitted_on, consumed_on,
    ci_cri, casetype_name, maincasetype_name,
    pet_name, res_name, pet_sex, res_sex,
    petadd, resadd, pet_age, res_age,
    pet_mobile, res_mobile,
    orgid, resorgid,
    filcase_type, regcase_type, filing_case,
    efiling_type, date_of_filing, time_of_filing,
    causeofaction, relief_offense, urgent,
    court_no, file_before, amount, juri_value,
    case_state_code, case_dist_code, case_taluka_code, case_village_code
)
VALUES (
    '$EFILNO', current_date, now(), now(),
    2, 'CS', 'CIVIL SUIT',
    '$PET_NAME', '$RES_NAME', '1', '1',
    'Test petitioner address', 'Test respondent address', 35, 40,
    '9999999999', '8888888888',
    -99, -99,
    4, 4, 4,
    'P', current_date, current_time,
    'Synthetic test civil e-filing case for CIS verification.',
    'Test relief for verification only.', 'N',
    0, 0, 0, '0',
    0, 0, 0, 0
);
SQL

# Clear stale login lock if the user DB is accessible.
echo "Clearing stale CIS login lock for user: $CIS_USER"
run_psql "$USER_DB" <<SQL || true
UPDATE users
SET sessionuser = '',
    ip = '',
    password_change_date = current_date
WHERE username = '$CIS_USER';
SQL

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT
COOKIE="$TMPDIR/cookie.txt"

# CIS login JavaScript uses CryptoJS.AES.encrypt(password, 'myPassword').
# OpenSSL salted AES-256-CBC with MD5 key derivation is compatible.
ENC_PASSWORD="$(printf '%s' "$CIS_PASSWORD" | openssl enc -aes-256-cbc -salt -md md5 -a -A -pass pass:myPassword 2>/dev/null)"

BASE="${CIS_BASE_URL%/}"
SESSSTORE="$(date +%s)"

echo "Logging into CIS: $BASE court=$COURT_CODE user=$CIS_USER"
curl -sS -c "$COOKIE" "$BASE/" >/dev/null
curl -sS -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/loginajax1.php" \
  --data-urlencode "x=fetchdata" \
  --data-urlencode "est_code=$COURT_CODE" >/dev/null

LOGIN_JSON="$TMPDIR/login.json"
curl -sS -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/loginajax1.php" \
  --data-urlencode "databasetype=$COURT_CODE" \
  --data-urlencode "username=$CIS_USER" \
  --data-urlencode "pass_word=$ENC_PASSWORD" \
  --data-urlencode "logindate=$LOGIN_DATE" \
  --data-urlencode "lang_id=$LANG_ID" \
  --data-urlencode "hidd_otp=" \
  --data-urlencode "x=loginuser" \
  --data-urlencode "cloud_flag=$CLOUD_FLAG" > "$LOGIN_JSON"

"$PYTHON_BIN" - "$LOGIN_JSON" <<'PY'
import json, re, sys
s=open(sys.argv[1], encoding='utf-8', errors='ignore').read()
m=re.search(r'\{.*\}', s, re.S)
if not m:
    raise SystemExit(f'Login did not return JSON: {s[:300]}')
d=json.loads(m.group(0))
if d.get('output') != 'yes':
    raise SystemExit(f'Login failed: {d}')
PY

curl -sS -L -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/o_index1.php?sessstore=$SESSSTORE" \
  --data-urlencode "databasetype=$COURT_CODE" \
  --data-urlencode "username=$CIS_USER" \
  --data-urlencode "pass_word=$ENC_PASSWORD" \
  --data-urlencode "logindate=$LOGIN_DATE" \
  --data-urlencode "lang_id=$LANG_ID" \
  --data-urlencode "hidd_otp=" >/dev/null

# Open the e-filing page and details first; this initializes session variables used by verify.
echo "Opening Verify e-Filing page and loading e-filing details"
curl -sS -b "$COOKIE" -c "$COOKIE" "$BASE/efilingpde/efiling.php?linkid=463&difflinkid=789&mode=0" >/dev/null
curl -sS -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/efilingpde/efilingajax.php" \
  --data-urlencode "x=showefiling" \
  --data-urlencode "efiling_no=$EFILNO" > "$TMPDIR/showefiling.json"

MOVE_JSON="$TMPDIR/move.json"
echo "Submitting Verify action"
curl -sS -b "$COOKIE" -c "$COOKIE" -X POST "$BASE/efilingpde/efilingajax.php" \
  --data-urlencode "x=moveefiling" \
  --data-urlencode "efiling_no_common=$EFILNO" \
  --data-urlencode "efiling_verify=Y" \
  --data-urlencode "efiling_no=$EFILNO" \
  --data-urlencode "efiling_flag=Y" \
  --data-urlencode "ftime_of_filing=$(date +%H:%M:%S)" \
  --data-urlencode "mod=0" \
  --data-urlencode "caveat_flag=N" \
  --data-urlencode "formaction=1" \
  --data-urlencode "efiling_confirm=Y" \
  --data-urlencode "ftype_of_filing=1" \
  --data-urlencode "reject_remark=" > "$MOVE_JSON"

"$PYTHON_BIN" - "$MOVE_JSON" "$EFILNO" <<'PY'
import html, json, re, sys
s=open(sys.argv[1], encoding='utf-8', errors='ignore').read()
efilno=sys.argv[2]
m=re.search(r'\{.*\}', s, re.S)
if not m:
    raise SystemExit(f'Verify did not return JSON. Raw response: {s[:500]}')
d=json.loads(m.group(0))
msg=html.unescape(d.get('msg2') or d.get('msg1') or '')
if 'Case Filed successfully' not in msg or not d.get('cino'):
    raise SystemExit(f'Verify failed for {efilno}: {d}')
filing=''
fm=re.search(r'Filing No\.\s*:\s*([^<\n]+)', msg, re.I)
if fm:
    filing=fm.group(1).strip()
print('SUCCESS')
print(f'E-Filing No.: {efilno}')
print(f'CNR No.: {d.get("cino")}')
if filing:
    print(f'Filing No.: {filing}')
print('Raw message:')
print(msg.replace('<br/>', '\n').replace('<br>', '\n'))
PY

# Log out of CIS to release the session.
curl -sS -b "$COOKIE" -c "$COOKIE" "$BASE/logout.php" >/dev/null 2>&1 || true
