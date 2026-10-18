"use client";

import React, { useState, useMemo } from "react";
import { Search, Bike, Zap, ShieldCheck, ShieldAlert, AlertTriangle, ShieldX } from "lucide-react";
import { FleetCourier } from "@/lib/services/fleetRadarData";

interface RiderMonitorListProps {
  couriers: FleetCourier[];
  selectedCourier: FleetCourier;
  onSelectCourier: (courier: FleetCourier) => void;
}

export function RiderMonitorList({
  couriers,
  selectedCourier,
  onSelectCourier,
}: RiderMonitorListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "L0" | "L1" | "L2" | "L3">("ALL");

  // Dynamic counts
  const counts = useMemo(() => {
    return {
      ALL: couriers.length,
      L0: couriers.filter((c) => c.riskLevel === "L0").length,
      L1: couriers.filter((c) => c.riskLevel === "L1").length,
      L2: couriers.filter((c) => c.riskLevel === "L2").length,
      L3: couriers.filter((c) => c.riskLevel === "L3").length,
    };
  }, [couriers]);

  // Filtered couriers
  const filteredCouriers = useMemo(() => {
    return couriers.filter((c) => {
      const matchesSearch =
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.zone.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRisk = riskFilter === "ALL" || c.riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [couriers, searchTerm, riskFilter]);

  const getRiskBadgeStyles = (level: FleetCourier["riskLevel"]) => {
    switch (level) {
      case "L0":
        return "bg-[#E8F4E8] text-[#24813A] border-[#24813A]/30";
      case "L1":
        return "bg-[#FFF5D6] text-[#E7A500] border-[#E7A500]/40";
      case "L2":
        return "bg-[#FEE8D6] text-[#E06D14] border-[#E06D14]/40";
      case "L3":
        return "bg-[#FCE5E3] text-[#D52222] border-[#D52222]/40";
    }
  };

  const getStatusIcon = (status: FleetCourier["trustStatus"]) => {
    switch (status) {
      case "Silent Trust":
        return <ShieldCheck className="w-3 h-3 text-[#24813A]" />;
      case "Ambient Monitor":
        return <AlertTriangle className="w-3 h-3 text-[#E7A500]" />;
      case "Step-Up Verify":
        return <ShieldAlert className="w-3 h-3 text-[#E06D14]" />;
      case "Security Hold":
        return <ShieldX className="w-3 h-3 text-[#D52222]" />;
    }
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] overflow-hidden shadow-xs">
      {/* Header & Search Bar (TrueRide Industrial Theme) */}
      <div className="p-3 border-b border-[#D9D6CD] bg-[#F1F0ED]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] font-bold text-[#17191B] uppercase tracking-wider">
            RIDER MONITOR
          </span>
          <span className="font-mono text-[10px] text-[#5D6266]">
            {filteredCouriers.length} of {couriers.length}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B8D8C]" />
          <input
            type="text"
            placeholder="Filter rider ID, name, or zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#FFFFFF] border border-[#D9D6CD] rounded-[2px] text-xs text-[#17191B] placeholder-[#8B8D8C] focus:outline-none focus:border-[#17191B] transition"
          />
        </div>

        {/* Risk Filter Buttons Row */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            type="button"
            onClick={() => setRiskFilter("ALL")}
            className={`px-2 py-0.5 text-[11px] font-mono rounded-[2px] font-bold transition cursor-pointer ${
              riskFilter === "ALL"
                ? "bg-[#17191B] text-[#FFFFFF]"
                : "bg-[#FFFFFF] text-[#5D6266] border border-[#D9D6CD] hover:bg-[#E5E3DC]"
            }`}
          >
            ALL ({counts.ALL})
          </button>

          <button
            type="button"
            onClick={() => setRiskFilter("L0")}
            className={`px-2 py-0.5 text-[11px] font-mono rounded-[2px] font-bold transition cursor-pointer ${
              riskFilter === "L0"
                ? "bg-[#24813A] text-white"
                : "bg-[#E8F4E8] text-[#24813A] border border-[#24813A]/30 hover:opacity-90"
            }`}
          >
            L0 ({counts.L0})
          </button>

          <button
            type="button"
            onClick={() => setRiskFilter("L1")}
            className={`px-2 py-0.5 text-[11px] font-mono rounded-[2px] font-bold transition cursor-pointer ${
              riskFilter === "L1"
                ? "bg-[#E7A500] text-white"
                : "bg-[#FFF5D6] text-[#E7A500] border border-[#E7A500]/40 hover:opacity-90"
            }`}
          >
            L1 ({counts.L1})
          </button>

          <button
            type="button"
            onClick={() => setRiskFilter("L2")}
            className={`px-2 py-0.5 text-[11px] font-mono rounded-[2px] font-bold transition cursor-pointer ${
              riskFilter === "L2"
                ? "bg-[#E06D14] text-white"
                : "bg-[#FEE8D6] text-[#E06D14] border border-[#E06D14]/40 hover:opacity-90"
            }`}
          >
            L2 ({counts.L2})
          </button>

          <button
            type="button"
            onClick={() => setRiskFilter("L3")}
            className={`px-2 py-0.5 text-[11px] font-mono rounded-[2px] font-bold transition cursor-pointer ${
              riskFilter === "L3"
                ? "bg-[#D52222] text-white"
                : "bg-[#FCE5E3] text-[#D52222] border border-[#D52222]/40 hover:opacity-90"
            }`}
          >
            L3 ({counts.L3})
          </button>
        </div>
      </div>

      {/* Scrollable Rider Cards List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-[#D9D6CD]">
        {filteredCouriers.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-[#8B8D8C]">
            No couriers match current filter
          </div>
        ) : (
          filteredCouriers.map((courier, index) => {
            const isSelected = courier.id === selectedCourier.id;
            const badgeClass = getRiskBadgeStyles(courier.riskLevel);

            return (
              <div
                key={`${courier.id}-${index}`}
                onClick={() => onSelectCourier(courier)}
                className={`p-2.5 rounded-[2px] cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-[#FFFDE6] border-l-4 border-l-[#FFD900] border-t-[#D9D6CD] border-r-[#D9D6CD] border-b-[#D9D6CD] shadow-xs"
                    : "bg-[#FFFFFF] border-[#D9D6CD] hover:border-[#17191B] hover:bg-[#F1F0ED]/60"
                }`}
              >
                {/* Top Row: Courier ID, Risk Badge, and Trust Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#17191B] tracking-wide">
                      {courier.id}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-[2px] border ${badgeClass}`}
                    >
                      {courier.riskLevel}
                    </span>
                  </div>

                  {/* Trust Score */}
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-[#17191B]">
                      {courier.trustScore.toFixed(1)}
                    </span>
                    <span className="font-mono text-[10px] text-[#8B8D8C]">/100</span>
                  </div>
                </div>

                {/* Subtitle: Courier Name & Zone */}
                <div className="mt-1 text-[11px] text-[#5D6266] truncate font-sans font-medium">
                  {courier.name}
                </div>
                <div className="text-[10px] text-[#8B8D8C] truncate font-mono">
                  {courier.zone}
                </div>

                {/* Bottom Row: Vehicle, In-Transit, Trust Status */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#D9D6CD]/60 text-[10px] font-mono text-[#5D6266]">
                  <div className="flex items-center gap-1.5">
                    {courier.vehicle === "EV Scooter" ? (
                      <Zap className="w-2.5 h-2.5 text-[#E7A500]" />
                    ) : (
                      <Bike className="w-2.5 h-2.5 text-[#5D6266]" />
                    )}
                    <span>{courier.status}</span>
                  </div>

                  {/* Trust Status Badge */}
                  <div className="flex items-center gap-1 font-semibold">
                    {getStatusIcon(courier.trustStatus)}
                    <span className="text-[#17191B]">{courier.trustStatus}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-[#D9D6CD] bg-[#F1F0ED] flex items-center justify-between text-[10px] font-mono text-[#5D6266]">
        <span>Feed: Ingest Active</span>
        <span className="text-[#24813A] font-bold">SQLITE CLUSTER SYNCED</span>
      </div>
    </div>
  );
}
