import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");

    const where: any = {};
    if (search) {
      where.OR = [
        { riderId: { contains: search } },
        { name: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const riders = await prisma.rider.findMany({
      where,
      include: {
        baselines: {
          orderBy: { version: "desc" },
          take: 1,
        },
        _count: {
          select: {
            sessions: true,
            cases: true,
          },
        },
      },
      orderBy: { enrollmentDate: "desc" },
    });

    return NextResponse.json({ riders });
  } catch (error: any) {
    console.error("List Riders Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
