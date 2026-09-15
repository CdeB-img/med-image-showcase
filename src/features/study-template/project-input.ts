import { presentResearchProjectAssertion } from "@/features/research-project-construction/contribution-owner-boundary";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import {
  CANONICAL_PROJECT_OBJECT_TYPES,
  type CanonicalProjectObjectType,
  type ProjectContextSnapshot,
} from "@/features/research-project-construction/canonical-project-backbone";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import {
  STUDY_TEMPLATE_PROJECT_INPUT_VERSION,
  type StudyTemplateProjectInput,
  type StudyTemplateProjectObject,
} from "./types.ts";

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const provenanceRefs = (value: {
  sourceTurnRefs?: string[];
  proposalSourceTurnRefs?: string[];
  adoptionSourceTurnRefs?: string[];
  evidenceRefs?: string[];
}) => [...new Set([
  ...(value.sourceTurnRefs ?? []),
  ...(value.proposalSourceTurnRefs ?? []),
  ...(value.adoptionSourceTurnRefs ?? []),
  ...(value.evidenceRefs ?? []),
])].sort();

const snapshotDigestIsValid = (snapshot: Readonly<ProjectContextSnapshot>) => {
  const { snapshotDigest: _snapshotDigest, ...material } = snapshot;
  return logicalDigest(material) === snapshot.snapshotDigest;
};

