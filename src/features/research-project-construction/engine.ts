import { logicalDigest, normalizeScientificText, uniqueSorted } from "@/features/knowledge-engine/canonical";
import { buildResearchProjectGraph } from "./graph";
import { parseResearchProjectDesignResult, RESEARCH_PROJECT_CONSTRUCTION_VERSION, type AnalysisRequirement, type EndpointCandidate, type PopulationDesign, type ProjectGroup, type ProjectVariable, type ResearchProjectConstructionInput, type ResearchProjectControls, type ResearchProjectDesignResult, type StudyDesignCandidate } from "./types";

const includesAny = (text: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(text));
const stableId = (kind: string, material: unknown) => `project-${kind}:${logicalDigest(material)}`;
const allText = (input: ResearchProjectConstructionInput) => normalizeScientificText([
  input.confirmedScientificQuestion.text,
  ...input.objectives.map((item) => item.text),
  ...input.hypotheses.map((item) => item.text),
  ...input.scientificContext.outcomes,
  ...input.scientificContext.exposuresOrInterventions,
  ...input.scientificContext.studyDesignDeclarations,
  ...input.scientificContext.availableData,
  ...input.knownPopulationInformation,
  ...input.knownTemporalInformation,
  ...input.knownConstraints,
].join(" ")).toLocaleLowerCase("fr-FR");

const buildPopulation = (input: ResearchProjectConstructionInput, controls: ResearchProjectControls): PopulationDesign => {
  const condition = uniqueSorted(input.scientificContext.pathologyOrCondition);
  const populationAnswer = controls.answers?.["PRJ-Q-POPULATION"];
  const population = uniqueSorted([...input.knownPopulationInformation, ...(populationAnswer && !/^unknown$/i.test(populationAnswer) ? [normalizeScientificText(populationAnswer)] : [])]);
  const stage = population.filter((item) => /stade|précoce|avancé|symptom|asymptom|aigu|chronique/i.test(item));
  const phenotype = population.filter((item) => /phénotype|atteinte|manifestation|forme|profil/i.test(item));
  const clinicalContext = population.filter((item) => !stage.includes(item) && !phenotype.includes(item));
  const requiredCharacteristics = uniqueSorted([
    ...condition,
    ...clinicalContext,
    ...input.scientificContext.exposuresOrInterventions,
  ]);
  const missingInformation = uniqueSorted([
    ...(!condition.length && !population.length ? ["Condition ou population scientifique à préciser."] : []),
    ...(input.uncertainties.filter((item) => /population|cohorte|patient|sujet/i.test(item))),
  ]);
  const operationalRequirements = [
    ...((condition.length || population.length) ? [{ requirement: "Traduire la Population scientifique en critères opérationnels vérifiables.", whyNeeded: "La future sélection doit préserver le domaine de validité sans transformer ici le concept en formulation réglementaire finale.", finalWordingStatus: "NOT_DEFINED" as const }] : []),
    ...(input.imagingDesignResult ? [{ requirement: "Documenter les contre-indications et conditions de réalisation pertinentes pour l’imagerie retenue.", whyNeeded: "La faisabilité et la sécurité opérationnelles devront être évaluées par les moteurs spécialisés.", finalWordingStatus: "NOT_DEFINED" as const }] : []),
  ];
  return {
    populationId: stableId("population", { condition, population, stage, phenotype }),
    populationConcept: {
      conditionOrPathology: condition,
      stage,
      phenotype,
      clinicalContext,
      exposureOrIntervention: uniqueSorted(input.scientificContext.exposuresOrInterventions),
      questionRequiredCharacteristics: requiredCharacteristics,
      conceptuallyJustifiedExclusions: input.contradictions.filter((item) => /population|diagnostic|éligib|contre-indication/i.test(item)).map((item) => ({ label: item, justification: "Cette contradiction compromettrait l’interprétation dans la Population visée.", sourceRef: "input:contradictions" })),
      relevantSubpopulations: phenotype.map((item) => ({ label: item, justification: "Sous-population déclarée susceptible de modifier l’applicabilité ou l’interprétation.", status: "CANDIDATE" as const })),
    },
    operationalEligibility: { status: "FUTURE_SPECIALIZED_DEFINITION_REQUIRED", requirements: operationalRequirements },
    justification: requiredCharacteristics.length ? `Population construite uniquement à partir des caractéristiques déclarées nécessaires à la Question : ${requiredCharacteristics.join(" ; ")}.` : "La Population scientifique reste à préciser avant toute définition opérationnelle.",
    sourceRefs: uniqueSorted([input.confirmedScientificQuestion.questionId, ...input.userProvidedInformation.filter((item) => ["population", "pathologyOrCondition", "interventionsOrGroups"].includes(item.kind)).map((item) => item.informationId)]),
    missingInformation,
    reviewState: "PENDING",
  };
};

const buildDesignCandidates = (input: ResearchProjectConstructionInput, text: string): StudyDesignCandidate[] => {
  const candidates: StudyDesignCandidate[] = [];
  const add = (family: StudyDesignCandidate["family"], label: string, why: string, estimand: string, limitations: string[], biases: string[], constraints: string[], signals: string[]) => {
    if (candidates.some((item) => item.family === family)) return;
    candidates.push({ designId: stableId("design", { family, question: input.confirmedScientificQuestion.questionId }), family, label, whyItAnswersQuestion: why, estimandPurpose: estimand, limitations, biases, constraints, decisionsImplied: ["Adoption humaine du plan d’étude", "Revue Biostatistics des exigences analytiques"], sourceSignals: uniqueSorted(signals), reviewState: "PENDING" });
  };
  const validation = includesAny(text, [/validat/, /concord/, /compar\w* (deux|2) (méthod|mesur)/, /deux méthodes/, /reproductib/, /répétabil/]);
  const prognostic = includesAny(text, [/pronosti/, /prédi\w*/, /événement futur/, /survie/, /risque de survenue/]);
  const longitudinal = includesAny(text, [/longitudinal/, /évolution/, /suivi/, /progression/, /variation/, /répét\w* mesure/]);
  const retrospective = includesAny(text, [/rétrospect/, /données existantes/, /base existante/, /déjà acquises/]) || input.scientificContext.availableData.length > 0;
  const comparative = includesAny(text, [/compar/, /versus| vs /, /groupe/, /exposé/, /intervention/]);

  if (validation) add("METHODOLOGICAL_VALIDATION", "Validation méthodologique comparative", "La Question porte sur la comparabilité, la concordance ou la reproductibilité de méthodes de mesure.", "Estimer l’accord, les différences et la répétabilité entre méthodes sans revendiquer un effet pronostique.", ["La méthode de référence et les conditions de répétition restent à décider."], ["Biais de mesure", "Effet d’ordre ou d’apprentissage"], ["Réalisation des méthodes dans des conditions comparables"], ["relation méthodologique détectée"]);
  if (prognostic) add("PROSPECTIVE_PROGNOSTIC_COHORT", "Cohorte pronostique prospective", "Le biomarqueur ou l’exposition doit précéder un événement futur distinct.", "Estimer une association ou une capacité prédictive entre une mesure initiale et un outcome futur.", ["Durée et modalités du suivi restent à documenter.", "La causalité n’est pas établie par le seul caractère prospectif."], ["Attrition", "Confusion pronostique"], ["Outcome futur définissable", "Suivi et adjudication à organiser"], ["finalité pronostique détectée"]);
  if (longitudinal && !prognostic) add("PROSPECTIVE_LONGITUDINAL_COHORT", "Cohorte longitudinale prospective", "La Question examine une évolution au cours du temps ou une variation intra-sujet.", "Estimer un changement et sa variabilité dans une Population définie.", ["Fenêtre scientifique et fréquence des mesures restent à justifier."], ["Attrition", "Effet de maturation ou de temporalité"], ["Mesures répétées comparables"], ["évolution temporelle détectée"]);
  if (retrospective && (longitudinal || prognostic || comparative)) add("RETROSPECTIVE_LONGITUDINAL_COHORT", "Cohorte rétrospective à partir de données existantes", "Des données existantes peuvent instruire une trajectoire ou une association sans recrutement immédiat.", "Explorer la relation avec les données effectivement disponibles et leur temporalité réelle.", ["Qualité, exhaustivité et calendrier des données ne sont pas contrôlés prospectivement."], ["Biais de sélection", "Biais d’information"], ["Provenance et qualité des données existantes à vérifier"], ["données existantes déclarées"]);
  if (comparative && !validation) add("COMPARATIVE_OBSERVATIONAL", "Étude observationnelle comparative", "La Question comporte des groupes, expositions ou stratégies à comparer sans intervention automatiquement imposée.", "Estimer une différence ou association entre groupes scientifiquement justifiés.", ["La comparabilité initiale et la confusion doivent être examinées."], ["Biais de sélection", "Confusion"], ["Définition défendable des groupes"], ["comparaison déclarée"]);
  if (!candidates.length || (!longitudinal && !prognostic && !validation && !retrospective)) add("CROSS_SECTIONAL_OBSERVATIONAL", "Étude observationnelle transversale minimale", "Une mesure unique peut suffire à décrire ou examiner l’association demandée lorsque la Question n’impose ni suivi ni intervention.", "Décrire la distribution ou une association au temps scientifique retenu.", ["Aucune évolution temporelle ou relation pronostique ne peut être établie."], ["Biais de sélection", "Biais de mesure"], ["Population et mesure définissables au même temps"], ["absence de nécessité temporelle démontrée"]);
  return candidates.sort((a, b) => a.family.localeCompare(b.family));
};

