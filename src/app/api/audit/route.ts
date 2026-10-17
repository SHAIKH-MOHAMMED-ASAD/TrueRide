import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const eventType = searchParams.get("eventType");
    const entityType = searchParams.get("entityType");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};
    if (eventType && eventType !== "ALL") where.eventType = eventType;
    if (entityType && entityType !== "ALL") where.entityType = entityType;

    const auditEvents = await prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json({ auditEvents });
  } catch (error: any) {
    console.error("Audit Events API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