export const studyTemplateProjectInputFromProjectSnapshot = (
  snapshot: Readonly<ProjectContextSnapshot>,
): Readonly<StudyTemplateProjectInput> => {
  if (!snapshotDigestIsValid(snapshot)) throw new Error("TMP001_PROJECT_SNAPSHOT_DIGEST_MISMATCH");
  if (!snapshot.readOnly || snapshot.owner !== "RESEARCH_PROJECT") throw new Error("TMP001_PROJECT_SNAPSHOT_OWNER_MISMATCH");

  const currentObjects: StudyTemplateProjectObject[] = snapshot.objects.map((object) => ({
    stableId: object.stableId,
    versionRef: object.versionRef,
    version: object.version,
    type: object.type,
    content: presentResearchProjectAssertion(object.content, "polarity" in object ? object.polarity as string | null : null),
    scientificRole: object.scientificRole,
    semanticKey: object.semanticKey,
    epistemicState: object.epistemicState,
    adoptionState: "ADOPTED",
    actuality: "CURRENT",
    provenanceRefs: provenanceRefs(object.provenance),
    decisionRefs: [...object.decisionRefs],
  }));
  const historicalObjects: StudyTemplateProjectObject[] = snapshot.historicalObjectVersions.map((object) => ({
    stableId: object.stableId,
    versionRef: object.versionRef,
    version: object.version,
    type: object.type,
    content: presentResearchProjectAssertion(object.content, "polarity" in object ? object.polarity as string | null : null),
    scientificRole: object.scientificRole,
    semanticKey: `${object.type}:${object.stableId}`,
    epistemicState: "UNKNOWN",
    adoptionState: "ADOPTED",
    actuality: "SUPERSEDED",
    provenanceRefs: provenanceRefs(object.provenance),
    decisionRefs: [...object.decisionRefs],
  }));
  const withheldIssues: StudyTemplateProjectInput["issues"] = currentObjects
    .filter((object) => object.epistemicState === "WITHHELD")
    .map((object) => ({
      issueRef: `${object.stableId}:withheld`,
      kind: "WITHHELD",
      reason: "Valeur explicitement retenue par le propriétaire du Project.",
      sourceRefs: [object.versionRef, ...object.decisionRefs],
    }));
  const imagingApplicable = currentObjects.some((object) =>
    ["IMAGING_MODALITY", "ACQUISITION"].includes(object.type)
    && object.epistemicState !== "UNKNOWN"
    && object.epistemicState !== "WITHHELD");
  const lifecycle = snapshot.humanDecisions.some((decision) =>
    decision.status === "ADOPTED" && decision.projectVersion === snapshot.sourceProjectVersion)
    ? "ADOPTED" as const
    : "UNKNOWN" as const;

  const input: StudyTemplateProjectInput = {
    contract: "TMP001_PROJECT_INPUT",
    contractVersion: STUDY_TEMPLATE_PROJECT_INPUT_VERSION,
    owner: "RESEARCH_PROJECT",
    sourceKind: "PROJECT_CONTEXT_SNAPSHOT",
    projectId: snapshot.sourceProjectRef,
    projectVersion: snapshot.sourceProjectVersion,
    projectDigest: snapshot.sourceProjectDigest,
    projectRevision: snapshot.sourceProjectRevision,
    previousProjectVersion: snapshot.previousProjectVersion,
    lifecycle,
    sourceSnapshotDigest: snapshot.snapshotDigest,
    objects: [...currentObjects, ...historicalObjects],
    relations: [
      ...snapshot.relations.map((relation) => ({
        stableId: relation.stableId,
        versionRef: relation.versionRef,
        type: relation.type,
        sourceProjectRef: relation.sourceProjectRef,
        targetProjectRef: relation.targetProjectRef,
        polarity: relation.polarity,
        epistemicState: relation.epistemicState,
        adoptionState: "ADOPTED" as const,
        actuality: "CURRENT" as const,
        provenanceRefs: provenanceRefs(relation.provenance),
        decisionRefs: [...relation.decisionRefs],
      })),
      ...snapshot.historicalRelationVersions.map((relation) => ({
        stableId: relation.stableId,
        versionRef: relation.versionRef,
        type: relation.type,
        sourceProjectRef: relation.sourceProjectRef,
        targetProjectRef: relation.targetProjectRef,
        polarity: null,
        epistemicState: "UNKNOWN" as const,
        adoptionState: "ADOPTED" as const,
        actuality: "SUPERSEDED" as const,
        provenanceRefs: provenanceRefs(relation.provenance),
        decisionRefs: [...relation.decisionRefs],
      })),
    ],
    temporalQualifications: [
      ...snapshot.temporalQualifications.map((qualification) => ({
        stableId: qualification.stableId,
        versionRef: qualification.versionRef,
        subjectProjectRef: qualification.subjectProjectRef,
        temporalRole: qualification.temporalRole,
        anchor: qualification.anchor,
        actuality: "CURRENT" as const,
        provenanceRefs: provenanceRefs(qualification.provenance),
        decisionRefs: [...qualification.decisionRefs],
      })),
      ...snapshot.historicalTemporalQualificationVersions.map((qualification) => ({
        stableId: qualification.stableId,
        versionRef: qualification.versionRef,
        subjectProjectRef: qualification.subjectProjectRef,
        temporalRole: qualification.temporalRole,
        anchor: qualification.anchor,
        actuality: "SUPERSEDED" as const,
        provenanceRefs: provenanceRefs(qualification.provenance),
        decisionRefs: [...qualification.decisionRefs],
      })),
    ],
    expectedVariableOccasions: [
      ...snapshot.expectedVariableOccasions.map((occasion) => ({
        stableId: occasion.stableId,
        versionRef: occasion.versionRef,
        variableProjectRef: occasion.variableProjectRef,
        anchor: occasion.anchor,
        studyUnitOrGroupRef: occasion.studyUnitOrGroupRef,
        applicableContext: occasion.applicableContext,
        actuality: "CURRENT" as const,
        provenanceRefs: provenanceRefs(occasion.provenance),
        decisionRefs: [...occasion.decisionRefs],
      })),
      ...snapshot.historicalExpectedVariableOccasionVersions.map((occasion) => ({
        stableId: occasion.stableId,
        versionRef: occasion.versionRef,
        variableProjectRef: occasion.variableProjectRef,
        anchor: occasion.anchor,
        studyUnitOrGroupRef: null,
        applicableContext: null,
        actuality: "SUPERSEDED" as const,
        provenanceRefs: provenanceRefs(occasion.provenance),
        decisionRefs: [...occasion.decisionRefs],
      })),
    ],
    issues: [
      ...snapshot.openIssues.map((issue) => ({ ...issue, sourceRefs: [...issue.sourceRefs] })),
      ...withheldIssues,
    ],
    imagingApplicability: imagingApplicable ? "APPLICABLE" : "UNKNOWN",
    humanDecisions: snapshot.humanDecisions.map((decision) => ({
      ...decision,
      scope: [...decision.scope],
      targets: [...decision.targets],
      provenance: [...decision.provenance],
      impact: {
        affectedObjects: [...decision.impact.affectedObjects],
        affectedEngines: [...decision.impact.affectedEngines],
        reopenedGates: [...decision.impact.reopenedGates],
        obsoleteProjections: [...decision.impact.obsoleteProjections],
      },
    })),
    specializedResponsibilities: snapshot.specializedResponsibilities.map((responsibility) => ({
      owner: responsibility.owner,
      state: responsibility.state,
      retainedResponsibility: responsibility.retainedResponsibility,
      sourceRefs: [...responsibility.sourceItemIds],
    })),
    provenanceRefs: [
      snapshot.sourceProjectRef,
      snapshot.sourceProjectVersion,
      snapshot.sourceProjectDigest,
      snapshot.snapshotDigest,
      snapshot.sourceContributionRef,
      snapshot.sourceContributionDigest,
    ],
    readOnly: true,
  };
  return deepFreeze(input);
};

