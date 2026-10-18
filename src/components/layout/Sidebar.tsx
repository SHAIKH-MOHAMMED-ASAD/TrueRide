"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  Layers,
  Sliders,
  ShieldAlert,
  Users,
  Camera,
  Sparkles,
  FileText,
  RotateCcw,
  ExternalLink,
  Flame,
  CheckCircle2,
  X,
  Radio,
} from "lucide-react";
import { ActiveTab } from "./Navbar";

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  openCasesCount?: number;
  onResetData?: () => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  openCasesCount = 0,
  onResetData,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const [isResetting, setIsResetting] = React.useState(false);

  const handleReset = async () => {
    if (
      confirm(
        "Restore clean TrueRide synthetic demo dataset? (This re-seeds fictional riders and test sessions without altering code)"
      )
    ) {
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
      label: "Project Overview",
      icon: Activity,
    },
    {
      id: "sessions" as ActiveTab,
      label: "Live Sessions",
      icon: Layers,
    },
    {
      id: "simulator" as ActiveTab,
      label: "Session Simulator",
      icon: Sliders,
      badge: "DEMO",
    },
    {
      id: "cases" as ActiveTab,
      label: "Review Queue",
      icon: ShieldAlert,
      count: openCasesCount,
    },
    {
      id: "riders" as ActiveTab,
      label: "Riders Directory",
      icon: Users,
    },
    {
      id: "verification" as ActiveTab,
      label: "Step-Up Verification",
      icon: Camera,
    },
    {
      id: "evaluation" as ActiveTab,
      label: "Evaluation Benchmark",
      icon: Sparkles,
      badge: "94% REC",
    },
    {
      id: "audit" as ActiveTab,
      label: "Audit Trail",
      icon: FileText,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#2D302F] text-[#EAEAE6] select-none font-sans">
      {/* 1. TrueRide Logo & Wordmark */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            {/* Industrial Yellow Logo Glyph */}
            <div className="w-8 h-8 rounded-[2px] bg-[#FFD900] flex items-center justify-center text-[#17191B] font-black text-sm tracking-tighter shadow-sm">
              <Flame className="w-5 h-5 fill-[#17191B] text-[#17191B]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wider text-white">
                  TRUERIDE
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-[#FFD900] text-[#17191B] rounded-[1px]">
                  SEC-OPS
                </span>
              </div>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-[#8B8D8C] hover:text-white rounded-[2px]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Small uppercase product descriptor */}
        <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-[#8B8D8C]">
          Continuous Rider Identity Intelligence
        </p>
      </div>

      {/* 3. Thin separator */}
      <div className="border-b border-[#3F4241]" />

      {/* 4. Active workspace indicator */}
      <div className="px-5 py-3 bg-[#262827] border-b border-[#3F4241] flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-none bg-[#24813A]" />
          <span className="text-[#D5D7D6] font-semibold">CLUSTER: PROD-BLR</span>
        </div>
        <span className="text-[#8B8D8C] text-[10px]">v1.0.0</span>
      </div>

      {/* 5. Vertical Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#8B8D8C]">
          Operations Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[2px] text-xs font-semibold tracking-tight transition cursor-pointer text-left ${
                isActive
                  ? "bg-[#FFD900] text-[#17191B] font-bold shadow-sm"
                  : "text-[#D5D7D6] hover:bg-[#383B3A] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[#17191B]" : "text-[#A0A2A0]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {/* Counts and Badges */}
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-[1px] ${
                    isActive
                      ? "bg-[#17191B] text-[#FFD900]"
                      : "bg-[#D52222] text-white"
                  }`}
                >
                  {item.count}
                </span>
              )}

              {item.badge && (
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-[1px] ${
                    isActive
                      ? "bg-[#17191B] text-[#FFD900]"
                      : "bg-[#3F4241] text-[#EAEAE6]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 6. Bottom Section: Database/Demo Status & Engine Health */}
      <div className="p-4 border-t border-[#3F4241] bg-[#262827] space-y-3">
        {/* Engine status indicator */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#D5D7D6]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#24813A]" />
            <span>ENGINE: ACTIVE</span>
          </div>
          <span className="text-[10px] text-[#8B8D8C]">SQLITE LIVE</span>
        </div>

        {/* Reset Demo DB Button */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[2px] text-xs font-mono font-semibold text-[#EAEAE6] bg-[#383B3A] hover:bg-[#434746] border border-[#4F5351] transition cursor-pointer disabled:opacity-50"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 ${isResetting ? "animate-spin text-[#FFD900]" : ""}`}
          />
          <span>{isResetting ? "Resetting..." : "Reset Demo DB"}</span>
        </button>

        {/* 3D Landing Page Shortcut */}
        <Link
          href="/"
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-mono text-[#8B8D8C] hover:text-[#FFD900] transition"
        >
          <span>3D Courier Landing Hero</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (280px wide) */}
      <aside className="hidden lg:block w-[280px] shrink-0 border-r border-[#3F4241] h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-[280px] z-50 transform transition-transform duration-200 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
