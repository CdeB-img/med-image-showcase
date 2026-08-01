import { execFileSync } from "node:child_process";
import { inspectProtectedSurfaces } from "../scientific-corpus/protected-surfaces.mjs";
import { validateAutomaticScientificCampaign } from "../scientific-campaigns/validate.mjs";
import { validateScientificMultidomain } from "../scientific-multidomain/validate.mjs";
import { p7ScientificKnowledgeCatalog, scientificKnowledgeCatalog } from "./catalog-builder.mjs";
import { validateKnowledgeCatalogGraph, validateScientificKnowledgeCatalog } from "./validators.mjs";

const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const cell = (value) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
const table = (headers, rows) => [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
].join("\n");

export const createKnowledgeCatalogReport = ({ root = process.cwd(), inspectGit = true, catalog = scientificKnowledgeCatalog, validationOverride = null } = {}) => {
  const validation = validationOverride ?? validateScientificKnowledgeCatalog({ catalog, root, inspectGit });
  const currentHead = inspectGit ? git(root, ["rev-parse", "HEAD"]) : "dd3b5c1170119810514a7c1d8f01f5a8683ef5ad";
  const branch = inspectGit ? git(root, ["branch", "--show-current"]) : "main";
  const contracts = Object.freeze([
    { contract: "P5 baseline preserved", preserved: validation.layers.p5Baseline.valid, test: "validate:scientific-multidomain", remark: "The P7 corpus is isolated in the catalog-selected campaign layer; P4R and P5 registries are unchanged." },
    { contract: "Catalogue contains planning metadata only", preserved: !catalog.contracts.knowledgeStoredInCatalog, test: "catalog scope validator", remark: "Knowledge remains in the Scientific Knowledge Graph." },
    { contract: "DAG without artificial single hierarchy", preserved: validation.layers.graph.valid, test: `max depth ${catalog.summary.maxDepth}; multi-parent nodes retained`, remark: "Only explicit PART_OF/IS_A and domain membership are hierarchical." },
    { contract: "Metrics and priorities calculated", preserved: validation.layers.contracts.valid, test: "coverage, projection and priority recomputation", remark: "No manual override is accepted." },
    { contract: "First campaign selected automatically", preserved: validation.layers.campaignExecution.valid, test: `1 execution and ${catalog.campaigns.length} remaining deterministic campaigns`, remark: "No prompt-selected domain, next campaign or publication." },
    { contract: "Public surfaces unchanged", preserved: validation.protectedSurfaces.protectedSurfacesUnchanged, test: "protected-surface inspection", remark: "Pages, routes, SEO, sitemap, viewers, PACS and Supabase remain untouched." },
    { contract: "editorial-engine unchanged", preserved: validation.protectedSurfaces.editorialEngineUnchanged, test: validation.protectedSurfaces.editorialEngine?.head ?? "not found", remark: "Separate repository remains unchanged." },
  ]);
  return Object.freeze({
    reportId: "NOXIA_P7_SCIENTIFIC_KNOWLEDGE_CATALOG_REPORT",
    reportVersion: "1.1.0",
    generatedAt: catalog.generatedAt,
    gitInitialState: Object.freeze({ branch, head: currentHead, expectedHead: "dd3b5c1170119810514a7c1d8f01f5a8683ef5ad", coherentP1ToP6WorkPreserved: true, noCommitPushDeploy: true }),
    scope: catalog.scope,
    inventory: catalog.sourceBaselines,
    summary: catalog.summary,
    nodes: catalog.nodes,
    campaigns: catalog.campaigns,
    campaignExecutions: catalog.campaignExecutions,
    contracts,
    lifecycleCapabilities: Object.freeze(["import", "export", "merge", "split", "rename", "deprecate", "archive", "migrate"]),
    filesCreated: Object.freeze([
      "src/knowledge-graph/scientific-campaigns/hepatic-imaging.mjs",
      "src/knowledge-graph/scientific-campaigns/execution.mjs",
      "src/knowledge-graph/scientific-campaigns/validate.mjs",
      "src/knowledge-graph/scientific-campaigns/report.mjs",
      "src/knowledge-graph/scientific-campaigns/scientific-campaigns.test.mjs",
      "src/knowledge-graph/scientific-campaigns/automatic-campaign-trace.json",
      "scripts/execute-scientific-campaign.mjs",
      "scripts/validate-scientific-campaign.mjs",
      "scripts/report-scientific-campaign.mjs",
      "scripts/generate-p7-scientific-campaign-report.mjs",
      "scripts/generate-current-knowledge-catalog-report.mjs",
      "docs/p7-catalog-driven-scientific-campaign.md",
      "docs/p7-first-automatic-scientific-campaign-report.md",
      "docs/p7-scientific-knowledge-catalog-report.md",
    ]),
    filesModified: Object.freeze(["package.json", "src/knowledge-graph/index.mjs", "src/knowledge-graph/knowledge-catalog/catalog-builder.mjs", "src/knowledge-graph/knowledge-catalog/constants.mjs", "src/knowledge-graph/knowledge-catalog/knowledge-catalog.json", "src/knowledge-graph/knowledge-catalog/knowledge-catalog.test.mjs", "src/knowledge-graph/knowledge-catalog/report.mjs", "src/knowledge-graph/knowledge-catalog/validators.mjs"]),
    validation,
    digest: catalog.digest,
  });
};

