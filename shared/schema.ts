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
  phoneNumber: text("phone_number"), // For OTP sending
  resetOtp: text("reset_otp"), // Current OTP for password reset
  otpExpires: timestamp("otp_expires"), // OTP expiration time
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

// Lab Test Definitions Table - for managing available test types
export const labTestDefinitions = pgTable("lab_test_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testName: text("test_name").notNull(),
  department: text("department").notNull(), // 'Pathology', 'Radiology', 'Biochemistry', etc.
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  normalRanges: jsonb("normal_ranges"), // reference ranges for results
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Patient Medical History Table
export const medicalHistory = pgTable("medical_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  entryType: text("entry_type").notNull(), // 'diagnosis', 'allergy', 'medication', 'procedure', 'note'
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category"), // 'chronic', 'acute', 'surgical', 'medication', etc.
  severity: text("severity"), // 'mild', 'moderate', 'severe', 'critical'
  status: text("status").notNull().default("active"), // 'active', 'resolved', 'inactive'
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  providerName: text("provider_name"),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Medicine Inventory Table
export const medicineInventory = pgTable("medicine_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicineName: text("medicine_name").notNull(),
  batchNumber: text("batch_number").notNull(),
  quantity: integer("quantity").notNull().default(0),
  mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull(),
  expiryDate: timestamp("expiry_date"),
  manufacturer: text("manufacturer"),
  category: text("category"), // 'tablets', 'syrup', 'injection', etc.
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Extended Patient Information
export const patientProfiles = pgTable("patient_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id).unique(),
  dateOfBirth: timestamp("date_of_birth"),
  bloodType: text("blood_type"),
  height: decimal("height", { precision: 5, scale: 2 }), // in cm
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelation: text("emergency_contact_relation"),
  address: text("address"),
  insurance: text("insurance"),
  primaryPhysician: text("primary_physician"),
  knownAllergies: jsonb("known_allergies"), // array of allergy objects
  currentMedications: jsonb("current_medications"), // array of medication objects
  chronicConditions: jsonb("chronic_conditions"), // array of condition objects
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comprehensive Patient Registration Table
export const patientsRegistration = pgTable("patients_registration", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mruNumber: text("mru_number").notNull().unique(), // MRU25-0001 format
  visitId: text("visit_id").notNull().unique(), // VISIT-001 format
  salutation: text("salutation"), // Mr., Mrs., Ms., Dr., Master, Miss, Baby
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  ageUnit: text("age_unit").notNull().default("years"), // years, months, days
  gender: text("gender").notNull(), // Male, Female, Other
  dateOfBirth: timestamp("date_of_birth"),
  contactPhone: text("contact_phone").notNull(),
  email: text("email"),
  address: text("address"),
  bloodGroup: text("blood_group"), // A+, A-, B+, B-, AB+, AB-, O+, O-, Unknown
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  medicalHistory: text("medical_history"), // allergies, conditions, etc.
  referringDoctor: text("referring_doctor"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  labTests: many(labTests),
  prescriptions: many(prescriptions),
  dischargeSummaries: many(dischargeSummaries),
  medicalHistoryEntries: many(medicalHistory),
  labTestDefinitions: many(labTestDefinitions),
  patientsRegistration: many(patientsRegistration),
}));

export const patientsRelations = relations(patients, ({ many, one }) => ({
  labTests: many(labTests),
  prescriptions: many(prescriptions),
  dischargeSummaries: many(dischargeSummaries),
  medicalHistoryEntries: many(medicalHistory),
  profile: one(patientProfiles),
}));

export const patientProfilesRelations = relations(patientProfiles, ({ one }) => ({
  patient: one(patients, {
    fields: [patientProfiles.patientId],
    references: [patients.id],
  }),
}));

export const medicalHistoryRelations = relations(medicalHistory, ({ one }) => ({
  patient: one(patients, {
    fields: [medicalHistory.patientId],
    references: [patients.id],
  }),
  createdBy: one(users, {
    fields: [medicalHistory.createdBy],
    references: [users.id],
  }),
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

export const insertMedicalHistorySchema = createInsertSchema(medicalHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientProfileSchema = createInsertSchema(patientProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLabTestDefinitionSchema = createInsertSchema(labTestDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Add relations for lab test definitions
export const labTestDefinitionsRelations = relations(labTestDefinitions, ({ one }) => ({
  createdBy: one(users, {
    fields: [labTestDefinitions.createdBy],
    references: [users.id],
  }),
}));

export const patientsRegistrationRelations = relations(patientsRegistration, ({ one }) => ({
  createdBy: one(users, {
    fields: [patientsRegistration.createdBy],
    references: [users.id],
  }),
}));

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;
export type LabTest = typeof labTests.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertMedicalHistory = z.infer<typeof insertMedicalHistorySchema>;
export type MedicalHistory = typeof medicalHistory.$inferSelect;
export type InsertPatientProfile = z.infer<typeof insertPatientProfileSchema>;
export type PatientProfile = typeof patientProfiles.$inferSelect;
export type InsertDischargeSummary = z.infer<typeof insertDischargeSummarySchema>;
export type DischargeSummary = typeof dischargeSummaries.$inferSelect;

// Consultations table
export const consultations = pgTable('consultations', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar('patient_id').notNull().references(() => patients.id),
  doctorName: text('doctor_name').notNull(),
  consultationDate: timestamp('consultation_date').notNull(),
  chiefComplaint: text('chief_complaint').notNull(),
  presentIllnessHistory: text('present_illness_history'),
  pastMedicalHistory: text('past_medical_history'),
  examination: text('examination'),
  diagnosis: text('diagnosis').notNull(),
  treatment: text('treatment'),
  prescription: jsonb('prescription').$type<Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>>(),
  followUpDate: timestamp('follow_up_date'),
  notes: text('notes'),
  consultationType: text('consultation_type').notNull().default('general'), // general, emergency, follow-up
  status: text('status').notNull().default('completed'), // scheduled, in-progress, completed, cancelled
  createdBy: varchar('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const consultationsRelations = relations(consultations, ({ one }) => ({
  patient: one(patients, {
    fields: [consultations.patientId],
    references: [patients.id],
  }),
  createdBy: one(users, {
    fields: [consultations.createdBy],
    references: [users.id],
  }),
}));

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  consultationDate: z.coerce.date(),
  followUpDate: z.coerce.date().optional(),
});

export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;

// Surgical Case Sheets Table
export const surgicalCaseSheets = pgTable("surgical_case_sheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseNumber: text("case_number").notNull().unique(), // SCS-2024-001 format
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  patientName: text("patient_name").notNull(),
  husbandFatherName: text("husband_father_name"),
  religion: text("religion"),
  nationality: text("nationality"),
  age: integer("age").notNull(),
  sex: text("sex").notNull(),
  address: text("address"),
  village: text("village"),
  district: text("district"),
  diagnosis: text("diagnosis"),
  natureOfOperation: text("nature_of_operation"),
  edd: timestamp("edd"), // Expected Date of Delivery
  dateOfAdmission: timestamp("date_of_admission"),
  dateOfOperation: timestamp("date_of_operation"),
  dateOfDischarge: timestamp("date_of_discharge"),
  lpNo: text("lp_no"),
  complaintsAndDuration: text("complaints_and_duration"),
  historyOfPresentIllness: text("history_of_present_illness"),
  
  // Investigation fields
  hb: text("hb"),
  bsa: text("bsa"),
  ct: text("ct"),
  bt: text("bt"),
  bloodGrouping: text("blood_grouping"),
  rhFactor: text("rh_factor"),
  prl: text("prl"),
  rbs: text("rbs"),
  urineSugar: text("urine_sugar"),
  xray: text("xray"),
  ecg: text("ecg"),
  bloodUrea: text("blood_urea"),
  serumCreatinine: text("serum_creatinine"),
  serumBilirubin: text("serum_bilirubin"),
  hbsag: text("hbsag"),
  
  // On Examination fields
  generalCondition: text("general_condition"),
  temperature: text("temperature"),
  pulse: text("pulse"),
  bloodPressure: text("blood_pressure"),
  respiratoryRate: text("respiratory_rate"),
  heart: text("heart"),
  lungs: text("lungs"),
  abdomen: text("abdomen"),
  cns: text("cns"),
  
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const surgicalCaseSheetsRelations = relations(surgicalCaseSheets, ({ one }) => ({
  patient: one(patients, { fields: [surgicalCaseSheets.patientId], references: [patients.id] }),
  createdBy: one(users, { fields: [surgicalCaseSheets.createdBy], references: [users.id] }),
}));

export const insertSurgicalCaseSheetSchema = createInsertSchema(surgicalCaseSheets).omit({
  id: true,
  caseNumber: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfAdmission: z.coerce.date().optional(),
  dateOfOperation: z.coerce.date().optional(),
  dateOfDischarge: z.coerce.date().optional(),
  edd: z.coerce.date().optional(),
});

export type InsertSurgicalCaseSheet = z.infer<typeof insertSurgicalCaseSheetSchema>;
export type SurgicalCaseSheet = typeof surgicalCaseSheets.$inferSelect;

export const insertPatientsRegistrationSchema = createInsertSchema(patientsRegistration).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.coerce.date().nullable().optional(),
});

export type InsertPatientsRegistration = z.infer<typeof insertPatientsRegistrationSchema>;
export type PatientsRegistration = typeof patientsRegistration.$inferSelect;

// Medicine Inventory schema
export const insertMedicineInventorySchema = createInsertSchema(medicineInventory).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  mrp: z.string(),
  quantity: z.number(),
  expiryDate: z.coerce.date().nullable().optional(),
});

export type InsertMedicineInventory = z.infer<typeof insertMedicineInventorySchema>;
export type MedicineInventory = typeof medicineInventory.$inferSelect;
