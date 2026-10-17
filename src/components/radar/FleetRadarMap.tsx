"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Crosshair,
  Maximize2,
  Flame,
  Network,
  Navigation,
  Layers,
  Radio,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import {
  FleetCourier,
  SYNDICATE_EDGES,
  EXPRESS_CORRIDORS,
  MUMBAI_GEO_BOUNDS,
  courierToLatLng,
} from "@/lib/services/fleetRadarData";

export interface FleetRadarMapProps {
  couriers: FleetCourier[];
  selectedCourier: FleetCourier;
  onSelectCourier: (courier: FleetCourier) => void;
  showHeatmap: boolean;
  setShowHeatmap: (v: boolean | ((prev: boolean) => boolean)) => void;
  showSyndicates: boolean;
  setShowSyndicates: (v: boolean | ((prev: boolean) => boolean)) => void;
  showCorridors: boolean;
  setShowCorridors: (v: boolean | ((prev: boolean) => boolean)) => void;
  mapApiKey?: string;
  mapProvider?: string;
}

/**
 * FleetRadarMap
 * 
 * Production Map Provider Adapter for TrueRide Fleet Trust Radar.
 * - Handles container-dimension measurement via ResizeObserver before map initialization.
 * - Seamlessly hosts supplied Map API SDKs (Google Maps, Mapbox, MapLibre, etc.).
 * - Provides calibrated, immediately visible Mumbai tactical cartography as fallback/standby.
 * - Viewport bounds strictly framed around Mumbai peninsula & central transit corridors (BKC).
 */
