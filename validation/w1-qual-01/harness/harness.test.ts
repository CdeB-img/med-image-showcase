/* eslint-disable @typescript-eslint/no-explicit-any -- tests validate persisted heterogeneous machine-evidence shapes */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest } from "@/features/knowledge-engine";

const OUT = resolve(import.meta.dirname, "..");
const read = <T>(name: string) => JSON.parse(readFileSync(resolve(OUT, name), "utf8")) as T;

describe("W1-QUAL-01 characterization harness", () => {
  it("freezes all cases, envelopes and typed input packs before observation", () => {
    const cases = read<any>("case-registry.json");
    const envelopes = read<any>("acceptance-envelope-registry.json");
    const inputs = read<any>("frozen-input-registry.json");
    expect(cases.cases).toHaveLength(35);
    expect(envelopes.envelopes).toHaveLength(35);
    expect(inputs.packs).toHaveLength(35);
    expect(cases.cases.every((item: any) => item.reviewStatus === "AUTHORED_PRE_OBSERVATION" && item.exposureStatus === "UNEXPOSED")).toBe(true);
    expect(envelopes.envelopes.every((item: any) => item.authoredBeforeObservation === true)).toBe(true);
    expect(inputs.packs.every((pack: any) => logicalDigest({ version: pack.version, sourceCase: pack.sourceCase, ownerUnderTest: pack.ownerUnderTest, provenance: pack.provenance, purpose: pack.purpose, payload: pack.payload }) === pack.digest)).toBe(true);
  });

  it("binds every primary case and predeclared replay to passive TRACE", () => {
    const cases = read<any>("case-registry.json");
    const trace = read<any>("trace-index.json");
    expect(trace.traces.filter((item: any) => item.executionKind === "PRIMARY")).toHaveLength(cases.cases.length);
    expect(trace.traces.filter((item: any) => item.executionKind === "PREDECLARED_REPLAY")).toHaveLength(cases.cases.filter((item: any) => item.replayPredeclared).length);
    expect(trace.traces.every((item: any) => item.events.length > 0 && item.events.every((event: any) => event.privateReasoningStored === false && event.repairAuthorized === false))).toBe(true);
  });

  it("preserves characterization boundaries in the manifest", () => {
    const manifest = read<any>("campaign-manifest.json");
    expect(manifest.method).toMatchObject({ authoringBeforeObservation: true, acceptanceEnvelopesFrozen: true, frozenTypedInputs: true, upstreamOwnersRecomputedDuringIsolatedCases: false, exactGoldJsonUsed: false, ownerRuntimeRepairPerformed: false, llmCalls: 0, externalProviderCalls: 0 });
    expect(manifest.decisions).toMatchObject({ W1_CONTROLLED_LOOP_CHARACTERIZATION_READY: "NO", WAVE_1_COMPLETE: "NO", WAVE_2_AUTHORIZED: "NO" });
  });
});
