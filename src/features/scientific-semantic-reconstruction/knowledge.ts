import { comparableScientificText, executeKnowledgeEngine, uniqueSorted, type ContextDimensionName, type KnowledgeContextInput, type KnowledgeResult } from "@/features/knowledge-engine";
import { activeSemanticElements, recomputeSemanticModelDigest } from "./canonical";
import type { ScientificSemanticModel, SemanticElement, SemanticElementType } from "./types";

const contextTypeMap: Partial<Record<SemanticElementType, ContextDimensionName>> = {
  CONDITION: "pathology",
  POPULATION: "population",
  PHENOMENON: "phenomenon",
  BIOMARKER: "biomarker",
  MODALITY: "modality",
  METHOD: "technique",
  TIMING: "timing",
  SCIENTIFIC_INTENT: "objective",
  ENDPOINT: "criterion",
  INTERVENTION: "intervention",
};

const buildContext = (model: ScientificSemanticModel): KnowledgeContextInput => {
  const grouped = new Map<ContextDimensionName, string[]>();
  activeSemanticElements(model).forEach((element) => {
    const dimension = contextTypeMap[element.type];
    if (!dimension) return;
    grouped.set(dimension, [...(grouped.get(dimension) ?? []), element.canonicalMeaning]);
  });
  return {
    ...Object.fromEntries([...grouped.entries()].map(([key, values]) => [key, uniqueSorted(values)])),
    unknowns: uniqueSorted([...model.unknowns, ...model.missingConcepts]),
    contradictions: model.contradictions,
  } as KnowledgeContextInput;
};

const consumerFor = (model: ScientificSemanticModel) => model.routeProposal.route === "DESIGN_STUDY"
  ? "RESEARCH_PROJECT_CONSTRUCTION" as const
  : model.routeProposal.route === "FORMALIZE_IDEA"
    ? "SCIENTIFIC_THINKING_ENGINE" as const
    : "PROTOCOL_DESIGNER_UNDERSTAND" as const;

export const executeSemanticKnowledgeVerification = (model: ScientificSemanticModel): KnowledgeResult => {
  const active = activeSemanticElements(model);
  const primary = active.filter((item) => ["SCIENTIFIC_OBJECT", "PHENOMENON", "BIOMARKER", "CONDITION", "MODALITY", "METHOD"].includes(item.type));
  const objects = (primary.length ? primary : active.slice(0, 6)).map((item, index) => ({
    term: item.canonicalMeaning,
    role: item.type === "COMPARATOR" ? "COMPARATOR" as const : index === 0 ? "SUBJECT" as const : "CONTEXT" as const,
  }));
  return executeKnowledgeEngine({
    originalQuestion: model.originalRequest,
    scientificObjectTerms: objects,
    relations: model.relations.filter((item) => item.epistemicStatus !== "REJECTED_BY_USER").map((item) => {
      const source = model.elements.find((element) => element.semanticElementId === item.sourceElementId)?.canonicalMeaning ?? item.sourceElementId;
      const target = model.elements.find((element) => element.semanticElementId === item.targetElementId)?.canonicalMeaning ?? item.targetElementId;
      return `${source} ${item.relationType} ${target}`;
    }),
    context: buildContext(model),
    unknowns: uniqueSorted([...model.unknowns, ...model.missingConcepts]),
    consumer: consumerFor(model),
    createdAt: model.updatedAt,
    strategyVersion: `semantic-model-${model.revision}`,
  });
};

const conceptMatches = (element: SemanticElement, result: KnowledgeResult) => result.resolvedConcepts.filter((concept) => {
  const meaning = comparableScientificText(element.canonicalMeaning);
  const labels = [concept.preferredLabel, ...concept.originalTerms].map(comparableScientificText);
  return labels.some((label) => label === meaning || label.includes(meaning) || meaning.includes(label));
});

export const verifySemanticModelWithKnowledge = (model: ScientificSemanticModel, result = executeSemanticKnowledgeVerification(model), now = new Date().toISOString()): ScientificSemanticModel => {
  const explicitlyRequested = new Set(model.knowledgeRequests.flatMap((item) => item.elementIds));
  const elements = model.elements.map((element): SemanticElement => {
    if (["REJECTED_BY_USER", "UNKNOWN", "AMBIGUOUS"].includes(element.epistemicStatus)) return element;
    const candidates = conceptMatches(element, result);
    const conceptIds = new Set(candidates.map((item) => item.conceptId));
    const assertions = result.applicableAssertions.filter((item) => item.conceptIds.some((id) => conceptIds.has(id)));
    const statements = result.documentaryStatements.filter((item) => item.conceptIds.some((id) => conceptIds.has(id)));
    const shouldCheck = explicitlyRequested.has(element.semanticElementId) || ["MECHANISM", "BIOMARKER", "ENDPOINT", "EXPECTED_DIRECTION", "CONDITION", "PHENOMENON"].includes(element.type);
    if (!shouldCheck) return element;
    const gapRefs = result.gaps.filter((gap) => gap.affectedConceptIds.some((id) => conceptIds.has(id)) || !conceptIds.size).map((gap) => gap.gapId);
    const conflicting = result.coverageStatus === "CONFLICTING" || result.controversies.some((item) => item.positionIds.some((id) => assertions.some((assertion) => assertion.stableId === id)));
    const supported = Boolean(assertions.length || statements.length) && ["SUPPORTED", "PARTIAL"].includes(result.coverageStatus);
    const knowledgeSupport: SemanticElement["knowledgeSupport"] = {
      status: conflicting ? "CONFLICTING" : supported ? result.coverageStatus === "SUPPORTED" ? "SUPPORTED" : "PARTIAL" : gapRefs.length || !conceptIds.size ? "KNOWLEDGE_GAP" : "UNSUPPORTED",
      resultRef: result.resultId,
      assertionRefs: uniqueSorted([...assertions.map((item) => item.stableId), ...statements.map((item) => item.statementId)]),
      gapRefs: uniqueSorted(gapRefs),
      checkedAt: now,
    };
    const epistemicStatus = ["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER"].includes(element.epistemicStatus)
      ? element.epistemicStatus
      : supported ? "SUPPORTED_CANDIDATE" as const
        : !conflicting ? "UNSUPPORTED_CANDIDATE" as const : element.epistemicStatus;
    return { ...element, epistemicStatus, knowledgeSupport, requiresConfirmation: !["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER"].includes(epistemicStatus), version: element.version + 1 };
  });
  return recomputeSemanticModelDigest({
    ...model,
    elements,
    knowledgeSnapshot: { resultId: result.resultId, resultDigest: result.resultDigest, coverageStatus: result.coverageStatus, verifiedAt: now },
    updatedAt: now,
  });
};
