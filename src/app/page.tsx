"use client";

import React, { useState, useEffect } from "react";
import { Navbar, ActiveTab } from "@/components/layout/Navbar";
import { OverviewView } from "@/components/dashboard/OverviewView";
import { SimulatorView } from "@/components/simulator/SimulatorView";
import { CaseQueueView } from "@/components/cases/CaseQueueView";
import { SessionMonitorView } from "@/components/sessions/SessionMonitorView";
import { RiderListView } from "@/components/riders/RiderListView";
import { VerificationCenterView } from "@/components/verification/VerificationCenterView";
import { EvaluationView } from "@/components/evaluation/EvaluationView";
import { AuditLogView } from "@/components/audit/AuditLogView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [metrics, setMetrics] = useState<any | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

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
    // Poll metrics periodically or on view transitions
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen to hash changes if user navigated via browser
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as ActiveTab;
      if (
        [
          "dashboard",
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
  };

  const handleOpenCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveTab("cases");
  };

  const handleResetData = async () => {
    const res = await fetch("/api/system/reset", { method: "POST" });
    if (res.ok) {
      await fetchMetrics();
    }
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Application Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        openCasesCount={metrics?.openCasesCount || 0}
        onResetData={handleResetData}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "dashboard" && (
          <OverviewView
            metrics={metrics}
            onNavigateTab={handleSelectTab}
            onOpenCase={handleOpenCase}
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060a14] py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">TrueRide</span>
            <span>• Continuous Rider Identity Intelligence</span>
            <span className="text-cyan-500">v1.0.0</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Hackathon Submission Edition</span>
            <span>•</span>
            <span>Privacy-Preserving (No Aadhaar Stored)</span>
            <span>•</span>
            <span>SQLite + Prisma</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
