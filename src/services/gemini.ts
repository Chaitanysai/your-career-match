const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── Content type accepted from Index.tsx ────────────────────────
export interface ResumeContent {
  text?: string;       // for .txt files
  base64?: string;     // for .pdf / .doc files
  mimeType?: string;
}

// ── Build Gemini parts array from content ────────────────────────
function buildParts(content: ResumeContent, prompt: string) {
  if (content.base64 && content.mimeType) {
    // Send PDF as inline data — Gemini can natively read PDFs
    return [
      {
        inline_data: {
          mime_type: content.mimeType,
          data: content.base64,
        },
      },
      { text: prompt },
    ];
  }
  // Plain text
  return [{ text: `${prompt}\n\nRESUME CONTENT:\n${(content.text || "").slice(0, 6000)}` }];
}

async function callGemini(parts: any[]): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini error: ${res.status} — ${err?.error?.message || "Unknown error"}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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

export async function analyzeResume(
  content: ResumeContent,
  city: string
): Promise<ResumeAnalysis> {
  const prompt = `You are an expert Indian job market career advisor. Analyze this resume for the ${city} job market.

Respond with ONLY valid JSON (no markdown, no backticks, no extra text):
{
  "suggestedTitle": "most fitting job title",
  "experience": "X years",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "summary": "2-sentence professional summary",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2"],
  "salaryRange": { "min": 8, "max": 15 }
}

salaryRange must be in LPA (Lakhs Per Annum) appropriate for ${city} market.`;

  const parts = buildParts(content, prompt);
  const raw = await callGemini(parts);
  const clean = raw.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}") + 1;
  return JSON.parse(clean.slice(start, end));
}

// ── Job Matching ─────────────────────────────────────────────────
export interface MatchedJob {
  title: string;
  company: string;
  location: string;
  type: string;
  salaryMin: number;
  salaryMax: number;
  matchScore: number;
  description: string;
  skills: string[];
  url: string;
  postedDate: string;
  whyMatch: string;
}

export async function matchJobs(
  content: ResumeContent,
  city: string,
  userSkills: string[]
): Promise<MatchedJob[]> {
  const skillsHint = userSkills.length > 0 ? `Candidate skills: ${userSkills.join(", ")}` : "";

  const prompt = `You are an expert Indian job recruiter. Generate 6 realistic job listings for ${city} that match this candidate's resume.

${skillsHint}

Use real Indian company names active in ${city} (e.g. Flipkart, Swiggy, Razorpay, Zepto, CRED, PhonePe, Infosys, TCS, Wipro, Amazon India, etc.)

Respond with ONLY a valid JSON array (no markdown, no backticks):
[
  {
    "title": "job title",
    "company": "real company name",
    "location": "${city}",
    "type": "Full-time",
    "salaryMin": 12,
    "salaryMax": 18,
    "matchScore": 92,
    "description": "2-sentence job description",
    "skills": ["skill1", "skill2", "skill3"],
    "url": "#",
    "postedDate": "2h ago",
    "whyMatch": "one sentence why this matches the candidate"
  }
]

Rules:
- Salary in LPA (Lakhs Per Annum)
- matchScore between 65-96
- Mix of startup, MNC and product companies
- postedDate should vary: "1h ago", "3h ago", "1d ago", "2d ago" etc.`;

  const parts = buildParts(content, prompt);
  const raw = await callGemini(parts);
  const clean = raw.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]") + 1;
  return JSON.parse(clean.slice(start, end));
}

// ── Skill Gap Analysis ───────────────────────────────────────────
export interface SkillGapResult {
  cityDemand: { skill: string; demand: number; youHave: boolean }[];
  missingSkills: {
    skill: string;
    priority: "high" | "medium" | "low";
    timeToLearn: string;
    resources: string[];
  }[];
  marketInsight: string;
  salaryImpact: string;
}

export async function analyzeSkillGap(
  userSkills: string[],
  jobTitle: string,
  city: string
): Promise<SkillGapResult> {
  const prompt = `You are an Indian tech job market expert. Analyze skill gaps for a ${jobTitle} role in ${city}.

Candidate's current skills: ${userSkills.join(", ")}

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "cityDemand": [
    { "skill": "React", "demand": 92, "youHave": true },
    { "skill": "TypeScript", "demand": 88, "youHave": false }
  ],
  "missingSkills": [
    {
      "skill": "skill name",
      "priority": "high",
      "timeToLearn": "2-3 months",
      "resources": ["free resource 1", "free resource 2"]
    }
  ],
  "marketInsight": "2-sentence insight about ${jobTitle} demand in ${city}",
  "salaryImpact": "Adding these skills could increase salary by X-Y LPA in ${city}"
}

Include 10 skills in cityDemand and top 4 missing skills.`;

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const clean = raw.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}") + 1;
  return JSON.parse(clean.slice(start, end));
}