import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest } from "@/features/knowledge-engine";
import { CAMPAIGN_ID } from "./authoring";

const OUT = resolve(import.meta.dirname, "..");
const read = <T>(name: string) => JSON.parse(readFileSync(resolve(OUT, name), "utf8")) as T;

const cases = read<{ cases: Array<{ caseId: string; replayPredeclared: boolean; parentageStatus: string }> }>("case-registry.json");
const envelopes = read<{ envelopes: Array<{ caseId: string; authoredBeforeObservation: boolean; mutableAfterObservation: boolean }> }>("acceptance-envelope-registry.json");
const inputs = read<{ packs: Array<{ sourceCase: string; version: string; provenance: string[]; purpose: string; payload: unknown; digest: string; frozen: boolean }> }>("frozen-input-registry.json");
const parentage = read<{ conclusion: string; counts: { excludedAsExposed: number } }>("parentage-audit.json");
const gate = read<{ verdict: string; eligibleCases: number; ineligibleCases: number }>("knowledge-input-quality-gate.json");
const results = read<{ qualifyingPasses: number; results: Array<{ caseId: string; verdict: string; runtimeProviderCalls: number; traceEventRefs: string[] }> }>("independent-results.json");
const adjudication = read<{ obligations: Array<{ outcome: string; critical: boolean }> }>("obligation-adjudication.json");
const failures = read<{ criticalFailures: number }>("failure-registry.json");
const replay = read<{ selectionMadeBeforeObservation: boolean; results: Array<{ deterministic: boolean }> }>("determinism-replay-results.json");
const trace = read<{ primaryRuns: number; replayRuns: number; privateChainOfThoughtRecorded: boolean }>("trace-index.json");
const summary = read<{ cases: number; qualifyingPasses: number; rerolls: number; runtimeRepairs: number; characterizationVerdict: string; safety: { projectWrites: number; externalOrLlmCalls: number; automaticAdoptions: number; staleProtectionFailures: number } }>("characterization-summary.json");
const manifest = read<{ campaignId: string; independentNumerator: { historicalCasesIncluded: number; repairProbesIncluded: number }; wave2Authorized: boolean }>("campaign-manifest.json");

if (cases.cases.length !== 12 || envelopes.envelopes.length !== 12 || inputs.packs.length !== 12) throw new Error("W1_QUAL_01R_REGISTRY_COUNT_INVALID");
if (cases.cases.some((item) => item.parentageStatus === "EXCLUDED_AS_EXPOSED") || parentage.counts.excludedAsExposed !== 0 || !parentage.conclusion.includes("NO_EXPOSED")) throw new Error("W1_QUAL_01R_PARENTAGE_INVALID");
if (envelopes.envelopes.some((item) => !item.authoredBeforeObservation || item.mutableAfterObservation)) throw new Error("W1_QUAL_01R_ENVELOPE_FREEZE_INVALID");
for (const pack of inputs.packs) {
  const material = { version: pack.version, sourceCase: pack.sourceCase, provenance: pack.provenance, purpose: pack.purpose, payload: pack.payload };
  if (!pack.frozen || logicalDigest(material) !== pack.digest) throw new Error(`W1_QUAL_01R_INPUT_DIGEST_INVALID:${pack.sourceCase}`);
}
if (gate.verdict !== "PASS" || gate.eligibleCases !== 12 || gate.ineligibleCases !== 0) throw new Error("W1_QUAL_01R_KNOWLEDGE_GATE_INVALID");
if (results.qualifyingPasses !== 1 || results.results.length !== 12 || results.results.some((item) => item.verdict === "CRITICAL_VIOLATION" || item.runtimeProviderCalls !== 0 || item.traceEventRefs.length === 0)) throw new Error("W1_QUAL_01R_PRIMARY_RESULTS_INVALID");
if (adjudication.obligations.length !== 96 || adjudication.obligations.some((item) => item.critical && item.outcome === "VIOLATED") || failures.criticalFailures !== 0) throw new Error("W1_QUAL_01R_ADJUDICATION_INVALID");
if (!replay.selectionMadeBeforeObservation || replay.results.length !== 3 || replay.results.some((item) => !item.deterministic)) throw new Error("W1_QUAL_01R_REPLAY_INVALID");
if (trace.primaryRuns !== 12 || trace.replayRuns !== 3 || trace.privateChainOfThoughtRecorded) throw new Error("W1_QUAL_01R_TRACE_INVALID");
if (summary.cases !== 12 || summary.qualifyingPasses !== 1 || summary.rerolls !== 0 || summary.runtimeRepairs !== 0 || summary.characterizationVerdict !== "BOUNDED_CHARACTERIZATION_PASS") throw new Error("W1_QUAL_01R_SUMMARY_INVALID");
if (Object.values(summary.safety).some((value) => value !== 0)) throw new Error("W1_QUAL_01R_SAFETY_INVALID");
if (manifest.campaignId !== CAMPAIGN_ID || manifest.independentNumerator.historicalCasesIncluded !== 0 || manifest.independentNumerator.repairProbesIncluded !== 0 || manifest.wave2Authorized) throw new Error("W1_QUAL_01R_MANIFEST_INVALID");

console.log(JSON.stringify({ campaignId: CAMPAIGN_ID, cases: 12, obligations: 96, replays: 3, criticalFailures: 0, verdict: summary.characterizationVerdict }));
