import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCity } from "@/hooks/useCity";
import { callAI, safeParseJSON } from "@/services/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Sparkles, Plus, X, Download,
  User, Briefcase, GraduationCap, Code, FileText, ChevronRight
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────
interface WorkExp {
  id: string;
  company: string;
  role: string;
  duration: string;
  bullets: string[];
}

interface Education {
  id: string;
  degree: string;
  college: string;
  year: string;
  cgpa: string;
}

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: string[];
  experience: WorkExp[];
  education: Education[];
  certifications: string[];
}

const STEPS = [
  { id: "basics", label: "Basics", icon: User },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Code },
  { id: "preview", label: "Preview", icon: FileText },
];

const uid = () => Math.random().toString(36).slice(2, 8);

// ── Resume Builder ───────────────────────────────────────────────
const ResumeBuilder = () => {
  const { city } = useCity();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState("");

  const [data, setData] = useState<ResumeData>({
    name: "", email: "", phone: "", location: city.name,
    linkedin: "", github: "", summary: "",
    skills: [], experience: [], education: [], certifications: [],
  });

  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");

  const update = (field: keyof ResumeData, value: any) =>
    setData((d) => ({ ...d, [field]: value }));

  // ── AI helpers ───────────────────────────────────────────────
  const generateSummary = async () => {
    if (!targetRole) { toast({ title: "Enter a target role first", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const skills = data.skills.join(", ") || "software development";
      const exp = data.experience[0]?.role || targetRole;
      const prompt = `Write a professional resume summary for a ${targetRole} with experience as ${exp} applying to jobs in ${city.name}, India. Skills: ${skills}. 

Write 3 impactful sentences. Use active voice. Include years of experience if known. India-specific and ATS-friendly. Return ONLY the summary text, no quotes or extra text.`;
      const result = await callAI(null, prompt);
      update("summary", result.trim());
    } catch (err: any) {
      toast({ title: "Failed to generate summary", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateBullets = async (expId: string) => {
    const exp = data.experience.find((e) => e.id === expId);
    if (!exp?.role) { toast({ title: "Enter the job role first", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const prompt = `Generate 4 strong resume bullet points for a ${exp.role} at ${exp.company || "a tech company"} in India.

Rules:
- Start each with a strong action verb (Built, Developed, Led, Optimized, Reduced, Increased)
- Include metrics where possible (%, X users, Xms, X LPA savings)
- ATS-friendly for Indian tech companies
- Return ONLY a JSON array of 4 strings: ["bullet1", "bullet2", "bullet3", "bullet4"]`;
      const raw = await callAI(null, prompt);
      const bullets = safeParseJSON<string[]>(raw, []);
      setData((d) => ({
        ...d,
        experience: d.experience.map((e) =>
          e.id === expId ? { ...e, bullets: bullets.length ? bullets : e.bullets } : e
        ),
      }));
    } catch (err: any) {
      toast({ title: "Failed to generate bullets", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const suggestSkills = async () => {
    if (!targetRole) { toast({ title: "Enter a target role first", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const prompt = `List 12 most in-demand technical skills for a ${targetRole} in ${city.name}, India in 2024. Include both must-have and nice-to-have skills. Return ONLY a JSON array of strings: ["skill1","skill2",...]`;
      const raw = await callAI(null, prompt);
      const suggested = safeParseJSON<string[]>(raw, []);
      if (suggested.length) {
        const merged = [...new Set([...data.skills, ...suggested])];
        update("skills", merged);
        toast({ title: "Skills suggested!", description: `Added ${suggested.length} skills for ${city.name} market` });
      }
    } catch (err: any) {
      toast({ title: "Failed to suggest skills", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Experience helpers ───────────────────────────────────────
  const addExp = () => {
    update("experience", [...data.experience, {
      id: uid(), company: "", role: "", duration: "", bullets: ["", "", ""]
    }]);
  };

  const updateExp = (id: string, field: keyof WorkExp, value: any) => {
    setData((d) => ({
      ...d,
      experience: d.experience.map((e) => e.id === id ? { ...e, [field]: value } : e),
    }));
  };

  const updateBullet = (expId: string, idx: number, value: string) => {
    setData((d) => ({
      ...d,
      experience: d.experience.map((e) =>
        e.id === expId
          ? { ...e, bullets: e.bullets.map((b, i) => i === idx ? value : b) }
          : e
      ),
    }));
  };

  const addBullet = (expId: string) => {
    setData((d) => ({
      ...d,
      experience: d.experience.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets, ""] } : e
      ),
    }));
  };

  // ── Education helpers ────────────────────────────────────────
  const addEdu = () => {
    update("education", [...data.education, {
      id: uid(), degree: "", college: "", year: "", cgpa: ""
    }]);
  };

  const updateEdu = (id: string, field: keyof Education, value: string) => {
    setData((d) => ({
      ...d,
      education: d.education.map((e) => e.id === id ? { ...e, [field]: value } : e),
    }));
  };

  // ── Download as HTML ─────────────────────────────────────────
  const downloadResume = () => {
    const html = generateResumeHTML(data);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.name || "resume"}_RoleMatch.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Resume downloaded!", description: "Open the HTML file and print as PDF" });
  };

  // ── Step: Basics ─────────────────────────────────────────────
  const StepBasics = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Target Role *</Label>
        <Input placeholder="e.g. Senior React Developer, Data Scientist"
          value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
        <p className="text-xs text-muted-foreground">Used to tailor AI suggestions throughout</p>
      </div>
      <Separator />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { field: "name", label: "Full Name", placeholder: "Chaitanya Sai" },
          { field: "email", label: "Email", placeholder: "you@example.com" },
          { field: "phone", label: "Phone", placeholder: "+91 98765 43210" },
          { field: "location", label: "Location", placeholder: "Hyderabad, India" },
          { field: "linkedin", label: "LinkedIn URL", placeholder: "linkedin.com/in/yourname" },
          { field: "github", label: "GitHub URL", placeholder: "github.com/yourname" },
        ].map(({ field, label, placeholder }) => (
          <div key={field} className="space-y-1.5">
            <Label>{label}</Label>
            <Input placeholder={placeholder} value={(data as any)[field]}
              onChange={(e) => update(field as keyof ResumeData, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Professional Summary</Label>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
            onClick={generateSummary} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI Generate
          </Button>
        </div>
        <Textarea placeholder="Write a compelling professional summary..."
          rows={4} value={data.summary}
          onChange={(e) => update("summary", e.target.value)} />
      </div>
    </div>
  );

  // ── Step: Experience ─────────────────────────────────────────
  const StepExperience = () => (
    <div className="space-y-5">
      {data.experience.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No experience added yet</p>
        </div>
      )}
      {data.experience.map((exp, idx) => (
        <Card key={exp.id} className="border border-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-sm">Experience {idx + 1}</CardTitle>
            <button onClick={() => update("experience", data.experience.filter((e) => e.id !== exp.id))}
              className="text-muted-foreground hover:text-destructive transition-colors">
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Company" value={exp.company}
                onChange={(e) => updateExp(exp.id, "company", e.target.value)} />
              <Input placeholder="Job Title" value={exp.role}
                onChange={(e) => updateExp(exp.id, "role", e.target.value)} />
              <Input placeholder="Duration e.g. Jun 2022 – Present" value={exp.duration}
                onChange={(e) => updateExp(exp.id, "duration", e.target.value)} className="sm:col-span-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Bullet Points</Label>
                <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
                  onClick={() => generateBullets(exp.id)} disabled={loading}>
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  AI Generate
                </Button>
              </div>
              {exp.bullets.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground mt-2.5 text-sm">•</span>
                  <Input placeholder="Describe an achievement with metrics..."
                    value={b} onChange={(e) => updateBullet(exp.id, i, e.target.value)} />
                </div>
              ))}
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7"
                onClick={() => addBullet(exp.id)}>
                <Plus className="h-3 w-3" />Add bullet
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" className="w-full gap-2" onClick={addExp}>
        <Plus className="h-4 w-4" />Add Work Experience
      </Button>
    </div>
  );

  // ── Step: Education ──────────────────────────────────────────
  const StepEducation = () => (
    <div className="space-y-4">
      {data.education.map((edu, idx) => (
        <Card key={edu.id} className="border border-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-sm">Education {idx + 1}</CardTitle>
            <button onClick={() => update("education", data.education.filter((e) => e.id !== edu.id))}
              className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Degree e.g. B.Tech CSE" value={edu.degree}
                onChange={(e) => updateEdu(edu.id, "degree", e.target.value)} className="sm:col-span-2" />
              <Input placeholder="College/University" value={edu.college}
                onChange={(e) => updateEdu(edu.id, "college", e.target.value)} />
              <Input placeholder="Passing Year e.g. 2022" value={edu.year}
                onChange={(e) => updateEdu(edu.id, "year", e.target.value)} />
              <Input placeholder="CGPA e.g. 8.5/10" value={edu.cgpa}
                onChange={(e) => updateEdu(edu.id, "cgpa", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" className="w-full gap-2" onClick={addEdu}>
        <Plus className="h-4 w-4" />Add Education
      </Button>
    </div>
  );

  // ── Step: Skills ─────────────────────────────────────────────
  const StepSkills = () => (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Technical Skills</Label>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
            onClick={suggestSkills} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI Suggest for {city.name}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-3 bg-muted/30 rounded-lg border border-border/50">
          {data.skills.map((s) => (
            <Badge key={s} className="bg-accent/10 text-accent border-accent/20 gap-1.5 pr-1.5">
              {s}
              <button onClick={() => update("skills", data.skills.filter((x) => x !== s))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {data.skills.length === 0 && <p className="text-xs text-muted-foreground">No skills added yet</p>}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Type a skill and press Enter..."
            value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSkill.trim()) {
                update("skills", [...new Set([...data.skills, newSkill.trim()])]);
                setNewSkill("");
              }
            }} />
          <Button variant="outline" size="icon" onClick={() => {
            if (newSkill.trim()) {
              update("skills", [...new Set([...data.skills, newSkill.trim()])]);
              setNewSkill("");
            }
          }}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      <Separator />

      <div>
        <Label className="mb-2 block">Certifications</Label>
        <div className="space-y-2 mb-2">
          {data.certifications.map((c, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input value={c} onChange={(e) => {
                const certs = [...data.certifications];
                certs[i] = e.target.value;
                update("certifications", certs);
              }} />
              <button onClick={() => update("certifications", data.certifications.filter((_, j) => j !== i))}>
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="e.g. AWS Certified Developer, Google Cloud..."
            value={newCert} onChange={(e) => setNewCert(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCert.trim()) {
                update("certifications", [...data.certifications, newCert.trim()]);
                setNewCert("");
              }
            }} />
          <Button variant="outline" size="icon" onClick={() => {
            if (newCert.trim()) {
              update("certifications", [...data.certifications, newCert.trim()]);
              setNewCert("");
            }
          }}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );

  // ── Step: Preview ────────────────────────────────────────────
  const StepPreview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Preview of your resume</p>
        <Button onClick={downloadResume} className="gap-2">
          <Download className="h-4 w-4" />Download Resume
        </Button>
      </div>
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div
          className="p-8 text-gray-900 font-sans text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: generateResumePreview(data) }}
        />
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Download as HTML → open in browser → Ctrl+P → Save as PDF for best results
      </p>
    </div>
  );

  const STEP_CONTENT = [<StepBasics />, <StepExperience />, <StepEducation />, <StepSkills />, <StepPreview />];

  return (
    <DashboardLayout title="Resume Builder">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">AI Resume Builder</h1>
          <p className="text-muted-foreground mt-1">Build an ATS-friendly resume optimized for {city.name} job market</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map(({ id, label, icon: Icon }, idx) => (
            <button key={id} onClick={() => setStep(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                step === idx
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : step > idx
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground/50 cursor-default"
              }`}>
              <Icon className="h-3.5 w-3.5" />
              {label}
              {idx < STEPS.length - 1 && <ChevronRight className="h-3 w-3 opacity-40 ml-1" />}
            </button>
          ))}
        </div>

        {/* Step content */}
        <Card className="card-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              {(() => { const S = STEPS[step]; return <S.icon className="h-4 w-4 text-accent" />; })()}
              {STEPS[step].label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {STEP_CONTENT[step]}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
            ← Previous
          </Button>
          <Button disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>
            Next →
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

// ── Resume HTML generators ────────────────────────────────────────
function generateResumePreview(d: ResumeData): string {
  return `
<div style="max-width:720px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a">
  <div style="border-bottom:2px solid #0a1628;padding-bottom:12px;margin-bottom:16px">
    <h1 style="font-size:24px;font-weight:700;margin:0 0 4px">${d.name || "Your Name"}</h1>
    <div style="font-size:12px;color:#444;display:flex;flex-wrap:wrap;gap:12px">
      ${d.email ? `<span>${d.email}</span>` : ""}
      ${d.phone ? `<span>${d.phone}</span>` : ""}
      ${d.location ? `<span>${d.location}</span>` : ""}
      ${d.linkedin ? `<span>${d.linkedin}</span>` : ""}
      ${d.github ? `<span>${d.github}</span>` : ""}
    </div>
  </div>
  ${d.summary ? `<div style="margin-bottom:16px"><h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0a1628;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px">Summary</h2><p style="font-size:12px;line-height:1.6;margin:0">${d.summary}</p></div>` : ""}
  ${d.experience.length ? `<div style="margin-bottom:16px"><h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0a1628;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px">Experience</h2>${d.experience.map((e) => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><strong style="font-size:13px">${e.role}</strong><span style="font-size:11px;color:#666">${e.duration}</span></div><div style="font-size:12px;color:#555;margin:2px 0">${e.company}</div><ul style="margin:4px 0;padding-left:16px">${e.bullets.filter(Boolean).map((b) => `<li style="font-size:12px;line-height:1.5">${b}</li>`).join("")}</ul></div>`).join("")}</div>` : ""}
  ${d.education.length ? `<div style="margin-bottom:16px"><h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0a1628;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px">Education</h2>${d.education.map((e) => `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><div><strong style="font-size:13px">${e.degree}</strong><div style="font-size:12px;color:#555">${e.college}</div></div><div style="text-align:right;font-size:11px;color:#666"><div>${e.year}</div>${e.cgpa ? `<div>CGPA: ${e.cgpa}</div>` : ""}</div></div>`).join("")}</div>` : ""}
  ${d.skills.length ? `<div style="margin-bottom:16px"><h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0a1628;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px">Skills</h2><p style="font-size:12px;margin:0">${d.skills.join(" • ")}</p></div>` : ""}
  ${d.certifications.length ? `<div><h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0a1628;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px">Certifications</h2><ul style="margin:0;padding-left:16px">${d.certifications.map((c) => `<li style="font-size:12px">${c}</li>`).join("")}</ul></div>` : ""}
</div>`;
}

function generateResumeHTML(d: ResumeData): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${d.name} - Resume</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1a1a}@media print{body{margin:0;padding:15px}}</style></head><body>${generateResumePreview(d)}</body></html>`;
}

export default ResumeBuilder;
