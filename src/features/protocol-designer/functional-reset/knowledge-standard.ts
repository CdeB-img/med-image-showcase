import {
  REFERENCE_CORPUS_RUNTIME_DIGEST,
  createKnowledgeOwnerHandoff,
  createKnowledgeRequest,
  logicalDigest,
  type KnowledgeOwnerHandoff,
  type KnowledgeResult,
} from "@/features/knowledge-engine";
import {
  attachProductKnowledgePrerequisite,
  createProductKnowledgePrerequisiteAction,
  isProductKnowledgePrerequisiteDispatch,
  type FunctionalResetQueryNavigation,
  type ProductKnowledgeTargetOwner,
} from "@/features/query-navigation";
import { buildProjectContextSnapshot, type ResearchProjectOwnerProjection, type SpecializedOwnerResult } from "@/features/research-project-construction";
import { invokeKnowledgeForProject } from "@/features/protocol-designer/product-knowledge-owner-runtime";
import type { ProductOwnerResultLedger, ProductOwnerResultLedgerEntry } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  createScientificRunTraceRecorder,
  type ScientificExecutionTraceLedger,
  type ScientificTraceOwner,
} from "@/features/protocol-designer/scientific-execution-trace";

export const STANDARD_KNOWLEDGE_PREREQUISITE_VERSION = "1.0.0" as const;

const currentRequiredNeedByOwner = {
  OBSERVABILITY_MEASUREMENT: {
    needId: "OKC01-N-020",
    needClass: "OBSERVABLE_PROPERTY_AND_MEASUREMENT_ALTERNATIVES",
    maxSources: 4,
    maxSectionsPerSource: 2,
  },
  REG: {
    needId: "OKC01-N-062",
    needClass: "EU_FR_CLINICAL_RESEARCH_APPLICABILITY",
    maxSources: 8,
    maxSectionsPerSource: 2,
  },
} as const;

const consumerByOwner: Record<ProductKnowledgeTargetOwner, KnowledgeResult["request"]["consumer"]> = {
  SCIENTIFIC_THINKING: "SCIENTIFIC_THINKING_ENGINE",
  STUDY_DESIGN: "STUDY_DESIGN_ENGINE",
  OBSERVABILITY_MEASUREMENT: "OBSERVABILITY_MEASUREMENT_ENGINE",
  IMAGING: "IMAGING_STUDY_DESIGNER",
  BIOSTATISTICS: "BIOSTATISTICS_ENGINE",
  CDM: "STUDY_DATA_CDM",
  DATA_MANAGEMENT: "DATA_MANAGEMENT_ENGINE",
  REG: "REGULATORY_RESOLUTION_ENGINE",
};

const traceOwnerByTarget: Record<ProductKnowledgeTargetOwner, ScientificTraceOwner> = {
  SCIENTIFIC_THINKING: "SCIENTIFIC_THINKING",
  STUDY_DESIGN: "STUDY_DESIGN",
  OBSERVABILITY_MEASUREMENT: "OBSERVABILITY_MEASUREMENT",
  IMAGING: "IMAGING",
  BIOSTATISTICS: "BIOSTATISTICS",
  CDM: "STUDY_DATA_CDM",
  DATA_MANAGEMENT: "DATA_MANAGEMENT",
  REG: "REGULATORY_RESOLUTION",
};

const currentKnowledgeEntry = (
  ledger: Readonly<ProductOwnerResultLedger>,
  requestId: string,
  project: Readonly<ResearchProjectOwnerProjection>,
) => [...ledger.entries].reverse().find((entry) => entry.request.owner === "KNOWLEDGE"
  && (entry.request.nativeInput as { requestId?: string }).requestId === requestId
  && entry.result?.sourceProjectRef === project.projectId
  && entry.result.sourceProjectVersion === project.versionId
  && entry.result.sourceProjectDigest === project.projectDigest) as Readonly<ProductOwnerResultLedgerEntry> | undefined;

/**
 * Adds a bounded evidence prerequisite only for current QRY actions whose
 * owner contract explicitly requires documentary qualification in this
 * connector. This is not a global retrieval hook and selects no scientific
 * action independently from QRY.
 */
