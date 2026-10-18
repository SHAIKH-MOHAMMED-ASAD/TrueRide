import { evaluateSessionRisk } from "../risk-engine/engine";
import {
  RiderBaselineData,
  SessionInputData,
  HistoricalContextData,
} from "../risk-engine/types";

export interface EvaluationItem {
  id: string;
  name: string;
  groundTruth: "HANDOFF" | "LEGITIMATE";
  scenarioType:
    | "NORMAL"
    | "NEW_DEVICE"
    | "ZONE_CHANGE"
    | "SHIFT_CHANGE"
    | "SAME_DEVICE_HANDOFF"
    | "NEW_DEVICE_HANDOFF"
    | "MULTI_SESSION_DRIFT"
    | "SPARSE_HISTORY"
    | "ENVIRONMENTAL_NOISE";
  session: SessionInputData;
  baseline: RiderBaselineData;
  historicalContext?: HistoricalContextData;
}

export interface EvaluationMetricsResult {
  totalEvaluated: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  challengeRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  items: Array<{
    id: string;
    name: string;
    groundTruth: string;
    scenarioType: string;
    predictedRiskLevel: string;
    overallScore: number;
    recommendedAction: string;
    isCorrect: boolean;
    classification: "TP" | "FP" | "TN" | "FN";
    latencyMs: number;
  }>;
}

const standardBaseline: RiderBaselineData = {
  riderId: "RDR-EVAL-01",
  supportingSessions: 40,
  confidence: "HIGH",
  typicalHours: [8, 9, 10, 11, 12, 13, 14, 18, 19, 20, 21],
  typicalDays: [1, 2, 3, 4, 5, 6],
  knownDevices: ["DEV-SM-A53"],
  primaryZones: ["Koramangala", "HSR Layout"],
  avgSessionDuration: 240,
  stdSessionDuration: 35,
  avgInteractionInterval: 14.5,
  stdInteractionInterval: 3.2,
  typicalAcceptanceRate: 0.9,
  typicalCompletionRate: 0.98,
  typicalActions: ["LOGIN", "ACCEPT", "PICKUP", "NAVIGATE", "DELIVER"],
};

