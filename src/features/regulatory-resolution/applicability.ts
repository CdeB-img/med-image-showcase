import { hasHumanDecisionAuthority } from "@/features/protocol-designer/human-decision";
import type { CorpusApplicabilityRule, CorpusRequirement } from "./corpus";
import type { ApplicabilityCheck, ProjectFact, RegulatoryResolutionInput } from "./types";

export type ConditionOutcome = ApplicabilityCheck["outcome"];
export type ConditionEvaluation = { outcome: ConditionOutcome; reason: string; provenance: string[]; field: string | null; qualificationId: string | null };

const evaluation = (outcome: ConditionOutcome, reason: string, provenance: string[] = [], field: string | null = null, qualificationId: string | null = null): ConditionEvaluation => ({ outcome, reason, provenance, field, qualificationId });

const fromBooleanFact = (fact: ProjectFact<boolean>, field: string, expected = true): ConditionEvaluation => {
  if (fact.state === "UNKNOWN") return evaluation("UNKNOWN_MISSING_INFORMATION", fact.reason, fact.provenance, field);
  if (fact.state === "CONFLICTING") return evaluation("CONFLICT", fact.reason, fact.provenance, field);
  if (fact.state === "NOT_APPLICABLE") return evaluation("NOT_SATISFIED", fact.reason, fact.provenance, field);
  const matches = fact.value === expected;
  if (fact.state === "CANDIDATE") return evaluation("POTENTIAL", fact.reason, fact.provenance, field);
  return evaluation(matches ? "SATISFIED" : "NOT_SATISFIED", fact.reason, fact.provenance, field);
};

const fromArrayFact = <T extends string>(fact: ProjectFact<T[]>, field: string, expected: T): ConditionEvaluation => {
  if (fact.state === "UNKNOWN") return evaluation("UNKNOWN_MISSING_INFORMATION", fact.reason, fact.provenance, field);
  if (fact.state === "CONFLICTING") return evaluation("CONFLICT", fact.reason, fact.provenance, field);
  if (fact.state === "NOT_APPLICABLE") return evaluation("NOT_SATISFIED", fact.reason, fact.provenance, field);
  const matches = fact.value?.includes(expected) ?? false;
  if (fact.state === "CANDIDATE") return evaluation("POTENTIAL", fact.reason, fact.provenance, field);
  return evaluation(matches ? "SATISFIED" : "NOT_SATISFIED", fact.reason, fact.provenance, field);
};

const qualification = (input: RegulatoryResolutionInput, ids: string[], label: string, unresolvedQualificationId: string): ConditionEvaluation => {
  const matches = input.knownRegulatoryQualifications.filter((item) => ids.includes(item.qualificationId));
  const confirmed = matches.find((item) => {
    if (item.state !== "HUMAN_CONFIRMED" || !item.decisionId) return false;
    const decision = input.humanDecisions.find((candidate) => candidate.decisionId === item.decisionId && candidate.status === "ADOPTED");
    return Boolean(decision && hasHumanDecisionAuthority(decision));
  });
  if (confirmed) return evaluation("SATISFIED", `${label} est explicitement confirmée par une décision humaine engageante.`, confirmed.provenance, null, confirmed.qualificationId);
  const candidate = matches.find((item) => item.state === "QUALIFICATION_CANDIDATE");
  if (candidate) return evaluation("UNKNOWN_REQUIRES_QUALIFICATION", `${label} reste une qualification candidate non engageante.`, candidate.provenance, null, candidate.qualificationId);
  return evaluation("UNKNOWN_REQUIRES_QUALIFICATION", `${label} exige une qualification humaine ou externe explicite.`, input.provenance, null, unresolvedQualificationId);
};

