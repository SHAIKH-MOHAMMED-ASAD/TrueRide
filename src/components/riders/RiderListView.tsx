"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  UserCheck,
  Smartphone,
  MapPin,
  Clock,
  Eye,
  X,
  Activity,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#17191B] uppercase">
              RIDER REGISTRY & BASELINES
            </span>
            <span className="text-[#8B8D8C] text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-[#24813A] font-bold">
              {riders.length} ACTIVE PROFILES
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#17191B] tracking-tight flex items-center gap-2 mt-1 uppercase">
            <Users className="w-5 h-5 text-[#17191B]" />
            Rider Directory & Behavioral Profiles
          </h1>
          <p className="text-xs text-[#5D6266] mt-0.5">
            Maintain individualized behavioral baselines derived from genuine historical activity. Zero universal behavioral templates.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8B8D8C]" />
          <input
            type="text"
            placeholder="Search Rider ID, Name, or City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRiders()}
            className="pl-8 pr-3 py-1.5 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] text-xs text-[#17191B] placeholder-[#8B8D8C] focus:outline-none focus:border-[#17191B] w-64 font-mono"
          />
        </div>
      </div>

      {/* Riders Table */}
      <div className="rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1F0ED] text-[#5D6266] font-mono uppercase text-[11px] tracking-wider border-b border-[#D9D6CD]">
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
            <tbody className="divide-y divide-[#D9D6CD]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8B8D8C] font-mono">
                    Loading rider profiles...
                  </td>
                </tr>
              ) : riders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8B8D8C]">
                    No riders found matching query.
                  </td>
                </tr>
              ) : (
                riders.map((r) => {
                  const baseline = r.baselines?.[0];
                  let knownDevices: string[] = [];
                  let primaryZones: string[] = [];

                  try {
                    if (baseline?.knownDevices) knownDevices = JSON.parse(baseline.knownDevices);
                    if (baseline?.primaryZones) primaryZones = JSON.parse(baseline.primaryZones);
                  } catch (e) {
                    // Fallback if not valid JSON
                  }

                  return (
                    <tr key={r.id} className="hover:bg-[#F7F7F5] transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[2px] overflow-hidden bg-[#F1F0ED] border border-[#D9D6CD] shrink-0">
                            <img
                              src={r.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                              alt={r.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-[#17191B]">{r.name}</div>
                            <div className="font-mono text-[10px] text-[#5D6266]">
                              {r.riderId} • {r.city}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-[#E8F4E8] text-[#24813A] border border-[#24813A]/30">
                          {r.accountStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold border ${
                            r.baselineStatus === "ESTABLISHED"
                              ? "bg-[#E8F4E8] text-[#24813A] border-[#24813A]/30"
                              : "bg-[#FFF5D6] text-[#E7A500] border-[#E7A500]/40"
                          }`}
                        >
                          {r.baselineStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#5D6266]">
                        {knownDevices.join(", ") || "DEV-PRIMARY"}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#5D6266]">
                        {primaryZones.join(", ") || r.city}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#8B8D8C]">
                        {r._count?.sessions || baseline?.supportingSessions || 0} sessions
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openRiderProfile(r.riderId)}
                          className="px-3 py-1 rounded-[2px] bg-[#F1F0ED] hover:bg-[#D9D6CD] text-[#17191B] font-mono text-xs font-bold flex items-center gap-1 border border-[#D9D6CD] ml-auto cursor-pointer transition shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#17191B]" />
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] shadow-2xl p-6 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9D6CD]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[2px] overflow-hidden bg-[#F1F0ED] border border-[#D9D6CD]">
                  <img
                    src={selectedRiderDetail.avatarUrl}
                    alt={selectedRiderDetail.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#17191B]">
                    {selectedRiderDetail.name}
                  </h2>
                  <p className="text-xs font-mono text-[#5D6266]">
                    ID: {selectedRiderDetail.riderId} • Enrolled:{" "}
                    {new Date(selectedRiderDetail.enrollmentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRiderDetail(null)}
                className="p-1 rounded-[2px] text-[#5D6266] hover:text-[#17191B] hover:bg-[#F1F0ED]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Baseline Overview */}
            {selectedRiderDetail.baselines?.[0] && (
              <div className="p-4 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#17191B] font-mono">
                  Individual Behavioral Parameters (Baseline v{selectedRiderDetail.baselines[0].version})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                    <span className="text-[#8B8D8C] block text-[10px]">Avg Interaction Interval:</span>
                    <span className="text-[#24813A] font-bold text-sm">
                      {selectedRiderDetail.baselines[0].avgInteractionInterval}s
                    </span>
                    <span className="text-[#8B8D8C] block text-[10px]">
                      (±{selectedRiderDetail.baselines[0].stdInteractionInterval}s std)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                    <span className="text-[#8B8D8C] block text-[10px]">Acceptance Rate:</span>
                    <span className="text-[#17191B] font-bold text-sm">
                      {Math.round(selectedRiderDetail.baselines[0].typicalAcceptanceRate * 100)}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                    <span className="text-[#8B8D8C] block text-[10px]">Avg Shift Duration:</span>
                    <span className="text-[#17191B] font-bold text-sm">
                      {selectedRiderDetail.baselines[0].avgSessionDuration} mins
                    </span>
                  </div>

                  <div className="p-2.5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                    <span className="text-[#8B8D8C] block text-[10px]">Known Devices:</span>
                    <span className="text-[#5D6266] truncate block">
                      {selectedRiderDetail.baselines[0].knownDevices}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                    <span className="text-[#8B8D8C] block text-[10px]">Primary Zones:</span>
                    <span className="text-[#5D6266] truncate block">
                      {selectedRiderDetail.baselines[0].primaryZones}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD]">
                    <span className="text-[#8B8D8C] block text-[10px]">Observation Window:</span>
                    <span className="text-[#17191B] font-semibold">
                      {selectedRiderDetail.baselines[0].observationWindow}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Sessions Timeline */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#17191B] mb-2 font-mono">
                Recent Ingested Sessions ({selectedRiderDetail.sessions?.length || 0})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedRiderDetail.sessions?.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="text-[#17191B] font-bold">{s.sessionId}</span>
                      <span className="text-[#D9D6CD] mx-2">•</span>
                      <span className="text-[#5D6266]">{s.operatingZone}</span>
                      <span className="text-[#D9D6CD] mx-2">•</span>
                      <span className="text-[#8B8D8C]">
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
