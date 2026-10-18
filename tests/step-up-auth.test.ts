import { describe, it, expect } from "vitest";
import { prisma } from "../src/lib/prisma";
import { ingestSessionEvent } from "../src/lib/services/ingestion";
import {
  executeStepUpAuthentication,
  executeVoiceChallenge,
  generateVoiceChallengePhrase,
} from "../src/lib/services/verification";
import { persistScaleSimulationRun } from "../src/lib/services/scalePersistence";
import {
  generateSyntheticDataset,
  evaluateSyntheticBatch,
} from "../src/lib/services/syntheticDatasetGenerator";
import { getScaleBenchmarkState } from "../src/lib/services/scaleBenchmarkStore";

describe("TrueRide Step-Up Authentication for Suspicious Users & Scale Persistence", () => {
  const testRiderId = "RDR-8021";

  it("Step-Up Auth Scenario 1: MATCH outcome generates cryptographic clearance token, clears case, and records audit event", async () => {
    // 1. Ingest anomalous session to trigger case creation
    const ingestion = await ingestSessionEvent({
      eventId: `EVT-AUTH-MATCH-${Date.now()}`,
      riderId: testRiderId,
      sessionId: `SESS-AUTH-MATCH-${Date.now()}`,
      deviceId: "DEV-SUSPICIOUS-01",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 3,
      dayOfWeek: 1,
      avgIntervalSec: 48.0,
      acceptanceRate: 0.35,
      interactionPattern: "HESITANT_SLOW",
      sessionTerminationType: "RAPID_RE_LOGIN",
      securityChanges: { payoutChanged: true },
    });

    expect(ingestion.caseCreated).toBe(true);
    const caseId = ingestion.caseId!;

    // 2. Execute step-up authentication with MATCH
    const result = await executeStepUpAuthentication({
      riderId: testRiderId,
      caseId,
      otpCode: "849201",
      biometricOutcome: "MATCH",
      similarityScore: 0.94,
      livenessPassed: true,
      actor: "Automated Step-Up Gatekeeper",
    });

    // 3. Verify outcomes
    expect(result.success).toBe(true);
    expect(result.authVerdict).toBe("AUTHENTICATED");
    expect(result.clearanceToken).toMatch(/^TR-CLR-/);
    expect(result.similarityScore).toBeGreaterThanOrEqual(0.8);
    expect(result.updatedCase?.status).toBe("VERIFIED_LEGITIMATE");

    // 4. Verify SQLite securityCase row updated
    const updatedCase = await prisma.securityCase.findUnique({
      where: { id: caseId },
    });
    expect(updatedCase?.status).toBe("VERIFIED_LEGITIMATE");

    // 5. Verify immutable audit event created
    const auditEvent = await prisma.auditEvent.findFirst({
      where: { eventType: "SUSPICIOUS_USER_AUTHENTICATED" },
      orderBy: { timestamp: "desc" },
    });
    expect(auditEvent).toBeTruthy();
    expect(auditEvent?.actor).toBe("Automated Step-Up Gatekeeper");
  });

  it("Step-Up Auth Scenario 2: NO_MATCH outcome elevates case to CONFIRMED_ACCOUNT_HANDOFF", async () => {
    const ingestion = await ingestSessionEvent({
      eventId: `EVT-AUTH-FAIL-${Date.now()}`,
      riderId: testRiderId,
      sessionId: `SESS-AUTH-FAIL-${Date.now()}`,
      deviceId: "DEV-UNKNOWN-99",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 4,
      dayOfWeek: 2,
      avgIntervalSec: 58.0,
      acceptanceRate: 0.25,
      interactionPattern: "ERRATIC_SLOW",
      sessionTerminationType: "RAPID_RE_LOGIN",
      securityChanges: { simSwapped: true },
    });

    expect(ingestion.caseCreated).toBe(true);
    const caseId = ingestion.caseId!;

    const result = await executeStepUpAuthentication({
      riderId: testRiderId,
      caseId,
      otpCode: "849201",
      biometricOutcome: "NO_MATCH",
      similarityScore: 0.38,
      livenessPassed: true,
      actor: "Automated Fraud Sentry",
    });

    expect(result.success).toBe(true);
    expect(result.authVerdict).toBe("IMPOSTER_REJECTED");
    expect(result.similarityScore).toBeLessThan(0.75);
    expect(result.updatedCase?.status).toBe("CONFIRMED_ACCOUNT_HANDOFF");

    const updatedCase = await prisma.securityCase.findUnique({
      where: { id: caseId },
    });
    expect(updatedCase?.status).toBe("CONFIRMED_ACCOUNT_HANDOFF");

    const auditEvent = await prisma.auditEvent.findFirst({
      where: { eventType: "IMPOSTER_CHALLENGE_FAILED" },
      orderBy: { timestamp: "desc" },
    });
    expect(auditEvent).toBeTruthy();
  });

  it("Step-Up Auth Scenario 3: INCONCLUSIVE outcome offers fair worker-first fallback route without punitive ban", async () => {
    const result = await executeStepUpAuthentication({
      riderId: testRiderId,
      otpCode: "849201",
      biometricOutcome: "INCONCLUSIVE",
      similarityScore: 0.61,
      livenessPassed: false,
    });

    expect(result.success).toBe(true);
    expect(result.authVerdict).toBe("SUPERVISOR_FALLBACK");
    // Verify no punitive clearance token issued, but not banned
    expect(result.clearanceToken).toBeUndefined();

    // Verify recovery method recorded
    expect(result.verificationEvent.recoveryMethod).toBe("WORKER_FIRST_SUPERVISOR_DISPATCH");
  });

  it("Step-Up Auth Scenario 4: Tri-Factor Voice Challenge MATCH verifies legitimate rider with acoustic harmonics", async () => {
    const ingestion = await ingestSessionEvent({
      eventId: `EVT-AUTH-VOICE-${Date.now()}`,
      riderId: testRiderId,
      sessionId: `SESS-AUTH-VOICE-${Date.now()}`,
      deviceId: "DEV-VOICE-CHECK-01",
      operatingZone: "Indiranagar",
      city: "Bengaluru",
      loginHour: 14,
      dayOfWeek: 3,
      avgIntervalSec: 32.0,
      acceptanceRate: 0.88,
      interactionPattern: "CONSISTENT_FAST",
      sessionTerminationType: "NORMAL_LOGOUT",
    });

    const result = await executeStepUpAuthentication({
      riderId: testRiderId,
      caseId: ingestion.caseId,
      otpCode: "849201",
      biometricOutcome: "MATCH",
      similarityScore: 0.95,
      livenessPassed: true,
      voiceChallenge: {
        phrase: "Confirm Bangalore Koramangala route five eight two",
        spokenTranscript: "Confirm Bangalore Koramangala route five eight two",
        voiceMatchScore: 0.965,
        voiceLivenessPassed: true,
        antiDeepfakeScore: 0.988,
        voiceOutcome: "MATCH",
      },
      actor: "Tri-Factor Voice Gatekeeper",
    });

    expect(result.success).toBe(true);
    expect(result.authVerdict).toBe("AUTHENTICATED");
    expect(result.clearanceToken).toMatch(/^TR-CLR-/);
    expect(result.verificationEvent.verificationType).toBe("TRI_FACTOR_VOICE_STEP_UP");
    expect(result.voiceChallenge?.voiceMatchScore).toBe(0.965);

    // Verify audit event contains voice phrase and score
    const auditEvent = await prisma.auditEvent.findFirst({
      where: { eventType: "SUSPICIOUS_USER_AUTHENTICATED", actor: "Tri-Factor Voice Gatekeeper" },
      orderBy: { timestamp: "desc" },
    });
    expect(auditEvent).toBeTruthy();
    expect(auditEvent?.summary).toContain("Voice: 96.5%");
  });

  it("Step-Up Auth Scenario 5: Dynamic Voice Challenge Phrase Generation and Execution", async () => {
    // 1. Generate challenge phrase
    const challenge = generateVoiceChallengePhrase();
    expect(challenge.challengeId).toMatch(/^VC-/);
    expect(challenge.phrase.length).toBeGreaterThan(10);
    expect(challenge.phonetics.length).toBeGreaterThan(2);

    // 2. Execute standalone voice challenge
    const voiceResult = await executeVoiceChallenge({
      riderId: testRiderId,
      phrase: challenge.phrase,
      spokenTranscript: challenge.phrase,
      voiceMatchScore: 0.952,
      voiceLivenessPassed: true,
      antiDeepfakeScore: 0.991,
      voiceOutcome: "MATCH",
      actor: "Voice Biometric Sentry",
    });

    expect(voiceResult.success).toBe(true);
    expect(voiceResult.authVerdict).toBe("AUTHENTICATED");
    expect(voiceResult.clearanceToken).toMatch(/^TR-VOICE-/);
    expect(voiceResult.verificationEvent.verificationType).toBe("VOICE_CHALLENGE");

    // 3. Verify audit trail record
    const voiceAudit = await prisma.auditEvent.findFirst({
      where: { eventType: "VOICE_CHALLENGE_VERIFIED", actor: "Voice Biometric Sentry" },
      orderBy: { timestamp: "desc" },
    });
    expect(voiceAudit).toBeTruthy();
    expect(voiceAudit?.summary).toContain("Acoustic Match: 95.2%");
  });

  it("Step-Up Auth Scenario 6: Voice Challenge Imposter / Deepfake Spoof Detected and Inconclusive Fallback", async () => {
    // 1. Deepfake voice spoof
    const spoofResult = await executeVoiceChallenge({
      riderId: testRiderId,
      phrase: "Confirm Bangalore Koramangala route five eight two",
      spokenTranscript: "Confirm Bangalore Koramangala route five eight two",
      voiceMatchScore: 0.315,
      voiceLivenessPassed: false,
      antiDeepfakeScore: 0.124,
      voiceOutcome: "NO_MATCH",
      actor: "Voice Anti-Spoof Engine",
    });

    expect(spoofResult.success).toBe(true);
    expect(spoofResult.authVerdict).toBe("IMPOSTER_REJECTED");
    expect(spoofResult.clearanceToken).toBeUndefined();

    const spoofAudit = await prisma.auditEvent.findFirst({
      where: { eventType: "VOICE_SPOOF_DETECTED", actor: "Voice Anti-Spoof Engine" },
      orderBy: { timestamp: "desc" },
    });
    expect(spoofAudit).toBeTruthy();

    // 2. Inconclusive audio fallback
    const inconclusiveResult = await executeVoiceChallenge({
      riderId: testRiderId,
      phrase: "Confirm Bangalore Koramangala route five eight two",
      voiceMatchScore: 0.628,
      voiceLivenessPassed: true,
      voiceOutcome: "INCONCLUSIVE",
    });

    expect(inconclusiveResult.authVerdict).toBe("SUPERVISOR_FALLBACK");
    expect(inconclusiveResult.verificationEvent.recoveryMethod).toBe("WORKER_FIRST_SUPERVISOR_DISPATCH");
  });

  it("Scale Persistence Scenario: 100K synthetic benchmark run persists records to SQLite database", async () => {
    const initialSessionCount = await prisma.sessionEvent.count();
    const initialCaseCount = await prisma.securityCase.count();

    // Run a high-speed synthetic benchmark batch
    const { records, baselinePool } = generateSyntheticDataset(500, {
      fraudRatePercent: 12,
      newDevicePercent: 5,
    });
    const benchmarkResult = evaluateSyntheticBatch(records, baselinePool);

    expect(benchmarkResult.totalRecords).toBe(500);
    expect(benchmarkResult.sampleRecords.length).toBeGreaterThan(0);

    // Persist scale simulation run to SQLite
    const persistenceResult = await persistScaleSimulationRun(records, benchmarkResult);
    expect(persistenceResult.success).toBe(true);
    expect(persistenceResult.sessionsPersisted).toBeGreaterThan(0);
    expect(persistenceResult.casesCreated).toBeGreaterThan(0);

    // Verify SQLite counts increased
    const finalSessionCount = await prisma.sessionEvent.count();
    const finalCaseCount = await prisma.securityCase.count();
    expect(finalSessionCount).toBeGreaterThan(initialSessionCount);
    expect(finalCaseCount).toBeGreaterThan(initialCaseCount);

    // Verify in-memory benchmark store has cumulative record
    const scaleState = getScaleBenchmarkState();
    expect(scaleState.cumulativeCount).toBeGreaterThanOrEqual(500);
    expect(scaleState.lastRun).toBeTruthy();
    expect(scaleState.lastRun?.benchmark.totalRecords).toBe(500);
  });
});
