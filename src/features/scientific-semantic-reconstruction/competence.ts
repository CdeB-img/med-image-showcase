import { comparableScientificText } from "@/features/knowledge-engine/canonical";
import type { ScientificSemanticModel, SemanticElement } from "./types";
import type { GoldSemanticRelation, GoldSemanticTarget, SemanticCompetenceCase } from "./competence-fixtures";

export type SemanticCaseMetrics = {
  caseId: string;
  explicitObjectRecall: number;
  explicitRelationRecall: number;
  criticalSemanticRecall: number;
  comparatorPreserved: boolean;
  interventionPreserved: boolean;
  modalityPreserved: boolean;
  semanticDriftRate: number;
  unsupportedInferenceRate: number;
  criticalUnsupportedInferenceCount: number;
  ellipsisDetectionRate: number;
  ambiguityPreservationRate: number;
  unnecessaryClarificationRate: number;
  routeCorrect: boolean;
  correctionPropagation: boolean;
  multiTurnContextPreserved: boolean;
  genericDomainCollapse: boolean;
  absoluteBlockers: string[];
};

export type SemanticCampaignMetrics = {
  split: SemanticCompetenceCase["split"];
  caseCount: number;
  explicitObjectRecall: number;
  explicitRelationRecall: number;
  criticalSemanticRecall: number;
  comparatorPreservation: number;
  interventionPreservation: number;
  modalityPreservation: number;
  semanticDriftRate: number;
  unsupportedInferenceRate: number;
  criticalUnsupportedInferenceRate: number;
  ellipsisDetectionRate: number;
  ambiguityPreservationRate: number;
  unnecessaryClarificationRate: number;
  routeCorrectness: number;
  correctionPropagationRate: number;
  multiTurnCriticalContextLoss: number;
  genericDomainCollapseRate: number;
  absoluteBlockers: string[];
  passesSem001Thresholds: boolean;
};

