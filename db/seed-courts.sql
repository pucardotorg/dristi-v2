-- Court seed data generated for pucar-drishti-v2
-- Generated: 2026-07-01
-- Run after schema.sql: psql -d pucar -f db/seed-courts.sql

BEGIN;

-- Re-runnable court lookup seed. Does not delete rows because cases may reference courts.

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
  VALUES ('klcourt001', 'kl', '24x7 ON Court Chandigarh', 'KLCOURT001', 'MAGISTRATE', 'Chandigarh', true, '{"source":"seed-courts"}', 0, 0)
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    court_type = EXCLUDED.court_type,
    address = EXCLUDED.address,
    is_active = EXCLUDED.is_active,
    additional_details = EXCLUDED.additional_details,
    updated_at = 0;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
  VALUES ('default-court', 'kl', '24x7 ON Court Chandigarh', 'DEFAULT-COURT', 'MAGISTRATE', 'Chandigarh', true, '{"source":"seed-courts"}', 0, 0)
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    court_type = EXCLUDED.court_type,
    address = EXCLUDED.address,
    is_active = EXCLUDED.is_active,
    additional_details = EXCLUDED.additional_details,
    updated_at = 0;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
  VALUES ('klcourt002', 'kl', 'Chief Judicial Magistrate Chandigarh', 'KLCOURT002', 'MAGISTRATE', 'Chandigarh', true, '{"source":"seed-courts"}', 0, 0)
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    court_type = EXCLUDED.court_type,
    address = EXCLUDED.address,
    is_active = EXCLUDED.is_active,
    additional_details = EXCLUDED.additional_details,
    updated_at = 0;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
  VALUES ('klcourt003', 'kl', 'District Court Mohali', 'KLCOURT003', 'DISTRICT', 'Mohali, Punjab', true, '{"source":"seed-courts"}', 0, 0)
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    court_type = EXCLUDED.court_type,
    address = EXCLUDED.address,
    is_active = EXCLUDED.is_active,
    additional_details = EXCLUDED.additional_details,
    updated_at = 0;

COMMIT;
