/**
 * CareerLaunch Logo — SVG recreation of the uploaded design.
 * Uses currentColor + CSS vars so it reacts to every palette change.
 *
 * The logo shows:
 *   - A rising staircase / bar-chart (growth)
 *   - A minimalist figure climbing it with a briefcase
 *   - A smooth arc curve underneath
 */

interface LogoProps {
  /** Icon + wordmark */
  variant?: "full" | "icon" | "wordmark";
  size?: number;
  className?: string;
}

const CareerLaunchLogo = ({ variant = "full", size = 36, className = "" }: LogoProps) => {
  const iconId = `cl-${Math.random().toString(36).slice(2, 6)}`;

  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CareerLaunch logo icon"
    >
      <defs>
        {/* Gradient that shifts with the theme */}
        <linearGradient id={`${iconId}-grad`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="var(--hero-mid,  #004433)" />
          <stop offset="50%"  stopColor="var(--primary,   #004f34)" />
          <stop offset="100%" stopColor="var(--secondary-fixed, #6ffbbe)" stopOpacity="0.9" />
        </linearGradient>
        {/* Lighter highlight gradient */}
        <linearGradient id={`${iconId}-hi`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.30)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
        </linearGradient>
      </defs>

      {/* ── Background rounded square ── */}
      <rect x="2" y="2" width="96" height="96" rx="22" ry="22"
        fill={`url(#${iconId}-grad)`} />

      {/* Inner highlight */}
      <rect x="2" y="2" width="96" height="96" rx="22" ry="22"
        fill={`url(#${iconId}-hi)`} opacity="0.5" />

      {/* ── Rising staircase bars ── */}
      {/* Step 1 — shortest */}
      <rect x="12" y="70" width="18" height="18" rx="3"
        fill="rgba(255,255,255,0.25)" />
      {/* Step 2 */}
      <rect x="32" y="55" width="18" height="33" rx="3"
        fill="rgba(255,255,255,0.35)" />
      {/* Step 3 */}
      <rect x="52" y="40" width="18" height="48" rx="3"
        fill="rgba(255,255,255,0.45)" />
      {/* Step 4 — tallest */}
      <rect x="72" y="25" width="18" height="63" rx="3"
        fill="rgba(255,255,255,0.55)" />

      {/* ── Arc curve across the top of bars ── */}
      <path
        d="M 12 72 Q 45 30 90 28"
        stroke="rgba(255,255,255,0.50)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Minimalist figure climbing ── */}
      {/* Head */}
      <circle cx="46" cy="22" r="6" fill="white" opacity="0.95" />
      {/* Body */}
      <path d="M 46 28 L 44 48 L 50 48 L 48 28 Z"
        fill="white" opacity="0.90" />
      {/* Left leg (back) — stepping up */}
      <path d="M 44 48 L 38 62 L 43 63 L 48 50"
        fill="white" opacity="0.75" stroke="none" />
      {/* Right leg (front) — on step */}
      <path d="M 50 48 L 52 58 L 57 57 L 54 47"
        fill="white" opacity="0.90" />
      {/* Left arm — holding briefcase down */}
      <path d="M 44 32 L 34 44"
        stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.90" />
      {/* Right arm — extended forward/up */}
      <path d="M 48 32 L 58 26"
        stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.90" />

      {/* Briefcase */}
      <rect x="26" y="44" width="12" height="9" rx="2"
        fill="white" opacity="0.88" />
      <rect x="29" y="42" width="6" height="3" rx="1.5"
        fill="white" opacity="0.70" />
      {/* Briefcase latch line */}
      <line x1="32" y1="44" x2="32" y2="53"
        stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
    </svg>
  );

  if (variant === "icon") return Icon;

  if (variant === "wordmark") {
    return (
      <div className="flex flex-col leading-none">
        <span style={{
          fontFamily: "var(--font-headline)",
          fontWeight: 800,
          fontSize: size * 0.6,
          color: "var(--primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          Career<span style={{ color: "var(--secondary-fixed, var(--primary-container))" }}>Launch</span>
        </span>
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: size * 0.25,
          color: "var(--outline)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginTop: 2,
        }}>
          Architect Your Future
        </span>
      </div>
    );
  }

  // Full: icon + wordmark side by side
  return (
    <div className="flex items-center gap-2.5">
      {Icon}
      <div className="flex flex-col leading-none">
        <span style={{
          fontFamily: "var(--font-headline)",
          fontWeight: 800,
          fontSize: size * 0.44,
          color: "var(--primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}>
          Career<span style={{
            color: "var(--secondary, var(--primary-container))",
          }}>Launch</span>
        </span>
        <span style={{
          fontFamily: "var(--font-body)",
          fontSize: size * 0.2,
          color: "var(--outline)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginTop: 1,
        }}>
          Architect Your Future
        </span>
      </div>
    </div>
  );
};

export default CareerLaunchLogo;
