import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, BookmarkCheck, User,
  MessageSquare, TrendingUp, Sparkles, Upload, LogOut,
  Mic, FileText, Building2, Map, Linkedin, Kanban,
  FileEdit, DollarSign, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_GROUPS = [
  {
    items: [
      { label: "Dashboard",      href: "/dashboard",       icon: LayoutDashboard },
      { label: "Job Board",      href: "/jobs",            icon: Briefcase },
      { label: "Resume Matcher", href: "/match",           icon: Upload },
      { label: "Skill Gap",      href: "/skillgap",        icon: TrendingUp },
      { label: "AI Advisor",     href: "/advisor",         icon: MessageSquare },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Interview Prep",  href: "/interview",      icon: Mic },
      { label: "Resume Builder",  href: "/resume-builder", icon: FileText },
      { label: "Cover Letter",    href: "/cover-letter",   icon: FileEdit },
      { label: "Salary Coach",    href: "/salary-coach",   icon: DollarSign },
    ],
  },
  {
    label: "Research",
    items: [
      { label: "Company Research", href: "/company-research", icon: Building2 },
      { label: "Career Roadmap",   href: "/career-roadmap",  icon: Map },
      { label: "LinkedIn",         href: "/linkedin",         icon: Linkedin },
      { label: "Job Tracker",      href: "/tracker",          icon: Kanban },
    ],
  },
  {
    items: [
      { label: "Saved Jobs", href: "/saved",   icon: BookmarkCheck },
      { label: "My Profile", href: "/profile", icon: User },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Backdrop when expanded on mobile */}
      {expanded && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setExpanded(false)} />
      )}

      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="fixed left-0 top-0 h-full z-40 flex flex-col py-3 transition-all duration-200 ease-out overflow-hidden"
        style={{
          width: expanded ? "220px" : "60px",
          background: "#0a0a0a",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          boxShadow: expanded ? "4px 0 24px rgba(0,0,0,0.25)" : "none",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 mb-4 h-10 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <Sparkles style={{ width: 16, height: 16, color: "white" }} />
          </div>
          {expanded && (
            <span className="font-bold text-white text-base tracking-tight whitespace-nowrap overflow-hidden">
              Role<span style={{ color: "#22c55e" }}>Match</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 space-y-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={cn(gi > 0 && "pt-3 border-t")}
              style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              {expanded && group.label && (
                <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5 whitespace-nowrap"
                  style={{ color: "rgba(255,255,255,0.3)" }}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ label, href, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link key={href} to={href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg transition-all duration-150 group",
                        expanded ? "px-2.5 py-2" : "px-2 py-2 justify-center",
                        active
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "text-white/45 hover:text-white/90 hover:bg-white/7"
                      )}
                      style={{
                        background: active && !expanded ? "rgba(34,197,94,0.12)" : undefined,
                      }}
                    >
                      <Icon className="shrink-0" style={{ width: 17, height: 17 }} />
                      {expanded && (
                        <span className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1">
                          {label}
                        </span>
                      )}
                      {expanded && active && (
                        <ChevronRight className="shrink-0 opacity-50" style={{ width: 13, height: 13 }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: user + signout */}
        <div className="mt-2 px-2 pt-3 border-t space-y-0.5 shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className={cn(
            "flex items-center gap-3 rounded-lg py-2",
            expanded ? "px-2.5" : "px-2 justify-center"
          )}
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-xs font-bold text-white"
                style={{ background: "#22c55e" }}>
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {user?.email}
                </p>
              </div>
            )}
          </div>
          <button onClick={signOut}
            className={cn(
              "flex items-center gap-3 rounded-lg py-2 w-full transition-colors",
              expanded ? "px-2.5" : "px-2 justify-center",
              "text-white/40 hover:text-red-400 hover:bg-red-500/10"
            )}>
            <LogOut style={{ width: 15, height: 15, flexShrink: 0 }} />
            {expanded && <span className="text-sm font-medium">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Spacer so content doesn't hide under sidebar */}
      <div className="hidden md:block shrink-0 transition-all duration-200"
        style={{ width: "60px" }} />
    </>
  );
};

export default Sidebar;