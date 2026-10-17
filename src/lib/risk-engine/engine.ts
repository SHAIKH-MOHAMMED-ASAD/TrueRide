import {
  AssessmentResult,
  CategoryScores,
  EvidenceQuality,
  HistoricalContextData,
  RecommendedAction,
  RiderBaselineData,
  RiskEngineConfig,
  RiskLevel,
  RiskSignalDetail,
  SessionInputData,
} from "./types";

export const DEFAULT_CONFIG: RiskEngineConfig = {
  weights: {
    behavioral: 0.25,
    device: 0.2,
    location: 0.15,
    sessionAccount: 0.2,
    historical: 0.2,
  },
  thresholds: {
    lowMax: 29,
    mediumMax: 69,
  },
  version: "v1.0.0-hackathon",
};

/**
 * Calculates Evidence Quality and Confidence Score based on supporting historical sessions
 * and session completeness.
 */
export function calculateEvidenceQuality(
  baseline: RiderBaselineData | null | undefined,
  session: SessionInputData
): { quality: EvidenceQuality; confidenceScore: number } {
  if (!baseline || baseline.supportingSessions < 3) {
    return { quality: "INSUFFICIENT", confidenceScore: 20 };
  }

  let baseScore = 0;
  if (baseline.supportingSessions >= 25) {
    baseScore = 95;
  } else if (baseline.supportingSessions >= 15) {
    baseScore = 80;
  } else if (baseline.supportingSessions >= 7) {
    baseScore = 65;
  } else {
    baseScore = 40;
  }

  // Deduct slightly if key behavioral metrics are missing in this session
  let fieldPenalty = 0;
  if (session.avgIntervalSec === undefined) fieldPenalty += 10;
  if (session.acceptanceRate === undefined) fieldPenalty += 5;
  if (session.sessionDurationMinutes === undefined) fieldPenalty += 5;

  const confidenceScore = Math.max(15, Math.min(100, baseScore - fieldPenalty));

  let quality: EvidenceQuality = "HIGH";
  if (confidenceScore < 35 || baseline.supportingSessions < 4) {
    quality = "INSUFFICIENT";
  } else if (confidenceScore < 60 || baseline.supportingSessions < 8) {
    quality = "LOW";
  } else if (confidenceScore < 80 || baseline.supportingSessions < 18) {
    quality = "MODERATE";
  }

  return { quality, confidenceScore };
}

/**
 * Main Standalone Risk Evaluation Engine
 */
