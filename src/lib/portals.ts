export interface PortalLink {
  name: string;
  icon: string;
  color: string;
  url: string;
}

// ── Build deep-link URLs for each portal ─────────────────────────
export function buildPortalLinks(
  jobTitle: string,
  city: string,
  applyLink?: string
): PortalLink[] {
  const title = encodeURIComponent(jobTitle);
  const location = encodeURIComponent(city);
  const titleSlug = jobTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const citySlug = city.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return [
    {
      name: "Naukri",
      icon: "N",
      color: "#4A90D9",
      url: `https://www.naukri.com/${titleSlug}-jobs-in-${citySlug}`,
    },
    {
      name: "LinkedIn",
      icon: "in",
      color: "#0A66C2",
      url: `https://www.linkedin.com/jobs/search/?keywords=${title}&location=${location}%2C+India&f_TPR=r86400`,
    },
    {
      name: "Indeed",
      icon: "ii",
      color: "#003A9B",
      url: `https://in.indeed.com/jobs?q=${title}&l=${location}`,
    },
    {
      name: "Internshala",
      icon: "IS",
      color: "#00AAFF",
      url: `https://internshala.com/jobs/${titleSlug}-jobs-in-${citySlug}`,
    },
    {
      name: "Wellfound",
      icon: "W",
      color: "#0D0D0D",
      url: `https://wellfound.com/jobs?q=${title}&l=${location}`,
    },
    {
      name: "Glassdoor",
      icon: "G",
      color: "#0CAA41",
      url: `https://www.glassdoor.co.in/Job/india-${titleSlug}-jobs-SRCH_IL.0,5_IN115_KO6,${6 + jobTitle.length}.htm`,
    },
    // If a direct apply link exists (from JSearch), add it first
    ...(applyLink && applyLink !== "#"
      ? [{
          name: "Direct Apply",
          icon: "→",
          color: "#00C896",
          url: applyLink,
        }]
      : []),
  ];
}

// ── Build a single portal search URL (for JobBoard redirect button) ──
export function buildPortalSearchUrl(
  portal: string,
  query: string,
  city: string,
  filters?: {
    employmentType?: string;
    experienceLevel?: string;
    salaryMin?: number;
  }
): string {
  const q = encodeURIComponent(query);
  const loc = encodeURIComponent(city);
  const qSlug = query.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const locSlug = city.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  switch (portal) {
    case "naukri":
      return `https://www.naukri.com/${qSlug}-jobs-in-${locSlug}`;
    case "linkedin":
      return `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}%2C+India`;
    case "indeed":
      return `https://in.indeed.com/jobs?q=${q}&l=${loc}`;
    case "internshala":
      return `https://internshala.com/jobs/${qSlug}-jobs-in-${locSlug}`;
    case "wellfound":
      return `https://wellfound.com/jobs?q=${q}&l=${loc}`;
    case "glassdoor":
      return `https://www.glassdoor.co.in/Job/india-${qSlug}-jobs-SRCH_IL.0,5_IN115.htm`;
    default:
      return `https://www.naukri.com/${qSlug}-jobs-in-${locSlug}`;
  }
}

export const ALL_PORTALS = [
  { id: "naukri", name: "Naukri", color: "#4A90D9" },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2" },
  { id: "indeed", name: "Indeed", color: "#003A9B" },
  { id: "internshala", name: "Internshala", color: "#00AAFF" },
  { id: "wellfound", name: "Wellfound", color: "#0D0D0D" },
  { id: "glassdoor", name: "Glassdoor", color: "#0CAA41" },
];
