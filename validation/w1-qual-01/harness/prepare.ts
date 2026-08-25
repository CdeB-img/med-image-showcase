import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AUTHORED_AT,
  buildAuthoredCampaign,
  CAMPAIGN_ID,
  HARNESS_VERSION,
  INITIAL_HEAD,
  INVALIDATED_PREDECESSOR_CAMPAIGNS,
} from "./authoring";
import { currentProviderVersions, KNOWLEDGE_PROVIDER_REGISTRY, logicalDigest } from "@/features/knowledge-engine";
import { REG000_CORPUS, REG000_CORPUS_DIGEST, REG000_CORPUS_VERSION } from "@/features/regulatory-resolution";

const ROOT = resolve(import.meta.dirname, "../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01");
const stable = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const sha256File = (path: string) => createHash("sha256").update(readFileSync(resolve(ROOT, path))).digest("hex");
const write = (name: string, value: unknown) => writeFileSync(resolve(OUT, name), stable(value), "utf8");

mkdirSync(OUT, { recursive: true });
const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
const branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim();
if (head !== INITIAL_HEAD || branch !== "protocol-designer-canonical-ingestion") throw new Error("W1_QUAL_01_FREEZE_BASELINE_MISMATCH");

const authored = buildAuthoredCampaign();
const caseRegistry = { contract: "W1_QUAL_01_CHARACTERIZATION_CASE_REGISTRY", version: "1.0.0", campaignId: CAMPAIGN_ID, authoredAt: AUTHORED_AT, authoredBeforeObservation: true, cases: authored.cases };
const envelopeRegistry = { contract: "W1_QUAL_01_ACCEPTANCE_ENVELOPE_REGISTRY", version: "1.0.0", campaignId: CAMPAIGN_ID, authoredAt: AUTHORED_AT, mutableAfterObservation: false, envelopes: authored.envelopes };
const inputRegistry = { contract: "W1_QUAL_01_FROZEN_INPUT_REGISTRY", version: "1.0.0", campaignId: CAMPAIGN_ID, authoredAt: AUTHORED_AT, reconstructionLlmCalls: 0, packs: authored.inputs };
write("case-registry.json", caseRegistry);
write("acceptance-envelope-registry.json", envelopeRegistry);
write("frozen-input-registry.json", inputRegistry);

const codePaths = [
  "validation/w1-qual-01/harness/authoring.ts",
  "validation/w1-qual-01/harness/prepare.ts",
  "validation/w1-qual-01/harness/execute.ts",
  "validation/w1-qual-01/harness/validate.ts",
  "validation/w1-qual-01/harness/harness.test.ts",
  "src/features/protocol-designer/product-knowledge-owner-runtime.ts",
  "src/features/protocol-designer/product-scientific-thinking-owner-runtime.ts",
  "src/features/protocol-designer/product-imaging-owner-runtime.ts",
  "src/features/protocol-designer/product-regulatory-owner-runtime.ts",
  "src/features/protocol-designer/product-scientific-loop-validation-runtime.ts",
  "src/features/protocol-designer/scientific-execution-trace.ts",
  "src/features/research-project-construction/native-specialized-owner-invocation.ts",
  "src/features/research-project-construction/scientific-reasoning-owner-chain.ts",
  "src/features/knowledge-engine/engine.ts",
  "src/features/scientific-thinking/engine.ts",
  "src/features/imaging-study-designer/engine.ts",
  "src/features/regulatory-resolution/resolver.ts",
];
const frozenMaterial = {
  campaignId: CAMPAIGN_ID,
  harnessVersion: HARNESS_VERSION,
  frozenAt: AUTHORED_AT,
  branch,
  gitHead: head,
  schemas: {
    canonicalProject: "PRJ001_CANONICAL_RESEARCH_PROJECT_STATE@0.2.0",
    projectContextSnapshot: "PROJECT_CONTEXT_SNAPSHOT@0.3.0",
    ownerResult: "PROJECT_SPINE_02_SPECIALIZED_OWNER_HANDOFF@0.1.0",
    productOwnerLedger: "PROTOCOL_DESIGNER_KNOWLEDGE_OWNER_LEDGER@0.2.0",
    trace: "SCIENTIFIC_EXECUTION_TRACE_LEDGER@0.1.0",
  },
  ownerVersions: { knowledge: "1.2.0", scientificThinking: "1.2.0", imaging: "1.2.1", reg: "1.0.0", val: "VAL-001-DETERMINISTIC-ENGINE@1.0.0 / product-profile@0.1.0" },
  deterministicConfiguration: { knowledgeExternalSearchPolicy: "INTERNAL_ONLY", externalProviderCalls: 0, llmCalls: 0, regProvider: "LOCAL_DETERMINISTIC_RESOLVER", valSemanticReview: false },
  corpora: {
    reg: {
      identifier: REG000_CORPUS.corpus.identifier,
      version: REG000_CORPUS_VERSION,
      digest: REG000_CORPUS_DIGEST,
      admissionStatus: REG000_CORPUS.corpus.admissionStatus,
      authorityBoundary: REG000_CORPUS.corpus.authorityBoundary,
    },
    knowledge: {
      registryId: KNOWLEDGE_PROVIDER_REGISTRY.registryId,
      registryVersion: KNOWLEDGE_PROVIDER_REGISTRY.version,
      registryDigest: KNOWLEDGE_PROVIDER_REGISTRY.digest,
      providerVersions: currentProviderVersions(),
      applicableCorpora: ["P4R_CURRENT", "P5_CURRENT", "RB-003@1.0", "RB-004@1.1", "RB-005@1.0"],
    },
  },
  registries: { caseRegistryDigest: logicalDigest(caseRegistry), envelopeRegistryDigest: logicalDigest(envelopeRegistry), inputRegistryDigest: logicalDigest(inputRegistry), cases: authored.cases.length, envelopes: authored.envelopes.length, packs: authored.inputs.length },
  codeDigests: Object.fromEntries(codePaths.map((path) => [path, sha256File(path)])),
  antiSem: { ownersFrozenAfterFirstObservedResult: true, envelopesMutableAfterObservation: false, repairDuringCampaign: false },
  invalidatedPredecessorCampaigns: INVALIDATED_PREDECESSOR_CAMPAIGNS,
};
const freeze = { contract: "W1_QUAL_01_CHARACTERIZATION_FREEZE", version: "1.0.0", ...frozenMaterial, freezeDigest: logicalDigest(frozenMaterial), immutableForCampaign: true };
write("characterization-freeze.json", freeze);
console.log(JSON.stringify({ campaignId: CAMPAIGN_ID, cases: authored.cases.length, envelopes: authored.envelopes.length, packs: authored.inputs.length, freezeDigest: freeze.freezeDigest }));
