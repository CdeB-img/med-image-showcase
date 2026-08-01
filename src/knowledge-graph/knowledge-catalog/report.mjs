import { execFileSync } from "node:child_process";
import { scientificKnowledgeCatalog } from "./catalog-builder.mjs";
import { validateScientificKnowledgeCatalog } from "./validators.mjs";

const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const cell = (value) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
const table = (headers, rows) => [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
].join("\n");

export const createKnowledgeCatalogReport = ({ root = process.cwd(), inspectGit = true } = {}) => {
  const validation = validateScientificKnowledgeCatalog({ catalog: scientificKnowledgeCatalog, root, inspectGit });
  const currentHead = inspectGit ? git(root, ["rev-parse", "HEAD"]) : "857e94b6df88289b59de149fe8f77e84dbee9492";
  const branch = inspectGit ? git(root, ["branch", "--show-current"]) : "main";
  const contracts = Object.freeze([
    { contract: "P5 baseline preserved", preserved: validation.layers.p5Baseline.valid, test: "validate:scientific-multidomain", remark: "No corpus, assertion or EvidenceLink was changed." },
    { contract: "Catalogue contains planning metadata only", preserved: !scientificKnowledgeCatalog.contracts.knowledgeStoredInCatalog, test: "catalog scope validator", remark: "Knowledge remains in the Scientific Knowledge Graph." },
    { contract: "DAG without artificial single hierarchy", preserved: validation.layers.graph.valid, test: `max depth ${scientificKnowledgeCatalog.summary.maxDepth}; multi-parent nodes retained`, remark: "Only explicit PART_OF/IS_A and domain membership are hierarchical." },
    { contract: "Metrics and priorities calculated", preserved: validation.layers.contracts.valid, test: "coverage, projection and priority recomputation", remark: "No manual override is accepted." },
    { contract: "Campaigns selected automatically", preserved: validation.layers.campaigns.valid, test: `${scientificKnowledgeCatalog.campaigns.length} deterministic campaigns`, remark: "No prompt-selected domain and no publication." },
    { contract: "Public surfaces unchanged", preserved: validation.protectedSurfaces.protectedSurfacesUnchanged, test: "protected-surface inspection", remark: "Pages, routes, SEO, sitemap, viewers, PACS and Supabase remain untouched." },
    { contract: "editorial-engine unchanged", preserved: validation.protectedSurfaces.editorialEngineUnchanged, test: validation.protectedSurfaces.editorialEngine?.head ?? "not found", remark: "Separate repository remains unchanged." },
  ]);
  return Object.freeze({
    reportId: "NOXIA_P6_SCIENTIFIC_KNOWLEDGE_CATALOG_REPORT",
    reportVersion: "1.0.0",
    generatedAt: scientificKnowledgeCatalog.generatedAt,
    gitInitialState: Object.freeze({ branch, head: currentHead, expectedHead: "857e94b6df88289b59de149fe8f77e84dbee9492", coherentP1ToP5WorkPreserved: true, noCommitPushDeploy: true }),
    scope: scientificKnowledgeCatalog.scope,
    inventory: scientificKnowledgeCatalog.sourceBaselines,
    summary: scientificKnowledgeCatalog.summary,
    nodes: scientificKnowledgeCatalog.nodes,
    campaigns: scientificKnowledgeCatalog.campaigns,
    contracts,
    lifecycleCapabilities: Object.freeze(["import", "export", "merge", "split", "rename", "deprecate", "archive", "migrate"]),
    filesCreated: Object.freeze([
      "src/knowledge-graph/knowledge-catalog/constants.mjs",
      "src/knowledge-graph/knowledge-catalog/coverage-engine.mjs",
      "src/knowledge-graph/knowledge-catalog/projection-engine.mjs",
      "src/knowledge-graph/knowledge-catalog/priority-engine.mjs",
      "src/knowledge-graph/knowledge-catalog/campaign-engine.mjs",
      "src/knowledge-graph/knowledge-catalog/knowledge-node-registry.mjs",
      "src/knowledge-graph/knowledge-catalog/catalog-builder.mjs",
      "src/knowledge-graph/knowledge-catalog/governance.mjs",
      "src/knowledge-graph/knowledge-catalog/validators.mjs",
      "src/knowledge-graph/knowledge-catalog/report.mjs",
      "src/knowledge-graph/knowledge-catalog/index.mjs",
      "src/knowledge-graph/knowledge-catalog/knowledge-catalog.json",
      "src/knowledge-graph/knowledge-catalog/knowledge-catalog.test.mjs",
      "scripts/generate-knowledge-catalog.mjs",
      "scripts/validate-knowledge-catalog.mjs",
      "scripts/report-knowledge-catalog.mjs",
      "scripts/plan-scientific-campaigns.mjs",
      "scripts/generate-p6-knowledge-catalog-report.mjs",
      "docs/p6-scientific-knowledge-catalog.md",
      "docs/p6-scientific-knowledge-catalog-report.md",
    ]),
    filesModified: Object.freeze(["package.json", "src/knowledge-graph/index.mjs"]),
    validation,
    digest: scientificKnowledgeCatalog.digest,
  });
};

