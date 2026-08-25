import { logicalDigest, normalizeScientificText, uniqueSorted } from "@/features/knowledge-engine/canonical";
import { resolveGovernedConceptsFromProviderReferences } from "@/features/knowledge-engine/concept-resolver";
import type { KnowledgeResult } from "@/features/knowledge-engine/types";
import type { InterpretedFieldKey, ValidatedScientificIntent } from "@/features/protocol-designer/intake/types";
import type { ScientificThinkingSession } from "@/features/scientific-thinking/types";
import { IMAGING_STUDY_DESIGNER_VERSION, parseImagingDesignInput, type ImagingDesignInput, type ImagingKnowledgeStatement } from "./types";

const valuesFor = (intent: ValidatedScientificIntent, key: InterpretedFieldKey): string[] => {
  const review = intent.reviews[key];
  if (["REMOVED", "UNKNOWN", "NOT_RELEVANT"].includes(review?.state ?? "")) return [];
  const field = intent.interpretation[key];
  const value = review?.state === "CORRECTED" ? review.correctedValue : field.value;
  return uniqueSorted((Array.isArray(value) ? value : typeof value === "string" && value !== "UNKNOWN" ? [value] : [])
    .map((item) => normalizeScientificText(String(item))).filter(Boolean));
};

const projectedStatement = (item: KnowledgeResult["applicableAssertions"][number]): ImagingKnowledgeStatement => ({
  statementId: item.stableId,
  text: item.text,
  conceptIds: uniqueSorted(item.conceptIds),
  status: item.status,
  applicability: item.applicability,
  sourceId: item.providerId,
  locator: item.locator,
  limitations: uniqueSorted(item.limitations),
  modality: item.modality ?? null,
});

const projectedDocumentaryStatement = (item: KnowledgeResult["documentaryStatements"][number]): ImagingKnowledgeStatement => ({
  statementId: item.statementId,
  text: item.text,
  conceptIds: uniqueSorted(item.conceptIds),
  status: item.status,
  applicability: item.applicability,
  sourceId: item.sourceId,
  locator: item.locator,
  limitations: [],
  modality: null,
});

export const projectKnowledgeResultForImaging = (
  knowledgeResult: KnowledgeResult | null,
  additionalSourceRefs: readonly string[] = [],
): ImagingDesignInput["knowledge"] => {
  const governedConcepts = knowledgeResult ? [
    ...knowledgeResult.resolvedConcepts,
    ...resolveGovernedConceptsFromProviderReferences(knowledgeResult.applicableAssertions.map((item) => ({ providerId: item.providerId, conceptIds: item.conceptIds }))),
  ].filter((item, index, all) => all.findIndex((candidate) => candidate.conceptId === item.conceptId) === index) : [];
  const canonicalConceptIdsFor = (item: KnowledgeResult["applicableAssertions"][number]) => uniqueSorted([
    ...item.conceptIds,
    ...governedConcepts.filter((concept) => {
      const providerIds = Object.values(concept.providerConcepts).flat();
      return item.conceptIds.includes(concept.conceptId)
        || providerIds.some((id) => item.conceptIds.includes(id))
        || Boolean(item.modality && concept.preferredLabel.toLocaleLowerCase("fr-FR").includes(item.modality.toLocaleLowerCase("fr-FR")));
    }).map((concept) => concept.conceptId),
  ]);
  return {
    resultId: knowledgeResult?.resultId ?? null,
    resultDigest: knowledgeResult?.resultDigest ?? null,
    coverageStatus: knowledgeResult?.coverageStatus ?? "NOT_REQUESTED_OR_UNAVAILABLE",
    concepts: governedConcepts.map((item) => ({ conceptId: item.conceptId, label: item.preferredLabel, objectType: item.objectType, resolutionKind: item.kind, originalTerms: uniqueSorted(item.originalTerms) })),
    assertions: knowledgeResult?.applicableAssertions.map((item) => ({ ...projectedStatement(item), conceptIds: canonicalConceptIdsFor(item) })) ?? [],
    documentaryStatements: knowledgeResult?.documentaryStatements.map(projectedDocumentaryStatement) ?? [],
    gaps: knowledgeResult?.gaps.map((item) => ({ code: item.code, explanation: item.explanation, affectedConceptIds: uniqueSorted(item.affectedConceptIds), resumeCondition: item.resumeCondition })) ?? [],
    limitations: uniqueSorted(knowledgeResult?.limitations ?? []),
    sourceIds: uniqueSorted([...(knowledgeResult?.sources.map((item) => item.sourceId) ?? []), ...additionalSourceRefs]),
    matchingSemantics: knowledgeResult ? "EXACT_FIRST_NO_IMPLICIT_FALLBACK" : "NO_RESULT",
  };
};

