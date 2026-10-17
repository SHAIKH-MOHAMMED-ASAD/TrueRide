import { NextRequest, NextResponse } from "next/server";
import { listSecurityCases } from "@/lib/services/cases";

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
