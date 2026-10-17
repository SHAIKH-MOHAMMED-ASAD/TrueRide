"use client";

import React from "react";
import { Menu, ShieldCheck, User, RotateCcw, Activity } from "lucide-react";
import { ActiveTab } from "./Navbar";

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenMobileMenu?: () => void;
  onResetData?: () => Promise<void>;
  openCasesCount?: number;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: "OPERATIONS OVERVIEW",
    subtitle: "Real-time identity threat radar and high-level risk distribution",
  },
  radar: {
    title: "FLEET TRUST RADAR",
    subtitle: "Real-time tactical fleet monitoring and continuous identity verification",
  },
  sessions: {
    title: "LIVE SESSIONS MONITOR",
    subtitle: "Continuous telemetric ingestion and behavioral cadence feed",
  },
  simulator: {
    title: "SESSION RISK SIMULATOR",
    subtitle: "Synthetic scenario execution against individualized rider baselines",
  },
  cases: {
    title: "SECURITY INVESTIGATION QUEUE",
    subtitle: "Flagged potential account sharing and rented account triage",
  },
  riders: {
    title: "RIDERS & HARDWARE DIRECTORY",
    subtitle: "Enrolled delivery riders, touch baselines, and hardware signatures",
  },
  verification: {
    title: "STEP-UP VERIFICATION STUDIO",
    subtitle: "Biometric face verification against enrolled reference portrait",
  },
  evaluation: {
    title: "BENCHMARK & EVALUATION",
    subtitle: "Empirically measured recall, precision, and confusion matrix",
  },
  audit: {
    title: "IMMUTABLE AUDIT TRAIL",
    subtitle: "Cryptographic activity log and human analyst decisions",
  },
};

export function Header({
  activeTab,
  onOpenMobileMenu,
  onResetData,
  openCasesCount = 0,
}: HeaderProps) {
  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;
  const [isResetting, setIsResetting] = React.useState(false);

  const handleQuickReset = async () => {
    if (confirm("Reset TrueRide demo dataset to baseline state?")) {
      try {
        setIsResetting(true);
        if (onResetData) {
          await onResetData();
        } else {
          await fetch("/api/system/reset", { method: "POST" });
          window.location.reload();
        }
      } catch (e) {
        console.error("Reset error:", e);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#D9D6CD] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Mobile Toggle + Breadcrumb / Context Label */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-[#17191B] hover:bg-[#F1F0ED] rounded-[2px] transition cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#5D6266] uppercase tracking-wider">
            <span>TRUERIDE</span>
            <span>/</span>
            <span>OPERATIONS</span>
            <span>/</span>
            <span className="text-[#17191B] font-bold">{activeTab}</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#17191B] tracking-tight leading-tight">
            {currentTabInfo.title}
          </h2>
        </div>
      </div>

      {/* Right: Operational Badges & User Context */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Engine Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F4E8] text-[#24813A] border border-[#24813A]/30 rounded-[2px] text-[11px] font-mono font-bold tracking-tight">
          <span className="w-1.5 h-1.5 rounded-none bg-[#24813A] animate-pulse" />
          <span>ENGINE: OPERATIONAL</span>
        </div>

        {/* Analyst Role Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1F0ED] text-[#17191B] border border-[#D9D6CD] rounded-[2px] text-[11px] font-mono">
          <User className="w-3.5 h-3.5 text-[#5D6266]" />
          <span className="font-semibold hidden md:inline">ANALYST:</span>
          <span>L2 SEC-OPS</span>
        </div>

        {/* Quick Reset Button */}
        <button
          onClick={handleQuickReset}
          disabled={isResetting}
          title="Reset synthetic database to baseline demo state"
          className="p-1.5 sm:px-2.5 sm:py-1 rounded-[2px] text-[11px] font-mono font-semibold text-[#5D6266] hover:text-[#17191B] hover:bg-[#F1F0ED] border border-[#D9D6CD] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin text-[#17191B]" : ""}`} />
          <span className="hidden sm:inline">{isResetting ? "Resetting..." : "Reset"}</span>
        </button>
      </div>
    </header>
  );
}
