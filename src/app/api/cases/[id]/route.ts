import { NextRequest, NextResponse } from "next/server";
import { getSecurityCaseById, updateSecurityCase } from "@/lib/services/cases";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const secCase = await getSecurityCaseById(id);

    if (!secCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json({ case: secCase });
  } catch (error: any) {
    console.error("Get Case Details Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      status,
      priority,
      assignedReviewer,
      notes,
      resolutionReason,
      decision,
      actor,
    } = body;

    const updated = await updateSecurityCase(id, {
      status,
      priority,
      assignedReviewer,
      notes,
      resolutionReason,
      decision,
      actor: actor || assignedReviewer || "ANALYST",
    });

    return NextResponse.json({ success: true, case: updated });
  } catch (error: any) {
    console.error("Update Case Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return PATCH(req, ctx);
}
