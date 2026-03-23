<div align="center">

<img src="public/favicon.svg" width="80" height="80" alt="CareerLaunch Logo" />

# CareerLaunch

### AI-Powered Career Platform for India's Tech Talent

[![Live Demo](https://img.shields.io/badge/Live%20Demo-role--match--eta.vercel.app-004f34?style=for-the-badge&logo=vercel)](https://role-match-eta.vercel.app)
[![Built with React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)

**Architect Your Future** — Upload your resume, get matched to live jobs from LinkedIn, Indeed & Naukri, and access 12 AI-powered career tools tailored for the Indian job market.

[Live Demo](https://role-match-eta.vercel.app) · [Report Bug](https://github.com/Chaitanysai/your-career-match/issues) · [Request Feature](https://github.com/Chaitanysai/your-career-match/issues)

</div>

---

## Screenshots

| Dashboard | Smart Job Search | Interview Prep |
|-----------|-----------------|----------------|
| ![Dashboard](https://placehold.co/380x220/004f34/ffffff?text=Dashboard) | ![Jobs](https://placehold.co/380x220/006947/ffffff?text=Smart+Jobs) | ![Interview](https://placehold.co/380x220/004f34/ffffff?text=Interview+Prep) |

---

## What is CareerLaunch?

CareerLaunch is a full-stack AI career platform built specifically for Indian tech professionals. It goes beyond basic job boards — it reads your resume, understands your skills, and uses AI to match you with genuinely relevant opportunities across India's top hiring platforms.

---

## Features

### 🎯 Smart Job Search
Upload your resume → AI extracts your skills → searches live jobs from LinkedIn, Indeed, Glassdoor & Naukri → **Gemini AI scores every job for genuine relevance** (not keyword counting). Each result shows why it matches and what skills you're missing.

### 📄 Resume Matcher
ATS score against any job description. Detects missing keywords, found keywords, and generates 5 optimized bullet points via one-click AI optimization.

### 🤖 AI Career Advisor
Streaming chat with Groq's Llama 3.3 70B, specialized for the Indian job market. Knows Hyderabad/Bengaluru salary bands, FAANG interview patterns, and Indian tech ecosystem.

### 🎤 Interview Prep
AI-generated mock interviews for Technical, Behavioral, System Design, and HR rounds. Real-time evaluation with strengths, improvements, and ideal answer for each question.

### 💰 Salary Coach
Market calibration using 400+ data points per city. Generates a word-for-word negotiation script with specific LPA ranges for your role in your city.

### 🏢 Company Research
Deep-dive on any Indian tech company — culture ratings, salary ranges by level, pros/cons from employees, interview process breakdown.

### 🗺️ Career Roadmap
AI-generated step-by-step path from your current role to your target role. Projected salary growth chart, milestone tracking, and curated course recommendations.

### 🔗 LinkedIn Optimizer
Rewrites your headline and About section for maximum recruiter visibility. Skill alignment analysis against target roles. Profile checklist with completion tracking.

### 📊 Skill Gap Analysis
Real-time comparison of your skills vs market demand in your city. Prioritized learning roadmap with time estimates and free resources.

### 📝 Resume Builder
5-step wizard with AI-generated bullet points. ATS-optimized output. Glassmorphic editor with inline AI suggestions.

### 📧 Cover Letter Generator
4 tone options (Professional, Enthusiastic, Creative, Concise). Auto-filled from resume + job description. One-click download.

### 📋 Job Tracker
Kanban board — Wishlist → Applied → Interview → Offer → Rejected. Drag & drop status updates with salary and notes per application.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui + Stitch Design System |
| **Auth** | Firebase Authentication (Email + Google) |
| **AI — Analysis** | Google Gemini 2.0 Flash |
| **AI — Chat** | Groq (Llama 3.3 70B) with streaming |
| **Jobs API** | JSearch via RapidAPI (LinkedIn + Indeed + Glassdoor) |
| **Deployment** | Vercel (SPA + Serverless Functions) |
| **Error Monitoring** | Sentry |

---

## Architecture

```
Browser
   │
   ├── React SPA (Vite)
   │      ├── Firebase Auth (IndexedDB — never localStorage)
   │      ├── CSS var theme system (10 color palettes)
   │      └── All AI calls → /api/ai (never direct)
   │
   └── Vercel Serverless (/api/ai)
          ├── Rate limiting (30 req/min per IP)
          ├── CORS validation
          ├── → Google Gemini API
          ├── → Groq API
          └── → RapidAPI (JSearch)
```

**API keys never reach the browser.** All `GEMINI_API_KEY`, `GROQ_API_KEY`, and `RAPIDAPI_KEY` live server-side in Vercel environment variables.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project (free tier works)
- Gemini API key — [Get free key](https://aistudio.google.com)
- Groq API key — [Get free key](https://console.groq.com)
- RapidAPI key — [JSearch free tier](https://rapidapi.com/letscrape-6bfbbb4a-6f11-4bc0-8ece-e26b3f2aa60c/api/jsearch) (200 calls/month free)

### Installation

```bash
# Clone the repo
git clone https://github.com/Chaitanysai/your-career-match.git
cd your-career-match

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file at the project root:

```env
# Firebase (client-safe)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# AI Keys — server-side only (no VITE_ prefix)
# These are read by /api/ai serverless function, never bundled to browser
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
RAPIDAPI_KEY=your_rapidapi_key

# Optional — error monitoring
VITE_SENTRY_DSN=your_sentry_dsn
```

### Run Locally

```bash
npm run dev
```

App runs at `http://localhost:5173`

> **Note:** The `/api/ai` serverless function only runs on Vercel. For local development, the app uses the Vercel dev CLI or you can temporarily add `VITE_` prefixed keys for local testing.

---

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
# Settings → Environment Variables → Add all keys above
```

The `api/ai.ts` file is automatically detected by Vercel as a serverless function.

---

## Project Structure

```
careerlaunch/
├── api/
│   └── ai.ts                    # Vercel serverless — AI proxy with rate limiting
├── public/
│   └── favicon.svg              # CareerLaunch SVG icon
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx        # Sign in / Create account modal
│   │   ├── CareerLaunchLogo.tsx # SVG logo — theme-reactive
│   │   ├── ErrorBoundary.tsx    # React error boundary
│   │   ├── advisor/             # AI chat bubble + window
│   │   ├── layout/              # Sidebar, Topbar, DashboardLayout
│   │   └── theme/               # ThemeSwitcher (10 palettes)
│   ├── hooks/
│   │   ├── useAuth.tsx          # Firebase auth state
│   │   ├── useCity.tsx          # 18 Indian cities
│   │   └── useTheme.tsx         # Color palette context
│   ├── lib/
│   │   ├── themes.ts            # 10 color palettes + CSS var injection
│   │   ├── cities.ts            # Indian cities list
│   │   └── portals.ts           # Naukri/LinkedIn/Indeed URL builders
│   ├── pages/                   # One file per route (17 pages)
│   └── services/
│       ├── gemini.ts            # Gemini via /api/ai proxy
│       ├── groq.ts              # Groq via /api/ai proxy
│       ├── jsearch.ts           # JSearch via /api/ai proxy
│       └── ai.ts                # Shared callAI(), safeParseJSON()
├── vercel.json                  # SPA rewrites (fixes 404 on refresh)
├── CLAUDE.md                    # AI context file
└── index.html
```

---

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Landing | Public homepage |
| `/dashboard` | Dashboard | Overview + recent matches |
| `/smart-jobs` | Smart Job Search | Resume → live job matching |
| `/match` | Resume Matcher | ATS scoring + job matches |
| `/jobs` | Job Board | Browse all live jobs |
| `/skillgap` | Skill Gap | Skills vs market demand |
| `/advisor` | AI Advisor | Career chat (streaming) |
| `/interview` | Interview Prep | Mock interviews with AI |
| `/resume-builder` | Resume Builder | 5-step AI-assisted builder |
| `/cover-letter` | Cover Letter | AI-generated, 4 tones |
| `/salary-coach` | Salary Coach | Market data + negotiation script |
| `/company-research` | Company Research | Culture, salary, interview process |
| `/career-roadmap` | Career Roadmap | Step-by-step path + salary chart |
| `/linkedin` | LinkedIn Optimizer | Headline + About rewrite |
| `/tracker` | Job Tracker | Kanban application board |

---

## Security

- ✅ Firebase Auth — tokens in IndexedDB, not localStorage
- ✅ All AI API keys server-side (Vercel serverless, not bundled to browser)
- ✅ Rate limiting — 30 requests/minute per IP on `/api/ai`
- ✅ CORS validation — only allowed origins can call the API
- ✅ React ErrorBoundary — crashes show recovery UI, not white screen
- ✅ Environment variable validation at startup
- ✅ Full TypeScript — no untyped AI-generated code

---

## Design System

CareerLaunch uses a custom implementation of Google's **Stitch design language**:

- **10 color themes** — switch palette in the topbar, entire app recolors instantly (emerald, ocean, violet, crimson, sunset, gold, rose, teal, magenta, slate)
- **No-Line philosophy** — zero 1px borders, sections defined by background shifts
- **CSS variable-driven** — every color is `var(--primary)`, `var(--surface-container)` etc.
- **Fonts** — Manrope (headlines) + Inter (body)
- **Icons** — Material Symbols Outlined

---

## India-Specific Features

- 🏙️ **18 cities** — Bengaluru, Hyderabad, Mumbai, Delhi NCR, Pune, Chennai and more
- 💰 **₹LPA salary format** throughout (Lakhs Per Annum)
- 🏢 **Indian companies** — Flipkart, Swiggy, Razorpay, Zepto, CRED, PhonePe, Infosys, TCS
- 🎯 **Indian portals** — Naukri, LinkedIn India, Internshala, Wellfound, Glassdoor India
- 📈 **India market data** — salary ranges calibrated to Indian tech ecosystem

---

## Contributing

Contributions are welcome!

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/your-career-match.git

# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes, then push
git push origin feature/your-feature-name

# Open a Pull Request
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ in Hyderabad

**[CareerLaunch](https://role-match-eta.vercel.app)** · Architect Your Future

</div>
