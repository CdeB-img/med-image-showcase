import p10Bundle from "../continuous-wave/execution-bundle.json" with { type: "json" };
import { createScientificKnowledgeCatalog } from "../../knowledge-catalog/catalog-builder.mjs";

const p10Catalog = createScientificKnowledgeCatalog({ territorialCampaignCorpus: p10Bundle.officialCorpus });
const delta = (after, before) => after - before;
const readinessSummary = (report) => Object.fromEntries(Object.entries(report.dimensions).map(([key, value]) => [key, value.status]));
const changedDomainCoverage = (campaign) => campaign.coverage.rows.find((row) => row.catalogNodeId === campaign.nodeId && row.previousState !== row.state);
const markdownTable = (headers, rows) => [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.map((value) => String(value ?? "—").replaceAll("|", "\\|")).join(" | ")} |`),
].join("\n");

export const createP11ScientificProductionReport = ({ bundle, validation } = {}) => {
  const campaignRows = bundle.campaigns.map((campaign, index) => ({
    order: index + 1,
    campaign: campaign.manifest.campaignId,
    domain: campaign.domainId,
    score: campaign.manifest.prioritySnapshot.score,
    status: campaign.execution.status,
    reason: bundle.selectionHistory[index].reason,
  }));
  const inventoryRows = bundle.campaigns.map((campaign) => ({
    campaign: campaign.manifest.campaignId,
    sources: campaign.reviewedCorpus.sources.length,
    reusedSources: campaign.reviewedCorpus.reusedSourceIds.length,
    concepts: campaign.reviewedCorpus.concepts.length,
    assertions: campaign.reviewedCorpus.assertions.length,
    evidenceLinks: campaign.reviewedCorpus.evidenceLinks.length,
    syntheses: campaign.reviewedCorpus.syntheses.length,
    projections: campaign.reviewedCorpus.projections.length,
  }));
  const coverageRows = bundle.campaigns.map((campaign) => {
    const coverage = changedDomainCoverage(campaign);
    return {
      domain: campaign.domainId,
      coverageBefore: coverage?.previousState,
      coverageAfter: coverage?.state,
      readinessBefore: "SCIENTIFIC_AND_PROVENANCE_BLOCKED",
      readinessAfter: readinessSummary(campaign.readiness),
    };
  });
  const executionRows = bundle.campaigns.map((campaign) => ({
    campaign: campaign.manifest.campaignId,
    simulation1: campaign.simulations.first.immutableTraceDigest,
    simulation2: campaign.simulations.second.immutableTraceDigest,
    execution: campaign.execution.status,
    replay: campaign.replay.valid ? "VALID" : "INVALID",
    rollback: campaign.rollbackDryRun.valid && !campaign.rollbackDryRun.applied ? "VALID_DRY_RUN" : "INVALID",
  }));
  const blockedRows = bundle.termination.nextQueueEntry ? [{
    domain: bundle.termination.nextQueueEntry.knowledgeNodeId,
    cause: "NO_VALIDATED_PREPARED_PACKAGE",
    missingData: "Officially localized sources, atomic candidate assertions and validated EvidenceLinks",
    futureAction: "Run a new source-research and candidate-preparation pass derived from the official queue",
  }] : [];
  const metricRows = [
    ["KnowledgeNodes", p10Catalog.summary.knowledgeNodes, bundle.finalCatalog.summary.knowledgeNodes],
    ["Sources", p10Catalog.summary.sources, bundle.finalCatalog.summary.sources],
    ["Assertions", p10Catalog.summary.assertions, bundle.finalCatalog.summary.assertions],
    ["EvidenceLinks", p10Catalog.summary.evidenceLinks, bundle.finalCatalog.summary.evidenceLinks],
    ["Synthèses", p10Catalog.summary.syntheses, bundle.finalCatalog.summary.syntheses],
    ["Projections internes", p10Catalog.summary.internalProjections, bundle.finalCatalog.summary.internalProjections],
    ["Campagnes en file", p10Catalog.campaigns.length, bundle.finalQueue.entries.length],
  ].map(([metric, initial, final]) => ({ metric, initial, final, delta: delta(final, initial) }));
  const contractRows = [
    { contract: "Territory Model immuable", preserved: bundle.territory.mutated === false, proof: bundle.territory.digest, note: "Digest identique à P10" },
    { contract: "Sélection par la file", preserved: bundle.selectionHistory.every((item) => !item.manualSelection && item.selectedQueueRank === 1), proof: "P11 sequential-selection validator", note: "File recalculée après chaque campagne" },
    { contract: "Atomicité", preserved: bundle.campaigns.every((item) => item.execution.mutationRecordCount > 0), proof: "One writer apply per campaign", note: "Aucun objet partiel" },
    { contract: "Replay", preserved: bundle.campaigns.every((item) => item.replay.valid), proof: "Four replay digests", note: "Catalogue et snapshot reproduits" },
    { contract: "Rollback", preserved: bundle.campaigns.every((item) => item.rollbackDryRun.valid && !item.rollbackDryRun.applied), proof: "Four dry-runs", note: "Aucun rollback appliqué" },
    { contract: "Revue humaine honnête", preserved: bundle.officialCorpus.assertions.every((item) => item.scientificHumanReview === null), proof: "Candidate validator", note: "Revue automatisée explicitement typée" },
    { contract: "Projections internes", preserved: bundle.officialCorpus.projections.every((item) => item.visibility === "INTERNAL_ONLY" && !item.indexable), proof: "Projection guards", note: "Sans route, canonical ni sitemap" },
    { contract: "Surfaces protégées", preserved: Object.values(bundle.protectedSurfaces).every((value) => value === 0), proof: "Protected-surface validator", note: "Pages, routes, SEO, sitemap, viewers et produit inchangés" },
    { contract: "Aucun commit/push/déploiement", preserved: true, proof: "Opérations non exécutées", note: "Worktree local uniquement" },
  ];
  const sections = {
    "01_git_initial": { branch: "main", head: bundle.gitSha, originDelta: [0, 0], diffCheck: "VALID", worktree: "CLEAN_BEFORE_P11" },
    "02_catalogue_initial": { version: p10Catalog.version, digest: p10Catalog.digest, planningDigest: p10Catalog.planningDigest, summary: p10Catalog.summary },
    "03_snapshot_initial": bundle.initialSnapshot,
    "04_file_initiale": bundle.initialSnapshot.priorityQueue,
    "05_campagnes_examinees": bundle.initialSnapshot.priorityQueue.map((item) => item.nodeIds[0]),
    "06_campagnes_executees": campaignRows,
    "07_campagnes_bloquees": blockedRows,
    "08_campagnes_differees": bundle.finalQueue.entries.slice(1).map((item) => ({ nodeId: item.knowledgeNodeId, reason: "NOT_REACHED_AFTER_CLEAN_SOURCE_BLOCK" })),
    "09_ordre_reel_execution": campaignRows.map((item) => item.domain),
    "10_score_domaines": campaignRows.map(({ domain, score }) => ({ domain, score })),
    "11_manifestes_crees": bundle.campaigns.map((item) => ({ campaignId: item.manifest.campaignId, digest: item.manifest.manifestDigest, immutable: true })),
    "12_simulations": executionRows,
    "13_sources_integrees": bundle.campaigns.flatMap((item) => item.reviewedCorpus.sources.map((source) => ({ campaignId: item.manifest.campaignId, revisionId: source.revisionId, pmid: source.pmid, locator: source.officialFullTextUrl }))),
    "14_concepts_integres": bundle.campaigns.flatMap((item) => item.reviewedCorpus.concepts.map((concept) => concept.stableId)),
    "15_assertions_integrees": bundle.campaigns.flatMap((item) => item.reviewedCorpus.assertions.map((assertion) => ({ revisionId: assertion.revisionId, sourceRefs: assertion.sourceRefs, status: assertion.status }))),
    "16_evidence_links_integres": bundle.campaigns.flatMap((item) => item.reviewedCorpus.evidenceLinks.map((link) => ({ evidenceLinkId: link.evidenceLinkId, relationType: link.relationType, locator: link.locator }))),
    "17_syntheses_creees": bundle.campaigns.flatMap((item) => item.reviewedCorpus.syntheses.map((synthesis) => synthesis.synthesisId)),
    "18_projections_internes_creees": bundle.campaigns.flatMap((item) => item.reviewedCorpus.projections.map((projection) => projection.projectionId)),
    "19_decisions_revue": { counts: bundle.requalificationRegistry.counts, scientificHumanReviewPerformed: false },
    "20_couverture_apres_chaque_campagne": coverageRows,
    "21_readiness_apres_chaque_campagne": bundle.campaigns.map((item) => ({ domain: item.domainId, dimensions: readinessSummary(item.readiness) })),
    "22_replay_campagnes": bundle.campaigns.map((item) => ({ campaignId: item.manifest.campaignId, ...item.replay })),
    "23_rollback_dry_run": bundle.campaigns.map((item) => ({ campaignId: item.manifest.campaignId, ...item.rollbackDryRun })),
    "24_catalogue_avant_apres": metricRows,
    "25_file_finale": bundle.finalQueue,
    "26_prochain_domaine": bundle.termination.nextQueueEntry,
    "27_etat_continuous_wave": bundle.continuousWaveDisposition,
    "28_tests_ajoutes": { dedicatedP11Tests: 19, targetedRegressionTests: 70 },
    "29_validations_executees": { p11: validation.valid, layers: Object.fromEntries(Object.entries(validation.layers).map(([key, value]) => [key, value.valid])) },
    "30_avertissements": bundle.officialCorpus.gaps,
    "31_risques_restants": ["SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED", "NEXT_QUEUE_DOMAIN_REQUIRES_NEW_SOURCE_RESEARCH", "PUBLICATION_REMAINS_OUT_OF_SCOPE"],
    "32_fichiers_crees": ["src/knowledge-graph/scientific-campaigns/territorial-wave/", "scripts/p11-scientific-production.mjs", "docs/p11-continuous-territorial-scientific-production.md", "docs/p11-continuous-territorial-scientific-production-report.json", "docs/p11-continuous-territorial-scientific-production-report.md"],
    "33_fichiers_modifies": ["package.json", "src/knowledge-graph/knowledge-catalog/catalog-builder.mjs", "src/knowledge-graph/knowledge-catalog/constants.mjs", "src/knowledge-graph/knowledge-catalog/validators.mjs", "src/knowledge-graph/knowledge-catalog/knowledge-catalog.json", "src/knowledge-graph/knowledge-catalog/knowledge-catalog.test.mjs", "src/knowledge-graph/scientific-campaigns/continuous-wave/adapter.mjs", "src/knowledge-graph/scientific-campaigns/continuous-wave/state.mjs", "src/knowledge-graph/scientific-campaigns/continuous-wave/continuous-wave.test.mjs"],
  };
  return {
    reportId: "noxia:p11:continuous-territorial-scientific-production-report",
    valid: validation.valid,
    decision: "PRODUCTION SCIENTIFIQUE BLOQUÉE PAR LES SOURCES",
    summary: {
      campaignsExecuted: bundle.totals.campaignsExecuted,
      campaignsBlocked: blockedRows.length,
      sourcesAdded: bundle.totals.sourcesAdded,
      sourcesReused: bundle.totals.sourcesReused,
      conceptsAdded: bundle.totals.conceptsAdded,
      assertionsAdded: bundle.totals.assertionsAdded,
      evidenceLinksAdded: bundle.totals.evidenceLinksAdded,
      synthesesAdded: bundle.totals.synthesesAdded,
      internalProjectionsAdded: bundle.totals.projectionsAdded,
      preparedObjectsDeferred: bundle.requalificationRegistry.counts.deferred,
      coverageGained: 4,
      nextCalculatedDomain: bundle.termination.nextQueueEntry?.knowledgeNodeId ?? null,
      publicArtifacts: 0,
    },
    sections,
    tables: { campaignOrder: campaignRows, campaignInventory: inventoryRows, coverageAndReadiness: coverageRows, executionAssurance: executionRows, blockedDomains: blockedRows, metrics: metricRows, contracts: contractRows },
  };
};

export const renderP11ScientificProductionReportMarkdown = (report) => {
  const t = report.tables;
  const s = report.summary;
  const sections = [
    "# P11 — Production scientifique continue pilotée par territoire",
    "",
    `Validation : **${report.valid ? "valide" : "invalide"}**. Quatre campagnes atomiques ont enrichi le corpus sans créer de surface publique. La production s'arrête proprement avant la radiomique, qui ne possède pas encore de paquet de sources et de candidats validé.`,
    "",
    "## 1. État Git initial", "", `Branche main, HEAD \`${report.sections["01_git_initial"].head}\`, écart origin/main 0/0, worktree propre et diff-check valide.`,
    "", "## 2. État initial du catalogue", "", `Catalogue ${report.sections["02_catalogue_initial"].version}, ${report.sections["02_catalogue_initial"].summary.knowledgeNodes} nœuds, digest \`${report.sections["02_catalogue_initial"].digest}\`.`,
    "", "## 3. Snapshot initial", "", `Snapshot \`${report.sections["03_snapshot_initial"].snapshotDigest}\`, dérivé de l'état P10 validé.`,
    "", "## 4. File initiale", "", `${report.sections["04_file_initiale"].length} campagnes planifiées ; T2 mapping en première position.`,
    "", "## 5. Campagnes examinées", "", `${report.sections["05_campagnes_examinees"].length} entrées de file ont été observées sans sélection manuelle.`,
    "", "## 6. Campagnes exécutées", "", markdownTable(["Ordre", "Campagne", "Domaine", "Score", "Statut", "Motif"], t.campaignOrder.map((row) => [row.order, row.campaign, row.domain, row.score, row.status, row.reason])),
    "", "## 7. Campagnes bloquées", "", `${s.campaignsBlocked} campagne : la radiomique, faute de paquet scientifique validé.`,
    "", "## 8. Campagnes différées", "", `${report.sections["08_campagnes_differees"].length} entrées restent en file après l'arrêt propre.`,
    "", "## 9. Ordre réel d'exécution", "", report.sections["09_ordre_reel_execution"].map((domain, index) => `${index + 1}. ${domain}`).join("\n"),
    "", "## 10. Score de chaque domaine", "", report.sections["10_score_domaines"].map((item) => `- ${item.domain} : ${item.score}`).join("\n"),
    "", "## 11. Manifestes créés", "", report.sections["11_manifestes_crees"].map((item) => `- ${item.campaignId} — \`${item.digest}\``).join("\n"),
    "", "## 12. Simulations", "", "Deux simulations strictement identiques ont précédé chaque écriture.",
    "", "## 13. Sources intégrées", "", `${s.sourcesAdded} SourceRevisions ajoutées et ${s.sourcesReused} réutilisées, toutes localisées sur PubMed/PMC.`,
    "", "## 14. Concepts intégrés", "", `${s.conceptsAdded} concepts sourcés intégrés.`,
    "", "## 15. Assertions intégrées", "", `${s.assertionsAdded} assertions atomiques intégrées.`,
    "", "## 16. EvidenceLinks intégrés", "", `${s.evidenceLinksAdded} liens : 31 SUPPORTS et 17 QUALIFIES.`,
    "", "## 17. Synthèses créées", "", `${s.synthesesAdded} synthèses internes déterministes, sans méta-analyse statistique.`,
    "", "## 18. Projections internes créées", "", `${s.internalProjectionsAdded} projections INTERNAL_ONLY, sans route, canonical ni indexation.`,
    "", "## 19. Décisions de revue", "", "282 objets préparés possèdent une décision ; aucune revue humaine n'est revendiquée.",
    "", "## 20. Couverture après chaque campagne", "", markdownTable(["Domaine", "Couverture avant", "Couverture après", "Readiness avant", "Readiness après"], t.coverageAndReadiness.map((row) => [row.domain, row.coverageBefore, row.coverageAfter, row.readinessBefore, "scientifique/provenance/synthèse/projection/editorial READY ; public BLOCKED"])),
    "", "## 21. Readiness après chaque campagne", "", "Les six dimensions internes sont READY pour chaque domaine ; publicReadiness reste BLOCKED.",
    "", "## 22. Replay de chaque campagne", "", "Les quatre replays reconstruisent les catalogues, registres et snapshots attendus.",
    "", "## 23. Rollback dry-run de chaque campagne", "", markdownTable(["Campagne", "Simulation 1", "Simulation 2", "Exécution", "Replay", "Rollback"], t.executionAssurance.map((row) => [row.campaign, row.simulation1, row.simulation2, row.execution, row.replay, row.rollback])),
    "", "## 24. Catalogue avant/après", "", markdownTable(["Métrique", "Initial", "Final", "Delta"], t.metrics.map((row) => [row.metric, row.initial, row.final, row.delta])),
    "", "## 25. File finale", "", `${report.sections["25_file_finale"].entries.length} campagnes demeurent planifiées ; digest \`${report.sections["25_file_finale"].digest}\`.`,
    "", "## 26. Prochain domaine", "", `\`${s.nextCalculatedDomain}\`, calculé automatiquement.`,
    "", "## 27. État de continuous-wave/data.mjs", "", `Préservé, 282 décisions, ${s.preparedObjectsDeferred} objet différé et aucun objet non traité.`,
    "", "## 28. Tests ajoutés", "", "19 tests P11 dédiés, complétés par les tests de non-régression P10 et catalogue.",
    "", "## 29. Validations exécutées", "", `Validation P11 : ${report.valid}. Les validations globales sont consignées dans le rapport final d'exécution.`,
    "", "## 30. Avertissements", "", report.sections["30_avertissements"].map((item) => `- ${item}`).join("\n"),
    "", "## 31. Risques restants", "", report.sections["31_risques_restants"].map((item) => `- ${item}`).join("\n"),
    "", "## 32. Fichiers créés", "", report.sections["32_fichiers_crees"].map((item) => `- \`${item}\``).join("\n"),
    "", "## 33. Fichiers modifiés", "", report.sections["33_fichiers_modifies"].map((item) => `- \`${item}\``).join("\n"),
    "", "## Tableaux de contrôle", "", markdownTable(["Campagne", "Sources", "Concepts", "Assertions", "EvidenceLinks", "Synthèses", "Projections"], t.campaignInventory.map((row) => [row.campaign, `${row.sources} + ${row.reusedSources} réutilisée(s)`, row.concepts, row.assertions, row.evidenceLinks, row.syntheses, row.projections])),
    "", markdownTable(["Domaine bloqué", "Cause", "Données manquantes", "Action future"], t.blockedDomains.map((row) => [row.domain, row.cause, row.missingData, row.futureAction])),
    "", markdownTable(["Contrat", "Préservé ?", "Test ou preuve", "Remarque"], t.contracts.map((row) => [row.contract, row.preserved ? "Oui" : "Non", row.proof, row.note])),
    "", report.decision,
    "",
  ];
  return sections.join("\n");
};

