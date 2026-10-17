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
        <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-bold bg-[#F1F0ED] text-[#17191B] border border-[#D9D6CD]">
          RISK ENGINE
        </span>
      );
    }
    if (actor === "SIMULATOR") {
      return (
        <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-bold bg-[#FFF5D6] text-[#E7A500] border border-[#E7A500]/40">
          SIMULATOR
        </span>
      );
    }
    if (actor === "SYSTEM_INGESTION") {
      return (
        <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-bold bg-[#F1F0ED] text-[#5D6266] border border-[#D9D6CD]">
          INGESTION API
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-bold bg-[#E8F4E8] text-[#24813A] border border-[#24813A]/30">
        {actor}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#17191B] uppercase">
              COMPLIANCE & TRACEABILITY
            </span>
            <span className="text-[#8B8D8C] text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-[#24813A] font-bold">
              TAMPER-EVIDENT JOURNAL
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#17191B] tracking-tight flex items-center gap-2 mt-1 uppercase">
            <FileText className="w-5 h-5 text-[#17191B]" />
            Immutable Security Audit Trail
          </h1>
          <p className="text-xs text-[#5D6266] mt-0.5">
            Complete cryptographic audit log recording every session ingestion, scoring assessment, analyst decision, and verification outcome.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold text-[#17191B] bg-[#F1F0ED] hover:bg-[#D9D6CD] border border-[#D9D6CD] transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#17191B]" : ""}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] flex flex-wrap items-center gap-1.5 text-xs shadow-xs">
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
            className={`px-3 py-1 rounded-[2px] font-mono text-xs font-semibold transition cursor-pointer border ${
              eventTypeFilter === tab.id
                ? "bg-[#FFD900] text-[#17191B] border-[#FFD900] font-bold shadow-xs"
                : "text-[#5D6266] hover:bg-[#F1F0ED] border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audit Events List */}
      <div className="rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] overflow-hidden shadow-xs">
        <div className="divide-y divide-[#D9D6CD]">
          {loading ? (
            <div className="py-12 text-center text-[#8B8D8C] font-mono text-xs">
              Loading audit events...
            </div>
          ) : auditEvents.length === 0 ? (
            <div className="py-12 text-center text-[#8B8D8C] text-xs font-mono">
              No audit records found.
            </div>
          ) : (
            auditEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-4 hover:bg-[#F7F7F5] transition text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {getActorBadge(evt.actor)}
                    <span className="font-mono text-[10px] text-[#5D6266]">
                      • {evt.eventType}
                    </span>
                  </div>

                  <p className="text-[#17191B] font-medium leading-relaxed">
                    {evt.details}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#8B8D8C] font-mono pt-0.5">
                    {evt.entityType && (
                      <span>
                        Entity: <strong className="text-[#5D6266]">{evt.entityType}</strong>
                      </span>
                    )}
                    {evt.entityId && (
                      <span>
                        ID: <strong className="text-[#5D6266]">{evt.entityId}</strong>
                      </span>
                    )}
                    <span>
                      Trace ID: <strong className="text-[#5D6266]">{evt.id}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono text-[11px] text-[#8B8D8C]">
                  <div>
                    {new Date(evt.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                  <div className="text-[10px] text-[#8B8D8C]">
                    {new Date(evt.timestamp).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
