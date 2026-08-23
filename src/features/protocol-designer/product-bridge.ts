import { z } from "zod";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationConversation,
  ScientificInterpretationTurn,
} from "../scientific-interpretation/contracts.js";
import type {
  ResearchProjectOwnerProjection,
  ResearchProjectSectionId,
} from "../research-project-construction/contribution-owner-boundary.js";

export const PRODUCT_BRIDGE_API_VERSION = "1.0.0" as const;
export const PRODUCT_BRIDGE_MODEL = "gemini-3.5-flash-lite" as const;
export const PERSISTENT_PROJECT_DELTA_CONTRACT = "PERSISTENT_PROJECT_DELTA_CANDIDATE" as const;

/**
 * Product form of the instruction validated by ARCH-CONV-03V. The experimental
 * control note is deliberately absent: this call produces the researcher-facing
 * reply and nothing else.
 */
export const NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION = `Tu es l'interlocuteur méthodologique de NOXIA.

Tu aides un chercheur à construire un projet scientifique.

Réponds naturellement au message, comme dans une conversation entre le chercheur et un méthodologiste expérimenté.

Comprends le contexte scientifique, les corrections, les références au projet et les formulations elliptiques.

Ne transforme jamais une hypothèse plausible en information explicitement fournie par l'utilisateur.

Lorsqu'une ambiguïté méthodologiquement importante empêche de comprendre le projet, demande une clarification naturelle.

Lorsqu'une information est seulement plausible, tu peux la présenter comme piste ou question, jamais comme fait acquis.

Ne remplis pas artificiellement les informations manquantes.

Ne présente jamais comme établi un rôle scientifique que le chercheur n'a pas explicitement formulé et qui n'est pas déjà adopté dans le contexte fourni. Le fait qu'une mesure soit envisagée ne signifie pas qu'elle est le critère principal. Si un rôle paraît méthodologiquement plausible, présente-le comme une possibilité ou une question, jamais comme une décision acquise. Cette règle vaut génériquement pour tous les rôles scientifiques.

Lorsqu'une formulation reste scientifiquement elliptique, cherche d'abord quelle information manquante change réellement la signification ou la structure du projet. Distingue notamment ce qui est étudié de comment cela sera observé ou mesuré. Si l'objet, le phénomène ou la propriété scientifique étudié reste indéterminé, clarifie d'abord ce point avant d'approfondir les modalités ou détails techniques. Ne remplis jamais cette ambiguïté à la place du chercheur.

Tu peux comprendre, reformuler ou proposer une modification. Tu ne dois jamais dire qu'une modification du Research Project a été effectuée, enregistrée ou adoptée si le contexte ne confirme pas qu'une décision humaine et une mise à jour du Project ont réellement eu lieu. Utilise par exemple « je comprends que vous souhaitez… », « je retiens comme proposition… » ou « on peut modifier… », et non « j'ai modifié… » ou « je fais la modification… » si aucune adoption n'est démontrée.

Pas de JSON. Pas de labels internes. Pas de description de l'architecture NOXIA. Réponds directement à l'utilisateur.`;

export const PERSISTENT_DELTA_SYSTEM_INSTRUCTION = `Tu extrais uniquement les conséquences persistantes candidates pour le Research Project.

Utilise exclusivement les informations explicitement exprimées dans le DERNIER MESSAGE UTILISATEUR. Le Project adopté sert seulement à résoudre une référence ou constater un doublon. Le texte de l'assistant n'est pas fourni et ne peut jamais devenir une source.

Ignore la conversation, les demandes d'explication ou de reformulation, les méta-questions, le ton, les pistes plausibles et toute information non explicitement acceptée par l'utilisateur.

Une mention dans une question, une demande d'information, une hypothèse exploratoire, un exemple ou une proposition n'est pas un fait du Project. Extrais uniquement ce que l'utilisateur affirme explicitement comme appartenant à son projet ou ce qu'il demande explicitement d'ajouter, retirer ou corriger. Demander si, combien, quand ou comment un élément est prévu n'établit ni sa présence ni sa valeur dans le Project. En cas de doute entre une demande conversationnelle et une modification persistante, retourne une liste vide.

Pour chaque modification durable explicite, propose une opération minimale. Une correction ou suppression doit référencer l'identifiant stable exact de l'élément Project concerné. Une information inchangée déjà présente n'est pas une modification. Si aucune conséquence persistante explicite n'existe, retourne une liste vide.

Ne complète pas la science. Ne crée pas de rôle scientifique non formulé. Ne décide pas pour l'utilisateur. N'applique jamais le Project.`;

