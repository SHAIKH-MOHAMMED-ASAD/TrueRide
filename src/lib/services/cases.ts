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
  }, { timeout: 25000, maxWait: 10000 });

  return updatedCase;
}

export interface CreateCaseParams {
  riderId: string;
  riderName?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  status?: string;
  assignedReviewer?: string;
  title?: string;
  notes?: string;
  riskScore?: number;
  triggerSignals?: Array<{
    name: string;
    category?: string;
    signalCode?: string;
    observedValue?: string;
    expectedRange?: string;
    subscore?: number;
    contribution?: number;
    explanation?: string;
    evidenceQuality?: string;
  }>;
  actor?: string;
}

export interface UpdateCaseParams {
  status?: string;
  priority?: string;
  assignedReviewer?: string;
  notes?: string;
  resolutionReason?: string;
  decision?: string;
  actor?: string;
}

export async function createSecurityCase(params: CreateCaseParams) {
  const {
    riderId,
    riderName,
    priority = "HIGH",
    status = "NEW_ALERT",
    assignedReviewer,
    title = "Manual Identity Investigation",
    notes,
    riskScore = 75,
    triggerSignals = [],
    actor = "ANALYST",
  } = params;

  return prisma.$transaction(async (tx) => {
    // 1. Ensure Rider exists
    let rider = await tx.rider.findUnique({ where: { riderId } });
    if (!rider) {
      rider = await tx.rider.create({
        data: {
          riderId,
          name: riderName || `Rider ${riderId}`,
          phone: "+91 98000 00000",
          city: "Mumbai",
          enrollmentDate: new Date(),
        },
      });
    } else if (riderName && rider.name !== riderName) {
      rider = await tx.rider.update({
        where: { riderId },
        data: { name: riderName },
      });
    }

    // 2. Create Session Event
    const sessionId = `MANUAL-SES-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const eventId = `EVT-${sessionId}`;
    const sessionEvent = await tx.sessionEvent.create({
      data: {
        eventId,
        sessionId,
        riderId,
        timestamp: new Date(),
        deviceId: "DEV-FLAG-MANUAL",
        operatingZone: "Bandra Kurla Complex (BKC)",
        city: rider.city || "Mumbai",
        loginHour: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        isSimulated: false,
        scenarioName: title,
        groundTruthLabel: "HANDOFF",
      },
    });

    // 3. Create Risk Assessment
    const score = Math.max(0, Math.min(100, Number(riskScore)));
    const riskLevel = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
    const recommendedAction =
      score >= 70 ? "ESCALATE_INVESTIGATION" : score >= 50 ? "STEP_UP_VERIFY" : "MONITOR";

    const assessment = await tx.riskAssessment.create({
      data: {
        riderId,
        sessionId,
        sessionEventId: sessionEvent.id,
        overallScore: score,
        riskLevel,
        evidenceQuality: "HIGH",
        confidenceScore: 92,
        behavioralScore: score * 0.95,
        deviceScore: score * 0.9,
        locationScore: score * 0.85,
        sessionAccountScore: score,
        historicalScore: score * 0.8,
        recommendedAction,
        scoringVersion: "v1.0.0",
      },
    });

    // 4. Create Signals
    const signals =
      triggerSignals.length > 0
        ? triggerSignals
        : [
            {
              category: "BEHAVIORAL",
              signalCode: "MANUAL_CASE_EVIDENCE",
              name: title,
              observedValue: notes || "Manual investigation opened by analyst",
              expectedRange: "Normal Enrolled Baseline",
              subscore: score,
              contribution: 0.35,
              explanation: notes || "Flagged in review queue for priority identity audit",
              evidenceQuality: "HIGH",
            },
            {
              category: "DEVICE",
              signalCode: "DEVICE_RISK_FLAG",
              name: "Hardware Integrity Check",
              observedValue: "Secondary Device Anomaly",
              expectedRange: "Registered Hardware",
              subscore: Math.min(100, score + 5),
              contribution: 0.25,
              explanation: "Device telemetry inconsistent with baseline fingerprint",
              evidenceQuality: "HIGH",
            },
          ];

    if (signals.length > 0) {
      await tx.riskSignal.createMany({
        data: signals.map((sig) => ({
          assessmentId: assessment.id,
          category: sig.category || "BEHAVIORAL",
          signalCode: sig.signalCode || "SIGNAL_FLAG",
          name: sig.name || "Risk Indicator",
          observedValue: sig.observedValue || "Observed Anomaly",
          expectedRange: sig.expectedRange || "Normal Baseline",
          subscore: sig.subscore || score,
          contribution: sig.contribution || 0.3,
          explanation: sig.explanation || "Manual investigation evidence point",
          evidenceQuality: sig.evidenceQuality || "HIGH",
        })),
      });
    }

    // 5. Generate case number
    const caseCount = await tx.securityCase.count();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const caseNumber = `CASE-${new Date().getFullYear()}-${String(caseCount + 101).padStart(4, "0")}-${randomSuffix}`;

    // 6. Create Security Case
    const secCase = await tx.securityCase.create({
      data: {
        caseNumber,
        riderId,
        assessmentId: assessment.id,
        status,
        priority,
        assignedReviewer: assignedReviewer || actor,
        notes: notes || title,
      },
      include: {
        rider: true,
        assessment: {
          include: {
            sessionEvent: true,
            signals: true,
          },
        },
      },
    });

    // 7. Write to Audit Trail
    await tx.auditEvent.create({
      data: {
        actor: actor || assignedReviewer || "ANALYST",
        eventType: "CASE_CREATED",
        entityType: "CASE",
        entityId: secCase.id,
        summary: `Security case ${caseNumber} created for Rider ${riderId} (${priority}) by ${actor || assignedReviewer || "Analyst"}`,
        details: JSON.stringify({
          caseNumber,
          riderId,
          riderName: rider.name,
          priority,
          status,
          riskScore: score,
          title,
          notes: secCase.notes,
          assignedReviewer: secCase.assignedReviewer,
        }),
      },
    });

    return secCase;
  }, { timeout: 25000, maxWait: 10000 });
}

export async function updateSecurityCase(caseId: string, params: UpdateCaseParams) {
  const {
    status,
    priority,
    assignedReviewer,
    notes,
    resolutionReason,
    decision,
    actor = "ANALYST",
  } = params;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.securityCase.findUnique({
      where: { id: caseId },
      include: { rider: true, assessment: true },
    });

    if (!existing) {
      throw new Error(`Security case ${caseId} not found`);
    }

    const isResolved = status
      ? [
          "VERIFIED_LEGITIMATE",
          "CONFIRMED_ACCOUNT_HANDOFF",
          "DISMISSED_ALERT",
        ].includes(status)
      : false;

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (assignedReviewer !== undefined) dataToUpdate.assignedReviewer = assignedReviewer;
    if (notes !== undefined) dataToUpdate.notes = notes;
    if (resolutionReason !== undefined) dataToUpdate.resolutionReason = resolutionReason;
    if (isResolved) dataToUpdate.resolvedAt = new Date();

    const updated = await tx.securityCase.update({
      where: { id: caseId },
      data: dataToUpdate,
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
      },
    });

    // If decision provided, record it in reviewDecision
    if (decision) {
      await tx.reviewDecision.create({
        data: {
          caseId,
          reviewer: actor || assignedReviewer || "ANALYST",
          decision,
          reason: resolutionReason || notes || `Decision recorded as ${decision}`,
          previousStatus: existing.status,
          newStatus: status || existing.status,
        },
      });
    }

    // Write to Audit Trail
    const eventType = decision ? "CASE_DECISION_RECORDED" : "CASE_UPDATED";
    await tx.auditEvent.create({
      data: {
        actor: actor || assignedReviewer || "ANALYST",
        eventType,
        entityType: "CASE",
        entityId: caseId,
        summary: `Case ${existing.caseNumber} updated: ${
          status && status !== existing.status ? `status [${existing.status} -> ${status}]` : ""
        } ${priority && priority !== existing.priority ? `priority [${existing.priority} -> ${priority}]` : ""} by ${actor || "Analyst"}`.trim(),
        details: JSON.stringify({
          caseNumber: existing.caseNumber,
          riderId: existing.riderId,
          previousStatus: existing.status,
          newStatus: status || existing.status,
          previousPriority: existing.priority,
          newPriority: priority || existing.priority,
          assignedReviewer: assignedReviewer || existing.assignedReviewer,
          notes,
          resolutionReason,
          decision,
        }),
      },
    });

    return updated;
  }, { timeout: 25000, maxWait: 10000 });
}