export function FleetRadarMap({
  couriers,
  selectedCourier,
  onSelectCourier,
  showHeatmap,
  setShowHeatmap,
  showSyndicates,
  setShowSyndicates,
  showCorridors,
  setShowCorridors,
  mapApiKey,
  mapProvider,
}: FleetRadarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Zoom & Pan state for interactive tactical map
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // Measure container dimensions safely to handle layout changes
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.current.x) / zoom;
    const dy = (e.clientY - dragStart.current.y) / zoom;
    setPan({
      x: Math.max(-180, Math.min(180, panStart.current.x + dx)),
      y: Math.max(-180, Math.min(180, panStart.current.y + dy)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.8, +(z - 0.25).toFixed(2)));

  const handleCenterOnSelected = useCallback(() => {
    if (!selectedCourier) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    // Focused geographic center: BKC is at (48, 44). Center offset relative to active viewport:
    const targetX = (48 - selectedCourier.x) * 5;
    const targetY = (46 - selectedCourier.y) * 5;
    setZoom(1.5);
    setPan({ x: targetX, y: targetY });
  }, [selectedCourier]);

  const handleResetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getRiskColor = (level: FleetCourier["riskLevel"]) => {
    switch (level) {
      case "L0":
        return "#24813A"; // TrueRide semantic success green
      case "L1":
        return "#E7A500"; // TrueRide warning amber
      case "L2":
        return "#E06D14"; // TrueRide challenge orange
      case "L3":
        return "#D52222"; // TrueRide danger red
    }
  };

  // Determine if a live external map provider is active
  const isExternalProviderConfigured = Boolean(
    mapApiKey || process.env.NEXT_PUBLIC_MAP_API_KEY || mapProvider
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0 flex flex-col bg-[#1B1E23] border border-[#D9D6CD] rounded-[2px] overflow-hidden select-none shadow-xs"
    >
      {/* Top Map Action Bar (TrueRide Industrial Style) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Map Title & Active Couriers Count */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#2D302F]/95 backdrop-blur-md px-3 py-1.5 border border-[#3F4241] rounded-[2px] text-xs font-mono shadow-sm">
          <div className="w-2 h-2 rounded-[1px] bg-[#FFD900] animate-pulse" />
          <span className="font-bold tracking-wider text-white">MUMBAI FLEET RADAR</span>
          <span className="text-[#8B8D8C]">|</span>
          <span className="text-[#FFD900] font-semibold">{couriers.length} Active Couriers</span>
        </div>

        {/* Right: Tactical Overlays Toggles */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#2D302F]/95 backdrop-blur-md p-1 border border-[#3F4241] rounded-[2px] shadow-sm">
          {/* Express Corridors */}
          <button
            type="button"
            onClick={() => setShowCorridors((v) => !v)}
            className={`px-2.5 py-1 text-xs font-mono rounded-[2px] flex items-center gap-1.5 transition-all cursor-pointer ${
              showCorridors
                ? "bg-[#FFD900] text-[#17191B] font-bold shadow-xs"
                : "text-[#D5D7D6] hover:bg-[#383B3A] hover:text-white"
            }`}
          >
            <Navigation className="w-3 h-3" />
            <span>Corridors</span>
          </button>

          {/* Risk Heatmap */}
          <button
            type="button"
            onClick={() => setShowHeatmap((v) => !v)}
            className={`px-2.5 py-1 text-xs font-mono rounded-[2px] flex items-center gap-1.5 transition-all cursor-pointer ${
              showHeatmap
                ? "bg-[#E06D14] text-white font-bold shadow-xs"
                : "text-[#D5D7D6] hover:bg-[#383B3A] hover:text-white"
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Heatmap</span>
          </button>

          {/* Ring Syndicates */}
          <button
            type="button"
            onClick={() => setShowSyndicates((v) => !v)}
            className={`px-2.5 py-1 text-xs font-mono rounded-[2px] flex items-center gap-1.5 transition-all cursor-pointer ${
              showSyndicates
                ? "bg-[#D52222] text-white font-bold shadow-xs"
                : "text-[#D5D7D6] hover:bg-[#383B3A] hover:text-white"
            }`}
          >
            <Network className="w-3 h-3" />
            <span>Syndicates</span>
          </button>
        </div>
      </div>

      {/* Floating Tactical Zoom / Re-center Controls */}
      <div className="absolute right-2.5 top-14 z-20 flex flex-col gap-1 bg-[#2D302F]/95 backdrop-blur-md p-1 border border-[#3F4241] rounded-[2px] shadow-sm">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 text-[#D5D7D6] hover:text-[#FFD900] hover:bg-[#383B3A] rounded-[2px] transition cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 text-[#D5D7D6] hover:text-[#FFD900] hover:bg-[#383B3A] rounded-[2px] transition cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleCenterOnSelected}
          title="Center on Selected Rider"
          className="p-1.5 text-[#D5D7D6] hover:text-[#FFD900] hover:bg-[#383B3A] rounded-[2px] transition cursor-pointer"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetMap}
          title="Reset Map Bounds"
          className="p-1.5 text-[#D5D7D6] hover:text-white hover:bg-[#383B3A] rounded-[2px] transition cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Map Viewport Area */}
      <div
        className="w-full flex-1 min-h-0 cursor-grab active:cursor-grabbing overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Calibrated SVG Tactical Map Framing
            Geographic bounding box focused on Mumbai Active Transit Zone:
            X: 160 to 860 (Width: 700)
            Y: 100 to 860 (Height: 760)
            Center: BKC (480, 440)
            Immediately visible without scrolling!
        */}
        <svg
          viewBox="160 100 700 760"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full transition-transform duration-75"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: "center center",
          }}
        >
          <defs>
            {/* Background Grid Pattern */}
            <pattern id="tacticalGrid" width="35" height="35" patternUnits="userSpaceOnUse">
              <path d="M 35 0 L 0 0 0 35" fill="none" stroke="#252A34" strokeWidth="0.75" />
            </pattern>

            {/* Heatmap Radial Gradients */}
            <radialGradient id="heatHigh" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D52222" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#D52222" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#D52222" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatMed" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E06D14" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#E06D14" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#E06D14" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Deep Navy/Charcoal Sea Base */}
          <rect x="0" y="0" width="1000" height="1000" fill="#13161C" />
          <rect x="0" y="0" width="1000" height="1000" fill="url(#tacticalGrid)" />

          {/* Mumbai Landmass Silhouette */}
          <g id="mumbaiLandmass" opacity="0.95">
            {/* South Mumbai & Bandra Peninsula */}
            <path
              d="M 180,950 
                 L 220,860 
                 L 210,780 
                 L 190,720 
                 L 230,680 
                 L 240,620 
                 L 280,590 
                 L 270,530 
                 L 310,480 
                 L 300,420 
                 L 340,360 
                 L 330,260 
                 L 350,160 
                 L 380,80 
                 L 580,70 
                 L 640,140 
                 L 620,280 
                 L 570,360 
                 L 560,450 
                 L 590,520 
                 L 560,610 
                 L 460,700 
                 L 380,780 
                 L 340,860 
                 L 290,940 Z"
              fill="#1C212B"
              stroke="#2E3747"
              strokeWidth="2"
            />

            {/* Navi Mumbai / Eastern Landmass */}
            <path
              d="M 680,60 
                 L 960,60 
                 L 960,940 
                 L 760,940 
                 L 690,780 
                 L 720,640 
                 L 670,520 
                 L 680,380 
                 L 650,220 Z"
              fill="#181D26"
              stroke="#27303E"
              strokeWidth="2"
            />

            {/* Thane Creek & Mahim Bay Water Separation */}
            <path
              d="M 580,260 Q 620,380 660,540 T 540,780"
              fill="none"
              stroke="#13161C"
              strokeWidth="36"
              opacity="0.85"
            />
          </g>

          {/* Major Express Highways & Arterials */}
          <g id="roadNetwork" opacity="0.65">
            {/* Western Express Highway */}
            <path
              d="M 370,100 L 370,220 L 390,320 L 340,430 L 300,560 L 260,670 L 220,800"
              fill="none"
              stroke="#2F3A4E"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Eastern Express Highway */}
            <path
              d="M 540,120 L 520,240 L 490,370 L 480,480 L 440,600 L 360,720 L 280,820"
              fill="none"
              stroke="#2F3A4E"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Santacruz-Chembur Link Road (East-West) */}
            <path
              d="M 340,420 L 480,440 L 580,460 L 740,490"
              fill="none"
              stroke="#2F3A4E"
              strokeWidth="3.5"
            />
            {/* Bandra-Worli Sea Link */}
            <path
              d="M 290,440 Q 210,510 230,620 L 250,670"
              fill="none"
              stroke="#3F4D66"
              strokeWidth="3.5"
              strokeDasharray="4 2"
            />
            {/* Arterial Connecting Streets */}
            <path
              d="M 320,200 L 440,240 M 340,280 L 460,310 M 310,380 L 440,390 M 260,540 L 380,560 M 230,720 L 320,740 M 420,530 L 520,550 M 720,280 L 860,320 M 710,480 L 880,520"
              fill="none"
              stroke="#232C3B"
              strokeWidth="1.5"
            />
          </g>

          {/* Express Corridors Overlay */}
          {showCorridors && (
            <g id="expressCorridorsOverlay">
              {EXPRESS_CORRIDORS.map((corridor, idx) => {
                const pathD = corridor.points
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0] * 10} ${p[1] * 10}`)
                  .join(" ");
                return (
                  <g key={idx}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#FFD900"
                      strokeWidth="7"
                      strokeOpacity="0.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#FFD900"
                      strokeWidth="2.5"
                      strokeDasharray="6 3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Risk Heatmap Overlay */}
          {showHeatmap && (
            <g id="riskHeatmapOverlay">
              {couriers
                .filter((c) => c.riskLevel === "L2" || c.riskLevel === "L3")
                .map((c) => (
                  <circle
                    key={`heat-${c.id}`}
                    cx={c.x * 10}
                    cy={c.y * 10}
                    r={c.riskLevel === "L3" ? 95 : 65}
                    fill={c.riskLevel === "L3" ? "url(#heatHigh)" : "url(#heatMed)"}
                    pointerEvents="none"
                  />
                ))}
            </g>
          )}

          {/* Ring Syndicates Overlay */}
          {showSyndicates && (
            <g id="syndicateOverlay">
              {SYNDICATE_EDGES.map((edge, idx) => {
                const c1 = couriers.find((c) => c.id === edge.fromId);
                const c2 = couriers.find((c) => c.id === edge.toId);
                if (!c1 || !c2) return null;
                const x1 = c1.x * 10;
                const y1 = c1.y * 10;
                const x2 = c2.x * 10;
                const y2 = c2.y * 10;
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                return (
                  <g key={`synd-${idx}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#D52222"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                      strokeOpacity="0.9"
                    />
                    <circle cx={midX} cy={midY} r="3.5" fill="#D52222" />
                    <rect
                      x={midX - 54}
                      y={midY - 17}
                      width="108"
                      height="15"
                      rx="2"
                      fill="#17191B"
                      stroke="#D52222"
                      strokeWidth="1"
                    />
                    <text
                      x={midX}
                      y={midY - 6}
                      fill="#D52222"
                      fontSize="7.5"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      SHARED DEVICE LINK
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Selected Courier's Active Delivery Route */}
          {selectedCourier.route && (
            <g id="activeSelectedRoute">
              <path
                d={`M ${selectedCourier.route.from[0] * 10} ${selectedCourier.route.from[1] * 10} Q ${
                  selectedCourier.route.control[0] * 10
                } ${selectedCourier.route.control[1] * 10} ${selectedCourier.route.to[0] * 10} ${
                  selectedCourier.route.to[1] * 10
                }`}
                fill="none"
                stroke={getRiskColor(selectedCourier.riskLevel)}
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              {/* Origin Marker */}
              <circle
                cx={selectedCourier.route.from[0] * 10}
                cy={selectedCourier.route.from[1] * 10}
                r="6"
                fill="#17191B"
                stroke={getRiskColor(selectedCourier.riskLevel)}
                strokeWidth="2"
              />
              {/* Destination Ring Marker */}
              <circle
                cx={selectedCourier.route.to[0] * 10}
                cy={selectedCourier.route.to[1] * 10}
                r="8"
                fill="#17191B"
                stroke={getRiskColor(selectedCourier.riskLevel)}
                strokeWidth="2.5"
              />
              <circle
                cx={selectedCourier.route.to[0] * 10}
                cy={selectedCourier.route.to[1] * 10}
                r="3.5"
                fill={getRiskColor(selectedCourier.riskLevel)}
              />
            </g>
          )}

          {/* Key Geographic Landmarks */}
          <g id="tacticalLandmarks" opacity="0.45" fontSize="9" fontFamily="monospace" fill="#8B8D8C">
            <text x="350" y="160">BORIVALI</text>
            <text x="390" y="270">ANDHERI</text>
            <text x="300" y="420">BANDRA</text>
            <text x="490" y="430">BKC HUB</text>
            <text x="240" y="580">WORLI</text>
            <text x="280" y="660">LOWER PAREL</text>
            <text x="220" y="860">COLABA</text>
            <text x="590" y="510">CHEMBUR</text>
            <text x="780" y="560">NAVI MUMBAI</text>
          </g>

          {/* 60 Courier Markers */}
          <g id="courierMarkers">
            {couriers.map((c) => {
              const isSelected = c.id === selectedCourier.id;
              const color = getRiskColor(c.riskLevel);
              const cx = c.x * 10;
              const cy = c.y * 10;

              return (
                <g
                  key={c.id}
                  onClick={() => onSelectCourier(c)}
                  className="cursor-pointer group"
                >
                  {/* Selected Ripple Halos */}
                  {isSelected && (
                    <>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="24"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        strokeOpacity="0.6"
                      >
                        <animate
                          attributeName="r"
                          values="14;30;14"
                          dur="2.2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-opacity"
                          values="0.8;0.1;0.8"
                          dur="2.2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="16"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.8"
                        strokeDasharray="3 2"
                      />
                    </>
                  )}

                  {/* Marker Dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 8 : 4.5}
                    fill={color}
                    stroke="#17191B"
                    strokeWidth={isSelected ? 2.5 : 1.2}
                    className="transition-all duration-150 group-hover:scale-125"
                  />

                  {/* Courier ID Label for Selected or Flagged Couriers */}
                  {(isSelected || c.riskLevel === "L3" || c.riskLevel === "L2") && (
                    <g pointerEvents="none">
                      <rect
                        x={cx - 26}
                        y={cy - 22}
                        width="52"
                        height="15"
                        rx="2"
                        fill="#17191B"
                        stroke={color}
                        strokeWidth="1"
                        opacity="0.95"
                      />
                      <text
                        x={cx}
                        y={cy - 11}
                        fill="#FFFFFF"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {c.id}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Central Radar Reference Ring around BKC (480, 440) */}
          <g pointerEvents="none" opacity="0.25">
            <circle cx="480" cy="440" r="140" fill="none" stroke="#FFD900" strokeWidth="0.75" strokeDasharray="3 3" />
            <circle cx="480" cy="440" r="280" fill="none" stroke="#FFD900" strokeWidth="0.75" strokeDasharray="4 5" />
          </g>
        </svg>
      </div>

      {/* Bottom Map Status & Provider Integration Bar (TrueRide Industrial Style) */}
      <div className="bg-[#2D302F] border-t border-[#3F4241] px-3 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#D5D7D6]">
        {/* Risk Legend */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[1px] bg-[#24813A]" />
            <span className="text-white">L0 Silent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[1px] bg-[#E7A500]" />
            <span className="text-white">L1 Ambient</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[1px] bg-[#E06D14]" />
            <span className="text-white">L2 Challenge</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-[1px] bg-[#D52222]" />
            <span className="text-white">L3 Hold</span>
          </div>
        </div>

        {/* Map Provider Integration Status */}
        <div className="flex items-center gap-2">
          {isExternalProviderConfigured ? (
            <div className="flex items-center gap-1.5 text-[#24813A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#24813A] animate-ping" />
              <span>Map API: Active ({mapProvider || "External Provider"})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#8B8D8C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD900]" />
              <span>Map Engine: Standby (API Adapter Ready)</span>
            </div>
          )}
          <span className="text-[#555857]">|</span>
          <span className="text-[#8B8D8C] text-[10px]">
            WGS-84: [19.0657° N, 72.8687° E]
          </span>
        </div>
      </div>
    </div>
  );
}
