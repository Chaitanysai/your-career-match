import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCity } from "@/hooks/useCity";
import CitySwitcher from "@/components/layout/CitySwitcher";
import AuthModal from "@/components/AuthModal";
import CareerLaunchLogo from "@/components/CareerLaunchLogo";

const FEATURES = [
  { icon: "description",  title: "AI Resume",    desc: "Generate ATS-proof resumes that highlight your specific impact in the Indian tech ecosystem.", bg: "rgba(0,79,52,0.08)",  color: "var(--primary)"   },
  { icon: "monitoring",   title: "Skill Gap",    desc: "Real-time analysis of market demand vs your profile. Know exactly what to learn next.",        bg: "rgba(0,108,74,0.12)", color: "var(--secondary)" },
  { icon: "psychology",   title: "Advisor",      desc: "A virtual mentor for negotiation and career transitions with data-backed insights.",             bg: "rgba(0,79,52,0.08)",  color: "var(--primary)"   },
  { icon: "work",         title: "Job Board",    desc: "Curated high-LPA roles from top unicorns and product firms across India.",                       bg: "rgba(0,108,74,0.12)", color: "var(--secondary)" },
];

const TESTIMONIALS = [
  { name: "Arjun Reddy",  role: "Senior SDE @ Unicorn",   text: "CareerLaunch helped me pivot from a service firm to a top product startup in Gachibowli with a 60% hike. The skill gap analysis was a game changer.", init: "A" },
  { name: "Priya Sharma", role: "Product Lead @ Fintech",  text: "The platform makes job hunting feel like a curated experience for your career. Found my dream role in Bengaluru within 3 weeks.",                    init: "P" },
  { name: "Karthik V.",   role: "Backend Architect",       text: "Finding roles in Hyderabad that match global standards was hard until I tried CareerLaunch. Highly recommend for serious tech professionals.",          init: "K" },
];

