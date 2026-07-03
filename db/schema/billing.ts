import { pgTable, varchar, boolean, jsonb, bigint, numeric } from "drizzle-orm/pg-core";
import { caseTable } from "./case";

export const demand = pgTable("demand", {
  id:                   varchar("id", { length: 64 }).primaryKey(),
  tenant_id:            varchar("tenant_id", { length: 64 }).notNull(),
  case_id:              varchar("case_id", { length: 64 }).notNull().references(() => caseTable.id),
  consumer_code:        varchar("consumer_code", { length: 250 }),
  business_service:     varchar("business_service", { length: 250 }),
  status:               varchar("status", { length: 64 }),
  minimum_amount:       numeric("minimum_amount", { precision: 12, scale: 2 }),
  bill_expiry_time:     bigint("bill_expiry_time", { mode: "number" }),
  is_payment_completed: boolean("is_payment_completed").default(false),
  additional_details:   jsonb("additional_details"),
  created_at:           bigint("created_at", { mode: "number" }).notNull(),
  updated_at:           bigint("updated_at", { mode: "number" }).notNull(),
});

export const demandDetail = pgTable("demand_detail", {
  id:                 varchar("id", { length: 64 }).primaryKey(),
  tenant_id:          varchar("tenant_id", { length: 64 }).notNull(),
  demand_id:          varchar("demand_id", { length: 64 }).notNull().references(() => demand.id),
  tax_head_code:      varchar("tax_head_code", { length: 250 }),
  tax_amount:         numeric("tax_amount", { precision: 12, scale: 2 }),
  collection_amount:  numeric("collection_amount", { precision: 12, scale: 2 }).default("0"),
  additional_details: jsonb("additional_details"),
  created_at:         bigint("created_at", { mode: "number" }).notNull(),
  updated_at:         bigint("updated_at", { mode: "number" }).notNull(),
});

export const payment = pgTable("payment", {
  id:                 varchar("id", { length: 64 }).primaryKey(),
  tenant_id:          varchar("tenant_id", { length: 64 }).notNull(),
  case_id:            varchar("case_id", { length: 64 }).notNull().references(() => caseTable.id),
  total_due:          numeric("total_due", { precision: 12, scale: 2 }),
  total_amount_paid:  numeric("total_amount_paid", { precision: 12, scale: 2 }),
  transaction_number: varchar("transaction_number", { length: 256 }),
  transaction_date:   bigint("transaction_date", { mode: "number" }),
  payment_mode:       varchar("payment_mode", { length: 64 }),
  instrument_number:  varchar("instrument_number", { length: 256 }),
  instrument_status:  varchar("instrument_status", { length: 256 }),
  paid_by:            varchar("paid_by", { length: 256 }),
  mobile_number:      varchar("mobile_number", { length: 64 }),
  payer_name:         varchar("payer_name", { length: 256 }),
  payment_status:     varchar("payment_status", { length: 256 }),
  additional_details: jsonb("additional_details"),
  created_at:         bigint("created_at", { mode: "number" }).notNull(),
  updated_at:         bigint("updated_at", { mode: "number" }).notNull(),
});

export const paymentDetail = pgTable("payment_detail", {
  id:                 varchar("id", { length: 64 }).primaryKey(),
  tenant_id:          varchar("tenant_id", { length: 64 }).notNull(),
  payment_id:         varchar("payment_id", { length: 64 }).notNull().references(() => payment.id),
  demand_id:          varchar("demand_id", { length: 64 }).references(() => demand.id),
  due:                numeric("due", { precision: 12, scale: 2 }),
  amount_paid:        numeric("amount_paid", { precision: 12, scale: 2 }),
  receipt_number:     varchar("receipt_number", { length: 256 }),
  receipt_date:       bigint("receipt_date", { mode: "number" }),
  business_service:   varchar("business_service", { length: 256 }),
  additional_details: jsonb("additional_details"),
  created_at:         bigint("created_at", { mode: "number" }).notNull(),
  updated_at:         bigint("updated_at", { mode: "number" }).notNull(),
});