const buildGroups = (input: ResearchProjectConstructionInput, population: PopulationDesign, designs: StudyDesignCandidate[], text: string): ProjectGroup[] => {
  const groups: ProjectGroup[] = [{ groupId: stableId("group", { role: "study", population: population.populationId }), role: "STUDY_POPULATION", label: "Population d’étude", justification: "Ce groupe porte la Population scientifique dans laquelle la Question doit être examinée.", populationId: population.populationId, sourceRefs: [population.populationId], reviewState: "PENDING" }];
  const validation = designs.some((item) => item.family === "METHODOLOGICAL_VALIDATION");
  if (validation) {
    const methods = uniqueSorted(input.scientificContext.methodPreferences).slice(0, 2);
    if (methods.length >= 2) methods.forEach((method) => groups.push({ groupId: stableId("group", { role: "method", method }), role: "METHOD", label: `Mesures par ${method}`, justification: "Cette méthode constitue l’une des branches explicitement comparées par la Question méthodologique.", populationId: population.populationId, sourceRefs: input.userProvidedInformation.filter((item) => item.value === method).map((item) => item.informationId), reviewState: "PENDING" }));
    else groups.push({ groupId: stableId("group", { role: "within-subject", question: input.confirmedScientificQuestion.questionId }), role: "WITHIN_SUBJECT", label: "Comparaison intra-sujet des méthodes à préciser", justification: "La validation méthodologique exige une référence ou comparaison explicite ; son identité reste ouverte au lieu d’être inventée.", populationId: population.populationId, sourceRefs: [input.confirmedScientificQuestion.questionId], reviewState: "PENDING" });
  } else if (includesAny(text, [/compar/, /groupe/, /exposé/, /intervention/]) && input.scientificContext.exposuresOrInterventions.length) {
    input.scientificContext.exposuresOrInterventions.forEach((value) => groups.push({ groupId: stableId("group", { role: "exposure", value }), role: "EXPOSURE", label: value, justification: "Groupe dérivé d’une exposition ou intervention explicitement déclarée et pertinente pour la comparaison.", populationId: population.populationId, sourceRefs: input.userProvidedInformation.filter((item) => item.value === value).map((item) => item.informationId), reviewState: "PENDING" }));
  }
  return groups;
};

const buildVariables = (input: ResearchProjectConstructionInput, controls: ResearchProjectControls): ProjectVariable[] => {
  const imaging = input.imagingDesignResult?.imagingVariables.map((item) => ({
    variableId: item.variableId,
    definition: item.definition,
    source: "IMAGING" as const,
    sourceRef: input.imagingDesignResult!.resultId,
    role: "MEASUREMENT_CANDIDATE" as const,
    timingIds: [] as string[], endpointIds: [] as string[], analysisRequirementIds: [] as string[],
    qualityRequirements: uniqueSorted(item.qualityRuleIds), provenance: uniqueSorted(item.provenance),
    knowledgeStatus: item.limitations.length ? "PARTIAL" as const : "KNOWN" as const,
    finalDataDictionaryName: null,
  })) ?? [];
  const existing = new Set(imaging.map((item) => normalizeScientificText(item.definition).toLocaleLowerCase("fr-FR")));
  const outcomeAnswer = controls.answers?.["PRJ-Q-OUTCOME"];
  const declaredOutcomes = uniqueSorted([...input.scientificContext.outcomes, ...(outcomeAnswer && !/^unknown$/i.test(outcomeAnswer) ? [normalizeScientificText(outcomeAnswer)] : [])]);
  const outcomes = declaredOutcomes.filter((item) => !existing.has(normalizeScientificText(item).toLocaleLowerCase("fr-FR"))).map((item) => ({
    variableId: stableId("variable", { outcome: item, question: input.confirmedScientificQuestion.questionId }), definition: item,
    source: "USER_PROVIDED" as const, sourceRef: input.userProvidedInformation.find((info) => info.value === item)?.informationId ?? input.confirmedScientificQuestion.questionId,
    role: "OUTCOME_CANDIDATE" as const, timingIds: [] as string[], endpointIds: [] as string[], analysisRequirementIds: [] as string[], qualityRequirements: ["Définition, méthode d’obtention et évaluabilité à préciser"], provenance: input.provenance, knowledgeStatus: "PARTIAL" as const, finalDataDictionaryName: null,
  }));
  return [...imaging, ...outcomes];
};

const temporalBlueprint = (input: ResearchProjectConstructionInput, designs: StudyDesignCandidate[], text: string) => {
  const prognostic = designs.some((item) => item.family === "PROSPECTIVE_PROGNOSTIC_COHORT");
  const longitudinal = designs.some((item) => ["PROSPECTIVE_LONGITUDINAL_COHORT", "RETROSPECTIVE_LONGITUDINAL_COHORT"].includes(item.family));
  const validation = designs.some((item) => item.family === "METHODOLOGICAL_VALIDATION");
  const known = uniqueSorted(input.knownTemporalInformation);
  const repeated = longitudinal || validation && includesAny(text, [/répét/, /reproductib/, /test.?retest/]);
  const anchor = known[0] ?? (prognostic ? "Mesure de référence précédant l’outcome futur" : longitudinal ? "Mesure de référence précédant l’évolution" : validation ? "Session de comparaison des méthodes" : "Temps scientifique unique à définir");
  return { prognostic, longitudinal, validation, repeated, known, anchor };
};

