import { 
  users, patients, labTests, prescriptions, dischargeSummaries, medicalHistory, patientProfiles, consultations,
  type User, type InsertUser, type Patient, type InsertPatient,
  type LabTest, type InsertLabTest, type Prescription, type InsertPrescription,
  type DischargeSummary, type InsertDischargeSummary, type MedicalHistory, type InsertMedicalHistory,
  type PatientProfile, type InsertPatientProfile, type Consultation, type InsertConsultation
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
  searchPatients(query: string): Promise<Patient[]>;
  
  // Lab Tests
  getLabTest(id: string): Promise<LabTest | undefined>;
  getLabTestsByPatient(patientId: string): Promise<LabTest[]>;
  createLabTest(labTest: InsertLabTest): Promise<LabTest>;
  updateLabTest(id: string, updates: Partial<LabTest>): Promise<LabTest>;
  getRecentLabTests(): Promise<(LabTest & { patient: Patient })[]>;
  
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
  
  // Stats
  getStats(): Promise<{
    totalPatients: number;
    labTestsToday: number;
    prescriptionsToday: number;
    dischargesToday: number;
    consultationsToday: number;
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

  async searchPatients(query: string): Promise<Patient[]> {
    return await db.select().from(patients)
      .where(or(
        ilike(patients.name, `%${query}%`),
        ilike(patients.patientId, `%${query}%`)
      ))
      .limit(10);
  }

  async getLabTest(id: string): Promise<LabTest | undefined> {
    const [labTest] = await db.select().from(labTests).where(eq(labTests.id, id));
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

    return {
      totalPatients: Number(totalPatients.count),
      labTestsToday: Number(labTestsToday.count),
      prescriptionsToday: Number(prescriptionsToday.count),
      dischargesToday: Number(dischargesToday.count),
      consultationsToday: Number(consultationsToday.count),
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
    const consultationToInsert = {
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
}

export const storage = new DatabaseStorage();
