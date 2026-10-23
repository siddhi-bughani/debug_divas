import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Info, ShieldAlert } from 'lucide-react';

export const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-sahay-ivory flex flex-col md:flex-row">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Demo Mode Notice Banner */}
        <div className="bg-sahay-forest-deep text-white px-4 py-1.5 text-[11px] flex items-center justify-between border-b border-sahay-border">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-sahay-teal shrink-0" />
            <span>
              <strong>SAHAY Demonstration Environment</strong> — Fictional Kerala Flood Relief Corridor (Ernakulam District). All records represent simulation data.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-sahay-border text-[10px]">
            <span>Deterministic Shortage Logic: Active</span>
            <span>REST API Target: localhost:5000</span>
          </div>
        </div>

        {/* Scrollable Page Outlet */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
