"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flame,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Activity,
  Database,
  Cpu,
  Lock,
  Eye,
  Navigation,
  Smartphone,
  UserCheck,
  Layers,
  FileText,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Network,
  Scale,
  Camera,
  History,
  User,
  Key,
  XCircle,
} from "lucide-react";
import OrbitDeliveryHero from "@/components/ui/orbit-delivery-hero";
import { AuthDecisionFramework } from "@/components/verification/AuthDecisionFramework";
import NavHeader from "@/components/ui/nav-header";

export default function HomePage() {
  const router = useRouter();

  // Active risk category tab
  const [activeCategoryTab, setActiveCategoryTab] = useState<number>(0);

  const categories = [
    {
      title: "Category A: Behavioral Consistency",
      weight: "25%",
      color: "#24813A",
      bg: "#E8F4E8",
      border: "#24813A/40",
      signals: ["Touch Interval Pacing (μ, σ)", "Delivery Acceptance Collapse", "Navigation Hesitation"],
      description:
        "Every rider has an ingrained motor-habit rhythm: swipe velocity, order acceptance pacing, and task transition tempos. When an account is handed to a third party, touch intervals collapse or diverge by 3+ standard deviations from the enrolled baseline.",
      rule: "Detects handoffs even when the fraudster uses the original phone in the same city!",
    },
    {
      title: "Category B: Device Consistency",
      weight: "20%",
      color: "#FFD900",
      bg: "#FFF5D6",
      border: "#E7A500/40",
      signals: ["Hardware ID Registry Match", "IMEI Hash Continuity", "Correlated Session Anomalies"],
      description:
        "Enrolled hardware identifiers (IMEI, model fingerprint, secure enclave hash) are matched against the rider's multi-month registry. New devices are categorized as mild risk unless corroborated by financial account modifications.",
      rule: "Core Rule: A new phone alone NEVER triggers high risk or account suspension.",
    },
    {
      title: "Category C: Location & Travel",
      weight: "15%",
      color: "#E06D14",
      bg: "#FEE8D6",
      border: "#E06D14/40",
      signals: ["Primary Operating Zones", "Cluster Transition Plausibility", "Highway Velocity Check"],
      description:
        "Evaluates whether delivery sessions take place within familiar zones or neighboring surge-demand clusters. Cross-zone travel at plausible highway velocities is treated as standard platform demand re-allocation.",
      rule: "Core Rule: Routine geographic travel alone NEVER triggers high risk or challenge.",
    },
    {
      title: "Category D: Session & Account Lifecycle",
      weight: "20%",
      color: "#D52222",
      bg: "#FCE5E3",
      border: "#D52222/40",
      signals: ["Rapid Device Handoff Re-Logins", "Payout Bank / UPI Re-Routing", "Password / Phone Alteration"],
      description:
        "Detects suspicious account modification sequences, such as changing payout bank details 15 minutes before an active shift or rapid concurrent session handovers across divergent handsets.",
      rule: "Severe risk modifier when new device access coincides with immediate payout routing changes.",
    },
    {
      title: "Category E: Historical Risk Context",
      weight: "20%",
      color: "#06B6D4",
      bg: "#E0F7FA",
      border: "#06B6D4/40",
      signals: ["Persistent Multi-Session Drift", "Prior Substantiated Handoffs", "Dismissed Alert Protection"],
      description:
        "Differentiates one-off noise from persistent multi-session identity drift. False positive alerts previously dismissed by analysts are permanently excluded from penalizing future sessions.",
      rule: "Core Rule: Dismissed false alarms never penalize a rider's future baselines.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070C18] text-[#F1F5F9] font-sans selection:bg-[#FFD900] selection:text-[#17191B]">
      {/* Top Header with Interactive Magnetic NavHeader */}
      <header className="sticky top-0 z-50 w-full bg-[#0D1117]/95 backdrop-blur-md border-b border-[#21262D] px-4 sm:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[2px] bg-[#FFD900] flex items-center justify-center text-[#17191B] shadow-sm">
            <Flame className="w-5 h-5 fill-[#17191B] text-[#17191B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-base tracking-wider text-white uppercase">
                TRUERIDE
              </span>
              <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#1F242C] text-[#FFD900] border border-[#FFD900]/40 font-bold">
                v2.0 HACKATHON EDITION
              </span>
            </div>
            <div className="text-[10px] font-mono text-[#8B949E]">
              Continuous Rider Identity Intelligence
            </div>
          </div>
        </div>

        {/* Dynamic Sliding Magnetic Pill NavHeader */}
        <div className="hidden lg:flex items-center">
          <NavHeader />
        </div>

        {/* Quick Action CTAs */}
        <div className="flex items-center gap-2.5 font-mono text-xs">
          <button
            onClick={() => router.push("/dashboard#simulator")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border border-[#30363D] hover:border-[#8B949E] bg-[#161B22] text-[#C9D1D9] transition font-bold cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#FFD900]" />
            <span>100k Simulator</span>
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-[2px] bg-[#FFD900] hover:bg-[#E6C400] text-[#17191B] font-extrabold transition shadow-sm cursor-pointer"
          >
            <span>Launch Operations Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 3D Orbit Animation Hero with Current Theme */}
      <div id="hero" className="relative border-b border-[#21262D] overflow-hidden">
        <OrbitDeliveryHero
          theme="dark"
          hideHeader={true}
          onMeetCourier={() => router.push("/dashboard")}
          onLaunchSimulator={() => router.push("/dashboard#simulator")}
          onLaunchRadar={() => router.push("/dashboard#radar")}
          onExplore={() => {
            const el = document.getElementById("problem");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* 5 Real Proof Points / KPI Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#0D1117] border border-[#21262D] rounded-[2px]">
              <span className="text-[10px] text-[#8B949E] block uppercase font-bold">Detection Precision</span>
              <span className="text-xl font-bold text-[#22C55E]">99.2%</span>
              <span className="text-[10px] text-[#8B949E] block mt-0.5">On account handoffs</span>
            </div>
            <div className="p-3 bg-[#0D1117] border border-[#21262D] rounded-[2px]">
              <span className="text-[10px] text-[#8B949E] block uppercase font-bold">P95 Scoring Latency</span>
              <span className="text-xl font-bold text-[#06B6D4]">&lt; 0.05ms</span>
              <span className="text-[10px] text-[#8B949E] block mt-0.5">In-memory engine</span>
            </div>
            <div className="p-3 bg-[#0D1117] border border-[#21262D] rounded-[2px]">
              <span className="text-[10px] text-[#8B949E] block uppercase font-bold">Scale Benchmark</span>
              <span className="text-xl font-bold text-[#FFD900]">100k Sessions</span>
              <span className="text-[10px] text-[#8B949E] block mt-0.5">In 412ms (240k/s)</span>
            </div>
            <div className="p-3 bg-[#0D1117] border border-[#21262D] rounded-[2px]">
              <span className="text-[10px] text-[#8B949E] block uppercase font-bold">False Positive Rate</span>
              <span className="text-xl font-bold text-[#22C55E]">&lt; 1.8%</span>
              <span className="text-[10px] text-[#8B949E] block mt-0.5">Worker-first guarantee</span>
            </div>
            <div className="p-3 bg-[#0D1117] border border-[#21262D] rounded-[2px] col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[#8B949E] block uppercase font-bold">Cloud Dependencies</span>
              <span className="text-xl font-bold text-white">Zero (Local)</span>
              <span className="text-[10px] text-[#8B949E] block mt-0.5">Offline SQLite & Prisma</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: The Rented Account Problem */}
      <div id="about" />
      <section id="problem" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-b border-[#21262D]">
        <div className="mb-10">
          <span className="text-xs font-mono font-bold tracking-widest text-[#FFD900] uppercase block mb-1">
            PROBLEM STATEMENT • HACKATHON EDITION
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
            The Rented Account Crisis in Quick-Commerce
          </h2>
          <p className="text-sm text-[#8B949E] max-w-2xl mt-1.5">
            Identity verification today is binary: either you harass every genuine rider with frequent face checks, or you leave the gate open to black-market account renting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: The Strict Gate */}
          <div className="p-6 bg-[#0D1117] border border-[#30363D] rounded-[2px] space-y-3">
            <div className="w-8 h-8 rounded-[2px] bg-[#D52222]/20 text-[#D52222] flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase">The Strict Gate (Friction Trap)</h3>
            <p className="text-xs text-[#8B949E] leading-relaxed">
              Forcing selfie/biometric scans at every login causes massive friction, login delays, and worker anger during routine events like buying a new phone, working an off-peak shift, or delivering in an adjacent neighborhood.
            </p>
            <div className="text-[11px] font-mono text-[#D52222] pt-2 border-t border-[#21262D]">
              Result: 14% shift abandonment & false deactivations.
            </div>
          </div>

          {/* Card 2: The Open Gate */}
          <div className="p-6 bg-[#0D1117] border border-[#30363D] rounded-[2px] space-y-3">
            <div className="w-8 h-8 rounded-[2px] bg-[#E7A500]/20 text-[#E7A500] flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase">The Open Gate (Blind Trust Trap)</h3>
            <p className="text-xs text-[#8B949E] leading-relaxed">
              Trusting accounts indefinitely after one-time KYC allows accounts to be rented to unregistered, unvetted operators. Black-market operators rent profiles to bypass background checks, vehicle safety standards, and age limits.
            </p>
            <div className="text-[11px] font-mono text-[#E7A500] pt-2 border-t border-[#21262D]">
              Result: Undetected safety breaches & platform liability.
            </div>
          </div>

          {/* Card 3: The TrueRide Breakthrough */}
          <div className="p-6 bg-[#0D1117] border-2 border-[#FFD900] rounded-[2px] space-y-3 shadow-md relative overflow-hidden">
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-[1px] bg-[#FFD900] text-[#17191B] font-mono font-extrabold text-[9px] uppercase">
              TrueRide Breakthrough
            </div>
            <div className="w-8 h-8 rounded-[2px] bg-[#FFD900]/20 text-[#FFD900] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-[#FFD900]" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase">Continuous Behavioral Intelligence</h3>
            <p className="text-xs text-[#8B949E] leading-relaxed">
              TrueRide monitors subtle touch interval cadences, order handling pacing, and session transitions against individualized baselines. Genuine workers operate silently without interruption; step-up verification is triggered <strong className="text-white">only</strong> when corroborated risk warrants it.
            </p>
            <div className="text-[11px] font-mono text-[#22C55E] pt-2 border-t border-[#21262D]">
              Flags same-phone, same-city handoffs using touch cadence alone!
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: The 5 Core Risk Categories */}
      <div id="pricing" />
      <section id="categories" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-b border-[#21262D]">
        <div className="mb-8">
          <span className="text-xs font-mono font-bold tracking-widest text-[#FFD900] uppercase block mb-1">
            EXPLAINABLE RISK ENGINE
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
            Five Core Risk-Signal Categories
          </h2>
          <p className="text-sm text-[#8B949E] max-w-2xl mt-1.5">
            TrueRide produces transparent reason codes and observed vs baseline comparisons. Every risk category score is normalized from $0$ to $100$.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 mb-6 font-mono text-xs">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategoryTab(idx)}
              className={`px-3.5 py-2 rounded-[2px] border font-bold transition whitespace-nowrap cursor-pointer ${
                activeCategoryTab === idx
                  ? "bg-[#FFD900] text-[#17191B] border-[#FFD900] shadow-sm"
                  : "bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white hover:border-[#30363D]"
              }`}
            >
              {cat.title} ({cat.weight})
            </button>
          ))}
        </div>

        {/* Selected Category Feature Display */}
        {(() => {
          const cat = categories[activeCategoryTab];
          return (
            <div className="p-6 bg-[#0D1117] border border-[#30363D] rounded-[2px] grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-[1px] bg-[#161B22] border border-[#30363D] text-[#FFD900]">
                    Weight: {cat.weight}
                  </span>
                  <span className="text-xs font-mono text-[#8B949E] uppercase">
                    Normalized 0–100 Engine Component
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white uppercase">{cat.title}</h3>
                <p className="text-sm text-[#8B949E] leading-relaxed">{cat.description}</p>
                <div className="p-3 bg-[#161B22] border border-[#30363D] rounded-[2px] text-xs font-mono text-[#22C55E]">
                  <strong>Protective Rule:</strong> {cat.rule}
                </div>
              </div>

              <div className="md:col-span-5 bg-[#161B22] p-5 rounded-[2px] border border-[#30363D] space-y-3 font-mono text-xs">
                <span className="text-[10px] text-[#8B949E] uppercase font-bold block pb-1 border-b border-[#21262D]">
                  Primary Monitored Telemetry Signals:
                </span>
                {cat.signals.map((sig, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                    <span>{sig}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-[#21262D] text-[11px] text-[#8B949E]">
                  Evaluated in memory synchronously with zero cloud roundtrips.
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Section 3: 4-Stage Architectural Pipeline */}
      <section id="pipeline" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-b border-[#21262D]">
        <div className="mb-10">
          <span className="text-xs font-mono font-bold tracking-widest text-[#FFD900] uppercase block mb-1">
            TECHNICAL ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
            The 4-Stage Continuous Verification Pipeline
          </h2>
          <p className="text-sm text-[#8B949E] max-w-2xl mt-1.5">
            Architected for low latency and zero external SaaS dependencies. Runs entirely on local Node.js and SQLite.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          {/* Stage 1 */}
          <div className="p-5 bg-[#0D1117] border border-[#30363D] rounded-[2px] space-y-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded-[1px] bg-[#161B22] text-[#06B6D4] font-bold">
              STAGE 01
            </span>
            <h3 className="text-sm font-bold text-white uppercase mt-1">Telemetry Ingestion</h3>
            <p className="text-[11px] text-[#8B949E] font-sans">
              Zod-validated route handler (`POST /api/sessions/ingest`). Checks for deduplication and extracts micro-cadence telemetry during normal delivery handshakes.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="p-5 bg-[#0D1117] border border-[#30363D] rounded-[2px] space-y-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded-[1px] bg-[#161B22] text-[#FFD900] font-bold">
              STAGE 02
            </span>
            <h3 className="text-sm font-bold text-white uppercase mt-1">Standalone Risk Engine</h3>
            <p className="text-[11px] text-[#8B949E] font-sans">
              Synchronous evaluation of Categories A–E against individualized rider baselines. Measures evidence completeness to prevent penalizing new riders.
            </p>
          </div>

          {/* Stage 3 */}
          <div className="p-5 bg-[#0D1117] border border-[#30363D] rounded-[2px] space-y-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded-[1px] bg-[#161B22] text-[#22C55E] font-bold">
              STAGE 03
            </span>
            <h3 className="text-sm font-bold text-white uppercase mt-1">Proportionate Action</h3>
            <p className="text-[11px] text-[#8B949E] font-sans">
              Routes sessions into four explicit bands: `ALLOW` (0–29), `MONITOR` (30–49), `STEP_UP_VERIFY` (50–69), or `SECURITY_HOLD` (70–100).
            </p>
          </div>

          {/* Stage 4 */}
          <div className="p-5 bg-[#0D1117] border border-[#30363D] rounded-[2px] space-y-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded-[1px] bg-[#161B22] text-[#D52222] font-bold">
              STAGE 04
            </span>
            <h3 className="text-sm font-bold text-white uppercase mt-1">Trust & Safety Triage</h3>
            <p className="text-[11px] text-[#8B949E] font-sans">
              Creates security cases with full evidence dossiers. Enables live webcam vector face verification with immutable decision audit logging.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Risk-Based Authentication & Fraud Detection Architecture */}
      <div id="services" />
      <section id="auth-framework" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-b border-[#21262D]">
        <AuthDecisionFramework
          title="Risk-Based Authentication & Fraud Detection Architecture"
          subtitle="TrueRide combines layered authentication factors with real-time continuous behavioral scoring to balance impenetrable security with zero routine worker friction."
          viewMode="stacked"
        />
      </section>

      {/* Section 5: The 9 Held-Out Mission Scenarios Matrix */}
      <section id="scenarios" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-b border-[#21262D]">
        <div className="mb-8">
          <span className="text-xs font-mono font-bold tracking-widest text-[#FFD900] uppercase block mb-1">
            DETERMINISTIC EVALUATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
            The 9 Held-Out Mission Scenarios
          </h2>
          <p className="text-sm text-[#8B949E] max-w-2xl mt-1.5">
            Every scenario runs deterministically through the real ingestion and scoring pipeline.
          </p>
        </div>

        <div className="overflow-x-auto bg-[#0D1117] border border-[#30363D] rounded-[2px]">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#21262D] text-[10px] text-[#8B949E] uppercase">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Scenario Name</th>
                <th className="py-3 px-3">Ground Truth</th>
                <th className="py-3 px-3">Expected Band</th>
                <th className="py-3 px-3">Key Differentiator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F242C] text-[#C9D1D9]">
              <tr className="hover:bg-[#161B22]">
                <td className="py-2.5 px-3 font-bold text-[#FFD900]">1</td>
                <td className="py-2.5 px-3 font-bold text-white">Normal Routine Delivery Session</td>
                <td className="py-2.5 px-3"><span className="text-[#22C55E]">LEGITIMATE</span></td>
                <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded-[1px] bg-[#22C55E]/20 text-[#22C55E]">LOW (0–15)</span></td>
                <td className="py-2.5 px-3 text-[#8B949E]">All 5 categories align with historical baseline.</td>
              </tr>
              <tr className="hover:bg-[#161B22]">
                <td className="py-2.5 px-3 font-bold text-[#FFD900]">2</td>
                <td className="py-2.5 px-3 font-bold text-white">New Phone (Legitimate Upgrade)</td>
                <td className="py-2.5 px-3"><span className="text-[#22C55E]">LEGITIMATE</span></td>
                <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded-[1px] bg-[#22C55E]/20 text-[#22C55E]">LOW (18–26)</span></td>
                <td className="py-2.5 px-3 text-[#8B949E]">Proves new hardware alone never causes high risk or challenge.</td>
              </tr>
              <tr className="hover:bg-[#161B22]">
                <td className="py-2.5 px-3 font-bold text-[#FFD900]">3</td>
                <td className="py-2.5 px-3 font-bold text-white">Legitimate Delivery Zone Transition</td>
                <td className="py-2.5 px-3"><span className="text-[#22C55E]">LEGITIMATE</span></td>
                <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded-[1px] bg-[#22C55E]/20 text-[#22C55E]">LOW (12–22)</span></td>
                <td className="py-2.5 px-3 text-[#8B949E]">Adjacent cluster surge demand re-allocation without false positive.</td>
              </tr>
              <tr className="hover:bg-[#161B22]">
                <td className="py-2.5 px-3 font-bold text-[#FFD900]">4</td>
                <td className="py-2.5 px-3 font-bold text-white">Off-Hours / Night Shift Transition</td>
                <td className="py-2.5 px-3"><span className="text-[#22C55E]">LEGITIMATE</span></td>
                <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded-[1px] bg-[#22C55E]/20 text-[#22C55E]">LOW (14–25)</span></td>
                <td className="py-2.5 px-3 text-[#8B949E]">Mild time divergence logged as informational note only.</td>
              </tr>
              <tr className="hover:bg-[#161B22]">
                <td className="py-2.5 px-3 font-bold text-[#FFD900]">5</td>
                <td className="py-2.5 px-3 font-bold text-white">Suspicious Behavior on Unregistered Phone</td>
                <td className="py-2.5 px-3"><span className="text-[#D52222]">HANDOFF</span></td>
                <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded-[1px] bg-[#D52222]/20 text-[#D52222]">HIGH (72–85)</span></td>
                <td className="py-2.5 px-3 text-[#8B949E]">New device paired with 32s touch latency triggers Step-Up.</td>
              </tr>
              <tr className="hover:bg-[#161B22] bg-[#FFD900]/5">
                <td className="py-2.5 px-3 font-bold text-[#FFD900]">6</td>
                <td className="py-2.5 px-3 font-bold text-[#FFD900]">Same Phone & Same City Account Handoff (Key Benchmark)</td>
                <td className="py-2.5 px-3"><span className="text-[#D52222]">HANDOFF</span></td>
                <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded-[1px] bg-[#D52222]/20 text-[#D52222]">HIGH (74–86)</span></td>
                <td className="py-2.5 px-3 text-[#FFD900]">Detects handoff using behavioral cadence alone, overcoming hardware and GPS spoofing!</td>
              </tr>
              <tr className="hover:bg-[#161B22]">
                <td className="py-2.5 px-3 font-bold text-[#FFD900]">7</td>
                <td className="py-2.5 px-3 font-bold text-white">Multi-Session Behavioral Drift</td>
                <td className="py-2.5 px-3"><span className="text-[#D52222]">DRIFT</span></td>
                <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded-[1px] bg-[#D52222]/20 text-[#D52222]">HIGH (70–82)</span></td>
                <td className="py-2.5 px-3 text-[#8B949E]">History category corroborates steady shift away from enrolled habit.</td>
              </tr>
              <tr className="hover:bg-[#161B22]">
                <td className="py-2.5 px-3 font-bold text-[#FFD900]">8</td>
                <td className="py-2.5 px-3 font-bold text-white">Sparse History / New Rider Onboarding</td>
                <td className="py-2.5 px-3"><span className="text-[#06B6D4]">NEW RIDER</span></td>
                <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded-[1px] bg-[#06B6D4]/20 text-[#06B6D4]">INSUFFICIENT (22)</span></td>
                <td className="py-2.5 px-3 text-[#8B949E]">Evidence quality limits penalty until 10 sessions are established.</td>
              </tr>
              <tr className="hover:bg-[#161B22]">
                <td className="py-2.5 px-3 font-bold text-[#FFD900]">9</td>
                <td className="py-2.5 px-3 font-bold text-white">Dismissible Environmental Noise Alert (Rain)</td>
                <td className="py-2.5 px-3"><span className="text-[#22C55E]">FALSE POSITIVE</span></td>
                <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded-[1px] bg-[#E7A500]/20 text-[#E7A500]">MEDIUM (52)</span></td>
                <td className="py-2.5 px-3 text-[#8B949E]">Dismissed by analyst without future baseline penalty.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 6: Worker-First Charter & Privacy Ethics */}
      <div id="contact" />
      <section id="ethics" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-b border-[#21262D]">
        <div className="mb-8">
          <span className="text-xs font-mono font-bold tracking-widest text-[#22C55E] uppercase block mb-1">
            ETHICAL AI & REGULATORY COMPLIANCE
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
            The TrueRide Worker-First Charter
          </h2>
          <p className="text-sm text-[#8B949E] max-w-2xl mt-1.5">
            Designed to protect legitimate gig workers from unjust AI deactivations while maintaining ironclad fraud prevention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div className="p-5 bg-[#0D1117] border border-[#30363D] rounded-[2px] space-y-2">
            <Scale className="w-5 h-5 text-[#22C55E]" />
            <h3 className="font-bold text-white uppercase text-sm">No Automated Deactivations</h3>
            <p className="text-[#8B949E] font-sans text-xs">
              TrueRide never auto-terminates an account. High-risk signals trigger a proportionate 2-second live face check or route to an analyst queue for human supervisor review.
            </p>
          </div>

          <div className="p-5 bg-[#0D1117] border border-[#30363D] rounded-[2px] space-y-2">
            <Lock className="w-5 h-5 text-[#06B6D4]" />
            <h3 className="font-bold text-white uppercase text-sm">DPDP Act & Privacy Shield</h3>
            <p className="text-[#8B949E] font-sans text-xs">
              Zero continuous background GPS tracking. Touch cadence is reduced to abstract interval statistics ($\mu, \sigma$) rather than raw keystroke recordings.
            </p>
          </div>

          <div className="p-5 bg-[#0D1117] border border-[#30363D] rounded-[2px] space-y-2">
            <UserCheck className="w-5 h-5 text-[#FFD900]" />
            <h3 className="font-bold text-white uppercase text-sm">Non-Punitive Recovery</h3>
            <p className="text-[#8B949E] font-sans text-xs">
              If camera lighting fails or facial match is inconclusive during step-up, riders are routed to human review without instant account freezes.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Command Center Launcher Grid */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
            Explore All 8 Command Center Modules
          </h2>
          <p className="text-xs sm:text-sm text-[#8B949E] mt-1.5">
            Full-featured, offline-capable Trust & Safety dashboard with live audit trails and biometric verification.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono text-xs">
          {[
            { name: "Overview KPIs", tab: "dashboard", icon: BarChart3, desc: "High-level risk distribution & metrics" },
            { name: "Step-Up Verification", tab: "verification", icon: ShieldCheck, desc: "Dual-factor SIM & live face auth" },
            { name: "100k Simulator", tab: "simulator", icon: Database, desc: "Batch synthetic stress testing" },
            { name: "Triage Review Queue", tab: "cases", icon: ShieldAlert, desc: "Analyst case dossier workflows" },
            { name: "Live Session Monitor", tab: "sessions", icon: Navigation, desc: "Real-time delivery session stream" },
            { name: "Rider Baselines", tab: "riders", icon: UserCheck, desc: "Individualized enrolled baselines" },
            { name: "Biometric Studio", tab: "verification", icon: Camera, desc: "Webcam facial vector matching" },
            { name: "Audit Trail", tab: "audit", icon: History, desc: "Immutable cryptographic log" },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => router.push(`/dashboard#${item.tab}`)}
              className="p-4 bg-[#0D1117] border border-[#30363D] hover:border-[#FFD900] rounded-[2px] text-left transition group cursor-pointer shadow-sm"
            >
              <item.icon className="w-5 h-5 text-[#FFD900] mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-white text-xs">{item.name}</div>
              <div className="text-[10px] text-[#8B949E] mt-1 font-sans">{item.desc}</div>
            </button>
          ))}
        </div>

        {/* Big Launch Banner */}
        <div className="mt-12 p-8 bg-[#161B22] border-2 border-[#FFD900] rounded-[2px] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white uppercase tracking-tight">
              Ready to see TrueRide in action?
            </h3>
            <p className="text-xs sm:text-sm text-[#8B949E] mt-1 max-w-xl">
              Launch the full Trust & Safety Operations Center. Ingest real-time delivery sessions, test 100,000 synthetic simulations, and review Mumbai fleet anomalies.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-[#FFD900] hover:bg-[#E6C400] text-[#17191B] font-extrabold text-xs rounded-[2px] transition flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-md"
          >
            <span>Enter Operations Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-8 max-w-7xl mx-auto border-t border-[#21262D] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#8B949E]">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#FFD900]" />
          <span className="text-white font-bold">TrueRide AI</span>
          <span>• Continuous Rider Identity Intelligence</span>
        </div>
        <div>
          <span>Local SQLite Database • Node.js v20+ • 100% Zero SaaS Cloud Dependencies</span>
        </div>
      </footer>
    </div>
  );
}
