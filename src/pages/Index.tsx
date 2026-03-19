import { useState } from "react";
import { Search, Sparkles, TrendingUp, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeResume, matchJobs, ResumeAnalysis, MatchedJob } from "@/services/gemini";
import { useCity } from "@/hooks/useCity";
import ResumeUpload from "@/components/ResumeUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Briefcase, MapPin, Clock, ExternalLink } from "lucide-react";

// ── Extract resume content from any file type ────────────────────
export async function extractResumeContent(file: File): Promise<{
  text?: string;
  base64?: string;
  mimeType?: string;
}> {
  // Plain text — read directly
  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    const text = await file.text();
    return { text };
  }

  // PDF / DOC / DOCX — convert to base64 for Gemini
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({
        base64,
        mimeType: file.type || "application/pdf",
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file. Please try a PDF or TXT."));
    reader.readAsDataURL(file);
  });
}

// ── India Job Card ───────────────────────────────────────────────
const IndiaJobCard = ({ job }: { job: MatchedJob }) => {
  const scoreColor =
    job.matchScore >= 85 ? "bg-accent/10 text-accent border-accent/20" :
    job.matchScore >= 70 ? "bg-primary/10 text-primary border-primary/20" :
    "bg-muted text-muted-foreground border-border";

  return (
    <div className="group bg-card rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all border border-border/50 hover:border-accent/20">
      <div className="flex items-start gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-heading font-semibold text-base text-foreground">{job.title}</h3>
            <Badge className={`text-xs font-bold shrink-0 border ${scoreColor}`}>{job.matchScore}% match</Badge>
          </div>
          <p className="text-sm font-medium text-accent">{job.company}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.type}</span>
        <span className="flex items-center gap-1 font-medium text-foreground">
          ₹{job.salaryMin}L – ₹{job.salaryMax}L
        </span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.postedDate}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{job.description}</p>
      {job.whyMatch && (
        <p className="text-xs text-accent/80 bg-accent/5 rounded-lg px-3 py-2 mb-3 border border-accent/10">
          ✓ {job.whyMatch}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {job.skills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
      </div>
      {job.url && job.url !== "#" && (
        <a href={job.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-accent hover:underline">
          View Job <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────
const IndexPage = () => {
  const { toast } = useToast();
  const { city } = useCity();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [jobs, setJobs] = useState<MatchedJob[]>([]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setAnalysis(null);
    setJobs([]);
    try {
      const content = await extractResumeContent(file);
      const [resumeData, jobData] = await Promise.all([
        analyzeResume(content, city.name),
        matchJobs(content, city.name, []),
      ]);
      setAnalysis(resumeData);
      setJobs(jobData);
      toast({ title: "Analysis complete!", description: `Found ${jobData.length} jobs in ${city.name}` });
    } catch (err: any) {
      console.error("Resume analysis error:", err);
      toast({
        title: "Analysis failed",
        description: err.message || "Please try again with a PDF or TXT file.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-gradient py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/10">
            <Sparkles className="h-4 w-4 text-accent-green" />
            <span className="text-sm font-medium text-white/90">AI-Powered · {city.name} Jobs</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Find Jobs in <span style={{ color: "var(--accent-500)" }}>{city.name}</span>
            <br className="hidden sm:block" />That Match Your Resume
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Upload your resume · Gemini AI analyzes your skills · Get matched to real jobs in {city.name} with ₹LPA salaries
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 pb-16">
        <div className="bg-card rounded-xl p-6 sm:p-8 card-shadow border border-border/50 mb-8">
          <ResumeUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
        </div>

        {isLoading && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground mb-2 animate-pulse">
              Gemini AI is reading your resume for {city.name} jobs...
            </p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border/50 animate-pulse-slow"
                style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="h-5 bg-muted rounded w-2/3 mb-3" />
                <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-4/5" />
              </div>
            ))}
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border/50 p-5 card-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-accent" />
                <h3 className="font-heading font-semibold text-foreground">AI Resume Analysis</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Suggested Role</p>
                  <p className="font-medium text-sm text-foreground">{analysis.suggestedTitle}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Experience</p>
                  <p className="font-medium text-sm text-foreground">{analysis.experience}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Expected in {city.name}</p>
                  <p className="font-medium text-sm text-accent">
                    ₹{analysis.salaryRange?.min}L – ₹{analysis.salaryRange?.max}L
                  </p>
                </div>
              </div>
              {analysis.summary && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{analysis.summary}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {analysis.skills.map((s) => (
                  <Badge key={s} className="bg-accent/10 text-accent border-accent/20 text-xs">{s}</Badge>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/skillgap")}>
                  <TrendingUp className="h-3.5 w-3.5" />Skill Gap Analysis
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/advisor")}>
                  <MessageSquare className="h-3.5 w-3.5" />Talk to AI Advisor
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-accent" />
                <h2 className="font-heading font-semibold text-xl text-foreground">
                  {jobs.length} Matching Jobs in {city.name}
                </h2>
              </div>
              <div className="space-y-4">
                {jobs.map((job, i) => (
                  <div key={i} className="animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
                    <IndiaJobCard job={job} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default IndexPage;