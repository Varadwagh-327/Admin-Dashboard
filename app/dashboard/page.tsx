// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import AdminDashboard from "@/components/ClientSideComponents/DashboardComponents/DateWiseDashboard";
import { useAuth } from "@/hooks/useAuth";
import SideBar from "@/components/layout/SideBar";
import Topbar from "@/components/layout/TopBar";

export default function DashboardPage() {
  const { user, tokenPreview, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // lock background scrolling when drawer is open (mobile)
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar (controlled) */}
      <SideBar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay: sits under Topbar but above page content.
          z-index order: Topbar z-50 > Sidebar z-40 > Overlay z-30 > content z-10
          This keeps Topbar visible above the drawer (if you prefer drawer above topbar, swap z-values).
      */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 bg-black/40 transition-opacity lg:hidden ${sidebarOpen ? "opacity-100 pointer-events-auto z-30" : "opacity-0 pointer-events-none"}`}
      />

      {/* Main page layout: reserve left space for the sidebar on lg screens using padding */}
      <div className="flex flex-col min-h-screen lg:pl-64">
        {/* Topbar: ensure it has z-50 so it's above content */}
        <div className="sticky top-0 z-50">
          <Topbar
            user={user || "Admin"}
            tokenPreview={tokenPreview}
            onMenuClick={() => setSidebarOpen((s) => !s)}
          />
        </div>

        <main className="flex-1 ">
          <AdminDashboard />
        </main>
      </div>
    </div>
  );
}
