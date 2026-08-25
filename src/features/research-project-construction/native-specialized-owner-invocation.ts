import {
  KNOWLEDGE_ENGINE_VERSION,
  createKnowledgeRequest,
  executeKnowledgeRequest,
  logicalDigest,
  stableStringify,
  type ContextDimensionName,
  type KnowledgeContextInput,
  type KnowledgeRequest,
  type KnowledgeResult,
  type ScientificObjectRef,
} from "@/features/knowledge-engine";
import {
  REGULATORY_RESOLUTION_VERSION,
  createRegulatoryResolutionInput,
  knownFact,
  resolveRegulatoryRequirements,
  unknownFact,
  type RegulatoryResolutionInput,
  type RegulatoryResolutionResult,
} from "@/features/regulatory-resolution";
import type { ResearchProjectOwnerProjection } from "./contribution-owner-boundary";
import {
  createSpecializedOwnerGapResult,
  createSpecializedOwnerHandoffRequest,
  createSpecializedOwnerHandoffRequestFromSnapshot,
  recordSpecializedOwnerResult,
  type SpecializedOwnerHandoffRequest,
  type SpecializedOwnerResult,
} from "./specialized-owner-handoff";
import { buildProjectContextSnapshot, type ProjectContextSnapshot } from "./canonical-project-backbone";

export const NATIVE_SPECIALIZED_OWNER_INVOCATION_CONTRACT = "PROJECT_SPINE_03_NATIVE_OWNER_INVOCATION" as const;
export const NATIVE_SPECIALIZED_OWNER_INVOCATION_VERSION = "0.1.0" as const;

export type NativeOwnerInvocationStatus =
  | "COMPLETED"
  | "OWNER_UNAVAILABLE"
  | "OWNER_RUNTIME_FAILURE"
  | "OWNER_CONTEXT_INCOMPLETE"
  | "OWNER_EVIDENCE_GAP"
  | "INVALID_OWNER_RESULT";

/** Execution metadata only. It deliberately does not normalize owner payloads. */
export type NativeOwnerInvocationObservation = {
  contract: typeof NATIVE_SPECIALIZED_OWNER_INVOCATION_CONTRACT;
  contractVersion: typeof NATIVE_SPECIALIZED_OWNER_INVOCATION_VERSION;
  invocationId: string;
  handoffId: string;
  owner: "KNOWLEDGE" | "REGULATORY_RESOLUTION" | "BIOSTATISTICS";
  capabilityId: "KNOWLEDGE_EVIDENCE" | "REGULATORY_REQUIREMENT_RESOLUTION" | "BIOSTATISTICS_CALCULATION";
  ownerRuntimeVersion: string | null;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  requestRef: string;
  resultRef: string | null;
  status: NativeOwnerInvocationStatus;
  failureCode: string | null;
  provenance: readonly string[];
  evidenceRefs: readonly string[];
  unknowns: readonly string[];
  gaps: readonly string[];
  limitations: readonly string[];
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  runtimeStarts: 0 | 1;
  llmFallbackCalls: 0;
  projectWrites: 0;
};

export type NativeOwnerInvocation<TNativeInput, TNativeResult> = {
  request: SpecializedOwnerHandoffRequest<TNativeInput>;
  result: SpecializedOwnerResult<TNativeResult> | null;
  observation: NativeOwnerInvocationObservation;
};

type InvocationTiming = {
  startedAt: string;
  completedAt: string;
  monotonicNow?: () => number;
};

const measure = (now: (() => number) | undefined) => (now ?? (() => performance.now()))();
const elapsed = (start: number, end: number) => Math.max(0, Math.round((end - start) * 1000) / 1000);