const comparable = (value: string) => comparableScientificText(value)
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .replace(/computed tomography|tomodensitometrie/g, "ct")
  .replace(/magnetic resonance imaging|imagerie par resonance magnetique/g, "mri")
  .replace(/positron emission tomography|tomographie par emission de positons/g, "pet")
  .replace(/ultrasonography|ultrasound imaging/g, "ultrasound")
  .replace(/virtual non[- ]?contrast|virtual unenhanced|imagerie virtuelle sans contraste|virtuel sans contraste/g, "virtual noncontrast")
  .replace(/\birm\b/g, "mri")
  .replace(/\b(?:tdm|scanner)\b/g, "ct")
  .replace(/\btep\b/g, "pet")
  .replace(/\bechographie\b/g, "ultrasound")
  .replace(/\b(?:ultrasonore|ultrasons?|ultrasonic)\b/g, "ultrasound")
  .replace(/\b(?:n[' ]|ne )(?:est|sont|sera|seront) pas\b/g, "excluded")
  .replace(/\b(?:pas|non)\s+concerne(?:e|es|s)?\b|\bnot\s+concerned\b/g, "excluded")
  .replace(/\b(?:hors|en dehors du)\s+perimetre\b|\bout\s+of\s+scope\b/g, "excluded")
  .replace(/\b(?:non\s+inclus(?:e|es|s)?|not\s+included)\b/g, "excluded")
  .replace(/\b(?:exclusion de|exclure|exclu|exclue|exclus|exclues|excluded|excluding)\b/g, "excluded")
  .replace(/\b(?:comme|en tant que|mon|ma|mes|my)\b/g, " ")
  .replace(/dans le temps|au cours du temps|over time/g, "longitudinal")
  .replace(/\b(suivre|suivi|follow up|follow-up)\b/g, "suivi");
const terms = (value: string) => new Set(comparable(value).split(/[^\p{L}\p{N}*]+/u).filter((item) => item.length > 1));
const termEquivalent = (left: string, right: string) => {
  if (left === right) return true;
  const shortest = Math.min(left.length, right.length);
  if (shortest < 6) return false;
  let commonPrefix = 0;
  while (commonPrefix < shortest && left[commonPrefix] === right[commonPrefix]) commonPrefix += 1;
  return commonPrefix / shortest >= .75;
};
export const semanticMeaningMatches = (left: string, right: string) => {
  const a = comparable(left);
  const b = comparable(right);
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const leftTerms = terms(a); const rightTerms = terms(b);
  const matchedLeft = [...leftTerms].filter((item) => [...rightTerms].some((other) => termEquivalent(item, other)));
  const overlap = matchedLeft.length;
  if (overlap / Math.max(1, Math.min(leftTerms.size, rightTerms.size)) >= 0.75) return true;
  const sharedModalityHead = matchedLeft.some((item) => /^(modalit|method|techniq|approch)/.test(item));
  const genericModifiers = /^(different|differente|differentes|multiple|multiples|imaging|imagerie)$/;
  return sharedModalityHead && [...leftTerms, ...rightTerms].filter((item) => !matchedLeft.some((matched) => termEquivalent(item, matched))).every((item) => genericModifiers.test(item));
};
const forbiddenPropositionMatches = (actual: string, forbidden: string) => {
  const actualTerms = [...terms(actual)];
  const forbiddenTerms = [...terms(forbidden)].filter((term) => !/^(comme|with|avec|the|les|des|une|dans|pour)$/.test(term));
  return forbiddenTerms.length > 0 && forbiddenTerms.every((expected) => actualTerms.some((observed) => termEquivalent(observed, expected)));
};
const elementTexts = (element: SemanticElement) => [element.canonicalMeaning, element.sourceSpan?.text ?? ""];
const compositionalElementTexts = (element: SemanticElement, model: ScientificSemanticModel) => {
  const direct = elementTexts(element);
  const compositionalRelations = model.relations.filter((relation) => relation.epistemicStatus === "EXPLICIT_USER_STATED"
    && relation.polarity !== "NEGATED"
    && [relation.sourceElementId, relation.targetElementId].includes(element.semanticElementId)
    && /BOUND|QUALIF|TRIGGER|DERIV|CONSTRAIN|HAS_|_OF$/i.test(relation.relationType));
  const activeElements = model.elements.filter((item) => item.epistemicStatus !== "REJECTED_BY_USER");
  const composed = compositionalRelations.flatMap((relation) => {
    const neighborId = relation.sourceElementId === element.semanticElementId ? relation.targetElementId : relation.sourceElementId;
    const neighbor = activeElements.find((item) => item.semanticElementId === neighborId && item.epistemicStatus === "EXPLICIT_USER_STATED");
    if (!neighbor) return [];
    return direct.flatMap((left) => elementTexts(neighbor).flatMap((right) => [`${left} ${right}`, `${right} ${left}`]));
  });
  return [...new Set([...direct, ...composed])];
};
const targetMeaningPresent = (target: GoldSemanticTarget, element: SemanticElement, model: ScientificSemanticModel) =>
  compositionalElementTexts(element, model).some((value) => [target.meaning, ...target.aliases].some((alias) => semanticMeaningMatches(value, alias)));
const targetTypePresent = (target: GoldSemanticTarget, element: SemanticElement) => element.type === target.type
  || target.type === "COMPARATOR" && ["COMPARATOR_ARM", "REFERENCE_STANDARD"].includes(element.studyRole);
const targetPresent = (target: GoldSemanticTarget, elements: SemanticElement[], model: ScientificSemanticModel, explicitOnly = false) => elements.some((element) =>
  (!explicitOnly || element.epistemicStatus === "EXPLICIT_USER_STATED")
  && targetTypePresent(target, element)
  && targetMeaningPresent(target, element, model),
);
const relationFamily = (value: string) => {
  const normalized = comparable(value).replace(/[^a-z0-9]+/g, "_");
  if (/compar|versus|oppos/.test(normalized)) return "COMPARISON";
  if (/predict|prognos/.test(normalized)) return "PREDICTION";
  if (/associ|relat|link/.test(normalized)) return "ASSOCIATION";
  if (/caus/.test(normalized)) return "CAUSALITY";
  if (/measur|quantif|observ|detect|evaluat/.test(normalized)) return "MEASUREMENT";
  if (/chang|evol|progress/.test(normalized)) return "CHANGE";
  if (/deriv/.test(normalized)) return "DERIVATION";
  if (/trigger/.test(normalized)) return "TRIGGER";
  if (/influenc|modify/.test(normalized)) return "MODIFICATION";
  if (/distingu|differentiat/.test(normalized)) return "DISTINCTION";
  if (/repeat|retest/.test(normalized)) return "REPETITION";
  if (/recover/.test(normalized)) return "RECOVERY";
  if (/locali|register|fusion/.test(normalized)) return "LOCALIZATION";
  return normalized;
};
const relationMeaningPresent = (actual: string, aliases: string[]) => aliases.some((alias) =>
  semanticMeaningMatches(actual, alias) || relationFamily(actual) === relationFamily(alias));
const relationPresent = (target: GoldSemanticRelation, model: ScientificSemanticModel) => model.relations.some((relation) => {
  if (relation.epistemicStatus !== "EXPLICIT_USER_STATED") return false;
  const source = model.elements.find((item) => item.semanticElementId === relation.sourceElementId);
  const destination = model.elements.find((item) => item.semanticElementId === relation.targetElementId);
  if (!source || !destination) return false;
  const matchesEndpoint = (element: SemanticElement, expected: string) => elementTexts(element).some((value) => semanticMeaningMatches(value, expected));
  const family = relationFamily(relation.relationType);
  const symmetric = ["COMPARISON", "ASSOCIATION", "DISTINCTION"].includes(family);
  const directEndpoints = matchesEndpoint(source, target.source) && matchesEndpoint(destination, target.target);
  const reversedEndpoints = matchesEndpoint(source, target.target) && matchesEndpoint(destination, target.source);
  const inverseMeasurement = family === "MEASUREMENT"
    && target.relationAliases.some((alias) => /MEASURED_BY|OBSERVED_BY|DETECTED_BY/i.test(alias))
    && /MEASURES|OBSERVES|DETECTS/i.test(relation.relationType)
    || family === "MEASUREMENT"
    && target.relationAliases.some((alias) => /MEASURES|OBSERVES|DETECTS/i.test(alias))
    && /MEASURED_BY|OBSERVED_BY|DETECTED_BY/i.test(relation.relationType);
  const endpoints = directEndpoints
    || symmetric && matchesEndpoint(source, target.target) && matchesEndpoint(destination, target.source);
  return (endpoints && relationMeaningPresent(relation.relationType, target.relationAliases))
    || (reversedEndpoints && inverseMeasurement);
});
const ratio = (numerator: number, denominator: number) => denominator ? numerator / denominator : 1;
const average = (values: number[]) => ratio(values.reduce((sum, value) => sum + value, 0), values.length);
const active = (model: ScientificSemanticModel) => model.elements.filter((item) => item.epistemicStatus !== "REJECTED_BY_USER");

export const evaluateSemanticCase = (fixture: SemanticCompetenceCase, model: ScientificSemanticModel): SemanticCaseMetrics => {
  const elements = active(model);
  const modelTargetPresent = (target: GoldSemanticTarget, explicitOnly = false) => targetPresent(target, elements, model, explicitOnly) || target.type === "SCIENTIFIC_INTENT" && elements.some((intent) => {
    if (intent.type !== "SCIENTIFIC_INTENT" || explicitOnly && intent.epistemicStatus !== "EXPLICIT_USER_STATED") return false;
    const timingElements = elements.filter((timing) => timing.type === "TIMING" && (!explicitOnly || timing.epistemicStatus === "EXPLICIT_USER_STATED") && model.relations.some((relation) =>
      [relation.sourceElementId, relation.targetElementId].includes(intent.semanticElementId)
      && [relation.sourceElementId, relation.targetElementId].includes(timing.semanticElementId)));
    return timingElements.some((timing) => [target.meaning, ...target.aliases].some((meaning) => semanticMeaningMatches(`${intent.canonicalMeaning} ${timing.canonicalMeaning}`, meaning)
      || semanticMeaningMatches(`${intent.sourceSpan?.text ?? ""} ${timing.sourceSpan?.text ?? ""}`, meaning)));
  });
  const explicitHits = fixture.gold.requiredExplicitObjects.filter((target) => modelTargetPresent(target, true));
  const relationHits = fixture.gold.requiredRelations.filter((target) => relationPresent(target, model));
  const criticalObjects = fixture.gold.requiredExplicitObjects.filter((item) => item.critical);
  const criticalRelations = fixture.gold.requiredRelations.filter((item) => item.critical);
  const criticalHits = criticalObjects.filter((target) => modelTargetPresent(target, true)).length + criticalRelations.filter((target) => relationPresent(target, model)).length;
  const affirmedElementPropositions = elements.filter((element) => element.polarity === "AFFIRMED" && element.type !== "CONSTRAINT");
  const affirmedRelationPropositions = model.relations.filter((relation) => relation.polarity === "AFFIRMED" && relation.epistemicStatus !== "REJECTED_BY_USER");
  const forbiddenHits = fixture.gold.forbiddenInferences.filter((forbidden) =>
    affirmedElementPropositions.some((element) => elementTexts(element).some((value) => forbiddenPropositionMatches(value, forbidden)))
    || affirmedRelationPropositions.some((relation) => forbiddenPropositionMatches(relation.relationType, forbidden)
      || /caus|associ|predict|compar|measur|quantif|chang|evol/i.test(forbidden) && relationFamily(relation.relationType) === relationFamily(forbidden)),
  );
  const inferred = elements.filter((item) => ["INFERRED_HIGH_CONFIDENCE", "INFERRED_CANDIDATE", "SUPPORTED_CANDIDATE", "UNSUPPORTED_CANDIDATE"].includes(item.epistemicStatus));
  const acceptedInferenceHits = inferred.filter((element) => fixture.gold.acceptableInferences.some((allowed) => elementTexts(element).some((value) => semanticMeaningMatches(value, allowed))));
  const unsupportedInferences = inferred.filter((item) => item.epistemicStatus === "UNSUPPORTED_CANDIDATE" && !acceptedInferenceHits.includes(item));
  const typeRequired = (type: SemanticElement["type"]) => fixture.gold.requiredExplicitObjects.filter((item) => item.type === type);
  const typePreserved = (type: SemanticElement["type"]) => typeRequired(type).every((target) => modelTargetPresent(target, true));
  const requiredAmbiguities = fixture.gold.requiredAmbiguities;
  const ambiguityHits = requiredAmbiguities.filter((required) => [...model.ambiguities, ...model.ellipses, ...model.missingConcepts].some((value) => semanticMeaningMatches(value, required)));
  const forbiddenClarifications = fixture.gold.forbiddenClarifications.filter((forbidden) => model.clarificationCandidates.some((item) => semanticMeaningMatches(item.question, forbidden)));
  const correctionPropagation = !fixture.gold.correction || (
    model.elements.some((item) => item.epistemicStatus === "REJECTED_BY_USER" && elementTexts(item).some((value) => semanticMeaningMatches(value, fixture.gold.correction!.rejectedMeaning)))
    && elements.some((item) => elementTexts(item).some((value) => semanticMeaningMatches(value, fixture.gold.correction!.activeMeaning)))
  );
  const contextRetained = (fixture.gold.contextMustRetain ?? []).every((required) => elements.some((item) => elementTexts(item).some((value) => semanticMeaningMatches(value, required))));
  const genericDomainCollapse = fixture.gold.requiredExplicitObjects.some((target) => !modelTargetPresent(target, true))
    && elements.some((item) => item.type === "SUBJECT" && ["cardiologie", "oncologie", "neurologie", "imagerie"].some((generic) => semanticMeaningMatches(item.canonicalMeaning, generic)));
  const absoluteBlockers: string[] = [];
  fixture.gold.requiredExplicitObjects.forEach((target) => { if (!modelTargetPresent(target, true)) absoluteBlockers.push(`EXPLICIT_${target.type}_LOST:${target.meaning}`); });
  fixture.gold.requiredRelations.forEach((target) => { if (!relationPresent(target, model)) absoluteBlockers.push(`RELATION_LOST:${target.source}->${target.target}`); });
  if (forbiddenHits.length) absoluteBlockers.push(...forbiddenHits.map((item) => `FORBIDDEN_INFERENCE:${item}`));
  if (!correctionPropagation) absoluteBlockers.push("CORRECTION_NOT_PROPAGATED");
  if (!contextRetained) absoluteBlockers.push("MULTI_TURN_CONTEXT_LOST");
  if (genericDomainCollapse) absoluteBlockers.push("GENERIC_DOMAIN_COLLAPSE");
  return {
    caseId: fixture.caseId,
    explicitObjectRecall: ratio(explicitHits.length, fixture.gold.requiredExplicitObjects.length),
    explicitRelationRecall: ratio(relationHits.length, fixture.gold.requiredRelations.length),
    criticalSemanticRecall: ratio(criticalHits, criticalObjects.length + criticalRelations.length),
    comparatorPreserved: typePreserved("COMPARATOR"), interventionPreserved: typePreserved("INTERVENTION"), modalityPreserved: typePreserved("MODALITY"),
    semanticDriftRate: ratio(forbiddenHits.length, Math.max(1, elements.length)),
    unsupportedInferenceRate: ratio(unsupportedInferences.length, Math.max(1, inferred.length)),
    criticalUnsupportedInferenceCount: forbiddenHits.length,
    ellipsisDetectionRate: fixture.gold.requiredAmbiguities.some((item) => /ellipse|objet|manquant/i.test(item)) ? ratio(ambiguityHits.length, requiredAmbiguities.length) : 1,
    ambiguityPreservationRate: ratio(ambiguityHits.length, requiredAmbiguities.length),
    unnecessaryClarificationRate: ratio(forbiddenClarifications.length, Math.max(1, model.clarificationCandidates.length)),
    routeCorrect: fixture.gold.allowedRoutes.includes(model.routeProposal.route),
    correctionPropagation,
    multiTurnContextPreserved: contextRetained,
    genericDomainCollapse,
    absoluteBlockers,
  };
};

export const evaluateSemanticCampaign = (fixtures: SemanticCompetenceCase[], models: Map<string, ScientificSemanticModel>): SemanticCampaignMetrics => {
  const results = fixtures.map((fixture) => {
    const model = models.get(fixture.caseId);
    if (!model) throw new Error(`SEMANTIC_RESULT_MISSING:${fixture.caseId}`);
    return evaluateSemanticCase(fixture, model);
  });
  const criticalComparatorCases = fixtures.map((fixture, index) => ({ fixture, result: results[index] })).filter(({ fixture }) => fixture.gold.requiredExplicitObjects.some((item) => item.type === "COMPARATOR"));
  const criticalInterventionCases = fixtures.map((fixture, index) => ({ fixture, result: results[index] })).filter(({ fixture }) => fixture.gold.requiredExplicitObjects.some((item) => item.type === "INTERVENTION"));
  const criticalModalityCases = fixtures.map((fixture, index) => ({ fixture, result: results[index] })).filter(({ fixture }) => fixture.gold.requiredExplicitObjects.some((item) => item.type === "MODALITY"));
  const correctionCases = fixtures.map((fixture, index) => ({ fixture, result: results[index] })).filter(({ fixture }) => fixture.gold.correction);
  const multiTurnCases = fixtures.map((fixture, index) => ({ fixture, result: results[index] })).filter(({ fixture }) => fixture.turns.length > 1);
  const absoluteBlockers = results.flatMap((result) => result.absoluteBlockers.map((blocker) => `${result.caseId}:${blocker}`));
  const metrics: Omit<SemanticCampaignMetrics, "passesSem001Thresholds"> = {
    split: fixtures[0]?.split ?? "HOLDOUT_CASES",
    caseCount: fixtures.length,
    explicitObjectRecall: average(results.map((item) => item.explicitObjectRecall)),
    explicitRelationRecall: average(results.map((item) => item.explicitRelationRecall)),
    criticalSemanticRecall: average(results.map((item) => item.criticalSemanticRecall)),
    comparatorPreservation: average(criticalComparatorCases.map((item) => Number(item.result.comparatorPreserved))),
    interventionPreservation: average(criticalInterventionCases.map((item) => Number(item.result.interventionPreserved))),
    modalityPreservation: average(criticalModalityCases.map((item) => Number(item.result.modalityPreserved))),
    semanticDriftRate: average(results.map((item) => item.semanticDriftRate)),
    unsupportedInferenceRate: average(results.map((item) => item.unsupportedInferenceRate)),
    criticalUnsupportedInferenceRate: ratio(results.reduce((sum, item) => sum + item.criticalUnsupportedInferenceCount, 0), results.length),
    ellipsisDetectionRate: average(results.map((item) => item.ellipsisDetectionRate)),
    ambiguityPreservationRate: average(results.map((item) => item.ambiguityPreservationRate)),
    unnecessaryClarificationRate: average(results.map((item) => item.unnecessaryClarificationRate)),
    routeCorrectness: average(results.map((item) => Number(item.routeCorrect))),
    correctionPropagationRate: average(correctionCases.map((item) => Number(item.result.correctionPropagation))),
    multiTurnCriticalContextLoss: 1 - average(multiTurnCases.map((item) => Number(item.result.multiTurnContextPreserved))),
    genericDomainCollapseRate: average(results.map((item) => Number(item.genericDomainCollapse))),
    absoluteBlockers,
  };
  const passesSem001Thresholds = metrics.criticalSemanticRecall >= .98
    && metrics.explicitObjectRecall >= .98
    && metrics.explicitRelationRecall >= .95
    && metrics.comparatorPreservation === 1
    && metrics.interventionPreservation === 1
    && metrics.modalityPreservation === 1
    && metrics.criticalUnsupportedInferenceRate === 0
    && metrics.genericDomainCollapseRate === 0
    && metrics.correctionPropagationRate === 1
    && metrics.multiTurnCriticalContextLoss === 0
    && metrics.absoluteBlockers.length === 0;
  return { ...metrics, passesSem001Thresholds };
};
