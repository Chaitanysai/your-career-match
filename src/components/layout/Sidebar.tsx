import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CareerLaunchLogo from "@/components/CareerLaunchLogo";

const NAV_MAIN = [
  { label: "Dashboard",      href: "/dashboard",  icon: "grid_view" },
  { label: "Job Board",      href: "/jobs",        icon: "work" },
  { label: "Resume Matcher", href: "/match",       icon: "description" },
  { label: "Skill Gap",      href: "/skillgap",    icon: "query_stats" },
  { label: "AI Advisor",     href: "/advisor",     icon: "psychology" },
];
const NAV_TOOLS = [
  { label: "Interview Prep",  href: "/interview",      icon: "assignment" },
  { label: "Resume Builder",  href: "/resume-builder", icon: "edit_document" },
  { label: "Cover Letter",    href: "/cover-letter",   icon: "mail" },
  { label: "Salary Coach",    href: "/salary-coach",   icon: "payments" },
];
const NAV_RESEARCH = [
  { label: "Company Research", href: "/company-research", icon: "corporate_fare" },
  { label: "Career Roadmap",   href: "/career-roadmap",   icon: "map" },
  { label: "LinkedIn",         href: "/linkedin",          icon: "group" },
  { label: "Job Tracker",      href: "/tracker",           icon: "view_kanban" },
];

const NavItem = ({ href, icon, label, active }: {
  href: string; icon: string; label: string; active: boolean;
}) => (
  <Link
    to={href}
    className={`flex items-center gap-3 px-4 py-2.5 text-sm tracking-tight transition-all duration-150 ${
      active ? "sidebar-nav-active" : "sidebar-nav-item"
    }`}
    style={{ fontFamily: "var(--font-headline)", fontWeight: active ? 700 : 600 }}
  >
    <span className="material-symbols-outlined" style={{
      fontSize: 19,
      fontVariationSettings: active
        ? "'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24"
        : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
      color: active ? "var(--primary)" : undefined,
    }}>
      {icon}
    </span>
    <span>{label}</span>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isActive = (href: string) => location.pathname === href;

  return (
    <aside
      className="fixed left-0 top-0 h-full z-50 flex flex-col py-6 px-3 w-64 overflow-y-auto no-scrollbar"
      style={{
        background: "rgba(248,250,248,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "1px 0 0 rgba(255,255,255,0.8)",
      }}
    >
      {/* ── Brand — full logo with icon + wordmark ── */}
      <div className="px-2 mb-8">
        <Link to="/dashboard">
          <CareerLaunchLogo variant="full" size={38} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        {NAV_MAIN.map(({ label, href, icon }) => (
          <NavItem key={href} href={href} icon={icon} label={label} active={isActive(href)} />
        ))}

        <div className="pt-4 pb-1">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--outline)" }}>Tools</p>
          {NAV_TOOLS.map(({ label, href, icon }) => (
            <NavItem key={href} href={href} icon={icon} label={label} active={isActive(href)} />
          ))}
        </div>

        <div className="pt-3 pb-1">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest mb-1.5"
            style={{ color: "var(--outline)" }}>Research</p>
          {NAV_RESEARCH.map(({ label, href, icon }) => (
            <NavItem key={href} href={href} icon={icon} label={label} active={isActive(href)} />
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="mt-4 px-3 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        {/* Upgrade card — gradient follows theme */}
        <div className="p-4 rounded-2xl mb-3 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)`,
            boxShadow: `0 4px 16px var(--primary)35`,
          }}>
          <div className="absolute -right-3 -bottom-3 w-14 h-14 rounded-full opacity-15"
            style={{ background: "white" }} />
          <p className="text-xs font-bold mb-1 text-white relative z-10">Upgrade to Pro</p>
          <p className="text-[10px] mb-3 relative z-10" style={{ color: "rgba(255,255,255,0.72)" }}>
            Unlimited AI mock interviews & insights.
          </p>
          <button
            className="w-full py-2 rounded-xl text-xs font-bold transition-all relative z-10"
            style={{ background: "rgba(255,255,255,0.95)", color: "var(--primary)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "white"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.95)"}
          >
            Upgrade Now ✦
          </button>
        </div>

        {/* User row */}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
          style={{ background: "rgba(0,0,0,0.03)" }}>
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-white font-black"
              style={{ background: "var(--primary)", fontFamily: "var(--font-headline)", fontSize: 11 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate"
              style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
              {user?.name}
            </p>
            <p className="text-[10px] truncate" style={{ color: "var(--outline)" }}>
              {user?.email}
            </p>
          </div>
          <button onClick={signOut} title="Sign out"
            className="p-1.5 rounded-lg shrink-0 sidebar-nav-item transition-colors"
            style={{ color: "var(--outline)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--error)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--outline)"}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
