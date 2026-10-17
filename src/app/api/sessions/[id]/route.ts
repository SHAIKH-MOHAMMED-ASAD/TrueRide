import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.sessionEvent.findFirst({
      where: {
        OR: [{ id }, { sessionId: id }, { eventId: id }],
      },
      include: {
        rider: {
          include: {
            baselines: {
              orderBy: { version: "desc" },
              take: 1,
            },
          },
        },
        assessment: {
          include: {
            signals: {
              orderBy: { subscore: "desc" },
            },
            case: {
              include: {
                decisions: true,
                verifications: true,
              },
            },
          },
        },
        verifications: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error: any) {
    console.error("Get Session Details Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
