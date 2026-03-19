import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCity } from "@/hooks/useCity";

const QUICK_ACTIONS = [
  {
    icon: "psychology", iconBg: "#dcfce7", iconColor: "#006947",
    title: "Analyze Resume",
    desc: "Deep dive into your professional history to extract 50+ unique skill identifiers and gaps.",
    cta: "Start Analysis", ctaColor: "#006947", href: "/match",
  },
  {
    icon: "travel_explore", iconBg: "#dbeafe", iconColor: "#2563eb",
    title: "Browse Jobs",
    desc: "Explore 50,000+ curated listings from Naukri, LinkedIn & Indeed that match your career trajectory.",
    cta: "Explore Openings", ctaColor: "#2563eb", href: "/jobs",
  },
  {
    icon: "record_voice_over", iconBg: "#fef3c7", iconColor: "#d97706",
    title: "Interview Prep",
    desc: "AI-driven simulation of real-world interview scenarios tailored for Indian tech companies.",
    cta: "Start Practice", ctaColor: "#d97706", href: "/interview",
  },
];

const SKILL_DATA = [
  { label: "React / Frontend",    pct: 94, color: "primary" },
  { label: "System Design",       pct: 82, color: "primary" },
  { label: "Cloud / DevOps",      pct: 65, color: "amber"   },
];

const RECENT_JOBS = [
  { company: "Swiggy",   title: "Staff Software Engineer",  meta: "Bengaluru • Hybrid • ₹28L – ₹42L",  match: 98, saved: false },
  { company: "Razorpay", title: "Senior Frontend Engineer", meta: "Remote • Full-time • ₹24L – ₹36L",  match: 92, saved: true  },
  { company: "PhonePe",  title: "Full Stack Developer",     meta: "Bengaluru • On-site • ₹20L – ₹32L", match: 89, saved: false },
];

const LOGO_COLORS: Record<string, string> = {
  Swiggy: "#fc8019", Razorpay: "#2d6be4", PhonePe: "#5f259f",
};

const Dashboard = () => {
  const { user } = useAuth();
  const { city } = useCity();
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

      {/* ── Hero card — dark green, matches screenshot ── */}
      <div className="hero-card p-8 fade-up" style={{ minHeight: 220 }}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex-1">
            {/* Label chip */}
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: "rgba(78,222,163,0.8)", fontFamily: "var(--font-label)" }}>
                AI Intelligence
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 leading-tight"
              style={{ fontFamily: "var(--font-headline)" }}>
              {greeting}, {firstName}.<br />
              <span style={{ color: "#4edea3" }}>Architect your career</span> with RoleMatch AI.
            </h1>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 440 }}>
              Let our AI matching engine analyze your unique skill DNA to find high-impact roles in <strong style={{ color: "rgba(255,255,255,0.8)" }}>{city.name}</strong> that others miss.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => navigate("/match")} className="btn-ghost-stitch"
                style={{ color: "#4edea3", fontWeight: 700, fontSize: 14 }}>
                Analyze My Resume
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#4edea3" }}>auto_awesome</span>
              </button>
              <button onClick={() => navigate("/career-roadmap")} className="btn-primary-stitch"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                View Career Path
              </button>
            </div>
          </div>

          {/* Resume scanned card — floated right, matches screenshot */}
          <div className="rounded-2xl p-5 text-center shrink-0 w-40"
            style={{
              background: "rgba(255,255,255,0.09)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(78,222,163,0.15)" }}>
              <span className="material-symbols-outlined" style={{ color: "#4edea3", fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
                description
              </span>
            </div>
            <p className="text-xs font-bold text-white mb-1" style={{ fontFamily: "var(--font-headline)" }}>
              Resume Scanned
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>Match Accuracy:</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: "#4edea3", fontFamily: "var(--font-headline)" }}>98.4%</p>
          </div>
        </div>
      </div>

      {/* ── Quick action cards — 3 columns, no lines ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 fade-up fade-up-1">
        {QUICK_ACTIONS.map(({ icon, iconBg, iconColor, title, desc, cta, ctaColor, href }) => (
          <div key={title}
            className="card-stitch p-7 group cursor-pointer"
            onClick={() => navigate(href)}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: iconBg }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 24, color: iconColor,
                fontVariationSettings: "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24"
              }}>
                {icon}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
              {title}
            </h3>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--on-surface-variant)" }}>
              {desc}
            </p>
            <div className="flex items-center gap-1 text-sm font-bold" style={{ color: ctaColor }}>
              {cta}
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform"
                style={{ fontSize: 18, color: ctaColor }}>
                arrow_forward
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ── Bottom: Skill Breakdown + Recent Recommendations ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 fade-up fade-up-2">

        {/* Skill Breakdown — surface-container bg */}
        <div className="card-stitch-container p-7">
          <div className="flex items-start justify-between mb-7">
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                Skill Breakdown
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                Your expertise vs. {city.name} Market Demand
              </p>
            </div>
            <span className="chip text-xs">Updated just now</span>
          </div>

          <div className="space-y-5">
            {SKILL_DATA.map(({ label, pct, color }) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span style={{ color: "var(--on-surface)" }}>{label}</span>
                  <span style={{ color: color === "primary" ? "var(--primary)" : "#d97706" }}>{pct}%</span>
                </div>
                <div className="progress-track">
                  <div className={color === "primary" ? "progress-fill" : "progress-amber"}
                    style={{ width: `${pct}%`, transition: "width 0.8s ease" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Growth tip */}
          <div className="mt-8 p-4 rounded-2xl flex items-start gap-3"
            style={{
              background: "rgba(0,105,71,0.07)",
              border: "1px solid rgba(0,105,71,0.10)",
            }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--primary-container)" }}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                lightbulb
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--on-surface)", fontWeight: 500 }}>
              Growth Tip: Adding <strong>System Design</strong> skills could increase your match rate by 14% for Senior roles in {city.name}.
            </p>
          </div>
        </div>

        {/* Recent Recommendations — no outer card, just spacing */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold px-1" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
            Recent Recommendations
          </h2>
          <div className="space-y-3">
            {RECENT_JOBS.map(({ company, title, meta, match, saved }) => (
              <div key={title}
                className="card-stitch p-5 flex items-center justify-between cursor-pointer"
                onClick={() => navigate("/jobs")}>
                <div className="flex items-center gap-4">
                  {/* Company logo circle */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${LOGO_COLORS[company]}18` }}>
                    <span className="text-base font-black" style={{ color: LOGO_COLORS[company], fontFamily: "var(--font-headline)" }}>
                      {company[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "var(--on-surface)", fontFamily: "var(--font-headline)" }}>
                      {title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                      {company} • {meta}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="match-badge">{match}% Match</span>
                  <span className="material-symbols-outlined"
                    style={{
                      fontSize: 20,
                      color: saved ? "var(--primary)" : "rgba(61,74,66,0.3)",
                      fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0",
                    }}>
                    bookmark
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate("/jobs")}
            className="btn-ghost-stitch w-full justify-center py-3 rounded-2xl"
            style={{
              background: "var(--surface-container-lowest)",
              color: "var(--primary)",
              border: "none",
            }}>
            View all job recommendations
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        </div>
      </section>

      {/* FAB */}
      <button
        onClick={() => window.location.href = "/advisor"}
        className="fab fixed bottom-8 right-8 z-50">
        <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>
          chat_bubble
        </span>
      </button>
    </div>
  );
};

export default Dashboard;