const observation = (input: {
  request: SpecializedOwnerHandoffRequest;
  invocationId: string;
  ownerRuntimeVersion: string | null;
  requestRef: string;
  resultRef?: string | null;
  status: NativeOwnerInvocationStatus;
  failureCode?: string | null;
  provenance?: string[];
  evidenceRefs?: string[];
  unknowns?: string[];
  gaps?: string[];
  limitations?: string[];
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  runtimeStarts: 0 | 1;
}): NativeOwnerInvocationObservation => ({
  contract: NATIVE_SPECIALIZED_OWNER_INVOCATION_CONTRACT,
  contractVersion: NATIVE_SPECIALIZED_OWNER_INVOCATION_VERSION,
  invocationId: input.invocationId,
  handoffId: input.request.handoffId,
  owner: input.request.owner as NativeOwnerInvocationObservation["owner"],
  capabilityId: input.request.capabilityId as NativeOwnerInvocationObservation["capabilityId"],
  ownerRuntimeVersion: input.ownerRuntimeVersion,
  sourceProjectRef: input.request.sourceProject.sourceProjectRef,
  sourceProjectVersion: input.request.sourceProject.sourceProjectVersion,
  sourceProjectDigest: input.request.sourceProject.sourceProjectDigest,
  requestRef: input.requestRef,
  resultRef: input.resultRef ?? null,
  status: input.status,
  failureCode: input.failureCode ?? null,
  provenance: input.provenance ?? [input.request.handoffId, input.request.sourceProject.snapshotDigest],
  evidenceRefs: input.evidenceRefs ?? [],
  unknowns: input.unknowns ?? [],
  gaps: input.gaps ?? [],
  limitations: input.limitations ?? [],
  startedAt: input.startedAt,
  completedAt: input.completedAt,
  latencyMs: input.latencyMs,
  runtimeStarts: input.runtimeStarts,
  llmFallbackCalls: 0,
  projectWrites: 0,
});

const projectUnknowns = (snapshot: ProjectContextSnapshot) => [
  ...snapshot.objects.filter((item) => item.epistemicState === "UNKNOWN").map((item) => `UNKNOWN_PROJECT_OBJECT:${item.stableId}`),
  ...snapshot.pendingVerificationRefs.map((ref) => `PENDING_VERIFICATION:${ref}`),
  ...snapshot.openConflicts.map((conflict) => `OPEN_PROJECT_CONFLICT:${conflict.conflictId}`),
];

const knowledgeRole = (item: ProjectContextSnapshot["objects"][number]): ScientificObjectRef["role"] => {
  if (/COMPARATOR/i.test(item.scientificRole ?? "")) return "COMPARATOR";
  if (["CONDITION", "ENDPOINT", "CANONICAL_VARIABLE", "SCIENTIFIC_QUESTION", "HYPOTHESIS"].includes(item.type)) return "SUBJECT";
  if (item.epistemicState === "UNKNOWN") return "UNKNOWN";
  return "CONTEXT";
};

const knowledgeDimensionByProjectType: Partial<Record<ProjectContextSnapshot["objects"][number]["type"], ContextDimensionName>> = {
  CONDITION: "pathology",
  POPULATION: "population",
  CANONICAL_VARIABLE: "biomarker",
  IMAGING_MODALITY: "modality",
  ACQUISITION: "technique",
  OBJECTIVE: "objective",
  INTERVENTION_OR_EXPOSURE: "intervention",
  ELIGIBILITY_CRITERION: "criterion",
};

const knowledgeContextFromSnapshot = (snapshot: ProjectContextSnapshot): KnowledgeContextInput => {
  const dimensions: KnowledgeContextInput = {};
  for (const item of snapshot.objects) {
    const dimension = knowledgeDimensionByProjectType[item.type];
    if (!dimension) continue;
    const previous = dimensions[dimension];
    dimensions[dimension] = [...new Set([...(Array.isArray(previous) ? previous : previous ? [previous] : []), item.content])];
  }
  dimensions.unknowns = projectUnknowns(snapshot);
  dimensions.contradictions = snapshot.openConflicts.map((conflict) => conflict.message);
  dimensions.timing = [
    ...snapshot.temporalQualifications.map((item) => `${item.temporalRole}:${item.anchor.direction}:${item.anchor.offset ?? "UNKNOWN"}:${item.anchor.unit}`),
    ...snapshot.expectedVariableOccasions.map((item) => `EXPECTED_AT:${item.variableProjectRef}:${item.anchor.direction}:${item.anchor.offset ?? "UNKNOWN"}:${item.anchor.unit}`),
  ];
  return dimensions;
};

