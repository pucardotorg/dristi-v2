import { pgTable, varchar, date, jsonb, bigint } from "drizzle-orm/pg-core";

export const individual = pgTable("individual", {
  id:                varchar("id", { length: 64 }).primaryKey(),
  tenant_id:         varchar("tenant_id", { length: 64 }).notNull(),
  given_name:        varchar("given_name", { length: 200 }).notNull(),
  family_name:       varchar("family_name", { length: 200 }),
  other_names:       varchar("other_names", { length: 200 }),
  date_of_birth:     date("date_of_birth"),
  gender:            varchar("gender", { length: 20 }),
  mobile_number:     varchar("mobile_number", { length: 50 }),
  email:             varchar("email", { length: 200 }),
  father_name:       varchar("father_name", { length: 100 }),
  photo:             varchar("photo", { length: 2048 }),
  additional_details: jsonb("additional_details"),
  created_at:        bigint("created_at", { mode: "number" }).notNull(),
  updated_at:        bigint("updated_at", { mode: "number" }).notNull(),
});

export const address = pgTable("address", {
  id:             varchar("id", { length: 64 }).primaryKey(),
  tenant_id:      varchar("tenant_id", { length: 64 }).notNull(),
  individual_id:  varchar("individual_id", { length: 64 }).notNull().references(() => individual.id),
  address_type:   varchar("address_type", { length: 32 }).notNull(),
  address_line:   varchar("address_line", { length: 512 }),
  pincode:        varchar("pincode", { length: 10 }),
  district:       varchar("district", { length: 100 }),
  state:          varchar("state", { length: 100 }),
  country:        varchar("country", { length: 50 }).default("India"),
  geo:            varchar("geo", { length: 100 }),
  police_station: varchar("police_station", { length: 100 }),
  created_at:     bigint("created_at", { mode: "number" }).notNull(),
  updated_at:     bigint("updated_at", { mode: "number" }).notNull(),
});

export const individualIdentifier = pgTable("individual_identifier", {
  id:              varchar("id", { length: 64 }).primaryKey(),
  tenant_id:       varchar("tenant_id", { length: 64 }).notNull(),
  individual_id:   varchar("individual_id", { length: 64 }).notNull().references(() => individual.id),
  identifier_type: varchar("identifier_type", { length: 64 }).notNull(),
  identifier_id:   varchar("identifier_id", { length: 256 }).notNull(),
  created_at:      bigint("created_at", { mode: "number" }).notNull(),
  updated_at:      bigint("updated_at", { mode: "number" }).notNull(),
});
