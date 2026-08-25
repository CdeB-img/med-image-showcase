/* eslint-disable @typescript-eslint/no-explicit-any -- machine-evidence validator reads multiple frozen JSON contract shapes */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest } from "@/features/knowledge-engine";

const ROOT = resolve(import.meta.dirname, "../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01");
const read = <T>(name: string) => JSON.parse(readFileSync(resolve(OUT, name), "utf8")) as T;
const required = ["characterization-freeze.json", "case-registry.json", "acceptance-envelope-registry.json", "frozen-input-registry.json", "knowledge-results.json", "scientific-thinking-results.json", "imaging-results.json", "reg-results.json", "val-results.json", "failure-registry.json", "owner-characterization-summary.json", "trace-index.json", "campaign-manifest.json"];
for (const name of required) read(name);

const freeze = read<any>("characterization-freeze.json");
const { freezeDigest, contract: _freezeContract, version: _freezeVersion, immutableForCampaign: _immutable, ...freezeMaterial } = freeze;
if (logicalDigest(freezeMaterial) !== freezeDigest) throw new Error("W1_QUAL_FREEZE_DIGEST_INVALID");

const inputs = read<any>("frozen-input-registry.json");
for (const pack of inputs.packs) {
  const material = { version: pack.version, sourceCase: pack.sourceCase, ownerUnderTest: pack.ownerUnderTest, provenance: pack.provenance, purpose: pack.purpose, payload: pack.payload };
  if (logicalDigest(material) !== pack.digest || pack.frozen !== true) throw new Error(`W1_QUAL_INPUT_DIGEST_INVALID:${pack.sourceCase}`);
}

const cases = read<any>("case-registry.json");
const envelopes = read<any>("acceptance-envelope-registry.json");
const trace = read<any>("trace-index.json");
const manifest = read<any>("campaign-manifest.json");
const { manifestDigest, contract: _manifestContract, version: _manifestVersion, machineEvidenceNotScientificAuthority: _nature, ...manifestMaterial } = manifest;
if (logicalDigest(manifestMaterial) !== manifestDigest) throw new Error("W1_QUAL_MANIFEST_DIGEST_INVALID");
if (cases.cases.length !== 35 || envelopes.envelopes.length !== 35 || inputs.packs.length !== 35) throw new Error("W1_QUAL_REGISTRY_COUNT_INVALID");
if (trace.traces.length !== manifest.counts.primaryTraceRuns + manifest.counts.replayTraceRuns) throw new Error("W1_QUAL_TRACE_COUNT_INVALID");
if (trace.traces.some((item: any) => !item.events.length || !item.events.every((event: any) => event.privateReasoningStored === false && event.projectWriteAuthorized === false && event.repairAuthorized === false))) throw new Error("W1_QUAL_TRACE_BOUNDARY_INVALID");
if (manifest.method.llmCalls !== 0 || manifest.method.externalProviderCalls !== 0 || manifest.method.ownerRuntimeRepairPerformed !== false) throw new Error("W1_QUAL_CAMPAIGN_BOUNDARY_INVALID");
console.log(JSON.stringify({ valid: true, cases: cases.cases.length, envelopes: envelopes.envelopes.length, inputs: inputs.packs.length, traces: trace.traces.length, manifestDigest }));
