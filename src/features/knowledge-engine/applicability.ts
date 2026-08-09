import type { ApplicabilityState, GovernedDocumentaryStatement, KnowledgeRequest, RuntimeAssertion } from "./types";

type ApplicabilityDecision = { state: ApplicabilityState; reasons: string[] };

const contextDimensions = (assertion: RuntimeAssertion) => Array.isArray((assertion.context as { dimensions?: unknown[] }).dimensions)
  ? (assertion.context as { dimensions: Array<{ dimension?: string; operator?: string; value?: unknown }> }).dimensions
  : [];

const valuesFor = (request: KnowledgeRequest, name: string) => request.context.dimensions.find((item) => item.name === name)?.values ?? [];

export const evaluateAssertionApplicability = (request: KnowledgeRequest, assertion: RuntimeAssertion): ApplicabilityDecision => {
  if (request.context.status === "CONTRADICTORY") return { state: "CONTRADICTORY_CONTEXT", reasons: ["Le contexte critique contient des valeurs contradictoires."] };
  const dimensions = contextDimensions(assertion);
  const assertionModalities = assertion.modality ? [assertion.modality] : [];
  const requestedModalities = valuesFor(request, "modality");
  if (requestedModalities.length && assertionModalities.length) {
    const compatible = requestedModalities.some((requested) => assertionModalities.some((actual) => actual === requested || (requested === "MRI" && actual === "MR") || (requested === "MRI" && actual.toLocaleLowerCase().includes("irm"))));
    if (!compatible) return { state: "OUT_OF_VALIDITY_DOMAIN", reasons: [`Modalité de l’assertion (${assertionModalities.join(", ")}) incompatible avec la branche demandée (${requestedModalities.join(", ")}).`] };
  }
  const explicitIntervention = valuesFor(request, "intervention");
  if (explicitIntervention.length && !dimensions.some((item) => item.dimension === "intervention")) return { state: "UNKNOWN_APPLICABILITY", reasons: [`Le contexte d’intervention ${explicitIntervention.join(", ")} n’est pas documenté par cette assertion.`] };
  const requestedPathology = valuesFor(request, "pathology");
  const pathologyDimension = dimensions.find((item) => item.dimension === "pathology");
  if (requestedPathology.length && !pathologyDimension) return { state: "UNKNOWN_APPLICABILITY", reasons: [`La pathologie demandée (${requestedPathology.join(", ")}) n’est pas documentée par cette assertion.`] };
  if (requestedPathology.length && pathologyDimension?.operator === "ANY_OF" && Array.isArray(pathologyDimension.value) && !requestedPathology.some((item) => (pathologyDimension.value as unknown[]).includes(item))) return { state: "OUT_OF_VALIDITY_DOMAIN", reasons: ["La pathologie demandée est hors du domaine déclaré de l’assertion."] };
  const limitations = assertion.limitations.length > 0 || dimensions.some((item) => item.operator === "UNKNOWN" || item.operator === "CONDITION");
  return limitations
    ? { state: "APPLICABLE_WITH_LIMITATIONS", reasons: ["Correspondance scientifique utilisable avec dimensions ou limites explicites."] }
    : { state: "APPLICABLE_EXACT", reasons: ["Toutes les dimensions critiques documentées sont compatibles."] };
};

export const applyApplicability = (request: KnowledgeRequest, assertions: RuntimeAssertion[], statements: GovernedDocumentaryStatement[]) => ({
  assertions: assertions.map((assertion) => {
    const decision = evaluateAssertionApplicability(request, assertion);
    return { ...assertion, applicability: decision.state, applicabilityReasons: decision.reasons };
  }),
  documentaryStatements: statements.map((statement) => ({
    ...statement,
    applicability: request.context.status === "CONTRADICTORY" ? "CONTRADICTORY_CONTEXT" as const : statement.applicability,
    applicabilityReasons: request.context.status === "CONTRADICTORY" ? ["Le contexte critique doit être séparé en branches."] : statement.applicabilityReasons,
  })),
});

export const isApplicable = (state: ApplicabilityState) => ["APPLICABLE_EXACT", "APPLICABLE_WITH_LIMITATIONS", "PARTIALLY_APPLICABLE"].includes(state);
