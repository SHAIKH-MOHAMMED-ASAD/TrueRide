import fs from "fs";
import path from "path";
import { SyntheticBenchmarkSummary } from "./syntheticDatasetGenerator";

export interface StoredScaleRun {
  count: number;
  timestamp: string;
  persistedCasesCount: number;
  persistedSessionsCount: number;
  benchmark: SyntheticBenchmarkSummary;
}

export interface ScaleBenchmarkStoreState {
  cumulativeCount: number;
  lastRun: StoredScaleRun | null;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "scale_benchmark_record.json");

// In-memory fallback cache
let memoryStore: ScaleBenchmarkStoreState = {
  cumulativeCount: 0,
  lastRun: null,
};

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn("Could not create data directory, using memory store:", e);
  }
}

export function getScaleBenchmarkState(): ScaleBenchmarkStoreState {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      memoryStore = parsed;
      return parsed;
    }
  } catch (e) {
    console.warn("Failed to read scale benchmark file, using in-memory store:", e);
  }
  return memoryStore;
}

export function recordScaleBenchmarkRun(
  count: number,
  benchmark: SyntheticBenchmarkSummary,
  persistedCasesCount: number,
  persistedSessionsCount: number
): ScaleBenchmarkStoreState {
  const current = getScaleBenchmarkState();
  const updated: ScaleBenchmarkStoreState = {
    cumulativeCount: (current.cumulativeCount || 0) + count,
    lastRun: {
      count,
      timestamp: new Date().toISOString(),
      persistedCasesCount,
      persistedSessionsCount,
      benchmark,
    },
  };

  memoryStore = updated;

  try {
    ensureDataDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to persist scale benchmark run to file:", e);
  }

  return updated;
}

export function resetScaleBenchmarkStore(): void {
  memoryStore = {
    cumulativeCount: 0,
    lastRun: null,
  };
  try {
    if (fs.existsSync(STORE_FILE)) {
      fs.unlinkSync(STORE_FILE);
    }
  } catch (e) {
    console.warn("Failed to remove scale benchmark file:", e);
  }
}
