import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CitySwitcher from "./CitySwitcher";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import CareerLaunchLogo from "@/components/CareerLaunchLogo";

const NOTIFICATIONS = [
  { id: 1, icon: "work",              color: "var(--primary)", title: "New job match!",        body: "Senior React Developer at Swiggy — 94% match",        time: "2m",  read: false },
  { id: 2, icon: "analytics",         color: "#3b82f6",        title: "Skill gap update",      body: "TypeScript is top demand in Hyderabad right now",      time: "1h",  read: false },
  { id: 3, icon: "psychology",        color: "#7c3aed",        title: "AI Advisor tip",        body: "Add certifications to boost your profile score",        time: "3h",  read: false },
  { id: 4, icon: "workspace_premium", color: "#d97706",        title: "Profile milestone",     body: "70+ job matches — you're on a streak!",                time: "1d",  read: true  },
  { id: 5, icon: "work",              color: "var(--primary)", title: "Job alert",             body: "Razorpay is hiring Full Stack Engineers in Bengaluru",  time: "2d",  read: true  },
];

const Topbar = ({ onMenuClick, title }: { onMenuClick?: () => void; title?: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const markAll = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const markRead = (id: number) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/jobs?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3"
      style={{
        background: "rgba(247,249,251,0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.06), 0 4px 20px rgba(25,28,30,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.8)",
      }}
    >
      {/* Mobile: logo + menu */}
      <div className="md:hidden flex items-center gap-3 mr-3">
        {onMenuClick && (
          <button onClick={onMenuClick} className="p-2 rounded-xl transition-colors"
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>menu</span>
          </button>
        )}
        <CareerLaunchLogo variant="icon" size={28} />
      </div>

      {/* Premium pill search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div
          className="flex items-center gap-3 px-4 py-2.5 transition-all duration-200"
          style={{
            background: searchFocused ? "var(--surface-container-lowest)" : "var(--surface-container-high)",
            borderRadius: 999,
            boxShadow: searchFocused
              ? `0 0 0 2px var(--primary), 0 4px 16px rgba(25,28,30,0.10)`
              : "0 1px 3px rgba(25,28,30,0.08), 0 1px 2px rgba(25,28,30,0.04)",
            border: "1px solid",
            borderColor: searchFocused ? "transparent" : "rgba(0,0,0,0.07)",
          }}
        >
          <span className="material-symbols-outlined shrink-0 transition-colors" style={{
            fontSize: 18,
            color: searchFocused ? "var(--primary)" : "var(--outline)",
          }}>search</span>
          <input
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: "var(--on-surface)", fontFamily: "var(--font-body)", caretColor: "var(--primary)" }}
            placeholder="Search roles, skills, or companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              style={{ color: "var(--outline)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          )}
        </div>
      </form>

      {/* Right */}
      <div className="flex items-center gap-1 ml-4">
        {/* City */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer"
          style={{ color: "var(--primary)", fontFamily: "var(--font-headline)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
          <CitySwitcher variant="navbar" />
        </div>

        <div className="w-px h-5 mx-1" style={{ background: "var(--outline-variant)", opacity: 0.4 }} />

        {/* Theme */}
        <ThemeSwitcher />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-full transition-colors"
            style={{ color: "var(--on-surface-variant)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"}
            onMouseLeave={e => { if (!notifOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center text-white"
                style={{ width: 16, height: 16, borderRadius: 999, background: "var(--error)", fontSize: 9, fontWeight: 800, border: "2px solid rgba(247,249,251,0.9)" }}>
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl z-50 overflow-hidden"
              style={{ background: "var(--surface-container-lowest)", boxShadow: "0 20px 48px rgba(25,28,30,0.14)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--surface-container-low)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>Notifications</span>
                  {unread > 0 && <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: "var(--error)" }}>{unread}</span>}
                </div>
                <button onClick={markAll} className="text-xs font-bold" style={{ color: "var(--primary)" }}>Mark all read</button>
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {notifs.map(n => (
                  <div key={n.id} onClick={() => markRead(n.id)}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{ background: n.read ? "transparent" : "rgba(0,0,0,0.02)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.read ? "transparent" : "rgba(0,0,0,0.02)"}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${n.color}18` }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15, color: n.color }}>{n.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold" style={{ color: n.read ? "var(--on-surface-variant)" : "var(--on-surface)", fontFamily: "var(--font-headline)" }}>{n.title}</p>
                        <span className="text-[10px] shrink-0" style={{ color: "var(--outline)" }}>{n.time}</span>
                      </div>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>{n.body}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "var(--primary)" }} />}
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 text-center" style={{ borderTop: "1px solid var(--surface-container-low)" }}>
                <button className="text-xs font-bold" style={{ color: "var(--primary)" }}>View all notifications</button>
              </div>
            </div>
          )}
        </div>

        <button className="p-2 rounded-full transition-colors"
          style={{ color: "var(--on-surface-variant)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-container)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
        </button>

        <div className="w-px h-5 mx-1" style={{ background: "var(--outline-variant)", opacity: 0.4 }} />

        {/* Avatar */}
        <button onClick={() => navigate("/profile")}
          className="relative shrink-0 transition-all"
          style={{ width: 36, height: 36, borderRadius: 999, boxShadow: "0 0 0 2px var(--primary), 0 2px 8px rgba(25,28,30,0.15)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px var(--primary), 0 4px 12px rgba(25,28,30,0.20)`}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 2px var(--primary), 0 2px 8px rgba(25,28,30,0.15)`}>
          <Avatar className="h-full w-full">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-white font-black"
              style={{ background: "var(--primary)", fontFamily: "var(--font-headline)", fontSize: 14 }}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
