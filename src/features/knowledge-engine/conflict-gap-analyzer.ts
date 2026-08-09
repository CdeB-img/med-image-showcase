import { logicalDigest, uniqueSorted } from "./canonical";
import type { CoverageStatus, KnowledgeGap, KnowledgeRequest, ProviderExecution, QueryPlan, RuntimeAssertion, RuntimeConflict } from "./types";

const assertionPropositionKey = (assertion: RuntimeAssertion) => logicalDigest({ concepts: assertion.conceptIds, atomicContent: assertion.atomicContent });

export const analyzeConflicts = (assertions: RuntimeAssertion[]): RuntimeConflict[] => {
  const groups = new Map<string, RuntimeAssertion[]>();
  for (const assertion of assertions) {
    const key = assertionPropositionKey(assertion);
    groups.set(key, [...(groups.get(key) ?? []), assertion]);
  }
  return [...groups.entries()].flatMap(([key, group]) => {
    const polarities = new Set(group.map((item) => item.polarity));
    if (!(polarities.has("POSITIVE") && polarities.has("NEGATIVE"))) return [];
    return [{ conflictId: `runtime-conflict:${key}`, state: "CONTRADICTION" as const, positionIds: uniqueSorted(group.map((item) => item.revision)), explanation: "Deux positions applicables de polarité incompatible sont conservées séparément." }];
  });
};

export const determineCoverage = (
  queryPlan: QueryPlan,
  providerExecutions: ProviderExecution[],
  applicableAssertions: RuntimeAssertion[],
  documentaryCount: number,
  excludedCount: number,
  conflicts: RuntimeConflict[],
): CoverageStatus => {
  if (queryPlan.domainGate !== "IN_SCOPE") return "PROVIDER_NOT_APPLICABLE";
  if (conflicts.some((item) => item.state === "CONTRADICTION" || item.state === "CONTROVERSY")) return "CONFLICTING";
  if (providerExecutions.some((item) => item.included && ["FAILED", "UNAVAILABLE"].includes(item.executionStatus))) return "SOURCE_UNAVAILABLE";
  if (!queryPlan.providerSelections.some((item) => item.included)) return "NO_PROVIDER";
  if (!applicableAssertions.length && !documentaryCount && excludedCount) return "PROVIDER_NOT_APPLICABLE";
  if (!applicableAssertions.length && !documentaryCount) return "NO_MATCH";
  if (queryPlan.branches.length > 1) {
    const coveredModalities = new Set(applicableAssertions.map((item) => item.modality === "MR" || item.modality?.toLocaleLowerCase().includes("irm") ? "MRI" : item.modality).filter(Boolean));
    if (queryPlan.branches.some((branch) => branch.modality && !coveredModalities.has(branch.modality))) return "PARTIAL";
  }
  return "SUPPORTED";
};

export const analyzeGaps = (
  request: KnowledgeRequest,
  queryPlan: QueryPlan,
  coverageStatus: CoverageStatus,
  conflicts: RuntimeConflict[],
  applicableAssertions: RuntimeAssertion[],
): KnowledgeGap[] => {
  const gaps: KnowledgeGap[] = [];
  const push = (code: KnowledgeGap["code"], scope: string, explanation: string, affectedConceptIds: string[], resumeCondition: string) => gaps.push({ gapId: `knowledge-gap:${logicalDigest({ code, scope, affectedConceptIds })}`, code, scope, explanation, affectedConceptIds, resumeCondition });
  const conceptIds = queryPlan.resolvedConcepts.map((item) => item.conceptId);
  if (queryPlan.domainGate === "PATIENT_LEVEL_BLOCKED") push("PRIVACY_BLOCKED", "PATIENT_LEVEL", "Une valeur individuelle ne peut pas être interprétée par le Knowledge Engine.", conceptIds, "Reformuler une question générale sans donnée individuelle.");
  if (queryPlan.domainGate === "OUT_OF_DOMAIN") push("OUT_OF_DOMAIN", "SOFTWARE_TECHNICAL_SUPPORT", "La demande relève d’un support logiciel général, hors du domaine scientifique médical du Knowledge Engine.", conceptIds, "Orienter vers une ressource technique gouvernée distincte.");
  if (queryPlan.domainGate === "CLARIFICATION_REQUIRED") push("MISSING_CRITICAL_CONTEXT", "BIOMARKER_SELECTION", "Un biomarqueur ne peut pas être classé sans pathologie, phénomène, population, objectif et usage.", conceptIds, "Fournir les dimensions critiques puis créer une nouvelle révision de requête.");
  if (coverageStatus === "NO_PROVIDER") push("NO_REGISTERED_PROVIDER", "EXACT_REQUEST", "Aucun provider enregistré ne déclare cette couverture exacte.", conceptIds, "Admettre un corpus/provider exact ou réduire explicitement la portée.");
  if (coverageStatus === "PROVIDER_NOT_APPLICABLE") push("NO_APPLICABLE_PROVIDER", "EXACT_CONTEXT", "Les contenus retrouvés ne sont pas applicables au contexte dur demandé.", conceptIds, "Documenter le contexte manquant ou interroger un provider exact.");
  if (coverageStatus === "NO_MATCH") push("NO_ASSERTION_MATCH", "EXACT_REQUEST", "Les providers applicables ont été interrogés sans assertion correspondante.", conceptIds, "Ajouter une connaissance gouvernée ou autoriser une découverte externe séparée.");
  if (coverageStatus === "SOURCE_UNAVAILABLE") push("PROVIDER_FAILURE", "RUNTIME", "Au moins un provider sélectionné n’a pas pu être exécuté ; aucune absence scientifique n’est conclue.", conceptIds, "Rétablir le provider et rejouer le même plan.");
  if (request.context.unknowns.length && request.knowledgePurpose !== "UNDERSTAND") push("MISSING_CRITICAL_CONTEXT", "CONTEXT", `Dimensions critiques absentes : ${request.context.unknowns.join(", ")}.`, conceptIds, "Obtenir une clarification humaine.");
  if (request.context.dimensions.some((item) => item.name === "intervention" && item.values.length) && !applicableAssertions.length && !gaps.some((item) => item.code === "MISSING_CRITICAL_CONTEXT")) push("MISSING_CRITICAL_CONTEXT", "INTERVENTION", "L’applicabilité au contexte d’intervention explicite n’est pas documentée.", conceptIds, "Fournir une connaissance couvrant exactement l’intervention et le timing.");
  if (queryPlan.branches.length > 1 && coverageStatus !== "NO_PROVIDER") {
    const directComparison = applicableAssertions.some((item) => JSON.stringify(item.atomicContent).toLocaleLowerCase().includes("versus") || JSON.stringify(item.atomicContent).toLocaleLowerCase().includes("agreement_with"));
    if (!directComparison) push("NO_ASSERTION_MATCH", "DIRECT_COMPARISON", "Aucune comparaison générale directe des branches demandées n’est documentée ; les résultats restent séparés par modalité.", conceptIds, "Ajouter une assertion comparative gouvernée dans ce contexte exact.");
  }
  for (const conflict of conflicts) push("CONFLICT_UNRESOLVED", conflict.conflictId, conflict.explanation, conceptIds, "Décision ou nouvelle preuve gouvernée requise.");
  return gaps.sort((left, right) => left.gapId.localeCompare(right.gapId));
};