const explicitEdition = (input: RegulatoryResolutionInput, programId: string, editionId: string) => {
  const fact = input.fundingProgramEditionCandidates;
  if (fact.state === "UNKNOWN") return evaluation("UNKNOWN_MISSING_INFORMATION", fact.reason, fact.provenance, "fundingProgramEditionCandidates");
  if (fact.state === "CONFLICTING") return evaluation("CONFLICT", fact.reason, fact.provenance, "fundingProgramEditionCandidates");
  const match = fact.value?.find((item) => item.programId === programId && item.editionId === editionId);
  if (!match) return evaluation("NOT_SATISFIED", `L’édition ${editionId} n’est pas identifiée pour ce projet.`, fact.provenance, "fundingProgramEditionCandidates");
  return evaluation(match.state === "EXPLICITLY_IDENTIFIED" ? "SATISFIED" : "POTENTIAL", `L’édition ${editionId} est ${match.state === "EXPLICITLY_IDENTIFIED" ? "explicitement identifiée" : "candidate"}.`, match.provenance, "fundingProgramEditionCandidates");
};

const editionStage = (input: RegulatoryResolutionInput, programId: string, editionId: string, stage: string, requiresSelection = false): ConditionEvaluation => {
  const edition = explicitEdition(input, programId, editionId);
  if (edition.outcome !== "SATISFIED" && edition.outcome !== "POTENTIAL") return edition;
  const candidate = input.fundingProgramEditionCandidates.value?.find((item) => item.programId === programId && item.editionId === editionId);
  if (!candidate) return edition;
  const stageCheck = candidate.stage.state === "UNKNOWN"
    ? evaluation("UNKNOWN_MISSING_INFORMATION", candidate.stage.reason, candidate.stage.provenance, "fundingProgramEditionCandidates.stage")
    : candidate.stage.state === "CONFLICTING"
      ? evaluation("CONFLICT", candidate.stage.reason, candidate.stage.provenance, "fundingProgramEditionCandidates.stage")
      : candidate.stage.value === stage
        ? evaluation(candidate.stage.state === "CANDIDATE" ? "POTENTIAL" : "SATISFIED", candidate.stage.reason, candidate.stage.provenance, "fundingProgramEditionCandidates.stage")
        : evaluation("NOT_SATISFIED", `Le stade explicite n’est pas ${stage}.`, candidate.stage.provenance, "fundingProgramEditionCandidates.stage");
  if (stageCheck.outcome !== "SATISFIED" && stageCheck.outcome !== "POTENTIAL") return stageCheck;
  if (!requiresSelection) return edition.outcome === "POTENTIAL" || stageCheck.outcome === "POTENTIAL" ? evaluation("POTENTIAL", stageCheck.reason, [...edition.provenance, ...stageCheck.provenance], stageCheck.field) : stageCheck;
  const selection = fromBooleanFact(candidate.selectedAfterPriorStage, "fundingProgramEditionCandidates.selectedAfterPriorStage", true);
  if (selection.outcome !== "SATISFIED") return selection;
  return edition.outcome === "POTENTIAL" || stageCheck.outcome === "POTENTIAL" ? evaluation("POTENTIAL", stageCheck.reason, [...edition.provenance, ...stageCheck.provenance], stageCheck.field) : stageCheck;
};

const documentIntent = (input: RegulatoryResolutionInput, value: string) => fromArrayFact(input.projectCharacteristics.intendedDocuments, "projectCharacteristics.intendedDocuments", value);
const reportType = (input: RegulatoryResolutionInput, value: string) => fromArrayFact(input.studyDesignCharacteristics.reportTypes, "studyDesignCharacteristics.reportTypes", value);

