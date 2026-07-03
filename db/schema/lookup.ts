import { pgTable, varchar, boolean, jsonb, bigint } from "drizzle-orm/pg-core";

export const court = pgTable("court", {
  id:                varchar("id", { length: 64 }).primaryKey(),
  tenant_id:         varchar("tenant_id", { length: 64 }).notNull(),
  name:              varchar("name", { length: 256 }).notNull(),
  code:              varchar("code", { length: 64 }).notNull(),
  court_type:        varchar("court_type", { length: 64 }),
  address:           varchar("address", { length: 512 }),
  is_active:         boolean("is_active").default(true),
  additional_details: jsonb("additional_details"),
  created_at:        bigint("created_at", { mode: "number" }).notNull(),
  updated_at:        bigint("updated_at", { mode: "number" }).notNull(),
});

export const judge = pgTable("judge", {
  id:                varchar("id", { length: 64 }).primaryKey(),
  tenant_id:         varchar("tenant_id", { length: 64 }).notNull(),
  court_id:          varchar("court_id", { length: 64 }).references(() => court.id),
  name:              varchar("name", { length: 256 }).notNull(),
  designation:       varchar("designation", { length: 128 }),
  is_active:         boolean("is_active").default(true),
  additional_details: jsonb("additional_details"),
  created_at:        bigint("created_at", { mode: "number" }).notNull(),
  updated_at:        bigint("updated_at", { mode: "number" }).notNull(),
});
