import { prisma } from "../prisma";

export interface CaseFilterOptions {
  status?: string;
  priority?: string;
  riderId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listSecurityCases(filters: CaseFilterOptions = {}) {
  const { status, priority, riderId, search, page = 1, limit = 50 } = filters;

  const where: any = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (priority && priority !== "ALL") {
    where.priority = priority;
  }

  if (riderId) {
    where.riderId = riderId;
  }

  if (search) {
    where.OR = [
      { caseNumber: { contains: search } },
      { riderId: { contains: search } },
      { rider: { name: { contains: search } } },
    ];
  }

  const [cases, total] = await Promise.all([
    prisma.securityCase.findMany({
      where,
      include: {
        rider: true,
        assessment: {
          include: {
            sessionEvent: true,
            signals: true,
          },
        },
        decisions: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
        verifications: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.securityCase.count({ where }),
  ]);

  return {
    cases,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSecurityCaseById(caseId: string) {
  return prisma.securityCase.findUnique({
    where: { id: caseId },
    include: {
      rider: {
        include: {
          baselines: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      },
      assessment: {
        include: {
          sessionEvent: true,
          signals: {
            orderBy: { subscore: "desc" },
          },
        },
      },
      decisions: {
        orderBy: { timestamp: "desc" },
      },
      verifications: {
        orderBy: { timestamp: "desc" },
      },
    },
  });
}

export async function recordCaseDecision(params: {
  caseId: string;
  reviewer: string;
  decision: string;
  reason: string;
  newStatus: string;
}) {
  const { caseId, reviewer, decision, reason, newStatus } = params;

  const secCase = await prisma.securityCase.findUnique({
    where: { id: caseId },
    include: { assessment: true },
  });

  if (!secCase) {
    throw new Error(`Security case ${caseId} not found`);
  }

  const isResolved = [
    "VERIFIED_LEGITIMATE",
    "CONFIRMED_ACCOUNT_HANDOFF",
    "DISMISSED_ALERT",
  ].includes(newStatus);

  const updatedCase = await prisma.$transaction(async (tx) => {
    // 1. Update Case
    const updated = await tx.securityCase.update({
      where: { id: caseId },
      data: {
        status: newStatus,
        assignedReviewer: reviewer,
        resolutionReason: reason,
        resolvedAt: isResolved ? new Date() : null,
      },
    });

    // 2. Record Decision
    await tx.reviewDecision.create({
      data: {
        caseId,
        reviewer,
        decision,
        reason,
        previousStatus: secCase.status,
        newStatus,
      },
    });

    // 3. Create Audit Record
    await tx.auditEvent.create({
      data: {
        actor: reviewer,
        eventType: "CASE_DECISION_RECORDED",
        entityType: "CASE",
        entityId: caseId,
        summary: `Case ${secCase.caseNumber} decision: ${decision} (${newStatus}) by ${reviewer}`,
        details: JSON.stringify({
          caseNumber: secCase.caseNumber,
          decision,
          reason,
          previousStatus: secCase.status,
          newStatus,
          riderId: secCase.riderId,
        }),
      },
    });

    return updated;
  });

  return updatedCase;
}
