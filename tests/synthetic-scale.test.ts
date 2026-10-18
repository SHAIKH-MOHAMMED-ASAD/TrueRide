import { describe, it, expect } from "vitest";
import { INITIAL_MUMBAI_COURIERS } from "../src/lib/services/fleetRadarData";
import {
  generateSyntheticDataset,
  evaluateSyntheticBatch,
  exportRecordsToCsv,
} from "../src/lib/services/syntheticDatasetGenerator";

describe("Fleet Radar & Courier Uniqueness", () => {
  it("should contain zero duplicate courier IDs in INITIAL_MUMBAI_COURIERS", () => {
    const ids = INITIAL_MUMBAI_COURIERS.map((c) => c.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
    expect(ids.filter((id) => id === "r_0042").length).toBe(1);
    expect(ids.filter((id) => id === "r_0053").length).toBe(1);
  });
});

describe("Synthetic Dataset Generator & Scale Simulator", () => {
  it("should generate and evaluate 1,000 synthetic records with high throughput and valid metrics", () => {
    const { records, baselinePool } = generateSyntheticDataset(1000, {
      fraudRatePercent: 8,
      newDevicePercent: 4,
    });

    expect(records.length).toBe(1000);
    expect(baselinePool.size).toBeGreaterThan(50);

    const benchmark = evaluateSyntheticBatch(records, baselinePool);

    expect(benchmark.totalRecords).toBe(1000);
    expect(benchmark.durationMs).toBeGreaterThan(0);
    expect(benchmark.throughputPerSec).toBeGreaterThan(1000);
    expect(benchmark.metrics.precision).toBeGreaterThanOrEqual(80);
    expect(benchmark.metrics.recall).toBeGreaterThanOrEqual(80);
    expect(benchmark.sampleRecords.length).toBe(100);
  });

  it("should format records into valid CSV export", () => {
    const { records } = generateSyntheticDataset(20);
    const csv = exportRecordsToCsv(records);

    expect(csv).toContain("eventId,sessionId,riderId");
    expect(csv.split("\n").length).toBe(21);
  });

  it("should export system evaluation metrics to structured CSV", async () => {
    const { runSystemEvaluation, exportEvaluationToCsv } = await import(
      "../src/lib/services/evaluation"
    );
    const evalResult = runSystemEvaluation();
    const csv = exportEvaluationToCsv(evalResult);

    expect(csv).toContain("=== TrueRide System Evaluation Benchmark Summary ===");
    expect(csv).toContain('"Precision (%)"');
    expect(csv).toContain('"Total Evaluated"');
    expect(csv).toContain("=== Detailed Test Item Results ===");
  });

  it("should verify physical CSV files exist on disk for instantaneous smooth downloads", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const dataCsv100k = path.join(process.cwd(), "data", "trueride_synthetic_100k.csv");
    const dataCsvEval = path.join(process.cwd(), "data", "trueride_evaluation_dataset.csv");

    expect(fs.existsSync(dataCsv100k)).toBe(true);
    expect(fs.existsSync(dataCsvEval)).toBe(true);

    const stats100k = fs.statSync(dataCsv100k);
    expect(stats100k.size).toBeGreaterThan(10 * 1024 * 1024); // > 10MB (approx 18.5MB)
  });
});
