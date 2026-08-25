/* eslint-disable @typescript-eslint/no-explicit-any -- pre-execution gates inspect frozen ledger serialization */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest } from "@/features/knowledge-engine";
import {
  SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION,
  SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION,
} from "@/features/protocol-designer/scientific-execution-trace";
import { rehydrateProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  AUTHORED_AT,
  buildAuthoredCampaign,
  CAMPAIGN_ID,
  EXPOSED_CORPUS,
  INITIAL_HEAD,
  ST_VERSION,
} from "./authoring";
import { DETERMINISTIC_CHECKER_VERSION } from "./deterministic-checker";

const ROOT = resolve(import.meta.dirname, "../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01h1-st");
const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const write = (name: string, value: unknown) => writeFileSync(resolve(OUT, name), stable(value), "utf8");
const sha = (path: string) => `sha256-${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
mkdirSync(OUT, { recursive: true });

const authored = buildAuthoredCampaign();
if (authored.cases.length < 10 || authored.cases.length > 12) throw new Error(`H1_CASE_COUNT_INVALID:${authored.cases.length}`);
if (authored.cases.some((item) => ["TOO_CLOSE", "EXACT_OR_NEAR_DUPLICATE"].includes(item.parentageStatus))) throw new Error("H1_PARENTAGE_INADMISSIBLE");
if (authored.envelopes.length !== authored.cases.length || authored.inputs.length !== authored.cases.length) throw new Error("H1_REGISTRY_CARDINALITY_MISMATCH");
if (new Set(authored.cases.map((item) => item.caseId)).size !== authored.cases.length) throw new Error("H1_DUPLICATE_CASE_ID");

const caseRegistry = {
  contract: "W1_QUAL_01H1_ST_CASE_REGISTRY",
  version: "1.0.0",
  campaignId: CAMPAIGN_ID,
  authoredAt: AUTHORED_AT,
  authoredBeforeObservation: true,
  observationOccurred: false,
  cases: authored.cases,
};
const envelopeRegistry = {
  contract: "W1_QUAL_01H1_ST_HUMAN_REVIEW_ENVELOPE_REGISTRY",
  version: "1.0.0",
  campaignId: CAMPAIGN_ID,
  authoredBeforeObservation: true,
  mutableAfterObservation: false,
  scientificGold: false,
  exactOutputRequired: false,
  entries: authored.envelopes,
};
const inputRegistry = {
  contract: "W1_QUAL_01H1_ST_FROZEN_INPUT_REGISTRY",
  version: "1.0.0",
  campaignId: CAMPAIGN_ID,
  knowledgeRecalculationDuringCampaign: false,
  providerCalls: 0,
  llmCalls: 0,
  externalEvidenceCalls: 0,
  packs: authored.inputs,
};

const inputChecks = authored.inputs.map((pack) => {
  const ledger = rehydrateProductOwnerResultLedger(pack.payload.ledger as any);
  const entry = ledger.entries.find((item) => item.result?.resultId === pack.payload.knowledgeResultId);
  const result = entry?.result;
  const native = result?.nativePayload as any;
  const material = {
    version: pack.version,
    sourceCase: pack.sourceCase,
    purpose: pack.purpose,
    projectBinding: pack.projectBinding,
    knowledgeResultBinding: pack.knowledgeResultBinding,
    provenance: pack.provenance,
    sourceRefs: pack.sourceRefs,
    evidenceRefs: pack.evidenceRefs,
    gaps: pack.gaps,
    limitations: pack.limitations,
    contradictions: pack.contradictions,
    controlledStaleRecipe: pack.controlledStaleRecipe,
    payload: pack.payload,
  };
  const internallyBound = Boolean(
    result
    && result.sourceProjectRef === pack.projectBinding.projectId
    && (pack.controlledStaleRecipe
      ? result.sourceProjectVersion !== pack.projectBinding.projectVersion
        && result.sourceProjectDigest !== pack.projectBinding.projectDigest
      : result.sourceProjectVersion === pack.projectBinding.projectVersion
        && result.sourceProjectDigest === pack.projectBinding.projectDigest)
    && native?.resultDigest === pack.knowledgeResultBinding.resultDigest
    && `${result.resultId}@${result.resultVersion}` === pack.knowledgeResultBinding.ownerResultRef
  );
  return {
    caseId: pack.sourceCase,
    packDigestValid: logicalDigest(material) === pack.digest,
    frozen: pack.frozen,
    knowledgeResultPresent: Boolean(result),
    knowledgeResultDigestValid: native?.resultDigest === pack.knowledgeResultBinding.resultDigest,
    knowledgeOwnerResultRefValid: `${result?.resultId}@${result?.resultVersion}` === pack.knowledgeResultBinding.ownerResultRef,
    exactProjectBindingForExecution: pack.controlledStaleRecipe && internallyBound ? "INTENTIONALLY_STALE_FOR_FAIL_CLOSED_TEST" : internallyBound,
    provenancePresent: pack.provenance.length > 0,
    sourceRefsDeclared: Array.isArray(pack.sourceRefs),
    evidenceRefsDeclared: Array.isArray(pack.evidenceRefs),
    gapsDeclared: Array.isArray(pack.gaps),
    limitationsDeclared: Array.isArray(pack.limitations),
    contradictionsDeclared: Array.isArray(pack.contradictions),
  };
});
if (inputChecks.some((item) => !item.packDigestValid || !item.frozen || !item.knowledgeResultPresent || !item.knowledgeResultDigestValid || !item.knowledgeOwnerResultRefValid || item.exactProjectBindingForExecution === false)) {
  throw new Error(`H1_INPUT_GATE_FAILED:${stable(inputChecks.filter((item) => !item.packDigestValid || !item.frozen || !item.knowledgeResultPresent || !item.knowledgeResultDigestValid || !item.knowledgeOwnerResultRefValid || item.exactProjectBindingForExecution === false))}`);
}

const parentageAudit = {
  contract: "W1_QUAL_01H1_ST_PARENTAGE_AUDIT",
  version: "1.0.0",
  campaignId: CAMPAIGN_ID,
  completedBeforeFirstStExecution: true,
  comparisonSources: EXPOSED_CORPUS,
  cases: authored.cases.map((item) => ({
    caseId: item.caseId,
    status: item.parentageStatus,
    nearestExposedMaterial: item.nearestExposedMaterial,
    distinctnessRationale: item.distinctnessRationale,
    admissible: !["TOO_CLOSE", "EXACT_OR_NEAR_DUPLICATE"].includes(item.parentageStatus),
  })),
  exclusions: {
    tooClose: [],
    exactOrNearDuplicate: [],
    reusedAsIndependentEvidence: [],
  },
  counts: {
    total: authored.cases.length,
    novel: authored.cases.filter((item) => item.parentageStatus === "NOVEL").length,
    relatedButDistinct: authored.cases.filter((item) => item.parentageStatus === "RELATED_BUT_DISTINCT").length,
    tooClose: 0,
    exactOrNearDuplicate: 0,
  },
  conclusion: "ADMISSIBLE_NO_TOO_CLOSE_OR_DUPLICATE_CASE",
};

const humanAdjudicationTemplate = {
  contract: "W1_QUAL_01H1_ST_HUMAN_ADJUDICATION_TEMPLATE",
  version: "1.0.0",
  campaignId: CAMPAIGN_ID,
  scientificAdjudicationCompleted: false,
  reviewer: { reviewerId: "PENDING", role: "PENDING", competence: "PENDING", conflictDeclaration: "PENDING", reviewedAt: "PENDING" },
  cases: authored.cases.map((item) => ({
    caseId: item.caseId,
    H1: "PENDING",
    H2: "PENDING",
    H3: "PENDING",
    H4: "PENDING",
    H5: "PENDING",
    H6: "PENDING",
    H7: "PENDING",
    H8: "PENDING",
    reviewerRationale: "PENDING",
  })),
  counts: { cases: authored.cases.length, completed: 0, pending: authored.cases.length },
};

write("case-registry.json", caseRegistry);
write("human-review-envelope-registry.json", envelopeRegistry);
write("parentage-audit.json", parentageAudit);
write("frozen-input-registry.json", inputRegistry);
write("human-adjudication-template.json", humanAdjudicationTemplate);

const registryDigests = {
  caseRegistry: logicalDigest(caseRegistry),
  humanReviewEnvelopeRegistry: logicalDigest(envelopeRegistry),
  frozenInputRegistry: logicalDigest(inputRegistry),
  parentageAudit: logicalDigest(parentageAudit),
  humanAdjudicationTemplate: logicalDigest(humanAdjudicationTemplate),
};
const replaySelection = authored.cases.filter((item) => item.replayRole).map((item) => ({ caseId: item.caseId, role: item.replayRole }));
if (replaySelection.length !== 3 || new Set(replaySelection.map((item) => item.role)).size !== 3) throw new Error("H1_REPLAY_SELECTION_INVALID");

const freezeMaterial = {
  campaignId: CAMPAIGN_ID,
  gitHead: INITIAL_HEAD,
  stVersion: ST_VERSION,
  stRuntime: {
    engine: { path: "src/features/scientific-thinking/engine.ts", sha256: sha(resolve(ROOT, "src/features/scientific-thinking/engine.ts")) },
    types: { path: "src/features/scientific-thinking/types.ts", sha256: sha(resolve(ROOT, "src/features/scientific-thinking/types.ts")) },
    productRuntime: { path: "src/features/protocol-designer/product-scientific-thinking-owner-runtime.ts", sha256: sha(resolve(ROOT, "src/features/protocol-designer/product-scientific-thinking-owner-runtime.ts")) },
  },
  registryDigests,
  traceVersion: {
    ledger: SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION,
    eventSchema: SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION,
  },
  deterministicChecker: {
    version: DETERMINISTIC_CHECKER_VERSION,
    digest: sha(resolve(OUT, "tools/deterministic-checker.ts")),
  },
  authoringDigest: sha(resolve(OUT, "tools/authoring.ts")),
  replaySelection,
};
const freeze = {
  contract: "W1_QUAL_01H1_ST_CAMPAIGN_FREEZE",
  version: "1.0.0",
  frozenAt: "2026-08-26T12:30:00.000Z",
  ...freezeMaterial,
  freezeDigest: logicalDigest(freezeMaterial),
  registries: { cases: authored.cases.length, envelopes: authored.envelopes.length, packs: authored.inputs.length },
  parentageCompleted: true,
  inputsValidated: true,
  observationOccurred: false,
  mutableAfterObservation: false,
  status: "H1_CAMPAIGN_FREEZE_READY",
  inputChecks,
};
write("campaign-freeze.json", freeze);

console.log(stable({
  phase: "H1_PREPARE",
  campaignId: CAMPAIGN_ID,
  cases: authored.cases.length,
  parentage: parentageAudit.counts,
  replaySelection,
  registryDigests,
  freezeDigest: freeze.freezeDigest,
  status: freeze.status,
}));