const canonicalTypeForLegacy = (value: string): CanonicalProjectObjectType => {
  const normalized = value.trim().toLocaleUpperCase("en-US");
  if ((CANONICAL_PROJECT_OBJECT_TYPES as readonly string[]).includes(normalized)) return normalized as CanonicalProjectObjectType;
  if (normalized.includes("QUESTION")) return "SCIENTIFIC_QUESTION";
  if (normalized.includes("OBJECTIVE")) return "OBJECTIVE";
  if (normalized.includes("HYPOTHESIS")) return "HYPOTHESIS";
  if (normalized.includes("POPULATION")) return "POPULATION";
  if (normalized.includes("DESIGN")) return "STUDY_DESIGN";
  if (normalized.includes("ENDPOINT")) return "ENDPOINT";
  if (normalized.includes("VARIABLE") || normalized.includes("MEASUREMENT")) return "CANONICAL_VARIABLE";
  if (normalized.includes("VISIT") || normalized.includes("TIME")) return "VISIT";
  if (normalized.includes("IMAGING") || normalized.includes("ACQUISITION")) return "IMAGING_MODALITY";
  if (normalized.includes("DATA")) return "DATA_NEED";
  return "PROJECT_INFORMATION";
};

const legacyAdoptionState = (status: string) => {
  const normalized = status.toLocaleUpperCase("en-US");
  if (normalized.includes("REJECT")) return "REJECTED" as const;
  if (normalized.includes("PENDING") || normalized.includes("CANDIDATE")) return "CANDIDATE" as const;
  return "ADOPTED" as const;
};

/**
 * Compatibilité explicite pour les seuls callers legacy. Le corridor nominal
 * Project V2 -> TMP ne doit pas utiliser cet adaptateur.
 */
