import { automaticCampaignExecutionTrace } from "./execution.mjs";
import {
  AUTOMATIC_CAMPAIGN_NODE_ID,
  hepaticImagingAssertionRevisions,
  hepaticImagingCampaignGaps,
  hepaticImagingConcepts,
  hepaticImagingContextDifferences,
  hepaticImagingEvidenceLinks,
  hepaticImagingInternalProjections,
  hepaticImagingInternalSourceAudit,
  hepaticImagingScientificSyntheses,
  hepaticImagingSourceRevisions,
  rejectedHepaticImagingSources,
} from "./hepatic-imaging.mjs";
import { validateAutomaticScientificCampaign } from "./validate.mjs";

const readinessSummary = (node) => Object.freeze(Object.fromEntries(Object.entries(node.readiness).filter(([, value]) => value && typeof value === "object" && "ready" in value).map(([key, value]) => [key, value.ready])));

export const createAutomaticScientificCampaignReport = ({ root = process.cwd(), inspectGit = false } = {}) => {
  const validation = validateAutomaticScientificCampaign({ root, inspectGit });
  const before = validation.beforeNode;
  const after = validation.afterNode;
  const sourceRows = hepaticImagingSourceRevisions.map((source) => {
    const links = hepaticImagingEvidenceLinks.filter((link) => link.sourceRevisionId === source.revisionId);
    return Object.freeze({
      source: `PMID ${source.pmid} / ${source.pmcid}`,
      node: AUTOMATIC_CAMPAIGN_NODE_ID,
      type: source.sourceType,
      locators: Object.freeze(links.map((link) => link.locator).sort()),
      decision: "RETAINED_OFFICIAL_FULL_TEXT",
    });
  });
  const projectionRows = after.projectionCapabilities.evaluations.map((projection) => Object.freeze({
    capability: projection.capability,
    nodeId: after.nodeId,
    ready: projection.eligible,
    blockers: projection.blockers,
    potentialPages: projection.potential && !["ViewerOverlay", "API"].includes(projection.capability) ? 1 : 0,
  }));
  return Object.freeze({
    reportId: "noxia:scientific-campaign-report:hepatic-imaging:01",
    generatedFromTraceDigest: automaticCampaignExecutionTrace.traceDigest,
    valid: validation.valid,
    errors: validation.errors,
    campaign: validation.selection,
    automaticJustification: validation.selection.justifications,
    knowledgeNodesProcessed: validation.selection.nodeIds,
    sourceAudit: Object.freeze({
      internal: hepaticImagingInternalSourceAudit,
      examined: hepaticImagingSourceRevisions.length + rejectedHepaticImagingSources.length,
      retained: hepaticImagingSourceRevisions,
      rejected: rejectedHepaticImagingSources,
    }),
    conceptsAdded: hepaticImagingConcepts,
    assertionsAdded: hepaticImagingAssertionRevisions,
    evidenceLinksAdded: hepaticImagingEvidenceLinks,
    limitations: Object.freeze([...new Set(hepaticImagingAssertionRevisions.flatMap((assertion) => assertion.limitations))].sort()),
    contextualDifferences: hepaticImagingContextDifferences,
    coverage: Object.freeze({ before: before.coverage, after: after.coverage, sourceBefore: before.sourceCoverage, sourceAfter: after.sourceCoverage, assertionBefore: before.assertionCoverage, assertionAfter: after.assertionCoverage }),
    readiness: Object.freeze({ before: readinessSummary(before), after: readinessSummary(after) }),
    virtualProjections: Object.freeze(projectionRows),
    internalProjections: hepaticImagingInternalProjections,
    syntheses: hepaticImagingScientificSyntheses,
    gapsRemaining: hepaticImagingCampaignGaps,
    trace: automaticCampaignExecutionTrace,
    contractRows: Object.freeze([
      { contract: "Automatic catalog selection", preserved: validation.selection.selectionRule.manualDomainSelection === false, proof: automaticCampaignExecutionTrace.digests.selection, remark: "First unexecuted campaign in official deterministic order." },
      { contract: "P4R/P5 corpus preserved", preserved: validation.errors.every((error) => !["PREVIOUS_KNOWLEDGE_NODE_LOST", "P4R_P5_BASELINE_CHANGED"].includes(error.code)), proof: "validate:scientific-campaign", remark: "All 235 P6 KnowledgeNodes remain present." },
      { contract: "Localized scientific evidence", preserved: hepaticImagingEvidenceLinks.every((link) => /^PMC\d+ — /.test(link.locator)), proof: `${hepaticImagingEvidenceLinks.length} localized EvidenceLinks`, remark: "Analytical summaries are not represented as verbatim quotations." },
      { contract: "Public surfaces unchanged", preserved: validation.protectedSurfaces.protectedSurfacesUnchanged, proof: "protected-surface inspector", remark: "No page, route, SEO artifact or sitemap entry is generated." },
      { contract: "No next campaign", preserved: !automaticCampaignExecutionTrace.after.nextCampaignStarted, proof: automaticCampaignExecutionTrace.traceDigest, remark: "Nine campaigns remain planned but none is executed." },
    ]),
    counts: validation.counts,
  });
};

