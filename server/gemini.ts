import { GoogleGenAI } from "@google/genai";

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateChatResponse(message: string, context?: string): Promise<string> {
    try {
        const systemPrompt = `You are a helpful AI assistant for Nakshatra Hospital Management System. 
You help with medical inquiries, patient information assistance, and general hospital management questions.
Be professional, helpful, and provide accurate information related to healthcare and hospital operations.
If asked about specific medical advice, remind users to consult with healthcare professionals.
Context: ${context || 'General hospital management system assistance'}`;

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
        const prompt = `As a medical assistant AI for hospital staff, provide general guidance for the following:
        
Patient Context: ${patientContext}
Symptoms/Query: ${symptoms}

Please provide:
1. General information and considerations
2. Recommended next steps for hospital staff
3. Important reminders about proper medical consultation

IMPORTANT: This is for hospital staff assistance only, not direct patient diagnosis.`;

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