import { useState } from "react";
import { MapPin, Briefcase, Clock, ChevronDown, ChevronUp, Zap, Bot, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ApplyButtons from "./ApplyButtons";
import { cn } from "@/lib/utils";

export interface UnifiedJob {
  id?: string;
  title: string;
  company: string;
  logo?: string;
  location: string;
  type: string;
  salaryMin: number;
  salaryMax: number;
  matchScore: number;
  description: string;
  skills: string[];
  applyLink?: string;
  postedDate: string;
  isRemote?: boolean;
  source: "live" | "ai";
  whyMatch?: string;
}

interface JobCardProps {
  job: UnifiedJob;
  city: string;
}

const JobCard = ({ job, city }: JobCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const scoreColor =
    job.matchScore >= 85 ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400" :
    job.matchScore >= 70 ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400" :
    "bg-muted text-muted-foreground border-border";

  return (
    <div className={cn(
      "bg-card rounded-xl border transition-all duration-200",
      "border-border/50 hover:border-accent/30 card-shadow hover:card-shadow-hover"
    )}>
      {/* Main content */}
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Company logo or fallback */}
          <div className="w-10 h-10 rounded-lg border border-border/50 bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {job.logo ? (
              <img src={job.logo} alt={job.company} className="w-full h-full object-contain p-1"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h3 className="font-heading font-semibold text-base text-foreground leading-tight">{job.title}</h3>

              {/* Match score */}
              <Badge className={`text-xs font-bold border shrink-0 ${scoreColor}`}>
                {job.matchScore}% match
              </Badge>

              {/* Source badge */}
              {job.source === "live" ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 shrink-0">
                  <Zap className="h-2.5 w-2.5" />Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 shrink-0">
                  <Bot className="h-2.5 w-2.5" />AI Match
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-accent">{job.company}</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.isRemote ? "Remote" : job.location}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />{job.type}
          </span>
          <span className="flex items-center gap-1 font-semibold text-foreground">
            ₹{job.salaryMin}L – ₹{job.salaryMax}L
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />{job.postedDate}
          </span>
        </div>

        {/* Description */}
        <p className={cn(
          "text-sm text-muted-foreground leading-relaxed mb-3",
          expanded ? "" : "line-clamp-2"
        )}>
          {job.description}
        </p>

        {/* Why match */}
        {job.whyMatch && (
          <p className="text-xs text-accent/80 bg-accent/5 rounded-lg px-3 py-2 mb-3 border border-accent/10">
            ✓ {job.whyMatch}
          </p>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.skills.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
          ))}
        </div>

        {/* Apply buttons — always visible */}
        <ApplyButtons
          jobTitle={job.title}
          city={city}
          applyLink={job.applyLink}
          compact={!expanded}
        />
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground border-t border-border/50 transition-colors hover:bg-muted/30"
      >
        {expanded ? (
          <><ChevronUp className="h-3.5 w-3.5" />Show less</>
        ) : (
          <><ChevronDown className="h-3.5 w-3.5" />Show all apply options</>
        )}
      </button>
    </div>
  );
};

export default JobCard;
export type { JobCardProps };
