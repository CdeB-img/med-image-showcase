import { logicalDigest, stableStringify, uniqueSorted } from "@/features/knowledge-engine/canonical";
import type { ProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import {
  calculateTwoGroupContinuousSampleSize,
  type DimensioningCalculationCandidate,
  type TwoGroupContinuousDimensioningInput,
} from "./dimensioning-calculator";
import type {
  AnalysisSpecification,
  CanonicalReference,
  DimensioningAssumption,
  DimensionnementDefinition,
  PlanningKnowledgeStatus,
  PlanningProvenance,
} from "./types";

export const BIOSTATISTICS_REASONING_RUNTIME_CONTRACT = "BIOSTATISTICS_REASONING_RUNTIME" as const;
export const BIOSTATISTICS_REASONING_RESULT_CONTRACT = "BIOSTATISTICS_REASONING_RESULT" as const;
export const BIOSTATISTICS_REASONING_RUNTIME_VERSION = "1.0.0" as const;

export type BiostatisticsUpstreamOwnerInput = {
  sourceOwner: "RESEARCH_PROJECT" | "SCIENTIFIC_THINKING" | "STUDY_DESIGN" | "OBSERVABILITY_MEASUREMENT" | "IMAGING" | "DATA_MANAGEMENT";
  resultRef: string;
  resultVersion: string;
  resultDigest: string;
  needRefs: readonly string[];
  purpose: string;
  designAxes: readonly {
    structuralForm: string;
    comparisonStructure: string;
  }[];
  measurementValueNatures: readonly string[];
  repeatedMeasurementRefs: readonly string[];
  limitations: readonly string[];
  provenanceRefs: readonly string[];
  ownershipTransferred: false;
};

export type BiostatisticsAnalyticalDecisions = {
  estimandApplicability?: "APPLICABLE" | "NOT_APPLICABLE" | "UNKNOWN";
  analysisRole?: AnalysisSpecification["role"];
  missingnessMechanism?: "MCAR" | "MAR" | "MNAR" | "UNKNOWN";
  missingDataStrategy?: string | null;
  multiplicity?: { applicable: boolean; strategy: string | null; sourceRef: string };
  sensitivityUncertainties?: readonly { uncertaintyRef: string; rationale: string; changedElements: readonly string[] }[];
  intercurrentEvents?: readonly {
    event: string;
    strategy: string | null;
    sourceRef: string;
    applicability: "APPLICABLE" | "NOT_APPLICABLE" | "UNKNOWN";
  }[];
  dimensioning?: TwoGroupContinuousDimensioningInput | null;
};

export type BiostatisticsReasoningRuntimeInput = {
  contract: typeof BIOSTATISTICS_REASONING_RUNTIME_CONTRACT;
  contractVersion: typeof BIOSTATISTICS_REASONING_RUNTIME_VERSION;
  inputId: string;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  selectedNeed: {
    needRef: string;
    purpose: string;
    affectedDecisionRefs: readonly string[];
    affectedBranchRefs: readonly string[];
    owner: "QUERY_NAVIGATION";
  };
  upstreamOwnerInputs: readonly BiostatisticsUpstreamOwnerInput[];
  dataRelease: {
    status: "NOT_PROVIDED" | "REQUIRED_UNRESOLVED" | "RELEASED";
    releaseRef: string | null;
    releaseVersion: string | null;
    releaseDigest: string | null;
    openFindingRefs: readonly string[];
    owner: "DATA_MANAGEMENT";
  };
  analyticalDecisions: BiostatisticsAnalyticalDecisions;
  projectWriteAuthorized: false;
};

export type BiostatisticsMethodCandidate = {
  strategyRef: string;
  methodFamily: "LONGITUDINAL_REPEATED_MEASURES" | "CHANGE_BETWEEN_PRESPECIFIED_OCCASIONS" | "BETWEEN_GROUP_ENDPOINT_ESTIMATION" | "DESCRIPTIVE_ENDPOINT_ESTIMATION";
  label: string;
  rationale: string;
  prerequisites: readonly string[];
  assumptions: readonly string[];
  tradeOffs: readonly string[];
  model: null;
  selected: false;
  adoptionStatus: "PROPOSED_NOT_ADOPTED";
  projectWriteAuthorized: false;
};

export type BiostatisticsInformationNeed = {
  needId: string;
  informationNeeded: string;
  scientificReason: string;
  targetOwner: "RESEARCH_PROJECT" | "OBSERVABILITY_MEASUREMENT" | "CDM" | "DATA_MANAGEMENT" | "QUERY_NAVIGATION";
  sourceRefs: readonly string[];
  status: "OPEN_NOT_RESOLVED";
};

export type BiostatisticsAnalysisDatasetRequirement = {
  requirementId: string;
  analysisSpecificationRefs: readonly string[];
  canonicalVariableRefs: readonly CanonicalReference<"CanonicalVariable">[];
  expectedOccasionRefs: readonly CanonicalReference<"ExpectedVariableOccasion">[];
  releaseRequired: true;
  releaseStatus: "NOT_PROVIDED" | "REQUIRED_UNRESOLVED" | "RELEASED";
  releaseRef: string | null;
  releaseVersion: string | null;
  releaseDigest: string | null;
  openFindingRefs: readonly string[];
  factualMissingnessOwner: "CDM-001";
  releaseOwner: "DATA_MANAGEMENT";
  analyticalSelectionOwner: "BIOSTATISTICS";
  mutatesOccurrences: false;
  mutatesRelease: false;
};

export type BiostatisticsDownstreamHandoff = {
  handoffId: string;
  sourceOwner: "BIOSTATISTICS";
  targetOwner: "RESEARCH_PROJECT" | "OBSERVABILITY_MEASUREMENT" | "CDM" | "DATA_MANAGEMENT" | "QUERY_NAVIGATION" | "HUMAN";
  purpose: string;
  informationNeeded: readonly string[];
  sourceRefs: readonly string[];
  status: "PROPOSED_NOT_EXECUTED";
  ownershipTransferred: false;
  projectWriteAuthorized: false;
};

export type BiostatisticsReasoningResult = {
  contract: typeof BIOSTATISTICS_REASONING_RESULT_CONTRACT;
  contractVersion: typeof BIOSTATISTICS_REASONING_RUNTIME_VERSION;
  owner: "BIOSTATISTICS";
  capabilityId: "BIOSTATISTICS_PLANNING";
  resultId: string;
  resultVersion: typeof BIOSTATISTICS_REASONING_RUNTIME_VERSION;
  resultDigest: string;
  resultStatus: "ANALYTICAL_CANDIDATES_PROPOSED" | "INFORMATION_REQUIRED";
  sourceProject: { projectId: string; projectVersion: string; projectDigest: string; snapshotDigest: string };
  sourceNeed: BiostatisticsReasoningRuntimeInput["selectedNeed"];
  sourceOwnerLineage: readonly BiostatisticsUpstreamOwnerInput[];
  scopeExplanation?: string;
  analysisSpecifications: readonly AnalysisSpecification[];
  methodCandidates: readonly BiostatisticsMethodCandidate[];
  dimensionnement: Readonly<DimensionnementDefinition>;
  dimensioningCalculation: Readonly<DimensioningCalculationCandidate> | null;
  analysisDatasetRequirements: readonly BiostatisticsAnalysisDatasetRequirement[];
  informationNeeds: readonly BiostatisticsInformationNeed[];
  downstreamHandoffs: readonly BiostatisticsDownstreamHandoff[];
  assumptions: readonly string[];
  limitations: readonly string[];
  unresolvedQuestions: readonly string[];
  epistemicStatus: "PROPOSAL_ONLY" | "INSUFFICIENT_CONTEXT_UNKNOWN_PRESERVED";
  selectedStrategyRef: null;
  candidateIsAdopted: false;
  humanDecisionRequired: true;
  projectWriteAuthorized: false;
  projectOwnershipTransferred: false;
  analysisExecutionCreated: false;
  analysisResultCreated: false;
};

const currentKnown = (snapshot: Readonly<ProjectContextSnapshot>, ...types: ProjectContextSnapshot["objects"][number]["type"][]) =>
  snapshot.objects.filter((item) => types.includes(item.type) && !["UNKNOWN", "WITHHELD"].includes(item.epistemicState));

const ref = <K extends string>(snapshot: Readonly<ProjectContextSnapshot>, kind: K, item: { stableId: string; versionRef: string }): CanonicalReference<K> => ({
  objectKind: kind,
  objectId: item.stableId,
  objectVersion: item.versionRef,
  owner: ["CanonicalVariable", "DataNeed", "ExpectedVariableOccasion"].includes(kind) ? "RESEARCH_PROJECT" : "RESEARCH_PROJECT",
  sourceProjectId: snapshot.sourceProjectRef,
  sourceProjectVersion: snapshot.sourceProjectVersion,
});

const provenance = (snapshot: Readonly<ProjectContextSnapshot>, sourceRefs: readonly string[], limitations: readonly string[] = []): PlanningProvenance => ({
  sourceRefs: uniqueSorted([...sourceRefs]),
  sourceProjectId: snapshot.sourceProjectRef,
  sourceProjectVersion: snapshot.sourceProjectVersion,
  owner: "BIOSTATISTICS",
  evidence: uniqueSorted([`project-digest:${snapshot.sourceProjectDigest}`, ...sourceRefs]),
  limitations: uniqueSorted([...limitations]),
});

const need = (inputId: string, code: string, informationNeeded: string, scientificReason: string, targetOwner: BiostatisticsInformationNeed["targetOwner"], sourceRefs: readonly string[]): BiostatisticsInformationNeed => ({
  needId: `biostatistics-need:${logicalDigest({ inputId, code, sourceRefs })}`,
  informationNeeded,
  scientificReason,
  targetOwner,
  sourceRefs: uniqueSorted([...sourceRefs]),
  status: "OPEN_NOT_RESOLVED",
});

const upstreamRepeated = (upstream: readonly BiostatisticsUpstreamOwnerInput[]) => upstream.some((item) =>
  item.designAxes.some((axis) => axis.structuralForm === "LONGITUDINAL")
  || item.measurementValueNatures.includes("REPEATED_QUANTITATIVE")
  || item.repeatedMeasurementRefs.length > 0);

const upstreamBetweenGroups = (upstream: readonly BiostatisticsUpstreamOwnerInput[]) => upstream.some((item) =>
  item.designAxes.some((axis) => ["BETWEEN_GROUPS", "MULTIPLE"].includes(axis.comparisonStructure)));

const buildMethodCandidates = (input: Readonly<BiostatisticsReasoningRuntimeInput>, repeated: boolean, betweenGroups: boolean): BiostatisticsMethodCandidate[] => {
  const base = { selected: false as const, adoptionStatus: "PROPOSED_NOT_ADOPTED" as const, projectWriteAuthorized: false as const, model: null };
  if (repeated) return [
    {
      ...base,
      strategyRef: `biostatistics-strategy:${logicalDigest({ input: input.inputId, family: "LONGITUDINAL_REPEATED_MEASURES" })}`,
      methodFamily: "LONGITUDINAL_REPEATED_MEASURES",
      label: "Estimation longitudinale exploitant les mesures répétées",
      rationale: "Les mêmes unités contribuent à plusieurs occasions ; leur dépendance doit rester explicite dans la stratégie analytique.",
      prerequisites: ["Estimand longitudinal explicite", "Occasions comparables", "Stratégie de données manquantes"],
      assumptions: ["Structure de dépendance à préciser", "Forme du temps à préciser"],
      tradeOffs: ["Utilise la trajectoire complète, mais exige davantage d’hypothèses et de diagnostics."],
    },
    ...(betweenGroups ? [{
      ...base,
      strategyRef: `biostatistics-strategy:${logicalDigest({ input: input.inputId, family: "CHANGE_BETWEEN_PRESPECIFIED_OCCASIONS" })}`,
      methodFamily: "CHANGE_BETWEEN_PRESPECIFIED_OCCASIONS" as const,
      label: "Estimation comparative du changement entre occasions préspécifiées",
      rationale: "Une cible de changement bornée peut être défendable si les occasions et le contraste sont décidés avant l’analyse.",
      prerequisites: ["Deux occasions préspécifiées", "Contraste entre groupes explicite", "Gestion des mesures non évaluables"],
      assumptions: ["Définition du changement à adopter", "Variabilité du changement à documenter"],
      tradeOffs: ["Cible plus simple, mais n’exploite pas nécessairement toute la trajectoire disponible."],
    }] : []),
  ];
  if (betweenGroups) return [{
    ...base,
    strategyRef: `biostatistics-strategy:${logicalDigest({ input: input.inputId, family: "BETWEEN_GROUP_ENDPOINT_ESTIMATION" })}`,
    methodFamily: "BETWEEN_GROUP_ENDPOINT_ESTIMATION",
    label: "Estimation comparative de l’endpoint entre groupes",
    rationale: "Le Project porte une structure comparative sans répétition démontrée ; l’estimation doit rester centrée sur l’endpoint adopté.",
    prerequisites: ["Contraste explicite", "Population d’analyse", "Distribution et échelle de l’outcome"],
    assumptions: ["Modèle exact à choisir après qualification des données"],
    tradeOffs: ["Stratégie bornée au contraste adopté ; aucun modèle n’est sélectionné par défaut."],
  }];
  return [{
    ...base,
    strategyRef: `biostatistics-strategy:${logicalDigest({ input: input.inputId, family: "DESCRIPTIVE_ENDPOINT_ESTIMATION" })}`,
    methodFamily: "DESCRIPTIVE_ENDPOINT_ESTIMATION",
    label: "Estimation descriptive de l’endpoint",
    rationale: "Aucune structure comparative ou longitudinale n’est démontrée ; une description qualifiée est la portée maximale défendable.",
    prerequisites: ["Résumé cible à préciser", "Échelle et distribution à qualifier"],
    assumptions: ["Aucune inférence comparative implicite"],
    tradeOffs: ["Portée interprétative limitée, sans comparaison inventée."],
  }];
};

export const executeBiostatisticsReasoningRuntime = (
  input: Readonly<BiostatisticsReasoningRuntimeInput>,
): Readonly<BiostatisticsReasoningResult> => {
  if (input.contract !== BIOSTATISTICS_REASONING_RUNTIME_CONTRACT || input.contractVersion !== BIOSTATISTICS_REASONING_RUNTIME_VERSION) throw new Error("BIOSTATISTICS_RUNTIME_INPUT_CONTRACT_INVALID");
  if (input.projectId !== input.projectSnapshot.sourceProjectRef
    || input.projectVersion !== input.projectSnapshot.sourceProjectVersion
    || input.projectDigest !== input.projectSnapshot.sourceProjectDigest
    || input.projectWriteAuthorized !== false) throw new Error("BIOSTATISTICS_RUNTIME_PROJECT_BINDING_INVALID");
  const snapshotBefore = stableStringify(input.projectSnapshot);
  const objectives = currentKnown(input.projectSnapshot, "OBJECTIVE");
  const hypotheses = currentKnown(input.projectSnapshot, "HYPOTHESIS");
  const endpoints = currentKnown(input.projectSnapshot, "ENDPOINT");
  const populations = currentKnown(input.projectSnapshot, "POPULATION");
  const variables = currentKnown(input.projectSnapshot, "CANONICAL_VARIABLE");
  const occasions = input.projectSnapshot.expectedVariableOccasions;
  const groups = currentKnown(input.projectSnapshot, "GROUP");
  const linkedVariableIds = new Set(input.projectSnapshot.relations.flatMap((relation) => {
    const endpointIds = new Set(endpoints.map((item) => item.stableId));
    const variableIds = new Set(variables.map((item) => item.stableId));
    if (endpointIds.has(relation.sourceProjectRef) && variableIds.has(relation.targetProjectRef)) return [relation.targetProjectRef];
    if (endpointIds.has(relation.targetProjectRef) && variableIds.has(relation.sourceProjectRef)) return [relation.sourceProjectRef];
    return [];
  }));
  const targetVariables = variables.length === 1
    ? variables
    : variables.filter((item) => linkedVariableIds.has(item.stableId));
  const occasionCounts = new Map<string, number>();
  occasions.forEach((item) => occasionCounts.set(item.variableProjectRef, (occasionCounts.get(item.variableProjectRef) ?? 0) + 1));
  const repeated = [...occasionCounts.values()].some((count) => count > 1) || upstreamRepeated(input.upstreamOwnerInputs);
  const betweenGroups = groups.length > 1
    || input.projectSnapshot.relations.some((item) => /COMPARES_WITH|COMPARED_WITH/.test(item.type))
    || upstreamBetweenGroups(input.upstreamOwnerInputs);
  const informationNeeds: BiostatisticsInformationNeed[] = [
    ...(!objectives.length ? [need(input.inputId, "OBJECTIVE_REQUIRED", "Un objectif Project adopté", "Une AnalysisSpecification ne peut pas être orpheline de son objectif scientifique.", "RESEARCH_PROJECT", [input.projectVersion])] : []),
    ...(!endpoints.length ? [need(input.inputId, "ENDPOINT_REQUIRED", "Un endpoint scientifique suffisamment défini", "Biostatistics ne redéfinit pas l’endpoint pour l’adapter à un modèle.", "RESEARCH_PROJECT", [input.projectVersion])] : []),
    ...(!targetVariables.length ? [need(input.inputId, "CANONICAL_VARIABLE_REQUIRED", "La CanonicalVariable qui opérationnalise l’endpoint", "Un rôle analytique ne peut pas fabriquer une identité de variable.", "RESEARCH_PROJECT", endpoints.map((item) => item.stableId))] : []),
    ...(populations.length !== 1 ? [need(input.inputId, "ANALYSIS_POPULATION_REQUIRED", "La population Project source de la population d’analyse", "Une population analytique ne doit ni être inventée ni muter la population Project.", "RESEARCH_PROJECT", populations.map((item) => item.stableId))] : []),
    ...(input.analyticalDecisions.missingnessMechanism === undefined || input.analyticalDecisions.missingnessMechanism === "UNKNOWN"
      ? [need(input.inputId, "MISSINGNESS_MECHANISM_UNKNOWN", "Le mécanisme et les raisons factuelles de données manquantes lorsqu’ils seront observables", "Aucune hypothèse MCAR, MAR ou MNAR ne peut être déduite de l’absence de données.", "CDM", targetVariables.map((item) => item.stableId))]
      : []),
    ...(endpoints.length > 1 && !input.analyticalDecisions.multiplicity
      ? [need(input.inputId, "MULTIPLICITY_STRATEGY_REQUIRED", "La hiérarchie des questions et la stratégie de multiplicité à soumettre à décision", "Plusieurs endpoints ne doivent être ni fusionnés ni réduits silencieusement à un seul.", "RESEARCH_PROJECT", endpoints.map((item) => item.stableId))]
      : []),
  ];
  const analyzable = objectives.length > 0 && endpoints.length > 0 && targetVariables.length > 0 && populations.length === 1;
  const agreementRequested = /\b(?:accord|agreement|concordance)\b/i.test(input.selectedNeed.purpose);
  const methods = analyzable && !agreementRequested ? buildMethodCandidates(input, repeated, betweenGroups) : [];
  if (agreementRequested) informationNeeds.unshift(need(input.inputId, "AGREEMENT_METHOD_NOT_QUALIFIED",
    "Qualifier la métrique d’accord avant d’en proposer une",
    `Demande examinée : ${input.selectedNeed.purpose}\nLa capacité analytique locale ne fournit pas encore de métriques d’accord qualifiées. Le cadre adopté est conservé : ${currentKnown(input.projectSnapshot, "STUDY_DESIGN", "ENDPOINT", "CANONICAL_VARIABLE", "CONSTRAINT").map((item) => item.content).join(" ; ")}. Pour avancer, il faut documenter la différence acceptable entre méthodes et l’usage attendu de l’accord, puis confronter une méthode documentée à cette structure. Aucun seuil ni indépendance des observations n’est présumé.`,
    "OBSERVABILITY_MEASUREMENT", [input.selectedNeed.needRef, ...endpoints.map((item) => item.versionRef)]));
  const scopeExplanation = !methods.length ? [
    `Demande analytique examinée : ${input.selectedNeed.purpose}`,
    `Le cadre actuellement adopté est conservé : ${currentKnown(input.projectSnapshot, "OBJECTIVE", "STUDY_DESIGN", "POPULATION", "ENDPOINT", "CANONICAL_VARIABLE", "CONSTRAINT").map((item) => item.content).join(" ; ") || "les éléments analytiques ne sont pas encore définis"}.`,
    agreementRequested
      ? "La capacité locale ne fournit pas encore de métrique d’accord qualifiée. Pour comparer des méthodes, il faut documenter l’écart acceptable et l’usage attendu, puis confronter une méthode documentée à la structure effectivement retenue. Aucun seuil ni indépendance des observations n’est présumé."
      : `Je ne peux pas proposer ici une alternative analytique défendable : ${[
        ...(!objectives.length ? ["l’objectif analytique n’est pas identifié"] : []),
        ...(!endpoints.length ? ["l’endpoint n’est pas défini"] : []),
        ...(!targetVariables.length ? ["la variable opérationnelle liée à l’endpoint n’est pas qualifiée"] : []),
        ...(populations.length !== 1 ? ["la population source de l’analyse n’est pas liée de façon univoque"] : []),
      ].join(" ; ")}. La prochaine étape est de préciser, pour la comparaison demandée, la cible à estimer, l’unité d’observation et le lien entre la mesure et l’endpoint. Une méthode ou une justification documentaire peut ensuite être confrontée à cette cible et à la dépendance des observations. Les caractéristiques déjà adoptées ne sont pas redemandées.`,
    "Cette limite concerne la qualification de la proposition analytique. Aucun modèle, calcul d’effectif, décision ni modification du projet n’en résulte.",
  ].join("\n\n") : undefined;
  const projectRefs = [input.projectVersion, input.selectedNeed.needRef, ...objectives.map((item) => item.versionRef), ...endpoints.map((item) => item.versionRef), ...targetVariables.map((item) => item.versionRef)];
  const datasetRequirementId = `analysis-dataset-requirement:${logicalDigest({ input: input.inputId, variables: targetVariables.map((item) => item.stableId), occasions: occasions.map((item) => item.stableId) })}`;
  const analysisSpecifications: AnalysisSpecification[] = methods.map((method) => {
    const specId = `analysis-specification:${logicalDigest({ input: input.inputId, strategy: method.strategyRef })}`;
    const specProvenance = provenance(input.projectSnapshot, [...projectRefs, method.strategyRef], input.upstreamOwnerInputs.flatMap((item) => item.limitations));
    const endpointRefs = endpoints.map((item) => ref(input.projectSnapshot, "Endpoint", item));
    const variableRefs = targetVariables.map((item) => ref(input.projectSnapshot, "CanonicalVariable", item));
    const populationRef = ref(input.projectSnapshot, "Population", populations[0]!);
    const temporalRefs = occasions.filter((item) => targetVariables.some((variable) => variable.stableId === item.variableProjectRef))
      .map((item) => ref(input.projectSnapshot, "ExpectedVariableOccasion", { stableId: item.stableId, versionRef: item.versionRef }));
    const estimandApplicability = input.analyticalDecisions.estimandApplicability ?? "UNKNOWN";
    return {
      analysisSpecificationId: specId,
      version: BIOSTATISTICS_REASONING_RUNTIME_VERSION,
      sourceProjectVersion: input.projectVersion,
      objectiveRefs: objectives.map((item) => ref(input.projectSnapshot, "Objective", item)),
      hypothesisRefs: hypotheses.map((item) => ref(input.projectSnapshot, "Hypothesis", item)),
      endpointRefs,
      targetVariableRefs: variableRefs,
      role: input.analyticalDecisions.analysisRole ?? "UNDECIDED",
      purpose: input.selectedNeed.purpose,
      estimand: estimandApplicability === "NOT_APPLICABLE" ? null : {
        estimandId: `estimand:${logicalDigest({ specId, endpoint: endpointRefs[0]?.objectId, variables: variableRefs.map((item) => item.objectId) })}`,
        analysisSpecificationRef: specId,
        populationRef,
        endpointRef: endpointRefs[0] ?? null,
        variableRefs,
        contrast: betweenGroups ? "DECISION_PENDING" : null,
        summaryMeasure: null,
        temporalRefs,
        intercurrentEventStrategyRefs: [],
        status: estimandApplicability === "APPLICABLE" ? "PARTIAL" : "UNKNOWN",
        provenance: specProvenance,
      },
      variableRoles: variableRefs.map((variableRef) => ({
        assignmentId: `analysis-variable-role:${logicalDigest({ specId, variableRef })}`,
        analysisSpecificationRef: specId,
        variableRef,
        populationRef,
        temporalRefs: temporalRefs.filter((occasion) => occasions.find((item) => item.stableId === occasion.objectId)?.variableProjectRef === variableRef.objectId),
        role: "OUTCOME",
        provenance: specProvenance,
      })),
      population: {
        populationDefinitionId: `analysis-population:${logicalDigest({ specId, populationRef })}`,
        analysisSpecificationRef: specId,
        projectPopulationRef: populationRef,
        inclusionRule: null,
        exclusionRule: null,
        status: "PARTIAL",
        mutatesProjectPopulation: false,
        provenance: specProvenance,
      },
      method: {
        methodDefinitionId: `statistical-method:${logicalDigest({ specId, family: method.methodFamily })}`,
        analysisSpecificationRef: specId,
        methodFamily: method.methodFamily,
        model: null,
        status: "PARTIAL",
        source: "BIOSTATISTICS_REASONING",
        provenance: specProvenance,
      },
      assumptions: {
        assumptionSetId: `model-assumptions:${logicalDigest({ specId, assumptions: method.assumptions })}`,
        analysisSpecificationRef: specId,
        assumptions: method.assumptions.map((statement, index) => ({ assumptionId: `${specId}:assumption:${index + 1}`, category: "MODEL_FORM", statement, status: "UNKNOWN" as PlanningKnowledgeStatus, sourceRef: method.strategyRef })),
        automaticallySatisfied: false,
        provenance: specProvenance,
      },
      diagnostics: {
        diagnosticPlanId: `diagnostic-plan:${logicalDigest({ specId, method: method.methodFamily })}`,
        analysisSpecificationRef: specId,
        checks: [{ checkId: `${specId}:diagnostic:assumptions`, purpose: "Évaluer les hypothèses et l’adéquation du modèle sélectionné après décision", definition: null, status: "UNKNOWN" }],
        executionAuthorized: false,
        provenance: specProvenance,
      },
      missingDataStrategy: {
        strategyId: `missing-data-strategy:${logicalDigest({ specId, strategy: input.analyticalDecisions.missingDataStrategy ?? null })}`,
        analysisSpecificationRef: specId,
        factualMissingnessOwner: "CDM-001",
        strategy: input.analyticalDecisions.missingDataStrategy ?? null,
        status: input.analyticalDecisions.missingDataStrategy ? "PARTIAL" : "UNKNOWN",
        imputationExecuted: false,
        provenance: specProvenance,
      },
      intercurrentEvents: (input.analyticalDecisions.intercurrentEvents ?? []).map((event) => ({
          strategyId: `intercurrent-event-strategy:${logicalDigest({ specId, event })}`,
          analysisSpecificationRef: specId,
          event: event.event,
          strategy: event.strategy,
          status: event.applicability === "NOT_APPLICABLE"
            ? "NOT_APPLICABLE"
            : event.applicability === "APPLICABLE" && event.strategy
              ? "PARTIAL"
              : "UNKNOWN",
          distinctFromMissingness: true,
          provenance: provenance(input.projectSnapshot, [...projectRefs, event.sourceRef]),
        })),
      multiplicity: {
        strategyId: `multiplicity-strategy:${logicalDigest({ specId, multiplicity: input.analyticalDecisions.multiplicity ?? null })}`,
        analysisSpecificationRef: specId,
        applicable: input.analyticalDecisions.multiplicity?.applicable ?? (endpoints.length === 1 ? false : null),
        hypothesisFamilyRefs: [],
        procedure: input.analyticalDecisions.multiplicity?.strategy ?? null,
        alpha: null,
        status: input.analyticalDecisions.multiplicity ? "PARTIAL" : endpoints.length === 1 ? "NOT_APPLICABLE" : "UNKNOWN",
        provenance: specProvenance,
      },
      sensitivityAnalyses: (input.analyticalDecisions.sensitivityUncertainties ?? []).map((uncertainty) => ({
        sensitivityId: `sensitivity-analysis:${logicalDigest({ specId, uncertainty })}`,
        primaryAnalysisSpecificationRef: specId,
        fragilityTested: uncertainty.rationale,
        changedElements: uniqueSorted([...uncertainty.changedElements]),
        constantElements: ["SCIENTIFIC_TARGET"],
        role: "SENSITIVITY",
        status: "CANDIDATE",
        provenance: provenance(input.projectSnapshot, [...projectRefs, uncertainty.uncertaintyRef]),
      })),
      datasetReleaseRequirementRefs: [datasetRequirementId],
      expectedOutputs: [],
      status: "CANDIDATE",
      provenance: specProvenance,
    };
  });
  const sizingInputs: DimensioningAssumption[] = input.analyticalDecisions.dimensioning
    ? Object.entries(input.analyticalDecisions.dimensioning.sourceRefs).map(([parameter, sourceReference]) => ({
      assumptionId: `dimensioning-assumption:${logicalDigest({ input: input.inputId, parameter, sourceReference })}`,
      parameter,
      proposedValue: input.analyticalDecisions.dimensioning?.[parameter as keyof Omit<TwoGroupContinuousDimensioningInput, "sourceRefs">] as number,
      unit: parameter.includes("Rate") || ["twoSidedAlpha", "power"].includes(parameter) ? "PROPORTION" : null,
      sourceType: "PROJECT_DECISION",
      sourceReference,
      evidence: [sourceReference],
      owner: "BIOSTATISTICS_AND_HUMAN",
      status: "KNOWN",
      uncertainty: [],
      limitations: [],
    }))
    : [];
  const dimensioningCalculation = input.analyticalDecisions.dimensioning
    ? calculateTwoGroupContinuousSampleSize(input.analyticalDecisions.dimensioning)
    : null;
  const dimensionnement: DimensionnementDefinition = {
    dimensionnementId: `dimensionnement:${logicalDigest({ input: input.inputId, sizingInputs })}`,
    objectiveRefs: objectives.map((item) => ref(input.projectSnapshot, "Objective", item)),
    endpointRefs: endpoints.map((item) => ref(input.projectSnapshot, "Endpoint", item)),
    analysisSpecificationRefs: analysisSpecifications.map((item) => item.analysisSpecificationId),
    populationRefs: populations.map((item) => ref(input.projectSnapshot, "Population", item)),
    assumptions: sizingInputs,
    scenarios: sizingInputs.length ? [{ scenarioId: `dimensioning-scenario:${logicalDigest(sizingInputs)}`, assumptionRefs: sizingInputs.map((item) => item.assumptionId), owner: "BIOSTATISTICS_AND_HUMAN", adoptionStatus: "CANDIDATE" }] : [],
    readiness: dimensioningCalculation ? "READY_FOR_CALCULATION" : "INCOMPLETE",
    calculatedSampleSize: null,
    provenance: provenance(input.projectSnapshot, [...projectRefs, ...sizingInputs.flatMap((item) => item.evidence)]),
  };
  if (!dimensioningCalculation) informationNeeds.push(need(input.inputId, "DIMENSIONING_INPUTS_REQUIRED", "Des hypothèses numériques sourcées pour le dimensionnement", "Aucun effectif crédible ne peut être calculé sans différence cible, variabilité, alpha, puissance et non-évaluabilité.", "RESEARCH_PROJECT", [input.projectVersion]));
  if (input.dataRelease.status !== "RELEASED") informationNeeds.push(need(input.inputId, "DATASET_RELEASE_REQUIRED", "Une DatasetRelease Data Management identifiée avant toute exécution", "Biostatistics spécifie les besoins mais ne gèle ni ne libère les données.", "DATA_MANAGEMENT", input.dataRelease.openFindingRefs));
  const datasetRequirement: BiostatisticsAnalysisDatasetRequirement = {
    requirementId: datasetRequirementId,
    analysisSpecificationRefs: analysisSpecifications.map((item) => item.analysisSpecificationId),
    canonicalVariableRefs: targetVariables.map((item) => ref(input.projectSnapshot, "CanonicalVariable", item)),
    expectedOccasionRefs: occasions.filter((item) => targetVariables.some((variable) => variable.stableId === item.variableProjectRef)).map((item) => ref(input.projectSnapshot, "ExpectedVariableOccasion", { stableId: item.stableId, versionRef: item.versionRef })),
    releaseRequired: true,
    releaseStatus: input.dataRelease.status,
    releaseRef: input.dataRelease.releaseRef,
    releaseVersion: input.dataRelease.releaseVersion,
    releaseDigest: input.dataRelease.releaseDigest,
    openFindingRefs: uniqueSorted([...input.dataRelease.openFindingRefs]),
    factualMissingnessOwner: "CDM-001",
    releaseOwner: "DATA_MANAGEMENT",
    analyticalSelectionOwner: "BIOSTATISTICS",
    mutatesOccurrences: false,
    mutatesRelease: false,
  };
  const downstreamHandoffs: BiostatisticsDownstreamHandoff[] = [...new Map(informationNeeds.map((item) => [item.targetOwner, item])).values()].map((item) => ({
    handoffId: `biostatistics-handoff:${logicalDigest({ result: input.inputId, owner: item.targetOwner, need: item.needId })}`,
    sourceOwner: "BIOSTATISTICS",
    targetOwner: item.targetOwner,
    purpose: item.scientificReason,
    informationNeeded: [item.informationNeeded],
    sourceRefs: item.sourceRefs,
    status: "PROPOSED_NOT_EXECUTED",
    ownershipTransferred: false,
    projectWriteAuthorized: false,
  }));
  const resultMaterial = {
    inputId: input.inputId,
    project: { id: input.projectId, version: input.projectVersion, digest: input.projectDigest },
    sourceNeed: input.selectedNeed,
    lineage: input.upstreamOwnerInputs,
    specs: analysisSpecifications,
    methods,
    dimensionnement,
    dimensioningCalculation,
    datasetRequirement,
    informationNeeds,
    ...(scopeExplanation ? { scopeExplanation } : {}),
    downstreamHandoffs,
  };
  const resultDigest = logicalDigest(resultMaterial);
  if (stableStringify(input.projectSnapshot) !== snapshotBefore) throw new Error("BIOSTATISTICS_RUNTIME_PROJECT_MUTATION_DETECTED");
  return Object.freeze({
    contract: BIOSTATISTICS_REASONING_RESULT_CONTRACT,
    contractVersion: BIOSTATISTICS_REASONING_RUNTIME_VERSION,
    owner: "BIOSTATISTICS",
    capabilityId: "BIOSTATISTICS_PLANNING",
    resultId: `biostatistics-reasoning-result:${resultDigest}`,
    resultVersion: BIOSTATISTICS_REASONING_RUNTIME_VERSION,
    resultDigest,
    resultStatus: methods.length ? "ANALYTICAL_CANDIDATES_PROPOSED" : "INFORMATION_REQUIRED",
    sourceProject: { projectId: input.projectId, projectVersion: input.projectVersion, projectDigest: input.projectDigest, snapshotDigest: input.projectSnapshot.snapshotDigest },
    sourceNeed: structuredClone(input.selectedNeed),
    sourceOwnerLineage: structuredClone(input.upstreamOwnerInputs),
    ...(scopeExplanation ? { scopeExplanation } : {}),
    analysisSpecifications,
    methodCandidates: methods,
    dimensionnement,
    dimensioningCalculation,
    analysisDatasetRequirements: [datasetRequirement],
    informationNeeds,
    downstreamHandoffs,
    assumptions: uniqueSorted(methods.flatMap((item) => item.assumptions)),
    limitations: uniqueSorted([
      "Conception analytique uniquement ; aucune AnalysisExecution ni aucun AnalysisResult.",
      ...input.upstreamOwnerInputs.flatMap((item) => item.limitations),
    ]),
    unresolvedQuestions: uniqueSorted(informationNeeds.map((item) => item.informationNeeded)),
    epistemicStatus: methods.length ? "PROPOSAL_ONLY" : "INSUFFICIENT_CONTEXT_UNKNOWN_PRESERVED",
    selectedStrategyRef: null,
    candidateIsAdopted: false,
    humanDecisionRequired: true,
    projectWriteAuthorized: false,
    projectOwnershipTransferred: false,
    analysisExecutionCreated: false,
    analysisResultCreated: false,
  });
};

export const validateBiostatisticsReasoningResult = (
  input: Readonly<BiostatisticsReasoningRuntimeInput>,
  result: Readonly<BiostatisticsReasoningResult>,
) => {
  const findings = [
    ...(result.sourceProject.projectId !== input.projectId || result.sourceProject.projectVersion !== input.projectVersion || result.sourceProject.projectDigest !== input.projectDigest ? ["BIOSTATISTICS_RESULT_PROJECT_BINDING_MISMATCH"] : []),
    ...(result.projectWriteAuthorized !== false || result.candidateIsAdopted !== false || result.projectOwnershipTransferred !== false ? ["BIOSTATISTICS_RESULT_PROJECT_BOUNDARY_INVALID"] : []),
    ...(result.analysisExecutionCreated || result.analysisResultCreated ? ["BIOSTATISTICS_REALIZED_ANALYSIS_FORBIDDEN"] : []),
    ...(result.analysisSpecifications.some((spec) => spec.estimand && spec.endpointRefs.some((endpoint) => endpoint.objectId === spec.estimand?.estimandId)) ? ["ENDPOINT_ESTIMAND_COLLAPSE"] : []),
    ...(result.analysisSpecifications.some((spec) => spec.targetVariableRefs.some((variable) => variable.owner !== "RESEARCH_PROJECT")) ? ["CANONICAL_VARIABLE_OWNER_CHANGED"] : []),
    ...(result.analysisDatasetRequirements.some((requirement) => requirement.mutatesOccurrences || requirement.mutatesRelease) ? ["DATA_OWNERSHIP_MUTATION"] : []),
  ];
  return { status: findings.length ? "BLOCKED" as const : "PASS" as const, findings };
};
