import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import type { ScientificThinkingOutput } from "@/features/scientific-thinking/types";
import type { ImagingDesignResult } from "@/features/imaging-study-designer/types";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import type { RegulatoryResolutionResult } from "@/features/regulatory-resolution/types";
import type { PatternCatalog } from "@/features/documentary-knowledge/types";
import type { StudyTemplateInstance } from "@/features/study-template/types";
import type { DocumentProjection } from "@/features/document-projection/types";
import { normalizeValidationText, validationDigest, validationUniqueSorted } from "./canonical";
import type { ValidationArtifact, ValidationArtifactType, ValidationElement, ValidationElementKind, ValidationHumanDecision, ValidationRelation } from "./types";

const unknownRef = (scope: string, value: string) => `${scope}:unknown:${validationDigest(normalizeValidationText(value))}`;
const contradictionRef = (scope: string, value: string) => `${scope}:contradiction:${validationDigest(normalizeValidationText(value))}`;

const element = (input: ValidationElement): ValidationElement => ({
  ...input,
  sourceRefs: validationUniqueSorted(input.sourceRefs),
  provenanceRefs: validationUniqueSorted(input.provenanceRefs),
});

const decisionElement = (decision: ValidationHumanDecision, owner: string): ValidationElement => element({
  ref: decision.decisionId,
  kind: "DECISION",
  semanticKey: decision.decisionId,
  status: decision.status,
  sourceRefs: decision.targets,
  provenanceRefs: decision.provenance,
  owner,
  version: decision.version,
});

export const adaptHumanDecision = (decision: HumanDecisionEnvelope): ValidationHumanDecision => ({
  decisionId: decision.decisionId,
  version: String(decision.version),
  status: decision.status,
  actor: decision.actor,
  mandate: decision.mandate,
  targets: [...decision.targets],
  provenance: [...decision.provenance],
});

const artifact = (input: Omit<ValidationArtifact, "elements" | "relations"> & { elements: ValidationElement[]; relations?: ValidationRelation[] }): ValidationArtifact => ({
  ...input,
  sourceArtifactRefs: validationUniqueSorted(input.sourceArtifactRefs),
  elements: [...new Map(input.elements.map((item) => [item.ref, element(item)])).values()].sort((left, right) => left.ref.localeCompare(right.ref)),
  relations: [...new Map((input.relations ?? []).map((item) => [item.ref, { ...item, sourceRefs: validationUniqueSorted(item.sourceRefs), provenanceRefs: validationUniqueSorted(item.provenanceRefs) }])).values()].sort((left, right) => left.ref.localeCompare(right.ref)),
});

const textElements = (values: readonly string[], scope: string, kind: Extract<ValidationElementKind, "UNKNOWN" | "CONTRADICTION">, owner: string, provenanceRefs: string[]) => values.map((value) => element({
  ref: kind === "UNKNOWN" ? unknownRef(scope, value) : contradictionRef(scope, value),
  kind,
  semanticKey: normalizeValidationText(value),
  status: kind === "UNKNOWN" ? "UNKNOWN" : "OPEN",
  sourceRefs: [],
  provenanceRefs,
  owner,
}));

export const adaptScientificThinkingOutput = (output: Readonly<ScientificThinkingOutput>): ValidationArtifact => {
  const provenance = validationUniqueSorted([output.provenance.inputRef, output.provenance.knowledgeResultRef ?? "", ...output.provenance.sourceRefs].filter(Boolean));
  const decisions = output.handoff.humanDecisions.map(adaptHumanDecision);
  return artifact({
    artifactId: output.outputId,
    artifactType: "SCIENTIFIC_THINKING_OUTPUT",
    version: output.contractVersion,
    digest: output.outputDigest,
    owner: "ST-001",
    sourceArtifactRefs: [output.provenance.inputRef],
    boundary: output.candidateNotice,
    elements: [
      element({ ref: `${output.outputId}:original-request`, kind: "ORIGINAL_REQUEST", semanticKey: normalizeValidationText(output.originalIdea), status: "KNOWN", sourceRefs: [output.provenance.inputRef], provenanceRefs: provenance, owner: "USER" }),
      ...output.questions.map((item) => element({ ref: item.questionId, kind: "OBJECT", semanticKey: normalizeValidationText(item.text), status: item.reviewState, sourceRefs: item.sourceTerms, provenanceRefs: provenance, owner: "ST-001" })),
      ...output.hypotheses.map((item) => element({ ref: item.hypothesisId, kind: "OBJECT", semanticKey: normalizeValidationText(item.text), status: item.reviewState, sourceRefs: item.linkedQuestionIds, provenanceRefs: provenance, owner: "ST-001" })),
      ...output.objectives.map((item) => element({ ref: item.objectiveId, kind: "OBJECT", semanticKey: normalizeValidationText(item.text), status: item.reviewState, sourceRefs: [...item.linkedQuestionIds, ...item.linkedHypothesisIds], provenanceRefs: provenance, owner: "ST-001" })),
      ...output.mechanisms.map((item) => element({ ref: item.mechanismId, kind: "OBJECT", semanticKey: normalizeValidationText(item.text), status: item.status, sourceRefs: item.linkedHypothesisIds, provenanceRefs: provenance, owner: "ST-001" })),
      ...textElements(output.unknowns, output.outputId, "UNKNOWN", "ST-001", provenance),
      ...textElements(output.contradictions, output.outputId, "CONTRADICTION", "ST-001", provenance),
      ...decisions.map((item) => decisionElement(item, "HUMAN")),
    ],
    relations: output.graph.edges.map((edge) => ({ ref: edge.edgeId, from: edge.from, to: edge.to, relationType: edge.relation, sourceRefs: [edge.edgeId], provenanceRefs: provenance, owner: "ST-001" })),
  });
};

