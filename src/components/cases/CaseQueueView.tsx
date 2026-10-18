"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  RefreshCw,
  PlusCircle,
  Sliders,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { RiskBadge, ActionBadge } from "../common/RiskBadge";
import { CaseDetailModal } from "./CaseDetailModal";
import { CreateCaseModal } from "./CreateCaseModal";

interface CaseQueueViewProps {
  initialCaseId?: string | null;
  onRefreshMetrics?: () => void;
}

export function CaseQueueView({
  initialCaseId,
  onRefreshMetrics,
}: CaseQueueViewProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    initialCaseId || null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [updatingCaseId, setUpdatingCaseId] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/cases?${params.toString()}`);
      const data = await res.json();
      setCases(data.cases || []);
    } catch (err) {
      console.error("Failed to fetch cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  const handleQuickStatusUpdate = async (caseId: string, newStatus: string) => {
    try {
      setUpdatingCaseId(caseId);
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          actor: "T&S Analyst (Demo)",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update case");

      // Optimistically update case status in list
      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
      );
      if (onRefreshMetrics) onRefreshMetrics();
    } catch (err) {
      console.error("Error updating case status:", err);
    } finally {
      setUpdatingCaseId(null);
    }
  };

  const handleExportCasesCsv = () => {
    const headers = [
      "caseNumber",
      "riderId",
      "priority",
      "status",
      "riskScore",
      "assignedReviewer",
      "createdAt",
      "notes",
    ];
    const rows = cases.map((c) => [
      c.caseNumber,
      c.riderId,
      c.priority,
      c.status,
      c.assessment?.overallScore ?? "",
      `"${(c.assignedReviewer || "").replace(/"/g, '""')}"`,
      `"${c.createdAt}"`,
      `"${(c.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trueride_cases_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW_ALERT":
        return (
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#FCE5E3] text-[#D52222] border border-[#D52222]/40 font-bold whitespace-nowrap">
            NEW ALERT
          </span>
        );
      case "VERIFICATION_REQUIRED":
        return (
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#FFF5D6] text-[#E7A500] border border-[#E7A500]/40 font-bold whitespace-nowrap">
            VERIFY REQUIRED
          </span>
        );
      case "UNDER_INVESTIGATION":
        return (
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#F1F0ED] text-[#17191B] border border-[#D9D6CD] font-bold whitespace-nowrap">
            INVESTIGATION
          </span>
        );
      case "MONITORING":
        return (
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#F1F0ED] text-[#5D6266] border border-[#D9D6CD] whitespace-nowrap">
            MONITORING
          </span>
        );
      case "VERIFIED_LEGITIMATE":
        return (
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#E8F4E8] text-[#24813A] border border-[#24813A]/40 font-bold whitespace-nowrap">
            LEGITIMATE
          </span>
        );
      case "CONFIRMED_ACCOUNT_HANDOFF":
        return (
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#FCE5E3] text-[#D52222] border border-[#D52222]/50 font-bold whitespace-nowrap">
            CONFIRMED HANDOFF
          </span>
        );
      case "DISMISSED_ALERT":
        return (
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#F1F0ED] text-[#8B8D8C] border border-[#D9D6CD] whitespace-nowrap">
            DISMISSED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono bg-[#F1F0ED] text-[#5D6266] border border-[#D9D6CD] whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#D52222] uppercase">
              TRIAGE &amp; INVESTIGATION
            </span>
            <span className="text-[#8B8D8C] text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-[#5D6266]">
              {cases.length} TOTAL CASES IN QUEUE
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#17191B] tracking-tight flex items-center gap-2 mt-1 uppercase">
            <ShieldAlert className="w-5 h-5 text-[#D52222]" />
            Security Investigation Queue
          </h1>
          <p className="text-xs text-[#5D6266] mt-0.5">
            Triage, investigate, and record auditable decisions for anomalous sessions flagged by the TrueRide continuous identity-risk engine.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[2px] text-xs font-mono font-bold text-[#070C18] bg-[#FFD900] hover:bg-[#E6C300] border border-[#FFD900] transition cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#070C18]" />
            <span>New Case</span>
          </button>
          <button
            type="button"
            onClick={handleExportCasesCsv}
            disabled={cases.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold text-[#24813A] bg-[#FFFFFF] hover:bg-[#F1F0ED] border border-[#D9D6CD] transition cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#24813A]" />
            <span>Export (CSV)</span>
          </button>
          <button
            type="button"
            onClick={fetchCases}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold text-[#17191B] bg-[#F1F0ED] hover:bg-[#D9D6CD] border border-[#D9D6CD] transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#17191B]" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Status Tabs */}
          {[
            { id: "ALL", label: "All Cases" },
            { id: "NEW_ALERT", label: "New Alerts" },
            { id: "VERIFICATION_REQUIRED", label: "Verify Required" },
            { id: "UNDER_INVESTIGATION", label: "Under Investigation" },
            { id: "VERIFIED_LEGITIMATE", label: "Legitimate" },
            { id: "CONFIRMED_ACCOUNT_HANDOFF", label: "Confirmed Handoffs" },
            { id: "DISMISSED_ALERT", label: "Dismissed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded-[2px] font-mono text-xs font-semibold transition cursor-pointer border ${
                statusFilter === tab.id
                  ? "bg-[#FFD900] text-[#17191B] border-[#FFD900] font-bold shadow-xs"
                  : "text-[#5D6266] hover:bg-[#F1F0ED] border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8B8D8C]" />
          <input
            type="text"
            placeholder="Search Case, Rider ID, or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] text-xs text-[#17191B] placeholder-[#8B8D8C] focus:outline-none focus:border-[#17191B] w-64 font-mono"
          />
        </form>
      </div>

      {/* Cases Table */}
      <div className="rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1F0ED] text-[#5D6266] font-mono uppercase text-[11px] tracking-wider border-b border-[#D9D6CD]">
              <tr>
                <th className="py-3 px-4">Case #</th>
                <th className="py-3 px-4">Rider</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Investigation Status (Quick Update)</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Recommendation</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Inspect / Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D6CD]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B8D8C] font-mono">
                    Loading queue records...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B8D8C] font-mono">
                    No security cases found matching criteria.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-[#F7F7F5] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#17191B]">
                      {c.caseNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#17191B]">
                        {c.rider?.name || c.riderId}
                      </div>
                      <div className="text-[10px] font-mono text-[#5D6266]">
                        {c.riderId} • {c.rider?.city}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {c.assessment && (
                        <RiskBadge
                          score={c.assessment.overallScore}
                          level={c.assessment.riskLevel}
                          size="sm"
                        />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getStatusBadge(c.status)}
                        <select
                          value={c.status}
                          disabled={updatingCaseId === c.id}
                          onChange={(e) => handleQuickStatusUpdate(c.id, e.target.value)}
                          title="Quick update status (persists to DB & emits audit event)"
                          className="text-[10px] font-mono py-0.5 px-1 bg-[#F1F0ED] hover:bg-[#E5E5E2] border border-[#D9D6CD] rounded-[1px] text-[#17191B] cursor-pointer"
                        >
                          <option value="NEW_ALERT">NEW_ALERT</option>
                          <option value="VERIFICATION_REQUIRED">VERIFY REQUIRED</option>
                          <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
                          <option value="MONITORING">MONITORING</option>
                          <option value="VERIFIED_LEGITIMATE">LEGITIMATE</option>
                          <option value="CONFIRMED_ACCOUNT_HANDOFF">CONFIRMED HANDOFF</option>
                          <option value="DISMISSED_ALERT">DISMISSED</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-[1px] border ${
                          c.priority === "CRITICAL"
                            ? "bg-[#FCE5E3] text-[#D52222] border-[#D52222]/30"
                            : c.priority === "HIGH"
                            ? "bg-[#FFF5D6] text-[#E7A500] border-[#E7A500]/30"
                            : "bg-[#F1F0ED] text-[#5D6266] border-[#D9D6CD]"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.assessment && (
                        <ActionBadge action={c.assessment.recommendedAction} />
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#5D6266] font-mono text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCaseId(c.id)}
                        className="px-3 py-1 rounded-[2px] bg-[#F1F0ED] hover:bg-[#D9D6CD] text-[#17191B] font-mono text-xs font-bold flex items-center gap-1 border border-[#D9D6CD] ml-auto cursor-pointer transition shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#17191B]" />
                        <span>Inspect / Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Case Modal */}
      {isCreateModalOpen && (
        <CreateCaseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCaseCreated={() => {
            fetchCases();
            if (onRefreshMetrics) onRefreshMetrics();
          }}
        />
      )}

      {/* Case Detail & Update Modal */}
      {selectedCaseId && (
        <CaseDetailModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onDecisionRecorded={() => {
            fetchCases();
            if (onRefreshMetrics) onRefreshMetrics();
          }}
        />
      )}
    </div>
  );
}
