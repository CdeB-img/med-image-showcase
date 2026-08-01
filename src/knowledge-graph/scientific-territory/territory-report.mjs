const freeze = (value) => Object.freeze(value);
const coverageWeight = (state) => state === "COVERED" ? 1 : state === "PARTIALLY_COVERED" ? 0.5 : 0;

const tableByTerritory = (model) => model.nodes.filter((node) => node.level === "TERRITORY").map((territory) => {
  const members = model.nodes.filter((node) => node.territoryId === territory.territoryId);
  const equivalent = members.reduce((sum, node) => sum + coverageWeight(node.currentCoverage), 0);
  return freeze({
    territoryId: territory.territoryId,
    label: territory.label,
    currentCoverageState: territory.currentCoverage,
    currentCoverageEquivalent: Number((equivalent / members.length).toFixed(4)),
    targetCoverage: territory.targetCoverage,
    domains: members.filter((node) => node.level === "DOMAIN").length,
    subdomains: members.filter((node) => node.level === "SUBDOMAIN").length,
    knowledgeAreas: members.filter((node) => node.level === "KNOWLEDGE_AREA").length,
  });
}).sort((a, b) => a.territoryId.localeCompare(b.territoryId));

const domainRows = (model) => model.nodes.filter((node) => node.level === "DOMAIN").map((node) => freeze({
  domainId: node.territoryNodeId,
  label: node.label,
  parents: node.parentIds,
  currentCoverage: node.currentCoverage,
  targetCoverage: node.targetCoverage,
  projectionTypes: node.projectionTypes,
})).sort((a, b) => a.domainId.localeCompare(b.domainId));

export const createTerritoryReport = (model) => {
  const byLevel = Object.fromEntries(model.levels.map((level) => [level.id, model.nodes.filter((node) => node.level === level.id).length]));
  const priorityDomains = model.nodes.filter((node) => node.level === "DOMAIN" && ["FOUNDATION", "PRIMARY"].includes(node.priority));
  const excluded = model.boundaries.rules.filter((rule) => rule.status === "OUT_OF_SCOPE");
  const material = {
    reportId: "noxia:scientific-territory:report:1.0.0",
    modelId: model.modelId,
    modelVersion: model.version,
    modelDigest: model.digest,
    generatedAt: model.generatedAt,
    summary: {
      territories: byLevel.TERRITORY,
      domains: byLevel.DOMAIN,
      subdomains: byLevel.SUBDOMAIN,
      knowledgeAreas: byLevel.KNOWLEDGE_AREA,
      conceptScopes: byLevel.KNOWLEDGE_AREA,
      explicitNodes: model.nodes.length,
      maximumExplicitDepth: 3,
      maximumDefinedDepth: 6,
      currentCoverageEquivalent: model.catalogComparison.summary.currentCoverageEquivalent,
      targetCoverageEquivalent: model.catalogComparison.summary.targetCoverageEquivalent,
      excludedDomains: excluded.length,
      priorityDomains: priorityDomains.length,
      estimatedKnowledgeNodesAtMaturity: model.estimates.expectedKnowledgeNodes,
      estimatedPotentialScientificPages: model.estimates.potentialScientificPages,
    },
    coverage: {
      states: model.catalogComparison.summary.coverage,
      byTerritory: tableByTerritory(model),
      method: "COVERED=1, PARTIALLY_COVERED=0.5, other states=0; current state is a read-only projection of the P9 catalog snapshot.",
      targetMethod: "Every included explicit territory node has a target; future and selective targets remain distinguishable in the node records.",
    },
    catalogComparison: {
      snapshot: model.catalogComparison.catalogSnapshot,
      mappedCatalogDomains: model.catalogComparison.summary.mappedCatalogDomains,
      representedCatalogConcepts: model.catalogComparison.summary.structurallyRepresentedCatalogConcepts,
      unmappedCatalogDomainIds: model.catalogComparison.unmappedCatalogDomainIds,
      orphanCatalogConceptNodeIds: model.catalogComparison.orphanCatalogConceptNodeIds,
      branchesWithoutCatalogDomain: model.catalogComparison.branchesWithoutCatalogDomain,
      roleDifferences: model.catalogComparison.roleDifferences,
      multiMappedCatalogNodes: model.catalogComparison.multiMappedCatalogNodes,
      automaticCorrectionsApplied: 0,
    },
    tables: {
      territoryCoverage: tableByTerritory(model),
      domains: domainRows(model),
      transverseDimensions: model.transverseDimensions.map((dimension) => ({ dimension: dimension.label, territories: dimension.appliesToTerritoryIds })),
      boundaries: model.boundaries.rules.map((rule) => ({ domain: rule.label, status: rule.status, included: rule.status.startsWith("INCLUDED") || rule.status === "ADJACENT_CONDITIONAL", excluded: rule.status === "OUT_OF_SCOPE", justification: rule.justification })),
      contracts: Object.entries(model.contracts).map(([contract, preserved]) => ({ contract, preserved, test: `validate:scientific-territory:${contract}`, note: preserved === false || preserved === 0 ? "Prohibited output remains absent." : "Contract is explicit in the model." })),
    },
    roadmap: model.roadmap,
    limits: [
      "The model is exhaustive at territory, domain, subdomain and knowledge-area granularity, not an enumeration of every possible atomic scientific concept.",
      "Current coverage is derived from exact catalog identities and concept-family compatibility; semantic reassignment is reported but never applied.",
      "Potential KnowledgeNode and page totals are planning ranges, not forecasts of scientific evidence or search demand.",
      "No territory node is scientific evidence and no projection is publication authorization.",
    ],
  };
  return freeze(material);
};

