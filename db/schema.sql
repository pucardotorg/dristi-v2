-- =============================================================================
-- pucar-drishti-v2 — PostgreSQL schema
-- Derived from dristi-solutions microservice schemas, consolidated for a
-- single-application multi-tenant deployment.
--
-- Table creation order respects FK dependencies:
--   court → judge → individual → address → individual_identifier
--   → filestore → advocate → advocate_document
--   → "case" → lock → case_statutes_sections → case_litigant
--   → case_representative → case_representative_litigant
--   → case_poa_holder → case_document → evidence_artifact
--   → demand → demand_detail → payment → payment_detail
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- COURT
-- Courts are MDMS master data in dristi-solutions (eg_mdms_data rows with
-- schemacode='court.Court'). In v2 (no MDMS service) they live here.
-- ---------------------------------------------------------------------------
CREATE TABLE court (
  id                 VARCHAR(64)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64)  NOT NULL,
  name               VARCHAR(256) NOT NULL,
  code               VARCHAR(64)  NOT NULL,
  court_type         VARCHAR(64),           -- 'DISTRICT' | 'SESSIONS' | 'MAGISTRATE'
  address            VARCHAR(512),
  is_active          BOOLEAN      DEFAULT TRUE,
  additional_details JSONB,
  created_at         BIGINT       NOT NULL,
  updated_at         BIGINT       NOT NULL,
  UNIQUE (tenant_id, code)
);

-- ---------------------------------------------------------------------------
-- JUDGE
-- Judges are MDMS master data in dristi-solutions. Stored locally in v2.
-- ---------------------------------------------------------------------------
CREATE TABLE judge (
  id                 VARCHAR(64)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64)  NOT NULL,
  court_id           VARCHAR(64)  REFERENCES court(id),
  name               VARCHAR(256) NOT NULL,
  designation        VARCHAR(128),
  is_active          BOOLEAN      DEFAULT TRUE,
  additional_details JSONB,
  created_at         BIGINT       NOT NULL,
  updated_at         BIGINT       NOT NULL
);

CREATE INDEX idx_judge_court_id  ON judge(court_id);
CREATE INDEX idx_judge_tenant_id ON judge(tenant_id);

-- ---------------------------------------------------------------------------
-- INDIVIDUAL
-- Person record shared by complainants, accused, advocates, PoA holders.
-- Derived from digit-services/individual INDIVIDUAL table.
-- ---------------------------------------------------------------------------
CREATE TABLE individual (
  id                 VARCHAR(64)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64)  NOT NULL,
  given_name         VARCHAR(200) NOT NULL,
  family_name        VARCHAR(200),
  other_names        VARCHAR(200),
  date_of_birth      DATE,
  gender             VARCHAR(20),
  mobile_number      VARCHAR(50),
  email              VARCHAR(200),
  father_name        VARCHAR(100),
  photo              TEXT,
  additional_details JSONB,
  created_at         BIGINT       NOT NULL,
  updated_at         BIGINT       NOT NULL
);

CREATE INDEX idx_individual_tenant_id    ON individual(tenant_id);
CREATE INDEX idx_individual_mobile       ON individual(mobile_number);
CREATE INDEX idx_individual_email        ON individual(email);
CREATE INDEX idx_individual_given_name   ON individual(given_name);
CREATE INDEX idx_individual_family_name  ON individual(family_name);

-- ---------------------------------------------------------------------------
-- ADDRESS
-- Permanent / present / PoA addresses for an individual.
-- Derived from digit-services/individual ADDRESS + INDIVIDUAL_ADDRESS tables.
-- address_type: 'PERMANENT' | 'PRESENT' | 'POA_PERMANENT' | 'POA_PRESENT'
-- ---------------------------------------------------------------------------
CREATE TABLE address (
  id             VARCHAR(64)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id      VARCHAR(64)  NOT NULL,
  individual_id  VARCHAR(64)  NOT NULL REFERENCES individual(id),
  address_type   VARCHAR(32)  NOT NULL,
  address_line   VARCHAR(512),
  pincode        VARCHAR(10),
  district       VARCHAR(100),
  state          VARCHAR(100),
  country        VARCHAR(50)  DEFAULT 'India',
  geo            VARCHAR(100),
  police_station VARCHAR(100),
  created_at     BIGINT       NOT NULL,
  updated_at     BIGINT       NOT NULL
);