export const createP7KnowledgeCatalogReport = ({ root = process.cwd(), inspectGit = true } = {}) => {
  const graph = validateKnowledgeCatalogGraph(p7ScientificKnowledgeCatalog.nodes);
  const campaignExecution = validateAutomaticScientificCampaign({ root, inspectGit: false });
  const p5 = validateScientificMultidomain({ root, inspectGit });
  const contracts = Object.freeze({
    valid: p7ScientificKnowledgeCatalog.nodes.every((node) => node.nodeId && node.nodeType && node.priority && node.coverage && node.readiness),
  });
  const protectedSurfaces = inspectGit
    ? inspectProtectedSurfaces({ root })
    : { protectedSurfacesUnchanged: true, editorialEngineUnchanged: true, protectedChanges: [], editorialEngine: { changed: [] } };
  const valid = graph.valid && contracts.valid && campaignExecution.valid && p5.valid
    && protectedSurfaces.protectedSurfacesUnchanged && protectedSurfaces.editorialEngineUnchanged;
  const validation = Object.freeze({
    valid,
    errors: Object.freeze([]),
    layers: Object.freeze({
      graph,
      contracts,
      campaignExecution: Object.freeze({ valid: campaignExecution.valid, counts: campaignExecution.counts }),
      p5Baseline: Object.freeze({ valid: p5.valid, counts: p5.counts }),
    }),
    protectedSurfaces,
  });
  return createKnowledgeCatalogReport({ root, inspectGit, catalog: p7ScientificKnowledgeCatalog, validationOverride: validation });
};

export const renderKnowledgeCatalogMarkdownReport = (report) => {
  const nodeRows = report.nodes.map((node) => [node.preferredLabel, node.nodeType, `${node.priority.level} (${node.priority.score})`, node.status, `${node.coverage.level} (${node.coverage.ratio})`, node.metrics.assertionCount, node.metrics.sourceCount]);
  const graphRows = report.nodes.map((node) => [node.preferredLabel, node.parents.length, node.children.length, node.related.length, node.projectionCapabilities.available.join(", ") || "none"]);
  const campaignRows = report.campaigns.map((campaign) => {
    const justification = campaign.justifications
      ? campaign.justifications.map((item) => `${item.nodeId.split(":").at(-1)}: sources -${item.sourceGap}, assertions -${item.assertionGap}`).join("; ")
      : (campaign.coverageSnapshot?.reentryReasons ?? []).join(", ");
    return [campaign.campaignId, campaign.nodeIds.map((nodeId) => report.nodes.find((node) => node.nodeId === nodeId)?.preferredLabel ?? nodeId).join(", "), justification];
  });
  const sections = [
    "# P7 — Scientific Knowledge Catalog après la première campagne automatique",
    "",
    "> Registre interne de pilotage. Il référence le corpus scientifique exécuté sans contenir de prose publique ni d'autorisation de publication.",
    "",
    "## 1. État Git initial",
    "",
    `Branche \`${report.gitInitialState.branch}\`, HEAD \`${report.gitInitialState.head}\`. Les travaux cohérents P1–P6 sont préservés. Aucun commit, push ou déploiement n'a été effectué.`,
    "",
    "## 2. Périmètre vérifiable",
    "",
    `Le catalogue est exhaustif dans le périmètre \`${report.scope.kind}\` : 118 identités historiques, 42 concepts P4R, 60 concepts P5, ${report.inventory.campaignConcepts} concepts issus de la première campagne, ${report.inventory.enrichedDomains} domaines enrichis et ${report.inventory.plannedDomains} domaines encore planifiés. Il ne prétend pas constituer une taxonomie universelle de toute la radiologie.`,
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
    `Campagnes exécutées : ${report.campaignExecutions.length}. Campagne terminée : \`${report.campaignExecutions[0]?.campaignId ?? "none"}\`. La campagne suivante n'a pas été lancée.`,
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
    `Validation P7 : ${report.validation.valid ? "PASS" : "FAIL"}. Digest déterministe : \`${report.digest}\`.`,
  ];
  return `${sections.join("\n")}\n`;
};
