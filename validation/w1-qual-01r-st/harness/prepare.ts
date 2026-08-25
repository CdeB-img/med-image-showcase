/* eslint-disable @typescript-eslint/no-explicit-any -- bounded pre-execution gate inspects frozen heterogeneous owner payloads */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest } from "@/features/knowledge-engine";
import {
  AUTHORED_AT,
  buildAuthoredCampaign,
  CAMPAIGN_ID,
  EXPOSED_MATERIAL,
  HARNESS_VERSION,
  INITIAL_HEAD,
} from "./authoring";

const ROOT = resolve(import.meta.dirname, "../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01r-st");
const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const write = (name: string, value: unknown) => writeFileSync(resolve(OUT, name), stable(value), "utf8");
const sha256File = (path: string) => createHash("sha256").update(readFileSync(resolve(ROOT, path))).digest("hex");

mkdirSync(OUT, { recursive: true });
const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
const branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim();
if (head !== INITIAL_HEAD || branch !== "protocol-designer-canonical-ingestion") throw new Error("W1_QUAL_01R_FREEZE_BASELINE_MISMATCH");

const authored = buildAuthoredCampaign();
if (authored.cases.length !== 12 || authored.envelopes.length !== 12 || authored.inputs.length !== 12) throw new Error("W1_QUAL_01R_CASE_COUNT_INVALID");
if (new Set(authored.cases.map((item) => item.caseId)).size !== authored.cases.length) throw new Error("W1_QUAL_01R_DUPLICATE_CASE_ID");
if (authored.cases.some((item) => EXPOSED_MATERIAL.historicalW1QualCases.includes(item.caseId))) throw new Error("W1_QUAL_01R_EXPOSED_CASE_IN_NUMERATOR");
const replayRoles = authored.cases.filter((item) => item.replayPredeclared).map((item) => item.replayRole).sort();
if (JSON.stringify(replayRoles) !== JSON.stringify(["CONTRADICTION", "NO_CANDIDATE", "POSITIVE"])) throw new Error("W1_QUAL_01R_REPLAY_PRESELECTION_INVALID");

const caseRegistry = { contract: "W1_QUAL_01R_ST_CASE_REGISTRY", version: "1.0.0", campaignId: CAMPAIGN_ID, authoredAt: AUTHORED_AT, authoredBeforeObservation: true, cases: authored.cases };
const envelopeRegistry = { contract: "W1_QUAL_01R_ST_ACCEPTANCE_ENVELOPE_REGISTRY", version: "1.0.0", campaignId: CAMPAIGN_ID, authoredAt: AUTHORED_AT, mutableAfterObservation: false, envelopes: authored.envelopes };
const inputRegistry = { contract: "W1_QUAL_01R_ST_FROZEN_INPUT_REGISTRY", version: "1.0.0", campaignId: CAMPAIGN_ID, authoredAt: AUTHORED_AT, knowledgeRecomputationCalls: 0, llmCalls: 0, packs: authored.inputs };

const parentageAudit = {
  contract: "W1_QUAL_01R_ST_PARENTAGE_AUDIT", version: "1.0.0", campaignId: CAMPAIGN_ID, completedBeforeExecution: true,
  excludedFromNumerator: EXPOSED_MATERIAL,
  cases: authored.cases.map((item) => ({ caseId: item.caseId, status: item.parentageStatus, nearestExposedMaterial: item.nearestExposedMaterial, distinctnessRationale: item.distinctnessRationale, numeratorEligible: item.parentageStatus !== "EXCLUDED_AS_EXPOSED" })),
  counts: {
    novel: authored.cases.filter((item) => item.parentageStatus === "NOVEL").length,
    relatedButDistinct: authored.cases.filter((item) => item.parentageStatus === "RELATED_BUT_DISTINCT").length,
    excludedAsExposed: authored.cases.filter((item) => item.parentageStatus === "EXCLUDED_AS_EXPOSED").length,
  },
  conclusion: "NO_EXPOSED_CASE_OR_REPAIR_PROBE_IS_USED_IN_THE_INDEPENDENT_NUMERATOR",
};

const qualityChecks = authored.inputs.map((pack) => {
  const payload = pack.payload as Record<string, any>;
  const ledger = payload.ledger;
  const entry = ledger.entries.find((candidate: any) => candidate.result?.resultId === payload.knowledgeResultId);
  const result = entry?.result;
  const native = result?.nativePayload;
  const snapshot = payload.projectSnapshot;
  const staleExpected = pack.sourceCase === "ST01R-STALE-KNOWLEDGE-01";
  const exactBinding = Boolean(result
    && result.sourceProjectRef === native?.request?.researchProjectId
    && result.sourceProjectVersion === native?.request?.strategyVersion
    && typeof result.sourceProjectDigest === "string"
    && typeof result.sourceSnapshotDigest === "string");
  const currentBinding = Boolean(result
    && result.sourceProjectRef === snapshot.sourceProjectRef
    && result.sourceProjectVersion === snapshot.sourceProjectVersion
    && result.sourceProjectDigest === snapshot.sourceProjectDigest
    && result.sourceSnapshotDigest === snapshot.snapshotDigest);
  const positive = authored.cases.find((item) => item.caseId === pack.sourceCase)?.positiveOpportunity ?? false;
  const checks = {
    ownerResultPresent: Boolean(result),
    nativeKnowledgeResultPresent: Boolean(native),
    typedAndVersioned: result?.nativePayloadType === "KnowledgeResult" && result?.nativePayloadVersion === "1.2.0",
    resultDigestPresent: typeof native?.resultDigest === "string" && native.resultDigest.length > 0,
    exactOriginalProjectBinding: exactBinding,
    currentProjectBindingOrIntentionalStale: currentBinding || staleExpected,
    evidenceAvailableWhenPositive: !positive || ((native?.sources?.length ?? 0) > 0 && (native?.evidence?.length ?? 0) > 0 && (native?.applicableAssertions?.length ?? 0) > 0),
    limitationExplicit: (native?.limitations?.length ?? 0) > 0,
    provenanceExplicit: (native?.provenance?.length ?? 0) > 0,
    noExternalCall: native?.trace?.privacy?.externalCallMade === false,
    immutableLedger: ledger?.appendOnly === true && ledger?.projectWriteAuthorized === false,
  };
  return { caseId: pack.sourceCase, staleExpected, checks, eligible: Object.values(checks).every(Boolean), missingComponents: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name) };
});
if (qualityChecks.some((item) => !item.eligible)) throw new Error(`W1_QUAL_01R_KNOWLEDGE_INPUT_QUALITY_GATE_FAILED:${JSON.stringify(qualityChecks.filter((item) => !item.eligible).map((item) => ({ caseId: item.caseId, missing: item.missingComponents })))}`);
const knowledgeGate = { contract: "W1_QUAL_01R_ST_KNOWLEDGE_INPUT_QUALITY_GATE", version: "1.0.0", campaignId: CAMPAIGN_ID, evaluatedBeforeExecution: true, frozenKnowledgeRecomputed: false, cases: qualityChecks, eligibleCases: qualityChecks.length, ineligibleCases: 0, verdict: "PASS" };