const centerMode = (centers: string[], fieldStrengths: string[], manufacturers: string[], models: string[]): ImagingDesignInput["centerContext"]["mode"] => {
  const declared = centers.join(" ").toLocaleLowerCase("fr-FR");
  const multicentric = centers.length > 1 || /multi|plusieurs|\b[2-9]\d*\b/.test(declared);
  if (!centers.length) return "UNKNOWN";
  if (!multicentric) return "MONOCENTRIC";
  return new Set([...fieldStrengths, ...manufacturers, ...models].map((item) => item.toLocaleLowerCase("fr-FR"))).size > 1
    ? "MULTICENTRIC_HETEROGENEOUS"
    : "MULTICENTRIC_HOMOGENEOUS";
};

const equipmentProjection = (intent: ValidatedScientificIntent): ImagingDesignInput["declaredEquipment"] => {
  const modalities = valuesFor(intent, "availableEquipment");
  const manufacturers = valuesFor(intent, "manufacturers");
  const models = valuesFor(intent, "models");
  const fields = valuesFor(intent, "fieldStrengths");
  const versions = valuesFor(intent, "softwareVersions");
  const centers = valuesFor(intent, "centers");
  const count = Math.max(modalities.length, manufacturers.length, models.length, fields.length, versions.length);
  if (!count) return [];
  return Array.from({ length: count }, (_, index) => {
    const modality = modalities[index] ?? (modalities.length === 1 ? modalities[0] : null);
    const declaredText = [modality, manufacturers[index], models[index], fields[index], versions[index]].filter(Boolean).join(" ");
    const availability = /indisponible|absent|non disponible/i.test(declaredText)
      ? "KNOWN_UNAVAILABLE" as const
      : modality ? "DECLARED_AVAILABLE" as const : "UNKNOWN" as const;
    return {
      equipmentId: `IMG-EQUIPMENT-${index + 1}:${logicalDigest(declaredText || `unknown-${index + 1}`)}`,
      siteLabel: centers[index] ?? (centers.length === 1 ? centers[0] : `Site ${index + 1} non identifié`),
      modality,
      manufacturer: manufacturers[index] ?? null,
      model: models[index] ?? null,
      fieldStrength: fields[index] ?? null,
      softwareVersion: versions[index] ?? null,
      options: [],
      availability,
      period: null,
      provenanceRef: `validated-intent:${intent.confirmedAt ?? "UNDATE"}`,
    };
  });
};

const preferencesFrom = (
  intent: ValidatedScientificIntent,
  thinking: ScientificThinkingSession | null,
  scientificObjectTerms: string[],
  relations: string[],
): string[] => {
  const relatedTerms = scientificObjectTerms.filter((term) => relations.some((relation) =>
    normalizeScientificText(relation).toLocaleLowerCase("fr-FR").includes(normalizeScientificText(term).toLocaleLowerCase("fr-FR"))));
  const declaredEquipment = valuesFor(intent, "availableEquipment");
  if (thinking) return uniqueSorted([...thinking.input.methodsMentioned, ...declaredEquipment, ...relatedTerms]);
  const source = `${intent.originalQuestion} ${intent.validatedReformulation}`;
  const patterns = ["T1 mapping", "T2 mapping", "ECV", "LGE", "IRM", "MRI", "CT spectral", "scanner spectral", "dual energy", "photon counting", "PET", "SPECT", "échographie"];
  return uniqueSorted([
    ...declaredEquipment,
    ...relatedTerms,
    ...patterns.filter((item) => source.toLocaleLowerCase("fr-FR").includes(item.toLocaleLowerCase("fr-FR"))),
  ]);
};

