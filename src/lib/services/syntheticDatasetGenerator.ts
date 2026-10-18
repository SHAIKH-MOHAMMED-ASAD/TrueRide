import { evaluateSessionRisk } from "../risk-engine/engine";
import { RiderBaselineData, SessionInputData } from "../risk-engine/types";

export type GroundTruthScenario =
  | "LEGITIMATE"
  | "RENTED_ACCOUNT_HANDOFF"
  | "NEW_DEVICE_LEGITIMATE"
  | "ZONE_CHANGE_LEGITIMATE"
  | "ACCOUNT_TAKEOVER_HIJACK";

export interface SyntheticSessionRecord {
  eventId: string;
  sessionId: string;
  riderId: string;
  timestamp: string;
  deviceId: string;
  deviceModel: string;
  operatingZone: string;
  city: string;
  loginHour: number;
  dayOfWeek: number;
  sessionDurationMinutes: number;
  avgIntervalSec: number;
  interactionPattern: "NORMAL_RAPID" | "HESITANT" | "ERRATIC_SLOW" | "IRREGULAR";
  acceptanceRate: number;
  completionRate: number;
  deliveriesAttempted: number;
  deliveriesCompleted: number;
  sessionTerminationType?: string;
  securityChanges?: {
    phoneChanged?: boolean;
    payoutChanged?: boolean;
    passwordReset?: boolean;
    pinChanged?: boolean;
    emailChanged?: boolean;
    payoutModifiedMinutesPrior?: number;
    newDeviceInSession?: boolean;
    simSwapReported?: boolean;
    concurrentSessionsCount?: number;
  };
  groundTruthLabel: GroundTruthScenario;
  // Evaluation enrichment
  riskScore?: number;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  recommendedAction?: string;
  evidenceQuality?: string;
  classification?: "TP" | "FP" | "TN" | "FN";
  latencyMs?: number;
}

export interface SyntheticBenchmarkSummary {
  totalRecords: number;
  durationMs: number;
  throughputPerSec: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  };
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
    falsePositiveRate: number;
    challengeRate: number;
  };
  riskBandDistribution: {
    L0_Silent: number;     // 0-29
    L1_Ambient: number;    // 30-49
    L2_Challenge: number;  // 50-69
    L3_Hold: number;       // 70-100
  };
  groundTruthDistribution: Record<GroundTruthScenario, number>;
  topSignals: Array<{ code: string; count: number; name: string }>;
  sampleRecords: SyntheticSessionRecord[];
}

// Representative Indian Metro Delivery Profiles
const METRO_ZONES = [
  { city: "Mumbai", zones: ["BKC Commercial", "Andheri East MIDC", "Lower Parel", "Bandra West", "Powai Hub", "Colaba Fort", "Dadar Shivaji Park", "Vashi Sector 17"] },
  { city: "Bengaluru", zones: ["Koramangala", "Indiranagar", "HSR Layout", "Whitefield ITPL", "Electronic City", "Jayanagar 4th Block", "MG Road Commercial", "Bellandur Outer Ring"] },
  { city: "Delhi-NCR", zones: ["Cyber City Gurugram", "Connaught Place", "Noida Sector 62", "Saket District Centre", "Hauz Khas", "Aerocity Terminal", "Nehru Place"] },
  { city: "Hyderabad", zones: ["Hitec City", "Madhapur", "Gachibowli", "Banjara Hills", "Jubilee Hills", "Kondapur", "Kukatpally"] },
];

const DEVICE_MODELS = [
  "Samsung Galaxy A53 5G",
  "Samsung Galaxy A54 5G",
  "OnePlus 11R 5G",
  "Xiaomi Redmi Note 12",
  "Xiaomi 13T Pro",
  "Vivo T1 5G",
  "Realme 9 Pro+",
  "Motorola Edge 40 Neo",
  "Poco X4 Pro",
  "Apple iPhone 14",
];

/**
 * Generate a synthetic pool of riders with individualized baselines
 */
