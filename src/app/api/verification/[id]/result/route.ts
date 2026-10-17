import { NextRequest, NextResponse } from "next/server";
import { recordVerificationResult } from "@/lib/services/verification";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      result,
      similarityScore,
      qualityWarning,
      failureReason,
      recoveryMethod,
    } = body;

    if (!result) {
      return NextResponse.json({ error: "result is required" }, { status: 400 });
    }

    const updated = await recordVerificationResult({
      verificationId: id,
      result,
      similarityScore,
      qualityWarning,
      failureReason,
      recoveryMethod,
    });

    return NextResponse.json({ success: true, verification: updated });
  } catch (error: any) {
    console.error("Record Verification Result Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
