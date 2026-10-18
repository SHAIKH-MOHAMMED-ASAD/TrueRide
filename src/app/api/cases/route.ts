import { NextRequest, NextResponse } from "next/server";
import { listSecurityCases, createSecurityCase } from "@/lib/services/cases";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const riderId = searchParams.get("riderId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await listSecurityCases({
      status,
      priority,
      riderId,
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("List Cases Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      riderId,
      riderName,
      priority,
      status,
      assignedReviewer,
      title,
      notes,
      riskScore,
      triggerSignals,
      actor,
    } = body;

    if (!riderId) {
      return NextResponse.json(
        { error: "Missing required field: riderId" },
        { status: 400 }
      );
    }

    const newCase = await createSecurityCase({
      riderId,
      riderName,
      priority,
      status,
      assignedReviewer,
      title,
      notes,
      riskScore,
      triggerSignals,
      actor: actor || assignedReviewer || "ANALYST",
    });

    return NextResponse.json({ success: true, case: newCase }, { status: 201 });
  } catch (error: any) {
    console.error("Create Case Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