export const buildKnowledgeRequestFromCanonicalSnapshot = (input: {
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  question: string;
  createdAt: string;
}): KnowledgeRequest => {
  const snapshot = input.projectSnapshot;
  const scientificObjects = snapshot.objects.slice(0, 30).map((item) => ({
    objectId: item.stableId,
    originalTerm: item.content,
    role: knowledgeRole(item),
  }));
  const request = createKnowledgeRequest({
    originalQuestion: input.question,
    scientificObjectTerms: scientificObjects.map((item) => ({ term: item.originalTerm, role: item.role, objectId: item.objectId })),
    context: knowledgeContextFromSnapshot(snapshot),
    relations: snapshot.relations.slice(0, 30).map((item) => `${item.type}(${item.sourceProjectRef},${item.targetProjectRef})`),
    unknowns: projectUnknowns(snapshot),
    researchProjectId: snapshot.sourceProjectRef,
    strategyVersion: snapshot.sourceProjectVersion,
    consumer: "RESEARCH_PROJECT_CONSTRUCTION",
    externalSearchPolicy: "INTERNAL_ONLY",
    createdAt: input.createdAt,
  });
  return request;
};

export const buildKnowledgeRequestFromProjectSnapshot = (input: {
  project: ResearchProjectOwnerProjection;
  question: string;
  createdAt: string;
}): KnowledgeRequest => buildKnowledgeRequestFromCanonicalSnapshot({
  projectSnapshot: buildProjectContextSnapshot({ project: input.project }),
  question: input.question,
  createdAt: input.createdAt,
});

const validKnowledgeResult = (
  result: KnowledgeResult,
  request: SpecializedOwnerHandoffRequest<KnowledgeRequest>,
) => request.nativeInputVersion === KNOWLEDGE_ENGINE_VERSION
  && request.nativeInput.contractVersion === KNOWLEDGE_ENGINE_VERSION
  && result.request.contractVersion === KNOWLEDGE_ENGINE_VERSION
  && result.trace.engineVersion === KNOWLEDGE_ENGINE_VERSION
  && result.request.requestId === request.nativeInput.requestId
  && result.request.researchProjectId === request.sourceProject.sourceProjectRef
  && result.request.strategyVersion === request.sourceProject.sourceProjectVersion
  && result.request.externalSearchPolicy === "INTERNAL_ONLY"
  && result.trace.privacy.externalCallMade === false
  && result.externalEvidence === null;