export const attachCurrentKnowledgePrerequisiteWhenRequired = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  navigation: Readonly<FunctionalResetQueryNavigation>;
}) => {
  if (input.navigation.knowledgePrerequisite || !input.navigation.currentAction) return input.navigation;
  const targetOwner = input.navigation.currentAction.owner === "OBSERVABILITY_MEASUREMENT"
    ? "OBSERVABILITY_MEASUREMENT" as const
    : input.navigation.currentAction.owner === "REGULATORY_RESOLUTION"
      ? "REG" as const
      : null;
  if (!targetOwner) return input.navigation;
  const need = currentRequiredNeedByOwner[targetOwner];
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const jurisdiction = snapshot.objects.find((object) => object.type === "PROJECT_INFORMATION"
    && object.scientificRole?.startsWith("JURISDICTION:"))?.scientificRole?.replace("JURISDICTION:", "") ?? null;
  const prerequisite = createProductKnowledgePrerequisiteAction({
    selectedActionRef: input.navigation.currentAction.selectedActionId,
    projectId: input.project.projectId,
    projectVersion: input.project.versionId,
    projectDigest: input.project.projectDigest,
    targetOwner,
    targetCapability: targetOwner === "REG" ? "REGULATORY_REQUIREMENT_RESOLUTION" : "OBSERVABILITY_QUALIFICATION",
    knowledgeNeed: {
      needId: need.needId,
      needClass: need.needClass,
      owner: targetOwner,
      sourcePreferences: [],
      jurisdictionTarget: jurisdiction ?? undefined,
      includeHistorical: false,
      maxSources: need.maxSources,
      maxSectionsPerSource: need.maxSectionsPerSource,
    },
    purpose: input.navigation.currentAction.reason,
    scientificObjects: snapshot.objects.slice(0, 12).map((object) => ({
      objectId: object.stableId,
      originalTerm: object.content,
      role: "CONTEXT" as const,
    })),
    context: { jurisdiction },
    relationRefs: snapshot.relations.map((relation) => relation.stableId),
    provenanceRefs: [input.navigation.currentAction.selectedActionId, ...input.navigation.currentAction.provenanceRefs, snapshot.snapshotDigest],
  });
  return attachProductKnowledgePrerequisite(input.navigation, prerequisite);
};