const pct = (value) => `${(value * 100).toFixed(2)} %`;
const yesNo = (value) => value ? "Oui" : "Non";

export const renderTerritoryReportMarkdown = (report) => {
  const lines = [
    "# Scientific Territory Model — rapport",
    "",
    `Modèle : \`${report.modelId}\` v${report.modelVersion}`,
    "",
    "Le Territory Model définit ce que Noxia souhaite couvrir. Le Scientific Knowledge Catalog reste la source de vérité de ce qui est effectivement couvert et conserve seul la responsabilité de planifier les campagnes.",
    "",
    "## Inventaire",
    "",
    `- Territoires : ${report.summary.territories}`,
    `- Domaines : ${report.summary.domains}`,
    `- Sous-domaines : ${report.summary.subdomains}`,
    `- Knowledge Areas / concepts structurants : ${report.summary.knowledgeAreas}`,
    `- Nœuds structurels explicites : ${report.summary.explicitNodes}`,
    `- Profondeur maximale explicite : ${report.summary.maximumExplicitDepth}`,
    `- Profondeur maximale définie : ${report.summary.maximumDefinedDepth}`,
    `- Couverture actuelle équivalente : ${pct(report.summary.currentCoverageEquivalent)}`,
    `- Couverture cible équivalente : ${pct(report.summary.targetCoverageEquivalent)}`,
    `- Domaines/frontières exclus : ${report.summary.excludedDomains}`,
    `- Domaines FOUNDATION ou PRIMARY : ${report.summary.priorityDomains}`,
    `- KnowledgeNodes estimés à terme : ${report.summary.estimatedKnowledgeNodesAtMaturity.minimum}–${report.summary.estimatedKnowledgeNodesAtMaturity.maximum} (point milieu ${report.summary.estimatedKnowledgeNodesAtMaturity.midpoint})`,
    `- Pages scientifiques potentielles : ${report.summary.estimatedPotentialScientificPages.minimum}–${report.summary.estimatedPotentialScientificPages.maximum} (point milieu ${report.summary.estimatedPotentialScientificPages.midpoint})`,
    "",
    "## Couverture par territoire",
    "",
    "| Territoire | Couverture actuelle | Couverture cible |",
    "|---|---:|---|",
    ...report.tables.territoryCoverage.map((row) => `| ${row.label} | ${row.currentCoverageState} — ${pct(row.currentCoverageEquivalent)} | ${row.targetCoverage} |`),
    "",
    "## Domaines et projections possibles",
    "",
    "| Domaine | Parent(s) | Projections possibles |",
    "|---|---|---|",
    ...report.tables.domains.map((row) => `| ${row.label} | ${row.parents.join(", ")} | ${row.projectionTypes.join(", ")} |`),
    "",
    "## Dimensions transverses",
    "",
    "| Dimension transverse | Domaines concernés |",
    "|---|---|",
    ...report.tables.transverseDimensions.map((row) => `| ${row.dimension} | ${row.territories.join(", ")} |`),
    "",
    "## Frontières",
    "",
    "| Domaine | Inclus | Exclu | Justification |",
    "|---|---|---|---|",
    ...report.tables.boundaries.map((row) => `| ${row.domain} | ${yesNo(row.included)} | ${yesNo(row.excluded)} | ${row.justification} |`),
    "",
    "## Comparaison avec le Scientific Knowledge Catalog P9",
    "",
    `- Domaines du catalogue mappés : ${report.catalogComparison.mappedCatalogDomains}`,
    `- Concepts du catalogue structurellement représentés : ${report.catalogComparison.representedCatalogConcepts}`,
    `- Domaines du catalogue non mappés : ${report.catalogComparison.unmappedCatalogDomainIds.length}`,
    `- Concepts orphelins : ${report.catalogComparison.orphanCatalogConceptNodeIds.length}`,
    `- Corrections automatiques : ${report.catalogComparison.automaticCorrectionsApplied}`,
    `- Branches du territoire sans domaine de catalogue : ${report.catalogComparison.branchesWithoutCatalogDomain.length}`,
    "",
    "Les différences de rôle entre domaines de catalogue et dimensions transverses sont conservées comme observations. Aucun renommage, déplacement ou reclassement n'est appliqué.",
    "",
    "## Roadmap",
    "",
    ...report.roadmap.waves.flatMap((wave) => [`### ${wave.waveId}`, "", wave.objective, "", `Territoires : ${wave.territoryIds.join(", ")}.`, "", `Règle : ${wave.catalogRule}`, ""]),
    "## Contrats préservés",
    "",
    "| Contrat | Préservé ? | Test | Remarque |",
    "|---|---|---|---|",
    ...report.tables.contracts.map((row) => `| ${row.contract} | ${String(row.preserved)} | ${row.test} | ${row.note} |`),
    "",
    "## Limites",
    "",
    ...report.limits.map((limit) => `- ${limit}`),
    "",
  ];
  return `${lines.join("\n")}\n`;
};
