-- better-auth schema migration
-- Replaces hand-rolled auth tables (user, role, user_role, token, login_attempt)
-- Run: psql -d pucar -f db/auth-migration.sql

BEGIN;

-- Drop old auth tables (CASCADE removes dependent FK rows)
DROP TABLE IF EXISTS login_attempt CASCADE;
DROP TABLE IF EXISTS token CASCADE;
DROP TABLE IF EXISTS user_role CASCADE;
DROP TABLE IF EXISTS role CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- better-auth: user
CREATE TABLE "user" (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  image          TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  tenant_id      TEXT NOT NULL DEFAULT 'kl',
  court_id       TEXT
);

-- better-auth: session
CREATE TABLE session (
  id          TEXT PRIMARY KEY,
  expires_at  TIMESTAMP NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address  TEXT,
  user_agent  TEXT,
  user_id     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE INDEX session_userId_idx ON session(user_id);

-- better-auth: account (stores password hash for email/password provider)
CREATE TABLE account (
  id                       TEXT PRIMARY KEY,
  account_id               TEXT NOT NULL,
  provider_id              TEXT NOT NULL,
  user_id                  TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token             TEXT,
  refresh_token            TEXT,
  id_token                 TEXT,
  access_token_expires_at  TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope                    TEXT,
  password                 TEXT,
  created_at               TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX account_userId_idx ON account(user_id);

-- better-auth: verification (for email verification, password reset tokens)
CREATE TABLE verification (
  id         TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value      TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX verification_identifier_idx ON verification(identifier);

COMMIT;
