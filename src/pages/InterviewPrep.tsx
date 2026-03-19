import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCity } from "@/hooks/useCity";
import { callAI } from "@/services/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, ChevronRight, ChevronLeft, RotateCcw,
  CheckCircle, AlertCircle, Lightbulb, Trophy,
  Loader2, Play, BookOpen, Brain, Code, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────
interface Question {
  id: number;
  category: "technical" | "behavioral" | "system-design" | "hr";
  question: string;
  hint: string;
  expectedPoints: string[];
  difficulty: "easy" | "medium" | "hard";
}

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  betterAnswer: string;
  verdict: "excellent" | "good" | "needs-work";
}

const CATEGORIES = [
  { id: "technical", label: "Technical", icon: Code, color: "text-blue-500" },
  { id: "behavioral", label: "Behavioral", icon: Users, color: "text-purple-500" },
  { id: "system-design", label: "System Design", icon: Brain, color: "text-orange-500" },
  { id: "hr", label: "HR Round", icon: Mic, color: "text-green-500" },
];

const DIFFICULTY_COLOR = {
  easy: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard: "bg-red-50 text-red-700 border-red-200",
};

// ── Interview Prep Page ──────────────────────────────────────────
const InterviewPrep = () => {
  const { city } = useCity();
  const { toast } = useToast();

  // Setup state
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [experience, setExperience] = useState("3-5");
  const [category, setCategory] = useState("technical");
  const [numQuestions, setNumQuestions] = useState("5");

  // Session state
  const [phase, setPhase] = useState<"setup" | "interview" | "results">("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<number, Feedback>>({});
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const currentQuestion = questions[currentIdx];
  const currentAnswer = answers[currentIdx] || "";
  const currentFeedback = feedbacks[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  // ── Generate questions ───────────────────────────────────────
  const generateQuestions = async () => {
    if (!jobTitle) {
      toast({ title: "Enter a job title", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const prompt = `Generate ${numQuestions} ${category} interview questions for a ${jobTitle} role${company ? ` at ${company}` : ""} in ${city.name}, India. Candidate has ${experience} years experience.

Respond ONLY with valid JSON array (no markdown):
[
  {
    "id": 1,
    "category": "${category}",
    "question": "Interview question here",
    "hint": "Brief hint to guide the answer",
    "expectedPoints": ["key point 1", "key point 2", "key point 3"],
    "difficulty": "medium"
  }
]

Make questions realistic for Indian tech companies. Mix difficulty levels.`;

      const raw = await callAI(null, prompt);
      const clean = raw.replace(/```json|```/g, "").trim();
      const start = clean.indexOf("[");
      const end = clean.lastIndexOf("]") + 1;
      const parsed = JSON.parse(clean.slice(start, end));
      setQuestions(parsed);
      setCurrentIdx(0);
      setAnswers({});
      setFeedbacks({});
      setPhase("interview");
    } catch (err: any) {
      toast({ title: "Failed to generate questions", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Evaluate answer ──────────────────────────────────────────
  const evaluateAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast({ title: "Please write your answer first", variant: "destructive" });
      return;
    }
    setEvaluating(true);
    try {
      const prompt = `You are a senior interviewer at a top Indian tech company evaluating a ${jobTitle} candidate.

QUESTION: ${currentQuestion.question}
CANDIDATE ANSWER: ${currentAnswer}
EXPECTED KEY POINTS: ${currentQuestion.expectedPoints.join(", ")}

Evaluate the answer and respond ONLY with valid JSON (no markdown):
{
  "score": 75,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "betterAnswer": "A concise ideal answer in 3-4 sentences",
  "verdict": "good"
}

score: 0-100. verdict: "excellent" (85+), "good" (60-84), "needs-work" (below 60).`;

      const raw = await callAI(null, prompt);
      const clean = raw.replace(/```json|```/g, "").trim();
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}") + 1;
      const feedback = JSON.parse(clean.slice(start, end));
      setFeedbacks((prev) => ({ ...prev, [currentIdx]: feedback }));
    } catch (err: any) {
      toast({ title: "Evaluation failed", description: err.message, variant: "destructive" });
    } finally {
      setEvaluating(false);
    }
  };

  // ── Navigation ───────────────────────────────────────────────
  const goNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
    else setPhase("results");
  };

  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  // ── Results calculation ──────────────────────────────────────
  const answeredCount = Object.keys(answers).length;
  const evaluatedCount = Object.keys(feedbacks).length;
  const avgScore = evaluatedCount > 0
    ? Math.round(Object.values(feedbacks).reduce((s, f) => s + f.score, 0) / evaluatedCount)
    : 0;

  const getResultLabel = (score: number) => {
    if (score >= 85) return { label: "Excellent", color: "text-green-600", emoji: "🏆" };
    if (score >= 70) return { label: "Good", color: "text-blue-600", emoji: "👍" };
    if (score >= 50) return { label: "Average", color: "text-amber-600", emoji: "📈" };
    return { label: "Needs Practice", color: "text-red-600", emoji: "💪" };
  };

  // ── Setup Phase ──────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <DashboardLayout title="Interview Prep">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="font-heading text-2xl font-bold text-foreground">AI Mock Interview</h1>
            <p className="text-muted-foreground mt-1">Practice with real interview questions tailored to your role and company</p>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
              <button key={id} onClick={() => setCategory(id)}
                className={cn(
                  "p-4 rounded-xl border text-center transition-all",
                  category === id
                    ? "border-accent bg-accent/5 shadow-sm"
                    : "border-border/50 hover:border-accent/30 bg-card"
                )}>
                <Icon className={cn("h-6 w-6 mx-auto mb-2", color)} />
                <p className="text-sm font-medium text-foreground">{label}</p>
              </button>
            ))}
          </div>

          <Card className="card-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-base">Configure your interview</CardTitle>
              <CardDescription>We'll generate realistic questions for your specific role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Job Title *</Label>
                  <Input placeholder="e.g. Senior React Developer"
                    value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Company (optional)</Label>
                  <Input placeholder="e.g. Flipkart, Amazon, Swiggy"
                    value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Experience Level</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">Fresher (0-1 yr)</SelectItem>
                      <SelectItem value="1-3">Junior (1-3 yrs)</SelectItem>
                      <SelectItem value="3-5">Mid-level (3-5 yrs)</SelectItem>
                      <SelectItem value="5-8">Senior (5-8 yrs)</SelectItem>
                      <SelectItem value="8+">Lead/Staff (8+ yrs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Number of Questions</Label>
                  <Select value={numQuestions} onValueChange={setNumQuestions}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 questions (Quick)</SelectItem>
                      <SelectItem value="5">5 questions (Standard)</SelectItem>
                      <SelectItem value="8">8 questions (Full)</SelectItem>
                      <SelectItem value="10">10 questions (Intensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={generateQuestions} disabled={loading} className="w-full gap-2 h-11">
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Generating questions for {city.name}...</>
                  : <><Play className="h-4 w-4" />Start Mock Interview</>}
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: BookOpen, tip: "Type your answer as you'd say it in a real interview" },
              { icon: Lightbulb, tip: "Use the STAR method for behavioral questions" },
              { icon: Trophy, tip: "Aim for 80%+ score to be interview-ready" },
            ].map(({ icon: Icon, tip }) => (
              <div key={tip} className="flex items-start gap-2.5 p-3 bg-muted/50 rounded-lg">
                <Icon className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Interview Phase ──────────────────────────────────────────
  if (phase === "interview") {
    return (
      <DashboardLayout title="Interview Prep">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Question {currentIdx + 1} of {questions.length}
              </p>
              <h2 className="font-heading font-bold text-foreground">{jobTitle} Interview</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{answeredCount}/{questions.length} answered</span>
              <Button variant="outline" size="sm" className="gap-1.5"
                onClick={() => setPhase("setup")}>
                <RotateCcw className="h-3.5 w-3.5" />Restart
              </Button>
            </div>
          </div>

          {/* Progress */}
          <Progress value={progress} className="h-1.5 mb-6" />

          {/* Question card */}
          <Card className="card-shadow mb-4">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="capitalize">{currentQuestion.category.replace("-", " ")}</Badge>
                <Badge variant="outline" className={cn("capitalize border", DIFFICULTY_COLOR[currentQuestion.difficulty])}>
                  {currentQuestion.difficulty}
                </Badge>
              </div>

              <h3 className="font-heading font-semibold text-lg text-foreground leading-snug mb-4">
                {currentQuestion.question}
              </h3>

              {/* Hint */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{currentQuestion.hint}</p>
              </div>

              {/* Answer textarea */}
              <div className="space-y-1.5">
                <Label className="text-sm">Your Answer</Label>
                <Textarea
                  placeholder="Type your answer here as you'd explain it in the interview..."
                  rows={6}
                  value={currentAnswer}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [currentIdx]: e.target.value }))}
                  className="resize-none text-sm"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={evaluateAnswer} disabled={evaluating || !currentAnswer.trim()}
                  variant="outline" className="gap-2">
                  {evaluating
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Evaluating...</>
                    : <><Brain className="h-4 w-4" />Evaluate Answer</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feedback card */}
          {currentFeedback && (
            <Card className={cn("card-shadow mb-4 border", {
              "border-green-200 bg-green-50/30 dark:bg-green-900/10": currentFeedback.verdict === "excellent",
              "border-blue-200 bg-blue-50/30 dark:bg-blue-900/10": currentFeedback.verdict === "good",
              "border-amber-200 bg-amber-50/30 dark:bg-amber-900/10": currentFeedback.verdict === "needs-work",
            })}>
              <CardContent className="p-5 space-y-4">
                {/* Score */}
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-foreground">AI Feedback</span>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold font-heading" style={{
                      color: currentFeedback.score >= 85 ? "#16a34a" : currentFeedback.score >= 60 ? "#2563eb" : "#d97706"
                    }}>
                      {currentFeedback.score}%
                    </div>
                    <Badge variant="outline" className={cn("capitalize", {
                      "border-green-300 text-green-700": currentFeedback.verdict === "excellent",
                      "border-blue-300 text-blue-700": currentFeedback.verdict === "good",
                      "border-amber-300 text-amber-700": currentFeedback.verdict === "needs-work",
                    })}>
                      {currentFeedback.verdict.replace("-", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Strengths */}
                {currentFeedback.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />Strengths
                    </p>
                    <ul className="space-y-1">
                      {currentFeedback.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {currentFeedback.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />Improve
                    </p>
                    <ul className="space-y-1">
                      {currentFeedback.improvements.map((s, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Better answer */}
                <div className="bg-background rounded-lg p-3 border border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">Ideal Answer</p>
                  <p className="text-sm text-foreground leading-relaxed">{currentFeedback.betterAnswer}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={goPrev} disabled={currentIdx === 0} className="gap-2">
              <ChevronLeft className="h-4 w-4" />Previous
            </Button>
            <Button onClick={goNext} className="gap-2">
              {currentIdx === questions.length - 1 ? "See Results" : "Next Question"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Results Phase ────────────────────────────────────────────
  const result = getResultLabel(avgScore);
  return (
    <DashboardLayout title="Interview Prep">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{result.emoji}</div>
          <h1 className="font-heading text-3xl font-bold text-foreground">{result.label}</h1>
          <p className="text-muted-foreground mt-1">
            You scored <span className={cn("font-bold text-xl", result.color)}>{avgScore}%</span> across {evaluatedCount} evaluated questions
          </p>
        </div>

        {/* Per-question summary */}
        <div className="space-y-3 mb-8">
          {questions.map((q, i) => {
            const fb = feedbacks[i];
            const ans = answers[i];
            return (
              <Card key={i} className="card-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{q.question}</p>
                      {!ans && <p className="text-xs text-muted-foreground mt-0.5">Not answered</p>}
                      {ans && !fb && <p className="text-xs text-muted-foreground mt-0.5">Not evaluated</p>}
                    </div>
                    {fb && (
                      <div className="font-heading font-bold text-lg shrink-0" style={{
                        color: fb.score >= 85 ? "#16a34a" : fb.score >= 60 ? "#2563eb" : "#d97706"
                      }}>
                        {fb.score}%
                      </div>
                    )}
                    {ans && !fb && <Badge variant="outline" className="shrink-0">Skipped eval</Badge>}
                    {!ans && <Badge variant="outline" className="text-muted-foreground shrink-0">Skipped</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button onClick={() => { setPhase("setup"); setQuestions([]); }} variant="outline" className="flex-1 gap-2">
            <RotateCcw className="h-4 w-4" />New Interview
          </Button>
          <Button onClick={() => { setCurrentIdx(0); setPhase("interview"); }} className="flex-1 gap-2">
            <Play className="h-4 w-4" />Review Answers
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InterviewPrep;
