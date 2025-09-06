import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import xlsx from "xlsx";
import { insertUserSchema, insertPatientSchema, insertLabTestSchema, insertPrescriptionSchema, insertDischargeSummarySchema, insertMedicalHistorySchema, insertPatientProfileSchema, insertConsultationSchema, insertLabTestDefinitionSchema, insertSurgicalCaseSheetSchema, insertPatientsRegistrationSchema, insertMedicineInventorySchema, insertHospitalSettingsSchema, type User } from "@shared/schema";
import { z } from "zod";
import { generateChatResponse, generateMedicalAssistance } from "./gemini";
import { sendOTP, generateOTP } from "./twilioService";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

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

  app.put('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const { name, username, phoneNumber } = req.body;
      
      // Validate input
      if (!name?.trim()) {
        return res.status(400).json({ message: 'Name is required' });
      }

      // Check if username is being changed and if it already exists
      if (username && username !== req.user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(409).json({ message: 'Username already exists' });
        }
      }

      const updateData: Partial<Pick<User, 'name' | 'username' | 'phoneNumber'>> = {};
      if (name) updateData.name = name.trim();
      if (username) updateData.username = username.trim();
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber?.trim() || null;

      const updatedUser = await storage.updateUser(req.user.id, updateData);
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Forgot Password routes
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { username, phoneNumber } = req.body;
      
      if (!username || !phoneNumber) {
        return res.status(400).json({ message: 'Username and phone number are required' });
      }

      // Check if user exists
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

      // Update user with OTP
      const otpUpdated = await storage.updateUserOTP(username, otp, expiresAt);
      if (!otpUpdated) {
        return res.status(500).json({ message: 'Failed to generate OTP' });
      }

      // Send OTP via SMS
      const smsSent = await sendOTP(phoneNumber, otp);
      if (!smsSent) {
        return res.status(500).json({ message: 'Failed to send OTP' });
      }

      res.json({ message: 'OTP sent successfully to your phone number' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/auth/verify-otp-reset', async (req, res) => {
    try {
      const { username, otp, newPassword } = req.body;
      
      if (!username || !otp || !newPassword) {
        return res.status(400).json({ message: 'Username, OTP, and new password are required' });
      }

      // Get user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check OTP
      if (!user.resetOtp || user.resetOtp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // Check OTP expiration
      if (!user.otpExpires || new Date() > user.otpExpires) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Reset password and clear OTP
      const passwordReset = await storage.resetUserPassword(username, hashedPassword);
      if (!passwordReset) {
        return res.status(500).json({ message: 'Failed to reset password' });
      }

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Verify OTP reset error:', error);
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
      console.log('Received prescription data:', JSON.stringify(req.body, null, 2));
      
      // Generate bill number
      const today = new Date();
      const year = today.getFullYear();
      
      // Get all prescriptions for current year to generate proper sequential number
      const allPrescriptions = await storage.getAllPrescriptionsForYear(year);
      const billNumber = `PH-${year}-${String(allPrescriptions.length + 1).padStart(3, '0')}`;

      const prescriptionData = insertPrescriptionSchema.parse({
        ...req.body,
        billNumber,
        createdBy: req.user.id,
      });

      // Check if medicines array exists and has items
      if (!prescriptionData.medicines || !Array.isArray(prescriptionData.medicines) || prescriptionData.medicines.length === 0) {
        return res.status(400).json({ message: 'No medicines provided in prescription' });
      }

      // Check stock availability for all medicines
      const medicinesArray = prescriptionData.medicines as any[];
      const stockChecks = await Promise.all(
        medicinesArray.map(async (medicine: any) => {
          const hasStock = await storage.checkMedicineStock(medicine.medicineId, medicine.quantity);
          return {
            medicineId: medicine.medicineId,
            name: medicine.name,
            requestedQuantity: medicine.quantity,
            hasStock
          };
        })
      );

      // Check if any medicine has insufficient stock
      const insufficientStock = stockChecks.filter((check: any) => !check.hasStock);
      if (insufficientStock.length > 0) {
        return res.status(400).json({
          message: 'Insufficient stock for the following medicines',
          insufficientStock: insufficientStock.map((item: any) => ({
            name: item.name,
            requestedQuantity: item.requestedQuantity
          }))
        });
      }

      // All stock checks passed, deduct quantities and create prescription
      console.log('Deducting quantities for medicines:', medicinesArray.map(m => ({ id: m.medicineId, name: m.name, qty: m.quantity })));
      
      await Promise.all(
        medicinesArray.map(async (medicine: any) => {
          console.log(`Deducting ${medicine.quantity} from medicine ${medicine.medicineId} (${medicine.name})`);
          const result = await storage.updateMedicineQuantity(medicine.medicineId, -medicine.quantity);
          console.log(`Updated medicine result:`, result);
        })
      );
      
      const prescription = await storage.createPrescription(prescriptionData);
      res.status(201).json(prescription);
    } catch (error) {
      console.error('Prescription creation error:', error);
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

  app.get('/api/prescriptions/search', authenticateToken, async (req: any, res) => {
    try {
      const { billNumber } = req.query;
      if (!billNumber) {
        return res.status(400).json({ message: 'Bill number is required' });
      }
      const prescriptions = await storage.searchPrescriptionsByBillNumber(billNumber as string);
      res.json(prescriptions);
    } catch (error) {
      console.error('Error searching prescriptions:', error);
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
      
      // Log activity for new patient registration
      await storage.createActivity({
        type: 'patient_registered',
        title: 'New patient registered',
        description: `${registration.fullName} (${registration.mruNumber}) has been registered`,
        entityId: registration.id,
        entityType: 'patient',
        userId: req.user.id,
      });
      
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

  // Get next MRU number (MUST BE BEFORE /:id route)
  app.get('/api/patients-registration/next-mru', authenticateToken, async (req: any, res) => {
    try {
      const nextMRU = await storage.getNextMRUNumber();
      res.json({ mruNumber: nextMRU });
    } catch (error) {
      console.error('Error generating next MRU number:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get recent patients
  app.get('/api/patients-registration/recent', authenticateToken, async (req: any, res) => {
    try {
      const recentPatients = await storage.getRecentPatientsRegistrations(3);
      res.json(recentPatients);
    } catch (error) {
      console.error('Error fetching recent patients:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Search patients registration by MRU number, name, or phone (MUST BE BEFORE /:id route)
  app.get('/api/patients-registration/search/:query', authenticateToken, async (req: any, res) => {
    try {
      const registrations = await storage.searchPatientsRegistrations(req.params.query);
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

  // Specific routes MUST come before parametric routes
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

  // Excel template endpoint - must come before :id route
  app.get('/api/medicines/excel-template', authenticateToken, async (req, res) => {
    try {
      // Create sample data for template
      const templateData = [
        {
          'Medicine Name': 'Paracetamol',
          'Batch Number': 'BATCH001',
          'Quantity': '100',
          'Units': 'tablets',
          'MRP': '25.50',
          'Manufacture Date': '2024-01-15',
          'Expiry Date': '2026-01-15',
          'Manufacturer': 'Generic Pharma Ltd',
          'Category': 'tablets',
          'Description': 'Pain relief medication'
        }
      ];
      
      // Create workbook and worksheet
      const XLSX = require('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicine Template');
      
      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=medicine-template.xlsx');
      res.setHeader('Content-Length', excelBuffer.length);
      
      // Send the Excel file
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error generating Excel template:', error);
      res.status(500).json({ message: 'Failed to generate template' });
    }
  });

  // Get single medicine by ID - MUST come after specific routes
  app.get('/api/medicines/:id', authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const medicine = await storage.getMedicine(id);
      
      if (!medicine) {
        return res.status(404).json({ message: 'Medicine not found' });
      }
      
      res.json(medicine);
    } catch (error) {
      console.error('Error fetching medicine:', error);
      res.status(500).json({ message: 'Failed to fetch medicine' });
    }
  });

  app.post('/api/medicines', authenticateToken, async (req: any, res) => {
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

  app.put('/api/medicines/:id', authenticateToken, async (req: any, res) => {
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

  app.delete('/api/medicines/:id', authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMedicine(id);
      res.json({ message: 'Medicine deleted successfully' });
    } catch (error) {
      console.error('Error deleting medicine:', error);
      res.status(500).json({ message: 'Failed to delete medicine' });
    }
  });

  // Medicine returns endpoint - for patients returning medicines to pharmacy
  app.post('/api/medicines/return', authenticateToken, async (req: any, res) => {
    try {
      const { medicineId, quantityReturned, notes } = req.body;
      
      // Validate input
      if (!medicineId || !quantityReturned || quantityReturned <= 0) {
        return res.status(400).json({ message: 'Medicine ID and valid quantity are required' });
      }
      
      // Update medicine quantity by adding the returned quantity
      const updatedMedicine = await storage.updateMedicineQuantity(medicineId, quantityReturned);
      
      res.json({
        message: 'Medicine returned successfully',
        medicine: updatedMedicine,
        quantityAdded: quantityReturned,
        newQuantity: updatedMedicine.quantity
      });
    } catch (error) {
      console.error('Error processing medicine return:', error);
      res.status(500).json({ message: 'Failed to process medicine return' });
    }
  });

  // Excel upload endpoint for bulk medicine import
  app.post('/api/medicines/upload-excel', authenticateToken, upload.single('excel'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Parse Excel file
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        return res.status(400).json({ message: 'Excel file is empty or invalid' });
      }

      const results = {
        success: true,
        totalRows: jsonData.length,
        imported: 0,
        duplicates: 0,
        errors: [] as Array<{ row: number; field: string; message: string }>
      };

      const medicinesData = [];

      // Process each row
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const rowNumber = i + 2; // Excel rows start from 2 (header is row 1)

        try {
          // Map Excel columns to our schema (flexible column names)
          const medicineData: any = {};

          // Required fields with flexible column names
          medicineData.medicineName = row['Medicine Name'] || row['medicine_name'] || row['name'] || row['Medicine'] || '';
          medicineData.batchNumber = row['Batch Number'] || row['batch_number'] || row['batch'] || row['Batch'] || '';
          medicineData.quantity = parseFloat(row['Quantity'] || row['quantity'] || row['qty'] || '0');
          medicineData.units = row['Units'] || row['units'] || row['unit'] || 'tablets';
          medicineData.mrp = row['MRP'] || row['mrp'] || row['price'] || row['Price'] || '';

          // Optional fields
          medicineData.manufacturer = row['Manufacturer'] || row['manufacturer'] || row['mfg'] || '';
          medicineData.category = row['Category'] || row['category'] || row['type'] || row['Type'] || 'tablets';
          medicineData.description = row['Description'] || row['description'] || row['desc'] || '';

          // Handle dates with proper validation - only set if valid
          const mfgDate = row['Manufacture Date'] || row['manufacture_date'] || row['mfg_date'];
          if (mfgDate && mfgDate.toString().trim() !== '' && mfgDate !== 'null' && mfgDate !== 'undefined') {
            try {
              const date = new Date(mfgDate);
              // Check if the date is valid and not "Invalid Date"
              if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
                medicineData.manufactureDate = date;
              }
              // If invalid, don't set the field at all
            } catch (e) {
              // Invalid date, don't set the field
            }
          }
          // If no valid date, don't set manufactureDate field at all

          // Handle Expiry Date - now required
          const expDate = row['Expiry Date'] || row['expiry_date'] || row['exp_date'];
          let hasValidExpiryDate = false;
          
          if (expDate && expDate.toString().trim() !== '' && expDate !== 'null' && expDate !== 'undefined') {
            try {
              const date = new Date(expDate);
              // Check if the date is valid and not "Invalid Date"
              if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
                medicineData.expiryDate = date;
                hasValidExpiryDate = true;
              }
            } catch (e) {
              // Invalid date
            }
          }

          // Validate required fields
          if (!medicineData.medicineName?.trim()) {
            results.errors.push({
              row: rowNumber,
              field: 'Medicine Name',
              message: 'Medicine name is required'
            });
            continue;
          }

          if (!medicineData.batchNumber?.trim()) {
            results.errors.push({
              row: rowNumber,
              field: 'Batch Number',
              message: 'Batch number is required'
            });
            continue;
          }

          if (!medicineData.quantity || medicineData.quantity <= 0) {
            results.errors.push({
              row: rowNumber,
              field: 'Quantity',
              message: 'Valid quantity is required'
            });
            continue;
          }

          if (!medicineData.mrp?.toString()?.trim()) {
            results.errors.push({
              row: rowNumber,
              field: 'MRP',
              message: 'MRP is required'
            });
            continue;
          }

          // Validate required Expiry Date
          if (!hasValidExpiryDate) {
            results.errors.push({
              row: rowNumber,
              field: 'Expiry Date',
              message: 'Valid Expiry Date is required'
            });
            continue;
          }

          // Validate schema
          const validatedData = insertMedicineInventorySchema.parse(medicineData);
          medicinesData.push({
            ...validatedData,
            createdBy: req.user.id
          });

        } catch (error) {
          console.error('Validation error for row', rowNumber, ':', error);
          results.errors.push({
            row: rowNumber,
            field: 'General',
            message: error instanceof z.ZodError ? error.errors[0].message : 'Invalid data format'
          });
        }
      }

      // Bulk create medicines (this will handle duplicates)
      if (medicinesData.length > 0) {
        try {
          const bulkResult = await storage.bulkCreateMedicines(medicinesData);
          results.imported = bulkResult.imported;
          results.duplicates = bulkResult.duplicates;
        } catch (error) {
          console.error('Bulk create error:', error);
          results.errors.push({
            row: 0,
            field: 'Database',
            message: 'Failed to save medicines to database'
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error('Excel upload error:', error);
      res.status(500).json({ 
        message: 'Failed to process Excel file',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });


  // Hospital Settings routes
  app.get('/api/hospital-settings', authenticateToken, async (req, res) => {
    try {
      const settings = await storage.getHospitalSettings();
      
      // Map database fields to form fields
      const mappedSettings = {
        name: settings.hospitalName,
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        website: settings.hospitalSubtitle || '',
        registrationNumber: settings.accreditation || '',
        // Keep original fields for PDF generation
        hospitalName: settings.hospitalName,
        hospitalSubtitle: settings.hospitalSubtitle,
        accreditation: settings.accreditation,
      };
      
      res.json(mappedSettings);
    } catch (error) {
      console.error('Error fetching hospital settings:', error);
      res.status(500).json({ message: 'Failed to fetch hospital settings' });
    }
  });

  app.patch('/api/hospital-settings', authenticateToken, async (req: any, res) => {
    try {
      const updates = insertHospitalSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateHospitalSettings(updates);
      res.json(settings);
    } catch (error) {
      console.error('Error updating hospital settings:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update hospital settings' });
    }
  });

  app.put('/api/hospital-settings', authenticateToken, async (req: any, res) => {
    try {
      // Map form fields to database fields
      const { name, address, phone, email, website, registrationNumber } = req.body;
      
      // Create clean mapped data - only include defined values
      const mappedData: any = {};
      if (name) mappedData.hospitalName = name;
      if (address) mappedData.address = address;
      if (phone) mappedData.phone = phone;
      if (email) mappedData.email = email;
      if (website !== undefined) mappedData.hospitalSubtitle = website;
      if (registrationNumber) mappedData.accreditation = registrationNumber;
      
      const updates = insertHospitalSettingsSchema.partial().parse(mappedData);
      const settings = await storage.updateHospitalSettings(updates);
      
      // Map response back to form format
      const responseData = {
        name: settings.hospitalName,
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        website: settings.hospitalSubtitle || '',
        registrationNumber: settings.accreditation || '',
        // Keep original fields for PDF generation
        hospitalName: settings.hospitalName,
        hospitalSubtitle: settings.hospitalSubtitle,
        accreditation: settings.accreditation,
      };
      
      res.json(responseData);
    } catch (error) {
      console.error('Error updating hospital settings:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update hospital settings' });
    }
  });

  // Activities endpoints
  app.get('/api/activities/recent', authenticateToken, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  });

  // Doctor Management API
  app.get('/api/doctors', authenticateToken, async (req, res) => {
    try {
      const doctors = await storage.getAllDoctors();
      res.json(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ message: 'Failed to fetch doctors' });
    }
  });

  app.post('/api/doctors', authenticateToken, async (req, res) => {
    try {
      const { isOwner, ...doctorData } = req.body;
      
      // Validate required fields
      if (!doctorData.name) {
        return res.status(400).json({ message: 'Doctor name is required' });
      }

      // Generate unique username for display purposes only
      const username = `doctor_${doctorData.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      
      const newDoctor = await storage.createUser({
        username: username,
        password: 'display_only', // Not used for login
        role: 'doctor',
        name: doctorData.name,
        email: doctorData.email || null,
        phoneNumber: doctorData.phone || null,
        specialization: doctorData.specialization || null,
        licenseNumber: doctorData.licenseNumber || null,
        isOwner: isOwner || false,
        isCurrent: false,
        isActive: true,
      });

      const { password: _, ...doctorWithoutPassword } = newDoctor;
      res.status(201).json(doctorWithoutPassword);
    } catch (error) {
      console.error('Error creating doctor:', error);
      res.status(500).json({ message: 'Failed to create doctor' });
    }
  });

  app.patch('/api/doctors/:id/current', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const updatedDoctor = await storage.setCurrentDoctor(id);
      const { password, ...doctorWithoutPassword } = updatedDoctor;
      res.json(doctorWithoutPassword);
    } catch (error) {
      console.error('Error setting current doctor:', error);
      res.status(500).json({ message: 'Failed to set current doctor' });
    }
  });

  app.get('/api/current-doctor', authenticateToken, async (req, res) => {
    try {
      const currentDoctor = await storage.getCurrentDoctor();
      if (currentDoctor) {
        const { password, ...doctorWithoutPassword } = currentDoctor;
        res.json(doctorWithoutPassword);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error('Error fetching current doctor:', error);
      res.status(500).json({ message: 'Failed to fetch current doctor' });
    }
  });

  app.patch('/api/doctors/:id/owner', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { isOwner } = req.body;
      
      const updatedDoctor = await storage.updateDoctorOwnerStatus(id, isOwner);
      const { password, ...doctorWithoutPassword } = updatedDoctor;
      res.json(doctorWithoutPassword);
    } catch (error) {
      console.error('Error updating doctor owner status:', error);
      res.status(500).json({ message: 'Failed to update doctor status' });
    }
  });

  app.delete('/api/doctors/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if doctor is owner
      const doctor = await storage.getUser(id);
      if (doctor?.isOwner) {
        return res.status(400).json({ message: 'Cannot delete hospital owner' });
      }
      
      await storage.deleteDoctor(id);
      res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      res.status(500).json({ message: 'Failed to delete doctor' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