CREATE INDEX idx_address_individual_id ON address(individual_id);
CREATE INDEX idx_address_tenant_id     ON address(tenant_id);

-- ---------------------------------------------------------------------------
-- INDIVIDUAL_IDENTIFIER
-- Aadhaar, PAN, Voter ID, bar registration number, etc.
-- Derived from digit-services/individual INDIVIDUAL_IDENTIFIER table.
-- identifier_type: 'AADHAAR' | 'PAN' | 'BAR_NUMBER' | 'VOTER_ID' | 'PASSPORT'
-- ---------------------------------------------------------------------------
CREATE TABLE individual_identifier (
  id              VARCHAR(64)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id       VARCHAR(64)  NOT NULL,
  individual_id   VARCHAR(64)  NOT NULL REFERENCES individual(id),
  identifier_type VARCHAR(64)  NOT NULL,
  identifier_id   VARCHAR(256) NOT NULL,
  created_at      BIGINT       NOT NULL,
  updated_at      BIGINT       NOT NULL
);

CREATE INDEX idx_indiv_identifier_individual  ON individual_identifier(individual_id);
CREATE INDEX idx_indiv_identifier_type_id     ON individual_identifier(identifier_type, identifier_id);
CREATE INDEX idx_indiv_identifier_tenant      ON individual_identifier(tenant_id);

-- ---------------------------------------------------------------------------
-- FILESTORE
-- Uploaded document registry.
-- Derived from digit-services/egov-filestore eg_filestoremap table.
-- module: 'case' | 'evidence' | 'advocate' | 'affidavit' | 'sign'
-- file_source: 'S3' | 'LOCAL' | 'MINIO'
-- ---------------------------------------------------------------------------
CREATE TABLE filestore (
  id           VARCHAR(64)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id    VARCHAR(64)  NOT NULL,
  filename     VARCHAR(256) NOT NULL,
  content_type VARCHAR(100),
  module       VARCHAR(100),
  file_source  VARCHAR(64),
  is_deleted   BOOLEAN      DEFAULT FALSE,
  created_at   BIGINT       NOT NULL,
  updated_at   BIGINT       NOT NULL
);

CREATE INDEX idx_filestore_tenant_id ON filestore(tenant_id);
CREATE INDEX idx_filestore_module    ON filestore(module);

-- ---------------------------------------------------------------------------
-- ADVOCATE
-- Enrolled advocate record. bar_registration_number unique per tenant.
-- Derived from dristi-services/advocate dristi_advocate table.
-- advocate_type: 'ADVOCATE' | 'ADVOCATE_CLERK'
-- status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
-- ---------------------------------------------------------------------------
CREATE TABLE advocate (
  id                      VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id               VARCHAR(64) NOT NULL,
  individual_id           VARCHAR(64) REFERENCES individual(id),
  bar_registration_number VARCHAR(64) NOT NULL,
  advocate_type           VARCHAR(64),
  status                  VARCHAR(64),
  additional_details      JSONB,
  created_at              BIGINT      NOT NULL,
  updated_at              BIGINT      NOT NULL,
  UNIQUE (tenant_id, bar_registration_number)
);

CREATE INDEX idx_advocate_individual  ON advocate(individual_id);
CREATE INDEX idx_advocate_tenant_id   ON advocate(tenant_id);
CREATE INDEX idx_advocate_bar_number  ON advocate(bar_registration_number);
CREATE INDEX idx_advocate_status      ON advocate(status);

-- ---------------------------------------------------------------------------
-- ADVOCATE_DOCUMENT
-- Vakalatnama and other advocate-related documents.
-- Derived from dristi-services/advocate dristi_document table.
-- document_type: 'VAKALAT' | 'BAR_CERTIFICATE' | 'ID_PROOF'
-- ---------------------------------------------------------------------------
CREATE TABLE advocate_document (
  id                 VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64) NOT NULL,
  advocate_id        VARCHAR(64) NOT NULL REFERENCES advocate(id),
  filestore_id       VARCHAR(64) REFERENCES filestore(id),
  document_uid       VARCHAR(64),
  document_type      VARCHAR(64),
  additional_details JSONB,
  created_at         BIGINT      NOT NULL,
  updated_at         BIGINT      NOT NULL
);