export const evaluateJurisdiction = (input: RegulatoryResolutionInput, requirement: CorpusRequirement): { evaluation: ConditionEvaluation; applicable: string[]; excluded: string[] } => {
  if (requirement.jurisdiction === "INTERNATIONAL") return { evaluation: evaluation("SATISFIED", "La portée internationale n’est pas fusionnée avec une juridiction nationale.", requirement.source), applicable: ["INTERNATIONAL"], excluded: [] };
  const project = input.jurisdiction;
  const centers = input.internationalCharacteristics.centerJurisdictions;
  const known = [...new Set([...(project.value ?? []), ...(centers.value ?? [])])];
  if (project.state === "CONFLICTING" || centers.state === "CONFLICTING") return { evaluation: evaluation("CONFLICT", "Les juridictions déclarées sont contradictoires.", [...project.provenance, ...centers.provenance], "jurisdiction"), applicable: [], excluded: known };
  if (known.includes(requirement.jurisdiction)) return { evaluation: evaluation(project.state === "CANDIDATE" || centers.state === "CANDIDATE" ? "POTENTIAL" : "SATISFIED", `L’exigence est limitée à la juridiction ${requirement.jurisdiction}.`, [...project.provenance, ...centers.provenance], "jurisdiction"), applicable: [requirement.jurisdiction], excluded: known.filter((item) => item !== requirement.jurisdiction) };
  if (project.state === "UNKNOWN" && centers.state === "UNKNOWN") return { evaluation: evaluation("UNKNOWN_MISSING_INFORMATION", "La juridiction nécessaire à la résolution n’est pas connue.", [...project.provenance, ...centers.provenance], "jurisdiction"), applicable: [], excluded: [] };
  return { evaluation: evaluation("NOT_SATISFIED", `La juridiction ${requirement.jurisdiction} n’est pas déclarée pour le projet ou ses centres.`, [...project.provenance, ...centers.provenance], "jurisdiction"), applicable: [], excluded: known };
};

