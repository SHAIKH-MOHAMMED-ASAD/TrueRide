import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rider = await prisma.rider.findFirst({
      where: {
        OR: [{ id }, { riderId: id }],
      },
      include: {
        baselines: {
          orderBy: { version: "desc" },
        },
        sessions: {
          take: 20,
          orderBy: { timestamp: "desc" },
          include: {
            assessment: true,
          },
        },
        cases: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            decisions: true,
            verifications: true,
          },
        },
        verifications: {
          take: 10,
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    return NextResponse.json({ rider });
  } catch (error: any) {
    console.error("Get Rider Details Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
