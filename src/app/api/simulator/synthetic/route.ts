import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  generateSyntheticDataset,
  evaluateSyntheticBatch,
  exportRecordsToCsv,
} from "@/lib/services/syntheticDatasetGenerator";
import { persistScaleSimulationRun } from "@/lib/services/scalePersistence";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const format = searchParams.get("format") || "csv";
    const count = Math.min(100000, Math.max(10, Number(searchParams.get("count")) || 1000));
    const fraudRatePercent = Number(searchParams.get("fraudRatePercent") || 7);
    const newDevicePercent = Number(searchParams.get("newDevicePercent") || 4);
    const zoneShiftPercent = Number(searchParams.get("zoneShiftPercent") || 3);

    // Fast-path: Check for pre-generated physical CSV on disk
    const dataDir = path.join(process.cwd(), "data");
    const pregeneratedCsv = path.join(dataDir, `trueride_synthetic_${count}.csv`);
    const default100kCsv = path.join(dataDir, "trueride_synthetic_100k.csv");

    if (format === "csv") {
      if (fs.existsSync(pregeneratedCsv)) {
        const content = fs.readFileSync(pregeneratedCsv, "utf8");
        return new NextResponse(content, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="trueride_synthetic_${count}.csv"`,
          },
        });
      } else if (count === 100000 && fs.existsSync(default100kCsv)) {
        const content = fs.readFileSync(default100kCsv, "utf8");
        return new NextResponse(content, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="trueride_synthetic_100k.csv"`,
          },
        });
      }

      // Generate on demand
      const { records } = generateSyntheticDataset(count, {
        fraudRatePercent,
        newDevicePercent,
        zoneShiftPercent,
      });
      const csv = exportRecordsToCsv(records);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="trueride_synthetic_${count}.csv"`,
        },
      });
    }

    // Default JSON
    const { records, baselinePool } = generateSyntheticDataset(count, {
      fraudRatePercent,
      newDevicePercent,
      zoneShiftPercent,
    });
    const benchmark = evaluateSyntheticBatch(records, baselinePool);
    return NextResponse.json({ success: true, count: records.length, benchmark });
  } catch (error: any) {
    console.error("Synthetic GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const count = Math.min(100000, Math.max(10, Number(body.count) || 1000));
    const fraudRatePercent = body.fraudRatePercent !== undefined ? Number(body.fraudRatePercent) : 7;
    const newDevicePercent = body.newDevicePercent !== undefined ? Number(body.newDevicePercent) : 4;
    const zoneShiftPercent = body.zoneShiftPercent !== undefined ? Number(body.zoneShiftPercent) : 3;
    const exportFormat = body.exportFormat as "json" | "csv" | undefined;

    // Fast-path: If pre-generated 100k CSV exists on disk, serve instantly for buttery-smooth export
    const dataDir = path.join(process.cwd(), "data");
    const default100kCsv = path.join(dataDir, "trueride_synthetic_100k.csv");
    const pregeneratedCsv = path.join(dataDir, `trueride_synthetic_${count}.csv`);

    if (exportFormat === "csv") {
      if (fs.existsSync(pregeneratedCsv)) {
        const csv = fs.readFileSync(pregeneratedCsv, "utf8");
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="trueride_synthetic_${count}.csv"`,
          },
        });
      } else if (count === 100000 && fs.existsSync(default100kCsv)) {
        const csv = fs.readFileSync(default100kCsv, "utf8");
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="trueride_synthetic_100k.csv"`,
          },
        });
      }
    }

    // Generate synthetic dataset
    const { records, baselinePool } = generateSyntheticDataset(count, {
      fraudRatePercent,
      newDevicePercent,
      zoneShiftPercent,
      seed: body.seed ? Number(body.seed) : undefined,
    });

    // Evaluate in memory through standalone risk engine
    const benchmark = evaluateSyntheticBatch(records, baselinePool);

    if (exportFormat === "csv") {
      const csv = exportRecordsToCsv(records);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="trueride_synthetic_${count}.csv"`,
        },
      });
    }

    if (exportFormat === "json") {
      return new NextResponse(JSON.stringify(records, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="trueride_synthetic_${count}.json"`,
        },
      });
    }

    // Persist scale run to SQLite database and persistent benchmark store
    const { casesCreated, sessionsPersisted, storeState } = await persistScaleSimulationRun(
      records,
      benchmark
    );

    return NextResponse.json({
      success: true,
      benchmark,
      recordsPersisted: sessionsPersisted,
      casesCreated,
      cumulativeCount: storeState.cumulativeCount,
    });
  } catch (error: any) {
    console.error("Synthetic Dataset Simulation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