export const invokeKnowledgeOwnerFromSnapshot = (input: InvocationTiming & {
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  knowledgeRequest: KnowledgeRequest;
  purpose: string;
  runtime?: (request: KnowledgeRequest) => KnowledgeResult;
}): NativeOwnerInvocation<KnowledgeRequest, KnowledgeResult> => {
  if (input.knowledgeRequest.researchProjectId !== input.projectSnapshot.sourceProjectRef
    || input.knowledgeRequest.strategyVersion !== input.projectSnapshot.sourceProjectVersion
    || input.knowledgeRequest.externalSearchPolicy !== "INTERNAL_ONLY") {
    throw new Error("KNOWLEDGE_REQUEST_PROJECT_SNAPSHOT_MISMATCH");
  }
  const handoffId = `knowledge-handoff:${logicalDigest({ project: input.projectSnapshot.sourceProjectDigest, request: input.knowledgeRequest.requestId })}`;
  const request = createSpecializedOwnerHandoffRequestFromSnapshot({
    handoffId,
    owner: "KNOWLEDGE",
    capabilityId: "KNOWLEDGE_EVIDENCE",
    purpose: input.purpose,
    sourceProject: input.projectSnapshot,
    nativeInputType: "KnowledgeRequest",
    nativeInputVersion: KNOWLEDGE_ENGINE_VERSION,
    nativeInput: input.knowledgeRequest,
  });
  const invocationId = `native-owner-invocation:${logicalDigest({ handoffId, startedAt: input.startedAt })}`;
  const before = stableStringify(input.projectSnapshot);
  const started = measure(input.monotonicNow);
  try {
    const nativeResult = (input.runtime ?? executeKnowledgeRequest)(request.nativeInput);
    const latencyMs = elapsed(started, measure(input.monotonicNow));
    if (!validKnowledgeResult(nativeResult, request) || stableStringify(input.projectSnapshot) !== before) {
      return {
        request,
        result: null,
        observation: observation({ request, invocationId, ownerRuntimeVersion: KNOWLEDGE_ENGINE_VERSION, requestRef: input.knowledgeRequest.requestId, status: "INVALID_OWNER_RESULT", failureCode: "KNOWLEDGE_RESULT_PROJECT_OR_REQUEST_MISMATCH", startedAt: input.startedAt, completedAt: input.completedAt, latencyMs, runtimeStarts: 1 }),
      };
    }
    const evidenceRefs = [...new Set([
      ...nativeResult.sources.map((item) => item.sourceId),
      ...nativeResult.evidence.map((item) => item.evidenceId),
    ])];
    const gaps = nativeResult.gaps.map((item) => `${item.gapId}:${item.code}`);
    const unknowns = [...new Set([...nativeResult.unresolvedConcepts, ...nativeResult.ambiguities, ...nativeResult.request.unknowns])];
    const hasOwnerEvidence = evidenceRefs.length > 0
      || nativeResult.applicableAssertions.length > 0
      || nativeResult.documentaryStatements.length > 0;
    const resultKind = hasOwnerEvidence ? "EVIDENCE_DIAGNOSTIC" as const : "GAP" as const;
    const result = recordSpecializedOwnerResult({
      request,
      resultId: nativeResult.resultId,
      resultVersion: String(nativeResult.resultRevision),
      completedAt: input.completedAt,
      status: nativeResult.limitations.length || gaps.length ? "COMPLETED_WITH_LIMITATIONS" : "COMPLETED",
      resultKind,
      nativePayloadType: "KnowledgeResult",
      nativePayloadVersion: KNOWLEDGE_ENGINE_VERSION,
      nativePayload: nativeResult,
      stableProjectRefs: request.sourceProject.objects.map((item) => item.stableId),
      evidenceRefs,
      unknowns,
      gaps,
      limitations: nativeResult.limitations,
      provenance: [
        nativeResult.resultId,
        nativeResult.registrySnapshotRef,
        ...nativeResult.provenance.map((item) => `${item.providerId}@${item.version}:${item.representationDigest}`),
      ],
    });
    const status: NativeOwnerInvocationStatus = resultKind === "GAP" ? "OWNER_EVIDENCE_GAP" : "COMPLETED";
    return {
      request,
      result,
      observation: observation({ request, invocationId, ownerRuntimeVersion: KNOWLEDGE_ENGINE_VERSION, requestRef: input.knowledgeRequest.requestId, resultRef: `${result.resultId}@${result.resultVersion}`, status, provenance: [...result.provenance], evidenceRefs, unknowns, gaps, limitations: [...result.limitations], startedAt: input.startedAt, completedAt: input.completedAt, latencyMs, runtimeStarts: 1 }),
    };
  } catch (error) {
    const latencyMs = elapsed(started, measure(input.monotonicNow));
    return {
      request,
      result: null,
      observation: observation({ request, invocationId, ownerRuntimeVersion: KNOWLEDGE_ENGINE_VERSION, requestRef: input.knowledgeRequest.requestId, status: "OWNER_RUNTIME_FAILURE", failureCode: error instanceof Error ? error.message : "KNOWLEDGE_RUNTIME_FAILURE", startedAt: input.startedAt, completedAt: input.completedAt, latencyMs, runtimeStarts: 1 }),
    };
  }
};

