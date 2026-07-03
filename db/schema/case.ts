import { pgTable, varchar, boolean, jsonb, bigint } from "drizzle-orm/pg-core";
import { court, judge } from "./lookup";

export const caseTable = pgTable("case", {
  id:                 varchar("id", { length: 64 }).primaryKey(),
  tenant_id:          varchar("tenant_id", { length: 64 }).notNull(),
  filing_number:      varchar("filing_number", { length: 64 }),
  cnr_number:         varchar("cnr_number", { length: 64 }),
  case_title:         varchar("case_title", { length: 1000 }),
  case_type:          varchar("case_type", { length: 64 }).default("NI_ACT_138"),
  case_category:      varchar("case_category", { length: 64 }),
  court_id:           varchar("court_id", { length: 64 }).references(() => court.id),
  judge_id:           varchar("judge_id", { length: 64 }).references(() => judge.id),
  status:             varchar("status", { length: 64 }).notNull().default("DRAFT"),
  filing_date:        bigint("filing_date", { mode: "number" }),
  registration_date:  bigint("registration_date", { mode: "number" }),
  nature_of_pleading: varchar("nature_of_pleading", { length: 64 }),
  stage:              varchar("stage", { length: 64 }),
  substage:           varchar("substage", { length: 64 }),
  lifecycle_status:   varchar("lifecycle_status", { length: 32 }).default("ACTIVE"),
  case_details:       jsonb("case_details"),
  additional_details: jsonb("additional_details"),
  created_by:         varchar("created_by", { length: 64 }),
  created_at:         bigint("created_at", { mode: "number" }).notNull(),
  updated_at:         bigint("updated_at", { mode: "number" }).notNull(),
});

export const caseLock = pgTable("lock", {
  id:                varchar("id", { length: 64 }).primaryKey(),
  tenant_id:         varchar("tenant_id", { length: 64 }),
  entity:            varchar("entity", { length: 64 }),
  unique_id:         varchar("unique_id", { length: 64 }),
  individual_id:     varchar("individual_id", { length: 64 }),
  user_id:           varchar("user_id", { length: 64 }),
  is_locked:         boolean("is_locked").default(true),
  lock_type:         varchar("lock_type", { length: 64 }),
  lock_date:         bigint("lock_date", { mode: "number" }),
  lock_release_time: bigint("lock_release_time", { mode: "number" }),
  created_by:        varchar("created_by", { length: 64 }),
  created_at:        bigint("created_at", { mode: "number" }).notNull(),
  updated_at:        bigint("updated_at", { mode: "number" }).notNull(),
});

export const caseStatutesSections = pgTable("case_statutes_sections", {
  id:                 varchar("id", { length: 64 }).primaryKey(),
  tenant_id:          varchar("tenant_id", { length: 64 }).notNull(),
  case_id:            varchar("case_id", { length: 64 }).notNull().references(() => caseTable.id),
  statutes:           varchar("statutes", { length: 64 }),
  sections:           varchar("sections", { length: 64 }),
  subsections:        varchar("subsections", { length: 64 }),
  additional_details: jsonb("additional_details"),
  created_at:         bigint("created_at", { mode: "number" }).notNull(),
  updated_at:         bigint("updated_at", { mode: "number" }).notNull(),
});