export function evaluateSessionRisk(
  session: SessionInputData,
  baseline: RiderBaselineData | null | undefined,
  historicalContext?: HistoricalContextData | null,
  customConfig?: Partial<RiskEngineConfig>
): AssessmentResult {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  const config: RiskEngineConfig = {
    weights: { ...DEFAULT_CONFIG.weights, ...customConfig?.weights },
    thresholds: { ...DEFAULT_CONFIG.thresholds, ...customConfig?.thresholds },
    version: customConfig?.version || DEFAULT_CONFIG.version,
  };

  const { quality: evidenceQuality, confidenceScore } = calculateEvidenceQuality(
    baseline,
    session
  );

  const signals: RiskSignalDetail[] = [];
  const security = session.securityChanges;

  // =========================================================================
  // CATEGORY A: BEHAVIORAL CONSISTENCY (25%)
  // =========================================================================
  let behavioralScore = 0;

  if (!baseline || evidenceQuality === "INSUFFICIENT") {
    // Sparse/missing baseline - neutral score, do not penalize
    signals.push({
      category: "BEHAVIORAL",
      signalCode: "BEH_SPARSE_HISTORY",
      name: "Sparse Behavioral Profile",
      observedValue: `${baseline?.supportingSessions ?? 0} supporting sessions`,
      expectedRange: "Minimum 10 sessions required for baseline",
      subscore: 10,
      contribution: 10 * config.weights.behavioral,
      explanation:
        "Insufficient historical sessions to establish reliable individual baseline. Neutral score assigned without penalty.",
      evidenceQuality: "INSUFFICIENT",
    });
    behavioralScore = 10;
  } else {
    const pointList: number[] = [];

    // 1. App interaction interval deviation
    if (session.avgIntervalSec !== undefined && baseline.avgInteractionInterval > 0) {
      const std = Math.max(baseline.stdInteractionInterval || 3.0, 1.5);
      const diff = Math.abs(session.avgIntervalSec - baseline.avgInteractionInterval);
      const zScore = diff / std;

      if (zScore > 4.5) {
        pointList.push(90);
        signals.push({
          category: "BEHAVIORAL",
          signalCode: "BEH_INTERVAL_EXTREME_ANOMALY",
          name: "Action Interval Severely Anomalous",
          observedValue: `${session.avgIntervalSec.toFixed(1)}s avg interval`,
          expectedRange: `${(baseline.avgInteractionInterval - 2 * std).toFixed(1)}s - ${(
            baseline.avgInteractionInterval + 2 * std
          ).toFixed(1)}s`,
          subscore: 90,
          contribution: 90 * (config.weights.behavioral / 3),
          explanation: `Inter-action timing deviates by ${zScore.toFixed(
            1
          )} standard deviations from rider's characteristic pacing, indicating possible alternate operator.`,
          evidenceQuality,
        });
      } else if (zScore > 2.5) {
        pointList.push(50);
        signals.push({
          category: "BEHAVIORAL",
          signalCode: "BEH_INTERVAL_MODERATE_DRIFT",
          name: "Action Interval Drift",
          observedValue: `${session.avgIntervalSec.toFixed(1)}s avg interval`,
          expectedRange: `${(baseline.avgInteractionInterval - 1.5 * std).toFixed(1)}s - ${(
            baseline.avgInteractionInterval + 1.5 * std
          ).toFixed(1)}s`,
          subscore: 50,
          contribution: 50 * (config.weights.behavioral / 3),
          explanation: `Noticeable variance in touch/interaction cadence compared to baseline (${zScore.toFixed(
            1
          )}σ).`,
          evidenceQuality,
        });
      } else {
        pointList.push(5);
        signals.push({
          category: "BEHAVIORAL",
          signalCode: "BEH_INTERVAL_CONSISTENT",
          name: "Action Interval Consistent",
          observedValue: `${session.avgIntervalSec.toFixed(1)}s avg interval`,
          expectedRange: `${(baseline.avgInteractionInterval - 2 * std).toFixed(1)}s - ${(
            baseline.avgInteractionInterval + 2 * std
          ).toFixed(1)}s`,
          subscore: 5,
          contribution: 5 * (config.weights.behavioral / 3),
          explanation: "Interaction tempo aligns with established rider rhythm.",
          evidenceQuality,
        });
      }
    }

    // 2. Acceptance & Completion pattern
    if (session.acceptanceRate !== undefined && baseline.typicalAcceptanceRate > 0) {
      const acceptDiff = baseline.typicalAcceptanceRate - session.acceptanceRate;
      if (acceptDiff > 0.35) {
        pointList.push(80);
        signals.push({
          category: "BEHAVIORAL",
          signalCode: "BEH_ACCEPT_RATE_DROP",
          name: "Delivery Acceptance Collapse",
          observedValue: `${Math.round(session.acceptanceRate * 100)}%`,
          expectedRange: `${Math.round((baseline.typicalAcceptanceRate - 0.15) * 100)}% - 100%`,
          subscore: 80,
          contribution: 80 * (config.weights.behavioral / 3),
          explanation:
            "Sharp drop in order acceptance behavior compared to historical baseline preferences.",
          evidenceQuality,
        });
      } else if (acceptDiff > 0.2) {
        pointList.push(40);
      } else {
        pointList.push(0);
      }
    }

    // 3. Interaction Pattern
    if (session.interactionPattern) {
      if (
        session.interactionPattern === "HESITANT_SLOW" ||
        session.interactionPattern === "SCRIPTED_BURST"
      ) {
        pointList.push(85);
        signals.push({
          category: "BEHAVIORAL",
          signalCode: "BEH_PATTERN_ANOMALOUS",
          name: "Unfamiliar Navigation Pattern",
          observedValue: session.interactionPattern,
          expectedRange: "Natural / Fluent Pacing",
          subscore: 85,
          contribution: 85 * (config.weights.behavioral / 3),
          explanation:
            "Interaction pattern exhibits unfamiliar hesitation or automated bursts inconsistent with rider experience level.",
          evidenceQuality,
        });
      } else if (session.interactionPattern === "NORMAL_RAPID") {
        pointList.push(0);
      }
    }

    // 4. Shift / Login hour check
    if (session.loginHour !== undefined && baseline.typicalHours && baseline.typicalHours.length > 0) {
      if (!baseline.typicalHours.includes(session.loginHour)) {
        pointList.push(45);
        signals.push({
          category: "BEHAVIORAL",
          signalCode: "BEH_OFF_HOURS_SHIFT",
          name: "Uncharacteristic Operating Hours",
          observedValue: `${session.loginHour}:00 shift start`,
          expectedRange: `Routine hours: ${baseline.typicalHours[0]}:00 - ${
            baseline.typicalHours[baseline.typicalHours.length - 1]
          }:00`,
          subscore: 45,
          contribution: 45 * 0.05,
          explanation: "Rider is operating outside their established routine delivery hours.",
          evidenceQuality,
        });
      }
    }

    // Compute behavioral score
    if (pointList.length > 0) {
      const maxP = Math.max(...pointList);
      const avgP = pointList.reduce((acc, v) => acc + v, 0) / pointList.length;
      behavioralScore = Math.min(100, Math.round(maxP * 0.65 + avgP * 0.35));
    } else {
      behavioralScore = 10;
    }
  }

  // =========================================================================
  // CATEGORY B: DEVICE CONSISTENCY (20%)
  // Rule: A new device alone MUST NEVER trigger a high-risk classification!
  // =========================================================================
  let deviceScore = 0;
  const isKnownDevice = baseline?.knownDevices?.includes(session.deviceId) ?? false;

  if (isKnownDevice) {
    deviceScore = 0;
    signals.push({
      category: "DEVICE",
      signalCode: "DEV_RECOGNIZED",
      name: "Recognized Rider Device",
      observedValue: session.deviceId,
      expectedRange: baseline?.knownDevices?.join(", ") || "Enrolled device list",
      subscore: 0,
      contribution: 0,
      explanation: "Current hardware identifier matches rider's verified device registry.",
      evidenceQuality,
    });
  } else {
    // New device: Score 38 (mild) by default.
    // If correlated with critical security changes or severe behavioral drift, elevate:
    const hasCorrelatedAnomaly =
      Boolean(security?.payoutChanged) ||
      session.sessionTerminationType === "RAPID_RE_LOGIN" ||
      (session.avgIntervalSec !== undefined &&
        baseline?.avgInteractionInterval !== undefined &&
        Math.abs(session.avgIntervalSec - baseline.avgInteractionInterval) > 20);

    deviceScore = hasCorrelatedAnomaly ? 55 : 38;
    signals.push({
      category: "DEVICE",
      signalCode: hasCorrelatedAnomaly ? "DEV_UNRECOGNIZED_CORRELATED" : "DEV_NEW_UNFAMILIAR",
      name: hasCorrelatedAnomaly
        ? "Unfamiliar Device With Correlated Session Anomalies"
        : "New Unrecognized Device",
      observedValue: `${session.deviceId} (${session.deviceModel || "Unknown Model"})`,
      expectedRange: baseline?.knownDevices?.join(", ") || "Enrolled devices",
      subscore: deviceScore,
      contribution: Math.round(deviceScore * config.weights.device * 10) / 10,
      explanation: hasCorrelatedAnomaly
        ? "New hardware identifier coinciding with critical financial adjustments or acute operational drift."
        : "First login observed on this device identifier. Handled as routine upgrade unless corroborated by other behavioral deviations.",
      evidenceQuality,
    });
  }

  // =========================================================================
  // CATEGORY C: LOCATION & TRAVEL CONSISTENCY (15%)
  // Rule: Plausible zone changes or travel must NOT automatically escalate.
  // =========================================================================
  let locationScore = 0;
  const isPrimaryZone = baseline?.primaryZones?.some(
    (z) => z.toLowerCase() === session.operatingZone.toLowerCase()
  ) ?? false;

  if (isPrimaryZone || !baseline || baseline.primaryZones.length === 0) {
    locationScore = 0;
    signals.push({
      category: "LOCATION",
      signalCode: "LOC_PRIMARY_ZONE",
      name: "Familiar Delivery Zone",
      observedValue: `${session.operatingZone}, ${session.city}`,
      expectedRange: baseline?.primaryZones?.join(", ") || "Primary operating zones",
      subscore: 0,
      contribution: 0,
      explanation: "Operating in standard assigned geographic zone.",
      evidenceQuality,
    });
  } else {
    // Check if zone is in same city or plausible adjacent cluster
    // Plausible zone transition in same city: mild score 20
    // Multiplied by 0.15 = 3.0 points.
    locationScore = 22;
    signals.push({
      category: "LOCATION",
      signalCode: "LOC_ADJACENT_ZONE_CHANGE",
      name: "Plausible Delivery Zone Transition",
      observedValue: `${session.operatingZone}, ${session.city}`,
      expectedRange: baseline.primaryZones.join(", "),
      subscore: 22,
      contribution: 22 * config.weights.location,
      explanation:
        "Rider is active in a neighboring zone. Treated as routine demand re-balancing unless impossible transit speeds are observed.",
      evidenceQuality,
    });
  }

  // =========================================================================
  // CATEGORY D: SESSION & ACCOUNT CHANGES (20%)
  // =========================================================================
  let sessionAccountScore = 0;
  let sessionAccPoints = 0;

  // Session termination & re-login anomalies
  if (session.sessionTerminationType === "RAPID_RE_LOGIN") {
    sessionAccPoints += 45;
    signals.push({
      category: "SESSION_ACCOUNT",
      signalCode: "SESS_RAPID_HANDOFF_RELOGIN",
      name: "Rapid Re-Login Anomaly",
      observedValue: "Immediate session handover across devices",
      expectedRange: "Typical inter-session rest interval",
      subscore: 45,
      contribution: 45 * 0.1,
      explanation:
        "Session terminated abruptly followed by immediate re-authentication from a divergent device signature.",
      evidenceQuality,
    });
  } else if (session.sessionTerminationType === "UNEXPECTED_TERMINATION") {
    sessionAccPoints += 20;
  }

  // Account security adjustments
  if (security) {
    if (security.payoutChanged) {
      sessionAccPoints += 55;
      signals.push({
        category: "SESSION_ACCOUNT",
        signalCode: "ACC_PAYOUT_MODIFIED",
        name: "Payout Beneficiary Alteration",
        observedValue: "Bank / UPI payout details updated immediately prior to session",
        expectedRange: "Unchanged payment beneficiary",
        subscore: 55,
        contribution: 55 * 0.1,
        explanation:
          "High-impact financial routing change detected prior to delivery shift. Often associated with rented account exploitation.",
        evidenceQuality,
      });
    }

    if (security.phoneChanged || security.emailChanged) {
      sessionAccPoints += 35;
      signals.push({
        category: "SESSION_ACCOUNT",
        signalCode: "ACC_CONTACT_MODIFIED",
        name: "Security Contact Info Updated",
        observedValue: "Phone / Email modified",
        expectedRange: "Stable contact credentials",
        subscore: 35,
        contribution: 35 * 0.1,
        explanation: "Primary contact phone or email modified shortly before active session.",
        evidenceQuality,
      });
    }

    if (security.passwordReset) {
      sessionAccPoints += 25;
    }
  }

  sessionAccountScore = Math.min(100, sessionAccPoints);

  if (sessionAccountScore === 0) {
    signals.push({
      category: "SESSION_ACCOUNT",
      signalCode: "SESS_NORMAL_LIFECYCLE",
      name: "Session & Account Stable",
      observedValue: "Clean session lifecycle, zero credential modifications",
      expectedRange: "No critical security changes",
      subscore: 0,
      contribution: 0,
      explanation: "No suspicious session termination or sensitive account credential adjustments.",
      evidenceQuality,
    });
  }

  // =========================================================================
  // CATEGORY E: HISTORICAL RISK CONTEXT (20%)
  // Rule: Dismissed alerts must NOT penalize a rider without new evidence!
  // =========================================================================
  let historicalScore = 0;

  if (historicalContext) {
    let histPoints = 0;

    // Consecutive anomalies
    if (historicalContext.consecutiveAnomalousSessions >= 3) {
      histPoints += 70;
      signals.push({
        category: "HISTORICAL",
        signalCode: "HIST_REPEATED_DRIFT",
        name: "Persistent Multi-Session Drift",
        observedValue: `${historicalContext.consecutiveAnomalousSessions} consecutive deviant sessions`,
        expectedRange: "0 - 1 anomalous sessions",
        subscore: 70,
        contribution: 70 * config.weights.historical,
        explanation:
          "Sustained behavioral divergence spanning consecutive working sessions confirms persistent change in operational habits.",
        evidenceQuality,
      });
    } else if (historicalContext.consecutiveAnomalousSessions === 2) {
      histPoints += 50;
    } else if (historicalContext.consecutiveAnomalousSessions === 1) {
      histPoints += 15;
    }

    // Prior confirmed handoffs
    if (historicalContext.priorConfirmedHandoffsCount > 0) {
      histPoints += 60;
      signals.push({
        category: "HISTORICAL",
        signalCode: "HIST_PRIOR_CONFIRMED_CASE",
        name: "Prior Verified Account Handoff Record",
        observedValue: `${historicalContext.priorConfirmedHandoffsCount} substantiated historical cases`,
        expectedRange: "0 historical cases",
        subscore: 60,
        contribution: 60 * config.weights.historical,
        explanation:
          "Account has previously been validated by Trust & Safety analysts as subjected to unauthorized third-party rental.",
        evidenceQuality,
      });
    }

    // Unresolved open alerts
    if (historicalContext.priorUnresolvedAlertsCount > 0) {
      histPoints += 30;
      signals.push({
        category: "HISTORICAL",
        signalCode: "HIST_UNRESOLVED_ALERTS",
        name: "Unresolved Security Alert Pending",
        observedValue: `${historicalContext.priorUnresolvedAlertsCount} active alert(s)`,
        expectedRange: "0 unresolved alerts",
        subscore: 30,
        contribution: 30 * config.weights.historical,
        explanation: "Account has prior security inquiries pending analyst resolution.",
        evidenceQuality,
      });
    }

    // Check dismissed alerts: MUST NEVER penalize
    if (
      historicalContext.priorDismissedAlertsCount > 0 &&
      historicalContext.priorConfirmedHandoffsCount === 0 &&
      historicalContext.priorUnresolvedAlertsCount === 0
    ) {
      // Rider was previously exonerated / false positive dismissed
      histPoints = Math.max(0, histPoints - 10);
      signals.push({
        category: "HISTORICAL",
        signalCode: "HIST_PREVIOUS_ALERT_DISMISSED",
        name: "Prior Alert Resolved Legitimate",
        observedValue: `${historicalContext.priorDismissedAlertsCount} dismissed cases`,
        expectedRange: "Analyst validated legitimate operation",
        subscore: 0,
        contribution: 0,
        explanation:
          "Previous security inquiries were reviewed and dismissed as legitimate false positives by Trust & Safety. Zero penalty applied.",
        evidenceQuality,
      });
    }

    historicalScore = Math.min(100, histPoints);
  } else {
    // Clean history
    historicalScore = 0;
    signals.push({
      category: "HISTORICAL",
      signalCode: "HIST_CLEAN_RECORD",
      name: "Clean Historical Baseline",
      observedValue: "Zero prior violations",
      expectedRange: "No previous confirmed incidents",
      subscore: 0,
      contribution: 0,
      explanation: "No unresolved alerts or confirmed account-sharing events on record.",
      evidenceQuality,
    });
  }

  // =========================================================================
  // OVERALL WEIGHTED SCORE CALCULATION
  // =========================================================================
  const categoryScores: CategoryScores = {
    behavioral: behavioralScore,
    device: deviceScore,
    location: locationScore,
    sessionAccount: sessionAccountScore,
    historical: historicalScore,
  };

  const categoryContributions: CategoryScores = {
    behavioral: Math.round(behavioralScore * config.weights.behavioral * 10) / 10,
    device: Math.round(deviceScore * config.weights.device * 10) / 10,
    location: Math.round(locationScore * config.weights.location * 10) / 10,
    sessionAccount: Math.round(sessionAccountScore * config.weights.sessionAccount * 10) / 10,
    historical: Math.round(historicalScore * config.weights.historical * 10) / 10,
  };

  const rawOverall =
    behavioralScore * config.weights.behavioral +
    deviceScore * config.weights.device +
    locationScore * config.weights.location +
    sessionAccountScore * config.weights.sessionAccount +
    historicalScore * config.weights.historical;

  const overallScore = Math.min(100, Math.max(0, Math.round(rawOverall * 10) / 10));

  // Determine Risk Level
  let riskLevel: RiskLevel = "LOW";
  if (overallScore > config.thresholds.mediumMax) {
    riskLevel = "HIGH";
  } else if (overallScore > config.thresholds.lowMax) {
    riskLevel = "MEDIUM";
  }

  // Determine Recommended Action (Risk-based Decision Policy)
  let recommendedAction: RecommendedAction = "ALLOW";

  if (riskLevel === "HIGH") {
    // If evidence is solid, escalate; if evidence is lower, request verification first
    if (evidenceQuality === "HIGH" && overallScore >= 78) {
      recommendedAction = "ESCALATE_INVESTIGATION";
    } else {
      recommendedAction = "STEP_UP_VERIFY";
    }
  } else if (riskLevel === "MEDIUM") {
    // Check evidence quality: if insufficient, monitor rather than disturbing the rider
    if (evidenceQuality === "INSUFFICIENT" || evidenceQuality === "LOW") {
      recommendedAction = "MONITOR";
    } else if (
      overallScore >= 50 ||
      (behavioralScore >= 70 && sessionAccountScore >= 40) ||
      (behavioralScore >= 75 && overallScore >= 35)
    ) {
      // Specific to Same-Device/Same-City Rented Account: Acute behavioral drift warrants step-up check
      recommendedAction = "STEP_UP_VERIFY";
    } else {
      recommendedAction = "MONITOR";
    }
  } else {
    if (evidenceQuality === "INSUFFICIENT") {
      recommendedAction = "MONITOR";
    } else {
      recommendedAction = "ALLOW";
    }
  }

  const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const scoringLatencyMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    overallScore,
    riskLevel,
    evidenceQuality,
    confidenceScore,
    categoryScores,
    categoryContributions,
    signals,
    recommendedAction,
    scoringVersion: config.version,
    scoringLatencyMs,
    configUsed: config,
  };
}
