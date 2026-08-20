import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HYBRID_PRIMARY_RUNTIME_ID, HYBRID_PRIMARY_RUNTIME_VERSION } from "../hybrid-primary";
import type {
  ScientificContributionItem,
  ScientificContributionRelation,
  ScientificInterpretationContributionEnvelope,
} from "../contracts";

type GateEvidence = {
  runtime: {
    runtimeId: string;
    runtimeVersion: string;
    model: string;
    logicalInterpretations: number;
    maximumProviderStarts: number;
  };
  scenarios: {
    scenario1Initial: ScientificInterpretationContributionEnvelope;
    scenario1Correction: ScientificInterpretationContributionEnvelope;
    scenario1TimingAndAge: ScientificInterpretationContributionEnvelope;
    scenario2Comparison: ScientificInterpretationContributionEnvelope;
    scenario3Longitudinal: ScientificInterpretationContributionEnvelope;
  };
  controls: {
    demographicEligibility: ScientificInterpretationContributionEnvelope;
  };
};

const evidencePath = process.env.FUNCTIONAL_RESET_GATE_EVIDENCE;
const evidence = evidencePath
  ? JSON.parse(readFileSync(evidencePath, "utf8")) as GateEvidence
  : null;
const describeEvidence = evidence ? describe : describe.skip;

const normalized = (value: string | null | undefined) => value?.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase() ?? "";
const activeItems = (contribution: ScientificInterpretationContributionEnvelope) => [
  ...contribution.scientificContent.explicitStatements,
  ...contribution.scientificContent.candidateObjects,
  ...contribution.scientificContent.inferredContext,
  ...contribution.scientificContent.contextualCandidates,
  ...contribution.scientificContent.negationsAndConstraints,
  ...contribution.scientificContent.temporalElements,
].filter((item) => item.epistemicBoundary.activeState !== false);
const hasActiveObject = (
  contribution: ScientificInterpretationContributionEnvelope,
  type: RegExp,
  content: RegExp,
) => contribution.scientificContent.candidateObjects.some((item) =>
  item.epistemicBoundary.activeState !== false
  && type.test(item.proposedType ?? "")
  && content.test(normalized(item.content)));
const hasActiveStructuredItem = (
  contribution: ScientificInterpretationContributionEnvelope,
  type: RegExp,
  content: RegExp,
) => activeItems(contribution).some((item) =>
  type.test(item.proposedType ?? "") && content.test(normalized(item.content)));
const allContributionItems = (contribution: ScientificInterpretationContributionEnvelope): ScientificContributionItem[] => [
  ...activeItems(contribution),
  ...contribution.scientificContent.ambiguities,
  ...contribution.scientificContent.unknowns,
  ...contribution.scientificContent.missingInformation,
  ...contribution.scientificContent.correctionsAndSupersessions,
  ...contribution.scientificContent.openDecisions,
  ...contribution.scientificContent.clarificationNeeds,
];
const hasForbiddenAdoption = (contribution: ScientificInterpretationContributionEnvelope) =>
  allContributionItems(contribution).some((item) => /PROJECT_ADOPTED/.test(item.epistemicBoundary.adoptionStatus ?? ""));
const relationEndpoints = (
  contribution: ScientificInterpretationContributionEnvelope,
  relation: ScientificContributionRelation,
) => {
  const items = activeItems(contribution);
  return [
    items.find((item) => item.itemId === relation.sourceItemId),
    items.find((item) => item.itemId === relation.targetItemId),
  ];
};
const isComparisonRelation = (relation: ScientificContributionRelation) =>
  /COMPARE|COMPARED|COMPARES|COMPARISON|VERSUS/i.test(relation.relationType);
const isImagingBiologyComparison = (
  contribution: ScientificInterpretationContributionEnvelope,
  relation: ScientificContributionRelation,
) => {
  if (!isComparisonRelation(relation) || relation.epistemicBoundary.activeState === false) return false;
  const endpoints = relationEndpoints(contribution, relation).map((item) => normalized(item?.content)).join(" ");
  return /\birm\b/.test(endpoints) && /biolog|biomarqueur/.test(endpoints);
};