CREATE INDEX idx_advocate_doc_advocate_id ON advocate_document(advocate_id);
CREATE INDEX idx_advocate_doc_tenant_id   ON advocate_document(tenant_id);

-- ---------------------------------------------------------------------------
-- CASE
-- Core case record. One row per e-filing. court_id / judge_id reference
-- local lookup tables (not MDMS as in dristi-solutions).
-- Derived from dristi-services/case dristi_cases table.
--
-- status lifecycle:
--   DRAFT → PENDING_PAYMENT → PENDING_ESIGN → PENDING_REVIEW
--   → SUBMITTED → REGISTERED → ADMITTED → DISPOSED
--
-- case_details JSONB stores semi-structured filing data (cheques, demands,
-- jurisdiction, ADR) matching the wizard's FilingData shape — queried as a
-- unit, no need for separate normalized tables at filing scope.
-- ---------------------------------------------------------------------------
CREATE TABLE "case" (
  id                 VARCHAR(64)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64)   NOT NULL,
  filing_number      VARCHAR(64),
  cnr_number         VARCHAR(64),
  case_title         VARCHAR(1000),
  case_type          VARCHAR(64)   DEFAULT 'NI_ACT_138',
  case_category      VARCHAR(64),
  court_id           VARCHAR(64)   REFERENCES court(id),
  judge_id           VARCHAR(64)   REFERENCES judge(id),
  status             VARCHAR(64)   NOT NULL DEFAULT 'DRAFT',
  filing_date        BIGINT,
  registration_date  BIGINT,
  nature_of_pleading VARCHAR(64),
  stage              VARCHAR(64),
  substage           VARCHAR(64),
  lifecycle_status   VARCHAR(32)   DEFAULT 'ACTIVE',
  case_details       JSONB,
  additional_details JSONB,
  created_by         VARCHAR(64),  -- individual.id of primary complainant
  created_at         BIGINT        NOT NULL,
  updated_at         BIGINT        NOT NULL,
  UNIQUE (tenant_id, filing_number),
  UNIQUE (tenant_id, cnr_number)
);

CREATE INDEX idx_case_tenant_id       ON "case"(tenant_id);
CREATE INDEX idx_case_filing_number   ON "case"(filing_number);
CREATE INDEX idx_case_cnr_number      ON "case"(cnr_number);
CREATE INDEX idx_case_status          ON "case"(status);
CREATE INDEX idx_case_created_by      ON "case"(created_by);
CREATE INDEX idx_case_court_id        ON "case"(court_id);
CREATE INDEX idx_case_judge_id        ON "case"(judge_id);
CREATE INDEX idx_case_filing_date     ON "case"(filing_date);

-- ---------------------------------------------------------------------------
-- LOCK
-- Prevents concurrent edits to the same case draft.
-- Derived from dristi-services/lock-svc public.lock table.
-- entity: 'CASE' | 'APPLICATION'
-- ---------------------------------------------------------------------------
CREATE TABLE lock (
  id                VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id         VARCHAR(64),
  entity            VARCHAR(64),
  unique_id         VARCHAR(64),   -- case.id being locked
  individual_id     VARCHAR(64),   -- individual holding the lock
  user_id           VARCHAR(64),
  is_locked         BOOLEAN     DEFAULT TRUE,
  lock_type         VARCHAR(64),
  lock_date         BIGINT,
  lock_release_time BIGINT,
  created_by        VARCHAR(64),
  created_at        BIGINT      NOT NULL,
  updated_at        BIGINT      NOT NULL
);

CREATE INDEX idx_lock_unique_id   ON lock(unique_id);
CREATE INDEX idx_lock_tenant_id   ON lock(tenant_id);
CREATE INDEX idx_lock_is_locked   ON lock(is_locked);

-- ---------------------------------------------------------------------------
-- CASE_STATUTES_SECTIONS
-- Acts and sections under which the case is filed (e.g. NI Act s.138).
-- Derived from dristi-services/case dristi_case_statutes_and_sections table.
-- ---------------------------------------------------------------------------
CREATE TABLE case_statutes_sections (
  id                 VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64) NOT NULL,
  case_id            VARCHAR(64) NOT NULL REFERENCES "case"(id),
  statutes           VARCHAR(64),
  sections           VARCHAR(64),
  subsections        VARCHAR(64),
  additional_details JSONB,
  created_at         BIGINT      NOT NULL,
  updated_at         BIGINT      NOT NULL
);

