import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Common AI helper using Google Gemini.
 * Centralizes the API key check and client initialization.
 */
export async function generateContentWithGemini(prompt: string, systemInstruction?: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    console.warn("GEMINI_API_KEY is not set. Falling back to template mode.");
    return null; // Return null to indicate fallback should be used
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      ...(systemInstruction ? { systemInstruction } : {})
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null; // Trigger fallback on error too
  }
}
