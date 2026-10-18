import { NextRequest, NextResponse } from "next/server";
import { executeStepUpAuthentication } from "@/lib/services/verification";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      riderId,
      sessionId,
      caseId,
      otpCode,
      biometricOutcome,
      similarityScore,
      livenessPassed,
      voiceChallenge,
      actor,
    } = body;

    if (!riderId) {
      return NextResponse.json({ error: "riderId is required" }, { status: 400 });
    }

    if (!otpCode) {
      return NextResponse.json({ error: "otpCode is required" }, { status: 400 });
    }

    const result = await executeStepUpAuthentication({
      riderId,
      sessionId,
      caseId,
      otpCode,
      biometricOutcome: biometricOutcome || "MATCH",
      similarityScore: similarityScore !== undefined ? Number(similarityScore) : undefined,
      livenessPassed: livenessPassed !== undefined ? Boolean(livenessPassed) : true,
      voiceChallenge,
      actor: actor || "STEP_UP_PORTAL",
    });

    return NextResponse.json({ ...result }, { status: 200 });
  } catch (error: any) {
    console.error("Step-Up Authentication Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
