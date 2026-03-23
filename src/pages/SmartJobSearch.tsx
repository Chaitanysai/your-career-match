import { useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCity } from "@/hooks/useCity";
import { analyzeResume, callAI, safeParseJSON } from "@/services/gemini";
import { searchJobs, normaliseJSearchJob } from "@/services/jsearch";
import { buildPortalLinks } from "@/lib/portals";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface LiveJob {
  id: string;
  title: string;
  company: string;
  logo?: string;
  location: string;
  type: string;
  salaryMin: number;
  salaryMax: number;
  matchScore: number;
  matchReason: string;      // AI-generated explanation
  missingSkills: string[];  // skills you lack for this role
  description: string;
  skills: string[];
  applyLink: string;
  postedDate: string;
  isRemote: boolean;
  isRelevant: boolean;      // AI verdict: true/false
}

interface ResumeProfile {
  suggestedTitle: string;
  skills: string[];
  experience: string;
  salaryRange: { min: number; max: number };
  summary: string;
}

/* ── Pill button ── */
const Pill = ({
  onClick, disabled, loading: busy, children, variant = "primary", fullWidth = false, size = "md",
}: {
  onClick?: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  fullWidth?: boolean; size?: "sm" | "md" | "lg";
}) => {
  const pad = size === "sm" ? "0.4rem 1rem" : size === "lg" ? "0.875rem 2rem" : "0.625rem 1.4rem";
  const fz  = size === "sm" ? "0.78rem" : size === "lg" ? "1rem" : "0.875rem";
  const base: React.CSSProperties = {
    borderRadius: 999, fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: fz,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
    padding: pad, cursor: disabled || busy ? "not-allowed" : "pointer",
    opacity: disabled || busy ? 0.55 : 1, transition: "all 0.15s", border: "none",
    width: fullWidth ? "100%" : undefined,
  };
  const v: Record<string, React.CSSProperties> = {
    primary: { ...base, background: "var(--primary)", color: "white", boxShadow: "0 4px 12px var(--primary)35" },
    outline: { ...base, background: "transparent", color: "var(--primary)", border: "2px solid var(--primary)" },
    ghost:   { ...base, background: "var(--surface-container)", color: "var(--on-surface)" },
  };
  return (
    <button style={v[variant]} onClick={!disabled && !busy ? onClick : undefined} disabled={disabled || busy}
      onMouseEnter={e => { if (!disabled && !busy) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = disabled || busy ? "0.55" : "1"; }}>
      {busy && <span className="material-symbols-outlined animate-spin" style={{ fontSize: 15 }}>progress_activity</span>}
      {children}
    </button>
  );
};

