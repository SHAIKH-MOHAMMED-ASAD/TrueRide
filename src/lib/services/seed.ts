import { prisma } from "../prisma";
import { ingestSessionEvent } from "./ingestion";
import { recordCaseDecision } from "./cases";
import { requestVerification, recordVerificationResult } from "./verification";
import { resetScaleBenchmarkStore } from "./scaleBenchmarkStore";

export async function resetAndSeedDatabase() {
  console.log("--> Purging existing TrueRide records...");
  resetScaleBenchmarkStore();

  // Purge in relational order
  await prisma.auditEvent.deleteMany();
  await prisma.reviewDecision.deleteMany();
  await prisma.verificationEvent.deleteMany();
  await prisma.securityCase.deleteMany();
  await prisma.riskSignal.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.sessionEvent.deleteMany();
  await prisma.behavioralBaseline.deleteMany();
  await prisma.rider.deleteMany();

  console.log("--> Seeding fictional rider profiles...");

  // 1. Rider Profiles
  const riders = [
    {
      riderId: "RDR-8021",
      name: "Arjun Kumar",
      phone: "+91 98450 12821",
      city: "Bengaluru",
      enrollmentDate: new Date("2024-03-15"),
      accountStatus: "ACTIVE",
      baselineStatus: "ESTABLISHED",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
    {
      riderId: "RDR-7740",
      name: "Rajesh Sharma",
      phone: "+91 97410 88740",
      city: "Bengaluru",
      enrollmentDate: new Date("2024-05-10"),
      accountStatus: "ACTIVE",
      baselineStatus: "ESTABLISHED",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
    {
      riderId: "RDR-9105",
      name: "Vikram Singh",
      phone: "+91 99002 44105",
      city: "Bengaluru",
      enrollmentDate: new Date("2024-01-20"),
      accountStatus: "ACTIVE",
      baselineStatus: "ESTABLISHED",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },
    {
      riderId: "RDR-6032",
      name: "Deepa Nair",
      phone: "+91 98860 33032",
      city: "Bengaluru",
      enrollmentDate: new Date("2024-02-14"),
      accountStatus: "ACTIVE",
      baselineStatus: "ESTABLISHED",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    },
    {
      riderId: "RDR-5114",
      name: "Rahul Verma",
      phone: "+91 96112 55114",
      city: "Bengaluru",
      enrollmentDate: new Date("2026-10-14"),
      accountStatus: "ACTIVE",
      baselineStatus: "SPARSE",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
    },
    {
      riderId: "RDR-3390",
      name: "Mohammed Irfan",
      phone: "+91 99805 77390",
      city: "Bengaluru",
      enrollmentDate: new Date("2024-07-01"),
      accountStatus: "ACTIVE",
      baselineStatus: "ESTABLISHED",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    },
  ];

  for (const r of riders) {
    await prisma.rider.create({ data: r });
  }

  console.log("--> Seeding individualized behavioral baselines...");

  // 2. Individualized Behavioral Baselines
  const baselines = [
    {
      riderId: "RDR-8021",
      version: 1,
      observationWindow: "Last 30 Days (48 Sessions)",
      supportingSessions: 48,
      confidence: "HIGH",
      typicalHours: JSON.stringify([8, 9, 10, 11, 12, 13, 14, 18, 19, 20, 21]),
      typicalDays: JSON.stringify([1, 2, 3, 4, 5, 6]),
      knownDevices: JSON.stringify(["DEV-SM-A53", "DEV-SM-A54"]),
      primaryZones: JSON.stringify(["Koramangala", "HSR Layout"]),
      avgSessionDuration: 240,
      stdSessionDuration: 35,
      avgInteractionInterval: 14.5,
      stdInteractionInterval: 3.2,
      typicalAcceptanceRate: 0.9,
      typicalCompletionRate: 0.98,
      typicalActions: JSON.stringify(["LOGIN", "ACCEPT", "PICKUP", "NAVIGATE", "DELIVER"]),
    },
    {
      riderId: "RDR-7740",
      version: 1,
      observationWindow: "Last 30 Days (38 Sessions)",
      supportingSessions: 38,
      confidence: "HIGH",
      typicalHours: JSON.stringify([17, 18, 19, 20, 21, 22, 23]),
      typicalDays: JSON.stringify([2, 3, 4, 5, 6, 0]),
      knownDevices: JSON.stringify(["DEV-POCO-X4"]),
      primaryZones: JSON.stringify(["Indiranagar", "Domlur"]),
      avgSessionDuration: 300,
      stdSessionDuration: 40,
      avgInteractionInterval: 12.8,
      stdInteractionInterval: 2.8,
      typicalAcceptanceRate: 0.94,
      typicalCompletionRate: 0.99,
      typicalActions: JSON.stringify(["LOGIN", "ACCEPT", "PICKUP", "NAVIGATE", "DELIVER"]),
    },
    {
      riderId: "RDR-9105",
      version: 1,
      observationWindow: "Last 30 Days (42 Sessions)",
      supportingSessions: 42,
      confidence: "HIGH",
      typicalHours: JSON.stringify([9, 10, 11, 12, 13, 14, 15, 16]),
      typicalDays: JSON.stringify([1, 2, 3, 4, 5]),
      knownDevices: JSON.stringify(["DEV-REALME-9"]),
      primaryZones: JSON.stringify(["HSR Layout", "Whitefield"]),
      avgSessionDuration: 270,
      stdSessionDuration: 30,
      avgInteractionInterval: 16.2,
      stdInteractionInterval: 3.5,
      typicalAcceptanceRate: 0.88,
      typicalCompletionRate: 0.95,
      typicalActions: JSON.stringify(["LOGIN", "ACCEPT", "PICKUP", "NAVIGATE", "DELIVER"]),
    },
    {
      riderId: "RDR-6032",
      version: 1,
      observationWindow: "Last 30 Days (56 Sessions)",
      supportingSessions: 56,
      confidence: "HIGH",
      typicalHours: JSON.stringify([8, 9, 10, 11, 12, 13, 14, 15]),
      typicalDays: JSON.stringify([1, 2, 3, 4, 5, 6]),
      knownDevices: JSON.stringify(["DEV-VIVO-V25"]),
      primaryZones: JSON.stringify(["Koramangala", "BTM Layout"]),
      avgSessionDuration: 250,
      stdSessionDuration: 25,
      avgInteractionInterval: 13.9,
      stdInteractionInterval: 2.5,
      typicalAcceptanceRate: 0.95,
      typicalCompletionRate: 0.98,
      typicalActions: JSON.stringify(["LOGIN", "ACCEPT", "PICKUP", "NAVIGATE", "DELIVER"]),
    },
    {
      riderId: "RDR-5114",
      version: 1,
      observationWindow: "Last 2 Days (2 Sessions)",
      supportingSessions: 2,
      confidence: "INSUFFICIENT",
      typicalHours: JSON.stringify([11, 12, 13]),
      typicalDays: JSON.stringify([2, 3]),
      knownDevices: JSON.stringify(["DEV-REDMI-9A"]),
      primaryZones: JSON.stringify(["Whitefield"]),
      avgSessionDuration: 120,
      stdSessionDuration: 20,
      avgInteractionInterval: 21.0,
      stdInteractionInterval: 4.0,
      typicalAcceptanceRate: 0.82,
      typicalCompletionRate: 0.92,
      typicalActions: JSON.stringify(["LOGIN", "ACCEPT", "PICKUP", "DELIVER"]),
    },
    {
      riderId: "RDR-3390",
      version: 1,
      observationWindow: "Last 30 Days (34 Sessions)",
      supportingSessions: 34,
      confidence: "HIGH",
      typicalHours: JSON.stringify([14, 15, 16, 17, 18, 19, 20, 21]),
      typicalDays: JSON.stringify([1, 2, 3, 4, 5, 6]),
      knownDevices: JSON.stringify(["DEV-MOTO-G52"]),
      primaryZones: JSON.stringify(["Electronic City"]),
      avgSessionDuration: 220,
      stdSessionDuration: 30,
      avgInteractionInterval: 15.5,
      stdInteractionInterval: 3.0,
      typicalAcceptanceRate: 0.91,
      typicalCompletionRate: 0.97,
      typicalActions: JSON.stringify(["LOGIN", "ACCEPT", "PICKUP", "NAVIGATE", "DELIVER"]),
    },
  ];

  for (const b of baselines) {
    await prisma.behavioralBaseline.create({ data: b });
  }

  console.log("--> Ingesting historical baseline sessions through pipeline...");

  // Ingest initial history sessions for Arjun Kumar (clean baseline history)
  const now = new Date();
  for (let i = 10; i >= 1; i--) {
    const sessionDate = new Date(now.getTime() - i * 24 * 3600 * 1000);
    await ingestSessionEvent({
      eventId: `EVT-SEED-ARJUN-${i}`,
      riderId: "RDR-8021",
      sessionId: `SESS-HIST-8021-${i}`,
      timestamp: sessionDate.toISOString(),
      deviceId: "DEV-SM-A53",
      deviceModel: "Samsung Galaxy A53",
      operatingZone: "Koramangala",
      city: "Bengaluru",
      loginHour: 9 + (i % 3),
      dayOfWeek: sessionDate.getDay(),
      sessionDurationMinutes: 230 + (i * 2),
      avgIntervalSec: 14.3 + (i % 2 === 0 ? 0.3 : -0.2),
      interactionPattern: "NORMAL_RAPID",
      acceptanceRate: 0.91,
      completionRate: 0.98,
      deliveriesAttempted: 13,
      deliveriesCompleted: 13,
      sessionTerminationType: "NORMAL_LOGOUT",
      isSimulated: false,
      groundTruthLabel: "LEGITIMATE",
    });
  }

  // Ingest historical sessions for Rajesh Sharma
  for (let i = 5; i >= 1; i--) {
    const sessionDate = new Date(now.getTime() - i * 36 * 3600 * 1000);
    await ingestSessionEvent({
      eventId: `EVT-SEED-RAJESH-${i}`,
      riderId: "RDR-7740",
      sessionId: `SESS-HIST-7740-${i}`,
      timestamp: sessionDate.toISOString(),
      deviceId: "DEV-POCO-X4",
      deviceModel: "Poco X4 Pro",
      operatingZone: "Indiranagar",
      city: "Bengaluru",
      loginHour: 18,
      dayOfWeek: sessionDate.getDay(),
      sessionDurationMinutes: 280,
      avgIntervalSec: 12.9,
      interactionPattern: "NORMAL_RAPID",
      acceptanceRate: 0.95,
      completionRate: 0.99,
      deliveriesAttempted: 16,
      deliveriesCompleted: 16,
      sessionTerminationType: "NORMAL_LOGOUT",
      isSimulated: false,
      groundTruthLabel: "LEGITIMATE",
    });
  }

  console.log("--> Creating realistic Trust & Safety queue states...");

  // Seed an active case requiring verification (e.g. for Vikram Singh)
  const vikramEvent = await ingestSessionEvent({
    eventId: "EVT-SEED-ALERT-VIKRAM",
    riderId: "RDR-9105",
    sessionId: "SESS-ALERT-9105",
    timestamp: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    deviceId: "DEV-UNKNOWN-ONEPLUS",
    deviceModel: "OnePlus Nord CE",
    operatingZone: "Koramangala",
    city: "Bengaluru",
    loginHour: 2,
    dayOfWeek: 1,
    sessionDurationMinutes: 390,
    avgIntervalSec: 46.2,
    interactionPattern: "HESITANT_SLOW",
    acceptanceRate: 0.45,
    completionRate: 0.75,
    deliveriesAttempted: 8,
    deliveriesCompleted: 6,
    sessionTerminationType: "RAPID_RE_LOGIN",
    securityChanges: { payoutChanged: true },
    isSimulated: false,
    groundTruthLabel: "HANDOFF",
  });

  if (vikramEvent.caseId) {
    // Initiate verification request for Vikram
    const ver = await requestVerification({
      riderId: "RDR-9105",
      sessionId: "SESS-ALERT-9105",
      caseId: vikramEvent.caseId,
      verificationType: "FACIAL_BIOMETRIC",
    });
  }

  // Seed a resolved legitimate case (e.g. for Deepa Nair)
  const deepaEvent = await ingestSessionEvent({
    eventId: "EVT-SEED-LEGIT-DEEPA",
    riderId: "RDR-6032",
    sessionId: "SESS-RESOLVED-6032",
    timestamp: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    deviceId: "DEV-VIVO-V29", // Upgraded phone
    deviceModel: "Vivo V29 5G",
    operatingZone: "BTM Layout",
    city: "Bengaluru",
    loginHour: 10,
    dayOfWeek: 3,
    sessionDurationMinutes: 245,
    avgIntervalSec: 14.0,
    interactionPattern: "NORMAL_RAPID",
    acceptanceRate: 0.94,
    completionRate: 0.98,
    deliveriesAttempted: 14,
    deliveriesCompleted: 14,
    sessionTerminationType: "NORMAL_LOGOUT",
    isSimulated: false,
    groundTruthLabel: "LEGITIMATE",
  });

  // Seed a dismissed false positive alert (e.g. for Mohammed Irfan)
  const irfanEvent = await ingestSessionEvent({
    eventId: "EVT-SEED-DISMISSED-IRFAN",
    riderId: "RDR-3390",
    sessionId: "SESS-DISMISSED-3390",
    timestamp: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
    deviceId: "DEV-MOTO-G52",
    deviceModel: "Motorola G52",
    operatingZone: "Electronic City",
    city: "Bengaluru",
    loginHour: 18,
    dayOfWeek: 5,
    sessionDurationMinutes: 180,
    avgIntervalSec: 34.0,
    interactionPattern: "NORMAL_RAPID",
    acceptanceRate: 0.75,
    completionRate: 0.9,
    deliveriesAttempted: 8,
    deliveriesCompleted: 8,
    sessionTerminationType: "NORMAL_LOGOUT",
    isSimulated: false,
    groundTruthLabel: "FALSE_POSITIVE",
  });

  if (irfanEvent.caseId) {
    await recordCaseDecision({
      caseId: irfanEvent.caseId,
      reviewer: "T&S Analyst Priya M.",
      decision: "DISMISSED_FALSE_POSITIVE",
      reason:
        "Verified with rider: severe monsoon rainfall in Electronic City caused screen touch sensitivity issues. Rider voice callback authenticated genuine identity. Baseline protected from penalty.",
      newStatus: "DISMISSED_ALERT",
    });
  }

  console.log("--> TrueRide database successfully seeded with reproducible demo records!");
  return { success: true, ridersCount: riders.length };
}
