import { NextRequest, NextResponse } from "next/server";
import { ingestSessionEvent } from "@/lib/services/ingestion";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await ingestSessionEvent(body);
    return NextResponse.json(result, { status: result.isDuplicate ? 200 : 201 });
  } catch (error: any) {
    console.error("Ingest API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to ingest session event" },
      { status: 400 }
    );
  }
}