export const invokeKnowledgeOwnerFromProject = (input: InvocationTiming & {
  project: ResearchProjectOwnerProjection;
  question?: string;
  runtime?: (request: KnowledgeRequest) => KnowledgeResult;
}): NativeOwnerInvocation<KnowledgeRequest, KnowledgeResult> => {
  const question = input.question ?? "Quelles données disponibles permettent d'étayer une hypothèse sur la MVO dans ce contexte ?";
  const projectSnapshot = buildProjectContextSnapshot({ project: input.project });
  const nativeInput = buildKnowledgeRequestFromCanonicalSnapshot({ projectSnapshot, question, createdAt: input.startedAt });
  const before = stableStringify(input.project);
  const invocation = invokeKnowledgeOwnerFromSnapshot({ projectSnapshot, knowledgeRequest: nativeInput, purpose: question, runtime: input.runtime, startedAt: input.startedAt, completedAt: input.completedAt, monotonicNow: input.monotonicNow });
  if (stableStringify(input.project) !== before) throw new Error("KNOWLEDGE_OWNER_MUTATED_PROJECT");
  return invocation;
};

const regulatoryUnknown = <T>(field: string, snapshot: ProjectContextSnapshot) => unknownFact<T>(
  `${field} n'est pas qualifié dans le Project Snapshot lu par REG.`,
  [snapshot.sourceProjectRef, snapshot.sourceProjectVersion, snapshot.sourceProjectDigest],
);

