/**
 * Shared AI service — single entry point used by all features.
 * Fallback chain: Gemini 2.0 Flash → 1.5 Flash → 1.5 Flash-8B → 1.5 Pro → Groq Llama 3.3
 */

import type { ResumeContent } from "./gemini";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
];

const geminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function tryGemini(model: string, parts: any[]): Promise<string> {
  const res = await fetch(geminiUrl(model), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("empty");
  return text;
}

async function tryGroq(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("No Groq key");
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function callAI(
  content: ResumeContent | null,
  prompt: string
): Promise<string> {
  let parts: any[];
  if (content?.base64 && content?.mimeType) {
    parts = [
      { inline_data: { mime_type: content.mimeType, data: content.base64 } },
      { text: prompt },
    ];
  } else {
    const text = content?.text ? `${prompt}\n\nRESUME:\n${content.text.slice(0, 6000)}` : prompt;
    parts = [{ text }];
  }

  for (const model of GEMINI_MODELS) {
    try {
      const r = await tryGemini(model, parts);
      return r;
    } catch {
      // try next
    }
  }

  // Groq fallback
  const groqPrompt = content?.text
    ? `${prompt}\n\nRESUME:\n${content.text.slice(0, 6000)}`
    : prompt;
  return tryGroq(groqPrompt);
}

export function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const obj = clean.indexOf("{");
    const objE = clean.lastIndexOf("}") + 1;
    if (obj !== -1 && objE > obj) return JSON.parse(clean.slice(obj, objE));
    const arr = clean.indexOf("[");
    const arrE = clean.lastIndexOf("]") + 1;
    if (arr !== -1 && arrE > arr) return JSON.parse(clean.slice(arr, arrE));
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
}
