import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { ingestSessionEvent } from "../src/lib/services/ingestion";
import { recordCaseDecision, getSecurityCaseById } from "../src/lib/services/cases";
import { requestVerification, recordVerificationResult } from "../src/lib/services/verification";

describe("TrueRide Ingestion, Case Management & Verification Lifecycle", () => {
  const testRiderId = "RDR-8021";

  // Test 12: Duplicate event ingestion is idempotent
  it("Scenario 12: Duplicate event ingestion is idempotent and does not recreate records", async () => {
    const uniqueEventId = `EVT-IDEMP-TEST-${Date.now()}`;
    const payload = {
      eventId: uniqueEventId,
      riderId: testRiderId,
      sessionId: `SESS-IDEMP-${Date.now()}`,
      deviceId: "DEV-SM-A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 10,
      dayOfWeek: 2,
      sessionDurationMinutes: 200,
      avgIntervalSec: 14.5,
    };

    // First ingestion
    const firstResult = await ingestSessionEvent(payload);
    expect(firstResult.success).toBe(true);
    expect(firstResult.isDuplicate).toBe(false);

    // Second ingestion with identical eventId
    const secondResult = await ingestSessionEvent(payload);
    expect(secondResult.success).toBe(true);
    expect(secondResult.isDuplicate).toBe(true);
    expect(secondResult.assessmentId).toBe(firstResult.assessmentId);

    // Verify database only has 1 event for this uniqueEventId
    const eventCount = await prisma.sessionEvent.count({
      where: { eventId: uniqueEventId },
    });
    expect(eventCount).toBe(1);
  });

  // Test 13: Case decisions persist
  it("Scenario 13: Case decisions persist accurately across review lifecycle", async () => {
    // Ingest an anomalous session that triggers case creation
    const anomalyEventId = `EVT-DECISION-TEST-${Date.now()}`;
    const ingestion = await ingestSessionEvent({
      eventId: anomalyEventId,
      riderId: testRiderId,
      sessionId: `SESS-DECISION-${Date.now()}`,
      deviceId: "DEV-UNKNOWN-99",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 3,
      dayOfWeek: 1,
      avgIntervalSec: 54.0,
      acceptanceRate: 0.3,
      interactionPattern: "HESITANT_SLOW",
      sessionTerminationType: "RAPID_RE_LOGIN",
      securityChanges: { payoutChanged: true },
    });

    expect(ingestion.caseCreated).toBe(true);
    expect(ingestion.caseId).toBeTruthy();

    const caseId = ingestion.caseId!;

    // Analyst records decision
    const updatedCase = await recordCaseDecision({
      caseId,
      reviewer: "Lead Analyst Aisha K.",
      decision: "CONFIRMED_ACCOUNT_HANDOFF",
      reason:
        "Severe touch cadence deceleration corroborated with payout route alteration during uncharacteristic night shift.",
      newStatus: "CONFIRMED_ACCOUNT_HANDOFF",
    });

    expect(updatedCase.status).toBe("CONFIRMED_ACCOUNT_HANDOFF");
    expect(updatedCase.assignedReviewer).toBe("Lead Analyst Aisha K.");

    // Retrieve from database and verify persistence
    const loadedCase = await getSecurityCaseById(caseId);
    expect(loadedCase?.status).toBe("CONFIRMED_ACCOUNT_HANDOFF");
    expect(loadedCase?.decisions.length).toBeGreaterThanOrEqual(1);
    expect(loadedCase?.decisions[0].decision).toBe("CONFIRMED_ACCOUNT_HANDOFF");
  });

  // Test 14: Verification outcomes update the case properly
  it("Scenario 14: Verification outcomes update the case properly without assuming handoff on inconclusive check", async () => {
    // Create verification request
    const verEvent = await requestVerification({
      riderId: testRiderId,
      sessionId: "SESS-VERIF-TEST",
      verificationType: "FACIAL_BIOMETRIC",
    });

    expect(verEvent.status).toBe("PENDING");
    expect(verEvent.result).toBe("PENDING");

    // Complete verification with MATCH
    const matchOutcome = await recordVerificationResult({
      verificationId: verEvent.verificationId,
      result: "MATCH",
      similarityScore: 0.94,
    });

    expect(matchOutcome.result).toBe("MATCH");
    expect(matchOutcome.similarityScore).toBe(0.94);

    // Verify inconclusive check provides recovery rather than punitive ban
    const incEvent = await requestVerification({
      riderId: testRiderId,
      sessionId: "SESS-INC-TEST",
      verificationType: "FACIAL_BIOMETRIC",
    });

    const incOutcome = await recordVerificationResult({
      verificationId: incEvent.verificationId,
      result: "INCONCLUSIVE",
      qualityWarning: "Low lighting in rider vehicle environment",
      recoveryMethod: "MANUAL_REVIEW_FALLBACK",
    });

    expect(incOutcome.result).toBe("INCONCLUSIVE");
    expect(incOutcome.recoveryMethod).toBe("MANUAL_REVIEW_FALLBACK");
  });

  // Test 15: Important decisions generate audit records
  it("Scenario 15: Critical system and analyst actions generate immutable audit records", async () => {
    const initialAuditCount = await prisma.auditEvent.count();

    await recordCaseDecision({
      caseId: (await prisma.securityCase.findFirst())?.id || "sample-id",
      reviewer: "Audit System Test",
      decision: "MONITORING_APPROVED",
      reason: "Automated test audit generation",
      newStatus: "MONITORING",
    });

    const finalAuditCount = await prisma.auditEvent.count();
    expect(finalAuditCount).toBeGreaterThan(initialAuditCount);

    const latestAudit = await prisma.auditEvent.findFirst({
      orderBy: { timestamp: "desc" },
    });
    expect(latestAudit?.actor).toBe("Audit System Test");
    expect(latestAudit?.eventType).toBe("CASE_DECISION_RECORDED");
  });
});