export const buildRegulatoryRequestFromProjectSnapshot = (input: {
  project: ResearchProjectOwnerProjection;
  resolutionAsOf: string;
}): RegulatoryResolutionInput => {
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const projectRefs = [
    snapshot.sourceProjectRef,
    snapshot.sourceProjectVersion,
    snapshot.sourceProjectDigest,
    ...snapshot.objects.map((item) => item.versionRef),
  ];
  const interventionRefs = snapshot.objects.filter((item) => item.type === "INTERVENTION_OR_EXPOSURE").map((item) => item.stableId);
  const interventionPresent = interventionRefs.length > 0
    ? knownFact(true, "Le Project Snapshot contient une intervention ou exposition explicitement typée.", [...projectRefs, ...interventionRefs])
    : regulatoryUnknown<boolean>("La présence d'une intervention", snapshot);
  return createRegulatoryResolutionInput({
    researchProjectId: snapshot.sourceProjectRef,
    researchProjectVersion: snapshot.sourceProjectVersion,
    researchProjectDigest: snapshot.sourceProjectDigest,
    resolutionAsOf: input.resolutionAsOf,
    jurisdiction: regulatoryUnknown("La juridiction", snapshot),
    projectCharacteristics: {
      humanHealthResearch: regulatoryUnknown("La qualification de recherche impliquant la personne humaine", snapshot),
      projectNatures: regulatoryUnknown("La nature juridique du projet", snapshot),
      intendedDocuments: regulatoryUnknown("Les documents réglementaires attendus", snapshot),
      explicitlyIncorporatedGuidance: regulatoryUnknown("Les référentiels méthodologiques incorporés", snapshot),
    },
    studyDesignCharacteristics: {
      interventionModel: regulatoryUnknown("Le modèle interventionnel ou observationnel", snapshot),
      temporalDirection: regulatoryUnknown("La direction temporelle du projet", snapshot),
      randomised: regulatoryUnknown("La randomisation", snapshot),
      registryBased: regulatoryUnknown("Le caractère registry-based", snapshot),
      reportTypes: regulatoryUnknown("Les types de rapports", snapshot),
    },
    interventionCharacteristics: {
      interventionPresent,
      medicinalProductTrial: regulatoryUnknown("La qualification d'essai de médicament", snapshot),
      medicalDeviceStudy: regulatoryUnknown("La qualification d'étude de dispositif médical", snapshot),
    },
    productCharacteristics: { productTypes: regulatoryUnknown("Les types de produits de santé", snapshot) },
    dataCharacteristics: {
      personalHealthData: regulatoryUnknown("Le traitement de données personnelles de santé", snapshot),
      existingData: regulatoryUnknown("L'utilisation de données existantes", snapshot),
      prospectiveCollection: regulatoryUnknown("La collecte prospective", snapshot),
      routinelyCollectedHealthData: regulatoryUnknown("Les données de soin courant", snapshot),
      sources: regulatoryUnknown("Les sources de données", snapshot),
      transferOutsideEea: regulatoryUnknown("Le transfert hors EEE", snapshot),
    },
    biologicalSampleCharacteristics: { samplesPresent: regulatoryUnknown("La présence d'échantillons biologiques", snapshot) },
    multicenterCharacteristics: {
      multicenter: regulatoryUnknown("Le caractère multicentrique", snapshot),
      centerCount: regulatoryUnknown("Le nombre de centres", snapshot),
    },
    internationalCharacteristics: {
      international: regulatoryUnknown("Le caractère international", snapshot),
      centerJurisdictions: regulatoryUnknown("Les juridictions des centres", snapshot),
      crossCountryRequirementDiscoveryNeeded: regulatoryUnknown("Le besoin d'analyse transfrontalière", snapshot),
    },
    fundingProgramCandidates: regulatoryUnknown("Les programmes de financement", snapshot),
    fundingProgramEditionCandidates: regulatoryUnknown("Les éditions de programmes de financement", snapshot),
    knownRegulatoryQualifications: [],
    unknowns: [
      { unknownId: "reg-unknown:jurisdiction", field: "jurisdiction", reason: "La juridiction n'est pas fournie.", provenance: projectRefs },
      { unknownId: "reg-unknown:research-qualification", field: "projectCharacteristics.humanHealthResearch", reason: "La qualification exacte de la recherche n'est pas fournie.", provenance: projectRefs },
      { unknownId: "reg-unknown:emergency-consent", field: "emergencyConsent", reason: "L'applicabilité d'un consentement d'urgence exige juridiction, qualification et sources applicables.", provenance: projectRefs },
    ],
    contradictions: [],
    humanDecisions: [input.project.confirmationDecision],
    provenance: projectRefs,
  });
};

const validRegulatoryResult = (
  result: RegulatoryResolutionResult,
  request: SpecializedOwnerHandoffRequest<RegulatoryResolutionInput>,
) => result.researchProjectId === request.sourceProject.sourceProjectRef
  && result.researchProjectVersion === request.sourceProject.sourceProjectVersion
  && result.researchProjectDigest === request.sourceProject.sourceProjectDigest
  && result.provenance.authorityBoundary === "METHODOLOGICAL_AID_NOT_REGULATORY_VALIDATION";

export const invokeRegulatoryOwnerFromProject = (input: InvocationTiming & {
  project: ResearchProjectOwnerProjection;
  question?: string;
  runtime?: (request: RegulatoryResolutionInput) => RegulatoryResolutionResult;
}): NativeOwnerInvocation<RegulatoryResolutionInput, RegulatoryResolutionResult> => {
  const question = input.question ?? "Peut-on prévoir un consentement d'urgence dans ce projet ?";
  const projectSnapshot = buildProjectContextSnapshot({ project: input.project });
  const nativeInput = buildRegulatoryRequestFromProjectSnapshot({ project: input.project, resolutionAsOf: input.startedAt });
  const before = stableStringify(input.project);
  const invocation = invokeRegulatoryOwnerFromSnapshot({
    projectSnapshot,
    regulatoryRequest: nativeInput,
    purpose: question,
    runtime: input.runtime,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    monotonicNow: input.monotonicNow,
  });
  if (stableStringify(input.project) !== before) throw new Error("REGULATORY_OWNER_MUTATED_PROJECT");
  return invocation;
};