export const PROJECT_SECTION_IDS = [
  "POPULATION",
  "DESIGN",
  "INTERVENTION",
  "COMPARATOR",
  "IMAGING",
  "MEASUREMENTS",
  "TEMPORALITY",
  "ANALYSIS",
] as const satisfies readonly ResearchProjectSectionId[];

export const persistentProjectDeltaChangeSchema = z.object({
  operation: z.enum(["ADD", "REMOVE", "REPLACE"]),
  sourceText: z.string().min(1).max(4_000),
  targetSectionId: z.enum(PROJECT_SECTION_IDS),
  targetProjectRef: z.string().min(1).nullable(),
  content: z.string().min(1).max(4_000),
}).strict();

export const persistentProjectDeltaSchema = z.object({
  changes: z.array(persistentProjectDeltaChangeSchema).max(20),
}).strict();

export type PersistentProjectDeltaChange = z.infer<typeof persistentProjectDeltaChangeSchema>;
export type PersistentProjectDeltaCandidate = {
  contract: typeof PERSISTENT_PROJECT_DELTA_CONTRACT;
  contractVersion: "0.1.0";
  projectWriteAuthorized: false;
  changes: PersistentProjectDeltaChange[];
};

export type PersistentDeltaValidation = {
  valid: boolean;
  acceptedChanges: PersistentProjectDeltaChange[];
  blocks: string[];
  noOps: string[];
};

export type ProductBridgeRequest = {
  apiVersion: typeof PRODUCT_BRIDGE_API_VERSION;
  conversation: ScientificInterpretationConversation;
  currentProject: ResearchProjectOwnerProjection | null;
  evaluatePersistentDelta: boolean;
};

export type ProductBridgeResponse = {
  apiVersion: typeof PRODUCT_BRIDGE_API_VERSION;
  assistantReply: string;
  assistantTurn: ScientificInterpretationTurn;
  persistentExtraction: {
    called: boolean;
    status: "NOT_REQUESTED" | "NO_CHANGE" | "CANDIDATE" | "BLOCKED" | "TECHNICAL_FAILURE";
    candidate: PersistentProjectDeltaCandidate | null;
    validation: PersistentDeltaValidation | null;
    contribution: ScientificInterpretationContributionEnvelope | null;
  };
  observability: {
    provider: "GOOGLE_GEMINI";
    model: typeof PRODUCT_BRIDGE_MODEL;
    conversationLatencyMs: number;
    extractionLatencyMs: number | null;
    calls: 1 | 2;
    projectWrites: 0;
  };
};

const normalized = (value: string) => value.normalize("NFKC").toLocaleLowerCase("fr-FR").replace(/\s+/g, " ").trim();

const projectElements = (project: ResearchProjectOwnerProjection | null) => (project?.sections ?? [])
  .filter((section) => section.sectionId !== "QUESTION")
  .flatMap((section) => section.elements.map((element) => ({ sectionId: section.sectionId, element })));

