import { NextRequest, NextResponse } from "next/server";
import { runSystemEvaluation, exportEvaluationToCsv } from "@/lib/services/evaluation";

export async function GET(req: NextRequest) {
  try {
    const evaluation = runSystemEvaluation();
    const format = req.nextUrl.searchParams.get("format");

    if (format === "csv") {
      const csv = exportEvaluationToCsv(evaluation);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="trueride_system_evaluation.csv"',
        },
      });
    }

    return NextResponse.json({ evaluation });
  } catch (error: any) {
    console.error("Evaluation Metrics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