export const HELD_OUT_TEST_SET: EvaluationItem[] = [
  // 1-5: Clean Routine Sessions
  {
    id: "TEST-01",
    name: "Routine Morning Shift #1",
    groundTruth: "LEGITIMATE",
    scenarioType: "NORMAL",
    session: {
      eventId: "EVAL-01",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-01",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 9,
      dayOfWeek: 2,
      sessionDurationMinutes: 240,
      avgIntervalSec: 14.1,
      acceptanceRate: 0.92,
      interactionPattern: "NORMAL_RAPID",
    },
    baseline: standardBaseline,
  },
  {
    id: "TEST-02",
    name: "Routine Afternoon Shift #2",
    groundTruth: "LEGITIMATE",
    scenarioType: "NORMAL",
    session: {
      eventId: "EVAL-02",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-02",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 13,
      dayOfWeek: 3,
      sessionDurationMinutes: 250,
      avgIntervalSec: 14.8,
      acceptanceRate: 0.89,
      interactionPattern: "NORMAL_RAPID",
    },
    baseline: standardBaseline,
  },
  {
    id: "TEST-03",
    name: "Routine Evening Peak #3",
    groundTruth: "LEGITIMATE",
    scenarioType: "NORMAL",
    session: {
      eventId: "EVAL-03",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-03",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      operatingZone: "HSR Layout",
      city: "Bengaluru",
      loginHour: 19,
      dayOfWeek: 5,
      sessionDurationMinutes: 220,
      avgIntervalSec: 13.9,
      acceptanceRate: 0.94,
      interactionPattern: "NORMAL_RAPID",
    },
    baseline: standardBaseline,
  },

  // 4-6: Legitimate Device Upgrades
  {
    id: "TEST-04",
    name: "Legitimate Phone Upgrade (Pixel 8)",
    groundTruth: "LEGITIMATE",
    scenarioType: "NEW_DEVICE",
    session: {
      eventId: "EVAL-04",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-04",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-PIXEL-8",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 10,
      dayOfWeek: 2,
      sessionDurationMinutes: 245,
      avgIntervalSec: 14.4,
      acceptanceRate: 0.91,
      interactionPattern: "NORMAL_RAPID",
    },
    baseline: standardBaseline,
  },
  {
    id: "TEST-05",
    name: "Legitimate Backup Phone (OnePlus 11)",
    groundTruth: "LEGITIMATE",
    scenarioType: "NEW_DEVICE",
    session: {
      eventId: "EVAL-05",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-05",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-OP-11",
      operatingZone: "HSR Layout",
      city: "Bengaluru",
      loginHour: 11,
      dayOfWeek: 4,
      sessionDurationMinutes: 230,
      avgIntervalSec: 14.7,
      acceptanceRate: 0.88,
      interactionPattern: "NORMAL_RAPID",
    },
    baseline: standardBaseline,
  },

  // 6-8: Legitimate Zone & Shift Changes
  {
    id: "TEST-06",
    name: "Adjacent Zone Travel (Indiranagar)",
    groundTruth: "LEGITIMATE",
    scenarioType: "ZONE_CHANGE",
    session: {
      eventId: "EVAL-06",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-06",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      operatingZone: "Indiranagar",
      city: "Bengaluru",
      loginHour: 12,
      dayOfWeek: 3,
      sessionDurationMinutes: 210,
      avgIntervalSec: 15.0,
      acceptanceRate: 0.9,
    },
    baseline: standardBaseline,
  },
  {
    id: "TEST-07",
    name: "Overnight Incentive Shift (11 PM)",
    groundTruth: "LEGITIMATE",
    scenarioType: "SHIFT_CHANGE",
    session: {
      eventId: "EVAL-07",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-07",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 23,
      dayOfWeek: 6,
      sessionDurationMinutes: 190,
      avgIntervalSec: 15.2,
      acceptanceRate: 0.85,
    },
    baseline: standardBaseline,
  },

  // 8-10: Environmental Noise / Mild Fatigue (Benign False Positives)
  {
    id: "TEST-08",
    name: "Rain Moisture Touch Glitch",
    groundTruth: "LEGITIMATE",
    scenarioType: "ENVIRONMENTAL_NOISE",
    session: {
      eventId: "EVAL-08",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-08",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 18,
      dayOfWeek: 4,
      avgIntervalSec: 28.5, // Touch screen delays from rain
      acceptanceRate: 0.82,
    },
    baseline: standardBaseline,
  },
  {
    id: "TEST-09",
    name: "New Driver Sparse History",
    groundTruth: "LEGITIMATE",
    scenarioType: "SPARSE_HISTORY",
    session: {
      eventId: "EVAL-09",
      riderId: "RDR-NEW",
      sessionId: "SESS-E-09",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-NEW-01",
      operatingZone: "Whitefield",
      city: "Bengaluru",
      loginHour: 14,
      dayOfWeek: 2,
    },
    baseline: {
      ...standardBaseline,
      supportingSessions: 2,
      confidence: "INSUFFICIENT",
    },
  },

  // 10-15: Confirmed Handoff Scenarios (GROUND TRUTH: POSITIVE / HANDOFF)
  {
    id: "TEST-10",
    name: "Same Phone Same City Handoff #1",
    groundTruth: "HANDOFF",
    scenarioType: "SAME_DEVICE_HANDOFF",
    session: {
      eventId: "EVAL-10",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-10",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53", // SAME PHONE
      operatingZone: "Koramangala", // SAME ZONE
      city: "Bengaluru", // SAME CITY
      loginHour: 10,
      dayOfWeek: 2,
      avgIntervalSec: 58.2, // 13σ drift
      acceptanceRate: 0.38,
      interactionPattern: "HESITANT_SLOW",
      sessionTerminationType: "RAPID_RE_LOGIN",
      securityChanges: { payoutChanged: true },
    },
    baseline: standardBaseline,
  },
  {
    id: "TEST-11",
    name: "Same Phone Same City Handoff #2",
    groundTruth: "HANDOFF",
    scenarioType: "SAME_DEVICE_HANDOFF",
    session: {
      eventId: "EVAL-11",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-11",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53", // SAME PHONE
      operatingZone: "HSR Layout",
      city: "Bengaluru",
      loginHour: 14,
      dayOfWeek: 3,
      avgIntervalSec: 62.0, // Severe drift
      acceptanceRate: 0.42,
      interactionPattern: "HESITANT_SLOW",
      sessionTerminationType: "RAPID_RE_LOGIN",
    },
    baseline: standardBaseline,
    historicalContext: {
      consecutiveAnomalousSessions: 2,
      priorUnresolvedAlertsCount: 1,
      priorConfirmedHandoffsCount: 0,
      priorDismissedAlertsCount: 0,
    },
  },
  {
    id: "TEST-12",
    name: "Unfamiliar Device Rented Account with Payout Route Change",
    groundTruth: "HANDOFF",
    scenarioType: "NEW_DEVICE_HANDOFF",
    session: {
      eventId: "EVAL-12",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-12",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-ROGUE-REDMI",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 2,
      dayOfWeek: 1,
      avgIntervalSec: 54.0,
      acceptanceRate: 0.35,
      interactionPattern: "HESITANT_SLOW",
      sessionTerminationType: "RAPID_RE_LOGIN",
      securityChanges: { payoutChanged: true, phoneChanged: true },
    },
    baseline: standardBaseline,
  },
  {
    id: "TEST-13",
    name: "Multi-Session Persistent Behavioral Drift",
    groundTruth: "HANDOFF",
    scenarioType: "MULTI_SESSION_DRIFT",
    session: {
      eventId: "EVAL-13",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-13",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 11,
      dayOfWeek: 4,
      avgIntervalSec: 51.0,
      acceptanceRate: 0.45,
      interactionPattern: "HESITANT_SLOW",
      sessionTerminationType: "NORMAL_LOGOUT",
    },
    baseline: standardBaseline,
    historicalContext: {
      consecutiveAnomalousSessions: 3,
      priorUnresolvedAlertsCount: 1,
      priorConfirmedHandoffsCount: 1,
      priorDismissedAlertsCount: 0,
    },
  },
  {
    id: "TEST-14",
    name: "Unfamiliar Device Sudden Shift & Navigation Hesitation",
    groundTruth: "HANDOFF",
    scenarioType: "NEW_DEVICE_HANDOFF",
    session: {
      eventId: "EVAL-14",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-14",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-VIVO-STRANGER",
      operatingZone: "Whitefield",
      city: "Bengaluru",
      loginHour: 4,
      dayOfWeek: 2,
      avgIntervalSec: 49.0,
      acceptanceRate: 0.4,
      interactionPattern: "HESITANT_SLOW",
      sessionTerminationType: "RAPID_RE_LOGIN",
      securityChanges: { payoutChanged: true },
    },
    baseline: standardBaseline,
  },
  {
    id: "TEST-15",
    name: "Automated Clicker / Scripted Bot Pattern",
    groundTruth: "HANDOFF",
    scenarioType: "SAME_DEVICE_HANDOFF",
    session: {
      eventId: "EVAL-15",
      riderId: "RDR-EVAL-01",
      sessionId: "SESS-E-15",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 12,
      dayOfWeek: 3,
      avgIntervalSec: 1.2, // Robotically fast
      interactionPattern: "SCRIPTED_BURST",
      acceptanceRate: 1.0,
      sessionTerminationType: "NORMAL_LOGOUT",
    },
    baseline: standardBaseline,
  },
];

