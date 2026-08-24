import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { loadEnv } from "vite";
import {
  buildPersistentDeltaPayload,
  executeNaturalConversation,
  executePersistentDelta,
  type ProductBridgeProviderResult,
} from "../../api/protocol-designer-bridge-provider.ts";
import { logicalDigest } from "../../src/features/knowledge-engine/canonical.ts";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentExtractionProviderArtifact,
  type PersistentProjectDeltaCandidate,
  type ProductBridgeRequest,
} from "../../src/features/protocol-designer/product-bridge.ts";
import { prepareResearchProjectContributionCandidate } from "../../src/features/research-project-construction/index.ts";
import type { ResearchProjectOwnerProjection } from "../../src/features/research-project-construction/contribution-owner-boundary.ts";
import type { ScientificInterpretationConversation } from "../../src/features/scientific-interpretation/contracts.ts";

const WORKSPACE = "/Users/charles/Documents/Projets/NOXIA/noxia-dev";
const EVIDENCE_DIRECTORY = join(WORKSPACE, "validation/project-hands-on-02r2");
const EVIDENCE_CONTRACT = "PROJECT_HANDS_ON_02R2_PROVIDER_EXACT_EVIDENCE" as const;
const ADJUDICATION_CONTRACT = "PROJECT_HANDS_ON_02R2_RECONSTRUCTED_ADJUDICATION" as const;

type EvidenceNature =
  | "DETERMINISTIC_MOCK"
  | "NEW_INDEPENDENT_DIAGNOSTIC_EVIDENCE"
  | "POST_FIX_VERIFICATION_C1"
  | "FIRST_GENERATION_NO_REROLL";

type ProviderCallAccounting = {
  conversation: Pick<ProductBridgeProviderResult<string>, "httpStatus" | "responseId" | "latencyMs" | "usage"> & { assistantReply: string } | null;
  extraction: { httpStatus: number; responseId: string | null; latencyMs: number; usage: unknown } | null;
};

export type PersistedExactProviderEvidence = {
  contract: typeof EVIDENCE_CONTRACT;
  contractVersion: "1.0.0";
  evidenceStatus: "PERSISTED_PRE_ADJUDICATION";
  diagnosticRunId: string;
  evidenceNature: EvidenceNature;
  originalProviderArtifactStatus: "ORIGINAL_PROVIDER_ARTIFACT_NOT_PERSISTED";
  originalProviderArtifactReconstructed: false;
  createdAt: string;
  turnId: string;
  rawUserText: string;
  provider: "GOOGLE_GEMINI";
  model: string;
  promptContractDigest: string;
  functionName: string;
  providerResponseId: string | null;
  exactStructuredProviderArgs: unknown;
  exactStructuredProviderArgsSerialized: string;
  exactStructuredProviderArgsDigest: string;
  sourceProject: { projectId: string; versionId: string; revision: number; projectDigest: string } | null;
  calls: ProviderCallAccounting;
  secretMaterialPersisted: false;
  adjudication: null;
};

const safeRunId = (value: string) => {
  if (!/^[A-Z0-9][A-Z0-9._-]{5,119}$/u.test(value)) throw new Error("DIAGNOSTIC_RUN_ID_INVALID");
  return value;
};

export const exactEvidencePath = (diagnosticRunId: string) => join(EVIDENCE_DIRECTORY, `${safeRunId(diagnosticRunId).toLocaleLowerCase("en-US")}-provider-exact.json`);
export const adjudicationEvidencePath = (diagnosticRunId: string) => join(EVIDENCE_DIRECTORY, `${safeRunId(diagnosticRunId).toLocaleLowerCase("en-US")}-adjudication.json`);

const writeNewJson = (path: string, value: unknown) => {
  mkdirSync(EVIDENCE_DIRECTORY, { recursive: true });
  const descriptor = openSync(path, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8" });
  } finally {
    closeSync(descriptor);
  }
};

const promptContractDigest = (request: ProductBridgeRequest) => {
  const payload = buildPersistentDeltaPayload(request);
  return logicalDigest({
    systemInstruction: payload.systemInstruction,
    tools: payload.tools,
    toolConfig: payload.toolConfig,
  });
};

