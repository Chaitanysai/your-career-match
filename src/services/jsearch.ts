const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = "jsearch27.p.rapidapi.com";
const BASE_URL = `https://${RAPIDAPI_HOST}`;

export interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo?: string;
  job_city: string;
  job_country: string;
  job_employment_type: string;
  job_description: string;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_required_skills?: string[];
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
  job_is_remote: boolean;
  source?: string;
}

export interface SearchFilters {
  query: string;
  location: string;
  employmentType?: string;
  datePosted?: "all" | "today" | "3days" | "week" | "month";
  remoteOnly?: boolean;
  page?: number;
}

// ── Search Jobs ──────────────────────────────────────────────────
export async function searchJobs(filters: SearchFilters): Promise<JSearchJob[]> {
  if (!RAPIDAPI_KEY) throw new Error("RapidAPI key not configured");

  const params = new URLSearchParams({
    query: `${filters.query} in ${filters.location} India`,
    page: String(filters.page || 1),
    num_pages: "1",
    date_posted: filters.datePosted || "month",
    ...(filters.remoteOnly && { remote_jobs_only: "true" }),
    ...(filters.employmentType && { employment_types: filters.employmentType }),
  });

  const res = await fetch(`${BASE_URL}/search?${params}`, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("API quota exceeded. Showing AI-generated jobs instead.");
    throw new Error(`JSearch error: ${res.status}`);
  }

  const data = await res.json();
  return (data.data || []) as JSearchJob[];
}

// ── Estimated Salary ─────────────────────────────────────────────
export async function getEstimatedSalary(jobTitle: string, location: string): Promise<{
  min: number; max: number; median: number; currency: string;
} | null> {
  if (!RAPIDAPI_KEY) return null;

  try {
    const params = new URLSearchParams({
      job_title: jobTitle,
      location: `${location}, India`,
      radius: "100",
    });

    const res = await fetch(`${BASE_URL}/estimated-salary?${params}`, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const d = data.data?.[0];
    if (!d) return null;

    return {
      min: Math.round(d.min_salary || 0),
      max: Math.round(d.max_salary || 0),
      median: Math.round(d.median_salary || 0),
      currency: d.salary_currency || "INR",
    };
  } catch {
    return null;
  }
}

// ── Normalise JSearch job → our unified format ───────────────────
export function normaliseJSearchJob(job: JSearchJob, matchScore?: number) {
  const postedDate = job.job_posted_at_datetime_utc
    ? formatPostedDate(job.job_posted_at_datetime_utc)
    : "Recently";

  // Convert USD salary to LPA if needed
  let salaryMin = 0;
  let salaryMax = 0;
  if (job.job_min_salary && job.job_max_salary) {
    if (job.job_salary_currency === "USD") {
      // rough USD → INR LPA conversion
      salaryMin = Math.round((job.job_min_salary * 83) / 100000);
      salaryMax = Math.round((job.job_max_salary * 83) / 100000);
    } else {
      salaryMin = Math.round(job.job_min_salary / 100000);
      salaryMax = Math.round(job.job_max_salary / 100000);
    }
  }

  return {
    id: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    logo: job.employer_logo,
    location: job.job_city || "India",
    type: formatEmploymentType(job.job_employment_type),
    salaryMin: salaryMin || 8,
    salaryMax: salaryMax || 20,
    matchScore: matchScore || Math.floor(Math.random() * 30) + 65,
    description: (job.job_description || "").slice(0, 200),
    skills: job.job_required_skills?.slice(0, 6) || extractSkills(job.job_description || ""),
    applyLink: job.job_apply_link,
    postedDate,
    isRemote: job.job_is_remote,
    source: "live" as const,
    whyMatch: "",
  };
}

function formatPostedDate(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  } catch {
    return "Recently";
  }
}

function formatEmploymentType(type: string): string {
  const map: Record<string, string> = {
    FULLTIME: "Full-time",
    PARTTIME: "Part-time",
    CONTRACTOR: "Contract",
    INTERN: "Internship",
  };
  return map[type] || type || "Full-time";
}

function extractSkills(description: string): string[] {
  const known = ["React", "Node.js", "Python", "Java", "TypeScript", "JavaScript",
    "AWS", "Docker", "Kubernetes", "SQL", "MongoDB", "Angular", "Vue", "Go",
    "Flutter", "Swift", "Kotlin", "Django", "Spring", "PostgreSQL", "Redis"];
  return known.filter((s) => description.toLowerCase().includes(s.toLowerCase())).slice(0, 5);
}