export function generateRiderBaselinePool(size = 500): Map<string, RiderBaselineData> {
  const pool = new Map<string, RiderBaselineData>();

  for (let i = 0; i < size; i++) {
    const riderId = `RDR-SYN-${(1000 + i).toString()}`;
    const metro = METRO_ZONES[i % METRO_ZONES.length];
    const primaryZone = metro.zones[i % metro.zones.length];
    const secondaryZone = metro.zones[(i + 1) % metro.zones.length];
    const registeredDevice = `DEV-ENR-${1000 + (i % 250)}`;

    const baseline: RiderBaselineData = {
      riderId,
      supportingSessions: 25 + (i % 50),
      confidence: "HIGH",
      typicalHours: [8, 9, 10, 11, 12, 13, 14, 17, 18, 19, 20, 21],
      typicalDays: [1, 2, 3, 4, 5, 6],
      knownDevices: [registeredDevice, `DEV-BAK-${1000 + (i % 250)}`],
      primaryZones: [primaryZone, secondaryZone],
      avgSessionDuration: 220 + (i % 60),
      stdSessionDuration: 30,
      avgInteractionInterval: 13.5 + (i % 8) * 0.4, // e.g. 13.5s to 16.7s
      stdInteractionInterval: 2.8 + (i % 4) * 0.3,
      typicalAcceptanceRate: 0.88 + (i % 10) * 0.01,
      typicalCompletionRate: 0.96 + (i % 4) * 0.01,
      typicalActions: ["LOGIN", "ACCEPT", "PICKUP", "NAVIGATE", "DELIVER"],
    };

    pool.set(riderId, baseline);
  }

  return pool;
}

/**
 * High-performance deterministic PRNG for synthetic generation
 */
function createDeterministicRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generate synthetic delivery session dataset up to 100,000 records
 */
export function generateSyntheticDataset(
  count: number,
  options: {
    seed?: number;
    fraudRatePercent?: number; // e.g. 8%
    newDevicePercent?: number; // e.g. 5%
    zoneShiftPercent?: number; // e.g. 3%
  } = {}
): { records: SyntheticSessionRecord[]; baselinePool: Map<string, RiderBaselineData> } {
  const targetCount = Math.max(10, Math.min(100000, count));
  const rand = createDeterministicRandom(options.seed || 4242);
  const baselinePool = generateRiderBaselinePool(Math.min(1000, Math.max(100, Math.floor(targetCount / 10))));
  const riderIds = Array.from(baselinePool.keys());

  const fraudRate = (options.fraudRatePercent ?? 7) / 100;
  const newDeviceRate = (options.newDevicePercent ?? 4) / 100;
  const zoneShiftRate = (options.zoneShiftPercent ?? 3) / 100;

  const records: SyntheticSessionRecord[] = new Array(targetCount);
  const now = Date.now();

  for (let i = 0; i < targetCount; i++) {
    const rVal = rand();
    let label: GroundTruthScenario = "LEGITIMATE";

    if (rVal < fraudRate * 0.75) {
      label = "RENTED_ACCOUNT_HANDOFF";
    } else if (rVal < fraudRate) {
      label = "ACCOUNT_TAKEOVER_HIJACK";
    } else if (rVal < fraudRate + newDeviceRate) {
      label = "NEW_DEVICE_LEGITIMATE";
    } else if (rVal < fraudRate + newDeviceRate + zoneShiftRate) {
      label = "ZONE_CHANGE_LEGITIMATE";
    } else {
      label = "LEGITIMATE";
    }

    const riderId = riderIds[i % riderIds.length];
    const baseline = baselinePool.get(riderId)!;
    const metro = METRO_ZONES[i % METRO_ZONES.length];

    const eventId = `SYN-EVT-${(i + 1).toString().padStart(6, "0")}`;
    const sessionId = `SYN-SESS-${(i + 1).toString().padStart(6, "0")}`;
    const timestamp = new Date(now - (targetCount - i) * 60000).toISOString();

    let deviceId = baseline.knownDevices[0];
    let deviceModel = DEVICE_MODELS[i % DEVICE_MODELS.length];
    let operatingZone = baseline.primaryZones[0];
    let city = metro.city;
    let avgIntervalSec = +(baseline.avgInteractionInterval + (rand() * 2 - 1) * 1.5).toFixed(1);
    let interactionPattern: SyntheticSessionRecord["interactionPattern"] = "NORMAL_RAPID";
    let acceptanceRate = +(baseline.typicalAcceptanceRate - rand() * 0.05).toFixed(2);
    let completionRate = +(baseline.typicalCompletionRate - rand() * 0.03).toFixed(2);
    let sessionDurationMinutes = Math.floor(baseline.avgSessionDuration + (rand() * 40 - 20));
    let sessionTerminationType = "NORMAL_LOGOUT";
    let securityChanges: SyntheticSessionRecord["securityChanges"] | undefined = undefined;

    // Apply scenario mutations according to Ground Truth label
    switch (label) {
      case "RENTED_ACCOUNT_HANDOFF":
        // Critical Hackathon Scenario: Same phone or new phone, but motor cadence collapses (e.g. 38s vs 14s baseline)
        avgIntervalSec = +(baseline.avgInteractionInterval * (2.6 + rand() * 0.8)).toFixed(1);
        interactionPattern = rand() > 0.5 ? "HESITANT" : "ERRATIC_SLOW";
        acceptanceRate = +(0.32 + rand() * 0.15).toFixed(2);
        completionRate = +(0.65 + rand() * 0.15).toFixed(2);
        sessionTerminationType = "RAPID_RE_LOGIN";
        // 50% happen on the same registered phone to test pure behavioral detection!
        if (rand() > 0.5) {
          deviceId = `DEV-UNAUTH-${(8000 + (i % 500)).toString()}`;
          deviceModel = "Unrecognized Hardware Clone";
        }
        break;

      case "ACCOUNT_TAKEOVER_HIJACK":
        // Rapid credential mod right before shift + new device
        deviceId = `DEV-HIJACK-${(9000 + (i % 200)).toString()}`;
        deviceModel = "Anonymous Linux Terminal Emulator";
        avgIntervalSec = +(baseline.avgInteractionInterval * 2.8).toFixed(1);
        interactionPattern = "IRREGULAR";
        acceptanceRate = 0.35;
        sessionTerminationType = "RAPID_RE_LOGIN";
        securityChanges = {
          payoutChanged: true,
          phoneChanged: true,
        };
        break;

      case "NEW_DEVICE_LEGITIMATE":
        // Brand new device hardware, but identical behavioral rhythm!
        deviceId = `DEV-NEW-${(7000 + (i % 300)).toString()}`;
        deviceModel = DEVICE_MODELS[(i + 3) % DEVICE_MODELS.length];
        break;

      case "ZONE_CHANGE_LEGITIMATE":
        // Shift to neighboring commercial zone, interaction tempo remains steady
        operatingZone = metro.zones[(i + 2) % metro.zones.length];
        break;

      case "LEGITIMATE":
      default:
        // Clean routine session
        break;
    }

    const deliveriesAttempted = Math.max(4, Math.floor(sessionDurationMinutes / 20));
    const deliveriesCompleted = Math.max(3, Math.floor(deliveriesAttempted * completionRate));

    records[i] = {
      eventId,
      sessionId,
      riderId,
      timestamp,
      deviceId,
      deviceModel,
      operatingZone,
      city,
      loginHour: (8 + (i % 14)) % 24,
      dayOfWeek: (1 + (i % 7)) % 7,
      sessionDurationMinutes,
      avgIntervalSec,
      interactionPattern,
      acceptanceRate,
      completionRate,
      deliveriesAttempted,
      deliveriesCompleted,
      sessionTerminationType,
      securityChanges,
      groundTruthLabel: label,
    };
  }

  return { records, baselinePool };
}