const buildEndpoints = (input: ResearchProjectConstructionInput, population: PopulationDesign, variables: ProjectVariable[], timingIds: string[], controls: ResearchProjectControls): EndpointCandidate[] => {
  const objectives = input.objectives.filter((item) => item.reviewState !== "REJECTED");
  const hypotheses = input.hypotheses.filter((item) => item.reviewState !== "REJECTED");
  return variables.map((variable) => {
    const imagingContribution = input.imagingDesignResult?.endpointContributions.find((item) => item.variableId === variable.variableId);
    const endpointId = stableId("endpoint", { variableId: variable.variableId, questionId: input.confirmedScientificQuestion.questionId });
    return {
      endpointId,
      label: `Critère candidat fondé sur : ${variable.definition}`,
      proposedRole: controls.endpointRoles?.[endpointId] ?? "UNDECIDED_CANDIDATE",
      questionId: input.confirmedScientificQuestion.questionId,
      objectiveIds: objectives.map((item) => item.objectiveId),
      hypothesisIds: hypotheses.map((item) => item.hypothesisId),
      variableIds: [variable.variableId],
      populationId: population.populationId,
      timingIds,
      analysisRequirementIds: [],
      measurementMethod: imagingContribution?.measurementMethod ?? (variable.source === "USER_PROVIDED" ? "Méthode de mesure à définir à partir de la source déclarée" : "Méthode issue de la contribution Imaging gelée"),
      justification: "Le Critère existe uniquement parce que cette Variable peut opérationnaliser un Objectif et une Hypothèse dans la Population et la temporalité du projet.",
      limitations: uniqueSorted([...(imagingContribution?.limitations ?? []), ...(!objectives.length ? ["Aucun Objectif adopté n’est encore disponible."] : []), ...(!hypotheses.length ? ["Aucune Hypothèse adoptée n’est encore disponible."] : [])]),
      humanDecisionRequired: true as const,
    };
  });
};

const buildAnalysisRequirements = (designs: StudyDesignCandidate[], endpoints: EndpointCandidate[], variables: ProjectVariable[], repeated: boolean, multicenter: boolean): AnalysisRequirement[] => {
  const purposes = new Set<AnalysisRequirement["purpose"]>(["DESCRIPTION"]);
  if (designs.some((item) => ["COMPARATIVE_OBSERVATIONAL", "METHODOLOGICAL_VALIDATION", "CASE_CONTROL"].includes(item.family))) purposes.add("COMPARISON");
  if (designs.some((item) => item.family === "METHODOLOGICAL_VALIDATION")) { purposes.add("AGREEMENT"); purposes.add("VALIDATION"); }
  if (designs.some((item) => item.family === "PROSPECTIVE_PROGNOSTIC_COHORT")) { purposes.add("PREDICTION"); purposes.add("ASSOCIATION"); purposes.add("TIME_TO_EVENT"); purposes.add("ADJUSTMENT"); }
  if (designs.some((item) => ["PROSPECTIVE_LONGITUDINAL_COHORT", "RETROSPECTIVE_LONGITUDINAL_COHORT"].includes(item.family))) purposes.add("CHANGE_OVER_TIME");
  if (repeated) purposes.add("REPEATED_MEASURES");
  if (multicenter) purposes.add("CENTER_EFFECT");
  return [...purposes].sort().map((purpose) => ({
    requirementId: stableId("analysis-requirement", { purpose, endpointIds: endpoints.map((item) => item.endpointId) }), purpose,
    reason: {
      DESCRIPTION: "Décrire la Population, les Variables et la distribution des Critères avant toute inférence.", COMPARISON: "La Question ou le plan candidat comporte des branches à comparer.", ASSOCIATION: "La relation entre mesure et outcome doit être examinée sans présumer sa causalité.", PREDICTION: "La finalité pronostique exige une évaluation de capacité prédictive distincte de l’association.", CHANGE_OVER_TIME: "Le plan longitudinal exige d’examiner l’évolution au cours du temps.", REPEATED_MEASURES: "Plusieurs mesures appartiennent au même sujet et leur dépendance doit être prise en compte.", AGREEMENT: "La validation méthodologique exige d’examiner l’accord entre méthodes.", VALIDATION: "La méthode candidate doit être évaluée contre une référence ou un cadre explicite.", TIME_TO_EVENT: "L’outcome futur peut dépendre du temps avant événement.", CENTER_EFFECT: "La structure multicentrique déclarée peut introduire une variabilité inter-centres.", ADJUSTMENT: "Les facteurs pronostiques concurrents doivent être considérés par Biostatistics.",
    }[purpose],
    endpointIds: endpoints.map((item) => item.endpointId), variableIds: variables.map((item) => item.variableId), dependencies: ["Biostatistics Engine", "Hypothèses numériques sourcées si nécessaires"], finalStatisticalModel: null, biostatisticsReviewRequired: true,
  }));
};

const buildVisits = (blueprint: ReturnType<typeof temporalBlueprint>, measurementIds: string[], endpoints: EndpointCandidate[]): ResearchProjectDesignResult["visits"] => {
  const visits: ResearchProjectDesignResult["visits"] = [];
  const add = (key: string, label: string, role: ResearchProjectDesignResult["visits"][number]["temporalRole"], timingValue: string | null, status: ResearchProjectDesignResult["visits"][number]["timingStatus"], justification: string) => visits.push({ visitId: stableId("visit", { key, anchor: blueprint.anchor }), label, temporalRole: role, timingValue, timingStatus: status, justification, hypothesisIds: [], endpointIds: endpoints.map((item) => item.endpointId), measurementIds, dependencies: ["Population disponible", "Mesures et qualité réalisables"] });
  if (blueprint.prognostic) {
    add("baseline", "Mesure de référence", "BASELINE", blueprint.known[0] ?? null, blueprint.known[0] ? "KNOWN" : "SCIENTIFIC_WINDOW_TO_DEFINE", "La mesure du biomarqueur doit précéder l’outcome futur pour préserver la relation pronostique.");
    add("future-outcome", "Évaluation de l’outcome futur", "EVENT", blueprint.known[1] ?? null, blueprint.known[1] ? "KNOWN" : "SCIENTIFIC_WINDOW_TO_DEFINE", "Cette évaluation distincte établit si l’événement futur survient après la mesure de référence.");
  } else if (blueprint.longitudinal) {
    add("baseline", "Mesure de référence", "BASELINE", blueprint.known[0] ?? null, blueprint.known[0] ? "KNOWN" : "SCIENTIFIC_WINDOW_TO_DEFINE", "Point d’ancrage nécessaire pour estimer une évolution intra-sujet.");
    add("follow-up", "Mesure de suivi", "FOLLOW_UP", blueprint.known[1] ?? null, blueprint.known[1] ? "KNOWN" : "SCIENTIFIC_WINDOW_TO_DEFINE", "Mesure nécessaire pour construire le changement défini par la Question longitudinale.");
  } else if (blueprint.validation && blueprint.repeated) {
    add("method-session", "Session de comparaison", "SINGLE_ASSESSMENT", blueprint.known[0] ?? null, blueprint.known[0] ? "KNOWN" : "SCIENTIFIC_WINDOW_TO_DEFINE", "Les méthodes doivent être comparées dans un contexte temporel compatible.");
    add("repeat-session", "Répétition méthodologique", "REPEATED_MEASUREMENT", blueprint.known[1] ?? null, blueprint.known[1] ? "KNOWN" : "SCIENTIFIC_WINDOW_TO_DEFINE", "La répétition n’existe que parce que la Question porte sur la répétabilité ou la reproductibilité.");
  } else add("single", "Évaluation scientifique unique", "SINGLE_ASSESSMENT", blueprint.known[0] ?? null, blueprint.known[0] ? "KNOWN" : "SCIENTIFIC_WINDOW_TO_DEFINE", "Une seule évaluation est la stratégie temporelle minimale suffisante tant qu’aucune évolution ou prédiction n’est demandée.");
  return visits;
};

