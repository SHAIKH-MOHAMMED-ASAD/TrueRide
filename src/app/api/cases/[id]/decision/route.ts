import { NextRequest, NextResponse } from "next/server";
import { recordCaseDecision } from "@/lib/services/cases";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { reviewer, decision, reason, newStatus } = body;

    if (!reviewer || !decision || !reason || !newStatus) {
      return NextResponse.json(
        { error: "Missing required fields: reviewer, decision, reason, newStatus" },
        { status: 400 }
      );
    }

    const updated = await recordCaseDecision({
      caseId: id,
      reviewer,
      decision,
      reason,
      newStatus,
    });

    return NextResponse.json({ success: true, case: updated });
  } catch (error: any) {
    console.error("Record Decision Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
