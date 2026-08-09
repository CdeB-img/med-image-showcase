import { logicalDigest, normalizeScientificText, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type { KnowledgeResult } from "@/features/knowledge-engine/types";
import type { ImagingDesignSession } from "@/features/imaging-study-designer/types";
import type { InterpretedFieldKey, ValidatedScientificIntent } from "@/features/protocol-designer/intake/types";
import type { ScientificThinkingSession } from "@/features/scientific-thinking/types";
import { parseResearchProjectConstructionInput, RESEARCH_PROJECT_CONSTRUCTION_VERSION, type ResearchProjectConstructionInput } from "./types";

const valuesFor = (intent: ValidatedScientificIntent, key: InterpretedFieldKey): string[] => {
  const review = intent.reviews[key];
  if (["REMOVED", "UNKNOWN", "NOT_RELEVANT"].includes(review?.state ?? "")) return [];
  const field = intent.interpretation[key];
  const value = review?.state === "CORRECTED" ? review.correctedValue : field.value;
  return uniqueSorted((Array.isArray(value) ? value : typeof value === "string" && value !== "UNKNOWN" ? [value] : [])
    .map((item) => normalizeScientificText(String(item))).filter(Boolean));
};

export const questionRequiresImaging = (intent: ValidatedScientificIntent, thinking: ScientificThinkingSession | null = null) => {
  const text = normalizeScientificText([
    intent.originalQuestion,
    intent.validatedReformulation,
    ...valuesFor(intent, "availableEquipment"),
    ...valuesFor(intent, "scientificDomain"),
    ...(thinking?.input.methodsMentioned ?? []),
  ].join(" ")).toLocaleLowerCase("fr-FR");
  const explicitlyWithoutImaging = /\b(sans|aucune?|hors)\s+(composante\s+d['’])?(modalité\s+d['’])?imagerie\b|\bimagerie\s+non\s+(requise|applicable)\b/.test(text);
  const specificImagingModality = /\b(irm|mri|cmr|scanner|ct|t1|t2|ecv|lge|oef|cmro|perfusion|spectral|photon|échograph|pet|spect)\b/.test(text);
  if (explicitlyWithoutImaging && !specificImagingModality) return false;
  return /\b(irm|mri|cmr|scanner|ct|imagerie|t1|t2|ecv|lge|oef|cmro|perfusion|spectral|photon|échograph|pet|spect)\b/.test(text);
};

const knowledgeProjection = (result: KnowledgeResult | null): ResearchProjectConstructionInput["knowledgeResults"] => ({
  resultId: result?.resultId ?? null,
  resultDigest: result?.resultDigest ?? null,
  coverageStatus: result?.coverageStatus ?? "NOT_REQUESTED_OR_UNAVAILABLE",
  assertions: result?.applicableAssertions.map((item) => ({ assertionId: item.stableId, text: item.text, applicability: item.applicability, sourceRef: `${item.providerId}:${item.locator}` })) ?? [],
  gaps: result?.gaps.map((item) => ({ code: item.code, explanation: item.explanation, resumeCondition: item.resumeCondition })) ?? [],
  limitations: uniqueSorted(result?.limitations ?? []),
});

const userInformation = (intent: ValidatedScientificIntent): ResearchProjectConstructionInput["userProvidedInformation"] => {
  const keys: InterpretedFieldKey[] = ["population", "pathologyOrCondition", "interventionsOrGroups", "outcomesMentioned", "studyDesign", "centers", "availableData", "constraints", "declaredTimings"];
  return keys.flatMap((key) => valuesFor(intent, key).map((value, index) => ({
    informationId: `project-information:${key}:${index + 1}:${logicalDigest(value)}`,
    kind: key,
    value,
    provenanceRef: `validated-intent:${intent.confirmedAt ?? "UNDATE"}`,
  })));
};

export const buildResearchProjectConstructionInput = (
  intent: ValidatedScientificIntent,
  knowledgeResult: KnowledgeResult | null,
  thinking: ScientificThinkingSession | null,
  imaging: ImagingDesignSession | null,
  runtime: { sessionId: string; contextVersion: number; projectId?: string; strategyVersion?: string },
): ResearchProjectConstructionInput => {
  const thinkingOutput = thinking?.output;
  const selectedQuestion = thinkingOutput?.selectedQuestionCandidate;
  const questionText = selectedQuestion?.text ?? normalizeScientificText(intent.validatedReformulation);
  const questionId = selectedQuestion?.questionId ?? `validated-question:${logicalDigest(questionText)}`;
  const imagingRequired = questionRequiresImaging(intent, thinking);
  const frozenImaging = imaging?.result.projectConstructionHandoff.status === "FROZEN_BY_HUMAN"
    && imaging.result.projectConstructionHandoff.projectHandoffReadiness === "PROJECT_HANDOFF_READY";
  const imagingResult = frozenImaging ? imaging.result : null;
  const imagingHandoff = imagingResult?.projectConstructionHandoff ?? null;
  const imagingHandoffStatus = imagingResult ? "FROZEN_BY_HUMAN" as const : imagingRequired ? "REQUIRED_BUT_NOT_READY" as const : "NOT_APPLICABLE" as const;
  const knowledge = knowledgeProjection(knowledgeResult);
  const projectId = runtime.projectId ?? thinking?.input.researchContext.researchProjectId ?? imaging?.input.researchProjectId ?? `research-project:${runtime.sessionId}`;
  const strategyVersion = runtime.strategyVersion ?? `context-${runtime.contextVersion}`;
  const material = {
    projectId,
    strategyVersion,
    questionId,
    questionText,
    objectives: thinkingOutput?.handoff.objectiveIds ?? [],
    hypotheses: thinkingOutput?.handoff.hypothesisIds ?? [],
    knowledgeDigest: knowledge.resultDigest,
    imagingDigest: imagingResult?.resultDigest ?? null,
    imagingHandoffStatus,
    imagingProjectHandoffReadiness: imagingHandoff?.projectHandoffReadiness ?? null,
    imagingEquipmentCompatibilityStatus: imagingHandoff?.equipmentCompatibilityStatus ?? null,
    imagingExecutableProtocolReadiness: imagingHandoff?.executableProtocolReadiness ?? null,
    contextVersion: runtime.contextVersion,
  };
  const inputDigest = logicalDigest(material);
  const input: ResearchProjectConstructionInput = {
    contractVersion: RESEARCH_PROJECT_CONSTRUCTION_VERSION,
    inputId: `research-project-construction-input:${inputDigest}`,
    projectId,
    strategyVersion,
    sourceHandoffs: {
      scientificThinking: { status: thinkingOutput?.handoff.status === "AUTHORIZED" ? "AUTHORIZED" : "VALIDATED_CONTEXT", outputRef: thinkingOutput?.outputId ?? null },
      imaging: {
        status: imagingHandoffStatus,
        resultRef: imagingResult?.resultId ?? null,
        projectHandoffReadiness: imagingHandoff?.projectHandoffReadiness ?? null,
        equipmentCompatibilityStatus: imagingHandoff?.equipmentCompatibilityStatus ?? null,
        executableProtocolReadiness: imagingHandoff?.executableProtocolReadiness ?? null,
      },
    },
    confirmedScientificQuestion: { questionId, text: questionText, confirmation: selectedQuestion?.reviewState === "ADOPTED" ? "HUMAN_CONFIRMED" : "VALIDATED_CONTEXT" },
    objectives: thinkingOutput?.objectives.filter((item) => thinkingOutput.handoff.objectiveIds.includes(item.objectiveId)).map((item) => ({ objectiveId: item.objectiveId, text: item.text, level: item.level, reviewState: item.reviewState })) ?? [],
    hypotheses: thinkingOutput?.hypotheses.filter((item) => thinkingOutput.handoff.hypothesisIds.includes(item.hypothesisId)).map((item) => ({ hypothesisId: item.hypothesisId, text: item.text, kind: item.kind, reviewState: item.reviewState })) ?? [],
    mechanisms: thinkingOutput?.handoff.mechanisms.map((item) => ({ mechanismId: item.mechanismId, text: item.text, support: item.support })) ?? [],
    scientificContext: {
      centralScientificObject: normalizeScientificText(thinkingOutput?.centralScientificObject ?? thinking?.input.scientificObjectTerms[0] ?? intent.validatedReformulation),
      pathologyOrCondition: valuesFor(intent, "pathologyOrCondition"),
      phenomena: uniqueSorted([...(thinking?.input.phenomena ?? []), ...valuesFor(intent, "phenomenaOfInterest")]),
      outcomes: valuesFor(intent, "outcomesMentioned"),
      exposuresOrInterventions: valuesFor(intent, "interventionsOrGroups"),
      studyDesignDeclarations: valuesFor(intent, "studyDesign"),
      centerDeclarations: valuesFor(intent, "centers"),
      availableData: valuesFor(intent, "availableData"),
      methodPreferences: uniqueSorted([...(thinking?.input.methodsMentioned ?? []), ...valuesFor(intent, "availableEquipment")]),
    },
    knowledgeResults: knowledge,
    imagingDesignResult: imagingResult,
    knownPopulationInformation: valuesFor(intent, "population"),
    knownTemporalInformation: valuesFor(intent, "declaredTimings"),
    knownConstraints: uniqueSorted(valuesFor(intent, "constraints")),
    existingDecisions: uniqueSorted([...(thinking?.decisionHistory.map((item) => item.decisionId) ?? []), ...(imaging?.decisionHistory.map((item) => item.decisionId) ?? [])]),
    uncertainties: uniqueSorted([...(thinkingOutput?.handoff.unresolvedUnknowns ?? []), ...intent.interpretation.missingInformation]),
    contradictions: uniqueSorted([...(thinkingOutput?.handoff.contradictions ?? []), ...intent.interpretation.contradictions]),
    userProvidedInformation: userInformation(intent),
    provenance: uniqueSorted([`session:${runtime.sessionId}`, `validated-intent:${intent.confirmedAt ?? "UNDATE"}`, ...(knowledgeResult?.sources.map((item) => item.sourceId) ?? []), ...(imagingResult?.provenance.sourceRefs ?? [])]),
    trace: [{ sequence: 1, operation: "BUILD_PROJECT_CONSTRUCTION_INPUT", decision: imagingResult ? "FROZEN_IMAGING_HANDOFF_CONSUMED" : imagingRequired ? "IMAGING_REQUIRED_BUT_NOT_READY" : "IMAGING_NOT_APPLICABLE", inputDigest, outputDigest: logicalDigest({ material, knowledge }) }],
  };
  return parseResearchProjectConstructionInput(input);
};