CREATE INDEX idx_case_statutes_case_id  ON case_statutes_sections(case_id);
CREATE INDEX idx_case_statutes_statute  ON case_statutes_sections(statutes);

-- ---------------------------------------------------------------------------
-- CASE_LITIGANT
-- Complainants and accused parties linked to a case.
-- Derived from dristi-services/case dristi_case_litigants table.
-- party_type: 'COMPLAINANT' | 'ACCUSED'
-- party_category: 'INDIVIDUAL' | 'ENTITY'
-- ---------------------------------------------------------------------------
CREATE TABLE case_litigant (
  id                 VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64) NOT NULL,
  case_id            VARCHAR(64) NOT NULL REFERENCES "case"(id),
  individual_id      VARCHAR(64) REFERENCES individual(id),
  party_type         VARCHAR(64) NOT NULL,
  party_category     VARCHAR(64),
  has_signed         BOOLEAN     DEFAULT FALSE,
  is_active          BOOLEAN     DEFAULT TRUE,
  additional_details JSONB,
  created_at         BIGINT      NOT NULL,
  updated_at         BIGINT      NOT NULL
);

CREATE INDEX idx_case_litigant_case_id       ON case_litigant(case_id);
CREATE INDEX idx_case_litigant_individual_id ON case_litigant(individual_id);
CREATE INDEX idx_case_litigant_party_type    ON case_litigant(party_type);
CREATE INDEX idx_case_litigant_tenant_id     ON case_litigant(tenant_id);

-- ---------------------------------------------------------------------------
-- CASE_REPRESENTATIVE
-- Advocate representing one or more litigants in a case.
-- Derived from dristi-services/case dristi_case_representatives table.
-- filing_status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
-- ---------------------------------------------------------------------------
CREATE TABLE case_representative (
  id                 VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64) NOT NULL,
  case_id            VARCHAR(64) NOT NULL REFERENCES "case"(id),
  advocate_id        VARCHAR(64) NOT NULL REFERENCES advocate(id),
  filing_status      VARCHAR(64),
  has_signed         BOOLEAN     DEFAULT FALSE,
  is_active          BOOLEAN     DEFAULT TRUE,
  additional_details JSONB,
  created_at         BIGINT      NOT NULL,
  updated_at         BIGINT      NOT NULL
);

CREATE INDEX idx_case_rep_case_id     ON case_representative(case_id);
CREATE INDEX idx_case_rep_advocate_id ON case_representative(advocate_id);
CREATE INDEX idx_case_rep_tenant_id   ON case_representative(tenant_id);

-- ---------------------------------------------------------------------------
-- CASE_REPRESENTATIVE_LITIGANT
-- Which litigants a representative covers in a case.
-- Derived from dristi-services/case dristi_case_representing table.
-- ---------------------------------------------------------------------------
CREATE TABLE case_representative_litigant (
  id                     VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id              VARCHAR(64) NOT NULL,
  case_representative_id VARCHAR(64) NOT NULL REFERENCES case_representative(id),
  case_litigant_id       VARCHAR(64) NOT NULL REFERENCES case_litigant(id),
  created_at             BIGINT      NOT NULL,
  UNIQUE (case_representative_id, case_litigant_id)
);

CREATE INDEX idx_case_rep_lit_rep_id ON case_representative_litigant(case_representative_id);
CREATE INDEX idx_case_rep_lit_lit_id ON case_representative_litigant(case_litigant_id);

-- ---------------------------------------------------------------------------
-- CASE_POA_HOLDER
-- Power of Attorney holder acting on behalf of a complainant.
-- Derived from dristi-services/case dristi_case_poaholders table.
-- poa_type: 'GENERAL' | 'SPECIFIC'
-- representing_litigants: JSON array of case_litigant.id values
-- ---------------------------------------------------------------------------
CREATE TABLE case_poa_holder (
  id                     VARCHAR(64)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id              VARCHAR(64)  NOT NULL,
  case_id                VARCHAR(64)  NOT NULL REFERENCES "case"(id),
  individual_id          VARCHAR(64)  REFERENCES individual(id),
  poa_type               VARCHAR(128) NOT NULL,
  name                   VARCHAR(256),
  has_signed             BOOLEAN      DEFAULT FALSE,
  is_active              BOOLEAN      DEFAULT TRUE,
  representing_litigants JSONB,
  additional_details     JSONB,
  created_at             BIGINT       NOT NULL,
  updated_at             BIGINT       NOT NULL
);

