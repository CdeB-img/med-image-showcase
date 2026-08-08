import { DEMONSTRATOR_SCENARIOS } from "../fixtures";
import type { ScenarioMatch, ValidatedScientificIntent } from "./types.js";

const TERMS = {
  spectral: ["spectral", "dual energy", "double énergie", "photon counting", "k-edge", "iode", "monoénergétique"],
  cardiac: ["cardiaque", "cardiac", "myocarde", "myocard", "t1 mapping", "ecv", "lge", "fibrose", "strain", "no-reflow", "no reflow", "obstruction microvasculaire", "lésion microvasculaire", "reperfusion"],
  neuro: ["cérébr", "cerebr", "neuro", "perfusion", "cbf", "cbv", "tmax", "oef", "cmro2", "cmro₂", "pénombre"],
} as const;

const validatedCorpus = (intent: ValidatedScientificIntent) => {
  const parts = [intent.originalQuestion, intent.validatedReformulation];
  for (const [key, review] of Object.entries(intent.reviews)) {
    if (review?.state === "REMOVED" || review?.state === "UNKNOWN" || review?.state === "NOT_RELEVANT") continue;
    const original = intent.interpretation[key as keyof typeof intent.interpretation];
    const value = review?.state === "CORRECTED" ? review.correctedValue : typeof original === "object" && original && "value" in original ? original.value : null;
    if (Array.isArray(value)) parts.push(...value);
    else if (typeof value === "string") parts.push(value);
  }
  return parts.join(" ").normalize("NFKC").toLocaleLowerCase("fr-FR");
};

export const matchScenarios = (intent: ValidatedScientificIntent): ScenarioMatch[] => {
  const corpus = validatedCorpus(intent);
  const scored = Object.entries(TERMS).map(([scenarioId, terms]) => {
    const matchedTerms = terms.filter((term) => corpus.includes(term));
    const score = matchedTerms.length;
    return { scenarioId: scenarioId as keyof typeof TERMS, matchedTerms, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score);
  const multiple = scored.length > 1 && scored[1].score >= Math.max(1, scored[0].score - 1);
  return scored.map((item, index) => ({
    scenarioId: item.scenarioId,
    status: multiple ? "MULTIPLE_MATCHES" : index === 0 ? "MATCH_PROPOSED" : "MULTIPLE_MATCHES",
    score: item.score,
    confidence: item.score >= 3 ? "HIGH" : item.score === 2 ? "MEDIUM" : "LOW",
    reasons: [`${item.matchedTerms.length} terme(s) validé(s) rapproché(s) du corpus local.`],
    matchedTerms: item.matchedTerms,
    uncoveredElements: [],
  }));
};

export const scenarioDetails = (id: ScenarioMatch["scenarioId"]) => DEMONSTRATOR_SCENARIOS.find((item) => item.id === id);

export const confirmScenario = (matches: ScenarioMatch[], id: ScenarioMatch["scenarioId"]): ScenarioMatch[] =>
  matches.map((match) => match.scenarioId === id ? { ...match, status: "MATCH_CONFIRMED" } : match);