const buildFeasibility = (input: ResearchProjectConstructionInput, population: PopulationDesign, endpoints: EndpointCandidate[], designs: StudyDesignCandidate[]): ResearchProjectDesignResult["feasibilityAssessment"] => {
  const dimensions = [
    ["SCIENTIFIC_FEASIBILITY", input.objectives.length && input.hypotheses.length ? "READY_WITH_OPEN_ITEMS" : "PARTIAL", ["Question conservée", `${input.objectives.length} Objectif(s)`, `${input.hypotheses.length} Hypothèse(s)`], input.objectives.length && input.hypotheses.length ? [] : ["Objectifs ou Hypothèses incomplets"], null],
    ["MEASUREMENT_FEASIBILITY", input.sourceHandoffs.imaging.status === "FROZEN_BY_HUMAN" || endpoints.some((item) => item.measurementMethod) ? "READY_WITH_LIMITATIONS" : "PARTIAL", [`${endpoints.length} Critère(s) candidat(s)`], endpoints.length ? [] : ["Aucune mesure opérationnalisée"], null],
    ["POPULATION_FEASIBILITY", population.missingInformation.length ? "READY_WITH_OPEN_ITEMS" : "READY", population.sourceRefs, population.missingInformation, null],
    ["TECHNICAL_FEASIBILITY", input.imagingDesignResult ? "READY_WITH_LIMITATIONS" : input.sourceHandoffs.imaging.status === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : "BLOCKED", input.imagingDesignResult ? ["Contribution Imaging gelée"] : [], input.sourceHandoffs.imaging.status === "REQUIRED_BUT_NOT_READY" ? ["Handoff Imaging gelé requis"] : [], "Imaging Engine"],
    ["DATA_FEASIBILITY", "NOT_EVALUATED_BY_SPECIALIZED_ENGINE", [], ["Data Management Engine requis"], "Data Management Engine"],
    ["STATISTICAL_FEASIBILITY", "NOT_EVALUATED_BY_SPECIALIZED_ENGINE", designs.map((item) => item.designId), ["Biostatistics Engine requis"], "Biostatistics Engine"],
    ["OPERATIONAL_FEASIBILITY", "NOT_EVALUATED_BY_SPECIALIZED_ENGINE", [], ["Clinical Operations Engine requis"], "Clinical Operations Engine"],
    ["REGULATORY_FEASIBILITY", "NOT_EVALUATED_BY_SPECIALIZED_ENGINE", [], ["Regulatory Engine et juridiction requis"], "Regulatory Engine"],
    ["ECONOMIC_FEASIBILITY", "NOT_EVALUATED_BY_SPECIALIZED_ENGINE", [], ["Economics Engine et coûts sourcés requis"], "Economics Engine"],
    ["SAFETY_FEASIBILITY", "NOT_EVALUATED_BY_SPECIALIZED_ENGINE", [], ["Safety Engine requis si exposition ou procédure applicable"], "Safety Engine"],
  ] as const;
  return dimensions.map(([domain, state, basis, gaps, specializedEngine]) => ({ domain, state, basis: [...basis], gaps: [...gaps], specializedEngine }));
};

const buildProjectionReadiness = (hasQuestion: boolean, hasDesign: boolean, hasEndpoints: boolean, hasVariables: boolean, frozen: boolean, imaging: boolean): ResearchProjectDesignResult["projectionReadiness"] => {
  const spec = [
    ["Protocol", hasDesign && hasEndpoints ? "PARTIALLY_GENERATABLE" : hasQuestion ? "STRUCTURE_ONLY" : "NOT_AVAILABLE", ["Question", "Design", "Population"], ["Décisions et revues spécialisées"]],
    ["Synopsis", hasDesign ? "PARTIALLY_GENERATABLE" : hasQuestion ? "STRUCTURE_ONLY" : "NOT_AVAILABLE", ["Question", "Objectifs", "Population"], ["Design humainement sélectionné"]],
    ["Funding", hasQuestion ? "STRUCTURE_ONLY" : "NOT_AVAILABLE", ["Objectifs"], ["Economics et financement spécialisés"]],
    ["Publication", hasDesign ? "STRUCTURE_ONLY" : "NOT_AVAILABLE", ["Question et méthode candidate"], ["Résultats réels et auteurs"]],
    ["CRF", hasVariables ? "PARTIALLY_GENERATABLE" : "NOT_AVAILABLE", ["Variables et Visits"], ["Data Management et définitions finales"]],
    ["Data Dictionary", hasVariables ? "PARTIALLY_GENERATABLE" : "NOT_AVAILABLE", ["Variables conceptuelles"], ["Normalisation Data Management"]],
    ["SAP", hasEndpoints ? "STRUCTURE_ONLY" : "NOT_AVAILABLE", ["Hypothèses, Critères, Variables"], ["Biostatistics et hypothèses numériques"]],
    ["Budget", hasDesign ? "STRUCTURE_ONLY" : "NOT_AVAILABLE", ["Design et ressources candidates"], ["Prix sourcés et Economics"]],
    ["Timeline", hasDesign ? "STRUCTURE_ONLY" : "NOT_AVAILABLE", ["Visites et dépendances"], ["Dates opérationnelles et responsables"]],
    ["CPP", frozen ? "STRUCTURE_ONLY" : "NOT_AVAILABLE", ["Version candidate"], ["Juridiction et qualification réglementaire humaine"]],
    ["ANSM", frozen ? "STRUCTURE_ONLY" : "NOT_AVAILABLE", ["Version candidate"], ["Qualification réglementaire et pièces applicables"]],
    ["Core Lab Manual", imaging ? "PARTIALLY_GENERATABLE" : "NOT_AVAILABLE", ["Imaging, QA, lecture"], ["Décision Core Lab et Operations"]],
    ["Monitoring Plan", hasDesign ? "STRUCTURE_ONLY" : "NOT_AVAILABLE", ["Risques et Visites"], ["Étude active et Operations"]],
    ["Investigator Guide", frozen ? "STRUCTURE_ONLY" : "NOT_AVAILABLE", ["Version candidate"], ["Revue institutionnelle, sécurité et opérations"]],
  ] as const;
  return spec.map(([projection, availability, basis, missing]) => ({ projection, availability, basis: [...basis], missing: [...missing], notice: "DATA_AVAILABILITY_ONLY_NOT_APPROVAL" as const }));
};

const buildDecisions = (population: PopulationDesign, designs: StudyDesignCandidate[], groups: ProjectGroup[], endpoints: EndpointCandidate[], alternatives: ResearchProjectDesignResult["alternatives"], limitations: string[], controls: ResearchProjectControls): ResearchProjectDesignResult["decisionsRequired"] => {
  const entries = [
    ["PRJ-GATE-POPULATION", "POPULATION", "Adopter la Population scientifique structurante", population.missingInformation.length ? "La Population conserve des informations ouvertes qui conditionnent l’interprétation." : "La Population définit le domaine dans lequel la Question sera examinée.", [population.populationId]],
    ["PRJ-GATE-STUDY-DESIGN", "STUDY_DESIGN", "Choisir un plan d’étude parmi les candidats", "Le moteur conserve les plans défendables et ne sélectionne jamais automatiquement.", designs.map((item) => item.designId)],
    ...(groups.length > 1 ? [["PRJ-GATE-GROUPS", "GROUPS", "Adopter les groupes ou comparateurs structurants", "Chaque groupe modifie l’interprétation et les exigences analytiques.", groups.map((item) => item.groupId)]] : []),
    ...(endpoints.length ? [["PRJ-GATE-PRIMARY-ENDPOINT", "PRIMARY_ENDPOINT", "Décider du Critère principal", "PRIMARY, SECONDARY et EXPLORATORY restent des décisions humaines.", endpoints.map((item) => item.endpointId)]] : []),
    ...(alternatives.length > 1 ? [["PRJ-GATE-ALTERNATIVE", "ALTERNATIVE", "Arbitrer entre les stratégies alternatives", "Aucune stratégie n’est déclarée meilleure sans préférences et revue humaines.", alternatives.map((item) => item.alternativeId)]] : []),
    ...(alternatives.length > 1 ? [["PRJ-GATE-COMPROMISE", "COMPROMISE", "Accepter le compromis majeur", "L’arbitrage entre précision, faisabilité, temporalité et portée engage le projet.", alternatives.map((item) => item.alternativeId)]] : []),
    ...(limitations.length ? [["PRJ-GATE-LIMITATIONS", "LIMITATION", "Accepter les limitations structurantes", "Une limitation reconnue reste visible et ne devient pas résolue par son acceptation.", limitations.map((_, index) => `limitation:${index + 1}`)]] : []),
    ["PRJ-GATE-FREEZE", "VERSION_FREEZE", "Geler une Version candidate", "Le gel crée une version immuable pour un usage nommé ; il ne vaut pas validation scientifique.", ["candidate-version"]],
    ["PRJ-GATE-DOCUMENT-HANDOFF", "DOCUMENT_PROJECTION", "Autoriser le passage vers les projections documentaires", "Le Document Engine ne peut être mobilisé qu’après décision humaine et depuis une version identifiée.", ["document-handoff"]],
  ] as Array<[string, string, string, string, string[]]>;
  return entries.map(([gateId, type, label, reason, targetIds]) => ({ gateId, type, label, reason, targetIds, status: controls.gateStatuses?.[gateId] ?? "PENDING" }));
};

