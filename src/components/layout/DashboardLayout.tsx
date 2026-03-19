import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "#f8f7f4" }}>

      {/* Desktop sidebar — always 60px wide, expands on hover as overlay */}
      <div className="hidden md:flex shrink-0" style={{ width: "60px" }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-56 border-0 bg-transparent shadow-none">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main content — always starts at 60px, sidebar overlays when expanded */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} title={title} />
        {/* Dot grid background */}
        <main className="flex-1 overflow-auto dot-grid">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;