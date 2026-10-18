import { prisma } from "../prisma";
import { SyntheticSessionRecord, SyntheticBenchmarkSummary } from "./syntheticDatasetGenerator";
import { recordScaleBenchmarkRun } from "./scaleBenchmarkStore";

export async function persistScaleSimulationRun(
  records: SyntheticSessionRecord[],
  benchmark: SyntheticBenchmarkSummary
) {
  // Identify the most critical anomalous sessions to record in DB
  const anomalousRecords = records
    .filter(
      (r) =>
        (r.riskScore !== undefined && r.riskScore >= 50) ||
        r.recommendedAction === "ESCALATE_INVESTIGATION" ||
        r.recommendedAction === "STEP_UP_VERIFY" ||
        r.groundTruthLabel === "RENTED_ACCOUNT_HANDOFF" ||
        r.groundTruthLabel === "ACCOUNT_TAKEOVER_HIJACK"
    )
    .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
    .slice(0, 30); // Persist top 30 critical anomaly cases

  let casesCreated = 0;
  let sessionsPersisted = 0;

  for (const record of anomalousRecords) {
    try {
      // Ensure rider exists in database
      let rider = await prisma.rider.findUnique({
        where: { riderId: record.riderId },
      });

      if (!rider) {
        rider = await prisma.rider.create({
          data: {
            riderId: record.riderId,
            name: `Courier ${record.riderId}`,
            city: record.city || "Mumbai",
            enrollmentDate: new Date("2024-01-01"),
            accountStatus: (record.riskScore || 0) >= 70 ? "UNDER_REVIEW" : "ACTIVE",
            baselineStatus: "ESTABLISHED",
            phone: "+91 98000 00000",
          },
        });
      }

      const eventId = `${record.eventId || "EVT"}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const sessionId = `${record.sessionId || "SESS"}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const timestamp = new Date(record.timestamp || Date.now());

      // Create SessionEvent
      const sessionEvent = await prisma.sessionEvent.create({
        data: {
          eventId,
          riderId: record.riderId,
          sessionId,
          timestamp,
          deviceId: record.deviceId,
          deviceModel: record.deviceModel,
          operatingZone: record.operatingZone,
          city: record.city,
          loginHour: record.loginHour,
          dayOfWeek: record.dayOfWeek,
          sessionDurationMinutes: record.sessionDurationMinutes,
          avgIntervalSec: record.avgIntervalSec,
          interactionPattern: record.interactionPattern,
          acceptanceRate: record.acceptanceRate,
          completionRate: record.completionRate,
          deliveriesAttempted: record.deliveriesAttempted,
          deliveriesCompleted: record.deliveriesCompleted,
          isSimulated: true,
          scenarioName: record.groundTruthLabel,
          groundTruthLabel: record.groundTruthLabel,
          securityChanges: record.securityChanges ? JSON.stringify(record.securityChanges) : null,
        },
      });

      sessionsPersisted++;

      // Create RiskAssessment
      const score = record.riskScore || 65;
      const level = record.riskLevel || (score >= 70 ? "HIGH" : score >= 50 ? "MEDIUM" : "LOW");
      const action = record.recommendedAction || (score >= 70 ? "ESCALATE_INVESTIGATION" : score >= 50 ? "STEP_UP_VERIFY" : "ALLOW");

      const assessment = await prisma.riskAssessment.create({
        data: {
          riderId: record.riderId,
          sessionId: record.sessionId,
          sessionEventId: sessionEvent.id,
          overallScore: score,
          riskLevel: level,
          evidenceQuality: record.evidenceQuality || "HIGH",
          confidenceScore: 88.5,
          behavioralScore: record.interactionPattern === "ERRATIC_SLOW" ? 82.0 : 45.0,
          deviceScore: record.securityChanges?.newDeviceInSession ? 78.0 : 35.0,
          locationScore: 40.0,
          sessionAccountScore: record.securityChanges?.payoutModifiedMinutesPrior ? 92.0 : 30.0,
          historicalScore: 25.0,
          recommendedAction: action,
          scoringLatencyMs: record.latencyMs || 0.04,
          signals: {
            create: [
              {
                category: "BEHAVIORAL",
                signalCode: "TOUCH_CADENCE_DRIFT",
                name: "Motor Touch Cadence Drift",
                observedValue: `${record.avgIntervalSec?.toFixed(1) || "28.4"}s interval`,
                expectedRange: "12-16s baseline",
                subscore: 75.0,
                contribution: 0.25,
                explanation: `Touch interval diverged significantly (${record.interactionPattern}) from enrolled motor baseline.`,
                evidenceQuality: "HIGH",
              },
              ...(record.securityChanges?.newDeviceInSession
                ? [
                    {
                      category: "DEVICE",
                      signalCode: "UNREGISTERED_DEVICE",
                      name: "Unregistered Hardware Identifier",
                      observedValue: record.deviceModel || "Unknown Device",
                      expectedRange: "Enrolled Devices",
                      subscore: 80.0,
                      contribution: 0.2,
                      explanation: "Hardware identifier does not match enrolled device enclave registry.",
                      evidenceQuality: "HIGH",
                    },
                  ]
                : []),
              ...(record.securityChanges?.payoutModifiedMinutesPrior
                ? [
                    {
                      category: "SESSION_ACCOUNT",
                      signalCode: "PAYOUT_ROUTING_ALTERATION",
                      name: "Rapid Payout UPI Re-Route",
                      observedValue: `${record.securityChanges.payoutModifiedMinutesPrior} mins prior`,
                      expectedRange: "Stable Banking Registry",
                      subscore: 95.0,
                      contribution: 0.2,
                      explanation: "Payout destination modified shortly before active delivery route dispatch.",
                      evidenceQuality: "HIGH",
                    },
                  ]
                : []),
            ],
          },
        },
      });

      // Create SecurityCase for actionable anomalies
      const caseNumber = `CASE-SCALE-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const priority = score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : "MEDIUM";
      const status = action === "STEP_UP_VERIFY" ? "VERIFICATION_REQUIRED" : "NEW_ALERT";

      await prisma.securityCase.create({
        data: {
          caseNumber,
          riderId: record.riderId,
          assessmentId: assessment.id,
          status,
          priority,
          notes: `Auto-generated from ${records.length.toLocaleString()} scale benchmark. Label: ${record.groundTruthLabel}. Risk Score: ${score}/100.`,
        },
      });

      casesCreated++;
    } catch (err) {
      console.warn("Failed to persist individual synthetic record:", err);
    }
  }

  // 2. Log system AuditEvent for the scale benchmark
  await prisma.auditEvent.create({
    data: {
      actor: "SYNTHETIC_SCALE_ENGINE",
      eventType: "SCALE_SIMULATION_EXECUTED",
      entityType: "SYSTEM_BENCHMARK",
      entityId: `scale_${records.length}_${Date.now()}`,
      summary: `Executed ${records.length.toLocaleString()} scale simulation (${(benchmark.throughputPerSec || 0).toLocaleString()} rps, P95: ${(benchmark.p95LatencyMs || 0).toFixed(3)}ms). Created ${casesCreated} high-priority anomaly cases.`,
      details: JSON.stringify({
        totalRecords: benchmark.totalRecords,
        throughputPerSec: benchmark.throughputPerSec,
        durationMs: benchmark.durationMs,
        p95LatencyMs: benchmark.p95LatencyMs,
        precision: benchmark.metrics?.precision,
        recall: benchmark.metrics?.recall,
        f1Score: benchmark.metrics?.f1Score,
        casesCreated,
        sessionsPersisted,
      }),
    },
  });

  // 3. Update persistent scale benchmark store
  const storeState = recordScaleBenchmarkRun(
    records.length,
    benchmark,
    casesCreated,
    sessionsPersisted
  );

  return {
    success: true,
    casesCreated,
    sessionsPersisted,
    storeState,
  };
}
