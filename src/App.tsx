import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CityProvider } from "@/hooks/useCity";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ChatBubble from "@/components/advisor/ChatBubble";

// Pages — existing
import Landing from "./pages/Landing";
import IndexPage from "./pages/Index";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import JobBoard from "./pages/JobBoard";
import SavedJobs from "./pages/SavedJobs";
import Profile from "./pages/Profile";
import SkillGapPage from "./pages/SkillGap";
import AdvisorPage from "./pages/Advisor";
import NotFound from "./pages/NotFound";

// Pages — new features
import InterviewPrep from "./pages/InterviewPrep";
import ResumeBuilder from "./pages/ResumeBuilder";

// Coming soon placeholder
const ComingSoon = ({ title }: { title: string }) => (
  <DashboardLayout title={title}>
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <div className="text-5xl mb-4">🚧</div>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground">This feature is coming soon. Check back shortly!</p>
    </div>
  </DashboardLayout>
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading RoleMatch...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const DashPage = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <ProtectedRoute>
    <DashboardLayout title={title}>{children}</DashboardLayout>
  </ProtectedRoute>
);

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Main */}
        <Route path="/match" element={<DashPage title="Resume Matcher"><IndexPage /></DashPage>} />
        <Route path="/dashboard" element={<DashPage title="Dashboard"><Dashboard /></DashPage>} />
        <Route path="/jobs" element={<DashPage title="Job Board"><JobBoard /></DashPage>} />
        <Route path="/saved" element={<DashPage title="Saved Jobs"><SavedJobs /></DashPage>} />
        <Route path="/profile" element={<DashPage title="My Profile"><Profile /></DashPage>} />
        <Route path="/skillgap" element={<SkillGapPage />} />
        <Route path="/advisor" element={<AdvisorPage />} />

        {/* Tools */}
        <Route path="/interview" element={
          <ProtectedRoute><InterviewPrep /></ProtectedRoute>
        } />
        <Route path="/resume-builder" element={
          <ProtectedRoute><ResumeBuilder /></ProtectedRoute>
        } />
        <Route path="/cover-letter" element={<DashPage title="Cover Letter"><ComingSoon title="Cover Letter Generator" /></DashPage>} />
        <Route path="/salary-coach" element={<DashPage title="Salary Coach"><ComingSoon title="Salary Negotiation Coach" /></DashPage>} />

        {/* Research */}
        <Route path="/company-research" element={<DashPage title="Company Research"><ComingSoon title="Company Research" /></DashPage>} />
        <Route path="/career-roadmap" element={<DashPage title="Career Roadmap"><ComingSoon title="Career Roadmap" /></DashPage>} />
        <Route path="/linkedin" element={<DashPage title="LinkedIn Optimizer"><ComingSoon title="LinkedIn Profile Optimizer" /></DashPage>} />
        <Route path="/tracker" element={<DashPage title="Job Tracker"><ComingSoon title="Job Application Tracker" /></DashPage>} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      {user && <ChatBubble />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CityProvider>
              <AppRoutes />
            </CityProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
