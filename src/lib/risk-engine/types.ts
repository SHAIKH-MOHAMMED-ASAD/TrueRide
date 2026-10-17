export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type EvidenceQuality = "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";

export type RecommendedAction =
  | "ALLOW"
  | "MONITOR"
  | "STEP_UP_VERIFY"
  | "ESCALATE_INVESTIGATION";

export type SignalCategory =
  | "BEHAVIORAL"
  | "DEVICE"
  | "LOCATION"
  | "SESSION_ACCOUNT"
  | "HISTORICAL";

export interface RiskSignalDetail {
  category: SignalCategory;
  signalCode: string;
  name: string;
  observedValue: string;
  expectedRange: string;
  subscore: number; // 0 - 100
  contribution: number; // weighted contribution to overall score
  explanation: string;
  evidenceQuality: EvidenceQuality;
}

export interface CategoryScores {
  behavioral: number;
  device: number;
  location: number;
  sessionAccount: number;
  historical: number;
}

export interface EngineWeights {
  behavioral: number;
  device: number;
  location: number;
  sessionAccount: number;
  historical: number;
}

export interface EngineThresholds {
  lowMax: number; // e.g. 29
  mediumMax: number; // e.g. 69
}

export interface RiskEngineConfig {
  weights: EngineWeights;
  thresholds: EngineThresholds;
  version: string;
}

export interface SessionInputData {
  eventId: string;
  riderId: string;
  sessionId: string;
  timestamp: string | Date;
  deviceId: string;
  deviceModel?: string;
  operatingZone: string;
  city: string;
  loginHour: number; // 0-23
  dayOfWeek: number; // 0-6
  sessionDurationMinutes?: number;
  avgIntervalSec?: number;
  interactionPattern?: string; // NORMAL_RAPID, HESITANT_SLOW, SCRIPTED_BURST, etc.
  acceptanceRate?: number; // 0.0 - 1.0
  completionRate?: number; // 0.0 - 1.0
  deliveriesAttempted?: number;
  deliveriesCompleted?: number;
  actionSequence?: string[];
  sessionTerminationType?: string; // NORMAL_LOGOUT, UNEXPECTED_TERMINATION, RAPID_RE_LOGIN, TIMEOUT
  securityChanges?: {
    phoneChanged?: boolean;
    payoutChanged?: boolean;
    passwordReset?: boolean;
    pinChanged?: boolean;
    emailChanged?: boolean;
  };
}

export interface RiderBaselineData {
  riderId: string;
  baselineVersion?: number;
  observationWindow?: string;
  supportingSessions: number;
  confidence: EvidenceQuality;
  typicalHours: number[]; // e.g. [8, 9, 10, 11, 12, 13, 14, 18, 19, 20, 21]
  typicalDays: number[]; // e.g. [1, 2, 3, 4, 5, 6]
  knownDevices: string[];
  primaryZones: string[];
  avgSessionDuration: number; // in minutes
  stdSessionDuration: number;
  avgInteractionInterval: number; // in seconds
  stdInteractionInterval: number;
  typicalAcceptanceRate: number; // 0.0 - 1.0
  typicalCompletionRate: number; // 0.0 - 1.0
  typicalActions?: string[];
}

export interface HistoricalContextData {
  priorUnresolvedAlertsCount: number;
  priorConfirmedHandoffsCount: number;
  priorDismissedAlertsCount: number;
  consecutiveAnomalousSessions: number;
  lastInvestigationOutcome?: string;
  daysSinceLastHandoffFinding?: number;
}

export interface AssessmentResult {
  overallScore: number;
  riskLevel: RiskLevel;
  evidenceQuality: EvidenceQuality;
  confidenceScore: number;
  categoryScores: CategoryScores;
  categoryContributions: CategoryScores;
  signals: RiskSignalDetail[];
  recommendedAction: RecommendedAction;
  scoringVersion: string;
  scoringLatencyMs: number;
  configUsed: RiskEngineConfig;
}
