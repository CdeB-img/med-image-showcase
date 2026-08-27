import { logicalDigest, uniqueSorted } from "./canonical";
import type { CoverageMap, CoverageMapItem, GovernedDocumentaryStatement, ProviderExecution, QueryPlan, RuntimeAssertion, RuntimeConflict } from "./types";

const modalityMatches = (assertion: RuntimeAssertion, modality?: string) => {
  if (!modality || !assertion.modality) return true;
  const actual = assertion.modality.toLocaleUpperCase("fr-FR");
  return actual === modality || (modality === "MRI" && (actual === "MR" || actual.includes("IRM")));
};

const commonBranchConceptIds = (queryPlan: QueryPlan) => queryPlan.branches.reduce<string[]>((common, branch, index) => index === 0
  ? [...branch.conceptIds]
  : common.filter((conceptId) => branch.conceptIds.includes(conceptId)), []);

const itemSupportsConcept = (queryPlan: QueryPlan, providerId: string, conceptIds: string[], conceptId: string) => {
  if (conceptIds.includes(conceptId)) return true;
  const concept = queryPlan.resolvedConcepts.find((item) => item.conceptId === conceptId);
  return (concept?.providerConcepts[providerId] ?? []).some((providerConceptId) => conceptIds.includes(providerConceptId));
};

export const buildCoverageMap = (input: {
  queryPlan: QueryPlan;
  providerExecutions: ProviderExecution[];
  applicableAssertions: RuntimeAssertion[];
  excludedAssertions: RuntimeAssertion[];
  documentaryStatements: GovernedDocumentaryStatement[];
  conflicts: RuntimeConflict[];
}): CoverageMap => {
  const selectionByProvider = new Map(input.queryPlan.providerSelections.map((selection) => [selection.providerId, selection]));
  const commonConceptIds = commonBranchConceptIds(input.queryPlan);
  const items: CoverageMapItem[] = input.queryPlan.branches.map((branch) => {
    const considered = input.providerExecutions.filter((execution) => {
      const selection = selectionByProvider.get(execution.providerId);
      return Boolean(selection?.matchedConceptIds.some((conceptId) => branch.conceptIds.includes(conceptId)));
    });
    const relevantIds = new Set(considered.filter((item) => item.included).map((item) => item.providerId));
    const branchSpecificIds = input.queryPlan.branches.length > 1 && !branch.modality
      ? branch.conceptIds.filter((conceptId) => !commonConceptIds.includes(conceptId))
      : [];
    const supportsBranch = (providerId: string, conceptIds: string[]) => branchSpecificIds.length === 0
      || branchSpecificIds.some((conceptId) => itemSupportsConcept(input.queryPlan, providerId, conceptIds, conceptId));
    const assertions = input.applicableAssertions.filter((item) => relevantIds.has(item.providerId) && modalityMatches(item, branch.modality) && supportsBranch(item.providerId, item.conceptIds));
    const statements = input.documentaryStatements.filter((item) => relevantIds.has(item.providerId) && supportsBranch(item.providerId, item.conceptIds));
    const excluded = input.excludedAssertions.filter((item) => relevantIds.has(item.providerId) && modalityMatches(item, branch.modality) && supportsBranch(item.providerId, item.conceptIds));
    const supportingProviderIds = uniqueSorted([...assertions.map((item) => item.providerId), ...statements.map((item) => item.providerId)]);
    const resultCount = assertions.length + statements.length;
    const conflicting = input.conflicts.some((conflict) => conflict.positionIds.some((id) => assertions.some((assertion) => assertion.revision === id)));
    const status = input.queryPlan.domainGate !== "IN_SCOPE"
      ? "OUT_OF_DOMAIN" as const
      : conflicting
        ? "CONFLICTING_COVERAGE" as const
        : resultCount
          ? excluded.length ? "PARTIAL_COVERAGE" as const : "SUPPORTED_COVERAGE" as const
          : excluded.length
            ? "INCOMPATIBLE_CONTEXT" as const
            : !relevantIds.size
              ? "NO_PROVIDER" as const
              : "NO_MATCH" as const;
    const explanation = status === "SUPPORTED_COVERAGE"
      ? `${resultCount} élément(s) applicable(s) issu(s) de ${supportingProviderIds.length} corpus interne(s).`
      : status === "PARTIAL_COVERAGE"
        ? `${resultCount} élément(s) documentaire(s) ou structuré(s) restent utilisables, mais d’autres éléments sont hors du contexte exact.`
      : status === "CONFLICTING_COVERAGE"
        ? "Des positions incompatibles restent séparées dans cette branche."
        : status === "INCOMPATIBLE_CONTEXT"
          ? "Des éléments existent, mais leur contexte d’applicabilité est incompatible ou insuffisamment documenté."
          : status === "NO_PROVIDER"
            ? "Aucun provider courant ne déclare la couverture exacte de cette branche."
            : status === "OUT_OF_DOMAIN"
              ? "Cette branche est arrêtée par la frontière de domaine ou de sécurité."
              : "Les providers pertinents ont été inspectés sans résultat applicable.";
    return {
      coverageId: `coverage:${logicalDigest({ branchId: branch.branchId, status, supportingProviderIds })}`,
      branchId: branch.branchId,
      label: branch.label,
      requestedConceptIds: branch.conceptIds,
      status,
      consideredProviderIds: uniqueSorted(considered.map((item) => item.providerId)),
      supportingProviderIds,
      resultCount,
      explanation,
      externalResearchRequired: ["PARTIAL_COVERAGE", "NO_PROVIDER", "NO_MATCH", "INCOMPATIBLE_CONTEXT"].includes(status),
    };
  });
  if (input.queryPlan.branches.length > 1) {
    const branchSupported = items.filter((item) => item.status === "SUPPORTED_COVERAGE").length;
    const directComparison = input.applicableAssertions.some((item) => {
      const material = JSON.stringify(item.atomicContent).toLocaleLowerCase("fr-FR");
      return material.includes("versus") || material.includes("agreement_with") || material.includes("compare");
    });
    const status = branchSupported === items.length && directComparison ? "SUPPORTED_COVERAGE" : branchSupported ? "PARTIAL_COVERAGE" : "INSUFFICIENT_EVIDENCE";
    items.push({
      coverageId: `coverage:${logicalDigest({ branchId: "comparison:direct", status })}`,
      branchId: "comparison:direct",
      label: "Comparaison directe",
      requestedConceptIds: uniqueSorted(input.queryPlan.branches.flatMap((branch) => branch.conceptIds)),
      status,
      consideredProviderIds: uniqueSorted(input.providerExecutions.filter((item) => item.included).map((item) => item.providerId)),
      supportingProviderIds: directComparison ? uniqueSorted(input.applicableAssertions.map((item) => item.providerId)) : [],
      resultCount: directComparison ? 1 : 0,
      explanation: directComparison ? "Une comparaison directe gouvernée est disponible." : "Les branches restent visibles, mais aucune assertion comparative directe ne permet de les fusionner.",
      externalResearchRequired: !directComparison,
    });
  }
  const material = { items, externalResearchRequired: items.some((item) => item.externalResearchRequired) };
  return { ...material, digest: logicalDigest(material) };
};