export const evaluateCondition = (conditionId: string, input: RegulatoryResolutionInput, requirement: CorpusRequirement): ConditionEvaluation => {
  switch (conditionId) {
    case "COND_FR_HUMAN_RESEARCH_SCOPE": return fromBooleanFact(input.projectCharacteristics.humanHealthResearch, "projectCharacteristics.humanHealthResearch");
    case "COND_FR_RIPH_CONFIRMED": {
      const scope = fromBooleanFact(input.projectCharacteristics.humanHealthResearch, "projectCharacteristics.humanHealthResearch");
      return scope.outcome === "SATISFIED" ? qualification(input, ["RIPH_1", "RIPH_2", "RIPH_3"], "La catégorie RIPH", "RIPH_CATEGORY_QUALIFICATION_REQUIRED") : scope;
    }
    case "COND_RIPH1": {
      const scope = fromBooleanFact(input.projectCharacteristics.humanHealthResearch, "projectCharacteristics.humanHealthResearch");
      return scope.outcome === "SATISFIED" ? qualification(input, ["RIPH_1"], "La catégorie RIPH 1", "RIPH_CATEGORY_QUALIFICATION_REQUIRED") : scope;
    }
    case "COND_NOT_REPLACED_BY_MORE_SPECIFIC_EU_ROUTE": {
      const medicinal = fromBooleanFact(input.interventionCharacteristics.medicinalProductTrial, "interventionCharacteristics.medicinalProductTrial");
      if (medicinal.outcome === "NOT_SATISFIED") return evaluation("SATISFIED", "Aucun essai de médicament relevant d’une route européenne plus spécifique n’est déclaré.", medicinal.provenance);
      if (medicinal.outcome !== "SATISFIED") return medicinal;
      const ctr = qualification(input, ["EU_CTR_536_2014_SCOPE"], "Le champ du règlement européen 536/2014", "EU_CTR_SCOPE_QUALIFICATION_REQUIRED");
      return ctr.outcome === "SATISFIED" ? evaluation("NOT_SATISFIED", "Une route européenne plus spécifique a été explicitement qualifiée.", ctr.provenance) : ctr.outcome === "UNKNOWN_REQUIRES_QUALIFICATION" ? ctr : evaluation("SATISFIED", "Aucune route européenne plus spécifique n’est établie.", input.provenance);
    }
    case "COND_RIPH_CATEGORY_KNOWN": {
      const scope = fromBooleanFact(input.projectCharacteristics.humanHealthResearch, "projectCharacteristics.humanHealthResearch");
      return scope.outcome === "SATISFIED" ? qualification(input, ["RIPH_1", "RIPH_2", "RIPH_3"], "La catégorie RIPH", "RIPH_CATEGORY_QUALIFICATION_REQUIRED") : scope;
    }
    case "COND_HEALTH_PERSONAL_DATA": return fromBooleanFact(input.dataCharacteristics.personalHealthData, "dataCharacteristics.personalHealthData");
    case "COND_MR_SCOPE_QUALIFIED": {
      const personalData = fromBooleanFact(input.dataCharacteristics.personalHealthData, "dataCharacteristics.personalHealthData");
      return personalData.outcome === "SATISFIED" ? qualification(input, ["MR_001_SCOPE", "MR_003_SCOPE", "MR_ROUTE_OUTSIDE_REFERENCE_METHODOLOGY"], "La route CNIL/MR", "MR_SCOPE_QUALIFICATION_REQUIRED") : personalData;
    }
    case "COND_MR_2026_ROUTE": {
      const personalData = fromBooleanFact(input.dataCharacteristics.personalHealthData, "dataCharacteristics.personalHealthData");
      return personalData.outcome === "SATISFIED" ? qualification(input, ["MR_001_2026_ROUTE", "MR_003_2026_ROUTE"], "La route MR 2026", "MR_2026_ROUTE_QUALIFICATION_REQUIRED") : personalData;
    }
    case "COND_EU_EEA_MEDICINAL_TRIAL": {
      const interventional = fromBooleanFact(input.interventionCharacteristics.medicinalProductTrial, "interventionCharacteristics.medicinalProductTrial");
      if (interventional.outcome !== "SATISFIED") return interventional;
      return qualification(input, ["EU_CTR_536_2014_SCOPE"], "Le champ du règlement européen 536/2014", "EU_CTR_SCOPE_QUALIFICATION_REQUIRED");
    }
    case "COND_PHRC_2025_2026_STAGE1": return editionStage(input, "FUND_PHRC_N", "ED_PHRC_2025_2026", "LETTER_OF_INTENT");
    case "COND_PHRC_2025_2026_SELECTED_STAGE2": return editionStage(input, "FUND_PHRC_N", "ED_PHRC_2025_2026", "COMPLETE_DOSSIER", true);
    case "COND_RHU_V6_2023": return explicitEdition(input, "FUND_RHU", "ED_RHU_V6_2023");
    case "COND_ICH_APPLICABILITY": return fromBooleanFact(input.interventionCharacteristics.interventionPresent, "interventionCharacteristics.interventionPresent");
    case "COND_NO_SILENT_NORMATIVE_PROMOTION": {
      const incorporated = input.projectCharacteristics.explicitlyIncorporatedGuidance;
      if (incorporated.state === "UNKNOWN") return evaluation("UNKNOWN_MISSING_INFORMATION", incorporated.reason, incorporated.provenance, "projectCharacteristics.explicitlyIncorporatedGuidance");
      if (incorporated.state === "CONFLICTING") return evaluation("CONFLICT", incorporated.reason, incorporated.provenance, "projectCharacteristics.explicitlyIncorporatedGuidance");
      return evaluation("SATISFIED", incorporated.value?.includes(requirement.identifier) ? "Le guide est explicitement incorporé, mais reste séparé et identifié comme guide dans REG-001." : "Aucune promotion normative silencieuse n’est effectuée.", incorporated.provenance);
    }
    case "COND_RANDOMISED_TRIAL_PROTOCOL": {
      const randomized = fromBooleanFact(input.studyDesignCharacteristics.randomised, "studyDesignCharacteristics.randomised");
      if (randomized.outcome !== "SATISFIED") return randomized;
      return documentIntent(input, "PROTOCOL");
    }
    case "COND_RANDOMISED_TRIAL_RESULTS": {
      const randomized = fromBooleanFact(input.studyDesignCharacteristics.randomised, "studyDesignCharacteristics.randomised");
      if (randomized.outcome !== "SATISFIED") return randomized;
      return documentIntent(input, "RESULTS_REPORT");
    }
    case "COND_OBSERVATIONAL_REPORT": {
      const observational = input.studyDesignCharacteristics.interventionModel;
      if (observational.state === "UNKNOWN") return evaluation("UNKNOWN_MISSING_INFORMATION", observational.reason, observational.provenance, "studyDesignCharacteristics.interventionModel");
      if (observational.state === "CONFLICTING") return evaluation("CONFLICT", observational.reason, observational.provenance, "studyDesignCharacteristics.interventionModel");
      if (observational.value !== "OBSERVATIONAL") return evaluation("NOT_SATISFIED", "Le design n’est pas observationnel.", observational.provenance);
      return documentIntent(input, "RESULTS_REPORT");
    }
    case "COND_ROUTINELY_COLLECTED_DATA_REPORT": {
      const routine = fromBooleanFact(input.dataCharacteristics.routinelyCollectedHealthData, "dataCharacteristics.routinelyCollectedHealthData");
      if (routine.outcome !== "SATISFIED") return routine;
      return documentIntent(input, "RESULTS_REPORT");
    }
    case "COND_PREDICTION_MODEL_REPORT": return reportType(input, "PREDICTION_MODEL_REPORT");
    case "COND_DIAGNOSTIC_ACCURACY_REPORT": return reportType(input, "DIAGNOSTIC_ACCURACY_REPORT");
    case "COND_SYSTEMATIC_REVIEW_REPORT": return reportType(input, "SYSTEMATIC_REVIEW_REPORT");
    case "COND_US_APPLICABLE_CLINICAL_TRIAL": return qualification(input, ["US_APPLICABLE_CLINICAL_TRIAL"], "Le statut américain d’applicable clinical trial", "US_ACT_SCOPE_QUALIFICATION_REQUIRED");
    case "COND_NIH_FUNDED_CLINICAL_TRIAL": return qualification(input, ["NIH_FUNDED_CLINICAL_TRIAL_POLICY_SCOPE"], "Le champ de la politique NIH", "NIH_POLICY_SCOPE_QUALIFICATION_REQUIRED");
    case "COND_MULTICOUNTRY_DISCOVERY": return fromBooleanFact(input.internationalCharacteristics.crossCountryRequirementDiscoveryNeeded, "internationalCharacteristics.crossCountryRequirementDiscoveryNeeded");
    case "EDITION_AND_STAGE_MATCH": {
      const editions = input.fundingProgramEditionCandidates;
      if (editions.state === "UNKNOWN") return evaluation("UNKNOWN_MISSING_INFORMATION", editions.reason, editions.provenance, "fundingProgramEditionCandidates");
      if (editions.state === "CONFLICTING") return evaluation("CONFLICT", editions.reason, editions.provenance, "fundingProgramEditionCandidates");
      const match = editions.value?.some((item) => item.programId === "FUND_PHRC_N" && item.editionId === "ED_PHRC_2025_2026");
      return evaluation(match ? editions.state === "CANDIDATE" ? "POTENTIAL" : "SATISFIED" : "NOT_SATISFIED", match ? "L’édition PHRC et son stade sont explicités par les conditions atomiques." : "Aucune édition PHRC correspondante n’est identifiée.", editions.provenance, "fundingProgramEditionCandidates");
    }
    case "GUIDELINE_SCOPE_MATCH": return evaluation("SATISFIED", "La portée exacte est évaluée par la condition atomique du guide.", requirement.source);
    case "NO_PRIMARY_PROGRAM_EDITION_SELECTED": {
      const editions = input.fundingProgramEditionCandidates;
      if (editions.state === "UNKNOWN") return evaluation("SATISFIED", "Aucune édition primaire n’est qualifiée.", editions.provenance, "fundingProgramEditionCandidates");
      if (editions.state === "CONFLICTING") return evaluation("CONFLICT", editions.reason, editions.provenance, "fundingProgramEditionCandidates");
      const explicit = editions.value?.some((item) => item.state === "EXPLICITLY_IDENTIFIED") ?? false;
      return evaluation(explicit ? "NOT_SATISFIED" : "SATISFIED", explicit ? "Une édition primaire est explicitement identifiée." : "Aucune édition primaire n’est qualifiée.", editions.provenance, "fundingProgramEditionCandidates");
    }
    default: return evaluation("UNKNOWN_MISSING_INFORMATION", `La condition REG-000 ${conditionId} n’a pas d’interprétation déterministe admise dans REG-001.`, requirement.source, `corpus.condition.${conditionId}`);
  }
};

