import { NextRequest, NextResponse } from "next/server";
import { requestVerification } from "@/lib/services/verification";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { riderId, sessionId, sessionEventId, caseId, verificationType } = body;

    if (!riderId) {
      return NextResponse.json({ error: "riderId is required" }, { status: 400 });
    }

    const event = await requestVerification({
      riderId,
      sessionId,
      sessionEventId,
      caseId,
      verificationType,
    });

    return NextResponse.json({ success: true, verification: event }, { status: 201 });
  } catch (error: any) {
    console.error("Request Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
