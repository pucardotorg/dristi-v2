import { pgTable, varchar, jsonb, bigint } from "drizzle-orm/pg-core";
import { individual } from "./individual";

export const advocate = pgTable("advocate", {
  id:                      varchar("id", { length: 64 }).primaryKey(),
  tenant_id:               varchar("tenant_id", { length: 64 }).notNull(),
  individual_id:           varchar("individual_id", { length: 64 }).references(() => individual.id),
  bar_registration_number: varchar("bar_registration_number", { length: 64 }).notNull(),
  advocate_type:           varchar("advocate_type", { length: 64 }),
  status:                  varchar("status", { length: 64 }),
  additional_details:      jsonb("additional_details"),
  created_at:              bigint("created_at", { mode: "number" }).notNull(),
  updated_at:              bigint("updated_at", { mode: "number" }).notNull(),
});

export const advocateDocument = pgTable("advocate_document", {
  id:                 varchar("id", { length: 64 }).primaryKey(),
  tenant_id:          varchar("tenant_id", { length: 64 }).notNull(),
  advocate_id:        varchar("advocate_id", { length: 64 }).notNull().references(() => advocate.id),
  filestore_id:       varchar("filestore_id", { length: 64 }),
  document_uid:       varchar("document_uid", { length: 64 }),
  document_type:      varchar("document_type", { length: 64 }),
  additional_details: jsonb("additional_details"),
  created_at:         bigint("created_at", { mode: "number" }).notNull(),
  updated_at:         bigint("updated_at", { mode: "number" }).notNull(),
});