CREATE INDEX idx_case_poa_case_id      ON case_poa_holder(case_id);
CREATE INDEX idx_case_poa_individual   ON case_poa_holder(individual_id);
CREATE INDEX idx_case_poa_tenant_id    ON case_poa_holder(tenant_id);

-- ---------------------------------------------------------------------------
-- CASE_DOCUMENT
-- All documents attached to a case filing.
-- Derived from dristi-services/case dristi_case_document table.
-- document_type: 'IDENTITY_PROOF' | 'BOUNCED_CHEQUE' | 'RETURN_MEMO'
--              | 'DEMAND_NOTICE' | 'DEBT_PROOF' | 'AFFIDAVIT' | 'VAKALAT'
-- ---------------------------------------------------------------------------
CREATE TABLE case_document (
  id                 VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64) NOT NULL,
  case_id            VARCHAR(64) NOT NULL REFERENCES "case"(id),
  filestore_id       VARCHAR(64) REFERENCES filestore(id),
  document_uid       VARCHAR(64),
  document_type      VARCHAR(64),
  litigant_id        VARCHAR(64) REFERENCES case_litigant(id),
  representative_id  VARCHAR(64) REFERENCES case_representative(id),
  is_active          BOOLEAN     DEFAULT TRUE,
  additional_details JSONB,
  created_at         BIGINT      NOT NULL,
  updated_at         BIGINT      NOT NULL
);

CREATE INDEX idx_case_doc_case_id     ON case_document(case_id);
CREATE INDEX idx_case_doc_type        ON case_document(document_type);
CREATE INDEX idx_case_doc_filestore   ON case_document(filestore_id);
CREATE INDEX idx_case_doc_tenant_id   ON case_document(tenant_id);

-- ---------------------------------------------------------------------------
-- EVIDENCE_ARTIFACT
-- Evidence records for a filing (document checklist uploads).
-- Derived from dristi-services/evidence dristi_evidence_artifact table.
-- artifact_type: 'DOCUMENTARY' | 'ORAL'
-- source_type: 'COMPLAINANT' | 'COURT'
-- file JSONB shape: { filestore_id, filename, content_type }
-- ---------------------------------------------------------------------------
CREATE TABLE evidence_artifact (
  id                 VARCHAR(64)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64)   NOT NULL,
  case_id            VARCHAR(64)   NOT NULL REFERENCES "case"(id),
  filing_number      VARCHAR(64),
  artifact_type      VARCHAR(64),
  media_type         VARCHAR(64),
  source_type        VARCHAR(64),
  source_name        VARCHAR(255),
  filing_type        VARCHAR(64),
  description        VARCHAR(2000),
  status             VARCHAR(64),
  is_active          BOOLEAN       DEFAULT TRUE,
  is_evidence        BOOLEAN       DEFAULT TRUE,
  file               JSONB,
  additional_details JSONB,
  created_by         VARCHAR(64),
  created_at         BIGINT        NOT NULL,
  updated_at         BIGINT        NOT NULL
);

CREATE INDEX idx_evidence_case_id    ON evidence_artifact(case_id);
CREATE INDEX idx_evidence_type       ON evidence_artifact(artifact_type);
CREATE INDEX idx_evidence_status     ON evidence_artifact(status);
CREATE INDEX idx_evidence_tenant_id  ON evidence_artifact(tenant_id);

-- ---------------------------------------------------------------------------
-- DEMAND
-- Court fee demand raised at time of case submission.
-- Derived from digit-services/billing-service egbs_demand_v1 table.
-- business_service: 'CASE_FILING_FEE'
-- status: 'ACTIVE' | 'CANCELLED' | 'PAID'
-- consumer_code: typically equals filing_number
-- ---------------------------------------------------------------------------
CREATE TABLE demand (
  id                   VARCHAR(64)    PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id            VARCHAR(64)    NOT NULL,
  case_id              VARCHAR(64)    NOT NULL REFERENCES "case"(id),
  consumer_code        VARCHAR(250),
  business_service     VARCHAR(250),
  status               VARCHAR(64),
  minimum_amount       NUMERIC(12,2),
  bill_expiry_time     BIGINT,
  is_payment_completed BOOLEAN        DEFAULT FALSE,
  additional_details   JSONB,
  created_at           BIGINT         NOT NULL,
  updated_at           BIGINT         NOT NULL
);

