import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/* ── Nav groups exactly matching the screenshot ── */
const NAV_MAIN = [
  { label: "Dashboard",      href: "/dashboard",       icon: "dashboard" },
  { label: "Job Board",      href: "/jobs",            icon: "work" },
  { label: "Resume Matcher", href: "/match",           icon: "description" },
  { label: "Skill Gap",      href: "/skillgap",        icon: "analytics" },
  { label: "AI Advisor",     href: "/advisor",         icon: "psychology" },
];
const NAV_TOOLS = [
  { label: "Interview Prep",  href: "/interview",      icon: "record_voice_over" },
  { label: "Resume Builder",  href: "/resume-builder", icon: "edit_document" },
  { label: "Cover Letter",    href: "/cover-letter",   icon: "mail" },
  { label: "Salary Coach",    href: "/salary-coach",   icon: "payments" },
];
const NAV_RESEARCH = [
  { label: "Company Research", href: "/company-research", icon: "corporate_fare" },
  { label: "Career Roadmap",   href: "/career-roadmap",  icon: "map" },
  { label: "LinkedIn",         href: "/linkedin",         icon: "group" },
  { label: "Job Tracker",      href: "/tracker",          icon: "view_kanban" },
];

const NavItem = ({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) => (
  <Link
    to={href}
    className={`flex items-center gap-3 px-4 py-2.5 text-sm tracking-tight transition-all duration-150 ${
      active ? "sidebar-nav-active" : "sidebar-nav-item"
    }`}
    style={{ fontFamily: "var(--font-headline)", fontWeight: active ? 600 : 500 }}
  >
    <span className="material-symbols-outlined" style={{
      fontSize: 19,
      fontVariationSettings: active ? "'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24" : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24"
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
      className="fixed left-0 top-0 h-full z-40 flex flex-col py-6 px-3 overflow-y-auto no-scrollbar w-64"
      style={{
        background: "rgba(242,244,246,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "none", /* No-Line rule */
      }}
    >
      {/* Brand */}
      <div className="px-3 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--primary)" }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>
              psychology
            </span>
          </div>
          <div>
            <p className="text-base font-bold tracking-tight" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
              RoleMatch
            </p>
            <p className="text-[10px]" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>AI Career Suite</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1">
        {NAV_MAIN.map(({ label, href, icon }) => (
          <NavItem key={href} href={href} icon={icon} label={label} active={isActive(href)} />
        ))}

        {/* Tools section */}
        <div className="pt-5 pb-1">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: "var(--outline)" }}>
            Tools
          </p>
          {NAV_TOOLS.map(({ label, href, icon }) => (
            <NavItem key={href} href={href} icon={icon} label={label} active={isActive(href)} />
          ))}
        </div>

        {/* Research section */}
        <div className="pt-4 pb-1">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: "var(--outline)" }}>
            Research
          </p>
          {NAV_RESEARCH.map(({ label, href, icon }) => (
            <NavItem key={href} href={href} icon={icon} label={label} active={isActive(href)} />
          ))}
        </div>
      </nav>

      {/* Bottom section — matches screenshot exactly */}
      <div className="pt-5 mt-2 space-y-1" style={{ borderTop: "1px solid rgba(0,105,71,0.10)" }}>
        {/* Upgrade to Pro button */}
        <div className="px-2 mb-4">
          <button className="btn-primary-stitch w-full justify-center py-2.5">
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
            Upgrade to Pro
          </button>
        </div>

        <NavItem href="/profile" icon="person" label="My Profile" active={isActive("/profile")} />
        <NavItem href="/saved" icon="bookmark" label="Saved Jobs" active={isActive("/saved")} />

        {/* User row */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mt-2 rounded-lg"
          style={{ background: "rgba(0,105,71,0.06)" }}>
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-xs font-bold text-white"
              style={{ background: "var(--primary)", fontSize: 10 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
              {user?.name}
            </p>
          </div>
          <button onClick={signOut} title="Sign out"
            className="sidebar-nav-item p-1 rounded-lg"
            style={{ color: "var(--outline)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
