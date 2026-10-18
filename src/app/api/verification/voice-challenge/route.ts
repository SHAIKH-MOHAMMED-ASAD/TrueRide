import { NextRequest, NextResponse } from "next/server";
import {
  generateVoiceChallengePhrase,
  executeVoiceChallenge,
} from "@/lib/services/verification";

export async function GET() {
  try {
    const challenge = generateVoiceChallengePhrase();
    return NextResponse.json({ success: true, ...challenge }, { status: 200 });
  } catch (error: any) {
    console.error("Voice Challenge Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      riderId,
      sessionId,
      caseId,
      phrase,
      spokenTranscript,
      voiceMatchScore,
      voiceLivenessPassed,
      antiDeepfakeScore,
      voiceOutcome,
      actor,
    } = body;

    if (!riderId) {
      return NextResponse.json({ error: "riderId is required" }, { status: 400 });
    }

    if (!phrase) {
      return NextResponse.json({ error: "phrase is required" }, { status: 400 });
    }

    const result = await executeVoiceChallenge({
      riderId,
      sessionId,
      caseId,
      phrase,
      spokenTranscript,
      voiceMatchScore: voiceMatchScore !== undefined ? Number(voiceMatchScore) : undefined,
      voiceLivenessPassed: voiceLivenessPassed !== undefined ? Boolean(voiceLivenessPassed) : true,
      antiDeepfakeScore: antiDeepfakeScore !== undefined ? Number(antiDeepfakeScore) : undefined,
      voiceOutcome,
      actor: actor || "VOICE_STEP_UP_API",
    });

    return NextResponse.json({ ...result }, { status: 200 });
  } catch (error: any) {
    console.error("Voice Challenge Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