export const evaluateExclusion = (token: string, input: RegulatoryResolutionInput): ConditionEvaluation => {
  switch (token) {
    case "OUTSIDE_RIPH_SCOPE_CONFIRMED": return fromBooleanFact(input.projectCharacteristics.humanHealthResearch, "projectCharacteristics.humanHealthResearch", false);
    case "NO_PERSONAL_DATA_CONFIRMED": return fromBooleanFact(input.dataCharacteristics.personalHealthData, "dataCharacteristics.personalHealthData", false);
    case "NON_MEDICINAL_STUDY_CONFIRMED": {
      const product = input.productCharacteristics.productTypes;
      if (product.state === "UNKNOWN") return evaluation("UNKNOWN_MISSING_INFORMATION", product.reason, product.provenance, "productCharacteristics.productTypes");
      if (product.state === "CONFLICTING") return evaluation("CONFLICT", product.reason, product.provenance, "productCharacteristics.productTypes");
      const nonMedicinal = !(product.value ?? []).includes("MEDICINAL_PRODUCT");
      return evaluation(product.state === "CANDIDATE" ? "POTENTIAL" : nonMedicinal ? "SATISFIED" : "NOT_SATISFIED", product.reason, product.provenance, "productCharacteristics.productTypes");
    }
    case "OTHER_PROGRAM_OR_EDITION": {
      const fact = input.fundingProgramEditionCandidates;
      if (fact.state === "UNKNOWN") return evaluation("UNKNOWN_MISSING_INFORMATION", fact.reason, fact.provenance, "fundingProgramEditionCandidates");
      const other = (fact.value ?? []).length > 0 && !(fact.value ?? []).some((item) => item.programId === "FUND_PHRC_N" && item.editionId === "ED_PHRC_2025_2026");
      return evaluation(other ? "SATISFIED" : "NOT_SATISFIED", other ? "Une autre édition ou un autre programme est identifié." : "L’exclusion par autre édition n’est pas satisfaite.", fact.provenance);
    }
    case "OTHER_RHU_EDITION": {
      const fact = input.fundingProgramEditionCandidates;
      if (fact.state === "UNKNOWN") return evaluation("UNKNOWN_MISSING_INFORMATION", fact.reason, fact.provenance, "fundingProgramEditionCandidates");
      const other = (fact.value ?? []).some((item) => item.programId === "FUND_RHU" && item.editionId !== "ED_RHU_V6_2023");
      return evaluation(other ? "SATISFIED" : "NOT_SATISFIED", other ? "Une autre édition RHU est identifiée." : "L’exclusion par autre édition RHU n’est pas satisfaite.", fact.provenance);
    }
    case "SCOPE_MISMATCH": return evaluation("NOT_SATISFIED", "La portée est évaluée par la condition atomique de chaque guide.", input.provenance);
    case "ACT_DEFINITION_NOT_MET": return qualification(input, ["US_ACT_NOT_APPLICABLE"], "L’exclusion de la définition ACT", "US_ACT_SCOPE_QUALIFICATION_REQUIRED");
    case "NO_NIH_FUNDING_OR_POLICY_SCOPE": return qualification(input, ["NIH_POLICY_NOT_APPLICABLE"], "L’exclusion de la politique NIH", "NIH_POLICY_SCOPE_QUALIFICATION_REQUIRED");
    case "PRIMARY_AUTHORITY_ALREADY_IDENTIFIED": return qualification(input, ["PRIMARY_AUTHORITIES_IDENTIFIED_FOR_ALL_CENTERS"], "L’identification des autorités primaires", "PRIMARY_AUTHORITIES_QUALIFICATION_REQUIRED");
    case "PRIMARY_EDITION_VERIFIED": {
      const explicit = input.fundingProgramEditionCandidates.value?.some((item) => item.state === "EXPLICITLY_IDENTIFIED") ?? false;
      return evaluation(explicit ? "SATISFIED" : "NOT_SATISFIED", explicit ? "Une édition primaire est explicitement identifiée." : "Aucune édition primaire n’est identifiée.", input.fundingProgramEditionCandidates.provenance);
    }
    default: return evaluation("UNKNOWN_MISSING_INFORMATION", `L’exclusion REG-000 ${token} n’a pas d’interprétation déterministe admise.`, input.provenance, `corpus.exclusion.${token}`);
  }
};

export const rulesForRequirement = (requirementId: string, rules: CorpusApplicabilityRule[]) => rules.filter((rule) => rule.relations.requires.includes(requirementId));
