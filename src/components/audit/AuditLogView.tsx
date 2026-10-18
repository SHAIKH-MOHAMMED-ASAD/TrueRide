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
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Edit,
} from "lucide-react";

export function AuditLogView() {
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({});

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

  const toggleExpand = (id: string) => {
    setExpandedEventIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  const getEventTypeBadge = (eventType: string) => {
    switch (eventType) {
      case "CASE_CREATED":
        return (
          <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-bold bg-[#06B6D4]/10 text-[#0891B2] border border-[#06B6D4]/40 flex items-center gap-1">
            <PlusCircle className="w-3 h-3 text-[#0891B2]" />
            <span>CASE CREATED</span>
          </span>
        );
      case "CASE_UPDATED":
        return (
          <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-bold bg-[#FFF5D6] text-[#B45309] border border-[#FFD900]/60 flex items-center gap-1">
            <Edit className="w-3 h-3 text-[#B45309]" />
            <span>CASE UPDATED</span>
          </span>
        );
      case "CASE_DECISION_RECORDED":
        return (
          <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-bold bg-[#E8F4E8] text-[#15803D] border border-[#10B981]/40 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-[#15803D]" />
            <span>DECISION RECORDED</span>
          </span>
        );
      case "VOICE_CHALLENGE_VERIFIED":
        return (
          <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-bold bg-[#E8F4E8] text-[#15803D] border border-[#10B981]/40 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-[#15803D]" />
            <span>VOICE VERIFIED</span>
          </span>
        );
      case "VOICE_SPOOF_DETECTED":
        return (
          <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#EF4444]/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-[#B91C1C]" />
            <span>VOICE SPOOF ALERT</span>
          </span>
        );
      case "VOICE_CHALLENGE_INCONCLUSIVE":
        return (
          <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-bold bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-[#B45309]" />
            <span>VOICE INCONCLUSIVE</span>
          </span>
        );
      case "VERIFICATION_COMPLETED":
        return (
          <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-bold bg-[#F3E8FF] text-[#7E22CE] border border-[#A855F7]/30">
            VERIFICATION
          </span>
        );
      case "SESSION_INGESTED":
        return (
          <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono text-[#5D6266] bg-[#F1F0ED] border border-[#D9D6CD]">
            SESSION INGESTION
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-[1px] text-[10px] font-mono text-[#5D6266] bg-[#F1F0ED] border border-[#D9D6CD]">
            {eventType}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#17191B] uppercase">
              COMPLIANCE &amp; TRACEABILITY
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
            Complete cryptographic audit log recording every session ingestion, case creation, case update, analyst decision, and biometric outcome.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold text-[#17191B] bg-[#F1F0ED] hover:bg-[#D9D6CD] border border-[#D9D6CD] transition cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#17191B]" : ""}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] flex flex-wrap items-center gap-1.5 text-xs shadow-xs">
        {[
          { id: "ALL", label: "All Audit Events" },
          { id: "CASE_CREATED", label: "Cases Created" },
          { id: "CASE_UPDATED", label: "Cases Updated" },
          { id: "CASE_DECISION_RECORDED", label: "Analyst Decisions" },
          { id: "VOICE_CHALLENGE_VERIFIED", label: "Voice Challenges" },
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
              No audit records found matching criteria.
            </div>
          ) : (
            auditEvents.map((evt) => {
              const isExpanded = !!expandedEventIds[evt.id];
              let parsedDetails: any = null;
              if (evt.details) {
                try {
                  parsedDetails = JSON.parse(evt.details);
                } catch {
                  parsedDetails = null;
                }
              }

              return (
                <div
                  key={evt.id}
                  className="p-4 hover:bg-[#F7F7F5] transition text-xs flex flex-col space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActorBadge(evt.actor)}
                      {getEventTypeBadge(evt.eventType)}
                      <span className="font-mono text-[10px] text-[#8B8D8C]">
                        ID: <strong className="text-[#5D6266]">{evt.entityId || evt.id}</strong>
                      </span>
                    </div>

                    <div className="text-left sm:text-right shrink-0 font-mono text-[11px] text-[#8B8D8C] flex sm:flex-col gap-2 sm:gap-0">
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

                  {/* Summary Description */}
                  <p className="text-[#17191B] font-bold text-xs leading-relaxed font-mono">
                    {evt.summary || (typeof evt.details === "string" ? evt.details : "Audit event recorded.")}
                  </p>

                  {/* Expandable JSON / Details */}
                  {evt.details && (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(evt.id)}
                        className="text-[10px] font-mono text-[#5D6266] hover:text-[#17191B] flex items-center gap-1 cursor-pointer transition py-0.5"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <span>{isExpanded ? "Hide Audit Payload" : "View Immutable Payload"}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-[2px] bg-[#17191B] text-[#A7F3D0] font-mono text-[11px] overflow-x-auto shadow-inner border border-[#30363D]">
                          <pre>{JSON.stringify(parsedDetails || evt.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#8B8D8C] font-mono pt-1 border-t border-[#EFEFEA]">
                    {evt.entityType && (
                      <span>
                        Entity Type: <strong className="text-[#5D6266]">{evt.entityType}</strong>
                      </span>
                    )}
                    <span>
                      Trace Journal Hash: <strong className="text-[#5D6266]">{evt.id}</strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