export const studyTemplateProjectInputFromLegacyResearchProject = (
  project: Readonly<ResearchProjectDesignResult>,
): Readonly<StudyTemplateProjectInput> => {
  const objectsByRef = new Map<string, StudyTemplateProjectObject>();
  const addObject = (object: StudyTemplateProjectObject) => {
    if (!objectsByRef.has(object.versionRef)) objectsByRef.set(object.versionRef, object);
  };
  project.impactGraph.nodes.forEach((node) => addObject({
    stableId: node.nodeId,
    versionRef: node.versionRef ?? node.nodeId,
    version: 1,
    type: canonicalTypeForLegacy(node.canonicalType ?? node.type),
    content: node.label,
    scientificRole: node.scientificRole ?? null,
    semanticKey: `${node.canonicalType ?? node.type}:${node.nodeId}`,
    epistemicState: node.epistemicState ?? (node.status.toLocaleUpperCase("en-US").includes("UNKNOWN") ? "UNKNOWN" : "KNOWN"),
    adoptionState: legacyAdoptionState(node.status),
    actuality: /OBSOLETE|SUPERSEDED/.test(node.status.toLocaleUpperCase("en-US")) ? "SUPERSEDED" : "CURRENT",
    provenanceRefs: [...new Set([...(node.sourceRefs ?? []), node.nodeId])],
    decisionRefs: [],
  }));
  const addLegacy = (
    stableId: string,
    type: CanonicalProjectObjectType,
    content: string,
    reviewState: string = "ADOPTED",
    refs: string[] = [],
    scientificRole: string | null = null,
  ) => {
    const existing = [...objectsByRef.entries()].find(([, object]) => object.stableId === stableId);
    const candidate: StudyTemplateProjectObject = {
      stableId,
      versionRef: existing?.[1].versionRef ?? stableId,
      version: existing?.[1].version ?? 1,
      type,
      content: [...new Set([existing?.[1].content, content].filter((value): value is string => Boolean(value)))].join(" "),
      scientificRole: scientificRole ?? existing?.[1].scientificRole ?? null,
      semanticKey: `${type}:${stableId}`,
      epistemicState: existing?.[1].epistemicState ?? "KNOWN",
      adoptionState: legacyAdoptionState(reviewState),
      actuality: existing?.[1].actuality ?? "CURRENT",
      provenanceRefs: [...new Set([stableId, ...(existing?.[1].provenanceRefs ?? []), ...refs])],
      decisionRefs: [...(existing?.[1].decisionRefs ?? [])],
    };
    if (existing) objectsByRef.set(existing[0], candidate);
    else addObject(candidate);
  };
  addLegacy(project.scientificQuestion.questionId, "SCIENTIFIC_QUESTION", project.scientificQuestion.text);
  project.objectives.forEach((item) => addLegacy(item.objectiveId, "OBJECTIVE", item.text, item.reviewState));
  project.hypotheses.forEach((item) => addLegacy(item.hypothesisId, "HYPOTHESIS", item.text, item.reviewState));
  addLegacy(project.populationDesign.populationId, "POPULATION", project.populationDesign.populationConcept.clinicalContext.join("; ") || project.populationDesign.justification, project.populationDesign.reviewState, project.populationDesign.sourceRefs);
  project.studyDesignCandidates.forEach((item) => addLegacy(item.designId, "STUDY_DESIGN", `${item.family} ${item.label}`, item.reviewState, item.sourceSignals, item.family));
  project.endpointCandidates.forEach((item) => addLegacy(item.endpointId, "ENDPOINT", item.label, "CANDIDATE", [item.questionId, ...item.objectiveIds, ...item.variableIds], item.proposedRole));
  project.variables.forEach((item) => addLegacy(item.variableId, "CANONICAL_VARIABLE", item.definition, item.knowledgeStatus === "UNKNOWN" ? "CANDIDATE" : "ADOPTED", item.provenance, item.role));
  project.visits.forEach((item) => addLegacy(item.visitId, "VISIT", item.label, item.timingStatus === "KNOWN" ? "ADOPTED" : "CANDIDATE", item.dependencies, item.temporalRole));
  project.dataManagementRequirements.forEach((item) => addLegacy(item.requirementId, "DATA_NEED", item.reason, "CANDIDATE", item.sourceRefs, item.kind));
  if (project.imagingContribution.applicability === "APPLICABLE") addLegacy(
    project.imagingContribution.resultRef ?? `${project.resultId}:imaging`,
    "IMAGING_MODALITY",
    project.imagingContribution.resultRef ?? "Imaging contribution explicitly applicable",
    "ADOPTED",
    project.imagingContribution.acquisitionRefs,
  );

  const lifecycle = project.candidateVersion.status === "FROZEN_BY_HUMAN" || project.documentHandoff.status === "AUTHORIZED"
    ? "ADOPTED" as const
    : project.status === "REFUSED" ? "REJECTED" as const : "CANDIDATE" as const;
  const input: StudyTemplateProjectInput = {
    contract: "TMP001_PROJECT_INPUT",
    contractVersion: STUDY_TEMPLATE_PROJECT_INPUT_VERSION,
    owner: "RESEARCH_PROJECT",
    sourceKind: "LEGACY_RESEARCH_PROJECT_DESIGN_RESULT_COMPATIBILITY",
    projectId: project.documentHandoff.projectId,
    projectVersion: project.candidateVersion.versionId,
    projectDigest: project.resultDigest,
    projectRevision: 0,
    previousProjectVersion: project.candidateVersion.priorVersion || null,
    lifecycle,
    sourceSnapshotDigest: project.resultDigest,
    objects: [...objectsByRef.values()].sort((left, right) => left.versionRef.localeCompare(right.versionRef)),
    relations: project.impactGraph.edges.map((edge) => ({
      stableId: edge.edgeId,
      versionRef: edge.edgeId,
      type: edge.relation,
      sourceProjectRef: edge.from,
      targetProjectRef: edge.to,
      polarity: null,
      epistemicState: "KNOWN",
      adoptionState: "ADOPTED",
      actuality: "CURRENT",
      provenanceRefs: [edge.edgeId],
      decisionRefs: [],
    })),
    temporalQualifications: project.visits.map((visit) => ({
      stableId: visit.visitId,
      versionRef: visit.visitId,
      subjectProjectRef: visit.measurementIds[0] ?? visit.visitId,
      temporalRole: visit.temporalRole,
      anchor: null,
      actuality: "CURRENT",
      provenanceRefs: [visit.visitId, ...visit.dependencies],
      decisionRefs: [],
    })),
    expectedVariableOccasions: project.variables.flatMap((variable) => variable.timingIds.map((timingId) => ({
      stableId: `${variable.variableId}:${timingId}`,
      versionRef: `${variable.variableId}:${timingId}`,
      variableProjectRef: variable.variableId,
      anchor: null,
      studyUnitOrGroupRef: null,
      applicableContext: null,
      actuality: "CURRENT" as const,
      provenanceRefs: [variable.variableId, timingId],
      decisionRefs: [],
    }))),
    issues: [
      ...project.missingInformation.map((reason, index) => ({ issueRef: `legacy:unknown:${index + 1}`, kind: "UNKNOWN" as const, reason, sourceRefs: [project.resultId] })),
      ...project.limitations.map((reason, index) => ({ issueRef: `legacy:limitation:${index + 1}`, kind: "LIMITATION" as const, reason, sourceRefs: [project.resultId] })),
      ...project.contradictions.map((reason, index) => ({ issueRef: `legacy:contradiction:${index + 1}`, kind: "CONTRADICTION" as const, reason, sourceRefs: [project.resultId] })),
    ],
    imagingApplicability: project.imagingContribution.applicability === "REQUIRED_BUT_NOT_READY"
      ? "UNKNOWN"
      : project.imagingContribution.applicability,
    humanDecisions: project.documentHandoff.humanDecisions.map((decision) => ({ ...decision })),
    specializedResponsibilities: project.feasibilityAssessment.map((assessment) => ({
      owner: assessment.specializedEngine ?? assessment.domain,
      state: assessment.state,
      retainedResponsibility: assessment.gaps.join("; ") || assessment.domain,
      sourceRefs: [project.resultId, assessment.domain],
    })),
    provenanceRefs: [project.resultId, project.resultDigest, project.provenance.inputRef, ...project.provenance.sourceRefs],
    readOnly: true,
  };
  return deepFreeze(input);
};
