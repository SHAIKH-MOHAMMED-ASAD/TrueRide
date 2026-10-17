import { NextResponse } from "next/server";
import { runSystemEvaluation } from "@/lib/services/evaluation";

export async function GET() {
  try {
    const evaluation = runSystemEvaluation();
    return NextResponse.json({ evaluation });
  } catch (error: any) {
    console.error("Evaluation Metrics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
