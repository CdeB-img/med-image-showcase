import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../../../../");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");
const readJson = (relativePath: string) => JSON.parse(read(relativePath));
const sha256 = (relativePath: string) => `sha256-${createHash("sha256").update(read(relativePath)).digest("hex")}`;

describe("H1T current contract and immutable-evidence readback", () => {
  it("reads question plus purpose from the current Project to ST product builder", () => {
    const source = read("src/features/research-project-construction/scientific-reasoning-owner-chain.ts");
    expect(source).toContain("const originalExpression = `${validatedReformulation} ${purpose}`;");
    expect(source).toContain("originalExpression,");
    expect(source).toContain("validatedReformulation,");
  });

  it("reads RESULT_PERSISTED from the current TRACE taxonomy and persistence append", () => {
    const source = read("src/features/protocol-designer/scientific-execution-trace.ts");
    expect(source).toContain('| "RESULT_PERSISTED"');
    expect(source).toContain('eventType: "RESULT_PERSISTED"');
    expect(source).not.toContain('eventType: "OWNER_RESULT_PERSISTED"');
  });

  it("reads the exact conflictId, state and explanation projection at Knowledge to ST handoff", () => {
    const source = read("src/features/scientific-thinking/input.ts");
    expect(source).toContain("`${item.conflictId}:${item.state}:${item.explanation}`");
    expect(source).toContain("item.conflictId");
  });

  it("preserves the historical checker and Campaign D freeze identities", () => {
    const freeze = readJson("validation/w1-qual-01h1-st/campaign-freeze.json");
    expect(freeze.freezeDigest).toBe("ke1-f8f6b4620ab40c36");
    expect(freeze.deterministicChecker).toEqual({
      version: "1.0.0",
      digest: "sha256-ad9b7790428f40e45230ed1d1774bfa02a623f5a82e9d3f14df8249c0a269a5c",
    });
    expect(sha256("validation/w1-qual-01h1-st/tools/deterministic-checker.ts")).toBe(freeze.deterministicChecker.digest);
  });

  it("preserves ST 1.2.1 runtime hashes without invoking ST", () => {
    const freeze = readJson("validation/w1-qual-01h1-st/campaign-freeze.json");
    expect(freeze.stVersion).toBe("1.2.1");
    for (const item of Object.values(freeze.stRuntime) as Array<{ path: string; sha256: string }>) {
      expect(sha256(item.path)).toBe(item.sha256);
    }
  });

  it("keeps all 12 H1 to H8 adjudications pending", () => {
    const adjudication = readJson("validation/w1-qual-01h1-st/human-adjudication-template.json");
    expect(adjudication.scientificAdjudicationCompleted).toBe(false);
    expect(adjudication.cases).toHaveLength(12);
    for (const item of adjudication.cases) {
      for (const key of ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8"]) {
        expect(item[key]).toBe("PENDING");
      }
    }
  });

  it("retains the historical 228/178/25/25 checker record", () => {
    const checks = readJson("validation/w1-qual-01h1-st/deterministic-checks.json");
    expect(checks.counts).toEqual({ checks: 228, pass: 178, fail: 25, notApplicable: 25 });
  });
});
