"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ActiveTab } from "@/components/layout/Navbar";
import { OverviewView } from "@/components/dashboard/OverviewView";
import { SimulatorView } from "@/components/simulator/SimulatorView";
import { CaseQueueView } from "@/components/cases/CaseQueueView";
import { SessionMonitorView } from "@/components/sessions/SessionMonitorView";
import { RiderListView } from "@/components/riders/RiderListView";
import { VerificationCenterView } from "@/components/verification/VerificationCenterView";
import { EvaluationView } from "@/components/evaluation/EvaluationView";
import { AuditLogView } from "@/components/audit/AuditLogView";
import { FleetRadarView } from "@/components/radar/FleetRadarView";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [metrics, setMetrics] = useState<any | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
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
    // Poll metrics periodically
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen to hash changes if user navigated or bookmarked a specific view
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as ActiveTab;
      if (
        [
          "dashboard",
          "radar",
          "simulator",
          "cases",
          "sessions",
          "riders",
          "verification",
          "evaluation",
          "audit",
        ].includes(hash)
      ) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    setIsMobileMenuOpen(false);
  };

  const handleOpenCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveTab("cases");
    window.location.hash = "cases";
  };

  const handleResetData = async () => {
    const res = await fetch("/api/system/reset", { method: "POST" });
    if (res.ok) {
      await fetchMetrics();
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#17191B] flex flex-row font-sans selection:bg-[#FFD900] selection:text-[#17191B]">
      {/* 1. Left Sidebar: Graphite background, Industrial Yellow active state */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        openCasesCount={metrics?.openCasesCount || 0}
        onResetData={handleResetData}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Column: Warm-white workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F7F7F5]">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onResetData={handleResetData}
          openCasesCount={metrics?.openCasesCount || 0}
        />

        {/* Workspace Content */}
        <main
          className={`flex-1 w-full ${
            activeTab === "radar"
              ? "p-0 bg-[#F7F7F5] h-[calc(100vh-3.5rem)] overflow-hidden"
              : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
          }`}
        >
          {activeTab === "dashboard" && (
            <OverviewView
              metrics={metrics}
              onNavigateTab={handleSelectTab}
              onOpenCase={handleOpenCase}
            />
          )}

          {activeTab === "radar" && (
            <FleetRadarView
              onNavigateToTab={(tab, param) => {
                if (tab === "cases" && param) {
                  handleOpenCase(param);
                } else {
                  handleSelectTab(tab as ActiveTab);
                }
              }}
            />
          )}

          {activeTab === "simulator" && (
            <SimulatorView
              onOpenCase={handleOpenCase}
              onRefreshMetrics={fetchMetrics}
            />
          )}

          {activeTab === "cases" && (
            <CaseQueueView
              initialCaseId={selectedCaseId}
              onRefreshMetrics={fetchMetrics}
            />
          )}

          {activeTab === "sessions" && <SessionMonitorView />}

          {activeTab === "riders" && <RiderListView />}

          {activeTab === "verification" && (
            <VerificationCenterView onRefreshMetrics={fetchMetrics} />
          )}

          {activeTab === "evaluation" && <EvaluationView />}

          {activeTab === "audit" && <AuditLogView />}
        </main>

        {/* Industrial Footer (hidden on full-screen tactical radar to avoid scrolling) */}
        {activeTab !== "radar" && (
          <footer className="border-t border-[#D9D6CD] bg-[#FFFFFF] py-4 text-xs text-[#5D6266] font-mono mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#17191B]">TrueRide</span>
                <span>•</span>
                <span>Continuous Rider Identity Intelligence</span>
                <span className="text-[#8B8D8C]">v1.0.0</span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-[#8B8D8C]">
                <span>Industrial Sec-Ops Edition</span>
                <span>•</span>
                <span>Privacy-Preserving (Zero Aadhaar Storage)</span>
                <span>•</span>
                <span className="text-[#24813A] font-bold">SQLITE CLUSTER ACTIVE</span>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