export const adaptImagingDesignResult = (result: Readonly<ImagingDesignResult>): ValidationArtifact => {
  const provenance = validationUniqueSorted([result.provenance.inputRef, result.provenance.knowledgeResultRef ?? "", ...result.provenance.sourceRefs].filter(Boolean));
  const decisions = result.projectConstructionHandoff.humanDecisions.map(adaptHumanDecision);
  return artifact({
    artifactId: result.resultId,
    artifactType: "IMAGING_DESIGN_RESULT",
    version: result.contractVersion,
    digest: result.resultDigest,
    owner: "IMG-001",
    sourceArtifactRefs: [result.provenance.inputRef],
    boundary: result.projectionNotice,
    elements: [
      element({ ref: result.scientificQuestion.questionId, kind: "OBJECT", semanticKey: normalizeValidationText(result.scientificQuestion.text), status: result.scientificQuestion.confirmation, sourceRefs: [result.scientificQuestion.questionId], provenanceRefs: provenance, owner: "ST-001" }),
      ...result.objectives.map((item) => element({ ref: item.objectiveId, kind: "OBJECT", semanticKey: normalizeValidationText(item.text), status: item.reviewState, sourceRefs: [item.objectiveId], provenanceRefs: provenance, owner: "ST-001" })),
      ...result.hypotheses.map((item) => element({ ref: item.hypothesisId, kind: "OBJECT", semanticKey: normalizeValidationText(item.text), status: item.reviewState, sourceRefs: [item.hypothesisId], provenanceRefs: provenance, owner: "ST-001" })),
      ...result.phenomena.map((item) => element({ ref: item.phenomenonId, kind: "OBJECT", semanticKey: normalizeValidationText(item.label), status: item.reviewState, sourceRefs: [...item.objectiveIds, ...item.hypothesisIds, ...item.mechanismIds], provenanceRefs: [...provenance, ...item.evidenceRefs], owner: "IMG-001" })),
      ...result.biomarkerCandidates.map((item) => element({ ref: item.biomarkerId, kind: "OBJECT", semanticKey: normalizeValidationText(item.label), status: item.reviewState, sourceRefs: [...item.phenomenonIds, ...item.objectiveIds], provenanceRefs: [...provenance, ...item.evidenceRefs], owner: "IMG-001" })),
      ...result.modalityCandidates.map((item) => element({ ref: item.modalityId, kind: "OBJECT", semanticKey: normalizeValidationText(item.label), status: item.reviewState, sourceRefs: [...item.biomarkerIds, ...item.phenomenonIds], provenanceRefs: [...provenance, ...item.evidenceRefs], owner: "IMG-001" })),
      ...result.acquisitionStrategies.map((item) => element({ ref: item.acquisitionId, kind: "OBJECT", semanticKey: normalizeValidationText(item.level1.measurementNeed), status: item.reviewState, sourceRefs: [item.modalityId, ...item.biomarkerIds], provenanceRefs: provenance, owner: "IMG-001" })),
      ...textElements(result.missingInformation, result.resultId, "UNKNOWN", "IMG-001", provenance),
      ...textElements(result.contradictions, result.resultId, "CONTRADICTION", "IMG-001", provenance),
      ...decisions.map((item) => decisionElement(item, "HUMAN")),
      element({ ref: `${result.resultId}:executable-capability`, kind: "ENGINE_CAPABILITY", semanticKey: "executable protocol", status: result.projectConstructionHandoff.executableProtocolReadiness, sourceRefs: [], provenanceRefs: provenance, owner: "IMG-001" }),
    ],
    relations: result.graph.edges.map((edge) => ({ ref: edge.edgeId, from: edge.from, to: edge.to, relationType: edge.relation, sourceRefs: [edge.edgeId], provenanceRefs: provenance, owner: "IMG-001" })),
  });
};