export const invokeRegulatoryOwnerFromSnapshot = (input: InvocationTiming & {
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  regulatoryRequest: RegulatoryResolutionInput;
  purpose: string;
  runtime?: (request: RegulatoryResolutionInput) => RegulatoryResolutionResult;
}): NativeOwnerInvocation<RegulatoryResolutionInput, RegulatoryResolutionResult> => {
  const nativeInput = input.regulatoryRequest;
  if (nativeInput.researchProjectId !== input.projectSnapshot.sourceProjectRef
    || nativeInput.researchProjectVersion !== input.projectSnapshot.sourceProjectVersion
    || nativeInput.researchProjectDigest !== input.projectSnapshot.sourceProjectDigest) {
    throw new Error("REGULATORY_REQUEST_PROJECT_SNAPSHOT_MISMATCH");
  }
  const requestRef = `regulatory-request:${logicalDigest(nativeInput)}`;
  const handoffId = `regulatory-handoff:${logicalDigest({
    project: input.projectSnapshot.snapshotDigest,
    requestRef,
    purpose: input.purpose,
  })}`;
  const request = createSpecializedOwnerHandoffRequestFromSnapshot({
    handoffId,
    owner: "REGULATORY_RESOLUTION",
    capabilityId: "REGULATORY_REQUIREMENT_RESOLUTION",
    purpose: input.purpose,
    sourceProject: input.projectSnapshot,
    nativeInputType: "RegulatoryResolutionInput",
    nativeInputVersion: REGULATORY_RESOLUTION_VERSION,
    nativeInput,
  });
  const invocationId = `native-owner-invocation:${logicalDigest({ handoffId, startedAt: input.startedAt })}`;
  const before = stableStringify(input.projectSnapshot);
  const started = measure(input.monotonicNow);
  try {
    const nativeResult = (input.runtime ?? resolveRegulatoryRequirements)(request.nativeInput);
    const latencyMs = elapsed(started, measure(input.monotonicNow));
    if (!validRegulatoryResult(nativeResult, request) || stableStringify(input.projectSnapshot) !== before) {
      return {
        request,
        result: null,
        observation: observation({ request, invocationId, ownerRuntimeVersion: REGULATORY_RESOLUTION_VERSION, requestRef, status: "INVALID_OWNER_RESULT", failureCode: "REG_RESULT_PROJECT_OR_AUTHORITY_MISMATCH", startedAt: input.startedAt, completedAt: input.completedAt, latencyMs, runtimeStarts: 1 }),
      };
    }
    const evidenceRefs = [...new Set(nativeResult.provenance.sourceRefs)];
    const unknowns = [...new Set([
      ...nativeInput.unknowns.map((item) => item.unknownId),
      ...nativeResult.requiredQualifications.filter((item) => item.status !== "HUMAN_CONFIRMED").map((item) => item.qualificationId),
    ])];
    const gaps = [...new Set([
      ...nativeResult.missingInformation.map((item) => item.field),
      ...nativeResult.readiness.reasons,
    ])];
    const hasGap = nativeResult.readiness.status !== "RESOLUTION_COMPLETE"
      || nativeResult.unresolvedRequirements.length > 0
      || unknowns.length > 0
      || gaps.length > 0;
    const result = recordSpecializedOwnerResult({
      request,
      resultId: nativeResult.resolutionId,
      resultVersion: REGULATORY_RESOLUTION_VERSION,
      completedAt: input.completedAt,
      status: hasGap ? "COMPLETED_WITH_LIMITATIONS" : "COMPLETED",
      resultKind: hasGap ? "GAP" : "EVIDENCE_DIAGNOSTIC",
      nativePayloadType: "RegulatoryResolutionResult",
      nativePayloadVersion: REGULATORY_RESOLUTION_VERSION,
      nativePayload: nativeResult,
      stableProjectRefs: request.sourceProject.objects.map((item) => item.stableId),
      evidenceRefs,
      unknowns,
      gaps,
      limitations: [
        nativeResult.readiness.notice,
        nativeResult.provenance.authorityBoundary,
        ...nativeResult.corpusDiagnostics.map((item) => item.description),
      ],
      provenance: [nativeResult.resolutionId, ...nativeResult.provenance.researchProjectRefs, ...nativeResult.provenance.corpusRefs, ...evidenceRefs],
    });
    const status: NativeOwnerInvocationStatus = hasGap ? "OWNER_CONTEXT_INCOMPLETE" : "COMPLETED";
    return {
      request,
      result,
      observation: observation({ request, invocationId, ownerRuntimeVersion: REGULATORY_RESOLUTION_VERSION, requestRef, resultRef: `${result.resultId}@${result.resultVersion}`, status, provenance: [...result.provenance], evidenceRefs, unknowns, gaps, limitations: [...result.limitations], startedAt: input.startedAt, completedAt: input.completedAt, latencyMs, runtimeStarts: 1 }),
    };
  } catch (error) {
    const latencyMs = elapsed(started, measure(input.monotonicNow));
    return {
      request,
      result: null,
      observation: observation({ request, invocationId, ownerRuntimeVersion: REGULATORY_RESOLUTION_VERSION, requestRef, status: "OWNER_RUNTIME_FAILURE", failureCode: error instanceof Error ? error.message : "REG_RUNTIME_FAILURE", startedAt: input.startedAt, completedAt: input.completedAt, latencyMs, runtimeStarts: 1 }),
    };
  }
};

