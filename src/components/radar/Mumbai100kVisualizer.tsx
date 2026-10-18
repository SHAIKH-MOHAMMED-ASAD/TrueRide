"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Flame, ShieldAlert, Activity, ZoomIn, ZoomOut, Crosshair, Sparkles } from "lucide-react";

export interface Mumbai100kVisualizerProps {
  zoom?: number;
  pan?: { x: number; y: number };
  pointCount?: number; // up to 100,000
  showHeatmap?: boolean;
  showAnomaliesOnly?: boolean;
  className?: string;
  onZoneSelect?: (zoneName: string) => void;
}

interface ZoneCluster {
  name: string;
  code: string;
  cx: number; // 0-1000 coordinate scale
  cy: number;
  count: number;
  radius: number;
  riskCount: number;
}

// 7 Primary Mumbai Delivery Clusters totaling 100,000 sessions
const MUMBAI_ZONES: ZoneCluster[] = [
  { name: "Bandra Kurla Complex (BKC)", code: "BKC", cx: 480, cy: 440, count: 18400, radius: 48, riskCount: 312 },
  { name: "Andheri East & MIDC", code: "ANDHERI", cx: 420, cy: 280, count: 22100, radius: 56, riskCount: 388 },
  { name: "Lower Parel & Worli", code: "LOWER_PAREL", cx: 280, cy: 640, count: 16200, radius: 42, riskCount: 294 },
  { name: "Powai & Hiranandani", code: "POWAI", cx: 580, cy: 260, count: 12800, radius: 38, riskCount: 186 },
  { name: "Navi Mumbai (Vashi / Belapur)", code: "NAVI_MUMBAI", cx: 800, cy: 520, count: 11500, radius: 64, riskCount: 195 },
  { name: "South Mumbai (Fort / Colaba)", code: "SOUTH_MUMBAI", cx: 240, cy: 860, count: 9500, radius: 36, riskCount: 142 },
  { name: "Western Arterial (Borivali / Malad)", code: "MALAD_BORIVALI", cx: 340, cy: 180, count: 9500, radius: 52, riskCount: 183 },
];

/**
 * High-performance deterministic generator for 100,000 Mumbai delivery coordinates
 */
function generate100kMumbaiPoints(totalCount = 100000) {
  const points: { x: number; y: number; riskLevel: number }[] = new Array(totalCount);
  let seed = 987654321;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Normal distribution box-muller
  const randomGaussian = () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const scaleFactor = totalCount / 100000;
  let pointIndex = 0;

  for (const zone of MUMBAI_ZONES) {
    const targetInZone = Math.round(zone.count * scaleFactor);
    for (let i = 0; i < targetInZone && pointIndex < totalCount; i++) {
      // Gaussian scatter around zone core
      const gX = randomGaussian() * (zone.radius * 0.42);
      const gY = randomGaussian() * (zone.radius * 0.42);
      const x = Math.max(160, Math.min(880, zone.cx + gX));
      const y = Math.max(90, Math.min(940, zone.cy + gY));

      // Risk assignment: 0 = L0 (Green), 1 = L1 (Amber), 2 = L2 (Orange), 3 = L3 (Red Anomaly)
      const r = rand();
      let riskLevel = 0;
      if (r < 0.017) {
        riskLevel = 3; // L3 Hold / Account handoff
      } else if (r < 0.043) {
        riskLevel = 2; // L2 Step-up Challenge
      } else if (r < 0.085) {
        riskLevel = 1; // L1 Ambient drift
      } else {
        riskLevel = 0; // L0 Silent Trust
      }

      points[pointIndex++] = { x, y, riskLevel };
    }
  }

  // Fill any remaining points along highway express corridors
  while (pointIndex < totalCount) {
    const t = rand();
    // Western Express Highway interpolation from Dadar to Borivali
    const x = 280 + (350 - 280) * t + (rand() * 10 - 5);
    const y = 640 + (160 - 640) * t + (rand() * 10 - 5);
    points[pointIndex++] = { x, y, riskLevel: rand() < 0.02 ? 3 : 0 };
  }

  return points;
}