CREATE INDEX idx_demand_case_id       ON demand(case_id);
CREATE INDEX idx_demand_consumer_code ON demand(consumer_code);
CREATE INDEX idx_demand_status        ON demand(status);
CREATE INDEX idx_demand_tenant_id     ON demand(tenant_id);

-- ---------------------------------------------------------------------------
-- DEMAND_DETAIL
-- Line items within a demand (court fee, process fee, etc.).
-- Derived from digit-services/billing-service egbs_demanddetail_v1 table.
-- tax_head_code: 'COURT_FEE' | 'PROCESS_FEE' | 'MISC'
-- ---------------------------------------------------------------------------
CREATE TABLE demand_detail (
  id                 VARCHAR(64)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64)   NOT NULL,
  demand_id          VARCHAR(64)   NOT NULL REFERENCES demand(id),
  tax_head_code      VARCHAR(250),
  tax_amount         NUMERIC(12,2),
  collection_amount  NUMERIC(12,2) DEFAULT 0,
  additional_details JSONB,
  created_at         BIGINT        NOT NULL,
  updated_at         BIGINT        NOT NULL
);

CREATE INDEX idx_demand_detail_demand_id  ON demand_detail(demand_id);
CREATE INDEX idx_demand_detail_tenant_id  ON demand_detail(tenant_id);

-- ---------------------------------------------------------------------------
-- PAYMENT
-- Payment record for the filing fee.
-- Derived from digit-services/collection-services egcl_payment table.
-- payment_mode: 'UPI' | 'CARD' | 'NETBANKING' | 'OFFLINE'
-- payment_status: 'NEW' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
-- ---------------------------------------------------------------------------
CREATE TABLE payment (
  id                 VARCHAR(64)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64)   NOT NULL,
  case_id            VARCHAR(64)   NOT NULL REFERENCES "case"(id),
  total_due          NUMERIC(12,2),
  total_amount_paid  NUMERIC(12,2),
  transaction_number VARCHAR(256),
  transaction_date   BIGINT,
  payment_mode       VARCHAR(64),
  instrument_number  VARCHAR(256),
  instrument_status  VARCHAR(256),
  paid_by            VARCHAR(256),
  mobile_number      VARCHAR(64),
  payer_name         VARCHAR(256),
  payment_status     VARCHAR(256),
  additional_details JSONB,
  created_at         BIGINT        NOT NULL,
  updated_at         BIGINT        NOT NULL
);

CREATE INDEX idx_payment_case_id           ON payment(case_id);
CREATE INDEX idx_payment_status            ON payment(payment_status);
CREATE INDEX idx_payment_transaction_number ON payment(transaction_number);
CREATE INDEX idx_payment_tenant_id         ON payment(tenant_id);

-- ---------------------------------------------------------------------------
-- PAYMENT_DETAIL
-- Per-demand breakdown within a payment.
-- Derived from digit-services/collection-services egcl_paymentdetail table.
-- ---------------------------------------------------------------------------
CREATE TABLE payment_detail (
  id                 VARCHAR(64)   PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id          VARCHAR(64)   NOT NULL,
  payment_id         VARCHAR(64)   NOT NULL REFERENCES payment(id),
  demand_id          VARCHAR(64)   REFERENCES demand(id),
  due                NUMERIC(12,2),
  amount_paid        NUMERIC(12,2),
  receipt_number     VARCHAR(256),
  receipt_date       BIGINT,
  business_service   VARCHAR(256),
  additional_details JSONB,
  created_at         BIGINT        NOT NULL,
  updated_at         BIGINT        NOT NULL
);

CREATE INDEX idx_payment_detail_payment_id ON payment_detail(payment_id);
CREATE INDEX idx_payment_detail_demand_id  ON payment_detail(demand_id);
CREATE INDEX idx_payment_detail_tenant_id  ON payment_detail(tenant_id);

