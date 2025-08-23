import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertPatientSchema, insertLabTestSchema, insertPrescriptionSchema, insertDischargeSummarySchema, insertMedicalHistorySchema, insertPatientProfileSchema, insertConsultationSchema, insertLabTestDefinitionSchema, insertSurgicalCaseSheetSchema, insertPatientsRegistrationSchema, insertMedicineInventorySchema } from "@shared/schema";
import { z } from "zod";
import { generateChatResponse, generateMedicalAssistance } from "./gemini";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password, role } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (user.role !== role) {
        return res.status(401).json({ message: 'Invalid role' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role, 
          name: user.name 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Patient routes
  app.get('/api/patients', authenticateToken, async (req: any, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/patients/search', authenticateToken, async (req: any, res) => {
    try {
      const { q } = req.query;
      let patients;
      
      if (!q || q.trim() === '') {
        // If no search query, return first 5 patients
        patients = await storage.getRecentPatientsRegistrations(5);
      } else {
        // Search with any length query
        patients = await storage.searchPatientsRegistrations(q as string);
      }
      
      res.json(patients);
    } catch (error) {
      console.error('Patient search error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/patients', authenticateToken, async (req: any, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/patients/:id', authenticateToken, async (req: any, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Lab test routes
  app.post('/api/lab-tests', authenticateToken, async (req: any, res) => {
    try {
      const labTestData = insertLabTestSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      const labTest = await storage.createLabTest(labTestData);
      res.status(201).json(labTest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/lab-tests/:id', authenticateToken, async (req: any, res) => {
    try {
      const { results, doctorNotes, status } = req.body;
      const updatedLabTest = await storage.updateLabTest(req.params.id, {
        results,
        doctorNotes,
        status,
      });
      res.json(updatedLabTest);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/lab-tests/recent', authenticateToken, async (req: any, res) => {
    try {
      const labTests = await storage.getRecentLabTests();
      res.json(labTests);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/lab-tests/:id', authenticateToken, async (req: any, res) => {
    try {
      const labTest = await storage.getLabTest(req.params.id);
      if (!labTest) {
        return res.status(404).json({ message: 'Lab test not found' });
      }
      res.json(labTest);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Prescription routes
  app.post('/api/prescriptions', authenticateToken, async (req: any, res) => {
    try {
      // Generate bill number
      const today = new Date();
      const year = today.getFullYear();
      const prescriptions = await storage.getRecentPrescriptions();
      const billNumber = `PH-${year}-${String(prescriptions.length + 1).padStart(3, '0')}`;

      const prescriptionData = insertPrescriptionSchema.parse({
        ...req.body,
        billNumber,
        createdBy: req.user.id,
      });
      
      const prescription = await storage.createPrescription(prescriptionData);
      res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/prescriptions/recent', authenticateToken, async (req: any, res) => {
    try {
      const prescriptions = await storage.getRecentPrescriptions();
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/prescriptions/:id', authenticateToken, async (req: any, res) => {
    try {
      const prescription = await storage.getPrescription(req.params.id);
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Discharge summary routes
  app.post('/api/discharge-summaries', authenticateToken, async (req: any, res) => {
    try {
      const summaryData = insertDischargeSummarySchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      const summary = await storage.createDischargeSummary(summaryData);
      res.status(201).json(summary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/discharge-summaries/recent', authenticateToken, async (req: any, res) => {
    try {
      const summaries = await storage.getRecentDischargeSummaries();
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/discharge-summaries/:id', authenticateToken, async (req: any, res) => {
    try {
      const summary = await storage.getDischargeSummary(req.params.id);
      if (!summary) {
        return res.status(404).json({ message: 'Discharge summary not found' });
      }
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Medical History Routes
  app.get('/api/medical-history/:patientId', authenticateToken, async (req: any, res) => {
    try {
      const history = await storage.getMedicalHistoryByPatient(req.params.patientId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/medical-history', authenticateToken, async (req: any, res) => {
    try {
      const entryData = insertMedicalHistorySchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const entry = await storage.createMedicalHistoryEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/medical-history/:id', authenticateToken, async (req: any, res) => {
    try {
      const updates = req.body;
      const entry = await storage.updateMedicalHistoryEntry(req.params.id, updates);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/medical-history/:id', authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteMedicalHistoryEntry(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Patient Profile Routes
  app.get('/api/patient-profile/:patientId', authenticateToken, async (req: any, res) => {
    try {
      const profile = await storage.getPatientProfile(req.params.patientId);
      res.json(profile || {});
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/patient-profile', authenticateToken, async (req: any, res) => {
    try {
      const profileData = insertPatientProfileSchema.parse(req.body);
      const profile = await storage.createOrUpdatePatientProfile(profileData);
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Consultation Routes
  app.get('/api/consultations/:patientId', authenticateToken, async (req: any, res) => {
    try {
      const consultations = await storage.getConsultationsByPatient(req.params.patientId);
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/consultations', authenticateToken, async (req: any, res) => {
    try {
      const consultationData = insertConsultationSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const consultation = await storage.createConsultation(consultationData);
      res.status(201).json(consultation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/consultations/recent', authenticateToken, async (req: any, res) => {
    try {
      const consultations = await storage.getRecentConsultations();
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/consultation/:id', authenticateToken, async (req: any, res) => {
    try {
      const consultation = await storage.getConsultation(req.params.id);
      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }
      res.json(consultation);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/consultations/:id', authenticateToken, async (req: any, res) => {
    try {
      const updates = req.body;
      const consultation = await storage.updateConsultation(req.params.id, updates);
      res.json(consultation);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/consultations/:id', authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteConsultation(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Lab Test Definitions routes
  app.get('/api/lab-test-definitions', authenticateToken, async (req: any, res) => {
    try {
      const definitions = await storage.getAllLabTestDefinitions();
      res.json(definitions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/lab-test-definitions/active', authenticateToken, async (req: any, res) => {
    try {
      const definitions = await storage.getActiveLabTestDefinitions();
      res.json(definitions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/lab-test-definitions', authenticateToken, async (req: any, res) => {
    try {
      const definitionData = insertLabTestDefinitionSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const definition = await storage.createLabTestDefinition(definitionData);
      res.status(201).json(definition);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/lab-test-definitions/:id', authenticateToken, async (req: any, res) => {
    try {
      const updates = req.body;
      const definition = await storage.updateLabTestDefinition(req.params.id, updates);
      res.json(definition);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/lab-test-definitions/:id', authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteLabTestDefinition(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Surgical case sheet routes
  app.get('/api/surgical-case-sheets/:id', authenticateToken, async (req: any, res) => {
    try {
      const caseSheet = await storage.getSurgicalCaseSheet(req.params.id);
      if (!caseSheet) {
        return res.status(404).json({ message: 'Surgical case sheet not found' });
      }
      res.json(caseSheet);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/patients/:patientId/surgical-case-sheets', authenticateToken, async (req: any, res) => {
    try {
      const caseSheets = await storage.getSurgicalCaseSheetsByPatient(req.params.patientId);
      res.json(caseSheets);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/surgical-case-sheets', authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertSurgicalCaseSheetSchema.parse(req.body);
      const caseSheetData = {
        ...validatedData,
        createdBy: req.user.id
      };
      
      const caseSheet = await storage.createSurgicalCaseSheet(caseSheetData);
      res.status(201).json(caseSheet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Surgical case sheet creation error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/surgical-case-sheets/:id', authenticateToken, async (req: any, res) => {
    try {
      const updates = req.body;
      const caseSheet = await storage.updateSurgicalCaseSheet(req.params.id, updates);
      res.json(caseSheet);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/surgical-case-sheets', authenticateToken, async (req: any, res) => {
    try {
      const caseSheets = await storage.getRecentSurgicalCaseSheets();
      res.json(caseSheets);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Patients Registration endpoints
  app.post('/api/patients-registration', authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertPatientsRegistrationSchema.parse(req.body);
      const registrationData = {
        ...validatedData,
        createdBy: req.user.id
      };
      
      const registration = await storage.createPatientsRegistration(registrationData);
      res.status(201).json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/patients-registration', authenticateToken, async (req: any, res) => {
    try {
      const registrations = await storage.getAllPatientsRegistrations();
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/patients-registration/:id', authenticateToken, async (req: any, res) => {
    try {
      const registration = await storage.getPatientsRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: 'Patient registration not found' });
      }
      res.json(registration);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/patients-registration/:id', authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertPatientsRegistrationSchema.parse(req.body);
      const updatedRegistration = await storage.updatePatientsRegistration(req.params.id, validatedData);
      if (!updatedRegistration) {
        return res.status(404).json({ message: 'Patient registration not found' });
      }
      res.json(updatedRegistration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      console.error('Error updating patient registration:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Search patients registration by MRU number, name, or phone
  app.get('/api/patients-registration/search/:query', authenticateToken, async (req: any, res) => {
    try {
      const registrations = await storage.searchPatientsRegistrations(req.params.query);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // AI Chat endpoints
  app.post('/api/chat', authenticateToken, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: 'Message is required' });
      }

      // Get current hospital stats and historical data to provide real data to AI
      const stats = await storage.getStats();
      const historicalStats = await storage.getHistoricalStats();
      const hospitalContext = `=== REAL-TIME NAKSHATRA HOSPITAL DATA (YOU HAVE ACCESS TO THIS) ===
Today's Statistics:
- Total Patients Registered: ${stats.totalPatients}
- Lab Tests Completed Today: ${stats.labTestsToday}
- Prescriptions Issued Today: ${stats.prescriptionsToday}
- Patient Discharges Today: ${stats.dischargesToday}
- Surgical Cases Today: ${stats.surgicalCasesToday || 0}

Yesterday's Statistics:
- Patients Registered: ${historicalStats.yesterday.patientsRegistered}
- Lab Tests: ${historicalStats.yesterday.labTests}
- Prescriptions: ${historicalStats.yesterday.prescriptions}
- Discharges: ${historicalStats.yesterday.discharges}
- Surgical Cases: ${historicalStats.yesterday.surgicalCases}

Last 7 Days Statistics:
- Patients Registered: ${historicalStats.lastWeek.patientsRegistered}
- Lab Tests: ${historicalStats.lastWeek.labTests}
- Prescriptions: ${historicalStats.lastWeek.prescriptions}
- Discharges: ${historicalStats.lastWeek.discharges}
- Surgical Cases: ${historicalStats.lastWeek.surgicalCases}

Last 30 Days Statistics:
- Patients Registered: ${historicalStats.lastMonth.patientsRegistered}
- Lab Tests: ${historicalStats.lastMonth.labTests}
- Prescriptions: ${historicalStats.lastMonth.prescriptions}
- Discharges: ${historicalStats.lastMonth.discharges}
- Surgical Cases: ${historicalStats.lastMonth.surgicalCases}

MANDATORY: Use these exact numbers when users ask about hospital statistics for any time period. You DO have access to historical data.

${context || 'Nakshatra Hospital HMS assistance'}`;

      const response = await generateChatResponse(message, hospitalContext);
      res.json({ response });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ message: 'Failed to process chat request' });
    }
  });

  app.post('/api/medical-assistant', authenticateToken, async (req: any, res) => {
    try {
      const { symptoms, patientContext } = req.body;
      
      if (!symptoms || typeof symptoms !== 'string') {
        return res.status(400).json({ message: 'Symptoms/query is required' });
      }

      const response = await generateMedicalAssistance(symptoms, patientContext || '');
      res.json({ response });
    } catch (error) {
      console.error('Medical assistant error:', error);
      res.status(500).json({ message: 'Failed to process medical assistance request' });
    }
  });

  // Stats route
  app.get('/api/stats', authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Medicine Inventory routes
  app.get('/api/medicines', authenticateToken, async (req, res) => {
    try {
      const medicines = await storage.getAllMedicines();
      res.json(medicines);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      res.status(500).json({ message: 'Failed to fetch medicines' });
    }
  });

  app.get('/api/medicines/active', authenticateToken, async (req, res) => {
    try {
      const medicines = await storage.getActiveMedicines();
      res.json(medicines);
    } catch (error) {
      console.error('Error fetching active medicines:', error);
      res.status(500).json({ message: 'Failed to fetch active medicines' });
    }
  });

  app.get('/api/medicines/search', authenticateToken, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      const medicines = await storage.searchMedicines(q);
      res.json(medicines);
    } catch (error) {
      console.error('Error searching medicines:', error);
      res.status(500).json({ message: 'Failed to search medicines' });
    }
  });

  app.post('/api/medicines', authenticateToken, async (req, res) => {
    try {
      const medicineData = insertMedicineInventorySchema.parse(req.body);
      const medicine = await storage.createMedicine({
        ...medicineData,
        createdBy: req.user.id,
      });
      res.status(201).json(medicine);
    } catch (error) {
      console.error('Error creating medicine:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create medicine' });
    }
  });

  app.put('/api/medicines/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertMedicineInventorySchema.partial().parse(req.body);
      const medicine = await storage.updateMedicine(id, updates);
      res.json(medicine);
    } catch (error) {
      console.error('Error updating medicine:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update medicine' });
    }
  });

  app.delete('/api/medicines/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMedicine(id);
      res.json({ message: 'Medicine deleted successfully' });
    } catch (error) {
      console.error('Error deleting medicine:', error);
      res.status(500).json({ message: 'Failed to delete medicine' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
