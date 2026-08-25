/* eslint-disable @typescript-eslint/no-explicit-any -- pre-execution gates inspect frozen ledger serialization */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest } from "@/features/knowledge-engine";
import {
  SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION,
  SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION,
} from "@/features/protocol-designer/scientific-execution-trace";
import { evaluateKnowledgeInputGate } from "../../harness/contracts";
import { validatePreparedCampaign } from "../../harness/validator";
import {
  AUTHORED_AT,
  buildAuthoredCampaign,
  CAMPAIGN_ID,
  EXPOSED_EXCLUSIONS,
  INITIAL_HEAD,
  ST_VERSION,
} from "./authoring";

const ROOT = resolve(import.meta.dirname, "../../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01r2-st/campaign-c");
const HARNESS = resolve(ROOT, "validation/w1-qual-01r2-st/harness");
const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const read = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;
const write = (name: string, value: unknown) => writeFileSync(resolve(OUT, name), stable(value), "utf8");
const sha = (path: string) => `sha256-${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
mkdirSync(OUT, { recursive: true });

const harnessFreeze = read<any>(resolve(HARNESS, "harness-freeze.json"));
for (const [name, expected] of Object.entries(harnessFreeze.sourceDigests as Record<string, string>)) {
  const observed = sha(resolve(HARNESS, name));
  if (observed !== expected) throw new Error(`FROZEN_HARNESS_MODIFIED:${name}:${expected}:${observed}`);
}
if (harnessFreeze.status !== "READY" || harnessFreeze.mutableDuringCampaignC !== false) throw new Error("HARNESS_NOT_READY_FOR_CAMPAIGN_C");

const authored = buildAuthoredCampaign();
if (authored.cases.some((item) => ["TOO_CLOSE", "EXACT_OR_NEAR_DUPLICATE"].includes(item.parentageStatus))) throw new Error("CAMPAIGN_C_PARENTAGE_INADMISSIBLE");
if (authored.cases.length < 10 || authored.cases.length > 16) throw new Error("CAMPAIGN_C_SIZE_INVALID");

const caseRegistry = {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_CASE_REGISTRY",
  version: "1.0.0",
  campaignId: CAMPAIGN_ID,
  authoredAt: AUTHORED_AT,
  observationOccurred: false,
  cases: authored.cases,
};
const envelopeRegistry = {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_ACCEPTANCE_ENVELOPE_REGISTRY",
  version: "2.1.0",
  campaignId: CAMPAIGN_ID,
  authoredBeforeObservation: true,
  mutableAfterObservation: false,
  envelopes: authored.envelopes,
};
const inputRegistry = {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_FROZEN_INPUT_REGISTRY",
  version: "2.1.0",
  campaignId: CAMPAIGN_ID,
  knowledgeRecalculationDuringCampaign: false,
  llmCalls: 0,
  externalEvidenceCalls: 0,
  packs: authored.inputs,
};
write("case-registry.json", caseRegistry);
write("acceptance-envelope-registry.json", envelopeRegistry);
write("frozen-input-registry.json", inputRegistry);

const gateCases = authored.inputs.map((pack) => {
  const caseItem = authored.cases.find((item) => item.caseId === pack.sourceCase)!;
  const ledger = pack.payload.ledger as any;
  const entry = ledger.entries.find((item: any) => item.result?.resultId === pack.payload.knowledgeResultId);
  const result = entry?.result;
  const native = result?.nativePayload;
  const material = {
    version: pack.version,
    sourceCase: pack.sourceCase,
    provenance: pack.provenance,
    purpose: pack.purpose,
    controlledStaleRecipe: pack.controlledStaleRecipe,
    knowledgeGateBinding: pack.knowledgeGateBinding,
    payload: pack.payload,
  };
  const gate = evaluateKnowledgeInputGate({
    expectedProject: pack.knowledgeGateBinding,
    observedProject: {
      projectId: result?.sourceProjectRef ?? "",
      projectVersion: result?.sourceProjectVersion ?? "",
      projectDigest: result?.sourceProjectDigest ?? "",
    },
    resultRef: result ? `${result.resultId}@${result.resultVersion}` : null,
    resultDigest: native?.resultDigest ?? null,
    provenanceRefs: result?.provenance ?? [],
    applicabilityRepresented: Boolean(native && Object.hasOwn(native, "applicability")),
    sourceRefs: native?.sources?.map((item: any) => item.sourceId) ?? [],
    evidenceRefs: native?.evidence?.map((item: any) => item.evidenceId) ?? [],
    evidenceRequired: native?.coverageStatus !== "NO_MATCH",
    gapsExpected: caseItem.expectedGaps,
    gapsObserved: native?.gaps?.map((item: any) => item.code) ?? [],
    limitationsExpected: caseItem.expectedLimitations,
    limitationsObserved: native?.limitations ?? [],
    contradictionsExpected: caseItem.expectedContradictions,
    contradictionsObserved: native?.controversies?.map((item: any) => item.explanation) ?? [],
    preEncodedStDecision: (native?.candidateAssertions?.length ?? 0) > 0 || Boolean(native?.scientificThinkingDecision),
    stale: pack.controlledStaleRecipe,
    purposeCoherent: pack.purpose === caseItem.purpose,
    frozen: pack.frozen,
    digestValid: logicalDigest(material) === pack.digest,
    testPurpose: caseItem.expectedExecutionMode === "PRE_OWNER_REJECTION_EXPECTED" ? "FAIL_CLOSED_PRE_OWNER_REJECTION" : "OWNER_EXECUTION",
  });
  return {
    caseId: pack.sourceCase,
    expectedExecutionMode: caseItem.expectedExecutionMode,
    controlledStaleRecipe: pack.controlledStaleRecipe,
    knowledgeBoundToHistoricalProjectAndInternallyCurrent: pack.controlledStaleRecipe,
    ...gate,
  };
});
const counts = {
  usable: gateCases.filter((item) => item.status === "USABLE").length,
  intentionallyInvalidForFailClosedTest: gateCases.filter((item) => item.status === "INTENTIONALLY_INVALID_FOR_FAIL_CLOSED_TEST").length,
  notUsable: gateCases.filter((item) => item.status === "NOT_USABLE").length,
  nonAdjudicable: gateCases.filter((item) => item.status === "NON_ADJUDICABLE").length,
};
const knowledgeGate = {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_KNOWLEDGE_INPUT_QUALITY_GATE",
  version: "2.0.0+R2-FAIL-CLOSED-PURPOSE",
  campaignId: CAMPAIGN_ID,
  decisionScope: "INPUT_ADMISSIBILITY_FOR_PREAUTHORED_TEST_PURPOSE_ONLY",
  decidesWhetherStShouldGenerateHypothesis: false,
  cases: gateCases,
  counts,
  verdict: counts.usable + counts.intentionallyInvalidForFailClosedTest === authored.cases.length ? "PASS" : "FAIL_CLOSED",
};
write("knowledge-input-quality-gate.json", knowledgeGate);
if (knowledgeGate.verdict !== "PASS") throw new Error(`CAMPAIGN_C_KNOWLEDGE_GATE_FAILED:${stable(counts)}`);

const parentageAudit = {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_PARENTAGE_AUDIT",
  version: "1.0.0",
  campaignId: CAMPAIGN_ID,
  completedBeforeFirstStExecution: true,
  exclusions: EXPOSED_EXCLUSIONS,
  cases: authored.cases.map((item) => ({
    caseId: item.caseId,
    status: item.parentageStatus,
    nearestExposedMaterial: item.nearestExposedMaterial,
    distinctnessRationale: item.distinctnessRationale,
    admissible: !["TOO_CLOSE", "EXACT_OR_NEAR_DUPLICATE"].includes(item.parentageStatus),
  })),
  counts: {
    total: authored.cases.length,
    novel: authored.cases.filter((item) => item.parentageStatus === "NOVEL").length,
    relatedButDistinct: authored.cases.filter((item) => item.parentageStatus === "RELATED_BUT_DISTINCT").length,
    tooClose: authored.cases.filter((item) => item.parentageStatus === "TOO_CLOSE").length,
    exactOrNearDuplicate: authored.cases.filter((item) => item.parentageStatus === "EXACT_OR_NEAR_DUPLICATE").length,
  },
  campaignACasesReusedAsIndependentEvidence: false,
  campaignBCasesReusedAsIndependentEvidence: false,
  repairProbesReusedAsIndependentEvidence: false,
  harnessMetaFixturesReusedAsIndependentEvidence: false,
  conclusion: "CAMPAIGN_C_PARENTAGE_ADMISSIBLE_NO_TOO_CLOSE_OR_DUPLICATE_CASE",
};
write("parentage-audit.json", parentageAudit);

const registryDigests = {
  caseRegistry: logicalDigest(caseRegistry),
  acceptanceEnvelopeRegistry: logicalDigest(envelopeRegistry),
  frozenInputRegistry: logicalDigest(inputRegistry),
  parentageAudit: logicalDigest(parentageAudit),
  knowledgeInputQualityGate: logicalDigest(knowledgeGate),
};
const freezeMaterial = {
  campaignId: CAMPAIGN_ID,
  gitHead: INITIAL_HEAD,
  stVersion: ST_VERSION,
  harnessVersion: harnessFreeze.harnessVersion,
  harnessDigest: harnessFreeze.harnessDigest,
  registryDigests,
  traceLedgerVersion: SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION,
  traceEventSchemaVersion: SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION,
  evaluatorDigest: harnessFreeze.evaluatorDigest,
  authoringDigest: sha(resolve(OUT, "tools/authoring.ts")),
  replaySelection: authored.cases.filter((item) => item.replayPredeclared).map((item) => ({ caseId: item.caseId, role: item.replayRole })),
};
const freeze = {
  contract: "W1_QUAL_01R2_ST_CAMPAIGN_C_CHARACTERIZATION_FREEZE",
  version: "1.0.0",
  frozenAt: "2026-08-26T09:30:00.000Z",
  ...freezeMaterial,
  freezeDigest: logicalDigest(freezeMaterial),
  registries: { cases: authored.cases.length, envelopes: authored.envelopes.length, packs: authored.inputs.length },
  parentageCompleted: true,
  knowledgeGatePassed: true,
  observationOccurred: false,
  mutableAfterObservation: false,
  status: "CHARACTERIZATION_FREEZE_READY",
};
const validation = validatePreparedCampaign({
  campaignId: CAMPAIGN_ID,
  expectedCampaignId: "W1-QUAL-01R2-ST-2026-08-26-C",
  cases: authored.cases,
  envelopeCases: authored.envelopes,
  packCaseIds: authored.inputs.map((item) => item.sourceCase),
  knowledgeGateCases: gateCases,
  freezeReady: freeze.status === "CHARACTERIZATION_FREEZE_READY",
});
if (!validation.valid) throw new Error(`CAMPAIGN_C_PREPARED_VALIDATION_FAILED:${stable(validation.findings)}`);
write("characterization-freeze.json", { ...freeze, machineValidation: validation });

console.log(stable({
  phase: "C_PREPARE",
  campaignId: CAMPAIGN_ID,
  cases: authored.cases.length,
  domains: [...new Set(authored.cases.map((item) => item.domain))].length,
  knowledgeGate: knowledgeGate.verdict,
  knowledgeGateCounts: counts,
  parentage: parentageAudit.counts,
  replaySelection: freezeMaterial.replaySelection,
  freezeDigest: freeze.freezeDigest,
  status: freeze.status,
}));
