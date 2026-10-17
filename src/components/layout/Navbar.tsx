"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Activity,
  Sliders,
  Users,
  CheckCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Camera,
  Layers,
  Flame,
} from "lucide-react";

export type ActiveTab =
  | "dashboard"
  | "simulator"
  | "cases"
  | "sessions"
  | "riders"
  | "verification"
  | "evaluation"
  | "audit";

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  openCasesCount?: number;
  onResetData?: () => Promise<void>;
}

export function Navbar({
  activeTab,
  onSelectTab,
  openCasesCount = 0,
  onResetData,
}: NavbarProps) {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (confirm("Restore clean TrueRide synthetic demo dataset? (This re-seeds fictional riders and test sessions without altering code)")) {
      try {
        setIsResetting(true);
        if (onResetData) {
          await onResetData();
        } else {
          await fetch("/api/system/reset", { method: "POST" });
          window.location.reload();
        }
      } catch (err) {
        console.error("Reset failed:", err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const navItems = [
    {
      id: "dashboard" as ActiveTab,
      label: "Overview",
      icon: Activity,
    },
    {
      id: "simulator" as ActiveTab,
      label: "Simulator",
      icon: Sliders,
      badge: "DEMO",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    },
    {
      id: "cases" as ActiveTab,
      label: "Review Queue",
      icon: ShieldAlert,
      count: openCasesCount,
    },
    {
      id: "sessions" as ActiveTab,
      label: "Sessions",
      icon: Layers,
    },
    {
      id: "riders" as ActiveTab,
      label: "Riders",
      icon: Users,
    },
    {
      id: "verification" as ActiveTab,
      label: "Step-Up Verify",
      icon: Camera,
    },
    {
      id: "evaluation" as ActiveTab,
      label: "Evaluation",
      icon: Sparkles,
      badge: "94% Recall",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    },
    {
      id: "audit" as ActiveTab,
      label: "Audit Log",
      icon: FileText,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070c18]/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab("dashboard")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <div className="w-full h-full bg-[#070c18] rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-white">
                  TRUERIDE
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  Continuous Identity AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Trust the rider, not just the account.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-800/90 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono font-bold animate-pulse">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isResetting}
              title="Restore clean synthetic demo seed dataset"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition"
            >
              <RotateCcw className={`w-3 h-3 ${isResetting ? "animate-spin text-cyan-400" : ""}`} />
              <span className="hidden sm:inline">Reset Demo DB</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Engine Active</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800/60 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap ${
                  isActive
                    ? "bg-slate-800 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[9px] px-1 rounded-full bg-rose-600 text-white font-mono">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
