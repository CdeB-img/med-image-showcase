import type { RoutingIntent } from "@/features/protocol-designer/intake/types";
import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";

const ROUTE_MAP: Readonly<Record<string, RoutingIntent>> = {
  UNDERSTAND: "UNDERSTAND",
  FORMALIZE_IDEA: "FORMALIZE_IDEA",
  DESIGN_STUDY: "DESIGN_STUDY",
  DOCUMENT: "DOCUMENT",
  REVIEW_REROUTE: "FORMALIZE_IDEA",
};
const FEEDBACK: Record<RoutingIntent, string> = {
  UNDERSTAND: "D’accord. Nous allons approfondir la question scientifique avant de construire l’étude.",
  FORMALIZE_IDEA: "D’accord. Nous allons d’abord structurer la question et les hypothèses de travail.",
  DESIGN_STUDY: "D’accord. Nous allons construire l’étude à partir de cette question.",
  DOCUMENT: "D’accord. Nous allons vérifier si le projet est suffisamment défini pour préparer le document demandé.",
};

export type RouteIntentResolution = {
  status: "RESOLVED" | "CLARIFICATION_REQUIRED";
  routeIntent: RoutingIntent | null;
  routeConfidence: number | null;
  routeReason: string | null;
  feedbackText: string;
  contributionRef: string;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
};

export const resolveRouteIntentContribution = (contribution: Readonly<ScientificInterpretationContributionEnvelope>): RouteIntentResolution => {
  const proposal = contribution.scientificContent.routeProposal;
  const routeIntent = proposal ? ROUTE_MAP[proposal.route] ?? null : null;
  if (!routeIntent) return {
    status: "CLARIFICATION_REQUIRED",
    routeIntent: null,
    routeConfidence: proposal?.confidence ?? null,
    routeReason: proposal?.reason ?? null,
    feedbackText: "Je conserve votre réponse, mais je ne peux pas encore distinguer de façon fiable si vous voulez approfondir la question, structurer l’étude ou préparer un document. Précisez simplement le résultat que vous souhaitez obtenir maintenant.",
    contributionRef: contribution.identity.contributionId,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };
  return {
    status: "RESOLVED",
    routeIntent,
    routeConfidence: proposal?.confidence ?? null,
    routeReason: proposal?.reason ?? null,
    feedbackText: FEEDBACK[routeIntent],
    contributionRef: contribution.identity.contributionId,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };
};