export const persistExactProviderEvidence = (input: {
  diagnosticRunId: string;
  evidenceNature: EvidenceNature;
  rawUserText: string;
  request: ProductBridgeRequest;
  providerArtifact: PersistentExtractionProviderArtifact;
  calls?: ProviderCallAccounting;
}) => {
  const { providerArtifact } = input;
  if (JSON.stringify(providerArtifact.structuredArgsExact) !== providerArtifact.structuredArgsSerialized) {
    throw new Error("EXACT_STRUCTURED_ARGS_SERIALIZATION_MISMATCH");
  }
  if (logicalDigest(providerArtifact.structuredArgsSerialized) !== providerArtifact.structuredArgsDigest) {
    throw new Error("EXACT_STRUCTURED_ARGS_DIGEST_MISMATCH");
  }
  const evidence: PersistedExactProviderEvidence = {
    contract: EVIDENCE_CONTRACT,
    contractVersion: "1.0.0",
    evidenceStatus: "PERSISTED_PRE_ADJUDICATION",
    diagnosticRunId: safeRunId(input.diagnosticRunId),
    evidenceNature: input.evidenceNature,
    originalProviderArtifactStatus: "ORIGINAL_PROVIDER_ARTIFACT_NOT_PERSISTED",
    originalProviderArtifactReconstructed: false,
    createdAt: providerArtifact.receivedAt,
    turnId: providerArtifact.requestTurnRef,
    rawUserText: input.rawUserText,
    provider: providerArtifact.provider,
    model: providerArtifact.model,
    promptContractDigest: promptContractDigest(input.request),
    functionName: providerArtifact.functionName,
    providerResponseId: providerArtifact.providerResponseId,
    exactStructuredProviderArgs: providerArtifact.structuredArgsExact,
    exactStructuredProviderArgsSerialized: providerArtifact.structuredArgsSerialized,
    exactStructuredProviderArgsDigest: providerArtifact.structuredArgsDigest,
    sourceProject: input.request.currentProject ? {
      projectId: input.request.currentProject.projectId,
      versionId: input.request.currentProject.versionId,
      revision: input.request.currentProject.revision,
      projectDigest: input.request.currentProject.projectDigest,
    } : null,
    calls: input.calls ?? { conversation: null, extraction: null },
    secretMaterialPersisted: false,
    adjudication: null,
  };
  const path = exactEvidencePath(input.diagnosticRunId);
  writeNewJson(path, evidence);
  const reloaded = JSON.parse(readFileSync(path, "utf8")) as PersistedExactProviderEvidence;
  if (reloaded.exactStructuredProviderArgsSerialized !== providerArtifact.structuredArgsSerialized
    || reloaded.exactStructuredProviderArgsDigest !== providerArtifact.structuredArgsDigest
    || reloaded.adjudication !== null) {
    throw new Error("PERSISTED_EXACT_EVIDENCE_RELOAD_MISMATCH");
  }
  return { path, evidence: reloaded };
};

export const adjudicatePersistedEvidence = (input: {
  diagnosticRunId: string;
  conversation: ScientificInterpretationConversation;
  currentProject: ResearchProjectOwnerProjection | null;
}) => {
  const exactPath = exactEvidencePath(input.diagnosticRunId);
  const exact = JSON.parse(readFileSync(exactPath, "utf8")) as PersistedExactProviderEvidence;
  if (exact.contract !== EVIDENCE_CONTRACT || exact.evidenceStatus !== "PERSISTED_PRE_ADJUDICATION" || exact.adjudication !== null) {
    throw new Error("PRE_ADJUDICATION_EVIDENCE_CONTRACT_INVALID");
  }
  if (JSON.stringify(exact.exactStructuredProviderArgs) !== exact.exactStructuredProviderArgsSerialized
    || logicalDigest(exact.exactStructuredProviderArgsSerialized) !== exact.exactStructuredProviderArgsDigest) {
    throw new Error("PERSISTED_EVIDENCE_NOT_RECONSTRUCTIBLE");
  }
  const checked = validatePersistentProjectDelta(
    exact.exactStructuredProviderArgs,
    exact.rawUserText,
    input.currentProject,
    input.conversation,
  );
  const contribution = checked.validation.valid && checked.candidate
    ? contributionFromPersistentDelta({
      candidate: checked.candidate,
      conversation: input.conversation,
      currentProject: input.currentProject,
      providerArtifact: {
        artifactRef: `gemini-structured-args:${exact.exactStructuredProviderArgsDigest}`,
        requestTurnRef: exact.turnId,
        provider: exact.provider,
        model: exact.model as PersistentExtractionProviderArtifact["model"],
        functionName: exact.functionName as PersistentExtractionProviderArtifact["functionName"],
        receivedAt: exact.createdAt,
        providerResponseId: exact.providerResponseId,
        structuredArgsExact: exact.exactStructuredProviderArgs,
        structuredArgsSerialized: exact.exactStructuredProviderArgsSerialized,
        structuredArgsDigest: exact.exactStructuredProviderArgsDigest,
      },
    })
    : null;
  const prepared = contribution ? prepareResearchProjectContributionCandidate(contribution, input.currentProject) : null;
  const derived = {
    contract: ADJUDICATION_CONTRACT,
    contractVersion: "1.0.0",
    diagnosticRunId: exact.diagnosticRunId,
    sourceExactEvidencePath: basename(exactPath),
    sourceExactEvidenceDigest: exact.exactStructuredProviderArgsDigest,
    reconstructedAfterPersistence: true,
    wireCandidate: checked.wireCandidate,
    normalizedCandidate: checked.candidate,
    validation: checked.validation,
    canonicalProjectChangeSet: prepared?.canonicalChangeSet ?? null,
    humanReviewProjection: prepared?.humanReviewProjection ?? null,
    contribution,
  };
  const path = adjudicationEvidencePath(input.diagnosticRunId);
  writeNewJson(path, derived);
  return { path, exact, derived };
};

