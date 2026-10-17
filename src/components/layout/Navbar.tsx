"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  Radio,
} from "lucide-react";

export type ActiveTab =
  | "dashboard"
  | "radar"
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
  const [isResetting, setIsResetting] = React.useState(false);

  const handleReset = async () => {
    if (confirm("Restore clean TrueRide synthetic demo dataset?")) {
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
    { id: "dashboard" as ActiveTab, label: "Overview", icon: Activity },
    { id: "radar" as ActiveTab, label: "Fleet Radar", icon: Radio },
    { id: "sessions" as ActiveTab, label: "Sessions", icon: Layers },
    { id: "simulator" as ActiveTab, label: "Simulator", icon: Sliders },
    { id: "cases" as ActiveTab, label: "Review Queue", icon: ShieldAlert, count: openCasesCount },
    { id: "riders" as ActiveTab, label: "Riders", icon: Users },
    { id: "verification" as ActiveTab, label: "Verify", icon: Camera },
    { id: "evaluation" as ActiveTab, label: "Evaluation", icon: Sparkles },
    { id: "audit" as ActiveTab, label: "Audit Log", icon: FileText },
  ];


  return (
    <header className="sticky top-0 z-50 bg-[#2D302F] border-b border-[#3F4241] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[2px] bg-[#FFD900] flex items-center justify-center text-[#17191B] font-bold">
              <Flame className="w-4 h-4 fill-[#17191B]" />
            </div>
            <span className="font-extrabold text-white tracking-wider text-sm">TRUERIDE</span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-1.5 rounded-[2px] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#FFD900] text-[#17191B] font-bold"
                      : "text-[#D5D7D6] hover:bg-[#383B3A] hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-2.5 py-1 rounded-[2px] text-xs font-mono font-bold text-[#EAEAE6] bg-[#383B3A] hover:bg-[#434746] border border-[#4F5351] transition"
          >
            {isResetting ? "Resetting..." : "Reset DB"}
          </button>
        </div>
      </div>
    </header>
  );
}
