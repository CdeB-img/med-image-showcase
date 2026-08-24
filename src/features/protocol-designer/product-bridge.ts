import { z } from "zod";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationConversation,
  ScientificInterpretationTurn,
  ScientificTemporalAnchorCandidate,
} from "../scientific-interpretation/contracts.js";
import type {
  ResearchProjectOwnerProjection,
  ResearchProjectSectionId,
} from "../research-project-construction/contribution-owner-boundary.js";
import {
  buildProjectContextSnapshot,
  ensureCanonicalProjectState,
} from "../research-project-construction/canonical-project-backbone.js";

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

export const PERSISTENT_DELTA_SYSTEM_INSTRUCTION = `Tu extrais uniquement les conséquences scientifiques persistantes candidates pour le Research Project.

Le DERNIER MESSAGE UTILISATEUR est la source de l'assertion ou de l'adoption. Le Project adopté sert seulement à résoudre une référence, une correction ou un doublon. Les propositions récentes de NOXIA ne peuvent devenir une source scientifique que si le dernier message utilisateur les accepte explicitement ; conserve alors séparément le texte de la proposition et le texte de l'adoption.

Ignore la conversation, les demandes d'explication ou de reformulation, les méta-questions, le ton, les pistes plausibles et toute information non explicitement acceptée par l'utilisateur.

Une mention dans une question, une demande d'information, une hypothèse exploratoire, un exemple ou une proposition n'est pas un fait du Project. Extrais uniquement ce que l'utilisateur affirme explicitement comme appartenant à son projet ou ce qu'il demande explicitement d'ajouter, retirer ou corriger. Demander si, combien, quand ou comment un élément est prévu n'établit ni sa présence ni sa valeur dans le Project. En cas de doute entre une demande conversationnelle et une modification persistante, retourne une liste vide.

Pour chaque modification durable explicite, propose une opération minimale et un objet scientifique typé. Préserve les rôles, hypothèses, comparaisons, temporalités, négations et relations explicitement formulés.

ADD crée une nouvelle identité scientifique : targetProjectRef doit alors être null. Un objet Project existant seulement utile comme contexte n'est jamais la cible de ADD ; référence-le dans une relation.

Une temporalité portant sur un objet Project existant n'est jamais un nouvel objet autonome. Utilise temporalQualifications avec l'identifiant stable de l'objet porteur, un rôle temporel typé et un anchor structuré. Pour « l'IRM sera réalisée entre J3 et J5 » sur une Acquisition IRM existante, propose ACQUISITION_TIME avec une fenêtre J3–J5 ; si le référentiel de J0 n'est pas fourni, conserve reference.status = UNKNOWN et n'invente aucune relation ANCHORED_TO.

Une occasion attendue de mesure utilise expectedVariableOccasions et référence une CANONICAL_VARIABLE stable. Elle ne crée ni nouvelle variable ni valeur observée. EXPECTED_AT ne s'applique pas à une modalité ou à une Acquisition.

REPLACE et REMOVE modifient l'objet existant désigné par targetProjectRef, qui doit être l'identifiant stable exact fourni dans les objets canoniques du Project. Une section ou un libellé n'est qu'une projection et ne remplace jamais cet identifiant stable.

Un changement de rôle scientifique ne remplace pas l'identité scientifique. Si l'utilisateur désigne un nouveau critère principal, conserve les objets distincts : retire explicitement le rôle principal de l'ancien objet avec REPLACE et studyRole null, puis attribue PRIMARY_ENDPOINT au nouvel objet par REPLACE s'il existe déjà ou ADD s'il est réellement nouveau. Ne déduis pas un rôle secondaire non formulé.

Une relation référence uniquement un objet candidat de cette même sortie ou un identifiant stable du Project fourni. Une information inchangée déjà présente n'est pas une modification. Si aucune conséquence persistante explicite n'existe, retourne des listes vides.

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
  targetSectionId: z.enum(PROJECT_SECTION_IDS).optional(),
  targetProjectRef: z.string().min(1).nullable(),
  content: z.string().min(1).max(4_000),
  candidateRef: z.string().min(1).max(300).optional(),
  semanticIdentity: z.string().min(1).max(300).nullable().optional(),
  proposedType: z.string().min(1).max(120).optional(),
  polarity: z.enum(["AFFIRMED", "NEGATED", "UNKNOWN"]).optional(),
  studyRole: z.string().min(1).max(120).nullable().optional(),
  epistemicStatus: z.enum(["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER", "SUPPORTED_CANDIDATE", "UNKNOWN", "AMBIGUOUS"]).optional(),
  assertionKind: z.enum(["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"]).optional(),
  proposalSourceText: z.string().min(1).max(4_000).nullable().optional(),
  evidenceRefs: z.array(z.string().min(1).max(500)).max(20).optional(),
}).strict();

export const persistentProjectRelationSchema = z.object({
  relationRef: z.string().min(1).max(300),
  sourceText: z.string().min(1).max(4_000),
  relationType: z.string().min(1).max(120),
  sourceObjectRef: z.string().min(1).max(300),
  targetObjectRef: z.string().min(1).max(300),
  polarity: z.enum(["AFFIRMED", "NEGATED", "UNKNOWN"]),
  epistemicStatus: z.enum(["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER", "SUPPORTED_CANDIDATE", "UNKNOWN", "AMBIGUOUS"]),
  assertionKind: z.enum(["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"]),
  proposalSourceText: z.string().min(1).max(4_000).nullable(),
  evidenceRefs: z.array(z.string().min(1).max(500)).max(20),
}).strict();

export const persistentTemporalAnchorSchema = z.object({
  kind: z.enum(["TIMEPOINT", "RELATIVE_EVENT", "WINDOW", "INTERVAL"]),
  direction: z.enum(["BEFORE", "AT", "AFTER", "UNKNOWN"]),
  unit: z.string().min(1).max(40),
  offset: z.number().finite().nullable(),
  lowerBound: z.number().finite().nullable(),
  upperBound: z.number().finite().nullable(),
  relativeEventLabel: z.string().min(1).max(300).nullable(),
  tolerance: z.object({
    lower: z.number().finite().nullable(),
    upper: z.number().finite().nullable(),
    unit: z.string().min(1).max(40),
  }).strict().nullable(),
  reference: z.discriminatedUnion("status", [
    z.object({ status: z.literal("KNOWN"), referenceProjectRef: z.string().min(1).max(300) }).strict(),
    z.object({ status: z.literal("UNKNOWN"), unresolvedReason: z.enum(["REFERENCE_EVENT_NOT_SUPPLIED", "REFERENCE_EVENT_AMBIGUOUS"]) }).strict(),
  ]),
}).strict();

export const persistentTemporalQualificationSchema = z.object({
  operation: z.enum(["ADD", "REMOVE", "REPLACE"]),
  qualificationId: z.string().min(1).max(300),
  sourceText: z.string().min(1).max(4_000),
  subjectProjectRef: z.string().min(1).max(300),
  temporalRole: z.enum(["ACQUISITION_TIME", "COLLECTION_TIME", "PROCESSING_TIME", "TRANSFORMATION_TIME", "ANALYSIS_TIME"]),
  anchor: persistentTemporalAnchorSchema.nullable(),
  assertionKind: z.enum(["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"]),
  proposalSourceText: z.string().min(1).max(4_000).nullable(),
  evidenceRefs: z.array(z.string().min(1).max(500)).max(20),
}).strict();

export const persistentExpectedVariableOccasionSchema = z.object({
  operation: z.enum(["ADD", "REMOVE", "REPLACE"]),
  occasionId: z.string().min(1).max(300),
  sourceText: z.string().min(1).max(4_000),
  variableProjectRef: z.string().min(1).max(300),
  anchor: persistentTemporalAnchorSchema.nullable(),
  studyUnitOrGroupRef: z.string().min(1).max(300).nullable(),
  applicableContext: z.string().min(1).max(1_000).nullable(),
  assertionKind: z.enum(["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"]),
  proposalSourceText: z.string().min(1).max(4_000).nullable(),
  evidenceRefs: z.array(z.string().min(1).max(500)).max(20),
}).strict();

export const persistentProjectDeltaSchema = z.object({
  changes: z.array(persistentProjectDeltaChangeSchema).max(20).default([]),
  relations: z.array(persistentProjectRelationSchema).max(30).default([]),
  temporalQualifications: z.array(persistentTemporalQualificationSchema).max(20).default([]),
  expectedVariableOccasions: z.array(persistentExpectedVariableOccasionSchema).max(30).default([]),
}).strict();

export type PersistentProjectDeltaChange = z.infer<typeof persistentProjectDeltaChangeSchema>;
export type PersistentProjectRelation = z.infer<typeof persistentProjectRelationSchema>;
export type PersistentTemporalQualification = z.infer<typeof persistentTemporalQualificationSchema>;
export type PersistentExpectedVariableOccasion = z.infer<typeof persistentExpectedVariableOccasionSchema>;
export type PersistentProjectDeltaCandidate = {
  contract: typeof PERSISTENT_PROJECT_DELTA_CONTRACT;
  contractVersion: "0.3.0";
  projectWriteAuthorized: false;
  changes: PersistentProjectDeltaChange[];
  relations: PersistentProjectRelation[];
  temporalQualifications: PersistentTemporalQualification[];
  expectedVariableOccasions: PersistentExpectedVariableOccasion[];
};

export type PersistentDeltaValidation = {
  valid: boolean;
  acceptedChanges: PersistentProjectDeltaChange[];
  acceptedRelations: PersistentProjectRelation[];
  acceptedTemporalQualifications: PersistentTemporalQualification[];
  acceptedExpectedVariableOccasions: PersistentExpectedVariableOccasion[];
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

const projectElements = (project: ResearchProjectOwnerProjection | null) => project
  ? ensureCanonicalProjectState(project).objects
    .filter((object) => object.actuality === "CURRENT" && object.sectionId !== "QUESTION")
    .map((object) => ({
      sectionId: object.sectionId,
      element: {
        ...object.projection,
        elementId: object.objectId,
        sourceProposedType: object.projection.sourceProposedType ?? object.objectType,
        sourceStudyRole: object.scientificRole,
      },
    }))
  : [];

export const validatePersistentProjectDelta = (
  value: unknown,
  rawUserTurn: string,
  project: ResearchProjectOwnerProjection | null,
  conversation?: ScientificInterpretationConversation,
): { candidate: PersistentProjectDeltaCandidate | null; validation: PersistentDeltaValidation } => {
  const parsed = persistentProjectDeltaSchema.safeParse(value);
  if (!parsed.success) return {
    candidate: null,
    validation: {
      valid: false,
      acceptedChanges: [],
      acceptedRelations: [],
      acceptedTemporalQualifications: [],
      acceptedExpectedVariableOccasions: [],
      blocks: ["PERSISTENT_DELTA_CONTRACT_INVALID"],
      noOps: [],
    },
  };

  const elements = projectElements(project);
  const canonicalState = project ? ensureCanonicalProjectState(project) : null;
  const acceptedChanges: PersistentProjectDeltaChange[] = [];
  const acceptedRelations: PersistentProjectRelation[] = [];
  const acceptedTemporalQualifications: PersistentTemporalQualification[] = [];
  const acceptedExpectedVariableOccasions: PersistentExpectedVariableOccasion[] = [];
  const blocks: string[] = [];
  const noOps: string[] = [];
  const signatures = new Set<string>();
  const candidateRefs = new Set<string>();
  const recentAssistantText = (conversation?.turns ?? []).filter((turn) => turn.role === "NOXIA");

  const validateAssertion = (input: {
    prefix: string;
    assertionKind?: "USER_STATED" | "USER_ADOPTED_PROPOSAL" | "OWNER_SUPPORTED";
    proposalSourceText?: string | null;
    evidenceRefs?: string[];
  }) => {
    const assertionKind = input.assertionKind ?? "USER_STATED";
    if (assertionKind === "USER_ADOPTED_PROPOSAL") {
      if (!input.proposalSourceText || !recentAssistantText.some((turn) => turn.content.includes(input.proposalSourceText!))) {
        blocks.push(`${input.prefix}:ADOPTED_PROPOSAL_SOURCE_NOT_IN_ASSISTANT_CONTEXT`);
        return false;
      }
    }
    if (assertionKind === "OWNER_SUPPORTED" && !(input.evidenceRefs?.length)) {
      blocks.push(`${input.prefix}:OWNER_SUPPORTED_EVIDENCE_REQUIRED`);
      return false;
    }
    return true;
  };

  parsed.data.changes.forEach((change, index) => {
    const prefix = `change:${index}`;
    if (!rawUserTurn.includes(change.sourceText)) {
      blocks.push(`${prefix}:SOURCE_TEXT_NOT_IN_USER_TURN`);
      return;
    }
    if (!validateAssertion({ prefix, assertionKind: change.assertionKind, proposalSourceText: change.proposalSourceText, evidenceRefs: change.evidenceRefs })) return;
    if (change.candidateRef) {
      if (candidateRefs.has(change.candidateRef)) {
        blocks.push(`${prefix}:DUPLICATE_CANDIDATE_REF`);
        return;
      }
      candidateRefs.add(change.candidateRef);
    }
    const target = change.targetProjectRef
      ? elements.find(({ element }) => element.elementId === change.targetProjectRef)
      : null;
    if (change.operation === "ADD" && change.targetProjectRef !== null) {
      blocks.push(`${prefix}:ADD_MUST_NOT_TARGET_EXISTING_REF`);
      return;
    }
    if (change.operation === "ADD" && [change.candidateRef, change.semanticIdentity]
      .some((ref) => ref && elements.some(({ element }) => element.elementId === ref))) {
      blocks.push(`${prefix}:ADD_MUST_USE_NEW_IDENTITY`);
      return;
    }
    if (change.operation !== "ADD" && !target) {
      blocks.push(`${prefix}:PROJECT_REF_INVALID`);
      return;
    }
    const targetRole = target?.element.sourceStudyRole ?? null;
    const proposedRole = change.studyRole === undefined ? targetRole : change.studyRole;
    const targetType = target?.element.sourceProposedType ?? null;
    const proposedType = change.proposedType ?? targetType;
    const targetPolarity = target?.element.sourcePolarity ?? "AFFIRMED";
    const proposedPolarity = change.polarity ?? targetPolarity;
    if (change.operation === "REPLACE" && target
      && normalized(target.element.content) === normalized(change.content)
      && normalized(targetRole ?? "") === normalized(proposedRole ?? "")
      && normalized(targetType ?? "") === normalized(proposedType ?? "")
      && normalized(targetPolarity) === normalized(proposedPolarity)) {
      noOps.push(`${prefix}:REPLACE_NO_NET_CHANGE`);
      return;
    }
    if (change.operation === "ADD" && elements.some(({ sectionId, element }) => (!change.targetSectionId || sectionId === change.targetSectionId)
      && normalized(element.content) === normalized(change.content))) {
      noOps.push(`${prefix}:DUPLICATE_EXISTING_ELEMENT`);
      return;
    }
    const signature = `${change.operation}:${change.targetSectionId ?? change.proposedType ?? "UNCLASSIFIED"}:${change.targetProjectRef ?? "NEW"}:${normalized(change.content)}`;
    if (signatures.has(signature)) {
      noOps.push(`${prefix}:DUPLICATE_CANDIDATE_CHANGE`);
      return;
    }
    signatures.add(signature);
    acceptedChanges.push(change);
  });

  const allowedObjectRefs = new Set([
    ...elements.map(({ element }) => element.elementId),
    ...acceptedChanges.flatMap((change) => [change.candidateRef, change.semanticIdentity, change.targetProjectRef].filter((ref): ref is string => Boolean(ref))),
  ]);
  (parsed.data.relations ?? []).forEach((relation, index) => {
    const prefix = `relation:${index}`;
    if (!rawUserTurn.includes(relation.sourceText)) {
      blocks.push(`${prefix}:SOURCE_TEXT_NOT_IN_USER_TURN`);
      return;
    }
    if (!validateAssertion({ prefix, assertionKind: relation.assertionKind, proposalSourceText: relation.proposalSourceText, evidenceRefs: relation.evidenceRefs })) return;
    const missing = [relation.sourceObjectRef, relation.targetObjectRef].filter((ref) => !allowedObjectRefs.has(ref));
    if (missing.length) {
      blocks.push(`${prefix}:PROJECT_RELATION_ENDPOINT_INVALID`);
      return;
    }
    const signature = `${relation.relationType}:${relation.sourceObjectRef}:${relation.targetObjectRef}:${relation.polarity}`;
    if (signatures.has(signature)) {
      noOps.push(`${prefix}:DUPLICATE_CANDIDATE_RELATION`);
      return;
    }
    signatures.add(signature);
    acceptedRelations.push(relation);
  });

  const currentObjectType = new Map(canonicalState?.objects
    .filter((object) => object.actuality === "CURRENT")
    .map((object) => [object.objectId, object.objectType] as const) ?? []);
  const currentTemporalQualifications = canonicalState?.temporalQualifications.filter((item) => item.actuality === "CURRENT") ?? [];
  const currentExpectedOccasions = canonicalState?.expectedVariableOccasions.filter((item) => item.actuality === "CURRENT") ?? [];

  const validateAnchor = (anchor: z.infer<typeof persistentTemporalAnchorSchema> | null, prefix: string) => {
    if (!anchor) {
      blocks.push(`${prefix}:TEMPORAL_ANCHOR_REQUIRED`);
      return false;
    }
    if ((anchor.kind === "WINDOW" || anchor.kind === "INTERVAL")
      && (anchor.lowerBound === null || anchor.upperBound === null || anchor.lowerBound > anchor.upperBound)) {
      blocks.push(`${prefix}:TEMPORAL_ANCHOR_BOUNDS_INVALID`);
      return false;
    }
    if (anchor.kind === "TIMEPOINT" && anchor.offset === null) {
      blocks.push(`${prefix}:TEMPORAL_ANCHOR_OFFSET_REQUIRED`);
      return false;
    }
    if (anchor.reference.status === "KNOWN" && !currentObjectType.has(anchor.reference.referenceProjectRef)) {
      blocks.push(`${prefix}:TEMPORAL_REFERENCE_INVALID`);
      return false;
    }
    return true;
  };

  parsed.data.temporalQualifications.forEach((qualification, index) => {
    const prefix = `temporalQualification:${index}`;
    if (!rawUserTurn.includes(qualification.sourceText)) {
      blocks.push(`${prefix}:SOURCE_TEXT_NOT_IN_USER_TURN`);
      return;
    }
    if (!validateAssertion({ prefix, assertionKind: qualification.assertionKind, proposalSourceText: qualification.proposalSourceText, evidenceRefs: qualification.evidenceRefs })) return;
    const subjectType = currentObjectType.get(qualification.subjectProjectRef);
    if (!subjectType) {
      blocks.push(`${prefix}:PROJECT_REF_INVALID`);
      return;
    }
    if (qualification.temporalRole === "ACQUISITION_TIME" && subjectType !== "ACQUISITION") {
      blocks.push(`${prefix}:TEMPORAL_ROLE_SUBJECT_MISMATCH`);
      return;
    }
    if (qualification.temporalRole === "ANALYSIS_TIME" && subjectType !== "ANALYSIS_SPECIFICATION") {
      blocks.push(`${prefix}:TEMPORAL_ROLE_SUBJECT_MISMATCH`);
      return;
    }
    const previous = currentTemporalQualifications.find((item) => item.qualificationId === qualification.qualificationId) ?? null;
    if (qualification.operation === "ADD" && previous) {
      noOps.push(`${prefix}:QUALIFICATION_ALREADY_EXISTS`);
      return;
    }
    if (qualification.operation !== "ADD" && !previous) {
      blocks.push(`${prefix}:TEMPORAL_QUALIFICATION_REF_INVALID`);
      return;
    }
    if (previous && (previous.subjectProjectRef !== qualification.subjectProjectRef || previous.temporalRole !== qualification.temporalRole)) {
      blocks.push(`${prefix}:TEMPORAL_ROLE_SUBJECT_MISMATCH`);
      return;
    }
    if (qualification.operation !== "REMOVE" && !validateAnchor(qualification.anchor, prefix)) return;
    if (qualification.operation === "REMOVE" && qualification.anchor !== null) {
      blocks.push(`${prefix}:REMOVE_MUST_NOT_CARRY_ANCHOR`);
      return;
    }
    acceptedTemporalQualifications.push(qualification);
  });

  parsed.data.expectedVariableOccasions.forEach((occasion, index) => {
    const prefix = `expectedVariableOccasion:${index}`;
    if (!rawUserTurn.includes(occasion.sourceText)) {
      blocks.push(`${prefix}:SOURCE_TEXT_NOT_IN_USER_TURN`);
      return;
    }
    if (!validateAssertion({ prefix, assertionKind: occasion.assertionKind, proposalSourceText: occasion.proposalSourceText, evidenceRefs: occasion.evidenceRefs })) return;
    if (currentObjectType.get(occasion.variableProjectRef) !== "CANONICAL_VARIABLE") {
      blocks.push(`${prefix}:EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE`);
      return;
    }
    if (occasion.studyUnitOrGroupRef && !currentObjectType.has(occasion.studyUnitOrGroupRef)) {
      blocks.push(`${prefix}:EXPECTED_OCCASION_CONTEXT_REF_INVALID`);
      return;
    }
    const previous = currentExpectedOccasions.find((item) => item.occasionId === occasion.occasionId) ?? null;
    if (occasion.operation === "ADD" && previous) {
      noOps.push(`${prefix}:EXPECTED_OCCASION_ALREADY_EXISTS`);
      return;
    }
    if (occasion.operation !== "ADD" && !previous) {
      blocks.push(`${prefix}:EXPECTED_OCCASION_REF_INVALID`);
      return;
    }
    if (previous && previous.variableProjectRef !== occasion.variableProjectRef) {
      blocks.push(`${prefix}:EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE`);
      return;
    }
    if (occasion.operation !== "REMOVE" && !validateAnchor(occasion.anchor, prefix)) return;
    if (occasion.operation === "REMOVE" && occasion.anchor !== null) {
      blocks.push(`${prefix}:REMOVE_MUST_NOT_CARRY_ANCHOR`);
      return;
    }
    acceptedExpectedVariableOccasions.push(occasion);
  });

  const validation = {
    valid: blocks.length === 0,
    acceptedChanges,
    acceptedRelations,
    acceptedTemporalQualifications,
    acceptedExpectedVariableOccasions,
    blocks,
    noOps,
  };
  return {
    candidate: blocks.length ? null : {
      contract: PERSISTENT_PROJECT_DELTA_CONTRACT,
      contractVersion: "0.3.0",
      projectWriteAuthorized: false,
      changes: acceptedChanges,
      relations: acceptedRelations,
      temporalQualifications: acceptedTemporalQualifications,
      expectedVariableOccasions: acceptedExpectedVariableOccasions,
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
  conversation: ScientificInterpretationConversation;
  project: ResearchProjectOwnerProjection | null;
}): ScientificContributionItem => {
  const target = projectElements(input.project).find(({ element }) => element.elementId === input.change.targetProjectRef)?.element ?? null;
  const itemId = input.change.candidateRef ?? `persistent-delta-item:${logicalDigest({ turnId: input.turn.turnId, index: input.index, change: input.change })}`;
  const assertionKind = input.change.assertionKind ?? "USER_STATED";
  const proposalTurn = assertionKind === "USER_ADOPTED_PROPOSAL" && input.change.proposalSourceText
    ? [...input.conversation.turns].reverse().find((turn) => turn.role === "NOXIA" && turn.content.includes(input.change.proposalSourceText!)) ?? null
    : null;
  const sourceTurnIds = [...new Set([proposalTurn?.turnId, input.turn.turnId].filter((ref): ref is string => Boolean(ref)))];
  return {
    itemId,
    semanticIdentity: target?.elementId ?? input.change.semanticIdentity ?? itemId,
    proposedType: target?.sourceProposedType ?? input.change.proposedType ?? typeForSection[input.change.targetSectionId ?? "ANALYSIS"],
    content: input.change.operation === "REMOVE" && target ? target.content : input.change.content,
    polarity: input.change.operation === "REMOVE" ? "NEGATED" : input.change.polarity ?? "AFFIRMED",
    studyRole: input.change.studyRole === undefined ? target?.sourceStudyRole ?? null : input.change.studyRole,
    confidence: 1,
    previousItemIds: input.change.targetProjectRef ? [input.change.targetProjectRef] : [],
    evidenceRefs: [...(input.change.evidenceRefs ?? [])],
    epistemicBoundary: {
      ownership: assertionKind === "USER_ADOPTED_PROPOSAL" ? "NOXIA" : assertionKind === "OWNER_SUPPORTED" ? "OWNER" : "USER",
      epistemicStatus: assertionKind === "USER_ADOPTED_PROPOSAL"
        ? "CONFIRMED_BY_USER"
        : assertionKind === "OWNER_SUPPORTED"
          ? "SUPPORTED_CANDIDATE"
          : input.change.epistemicStatus ?? "EXPLICIT_USER_STATED",
      adoptionStatus: "CANDIDATE",
      originType: assertionKind === "USER_ADOPTED_PROPOSAL" ? "ASSISTANT_PROPOSAL" : assertionKind,
      originStatus: assertionKind === "USER_ADOPTED_PROPOSAL" ? "USER_EXPLICITLY_ADOPTED" : "PERSISTENT_EXTRACTION_CANDIDATE",
      activeState: input.change.operation !== "REMOVE",
      sourceTurnIds,
      sourceText: input.change.sourceText,
    },
  };
};

const relationFromPersistentCandidate = (input: {
  relation: PersistentProjectRelation;
  turn: ScientificInterpretationTurn;
  conversation: ScientificInterpretationConversation;
}) => {
  const proposalTurn = input.relation.assertionKind === "USER_ADOPTED_PROPOSAL" && input.relation.proposalSourceText
    ? [...input.conversation.turns].reverse().find((turn) => turn.role === "NOXIA" && turn.content.includes(input.relation.proposalSourceText!)) ?? null
    : null;
  return {
    relationId: input.relation.relationRef,
    relationType: input.relation.relationType,
    sourceItemId: input.relation.sourceObjectRef,
    targetItemId: input.relation.targetObjectRef,
    polarity: input.relation.polarity,
    confidence: 1,
    evidenceRefs: [...input.relation.evidenceRefs],
    epistemicBoundary: {
      ownership: input.relation.assertionKind === "USER_ADOPTED_PROPOSAL" ? "NOXIA" : input.relation.assertionKind === "OWNER_SUPPORTED" ? "OWNER" : "USER",
      epistemicStatus: input.relation.assertionKind === "USER_ADOPTED_PROPOSAL"
        ? "CONFIRMED_BY_USER"
        : input.relation.assertionKind === "OWNER_SUPPORTED"
          ? "SUPPORTED_CANDIDATE"
          : input.relation.epistemicStatus,
      adoptionStatus: "CANDIDATE",
      originType: input.relation.assertionKind === "USER_ADOPTED_PROPOSAL" ? "ASSISTANT_PROPOSAL" : input.relation.assertionKind,
      originStatus: input.relation.assertionKind === "USER_ADOPTED_PROPOSAL" ? "USER_EXPLICITLY_ADOPTED" : "PERSISTENT_EXTRACTION_CANDIDATE",
      activeState: true,
      sourceTurnIds: [...new Set([proposalTurn?.turnId, input.turn.turnId].filter((ref): ref is string => Boolean(ref)))],
      sourceText: input.relation.sourceText,
    },
  };
};

const contributionTemporalAnchor = (
  anchor: PersistentTemporalQualification["anchor"] | PersistentExpectedVariableOccasion["anchor"],
): ScientificTemporalAnchorCandidate | null => {
  if (!anchor) return null;
  if (!anchor.kind || !anchor.direction || !anchor.unit || anchor.offset === undefined
    || anchor.lowerBound === undefined || anchor.upperBound === undefined
    || anchor.relativeEventLabel === undefined || anchor.tolerance === undefined || !anchor.reference?.status) {
    throw new Error("PERSISTENT_TEMPORAL_ANCHOR_NOT_NORMALIZED");
  }
  const reference = anchor.reference.status === "KNOWN"
    ? { status: "KNOWN" as const, referenceProjectRef: anchor.reference.referenceProjectRef! }
    : { status: "UNKNOWN" as const, unresolvedReason: anchor.reference.unresolvedReason! };
  return {
    kind: anchor.kind,
    direction: anchor.direction,
    unit: anchor.unit,
    offset: anchor.offset,
    lowerBound: anchor.lowerBound,
    upperBound: anchor.upperBound,
    relativeEventLabel: anchor.relativeEventLabel,
    tolerance: anchor.tolerance ? {
      lower: anchor.tolerance.lower ?? null,
      upper: anchor.tolerance.upper ?? null,
      unit: anchor.tolerance.unit!,
    } : null,
    reference,
  };
};

export const contributionFromPersistentDelta = (input: {
  candidate: PersistentProjectDeltaCandidate;
  conversation: ScientificInterpretationConversation;
  currentProject: ResearchProjectOwnerProjection | null;
  createdAt?: string;
}): ScientificInterpretationContributionEnvelope | null => {
  if (!input.candidate.changes.length
    && !input.candidate.relations.length
    && !input.candidate.temporalQualifications.length
    && !input.candidate.expectedVariableOccasions.length) return null;
  const lastUserTurn = [...input.conversation.turns].reverse().find((turn) => turn.role === "USER");
  if (!lastUserTurn) return null;
  const createdAt = input.createdAt ?? new Date().toISOString();
  const items = input.candidate.changes.map((change, index) => itemFromChange({
    change,
    index,
    turn: lastUserTurn,
    conversation: input.conversation,
    project: input.currentProject,
  }));
  const relations = input.candidate.relations.map((relation) => relationFromPersistentCandidate({ relation, turn: lastUserTurn, conversation: input.conversation }));
  const candidateObjects = items.filter((item, index) => input.candidate.changes[index]?.targetSectionId !== "TEMPORALITY"
    && !/TEMPORAL|TIMING|TIMEPOINT|WINDOW|VISIT/i.test(item.proposedType ?? ""));
  const temporalElements = items.filter((item, index) => input.candidate.changes[index]?.targetSectionId === "TEMPORALITY"
    || /TEMPORAL|TIMING|TIMEPOINT|WINDOW|VISIT/i.test(item.proposedType ?? ""));
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
      runtimeVersion: "0.3.0",
      createdAt,
      contributionDigest,
    },
    source: {
      conversationId: input.conversation.conversationId,
      originalRequest: lastUserTurn.content,
      turns: input.conversation.turns,
      sourceRefs: [...new Set([
        lastUserTurn.turnId,
        ...items.flatMap((item) => item.epistemicBoundary.sourceTurnIds),
        ...relations.flatMap((relation) => relation.epistemicBoundary.sourceTurnIds),
      ])],
      rawOutputRef: null,
      rawOutputDigest: null,
    },
    runtimeEvidence: {
      provider: "GOOGLE_GEMINI",
      model: PRODUCT_BRIDGE_MODEL,
      promptDigest: logicalDigest(PERSISTENT_DELTA_SYSTEM_INSTRUCTION),
      schemaDigest: logicalDigest(persistentProjectDeltaSchema.toString()),
      configurationDigest: logicalDigest({ model: PRODUCT_BRIDGE_MODEL, mode: "REQUIRED_FUNCTION_CALL", version: "0.3.0" }),
      technicalStatus: "STRUCTURED_CONTRACT_VALID",
      parseStatus: "PARSED",
      validationErrors: [],
    },
    scientificContent: {
      normalizedUnderstanding: null,
      routeProposal: null,
      explicitStatements: [],
      candidateObjects,
      candidateRelations: relations,
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
      temporalQualifications: input.candidate.temporalQualifications.map((candidate) => ({
        operation: candidate.operation,
        qualificationId: candidate.qualificationId,
        subjectProjectRef: candidate.subjectProjectRef,
        temporalRole: candidate.temporalRole,
        anchor: contributionTemporalAnchor(candidate.anchor),
        sourceText: candidate.sourceText,
        assertionKind: candidate.assertionKind,
        evidenceRefs: [...candidate.evidenceRefs],
      })),
      expectedVariableOccasions: input.candidate.expectedVariableOccasions.map((candidate) => ({
        operation: candidate.operation,
        occasionId: candidate.occasionId,
        variableProjectRef: candidate.variableProjectRef,
        anchor: contributionTemporalAnchor(candidate.anchor),
        studyUnitOrGroupRef: candidate.studyUnitOrGroupRef,
        applicableContext: candidate.applicableContext,
        sourceText: candidate.sourceText,
        assertionKind: candidate.assertionKind,
        evidenceRefs: [...candidate.evidenceRefs],
      })),
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
  ...buildProjectContextSnapshot({ project }),
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