const mockRaw = "Le traitement est comparé au contrôle avec une acquisition par modalité M à T3.";
const mockArgs: PersistentProjectDeltaCandidate = {
  contract: "PERSISTENT_PROJECT_DELTA_CANDIDATE",
  contractVersion: "0.3.0",
  projectWriteAuthorized: false,
  changes: [
    { operation: "ADD", sourceText: "traitement", targetProjectRef: null, candidateRef: "mock:intervention", semanticIdentity: "mock:intervention", proposedType: "INTERVENTION", content: "traitement", polarity: "AFFIRMED", studyRole: null, epistemicStatus: "EXPLICIT_USER_STATED", assertionKind: "USER_STATED", proposalSourceText: null, evidenceRefs: [] },
    { operation: "ADD", sourceText: "contrôle", targetProjectRef: null, candidateRef: "mock:comparator", semanticIdentity: "mock:comparator", proposedType: "COMPARATOR", content: "contrôle", polarity: "AFFIRMED", studyRole: null, epistemicStatus: "EXPLICIT_USER_STATED", assertionKind: "USER_STATED", proposalSourceText: null, evidenceRefs: [] },
    { operation: "ADD", sourceText: "acquisition par modalité M", targetProjectRef: null, candidateRef: "mock:acquisition", semanticIdentity: "mock:acquisition", proposedType: "ACQUISITION", content: "acquisition par modalité M", polarity: "AFFIRMED", studyRole: null, epistemicStatus: "EXPLICIT_USER_STATED", assertionKind: "USER_STATED", proposalSourceText: null, evidenceRefs: [] },
  ],
  relations: [{ relationRef: "mock:comparison", sourceText: "traitement est comparé au contrôle", relationType: "COMPARES_WITH", sourceObjectRef: "mock:intervention", targetObjectRef: "mock:comparator", polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", assertionKind: "USER_STATED", proposalSourceText: null, evidenceRefs: [] }],
  temporalQualifications: [{ operation: "ADD", qualificationId: "mock:timing", sourceText: "T3", subjectProjectRef: "mock:acquisition", temporalRole: "ACQUISITION_TIME", anchor: { kind: "TIMEPOINT", direction: "AT", unit: "MONTH", offset: 3, lowerBound: null, upperBound: null, relativeEventLabel: null, tolerance: null, reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } }, assertionKind: "USER_STATED", proposalSourceText: null, evidenceRefs: [] }],
  expectedVariableOccasions: [],
};

const mockRequest = (turnId: string): ProductBridgeRequest => ({
  apiVersion: "1.0.0",
  requestKind: "USER_TURN",
  conversation: { conversationId: "project-hands-on-02r2:mock", language: "fr", turns: [{ turnId, role: "USER", content: mockRaw }] },
  currentProject: null,
  evaluatePersistentDelta: true,
});

const mockArtifact = (turnId: string): PersistentExtractionProviderArtifact => {
  const structuredArgsExact = {
    changes: mockArgs.changes,
    relations: mockArgs.relations,
    temporalQualifications: mockArgs.temporalQualifications,
    expectedVariableOccasions: mockArgs.expectedVariableOccasions,
  };
  const structuredArgsSerialized = JSON.stringify(structuredArgsExact);
  const structuredArgsDigest = logicalDigest(structuredArgsSerialized);
  return {
    artifactRef: `gemini-structured-args:${structuredArgsDigest}`,
    requestTurnRef: turnId,
    provider: "GOOGLE_GEMINI",
    model: "gemini-3.5-flash-lite",
    functionName: "propose_persistent_project_delta",
    receivedAt: "2026-08-24T10:00:00.000Z",
    providerResponseId: "MOCK_NO_PROVIDER_CALL",
    structuredArgsExact,
    structuredArgsSerialized,
    structuredArgsDigest,
  };
};

const apiKey = () => {
  const environment = { ...loadEnv("production", WORKSPACE, ""), ...loadEnv("development", WORKSPACE, "") };
  const value = process.env.GEMINI_API_KEY?.trim() || environment.GEMINI_API_KEY?.trim() || "";
  if (!value) throw new Error("GEMINI_API_KEY_NOT_ACCESSIBLE");
  return value;
};

const cli = async () => {
  const [mode, runId] = process.argv.slice(2);
  if (!mode || !runId) return;
  if (mode === "mock-persist") {
    const turnId = `${runId}:turn`;
    const result = persistExactProviderEvidence({ diagnosticRunId: runId, evidenceNature: "DETERMINISTIC_MOCK", rawUserText: mockRaw, request: mockRequest(turnId), providerArtifact: mockArtifact(turnId) });
    console.log(JSON.stringify({ mode, runId, exactEvidencePath: result.path, persistedPreAdjudication: true }));
    return;
  }
  if (mode === "mock-adjudicate") {
    const exact = JSON.parse(readFileSync(exactEvidencePath(runId), "utf8")) as PersistedExactProviderEvidence;
    const conversation: ScientificInterpretationConversation = { conversationId: "project-hands-on-02r2:mock", language: "fr", turns: [{ turnId: exact.turnId, role: "USER", content: exact.rawUserText }] };
    const result = adjudicatePersistedEvidence({ diagnosticRunId: runId, conversation, currentProject: null });
    console.log(JSON.stringify({ mode, runId, adjudicationEvidencePath: result.path, valid: result.derived.validation.valid, review: result.derived.humanReviewProjection?.status }));
    return;
  }
  if (mode === "live-c1-persist") {
    const rawUserText = "Projet médicament contre placebo réduction des plaques carotiennes avec évaluation IRM M3";
    const turnId = `${runId}:user`;
    const request: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      requestKind: "USER_TURN",
      conversation: { conversationId: "project-hands-on-02r2:live", language: "fr", turns: [{ turnId, role: "USER", content: rawUserText }] },
      currentProject: null,
      evaluatePersistentDelta: true,
    };
    const conversation = await executeNaturalConversation(request, apiKey());
    const extraction = await executePersistentDelta(request, apiKey());
    const result = persistExactProviderEvidence({
      diagnosticRunId: runId,
      evidenceNature: "NEW_INDEPENDENT_DIAGNOSTIC_EVIDENCE",
      rawUserText,
      request,
      providerArtifact: extraction.value.providerArtifact,
      calls: {
        conversation: { httpStatus: conversation.httpStatus, responseId: conversation.responseId, latencyMs: conversation.latencyMs, usage: conversation.usage, assistantReply: conversation.value },
        extraction: { httpStatus: extraction.httpStatus, responseId: extraction.responseId, latencyMs: extraction.latencyMs, usage: extraction.usage },
      },
    });
    console.log(JSON.stringify({ mode, runId, exactEvidencePath: result.path, digest: result.evidence.exactStructuredProviderArgsDigest, persistedPreAdjudication: true }));
    return;
  }
  if (mode === "adjudicate-c1") {
    const exact = JSON.parse(readFileSync(exactEvidencePath(runId), "utf8")) as PersistedExactProviderEvidence;
    const conversation: ScientificInterpretationConversation = { conversationId: "project-hands-on-02r2:live", language: "fr", turns: [{ turnId: exact.turnId, role: "USER", content: exact.rawUserText }] };
    const result = adjudicatePersistedEvidence({ diagnosticRunId: runId, conversation, currentProject: null });
    console.log(JSON.stringify({ mode, runId, adjudicationEvidencePath: result.path, valid: result.derived.validation.valid, review: result.derived.humanReviewProjection?.status }));
    return;
  }
  throw new Error("DIAGNOSTIC_HARNESS_MODE_INVALID");
};

await cli();
