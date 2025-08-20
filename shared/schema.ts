import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'doctor' or 'staff'
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: text("patient_id").notNull().unique(), // HMS-2024-001 format
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  contact: text("contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const labTests = pgTable("lab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  testTypes: jsonb("test_types").notNull(), // array of selected test types
  results: jsonb("results"), // test results data
  doctorNotes: text("doctor_notes"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, completed
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billNumber: text("bill_number").notNull().unique(),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  medicines: jsonb("medicines").notNull(), // array of medicine objects
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dischargeSummaries = pgTable("discharge_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  primaryDiagnosis: text("primary_diagnosis").notNull(),
  secondaryDiagnosis: text("secondary_diagnosis"),
  treatmentSummary: text("treatment_summary").notNull(),
  medications: text("medications"),
  followupInstructions: text("followup_instructions"),
  dischargeDate: timestamp("discharge_date").notNull(),
  attendingPhysician: text("attending_physician").notNull(),
  admissionDate: timestamp("admission_date"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  labTests: many(labTests),
  prescriptions: many(prescriptions),
  dischargeSummaries: many(dischargeSummaries),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  labTests: many(labTests),
  prescriptions: many(prescriptions),
  dischargeSummaries: many(dischargeSummaries),
}));

export const labTestsRelations = relations(labTests, ({ one }) => ({
  patient: one(patients, {
    fields: [labTests.patientId],
    references: [patients.id],
  }),
  createdBy: one(users, {
    fields: [labTests.createdBy],
    references: [users.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  createdBy: one(users, {
    fields: [prescriptions.createdBy],
    references: [users.id],
  }),
}));

export const dischargeSummariesRelations = relations(dischargeSummaries, ({ one }) => ({
  patient: one(patients, {
    fields: [dischargeSummaries.patientId],
    references: [patients.id],
  }),
  createdBy: one(users, {
    fields: [dischargeSummaries.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  patientId: true,
  createdAt: true,
});

export const insertLabTestSchema = createInsertSchema(labTests).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertDischargeSummarySchema = createInsertSchema(dischargeSummaries).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;
export type LabTest = typeof labTests.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertDischargeSummary = z.infer<typeof insertDischargeSummarySchema>;
export type DischargeSummary = typeof dischargeSummaries.$inferSelect;
