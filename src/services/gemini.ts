const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// ── Model fallback chain (tried in order) ────────────────────────
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
];

const geminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface ResumeContent {
  text?: string;
  base64?: string;
  mimeType?: string;
}

function buildGeminiParts(content: ResumeContent, prompt: string) {
  if (content.base64 && content.mimeType) {
    return [
      { inline_data: { mime_type: content.mimeType, data: content.base64 } },
      { text: prompt },
    ];
  }
  return [{ text: `${prompt}\n\nRESUME CONTENT:\n${(content.text || "").slice(0, 6000)}` }];
}

async function tryGeminiModel(model: string, parts: any[]): Promise<string> {
  const res = await fetch(geminiUrl(model), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    throw new Error(`RETRYABLE:${msg}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("RETRYABLE:empty response");
  return text;
}

async function tryGroqFallback(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("No Groq API key");

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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Master call — tries all models, falls back to Groq ───────────
async function callAI(content: ResumeContent | null, prompt: string): Promise<string> {
  const parts = content ? buildGeminiParts(content, prompt) : [{ text: prompt }];

  // Try each Gemini model
  for (const model of GEMINI_MODELS) {
    try {
      const result = await tryGeminiModel(model, parts);
      console.log(`✓ AI: ${model}`);
      return result;
    } catch (err: any) {
      console.warn(`✗ ${model} failed:`, err.message);
    }
  }

  // All Gemini failed — use Groq
  console.warn("All Gemini models exhausted → Groq fallback");
  const groqPrompt = content?.text
    ? `${prompt}\n\nRESUME CONTENT:\n${content.text.slice(0, 6000)}`
    : prompt;
  return tryGroqFallback(groqPrompt);
}

// ── Safe JSON parse ──────────────────────────────────────────────
function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const objStart = clean.indexOf("{");
    const objEnd = clean.lastIndexOf("}") + 1;
    if (objStart !== -1 && objEnd > objStart) return JSON.parse(clean.slice(objStart, objEnd));
    const arrStart = clean.indexOf("[");
    const arrEnd = clean.lastIndexOf("]") + 1;
    if (arrStart !== -1 && arrEnd > arrStart) return JSON.parse(clean.slice(arrStart, arrEnd));
    return JSON.parse(clean);
  } catch {
    return fallback;
  }
}

// ── Resume Analysis ──────────────────────────────────────────────
export interface ResumeAnalysis {
  suggestedTitle: string;
  experience: string;
  skills: string[];
  summary: string;
  strengths: string[];
  improvements: string[];
  salaryRange: { min: number; max: number };
}

export async function analyzeResume(content: ResumeContent, city: string): Promise<ResumeAnalysis> {
  const prompt = `You are an expert Indian job market career advisor. Analyze this resume for the ${city} job market.

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "suggestedTitle": "most fitting job title",
  "experience": "X years",
  "skills": ["skill1","skill2","skill3","skill4","skill5"],
  "summary": "2-sentence professional summary",
  "strengths": ["strength1","strength2","strength3"],
  "improvements": ["area1","area2"],
  "salaryRange": { "min": 8, "max": 15 }
}
salaryRange must be realistic LPA for ${city}.`;

  const raw = await callAI(content, prompt);
  return safeParseJSON(raw, {
    suggestedTitle: "Software Engineer", experience: "3-5 years",
    skills: ["JavaScript", "React", "Node.js"],
    summary: "Experienced software professional.",
    strengths: ["Technical skills", "Problem solving"],
    improvements: ["Add certifications", "More projects"],
    salaryRange: { min: 8, max: 15 },
  });
}

// ── Job Matching ─────────────────────────────────────────────────
export interface MatchedJob {
  title: string; company: string; location: string;
  type: string; salaryMin: number; salaryMax: number;
  matchScore: number; description: string; skills: string[];
  url: string; postedDate: string; whyMatch: string;
}

export async function matchJobs(
  content: ResumeContent,
  city: string,
  userSkills: string[]
): Promise<MatchedJob[]> {
  const prompt = `You are an expert Indian job recruiter. Generate 6 realistic job listings for ${city} matching this candidate.
${userSkills.length ? `Candidate skills: ${userSkills.join(", ")}` : ""}

Use real Indian companies in ${city}: Flipkart, Swiggy, Razorpay, Zepto, CRED, PhonePe, Infosys, TCS, Amazon India, Microsoft India, etc.

Respond with ONLY a valid JSON array (no markdown):
[{"title":"","company":"","location":"${city}","type":"Full-time","salaryMin":12,"salaryMax":18,"matchScore":92,"description":"","skills":[],"url":"#","postedDate":"2h ago","whyMatch":""}]

Rules: salary in LPA, matchScore 65-96, mix company sizes.`;

  const raw = await callAI(content, prompt);
  const parsed = safeParseJSON<MatchedJob[]>(raw, []);
  return Array.isArray(parsed) && parsed.length > 0 ? parsed : [
    { title: "Software Engineer", company: "TCS", location: city, type: "Full-time",
      salaryMin: 8, salaryMax: 15, matchScore: 75, description: "Build enterprise solutions.",
      skills: ["Java", "SQL"], url: "#", postedDate: "1d ago", whyMatch: "Matches your background" },
  ];
}

// ── Skill Gap Analysis ───────────────────────────────────────────
export interface SkillGapResult {
  cityDemand: { skill: string; demand: number; youHave: boolean }[];
  missingSkills: { skill: string; priority: "high"|"medium"|"low"; timeToLearn: string; resources: string[] }[];
  marketInsight: string;
  salaryImpact: string;
}

export async function analyzeSkillGap(
  userSkills: string[],
  jobTitle: string,
  city: string
): Promise<SkillGapResult> {
  const prompt = `Indian tech market expert. Skill gap analysis for ${jobTitle} in ${city}.
Candidate skills: ${userSkills.join(", ")}

Respond ONLY valid JSON (no markdown):
{
  "cityDemand":[{"skill":"React","demand":92,"youHave":true}],
  "missingSkills":[{"skill":"","priority":"high","timeToLearn":"2-3 months","resources":[]}],
  "marketInsight":"2 sentences about ${jobTitle} demand in ${city}",
  "salaryImpact":"Adding skills could increase salary by X-Y LPA in ${city}"
}
10 skills in cityDemand, top 4 missing skills.`;

  const raw = await callAI(null, prompt);
  return safeParseJSON(raw, {
    cityDemand: [], missingSkills: [],
    marketInsight: `${jobTitle} roles are in demand in ${city}.`,
    salaryImpact: `Improving skills could add 3-5 LPA in ${city}.`,
  });
}