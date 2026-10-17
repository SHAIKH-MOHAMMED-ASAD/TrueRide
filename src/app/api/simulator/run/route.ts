import { NextRequest, NextResponse } from "next/server";
import { runSimulationScenario } from "@/lib/services/simulator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId } = body;

    if (!scenarioId) {
      return NextResponse.json({ error: "scenarioId is required" }, { status: 400 });
    }

    const result = await runSimulationScenario(scenarioId);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Run Simulation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