export const adaptResearchProjectResult = (result: Readonly<ResearchProjectDesignResult>): ValidationArtifact => {
  const provenance = validationUniqueSorted([result.provenance.inputRef, ...result.provenance.sourceRefs]);
  const decisions = result.documentHandoff.humanDecisions.map(adaptHumanDecision);
  return artifact({
    artifactId: result.resultId,
    artifactType: "RESEARCH_PROJECT_RESULT",
    version: result.contractVersion,
    digest: result.resultDigest,
    owner: "RESEARCH_PROJECT",
    sourceArtifactRefs: [result.provenance.inputRef],
    boundary: result.projectionNotice,
    elements: [
      element({ ref: result.scientificQuestion.questionId, kind: "PROJECT_OBJECT", semanticKey: normalizeValidationText(result.scientificQuestion.text), status: result.scientificQuestion.confirmation, sourceRefs: [result.scientificQuestion.questionId], provenanceRefs: provenance, owner: "RESEARCH_PROJECT" }),
      ...result.objectives.map((item) => element({ ref: item.objectiveId, kind: "PROJECT_OBJECT", semanticKey: normalizeValidationText(item.text), status: item.reviewState, sourceRefs: [item.objectiveId], provenanceRefs: provenance, owner: "RESEARCH_PROJECT" })),
      ...result.hypotheses.map((item) => element({ ref: item.hypothesisId, kind: "PROJECT_OBJECT", semanticKey: normalizeValidationText(item.text), status: item.reviewState, sourceRefs: [item.hypothesisId], provenanceRefs: provenance, owner: "RESEARCH_PROJECT" })),
      element({ ref: result.populationDesign.populationId, kind: "PROJECT_OBJECT", semanticKey: normalizeValidationText(result.populationDesign.justification), status: result.populationDesign.reviewState, sourceRefs: result.populationDesign.sourceRefs, provenanceRefs: [...provenance, ...result.populationDesign.sourceRefs], owner: "RESEARCH_PROJECT" }),
      ...result.studyDesignCandidates.map((item) => element({ ref: item.designId, kind: "PROJECT_OBJECT", semanticKey: normalizeValidationText(item.label), status: item.reviewState, sourceRefs: item.sourceSignals, provenanceRefs: provenance, owner: "RESEARCH_PROJECT" })),
      ...result.variables.map((item) => element({ ref: item.variableId, kind: "PROJECT_OBJECT", semanticKey: normalizeValidationText(item.definition), status: item.knowledgeStatus, sourceRefs: [item.sourceRef, ...item.endpointIds], provenanceRefs: [...provenance, ...item.provenance], owner: "RESEARCH_PROJECT" })),
      ...result.endpointCandidates.map((item) => element({ ref: item.endpointId, kind: "PROJECT_OBJECT", semanticKey: normalizeValidationText(item.label), status: item.proposedRole, sourceRefs: [item.questionId, ...item.objectiveIds, ...item.hypothesisIds, ...item.variableIds], provenanceRefs: provenance, owner: "RESEARCH_PROJECT" })),
      ...textElements(result.missingInformation, result.resultId, "UNKNOWN", "RESEARCH_PROJECT", provenance),
      ...textElements(result.contradictions, result.resultId, "CONTRADICTION", "RESEARCH_PROJECT", provenance),
      ...decisions.map((item) => decisionElement(item, "HUMAN")),
    ],
    relations: result.dependencies.map((item) => ({ ref: item.dependencyId, from: item.from, to: item.to, relationType: "DEPENDS_ON", sourceRefs: [item.dependencyId], provenanceRefs: provenance, owner: "RESEARCH_PROJECT" })),
  });
};

