import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, BookmarkCheck,
  User, MessageSquare, TrendingUp, Sparkles,
  ChevronRight, Upload, LogOut, Mic, FileText,
  Building2, Map, Linkedin, Kanban, FileEdit,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CitySwitcher from "./CitySwitcher";

const NAV = [
  {
    section: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Job Board", href: "/jobs", icon: Briefcase },
      { label: "Resume Matcher", href: "/match", icon: Upload },
      { label: "Skill Gap", href: "/skillgap", icon: TrendingUp },
      { label: "AI Advisor", href: "/advisor", icon: MessageSquare },
    ],
  },
  {
    section: "Tools",
    items: [
      { label: "Interview Prep", href: "/interview", icon: Mic },
      { label: "Resume Builder", href: "/resume-builder", icon: FileText },
      { label: "Cover Letter", href: "/cover-letter", icon: FileEdit },
      { label: "Salary Coach", href: "/salary-coach", icon: DollarSign },
    ],
  },
  {
    section: "Research",
    items: [
      { label: "Company Research", href: "/company-research", icon: Building2 },
      { label: "Career Roadmap", href: "/career-roadmap", icon: Map },
      { label: "LinkedIn Optimizer", href: "/linkedin", icon: Linkedin },
      { label: "Job Tracker", href: "/tracker", icon: Kanban },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "My Profile", href: "/profile", icon: User },
      { label: "Saved Jobs", href: "/saved", icon: BookmarkCheck },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isActive = (href: string) => location.pathname === href;

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 w-60 flex flex-col"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b shrink-0"
        style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--accent-500)" }}>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="font-heading font-bold text-lg text-white">
          Role<span style={{ color: "var(--accent-500)" }}>Match</span>
        </span>
      </div>

      {/* City switcher */}
      <div className="px-3 py-3 border-b shrink-0" style={{ borderColor: "var(--sidebar-border)" }}>
        <p className="text-xs px-1 mb-1.5" style={{ color: "var(--sidebar-text)", opacity: 0.5 }}>
          Current city
        </p>
        <CitySwitcher variant="sidebar" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p className="text-xs font-semibold px-3 mb-1.5 uppercase tracking-wider"
              style={{ color: "var(--sidebar-text)", opacity: 0.4 }}>
              {section}
            </p>
            <div className="space-y-0.5">
              {items.map(({ label, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} to={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    )}
                    style={{
                      background: active ? "var(--sidebar-active)" : "transparent",
                      color: active ? "white" : "var(--sidebar-text)",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-3 shrink-0" style={{ borderColor: "var(--sidebar-border)" }}>
        {user && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1"
            style={{ background: "var(--sidebar-hover)" }}>
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xs font-bold"
                style={{ background: "var(--navy-600)", color: "white" }}>
                {user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--sidebar-text)", opacity: 0.6 }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "var(--sidebar-text)" }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