const yesNo = (value) => value ? "Oui" : "Non";
const pct = (coverage) => `${Math.round(coverage.ratio * 100)} %`;
const escapeCell = (value) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");

export const renderAutomaticScientificCampaignMarkdownReport = (report = createAutomaticScientificCampaignReport()) => {
  const before = report.trace.before.node;
  const after = report.trace.after.node;
  const lines = [
    "# P7 — Première campagne scientifique automatique",
    "",
    "> Rapport technique interne. Il ne constitue ni une page éditoriale, ni une projection publique.",
    "",
    "## 1. Campagne sélectionnée",
    "",
    `- \`${report.campaign.campaignId}\``,
    `- KnowledgeNode : \`${report.campaign.nodeIds.join("`, `")}\``,
    `- Priorité : ${report.campaign.priority}`,
    `- Sélection manuelle : ${yesNo(report.campaign.selectionRule.manualDomainSelection)}`,
    "",
    "## 2. Justification automatique",
    "",
    ...report.automaticJustification.map((item) => `- score ${item.priorityScore}; statut ${item.status}; déficit sources ${item.sourceGap}; déficit assertions ${item.assertionGap}.`),
    "",
    "## 3. KnowledgeNodes traités",
    "",
    ...report.knowledgeNodesProcessed.map((nodeId) => `- \`${nodeId}\``),
    "",
    "## 4. Sources examinées, retenues et rejetées",
    "",
    `- Inventaire local : ${report.sourceAudit.internal.length} éléments, tous limités à la planification ou au vocabulaire.`,
    `- Sources externes examinées : ${report.sourceAudit.examined}.`,
    `- Sources retenues : ${report.sourceAudit.retained.length}, toutes en texte intégral officiel.`,
    `- Sources rejetées : ${report.sourceAudit.rejected.length}.`,
    "",
    "| Source | Nœud | Type | Localisateur | Décision |",
    "|---|---|---|---|---|",
    ...report.sourceAudit.retained.map((source) => {
      const links = report.evidenceLinksAdded.filter((link) => link.sourceRevisionId === source.revisionId);
      return `| PMID ${source.pmid} / ${source.pmcid} | ${AUTOMATIC_CAMPAIGN_NODE_ID} | ${source.sourceType} | ${escapeCell(links.map((link) => link.locator).join(" ; "))} | RETAINED_OFFICIAL_FULL_TEXT |`;
    }),
    ...report.sourceAudit.rejected.map((source) => `| PMID ${source.pmid} / ${source.pmcid} | ${AUTOMATIC_CAMPAIGN_NODE_ID} | candidat | — | REJECTED: ${source.reason} |`),
    "",
    "## 5. Concepts ajoutés",
    "",
    `Quinze concepts documentaires sourcés ont été ajoutés : ${report.conceptsAdded.map((concept) => concept.preferredLabel).join(", ")}.`,
    "",
    "## 6. Assertions ajoutées",
    "",
    `- ${report.counts.assertions} assertions atomiques.`,
    `- ${report.counts.supports} assertions soutenues directement.`,
    `- ${report.counts.qualifies} qualifications ou limitations explicites.`,
    "",
    "## 7. EvidenceLinks ajoutés",
    "",
    `${report.counts.evidenceLinks} EvidenceLinks possèdent un localisateur de texte intégral PMC et une synthèse analytique non verbatim.`,
    "",
    "## 8. Limitations et contradictions",
    "",
    ...report.limitations.map((limitation) => `- ${limitation}`),
    ...report.contextualDifferences.map((item) => `- ${item.classification}: ${item.rationale}`),
    "",
    "## 9. Couverture avant/après",
    "",
    "| KnowledgeNode | Priorité | Couverture avant | Couverture après | Statut final |",
    "|---|---:|---:|---:|---|",
    `| ${AUTOMATIC_CAMPAIGN_NODE_ID} | ${after.priority.level} (${after.priority.score}) | ${pct(before.coverage)} | ${pct(after.coverage)} | ${after.status} |`,
    "",
    "## 10. Readiness avant/après",
    "",
    `- Scientific ready : ${yesNo(report.readiness.before.scientificReady)} → ${yesNo(report.readiness.after.scientificReady)}.`,
    `- Provenance ready : ${yesNo(report.readiness.before.provenanceReady)} → ${yesNo(report.readiness.after.provenanceReady)}.`,
    `- Synthesis ready : ${yesNo(report.readiness.before.synthesisReady)} → ${yesNo(report.readiness.after.synthesisReady)}.`,
    `- Editorial projection ready : ${yesNo(report.readiness.before.editorialProjectionReady)} → ${yesNo(report.readiness.after.editorialProjectionReady)}.`,
    `- SEO ready : ${yesNo(report.readiness.after.seoReady)}. Public publication ready : ${yesNo(report.readiness.after.publicPublicationReady)}.`,
    "",
    "## 11. Projections virtuelles recalculées",
    "",
    "| Projection virtuelle | Nœud | Ready | Blocage | Pages potentielles |",
    "|---|---|---|---|---:|",
    ...report.virtualProjections.map((item) => `| ${item.capability} | ${item.nodeId} | ${yesNo(item.ready)} | ${escapeCell(item.blockers.join(", ") || "—")} | ${item.potentialPages} |`),
    "",
    "## 12. Lacunes restantes",
    "",
    ...report.gapsRemaining.map((gap) => `- ${gap}`),
    "",
    "## 13. Trace et digests",
    "",
    `- Digest catalogue avant : \`${report.trace.digests.beforeCatalog}\``,
    `- Digest sélection : \`${report.trace.digests.selection}\``,
    `- Digest résultat : \`${report.trace.digests.campaignResult}\``,
    `- Digest catalogue après : \`${report.trace.digests.afterCatalog}\``,
    `- Digest transition : \`${report.trace.digests.transition}\``,
    `- Digest trace : \`${report.trace.traceDigest}\``,
    "",
    "## 14. Tests et validations",
    "",
    "Les validations finales sont exécutées séparément par les commandes du dépôt. Le rapport est généré uniquement à partir de la trace et des registres déterministes.",
    "",
    "## 15. Fichiers créés et modifiés",
    "",
    "Les fichiers de données, d'exécution, de validation, de test, les scripts, la trace et ce rapport constituent l'unique périmètre P7, avec les adaptations du catalogue et de ses contrats.",
    "",
    "| KnowledgeNode | Concepts ajoutés | Assertions | EvidenceLinks | Lacunes |",
    "|---|---:|---:|---:|---:|",
    `| ${AUTOMATIC_CAMPAIGN_NODE_ID} | ${report.counts.concepts} | ${report.counts.assertions} | ${report.counts.evidenceLinks} | ${report.gapsRemaining.length} |`,
    "",
    "| Contrat | Préservé ? | Test ou preuve | Remarque |",
    "|---|---|---|---|",
    ...report.contractRows.map((item) => `| ${item.contract} | ${yesNo(item.preserved)} | ${escapeCell(item.proof)} | ${escapeCell(item.remark)} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
};