export function Mumbai100kVisualizer({
  zoom = 1,
  pan = { x: 0, y: 0 },
  pointCount = 100000,
  showHeatmap = true,
  showAnomaliesOnly = false,
  className = "",
  onZoneSelect,
}: Mumbai100kVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneCluster | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ZoneCluster | null>(null);

  // Generate 100k dataset once deterministically
  const points = useMemo(() => {
    return generate100kMumbaiPoints(pointCount);
  }, [pointCount]);

  // Fast canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Map Mumbai viewBox [160, 100, 700, 760] into canvas pixels
    const scaleX = width / 700;
    const scaleY = height / 760;

    // Apply zoom and pan transform from BKC center (480, 440)
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    // Coordinate conversion function
    const toScreenX = (x: number) => (x - 160) * scaleX;
    const toScreenY = (y: number) => (y - 100) * scaleY;

    // 1. Draw Density Heatmap Glow (if enabled)
    if (showHeatmap && !showAnomaliesOnly) {
      for (const zone of MUMBAI_ZONES) {
        const zx = toScreenX(zone.cx);
        const zy = toScreenY(zone.cy);
        const zr = zone.radius * scaleX * 1.8;

        const grad = ctx.createRadialGradient(zx, zy, 0, zx, zy, zr);
        grad.addColorStop(0, "rgba(36, 129, 58, 0.28)");
        grad.addColorStop(0.5, "rgba(231, 165, 0, 0.12)");
        grad.addColorStop(0.8, "rgba(213, 34, 34, 0.05)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(zx, zy, zr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. High-speed particle rendering for up to 100,000 sessions
    // Using batch color grouping to maximize rendering performance
    const l0Batch: number[] = [];
    const l1Batch: number[] = [];
    const l2Batch: number[] = [];
    const l3Batch: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (showAnomaliesOnly && p.riskLevel < 2) continue;

      const sx = toScreenX(p.x);
      const sy = toScreenY(p.y);

      if (p.riskLevel === 3) {
        l3Batch.push(sx, sy);
      } else if (p.riskLevel === 2) {
        l2Batch.push(sx, sy);
      } else if (p.riskLevel === 1) {
        l1Batch.push(sx, sy);
      } else {
        l0Batch.push(sx, sy);
      }
    }

    // Render L0 Silent Trust (Green) - ~91,500 points
    if (!showAnomaliesOnly && l0Batch.length > 0) {
      ctx.fillStyle = "rgba(34, 197, 94, 0.65)"; // bright neon green
      const ptSize = zoom > 1.4 ? 1.6 : 1.1;
      for (let i = 0; i < l0Batch.length; i += 2) {
        ctx.fillRect(l0Batch[i], l0Batch[i + 1], ptSize, ptSize);
      }
    }

    // Render L1 Ambient Monitor (Amber) - ~4,200 points
    if (!showAnomaliesOnly && l1Batch.length > 0) {
      ctx.fillStyle = "rgba(255, 217, 0, 0.85)"; // TrueRide gold
      const ptSize = zoom > 1.4 ? 2.2 : 1.5;
      for (let i = 0; i < l1Batch.length; i += 2) {
        ctx.fillRect(l1Batch[i], l1Batch[i + 1], ptSize, ptSize);
      }
    }

    // Render L2 Step-Up Challenge (Orange) - ~2,600 points
    if (l2Batch.length > 0) {
      ctx.fillStyle = "rgba(249, 115, 22, 0.9)"; // vibrant orange
      const ptSize = zoom > 1.4 ? 2.8 : 2.0;
      for (let i = 0; i < l2Batch.length; i += 2) {
        ctx.fillRect(l2Batch[i], l2Batch[i + 1], ptSize, ptSize);
      }
    }

    // Render L3 Hold / Account Handoff (Red Glowing Nodes) - ~1,700 points
    if (l3Batch.length > 0) {
      ctx.fillStyle = "#D52222"; // TrueRide danger red
      const ptSize = zoom > 1.4 ? 3.5 : 2.5;
      for (let i = 0; i < l3Batch.length; i += 2) {
        ctx.fillRect(l3Batch[i] - 1, l3Batch[i + 1] - 1, ptSize, ptSize);
      }
    }

    // 3. Draw Zone Labels and Cluster Rings
    for (const zone of MUMBAI_ZONES) {
      const zx = toScreenX(zone.cx);
      const zy = toScreenY(zone.cy);
      const isHovered = hoveredZone?.code === zone.code;

      // Outer ring
      ctx.strokeStyle = isHovered ? "#FFD900" : "rgba(255, 217, 0, 0.35)";
      ctx.lineWidth = isHovered ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.arc(zx, zy, zone.radius * scaleX * 0.75, 0, Math.PI * 2);
      ctx.stroke();

      // Zone Tag Box
      ctx.fillStyle = "rgba(23, 25, 27, 0.88)";
      ctx.strokeStyle = isHovered ? "#FFD900" : "rgba(85, 88, 87, 0.6)";
      ctx.lineWidth = 1;
      const boxW = 86;
      const boxH = 24;
      ctx.fillRect(zx - boxW / 2, zy - boxH / 2, boxW, boxH);
      ctx.strokeRect(zx - boxW / 2, zy - boxH / 2, boxW, boxH);

      // Label text
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 8.5px monospace";
      ctx.textAlign = "center";
      ctx.fillText(zone.code, zx, zy - 1);

      ctx.fillStyle = "#FFD900";
      ctx.font = "8px monospace";
      ctx.fillText(`${(zone.count).toLocaleString()} active`, zx, zy + 8);
    }

    ctx.restore();
  }, [points, zoom, pan, showHeatmap, showAnomaliesOnly, hoveredZone]);

  return (
    <div className={`relative w-full h-full select-none ${className}`}>
      {/* 100k Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={700}
        height={760}
        className="w-full h-full block"
      />

      {/* Floating 100,000 Mega-Fleet Tactical Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="bg-[#17191B]/95 backdrop-blur-md px-3 py-1.5 border border-[#3F4241] rounded-[2px] text-xs font-mono shadow-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
          <span className="font-extrabold text-[#FFD900] tracking-wider uppercase">
            100,000 SESSIONS
          </span>
          <span className="text-[#8B8D8C]">|</span>
          <span className="text-white text-[11px]">Mumbai Metropolitan Mega-Fleet</span>
        </div>
      </div>

      {/* Bottom Zone Breakdown Strip */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="bg-[#17191B]/95 backdrop-blur-md px-3 py-1.5 border border-[#3F4241] rounded-[2px] text-[10px] font-mono shadow-md overflow-x-auto scrollbar-none flex items-center gap-3 pointer-events-auto">
          <span className="text-[#8B8D8C] uppercase font-bold shrink-0">Zone Density:</span>
          {MUMBAI_ZONES.map((z) => (
            <button
              key={z.code}
              type="button"
              onClick={() => {
                setSelectedZone(z);
                if (onZoneSelect) onZoneSelect(z.name);
              }}
              onMouseEnter={() => setHoveredZone(z)}
              onMouseLeave={() => setHoveredZone(null)}
              className="hover:text-[#FFD900] transition cursor-pointer shrink-0 text-[#D5D7D6] flex items-center gap-1"
            >
              <span className="font-bold">{z.code}:</span>
              <span className="text-[#22C55E] font-semibold">{z.count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
