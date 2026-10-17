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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0c162c] border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            Session Ingestion & Continuous Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of delivery sessions evaluated by the TrueRide continuous identity-risk pipeline.
          </p>
        </div>

        <button
          onClick={fetchSessions}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl bg-[#0c162c] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {["ALL", "LOW", "MEDIUM", "HIGH"].map((level) => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              className={`px-3 py-1.5 rounded-lg font-mono font-medium transition cursor-pointer ${
                riskFilter === level
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:bg-slate-800/40"
              }`}
            >
              {level === "ALL" ? "All Risk Bands" : `${level} Risk`}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Session ID, Device, or Zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchSessions()}
            className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
          />
        </div>
      </div>

      {/* Sessions Stream Table */}
      <div className="rounded-2xl bg-[#0c162c] border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Rider</th>
                <th className="py-3 px-4">Device Signature</th>
                <th className="py-3 px-4">Zone & City</th>
                <th className="py-3 px-4">Touch Cadence</th>
                <th className="py-3 px-4">Risk Assessment</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    Loading session stream...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    No session events found matching filter.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{s.sessionId}</span>
                        {s.isSimulated && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            SIM
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {new Date(s.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-200">
                      <div>{s.rider?.name || s.riderId}</div>
                      <div className="text-[10px] font-mono text-slate-500">{s.riderId}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 truncate max-w-[140px]">
                      {s.deviceId}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {s.operatingZone}, {s.city}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={
                          s.avgIntervalSec && s.avgIntervalSec > 30
                            ? "text-rose-400 font-bold"
                            : "text-emerald-400 font-bold"
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
                        <span className="text-slate-500">Unscored</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[10px]">
                      {s.assessment?.scoringLatencyMs || 2.4} ms
                    </td>

                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => setSelectedSession(s)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono border border-slate-700 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0c162c] border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  {selectedSession.sessionId}
                </h3>
                <p className="text-xs text-slate-400">
                  Rider: {selectedSession.rider?.name} ({selectedSession.riderId})
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSession.assessment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <RiskBadge
                    score={selectedSession.assessment.overallScore}
                    level={selectedSession.assessment.riskLevel}
                    size="md"
                  />
                  <ActionBadge action={selectedSession.assessment.recommendedAction} />
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">
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