export const buildImagingDesignInput = (
  intent: ValidatedScientificIntent,
  scientificObjectTerms: string[],
  relations: string[],
  knowledgeResult: KnowledgeResult | null,
  thinking: ScientificThinkingSession | null,
  runtime: { sessionId: string; contextVersion: number; researchProjectId?: string | null; strategyVersion?: string } ,
): ImagingDesignInput => {
  const thinkingOutput = thinking?.output;
  const handoffAuthorized = thinkingOutput?.handoff.status === "AUTHORIZED";
  const selectedQuestion = thinkingOutput?.selectedQuestionCandidate;
  const questionText = selectedQuestion?.text ?? normalizeScientificText(intent.validatedReformulation);
  const questionId = selectedQuestion?.questionId ?? `validated-question:${logicalDigest(questionText)}`;
  const fields = {
    pathology: valuesFor(intent, "pathologyOrCondition"),
    population: valuesFor(intent, "population"),
    timing: valuesFor(intent, "declaredTimings"),
    phenomena: valuesFor(intent, "phenomenaOfInterest"),
    outcomes: valuesFor(intent, "outcomesMentioned"),
    constraints: valuesFor(intent, "constraints"),
    centers: valuesFor(intent, "centers"),
    fields: valuesFor(intent, "fieldStrengths"),
    manufacturers: valuesFor(intent, "manufacturers"),
    models: valuesFor(intent, "models"),
  };
  const equipment = equipmentProjection(intent);
  const sourceRefs = uniqueSorted([
    ...(knowledgeResult?.sources.map((item) => item.sourceId) ?? []),
    ...(thinkingOutput?.handoff.provenanceRefs ?? []),
  ]);
  const knowledge = projectKnowledgeResultForImaging(knowledgeResult, thinkingOutput?.handoff.provenanceRefs ?? []);
  const methodPreferences = preferencesFrom(intent, thinking, scientificObjectTerms, relations);
  const scientificRelationships = uniqueSorted(relations.map(normalizeScientificText).filter(Boolean));
  const material = {
    sessionId: runtime.sessionId,
    contextVersion: runtime.contextVersion,
    questionId,
    questionText,
    objectives: thinkingOutput?.handoff.objectiveIds ?? [],
    hypotheses: thinkingOutput?.handoff.hypothesisIds ?? [],
    knowledgeDigest: knowledge.resultDigest,
    equipment,
    methodPreferences,
    scientificRelationships,
    knownConstraints: fields.constraints,
  };
  const inputDigest = logicalDigest(material);
  const result: ImagingDesignInput = {
    contractVersion: IMAGING_STUDY_DESIGNER_VERSION,
    inputId: `imaging-design-input:${inputDigest}`,
    researchProjectId: runtime.researchProjectId ?? thinking?.input.researchContext.researchProjectId ?? null,
    strategyVersion: runtime.strategyVersion ?? `context-${runtime.contextVersion}`,
    sourceHandoff: handoffAuthorized ? {
      kind: "AUTHORIZED_ST_HANDOFF", stOutputRef: thinkingOutput?.outputId ?? null, status: "AUTHORIZED", boundary: "NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN", humanDecisions: thinkingOutput?.handoff.humanDecisions ?? thinking?.decisionHistory ?? [],
    } : {
      kind: "VALIDATED_DESIGN_CONTEXT", stOutputRef: thinkingOutput?.outputId ?? null, status: "VALIDATED_WITHOUT_ST_HANDOFF", boundary: "NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN", humanDecisions: thinkingOutput?.handoff.humanDecisions ?? thinking?.decisionHistory ?? [],
    },
    originalExpression: normalizeScientificText(intent.originalQuestion),
    confirmedScientificQuestion: { questionId, text: questionText, confirmation: selectedQuestion?.reviewState === "ADOPTED" ? "HUMAN_CONFIRMED" : "VALIDATED_CONTEXT" },
    objectives: thinkingOutput?.objectives.filter((item) => thinkingOutput.handoff.objectiveIds.includes(item.objectiveId)).map((item) => ({ objectiveId: item.objectiveId, text: item.text, level: item.level, reviewState: item.reviewState })) ?? [],
    hypotheses: thinkingOutput?.hypotheses.filter((item) => thinkingOutput.handoff.hypothesisIds.includes(item.hypothesisId)).map((item) => ({ hypothesisId: item.hypothesisId, text: item.text, kind: item.kind, reviewState: item.reviewState })) ?? [],
    mechanisms: thinkingOutput?.handoff.mechanisms.map((item) => ({ mechanismId: item.mechanismId, text: item.text, support: item.support })) ?? [],
    centralScientificObject: normalizeScientificText(thinkingOutput?.centralScientificObject ?? scientificObjectTerms[0] ?? fields.phenomena[0] ?? intent.validatedReformulation),
    scientificObjectTerms: uniqueSorted(scientificObjectTerms.map(normalizeScientificText).filter(Boolean)),
    pathologyOrCondition: fields.pathology,
    populationContext: fields.population,
    temporalContext: fields.timing,
    phenomenaDeclared: uniqueSorted([...(thinking?.input.phenomena ?? []), ...fields.phenomena]),
    outcomesDeclared: fields.outcomes,
    methodPreferences,
    scientificRelationships,
    knownConstraints: uniqueSorted(fields.constraints),
    declaredEquipment: equipment,
    centerContext: { mode: centerMode(fields.centers, fields.fields, fields.manufacturers, fields.models), declarations: fields.centers },
    knowledge,
    decisions: uniqueSorted(thinking?.decisionHistory.map((item) => item.decisionId) ?? []),
    uncertainties: uniqueSorted([...(thinkingOutput?.handoff.unresolvedUnknowns ?? []), ...intent.interpretation.missingInformation]),
    contradictions: uniqueSorted([...(thinkingOutput?.handoff.contradictions ?? []), ...intent.interpretation.contradictions]),
    safetyFlags: uniqueSorted(intent.interpretation.safetyFlags),
    provenance: uniqueSorted([`session:${runtime.sessionId}`, `validated-intent:${intent.confirmedAt ?? "UNDATE"}`, ...sourceRefs]),
    trace: [{ sequence: 1, operation: "BUILD_IMAGING_INPUT_PROJECTION", decision: handoffAuthorized ? "AUTHORIZED_ST_HANDOFF_CONSUMED" : "VALIDATED_CONTEXT_WITH_ST_GAP", inputDigest, outputDigest: logicalDigest({ inputDigest, knowledge }) }],
  };
  return parseImagingDesignInput(result);
};