const Landing = () => {
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const { city }       = useCity();
  const [authOpen, setAuthOpen]   = useState(false);
  const [authTab,  setAuthTab]    = useState<"login" | "signup">("login");
  const [counter,  setCounter]    = useState({ jobs: 0, cities: 0, accuracy: 0 });

  useEffect(() => {
    if (user) { navigate("/dashboard"); return; }
    const targets = { jobs: 50, cities: 18, accuracy: 95 };
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const p = Math.min(step / 60, 1);
      setCounter({
        jobs:     Math.round(targets.jobs * p),
        cities:   Math.round(targets.cities * p),
        accuracy: Math.round(targets.accuracy * p),
      });
      if (step >= 60) clearInterval(timer);
    }, 2000 / 60);
    return () => clearInterval(timer);
  }, [user]);

  const openAuth = (tab: "login" | "signup") => { setAuthTab(tab); setAuthOpen(true); };

  return (
    <div style={{ background: "var(--surface)", minHeight: "100vh" }}>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 h-20"
        style={{ background: "rgba(247,249,251,0.85)", backdropFilter: "blur(32px)", boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-8">
          <CareerLaunchLogo variant="full" size={36} />
          <div className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full cursor-pointer transition-colors"
            style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>location_on</span>
            <CitySwitcher variant="navbar" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-5 py-2.5 font-semibold text-sm rounded-xl transition-colors"
            style={{ color: "var(--primary)", fontFamily: "var(--font-headline)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,79,52,0.06)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            onClick={() => openAuth("login")}>
            Sign in
          </button>
          <button
            className="px-6 py-2.5 font-bold text-sm rounded-xl flex items-center gap-2 transition-all"
            style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-headline)", boxShadow: "0 4px 16px var(--primary)35" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.90"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            onClick={() => openAuth("signup")}>
            Get started
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>arrow_forward</span>
          </button>
        </div>
      </nav>

      <main className="pt-20">
        {/* ── Hero ── */}
        <section className="relative min-h-[860px] flex flex-col items-center justify-center text-center px-6 overflow-hidden"
          style={{ backgroundImage: "radial-gradient(var(--outline-variant) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
          <div className="max-w-4xl mx-auto z-10 py-20">
            {/* Big logo icon centered */}
            <div className="flex justify-center mb-8 fade-up">
              <CareerLaunchLogo variant="icon" size={72} />
            </div>

            <h1 className="font-bold tracking-tight mb-6 leading-[1.1] fade-up fade-up-1"
              style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)", fontSize: "clamp(2.8rem, 7vw, 5rem)" }}>
              Find your perfect role in{" "}
              <span style={{ color: "var(--primary)" }}>{city.name}</span>
            </h1>

            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 fade-up fade-up-2"
              style={{ color: "var(--on-surface-variant)" }}>
              AI-driven career matching tailored for India's premium tech landscape.
              Architect your future with CareerLaunch.
            </p>

            {/* Stats counters */}
            <div className="flex flex-wrap justify-center gap-4 mb-12 fade-up fade-up-3">
              {[
                { value: `${counter.jobs}K+`, label: "Jobs" },
                { value: `${counter.cities}`,  label: "Cities" },
                { value: `${counter.accuracy}%`, label: "AI Accuracy" },
              ].map(({ value, label }) => (
                <div key={label} className="px-6 py-3 rounded-full flex items-center gap-3 shadow-sm"
                  style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--surface-container-high)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--secondary)" }} />
                  <span className="font-bold text-sm" style={{ color: "var(--on-surface)" }}>
                    {value} <span className="font-medium" style={{ color: "var(--on-surface-variant)" }}>{label}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 fade-up fade-up-4">
              <button
                className="px-10 py-4 font-bold rounded-xl text-base flex items-center gap-2 transition-all"
                style={{ background: "var(--primary)", color: "white", fontFamily: "var(--font-headline)", boxShadow: "0 8px 24px var(--primary)40" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}
                onClick={() => openAuth("signup")}>
                Get started free
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              </button>
              <button
                className="px-8 py-4 font-bold rounded-xl text-base transition-all border"
                style={{ color: "var(--primary)", borderColor: "rgba(0,79,52,0.25)", fontFamily: "var(--font-headline)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,79,52,0.06)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                onClick={() => openAuth("login")}>
                Sign in
              </button>
            </div>
          </div>

          {/* Browser mockup */}
          <div className="relative w-full max-w-5xl mx-auto px-4 translate-y-4 animate-float fade-up-5">
            <div className="p-1.5 rounded-t-3xl shadow-2xl" style={{ background: "var(--surface-container-high)" }}>
              <div className="bg-white rounded-t-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <div className="h-10 flex items-center px-4 gap-2" style={{ background: "var(--surface-container)" }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="mx-auto w-1/3 h-5 rounded-md" style={{ background: "var(--surface-container-lowest)" }} />
                </div>
                <div className="flex-1 p-6 grid grid-cols-12 gap-4" style={{ background: "var(--surface-container-low)", height: "calc(100% - 2.5rem)" }}>
                  <div className="col-span-3 space-y-3">
                    <div className="h-9 w-9 rounded-xl" style={{ background: "var(--primary-container)" }} />
                    <div className="h-3 w-full rounded" style={{ background: "var(--surface-container-high)" }} />
                    <div className="h-3 w-2/3 rounded" style={{ background: "var(--surface-container-high)" }} />
                    <div className="pt-3 space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-7 rounded-lg" style={{ background: "white" }} />
                      ))}
                    </div>
                  </div>
                  <div className="col-span-9 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-28 rounded-2xl shadow-sm" style={{ background: "white" }} />
                      <div className="h-28 rounded-2xl shadow-sm" style={{ background: "white" }} />
                    </div>
                    <div className="h-48 rounded-2xl shadow-sm" style={{ background: "white" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-24 px-8" style={{ background: "var(--surface-container)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-14">
              <h2 className="font-semibold text-4xl mb-3"
                style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                Precision Engineering for Careers
              </h2>
              <p style={{ color: "var(--on-surface-variant)", maxWidth: 480 }}>
                Move beyond basic keywords. Our AI analyzes your potential, not just your past.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map(({ icon, title, desc, bg, color }) => (
                <div key={title} className="card-stitch p-8 group cursor-default hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: bg }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color }}>{icon}</span>
                  </div>
                  <h3 className="font-bold text-xl mb-3" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-24 px-8" style={{ background: "var(--surface)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{ background: "var(--secondary-container)", color: "var(--on-secondary-container)" }}>
                Success Stories
              </span>
              <h2 className="font-semibold text-4xl mt-5"
                style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
                Built for the Indian Talent
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ name, role, text, init }) => (
                <div key={name} className="p-8 rounded-3xl flex flex-col justify-between"
                  style={{ background: "var(--surface-container-low)" }}>
                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined mat-fill" style={{ fontSize: 16, color: "#f59e0b" }}>star</span>
                    ))}
                  </div>
                  <p className="italic text-base leading-relaxed mb-6 flex-1" style={{ color: "var(--on-surface)" }}>"{text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-black shrink-0"
                      style={{ background: "var(--primary)", fontFamily: "var(--font-headline)" }}>
                      {init}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "var(--on-surface)" }}>{name}</p>
                      <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 px-8">
          <div className="max-w-4xl mx-auto p-16 text-center rounded-[2.5rem] relative overflow-hidden"
            style={{ background: "var(--primary-container)" }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-24 -mt-24"
              style={{ background: "rgba(0,108,74,0.20)" }} />
            <h2 className="font-bold text-4xl md:text-5xl mb-8 relative z-10"
              style={{ fontFamily: "var(--font-headline)", color: "var(--on-primary-container)" }}>
              Ready to match with your future?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <button
                className="w-full sm:w-auto px-10 py-4 font-bold rounded-2xl text-base transition-all"
                style={{ background: "var(--on-primary)", color: "var(--primary)", fontFamily: "var(--font-headline)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}
                onClick={() => openAuth("signup")}>
                Create your profile — free
              </button>
              <button
                className="w-full sm:w-auto px-10 py-4 font-bold rounded-2xl text-base border-2 transition-all"
                style={{ borderColor: "var(--on-primary-container)", color: "var(--on-primary-container)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                onClick={() => openAuth("login")}>
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-16 px-8" style={{ background: "var(--surface-container)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <CareerLaunchLogo variant="full" size={32} />
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            © {new Date().getFullYear()} CareerLaunch India · Made in Hyderabad ❤️
          </p>
          <div className="flex gap-6 text-sm font-medium" style={{ color: "var(--on-surface-variant)" }}>
            {["Privacy","Terms","Help"].map(l => (
              <a key={l} href="#" className="transition-colors"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--primary)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--on-surface-variant)"}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
