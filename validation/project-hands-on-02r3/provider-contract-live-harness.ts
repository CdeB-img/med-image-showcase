import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnv } from "vite";
import {
  buildPersistentDeltaPayload,
  executeNaturalConversation,
  executePersistentDelta,
} from "../../api/protocol-designer-bridge-provider.ts";
import { logicalDigest } from "../../src/features/knowledge-engine/canonical.ts";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  validatePersistentProviderContract,
  type PersistentExtractionProviderArtifact,
  type ProductBridgeRequest,
} from "../../src/features/protocol-designer/product-bridge.ts";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "../../src/features/research-project-construction/index.ts";
import type { ScientificInterpretationConversation } from "../../src/features/scientific-interpretation/contracts.ts";

const WORKSPACE = "/Users/charles/Documents/Projets/NOXIA/noxia-dev";
const DIRECTORY = join(WORKSPACE, "validation/project-hands-on-02r3");
const RUN_ID = "PROJECT-HANDS-ON-02R3-POST-FIX-001";

const TURNS = {
  A: "Projet médicament contre placebo réduction des plaques carotiennes avec évaluation IRM M3",
  B: "Oui, je veux démontrer l'efficacité du traitement sur la disparition totale de la plaque.",
  C: "Population 35 à 75 ans, sans antécédent, avec plaque carotidienne et sténose supérieure à 40 %.",
} as const;
type TurnLabel = keyof typeof TURNS;

type HarnessState = {
  turn: TurnLabel;
  project: ResearchProjectOwnerProjection;
  conversation: ScientificInterpretationConversation;
};

type ExactEvidence = {
  contract: "PROJECT_HANDS_ON_02R3_PROVIDER_EXACT_EVIDENCE";
  contractVersion: "1.0.0";
  evidenceStatus: "PERSISTED_PRE_ADJUDICATION";
  diagnosticConfiguration: typeof RUN_ID;
  turn: TurnLabel;
  turnId: string;
  rawUserText: string;
  requestSnapshot: ProductBridgeRequest;
  provider: PersistentExtractionProviderArtifact["provider"];
  model: PersistentExtractionProviderArtifact["model"];
  functionName: PersistentExtractionProviderArtifact["functionName"];
  providerResponseId: string | null;
  receivedAt: string;
  promptContractDigest: string;
  exactStructuredProviderArgs: unknown;
  exactStructuredProviderArgsSerialized: string;
  exactStructuredProviderArgsDigest: string;
  calls: {
    conversation: { httpStatus: number; responseId: string | null; latencyMs: number; usage: unknown; assistantReply: string };
    extraction: { httpStatus: number; responseId: string | null; latencyMs: number; usage: unknown };
  };
  secretMaterialPersisted: false;
  adjudication: null;
};

const authority = {
  actorRef: "hands-on-02r3:diagnostic-researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const safeTurn = (value: string | undefined): TurnLabel => {
  if (value === "A" || value === "B" || value === "C") return value;
  throw new Error("TURN_LABEL_INVALID");
};

const writeNew = (path: string, value: unknown) => {
  mkdirSync(DIRECTORY, { recursive: true });
  const descriptor = openSync(path, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  } finally {
    closeSync(descriptor);
  }
};

const exactPath = (turn: TurnLabel) => join(DIRECTORY, `${turn.toLocaleLowerCase("en-US")}-provider-exact.json`);
const adjudicationPath = (turn: TurnLabel) => join(DIRECTORY, `${turn.toLocaleLowerCase("en-US")}-adjudication-aligned.json`);
const statePath = (turn: TurnLabel) => join(DIRECTORY, `${turn.toLocaleLowerCase("en-US")}-adopted-state.json`);

const previousTurn = (turn: TurnLabel): TurnLabel | null => turn === "A" ? null : turn === "B" ? "A" : "B";

const baseState = (turn: TurnLabel): HarnessState | null => {
  const previous = previousTurn(turn);
  return previous ? JSON.parse(readFileSync(statePath(previous), "utf8")) as HarnessState : null;
};

