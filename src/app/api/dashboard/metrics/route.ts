import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runSystemEvaluation } from "@/lib/services/evaluation";

export async function GET() {
  try {
    const [
      ridersCount,
      sessionsCount,
      assessments,
      cases,
      pendingVerificationsCount,
      recentAlerts,
      recentDecisions,
      auditEvents,
    ] = await Promise.all([
      prisma.rider.count(),
      prisma.sessionEvent.count(),
      prisma.riskAssessment.findMany({
        select: {
          overallScore: true,
          riskLevel: true,
          recommendedAction: true,
          createdAt: true,
        },
      }),
      prisma.securityCase.findMany({
        select: {
          id: true,
          caseNumber: true,
          status: true,
          priority: true,
        },
      }),
      prisma.verificationEvent.count({
        where: { status: "PENDING" },
      }),
      prisma.riskAssessment.findMany({
        where: {
          OR: [{ riskLevel: "HIGH" }, { riskLevel: "MEDIUM" }],
        },
        include: {
          rider: true,
          sessionEvent: true,
          case: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.reviewDecision.findMany({
        include: {
          case: {
            include: { rider: true },
          },
        },
        orderBy: { timestamp: "desc" },
        take: 6,
      }),
      prisma.auditEvent.findMany({
        orderBy: { timestamp: "desc" },
        take: 10,
      }),
    ]);

    // Risk counts
    let lowRiskCount = 0;
    let mediumRiskCount = 0;
    let highRiskCount = 0;

    // Score distribution buckets: [0-19], [20-39], [40-59], [60-79], [80-100]
    const distribution = [
      { range: "0-19 (Safe)", count: 0 },
      { range: "20-29 (Low)", count: 0 },
      { range: "30-49 (Mild Deviation)", count: 0 },
      { range: "50-69 (Medium Challenge)", count: 0 },
      { range: "70-100 (High Risk)", count: 0 },
    ];

    assessments.forEach((a) => {
      if (a.riskLevel === "LOW") lowRiskCount++;
      else if (a.riskLevel === "MEDIUM") mediumRiskCount++;
      else if (a.riskLevel === "HIGH") highRiskCount++;

      if (a.overallScore < 20) distribution[0].count++;
      else if (a.overallScore <= 29) distribution[1].count++;
      else if (a.overallScore < 50) distribution[2].count++;
      else if (a.overallScore <= 69) distribution[3].count++;
      else distribution[4].count++;
    });

    const openCasesCount = cases.filter(
      (c) =>
        c.status === "NEW_ALERT" ||
        c.status === "UNDER_INVESTIGATION" ||
        c.status === "VERIFICATION_REQUIRED"
    ).length;

    // Run evaluation benchmark summary
    const evaluationSummary = runSystemEvaluation();

    return NextResponse.json({
      ridersCount,
      sessionsCount,
      lowRiskCount,
      mediumRiskCount,
      highRiskCount,
      openCasesCount,
      pendingVerificationsCount,
      distribution,
      recentAlerts,
      recentDecisions,
      recentAudits: auditEvents,
      evaluationSummary: {
        precision: evaluationSummary.precision,
        recall: evaluationSummary.recall,
        f1Score: evaluationSummary.f1Score,
        falsePositiveRate: evaluationSummary.falsePositiveRate,
        challengeRate: evaluationSummary.challengeRate,
        avgLatencyMs: evaluationSummary.avgLatencyMs,
        p95LatencyMs: evaluationSummary.p95LatencyMs,
        totalEvaluated: evaluationSummary.totalEvaluated,
        truePositives: evaluationSummary.truePositives,
        falsePositives: evaluationSummary.falsePositives,
        trueNegatives: evaluationSummary.trueNegatives,
        falseNegatives: evaluationSummary.falseNegatives,
      },
    });
  } catch (error: any) {
    console.error("Dashboard Metrics API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
