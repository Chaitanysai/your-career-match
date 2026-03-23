import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useCity } from "@/hooks/useCity";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";

/* ── Pill button ── */
const Pill = ({
  onClick, disabled, loading: busy, children, variant = "primary", type = "button",
}: {
  onClick?: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode; variant?: "primary"|"outline"|"ghost";
  type?: "button"|"submit";
}) => {
  const base: React.CSSProperties = {
    borderRadius: 999, fontFamily: "var(--font-headline)", fontWeight: 700,
    fontSize: "0.875rem", display: "inline-flex", alignItems: "center",
    justifyContent: "center", gap: "0.5rem", padding: "0.65rem 1.5rem",
    cursor: disabled || busy ? "not-allowed" : "pointer",
    opacity: disabled || busy ? 0.55 : 1, transition: "all 0.15s", border: "none",
  };
  const v: Record<string, React.CSSProperties> = {
    primary: { ...base, background: "var(--primary)", color: "white", boxShadow: "0 4px 12px var(--primary)35" },
    outline: { ...base, background: "transparent", color: "var(--primary)", border: "2px solid var(--primary)" },
    ghost:   { ...base, background: "var(--surface-container)", color: "var(--on-surface)" },
  };
  return (
    <button type={type} style={v[variant]}
      onClick={!disabled && !busy ? onClick : undefined} disabled={disabled || busy}
      onMouseEnter={e => { if (!disabled && !busy) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = disabled || busy ? "0.55" : "1"; }}>
      {busy && <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>}
      {children}
    </button>
  );
};

/* ── Field component ── */
const Field = ({
  label, value, onChange, type = "text", placeholder, disabled = false, hint,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean; hint?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold uppercase tracking-wider"
      style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-label)" }}>
      {label}
    </label>
    <input
      type={type} value={value} disabled={disabled} placeholder={placeholder}
      onChange={e => onChange?.(e.target.value)}
      className="w-full text-sm outline-none border transition-all"
      style={{
        background: disabled ? "var(--surface-container-high)" : "var(--surface-container-low)",
        borderColor: "var(--outline-variant)", borderRadius: "0.875rem",
        padding: "0.875rem 1.125rem", color: disabled ? "var(--outline)" : "var(--on-surface)",
        fontFamily: "var(--font-body)", cursor: disabled ? "not-allowed" : "text",
        opacity: disabled ? 0.7 : 1,
      }}
      onFocus={e => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
          (e.currentTarget as HTMLElement).style.background = "var(--surface-container-lowest)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(0,79,52,0.10)";
        }
      }}
      onBlur={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)";
        (e.currentTarget as HTMLElement).style.background = disabled ? "var(--surface-container-high)" : "var(--surface-container-low)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    />
    {hint && <p className="text-xs" style={{ color: "var(--outline)" }}>{hint}</p>}
  </div>
);

const EXPERIENCE_OPTIONS = [
  "Fresher (0–1 yr)", "Junior (1–3 yrs)", "Mid-level (3–5 yrs)",
  "Senior (5–8 yrs)", "Lead / Staff (8–12 yrs)", "Principal / Architect (12+ yrs)",
];
const NOTICE_OPTIONS = ["Immediate", "15 days", "30 days", "60 days", "90 days", "Serving notice"];
const SKILLS_COMMON = [
  "React","TypeScript","Node.js","Python","Java","Go","AWS","Docker","Kubernetes",
  "PostgreSQL","MongoDB","GraphQL","Kafka","Redis","Flutter","Swift","Kotlin",
  "Spring Boot","Django","Next.js","Vue","Angular","Data Science","Machine Learning",
];

