import { pgTable, varchar, boolean, jsonb, bigint } from "drizzle-orm/pg-core";
import { caseTable } from "./case";
import { caseLitigant, caseRepresentative } from "./litigants";

export const filestore = pgTable("filestore", {
  id:           varchar("id", { length: 64 }).primaryKey(),
  tenant_id:    varchar("tenant_id", { length: 64 }).notNull(),
  filename:     varchar("filename", { length: 256 }).notNull(),
  content_type: varchar("content_type", { length: 100 }),
  module:       varchar("module", { length: 100 }),
  file_source:  varchar("file_source", { length: 64 }),
  is_deleted:   boolean("is_deleted").default(false),
  created_at:   bigint("created_at", { mode: "number" }).notNull(),
  updated_at:   bigint("updated_at", { mode: "number" }).notNull(),
});

export const caseDocument = pgTable("case_document", {
  id:                 varchar("id", { length: 64 }).primaryKey(),
  tenant_id:          varchar("tenant_id", { length: 64 }).notNull(),
  case_id:            varchar("case_id", { length: 64 }).notNull().references(() => caseTable.id),
  filestore_id:       varchar("filestore_id", { length: 64 }).references(() => filestore.id),
  document_uid:       varchar("document_uid", { length: 64 }),
  document_type:      varchar("document_type", { length: 64 }),
  litigant_id:        varchar("litigant_id", { length: 64 }).references(() => caseLitigant.id),
  representative_id:  varchar("representative_id", { length: 64 }).references(() => caseRepresentative.id),
  is_active:          boolean("is_active").default(true),
  additional_details: jsonb("additional_details"),
  created_at:         bigint("created_at", { mode: "number" }).notNull(),
  updated_at:         bigint("updated_at", { mode: "number" }).notNull(),
});

export const evidenceArtifact = pgTable("evidence_artifact", {
  id:                 varchar("id", { length: 64 }).primaryKey(),
  tenant_id:          varchar("tenant_id", { length: 64 }).notNull(),
  case_id:            varchar("case_id", { length: 64 }).notNull().references(() => caseTable.id),
  filing_number:      varchar("filing_number", { length: 64 }),
  artifact_type:      varchar("artifact_type", { length: 64 }),
  media_type:         varchar("media_type", { length: 64 }),
  source_type:        varchar("source_type", { length: 64 }),
  source_name:        varchar("source_name", { length: 255 }),
  filing_type:        varchar("filing_type", { length: 64 }),
  description:        varchar("description", { length: 2000 }),
  status:             varchar("status", { length: 64 }),
  is_active:          boolean("is_active").default(true),
  is_evidence:        boolean("is_evidence").default(true),
  file:               jsonb("file"),
  additional_details: jsonb("additional_details"),
  created_by:         varchar("created_by", { length: 64 }),
  created_at:         bigint("created_at", { mode: "number" }).notNull(),
  updated_at:         bigint("updated_at", { mode: "number" }).notNull(),
});
