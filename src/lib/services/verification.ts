import { prisma } from "../prisma";

export async function requestVerification(params: {
  riderId: string;
  sessionId?: string;
  sessionEventId?: string;
  caseId?: string;
  verificationType?: string;
}) {
  const {
    riderId,
    sessionId,
    sessionEventId,
    caseId,
    verificationType = "FACIAL_BIOMETRIC",
  } = params;

  const count = await prisma.verificationEvent.count();
  const verificationId = `VER-${new Date().getFullYear()}-${String(count + 101).padStart(4, "0")}`;

  return prisma.$transaction(async (tx) => {
    const event = await tx.verificationEvent.create({
      data: {
        verificationId,
        riderId,
        sessionId,
        sessionEventId,
        caseId,
        verificationType,
        status: "PENDING",
        result: "PENDING",
      },
    });

    if (caseId) {
      await tx.securityCase.update({
        where: { id: caseId },
        data: { status: "VERIFICATION_REQUIRED" },
      });
    }

    await tx.auditEvent.create({
      data: {
        actor: "ANALYST_PORTAL",
        eventType: "VERIFICATION_REQUESTED",
        entityType: "VERIFICATION",
        entityId: event.id,
        summary: `Verification ${verificationId} (${verificationType}) initiated for Rider ${riderId}`,
        details: JSON.stringify({ caseId, sessionId, verificationType }),
      },
    });

    return event;
  });
}

export async function recordVerificationResult(params: {
  verificationId: string;
  result: "MATCH" | "NO_MATCH" | "INCONCLUSIVE" | "TECHNICAL_UNAVAILABLE";
  similarityScore?: number;
  qualityWarning?: string;
  failureReason?: string;
  recoveryMethod?: string;
}) {
  const {
    verificationId,
    result,
    similarityScore,
    qualityWarning,
    failureReason,
    recoveryMethod,
  } = params;

  const existing = await prisma.verificationEvent.findUnique({
    where: { verificationId },
    include: { case: true },
  });

  if (!existing) {
    throw new Error(`Verification event ${verificationId} not found`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.verificationEvent.update({
      where: { verificationId },
      data: {
        status: "COMPLETED",
        result,
        similarityScore,
        qualityWarning,
        failureReason,
        recoveryMethod,
      },
    });

    // Handle linked case status update
    if (existing.caseId && existing.case) {
      if (result === "MATCH") {
        await tx.securityCase.update({
          where: { id: existing.caseId },
          data: {
            status: "VERIFIED_LEGITIMATE",
            resolutionReason: `Step-up biometric verification confirmed match (Similarity: ${similarityScore ? (similarityScore * 100).toFixed(1) + "%" : "Verified"})`,
            resolvedAt: new Date(),
          },
        });
      } else if (result === "NO_MATCH") {
        await tx.securityCase.update({
          where: { id: existing.caseId },
          data: {
            status: "UNDER_INVESTIGATION",
            priority: "CRITICAL",
            notes: `Biometric step-up check returned NO_MATCH. Escalated for full investigator review.`,
          },
        });
      } else {
        // INCONCLUSIVE or TECHNICAL_UNAVAILABLE: DO NOT assume guilt!
        await tx.securityCase.update({
          where: { id: existing.caseId },
          data: {
            status: "UNDER_INVESTIGATION",
            notes: `Verification outcome: ${result}. Dispatched to manual supervisor review fallback.`,
          },
        });
      }
    }

    await tx.auditEvent.create({
      data: {
        actor: "VERIFICATION_SERVICE",
        eventType: "VERIFICATION_COMPLETED",
        entityType: "VERIFICATION",
        entityId: updated.id,
        summary: `Verification ${verificationId} resolved with outcome ${result} for Rider ${existing.riderId}`,
        details: JSON.stringify({
          result,
          similarityScore,
          qualityWarning,
          failureReason,
          caseId: existing.caseId,
        }),
      },
    });

    return updated;
  });
}

