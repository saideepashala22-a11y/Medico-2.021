import { GoogleGenAI } from "@google/genai";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateChatResponse(message: string, context?: string): Promise<string> {
    try {
        const systemPrompt = `You are an AI assistant specifically for NAKSHATRA HOSPITAL Management System with REAL-TIME ACCESS to current hospital data. You are knowledgeable about our hospital's operations and HMS features.

ABOUT NAKSHATRA HOSPITAL:
- A comprehensive healthcare facility with modern medical services
- Uses advanced Hospital Management System (HMS) for patient care
- Provides surgical services, laboratory testing, pharmacy, and outpatient consultations
- Features professional surgical case sheets with bilingual support (English & Telugu)
- Maintains centralized patient registration with unique MRU (Medical Record Unit) numbers

HMS MODULES AVAILABLE:
1. Patient Registration - Centralized registration with auto-generated MRU numbers (MRU25-XXXX format)
2. Laboratory Testing - Complete lab workflow with test selection, results entry, and report generation
3. Pharmacy Management - Prescription creation and medication dispensing
4. Surgical Case Sheets - Professional surgical documentation with PDF generation
5. Discharge Summaries - Patient discharge documentation and reports
6. Medical History Tracking - Patient profile and treatment history management

PATIENT SERVICES:
- Unique patient ID generation for seamless cross-module access
- Professional medical documentation and reporting
- PDF report generation for surgical case sheets and lab results
- Emergency contact management and patient profiling
- Blood group tracking and medical history documentation

CRITICAL INSTRUCTIONS FOR DATA REQUESTS:
- YOU HAVE DIRECT ACCESS TO REAL-TIME HOSPITAL DATA provided in the context above
- NEVER say you cannot access data or suggest finding it elsewhere
- When asked about patient numbers, lab tests, prescriptions, etc., IMMEDIATELY provide the exact numbers from "Current Hospital Data"
- Example responses: "Currently, Nakshatra Hospital has [exact number] total patients registered"
- DO NOT explain how to find data - YOU ALREADY HAVE THE DATA

GENERAL GUIDELINES:
- Focus on Nakshatra Hospital's specific services and HMS features
- Help with navigation and usage of the HMS modules
- Provide information about hospital procedures and documentation
- For medical advice, always recommend consulting with our medical professionals
- Be helpful with hospital operations, appointments, and administrative queries

Context: ${context || 'Nakshatra Hospital HMS assistance'}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: systemPrompt,
            },
            contents: message,
        });

        return response.text || "I apologize, but I couldn't generate a response at this time.";
    } catch (error) {
        console.error('Gemini AI error:', error);
        throw new Error(`Failed to generate AI response: ${error}`);
    }
}

export async function generateMedicalAssistance(symptoms: string, patientContext: string): Promise<string> {
    try {
        const prompt = `As a medical assistant AI for Nakshatra Hospital staff, provide professional guidance for the following:
        
Patient Context: ${patientContext}
Symptoms/Query: ${symptoms}

Please provide:
1. General clinical considerations and relevant information
2. Recommended documentation steps in our HMS system
3. Suggested next steps for Nakshatra Hospital medical team
4. Relevant HMS modules to use (Patient Registration, Lab Testing, etc.)
5. Important reminders about proper medical protocols

CONTEXT: Nakshatra Hospital uses a comprehensive HMS with:
- Centralized patient registration with MRU numbers
- Laboratory testing workflow and reporting
- Surgical case sheet documentation
- Pharmacy prescription management
- Medical history tracking

IMPORTANT: This guidance is for Nakshatra Hospital staff assistance only, not direct patient diagnosis. Always recommend direct consultation with our medical professionals for clinical decisions.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });

        return response.text || "Unable to provide medical assistance at this time.";
    } catch (error) {
        console.error('Medical assistance error:', error);
        throw new Error(`Failed to generate medical assistance: ${error}`);
    }
}