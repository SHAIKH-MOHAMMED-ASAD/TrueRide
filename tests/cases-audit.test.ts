import { describe, it, expect } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  createSecurityCase,
  updateSecurityCase,
  listSecurityCases,
  getSecurityCaseById,
} from "../src/lib/services/cases";

describe("Review Queue & Audit Trail: Add New and Update Cases", () => {
  const testRiderId = "r_0042"; // Sanjay Verma

  it("Scenario 1: Manually creating a new case persists to database and emits CASE_CREATED audit event", async () => {
    const timestamp = Date.now();
    const newCase = await createSecurityCase({
      riderId: testRiderId,
      riderName: "Sanjay Verma",
      priority: "CRITICAL",
      status: "NEW_ALERT",
      assignedReviewer: "Lead Analyst Asad",
      title: `SIM Swap Incident #${timestamp}`,
      notes: "SIM swap verified with telecom provider. Immediate step-up challenge required.",
      riskScore: 92,
      actor: "Lead Analyst Asad",
    });

    expect(newCase).toBeDefined();
    expect(newCase.id).toBeDefined();
    expect(newCase.caseNumber).toMatch(/^CASE-2026-/);
    expect(newCase.priority).toBe("CRITICAL");
    expect(newCase.status).toBe("NEW_ALERT");
    expect(newCase.assignedReviewer).toBe("Lead Analyst Asad");

    // Verify persisted in SQLite database
    const dbCase = await prisma.securityCase.findUnique({
      where: { id: newCase.id },
      include: { assessment: { include: { signals: true } }, rider: true },
    });

    expect(dbCase).not.toBeNull();
    expect(dbCase?.riderId).toBe(testRiderId);
    expect(dbCase?.assessment).not.toBeNull();
    expect(dbCase?.assessment.overallScore).toBe(92);
    expect(dbCase?.assessment.signals.length).toBeGreaterThan(0);

    // Verify immutable audit event in AuditEvent table
    const auditEvent = await prisma.auditEvent.findFirst({
      where: {
        entityId: newCase.id,
        eventType: "CASE_CREATED",
      },
      orderBy: { timestamp: "desc" },
    });

    expect(auditEvent).not.toBeNull();
    expect(auditEvent?.actor).toBe("Lead Analyst Asad");
    expect(auditEvent?.entityType).toBe("CASE");
    expect(auditEvent?.summary).toContain(newCase.caseNumber);
    expect(auditEvent?.details).toContain(testRiderId);
  });

  it("Scenario 2: Updating an existing case status, priority, and notes persists to SQLite and emits CASE_UPDATED audit event", async () => {
    // 1. Create a base case
    const baseCase = await createSecurityCase({
      riderId: testRiderId,
      priority: "MEDIUM",
      status: "NEW_ALERT",
      title: "Routine Speed Discrepancy",
      notes: "Initial triage pending.",
      riskScore: 65,
      actor: "System Automated Rule",
    });

    // 2. Update the case to UNDER_INVESTIGATION and escalate priority to HIGH
    const updatedCase = await updateSecurityCase(baseCase.id, {
      status: "UNDER_INVESTIGATION",
      priority: "HIGH",
      assignedReviewer: "Specialist Maya",
      notes: "Corroborated with customer delivery GPS timestamps. Investigating dual logins.",
      actor: "Specialist Maya",
    });

    expect(updatedCase.status).toBe("UNDER_INVESTIGATION");
    expect(updatedCase.priority).toBe("HIGH");
    expect(updatedCase.assignedReviewer).toBe("Specialist Maya");
    expect(updatedCase.notes).toContain("Corroborated with customer delivery GPS");

    // 3. Verify SQLite reflects the update
    const dbCase = await prisma.securityCase.findUnique({
      where: { id: baseCase.id },
    });
    expect(dbCase?.status).toBe("UNDER_INVESTIGATION");
    expect(dbCase?.priority).toBe("HIGH");
    expect(dbCase?.assignedReviewer).toBe("Specialist Maya");

    // 4. Verify CASE_UPDATED audit record
    const auditUpdate = await prisma.auditEvent.findFirst({
      where: {
        entityId: baseCase.id,
        eventType: "CASE_UPDATED",
      },
      orderBy: { timestamp: "desc" },
    });

    expect(auditUpdate).not.toBeNull();
    expect(auditUpdate?.actor).toBe("Specialist Maya");
    expect(auditUpdate?.summary).toContain(baseCase.caseNumber);
    expect(auditUpdate?.details).toContain("UNDER_INVESTIGATION");
    expect(auditUpdate?.details).toContain("HIGH");
  });

  it("Scenario 3: Resolving a case sets resolvedAt and emits audit record with decision details", async () => {
    const testCase = await createSecurityCase({
      riderId: "r_0053",
      riderName: "Rahul Sharma",
      priority: "HIGH",
      status: "VERIFICATION_REQUIRED",
      title: "Secondary Device Anomaly",
      riskScore: 78,
    });

    // Resolve as VERIFIED_LEGITIMATE
    const resolvedCase = await updateSecurityCase(testCase.id, {
      status: "VERIFIED_LEGITIMATE",
      decision: "VERIFIED_LEGITIMATE",
      resolutionReason: "Courier attended in-person video kiosk check. Confirmed rightful owner.",
      actor: "Supervisor Patel",
    });

    expect(resolvedCase.status).toBe("VERIFIED_LEGITIMATE");
    expect(resolvedCase.resolvedAt).not.toBeNull();

    // Verify ReviewDecision row created
    const decisionRow = await prisma.reviewDecision.findFirst({
      where: { caseId: testCase.id },
    });
    expect(decisionRow).not.toBeNull();
    expect(decisionRow?.decision).toBe("VERIFIED_LEGITIMATE");
    expect(decisionRow?.reviewer).toBe("Supervisor Patel");

    // Verify CASE_DECISION_RECORDED audit event
    const decisionAudit = await prisma.auditEvent.findFirst({
      where: {
        entityId: testCase.id,
        eventType: "CASE_DECISION_RECORDED",
      },
      orderBy: { timestamp: "desc" },
    });

    expect(decisionAudit).not.toBeNull();
    expect(decisionAudit?.actor).toBe("Supervisor Patel");
    expect(decisionAudit?.details).toContain("Courier attended in-person video kiosk check");
  });

  it("Scenario 4: listSecurityCases retrieves newly created and updated cases accurately", async () => {
    const uniqueTitle = `Unique Audit Trace ${Date.now()}`;
    const created = await createSecurityCase({
      riderId: "r_0019",
      priority: "CRITICAL",
      status: "NEW_ALERT",
      title: uniqueTitle,
      notes: "Search index validation case.",
    });

    const listResult = await listSecurityCases({
      riderId: "r_0019",
      limit: 10,
    });

    expect(listResult.cases.length).toBeGreaterThan(0);
    const found = listResult.cases.find((c) => c.id === created.id);
    expect(found).toBeDefined();
    expect(found?.caseNumber).toBe(created.caseNumber);
  });
});
