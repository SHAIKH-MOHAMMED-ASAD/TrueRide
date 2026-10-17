"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ActiveTab } from "@/components/layout/Navbar";
import { FleetRadarView } from "@/components/radar/FleetRadarView";

export default function FleetRadarPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/dashboard/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to load metrics:", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab === "radar") return;
    router.push(`/dashboard#${tab}`);
  };

  const handleOpenCase = (caseId: string) => {
    router.push(`/dashboard#cases`);
  };

  const handleResetData = async () => {
    const res = await fetch("/api/system/reset", { method: "POST" });
    if (res.ok) {
      await fetchMetrics();
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F7F7F5] text-[#17191B] flex flex-row font-sans selection:bg-[#FFD900] selection:text-[#17191B]">
      {/* Left Sidebar (TrueRide Graphite) */}
      <Sidebar
        activeTab="radar"
        onSelectTab={handleSelectTab}
        openCasesCount={metrics?.openCasesCount || 0}
        onResetData={handleResetData}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F7F7F5]">
        {/* Top Header */}
        <Header
          activeTab="radar"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onResetData={handleResetData}
          openCasesCount={metrics?.openCasesCount || 0}
        />

        {/* Viewport-Fitted Tactical Workspace */}
        <main className="flex-1 min-h-0 w-full overflow-hidden bg-[#F7F7F5]">
          <FleetRadarView
            onNavigateToTab={(tab, param) => {
              if (tab === "cases") {
                handleOpenCase(param || "");
              } else {
                handleSelectTab(tab as ActiveTab);
              }
            }}
          />
        </main>
      </div>
    </div>
  );
}
