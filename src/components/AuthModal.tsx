import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth, googleProvider } from "@/integrations/firebase/client";
import { Loader2, Eye, EyeOff } from "lucide-react";
import CareerLaunchLogo from "@/components/CareerLaunchLogo";

/* ── Google Icon SVG ─────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ── Error message map ───────────────────────────────────────── */
const ERR: Record<string, string> = {
  "auth/user-not-found":       "No account found with this email.",
  "auth/wrong-password":       "Incorrect password. Try again.",
  "auth/invalid-credential":   "Invalid email or password.",
  "auth/email-already-in-use": "This email is already registered.",
  "auth/weak-password":        "Password must be at least 6 characters.",
  "auth/too-many-requests":    "Too many attempts. Please wait a moment.",
  "auth/popup-closed-by-user": "",
};

/* ── Shared input style ──────────────────────────────────────── */
const Field = ({
  label, type = "text", placeholder, value, onChange, icon,
}: {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold uppercase tracking-wider"
      style={{ color: "var(--on-surface-variant)", fontFamily: "var(--font-label)" }}>
      {label}
    </label>
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className="w-full text-sm outline-none border transition-all"
        style={{
          background: "var(--surface-container-low)",
          borderColor: "var(--outline-variant)",
          borderRadius: "0.875rem",
          padding: "0.875rem 1.125rem",
          paddingRight: icon ? "3rem" : "1.125rem",
          color: "var(--on-surface)",
          fontFamily: "var(--font-body)",
        }}
        onFocus={e => {
          (e.currentTarget as HTMLInputElement).style.borderColor = "var(--primary)";
          (e.currentTarget as HTMLInputElement).style.background = "var(--surface-container-lowest)";
          (e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(0,79,52,0.10)";
        }}
        onBlur={e => {
          (e.currentTarget as HTMLInputElement).style.borderColor = "var(--outline-variant)";
          (e.currentTarget as HTMLInputElement).style.background = "var(--surface-container-low)";
          (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
        }}
      />
      {icon && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{icon}</div>
      )}
    </div>
  </div>
);

/* ── Auth Modal ──────────────────────────────────────────────── */
interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
}

const AuthModal = ({ open, onClose, defaultTab = "login" }: AuthModalProps) => {
  const navigate  = useNavigate();
  const { toast } = useToast();

  const [tab,      setTab]      = useState<"login" | "signup">(defaultTab);
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  const [login,  setLogin]  = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({ name: "", email: "", password: "", confirm: "" });

  const go = () => { onClose(); navigate("/dashboard"); };

  const handleError = (err: any) => {
    const msg = ERR[err?.code] ?? err?.message ?? "Something went wrong.";
    if (msg) toast({ title: msg, variant: "destructive" });
  };

  const handleGoogle = async () => {
    setGLoading(true);
    try { await signInWithPopup(auth, googleProvider); go(); }
    catch (e) { handleError(e); }
    finally { setGLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await signInWithEmailAndPassword(auth, login.email, login.password); go(); }
    catch (e) { handleError(e); }
    finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signup.password !== signup.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, signup.email, signup.password);
      await updateProfile(user, { displayName: signup.name });
      await sendEmailVerification(user);
      toast({ title: "Account created! Check your email to verify." });
      setTab("login");
    }
    catch (e) { handleError(e); }
    finally { setLoading(false); }
  };

  const eyeBtn = (
    <button type="button" onClick={() => setShowPw(p => !p)}
      className="transition-colors"
      style={{ color: "var(--outline)" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--primary)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--outline)"}>
      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="p-0 overflow-hidden border-0 shadow-2xl"
        style={{
          maxWidth: 440,
          borderRadius: "1.75rem",
          background: "var(--surface-container-lowest)",
        }}
      >
        {/* ── Top brand strip ── */}
        <div className="flex flex-col items-center pt-8 pb-6 px-8"
          style={{ borderBottom: "1px solid var(--surface-container-low)" }}>
          <CareerLaunchLogo variant="icon" size={52} className="mb-4" />
          <h2 className="text-xl font-bold text-center"
            style={{ fontFamily: "var(--font-headline)", color: "var(--on-surface)" }}>
            {tab === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-center mt-1"
            style={{ color: "var(--on-surface-variant)" }}>
            {tab === "login"
              ? "Sign in to continue your career journey"
              : "Start architecting your future today"}
          </p>
        </div>

        <div className="px-8 py-6 space-y-4">
          {/* ── Tab switch ── */}
          <div className="flex p-1 rounded-xl gap-1"
            style={{ background: "var(--surface-container-low)" }}>
            {(["login", "signup"] as const).map(t => (
              <button key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2.5 text-sm font-bold rounded-lg transition-all"
                style={{
                  fontFamily: "var(--font-headline)",
                  background: tab === t ? "var(--surface-container-lowest)" : "transparent",
                  color: tab === t ? "var(--primary)" : "var(--on-surface-variant)",
                  boxShadow: tab === t ? "0 1px 4px rgba(25,28,30,0.10)" : "none",
                }}>
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* ── Google button ── */}
          <button
            onClick={handleGoogle}
            disabled={gLoading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all border"
            style={{
              background: "white",
              borderColor: "var(--outline-variant)",
              color: "#3c4043",
              fontFamily: "var(--font-body)",
              boxShadow: "0 1px 3px rgba(25,28,30,0.08)",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(25,28,30,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(25,28,30,0.08)"}
          >
            {gLoading
              ? <Loader2 size={18} className="animate-spin" style={{ color: "var(--primary)" }} />
              : <GoogleIcon />}
            Continue with Google
          </button>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--outline-variant)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--outline)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--outline-variant)" }} />
          </div>

          {/* ── Sign In form ── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email" type="email" placeholder="you@example.com"
                value={login.email} onChange={v => setLogin(f => ({ ...f, email: v }))} />
              <Field label="Password" type={showPw ? "text" : "password"} placeholder="••••••••"
                value={login.password} onChange={v => setLogin(f => ({ ...f, password: v }))}
                icon={eyeBtn} />

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "var(--primary)",
                  color: "white",
                  fontFamily: "var(--font-headline)",
                  boxShadow: "0 4px 16px var(--primary)35",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.92"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" />Signing in...</>
                  : "Sign In →"}
              </button>
            </form>
          )}

          {/* ── Sign Up form ── */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-3">
              <Field label="Full Name" placeholder="Chaitanya Sai"
                value={signup.name} onChange={v => setSignup(f => ({ ...f, name: v }))} />
              <Field label="Email" type="email" placeholder="you@example.com"
                value={signup.email} onChange={v => setSignup(f => ({ ...f, email: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Password" type={showPw ? "text" : "password"} placeholder="Min 6 chars"
                  value={signup.password} onChange={v => setSignup(f => ({ ...f, password: v }))}
                  icon={eyeBtn} />
                <Field label="Confirm" type={showPw ? "text" : "password"} placeholder="Repeat"
                  value={signup.confirm} onChange={v => setSignup(f => ({ ...f, confirm: v }))} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mt-1"
                style={{
                  background: "var(--primary)",
                  color: "white",
                  fontFamily: "var(--font-headline)",
                  boxShadow: "0 4px 16px var(--primary)35",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.92"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" />Creating account...</>
                  : "Create Account →"}
              </button>

              <p className="text-xs text-center pt-1" style={{ color: "var(--on-surface-variant)" }}>
                By signing up you agree to our{" "}
                <a href="#" className="underline" style={{ color: "var(--primary)" }}>Terms</a>
                {" "}and{" "}
                <a href="#" className="underline" style={{ color: "var(--primary)" }}>Privacy Policy</a>
              </p>
            </form>
          )}
        </div>

        {/* ── Footer switch ── */}
        <div className="px-8 pb-6 text-center">
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setTab(tab === "login" ? "signup" : "login")}
              className="font-bold transition-colors"
              style={{ color: "var(--primary)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.75"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            >
              {tab === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