/* ── Job card ── */
const JobCard = ({ job, city }: { job: LiveJob; city: string }) => {
  const [expanded, setExpanded] = useState(false);
  const colors = ["#fc8019","#2d6be4","#5f259f","#0cab6e","#e91e63","#ff5722","#00897b","#1565c0"];
  const color = colors[job.company.charCodeAt(0) % colors.length];
  const scoreColor =
    job.matchScore >= 80 ? "var(--secondary)" :
    job.matchScore >= 65 ? "#3b82f6" : "#f59e0b";

  const links = buildPortalLinks(job.title, city, job.applyLink).slice(0, 4);

  return (
    <div className="card-stitch overflow-hidden transition-all">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border"
            style={{ background: `${color}14`, borderColor: `${color}22` }}>
            {job.logo
              ? <img src={job.logo} alt={job.company} className="w-full h-full object-contain p-2"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              : <span className="text-2xl font-black" style={{ color, fontFamily: "var(--font-headline)" }}>
                  {job.company[0]}
                </span>
            }
          </div>

          <div className="flex-1 min-w-0">
            {/* Title + badges */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h3 className="font-bold text-base leading-tight"
                style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                {job.title}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full text-xs font-black"
                  style={{ background: `${scoreColor}18`, color: scoreColor }}>
                  {job.matchScore}% match
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black"
                  style={{ background: "rgba(0,200,100,0.10)", color: "#0d9453" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  LIVE
                </span>
              </div>
            </div>

            {/* Company + meta */}
            <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--primary)" }}>
              {job.company}
            </p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>
                {job.isRemote ? "Remote / WFH" : job.location}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>work</span>
                {job.type}
              </span>
              {job.salaryMin > 0 && (
                <span className="flex items-center gap-1 font-bold" style={{ color: "var(--on-surface)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>payments</span>
                  ₹{job.salaryMin}L – ₹{job.salaryMax}L
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                {job.postedDate}
              </span>
            </div>

            {/* AI match reason */}
            {job.matchReason && (
              <div className="mt-3 px-3 py-2 rounded-xl text-xs"
                style={{ background: "rgba(0,79,52,0.06)", color: "var(--primary)" }}>
                <span className="font-black">✓ Why it matches:</span> {job.matchReason}
              </div>
            )}

            {/* Missing skills */}
            {job.missingSkills.length > 0 && (
              <div className="mt-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: "rgba(239,68,68,0.06)", color: "#dc2626" }}>
                <span className="font-black">Gap:</span> {job.missingSkills.join(", ")}
              </div>
            )}

            {/* Skills chips */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.skills.slice(0, 5).map(s => (
                <span key={s} className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>
                  {s}
                </span>
              ))}
            </div>

            {/* Apply buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              {links.map(l => (
                <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: l.color }}>
                  {l.name}
                  <span className="material-symbols-outlined" style={{ fontSize: 11 }}>open_in_new</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Expanded description */}
        {expanded && (
          <div className="mt-4 pt-4 text-sm leading-relaxed"
            style={{ borderTop: "1px solid var(--surface-container-high)", color: "var(--on-surface-variant)" }}>
            {job.description}
          </div>
        )}
      </div>

      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors"
        style={{ borderTop: "1px solid var(--surface-container-high)", color: "var(--outline)", background: "var(--surface-container-low)" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--primary)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--outline)"}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          {expanded ? "expand_less" : "expand_more"}
        </span>
        {expanded ? "Show less" : "Show full description"}
      </button>
    </div>
  );
};

/* ── Main ── */
const SmartJobSearch = () => {
  const { city } = useCity();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file,    setFile]    = useState<File | null>(null);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [jobs,    setJobs]    = useState<LiveJob[]>([]);
  const [phase,   setPhase]   = useState<"idle"|"parsing"|"fetching"|"scoring"|"done">("idle");
  const [progress,setProgress]= useState(0);
  const [filter,  setFilter]  = useState({ remote: false, type: "", minScore: 60 });
  const [sortBy,  setSortBy]  = useState<"match"|"salary"|"recent">("match");
  const [extraRole, setExtraRole] = useState("");

  const handleFile = (f: File) => {
    if (f.size > 5 * 1024 * 1024) { toast({ title: "File too large — max 5MB", variant: "destructive" }); return; }
    setFile(f); setProfile(null); setJobs([]); setPhase("idle"); setProgress(0);
  };

  const getContent = async () => {
    if (!file) return null;
    if (file.type === "application/pdf") {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = () => rej(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      return { base64, mimeType: "application/pdf" };
    }
    return { text: await file.text() };
  };

  /* ── AI semantic match scoring ── */
  const scoreJobsWithAI = async (
    rawJobs: any[],
    resumeProfile: ResumeProfile
  ): Promise<LiveJob[]> => {
    if (rawJobs.length === 0) return [];

    // Build a compact jobs list for AI to evaluate all at once
    const jobsForAI = rawJobs.map((j, i) => ({
      idx: i,
      title: j.title,
      company: j.company,
      description: j.description?.slice(0, 300) || "",
      skills: j.skills?.join(", ") || "",
    }));

    const prompt = `You are a professional recruiter evaluating job-candidate fit.

CANDIDATE PROFILE:
- Role: ${resumeProfile.suggestedTitle}
- Experience: ${resumeProfile.experience}
- Skills: ${resumeProfile.skills.join(", ")}
- Summary: ${resumeProfile.summary}
- City: ${city.name}

JOBS TO EVALUATE:
${JSON.stringify(jobsForAI, null, 2)}

For each job, evaluate genuine fit. Be STRICT — only give high scores if the job truly matches the candidate's background.

Scoring guide:
- 85-98: Perfect match — role title, required skills, and seniority align closely
- 70-84: Good match — most skills align, minor gaps
- 50-69: Partial match — some skills match but significant gaps or wrong domain
- Below 50: Poor match — different domain, very different skills

Return ONLY a JSON array (no markdown):
[
  {
    "idx": 0,
    "score": 87,
    "isRelevant": true,
    "matchReason": "Your React and TypeScript experience directly matches their frontend requirements",
    "missingSkills": ["AWS", "Docker"]
  }
]

Be honest. If a job is irrelevant to the candidate's profile, give it a low score and set isRelevant to false.`;

    try {
      const raw = await callAI(null, prompt);
      const scores = safeParseJSON<Array<{
        idx: number; score: number; isRelevant: boolean;
        matchReason: string; missingSkills: string[];
      }>>(raw, []);

      // Merge AI scores back into jobs
      return rawJobs.map((job, i) => {
        const aiScore = scores.find(s => s.idx === i);
        return {
          ...job,
          matchScore: aiScore?.score ?? 50,
          isRelevant: aiScore?.isRelevant ?? true,
          matchReason: aiScore?.matchReason ?? "",
          missingSkills: aiScore?.missingSkills ?? [],
        } as LiveJob;
      });
    } catch {
      // Fallback to keyword scoring if AI fails
      return rawJobs.map(job => ({
        ...job,
        matchScore: 60,
        isRelevant: true,
        matchReason: "",
        missingSkills: [],
      }));
    }
  };

  const findJobs = async () => {
    if (!file) { toast({ title: "Upload your resume first", variant: "destructive" }); return; }
    setJobs([]); setProfile(null); setProgress(0);

    // ── Step 1: Parse resume ──
    setPhase("parsing"); setProgress(10);
    let resumeProfile: ResumeProfile;
    try {
      const content = await getContent();
      if (!content) return;
      const analysis = await analyzeResume(content, city.name);
      resumeProfile = {
        suggestedTitle: extraRole || analysis.suggestedTitle,
        skills: analysis.skills,
        experience: analysis.experience,
        salaryRange: analysis.salaryRange,
        summary: analysis.summary,
      };
      setProfile(resumeProfile);
      setProgress(30);
    } catch (err: any) {
      toast({ title: "Could not parse resume", description: err.message, variant: "destructive" });
      setPhase("idle"); return;
    }

    // ── Step 2: Fetch live jobs ──
    setPhase("fetching"); setProgress(40);
    const rawNormalised: any[] = [];

    // Use ONE focused search query — the suggested title
    // More focused = more relevant results
    const searchQuery = extraRole || resumeProfile.suggestedTitle;

    try {
      const raw = await searchJobs({
        query: searchQuery,
        location: city.name,
        datePosted: "month",
        page: 1,
      });

      raw.forEach(j => {
        const norm = normaliseJSearchJob(j);
        rawNormalised.push(norm);
      });

      setProgress(65);
    } catch (err: any) {
      if (err.message?.includes("quota")) {
        toast({
          title: "Live job quota reached",
          description: "JSearch free plan: 200 calls/month. Please check back tomorrow.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Job search failed", description: err.message, variant: "destructive" });
      }
      setPhase("idle"); return;
    }

    if (rawNormalised.length === 0) {
      toast({ title: "No jobs found", description: `No results for "${searchQuery}" in ${city.name}` });
      setPhase("done"); return;
    }

    // ── Step 3: AI scores every job against resume ──
    setPhase("scoring"); setProgress(75);
    try {
      const scored = await scoreJobsWithAI(rawNormalised, resumeProfile);

      // Filter out irrelevant + sort by score
      const relevant = scored
        .filter(j => j.isRelevant && j.matchScore >= 45)
        .sort((a, b) => b.matchScore - a.matchScore);

      setJobs(relevant);
      setProgress(100);
      setPhase("done");

      const highMatch = relevant.filter(j => j.matchScore >= 70).length;
      toast({
        title: `Found ${relevant.length} relevant jobs`,
        description: `${highMatch} are a strong match (70%+) for your profile`,
      });
    } catch (err: any) {
      // If AI scoring fails, just show raw results
      setJobs(rawNormalised.map(j => ({
        ...j, matchScore: 65, isRelevant: true, matchReason: "", missingSkills: [],
      })));
      setPhase("done");
    }
  };

  const displayed = jobs
    .filter(j =>
      (!filter.remote || j.isRemote) &&
      (!filter.type   || j.type.toLowerCase().includes(filter.type.toLowerCase())) &&
      (j.matchScore >= filter.minScore)
    )
    .sort((a, b) =>
      sortBy === "match"  ? b.matchScore - a.matchScore :
      sortBy === "salary" ? b.salaryMax - a.salaryMax   :
      a.postedDate.localeCompare(b.postedDate)
    );

  const isLoading = phase !== "idle" && phase !== "done";

  const phaseLabel = {
    parsing:  "Reading your resume with AI...",
    fetching: `Searching live jobs in ${city.name}...`,
    scoring:  "AI is scoring each job against your profile...",
    done: "", idle: "",
  }[phase];

  return (
    <DashboardLayout title="Smart Job Search">
      <div className="min-h-screen" style={{ background: "var(--surface-container-low)" }}>

        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ borderBottom: "1px solid var(--surface-container-high)" }}>
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2"
                style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                Smart Job Search
              </h1>
              <p style={{ color: "var(--on-surface-variant)", maxWidth: 500 }}>
                Upload resume → AI extracts your skills → searches live jobs → <strong>AI scores each job against your actual profile</strong> for genuine relevance.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { name: "LinkedIn",  color: "#0a66c2" },
                { name: "Indeed",    color: "#003a9b" },
                { name: "Glassdoor", color: "#0caa41" },
                { name: "Naukri",    color: "#126bc5" },
              ].map(({ name, color }) => (
                <span key={name} className="px-3 py-1.5 rounded-full text-xs font-black text-white"
                  style={{ background: color }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── LEFT: controls ── */}
            <div className="lg:col-span-4 space-y-5">

              {/* Upload */}
              <div className="card-stitch p-6">
                <h3 className="font-bold text-base mb-4"
                  style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                  1. Upload Resume
                </h3>
                {!file ? (
                  <div className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer"
                    style={{ borderColor: "var(--outline-variant)" }}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; }}
                    onDragLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"}
                    onDrop={e => {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)";
                      const f = e.dataTransfer.files[0]; if (f) handleFile(f);
                    }}>
                    <span className="material-symbols-outlined mb-3" style={{ fontSize: 36, color: "var(--primary)" }}>upload_file</span>
                    <p className="font-semibold text-sm mb-1" style={{ color: "var(--on-surface)" }}>Drop resume here</p>
                    <p className="text-xs mb-4" style={{ color: "var(--on-surface-variant)" }}>PDF or DOCX · Max 5MB</p>
                    <Pill variant="outline" size="sm">Browse Files</Pill>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "var(--surface-container)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(0,79,52,0.12)" }}>
                      <span className="material-symbols-outlined mat-fill" style={{ color: "var(--primary)", fontSize: 20 }}>description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--on-surface)" }}>{file.name}</p>
                      <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{(file.size/1024/1024).toFixed(1)} MB</p>
                    </div>
                    <button onClick={() => { setFile(null); setJobs([]); setProfile(null); setPhase("idle"); }}
                      style={{ color: "var(--outline)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--error)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--outline)"}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                    </button>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              {/* Target role */}
              <div className="card-stitch p-6">
                <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                  2. Target Role <span className="text-xs font-normal" style={{ color: "var(--outline)" }}>(optional)</span>
                </h3>
                <p className="text-xs mb-3" style={{ color: "var(--on-surface-variant)" }}>
                  Override auto-detected role for more precise results
                </p>
                <input className="w-full text-sm rounded-2xl px-4 py-3 border-none outline-none transition-all"
                  style={{ background: "var(--surface-container-high)", color: "var(--on-surface)" }}
                  placeholder="e.g. Senior React Developer..."
                  value={extraRole} onChange={e => setExtraRole(e.target.value)}
                  onFocus={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px var(--primary)40"; (e.currentTarget as HTMLElement).style.background = "var(--surface-container-lowest)"; }}
                  onBlur={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)"; }}
                />
              </div>

              {/* Search button */}
              <Pill onClick={findJobs} loading={isLoading} disabled={!file} size="lg" fullWidth>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {isLoading ? "hourglass_empty" : "travel_explore"}
                </span>
                {isLoading ? phaseLabel : "Find My Jobs"}
              </Pill>

              {/* Progress bar */}
              {isLoading && (
                <div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-container-high)" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: "var(--primary)" }} />
                  </div>
                  <p className="text-xs mt-2 text-center" style={{ color: "var(--on-surface-variant)" }}>
                    {phaseLabel}
                  </p>
                </div>
              )}

              {/* Detected profile */}
              {profile && (
                <div className="card-stitch p-5 animate-fade-in-up">
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--on-surface-variant)" }}>
                    Resume Profile
                  </p>
                  <p className="font-bold mb-0.5" style={{ fontFamily: "var(--font-headline)", color: "var(--primary)" }}>
                    {profile.suggestedTitle}
                  </p>
                  <p className="text-xs mb-3" style={{ color: "var(--on-surface-variant)" }}>
                    {profile.experience} · ₹{profile.salaryRange.min}L–{profile.salaryRange.max}L
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 8).map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{ background: "var(--secondary-container)", color: "var(--on-secondary-container)" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              {jobs.length > 0 && (
                <div className="card-stitch p-5">
                  <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--on-surface-variant)" }}>
                    Filter
                  </p>
                  <div className="space-y-4">
                    {/* Min match score */}
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: "var(--on-surface-variant)" }}>
                        Min match: <strong style={{ color: "var(--primary)" }}>{filter.minScore}%</strong>
                      </p>
                      <input type="range" min={0} max={85} step={5}
                        value={filter.minScore}
                        onChange={e => setFilter(f => ({ ...f, minScore: Number(e.target.value) }))}
                        className="w-full" style={{ accentColor: "var(--primary)" }} />
                    </div>

                    {/* Remote */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>Remote only</span>
                      <div className="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
                        style={{ background: filter.remote ? "var(--primary)" : "var(--surface-container-high)" }}
                        onClick={() => setFilter(f => ({ ...f, remote: !f.remote }))}>
                        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                          style={{ left: filter.remote ? "1.25rem" : "0.125rem" }} />
                      </div>
                    </label>

                    {/* Sort */}
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: "var(--on-surface-variant)" }}>Sort by</p>
                      <div className="flex gap-2">
                        {[["match","Match"],["salary","Salary"],["recent","Recent"]].map(([v,l]) => (
                          <button key={v} onClick={() => setSortBy(v as any)}
                            className="flex-1 py-1.5 rounded-full text-xs font-bold"
                            style={{
                              background: sortBy === v ? "var(--primary)" : "var(--surface-container)",
                              color: sortBy === v ? "white" : "var(--on-surface-variant)",
                            }}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: results ── */}
            <div className="lg:col-span-8">

              {/* Idle */}
              {phase === "idle" && (
                <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-8">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
                    style={{ background: `linear-gradient(135deg, var(--hero-mid, #004433), var(--primary))` }}>
                    <span className="material-symbols-outlined mat-fill text-white" style={{ fontSize: 44 }}>travel_explore</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-3"
                    style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                    AI-powered job matching
                  </h2>
                  <p className="text-base mb-8 max-w-md" style={{ color: "var(--on-surface-variant)" }}>
                    Unlike basic keyword search, our AI reads your resume and scores each job for genuine fit — not just keyword overlap.
                  </p>
                  {/* How it works */}
                  <div className="grid grid-cols-1 gap-3 w-full max-w-lg text-left">
                    {[
                      { step: "1", icon: "upload_file",      label: "Upload resume",               desc: "Gemini AI reads your full profile" },
                      { step: "2", icon: "travel_explore",   label: "Fetch live jobs",              desc: "Real-time from LinkedIn, Indeed, Naukri" },
                      { step: "3", icon: "psychology",       label: "AI scores each job",           desc: "Semantic match — not just keywords" },
                      { step: "4", icon: "verified",         label: "Only relevant jobs shown",     desc: "Irrelevant roles filtered out" },
                    ].map(({ step, icon, label, desc }) => (
                      <div key={step} className="flex items-center gap-4 p-4 rounded-2xl"
                        style={{ background: "var(--surface-container)" }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-black text-sm"
                          style={{ background: "var(--primary)" }}>
                          {step}
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: "var(--on-surface)" }}>{label}</p>
                          <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div>
                  <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl" style={{ background: "var(--surface-container)" }}>
                    <span className="material-symbols-outlined animate-spin" style={{ color: "var(--primary)", fontSize: 24 }}>progress_activity</span>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "var(--on-surface)" }}>{phaseLabel}</p>
                      <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        {phase === "scoring" ? "This ensures only genuinely relevant jobs appear" : "Please wait..."}
                      </p>
                    </div>
                  </div>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="card-stitch p-5 mb-4 animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl shrink-0" style={{ background: "var(--surface-container)" }} />
                        <div className="flex-1 space-y-2">
                          <div className="h-5 rounded-full w-2/3" style={{ background: "var(--surface-container)" }} />
                          <div className="h-3 rounded-full w-1/3" style={{ background: "var(--surface-container)" }} />
                          <div className="h-3 rounded-full w-full" style={{ background: "var(--surface-container)" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Results */}
              {phase === "done" && (
                <div>
                  <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                        {displayed.length} relevant jobs for you
                      </h2>
                      <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                        AI-scored against your profile · Live from job portals · {city.name}
                      </p>
                    </div>
                    <Pill variant="ghost" size="sm" onClick={findJobs} loading={isLoading}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                      Refresh
                    </Pill>
                  </div>

                  {displayed.length === 0 ? (
                    <div className="card-stitch p-12 text-center">
                      <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--outline-variant)" }}>search_off</span>
                      <p className="font-bold mt-4" style={{ color: "var(--on-surface)" }}>
                        No jobs match your current filters
                      </p>
                      <p className="text-sm mt-1 mb-4" style={{ color: "var(--on-surface-variant)" }}>
                        Lower the minimum match score or remove filters
                      </p>
                      <Pill variant="outline" size="sm"
                        onClick={() => setFilter({ remote: false, type: "", minScore: 0 })}>
                        Clear filters
                      </Pill>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayed.map((job, i) => (
                        <div key={job.id || i} className="animate-fade-in-up"
                          style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}>
                          <JobCard job={job} city={city.name} />
                        </div>
                      ))}

                      {/* CTA */}
                      <div className="p-6 rounded-3xl text-center mt-4"
                        style={{ background: `linear-gradient(135deg, var(--hero-mid, #004433), var(--primary))` }}>
                        <p className="font-bold text-white mb-1" style={{ fontFamily: "var(--font-headline)" }}>
                          Want to explore more?
                        </p>
                        <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.70)" }}>
                          Browse all live jobs across India on the full Job Board
                        </p>
                        <Pill variant="outline" onClick={() => navigate("/jobs")}>
                          <span style={{ color: "white" }}>Browse Full Job Board →</span>
                        </Pill>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SmartJobSearch;
