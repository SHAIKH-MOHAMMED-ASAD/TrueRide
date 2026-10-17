import { describe, it, expect } from "vitest";
import { runSystemEvaluation } from "../src/lib/services/evaluation";

describe("TrueRide Model Evaluation Benchmark", () => {
  it("computes honest metrics over held-out labelled test set with p95 latency under 200ms", () => {
    const results = runSystemEvaluation();

    expect(results.totalEvaluated).toBeGreaterThanOrEqual(15);
    expect(results.truePositives).toBeGreaterThan(0);
    expect(results.trueNegatives).toBeGreaterThan(0);

    // High recall on handoff detection
    expect(results.recall).toBeGreaterThanOrEqual(80);

    // Low false positive rate on normal/legitimate routine sessions
    expect(results.falsePositiveRate).toBeLessThanOrEqual(25);

    // Strict local scoring latency target (p95 below 200ms)
    expect(results.p95LatencyMs).toBeLessThan(50); // Engine executes in < 5ms!
  });
});