/**
 * Run evaluation over the entire held-out dataset and compute precision, recall, FPR, latency.
 */
export function runSystemEvaluation(): EvaluationMetricsResult {
  const latencies: number[] = [];
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  const items = HELD_OUT_TEST_SET.map((item) => {
    const start = performance.now();
    const assessment = evaluateSessionRisk(
      item.session,
      item.baseline,
      item.historicalContext
    );
    const end = performance.now();
    const latencyMs = Math.round((end - start) * 100) / 100;
    latencies.push(latencyMs);

    // Classification criteria:
    // "CHALLENGE" = Medium (>= 50) or High Risk OR Step-up verification recommended
    const isFlagged =
      assessment.riskLevel === "HIGH" ||
      assessment.recommendedAction === "STEP_UP_VERIFY" ||
      assessment.recommendedAction === "ESCALATE_INVESTIGATION" ||
      assessment.overallScore >= 35;

    let classification: "TP" | "FP" | "TN" | "FN";

    if (item.groundTruth === "HANDOFF") {
      if (isFlagged) {
        classification = "TP";
        tp++;
      } else {
        classification = "FN";
        fn++;
      }
    } else {
      if (isFlagged) {
        classification = "FP";
        fp++;
      } else {
        classification = "TN";
        tn++;
      }
    }

    const isCorrect =
      classification === "TP" || classification === "TN";

    return {
      id: item.id,
      name: item.name,
      groundTruth: item.groundTruth,
      scenarioType: item.scenarioType,
      predictedRiskLevel: assessment.riskLevel,
      overallScore: assessment.overallScore,
      recommendedAction: assessment.recommendedAction,
      isCorrect,
      classification,
      latencyMs,
    };
  });

  const totalEvaluated = HELD_OUT_TEST_SET.length;
  const precision = tp + fp > 0 ? Math.round((tp / (tp + fp)) * 1000) / 10 : 0;
  const recall = tp + fn > 0 ? Math.round((tp / (tp + fn)) * 1000) / 10 : 0;
  const f1Score =
    precision + recall > 0
      ? Math.round(((2 * (precision * recall)) / (precision + recall)) * 10) / 10
      : 0;

  const falsePositiveRate =
    fp + tn > 0 ? Math.round((fp / (fp + tn)) * 1000) / 10 : 0;

  const challengeRate =
    totalEvaluated > 0
      ? Math.round(((tp + fp) / totalEvaluated) * 1000) / 10
      : 0;

  latencies.sort((a, b) => a - b);
  const avgLatencyMs =
    Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 100) /
    100;
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95LatencyMs = latencies[p95Index] || latencies[latencies.length - 1];

  return {
    totalEvaluated,
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    precision,
    recall,
    f1Score,
    falsePositiveRate,
    challengeRate,
    avgLatencyMs,
    p95LatencyMs,
    items,
  };
}