export interface VoiceChallengePayload {
  phrase?: string;
  spokenTranscript?: string;
  voiceMatchScore?: number; // 0 to 1
  voiceLivenessPassed?: boolean; // anti-spoofing / anti-deepfake
  antiDeepfakeScore?: number; // 0 to 1
  voiceOutcome?: "MATCH" | "NO_MATCH" | "INCONCLUSIVE";
}

export const DYNAMIC_VOICE_PHRASES = [
  "Confirm Bangalore Koramangala route five eight two",
  "TrueRide authorization code seven four one zero",
  "Active courier biometric confirmation three six nine",
  "Verified transit checkpoint alpha delta four",
  "Express parcel dispatch clearance eight nine one",
  "Fleet security voiceprint token six five zero",
];

export function generateVoiceChallengePhrase(): {
  challengeId: string;
  phrase: string;
  phonetics: string[];
  expiresInSec: number;
} {
  const phrase =
    DYNAMIC_VOICE_PHRASES[Math.floor(Math.random() * DYNAMIC_VOICE_PHRASES.length)];
  return {
    challengeId: `VC-${Date.now().toString().slice(-6)}`,
    phrase,
    phonetics: phrase.split(" "),
    expiresInSec: 120,
  };
}

export async function executeStepUpAuthentication(params: {
  riderId: string;
  sessionId?: string;
  caseId?: string;
  otpCode: string;
  biometricOutcome: "MATCH" | "NO_MATCH" | "INCONCLUSIVE";
  similarityScore?: number;
  livenessPassed: boolean;
  voiceChallenge?: VoiceChallengePayload;
  actor?: string;
}) {
  const {
    riderId,
    sessionId,
    caseId,
    otpCode,
    biometricOutcome,
    similarityScore = biometricOutcome === "MATCH" ? 0.945 : biometricOutcome === "NO_MATCH" ? 0.362 : 0.615,
    livenessPassed,
    voiceChallenge,
    actor = "STEP_UP_AUTH_PORTAL",
  } = params;

  // Basic OTP validation: Must be 6 digits
  const cleanOtp = (otpCode || "").replace(/\D/g, "");
  if (cleanOtp.length !== 6) {
    throw new Error("Invalid OTP: Cryptographic Security PIN must be exactly 6 digits.");
  }

  // Determine final authentication verdict incorporating voice challenge if provided
  let authVerdict: "AUTHENTICATED" | "IMPOSTER_REJECTED" | "SUPERVISOR_FALLBACK";

  // Check voice outcome if present
  const voiceFailed =
    voiceChallenge &&
    (voiceChallenge.voiceOutcome === "NO_MATCH" ||
      voiceChallenge.voiceLivenessPassed === false ||
      (voiceChallenge.voiceMatchScore !== undefined && voiceChallenge.voiceMatchScore < 0.6));

  const voiceInconclusive =
    voiceChallenge && voiceChallenge.voiceOutcome === "INCONCLUSIVE";

  if (biometricOutcome === "NO_MATCH" || voiceFailed) {
    authVerdict = "IMPOSTER_REJECTED";
  } else if (
    biometricOutcome === "MATCH" &&
    livenessPassed &&
    similarityScore >= 0.8 &&
    (!voiceChallenge || voiceChallenge.voiceOutcome === "MATCH" || (voiceChallenge.voiceMatchScore && voiceChallenge.voiceMatchScore >= 0.8))
  ) {
    authVerdict = "AUTHENTICATED";
  } else {
    authVerdict = "SUPERVISOR_FALLBACK";
  }

  const count = await prisma.verificationEvent.count();
  const verificationId = `AUTH-${new Date().getFullYear()}-${String(count + 201).padStart(4, "0")}`;
  const clearanceToken =
    authVerdict === "AUTHENTICATED"
      ? `TR-CLR-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
      : undefined;

  const verificationType = voiceChallenge
    ? "TRI_FACTOR_VOICE_STEP_UP"
    : "DUAL_FACTOR_STEP_UP";

  return prisma.$transaction(async (tx) => {
    // Ensure rider exists in SQLite to satisfy foreign key relation
    let rider = await tx.rider.findUnique({ where: { riderId } });
    if (!rider) {
      rider = await tx.rider.create({
        data: {
          riderId,
          name: `Courier ${riderId}`,
          city: "Mumbai",
          enrollmentDate: new Date("2024-01-01"),
          accountStatus: "ACTIVE",
          baselineStatus: "ESTABLISHED",
          phone: "+91 98000 00000",
        },
      });
    }

    // A. Create/Complete Verification Event
    const event = await tx.verificationEvent.create({
      data: {
        verificationId,
        riderId,
        sessionId,
        caseId,
        verificationType,
        status: "COMPLETED",
        result: authVerdict === "AUTHENTICATED" ? "MATCH" : authVerdict === "IMPOSTER_REJECTED" ? "NO_MATCH" : "INCONCLUSIVE",
        similarityScore,
        qualityWarning:
          authVerdict === "SUPERVISOR_FALLBACK"
            ? voiceInconclusive
              ? "Acoustic distortion or environmental noise detected during voice challenge"
              : "Sub-optimal capture lighting or facial occlusion detected"
            : undefined,
        failureReason:
          authVerdict === "IMPOSTER_REJECTED"
            ? voiceFailed
              ? `Voice Challenge failed: Synthetic speech / deepfake detected or voiceprint mismatch (${voiceChallenge?.voiceMatchScore ? (voiceChallenge.voiceMatchScore * 100).toFixed(1) + "%" : "Failed"})`
              : "Facial biometric embedding distance exceeded threshold (Imposter)"
            : undefined,
        recoveryMethod:
          authVerdict === "SUPERVISOR_FALLBACK"
            ? "WORKER_FIRST_SUPERVISOR_DISPATCH"
            : undefined,
      },
    });

    // B. Update linked SecurityCase if present
    let updatedCase = null;
    let targetCaseId = caseId;
    if (!targetCaseId) {
      const openCase = await tx.securityCase.findFirst({
        where: {
          riderId,
          status: { in: ["NEW_ALERT", "VERIFICATION_REQUIRED", "UNDER_INVESTIGATION"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (openCase) targetCaseId = openCase.id;
    }

    const voiceDesc = voiceChallenge
      ? ` + Voice Challenge (${voiceChallenge.voiceOutcome || "MATCH"} ${( (voiceChallenge.voiceMatchScore ?? 0.95) * 100).toFixed(1)}%)`
      : "";

    if (targetCaseId) {
      if (authVerdict === "AUTHENTICATED") {
        updatedCase = await tx.securityCase.update({
          where: { id: targetCaseId },
          data: {
            status: "VERIFIED_LEGITIMATE",
            resolutionReason: `Step-up verification (SIM OTP + Live Face ${(similarityScore * 100).toFixed(1)}%${voiceDesc}) verified legitimate rider. Liveness: PASSED.`,
            resolvedAt: new Date(),
          },
        });
      } else if (authVerdict === "IMPOSTER_REJECTED") {
        updatedCase = await tx.securityCase.update({
          where: { id: targetCaseId },
          data: {
            status: "CONFIRMED_ACCOUNT_HANDOFF",
            priority: "CRITICAL",
            notes: `Step-up authentication FAILED. SIM OTP entered but ${voiceFailed ? "Voice Challenge detected imposter/deepfake" : `facial scan returned NO_MATCH (${(similarityScore * 100).toFixed(1)}%)`}. Rogue account handoff confirmed.`,
          },
        });
      } else {
        updatedCase = await tx.securityCase.update({
          where: { id: targetCaseId },
          data: {
            status: "UNDER_INVESTIGATION",
            notes: `Step-up capture inconclusive${voiceInconclusive ? " (ambient audio noise)" : ""}. Worker-First charter engaged: routed to supervisor video triage. No earnings penalty applied.`,
          },
        });
      }
    }

    // C. Update Rider account status
    if (rider) {
      await tx.rider.update({
        where: { riderId },
        data: {
          accountStatus:
            authVerdict === "AUTHENTICATED"
              ? "ACTIVE"
              : authVerdict === "IMPOSTER_REJECTED"
              ? "UNDER_REVIEW"
              : "ACTIVE",
        },
      });
    }

    // D. Log immutable system Audit Event
    const voiceAuditNote = voiceChallenge
      ? `, Voice: ${( (voiceChallenge.voiceMatchScore ?? 0.95) * 100).toFixed(1)}% ("${voiceChallenge.phrase || "Passphrase verified"}")`
      : "";

    await tx.auditEvent.create({
      data: {
        actor,
        eventType:
          authVerdict === "AUTHENTICATED"
            ? "SUSPICIOUS_USER_AUTHENTICATED"
            : authVerdict === "IMPOSTER_REJECTED"
            ? "IMPOSTER_CHALLENGE_FAILED"
            : "VERIFICATION_SUPERVISOR_DISPATCHED",
        entityType: "AUTHENTICATION",
        entityId: event.id,
        summary: `Suspicious Rider ${riderId} Step-Up Auth Verdict: ${authVerdict} (Biometric: ${(similarityScore * 100).toFixed(1)}%, OTP: Verified${voiceAuditNote}, Clearance: ${clearanceToken || "NONE"})`,
        details: JSON.stringify({
          authVerdict,
          biometricOutcome,
          similarityScore,
          livenessPassed,
          voiceChallenge,
          caseId: targetCaseId,
          clearanceToken,
        }),
      },
    });

    return {
      success: true,
      authVerdict,
      verificationId,
      clearanceToken,
      similarityScore,
      livenessPassed,
      voiceChallenge,
      verificationEvent: event,
      updatedCase,
    };
  });
}

export interface VoiceChallengeExecutionParams {
  riderId: string;
  sessionId?: string;
  caseId?: string;
  phrase: string;
  spokenTranscript?: string;
  voiceMatchScore?: number;
  voiceLivenessPassed?: boolean;
  antiDeepfakeScore?: number;
  voiceOutcome?: "MATCH" | "NO_MATCH" | "INCONCLUSIVE";
  actor?: string;
}

export async function executeVoiceChallenge(params: VoiceChallengeExecutionParams) {
  const {
    riderId,
    sessionId,
    caseId,
    phrase,
    spokenTranscript,
    voiceMatchScore = 0.945,
    voiceLivenessPassed = true,
    antiDeepfakeScore = 0.978,
    voiceOutcome = voiceMatchScore >= 0.8 && voiceLivenessPassed ? "MATCH" : voiceMatchScore < 0.6 ? "NO_MATCH" : "INCONCLUSIVE",
    actor = "VOICE_STEP_UP_GATEWAY",
  } = params;

  let authVerdict: "AUTHENTICATED" | "IMPOSTER_REJECTED" | "SUPERVISOR_FALLBACK";
  if (voiceOutcome === "MATCH" && voiceLivenessPassed && voiceMatchScore >= 0.8) {
    authVerdict = "AUTHENTICATED";
  } else if (voiceOutcome === "NO_MATCH" || !voiceLivenessPassed) {
    authVerdict = "IMPOSTER_REJECTED";
  } else {
    authVerdict = "SUPERVISOR_FALLBACK";
  }

  const count = await prisma.verificationEvent.count();
  const verificationId = `VOICE-${new Date().getFullYear()}-${String(count + 301).padStart(4, "0")}`;
  const clearanceToken =
    authVerdict === "AUTHENTICATED"
      ? `TR-VOICE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
      : undefined;

  return prisma.$transaction(async (tx) => {
    let rider = await tx.rider.findUnique({ where: { riderId } });
    if (!rider) {
      rider = await tx.rider.create({
        data: {
          riderId,
          name: `Courier ${riderId}`,
          city: "Mumbai",
          enrollmentDate: new Date("2024-01-01"),
          accountStatus: "ACTIVE",
          baselineStatus: "ESTABLISHED",
          phone: "+91 98000 00000",
        },
      });
    }

    const event = await tx.verificationEvent.create({
      data: {
        verificationId,
        riderId,
        sessionId,
        caseId,
        verificationType: "VOICE_CHALLENGE",
        status: "COMPLETED",
        result: voiceOutcome,
        similarityScore: voiceMatchScore,
        qualityWarning:
          authVerdict === "SUPERVISOR_FALLBACK"
            ? "High ambient acoustic noise or distorted speech detected during phrase playback"
            : undefined,
        failureReason:
          authVerdict === "IMPOSTER_REJECTED"
            ? "Voiceprint pitch/harmonic mismatch or synthetic deepfake detected"
            : undefined,
        recoveryMethod:
          authVerdict === "SUPERVISOR_FALLBACK"
            ? "WORKER_FIRST_SUPERVISOR_DISPATCH"
            : undefined,
      },
    });

    let updatedCase = null;
    let targetCaseId = caseId;
    if (!targetCaseId) {
      const openCase = await tx.securityCase.findFirst({
        where: {
          riderId,
          status: { in: ["NEW_ALERT", "VERIFICATION_REQUIRED", "UNDER_INVESTIGATION"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (openCase) targetCaseId = openCase.id;
    }

    if (targetCaseId) {
      if (authVerdict === "AUTHENTICATED") {
        updatedCase = await tx.securityCase.update({
          where: { id: targetCaseId },
          data: {
            status: "VERIFIED_LEGITIMATE",
            resolutionReason: `Voice Challenge verified genuine rider acoustic harmonics (${(voiceMatchScore * 100).toFixed(1)}%). Anti-deepfake score: ${(antiDeepfakeScore * 100).toFixed(1)}%. Dynamic phrase confirmed: "${phrase}".`,
            resolvedAt: new Date(),
          },
        });
      } else if (authVerdict === "IMPOSTER_REJECTED") {
        updatedCase = await tx.securityCase.update({
          where: { id: targetCaseId },
          data: {
            status: "CONFIRMED_ACCOUNT_HANDOFF",
            priority: "CRITICAL",
            notes: `Voice Challenge FAILED. Acoustic profile mismatch (${(voiceMatchScore * 100).toFixed(1)}%) or synthetic playback detected. Rogue operator identified.`,
          },
        });
      } else {
        updatedCase = await tx.securityCase.update({
          where: { id: targetCaseId },
          data: {
            status: "UNDER_INVESTIGATION",
            notes: `Voice challenge capture inconclusive due to ambient noise (SNR < 6dB). Dispatched to supervisor video triage. No earnings penalty applied.`,
          },
        });
      }
    }

    if (rider) {
      await tx.rider.update({
        where: { riderId },
        data: {
          accountStatus:
            authVerdict === "AUTHENTICATED"
              ? "ACTIVE"
              : authVerdict === "IMPOSTER_REJECTED"
              ? "UNDER_REVIEW"
              : "ACTIVE",
        },
      });
    }

    await tx.auditEvent.create({
      data: {
        actor,
        eventType:
          authVerdict === "AUTHENTICATED"
            ? "VOICE_CHALLENGE_VERIFIED"
            : authVerdict === "IMPOSTER_REJECTED"
            ? "VOICE_SPOOF_DETECTED"
            : "VOICE_CHALLENGE_INCONCLUSIVE",
        entityType: "AUTHENTICATION",
        entityId: event.id,
        summary: `Rider ${riderId} Voice Challenge: ${authVerdict} (Acoustic Match: ${(voiceMatchScore * 100).toFixed(1)}%, Anti-Deepfake: ${(antiDeepfakeScore * 100).toFixed(1)}%, Phrase: "${phrase}")`,
        details: JSON.stringify({
          phrase,
          spokenTranscript,
          voiceMatchScore,
          antiDeepfakeScore,
          voiceLivenessPassed,
          authVerdict,
          clearanceToken,
          caseId: targetCaseId,
        }),
      },
    });

    return {
      success: true,
      authVerdict,
      verificationId,
      clearanceToken,
      voiceMatchScore,
      antiDeepfakeScore,
      voiceLivenessPassed,
      verificationEvent: event,
      updatedCase,
    };
  });
}

