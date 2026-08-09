import type { KnowledgeResult } from "./types";

export type UnderstandProjectionItem = {
  id: string;
  text: string;
  status: string;
  supportIds: string[];
  locator?: string;
};

export type UnderstandProjection = {
  title: string;
  coverageLabel: string;
  answer: string;
  concepts: string[];
  relations: Array<{ label: string; support: string }>;
  supportedItems: UnderstandProjectionItem[];
  limitations: string[];
  gaps: string[];
  sources: Array<{ id: string; label: string; locator?: string }>;
  traceLabel: string;
};

const answerFor = (result: KnowledgeResult) => {
  if (result.gaps.some((item) => item.code === "PRIVACY_BLOCKED")) return "NOXIA n’interprète pas une valeur individuelle. Une explication méthodologique générale exige d’abord une reformulation qui retire le contexte personnel.";
  if (result.gaps.some((item) => item.code === "OUT_OF_DOMAIN")) return "Cette demande relève d’un support technique général et ne doit pas recevoir une réponse depuis les corpus de connaissance médicale.";
  if (result.gaps.some((item) => item.scope === "BIOMARKER_SELECTION")) return "Aucun biomarqueur ne peut être déclaré « meilleur » sans contexte scientifique décisif. NOXIA demande une clarification au lieu de sélectionner.";
  if (result.coverageStatus === "NO_PROVIDER") return "Aucun fournisseur gouverné de cette V1 ne couvre exactement la question. Les objets demandés sont conservés et aucun corpus proche n’est substitué.";
  if (result.coverageStatus === "NO_MATCH") return "Les fournisseurs exacts ont été interrogés sans correspondance exploitable. Cet arrêt qualifie le périmètre consulté, pas l’ensemble de la littérature.";
  if (result.coverageStatus === "PROVIDER_NOT_APPLICABLE") return "Des contenus proches ont été retrouvés mais leur applicabilité au contexte demandé n’est pas démontrée ; ils ne sont pas promus dans la réponse.";
  if (result.coverageStatus === "PARTIAL") return "La couverture est partielle. Chaque branche demandée reste visible et aucune conclusion générale ne remplace la branche absente.";
  if (result.coverageStatus === "CONFLICTING") return "Des positions incompatibles persistent. Elles sont présentées séparément et nécessitent une revue humaine.";
  if (result.coverageStatus === "SOURCE_UNAVAILABLE") return "Un fournisseur attendu est indisponible. NOXIA ne transforme pas cette panne en absence de connaissance.";
  return "NOXIA a construit une réponse structurée depuis les seuls contenus applicables et localisés du registre courant.";
};

export const projectUnderstandResult = (result: KnowledgeResult): UnderstandProjection => ({
  title: `Comprendre : ${result.resolvedConcepts.map((item) => item.preferredLabel).join(" · ")}`,
  coverageLabel: result.coverageStatus,
  answer: answerFor(result),
  concepts: result.resolvedConcepts.map((item) => `${item.preferredLabel} — ${item.objectType} — ${item.kind}`),
  relations: result.queryPlan.resolvedConcepts.length ? result.request.relations.map((relation) => ({ label: relation, support: "Relation déclarée dans la requête, non convertie en assertion." })) : [],
  supportedItems: [
    ...result.applicableAssertions.slice(0, 8).map((item) => ({ id: item.revision, text: item.text, status: item.status, supportIds: result.evidence.filter((link) => link.assertionId === item.revision).map((link) => link.sourceId), locator: item.locator })),
    ...result.documentaryStatements.slice(0, 6).map((item) => ({ id: item.statementId, text: item.text, status: item.status, supportIds: [item.sourceId], locator: item.locator })),
  ],
  limitations: result.limitations,
  gaps: result.gaps.map((item) => `${item.code} — ${item.explanation}`),
  sources: result.sources.map((source) => ({ id: source.sourceId, label: `${source.title} (${source.status})`, locator: source.locator })),
  traceLabel: `${result.resultId} · ${result.queryPlan.queryPlanId}`,
});

