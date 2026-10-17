import { SessionEventIngestInput } from "../validations/session";
import { ingestSessionEvent, IngestionResult } from "./ingestion";

export interface SimulatorScenario {
  id: string;
  name: string;
  category: "BENIGN" | "DEVIATION" | "SUSPICIOUS" | "HANDOFF" | "SPARSE";
  expectedRiskLevel: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  keyDifferentiator: string;
  eventPayload: SessionEventIngestInput;
}

export const SIMULATOR_SCENARIOS: SimulatorScenario[] = [
  {
    id: "SCENARIO_1_NORMAL",
    name: "1. Normal Routine Session",
    category: "BENIGN",
    expectedRiskLevel: "LOW",
    description:
      "Arjun Kumar logs in from his verified Samsung Galaxy A53 in Koramangala during his usual morning shift, maintaining his characteristic fast 14.2s delivery interaction cadence.",
    keyDifferentiator:
      "All 5 categories align with historical baseline. Expected score: 0–15 (LOW).",
    eventPayload: {
      eventId: "EVT-SIM-01-NORM",
      riderId: "RDR-8021",
      sessionId: "SESS-SIM-101",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      deviceModel: "Samsung Galaxy A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 10,
      dayOfWeek: 2,
      sessionDurationMinutes: 240,
      avgIntervalSec: 14.2,
      interactionPattern: "NORMAL_RAPID",
      acceptanceRate: 0.92,
      completionRate: 0.98,
      deliveriesAttempted: 14,
      deliveriesCompleted: 14,
      sessionTerminationType: "NORMAL_LOGOUT",
      isSimulated: true,
      scenarioName: "1. Normal Routine Session",
      groundTruthLabel: "LEGITIMATE",
    },
  },
  {
    id: "SCENARIO_2_NEW_DEVICE",
    name: "2. New Phone (Legitimate Upgrade)",
    category: "BENIGN",
    expectedRiskLevel: "LOW",
    description:
      "Rider upgrades their phone to a OnePlus 11R. Hardware ID is new, but delivery behavior, touch cadence, and working zones remain identical to their historical routine.",
    keyDifferentiator:
      "Hardware mismatch triggers mild device subscore, but lack of behavioral drift keeps overall score well below 30. Proves new device alone never causes high risk.",
    eventPayload: {
      eventId: "EVT-SIM-02-NEWDEV",
      riderId: "RDR-8021",
      sessionId: "SESS-SIM-102",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-ONEPLUS-11R",
      deviceModel: "OnePlus 11R 5G",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 11,
      dayOfWeek: 3,
      sessionDurationMinutes: 230,
      avgIntervalSec: 14.6,
      interactionPattern: "NORMAL_RAPID",
      acceptanceRate: 0.9,
      completionRate: 0.98,
      deliveriesAttempted: 12,
      deliveriesCompleted: 12,
      sessionTerminationType: "NORMAL_LOGOUT",
      isSimulated: true,
      scenarioName: "2. New Phone (Legitimate Upgrade)",
      groundTruthLabel: "LEGITIMATE",
    },
  },
  {
    id: "SCENARIO_3_ZONE_CHANGE",
    name: "3. Legitimate Delivery Zone Change",
    category: "BENIGN",
    expectedRiskLevel: "LOW",
    description:
      "Rider shifts from Koramangala to adjacent Indiranagar to fulfill surge delivery demand. Device and interaction tempo remain completely consistent.",
    keyDifferentiator:
      "Plausible geographic transition in same metropolitan cluster. Avoids false-positive escalation.",
    eventPayload: {
      eventId: "EVT-SIM-03-ZONE",
      riderId: "RDR-8021",
      sessionId: "SESS-SIM-103",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      deviceModel: "Samsung Galaxy A53",
      operatingZone: "Indiranagar",
      city: "Bengaluru",
      loginHour: 13,
      dayOfWeek: 4,
      sessionDurationMinutes: 210,
      avgIntervalSec: 14.8,
      interactionPattern: "NORMAL_RAPID",
      acceptanceRate: 0.88,
      completionRate: 0.96,
      deliveriesAttempted: 11,
      deliveriesCompleted: 11,
      sessionTerminationType: "NORMAL_LOGOUT",
      isSimulated: true,
      scenarioName: "3. Legitimate Delivery Zone Change",
      groundTruthLabel: "LEGITIMATE",
    },
  },
  {
    id: "SCENARIO_4_SHIFT_CHANGE",
    name: "4. Off-Hours / Night Shift Transition",
    category: "BENIGN",
    expectedRiskLevel: "LOW",
    description:
      "Rider signs on at 11:00 PM for late-night delivery incentives. While operating hours vary, their interaction pacing and acceptance rate remain fluent.",
    keyDifferentiator:
      "Shift deviation noted as informational signal without triggering unjustified punitive security action.",
    eventPayload: {
      eventId: "EVT-SIM-04-SHIFT",
      riderId: "RDR-8021",
      sessionId: "SESS-SIM-104",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      deviceModel: "Samsung Galaxy A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 23,
      dayOfWeek: 5,
      sessionDurationMinutes: 180,
      avgIntervalSec: 15.1,
      interactionPattern: "NORMAL_RAPID",
      acceptanceRate: 0.86,
      completionRate: 0.97,
      deliveriesAttempted: 8,
      deliveriesCompleted: 8,
      sessionTerminationType: "NORMAL_LOGOUT",
      isSimulated: true,
      scenarioName: "4. Off-Hours / Night Shift Transition",
      groundTruthLabel: "LEGITIMATE",
    },
  },
  {
    id: "SCENARIO_5_SUSPICIOUS_UNFAMILIAR",
    name: "5. Suspicious Behavior on Unfamiliar Device",
    category: "SUSPICIOUS",
    expectedRiskLevel: "HIGH",
    description:
      "Session initiated on an unknown Redmi Note 10 at 2:00 AM with unfamiliar hesitation, 52s action intervals, and a sudden payout account alteration.",
    keyDifferentiator:
      "Corroborated multi-signal deviation (hardware + financial + behavioral cadence). Triggers High Risk and automatic verification request.",
    eventPayload: {
      eventId: "EVT-SIM-05-SUSP-DEV",
      riderId: "RDR-8021",
      sessionId: "SESS-SIM-105",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-REDMI-NOTE10",
      deviceModel: "Redmi Note 10 Pro",
      operatingZone: "Indiranagar",
      city: "Bengaluru",
      loginHour: 2,
      dayOfWeek: 1,
      sessionDurationMinutes: 380,
      avgIntervalSec: 52.4,
      interactionPattern: "HESITANT_SLOW",
      acceptanceRate: 0.38,
      completionRate: 0.65,
      deliveriesAttempted: 8,
      deliveriesCompleted: 5,
      sessionTerminationType: "RAPID_RE_LOGIN",
      securityChanges: {
        payoutChanged: true,
      },
      isSimulated: true,
      scenarioName: "5. Suspicious Behavior on Unfamiliar Device",
      groundTruthLabel: "HANDOFF",
    },
  },
  {
    id: "SCENARIO_6_SAME_DEVICE_CITY_HANDOFF",
    name: "6. Possible Account Handoff (Same Phone, Same City)",
    category: "HANDOFF",
    expectedRiskLevel: "HIGH",
    description:
      "The genuine rider hands their physical Samsung A53 phone to an unauthorized third party in Koramangala. Device ID, city, and GPS zone remain identical, but touch interaction pacing slows from 14s to 56s, navigation pattern is hesitant, and payout is rerouted.",
    keyDifferentiator:
      "CORE HACKATHON VALUE PROPOSITION: Flags the rented account using behavioral and session signals alone, overcoming hardware and geo spoofing.",
    eventPayload: {
      eventId: "EVT-SIM-06-SAME-DEV-HANDOFF",
      riderId: "RDR-8021",
      sessionId: "SESS-SIM-106",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53", // UNCHANGED ORIGINAL PHONE!
      deviceModel: "Samsung Galaxy A53",
      operatingZone: "Koramangala", // UNCHANGED ORIGINAL ZONE!
      city: "Bengaluru", // UNCHANGED ORIGINAL CITY!
      loginHour: 10,
      dayOfWeek: 2,
      sessionDurationMinutes: 135,
      avgIntervalSec: 56.8, // 13.2 standard deviations from baseline!
      interactionPattern: "HESITANT_SLOW",
      acceptanceRate: 0.41,
      completionRate: 0.72,
      deliveriesAttempted: 7,
      deliveriesCompleted: 5,
      sessionTerminationType: "RAPID_RE_LOGIN",
      securityChanges: {
        payoutChanged: true,
      },
      isSimulated: true,
      scenarioName: "6. Possible Account Handoff (Same Phone, Same City)",
      groundTruthLabel: "HANDOFF",
    },
  },
  {
    id: "SCENARIO_7_MULTI_SESSION_DRIFT",
    name: "7. Persistent Multi-Session Behavioral Drift",
    category: "SUSPICIOUS",
    expectedRiskLevel: "HIGH",
    description:
      "Third consecutive session showing persistent anomalous interaction speed, low acceptance rates, and an unresolved pending security inquiry.",
    keyDifferentiator:
      "Multi-session drift corroboration: Historical risk context confirms structural handoff rather than temporary fatigue.",
    eventPayload: {
      eventId: "EVT-SIM-07-MULTI-DRIFT",
      riderId: "RDR-8021",
      sessionId: "SESS-SIM-107",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-SM-A53",
      deviceModel: "Samsung Galaxy A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 14,
      dayOfWeek: 3,
      sessionDurationMinutes: 310,
      avgIntervalSec: 49.5,
      interactionPattern: "HESITANT_SLOW",
      acceptanceRate: 0.44,
      completionRate: 0.76,
      deliveriesAttempted: 9,
      deliveriesCompleted: 7,
      sessionTerminationType: "NORMAL_LOGOUT",
      isSimulated: true,
      scenarioName: "7. Persistent Multi-Session Behavioral Drift",
      groundTruthLabel: "HANDOFF",
    },
  },
  {
    id: "SCENARIO_8_SPARSE_HISTORY",
    name: "8. Sparse History (New Rider)",
    category: "SPARSE",
    expectedRiskLevel: "LOW",
    description:
      "Rahul Verma (RDR-5114) joined the platform 2 days ago with only 2 historical deliveries. Logs in on a second phone.",
    keyDifferentiator:
      "Explicitly returns Evidence Quality: INSUFFICIENT. Recommends MONITOR rather than blocking the rider, preventing unfair friction on new drivers.",
    eventPayload: {
      eventId: "EVT-SIM-08-SPARSE",
      riderId: "RDR-5114",
      sessionId: "SESS-SIM-108",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-VIVO-Y21",
      deviceModel: "Vivo Y21",
      operatingZone: "Whitefield",
      city: "Bengaluru",
      loginHour: 15,
      dayOfWeek: 4,
      sessionDurationMinutes: 120,
      avgIntervalSec: 22.0,
      acceptanceRate: 0.8,
      completionRate: 0.9,
      deliveriesAttempted: 4,
      deliveriesCompleted: 4,
      isSimulated: true,
      scenarioName: "8. Sparse History (New Rider)",
      groundTruthLabel: "LEGITIMATE",
    },
  },
  {
    id: "SCENARIO_9_FALSE_POSITIVE_DISMISS",
    name: "9. Dismissible False Positive Alert",
    category: "DEVIATION",
    expectedRiskLevel: "MEDIUM",
    description:
      "Mohammed Irfan experienced high rain and touch screen moisture causing intermittent latency spikes (avg interval 32s) in Electronic City.",
    keyDifferentiator:
      "Generates an actionable medium alert with clear evidence for analyst inspection. Analyst can review, verify legitimate weather disruption, and dismiss the alert without penalizing future baseline.",
    eventPayload: {
      eventId: "EVT-SIM-09-FP-DISMISS",
      riderId: "RDR-3390",
      sessionId: "SESS-SIM-109",
      timestamp: new Date().toISOString(),
      deviceId: "DEV-MOTO-G52",
      deviceModel: "Motorola G52",
      operatingZone: "Electronic City",
      city: "Bengaluru",
      loginHour: 18,
      dayOfWeek: 5,
      sessionDurationMinutes: 160,
      avgIntervalSec: 32.5,
      interactionPattern: "NORMAL_RAPID",
      acceptanceRate: 0.78,
      completionRate: 0.92,
      deliveriesAttempted: 8,
      deliveriesCompleted: 8,
      sessionTerminationType: "NORMAL_LOGOUT",
      isSimulated: true,
      scenarioName: "9. Dismissible False Positive Alert",
      groundTruthLabel: "FALSE_POSITIVE",
    },
  },
];

/**
 * Execute a simulator scenario through the REAL session ingestion pipeline.
 */
export async function runSimulationScenario(
  scenarioId: string
): Promise<IngestionResult> {
  const scenario = SIMULATOR_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) {
    throw new Error(`Simulator scenario "${scenarioId}" not found`);
  }

  // Create a unique event ID per simulation execution if needed, or use deterministic
  const payload: SessionEventIngestInput = {
    ...scenario.eventPayload,
    eventId: `${scenario.eventPayload.eventId}-${Date.now().toString().slice(-4)}`,
    sessionId: `${scenario.eventPayload.sessionId}-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
  };

  return ingestSessionEvent(payload);
}
