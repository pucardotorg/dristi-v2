# Automated Civil e-Filing Test: SQL + CIS Verify

This package uses Option 2:

1. Insert one pending Civil e-filing into the target Civil court database.
2. Login to CIS with curl.
3. Submit the CIS `Verify e-Filing Cases` action.
4. Print the generated Filing No. and CNR No.

Script:

```text
scripts/auto_civil_efiling_verify.sh
```

## Requirements

Run from a machine that can access both:

- PostgreSQL court database
- CIS web URL

Required commands:

```text
psql
curl
openssl
python3
```

## Example

```bash
CIS_BASE_URL="http://<cis-host>/swecourtis" \
COURT_CODE="HRPK02" \
COURT_DB="pklcjsd" \
CIS_USER="supuser" \
CIS_PASSWORD="court123" \
DB_HOST="<postgres-host>" \
DB_PORT="5432" \
DB_USER="postgres" \
DB_PASSWORD="<postgres-password>" \
bash scripts/auto_civil_efiling_verify.sh
```

## Expected output

```text
SUCCESS
E-Filing No.: TESTCIV20260611123456
CNR No.: HRPK020006862026
Filing No.: /690/2026
```

## Important notes

- The script does not manually create the CNR by SQL.
- SQL creates only the pending e-filing row in `ecivil_t`.
- CIS generates the Filing No. and CNR during the verify action.
- Run on test/training database unless creating a real Filing No./CNR is acceptable.

## Config variables

| Variable | Purpose | Example |
|---|---|---|
| `CIS_BASE_URL` | CIS application URL | `http://localhost:8080/swecourtis` |
| `COURT_CODE` | Establishment/court code | `HRPK02` |
| `COURT_DB` | Civil court database | `pklcjsd` |
| `USER_DB` | User database | `ecourtisuserdb` |
| `CIS_USER` | CIS login user | `supuser` |
| `CIS_PASSWORD` | CIS login password | `court123` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | empty or password |
| `EFILNO` | Optional fixed e-filing number | `TESTCIV001` |
