import { NextRequest, NextResponse } from "next/server";
import { getSecurityCaseById } from "@/lib/services/cases";

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
