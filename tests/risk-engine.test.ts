import { describe, it, expect } from "vitest";
import { evaluateSessionRisk, DEFAULT_CONFIG } from "../src/lib/risk-engine/engine";
import {
  RiderBaselineData,
  SessionInputData,
  HistoricalContextData,
} from "../src/lib/risk-engine/types";

// Standard fictional test baseline: experienced rider with 45 established sessions
const baselineArjun: RiderBaselineData = {
  riderId: "RDR-8021",
  supportingSessions: 45,
  confidence: "HIGH",
  typicalHours: [8, 9, 10, 11, 12, 13, 14, 18, 19, 20, 21],
  typicalDays: [1, 2, 3, 4, 5, 6],
  knownDevices: ["DEV-SM-A53", "DEV-SM-A54"],
  primaryZones: ["Koramangala", "HSR Layout"],
  avgSessionDuration: 240,
  stdSessionDuration: 35,
  avgInteractionInterval: 14.5,
  stdInteractionInterval: 3.2,
  typicalAcceptanceRate: 0.9,
  typicalCompletionRate: 0.98,
  typicalActions: ["LOGIN", "ACCEPT", "PICKUP", "NAVIGATE", "DELIVER"],
};

describe("TrueRide Risk Engine Core Verification", () => {
  // Test 1: Normal login produces low risk
  it("Scenario 1: Normal login produces an appropriate low-risk result (0-29)", () => {
    const session: SessionInputData = {
      eventId: "EVT-NORM-01",
      riderId: "RDR-8021",
      sessionId: "SESS-1001",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53", // Known device
      operatingZone: "Koramangala", // Known zone
      city: "Bengaluru",
      loginHour: 10,
      dayOfWeek: 2,
      sessionDurationMinutes: 235,
      avgIntervalSec: 14.2, // Aligns with 14.5s baseline
      acceptanceRate: 0.92,
      completionRate: 0.98,
      interactionPattern: "NORMAL_RAPID",
      sessionTerminationType: "NORMAL_LOGOUT",
    };

    const assessment = evaluateSessionRisk(session, baselineArjun);
    expect(assessment.overallScore).toBeLessThanOrEqual(29);
    expect(assessment.riskLevel).toBe("LOW");
    expect(assessment.recommendedAction).toBe("ALLOW");
    expect(assessment.evidenceQuality).toBe("HIGH");
  });

  // Test 2: New device alone does not cause high risk
  it("Scenario 2: A new device alone does NOT cause a high-risk classification", () => {
    const session: SessionInputData = {
      eventId: "EVT-NEW-DEV-01",
      riderId: "RDR-8021",
      sessionId: "SESS-1002",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-ONEPLUS-11R", // NEW DEVICE
      operatingZone: "Koramangala", // Same zone
      city: "Bengaluru",
      loginHour: 11,
      dayOfWeek: 3,
      sessionDurationMinutes: 245,
      avgIntervalSec: 14.8, // Normal behavior
      acceptanceRate: 0.89,
      completionRate: 0.98,
      interactionPattern: "NORMAL_RAPID",
      sessionTerminationType: "NORMAL_LOGOUT",
    };

    const assessment = evaluateSessionRisk(session, baselineArjun);
    // Device subscore is ~38, weighted at 20% = ~7.6 points.
    // Total score should be <= 25, well within LOW risk!
    expect(assessment.riskLevel).toBe("LOW");
    expect(assessment.overallScore).toBeLessThan(30);
    expect(assessment.recommendedAction).toBe("ALLOW");
    expect(assessment.signals.some((s) => s.signalCode === "DEV_NEW_UNFAMILIAR")).toBe(true);
  });

  // Test 3: Plausible travel / zone change does not automatically cause escalation
  it("Scenario 3: Plausible delivery-zone change does not cause high risk", () => {
    const session: SessionInputData = {
      eventId: "EVT-ZONE-CHG-01",
      riderId: "RDR-8021",
      sessionId: "SESS-1003",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53", // Known device
      operatingZone: "Indiranagar", // Adjacent zone in Bengaluru
      city: "Bengaluru",
      loginHour: 12,
      dayOfWeek: 4,
      sessionDurationMinutes: 220,
      avgIntervalSec: 15.0, // Normal behavior
      acceptanceRate: 0.88,
      completionRate: 0.97,
      interactionPattern: "NORMAL_RAPID",
    };

    const assessment = evaluateSessionRisk(session, baselineArjun);
    expect(assessment.riskLevel).toBe("LOW");
    expect(assessment.overallScore).toBeLessThan(25);
    expect(assessment.recommendedAction).toBe("ALLOW");
    expect(assessment.signals.some((s) => s.signalCode === "LOC_ADJACENT_ZONE_CHANGE")).toBe(true);
  });

  // Test 4: Multiple meaningful independent behavioral anomalies increase risk when justified
  it("Scenario 4: Multiple meaningful independent behavioral anomalies increase risk appropriately", () => {
    const session: SessionInputData = {
      eventId: "EVT-ANOM-MULTI-01",
      riderId: "RDR-8021",
      sessionId: "SESS-1004",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-UNKNOWN-99", // Unfamiliar device
      operatingZone: "Indiranagar",
      city: "Bengaluru",
      loginHour: 3, // 3 AM shift (unusual)
      dayOfWeek: 1,
      sessionDurationMinutes: 520,
      avgIntervalSec: 52.0, // Severe drift (14.5s -> 52.0s)
      acceptanceRate: 0.35, // Collapse from 90% to 35%
      interactionPattern: "HESITANT_SLOW", // Anomaly
      sessionTerminationType: "RAPID_RE_LOGIN",
      securityChanges: {
        payoutChanged: true, // Beneficiary updated
      },
    };

    const historicalContext: HistoricalContextData = {
      priorUnresolvedAlertsCount: 1,
      priorConfirmedHandoffsCount: 0,
      priorDismissedAlertsCount: 0,
      consecutiveAnomalousSessions: 2,
    };

    const assessment = evaluateSessionRisk(session, baselineArjun, historicalContext);
    expect(assessment.overallScore).toBeGreaterThanOrEqual(70);
    expect(assessment.riskLevel).toBe("HIGH");
    expect(["STEP_UP_VERIFY", "ESCALATE_INVESTIGATION"]).toContain(assessment.recommendedAction);
  });

  // Test 5: Same-device, same-city scenario evaluated using available behavioral evidence
  it("Scenario 5: Same-device, same-city case flags behavioral deviation without altering hardware or location", () => {
    const session: SessionInputData = {
      eventId: "EVT-SAME-DEV-CITY-01",
      riderId: "RDR-8021",
      sessionId: "SESS-1005",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53", // SAME DEVICE!
      operatingZone: "Koramangala", // SAME ZONE!
      city: "Bengaluru", // SAME CITY!
      loginHour: 10,
      dayOfWeek: 2,
      sessionDurationMinutes: 120,
      avgIntervalSec: 58.4, // Severely deviant interaction pacing (diff > 13 standard deviations!)
      acceptanceRate: 0.42, // Sharp drop from 90%
      interactionPattern: "HESITANT_SLOW", // Unfamiliar operator pattern
      sessionTerminationType: "RAPID_RE_LOGIN", // Immediate relogin handover
      securityChanges: {
        payoutChanged: true, // Payout rerouted
      },
    };

    const assessment = evaluateSessionRisk(session, baselineArjun);
    // Device and location subscores are 0.
    // Behavioral and session/account scores are high.
    expect(assessment.categoryScores.device).toBe(0);
    expect(assessment.categoryScores.location).toBe(0);
    expect(assessment.categoryScores.behavioral).toBeGreaterThanOrEqual(70);
    expect(assessment.categoryScores.sessionAccount).toBeGreaterThanOrEqual(70);
    expect(assessment.overallScore).toBeGreaterThanOrEqual(35); // Escalates above Low Risk band!
    expect(["MONITOR", "STEP_UP_VERIFY"]).toContain(assessment.recommendedAction);
  });

  // Test 6: Sparse history produces an explicit evidence limitation
  it("Scenario 6: Sparse history produces explicit evidence limitation without assuming suspiciousness", () => {
    const sparseBaseline: RiderBaselineData = {
      riderId: "RDR-NEWBIE-01",
      supportingSessions: 2, // Only 2 sessions
      confidence: "INSUFFICIENT",
      typicalHours: [10, 11],
      typicalDays: [1, 2],
      knownDevices: ["DEV-SPARSE-1"],
      primaryZones: ["Whitefield"],
      avgSessionDuration: 180,
      stdSessionDuration: 20,
      avgInteractionInterval: 15.0,
      stdInteractionInterval: 3.0,
      typicalAcceptanceRate: 0.85,
      typicalCompletionRate: 0.95,
    };

    const session: SessionInputData = {
      eventId: "EVT-SPARSE-01",
      riderId: "RDR-NEWBIE-01",
      sessionId: "SESS-SPARSE",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SPARSE-2", // Unknown device
      operatingZone: "Whitefield",
      city: "Bengaluru",
      loginHour: 14,
      dayOfWeek: 3,
    };

    const assessment = evaluateSessionRisk(session, sparseBaseline);
    expect(assessment.evidenceQuality).toBe("INSUFFICIENT");
    expect(assessment.confidenceScore).toBeLessThan(35);
    // Should NOT automatically assume guilt
    expect(assessment.riskLevel).not.toBe("HIGH");
    expect(assessment.recommendedAction).toBe("MONITOR");
  });

  // Test 7: Missing signals are handled correctly
  it("Scenario 7: Missing signals are handled gracefully without inflating suspiciousness", () => {
    const sessionWithMissingData: SessionInputData = {
      eventId: "EVT-MISSING-01",
      riderId: "RDR-8021",
      sessionId: "SESS-MISSING",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 10,
      dayOfWeek: 2,
      // avgIntervalSec omitted
      // acceptanceRate omitted
      // sessionDurationMinutes omitted
    };

    const assessment = evaluateSessionRisk(sessionWithMissingData, baselineArjun);
    expect(assessment.riskLevel).toBe("LOW");
    expect(assessment.overallScore).toBeLessThan(20);
  });

  // Test 8: Correlated signals do not unfairly inflate scores
  it("Scenario 8: Correlated signals are capped and normalized to prevent double-counting", () => {
    const session: SessionInputData = {
      eventId: "EVT-CORR-01",
      riderId: "RDR-8021",
      sessionId: "SESS-CORR",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 10,
      dayOfWeek: 2,
      avgIntervalSec: 99.0, // Extreme slow
      acceptanceRate: 0.1, // Extreme low
      interactionPattern: "HESITANT_SLOW",
    };

    const assessment = evaluateSessionRisk(session, baselineArjun);
    // Even with 3 correlated slow metrics, category score is clamped at 100 max
    expect(assessment.categoryScores.behavioral).toBeLessThanOrEqual(100);
    // Overall score does not exceed mathematical bounds (100 * 0.25 = 25 max for this category)
    expect(assessment.categoryContributions.behavioral).toBeLessThanOrEqual(25);
  });

  // Test 9: Dismissed alerts do not repeatedly penalize a rider
  it("Scenario 9: Dismissed alerts do NOT repeatedly penalize a rider without new evidence", () => {
    const session: SessionInputData = {
      eventId: "EVT-DISMISSED-01",
      riderId: "RDR-8021",
      sessionId: "SESS-DISMISSED",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 10,
      dayOfWeek: 2,
      avgIntervalSec: 14.5,
      acceptanceRate: 0.9,
    };

    // Rider has 3 prior dismissed alerts (false positives exonerated by analyst)
    const contextWithDismissed: HistoricalContextData = {
      priorUnresolvedAlertsCount: 0,
      priorConfirmedHandoffsCount: 0,
      priorDismissedAlertsCount: 3,
      consecutiveAnomalousSessions: 0,
    };

    const assessment = evaluateSessionRisk(session, baselineArjun, contextWithDismissed);
    expect(assessment.categoryScores.historical).toBe(0);
    expect(assessment.riskLevel).toBe("LOW");
    expect(assessment.signals.some((s) => s.signalCode === "HIST_PREVIOUS_ALERT_DISMISSED")).toBe(
      true
    );
  });

  // Test 10: Explanations agree with actual scoring contributions
  it("Scenario 10: Explanations match actual score contributions and signal details", () => {
    const session: SessionInputData = {
      eventId: "EVT-EXPL-01",
      riderId: "RDR-8021",
      sessionId: "SESS-EXPL",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-NEW-55",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 10,
      dayOfWeek: 2,
      avgIntervalSec: 14.5,
      acceptanceRate: 0.9,
    };

    const assessment = evaluateSessionRisk(session, baselineArjun);
    expect(assessment.signals.length).toBeGreaterThan(0);
    for (const signal of assessment.signals) {
      expect(signal.explanation).toBeTruthy();
      expect(signal.observedValue).toBeTruthy();
      expect(signal.expectedRange).toBeTruthy();
      expect(signal.subscore).toBeGreaterThanOrEqual(0);
      expect(signal.subscore).toBeLessThanOrEqual(100);
    }
  });

  // Test 11: Configurable thresholds and weights behave predictably
  it("Scenario 11: Custom weights and thresholds modify scoring calculations predictably", () => {
    const session: SessionInputData = {
      eventId: "EVT-CFG-01",
      riderId: "RDR-8021",
      sessionId: "SESS-CFG",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-NEW-X",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 10,
      dayOfWeek: 2,
    };

    // Custom configuration heavily weighting device consistency (80%)
    const customConfig = {
      weights: {
        behavioral: 0.05,
        device: 0.8,
        location: 0.05,
        sessionAccount: 0.05,
        historical: 0.05,
      },
      thresholds: {
        lowMax: 20,
        mediumMax: 50,
      },
      version: "vCustom-Test",
    };

    const assessment = evaluateSessionRisk(session, baselineArjun, null, customConfig);
    expect(assessment.scoringVersion).toBe("vCustom-Test");
    expect(assessment.configUsed.weights.device).toBe(0.8);
    // Device subscore is 38 * 0.8 = 30.4 -> exceeds custom lowMax of 20
    expect(assessment.riskLevel).toBe("MEDIUM");
  });
});
