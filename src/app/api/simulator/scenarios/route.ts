import { NextResponse } from "next/server";
import { SIMULATOR_SCENARIOS } from "@/lib/services/simulator";

export async function GET() {
  return NextResponse.json({ scenarios: SIMULATOR_SCENARIOS });
}