/**
 * Ultra-fast batch evaluator: Evaluates up to 100,000 synthetic sessions
 * through the TrueRide standalone risk engine with microsecond timing.
 */
export function evaluateSyntheticBatch(
  records: SyntheticSessionRecord[],
  baselinePool: Map<string, RiderBaselineData>
): SyntheticBenchmarkSummary {
  const total = records.length;
  const latencies: number[] = new Array(total);
  const signalCountMap = new Map<string, { count: number; name: string }>();

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  let l0 = 0;
  let l1 = 0;
  let l2 = 0;
  let l3 = 0;

  const groundTruthDistribution: Record<GroundTruthScenario, number> = {
    LEGITIMATE: 0,
    RENTED_ACCOUNT_HANDOFF: 0,
    NEW_DEVICE_LEGITIMATE: 0,
    ZONE_CHANGE_LEGITIMATE: 0,
    ACCOUNT_TAKEOVER_HIJACK: 0,
  };

  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  for (let i = 0; i < total; i++) {
    const rec = records[i];
    groundTruthDistribution[rec.groundTruthLabel] = (groundTruthDistribution[rec.groundTruthLabel] || 0) + 1;

    const baseline = baselinePool.get(rec.riderId);

    const inputData: SessionInputData = {
      eventId: rec.eventId,
      riderId: rec.riderId,
      sessionId: rec.sessionId,
      timestamp: rec.timestamp,
      deviceId: rec.deviceId,
      deviceModel: rec.deviceModel,
      operatingZone: rec.operatingZone,
      city: rec.city,
      loginHour: rec.loginHour,
      dayOfWeek: rec.dayOfWeek,
      sessionDurationMinutes: rec.sessionDurationMinutes,
      avgIntervalSec: rec.avgIntervalSec,
      interactionPattern: rec.interactionPattern,
      acceptanceRate: rec.acceptanceRate,
      completionRate: rec.completionRate,
      deliveriesAttempted: rec.deliveriesAttempted,
      deliveriesCompleted: rec.deliveriesCompleted,
      sessionTerminationType: rec.sessionTerminationType,
      securityChanges: rec.securityChanges,
    };

    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const assessment = evaluateSessionRisk(inputData, baseline);
    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const itemLatency = +(t1 - t0).toFixed(4);
    latencies[i] = itemLatency;

    rec.riskScore = assessment.overallScore;
    rec.riskLevel = assessment.riskLevel;
    rec.recommendedAction = assessment.recommendedAction;
    rec.evidenceQuality = assessment.evidenceQuality;
    rec.latencyMs = itemLatency;

    // Categorize into TrueRide industrial risk bands
    if (assessment.overallScore < 30) {
      l0++;
    } else if (assessment.overallScore < 50) {
      l1++;
    } else if (assessment.overallScore < 70) {
      l2++;
    } else {
      l3++;
    }

    // Accumulate threat signals
    for (const sig of assessment.signals) {
      const existing = signalCountMap.get(sig.signalCode) || { count: 0, name: sig.name };
      existing.count++;
      signalCountMap.set(sig.signalCode, existing);
    }

    // Ground Truth classification
    const isActuallyMalicious =
      rec.groundTruthLabel === "RENTED_ACCOUNT_HANDOFF" ||
      rec.groundTruthLabel === "ACCOUNT_TAKEOVER_HIJACK";

    // Predicted positive if Step-Up Challenge or Security Hold (Score >= 30 or Medium/High)
    const isPredictedPositive =
      assessment.recommendedAction === "STEP_UP_VERIFY" ||
      assessment.recommendedAction === "ESCALATE_INVESTIGATION" ||
      assessment.overallScore >= 30;

    if (isActuallyMalicious && isPredictedPositive) {
      tp++;
      rec.classification = "TP";
    } else if (!isActuallyMalicious && isPredictedPositive) {
      fp++;
      rec.classification = "FP";
    } else if (!isActuallyMalicious && !isPredictedPositive) {
      tn++;
      rec.classification = "TN";
    } else {
      fn++;
      rec.classification = "FN";
    }
  }

  const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const durationMs = +(endTime - startTime).toFixed(2);
  const throughputPerSec = Math.round((total / Math.max(0.001, durationMs)) * 1000);

  // Compute Latency Percentiles
  latencies.sort((a, b) => a - b);
  const avgLatencyMs = +(latencies.reduce((acc, l) => acc + l, 0) / Math.max(1, total)).toFixed(4);
  const p50LatencyMs = latencies[Math.floor(total * 0.5)] || 0;
  const p95LatencyMs = latencies[Math.floor(total * 0.95)] || 0;
  const p99LatencyMs = latencies[Math.floor(total * 0.99)] || 0;

  // Compute Evaluation Performance Metrics
  const precision = tp + fp > 0 ? +((tp / (tp + fp)) * 100).toFixed(1) : 100;
  const recall = tp + fn > 0 ? +((tp / (tp + fn)) * 100).toFixed(1) : 100;
  const f1Score =
    precision + recall > 0
      ? +((2 * (precision * recall)) / (precision + recall)).toFixed(1)
      : 100;
  const falsePositiveRate = fp + tn > 0 ? +((fp / (fp + tn)) * 100).toFixed(1) : 0;
  const challengeRate = total > 0 ? +(((tp + fp) / total) * 100).toFixed(1) : 0;

  // Sort top triggered signals
  const topSignals = Array.from(signalCountMap.entries())
    .map(([code, { count, name }]) => ({ code, count, name }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalRecords: total,
    durationMs,
    throughputPerSec,
    avgLatencyMs,
    p50LatencyMs,
    p95LatencyMs,
    p99LatencyMs,
    confusionMatrix: {
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn,
    },
    metrics: {
      precision,
      recall,
      f1Score,
      falsePositiveRate,
      challengeRate,
    },
    riskBandDistribution: {
      L0_Silent: l0,
      L1_Ambient: l1,
      L2_Challenge: l2,
      L3_Hold: l3,
    },
    groundTruthDistribution,
    topSignals,
    sampleRecords: records.slice(0, 100),
  };
}

/**
 * Format synthetic records as CSV for export
 */
export function exportRecordsToCsv(records: SyntheticSessionRecord[]): string {
  const headers = [
    "eventId",
    "sessionId",
    "riderId",
    "timestamp",
    "city",
    "operatingZone",
    "deviceId",
    "deviceModel",
    "avgIntervalSec",
    "interactionPattern",
    "acceptanceRate",
    "completionRate",
    "groundTruthLabel",
    "riskScore",
    "riskLevel",
    "recommendedAction",
    "classification",
  ];

  const rows = records.map((r) => [
    r.eventId,
    r.sessionId,
    r.riderId,
    r.timestamp,
    `"${r.city}"`,
    `"${r.operatingZone}"`,
    r.deviceId,
    `"${r.deviceModel}"`,
    r.avgIntervalSec,
    r.interactionPattern,
    r.acceptanceRate,
    r.completionRate,
    r.groundTruthLabel,
    r.riskScore ?? "",
    r.riskLevel ?? "",
    r.recommendedAction ?? "",
    r.classification ?? "",
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
