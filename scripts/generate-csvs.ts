import fs from "fs";
import path from "path";
import {
  generateSyntheticDataset,
  evaluateSyntheticBatch,
  exportRecordsToCsv,
} from "../src/lib/services/syntheticDatasetGenerator";
import { runSystemEvaluation, exportEvaluationToCsv } from "../src/lib/services/evaluation";

async function main() {
  console.log("Generating TrueRide physical CSV files on disk...");

  const dataDir = path.join(process.cwd(), "data");
  const publicDataDir = path.join(process.cwd(), "public", "data");

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });

  // 1. Generate Evaluation Dataset CSV
  console.log("1. Generating System Evaluation Benchmark CSV...");
  const evalResult = runSystemEvaluation();
  const evalCsv = exportEvaluationToCsv(evalResult);
  fs.writeFileSync(path.join(dataDir, "trueride_evaluation_dataset.csv"), evalCsv, "utf8");
  fs.writeFileSync(path.join(publicDataDir, "trueride_evaluation_dataset.csv"), evalCsv, "utf8");
  console.log("   ✓ Saved data/trueride_evaluation_dataset.csv & public/data/trueride_evaluation_dataset.csv");

  // 2. Generate 100,000 Synthetic Courier Sessions CSV
  console.log("2. Generating 100,000 Synthetic Courier Sessions...");
  const startTime = Date.now();
  const { records, baselinePool } = generateSyntheticDataset(100000, {
    fraudRatePercent: 7,
    newDevicePercent: 4,
    zoneShiftPercent: 3,
  });

  console.log(`   ✓ 100,000 records generated in ${Date.now() - startTime}ms. Evaluating risk scores...`);
  const benchmark = evaluateSyntheticBatch(records, baselinePool);
  console.log(`   ✓ Evaluated in ${benchmark.durationMs.toFixed(1)}ms (${Math.round(benchmark.throughputPerSec)} rec/sec).`);

  console.log("   Formatting 100,000 records to CSV stream...");
  const csvHeaders = [
    "eventId",
    "sessionId",
    "riderId",
    "timestamp",
    "city",
    "operatingZone",
    "deviceId",
    "deviceModel",
    "avgIntervalSec",
    "interactionPattern",
    "acceptanceRate",
    "completionRate",
    "groundTruthLabel",
    "riskScore",
    "riskLevel",
    "recommendedAction",
    "classification",
  ].join(",") + "\n";

  const dataFilePath = path.join(dataDir, "trueride_synthetic_100k.csv");
  const publicFilePath = path.join(publicDataDir, "trueride_synthetic_100k.csv");

  const writeStreamData = fs.createWriteStream(dataFilePath, { flags: "w" });
  const writeStreamPublic = fs.createWriteStream(publicFilePath, { flags: "w" });

  writeStreamData.write(csvHeaders);
  writeStreamPublic.write(csvHeaders);

  const batchSize = 5000;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const chunk = batch
      .map((r) =>
        [
          r.eventId,
          r.sessionId,
          r.riderId,
          r.timestamp,
          `"${r.city}"`,
          `"${r.operatingZone}"`,
          r.deviceId,
          `"${r.deviceModel}"`,
          r.avgIntervalSec,
          r.interactionPattern,
          r.acceptanceRate,
          r.completionRate,
          r.groundTruthLabel,
          r.riskScore ?? "",
          r.riskLevel ?? "",
          r.recommendedAction ?? "",
          r.classification ?? "",
        ].join(",")
      )
      .join("\n") + "\n";

    writeStreamData.write(chunk);
    writeStreamPublic.write(chunk);
  }

  writeStreamData.end();
  writeStreamPublic.end();

  await new Promise((resolve) => writeStreamData.on("finish", () => resolve(true)));
  await new Promise((resolve) => writeStreamPublic.on("finish", () => resolve(true)));

  const stats = fs.statSync(dataFilePath);
  console.log(`   ✓ Saved data/trueride_synthetic_100k.csv (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`   ✓ Saved public/data/trueride_synthetic_100k.csv for zero-lag browser downloads`);

  console.log("\nAll CSV files successfully generated!");
}

main().catch((err) => {
  console.error("Error generating CSVs:", err);
  process.exit(1);
});