export const executeResearchProjectConstruction = (input: ResearchProjectConstructionInput, controls: ResearchProjectControls = {}): ResearchProjectDesignResult => {
  const text = allText(input);
  const populationDesign = buildPopulation(input, controls);
  const studyDesignCandidates = buildDesignCandidates(input, text);
  const groups = buildGroups(input, populationDesign, studyDesignCandidates, text);
  const variables = buildVariables(input, controls);
  const blueprint = temporalBlueprint(input, studyDesignCandidates, text);
  const timingIds = blueprint.prognostic ? [stableId("visit", { key: "baseline", anchor: blueprint.anchor }), stableId("visit", { key: "future-outcome", anchor: blueprint.anchor })]
    : blueprint.longitudinal ? [stableId("visit", { key: "baseline", anchor: blueprint.anchor }), stableId("visit", { key: "follow-up", anchor: blueprint.anchor })]
      : blueprint.validation && blueprint.repeated ? [stableId("visit", { key: "method-session", anchor: blueprint.anchor }), stableId("visit", { key: "repeat-session", anchor: blueprint.anchor })]
        : [stableId("visit", { key: "single", anchor: blueprint.anchor })];
  const endpointCandidates = buildEndpoints(input, populationDesign, variables, timingIds, controls);
  const multicenterDeclared = input.scientificContext.centerDeclarations.length > 1 || input.imagingDesignResult?.harmonizationStrategy.centerMode.startsWith("MULTICENTRIC") === true || includesAny(text, [/multicent/]);
  const analysisRequirements = buildAnalysisRequirements(studyDesignCandidates, endpointCandidates, variables, blueprint.repeated, multicenterDeclared);
  endpointCandidates.forEach((endpoint) => { endpoint.analysisRequirementIds = analysisRequirements.filter((item) => item.endpointIds.includes(endpoint.endpointId)).map((item) => item.requirementId); });
  variables.forEach((variable) => {
    variable.timingIds = timingIds;
    variable.endpointIds = endpointCandidates.filter((item) => item.variableIds.includes(variable.variableId)).map((item) => item.endpointId);
    variable.analysisRequirementIds = analysisRequirements.filter((item) => item.variableIds.includes(variable.variableId)).map((item) => item.requirementId);
  });
  const measurementDependencies = variables.map((variable) => ({ dependencyId: stableId("measurement", { variableId: variable.variableId }), measurementRef: variable.sourceRef, requiredFor: [variable.variableId, ...variable.endpointIds], reason: `Cette mesure est nécessaire pour produire la Variable « ${variable.definition} » et ses Critères candidats.`, status: variable.knowledgeStatus }));
  const visits = buildVisits(blueprint, measurementDependencies.map((item) => item.dependencyId), endpointCandidates).map((visit) => ({ ...visit, hypothesisIds: input.hypotheses.map((item) => item.hypothesisId) }));
  const comparators = groups.length > 1 ? [{ comparatorId: stableId("comparator", groups.map((item) => item.groupId)), groupIds: groups.map((item) => item.groupId), kind: groups.some((item) => item.role === "METHOD") ? "METHOD_COMPARISON" : groups.some((item) => item.role === "WITHIN_SUBJECT") ? "WITHIN_SUBJECT_COMPARISON_TO_DEFINE" : "DECLARED_GROUP_COMPARISON", justification: "Le comparateur existe uniquement parce que la Question ou la stratégie méthodologique exige une comparaison explicite.", reviewState: "PENDING" as const }] : [];
  const missingInformation = uniqueSorted([
    ...input.uncertainties,
    ...input.knowledgeResults.gaps.map((item) => item.explanation),
    ...populationDesign.missingInformation,
    ...(!endpointCandidates.length ? ["Aucun Critère candidat n’est constructible sans Variable ou outcome déclaré."] : []),
    ...(input.sourceHandoffs.imaging.status === "REQUIRED_BUT_NOT_READY" ? ["La stratégie Imaging impliquée doit être gelée avant construction du projet."] : []),
  ]);
  const limitations = uniqueSorted([
    ...input.knowledgeResults.limitations,
    ...(input.imagingDesignResult?.limitations ?? []),
    "Aucun moteur spécialisé Biostatistics, Data, Regulatory, Economics, Safety ou Operations n’est simulé.",
    "La sortie est une projection runtime de construction et non un protocole ou document final.",
  ]);
  const alternatives = studyDesignCandidates.map((design) => ({ alternativeId: stableId("alternative", design.designId), designId: design.designId, label: design.label, enables: [design.estimandPurpose], cannotEstablish: design.limitations, requirements: design.constraints, risks: design.biases, timingConsequences: design.family.includes("LONGITUDINAL") || design.family.includes("PROGNOSTIC") ? ["Plusieurs temps scientifiquement justifiés sont requis."] : ["Une évaluation unique peut être suffisante."], endpointConsequences: endpointCandidates.length ? [`${endpointCandidates.length} Critère(s) candidat(s) doivent être adaptés au plan retenu.`] : ["Critère à construire avant adoption."], dataConsequences: variables.length ? [`${variables.length} Variable(s) conceptuelle(s) à gouverner par Data Management.`] : ["Variables à définir."], specializedNeeds: uniqueSorted(["Biostatistics Engine", "Data Management Engine", ...(input.imagingDesignResult ? ["Imaging Engine"] : [])]), uncertainty: design.limitations.join(" "), reviewState: "PENDING" as const }));
  const compromises = alternatives.length > 1 ? [{ compromiseId: stableId("compromise", alternatives.map((item) => item.alternativeId)), options: alternatives.map((item) => item.alternativeId), gains: alternatives.map((item) => item.enables[0]), losses: alternatives.flatMap((item) => item.cannotEstablish), nonCompensableItems: ["La Question, la Population et l’absence d’invention de valeurs restent non négociables."], humanDecisionRequired: true as const }] : [];
  const feasibilityAssessment = buildFeasibility(input, populationDesign, endpointCandidates, studyDesignCandidates);
  const rare = includesAny(text, [/rare/, /faible prévalence/, /maladie rare/, /petite population/]);
  const recruitmentModelRequirements: ResearchProjectDesignResult["recruitmentModelRequirements"] = { status: "REQUIREMENTS_ONLY", raritySignal: rare ? "PRESENT" : input.knownPopulationInformation.length ? "ABSENT" : "UNKNOWN", inputs: ["Population éligible estimée", "Prévalence ou incidence applicable", "File active", "Taux de consentement", "Taux d’éligibilité", "Capacité de centre", "Attrition", "Durée disponible"].map((name) => ({ name, value: null, source: "UNKNOWN", reason: "Entrée nécessaire au futur modèle de recrutement ; aucune valeur n’est déduite par PRJ-001." })), centerCount: null, recruitmentRate: null, recruitmentDuration: null };
  const multicenterAssessment: ResearchProjectDesignResult["multicenterAssessment"] = { declaredMode: input.imagingDesignResult?.harmonizationStrategy.centerMode ?? (multicenterDeclared ? "MULTICENTRIC_DECLARED" : input.scientificContext.centerDeclarations.length === 1 ? "MONOCENTRIC_DECLARED" : "UNKNOWN"), scientificNecessity: rare || multicenterDeclared ? "POSSIBLE" : "NOT_DEMONSTRATED", operationalNecessity: "NOT_EVALUATED_BY_SPECIALIZED_ENGINE", factors: uniqueSorted([...(rare ? ["Rareté déclarée et recrutement potentiellement contraint"] : []), ...(input.imagingDesignResult ? input.imagingDesignResult.harmonizationStrategy.variantsToQualify : []), ...(multicenterDeclared ? ["Variabilité inter-centres et effet centre à instruire"] : [])]), monocenterAlternativePreserved: true, centerCount: null, notice: "MULTICENTER_IS_NOT_AUTOMATICALLY_SUPERIOR" };
  const biases: ResearchProjectDesignResult["biases"] = studyDesignCandidates.flatMap((design) => design.biases.map((label) => ({ biasId: stableId("bias", { designId: design.designId, label }), label, justification: `Ce biais possède un chemin direct vers le plan candidat « ${design.label} » et son interprétation.`, affectedIds: [design.designId, ...endpointCandidates.map((item) => item.endpointId)], mitigationCandidate: "Définition et mesure à revoir avec les moteurs spécialisés et l’équipe humaine.", provenance: design.sourceSignals }))).filter((item, index, all) => all.findIndex((candidate) => candidate.label === item.label) === index);
  if (multicenterDeclared) biases.push({ biasId: stableId("bias", "center"), label: "Effet centre", justification: "La structure multicentrique déclarée peut modifier mesure, recrutement et outcome.", affectedIds: [...studyDesignCandidates.map((item) => item.designId), ...variables.map((item) => item.variableId)], mitigationCandidate: "Caractériser centres, harmonisation et stratégie analytique avec Imaging/Data/Biostatistics.", provenance: input.scientificContext.centerDeclarations });
  const prognostic = studyDesignCandidates.some((item) => item.family === "PROSPECTIVE_PROGNOSTIC_COHORT");
  const confounders: ResearchProjectDesignResult["confounders"] = prognostic ? [{ confounderId: stableId("confounder", "baseline-severity"), label: "Sévérité initiale de la condition", whyPlausible: "Elle peut être associée à la mesure initiale et à l’outcome futur dans une étude pronostique.", affectedIds: [...variables.map((item) => item.variableId), ...endpointCandidates.map((item) => item.endpointId)], measurementNeed: "Définir une mesure de sévérité seulement après soutien Knowledge et revue clinique.", knowledgeSupport: input.knowledgeResults.assertions.some((item) => /sévérit|stade|pronosti/i.test(item.text)) ? "SUPPORTED" : "UNKNOWN", biostatisticsDecisionRequired: true }] : [];
  const risks: ResearchProjectDesignResult["risks"] = [
    ...(rare ? [{ riskId: stableId("risk", "recruitment"), source: "Rareté déclarée de la Population", affectedIds: [populationDesign.populationId], probability: null, impact: "Le recrutement peut conditionner le plan et la portée de l’étude.", detectability: "Évaluable après données de prévalence, file active et capacité de centres.", mitigationCandidate: "Comparer scénarios mono/multicentriques après données sourcées.", futureOwner: "Clinical Operations / Economics", provenance: input.knownPopulationInformation }] : []),
    ...biases.map((bias) => ({ riskId: stableId("risk", bias.biasId), source: bias.label, affectedIds: bias.affectedIds, probability: null, impact: "Peut modifier la validité ou l’interprétation du projet.", detectability: "À qualifier pendant la revue méthodologique et spécialisée.", mitigationCandidate: bias.mitigationCandidate, futureOwner: "Responsable scientifique et moteur spécialisé", provenance: bias.provenance })),
  ];
  const dataManagementRequirements: ResearchProjectDesignResult["dataManagementRequirements"] = [
    ...variables.map((item) => ({ requirementId: stableId("data-requirement", item.variableId), kind: "VARIABLE_DEFINITION_AND_PROVENANCE", reason: `Définir source, unité, temporalité, dérivation, qualité et missingness pour « ${item.definition} » sans imposer de nom final.`, sourceRefs: [item.variableId, item.sourceRef], status: "SPECIALIZED_ENGINE_REQUIRED" as const })),
    ...visits.map((item) => ({ requirementId: stableId("data-requirement", item.visitId), kind: "VISIT_AND_REPEATED_DATA_STRUCTURE", reason: `Relier les données attendues à « ${item.label} » et conserver les répétitions intra-sujet.`, sourceRefs: [item.visitId, ...item.measurementIds], status: "SPECIALIZED_ENGINE_REQUIRED" as const })),
  ];
  const sizingInputs = uniqueSorted(["Effet minimal scientifiquement pertinent", "Variance ou distribution applicable", ...(prognostic ? ["Taux d’événement", "Durée de suivi"] : []), ...(blueprint.repeated ? ["Corrélation intra-sujet"] : []), ...(multicenterDeclared ? ["Structure et variabilité centre"] : []), "Attrition", "Alpha", "Puissance cible"]);
  const sizingRequirements: ResearchProjectDesignResult["sizingRequirements"] = { status: "SPECIALIZED_ENGINE_REQUIRED", inputs: sizingInputs.map((name) => ({ name, value: null, source: "UNKNOWN", requiredWhen: "Si un Dimensionnement numérique est demandé après sélection humaine du plan et du Critère principal.", reason: "Cette valeur doit provenir de Knowledge, d’une source ou de l’utilisateur ; PRJ-001 ne l’invente pas." })), sampleSize: null, power: null, notice: "NO_STATISTICAL_VALUE_INVENTED" };
  const imagingContribution: ResearchProjectDesignResult["imagingContribution"] = input.imagingDesignResult ? { applicability: "APPLICABLE", resultRef: input.imagingDesignResult.resultId, variableIds: input.imagingDesignResult.imagingVariables.map((item) => item.variableId), acquisitionRefs: input.imagingDesignResult.acquisitionStrategies.map((item) => item.acquisitionId), qualityRefs: input.imagingDesignResult.qualityStrategy.map((item) => item.ruleId), limitations: input.imagingDesignResult.limitations }
    : input.sourceHandoffs.imaging.status === "NOT_APPLICABLE" ? { applicability: "NOT_APPLICABLE", resultRef: null, variableIds: [], acquisitionRefs: [], qualityRefs: [], limitations: [] }
      : { applicability: "REQUIRED_BUT_NOT_READY", resultRef: null, variableIds: [], acquisitionRefs: [], qualityRefs: [], limitations: ["Handoff Imaging gelé requis avant construction."] };
  const regulatoryQuestions: ResearchProjectDesignResult["regulatoryQuestions"] = [{ questionId: stableId("regulatory-question", input.projectId), question: "Quelle juridiction, nature observationnelle/interventionnelle et qualification humaine s’appliquent au projet ?", trigger: input.scientificContext.exposuresOrInterventions.length ? "Exposition ou intervention déclarée" : "Projet impliquant participants ou données", status: "NOT_EVALUATED_BY_SPECIALIZED_ENGINE" }];
  const safetyQuestions: ResearchProjectDesignResult["safetyQuestions"] = input.imagingDesignResult || input.scientificContext.exposuresOrInterventions.length ? [{ questionId: stableId("safety-question", input.projectId), question: "Quelles expositions, procédures, populations ou produits exigent une revue de sécurité ?", trigger: input.imagingDesignResult ? "Procédure Imaging" : "Exposition ou intervention déclarée", status: "NOT_EVALUATED_BY_SPECIALIZED_ENGINE" }] : [];
  const economicsQuestions: ResearchProjectDesignResult["economicsQuestions"] = [{ questionId: stableId("economics-question", input.projectId), question: "Quels examens, visites, lectures, stockage, centres, personnel, monitoring, licences ou sous-traitances doivent être chiffrés à partir de sources ?", trigger: "Construction d’une stratégie de projet", status: "NOT_EVALUATED_BY_SPECIALIZED_ENGINE" }, { questionId: stableId("funding-question", input.projectId), question: "Quel mécanisme de financement est compatible avec l’ambition, le calendrier et les ressources après revue spécialisée ?", trigger: "Une projection Funding pourra être demandée", status: "FUNDING_STRATEGY_REQUIRES_SPECIALIZED_REVIEW" }];
  const operationsQuestions: ResearchProjectDesignResult["operationsQuestions"] = [{ questionId: stableId("operations-question", input.projectId), question: "Quelles capacités de recrutement, responsabilités, ressources, systèmes sources et calendriers sont réellement disponibles ?", trigger: rare || multicenterDeclared ? "Recrutement ou multicentrique structurant" : "Future activation de l’étude", status: "NOT_EVALUATED_BY_SPECIALIZED_ENGINE" }];
  const selectedDecisionId = controls.selectedDesignId && controls.gateStatuses?.["PRJ-GATE-STUDY-DESIGN"] === "APPROVED" ? controls.studyDesignDecisionId ?? null : null;
  const selectedStudyDesignCandidate = controls.selectedDesignId && studyDesignCandidates.some((item) => item.designId === controls.selectedDesignId) && selectedDecisionId ? { designId: controls.selectedDesignId, decisionRecordId: selectedDecisionId, humanSelected: true as const } : null;
  const decisionsRequired = buildDecisions(populationDesign, studyDesignCandidates, groups, endpointCandidates, alternatives, limitations, controls);
  const criticalGateIds = decisionsRequired.filter((item) => item.gateId !== "PRJ-GATE-DOCUMENT-HANDOFF").map((item) => item.gateId);
  const criticalApproved = criticalGateIds.every((gateId) => decisionsRequired.find((item) => item.gateId === gateId)?.status === "APPROVED");
  const frozen = Boolean(controls.frozenVersion && criticalApproved && selectedStudyDesignCandidate);
  const versionId = `${input.strategyVersion}-project-${logicalDigest({ projectId: input.projectId, inputId: input.inputId, decisionRecordIds: controls.versionDecisionRecordIds ?? [], confirmedChanges: (controls.changes ?? []).filter((item) => item.status === "CONFIRMED").map((item) => item.changeId), frozen })}`;
  const projectionReadiness = buildProjectionReadiness(true, Boolean(selectedStudyDesignCandidate), endpointCandidates.length > 0, variables.length > 0, frozen, Boolean(input.imagingDesignResult));
  const dependencies = [
    ...input.objectives.map((item) => ({ dependencyId: stableId("dependency", { from: input.confirmedScientificQuestion.questionId, to: item.objectiveId }), from: input.confirmedScientificQuestion.questionId, to: item.objectiveId, reason: "La Question définit l’Objectif.", changeEffect: "REVIEW_REQUIRED" as const })),
    ...input.hypotheses.map((item) => ({ dependencyId: stableId("dependency", { from: input.objectives[0]?.objectiveId ?? input.confirmedScientificQuestion.questionId, to: item.hypothesisId }), from: input.objectives[0]?.objectiveId ?? input.confirmedScientificQuestion.questionId, to: item.hypothesisId, reason: "L’Hypothèse examine un Objectif.", changeEffect: "REVIEW_REQUIRED" as const })),
    ...analysisRequirements.flatMap((analysis) => analysis.endpointIds.map((endpointId) => ({ dependencyId: stableId("dependency", { from: endpointId, to: analysis.requirementId }), from: endpointId, to: analysis.requirementId, reason: "Le Critère détermine l’exigence analytique.", changeEffect: "INVALIDATED" as const }))),
  ];
  const candidateVersion: ResearchProjectDesignResult["candidateVersion"] = { versionId, priorVersion: controls.priorFrozenVersionId ?? input.strategyVersion, status: frozen ? "FROZEN_BY_HUMAN" : "CANDIDATE_NOT_FROZEN", objectRefs: uniqueSorted([input.confirmedScientificQuestion.questionId, populationDesign.populationId, ...studyDesignCandidates.map((item) => item.designId), ...groups.map((item) => item.groupId), ...visits.map((item) => item.visitId), ...endpointCandidates.map((item) => item.endpointId), ...variables.map((item) => item.variableId), ...analysisRequirements.map((item) => item.requirementId)]), decisionRecordIds: uniqueSorted(controls.versionDecisionRecordIds ?? []), knowledgeResultRef: input.knowledgeResults.resultId, unknowns: missingInformation, contradictions: input.contradictions, limitations, dependencies: dependencies.map((item) => item.dependencyId), changesFromPrevious: uniqueSorted((controls.changes ?? []).filter((item) => item.status === "CONFIRMED").map((item) => item.changeId)), frozenAt: controls.frozenVersion?.frozenAt ?? null, actor: controls.frozenVersion?.actor ?? null, mandateRef: controls.frozenVersion?.mandateRef ?? null };
  const documentGateApproved = decisionsRequired.find((item) => item.gateId === "PRJ-GATE-DOCUMENT-HANDOFF")?.status === "APPROVED";
  const documentBlockedBy = uniqueSorted([...(frozen ? [] : ["PROJECT_VERSION_NOT_FROZEN"]), ...(documentGateApproved ? [] : ["DOCUMENT_HANDOFF_HUMAN_DECISION_PENDING"]), ...(input.sourceHandoffs.imaging.status === "REQUIRED_BUT_NOT_READY" ? ["IMAGING_HANDOFF_NOT_READY"] : [])]);
  const documentHandoff: ResearchProjectDesignResult["documentHandoff"] = { handoffVersion: "1.0", status: documentBlockedBy.length ? frozen ? "READY_FOR_HUMAN_AUTHORIZATION" : "NOT_READY" : "AUTHORIZED", projectId: input.projectId, candidateVersionRef: versionId, includedSections: ["Question", "Context", "Objectives", "Hypotheses", "Population", "Study Design", "Groups and Comparators", "Temporal Structure", "Visits", "Endpoints", "Variables", "Imaging Contribution", "Analysis Requirements", "Quality", "Feasibility", "Biases", "Confounders", "Risks", "Alternatives", "Decisions", "Knowledge and Provenance", "Unknowns", "Contradictions", "Limitations", "Specialized Engine Requirements", "Version"], specializedEngineRequirements: ["Biostatistics", "Data Management", "Regulatory", "Economics", "Safety", "Clinical Operations"], decisionRecordIds: uniqueSorted(controls.decisionRecordIds ?? []), blockedBy: documentBlockedBy, boundary: "NO_DOCUMENT_GENERATED_DOCUMENT_ENGINE_OWNS_PROJECTIONS" };
  const adaptiveQuestions: ResearchProjectDesignResult["adaptiveQuestions"] = [
    ...(!populationDesign.populationConcept.questionRequiredCharacteristics.length ? [{ questionId: "PRJ-Q-POPULATION", label: "Chez quelle Population cette Question doit-elle être examinée ?", whyAsked: "La Population conditionne le domaine de validité, les groupes, la faisabilité et les Critères.", decisionImpact: "Population, design, faisabilité et Biostatistics", decisionBlock: "POPULATION", suggestedAnswers: [], acceptsFreeText: true as const, acceptsUnknown: true as const, answeredValue: controls.answers?.["PRJ-Q-POPULATION"] ?? null }] : []),
    ...(!endpointCandidates.length ? [{ questionId: "PRJ-Q-OUTCOME", label: "Quel résultat observable permettrait réellement de répondre à la Question ?", whyAsked: "Un Critère ne peut être construit sans Variable et outcome défendables.", decisionImpact: "Variables, Critères, Visits, analyses et dimensionnement", decisionBlock: "ENDPOINTS", suggestedAnswers: [], acceptsFreeText: true as const, acceptsUnknown: true as const, answeredValue: controls.answers?.["PRJ-Q-OUTCOME"] ?? null }] : []),
    ...(rare ? [{ questionId: "PRJ-Q-RECRUITMENT", label: "Disposez-vous d’une estimation sourcée de la file active et de la rareté applicable ?", whyAsked: "La rareté peut modifier la faisabilité et l’arbitrage mono/multicentrique.", decisionImpact: "Recrutement, faisabilité, nombre de centres futur et calendrier", decisionBlock: "FEASIBILITY", suggestedAnswers: [{ value: "available", label: "Oui, une source existe", consequence: "Elle pourra être transmise au futur modèle de recrutement." }], acceptsFreeText: true as const, acceptsUnknown: true as const, answeredValue: controls.answers?.["PRJ-Q-RECRUITMENT"] ?? null }] : []),
  ];
  const localReadiness: ResearchProjectDesignResult["localReadiness"] = feasibilityAssessment.map((item) => ({ domain: item.domain, state: item.state, requirementsSatisfied: item.basis, openItems: item.gaps }));
  const impactGraph = buildResearchProjectGraph(input, { populationDesign, studyDesignCandidates, groups, visits, variables, endpointCandidates, analysisRequirements, measurementDependencies }, controls.changes ?? [], controls.impacts ?? []);
  const refusal = input.sourceHandoffs.imaging.status === "REQUIRED_BUT_NOT_READY" ? { code: "IMAGING_HANDOFF_NOT_READY" as const, reason: "La Question implique l’imagerie mais aucune stratégie Imaging gelée n’est disponible.", resumeCondition: "Revenir vers IMG-001, résoudre ses portes humaines et geler le handoff Project Construction." } : null;
  const incomplete = !input.objectives.length || !input.hypotheses.length || populationDesign.missingInformation.length > 0 || !endpointCandidates.length;
  const status: ResearchProjectDesignResult["status"] = refusal ? "REFUSED" : incomplete ? "PARTIAL_PROJECT" : "PROJECT_CANDIDATES";
  const resultMaterial = { inputId: input.inputId, populationDesign, studyDesignCandidates, selectedStudyDesignCandidate, groups, visits, endpointCandidates, variables, analysisRequirements, feasibilityAssessment, decisionsRequired, candidateVersion, controls };
  const resultDigest = logicalDigest(resultMaterial);
  const result: ResearchProjectDesignResult = {
    contractVersion: RESEARCH_PROJECT_CONSTRUCTION_VERSION, inputVersion: RESEARCH_PROJECT_CONSTRUCTION_VERSION, resultId: `research-project-design-result:${resultDigest}`, resultDigest, status, projectionNotice: "RUNTIME_PROJECT_PROJECTION_DOES_NOT_OWN_CANONICAL_TRUTH",
    scientificQuestion: input.confirmedScientificQuestion, objectives: input.objectives, hypotheses: input.hypotheses, populationDesign, studyDesignCandidates, selectedStudyDesignCandidate, groups, comparators, visits,
    temporalStructure: { rationale: blueprint.prognostic ? "Mesure initiale distincte de l’outcome futur." : blueprint.longitudinal ? "Mesure de référence et suivi nécessaires pour estimer une évolution." : blueprint.validation ? "Mesures comparables, répétées uniquement si la Question le justifie." : "Évaluation unique minimale suffisante en l’absence de finalité temporelle.", anchor: blueprint.anchor, biologicalWindows: blueprint.known, operationalWindows: visits.filter((item) => item.timingStatus !== "KNOWN").map((item) => ({ requirement: `Définir la fenêtre opérationnelle de ${item.label} après validation de sa fenêtre scientifique.`, status: "FUTURE_DEFINITION_REQUIRED" })), repeatedMeasures: blueprint.repeated, unknowns: visits.filter((item) => item.timingStatus !== "KNOWN").map((item) => `Timing de ${item.label} à définir`) },
    endpointCandidates, variables, measurementDependencies, analysisRequirements, sizingRequirements, imagingContribution, dataManagementRequirements,
    biostatisticsRequirements: { status: "SPECIALIZED_ENGINE_REQUIRED", questionRef: input.confirmedScientificQuestion.questionId, hypothesisIds: input.hypotheses.map((item) => item.hypothesisId), designCandidateIds: studyDesignCandidates.map((item) => item.designId), groupIds: groups.map((item) => item.groupId), endpointIds: endpointCandidates.map((item) => item.endpointId), variableIds: variables.map((item) => item.variableId), timingIds: visits.map((item) => item.visitId), repeatedMeasures: blueprint.repeated, multicenterStructure: multicenterAssessment.declaredMode, analysisPurposes: analysisRequirements.map((item) => item.purpose), knownAssumptions: [], unknownAssumptions: uniqueSorted(["Modèle statistique final", ...sizingInputs]), missingNumericalInputs: sizingInputs },
    regulatoryQuestions, safetyQuestions, economicsQuestions, operationsQuestions, feasibilityAssessment, recruitmentModelRequirements, multicenterAssessment, biases, confounders, risks, limitations, contradictions: input.contradictions, missingInformation, alternatives, compromises, decisionsRequired, dependencies, impactGraph, localReadiness, projectionReadiness, adaptiveQuestions, candidateVersion, documentHandoff,
    provenance: { engineVersion: RESEARCH_PROJECT_CONSTRUCTION_VERSION, inputRef: input.inputId, sourceRefs: input.provenance, policyRefs: ["PD-003", "PD-004", "PD-009", "RDE-001", "RDE-002", "RDE-003", "KE-001", "ST-001", "IMG-001"], llmContributionStatus: "NO_LLM_SCIENTIFIC_DECISION" },
    trace: [{ sequence: 1, operation: "CONSTRUCT_PROJECT_CANDIDATES", mode: "DETERMINISTIC", decision: "NO_AUTOMATIC_DESIGN_SELECTION", inputDigest: logicalDigest(input), outputDigest: resultDigest }, { sequence: 2, operation: "REQUEST_STRUCTURING_DECISIONS", mode: "HUMAN_REQUIRED", decision: `${decisionsRequired.filter((item) => item.status === "PENDING").length}_GATES_PENDING`, inputDigest: resultDigest, outputDigest: logicalDigest(decisionsRequired) }, { sequence: 3, operation: "PROTECT_SPECIALIZED_BOUNDARIES", mode: "FORBIDDEN", decision: "NO_SAMPLE_SIZE_NO_POWER_NO_PREVALENCE_NO_CENTER_COUNT_NO_SPECIALIZED_SIMULATION", inputDigest: resultDigest, outputDigest: logicalDigest({ sizingRequirements, feasibilityAssessment }) }],
    refusal,
  };
  return parseResearchProjectDesignResult(result);
};
