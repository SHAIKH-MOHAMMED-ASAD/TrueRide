"use client";

import React, { useState } from "react";
import {
  X,
  ShieldAlert,
  PlusCircle,
  AlertTriangle,
  User,
  Sparkles,
  FileText,
  Send,
  Zap,
  CheckCircle,
} from "lucide-react";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (createdCase: any) => void;
}

const SAMPLE_COURIERS = [
  { id: "r_0042", name: "Sanjay Verma", zone: "Bandra Kurla Complex (BKC)", city: "Mumbai" },
  { id: "r_0053", name: "Rahul Sharma", zone: "Andheri East Logistics Hub", city: "Mumbai" },
  { id: "r_0019", name: "Vikram Malhotra", zone: "Dadar Central Corridor", city: "Mumbai" },
  { id: "RDR-8021", name: "Arjun Kumar", zone: "Koramangala 4th Block", city: "Bengaluru" },
  { id: "RDR-2041", name: "Priya Sharma", zone: "Indiranagar 100ft Road", city: "Bengaluru" },
];

const TEMPLATES = [
  {
    label: "SIM Swap Anomaly",
    title: "Carrier SIM Swap & IMSI Mismatch Detected",
    notes: "Carrier gateway flagged SIM ICCID change 38 minutes prior to dispatch session. Secondary IMEI signature deviation.",
    priority: "HIGH",
    status: "VERIFICATION_REQUIRED",
    riskScore: 88,
  },
  {
    label: "Account Rental / Sharing",
    title: "Motor Cadence Collapse & Account Sharing Signature",
    notes: "Touch interval pacing collapsed 3.4 standard deviations from enrolled baseline. Dual session active in adjacent zone.",
    priority: "CRITICAL",
    status: "NEW_ALERT",
    riskScore: 94,
  },
  {
    label: "Speed / Teleportation",
    title: "Impossible Velocity & Teleportation Vector",
    notes: "Bicycle profile recorded transit velocity of 118 km/h across 4.2 km corridor without intermediate cellular handshakes.",
    priority: "HIGH",
    status: "UNDER_INVESTIGATION",
    riskScore: 82,
  },
  {
    label: "Facial Match Failure",
    title: "Biometric Liveness Step-Up Failure",
    notes: "Real-time webcam verification yielded cosine similarity 0.381, below acceptance threshold (0.75). Potential unauthorized operator.",
    priority: "CRITICAL",
    status: "UNDER_INVESTIGATION",
    riskScore: 96,
  },
];

