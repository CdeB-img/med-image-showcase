import { logicalDigest, uniqueSorted } from "./canonical";
import { isPatientLevelExpression } from "./privacy";
import { KNOWLEDGE_PROVIDER_REGISTRY } from "./provider-registry";
import type { ConceptResolution, KnowledgeRequest, ProviderSelection, QueryBranch, QueryPlan } from "./types";

const nonRoutingConcept = (conceptId: string) => !conceptId.startsWith("modality:") && !conceptId.startsWith("context:") && !conceptId.startsWith("unknown:");

const determineDomainGate = (request: KnowledgeRequest, resolution: ConceptResolution): QueryPlan["domainGate"] => {
  if (isPatientLevelExpression(request.originalQuestion)) return "PATIENT_LEVEL_BLOCKED";
  if (resolution.concepts.some((item) => item.kind === "AMBIGUOUS" && (item.candidateSenses?.length ?? 0) > 1)) return "CLARIFICATION_REQUIRED";
  if (request.requestedClaimType === "BEST_OPTION") return "CLARIFICATION_REQUIRED";
  const ids = resolution.concepts.map((item) => item.conceptId);
  if (ids.includes("tool:numpy") || (ids.includes("format:dicom") && /\b(code|python|numpy|pipeline|script|program)/i.test(request.originalQuestion))) return "OUT_OF_DOMAIN";
  return "IN_SCOPE";
};

const buildBranches = (request: KnowledgeRequest, resolution: ConceptResolution): QueryBranch[] => {
  const ambiguous = resolution.concepts.filter((item) => item.kind === "AMBIGUOUS" && (item.candidateSenses?.length ?? 0) > 1);
  const modalities = resolution.concepts.filter((item) => item.conceptId.startsWith("modality:"));
  const compare = request.requestType === "COMPARE" && modalities.length > 1;
  const hardFilters = request.context.dimensions.filter((item) => item.force === "HARD" && item.state !== "UNKNOWN");
  if (ambiguous.length) return ambiguous.flatMap((concept) => (concept.candidateSenses ?? []).map((sense) => ({
    branchId: `branch:sense:${sense.conceptId}`,
    label: sense.preferredLabel,
    conceptIds: uniqueSorted([...resolution.concepts.filter((item) => item.kind !== "AMBIGUOUS").map((item) => item.conceptId), sense.conceptId]),
    hardFilters,
  })));
  if (compare) return modalities.map((modality) => ({
    branchId: `branch:${modality.conceptId}`,
    label: modality.preferredLabel,
    conceptIds: uniqueSorted([...resolution.concepts.filter((item) => !item.conceptId.startsWith("modality:")).map((item) => item.conceptId), modality.conceptId]),
    modality: modality.conceptId === "modality:mri" ? "MRI" : modality.conceptId === "modality:ct" ? "CT" : modality.conceptId === "modality:pet" ? "PET" : modality.preferredLabel,
    hardFilters,
  }));
  if (request.requestType === "COMPARE") {
    const groups = new Map<string, ConceptResolution["concepts"]>();
    for (const concept of resolution.concepts.filter((item) => !item.conceptId.startsWith("modality:") && !item.conceptId.startsWith("context:") && item.kind !== "AMBIGUOUS")) {
      groups.set(concept.objectType, [...(groups.get(concept.objectType) ?? []), concept]);
    }
    const comparedObjects = [...groups.values()].find((items) => items.length > 1);
    if (comparedObjects) return comparedObjects.map((compared) => ({
      branchId: `branch:object:${compared.conceptId}`,
      label: compared.preferredLabel,
      conceptIds: uniqueSorted([...resolution.concepts.filter((item) => !comparedObjects.some((candidate) => candidate.conceptId === item.conceptId)).map((item) => item.conceptId), compared.conceptId]),
      hardFilters,
    }));
  }
  return [{ branchId: "branch:exact", label: "Contexte exact", conceptIds: resolution.concepts.map((item) => item.conceptId).sort(), hardFilters }];
};

export const createQueryPlan = (request: KnowledgeRequest, resolution: ConceptResolution): QueryPlan => {
  const domainGate = determineDomainGate(request, resolution);
  const resolvedIds = resolution.concepts.map((item) => item.conceptId);
  const substantiveIds = resolvedIds.filter(nonRoutingConcept);
  const selections: ProviderSelection[] = KNOWLEDGE_PROVIDER_REGISTRY.providers.map((provider) => {
    const matchedConceptIds = provider.coverageConcepts.filter((id) => resolvedIds.includes(id));
    const substantiveMatches = matchedConceptIds.filter(nonRoutingConcept);
    const graphTechnicalMatch = provider.id === "knowledge-graph" && matchedConceptIds.some((id) => ["tool:numpy", "format:dicom"].includes(id));
    const selectable = provider.availability === "AVAILABLE";
    const included = domainGate === "IN_SCOPE" && selectable && (substantiveMatches.length > 0 || graphTechnicalMatch);
    const reason = domainGate !== "IN_SCOPE"
      ? `Exclu par Domain Gate : ${domainGate}.`
      : provider.availability === "REPLAY_ONLY"
        ? "Provider historique conservé pour replay ; la version courante consolidée est interrogée à sa place."
        : provider.availability === "AVAILABLE_EMPTY"
          ? "Provider inspecté mais registre scientifique actuellement vide ; il ne peut produire aucune correspondance positive."
          : provider.availability === "NOT_ACTIVATED"
            ? "Provider candidat présent mais non activé par son statut documentaire."
            : provider.availability === "UNAVAILABLE"
              ? "Provider enregistré mais indisponible à l’exécution."
      : included
        ? `Correspondance exacte déclarée : ${matchedConceptIds.join(", ")}.`
        : matchedConceptIds.length
          ? "Modalité seule insuffisante pour substituer un domaine scientifique absent."
          : "Aucun concept exact de la demande dans la couverture déclarée.";
    return { providerId: provider.id, included, reason, matchedConceptIds };
  });
  const executionOrder = selections.filter((item) => item.included).map((item) => item.providerId).sort();
  const branches = buildBranches(request, resolution);
  const material = {
    requestRef: request.requestId,
    contextRef: request.context.contextId,
    registrySnapshotRef: KNOWLEDGE_PROVIDER_REGISTRY.digest,
    resolvedConcepts: resolution.concepts,
    resolvedRelations: resolution.relations,
    unresolvedConcepts: resolution.unresolvedTerms,
    ambiguities: resolution.ambiguities,
    branches,
    providerSelections: selections,
    exclusions: request.exclusions,
    matchingSemantics: "EXACT_FIRST_NO_IMPLICIT_FALLBACK" as const,
    relaxationBranches: request.context.relaxation ? [request.context.relaxation] : [],
    stopConditions: ["REQUIRED_OUTPUT_SATISFIED", "PROVIDERS_EXHAUSTED", "NO_PROGRESS_DIGEST", "HUMAN_CONTEXT_REQUIRED", "POLICY_REFUSAL"],
    executionOrder,
    domainGate,
  };
  const digest = logicalDigest(material);
  return { queryPlanId: `query-plan:${digest}`, revision: 1, digest, ...material };
};