describeEvidence("FUNCTIONAL-RESET-GATE-00 — direct Scientific Interpretation evidence", () => {
  it("FRG-C01 preserves the colchicine study roles and its two-turn correction without downstream projection", () => {
    const initial = evidence!.scenarios.scenario1Initial;
    const correction = evidence!.scenarios.scenario1Correction;
    const timingAndAge = evidence!.scenarios.scenario1TimingAndAge;

    expect.soft(evidence!.runtime).toMatchObject({
      runtimeId: HYBRID_PRIMARY_RUNTIME_ID,
      runtimeVersion: HYBRID_PRIMARY_RUNTIME_VERSION,
      model: "gemini-3.5-flash-lite",
      logicalInterpretations: 5,
      maximumProviderStarts: 6,
    });
    expect.soft(initial.source.turns.map((turn) => turn.content)).toEqual([
      "Je veux étudier l’effet de la colchicine après infarctus du myocarde, notamment sur l’inflammation et les lésions en IRM, dans une étude multicentrique comparant colchicine et placebo. Je veux également prévoir des biomarqueurs sanguins et mesurer la taille de l’infarctus à l’IRM.",
    ]);
    expect.soft(initial.source.rawOutputRef).not.toBeNull();
    expect.soft(initial.runtimeEvidence.technicalStatus).toBe("STRUCTURED_CONTRACT_VALID");
    expect.soft(initial.audit.unresolvedFindings).toEqual([]);
    expect.soft(hasActiveObject(initial, /INTERVENTION/i, /colchicine/)).toBe(true);
    expect.soft(hasActiveObject(initial, /COMPARATOR/i, /placebo/)).toBe(true);
    expect.soft(hasActiveObject(initial, /CONDITION/i, /infarctus du myocarde/)).toBe(true);
    expect.soft(hasActiveStructuredItem(initial, /(?:STUDY_)?DESIGN|SETTING/i, /multicentri/)).toBe(true);
    expect.soft(hasActiveObject(initial, /^MODALITY$/i, /\birm\b/)).toBe(true);
    expect.soft(hasActiveObject(initial, /^MEASURED_VARIABLE$/i, /inflammation/)).toBe(true);
    expect.soft(hasActiveObject(initial, /^MEASURED_VARIABLE$/i, /lesion/)).toBe(true);
    expect.soft(hasActiveObject(initial, /^BIOMARKER$/i, /biomarqueurs sanguins/)).toBe(true);
    expect.soft(hasActiveObject(initial, /ENDPOINT|OUTCOME|MEASURE/i, /taille de l.infarctus/)).toBe(true);
    expect.soft(initial.scientificContent.candidateObjects.some((item) => /_OR_|\bOR\b|\//i.test(item.proposedType ?? ""))).toBe(false);
    expect.soft(initial.scientificContent.candidateObjects.some((item) =>
      /POPULATION/i.test(item.proposedType ?? "") && /medicament|placebo|deux populations/.test(normalized(item.content)))).toBe(false);
    expect.soft(initial.scientificContent.candidateObjects.some((item) =>
      /METHOD/i.test(item.proposedType ?? "") && /irm.*biolog|biolog.*irm/.test(normalized(item.content)))).toBe(false);
    expect.soft(initial.scientificContent.candidateRelations.some((relation) =>
      isImagingBiologyComparison(initial, relation))).toBe(false);
    expect.soft(hasForbiddenAdoption(initial)).toBe(false);
    expect.soft(initial.decisionBoundary.projectWriteAuthorized).toBe(false);

    expect.soft(correction.identity.contributionId).not.toBe(initial.identity.contributionId);
    expect.soft(correction.identity.previousContributionId).toBe(initial.identity.contributionId);
    expect.soft(correction.source.sourceRefs).toEqual(["turn-1", "turn-2"]);
    expect.soft(correction.source.turns.at(-1)?.content).toBe(
      "L’IRM et les biomarqueurs biologiques sont complémentaires. Je ne souhaite pas comparer les deux méthodes.",
    );
    expect.soft(correction.source.rawOutputRef).not.toBeNull();
    expect.soft(allContributionItems(correction).some((item) =>
      /complement/.test(normalized(item.content)) && item.polarity === "AFFIRMED")).toBe(true);
    expect.soft(correction.scientificContent.negationsAndConstraints.some((item) =>
      /ne pas comparer|pas comparer/.test(normalized(item.content))
      && item.epistemicBoundary.sourceTurnIds.includes("turn-2"))).toBe(true);
    expect.soft(correction.scientificContent.candidateRelations.some((relation) =>
      isImagingBiologyComparison(correction, relation))).toBe(false);
    expect.soft(correction.audit.unresolvedFindings).toEqual([]);

    expect.soft(timingAndAge.source.sourceRefs).toEqual(["turn-1", "turn-2", "turn-3"]);
    expect.soft(timingAndAge.identity.previousContributionId).toBe(correction.identity.contributionId);
    expect.soft(timingAndAge.source.turns.at(-1)?.content).toBe(
      "Finalement je veux faire l’IRM entre J3 et J5 et limiter l’âge à 75 ans.",
    );
    expect.soft(hasActiveStructuredItem(timingAndAge, /TEMPORAL|TIMING|TIMEPOINT/i, /j3.*j5/)).toBe(true);
    expect.soft(hasActiveObject(timingAndAge, /POPULATION|ELIGIBILITY|CRITERION/i, /75 ans/)).toBe(true);
    expect.soft(hasActiveObject(timingAndAge, /BIOMARKER/i, /biomarqueurs sanguins/)).toBe(true);
    expect.soft(hasActiveObject(timingAndAge, /ENDPOINT|OUTCOME|MEASURE/i, /taille de l.infarctus/)).toBe(true);
    expect.soft(timingAndAge.scientificContent.candidateRelations.every((relation) =>
      relation.epistemicBoundary.activeState === false
      || relationEndpoints(timingAndAge, relation).every(Boolean))).toBe(true);
    expect.soft(timingAndAge.audit.unresolvedFindings).toEqual([]);
  });

  it("FRG-C02 distinguishes a true cardiac CT versus MRI modality comparison", () => {
    const contribution = evidence!.scenarios.scenario2Comparison;
    expect.soft(contribution.source.turns.map((turn) => turn.content)).toEqual(["Je veux comparer CT et IRM cardiaque."]);
    expect.soft(hasActiveObject(contribution, /MODALITY/i, /\bct\b/)).toBe(true);
    expect.soft(hasActiveObject(contribution, /MODALITY/i, /\birm\b/)).toBe(true);
    const comparison = contribution.scientificContent.candidateRelations.find((relation) =>
      isComparisonRelation(relation) && relation.epistemicBoundary.activeState !== false);
    expect.soft(comparison).toBeDefined();
    expect.soft(comparison && relationEndpoints(contribution, comparison).every((item) => item?.proposedType === "MODALITY")).toBe(true);
    expect.soft(contribution.audit.unresolvedFindings).toEqual([]);
    expect.soft(hasForbiddenAdoption(contribution)).toBe(false);
  });

  it("FRG-C03 preserves intervention, longitudinal imaging, variable timing and unresolved visual stability", () => {
    const contribution = evidence!.scenarios.scenario3Longitudinal;
    expect.soft(contribution.source.turns.map((turn) => turn.content)).toEqual([
      "Je veux étudier les changements vasculaires rétiniens après traitement. On a une acquisition initiale et une acquisition de contrôle. Le contrôle n’est pas toujours fait au même moment. Je voudrais comparer les patients dont la fonction visuelle reste stable et les autres. Mais je n’ai pas encore défini ce que veut dire stable. La technique d’imagerie vasculaire varie aussi selon le centre. On peut avancer sur l’inventaire, mais pas inventer le critère clinique ni l’équivalence des modalités.",
    ]);
    expect.soft(hasActiveObject(contribution, /INTERVENTION/i, /traitement/)).toBe(true);
    expect.soft(hasActiveObject(contribution, /POPULATION|GROUP|COMPARATOR/i, /stable/)).toBe(true);
    expect.soft(hasActiveObject(contribution, /POPULATION|GROUP|COMPARATOR/i, /autres/)).toBe(true);
    expect.soft(hasActiveObject(contribution, /METHOD|MODALITY/i, /imagerie vasculaire/)).toBe(true);
    expect.soft(contribution.scientificContent.temporalElements.some((item) =>
      /acquisition initiale/.test(normalized(item.content)))).toBe(true);
    expect.soft(contribution.scientificContent.temporalElements.some((item) =>
      /acquisition de controle/.test(normalized(item.content)))).toBe(true);
    expect.soft(contribution.scientificContent.temporalElements.some((item) =>
      /pas toujours.*meme moment|non toujours.*meme moment|non systematiquement.*meme moment|moment(?: de controle)? variable|timing variable|variable timing/.test(normalized(item.content)))).toBe(true);
    expect.soft([
      ...contribution.scientificContent.unknowns,
      ...contribution.scientificContent.missingInformation,
    ].some((item) => /definition.*stable|definition.*stabilite/.test(normalized(item.content)))).toBe(true);
    const comparison = contribution.scientificContent.candidateRelations.find((relation) =>
      isComparisonRelation(relation) && relation.epistemicBoundary.activeState !== false);
    expect.soft(comparison).toBeDefined();
    expect.soft(comparison && relationEndpoints(contribution, comparison).every((item) =>
      item && /GROUP|POPULATION|COMPARISON_ARM|COMPARATOR/i.test(`${item.proposedType ?? ""} ${item.studyRole ?? ""}`))).toBe(true);
    expect.soft(contribution.scientificContent.candidateRelations.some((relation) =>
      /EQUIVAL/i.test(relation.relationType) && relation.polarity === "AFFIRMED")).toBe(false);
    expect.soft(contribution.audit.unresolvedFindings).toEqual([]);
    expect.soft(hasForbiddenAdoption(contribution)).toBe(false);
  });

  it("FRG-C04 represents a different demographic eligibility restriction without changing its direction", () => {
    const contribution = evidence!.controls.demographicEligibility;
    expect.soft(contribution.source.turns.map((turn) => turn.content)).toEqual([
      "Je souhaite limiter l’inclusion aux participants âgés d’au moins 40 ans.",
    ]);
    const criterion = contribution.scientificContent.candidateObjects.find((item) =>
      item.epistemicBoundary.activeState !== false
      && /POPULATION|ELIGIBILITY|CRITERION/i.test(item.proposedType ?? "")
      && /40 ans/.test(normalized(item.content)));
    expect.soft(criterion).toBeDefined();
    expect.soft(criterion && /au moins|minim/.test(normalized(criterion.content))).toBe(true);
    expect.soft(criterion && /maxim|moins de/.test(normalized(criterion.content))).toBe(false);
    expect.soft(contribution.audit.unresolvedFindings).toEqual([]);
    expect.soft(hasForbiddenAdoption(contribution)).toBe(false);
  });
});
