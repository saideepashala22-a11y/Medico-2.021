import { 
  users, patients, labTests, prescriptions, dischargeSummaries, medicalHistory, patientProfiles, consultations, labTestDefinitions, surgicalCaseSheets, patientsRegistration,
  type User, type InsertUser, type Patient, type InsertPatient,
  type LabTest, type InsertLabTest, type Prescription, type InsertPrescription,
  type DischargeSummary, type InsertDischargeSummary, type MedicalHistory, type InsertMedicalHistory,
  type PatientProfile, type InsertPatientProfile, type Consultation, type InsertConsultation,
  type SurgicalCaseSheet, type InsertSurgicalCaseSheet, type PatientsRegistration, type InsertPatientsRegistration,
  insertLabTestDefinitionSchema
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Patients
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  getAllPatients(): Promise<Patient[]>;
  searchPatients(query: string): Promise<Patient[]>;
  
  // Lab Tests
  getLabTest(id: string): Promise<LabTest | undefined>;
  getLabTestsByPatient(patientId: string): Promise<LabTest[]>;
  createLabTest(labTest: InsertLabTest): Promise<LabTest>;
  updateLabTest(id: string, updates: Partial<LabTest>): Promise<LabTest>;
  getRecentLabTests(): Promise<(LabTest & { patient: Patient })[]>;
  
  // Lab Test Definitions
  getAllLabTestDefinitions(): Promise<any[]>;
  getActiveLabTestDefinitions(): Promise<any[]>;
  createLabTestDefinition(definition: any): Promise<any>;
  updateLabTestDefinition(id: string, updates: Partial<any>): Promise<any>;
  deleteLabTestDefinition(id: string): Promise<void>;
  
  // Prescriptions
  getPrescription(id: string): Promise<Prescription | undefined>;
  getPrescriptionsByPatient(patientId: string): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  getRecentPrescriptions(): Promise<(Prescription & { patient: Patient })[]>;
  
  // Discharge Summaries
  getDischargeSummary(id: string): Promise<DischargeSummary | undefined>;
  getDischargeSummariesByPatient(patientId: string): Promise<DischargeSummary[]>;
  createDischargeSummary(summary: InsertDischargeSummary): Promise<DischargeSummary>;
  getRecentDischargeSummaries(): Promise<(DischargeSummary & { patient: Patient })[]>;
  
  // Medical History
  getMedicalHistoryEntry(id: string): Promise<MedicalHistory | undefined>;
  getMedicalHistoryByPatient(patientId: string): Promise<MedicalHistory[]>;
  createMedicalHistoryEntry(entry: InsertMedicalHistory): Promise<MedicalHistory>;
  updateMedicalHistoryEntry(id: string, updates: Partial<MedicalHistory>): Promise<MedicalHistory>;
  deleteMedicalHistoryEntry(id: string): Promise<void>;
  
  // Patient Profiles  
  getPatientProfile(patientId: string): Promise<PatientProfile | undefined>;
  createOrUpdatePatientProfile(profile: InsertPatientProfile): Promise<PatientProfile>;
  
  // Consultations
  getConsultation(id: string): Promise<Consultation | undefined>;
  getConsultationsByPatient(patientId: string): Promise<Consultation[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation>;
  deleteConsultation(id: string): Promise<void>;
  getRecentConsultations(): Promise<(Consultation & { patient: Patient })[]>;
  
  // Surgical Case Sheets
  getSurgicalCaseSheet(id: string): Promise<(SurgicalCaseSheet & { patient: Patient }) | undefined>;
  getSurgicalCaseSheetsByPatient(patientId: string): Promise<SurgicalCaseSheet[]>;
  createSurgicalCaseSheet(caseSheet: InsertSurgicalCaseSheet): Promise<SurgicalCaseSheet>;
  updateSurgicalCaseSheet(id: string, updates: Partial<SurgicalCaseSheet>): Promise<SurgicalCaseSheet>;
  getRecentSurgicalCaseSheets(): Promise<(SurgicalCaseSheet & { patient: Patient })[]>;
  
  // Patients Registration
  getPatientsRegistration(id: string): Promise<PatientsRegistration | undefined>;
  getAllPatientsRegistrations(): Promise<PatientsRegistration[]>;
  createPatientsRegistration(registration: InsertPatientsRegistration): Promise<PatientsRegistration>;
  searchPatientsRegistrations(query: string): Promise<PatientsRegistration[]>;
  
  // Stats
  getStats(): Promise<{
    totalPatients: number;
    labTestsToday: number;
    prescriptionsToday: number;
    dischargesToday: number;
    consultationsToday: number;
    surgicalCasesToday: number;
  }>;
  
  // Historical Stats
  getHistoricalStats(): Promise<{
    yesterday: {
      patientsRegistered: number;
      labTests: number;
      prescriptions: number;
      discharges: number;
      surgicalCases: number;
    };
    lastWeek: {
      patientsRegistered: number;
      labTests: number;
      prescriptions: number;
      discharges: number;
      surgicalCases: number;
    };
    lastMonth: {
      patientsRegistered: number;
      labTests: number;
      prescriptions: number;
      discharges: number;
      surgicalCases: number;
    };
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.patientId, patientId));
    return patient || undefined;
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    // Generate patient ID
    const today = new Date();
    const year = today.getFullYear();
    const count = await db.select().from(patients).where(ilike(patients.patientId, `HMS-${year}-%`));
    const patientId = `HMS-${year}-${String(count.length + 1).padStart(3, '0')}`;
    
    const [newPatient] = await db.insert(patients).values({
      ...patient,
      patientId,
    }).returning();
    return newPatient;
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async searchPatients(query: string): Promise<Patient[]> {
    return await db.select().from(patients)
      .where(or(
        ilike(patients.name, `%${query}%`),
        ilike(patients.patientId, `%${query}%`)
      ))
      .limit(10);
  }

  async getLabTest(id: string): Promise<(LabTest & { patient: Patient }) | undefined> {
    const [labTest] = await db.select({
      id: labTests.id,
      patientId: labTests.patientId,
      testTypes: labTests.testTypes,
      results: labTests.results,
      doctorNotes: labTests.doctorNotes,
      totalCost: labTests.totalCost,
      status: labTests.status,
      createdBy: labTests.createdBy,
      createdAt: labTests.createdAt,
      patient: patients,
    })
    .from(labTests)
    .innerJoin(patients, eq(labTests.patientId, patients.id))
    .where(eq(labTests.id, id));
    return labTest || undefined;
  }

  async getLabTestsByPatient(patientId: string): Promise<LabTest[]> {
    return await db.select().from(labTests)
      .where(eq(labTests.patientId, patientId))
      .orderBy(desc(labTests.createdAt));
  }

  async createLabTest(labTest: InsertLabTest): Promise<LabTest> {
    const [newLabTest] = await db.insert(labTests).values(labTest).returning();
    return newLabTest;
  }

  async updateLabTest(id: string, updates: Partial<LabTest>): Promise<LabTest> {
    const [updatedLabTest] = await db.update(labTests)
      .set(updates)
      .where(eq(labTests.id, id))
      .returning();
    return updatedLabTest;
  }

  async getRecentLabTests(): Promise<(LabTest & { patient: Patient })[]> {
    return await db.select({
      id: labTests.id,
      patientId: labTests.patientId,
      testTypes: labTests.testTypes,
      results: labTests.results,
      doctorNotes: labTests.doctorNotes,
      totalCost: labTests.totalCost,
      status: labTests.status,
      createdBy: labTests.createdBy,
      createdAt: labTests.createdAt,
      patient: patients,
    })
    .from(labTests)
    .innerJoin(patients, eq(labTests.patientId, patients.id))
    .orderBy(desc(labTests.createdAt))
    .limit(10);
  }

  async getPrescription(id: string): Promise<Prescription | undefined> {
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return prescription || undefined;
  }

  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    return await db.select().from(prescriptions)
      .where(eq(prescriptions.patientId, patientId))
      .orderBy(desc(prescriptions.createdAt));
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const [newPrescription] = await db.insert(prescriptions).values(prescription).returning();
    return newPrescription;
  }

  async getRecentPrescriptions(): Promise<(Prescription & { patient: Patient })[]> {
    return await db.select({
      id: prescriptions.id,
      billNumber: prescriptions.billNumber,
      patientId: prescriptions.patientId,
      medicines: prescriptions.medicines,
      subtotal: prescriptions.subtotal,
      tax: prescriptions.tax,
      total: prescriptions.total,
      createdBy: prescriptions.createdBy,
      createdAt: prescriptions.createdAt,
      patient: patients,
    })
    .from(prescriptions)
    .innerJoin(patients, eq(prescriptions.patientId, patients.id))
    .orderBy(desc(prescriptions.createdAt))
    .limit(10);
  }

  async getDischargeSummary(id: string): Promise<DischargeSummary | undefined> {
    const [summary] = await db.select().from(dischargeSummaries).where(eq(dischargeSummaries.id, id));
    return summary || undefined;
  }

  async getDischargeSummariesByPatient(patientId: string): Promise<DischargeSummary[]> {
    return await db.select().from(dischargeSummaries)
      .where(eq(dischargeSummaries.patientId, patientId))
      .orderBy(desc(dischargeSummaries.createdAt));
  }

  async createDischargeSummary(summary: InsertDischargeSummary): Promise<DischargeSummary> {
    const [newSummary] = await db.insert(dischargeSummaries).values(summary).returning();
    return newSummary;
  }

  async getRecentDischargeSummaries(): Promise<(DischargeSummary & { patient: Patient })[]> {
    return await db.select({
      id: dischargeSummaries.id,
      patientId: dischargeSummaries.patientId,
      primaryDiagnosis: dischargeSummaries.primaryDiagnosis,
      secondaryDiagnosis: dischargeSummaries.secondaryDiagnosis,
      treatmentSummary: dischargeSummaries.treatmentSummary,
      medications: dischargeSummaries.medications,
      followupInstructions: dischargeSummaries.followupInstructions,
      dischargeDate: dischargeSummaries.dischargeDate,
      attendingPhysician: dischargeSummaries.attendingPhysician,
      admissionDate: dischargeSummaries.admissionDate,
      createdBy: dischargeSummaries.createdBy,
      createdAt: dischargeSummaries.createdAt,
      patient: patients,
    })
    .from(dischargeSummaries)
    .innerJoin(patients, eq(dischargeSummaries.patientId, patients.id))
    .orderBy(desc(dischargeSummaries.createdAt))
    .limit(10);
  }

  async getStats(): Promise<{
    totalPatients: number;
    labTestsToday: number;
    prescriptionsToday: number;
    dischargesToday: number;
    consultationsToday: number;
    surgicalCasesToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalPatients] = await db.select({ count: sql`count(*)` }).from(patients);
    const [labTestsToday] = await db.select({ count: sql`count(*)` }).from(labTests)
      .where(sql`${labTests.createdAt} >= ${today} AND ${labTests.createdAt} < ${tomorrow}`);
    const [prescriptionsToday] = await db.select({ count: sql`count(*)` }).from(prescriptions)
      .where(sql`${prescriptions.createdAt} >= ${today} AND ${prescriptions.createdAt} < ${tomorrow}`);
    const [dischargesToday] = await db.select({ count: sql`count(*)` }).from(dischargeSummaries)
      .where(sql`${dischargeSummaries.createdAt} >= ${today} AND ${dischargeSummaries.createdAt} < ${tomorrow}`);
    const [consultationsToday] = await db.select({ count: sql`count(*)` }).from(consultations)
      .where(sql`${consultations.createdAt} >= ${today} AND ${consultations.createdAt} < ${tomorrow}`);
    const [surgicalCasesToday] = await db.select({ count: sql`count(*)` }).from(surgicalCaseSheets)
      .where(sql`${surgicalCaseSheets.createdAt} >= ${today} AND ${surgicalCaseSheets.createdAt} < ${tomorrow}`);

    return {
      totalPatients: Number(totalPatients.count),
      labTestsToday: Number(labTestsToday.count),
      prescriptionsToday: Number(prescriptionsToday.count),
      dischargesToday: Number(dischargesToday.count),
      consultationsToday: Number(consultationsToday.count),
      surgicalCasesToday: Number(surgicalCasesToday.count),
    };
  }

  async getHistoricalStats(): Promise<{
    yesterday: {
      patientsRegistered: number;
      labTests: number;
      prescriptions: number;
      discharges: number;
      surgicalCases: number;
    };
    lastWeek: {
      patientsRegistered: number;
      labTests: number;
      prescriptions: number;
      discharges: number;
      surgicalCases: number;
    };
    lastMonth: {
      patientsRegistered: number;
      labTests: number;
      prescriptions: number;
      discharges: number;
      surgicalCases: number;
    };
  }> {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);

    const lastMonthStart = new Date(now);
    lastMonthStart.setDate(lastMonthStart.getDate() - 30);
    lastMonthStart.setHours(0, 0, 0, 0);

    // Yesterday's counts
    const [yesterdayPatients] = await db.select({ count: sql`count(*)` }).from(patientsRegistration)
      .where(sql`${patientsRegistration.createdAt} >= ${yesterday} AND ${patientsRegistration.createdAt} <= ${yesterdayEnd}`);
    
    const [yesterdayLabTests] = await db.select({ count: sql`count(*)` }).from(labTests)
      .where(sql`${labTests.createdAt} >= ${yesterday} AND ${labTests.createdAt} <= ${yesterdayEnd}`);
    
    const [yesterdayPrescriptions] = await db.select({ count: sql`count(*)` }).from(prescriptions)
      .where(sql`${prescriptions.createdAt} >= ${yesterday} AND ${prescriptions.createdAt} <= ${yesterdayEnd}`);
    
    const [yesterdayDischarges] = await db.select({ count: sql`count(*)` }).from(dischargeSummaries)
      .where(sql`${dischargeSummaries.createdAt} >= ${yesterday} AND ${dischargeSummaries.createdAt} <= ${yesterdayEnd}`);
    
    const [yesterdaySurgical] = await db.select({ count: sql`count(*)` }).from(surgicalCaseSheets)
      .where(sql`${surgicalCaseSheets.createdAt} >= ${yesterday} AND ${surgicalCaseSheets.createdAt} <= ${yesterdayEnd}`);

    // Last week's counts
    const [weekPatients] = await db.select({ count: sql`count(*)` }).from(patientsRegistration)
      .where(sql`${patientsRegistration.createdAt} >= ${lastWeekStart}`);
    
    const [weekLabTests] = await db.select({ count: sql`count(*)` }).from(labTests)
      .where(sql`${labTests.createdAt} >= ${lastWeekStart}`);
    
    const [weekPrescriptions] = await db.select({ count: sql`count(*)` }).from(prescriptions)
      .where(sql`${prescriptions.createdAt} >= ${lastWeekStart}`);
    
    const [weekDischarges] = await db.select({ count: sql`count(*)` }).from(dischargeSummaries)
      .where(sql`${dischargeSummaries.createdAt} >= ${lastWeekStart}`);
    
    const [weekSurgical] = await db.select({ count: sql`count(*)` }).from(surgicalCaseSheets)
      .where(sql`${surgicalCaseSheets.createdAt} >= ${lastWeekStart}`);

    // Last month's counts
    const [monthPatients] = await db.select({ count: sql`count(*)` }).from(patientsRegistration)
      .where(sql`${patientsRegistration.createdAt} >= ${lastMonthStart}`);
    
    const [monthLabTests] = await db.select({ count: sql`count(*)` }).from(labTests)
      .where(sql`${labTests.createdAt} >= ${lastMonthStart}`);
    
    const [monthPrescriptions] = await db.select({ count: sql`count(*)` }).from(prescriptions)
      .where(sql`${prescriptions.createdAt} >= ${lastMonthStart}`);
    
    const [monthDischarges] = await db.select({ count: sql`count(*)` }).from(dischargeSummaries)
      .where(sql`${dischargeSummaries.createdAt} >= ${lastMonthStart}`);
    
    const [monthSurgical] = await db.select({ count: sql`count(*)` }).from(surgicalCaseSheets)
      .where(sql`${surgicalCaseSheets.createdAt} >= ${lastMonthStart}`);

    return {
      yesterday: {
        patientsRegistered: Number(yesterdayPatients?.count || 0),
        labTests: Number(yesterdayLabTests?.count || 0),
        prescriptions: Number(yesterdayPrescriptions?.count || 0),
        discharges: Number(yesterdayDischarges?.count || 0),
        surgicalCases: Number(yesterdaySurgical?.count || 0),
      },
      lastWeek: {
        patientsRegistered: Number(weekPatients?.count || 0),
        labTests: Number(weekLabTests?.count || 0),
        prescriptions: Number(weekPrescriptions?.count || 0),
        discharges: Number(weekDischarges?.count || 0),
        surgicalCases: Number(weekSurgical?.count || 0),
      },
      lastMonth: {
        patientsRegistered: Number(monthPatients?.count || 0),
        labTests: Number(monthLabTests?.count || 0),
        prescriptions: Number(monthPrescriptions?.count || 0),
        discharges: Number(monthDischarges?.count || 0),
        surgicalCases: Number(monthSurgical?.count || 0),
      },
    };
  }

  // Medical History Methods
  async getMedicalHistoryEntry(id: string): Promise<MedicalHistory | undefined> {
    const [entry] = await db.select().from(medicalHistory).where(eq(medicalHistory.id, id));
    return entry || undefined;
  }

  async getMedicalHistoryByPatient(patientId: string): Promise<MedicalHistory[]> {
    return await db.select().from(medicalHistory)
      .where(eq(medicalHistory.patientId, patientId))
      .orderBy(desc(medicalHistory.createdAt));
  }

  async createMedicalHistoryEntry(entry: InsertMedicalHistory): Promise<MedicalHistory> {
    const [newEntry] = await db.insert(medicalHistory).values(entry).returning();
    return newEntry;
  }

  async updateMedicalHistoryEntry(id: string, updates: Partial<MedicalHistory>): Promise<MedicalHistory> {
    const [updatedEntry] = await db.update(medicalHistory)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(medicalHistory.id, id))
      .returning();
    return updatedEntry;
  }

  async deleteMedicalHistoryEntry(id: string): Promise<void> {
    await db.delete(medicalHistory).where(eq(medicalHistory.id, id));
  }

  // Patient Profile Methods
  async getPatientProfile(patientId: string): Promise<PatientProfile | undefined> {
    const [profile] = await db.select().from(patientProfiles)
      .where(eq(patientProfiles.patientId, patientId));
    return profile || undefined;
  }

  async createOrUpdatePatientProfile(profile: InsertPatientProfile): Promise<PatientProfile> {
    const existingProfile = await this.getPatientProfile(profile.patientId);
    
    if (existingProfile) {
      const [updatedProfile] = await db.update(patientProfiles)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(patientProfiles.patientId, profile.patientId))
        .returning();
      return updatedProfile;
    } else {
      const [newProfile] = await db.insert(patientProfiles).values(profile).returning();
      return newProfile;
    }
  }

  // Consultation Methods
  async getConsultation(id: string): Promise<Consultation | undefined> {
    const [consultation] = await db.select().from(consultations).where(eq(consultations.id, id));
    return consultation || undefined;
  }

  async getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
    return await db.select().from(consultations)
      .where(eq(consultations.patientId, patientId))
      .orderBy(desc(consultations.consultationDate));
  }

  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    // Convert dates properly for database insertion
    const consultationToInsert: any = {
      ...consultation,
      consultationDate: new Date(consultation.consultationDate),
      followUpDate: consultation.followUpDate ? new Date(consultation.followUpDate) : null,
    };
    
    const [newConsultation] = await db.insert(consultations).values(consultationToInsert).returning();
    return newConsultation;
  }

  async updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation> {
    const [updatedConsultation] = await db.update(consultations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(consultations.id, id))
      .returning();
    return updatedConsultation;
  }

  async deleteConsultation(id: string): Promise<void> {
    await db.delete(consultations).where(eq(consultations.id, id));
  }

  async getRecentConsultations(): Promise<(Consultation & { patient: Patient })[]> {
    return await db.select({
      id: consultations.id,
      patientId: consultations.patientId,
      doctorName: consultations.doctorName,
      consultationDate: consultations.consultationDate,
      chiefComplaint: consultations.chiefComplaint,
      presentIllnessHistory: consultations.presentIllnessHistory,
      pastMedicalHistory: consultations.pastMedicalHistory,
      examination: consultations.examination,
      diagnosis: consultations.diagnosis,
      treatment: consultations.treatment,
      prescription: consultations.prescription,
      followUpDate: consultations.followUpDate,
      notes: consultations.notes,
      consultationType: consultations.consultationType,
      status: consultations.status,
      createdBy: consultations.createdBy,
      createdAt: consultations.createdAt,
      updatedAt: consultations.updatedAt,
      patient: patients,
    })
    .from(consultations)
    .innerJoin(patients, eq(consultations.patientId, patients.id))
    .orderBy(desc(consultations.consultationDate))
    .limit(10);
  }

  // Lab Test Definitions methods
  async getAllLabTestDefinitions(): Promise<any[]> {
    const testDefinitions = await db.select().from(labTestDefinitions).orderBy(desc(labTestDefinitions.createdAt));
    return testDefinitions;
  }

  async getActiveLabTestDefinitions(): Promise<any[]> {
    const testDefinitions = await db.select().from(labTestDefinitions)
      .where(eq(labTestDefinitions.isActive, true))
      .orderBy(labTestDefinitions.testName);
    return testDefinitions;
  }

  async createLabTestDefinition(definition: any): Promise<any> {
    const [testDefinition] = await db.insert(labTestDefinitions).values(definition).returning();
    return testDefinition;
  }

  async updateLabTestDefinition(id: string, updates: Partial<any>): Promise<any> {
    const [testDefinition] = await db.update(labTestDefinitions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(labTestDefinitions.id, id))
      .returning();
    return testDefinition;
  }

  async deleteLabTestDefinition(id: string): Promise<void> {
    await db.update(labTestDefinitions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(labTestDefinitions.id, id));
  }

  // Surgical Case Sheet Methods
  async getSurgicalCaseSheet(id: string): Promise<(SurgicalCaseSheet & { patient: Patient }) | undefined> {
    const [caseSheet] = await db.select({
      id: surgicalCaseSheets.id,
      caseNumber: surgicalCaseSheets.caseNumber,
      patientId: surgicalCaseSheets.patientId,
      patientName: surgicalCaseSheets.patientName,
      husbandFatherName: surgicalCaseSheets.husbandFatherName,
      religion: surgicalCaseSheets.religion,
      nationality: surgicalCaseSheets.nationality,
      age: surgicalCaseSheets.age,
      sex: surgicalCaseSheets.sex,
      address: surgicalCaseSheets.address,
      village: surgicalCaseSheets.village,
      district: surgicalCaseSheets.district,
      diagnosis: surgicalCaseSheets.diagnosis,
      natureOfOperation: surgicalCaseSheets.natureOfOperation,
      edd: surgicalCaseSheets.edd,
      dateOfAdmission: surgicalCaseSheets.dateOfAdmission,
      dateOfOperation: surgicalCaseSheets.dateOfOperation,
      dateOfDischarge: surgicalCaseSheets.dateOfDischarge,
      lpNo: surgicalCaseSheets.lpNo,
      complaintsAndDuration: surgicalCaseSheets.complaintsAndDuration,
      historyOfPresentIllness: surgicalCaseSheets.historyOfPresentIllness,
      hb: surgicalCaseSheets.hb,
      bsa: surgicalCaseSheets.bsa,
      ct: surgicalCaseSheets.ct,
      bt: surgicalCaseSheets.bt,
      bloodGrouping: surgicalCaseSheets.bloodGrouping,
      rhFactor: surgicalCaseSheets.rhFactor,
      prl: surgicalCaseSheets.prl,
      rbs: surgicalCaseSheets.rbs,
      urineSugar: surgicalCaseSheets.urineSugar,
      xray: surgicalCaseSheets.xray,
      ecg: surgicalCaseSheets.ecg,
      bloodUrea: surgicalCaseSheets.bloodUrea,
      serumCreatinine: surgicalCaseSheets.serumCreatinine,
      serumBilirubin: surgicalCaseSheets.serumBilirubin,
      hbsag: surgicalCaseSheets.hbsag,
      generalCondition: surgicalCaseSheets.generalCondition,
      temperature: surgicalCaseSheets.temperature,
      pulse: surgicalCaseSheets.pulse,
      bloodPressure: surgicalCaseSheets.bloodPressure,
      respiratoryRate: surgicalCaseSheets.respiratoryRate,
      heart: surgicalCaseSheets.heart,
      lungs: surgicalCaseSheets.lungs,
      abdomen: surgicalCaseSheets.abdomen,
      cns: surgicalCaseSheets.cns,
      createdBy: surgicalCaseSheets.createdBy,
      createdAt: surgicalCaseSheets.createdAt,
      updatedAt: surgicalCaseSheets.updatedAt,
      patient: patients,
    })
    .from(surgicalCaseSheets)
    .innerJoin(patients, eq(surgicalCaseSheets.patientId, patients.id))
    .where(eq(surgicalCaseSheets.id, id));
    return caseSheet || undefined;
  }

  async getSurgicalCaseSheetsByPatient(patientId: string): Promise<SurgicalCaseSheet[]> {
    return await db.select().from(surgicalCaseSheets)
      .where(eq(surgicalCaseSheets.patientId, patientId))
      .orderBy(desc(surgicalCaseSheets.createdAt));
  }

  async createSurgicalCaseSheet(caseSheet: InsertSurgicalCaseSheet & { createdBy?: string }): Promise<SurgicalCaseSheet> {
    // Generate unique case number based on patient ID
    const patientIdShort = caseSheet.patientId.slice(-4);
    const existingSheets = await this.getSurgicalCaseSheetsByPatient(caseSheet.patientId);
    const patientCaseCounter = existingSheets.length + 1;
    const caseNumber = `SCS${patientIdShort}-${String(patientCaseCounter).padStart(2, '0')}`;

    const caseSheetData = {
      ...caseSheet,
      caseNumber,
      createdBy: caseSheet.createdBy || 'system',
    };

    const [newCaseSheet] = await db.insert(surgicalCaseSheets).values([caseSheetData]).returning();
    return newCaseSheet;
  }

  async updateSurgicalCaseSheet(id: string, updates: Partial<SurgicalCaseSheet>): Promise<SurgicalCaseSheet> {
    const [updatedCaseSheet] = await db.update(surgicalCaseSheets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(surgicalCaseSheets.id, id))
      .returning();
    return updatedCaseSheet;
  }

  async getRecentSurgicalCaseSheets(): Promise<(SurgicalCaseSheet & { patient: Patient })[]> {
    return await db.select({
      id: surgicalCaseSheets.id,
      caseNumber: surgicalCaseSheets.caseNumber,
      patientId: surgicalCaseSheets.patientId,
      patientName: surgicalCaseSheets.patientName,
      husbandFatherName: surgicalCaseSheets.husbandFatherName,
      religion: surgicalCaseSheets.religion,
      nationality: surgicalCaseSheets.nationality,
      age: surgicalCaseSheets.age,
      sex: surgicalCaseSheets.sex,
      address: surgicalCaseSheets.address,
      village: surgicalCaseSheets.village,
      district: surgicalCaseSheets.district,
      diagnosis: surgicalCaseSheets.diagnosis,
      natureOfOperation: surgicalCaseSheets.natureOfOperation,
      edd: surgicalCaseSheets.edd,
      dateOfAdmission: surgicalCaseSheets.dateOfAdmission,
      dateOfOperation: surgicalCaseSheets.dateOfOperation,
      dateOfDischarge: surgicalCaseSheets.dateOfDischarge,
      lpNo: surgicalCaseSheets.lpNo,
      complaintsAndDuration: surgicalCaseSheets.complaintsAndDuration,
      historyOfPresentIllness: surgicalCaseSheets.historyOfPresentIllness,
      hb: surgicalCaseSheets.hb,
      bsa: surgicalCaseSheets.bsa,
      ct: surgicalCaseSheets.ct,
      bt: surgicalCaseSheets.bt,
      bloodGrouping: surgicalCaseSheets.bloodGrouping,
      rhFactor: surgicalCaseSheets.rhFactor,
      prl: surgicalCaseSheets.prl,
      rbs: surgicalCaseSheets.rbs,
      urineSugar: surgicalCaseSheets.urineSugar,
      xray: surgicalCaseSheets.xray,
      ecg: surgicalCaseSheets.ecg,
      bloodUrea: surgicalCaseSheets.bloodUrea,
      serumCreatinine: surgicalCaseSheets.serumCreatinine,
      serumBilirubin: surgicalCaseSheets.serumBilirubin,
      hbsag: surgicalCaseSheets.hbsag,
      generalCondition: surgicalCaseSheets.generalCondition,
      temperature: surgicalCaseSheets.temperature,
      pulse: surgicalCaseSheets.pulse,
      bloodPressure: surgicalCaseSheets.bloodPressure,
      respiratoryRate: surgicalCaseSheets.respiratoryRate,
      heart: surgicalCaseSheets.heart,
      lungs: surgicalCaseSheets.lungs,
      abdomen: surgicalCaseSheets.abdomen,
      cns: surgicalCaseSheets.cns,
      createdBy: surgicalCaseSheets.createdBy,
      createdAt: surgicalCaseSheets.createdAt,
      updatedAt: surgicalCaseSheets.updatedAt,
      patient: patients,
    })
    .from(surgicalCaseSheets)
    .innerJoin(patients, eq(surgicalCaseSheets.patientId, patients.id))
    .orderBy(desc(surgicalCaseSheets.createdAt))
    .limit(10);
  }

  // Patients Registration methods
  async getPatientsRegistration(id: string): Promise<PatientsRegistration | undefined> {
    const [registration] = await db.select().from(patientsRegistration).where(eq(patientsRegistration.id, id));
    return registration;
  }

  async getAllPatientsRegistrations(): Promise<PatientsRegistration[]> {
    return await db.select().from(patientsRegistration).orderBy(desc(patientsRegistration.createdAt));
  }

  async createPatientsRegistration(registration: InsertPatientsRegistration): Promise<PatientsRegistration> {
    const [newRegistration] = await db.insert(patientsRegistration)
      .values(registration)
      .returning();
    return newRegistration;
  }

  async searchPatientsRegistrations(query: string): Promise<PatientsRegistration[]> {
    return await db.select().from(patientsRegistration)
      .where(
        or(
          ilike(patientsRegistration.mruNumber, `%${query}%`),
          ilike(patientsRegistration.fullName, `%${query}%`),
          ilike(patientsRegistration.contactPhone, `%${query}%`)
        )
      )
      .orderBy(desc(patientsRegistration.createdAt));
  }
}

export const storage = new DatabaseStorage();
