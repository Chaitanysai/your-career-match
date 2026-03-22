import { useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCity } from "@/hooks/useCity";
import { analyzeResume, matchJobs, callAI, safeParseJSON } from "@/services/gemini";
import { useToast } from "@/hooks/use-toast";
import JobCard from "@/components/jobs/JobCard";

interface MatchResult {
  score: number;
  verdict: string;
  missingKeywords: string[];
  foundKeywords: string[];
  tips: string[];
}

/* ── Pill button component — used throughout ── */
const PillBtn = ({
  onClick, disabled, loading: busy, children, variant = "primary", fullWidth = false,
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost" | "danger";
  fullWidth?: boolean;
}) => {
  const base: React.CSSProperties = {
    borderRadius: 999,
    fontFamily: "var(--font-headline)",
    fontWeight: 700,
    fontSize: "0.875rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.65rem 1.5rem",
    cursor: disabled || busy ? "not-allowed" : "pointer",
    opacity: disabled || busy ? 0.6 : 1,
    transition: "all 0.15s",
    border: "none",
    width: fullWidth ? "100%" : undefined,
  };

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      ...base,
      background: "var(--primary)",
      color: "white",
      boxShadow: "0 4px 16px var(--primary)35",
    },
    outline: {
      ...base,
      background: "transparent",
      color: "var(--primary)",
      border: "2px solid var(--primary)",
      boxShadow: "none",
    },
    ghost: {
      ...base,
      background: "var(--surface-container)",
      color: "var(--on-surface)",
      boxShadow: "none",
    },
    danger: {
      ...base,
      background: "transparent",
      color: "var(--error)",
      border: "1.5px solid var(--error)",
      boxShadow: "none",
    },
  };

  return (
    <button
      style={styles[variant]}
      onClick={!disabled && !busy ? onClick : undefined}
      disabled={disabled || busy}
      onMouseEnter={e => { if (!disabled && !busy) (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = disabled || busy ? "0.6" : "1"; }}
    >
      {busy && (
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>
          progress_activity
        </span>
      )}
      {children}
    </button>
  );
};