write("case-registry.json", caseRegistry);
write("acceptance-envelope-registry.json", envelopeRegistry);
write("parentage-audit.json", parentageAudit);
write("frozen-input-registry.json", inputRegistry);
write("knowledge-input-quality-gate.json", knowledgeGate);

const codePaths = [
  "validation/w1-qual-01r-st/harness/authoring.ts",
  "validation/w1-qual-01r-st/harness/prepare.ts",
  "validation/w1-qual-01r-st/harness/execute.ts",
  "validation/w1-qual-01r-st/harness/validate.ts",
  "validation/w1-qual-01r-st/harness/harness.test.ts",
  "src/features/scientific-thinking/engine.ts",
  "src/features/scientific-thinking/types.ts",
  "src/features/protocol-designer/product-scientific-thinking-owner-runtime.ts",
  "src/features/protocol-designer/product-owner-result-ledger.ts",
  "src/features/protocol-designer/scientific-execution-trace.ts",
  "src/features/research-project-construction/scientific-reasoning-owner-chain.ts",
];
const frozenMaterial = {
  campaignId: CAMPAIGN_ID, harnessVersion: HARNESS_VERSION, frozenAt: AUTHORED_AT, branch, gitHead: head,
  ownerUnderTest: { owner: "SCIENTIFIC_THINKING", engine: "ScientificThinkingEngine", engineVersion: "1.2.1", invocation: "PRODUCT_NATIVE_OWNER_RUNTIME" },
  schemas: { canonicalProject: "PRJ001_CANONICAL_RESEARCH_PROJECT_STATE@0.2.0", projectContextSnapshot: "PROJECT_CONTEXT_SNAPSHOT@0.3.0", ownerResult: "PROJECT_SPINE_02_SPECIALIZED_OWNER_HANDOFF@0.1.0", ownerLedger: "PRODUCT_OWNER_RESULT_LEDGER@0.3.0", trace: "SCIENTIFIC_EXECUTION_TRACE_LEDGER@0.1.0" },
  deterministicConfiguration: { externalProviderCalls: 0, llmCalls: 0, knowledgeRecomputationCalls: 0, qualifyingPasses: 1, replayCases: authored.cases.filter((item) => item.replayPredeclared).map((item) => ({ caseId: item.caseId, role: item.replayRole })) },
  corpusRefs: [...new Set(authored.cases.flatMap((item) => item.referenceRefs))],
  preRegisteredFailureTaxonomy: [
    "PROJECT_FIDELITY_FAILURE",
    "KNOWLEDGE_LINEAGE_FAILURE",
    "PROJECT_WRITE_OR_PROMOTION",
    "EXTERNAL_OR_LLM_CALL",
    "TRACE_BINDING_FAILURE",
    "CANDIDATE_OR_REFUSAL_FAILURE",
    "EPISTEMIC_PROMOTION",
    "INCOMPLETENESS_SUPPRESSION",
  ],
  registries: { caseRegistryDigest: logicalDigest(caseRegistry), envelopeRegistryDigest: logicalDigest(envelopeRegistry), parentageAuditDigest: logicalDigest(parentageAudit), inputRegistryDigest: logicalDigest(inputRegistry), knowledgeQualityGateDigest: logicalDigest(knowledgeGate), cases: authored.cases.length, envelopes: authored.envelopes.length, packs: authored.inputs.length },
  codeDigests: Object.fromEntries(codePaths.map((path) => [path, sha256File(path)])),
  antiSem: { acceptanceEnvelopesFrozen: true, inputsFrozen: true, casesFrozen: true, parentageFrozen: true, ownerRuntimeRepairAuthorized: false, postObservationCaseEditsAuthorized: false, rerollAuthorized: false },
};
const freeze = { contract: "W1_QUAL_01R_ST_CHARACTERIZATION_FREEZE", version: "1.0.0", ...frozenMaterial, freezeDigest: logicalDigest(frozenMaterial), immutableForCampaign: true };
write("characterization-freeze.json", freeze);
console.log(JSON.stringify({ campaignId: CAMPAIGN_ID, cases: authored.cases.length, positiveOpportunities: authored.cases.filter((item) => item.positiveOpportunity).length, replayCases: authored.cases.filter((item) => item.replayPredeclared).length, freezeDigest: freeze.freezeDigest }));