-- ============================================================
-- AUTH TABLES (derived from egov-user service)
-- ============================================================

-- User auth credentials. Profile fields live in individual.
CREATE TABLE "user" (
  id                  VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id           VARCHAR(64)   NOT NULL,
  court_id            VARCHAR(64)   REFERENCES court(id),
  individual_id       VARCHAR(64)   REFERENCES individual(id),
  username            VARCHAR(180)  NOT NULL,
  password            VARCHAR(255)  NOT NULL,   -- bcrypt hash
  mobile_number       VARCHAR(50),
  email               VARCHAR(300),
  type                VARCHAR(50)   NOT NULL,   -- 'CITIZEN' | 'EMPLOYEE' | 'SYSTEM'
  is_active           BOOLEAN       DEFAULT TRUE,
  account_locked      BOOLEAN       DEFAULT FALSE,
  account_locked_date BIGINT,
  pwd_expiry_date     BIGINT,
  locale              VARCHAR(16)   DEFAULT 'en_IN',
  created_at          BIGINT        NOT NULL,
  updated_at          BIGINT        NOT NULL,
  UNIQUE (tenant_id, username)
);

CREATE INDEX idx_user_tenant_id   ON "user"(tenant_id);
CREATE INDEX idx_user_court_id    ON "user"(court_id);
CREATE INDEX idx_user_individual  ON "user"(individual_id);
CREATE INDEX idx_user_username    ON "user"(username);
CREATE INDEX idx_user_mobile      ON "user"(mobile_number);
CREATE INDEX idx_user_email       ON "user"(email);

-- Role definitions — global, not tenant-scoped.
CREATE TABLE role (
  id          VARCHAR(64)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code        VARCHAR(50)  NOT NULL UNIQUE,  -- 'CITIZEN' | 'ADVOCATE' | 'JUDGE' | 'COURT_STAFF' | 'SCRUTINY'
  name        VARCHAR(128) NOT NULL,
  description VARCHAR(256),
  created_at  BIGINT       NOT NULL,
  updated_at  BIGINT       NOT NULL
);

-- User ↔ role many-to-many.
CREATE TABLE user_role (
  id         VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    VARCHAR(64) NOT NULL REFERENCES "user"(id),
  role_id    VARCHAR(64) NOT NULL REFERENCES role(id),
  created_at BIGINT      NOT NULL,
  UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_role_user_id ON user_role(user_id);
CREATE INDEX idx_user_role_role_id ON user_role(role_id);

-- Validation tokens: OTP, email-verify, password-reset.
CREATE TABLE token (
  id           VARCHAR(64)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      VARCHAR(64)  NOT NULL REFERENCES "user"(id),
  token_number VARCHAR(128) NOT NULL,
  token_type   VARCHAR(64)  NOT NULL,  -- 'OTP' | 'EMAIL_VERIFY' | 'PASSWORD_RESET'
  validated    BOOLEAN      DEFAULT FALSE,
  ttl_secs     BIGINT       NOT NULL,
  created_at   BIGINT       NOT NULL,
  updated_at   BIGINT       NOT NULL
);

CREATE INDEX idx_token_user_id ON token(user_id);
CREATE INDEX idx_token_number  ON token(token_number);

-- Failed login tracking for brute-force lockout.
CREATE TABLE login_attempt (
  id           VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      VARCHAR(64) NOT NULL REFERENCES "user"(id),
  ip           VARCHAR(46),
  attempt_date BIGINT      NOT NULL,
  is_active    BOOLEAN     DEFAULT TRUE
);

CREATE INDEX idx_login_attempt_user ON login_attempt(user_id);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO role (id, code, name, description, created_at, updated_at) VALUES
  (gen_random_uuid()::text, 'CITIZEN',     'Citizen',          'Complainant filing a case',       0, 0),
  (gen_random_uuid()::text, 'ADVOCATE',    'Advocate',         'Legal representative',            0, 0),
  (gen_random_uuid()::text, 'JUDGE',       'Judge',            'Presiding officer',               0, 0),
  (gen_random_uuid()::text, 'COURT_STAFF', 'Court Staff',      'Administrative court personnel',  0, 0),
  (gen_random_uuid()::text, 'SCRUTINY',    'Scrutiny Officer', 'Reviews case filings',            0, 0);
