import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const riderId = searchParams.get("riderId");
    const riskLevel = searchParams.get("riskLevel");
    const isSimulated = searchParams.get("isSimulated");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};

    if (riderId) where.riderId = riderId;
    if (riskLevel && riskLevel !== "ALL") {
      where.assessment = { riskLevel };
    }
    if (isSimulated !== null && isSimulated !== undefined && isSimulated !== "") {
      where.isSimulated = isSimulated === "true";
    }
    if (search) {
      where.OR = [
        { sessionId: { contains: search } },
        { eventId: { contains: search } },
        { deviceId: { contains: search } },
        { operatingZone: { contains: search } },
        { riderId: { contains: search } },
      ];
    }

    const [sessions, total] = await Promise.all([
      prisma.sessionEvent.findMany({
        where,
        include: {
          rider: true,
          assessment: {
            include: {
              signals: true,
              case: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sessionEvent.count({ where }),
    ]);

    return NextResponse.json({
      sessions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("List Sessions API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
