import { GoogleGenAI } from "@google/genai";

/**
 * Common AI helper using Google Gemini (official @google/genai SDK).
 * Centralizes the API key check, client initialization, model selection
 * and JSON parsing so every AI route behaves the same way.
 *
 * Every helper returns `null` when Gemini is not configured or the call
 * fails, so callers can fall back to their template-based output.
 */

export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

const PLACEHOLDER_KEYS = new Set(["", "AIzaSy...", "your-gemini-api-key"]);

function getApiKey(): string | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  return PLACEHOLDER_KEYS.has(apiKey) ? null : apiKey;
}

let cachedClient: GoogleGenAI | null = null;
let cachedKey: string | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new GoogleGenAI({ apiKey });
    cachedKey = apiKey;
  }
  return cachedClient;
}

/** True when a real GEMINI_API_KEY is present. */
export function isGeminiConfigured(): boolean {
  return getApiKey() !== null;
}

export interface GenerateOptions {
  /** Ask Gemini to return strict JSON (responseMimeType: application/json). */
  json?: boolean;
  /** Sampling temperature; defaults to the model default. */
  temperature?: number;
}

/**
 * Single-turn text generation.
 * Returns the response text, or null if Gemini is unavailable / errored.
 */
export async function generateContentWithGemini(
  prompt: string,
  systemInstruction?: string,
  options: GenerateOptions = {}
): Promise<string | null> {
  const ai = getClient();
  if (!ai) {
    console.warn("GEMINI_API_KEY is not set. Falling back to template mode.");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(options.json ? { responseMimeType: "application/json" } : {}),
        ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      },
    });
    const text = response.text;
    return text && text.trim() ? text : null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}

/**
 * Single-turn generation that must return a JSON object.
 * Uses Gemini's JSON mode and tolerates stray markdown fences.
 */
export async function generateJsonWithGemini<T = unknown>(
  prompt: string,
  systemInstruction?: string
): Promise<T | null> {
  const text = await generateContentWithGemini(prompt, systemInstruction, { json: true });
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch (error) {
      console.error("Gemini returned invalid JSON:", error);
      return null;
    }
  }
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

/**
 * Gemini requires chat history to start with a user turn and to alternate
 * user/model. Drop empty turns and any leading model turns (e.g. a UI
 * welcome message), then merge consecutive turns with the same role.
 */
function normalizeHistory(history: ChatTurn[]): ChatTurn[] {
  const cleaned = history.filter((turn) => turn.text && turn.text.trim());
  const firstUser = cleaned.findIndex((turn) => turn.role === "user");
  if (firstUser === -1) return [];

  const result: ChatTurn[] = [];
  for (const turn of cleaned.slice(firstUser)) {
    const last = result[result.length - 1];
    if (last && last.role === turn.role) {
      last.text = `${last.text}

${turn.text}`;
    } else {
      result.push({ role: turn.role, text: turn.text });
    }
  }
  return result;
}

/**
 * Multi-turn chat. `history` holds the previous turns, `message` is the new
 * user message. Returns the model reply, or null if Gemini is unavailable.
 */
export async function chatWithGemini(
  history: ChatTurn[],
  message: string,
  systemInstruction?: string
): Promise<string | null> {
  const ai = getClient();
  if (!ai) return null;

  try {
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      ...(systemInstruction ? { config: { systemInstruction } } : {}),
      history: normalizeHistory(history).map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
    });
    const response = await chat.sendMessage({ message });
    const text = response.text;
    return text && text.trim() ? text : null;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return null;
  }
}