const Profile = () => {
  const { user } = useAuth();
  const { city } = useCity();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name:         "",
    email:        "",
    jobTitle:     "",
    location:     city.name,
    experience:   "Mid-level (3–5 yrs)",
    noticePeriod: "30 days",
    bio:          "",
    currentCTC:   "",
    expectedCTC:  "",
    linkedin:     "",
    github:       "",
    portfolio:    "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  // Completion score
  const fields = [
    form.name, form.jobTitle, form.bio, form.currentCTC,
    form.expectedCTC, form.linkedin, form.github,
  ];
  const filled = fields.filter(f => f.trim().length > 0).length + (skills.length > 0 ? 1 : 0);
  const completion = Math.round((filled / (fields.length + 1)) * 100);

  // Load from Firebase + localStorage on mount
  useEffect(() => {
    if (!user) return;

    // ── FIX: use user.name (already resolved in useAuth) not email ──
    const savedProfile = localStorage.getItem(`careerlaunch_profile_${user.uid}`);
    const saved = savedProfile ? JSON.parse(savedProfile) : {};

    setForm(prev => ({
      ...prev,
      name:         user.name || "",           // always use resolved name
      email:        user.email || "",
      location:     saved.location || city.name,
      jobTitle:     saved.jobTitle || "",
      experience:   saved.experience || "Mid-level (3–5 yrs)",
      noticePeriod: saved.noticePeriod || "30 days",
      bio:          saved.bio || "",
      currentCTC:   saved.currentCTC || "",
      expectedCTC:  saved.expectedCTC || "",
      linkedin:     saved.linkedin || "",
      github:       saved.github || "",
      portfolio:    saved.portfolio || "",
    }));
    setSkills(saved.skills || []);
  }, [user]);

  const u = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const addSkill = (s: string) => {
    const sk = s.trim();
    if (sk && !skills.includes(sk)) setSkills(prev => [...prev, sk]);
    setNewSkill("");
  };

  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update Firebase displayName if changed
      if (auth.currentUser && form.name && form.name !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: form.name });
      }

      // Save full profile to localStorage
      const profileData = { ...form, skills };
      localStorage.setItem(`careerlaunch_profile_${user.uid}`, JSON.stringify(profileData));

      toast({ title: "Profile saved!" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false); }
  };

  const initials = form.name
    ? form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] || "U").toUpperCase();

  return (
    <DashboardLayout title="My Profile">
      <div className="min-h-screen p-8" style={{ background: "var(--surface-container-low)" }}>
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-1"
                style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                My Profile
              </h1>
              <p style={{ color: "var(--on-surface-variant)" }}>
                Keep updated for better matches in {city.name}
              </p>
            </div>
            <Pill onClick={save} loading={saving}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
              {saving ? "Saving..." : "Save Changes"}
            </Pill>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── LEFT: avatar + strength ── */}
            <div className="lg:col-span-4 space-y-5">

              {/* Avatar card */}
              <div className="card-stitch p-8 flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-3xl font-black text-white"
                      style={{ background: "var(--primary)", fontFamily: "var(--font-headline)" }}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Edit overlay */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow cursor-pointer"
                    style={{ background: "var(--primary)" }}
                    title="Change photo (via Google account)">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>photo_camera</span>
                  </div>
                </div>

                {/* ── FIXED: show name, not email ── */}
                <h2 className="text-xl font-bold mb-0.5"
                  style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                  {form.name || "Your Name"}
                </h2>
                {form.jobTitle && (
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--primary)" }}>
                    {form.jobTitle}
                  </p>
                )}
                <p className="text-xs flex items-center gap-1" style={{ color: "var(--on-surface-variant)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>
                  {form.location}
                </p>
                {form.email && (
                  <p className="text-xs mt-1" style={{ color: "var(--outline)" }}>
                    {form.email}
                  </p>
                )}
              </div>

              {/* Profile strength */}
              <div className="card-stitch p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 20 }}>trending_up</span>
                  <h3 className="font-bold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                    Profile Strength
                  </h3>
                </div>

                {/* Ring */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="transparent"
                        stroke="var(--surface-container-high)" strokeWidth="6" />
                      <circle cx="32" cy="32" r="28" fill="transparent"
                        stroke="var(--primary)" strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - completion / 100)}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-black" style={{ fontFamily: "var(--font-headline)", color: "var(--primary)" }}>
                        {completion}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "var(--on-surface)" }}>
                      {completion >= 90 ? "Complete! 🎉" : completion >= 70 ? "Almost there" : "Keep going"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      {completion < 100 ? "Add more details for better job matches" : "Your profile is fully optimized"}
                    </p>
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  {[
                    { label: "Full name",       done: !!form.name },
                    { label: "Job title",        done: !!form.jobTitle },
                    { label: "Bio / Summary",    done: !!form.bio },
                    { label: "Skills added",     done: skills.length > 0 },
                    { label: "Current CTC",      done: !!form.currentCTC },
                    { label: "LinkedIn URL",     done: !!form.linkedin },
                  ].map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined mat-fill shrink-0"
                        style={{ fontSize: 16, color: done ? "var(--secondary)" : "var(--outline-variant)" }}>
                        {done ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      <span className="text-xs font-medium" style={{ color: done ? "var(--on-surface)" : "var(--outline)" }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="card-stitch p-6 space-y-4">
                <h3 className="font-bold mb-2" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                  Links
                </h3>
                {[
                  { label: "LinkedIn", key: "linkedin", icon: "group",       placeholder: "linkedin.com/in/yourname" },
                  { label: "GitHub",   key: "github",   icon: "code",         placeholder: "github.com/yourname"     },
                  { label: "Portfolio",key: "portfolio",icon: "language",     placeholder: "yourportfolio.com"       },
                ].map(({ label, key, icon, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--on-surface-variant)" }}>{label}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ fontSize: 16, color: "var(--outline)" }}>{icon}</span>
                      <input className="w-full text-sm outline-none border pl-9 transition-all"
                        style={{
                          background: "var(--surface-container-low)", borderColor: "var(--outline-variant)",
                          borderRadius: "0.875rem", padding: "0.75rem 1rem 0.75rem 2.25rem",
                          color: "var(--on-surface)", fontFamily: "var(--font-body)",
                        }}
                        placeholder={placeholder}
                        value={(form as any)[key]}
                        onChange={e => u(key, e.target.value)}
                        onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(0,79,52,0.10)"; }}
                        onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: form sections ── */}
            <div className="lg:col-span-8 space-y-6">

              {/* Basic Information */}
              <div className="card-stitch p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(0,79,52,0.10)" }}>
                    <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 20 }}>person</span>
                  </div>
                  <h2 className="font-bold text-lg" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                    Basic Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Full Name" value={form.name}
                    onChange={v => u("name", v)} placeholder="Chaitanya Sai" />
                  <Field label="Email" value={form.email} disabled
                    hint="Managed by your sign-in provider" />
                  <Field label="Current Job Title" value={form.jobTitle}
                    onChange={v => u("jobTitle", v)} placeholder="Senior React Developer" />
                  <Field label="Location (City)" value={form.location}
                    onChange={v => u("location", v)} placeholder="Hyderabad" />

                  {/* Experience */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--on-surface-variant)" }}>Experience Level</label>
                    <select className="w-full text-sm outline-none border transition-all"
                      style={{
                        background: "var(--surface-container-low)", borderColor: "var(--outline-variant)",
                        borderRadius: "0.875rem", padding: "0.875rem 1.125rem",
                        color: "var(--on-surface)", fontFamily: "var(--font-body)", cursor: "pointer",
                      }}
                      value={form.experience} onChange={e => u("experience", e.target.value)}
                      onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; }}
                      onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; }}>
                      {EXPERIENCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* Notice period */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--on-surface-variant)" }}>Notice Period</label>
                    <select className="w-full text-sm outline-none border transition-all"
                      style={{
                        background: "var(--surface-container-low)", borderColor: "var(--outline-variant)",
                        borderRadius: "0.875rem", padding: "0.875rem 1.125rem",
                        color: "var(--on-surface)", fontFamily: "var(--font-body)", cursor: "pointer",
                      }}
                      value={form.noticePeriod} onChange={e => u("noticePeriod", e.target.value)}
                      onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; }}
                      onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; }}>
                      {NOTICE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-5 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--on-surface-variant)" }}>Bio / Summary</label>
                  <textarea rows={4}
                    className="w-full text-sm outline-none border transition-all resize-none"
                    style={{
                      background: "var(--surface-container-low)", borderColor: "var(--outline-variant)",
                      borderRadius: "0.875rem", padding: "0.875rem 1.125rem",
                      color: "var(--on-surface)", fontFamily: "var(--font-body)",
                    }}
                    placeholder="Passionate software engineer with experience building scalable web applications for Indian startups and MNCs."
                    value={form.bio} onChange={e => u("bio", e.target.value)}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(0,79,52,0.10)"; }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="card-stitch p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(0,79,52,0.10)" }}>
                    <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 20 }}>bolt</span>
                  </div>
                  <h2 className="font-bold text-lg" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                    Skills
                  </h2>
                </div>

                {/* Current skills */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {skills.map(s => (
                      <span key={s} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-bold"
                        style={{ background: "var(--secondary-container)", color: "var(--on-secondary-container)" }}>
                        {s}
                        <button onClick={() => removeSkill(s)}
                          className="w-4 h-4 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: "rgba(0,0,0,0.10)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.20)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.10)"}>
                          <span className="material-symbols-outlined" style={{ fontSize: 11 }}>close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add skill input */}
                <div className="flex gap-2 mb-5">
                  <input className="flex-1 text-sm outline-none border transition-all"
                    style={{
                      background: "var(--surface-container-low)", borderColor: "var(--outline-variant)",
                      borderRadius: "0.875rem", padding: "0.75rem 1rem",
                      color: "var(--on-surface)", fontFamily: "var(--font-body)",
                    }}
                    placeholder="Type a skill and press Enter..."
                    value={newSkill} onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill(newSkill))}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)"; }}
                  />
                  <Pill variant="outline" onClick={() => addSkill(newSkill)} disabled={!newSkill.trim()}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                  </Pill>
                </div>

                {/* Quick-add common skills */}
                <p className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: "var(--on-surface-variant)" }}>Quick add</p>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_COMMON.filter(s => !skills.includes(s)).slice(0, 12).map(s => (
                    <button key={s} onClick={() => addSkill(s)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                      style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
                        (e.currentTarget as HTMLElement).style.color = "var(--primary)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(0,79,52,0.05)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--outline-variant)";
                        (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)";
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}>
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary */}
              <div className="card-stitch p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(0,79,52,0.10)" }}>
                    <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 20 }}>payments</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                      Salary Details (₹ LPA)
                    </h2>
                    <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      Helps match you with the right compensation bands
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Current CTC" value={form.currentCTC}
                    onChange={v => u("currentCTC", v)} placeholder="e.g. 12 LPA" />
                  <Field label="Expected CTC" value={form.expectedCTC}
                    onChange={v => u("expectedCTC", v)} placeholder="e.g. 18 LPA" />
                </div>
              </div>

              {/* Save button at bottom */}
              <div className="flex justify-end pb-4">
                <Pill onClick={save} loading={saving} size="lg">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>save</span>
                  {saving ? "Saving..." : "Save Profile"}
                </Pill>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