const requestFor = (turn: TurnLabel): ProductBridgeRequest => {
  const previous = baseState(turn);
  const conversation: ScientificInterpretationConversation = previous?.conversation ?? {
    conversationId: "project-hands-on-02r3:live-gate",
    language: "fr",
    turns: [],
  };
  return {
    apiVersion: "1.0.0",
    requestKind: "USER_TURN",
    conversation: {
      ...conversation,
      turns: [...conversation.turns, {
        turnId: `${RUN_ID}:${turn}:USER`,
        role: "USER",
        content: TURNS[turn],
        createdAt: new Date().toISOString(),
      }],
    },
    currentProject: previous?.project ?? null,
    evaluatePersistentDelta: true,
  };
};

const promptContractDigest = (request: ProductBridgeRequest) => {
  const payload = buildPersistentDeltaPayload(request);
  return logicalDigest({ systemInstruction: payload.systemInstruction, tools: payload.tools, toolConfig: payload.toolConfig });
};

const apiKey = () => {
  const environment = { ...loadEnv("production", WORKSPACE, ""), ...loadEnv("development", WORKSPACE, "") };
  const value = process.env.GEMINI_API_KEY?.trim() || environment.GEMINI_API_KEY?.trim() || "";
  if (!value) throw new Error("GEMINI_API_KEY_NOT_ACCESSIBLE");
  return value;
};

const persist = async (turn: TurnLabel) => {
  const request = requestFor(turn);
  const conversation = await executeNaturalConversation(request, apiKey());
  const extraction = await executePersistentDelta(request, apiKey());
  const artifact = extraction.value.providerArtifact;
  if (JSON.stringify(artifact.structuredArgsExact) !== artifact.structuredArgsSerialized) throw new Error("EXACT_ARGS_SERIALIZATION_MISMATCH");
  if (logicalDigest(artifact.structuredArgsSerialized) !== artifact.structuredArgsDigest) throw new Error("EXACT_ARGS_DIGEST_MISMATCH");
  const evidence: ExactEvidence = {
    contract: "PROJECT_HANDS_ON_02R3_PROVIDER_EXACT_EVIDENCE",
    contractVersion: "1.0.0",
    evidenceStatus: "PERSISTED_PRE_ADJUDICATION",
    diagnosticConfiguration: RUN_ID,
    turn,
    turnId: artifact.requestTurnRef,
    rawUserText: TURNS[turn],
    requestSnapshot: request,
    provider: artifact.provider,
    model: artifact.model,
    functionName: artifact.functionName,
    providerResponseId: artifact.providerResponseId,
    receivedAt: artifact.receivedAt,
    promptContractDigest: promptContractDigest(request),
    exactStructuredProviderArgs: artifact.structuredArgsExact,
    exactStructuredProviderArgsSerialized: artifact.structuredArgsSerialized,
    exactStructuredProviderArgsDigest: artifact.structuredArgsDigest,
    calls: {
      conversation: { httpStatus: conversation.httpStatus, responseId: conversation.responseId, latencyMs: conversation.latencyMs, usage: conversation.usage, assistantReply: conversation.value },
      extraction: { httpStatus: extraction.httpStatus, responseId: extraction.responseId, latencyMs: extraction.latencyMs, usage: extraction.usage },
    },
    secretMaterialPersisted: false,
    adjudication: null,
  };
  writeNew(exactPath(turn), evidence);
  const reloaded = JSON.parse(readFileSync(exactPath(turn), "utf8")) as ExactEvidence;
  if (reloaded.adjudication !== null || reloaded.exactStructuredProviderArgsDigest !== artifact.structuredArgsDigest) throw new Error("PERSISTED_PRE_ADJUDICATION_RELOAD_MISMATCH");
  return { path: exactPath(turn), digest: artifact.structuredArgsDigest, calls: evidence.calls };
};

