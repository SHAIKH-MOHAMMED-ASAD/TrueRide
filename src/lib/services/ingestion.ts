import { prisma } from "../prisma";
import { evaluateSessionRisk } from "../risk-engine/engine";
import {
  HistoricalContextData,
  RiderBaselineData,
  RiskEngineConfig,
  SessionInputData,
} from "../risk-engine/types";
import { sessionEventIngestSchema, SessionEventIngestInput } from "../validations/session";

export interface IngestionResult {
  success: boolean;
  isDuplicate?: boolean;
  eventId: string;
  sessionId: string;
  riderId: string;
  assessmentId: string;
  overallScore: number;
  riskLevel: string;
  evidenceQuality: string;
  recommendedAction: string;
  caseCreated?: boolean;
  caseId?: string;
  caseNumber?: string;
  signalsCount: number;
  scoringLatencyMs?: number;
}

/**
 * Ingest and score a delivery session event.
 * Idempotent: Repeated submissions with the same eventId return the existing assessment.
 */
export async function ingestSessionEvent(
  rawInput: unknown,
  customConfig?: Partial<RiskEngineConfig>
): Promise<IngestionResult> {
  // 1. Validate payload with Zod
  const validation = sessionEventIngestSchema.safeParse(rawInput);
  if (!validation.success) {
    const errorDetails = validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`Invalid session event data: ${errorDetails}`);
  }

  const input: SessionEventIngestInput = validation.data;

  // 2. Idempotency Check: if eventId already exists, retrieve and return existing record
  const existingEvent = await prisma.sessionEvent.findUnique({
    where: { eventId: input.eventId },
    include: {
      assessment: {
        include: {
          signals: true,
          case: true,
        },
      },
    },
  });

  if (existingEvent && existingEvent.assessment) {
    return {
      success: true,
      isDuplicate: true,
      eventId: existingEvent.eventId,
      sessionId: existingEvent.sessionId,
      riderId: existingEvent.riderId,
      assessmentId: existingEvent.assessment.id,
      overallScore: existingEvent.assessment.overallScore,
      riskLevel: existingEvent.assessment.riskLevel,
      evidenceQuality: existingEvent.assessment.evidenceQuality,
      recommendedAction: existingEvent.assessment.recommendedAction,
      caseCreated: false,
      caseId: existingEvent.assessment.case?.id,
      caseNumber: existingEvent.assessment.case?.caseNumber,
      signalsCount: existingEvent.assessment.signals.length,
      scoringLatencyMs: existingEvent.assessment.scoringLatencyMs ?? 0,
    };
  }

  // 3. Ensure rider exists or create placeholder if new
  let rider = await prisma.rider.findUnique({
    where: { riderId: input.riderId },
    include: {
      baselines: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!rider) {
    rider = await prisma.rider.create({
      data: {
        riderId: input.riderId,
        name: `Rider ${input.riderId}`,
        city: input.city || "Bengaluru",
        enrollmentDate: new Date(),
        accountStatus: "ACTIVE",
        baselineStatus: "SPARSE",
      },
      include: {
        baselines: true,
      },
    });
  }

  // 4. Retrieve Rider Baseline Data
  const dbBaseline = rider.baselines[0];
  let baselineData: RiderBaselineData | null = null;

  if (dbBaseline) {
    baselineData = {
      riderId: rider.riderId,
      baselineVersion: dbBaseline.version,
      observationWindow: dbBaseline.observationWindow,
      supportingSessions: dbBaseline.supportingSessions,
      confidence: dbBaseline.confidence as any,
      typicalHours: JSON.parse(dbBaseline.typicalHours || "[]"),
      typicalDays: JSON.parse(dbBaseline.typicalDays || "[]"),
      knownDevices: JSON.parse(dbBaseline.knownDevices || "[]"),
      primaryZones: JSON.parse(dbBaseline.primaryZones || "[]"),
      avgSessionDuration: dbBaseline.avgSessionDuration,
      stdSessionDuration: dbBaseline.stdSessionDuration,
      avgInteractionInterval: dbBaseline.avgInteractionInterval,
      stdInteractionInterval: dbBaseline.stdInteractionInterval,
      typicalAcceptanceRate: dbBaseline.typicalAcceptanceRate,
      typicalCompletionRate: dbBaseline.typicalCompletionRate,
      typicalActions: JSON.parse(dbBaseline.typicalActions || "[]"),
    };
  }

  // 5. Gather Historical Risk Context for this rider
  const priorCases = await prisma.securityCase.findMany({
    where: { riderId: input.riderId },
  });

  const priorUnresolvedAlertsCount = priorCases.filter(
    (c) => c.status === "NEW_ALERT" || c.status === "UNDER_INVESTIGATION" || c.status === "VERIFICATION_REQUIRED"
  ).length;

  const priorConfirmedHandoffsCount = priorCases.filter(
    (c) => c.status === "CONFIRMED_ACCOUNT_HANDOFF"
  ).length;

  const priorDismissedAlertsCount = priorCases.filter(
    (c) => c.status === "DISMISSED_ALERT" || c.status === "VERIFIED_LEGITIMATE"
  ).length;

  // Check recent consecutive anomalous sessions
  const recentAssessments = await prisma.riskAssessment.findMany({
    where: { riderId: input.riderId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  let consecutiveAnomalousSessions = 0;
  for (const a of recentAssessments) {
    if (a.riskLevel === "HIGH" || a.riskLevel === "MEDIUM") {
      consecutiveAnomalousSessions++;
    } else {
      break;
    }
  }

  const historicalContext: HistoricalContextData = {
    priorUnresolvedAlertsCount,
    priorConfirmedHandoffsCount,
    priorDismissedAlertsCount,
    consecutiveAnomalousSessions,
  };

  // 6. Execute TrueRide Risk Engine
  const sessionEngineInput: SessionInputData = {
    eventId: input.eventId,
    riderId: input.riderId,
    sessionId: input.sessionId,
    timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
    deviceId: input.deviceId,
    deviceModel: input.deviceModel,
    operatingZone: input.operatingZone,
    city: input.city,
    loginHour: input.loginHour,
    dayOfWeek: input.dayOfWeek,
    sessionDurationMinutes: input.sessionDurationMinutes,
    avgIntervalSec: input.avgIntervalSec,
    interactionPattern: input.interactionPattern,
    acceptanceRate: input.acceptanceRate,
    completionRate: input.completionRate,
    deliveriesAttempted: input.deliveriesAttempted,
    deliveriesCompleted: input.deliveriesCompleted,
    actionSequence: input.actionSequence,
    sessionTerminationType: input.sessionTerminationType,
    securityChanges: input.securityChanges,
  };

  const assessment = evaluateSessionRisk(
    sessionEngineInput,
    baselineData,
    historicalContext,
    customConfig
  );

  // 7. Persist SessionEvent, RiskAssessment, RiskSignals, and Audit Log
  const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();

  const savedRecord = await prisma.$transaction(async (tx) => {
    // Save SessionEvent
    const sessionEvent = await tx.sessionEvent.create({
      data: {
        eventId: input.eventId,
        riderId: input.riderId,
        sessionId: input.sessionId,
        timestamp,
        deviceId: input.deviceId,
        deviceModel: input.deviceModel,
        appVersion: input.appVersion,
        operatingZone: input.operatingZone,
        city: input.city,
        loginHour: input.loginHour,
        dayOfWeek: input.dayOfWeek,
        sessionDurationMinutes: input.sessionDurationMinutes,
        avgIntervalSec: input.avgIntervalSec,
        interactionPattern: input.interactionPattern,
        acceptanceRate: input.acceptanceRate,
        completionRate: input.completionRate,
        deliveriesAttempted: input.deliveriesAttempted,
        deliveriesCompleted: input.deliveriesCompleted,
        actionSequence: input.actionSequence ? JSON.stringify(input.actionSequence) : null,
        sessionTerminationType: input.sessionTerminationType,
        securityChanges: input.securityChanges ? JSON.stringify(input.securityChanges) : null,
        isSimulated: input.isSimulated ?? false,
        scenarioName: input.scenarioName,
        groundTruthLabel: input.groundTruthLabel,
      },
    });

    // Save RiskAssessment
    const riskAssessment = await tx.riskAssessment.create({
      data: {
        riderId: input.riderId,
        sessionId: input.sessionId,
        sessionEventId: sessionEvent.id,
        overallScore: assessment.overallScore,
        riskLevel: assessment.riskLevel,
        evidenceQuality: assessment.evidenceQuality,
        confidenceScore: assessment.confidenceScore,
        behavioralScore: assessment.categoryScores.behavioral,
        deviceScore: assessment.categoryScores.device,
        locationScore: assessment.categoryScores.location,
        sessionAccountScore: assessment.categoryScores.sessionAccount,
        historicalScore: assessment.categoryScores.historical,
        recommendedAction: assessment.recommendedAction,
        scoringVersion: assessment.scoringVersion,
        scoringLatencyMs: assessment.scoringLatencyMs,
      },
    });

    // Save RiskSignals
    if (assessment.signals.length > 0) {
      await tx.riskSignal.createMany({
        data: assessment.signals.map((sig) => ({
          assessmentId: riskAssessment.id,
          category: sig.category,
          signalCode: sig.signalCode,
          name: sig.name,
          observedValue: sig.observedValue,
          expectedRange: sig.expectedRange,
          subscore: sig.subscore,
          contribution: sig.contribution,
          explanation: sig.explanation,
          evidenceQuality: sig.evidenceQuality,
        })),
      });
    }

    // Auto-create SecurityCase if recommended action indicates review or verification
    let createdCase: { id: string; caseNumber: string } | null = null;
    if (
      assessment.riskLevel === "HIGH" ||
      (assessment.riskLevel === "MEDIUM" &&
        (assessment.recommendedAction === "STEP_UP_VERIFY" || assessment.overallScore >= 45))
    ) {
      const caseCount = await tx.securityCase.count();
      const caseNumber = `CASE-${new Date().getFullYear()}-${String(caseCount + 101).padStart(4, "0")}`;
      const initialStatus =
        assessment.recommendedAction === "STEP_UP_VERIFY"
          ? "VERIFICATION_REQUIRED"
          : "NEW_ALERT";

      const priority = assessment.overallScore >= 75 ? "CRITICAL" : assessment.overallScore >= 60 ? "HIGH" : "MEDIUM";

      const secCase = await tx.securityCase.create({
        data: {
          caseNumber,
          riderId: input.riderId,
          assessmentId: riskAssessment.id,
          status: initialStatus,
          priority,
          notes: `Auto-generated case for session ${input.sessionId}. Recommended Action: ${assessment.recommendedAction}. Score: ${assessment.overallScore}/100.`,
        },
      });

      createdCase = { id: secCase.id, caseNumber: secCase.caseNumber };

      // Log case creation in audit log
      await tx.auditEvent.create({
        data: {
          actor: "RISK_ENGINE",
          eventType: "CASE_CREATED",
          entityType: "CASE",
          entityId: secCase.id,
          summary: `Security case ${caseNumber} opened for Rider ${input.riderId} (Risk Score: ${assessment.overallScore})`,
          details: JSON.stringify({
            riskLevel: assessment.riskLevel,
            recommendedAction: assessment.recommendedAction,
            priority,
          }),
        },
      });
    }

    // Log Session Ingestion in Audit Log
    await tx.auditEvent.create({
      data: {
        actor: input.isSimulated ? "SIMULATOR" : "SYSTEM_INGESTION",
        eventType: "SESSION_INGESTED",
        entityType: "SESSION",
        entityId: sessionEvent.id,
        summary: `Session ${input.sessionId} for Rider ${input.riderId} evaluated with score ${assessment.overallScore} (${assessment.riskLevel})`,
        details: JSON.stringify({
          eventId: input.eventId,
          deviceId: input.deviceId,
          zone: input.operatingZone,
          recommendedAction: assessment.recommendedAction,
        }),
      },
    });

    return {
      sessionEvent,
      riskAssessment,
      createdCase,
    };
  });

  return {
    success: true,
    isDuplicate: false,
    eventId: input.eventId,
    sessionId: input.sessionId,
    riderId: input.riderId,
    assessmentId: savedRecord.riskAssessment.id,
    overallScore: assessment.overallScore,
    riskLevel: assessment.riskLevel,
    evidenceQuality: assessment.evidenceQuality,
    recommendedAction: assessment.recommendedAction,
    caseCreated: Boolean(savedRecord.createdCase),
    caseId: savedRecord.createdCase?.id,
    caseNumber: savedRecord.createdCase?.caseNumber,
    signalsCount: assessment.signals.length,
    scoringLatencyMs: assessment.scoringLatencyMs,
  };
}
