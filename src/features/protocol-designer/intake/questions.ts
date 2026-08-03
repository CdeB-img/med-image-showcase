import type { AdaptiveQuestion, InterpretedFieldKey, ValidatedScientificIntent } from "./types.js";

export const ADAPTIVE_QUESTION_REGISTRY: AdaptiveQuestion[] = [
  {
    questionId: "Q-PHENOMENON", label: "Quel phénomène souhaitez-vous principalement comprendre ou mesurer ?",
    helpText: "Choisissez le construit prioritaire, sans présumer de la technique.", reason: "Le construit scientifique organise l’orientation.",
    decisionImpact: "Sépare les familles de scénarios et leurs limites.", blockingLevel: "BLOCKING", supportedScenarios: ["all"],
    allowedAnswers: [
      { value: "measurement", label: "Une mesure quantitative", consequence: "La comparabilité et la métrologie devront être explicitées." },
      { value: "mechanism", label: "Un mécanisme physiologique", consequence: "Les hypothèses de modèle devront être distinguées des observations." },
      { value: "unknown", label: "Je ne sais pas encore", consequence: "L’orientation restera provisoire." },
    ], sourceRefs: ["PD-003", "PD-009"], implementationStatus: "FULLY_OPERATIONAL", knownFromFields: ["phenomenaOfInterest"],
  },
  {
    questionId: "Q-PURPOSE", label: "Quel est l’objectif scientifique principal ?",
    helpText: "Comprendre, comparer, quantifier ou reproduire.", reason: "Un même domaine peut soutenir des objectifs incompatibles.",
    decisionImpact: "Conditionne les réserves et les informations manquantes.", blockingLevel: "BLOCKING", supportedScenarios: ["all"],
    allowedAnswers: [
      { value: "understand", label: "Comprendre", consequence: "Le rapport privilégiera les construits et hypothèses." },
      { value: "compare", label: "Comparer", consequence: "Le rapport exposera les conditions de comparabilité." },
      { value: "quantify", label: "Quantifier", consequence: "Le rapport rendra visibles calibration et répétabilité." },
    ], sourceRefs: ["Scientific Product Manifesto", "PD-004"], implementationStatus: "FULLY_OPERATIONAL", knownFromFields: ["scientificPurpose"],
  },
  {
    questionId: "Q-CONTEXT", label: "Dans quel contexte scientifique cette question se pose-t-elle ?",
    helpText: "Étude exploratoire, comparaison, multicentrique ou autre contexte non clinique.", reason: "Le contexte borne la portée d’une orientation.",
    decisionImpact: "Modifie les limitations rendues visibles.", blockingLevel: "IMPORTANT", supportedScenarios: ["all"],
    allowedAnswers: [
      { value: "exploratory", label: "Exploratoire", consequence: "L’incertitude sera conservée explicitement." },
      { value: "multicenter", label: "Multicentrique", consequence: "L’harmonisation deviendra un point critique." },
      { value: "unknown", label: "Non précisé", consequence: "La portée restera limitée." },
    ], sourceRefs: ["PD-003", "PD-004"], implementationStatus: "FULLY_OPERATIONAL", knownFromFields: ["clinicalContext", "centers"],
  },
  {
    questionId: "Q-EQUIPMENT", label: "Quels équipements ou données sont réellement disponibles ?",
    helpText: "Déclarez uniquement ce qui est déjà connu.", reason: "La faisabilité documentaire ne doit pas être inventée.",
    decisionImpact: "Permet de signaler les dépendances sans générer de paramètres.", blockingLevel: "IMPORTANT", supportedScenarios: ["spectral", "cardiac", "neuro"],
    allowedAnswers: [
      { value: "known", label: "Informations disponibles", consequence: "Elles seront reportées comme déclarations utilisateur." },
      { value: "partial", label: "Informations partielles", consequence: "Les inconnues resteront ouvertes." },
      { value: "unknown", label: "Inconnu", consequence: "Aucune faisabilité technique ne sera affirmée." },
    ], sourceRefs: ["PD-003", "Product Specification"], implementationStatus: "PARTIALLY_OPERATIONAL", knownFromFields: ["availableEquipment", "availableData"],
  },
  {
    questionId: "Q-TIMING", label: "Des moments de mesure sont-ils déjà imposés par votre projet ?",
    helpText: "Le système enregistre uniquement les moments que vous déclarez.", reason: "La temporalité peut influencer l’interprétation.",
    decisionImpact: "Aucun timing nouveau n’est généré.", blockingLevel: "OPTIONAL", supportedScenarios: ["all"],
    allowedAnswers: [
      { value: "declared", label: "Oui, ils sont déclarés", consequence: "Ils seront conservés comme contrainte utilisateur." },
      { value: "unknown", label: "Pas encore", consequence: "TIMING_NOT_YET_GENERATABLE_FROM_CURRENT_EXECUTABLE_KNOWLEDGE" },
    ], sourceRefs: ["PD-007", "PD-011"], implementationStatus: "RECORDED_ONLY", knownFromFields: ["declaredTimings"],
  },
];

const isKnown = (intent: ValidatedScientificIntent, key: InterpretedFieldKey) => {
  const review = intent.reviews[key];
  if (!review || !["CONFIRMED", "CORRECTED"].includes(review.state)) return false;
  const value = review.state === "CORRECTED" ? review.correctedValue : intent.interpretation[key].value;
  return value !== null && (!Array.isArray(value) || value.length > 0);
};

export const selectAdaptiveQuestions = (intent: ValidatedScientificIntent, scenarioIds: string[]) =>
  ADAPTIVE_QUESTION_REGISTRY.filter((question) =>
    (question.supportedScenarios.includes("all") || scenarioIds.some((id) => question.supportedScenarios.includes(id as "spectral")))
    && !(question.knownFromFields?.some((key) => isKnown(intent, key)) ?? false),
  );
