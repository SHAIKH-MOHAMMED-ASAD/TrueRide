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
  Camera,
  XCircle,
  FileCheck,
} from "lucide-react";
import { RiskBadge, ActionBadge } from "../common/RiskBadge";
import { CaseDetailModal } from "./CaseDetailModal";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW_ALERT":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800 font-bold animate-pulse">
            NEW ALERT
          </span>
        );
      case "VERIFICATION_REQUIRED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
            VERIFY REQUIRED
          </span>
        );
      case "UNDER_INVESTIGATION":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
            UNDER INVESTIGATION
          </span>
        );
      case "MONITORING":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
            MONITORING
          </span>
        );
      case "VERIFIED_LEGITIMATE":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
            LEGITIMATE
          </span>
        );
      case "CONFIRMED_ACCOUNT_HANDOFF":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-700 font-bold">
            CONFIRMED HANDOFF
          </span>
        );
      case "DISMISSED_ALERT":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
            DISMISSED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0c162c] border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Security Investigation Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Triage, investigate, and record auditable decisions for anomalous sessions flagged by the TrueRide risk engine.
          </p>
        </div>

        <button
          onClick={fetchCases}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 border border-slate-700 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#0c162c] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          {[
            { id: "ALL", label: "All Cases" },
            { id: "NEW_ALERT", label: "New Alerts" },
            { id: "VERIFICATION_REQUIRED", label: "Verification Required" },
            { id: "UNDER_INVESTIGATION", label: "Under Investigation" },
            { id: "VERIFIED_LEGITIMATE", label: "Legitimate" },
            { id: "CONFIRMED_ACCOUNT_HANDOFF", label: "Confirmed Handoffs" },
            { id: "DISMISSED_ALERT", label: "Dismissed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Case, Rider ID, or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
          />
        </form>
      </div>

      {/* Cases Table */}
      <div className="rounded-2xl bg-[#0c162c] border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Case #</th>
                <th className="py-3 px-4">Rider</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Recommendation</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    Loading queue records...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No security cases found matching criteria.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {c.caseNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">
                        {c.rider?.name || c.riderId}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
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
                    <td className="py-3 px-4">{getStatusBadge(c.status)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono text-[10px] font-semibold ${
                          c.priority === "CRITICAL"
                            ? "text-rose-400"
                            : c.priority === "HIGH"
                            ? "text-amber-400"
                            : "text-slate-400"
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
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
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
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs flex items-center gap-1 border border-slate-700 ml-auto cursor-pointer transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Detail Modal */}
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
