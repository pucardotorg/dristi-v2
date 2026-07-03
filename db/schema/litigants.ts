import { pgTable, varchar, boolean, jsonb, bigint, unique } from "drizzle-orm/pg-core";
import { caseTable } from "./case";
import { individual } from "./individual";
import { advocate } from "./advocate";

export const caseLitigant = pgTable("case_litigant", {
  id:                 varchar("id", { length: 64 }).primaryKey(),
  tenant_id:          varchar("tenant_id", { length: 64 }).notNull(),
  case_id:            varchar("case_id", { length: 64 }).notNull().references(() => caseTable.id),
  individual_id:      varchar("individual_id", { length: 64 }).references(() => individual.id),
  party_type:         varchar("party_type", { length: 64 }).notNull(),
  party_category:     varchar("party_category", { length: 64 }),
  has_signed:         boolean("has_signed").default(false),
  is_active:          boolean("is_active").default(true),
  additional_details: jsonb("additional_details"),
  created_at:         bigint("created_at", { mode: "number" }).notNull(),
  updated_at:         bigint("updated_at", { mode: "number" }).notNull(),
});

export const caseRepresentative = pgTable("case_representative", {
  id:                 varchar("id", { length: 64 }).primaryKey(),
  tenant_id:          varchar("tenant_id", { length: 64 }).notNull(),
  case_id:            varchar("case_id", { length: 64 }).notNull().references(() => caseTable.id),
  advocate_id:        varchar("advocate_id", { length: 64 }).notNull().references(() => advocate.id),
  filing_status:      varchar("filing_status", { length: 64 }),
  has_signed:         boolean("has_signed").default(false),
  is_active:          boolean("is_active").default(true),
  additional_details: jsonb("additional_details"),
  created_at:         bigint("created_at", { mode: "number" }).notNull(),
  updated_at:         bigint("updated_at", { mode: "number" }).notNull(),
});

export const caseRepresentativeLitigant = pgTable(
  "case_representative_litigant",
  {
    id:                     varchar("id", { length: 64 }).primaryKey(),
    tenant_id:              varchar("tenant_id", { length: 64 }).notNull(),
    case_representative_id: varchar("case_representative_id", { length: 64 }).notNull().references(() => caseRepresentative.id),
    case_litigant_id:       varchar("case_litigant_id", { length: 64 }).notNull().references(() => caseLitigant.id),
    created_at:             bigint("created_at", { mode: "number" }).notNull(),
  },
  (t) => [unique().on(t.case_representative_id, t.case_litigant_id)]
);

export const casePoaHolder = pgTable("case_poa_holder", {
  id:                     varchar("id", { length: 64 }).primaryKey(),
  tenant_id:              varchar("tenant_id", { length: 64 }).notNull(),
  case_id:                varchar("case_id", { length: 64 }).notNull().references(() => caseTable.id),
  individual_id:          varchar("individual_id", { length: 64 }).references(() => individual.id),
  poa_type:               varchar("poa_type", { length: 128 }).notNull(),
  name:                   varchar("name", { length: 256 }),
  has_signed:             boolean("has_signed").default(false),
  is_active:              boolean("is_active").default(true),
  representing_litigants: jsonb("representing_litigants"),
  additional_details:     jsonb("additional_details"),
  created_at:             bigint("created_at", { mode: "number" }).notNull(),
  updated_at:             bigint("updated_at", { mode: "number" }).notNull(),
});
