"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  User,
  Sliders,
} from "lucide-react";

export function AuditLogView() {
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (eventTypeFilter !== "ALL") params.append("eventType", eventTypeFilter);
      params.append("limit", "100");

      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();
      setAuditEvents(data.auditEvents || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [eventTypeFilter]);

  const getActorBadge = (actor: string) => {
    if (actor === "RISK_ENGINE") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
          RISK ENGINE
        </span>
      );
    }
    if (actor === "SIMULATOR") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
          SIMULATOR
        </span>
      );
    }
    if (actor === "SYSTEM_INGESTION") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
          INGESTION API
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
        {actor}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0c162c] border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Immutable Security Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete cryptographic audit log recording every session ingestion, scoring assessment, analyst decision, and verification outcome.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-xl bg-[#0c162c] border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
        {[
          { id: "ALL", label: "All Audit Events" },
          { id: "CASE_DECISION_RECORDED", label: "Analyst Decisions" },
          { id: "CASE_CREATED", label: "Cases Created" },
          { id: "VERIFICATION_COMPLETED", label: "Verifications" },
          { id: "SESSION_INGESTED", label: "Session Ingestion" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setEventTypeFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-mono font-medium transition cursor-pointer ${
              eventTypeFilter === tab.id
                ? "bg-slate-800 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:bg-slate-800/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audit Events List */}
      <div className="rounded-2xl bg-[#0c162c] border border-slate-800 overflow-hidden shadow-lg">
        <div className="divide-y divide-slate-800/60">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              Loading audit events...
            </div>
          ) : auditEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No audit records found.
            </div>
          ) : (
            auditEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-4 hover:bg-slate-800/30 transition text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getActorBadge(evt.actor)}
                    <span className="font-mono text-[10px] text-slate-500">
                      • {evt.eventType}
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium text-xs">
                    {evt.summary}
                  </p>
                  {evt.details && (
                    <p className="text-[11px] font-mono text-slate-400 truncate max-w-2xl">
                      {evt.details}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0 font-mono text-[11px] text-slate-500">
                  {new Date(evt.timestamp).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