export type BiostatisticsCalculationRequest = {
  question: string;
  requestedOperation: "CALCULATE_SAMPLE_SIZE";
};

export const invokeUnavailableBiostatisticsCalculation = (input: InvocationTiming & {
  project: ResearchProjectOwnerProjection;
  question?: string;
}): NativeOwnerInvocation<BiostatisticsCalculationRequest, null> => {
  const nativeInput: BiostatisticsCalculationRequest = {
    question: input.question ?? "Calcule l'effectif nécessaire.",
    requestedOperation: "CALCULATE_SAMPLE_SIZE",
  };
  const handoffId = `biostatistics-calculation-handoff:${logicalDigest({ project: input.project.projectDigest, nativeInput })}`;
  const request = createSpecializedOwnerHandoffRequest({
    handoffId,
    owner: "BIOSTATISTICS",
    capabilityId: "BIOSTATISTICS_CALCULATION",
    purpose: nativeInput.question,
    project: input.project,
    nativeInputType: "BIOSTATISTICS-001 architecture only",
    nativeInputVersion: "NOT_IMPLEMENTED",
    nativeInput,
  });
  const result = createSpecializedOwnerGapResult({
    request,
    resultId: `owner-gap:${logicalDigest({ handoffId, code: "CALL_NONEXISTENT_ENGINE" })}`,
    resultVersion: "NOT_IMPLEMENTED",
    completedAt: input.completedAt,
    limitations: ["No sample-size calculation runtime exists; no numerical result was produced."],
  });
  const invocationId = `native-owner-invocation:${logicalDigest({ handoffId, startedAt: input.startedAt })}`;
  return {
    request,
    result,
    observation: observation({
      request,
      invocationId,
      ownerRuntimeVersion: null,
      requestRef: handoffId,
      resultRef: `${result.resultId}@${result.resultVersion}`,
      status: "OWNER_UNAVAILABLE",
      failureCode: "CALL_NONEXISTENT_ENGINE",
      provenance: [...result.provenance],
      unknowns: [...result.unknowns],
      gaps: [...result.gaps],
      limitations: [...result.limitations],
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      latencyMs: 0,
      runtimeStarts: 0,
    }),
  };
};
