import { useState, useRef, useEffect } from "react";
import { Bell, Search, Menu, X, Check, Briefcase, TrendingUp, MessageSquare, Star, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import CitySwitcher from "./CitySwitcher";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMenuClick?: () => void;
  title?: string;
}

const NOTIFICATIONS = [
  { id: 1, icon: Briefcase,    color: "#22c55e", title: "New job match!",           body: "Senior React Developer at Swiggy — 94% match",         time: "2m ago",  read: false },
  { id: 2, icon: TrendingUp,   color: "#3b82f6", title: "Skill gap update",          body: "TypeScript is now top skill in Hyderabad market",       time: "1h ago",  read: false },
  { id: 3, icon: MessageSquare,color: "#8b5cf6", title: "AI Advisor tip",            body: "Your resume score can improve by adding certifications", time: "3h ago",  read: false },
  { id: 4, icon: Star,         color: "#f59e0b", title: "Profile milestone",         body: "You've hit 70+ job matches this month!",                time: "1d ago",  read: true  },
  { id: 5, icon: Briefcase,    color: "#22c55e", title: "Job alert",                 body: "Razorpay is hiring Full Stack Developers in Bengaluru",  time: "2d ago",  read: true  },
];

const Topbar = ({ onMenuClick, title }: TopbarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  const markRead = (id: number) => setNotifications((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));

  return (
    <header className="h-14 sticky top-0 z-30 flex items-center px-5 gap-3"
      style={{
        background: "rgba(248,247,244,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
      }}>

      {/* Mobile menu */}
      {onMenuClick && (
        <button className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
          onClick={onMenuClick}>
          <Menu className="h-4 w-4 text-black/60" />
        </button>
      )}

      {/* Page title */}
      {title && (
        <h1 className="font-semibold text-sm text-black/80 hidden sm:block tracking-tight">{title}</h1>
      )}

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden lg:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/30" />
        <input
          placeholder="Search anything..."
          className="pl-9 h-8 w-52 text-sm bg-black/[0.05] border border-black/[0.08] rounded-lg outline-none focus:bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all placeholder:text-black/30"
        />
      </div>

      {/* City switcher */}
      <CitySwitcher variant="navbar" />

      {/* ── Notification bell ── */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className={cn(
            "relative w-8 h-8 rounded-lg flex items-center justify-center transition-all",
            notifOpen ? "bg-black/10" : "hover:bg-black/[0.06]"
          )}>
          <Bell className="h-4 w-4 text-black/60" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {unread}
            </span>
          )}
        </button>

        {/* Notification panel */}
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-black/[0.08] shadow-xl overflow-hidden z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-black">Notifications</span>
                {unread > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-500 text-white rounded-full px-1.5 py-0.5">{unread} new</span>
                )}
              </div>
              <button onClick={markAllRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                <Check className="h-3 w-3" />Mark all read
              </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => {
                const Icon = n.icon;
                return (
                  <div key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-0",
                      n.read ? "bg-white hover:bg-black/[0.02]" : "bg-emerald-50/60 hover:bg-emerald-50",
                      "border-black/[0.04]"
                    )}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${n.color}18` }}>
                      <Icon className="h-4 w-4" style={{ color: n.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-xs font-semibold truncate", n.read ? "text-black/70" : "text-black")}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-black/30 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-xs text-black/45 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                    </div>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-black/[0.06] text-center">
              <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Avatar — opens profile */}
      <button
        onClick={() => navigate("/profile")}
        className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-black/[0.06] transition-colors group">
        <Avatar className="h-7 w-7 ring-2 ring-transparent group-hover:ring-emerald-400 transition-all">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback className="text-xs font-bold text-white bg-emerald-500">
            {user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-black/80 leading-tight">{user?.name?.split(" ")[0]}</p>
        </div>
        <ChevronDown className="h-3 w-3 text-black/30 hidden sm:block" />
      </button>
    </header>
  );
};

export default Topbar;