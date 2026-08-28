import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../../../../");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");
const readJson = (relativePath: string) => JSON.parse(read(relativePath));
const sha256 = (relativePath: string) => `sha256-${createHash("sha256").update(read(relativePath)).digest("hex")}`;

const HISTORICAL_CAMPAIGN_D_ST_IDENTITY = {
  gitHead: "1a77e5d5001b2108f43a52a82bebecff350c4296",
  stVersion: "1.2.1",
  stRuntime: {
    engine: {
      path: "src/features/scientific-thinking/engine.ts",
      sha256: "sha256-e87aa94e3e7f0542991f2d3bc748a9ba41f33fb0ff32511ea25f820feb9564dc",
    },
    types: {
      path: "src/features/scientific-thinking/types.ts",
      sha256: "sha256-79f7ac776d92d4be9586385a94113d9d02a6dd500d1f8194eb523f6eaf9a00f6",
    },
    productRuntime: {
      path: "src/features/protocol-designer/product-scientific-thinking-owner-runtime.ts",
      sha256: "sha256-bef0aa5ede4daafa9eae9b5cab158e7c36bfa899bfd4d460a4ac7773f5fa0fe7",
    },
  },
} as const;

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

  it("preserves the historical Campaign D ST 1.2.1 identity independently from the current runtime", () => {
    const freeze = readJson("validation/w1-qual-01h1-st/campaign-freeze.json");
    const immutableEvidence = readJson("validation/w1-qual-01h1t/campaign-d-immutable-evidence-digests.json");
    const freezeEvidence = immutableEvidence.files.find((item: { path: string }) => item.path === "validation/w1-qual-01h1-st/campaign-freeze.json");

    expect({
      gitHead: freeze.gitHead,
      stVersion: freeze.stVersion,
      stRuntime: freeze.stRuntime,
    }).toEqual(HISTORICAL_CAMPAIGN_D_ST_IDENTITY);
    expect(freezeEvidence).toEqual({
      path: "validation/w1-qual-01h1-st/campaign-freeze.json",
      sha256: "sha256-8f63f6d2cd9ec0bccc90a165d8319c6e2ed6020e318076c87fb2e57b8d2d9cc1",
    });
    expect(sha256(freezeEvidence.path)).toBe(freezeEvidence.sha256);
    expect(immutableEvidence).toMatchObject({
      campaignId: "W1-QUAL-01H-ST-2026-08-26-D",
      freezeDigest: "ke1-f8f6b4620ab40c36",
      stVersion: HISTORICAL_CAMPAIGN_D_ST_IDENTITY.stVersion,
      historicalEvidenceModified: false,
      stRuntimeModified: false,
    });
    expect(immutableEvidence.stRuntimeDigestChecks).toEqual(
      Object.values(HISTORICAL_CAMPAIGN_D_ST_IDENTITY.stRuntime).map((item) => ({
        path: item.path,
        expected: item.sha256,
        observed: item.sha256,
      })),
    );
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
