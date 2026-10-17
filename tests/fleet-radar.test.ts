import { describe, it, expect } from "vitest";
import {
  INITIAL_MUMBAI_COURIERS,
  SYNDICATE_EDGES,
  EXPRESS_CORRIDORS,
  RADAR_PRESETS,
  applyPresetToCouriers,
  MUMBAI_GEO_BOUNDS,
  courierToLatLng,
  latLngToNormalized,
} from "../src/lib/services/fleetRadarData";

describe("Fleet Trust Radar Module", () => {
  it("initializes 60 couriers with valid geographical coordinates within Mumbai bounds", () => {
    expect(INITIAL_MUMBAI_COURIERS.length).toBe(60);

    for (const courier of INITIAL_MUMBAI_COURIERS) {
      expect(courier.id).toMatch(/^r_\d{4}$/);
      expect(courier.x).toBeGreaterThanOrEqual(0);
      expect(courier.x).toBeLessThanOrEqual(100);
      expect(courier.y).toBeGreaterThanOrEqual(0);
      expect(courier.y).toBeLessThanOrEqual(100);
      expect(["L0", "L1", "L2", "L3"]).toContain(courier.riskLevel);
      expect(courier.trustScore).toBeGreaterThanOrEqual(0);
      expect(courier.trustScore).toBeLessThanOrEqual(100);
      expect(courier.telemetry.categoryScores).toBeDefined();
    }
  });

  it("identifies target courier r_0042 as primary investigation mission", () => {
    const courier42 = INITIAL_MUMBAI_COURIERS.find((c) => c.id === "r_0042");
    expect(courier42).toBeDefined();
    expect(courier42?.name).toContain("Arjun Kumar");
    expect(courier42?.caseId).toBe("CASE-2026-8021");
    expect(courier42?.isSyndicateNode).toBe(true);
    expect(courier42?.route).toBeDefined();
  });

  it("applies Preset A (Legit New Phone + Zone) - dampener engages to maintain L0", () => {
    const updated = applyPresetToCouriers("presetA", INITIAL_MUMBAI_COURIERS);
    const target = updated.find((c) => c.id === "r_0042");

    expect(target?.riskLevel).toBe("L0");
    expect(target?.trustStatus).toBe("Silent Trust");
    expect(target?.trustScore).toBeGreaterThan(90);
    expect(target?.telemetry.personBoundConsistency).toBeGreaterThan(0.9);
    expect(target?.telemetry.signals.some((s) => s.code === "DAMPENER_ENGAGED")).toBe(true);
  });

  it("applies Preset B (Rented Account Swap) - detects cadence collapse into L3 Hold", () => {
    const updated = applyPresetToCouriers("presetB", INITIAL_MUMBAI_COURIERS);
    const target = updated.find((c) => c.id === "r_0042");

    expect(target?.riskLevel).toBe("L3");
    expect(target?.trustStatus).toBe("Security Hold");
    expect(target?.trustScore).toBeLessThan(50);
    expect(target?.telemetry.baselineDriftSigma).toBe(3.8);
    expect(target?.telemetry.signals.some((s) => s.code === "BEH_INTERVAL_COLLAPSE")).toBe(true);
  });

  it("applies Preset C (Live Manual Chaos Override) - triggers L2 Challenge on velocity anomaly", () => {
    const updated = applyPresetToCouriers("presetC", INITIAL_MUMBAI_COURIERS);
    const target = updated.find((c) => c.id === "r_0042");

    expect(target?.riskLevel).toBe("L2");
    expect(target?.trustStatus).toBe("Step-Up Verify");
    expect(target?.telemetry.signals.some((s) => s.code === "LOC_SPEED_ANOMALY")).toBe(true);
  });

  it("applies Preset D (Sneaky Renter) - detects micro-tremor divergence", () => {
    const updated = applyPresetToCouriers("presetD", INITIAL_MUMBAI_COURIERS);
    const target = updated.find((c) => c.id === "r_0042");

    expect(target?.riskLevel).toBe("L2");
    expect(target?.trustStatus).toBe("Step-Up Verify");
    expect(target?.telemetry.signals.some((s) => s.code === "BEH_MICRO_TREMOR")).toBe(true);
  });

  it("verifies syndicate clusters and express delivery corridors", () => {
    expect(SYNDICATE_EDGES.length).toBeGreaterThan(0);
    for (const edge of SYNDICATE_EDGES) {
      expect(INITIAL_MUMBAI_COURIERS.some((c) => c.id === edge.fromId)).toBe(true);
      expect(INITIAL_MUMBAI_COURIERS.some((c) => c.id === edge.toId)).toBe(true);
    }

    expect(EXPRESS_CORRIDORS.length).toBeGreaterThanOrEqual(3);
    for (const corridor of EXPRESS_CORRIDORS) {
      expect(corridor.points.length).toBeGreaterThan(1);
    }
  });

  it("projects courier normalized coordinates into accurate Mumbai WGS-84 coordinates", () => {
    const courier42 = INITIAL_MUMBAI_COURIERS.find((c) => c.id === "r_0042")!;
    const latLng = courierToLatLng(courier42);

    expect(latLng.lat).toBeGreaterThanOrEqual(MUMBAI_GEO_BOUNDS.minLat);
    expect(latLng.lat).toBeLessThanOrEqual(MUMBAI_GEO_BOUNDS.maxLat);
    expect(latLng.lng).toBeGreaterThanOrEqual(MUMBAI_GEO_BOUNDS.minLng);
    expect(latLng.lng).toBeLessThanOrEqual(MUMBAI_GEO_BOUNDS.maxLng);

    // Reversible conversion check
    const normalized = latLngToNormalized(latLng.lat, latLng.lng);
    expect(normalized.x).toBeCloseTo(courier42.x, 0);
    expect(normalized.y).toBeCloseTo(courier42.y, 0);
  });
});

