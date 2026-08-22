import type {
  ScientificInterpretationCognitiveBoundary,
  ScientificInterpretationContributionEnvelope,
} from "./contracts.js";

export type ScientificInterpretationProductDisposition =
  | "SCIENTIFIC_CONTRIBUTION"
  | "CONVERSATIONAL_ONLY"
  | "SCOPE_REJECTED"
  | "BORDERLINE_CLARIFICATION"
  | "TERMINOLOGY_CLARIFICATION";

export type ScientificInterpretationProductRoute = {
  disposition: ScientificInterpretationProductDisposition;
  contributionAllowed: boolean;
  responseMessage: string | null;
  cognitiveBoundary: ScientificInterpretationCognitiveBoundary;
};

const scientificIntents = new Set([
  "SCIENTIFIC_INPUT",
  "PARTIAL_SCIENTIFIC_INPUT",
  "CORRECTION",
  "TOPIC_SHIFT",
  "MIXED",
]);

const fallbackBoundary = (contribution: ScientificInterpretationContributionEnvelope): ScientificInterpretationCognitiveBoundary => ({
  lifecycle: "EPHEMERAL_TRACEABLE_NON_AUTHORITATIVE",
  authoritative: false,
  domainDecision: {
    decision: "IN_SCOPE",
    confidence: null,
    rationale: "Legacy Scientific Interpretation contribution without FR04A cognitive trace.",
    inScopeSegments: [contribution.source.turns.at(-1)?.content ?? contribution.source.originalRequest],
    outOfScopeSegments: [],
    responseMessage: null,
    projectMutationAllowed: true,
  },
  dialogueRouting: {
    intent: "SCIENTIFIC_INPUT",
    confidence: null,
    rationale: "Legacy Scientific Interpretation contribution routed as scientific input.",
    answersCurrentQuery: false,
    preservesCurrentQueryAction: true,
    questionContextMismatch: false,
    responseMessage: null,
  },
  semanticUnderstanding: {
    summary: contribution.scientificContent.normalizedUnderstanding ?? "",
    elements: contribution.scientificContent.candidateObjects,
    relations: contribution.scientificContent.candidateRelations,
  },
});

const safeResponse = (boundary: ScientificInterpretationCognitiveBoundary) => {
  const scope = boundary.domainDecision.decision;
  if (scope === "OUT_OF_SCOPE_CLINICAL") {
    return "Cette demande concerne une situation clinique individuelle. NOXIA ne peut ni interpréter un examen personnel, ni poser un diagnostic, ni recommander un traitement.";
  }
  if (scope === "OUT_OF_SCOPE") return "Cette demande ne relève pas du domaine couvert par NOXIA.";
  if (scope === "BORDERLINE") {
    return boundary.domainDecision.responseMessage
      ?? "Cette question peut relever de NOXIA si elle concerne un projet de recherche ou une question méthodologique. Souhaitez-vous l’aborder sous cet angle ?";
  }
  return boundary.dialogueRouting.responseMessage ?? boundary.domainDecision.responseMessage;
};

export const resolveScientificInterpretationProductRoute = (
  contribution: ScientificInterpretationContributionEnvelope,
): ScientificInterpretationProductRoute => {
  const cognitiveBoundary = contribution.cognitiveBoundary ?? fallbackBoundary(contribution);
  const scope = cognitiveBoundary.domainDecision.decision;
  const intent = cognitiveBoundary.dialogueRouting.intent;
  const unresolvedTerminology = cognitiveBoundary.terminologyGrounding?.resolutions.find((resolution) =>
    ["AMBIGUOUS", "UNRESOLVED"].includes(resolution.status));
  const hasProjectCandidates = cognitiveBoundary.semanticUnderstanding.elements.some((item) =>
    item.projectDisposition === "PROJECT_CANDIDATE" && item.epistemicBoundary.activeState !== false)
    || contribution.scientificContent.candidateObjects.length > 0
    || contribution.scientificContent.temporalElements.length > 0;
  const contributionAllowed = (scope === "IN_SCOPE" || scope === "MIXED")
    && scientificIntents.has(intent)
    && hasProjectCandidates
    && !unresolvedTerminology;

  if (unresolvedTerminology) return {
    disposition: "TERMINOLOGY_CLARIFICATION",
    contributionAllowed: false,
    responseMessage: cognitiveBoundary.dialogueRouting.responseMessage
      ?? cognitiveBoundary.domainDecision.responseMessage
      ?? `Que signifie « ${unresolvedTerminology.surfaceForm} » ici ?`,
    cognitiveBoundary,
  };

  if (contributionAllowed) return {
    disposition: "SCIENTIFIC_CONTRIBUTION",
    contributionAllowed: true,
    responseMessage: scope === "MIXED" ? safeResponse(cognitiveBoundary) : cognitiveBoundary.dialogueRouting.responseMessage,
    cognitiveBoundary,
  };
  if (scope === "OUT_OF_SCOPE" || scope === "OUT_OF_SCOPE_CLINICAL") return {
    disposition: "SCOPE_REJECTED",
    contributionAllowed: false,
    responseMessage: safeResponse(cognitiveBoundary),
    cognitiveBoundary,
  };
  if (scope === "BORDERLINE" || intent === "BORDERLINE") return {
    disposition: "BORDERLINE_CLARIFICATION",
    contributionAllowed: false,
    responseMessage: safeResponse(cognitiveBoundary),
    cognitiveBoundary,
  };
  return {
    disposition: "CONVERSATIONAL_ONLY",
    contributionAllowed: false,
    responseMessage: safeResponse(cognitiveBoundary),
    cognitiveBoundary,
  };
};
