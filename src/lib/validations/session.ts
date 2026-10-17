import { z } from "zod";

export const securityChangesSchema = z
  .object({
    phoneChanged: z.boolean().optional(),
    payoutChanged: z.boolean().optional(),
    passwordReset: z.boolean().optional(),
    pinChanged: z.boolean().optional(),
    emailChanged: z.boolean().optional(),
  })
  .optional();

export const sessionEventIngestSchema = z.object({
  eventId: z.string().min(3, "Event ID is required"),
  riderId: z.string().min(3, "Rider ID is required"),
  sessionId: z.string().min(3, "Session ID is required"),
  timestamp: z.string().or(z.date()).optional(),
  deviceId: z.string().min(3, "Device ID is required"),
  deviceModel: z.string().optional(),
  appVersion: z.string().optional(),
  operatingZone: z.string().min(2, "Operating zone is required"),
  city: z.string().default("Bengaluru"),
  loginHour: z.number().int().min(0).max(23),
  dayOfWeek: z.number().int().min(0).max(6),
  sessionDurationMinutes: z.number().positive().optional(),
  avgIntervalSec: z.number().positive().optional(),
  interactionPattern: z.string().optional(),
  acceptanceRate: z.number().min(0).max(1).optional(),
  completionRate: z.number().min(0).max(1).optional(),
  deliveriesAttempted: z.number().int().nonnegative().optional(),
  deliveriesCompleted: z.number().int().nonnegative().optional(),
  actionSequence: z.array(z.string()).optional(),
  sessionTerminationType: z.string().optional(),
  securityChanges: securityChangesSchema,
  isSimulated: z.boolean().default(false),
  scenarioName: z.string().optional(),
  groundTruthLabel: z.string().optional(),
});

export type SessionEventIngestInput = z.infer<typeof sessionEventIngestSchema>;