export const dispatchKnowledgePrerequisiteFromQuery = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  navigation: Readonly<FunctionalResetQueryNavigation>;
  ownerResultLedger: Readonly<ProductOwnerResultLedger>;
  traceLedger: Readonly<ScientificExecutionTraceLedger>;
  sessionId: string;
  conversationId: string;
  startedAt: string;
  completedAt: string;
  traceEnabled?: boolean;
}) => {
  if (!isProductKnowledgePrerequisiteDispatch(input.navigation) || !input.navigation.knowledgePrerequisite) throw new Error("QRY_KNOWLEDGE_PREREQUISITE_NOT_SELECTED");
  const action = input.navigation.knowledgePrerequisite;
  if (action.projectId !== input.project.projectId
    || action.projectVersion !== input.project.versionId
    || action.projectDigest !== input.project.projectDigest) throw new Error("QRY_KNOWLEDGE_PROJECT_BINDING_STALE");

  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const request = createKnowledgeRequest({
    originalQuestion: action.purpose,
    scientificObjectTerms: action.scientificObjects.map((object) => ({ term: object.originalTerm, role: object.role, objectId: object.objectId })),
    context: action.context,
    relations: [...action.relationRefs, `QRY_SELECTED_ACTION_REF:${action.selectedActionRef}`],
    researchProjectId: action.projectId,
    researchProjectVersion: action.projectVersion,
    researchProjectDigest: action.projectDigest,
    strategyVersion: action.projectVersion,
    consumer: consumerByOwner[action.targetOwner],
    freshnessRequirement: `REFERENCE_CORPUS:${REFERENCE_CORPUS_RUNTIME_DIGEST}`,
    externalSearchPolicy: "INTERNAL_ONLY",
    referenceNeed: action.knowledgeNeed,
    createdAt: input.startedAt,
  });
  const traceRunId = input.traceEnabled === false ? null : `knowledge-standard-trace:${logicalDigest({
    sessionId: input.sessionId,
    conversationId: input.conversationId,
    action: action.actionId,
    request: request.requestId,
    startedAt: input.startedAt,
  })}`;
  const trace = traceRunId ? createScientificRunTraceRecorder({
    ledger: input.traceLedger,
    runId: traceRunId,
    projectSnapshot: snapshot,
    initiatorContext: { kind: "EXPLICIT_PRODUCT_CALL", initiatorRef: action.actionId },
    startedAt: input.startedAt,
  }) : undefined;
  trace?.append({
    eventType: "QRY_ACTION_SELECTED",
    timestamp: input.startedAt,
    owner: "QUERY_NAVIGATION",
    status: "KNOWLEDGE_PREREQUISITE_SELECTED",
    sourceRefs: [action.actionId, action.knowledgeNeed.needId, ...action.provenanceRefs],
    diagnostic: { stage: "PROJECT_CONTEXT", code: "QRY_KNOWLEDGE_PREREQUISITE_SELECTED" },
  });

  const retained = currentKnowledgeEntry(input.ownerResultLedger, request.requestId, input.project);
  let ledger = input.ownerResultLedger;
  let result: Readonly<SpecializedOwnerResult<KnowledgeResult>> | null = null;
  let reused = false;
  if (retained?.result) {
    result = retained.result as Readonly<SpecializedOwnerResult<KnowledgeResult>>;
    reused = true;
    trace?.append({
      eventType: "KNOWLEDGE_RESULT",
      timestamp: input.completedAt,
      owner: "KNOWLEDGE",
      status: "CURRENT_LEDGER_RESULT_REUSED",
      sourceRefs: result.nativePayload.referenceSourceSnapshots.map((source) => source.sourceId),
      diagnostic: { stage: "OWNER_RESULT_PERSISTENCE", code: "KNOWLEDGE_DEDUPLICATED_BY_STABLE_REQUEST_ID" },
    });
  } else {
    const invocation = invokeKnowledgeForProject({
      project: input.project,
      projectSnapshot: snapshot,
      knowledgeRequest: request,
      ledger,
      callerRef: action.actionId,
      purpose: action.purpose,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      trace,
    });
    ledger = invocation.ledger;
    result = invocation.result;
  }
  if (!result) {
    trace?.fail(input.completedAt, "KNOWLEDGE_RESULT_MISSING", "KNOWLEDGE_ENGINE");
    throw new Error("KNOWLEDGE_RESULT_MISSING");
  }
  const handoff = createKnowledgeOwnerHandoff({
    result: result.nativePayload,
    targetOwner: action.targetOwner,
    currentProject: { projectId: input.project.projectId, projectVersion: input.project.versionId, projectDigest: input.project.projectDigest },
    trace: trace ? "ON" : "OFF",
  });
  const sufficient = handoff.status === "CURRENT" && handoff.candidateRefs.length > 0;
  trace?.append({
    eventType: sufficient ? "HANDOFF_ACCEPTED" : "HANDOFF_REJECTED",
    timestamp: input.completedAt,
    owner: traceOwnerByTarget[action.targetOwner],
    status: sufficient ? "KNOWLEDGE_HANDOFF_CURRENT" : "KNOWLEDGE_HANDOFF_INSUFFICIENT_EVIDENCE",
    sourceRefs: handoff.sourceRefs,
    evidenceRefs: handoff.candidateRefs,
    limitationRefs: handoff.limitations.map((limitation) => `limitation:${logicalDigest(limitation)}`),
    diagnostic: { stage: "KNOWLEDGE_ENGINE", code: sufficient ? "KNOWLEDGE_OWNER_HANDOFF_EMITTED" : "KNOWLEDGE_OWNER_HANDOFF_NOT_CONSUMABLE" },
    technicalMetadata: {
      handoffId: handoff.handoffId,
      handoffDigest: handoff.handoffDigest,
      targetCapability: action.targetCapability,
      contentAvailabilityStates: result.nativePayload.referenceSourceSnapshots.map((source) => source.contentAvailability).sort().join(","),
    },
  });
  trace?.complete(input.completedAt);
  const presentation = {
    title: sufficient ? "Éléments documentaires qualifiés" : "Éléments documentaires insuffisants",
    plainText: sufficient
      ? "Knowledge a préparé un paquet documentaire borné pour le propriétaire scientifique concerné. Les sources, limites et incertitudes restent visibles ; aucune décision de Project n’est prise."
      : [
        `Je ne dispose pas d’un contenu documentaire suffisamment qualifié pour répondre à cette demande : ${input.navigation.requestedService?.sourceText ?? action.purpose}`,
        `Le projet courant retient : ${input.project.sections.filter((section) => (input.navigation.requestedService?.focusSectionIds ?? ["MEASUREMENTS"]).includes(section.sectionId)).flatMap((section) => section.elements.map((element) => element.content)).join(" ; ") || "la définition reste à préciser"}.`,
        action.targetOwner === "OBSERVABILITY_MEASUREMENT"
          ? "Je ne peux donc pas départager des instruments ou déclarer leur validité dans cette population. Pour avancer, apportez la documentation d’un instrument ou précisez le construit à mesurer, puis nous pourrons examiner son domaine de validation, les conditions de recueil et ses limites. Aucun appareil, critère supplémentaire ou instrument n’est adopté."
          : "Une source applicable à ce besoin est nécessaire avant de conclure. Vous pouvez apporter cette source pour en examiner l’applicabilité ; les inconnues restent ouvertes.",
      ].join("\n\n"),
  };
  return Object.freeze({
    action,
    request,
    result,
    handoff: handoff as Readonly<KnowledgeOwnerHandoff>,
    ownerResultLedger: ledger,
    traceLedger: trace?.getLedger() ?? input.traceLedger,
    traceRunId,
    status: sufficient ? (reused ? "CURRENT_RESULT_REUSED" : "CURRENT_HANDOFF_READY") : "INSUFFICIENT_EVIDENCE",
    targetOwnerDispatchAuthorized: sufficient,
    reused,
    presentation,
    projectWrites: 0 as const,
    providerCalls: 0 as const,
  });
};
