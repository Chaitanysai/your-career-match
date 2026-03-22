import { useState, useEffect, useCallback } from "react";
import {
  Search, SlidersHorizontal, X, Briefcase,
  RefreshCw, ExternalLink, Zap, Bot, AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useCity } from "@/hooks/useCity";
import { useToast } from "@/hooks/use-toast";
import { searchJobs, normaliseJSearchJob } from "@/services/jsearch";
import { matchJobs } from "@/services/gemini";
import { buildPortalSearchUrl, ALL_PORTALS } from "@/lib/portals";
import JobCard, { UnifiedJob } from "@/components/jobs/JobCard";
import DashboardLayout from "@/components/layout/DashboardLayout";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const EXPERIENCE_LEVELS = [
  { label: "Fresher (0-1 yr)", value: "fresher" },
  { label: "Junior (1-3 yrs)", value: "junior" },
  { label: "Mid-level (3-5 yrs)", value: "mid" },
  { label: "Senior (5-8 yrs)", value: "senior" },
  { label: "Lead/Staff (8+ yrs)", value: "lead" },
];

const POPULAR_ROLES = [
  "Software Engineer", "React Developer", "Data Scientist",
  "Product Manager", "DevOps Engineer", "UI/UX Designer",
  "Full Stack Developer", "Machine Learning Engineer",
];

interface Filters {
  types: string[];
  minSalary: number;
  minMatch: number;
  remote: boolean;
  datePosted: string;
  experience: string;
}

const defaultFilters: Filters = {
  types: [], minSalary: 0, minMatch: 0,
  remote: false, datePosted: "month", experience: "",
};

