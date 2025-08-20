import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertPatientSchema, insertLabTestSchema, insertPrescriptionSchema, insertDischargeSummarySchema, insertMedicalHistorySchema, insertPatientProfileSchema, insertConsultationSchema } from "@shared/schema";
import { z } from "zod";

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
  app.get('/api/patients/search', authenticateToken, async (req: any, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json([]);
      }
      const patients = await storage.searchPatients(q as string);
      res.json(patients);
    } catch (error) {
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

  // Stats route
  app.get('/api/stats', authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