export const validatePersistentProjectDelta = (
  value: unknown,
  rawUserTurn: string,
  project: ResearchProjectOwnerProjection | null,
): { candidate: PersistentProjectDeltaCandidate | null; validation: PersistentDeltaValidation } => {
  const parsed = persistentProjectDeltaSchema.safeParse(value);
  if (!parsed.success) return {
    candidate: null,
    validation: { valid: false, acceptedChanges: [], blocks: ["PERSISTENT_DELTA_CONTRACT_INVALID"], noOps: [] },
  };

  const elements = projectElements(project);
  const acceptedChanges: PersistentProjectDeltaChange[] = [];
  const blocks: string[] = [];
  const noOps: string[] = [];
  const signatures = new Set<string>();

  parsed.data.changes.forEach((change, index) => {
    const prefix = `change:${index}`;
    if (!rawUserTurn.includes(change.sourceText)) {
      blocks.push(`${prefix}:SOURCE_TEXT_NOT_IN_USER_TURN`);
      return;
    }
    const target = change.targetProjectRef
      ? elements.find(({ element }) => element.elementId === change.targetProjectRef)
      : null;
    if (change.operation === "ADD" && change.targetProjectRef !== null) {
      blocks.push(`${prefix}:ADD_MUST_NOT_TARGET_EXISTING_REF`);
      return;
    }
    if (change.operation !== "ADD" && (!target || target.sectionId !== change.targetSectionId)) {
      blocks.push(`${prefix}:PROJECT_REF_INVALID_OR_SECTION_MISMATCH`);
      return;
    }
    if (change.operation === "REPLACE" && target && normalized(target.element.content) === normalized(change.content)) {
      noOps.push(`${prefix}:REPLACE_NO_NET_CHANGE`);
      return;
    }
    if (change.operation === "ADD" && elements.some(({ sectionId, element }) => sectionId === change.targetSectionId
      && normalized(element.content) === normalized(change.content))) {
      noOps.push(`${prefix}:DUPLICATE_EXISTING_ELEMENT`);
      return;
    }
    const signature = `${change.operation}:${change.targetSectionId}:${change.targetProjectRef ?? "NEW"}:${normalized(change.content)}`;
    if (signatures.has(signature)) {
      noOps.push(`${prefix}:DUPLICATE_CANDIDATE_CHANGE`);
      return;
    }
    signatures.add(signature);
    acceptedChanges.push(change);
  });

  const validation = { valid: blocks.length === 0, acceptedChanges, blocks, noOps };
  return {
    candidate: blocks.length ? null : {
      contract: PERSISTENT_PROJECT_DELTA_CONTRACT,
      contractVersion: "0.1.0",
      projectWriteAuthorized: false,
      changes: acceptedChanges,
    },
    validation,
  };
};

const typeForSection: Record<(typeof PROJECT_SECTION_IDS)[number], string> = {
  POPULATION: "ELIGIBILITY_CRITERION",
  DESIGN: "STUDY_DESIGN",
  INTERVENTION: "INTERVENTION",
  COMPARATOR: "COMPARATOR",
  IMAGING: "MODALITY",
  MEASUREMENTS: "MEASUREMENT",
  TEMPORALITY: "TIMEPOINT",
  ANALYSIS: "ANALYSIS_INTENT",
};

const itemFromChange = (input: {
  change: PersistentProjectDeltaChange;
  index: number;
  turn: ScientificInterpretationTurn;
  project: ResearchProjectOwnerProjection | null;
}): ScientificContributionItem => {
  const target = projectElements(input.project).find(({ element }) => element.elementId === input.change.targetProjectRef)?.element ?? null;
  const itemId = `persistent-delta-item:${logicalDigest({ turnId: input.turn.turnId, index: input.index, change: input.change })}`;
  return {
    itemId,
    semanticIdentity: target?.elementId ?? itemId,
    proposedType: target?.sourceProposedType ?? typeForSection[input.change.targetSectionId],
    content: input.change.operation === "REMOVE" && target ? target.content : input.change.content,
    polarity: input.change.operation === "REMOVE" ? "NEGATED" : "AFFIRMED",
    studyRole: target?.sourceStudyRole ?? null,
    confidence: 1,
    previousItemIds: input.change.targetProjectRef ? [input.change.targetProjectRef] : [],
    epistemicBoundary: {
      ownership: "USER",
      epistemicStatus: "EXPLICIT_USER_STATED",
      adoptionStatus: "CANDIDATE",
      activeState: input.change.operation !== "REMOVE",
      sourceTurnIds: [input.turn.turnId],
      sourceText: input.change.sourceText,
    },
  };
};

