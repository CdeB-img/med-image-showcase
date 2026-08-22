import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import type { FunctionalResetQueryDeferralReason } from "@/features/query-navigation";
import type { ResearchProjectSectionId } from "@/features/research-project-construction";

export type FunctionalResetQueryDeferralScope = {
  reason: FunctionalResetQueryDeferralReason;
  targets: Array<{ sectionId: ResearchProjectSectionId; facetIds: string[] }>;
};

const normalized = (value: string) => value
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toLocaleLowerCase("fr-FR");

const explicitlyRequestsProgression = (value: string) => {
  const text = normalized(value);
  return /\b(?:avancons|continuons)\b/.test(text)
    || /\b(?:on|nous)\s+(?:(?:peut|pouvons|pourrait|pourrions)\s+)?(?:avancer|continuer)\b/.test(text)
    || /\b(?:passons|(?:on|nous)\s+(?:(?:peut|pouvons|pourrait|pourrions)\s+)?passer)\s+(?:a autre chose|au point suivant|a la suite)\b/.test(text)
    || /\b(?:autre chose|point suivant|plus utile ensuite)\b/.test(text);
};

const currentTurnUnresolvedItems = (input: {
  contribution: Readonly<ScientificInterpretationContributionEnvelope>;
  sourceTurnId: string;
}) => [
  ...input.contribution.scientificContent.unknowns,
  ...input.contribution.scientificContent.missingInformation,
  ...input.contribution.scientificContent.clarificationNeeds,
  ...input.contribution.scientificContent.openDecisions,
].filter((item) => item.epistemicBoundary.activeState !== false
  && item.epistemicBoundary.sourceTurnIds.includes(input.sourceTurnId));

const queryFacetsForUnknown = (value: string) => {
  const text = normalized(value);
  const facets: Array<{ sectionId: ResearchProjectSectionId; facetId: string }> = [];
  if (/\b(?:inclusions?|inclure|included)\b/.test(text)) facets.push({ sectionId: "POPULATION", facetId: "INCLUSION" });
  if (/\b(?:exclusions?|exclure|excluded|contre.?indications?)\b/.test(text)) facets.push({ sectionId: "POPULATION", facetId: "EXCLUSION" });
  if (/\b(?:age|eligibilite|eligibility)\b/.test(text)) facets.push({ sectionId: "POPULATION", facetId: "ELIGIBILITY" });
  if (/\b(?:population|patient|participant)\b/.test(text) && !facets.length) facets.push({ sectionId: "POPULATION", facetId: "POPULATION_DEFINITION" });
  if (/\b(?:moment|fenetre|temporal|timepoint|timing|visite)\b/.test(text)) facets.push({ sectionId: "TEMPORALITY", facetId: "MEASUREMENT_TIMING" });
  if (/\b(?:mesure|biomarqueur|critere de jugement|dependent measure|variable dependante)\b/.test(text)) facets.push({ sectionId: "MEASUREMENTS", facetId: "MEASUREMENT_SET" });
  if (/\b(?:design|plan d.etude|randomisation|allocation)\b/.test(text)) facets.push({ sectionId: "DESIGN", facetId: "DESIGN_FRAME" });
  return facets;
};

export const classifyFunctionalResetQueryDeferralScope = (input: {
  contribution: Readonly<ScientificInterpretationContributionEnvelope>;
  sourceTurnId: string;
  rawResponse: string;
}): FunctionalResetQueryDeferralScope | null => {
  const unresolved = currentTurnUnresolvedItems(input);
  if (!unresolved.length) return null;
  const facets = unresolved.flatMap((item) => queryFacetsForUnknown([
    item.content,
    item.proposedType,
    item.studyRole,
    item.epistemicBoundary.sourceText,
  ].filter(Boolean).join(" ")));
  if (!facets.length) return null;
  const grouped = new Map<ResearchProjectSectionId, Set<string>>();
  for (const facet of facets) {
    const values = grouped.get(facet.sectionId) ?? new Set<string>();
    values.add(facet.facetId);
    grouped.set(facet.sectionId, values);
  }
  return {
    reason: explicitlyRequestsProgression(input.rawResponse) ? "USER_REQUESTED_TO_MOVE_ON" : "USER_DOES_NOT_KNOW",
    targets: [...grouped].map(([sectionId, facetIds]) => ({ sectionId, facetIds: [...facetIds].sort() })),
  };
};

export const classifyFunctionalResetQueryDeferral = (input: {
  contribution: Readonly<ScientificInterpretationContributionEnvelope>;
  sourceTurnId: string;
  rawResponse: string;
}): FunctionalResetQueryDeferralReason | null => {
  const currentTurnUnknown = currentTurnUnresolvedItems(input).length > 0;
  if (explicitlyRequestsProgression(input.rawResponse)) return "USER_REQUESTED_TO_MOVE_ON";
  return currentTurnUnknown ? "USER_DOES_NOT_KNOW" : null;
};
