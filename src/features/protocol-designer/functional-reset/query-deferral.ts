import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import type { FunctionalResetQueryDeferralReason } from "@/features/query-navigation";

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

export const classifyFunctionalResetQueryDeferral = (input: {
  contribution: Readonly<ScientificInterpretationContributionEnvelope>;
  sourceTurnId: string;
  rawResponse: string;
}): FunctionalResetQueryDeferralReason | null => {
  const currentTurnUnknown = [
    ...input.contribution.scientificContent.unknowns,
    ...input.contribution.scientificContent.missingInformation,
    ...input.contribution.scientificContent.clarificationNeeds,
    ...input.contribution.scientificContent.openDecisions,
  ].some((item) => item.epistemicBoundary.activeState !== false
    && item.epistemicBoundary.sourceTurnIds.includes(input.sourceTurnId));
  if (explicitlyRequestsProgression(input.rawResponse)) return "USER_REQUESTED_TO_MOVE_ON";
  return currentTurnUnknown ? "USER_DOES_NOT_KNOW" : null;
};