// ── Filter Panel ─────────────────────────────────────────────────
const FilterPanel = ({ filters, setFilters, onReset }: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onReset: () => void;
}) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <span className="font-heading font-semibold text-sm text-foreground">Filters</span>
      <Button variant="ghost" size="sm" onClick={onReset} className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
        Reset all
      </Button>
    </div>

    <div>
      <Label className="text-xs font-medium mb-2.5 block">Job Type</Label>
      <div className="space-y-2">
        {JOB_TYPES.map((type) => (
          <div key={type} className="flex items-center gap-2">
            <Checkbox id={`type-${type}`}
              checked={filters.types.includes(type)}
              onCheckedChange={(c) => setFilters((f) => ({
                ...f,
                types: c ? [...f.types, type] : f.types.filter((t) => t !== type),
              }))} />
            <label htmlFor={`type-${type}`} className="text-sm cursor-pointer">{type}</label>
          </div>
        ))}
      </div>
    </div>

    <Separator />

    <div>
      <Label className="text-xs font-medium mb-2.5 block">Experience Level</Label>
      <Select value={filters.experience} onValueChange={(v) => setFilters((f) => ({ ...f, experience: v }))}>
        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any level" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any level</SelectItem>
          {EXPERIENCE_LEVELS.map(({ label, value }) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <Separator />

    <div>
      <Label className="text-xs font-medium mb-2.5 block">
        Date Posted
      </Label>
      <Select value={filters.datePosted} onValueChange={(v) => setFilters((f) => ({ ...f, datePosted: v }))}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="3days">Last 3 days</SelectItem>
          <SelectItem value="week">Last week</SelectItem>
          <SelectItem value="month">Last month</SelectItem>
          <SelectItem value="all">All time</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Separator />

    <div>
      <Label className="text-xs font-medium mb-2.5 block">
        Min Salary: <span className="text-accent font-semibold">₹{filters.minSalary}L</span>
      </Label>
      <Slider min={0} max={50} step={2} value={[filters.minSalary]}
        onValueChange={([v]) => setFilters((f) => ({ ...f, minSalary: v }))} />
    </div>

    <Separator />

    <div>
      <Label className="text-xs font-medium mb-2.5 block">
        Min Match Score: <span className="text-accent font-semibold">{filters.minMatch}%</span>
      </Label>
      <Slider min={0} max={90} step={5} value={[filters.minMatch]}
        onValueChange={([v]) => setFilters((f) => ({ ...f, minMatch: v }))} />
    </div>

    <Separator />

    <div className="flex items-center gap-2">
      <Checkbox id="remote" checked={filters.remote}
        onCheckedChange={(c) => setFilters((f) => ({ ...f, remote: !!c }))} />
      <label htmlFor="remote" className="text-sm cursor-pointer">Remote / WFH only</label>
    </div>
  </div>
);

// ── Main JobBoard ─────────────────────────────────────────────────
const JobBoard = () => {
  const { city } = useCity();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("match");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"live" | "ai" | "mixed" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const activeFilterCount =
    filters.types.length +
    (filters.minSalary > 0 ? 1 : 0) +
    (filters.minMatch > 0 ? 1 : 0) +
    (filters.remote ? 1 : 0) +
    (filters.experience ? 1 : 0);

  const fetchJobs = useCallback(async (query: string, pageNum = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // Try JSearch first (real jobs)
      const raw = await searchJobs({
        query,
        location: city.name,
        employmentType: filters.types[0],
        datePosted: filters.datePosted as any,
        remoteOnly: filters.remote,
        page: pageNum,
      });

      if (raw.length > 0) {
        const normalised = raw.map((j, i) =>
          normaliseJSearchJob(j, 95 - i * 3 + Math.floor(Math.random() * 8))
        );
        setJobs((prev) => pageNum === 1 ? normalised : [...prev, ...normalised]);
        setSource(pageNum === 1 ? "live" : "mixed");
      } else {
        throw new Error("No results from JSearch");
      }
    } catch (liveErr: any) {
      // Fallback to Gemini AI jobs
      try {
        const aiRaw = await matchJobs(
          { text: `Job search: ${query} in ${city.name}` },
          city.name,
          [query]
        );
        const aiJobs: UnifiedJob[] = aiRaw.map((j) => ({
          ...j,
          id: Math.random().toString(36).slice(2),
          source: "ai" as const,
          isRemote: filters.remote,
        }));
        setJobs(aiJobs);
        setSource("ai");

        if (liveErr.message?.includes("quota")) {
          toast({
            title: "Live jobs quota reached",
            description: "Showing AI-generated matches. Resets next month.",
          });
        }
      } catch (aiErr: any) {
        setError("Could not load jobs. Please try again.");
        toast({ title: "Error loading jobs", description: aiErr.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [city.name, filters.types, filters.datePosted, filters.remote]);

  // Auto-fetch when city changes
  useEffect(() => {
    if (search) { setPage(1); fetchJobs(search, 1); }
  }, [city.name]);

  const handleSearch = () => {
    if (!search.trim()) {
      toast({ title: "Enter a job title or skill to search", variant: "destructive" });
      return;
    }
    setPage(1);
    fetchJobs(search, 1);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchJobs(search, next);
  };

  const resetFilters = () => setFilters(defaultFilters);

  // Client-side filter + sort
  const displayed = jobs
    .filter((j) => {
      const matchesType = !filters.types.length || filters.types.some((t) =>
        j.type.toLowerCase().includes(t.toLowerCase()));
      const matchesSalary = j.salaryMax >= filters.minSalary;
      const matchesScore = j.matchScore >= filters.minMatch;
      const matchesRemote = !filters.remote || j.isRemote;
      return matchesType && matchesSalary && matchesScore && matchesRemote;
    })
    .sort((a, b) => {
      if (sortBy === "match") return b.matchScore - a.matchScore;
      if (sortBy === "salary") return b.salaryMax - a.salaryMax;
      if (sortBy === "recent") return a.postedDate.localeCompare(b.postedDate);
      return a.title.localeCompare(b.title);
    });

  return (
    <DashboardLayout title="Job Board">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Job Board</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Search real jobs in <span className="text-accent font-medium">{city.name}</span> — powered by JSearch + Gemini AI
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search jobs in ${city.name}... e.g. React Developer, Data Scientist`}
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          {search && (
            <button onClick={() => { setSearch(""); setJobs([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} disabled={loading} className="h-11 px-6 gap-2 shrink-0">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </Button>

        {/* Mobile filter sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-11 gap-2 sm:hidden shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-accent text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader className="mb-4"><SheetTitle>Filter Jobs</SheetTitle></SheetHeader>
            <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Quick role chips */}
      {!jobs.length && !loading && (
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2">Popular searches in {city.name}:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_ROLES.map((role) => (
              <button key={role}
                onClick={() => { setSearch(role); setTimeout(() => fetchJobs(role, 1), 0); }}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-accent/50 hover:bg-accent/5 text-muted-foreground hover:text-accent transition-all">
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Source indicator + sort */}
      {jobs.length > 0 && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{displayed.length} jobs found</span>
            {source === "live" && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Zap className="h-3 w-3" />Live from JSearch
              </span>
            )}
            {source === "ai" && (
              <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                <Bot className="h-3 w-3" />AI-generated
              </span>
            )}
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Best Match</SelectItem>
              <SelectItem value="salary">Highest Salary</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop filter sidebar */}
        <aside className="hidden sm:block w-56 shrink-0">
          <div className="bg-card rounded-xl border border-border/50 p-4 card-shadow sticky top-24">
            <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} />

            <Separator className="my-4" />

            {/* Search on portals directly */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Search directly on:</p>
              <div className="space-y-1.5">
                {ALL_PORTALS.map((portal) => (
                  <a
                    key={portal.id}
                    href={buildPortalSearchUrl(portal.id, search || "software engineer", city.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <span className="font-medium">{portal.name}</span>
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Active filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.types.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">{t}
                  <X className="h-3 w-3 cursor-pointer" onClick={() =>
                    setFilters((f) => ({ ...f, types: f.types.filter((x) => x !== t) }))} />
                </Badge>
              ))}
              {filters.minSalary > 0 && (
                <Badge variant="secondary" className="gap-1">₹{filters.minSalary}L+
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters((f) => ({ ...f, minSalary: 0 }))} />
                </Badge>
              )}
              {filters.remote && (
                <Badge variant="secondary" className="gap-1">Remote
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters((f) => ({ ...f, remote: false }))} />
                </Badge>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin text-accent" />
                Searching live jobs in {city.name}...
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl p-5 border border-border/50 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && jobs.length === 0 && (
            <div className="text-center py-16">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="font-heading font-semibold text-foreground mb-1">Search for jobs in {city.name}</p>
              <p className="text-muted-foreground text-sm">
                Enter a job title or skill above — we'll search live job portals + AI matching
              </p>
            </div>
          )}

          {/* Job cards */}
          {!loading && displayed.length > 0 && (
            <div className="space-y-4">
              {displayed.map((job, i) => (
                <div key={job.id || i} className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                  <JobCard job={job} city={city.name} />
                </div>
              ))}

              {/* Load more — only for live results */}
              {source === "live" && displayed.length >= 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={loadMore} disabled={loading} className="gap-2">
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                    Load more jobs
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default JobBoard;
