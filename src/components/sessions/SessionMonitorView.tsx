"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Smartphone,
  MapPin,
  Clock,
  X,
} from "lucide-react";
import { RiskBadge, ActionBadge } from "../common/RiskBadge";
import { CategoryRadarBar } from "../common/CategoryRadarBar";

export function SessionMonitorView() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (riskFilter !== "ALL") params.append("riskLevel", riskFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/sessions?${params.toString()}`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [riskFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#17191B] uppercase">
              TELEMETRY INGESTION FEED
            </span>
            <span className="text-[#8B8D8C] text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-[#24813A] font-bold">
              STREAM: ONLINE
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#17191B] tracking-tight flex items-center gap-2 mt-1 uppercase">
            <Layers className="w-5 h-5 text-[#17191B]" />
            Session Ingestion & Continuous Monitoring
          </h1>
          <p className="text-xs text-[#5D6266] mt-0.5">
            Real-time feed of delivery sessions evaluated by the TrueRide continuous identity-risk pipeline.
          </p>
        </div>

        <button
          onClick={fetchSessions}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-mono font-bold text-[#17191B] bg-[#F1F0ED] hover:bg-[#D9D6CD] border border-[#D9D6CD] transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#17191B]" : ""}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="p-3 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-1.5">
          {["ALL", "LOW", "MEDIUM", "HIGH"].map((level) => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              className={`px-3 py-1 rounded-[2px] font-mono font-semibold transition cursor-pointer border ${
                riskFilter === level
                  ? "bg-[#FFD900] text-[#17191B] border-[#FFD900] font-bold shadow-xs"
                  : "text-[#5D6266] hover:bg-[#F1F0ED] border-transparent"
              }`}
            >
              {level === "ALL" ? "All Risk Bands" : `${level} Risk`}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8B8D8C]" />
          <input
            type="text"
            placeholder="Search Session ID, Device, or Zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchSessions()}
            className="pl-8 pr-3 py-1.5 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] text-xs text-[#17191B] placeholder-[#8B8D8C] focus:outline-none focus:border-[#17191B] w-64 font-mono"
          />
        </div>
      </div>

      {/* Sessions Stream Table */}
      <div className="rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1F0ED] text-[#5D6266] font-mono uppercase text-[11px] tracking-wider border-b border-[#D9D6CD]">
              <tr>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Rider</th>
                <th className="py-3 px-4">Device Signature</th>
                <th className="py-3 px-4">Zone & City</th>
                <th className="py-3 px-4">Touch Cadence</th>
                <th className="py-3 px-4">Risk Assessment</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D6CD] font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B8D8C] font-mono">
                    Loading session stream...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B8D8C] font-sans">
                    No session events found matching filter.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F7F7F5] transition">
                    <td className="py-3 px-4 font-bold text-[#17191B]">
                      <div className="flex items-center gap-1.5">
                        <span>{s.sessionId}</span>
                        {s.isSimulated && (
                          <span className="text-[9px] px-1 py-0.2 rounded-[1px] bg-[#F1F0ED] text-[#5D6266] border border-[#D9D6CD]">
                            SIM
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8B8D8C] font-normal">
                        {new Date(s.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-sans text-[#17191B]">
                      <div className="font-bold">{s.rider?.name || s.riderId}</div>
                      <div className="text-[10px] font-mono text-[#5D6266]">{s.riderId}</div>
                    </td>

                    <td className="py-3 px-4 text-[#5D6266] truncate max-w-[140px]">
                      {s.deviceId}
                    </td>

                    <td className="py-3 px-4 text-[#5D6266]">
                      {s.operatingZone}, {s.city}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={
                          s.avgIntervalSec && s.avgIntervalSec > 30
                            ? "text-[#D52222] font-bold"
                            : "text-[#24813A] font-bold"
                        }
                      >
                        {s.avgIntervalSec ? `${s.avgIntervalSec.toFixed(1)}s avg` : "—"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {s.assessment ? (
                        <RiskBadge
                          score={s.assessment.overallScore}
                          level={s.assessment.riskLevel}
                          size="sm"
                        />
                      ) : (
                        <span className="text-[#8B8D8C]">Unscored</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[#8B8D8C] text-[10px]">
                      {s.assessment?.scoringLatencyMs || 2.4} ms
                    </td>

                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => setSelectedSession(s)}
                        className="px-2.5 py-1 rounded-[2px] bg-[#F1F0ED] hover:bg-[#D9D6CD] text-[#17191B] text-xs font-mono font-bold border border-[#D9D6CD] cursor-pointer transition shadow-xs"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] shadow-2xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9D6CD]">
              <div>
                <h3 className="text-base font-bold text-[#17191B] font-mono">
                  {selectedSession.sessionId}
                </h3>
                <p className="text-xs text-[#5D6266]">
                  Rider: {selectedSession.rider?.name} ({selectedSession.riderId})
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-[2px] text-[#5D6266] hover:text-[#17191B] hover:bg-[#F1F0ED]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSession.assessment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD]">
                  <RiskBadge
                    score={selectedSession.assessment.overallScore}
                    level={selectedSession.assessment.riskLevel}
                    size="md"
                  />
                  <ActionBadge action={selectedSession.assessment.recommendedAction} />
                </div>

                <div className="p-4 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                  <h4 className="text-xs font-mono font-bold uppercase text-[#17191B] mb-2.5">
                    Category Breakdown
                  </h4>
                  <CategoryRadarBar
                    scores={{
                      behavioral: selectedSession.assessment.behavioralScore,
                      device: selectedSession.assessment.deviceScore,
                      location: selectedSession.assessment.locationScore,
                      sessionAccount: selectedSession.assessment.sessionAccountScore,
                      historical: selectedSession.assessment.historicalScore,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