const adjudicate = (turn: TurnLabel) => {
  const exact = JSON.parse(readFileSync(exactPath(turn), "utf8")) as ExactEvidence;
  if (exact.evidenceStatus !== "PERSISTED_PRE_ADJUDICATION" || exact.adjudication !== null) throw new Error("PRE_ADJUDICATION_CONTRACT_INVALID");
  if (JSON.stringify(exact.exactStructuredProviderArgs) !== exact.exactStructuredProviderArgsSerialized
    || logicalDigest(exact.exactStructuredProviderArgsSerialized) !== exact.exactStructuredProviderArgsDigest) throw new Error("EXACT_EVIDENCE_NOT_RECONSTRUCTIBLE");

  const providerContract = validatePersistentProviderContract(exact.exactStructuredProviderArgs);
  const checked = validatePersistentProjectDelta(
    exact.exactStructuredProviderArgs,
    exact.rawUserText,
    exact.requestSnapshot.currentProject,
    exact.requestSnapshot.conversation,
  );
  const validation = providerContract.valid ? checked.validation : {
    ...checked.validation,
    valid: false,
    blocks: [...checked.validation.blocks, ...providerContract.blocks],
  };
  const contribution = validation.valid && checked.candidate
    ? contributionFromPersistentDelta({
      candidate: checked.candidate,
      conversation: exact.requestSnapshot.conversation,
      currentProject: exact.requestSnapshot.currentProject,
      providerArtifact: {
        artifactRef: `gemini-structured-args:${exact.exactStructuredProviderArgsDigest}`,
        requestTurnRef: exact.turnId,
        provider: exact.provider,
        model: exact.model,
        functionName: exact.functionName,
        receivedAt: exact.receivedAt,
        providerResponseId: exact.providerResponseId,
        structuredArgsExact: exact.exactStructuredProviderArgs,
        structuredArgsSerialized: exact.exactStructuredProviderArgsSerialized,
        structuredArgsDigest: exact.exactStructuredProviderArgsDigest,
      },
    })
    : null;
  const prepared = contribution ? prepareResearchProjectContributionCandidate(contribution, exact.requestSnapshot.currentProject) : null;
  const output = {
    contract: "PROJECT_HANDS_ON_02R3_ADJUDICATION",
    contractVersion: "1.0.0",
    sourceEvidence: exactPath(turn),
    exactArgsDigest: exact.exactStructuredProviderArgsDigest,
    providerContract,
    wireCandidate: checked.wireCandidate,
    normalizedCandidate: checked.candidate,
    validation,
    contribution,
    canonicalProjectChangeSet: prepared?.canonicalChangeSet ?? null,
    humanReviewProjection: prepared?.humanReviewProjection ?? null,
  };
  writeNew(adjudicationPath(turn), output);
  return output;
};

const adopt = (turn: TurnLabel) => {
  const exact = JSON.parse(readFileSync(exactPath(turn), "utf8")) as ExactEvidence;
  const adjudication = JSON.parse(readFileSync(adjudicationPath(turn), "utf8")) as ReturnType<typeof adjudicate>;
  if (!adjudication.validation.valid || !adjudication.contribution || adjudication.humanReviewProjection?.status !== "COMPLETE") {
    throw new Error("HUMAN_DECISION_NOT_ALLOWED");
  }
  const project = confirmResearchProjectContribution({
    contribution: adjudication.contribution,
    current: exact.requestSnapshot.currentProject,
    projectId: exact.requestSnapshot.currentProject?.projectId ?? "project:project-hands-on-02r3-live-gate",
    authority,
    confirmedAt: new Date().toISOString(),
    reviewedProjection: adjudication.humanReviewProjection,
  });
  const conversation: ScientificInterpretationConversation = {
    ...exact.requestSnapshot.conversation,
    turns: [...exact.requestSnapshot.conversation.turns, {
      turnId: `${RUN_ID}:${turn}:NOXIA`,
      role: "NOXIA",
      content: exact.calls.conversation.assistantReply,
      createdAt: exact.receivedAt,
    }],
  };
  const state: HarnessState = { turn, project, conversation };
  writeNew(statePath(turn), state);
  return { statePath: statePath(turn), projectId: project.projectId, revision: project.revision, versionId: project.versionId, projectDigest: project.projectDigest };
};

const main = async () => {
  const [mode, rawTurn] = process.argv.slice(2);
  const turn = safeTurn(rawTurn);
  if (mode === "persist") return console.log(JSON.stringify({ mode, turn, ...(await persist(turn)) }));
  if (mode === "adjudicate") {
    const output = adjudicate(turn);
    return console.log(JSON.stringify({ mode, turn, path: adjudicationPath(turn), providerContract: output.providerContract, validation: output.validation, review: output.humanReviewProjection?.status ?? null }));
  }
  if (mode === "adopt") return console.log(JSON.stringify({ mode, turn, ...adopt(turn) }));
  throw new Error("HARNESS_MODE_INVALID");
};

await main();