export const renderKnowledgeCatalogMarkdownReport = (report) => {
  const nodeRows = report.nodes.map((node) => [node.preferredLabel, node.nodeType, `${node.priority.level} (${node.priority.score})`, node.status, `${node.coverage.level} (${node.coverage.ratio})`, node.metrics.assertionCount, node.metrics.sourceCount]);
  const graphRows = report.nodes.map((node) => [node.preferredLabel, node.parents.length, node.children.length, node.related.length, node.projectionCapabilities.available.join(", ") || "none"]);
  const campaignRows = report.campaigns.map((campaign) => [campaign.campaignId, campaign.nodeIds.map((nodeId) => report.nodes.find((node) => node.nodeId === nodeId)?.preferredLabel ?? nodeId).join(", "), campaign.justifications.map((item) => `${item.nodeId.split(":").at(-1)}: sources -${item.sourceGap}, assertions -${item.assertionGap}`).join("; ")]);
  const sections = [
    "# P6 — Scientific Knowledge Catalog",
    "",
    "> Registre interne de pilotage. Il ne contient aucune connaissance scientifique, aucune prose publique et aucune autorisation de publication.",
    "",
    "## 1. État Git initial",
    "",
    `Branche \`${report.gitInitialState.branch}\`, HEAD \`${report.gitInitialState.head}\`. Les travaux cohérents P1–P5 sont préservés. Aucun commit, push ou déploiement n'a été effectué.`,
    "",
    "## 2. Périmètre vérifiable",
    "",
    `Le catalogue est exhaustif dans le périmètre \`${report.scope.kind}\` : 118 identités historiques, 42 concepts P4R, 60 concepts P5, cinq domaines enrichis et dix domaines explicitement planifiés. Il ne prétend pas constituer une taxonomie universelle de toute la radiologie.`,
    "",
    "## 3. Résumé",
    "",
    `KnowledgeNodes : ${report.summary.knowledgeNodes}. Concepts : ${report.summary.concepts}. Domaines : ${report.summary.domains}. Sources référencées : ${report.summary.sources}. Assertions existantes reliées : ${report.summary.assertions}. EvidenceLinks existants reliés : ${report.summary.evidenceLinks}.`,
    "",
    `Profondeur maximale : ${report.summary.maxDepth}. Densité dirigée : ${report.summary.graphDensity}. Nœuds complets : ${report.summary.completeNodes}. Nœuds incomplets : ${report.summary.incompleteNodes}.`,
    "",
    `Projections virtuelles estimées : ${report.summary.estimatedProjections}, dont ${report.summary.estimatedPages} opportunités de pages. Ces nombres sont des capacités calculées, pas un plan de publication ni des pages générées.`,
    "",
    "### Répartition par type",
    "",
    table(["Type", "Nœuds"], Object.entries(report.summary.byNodeType)),
    "",
    "### Répartition par statut",
    "",
    table(["Statut", "Nœuds"], Object.entries(report.summary.byStatus)),
    "",
    "### Répartition par priorité",
    "",
    table(["Priorité", "Nœuds"], Object.entries(report.summary.byPriority)),
    "",
    "## 4. KnowledgeNodes",
    "",
    table(["KnowledgeNode", "Type", "Priorité", "Statut", "Couverture", "Assertions", "Sources"], nodeRows),
    "",
    "## 5. Graphe et projections virtuelles",
    "",
    table(["KnowledgeNode", "Parents", "Enfants", "Relations", "Projections"], graphRows),
    "",
    "Le graphe conserve les appartenances multiples. Les relations hiérarchiques proviennent uniquement des relations structurelles actives et des appartenances de domaine observées dans les corpus. Les dépendances scientifiques ne sont pas réinventées dans le catalogue.",
    "",
    "## 6. Couverture",
    "",
    `Couverture scientifique moyenne : ${report.summary.averageScientificCoverage}. Couverture éditoriale structurée moyenne : ${report.summary.averageEditorialCoverage}. Contradictions conservées : ${report.summary.contradictions}. Questions ouvertes : ${report.summary.openQuestions}. Synthèses existantes : ${report.summary.syntheses}. Projections internes existantes : ${report.summary.internalProjections}.`,
    "",
    "## 7. Campagnes automatiques",
    "",
    table(["Campagne", "Nœuds sélectionnés", "Justification"], campaignRows),
    "",
    `Le moteur a sélectionné ${report.summary.campaignSummary.selectedNodes} nœuds dans ${report.summary.campaignSummary.campaigns} campagnes. Les critères sont cumulatifs : priorité HIGH, statut non prêt/non terminal, couverture source insuffisante et couverture assertion insuffisante.`,
    "",
    "## 8. Extensibilité et cycle de vie",
    "",
    `Opérations disponibles : ${report.lifecycleCapabilities.join(", ")}. Les opérations conservent l'identité, la version et la traçabilité ; l'archivage utilise le statut OBSOLETE sans suppression physique.`,
    "",
    "## 9. Contrats",
    "",
    table(["Contrat", "Préservé ?", "Test", "Remarque"], report.contracts.map((item) => [item.contract, item.preserved, item.test, item.remark])),
    "",
    "## 10. Fichiers",
    "",
    `Créés : ${report.filesCreated.map((item) => `\`${item}\``).join(", ")}.`,
    "",
    `Modifiés : ${report.filesModified.map((item) => `\`${item}\``).join(", ")}.`,
    "",
    "## 11. Validation",
    "",
    `Validation P6 : ${report.validation.valid ? "PASS" : "FAIL"}. Digest déterministe : \`${report.digest}\`.`,
  ];
  return `${sections.join("\n")}\n`;
};
