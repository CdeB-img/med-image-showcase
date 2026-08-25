import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(import.meta.dirname, "..");
const read = <T>(name: string) => JSON.parse(readFileSync(resolve(OUT, name), "utf8")) as T;

describe("W1-QUAL-01R independent Scientific Thinking evidence", () => {
  it("keeps all independent cases pre-authored, frozen and outside exposed numerator", () => {
    const cases = read<{ cases: Array<{ caseId: string; authoredBeforeObservation: boolean }> }>("case-registry.json");
    const parentage = read<{ counts: { excludedAsExposed: number }; conclusion: string }>("parentage-audit.json");
    const inputs = read<{ packs: Array<{ frozen: boolean }> }>("frozen-input-registry.json");
    expect(cases.cases).toHaveLength(12);
    expect(cases.cases.every((item) => item.authoredBeforeObservation)).toBe(true);
    expect(inputs.packs.every((item) => item.frozen)).toBe(true);
    expect(parentage.counts.excludedAsExposed).toBe(0);
    expect(parentage.conclusion).toContain("NO_EXPOSED");
  });

  it("records one qualifying pass with no critical violation, write or provider call", () => {
    const summary = read<{ qualifyingPasses: number; rerolls: number; runtimeRepairs: number; caseVerdicts: { criticalViolation: number }; safety: Record<string, number>; characterizationVerdict: string }>("characterization-summary.json");
    expect(summary.qualifyingPasses).toBe(1);
    expect(summary.rerolls).toBe(0);
    expect(summary.runtimeRepairs).toBe(0);
    expect(summary.caseVerdicts.criticalViolation).toBe(0);
    expect(Object.values(summary.safety).every((value) => value === 0)).toBe(true);
    expect(summary.characterizationVerdict).toBe("BOUNDED_CHARACTERIZATION_PASS");
  });

  it("retains passive traces and deterministic predeclared replays", () => {
    const trace = read<{ primaryRuns: number; replayRuns: number; privateChainOfThoughtRecorded: boolean }>("trace-index.json");
    const replay = read<{ selectionMadeBeforeObservation: boolean; results: Array<{ deterministic: boolean }> }>("determinism-replay-results.json");
    expect(trace.primaryRuns).toBe(12);
    expect(trace.replayRuns).toBe(3);
    expect(trace.privateChainOfThoughtRecorded).toBe(false);
    expect(replay.selectionMadeBeforeObservation).toBe(true);
    expect(replay.results).toHaveLength(3);
    expect(replay.results.every((item) => item.deterministic)).toBe(true);
  });
});