export const adaptRegulatoryResolutionResult = (result: Readonly<RegulatoryResolutionResult>): ValidationArtifact => {
  const provenance = validationUniqueSorted([...result.provenance.researchProjectRefs, ...result.provenance.corpusRefs, ...result.provenance.sourceRefs]);
  const requirements = [...result.applicableRequirements, ...result.potentiallyApplicableRequirements, ...result.notApplicableRequirements, ...result.unresolvedRequirements];
  return artifact({
    artifactId: result.resolutionId,
    artifactType: "REGULATORY_RESOLUTION_RESULT",
    version: result.contractVersion,
    digest: validationDigest({ resolutionId: result.resolutionId, project: result.researchProjectDigest, corpus: result.corpusDigest }),
    owner: "REG-001",
    sourceArtifactRefs: [`${result.researchProjectId}@${result.researchProjectVersion}`],
    boundary: result.provenance.authorityBoundary,
    elements: [
      ...requirements.map((item) => element({ ref: item.requirementId, kind: "REQUIREMENT", semanticKey: normalizeValidationText(item.title), status: item.status, sourceRefs: [...item.sourceIds, ...item.provenance], provenanceRefs: [...provenance, ...item.provenance], owner: "REG-001" })),
      ...result.missingInformation.map((item) => element({ ref: `reg:unknown:${item.field}`, kind: "UNKNOWN", semanticKey: normalizeValidationText(item.field), status: "UNKNOWN", sourceRefs: item.blockedRequirementIds, provenanceRefs: [...provenance, ...item.provenance], owner: "REG-001" })),
      ...result.contradictions.map((item) => element({ ref: item.contradictionId, kind: "CONTRADICTION", semanticKey: normalizeValidationText(item.description), status: item.status, sourceRefs: item.requirementIds, provenanceRefs: [...provenance, ...item.provenance], owner: "REG-001" })),
      ...result.humanDecisions.map(adaptHumanDecision).map((item) => decisionElement(item, "HUMAN")),
    ],
  });
};

export const adaptDocumentaryPatternCatalog = (catalog: Readonly<PatternCatalog>): ValidationArtifact => artifact({
  artifactId: catalog.catalogId,
  artifactType: "DOCUMENTARY_PATTERN_CATALOG",
  version: catalog.version,
  digest: catalog.digest,
  owner: "DOC-002",
  sourceArtifactRefs: catalog.sourceCatalog.map((item) => item.sourceId),
  boundary: catalog.boundary,
  elements: catalog.patterns.map((item) => element({ ref: item.patternId, kind: "PATTERN", semanticKey: normalizeValidationText(item.name), status: item.status, sourceRefs: item.createdFrom, provenanceRefs: [...item.provenance.sourceIds, ...item.provenance.evidenceIds, ...item.provenance.factIds], owner: "DOC-002", version: item.version })),
  relations: catalog.relations.map((item) => ({ ref: item.relationId, from: item.fromId, to: item.toId, relationType: item.type, sourceRefs: item.evidenceIds, provenanceRefs: item.provenanceSourceIds, owner: "DOC-002" })),
});

export const adaptStudyTemplateInstance = (instance: Readonly<StudyTemplateInstance>): ValidationArtifact => artifact({
  artifactId: instance.instanceId,
  artifactType: "STUDY_TEMPLATE_INSTANCE",
  version: instance.contractVersion,
  digest: instance.digest,
  owner: "TMP-001",
  sourceArtifactRefs: [instance.inputRefs.researchProjectId, instance.inputRefs.regulatoryResolutionId, instance.inputRefs.documentaryCatalogId],
  boundary: instance.boundary,
  elements: [
    ...instance.nodes.map((item) => element({ ref: item.nodeId, kind: "TEMPLATE_NODE", semanticKey: normalizeValidationText(item.label), status: item.status, sourceRefs: item.supports.flatMap((support) => support.sourceRefs), provenanceRefs: item.provenance, owner: "TMP-001" })),
    ...instance.requirementMapping.map((item) => element({ ref: item.requirementId, kind: "REQUIREMENT", semanticKey: item.requirementId, status: item.status, sourceRefs: item.sourceRefs, provenanceRefs: item.sourceRefs, owner: "REG-001" })),
    ...instance.patternMapping.map((item) => element({ ref: item.patternId, kind: "PATTERN", semanticKey: item.patternId, status: item.patternStatus, sourceRefs: item.sourceRefs, provenanceRefs: item.sourceRefs, owner: "DOC-002" })),
    ...instance.unknowns.map((item) => element({ ref: item.unknownId, kind: "UNKNOWN", semanticKey: normalizeValidationText(item.field), status: "UNKNOWN", sourceRefs: [], provenanceRefs: item.provenance, owner: "RESEARCH_PROJECT" })),
    ...instance.conflicts.map((item) => element({ ref: item.conflictId, kind: "CONTRADICTION", semanticKey: normalizeValidationText(item.reason), status: item.status, sourceRefs: item.sources, provenanceRefs: item.sources, owner: "TMP-001" })),
    ...instance.humanDecisions.map((item) => decisionElement({ decisionId: item.decisionId, version: String(item.version), status: item.outcome, actor: item.actor, mandate: item.mandate, targets: item.targetNodeIds, provenance: item.provenance }, "HUMAN")),
  ],
  relations: instance.relations.map((item) => ({ ref: item.relationId, from: item.fromId, to: item.toId, relationType: item.type, sourceRefs: [item.relationId], provenanceRefs: item.provenance, owner: "TMP-001" })),
});