export const contributionFromPersistentDelta = (input: {
  candidate: PersistentProjectDeltaCandidate;
  conversation: ScientificInterpretationConversation;
  currentProject: ResearchProjectOwnerProjection | null;
  createdAt?: string;
}): ScientificInterpretationContributionEnvelope | null => {
  if (!input.candidate.changes.length) return null;
  const lastUserTurn = [...input.conversation.turns].reverse().find((turn) => turn.role === "USER");
  if (!lastUserTurn) return null;
  const createdAt = input.createdAt ?? new Date().toISOString();
  const items = input.candidate.changes.map((change, index) => itemFromChange({
    change,
    index,
    turn: lastUserTurn,
    project: input.currentProject,
  }));
  const candidateObjects = items.filter((_, index) => input.candidate.changes[index]?.targetSectionId !== "TEMPORALITY");
  const temporalElements = items.filter((_, index) => input.candidate.changes[index]?.targetSectionId === "TEMPORALITY");
  const correctionsAndSupersessions = items.filter((_, index) => input.candidate.changes[index]?.operation !== "ADD");
  const contributionId = `persistent-project-contribution:${logicalDigest({
    conversationId: input.conversation.conversationId,
    turnId: lastUserTurn.turnId,
    changes: input.candidate.changes,
    baseProject: input.currentProject?.versionId ?? null,
  })}`;
  const contributionDigest = logicalDigest({ contributionId, candidate: input.candidate, items });
  return {
    contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
    contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: {
      contributionId,
      previousContributionId: input.currentProject?.contributionRef ?? null,
      contractVersion: "1.0.0",
      runtimeId: "MINIMAL_PRODUCT_BRIDGE_PERSISTENT_DELTA",
      runtimeVersion: "0.1.0",
      createdAt,
      contributionDigest,
    },
    source: {
      conversationId: input.conversation.conversationId,
      originalRequest: lastUserTurn.content,
      turns: input.conversation.turns,
      sourceRefs: [lastUserTurn.turnId],
      rawOutputRef: null,
      rawOutputDigest: null,
    },
    runtimeEvidence: {
      provider: "GOOGLE_GEMINI",
      model: PRODUCT_BRIDGE_MODEL,
      promptDigest: logicalDigest(PERSISTENT_DELTA_SYSTEM_INSTRUCTION),
      schemaDigest: logicalDigest(persistentProjectDeltaSchema.toString()),
      configurationDigest: logicalDigest({ model: PRODUCT_BRIDGE_MODEL, mode: "REQUIRED_FUNCTION_CALL", version: "0.1.0" }),
      technicalStatus: "STRUCTURED_CONTRACT_VALID",
      parseStatus: "PARSED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: null,
      routeProposal: null,
      explicitStatements: [],
      candidateObjects,
      candidateRelations: [],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      temporalElements,
      ambiguities: [],
      unknowns: [],
      missingInformation: [],
      correctionsAndSupersessions,
      openDecisions: [],
      clarificationNeeds: [],
    },
    epistemicBoundary: {
      candidateIsAdopted: false,
      knowledgeSupportIsProjectDecision: false,
      projectOwnershipTransferred: false,
      humanDecisionEnvelopeRef: null,
    },
    mapping: items.map((item) => ({
      sourceItemId: item.itemId,
      proposedTargetDomain: "RESEARCH_PROJECT",
      proposedTargetTypes: [item.proposedType ?? "PROJECT_INFORMATION"],
      mappingStatus: "EXACT_CONTRIBUTION",
      qualificationOwnerRequired: null,
      mappingLimitations: [],
    })),
    audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
    decisionBoundary: {
      decisionRequired: true,
      decisionEnvelopeRef: null,
      permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN", "PARTIAL_SELECTION", "ROUTE_TO_SPECIALIST"],
      projectWriteAuthorized: false,
    },
  };
};

export const relevantProjectContext = (project: ResearchProjectOwnerProjection | null) => project ? {
  projectId: project.projectId,
  versionId: project.versionId,
  revision: project.revision,
  sections: project.sections.filter((section) => section.sectionId !== "QUESTION").map((section) => ({
    sectionId: section.sectionId,
    label: section.label,
    elements: section.elements.map((element) => ({
      stableId: element.elementId,
      semanticKey: element.semanticKey ?? null,
      content: element.content,
      scientificType: element.sourceProposedType ?? null,
      scientificRole: element.sourceStudyRole ?? null,
    })),
  })),
} : null;

export const parseProductBridgeRequest = (value: unknown): ProductBridgeRequest | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<ProductBridgeRequest>;
  if (record.apiVersion !== PRODUCT_BRIDGE_API_VERSION
    || typeof record.evaluatePersistentDelta !== "boolean"
    || !record.conversation
    || typeof record.conversation.conversationId !== "string"
    || !["fr", "en"].includes(record.conversation.language)
    || !Array.isArray(record.conversation.turns)
    || !record.conversation.turns.length
    || !record.conversation.turns.every((turn) => turn && typeof turn.turnId === "string"
      && ["USER", "NOXIA"].includes(turn.role)
      && typeof turn.content === "string" && turn.content.trim().length > 0 && turn.content.length <= 4_000)) return null;
  if (record.currentProject !== null && record.currentProject?.contract !== "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION") return null;
  return record as ProductBridgeRequest;
};