const ResumeMatcher = () => {
  const { city } = useCity();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file,     setFile]     = useState<File | null>(null);
  const [jd,       setJd]       = useState("");
  const [loading,  setLoading]  = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [result,   setResult]   = useState<MatchResult | null>(null);
  const [jobs,     setJobs]     = useState<any[]>([]);
  const [dragging, setDragging] = useState(false);
  const [optimizedJD, setOptimizedJD] = useState<string | null>(null);

  const handleFile = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setFile(f);
    setResult(null);
    setJobs([]);
    setOptimizedJD(null);
  };

  const getContent = async () => {
    if (!file) return null;
    if (file.type === "application/pdf") {
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = () => rej(new Error("Read failed"));
        reader.readAsDataURL(file);
      });
      return { base64, mimeType: "application/pdf" };
    }
    return { text: await file.text() };
  };

  /* ── Analyze ── */
  const analyze = async () => {
    if (!file) { toast({ title: "Upload your resume first", variant: "destructive" }); return; }
    setLoading(true);
    setOptimizedJD(null);
    try {
      const content = await getContent();
      if (!content) return;

      const analysis = await analyzeResume(content, city.name);

      // ATS keyword matching against JD
      const jdLower = jd.toLowerCase();
      const found   = analysis.skills.filter(s => jdLower.includes(s.toLowerCase()));
      const missing = ["AWS", "Terraform", "Redis", "Microservices", "CI/CD", "Kubernetes", "Docker"]
        .filter(k => !analysis.skills.map(s => s.toLowerCase()).some(s => s.includes(k.toLowerCase())))
        .filter(k => jd ? jdLower.includes(k.toLowerCase()) : true)
        .slice(0, 5);

      const score = jd.trim()
        ? Math.min(95, Math.max(35, Math.round((found.length / Math.max(analysis.skills.length, 1)) * 100)))
        : Math.min(95, Math.max(55, analysis.skills.length * 6));

      setResult({
        score,
        verdict: score >= 85 ? "Excellent match!" : score >= 70 ? "Good potential, needs work." : "Significant gaps detected.",
        missingKeywords: missing,
        foundKeywords: found.slice(0, 6),
        tips: [
          `Add "${missing[0] || "cloud skills"}" specifically to your Skills section`,
          "Quantify results (e.g., 'Reduced latency by 40%') to stand out to ATS",
          "Use a single-column layout for better PDF parsing accuracy",
        ],
      });

      // Get matched jobs
      const matched = await matchJobs(content, city.name, analysis.skills);
      setJobs(matched.slice(0, 4));

    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  /* ── One-click Optimize — rewrites JD to match resume better ── */
  const oneClickOptimize = async () => {
    if (!result || !file) {
      toast({ title: "Run analysis first", variant: "destructive" }); return;
    }
    setOptimizing(true);
    try {
      const content = await getContent();
      if (!content) return;

      const prompt = `You are an ATS optimization expert. A candidate uploaded their resume and wants to optimize their resume bullet points to better match a job description.

Missing keywords from their resume: ${result.missingKeywords.join(", ")}
Found keywords: ${result.foundKeywords.join(", ")}
Job description: ${jd.slice(0, 1000) || "Senior software engineer role requiring cloud and distributed systems skills"}
City: ${city.name}

Generate 5 optimized resume bullet points that:
1. Naturally incorporate the missing keywords
2. Are quantified with realistic metrics
3. Follow the STAR method
4. Are ATS-friendly

Return ONLY a JSON array of 5 strings: ["bullet1","bullet2","bullet3","bullet4","bullet5"]`;

      const raw = await callAI(null, prompt);
      const bullets = safeParseJSON<string[]>(raw, []);

      if (bullets.length > 0) {
        setOptimizedJD(bullets.join("\n\n"));
        toast({ title: "✨ Optimized bullets generated!", description: "Scroll down to see them" });
      } else {
        throw new Error("Could not generate optimization");
      }
    } catch (err: any) {
      toast({ title: "Optimization failed", description: err.message, variant: "destructive" });
    } finally {
      setOptimizing(false);
    }
  };

  /* ── Score ring ── */
  const circumference = 2 * Math.PI * 88;
  const offset = result ? circumference - (circumference * result.score) / 100 : circumference;
  const scoreColor = result
    ? result.score >= 85 ? "var(--secondary)"
    : result.score >= 70 ? "#3b82f6"
    : "var(--error)"
    : "var(--outline)";

  return (
    <DashboardLayout title="Resume Matcher">
      <div className="min-h-screen p-8" style={{ background: "var(--surface-container-low)" }}>

        {/* ── Page header + Analyze button at TOP ── */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1"
              style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
              Resume Matcher
            </h1>
            <p style={{ color: "var(--on-surface-variant)" }}>
              Upload your resume and match it against any job description using AI.
            </p>
          </div>
          {/* ── ANALYZE BUTTON — top, pill-shaped, theme color ── */}
          <PillBtn onClick={analyze} loading={loading} disabled={!file}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>analytics</span>
            {loading ? "Analyzing..." : "Analyze Matching Score"}
          </PillBtn>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* ── Left: inputs ── */}
          <div className="xl:col-span-7 flex flex-col gap-6">

            {/* Upload zone */}
            <div className="card-stitch p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(0,79,52,0.10)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 22 }}>upload_file</span>
                </div>
                <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                  Resume Upload
                </h3>
              </div>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center text-center cursor-pointer transition-all"
                style={{
                  borderColor: dragging ? "var(--primary)" : "var(--outline-variant)",
                  background: dragging ? "rgba(0,79,52,0.04)" : "transparent",
                }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all"
                  style={{ background: dragging ? "rgba(0,79,52,0.12)" : "var(--surface-container)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--primary)" }}>cloud_upload</span>
                </div>
                <p className="font-semibold mb-1" style={{ color: "var(--on-surface)" }}>
                  Drag and drop your resume here
                </p>
                <p className="text-sm mb-5" style={{ color: "var(--on-surface-variant)" }}>
                  PDF, DOCX supported · Max 5MB
                </p>
                <PillBtn variant="outline">Browse Files</PillBtn>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt"
                  className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              {/* Uploaded file */}
              {file && (
                <div className="mt-5 flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: "var(--surface-container)" }}>
                  <span className="material-symbols-outlined mat-fill" style={{ color: "var(--secondary)", fontSize: 20 }}>check_circle</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--on-surface)" }}>{file.name}</p>
                    <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button onClick={() => { setFile(null); setResult(null); setJobs([]); setOptimizedJD(null); }}
                    className="transition-colors"
                    style={{ color: "var(--outline)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--error)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--outline)"}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                  </button>
                </div>
              )}
            </div>

            {/* JD input */}
            <div className="card-stitch p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(0,79,52,0.10)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 22 }}>description</span>
                </div>
                <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                  Job Description <span className="text-sm font-normal" style={{ color: "var(--outline)" }}>(optional)</span>
                </h3>
              </div>
              <div className="relative">
                <textarea
                  className="w-full min-h-[200px] p-5 rounded-2xl border-none text-sm leading-relaxed resize-none outline-none transition-all"
                  style={{ background: "var(--surface-container-high)", color: "var(--on-surface)" }}
                  onFocus={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-container-lowest)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px var(--primary)";
                  }}
                  onBlur={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                  placeholder="Paste the full job description here to get a precise match score..."
                  value={jd}
                  onChange={e => setJd(e.target.value)}
                />
                <div className="absolute bottom-3 right-4 text-xs" style={{ color: "var(--outline)" }}>
                  {jd.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>

              {/* Analyze button also at bottom of JD for convenience */}
              <div className="mt-5 flex justify-end">
                <PillBtn onClick={analyze} loading={loading} disabled={!file}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>analytics</span>
                  {loading ? "Analyzing..." : "Analyze Matching Score"}
                </PillBtn>
              </div>
            </div>

            {/* Optimized bullets output */}
            {optimizedJD && (
              <div className="card-stitch p-8 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(0,79,52,0.10)" }}>
                    <span className="material-symbols-outlined mat-fill" style={{ color: "var(--primary)", fontSize: 22 }}>auto_awesome</span>
                  </div>
                  <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                    AI-Optimized Bullet Points
                  </h3>
                </div>
                <div className="space-y-3">
                  {optimizedJD.split("\n\n").filter(Boolean).map((bullet, i) => (
                    <div key={i} className="flex gap-3 p-4 rounded-2xl"
                      style={{ background: "var(--surface-container-low)" }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "var(--primary)" }} />
                      <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface)" }}>{bullet}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex gap-3">
                  <PillBtn variant="ghost" onClick={() => {
                    navigator.clipboard.writeText(optimizedJD);
                    toast({ title: "Copied to clipboard!" });
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                    Copy All
                  </PillBtn>
                  <PillBtn variant="outline" onClick={() => setOptimizedJD(null)}>
                    Dismiss
                  </PillBtn>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: results ── */}
          <div className="xl:col-span-5 flex flex-col gap-5">

            {/* Score gauge */}
            <div className="card-stitch p-8 text-center">
              <h3 className="text-xl font-semibold text-left mb-6"
                style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                Analysis Results
              </h3>
              <div className="relative w-44 h-44 mx-auto mb-5">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                  <circle cx="96" cy="96" r="88" fill="transparent"
                    stroke="var(--surface-container-high)" strokeWidth="12" />
                  <circle cx="96" cy="96" r="88" fill="transparent"
                    stroke={scoreColor} strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {result ? (
                    <>
                      <span className="text-5xl font-bold" style={{ fontFamily: "var(--font-headline)", color: scoreColor }}>
                        {result.score}<span className="text-2xl">%</span>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: "var(--on-surface-variant)" }}>
                        Match Score
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold" style={{ color: "var(--outline)" }}>–</span>
                  )}
                </div>
              </div>
              {result ? (
                <>
                  <p className="font-bold mb-1" style={{ color: "var(--on-surface)" }}>{result.verdict}</p>
                  <p className="text-sm px-2" style={{ color: "var(--on-surface-variant)" }}>
                    Your resume matches {result.score}% of the required skills.
                  </p>
                </>
              ) : (
                <p style={{ color: "var(--on-surface-variant)" }}>
                  Upload your resume and paste a JD to see your match score
                </p>
              )}
            </div>

            {result && (
              <>
                {/* Missing keywords */}
                <div className="card-stitch p-6">
                  <div className="flex items-center gap-2 mb-4" style={{ color: "var(--error)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>error</span>
                    <h4 className="font-bold text-sm">Keywords Missing</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.length > 0
                      ? result.missingKeywords.map(k => (
                          <span key={k} className="px-3 py-1.5 text-xs font-bold rounded-full"
                            style={{ background: "var(--error-container)", color: "var(--on-error-container)" }}>
                            {k}
                          </span>
                        ))
                      : <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>None detected 🎉</span>
                    }
                  </div>
                </div>

                {/* Found keywords */}
                <div className="card-stitch p-6">
                  <div className="flex items-center gap-2 mb-4" style={{ color: "var(--primary)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                    <h4 className="font-bold text-sm">Keywords Found</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.foundKeywords.length > 0
                      ? result.foundKeywords.map(k => (
                          <span key={k} className="px-3 py-1.5 text-xs font-bold rounded-full"
                            style={{ background: "var(--secondary-container)", color: "var(--on-secondary-container)" }}>
                            {k}
                          </span>
                        ))
                      : <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Upload resume to detect</span>
                    }
                  </div>
                </div>

                {/* ATS Tips + One-click Optimize */}
                <div className="p-6 rounded-3xl border"
                  style={{ background: "rgba(0,79,52,0.05)", borderColor: "var(--primary-fixed)" }}>
                  <div className="flex items-center gap-2 mb-4" style={{ color: "var(--primary)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>lightbulb</span>
                    <h4 className="font-bold text-sm uppercase tracking-wide">ATS Optimization Tips</h4>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-sm" style={{ color: "var(--on-surface)" }}>
                        <span className="font-bold shrink-0" style={{ color: "var(--primary)" }}>•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>

                  {/* ONE-CLICK OPTIMIZE — now actually works */}
                  <PillBtn
                    onClick={oneClickOptimize}
                    loading={optimizing}
                    fullWidth
                  >
                    <span className="material-symbols-outlined mat-fill" style={{ fontSize: 18 }}>auto_awesome</span>
                    {optimizing ? "Generating optimized bullets..." : "One-click Optimize"}
                  </PillBtn>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Job matches */}
        {jobs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6"
              style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
              Matched Jobs in {city.name}
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {jobs.map((job, i) => (
                <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
                  <JobCard job={{ ...job, source: "ai" }} city={city.name} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResumeMatcher;
