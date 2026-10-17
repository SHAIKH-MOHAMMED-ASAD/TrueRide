"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  UserCheck,
  ShieldCheck,
  Smartphone,
  MapPin,
  Clock,
  Eye,
  X,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";
import { RiskBadge } from "../common/RiskBadge";

export function RiderListView() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRiderDetail, setSelectedRiderDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const res = await fetch(`/api/riders?${params.toString()}`);
      const data = await res.json();
      setRiders(data.riders || []);
    } catch (err) {
      console.error("Failed to load riders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const openRiderProfile = async (riderId: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/riders/${riderId}`);
      const data = await res.json();
      setSelectedRiderDetail(data.rider);
    } catch (err) {
      console.error("Failed to load rider dossier:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0c162c] border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Rider Directory & Behavioral Profiles
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain individualized behavioral baselines derived from genuine historical activity. Zero universal behavioral templates.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Rider ID, Name, or City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRiders()}
            className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
          />
        </div>
      </div>

      {/* Riders Table */}
      <div className="rounded-2xl bg-[#0c162c] border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Rider</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Baseline Readiness</th>
                <th className="py-3 px-4">Enrolled Devices</th>
                <th className="py-3 px-4">Primary Zones</th>
                <th className="py-3 px-4">Supporting History</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                    Loading rider profiles...
                  </td>
                </tr>
              ) : riders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No riders found matching query.
                  </td>
                </tr>
              ) : (
                riders.map((r) => {
                  const baseline = r.baselines?.[0];
                  const knownDevices = baseline?.knownDevices
                    ? JSON.parse(baseline.knownDevices)
                    : [];
                  const primaryZones = baseline?.primaryZones
                    ? JSON.parse(baseline.primaryZones)
                    : [];

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                            <img
                              src={r.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                              alt={r.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-white">{r.name}</div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {r.riderId} • {r.city}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {r.accountStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            r.baselineStatus === "ESTABLISHED"
                              ? "bg-teal-950 text-teal-300 border border-teal-800"
                              : "bg-purple-950 text-purple-300 border border-purple-800"
                          }`}
                        >
                          {r.baselineStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                        {knownDevices.join(", ") || "DEV-PRIMARY"}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                        {primaryZones.join(", ") || r.city}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {r._count?.sessions || baseline?.supportingSessions || 0} sessions
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openRiderProfile(r.riderId)}
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs flex items-center gap-1 border border-slate-700 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Dossier</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Rider Dossier Modal */}
      {selectedRiderDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#0c162c] border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-cyan-500/40">
                  <img
                    src={selectedRiderDetail.avatarUrl}
                    alt={selectedRiderDetail.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedRiderDetail.name}
                  </h2>
                  <p className="text-xs font-mono text-slate-400">
                    ID: {selectedRiderDetail.riderId} • Enrolled:{" "}
                    {new Date(selectedRiderDetail.enrollmentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRiderDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Baseline Overview */}
            {selectedRiderDetail.baselines?.[0] && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  Individual Behavioral Parameters (Baseline v{selectedRiderDetail.baselines[0].version})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Avg Interaction Interval:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {selectedRiderDetail.baselines[0].avgInteractionInterval}s
                    </span>
                    <span className="text-slate-500 block text-[10px]">
                      (±{selectedRiderDetail.baselines[0].stdInteractionInterval}s std)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Acceptance Rate:</span>
                    <span className="text-white font-bold text-sm">
                      {Math.round(selectedRiderDetail.baselines[0].typicalAcceptanceRate * 100)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Avg Shift Duration:</span>
                    <span className="text-white font-bold text-sm">
                      {selectedRiderDetail.baselines[0].avgSessionDuration} mins
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Known Devices:</span>
                    <span className="text-slate-300 truncate block">
                      {selectedRiderDetail.baselines[0].knownDevices}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Primary Zones:</span>
                    <span className="text-slate-300 truncate block">
                      {selectedRiderDetail.baselines[0].primaryZones}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Observation Window:</span>
                    <span className="text-teal-300 font-semibold">
                      {selectedRiderDetail.baselines[0].observationWindow}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Sessions Timeline */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                Recent Ingested Sessions ({selectedRiderDetail.sessions?.length || 0})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedRiderDetail.sessions?.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="text-white font-semibold">{s.sessionId}</span>
                      <span className="text-slate-500 mx-2">•</span>
                      <span className="text-slate-400">{s.operatingZone}</span>
                      <span className="text-slate-500 mx-2">•</span>
                      <span className="text-slate-500">
                        {new Date(s.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    {s.assessment && (
                      <RiskBadge
                        score={s.assessment.overallScore}
                        level={s.assessment.riskLevel}
                        size="sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