export function CreateCaseModal({
  isOpen,
  onClose,
  onCaseCreated,
}: CreateCaseModalProps) {
  const [selectedCourierOption, setSelectedCourierOption] = useState("r_0042");
  const [customRiderId, setCustomRiderId] = useState("");
  const [riderName, setRiderName] = useState("Sanjay Verma");
  const [priority, setPriority] = useState<string>("HIGH");
  const [status, setStatus] = useState<string>("NEW_ALERT");
  const [assignedReviewer, setAssignedReviewer] = useState("T&S Senior Analyst (Demo)");
  const [title, setTitle] = useState("SIM Swap & Device Discrepancy Flagged");
  const [notes, setNotes] = useState(
    "SIM IMSI change detected by carrier API. Behavioral touch interval deviated by 89% from baseline."
  );
  const [riskScore, setRiskScore] = useState<number>(88);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCourierSelect = (val: string) => {
    setSelectedCourierOption(val);
    if (val !== "CUSTOM") {
      const match = SAMPLE_COURIERS.find((c) => c.id === val);
      if (match) {
        setRiderName(match.name);
      }
    } else {
      setRiderName("");
    }
  };

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setTitle(tmpl.title);
    setNotes(tmpl.notes);
    setPriority(tmpl.priority);
    setStatus(tmpl.status);
    setRiskScore(tmpl.riskScore);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const riderId =
      selectedCourierOption === "CUSTOM"
        ? customRiderId.trim()
        : selectedCourierOption;

    if (!riderId) {
      setError("Please provide a valid Rider ID.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a case incident title.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderId,
          riderName: riderName.trim() || undefined,
          priority,
          status,
          assignedReviewer,
          title,
          notes,
          riskScore: Number(riskScore),
          actor: assignedReviewer || "ANALYST",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create security case");
      }

      onCaseCreated(data.case);
      onClose();
    } catch (err: any) {
      console.error("Create case error:", err);
      setError(err.message || "Failed to create case.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#070C18] border border-[#1E293B] rounded-[2px] shadow-2xl max-w-2xl w-full text-white font-mono text-xs overflow-hidden my-auto animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0D1117] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#D52222]/20 border border-[#D52222]/50 flex items-center justify-center text-[#EF4444]">
              <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-[#FFD900] uppercase">
                  MANUAL TRIAGE ESCALATION
                </span>
                <span className="text-[#64748B]">•</span>
                <span className="text-[10px] text-[#94A3B8] uppercase">
                  Audited Security Record
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-tight font-sans">
                Open New Security Investigation Case
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[2px] bg-[#161B22] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#3F0E0E] border border-[#EF4444] text-[#FCA5A5] rounded-[2px] flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Threat Templates */}
          <div>
            <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FFD900]" />
              <span>Quick Incident Templates:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-2 rounded-[2px] bg-[#161B22] hover:bg-[#1E293B] border border-[#30363D] hover:border-[#FFD900] text-[10px] text-left transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="font-bold text-white truncate">{tmpl.label}</div>
                  <div className="text-[9px] text-[#94A3B8] mt-1 flex items-center justify-between">
                    <span>{tmpl.priority}</span>
                    <span className="text-[#FFD900]">{tmpl.riskScore} score</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Rider Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">
                Select Courier / Rider ID:
              </label>
              <select
                value={selectedCourierOption}
                onChange={(e) => handleCourierSelect(e.target.value)}
                className="w-full p-2 bg-[#0D1117] border border-[#30363D] rounded-[2px] text-xs text-white focus:outline-none focus:border-[#06B6D4]"
              >
                {SAMPLE_COURIERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id}) - {c.city}
                  </option>
                ))}
                <option value="CUSTOM">+ Enter Custom Rider ID</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">
                {selectedCourierOption === "CUSTOM" ? "Custom Rider ID & Name:" : "Courier Full Name:"}
              </label>
              {selectedCourierOption === "CUSTOM" ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="Rider ID (e.g. RDR-9041)"
                    value={customRiderId}
                    onChange={(e) => setCustomRiderId(e.target.value)}
                    className="p-2 bg-[#0D1117] border border-[#30363D] rounded-[2px] text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    className="p-2 bg-[#0D1117] border border-[#30363D] rounded-[2px] text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  className="w-full p-2 bg-[#0D1117] border border-[#30363D] rounded-[2px] text-xs text-white focus:outline-none focus:border-[#06B6D4]"
                />
              )}
            </div>
          </div>

          {/* Priority & Status & Reviewer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">
                Priority Level:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 bg-[#0D1117] border border-[#30363D] rounded-[2px] text-xs text-white focus:outline-none focus:border-[#FFD900]"
              >
                <option value="CRITICAL">CRITICAL (L3)</option>
                <option value="HIGH">HIGH (L2)</option>
                <option value="MEDIUM">MEDIUM (L1)</option>
                <option value="LOW">LOW (L0)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">
                Initial Case Status:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 bg-[#0D1117] border border-[#30363D] rounded-[2px] text-xs text-white focus:outline-none focus:border-[#06B6D4]"
              >
                <option value="NEW_ALERT">NEW_ALERT</option>
                <option value="VERIFICATION_REQUIRED">VERIFICATION_REQUIRED</option>
                <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
                <option value="MONITORING">MONITORING</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">
                Assigned Reviewer:
              </label>
              <input
                type="text"
                value={assignedReviewer}
                onChange={(e) => setAssignedReviewer(e.target.value)}
                className="w-full p-2 bg-[#0D1117] border border-[#30363D] rounded-[2px] text-xs text-white focus:outline-none focus:border-[#06B6D4]"
              />
            </div>
          </div>

          {/* Risk Score Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase font-bold text-[#94A3B8] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFD900]" />
                <span>Assessed Threat Score (0–100):</span>
              </label>
              <span className="font-bold text-[#FFD900] text-xs px-2 py-0.5 rounded-[1px] bg-[#161B22] border border-[#30363D]">
                {riskScore} / 100
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={99}
              value={riskScore}
              onChange={(e) => setRiskScore(Number(e.target.value))}
              className="w-full accent-[#FFD900] cursor-pointer"
            />
          </div>

          {/* Incident Title */}
          <div>
            <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">
              Incident Summary / Primary Threat Reason:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SIM Swap Detected, Motor Cadence Divergence, Speed Anomaly"
              className="w-full p-2 bg-[#0D1117] border border-[#30363D] rounded-[2px] text-xs text-white focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          {/* Investigative Evidence Notes */}
          <div>
            <label className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">
              Investigation Notes &amp; Corroborated Findings:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter detailed telemetry discrepancy, zone violation, or phone change evidence..."
              className="w-full p-2 bg-[#0D1117] border border-[#30363D] rounded-[2px] text-xs text-white focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between gap-3">
            <span className="text-[10px] text-[#64748B] hidden sm:inline">
              Generates case number and appends to immutable audit trail.
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-3.5 py-2 rounded-[2px] bg-[#161B22] hover:bg-[#1E293B] border border-[#30363D] text-[#94A3B8] hover:text-white transition cursor-pointer text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-[2px] bg-[#FFD900] hover:bg-[#E6C300] text-[#070C18] font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#FFD900]/20"
              >
                {submitting ? (
                  <span>Recording Case &amp; Audit...</span>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5 text-[#070C18]" />
                    <span>Create Case &amp; Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