export const adaptDocumentProjection = (projection: Readonly<DocumentProjection>): ValidationArtifact => artifact({
  artifactId: projection.projectionId,
  artifactType: "DOCUMENT_PROJECTION",
  version: projection.contractVersion,
  digest: projection.projectionDigest,
  owner: "DOC-001",
  sourceArtifactRefs: [projection.source.projectId, projection.source.template?.templateInstanceId ?? ""].filter(Boolean),
  boundary: projection.boundary,
  elements: [
    ...projection.sections.map((section) => element({ ref: section.sectionId, kind: "DOCUMENT_CONTENT", semanticKey: section.contentDigest, status: section.status, sourceRefs: [...section.projectObjectIds, ...section.templateNodeIds, ...section.requirementIds, ...section.patternIds], provenanceRefs: section.provenanceRefs, owner: "DOC-001" })),
    ...projection.sections.flatMap((section) => section.templateNodeIds.map((nodeId) => element({ ref: nodeId, kind: "TEMPLATE_NODE", semanticKey: nodeId, status: section.templateStatus ?? section.status, sourceRefs: [nodeId], provenanceRefs: section.provenanceRefs, owner: "TMP-001" }))),
    ...projection.sections.flatMap((section) => section.requirementIds.map((requirementId) => element({ ref: requirementId, kind: "REQUIREMENT", semanticKey: requirementId, status: section.status, sourceRefs: [requirementId], provenanceRefs: section.provenanceRefs, owner: "REG-001" }))),
    ...projection.sections.flatMap((section) => section.patternIds.map((patternId) => element({ ref: patternId, kind: "PATTERN", semanticKey: patternId, status: "PRESERVED_REFERENCE", sourceRefs: [patternId], provenanceRefs: section.provenanceRefs, owner: "DOC-002" }))),
    ...textElements(projection.unknowns, projection.projectionId, "UNKNOWN", "RESEARCH_PROJECT", projection.provenanceRefs),
    ...textElements(projection.contradictions, projection.projectionId, "CONTRADICTION", "RESEARCH_PROJECT", projection.provenanceRefs),
    ...projection.humanDecisions.map(adaptHumanDecision).map((item) => decisionElement(item, "HUMAN")),
  ],
});

export const adaptRendererOutput = (projection: Readonly<DocumentProjection>, renderer: { rendererId: string; rendererVersion: string; format: "MARKDOWN" | "HTML" }): ValidationArtifact => {
  const source = adaptDocumentProjection(projection);
  return artifact({
    artifactId: `${projection.projectionId}:${renderer.rendererId}`,
    artifactType: "RENDERER_OUTPUT",
    version: renderer.rendererVersion,
    digest: validationDigest({ projectionDigest: projection.projectionDigest, format: renderer.format, sections: projection.sections.map((section) => section.contentDigest) }),
    owner: "DOC-001",
    sourceArtifactRefs: [projection.projectionId],
    boundary: "PASSIVE_RENDERER_OUTPUT_NOT_PROJECT_TRUTH",
    elements: source.elements.map((item) => ({ ...item, sourceRefs: validationUniqueSorted([item.ref, ...item.sourceRefs]) })),
    relations: source.relations.map((item) => ({ ...item, sourceRefs: validationUniqueSorted([item.ref, ...item.sourceRefs]) })),
  });
};

export const composeValidationSourceArtifact = (artifactId: string, artifacts: ReadonlyArray<ValidationArtifact>): ValidationArtifact => artifact({
  artifactId,
  artifactType: "COMPOSITE_SOURCE",
  version: "1.0.0",
  digest: validationDigest(artifacts.map((item) => ({ id: item.artifactId, version: item.version, digest: item.digest }))),
  owner: "MULTIPLE_UPSTREAM_OWNERS",
  sourceArtifactRefs: artifacts.map((item) => item.artifactId),
  boundary: "READ_ONLY_COMPOSITE_REFERENCES_NO_NEW_SOURCE_OF_TRUTH",
  elements: artifacts.flatMap((item) => item.elements),
  relations: artifacts.flatMap((item) => item.relations),
});
