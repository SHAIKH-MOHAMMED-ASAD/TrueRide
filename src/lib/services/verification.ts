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
