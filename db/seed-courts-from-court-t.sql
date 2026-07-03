-- Court seed data extracted from D:/kamba/deltaxy/pucar/15-04-2026/court_t.csv
-- Target table: public.court
-- Re-runnable: updates existing rows by id.

BEGIN;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPKC001', 'kl', 'Court No. 16', 'HRPKC001', 'MAGISTRATE',
  'Establishment HRPK01, Room 16', true, '{"source":"court_t.csv","court_no":"16","room_no":"16","courtfiling":"N","noprefix":"0","principle_court":"Y","display":"Y","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":"HRPKC001","amd":"U","create_modify":"2018-05-13 15:36:42.221662","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1526225802221, 1526225802221
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPK01-COURT-17', 'kl', 'Court No. 17', 'HRPK01-COURT-17', 'MAGISTRATE',
  'Establishment HRPK01, Room 17', true, '{"source":"court_t.csv","court_no":"17","room_no":"17","courtfiling":"N","noprefix":"0","principle_court":"N","display":"N","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":null,"amd":null,"create_modify":"2018-05-12 12:43:36.003068","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1526129016003, 1526129016003
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPKC006', 'kl', 'Court No. 24', 'HRPKC006', 'MAGISTRATE',
  'Establishment HRPK01, Room 24', true, '{"source":"court_t.csv","court_no":"24","room_no":"24","courtfiling":"N","noprefix":"0","principle_court":"N","display":"Y","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":"HRPKC006","amd":"U","create_modify":"2018-05-13 16:27:20.578533","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1526228840578, 1526228840578
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPKC005', 'kl', 'Court No. 25', 'HRPKC005', 'MAGISTRATE',
  'Establishment HRPK01, Room 25', true, '{"source":"court_t.csv","court_no":"25","room_no":"25","courtfiling":"N","noprefix":"0","principle_court":"N","display":"Y","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":"HRPKC005","amd":"U","create_modify":"2018-05-13 16:06:16.53626","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1526227576536, 1526227576536
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPK01-COURT-34', 'kl', 'Court No. 34', 'HRPK01-COURT-34', 'MAGISTRATE',
  'Establishment HRPK01, Room 34', true, '{"source":"court_t.csv","court_no":"34","room_no":"34","courtfiling":"N","noprefix":"0","principle_court":"N","display":"Y","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":null,"amd":null,"create_modify":"2018-05-12 12:43:36.003068","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1526129016003, 1526129016003
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPKC004', 'kl', 'Court No. 36', 'HRPKC004', 'MAGISTRATE',
  'Establishment HRPK01, Room 36', true, '{"source":"court_t.csv","court_no":"36","room_no":"36","courtfiling":"N","noprefix":"0","principle_court":"N","display":"Y","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":"HRPKC004","amd":"U","create_modify":"2018-05-13 16:06:25.734811","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1526227585734, 1526227585734
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPKC002', 'kl', 'Court No. 37', 'HRPKC002', 'MAGISTRATE',
  'Establishment HRPK01, Room 37', true, '{"source":"court_t.csv","court_no":"37","room_no":"37","courtfiling":"N","noprefix":"0","principle_court":"N","display":"Y","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":"HRPKC002","amd":"U","create_modify":"2018-05-13 15:36:58.717495","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1526225818717, 1526225818717
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPKC003', 'kl', 'Court No. 38', 'HRPKC003', 'MAGISTRATE',
  'Establishment HRPK01, Room 38', true, '{"source":"court_t.csv","court_no":"38","room_no":"38","courtfiling":"N","noprefix":"0","principle_court":"N","display":"Y","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":"HRPKC003","amd":"U","create_modify":"2018-05-15 09:56:02.74855","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1526378162748, 1526378162748
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPK01-COURT-39', 'kl', 'Court No. 39', 'HRPK01-COURT-39', 'MAGISTRATE',
  'Establishment HRPK01, Room 3', true, '{"source":"court_t.csv","court_no":"39","room_no":"3","courtfiling":"N","noprefix":"0","principle_court":"N","display":"Y","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":null,"amd":"U","create_modify":"2019-01-03 10:59:55.14211","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1546513195142, 1546513195142
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPK01-COURT-40', 'kl', 'Court No. 40', 'HRPK01-COURT-40', 'MAGISTRATE',
  'Establishment HRPK01, Room 14', true, '{"source":"court_t.csv","court_no":"40","room_no":"14","courtfiling":"N","noprefix":"0","principle_court":"N","display":"Y","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":null,"amd":null,"create_modify":"2019-10-16 12:18:26.097523","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1571228306097, 1571228306097
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPK01-COURT-41', 'kl', 'Court No. 41', 'HRPK01-COURT-41', 'MAGISTRATE',
  'Establishment HRPK01, Room 9', true, '{"source":"court_t.csv","court_no":"41","room_no":"9","courtfiling":"N","noprefix":"0","principle_court":"N","display":"Y","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":null,"amd":null,"create_modify":"2025-04-25 09:39:12.870541","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1745573952870, 1745573952870
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

INSERT INTO court (id, tenant_id, name, code, court_type, address, is_active, additional_details, created_at, updated_at)
VALUES (
  'HRPK01-COURT-42', 'kl', 'Court No. 42', 'HRPK01-COURT-42', 'MAGISTRATE',
  'Establishment HRPK01, Room 42', true, '{"source":"court_t.csv","court_no":"42","room_no":"42","courtfiling":"N","noprefix":"0","principle_court":"N","display":"Y","bench_type_code":"0","bench_desc":null,"bench_section":"B","cfrom_dt":null,"cto_dt":null,"case_types":null,"source_court_id":null,"roaster_desc":null,"unique_court":null,"amd":null,"create_modify":"2025-11-03 12:39:19.97433","est_code_src":"HRPK01","active_court":"Y"}'::jsonb,
  1762173559974, 1762173559974
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  court_type = EXCLUDED.court_type,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active,
  additional_details = EXCLUDED.additional_details,
  updated_at = EXCLUDED.updated_at;

COMMIT;