/**
 * Format system evaluation benchmark into clean, structured CSV
 */
export function exportEvaluationToCsv(evaluation: EvaluationMetricsResult): string {
  const summaryLines = [
    `"=== TrueRide System Evaluation Benchmark Summary ==="`,
    `"Metric","Value"`,
    `"Total Evaluated",${evaluation.totalEvaluated}`,
    `"Precision (%)",${evaluation.precision}`,
    `"Recall (%)",${evaluation.recall}`,
    `"F1 Score (%)",${evaluation.f1Score}`,
    `"False Positive Rate (%)",${evaluation.falsePositiveRate}`,
    `"Challenge Rate (%)",${evaluation.challengeRate}`,
    `"True Positives",${evaluation.truePositives}`,
    `"False Positives",${evaluation.falsePositives}`,
    `"True Negatives",${evaluation.trueNegatives}`,
    `"False Negatives",${evaluation.falseNegatives}`,
    `"Average Latency (ms)",${evaluation.avgLatencyMs}`,
    `"P95 Latency (ms)",${evaluation.p95LatencyMs}`,
    ``,
    `"=== Detailed Test Item Results ==="`,
    `"itemId","name","groundTruth","scenarioType","predictedRiskLevel","overallScore","recommendedAction","classification","isCorrect","latencyMs"`,
  ];

  const detailLines = evaluation.items.map((it) =>
    [
      it.id,
      `"${it.name.replace(/"/g, '""')}"`,
      it.groundTruth,
      it.scenarioType,
      it.predictedRiskLevel,
      it.overallScore,
      it.recommendedAction,
      it.classification,
      it.isCorrect ? "true" : "false",
      it.latencyMs,
    ].join(",")
  );

  return [...summaryLines, ...detailLines].join("\n");
}
