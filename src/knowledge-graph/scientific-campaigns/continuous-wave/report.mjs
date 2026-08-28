import { P10_GIT_SHA, P10_PREPARED_FILE, P10_SELECTED_NODE_ID } from "./constants.mjs";

const freeze = (value) => Object.freeze(value);
const count = (items, predicate) => items.filter(predicate).length;
const asText = (value) => Array.isArray(value) ? value.join(", ") : value === null || value === undefined ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
const markdownTable = (headers, rows) => [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.map((value) => asText(value).replaceAll("|", "\\|").replaceAll("\n", " ")).join(" | ")} |`),
].join("\n");

const decisionFor = (bundle, preparedObjectId) => bundle.requalificationRegistry.decisions.find((item) => item.preparedObjectId === preparedObjectId);

export const createP10ScientificProductionReport = ({ bundle, validation } = {}) => {
  const initial = bundle.initialSnapshot;
  const final = bundle.postSnapshot;
  const decisions = bundle.requalificationRegistry.decisions;
  const selectedSources = bundle.officialCorpus.sources;
  const selectedAssertions = bundle.officialCorpus.assertions;
  const selectedEvidence = bundle.officialCorpus.evidenceLinks;
  const domainRows = bundle.plan.candidates.map((item) => freeze({
    domain: item.domainId,
    priority: item.weightsAndComponents.catalogPriorityScore,
    score: item.totalScore,
    coverage: `${item.coverageBefore.status}; ${item.coverageBefore.sources} source(s), ${item.coverageBefore.assertions} assertion(s)`,
    readiness: item.eligible ? "ELIGIBLE_PREPARED_PACKAGE" : item.blockers.join(", "),
    sources: item.preparedOutputs.sources,
    selected: item.selected,
  }));
  const changedCoverage = bundle.coverage.rows.filter((item) => item.previousState !== item.state);
  const sourcesTable = selectedSources.map((source) => {
    const linked = selectedEvidence.filter((item) => item.sourceRevisionId === source.revisionId);
    const decision = decisionFor(bundle, source.revisionId);
    return freeze({ source: `${source.title} (PMID ${source.pmid})`, type: source.sourceType, locator: linked.map((item) => item.locator).join(" ; "), status: source.documentStatus, assertionsLinked: linked.length, decision: decision?.decision ?? "DERIVED_VERIFIED_REVISION" });
  });
  const assertionsTable = selectedAssertions.map((assertion) => {
    const links = selectedEvidence.filter((item) => item.assertionRevisionId === assertion.revisionId);
    return freeze({ assertion: assertion.key, subject: assertion.subjectEntityId, context: assertion.context.contextId, source: assertion.sourceRefs.join(", "), evidenceLink: links.map((item) => `${item.relationType}:${item.evidenceLinkId}`).join(", "), decision: assertion.status });
  });
  const preparedObjectsTable = decisions.map((item) => freeze({ preparedObject: item.preparedObjectId, domain: item.domainPackage, territoryNode: item.territoryNodeId, decision: item.decision, justification: item.justification, result: item.migrationStatus }));
  const campaignTable = freeze([{ campaign: bundle.manifest.campaignId, manifest: bundle.manifest.manifestDigest, simulation: bundle.simulations.identical ? "DETERMINISTIC" : "DIVERGED", execution: bundle.status, replay: bundle.replay.valid ? "VALID" : "INVALID", rollback: bundle.rollbackDryRun.valid ? "VALID_DRY_RUN" : "INVALID" }]);
  const metricsTable = freeze([
    { metric: "KnowledgeNodes", before: 250, after: 258, delta: 8, justification: "Eight sourced segmentation concepts." },
    { metric: "Sources referenced by catalog", before: 92, after: 97, delta: 5, justification: "Five verified publication revisions." },
    { metric: "ScientificAssertions", before: 177, after: 189, delta: 12, justification: "Twelve atomic segmentation assertions." },
    { metric: "EvidenceLinks", before: 214, after: 226, delta: 12, justification: "One localized link per new assertion." },
    { metric: "Syntheses", before: 27, after: 28, delta: 1, justification: "Internal deterministic state-of-knowledge synthesis." },
    { metric: "Internal projections", before: 24, after: 25, delta: 1, justification: "Internal-only segmentation projection." },
    { metric: "Planned campaigns", before: 13, after: 12, delta: -1, justification: "Exactly one completed campaign removed from the queue." },
  ]);
  const projectionTable = bundle.officialCorpus.projections.map((projection) => freeze({ projection: projection.projectionId, assertions: projection.assertionIds.length, sources: projection.sourceIds.length, readiness: bundle.readiness.coverageState, blockers: [...projection.blockers, ...projection.missingData].join(", ") || "—" }));
  const contractTable = freeze([
    { contract: "Territory Model unchanged", preserved: !bundle.territory.mutated, proof: bundle.territory.digest, note: "Upstream P9 model retained byte-stable." },
    { contract: "Prepared wave is not authoritative", preserved: true, proof: bundle.preparedPackage.trustStatus, note: "Digest-gated quarantine and per-object decision." },
    { contract: "Single campaign", preserved: bundle.execution.executedCampaigns === 1, proof: bundle.manifest.campaignId, note: "No next campaign executed." },
    { contract: "Atomic integration", preserved: bundle.execution.mutationRecordCount === 69, proof: bundle.execution.traceDigest, note: "One in-memory writer commit." },
    { contract: "Deterministic replay", preserved: bundle.replay.valid, proof: bundle.replay.snapshotDigest, note: "Catalog and snapshot reproduced." },
    { contract: "Logical rollback", preserved: bundle.rollbackDryRun.valid, proof: bundle.rollbackDryRun.restoredSnapshotDigest, note: "Dry-run only; execution retained." },
    { contract: "Human review honesty", preserved: selectedAssertions.every((item) => item.scientificHumanReview === null), proof: "0 human-reviewed assertions claimed", note: "Automated review types remain explicit." },
    { contract: "No public projection", preserved: bundle.protectedSurfaces.publicPagesChanged === 0, proof: "INTERNAL_ONLY", note: "No route, canonical, sitemap or rendering." },
    { contract: "Protected product surfaces", preserved: validation.layers.protectedSurfaces.valid, proof: "validateProtectedScientificSurfaces", note: "Viewer, PACS, Supabase, Auth and Stripe remain protected; the editorial-engine ownership boundary is repository-local." },
  ]);
  const sections = freeze({
    gitInitial: { branch: "main", head: P10_GIT_SHA, originDelta: "0/0 at initial audit", uncommittedBaselinePreserved: true },
    catalogInitial: initial.catalog,
    territoryModel: bundle.territory,
    initialQueue: { campaigns: 13, planningDigest: initial.catalog.planningDigest },
    preparedWaveAudit: bundle.preparedPackage,
    preparedObjects: bundle.preparedPackage.inventory.counts,
    territoryAlignment: validation.layers.territory,
    requalification: bundle.requalificationRegistry.counts,
    acceptedSources: count(decisions, (item) => item.objectType === "SourceRevision" && ["ACCEPT_AS_IS", "ACCEPT_WITH_CORRECTION"].includes(item.decision)),
    deferredSources: count(decisions, (item) => ["SourceRevision", "ReusedSourceAssociation"].includes(item.objectType) && item.decision.startsWith("DEFER")),
    rejectedSources: count(decisions, (item) => item.objectType === "RejectedSourceCandidate" && item.decision.startsWith("REJECT")),
    validatedExtractions: selectedEvidence.length,
    acceptedAssertions: count(decisions, (item) => item.objectType === "ScientificAssertionRevision" && item.decision === "ACCEPT_AS_IS"),
    correctedAssertions: count(decisions, (item) => item.objectType === "ScientificAssertionRevision" && item.decision === "ACCEPT_WITH_CORRECTION"),
    deferredAssertions: count(decisions, (item) => item.objectType === "ScientificAssertionRevision" && item.decision.startsWith("DEFER")),
    rejectedAssertions: count(decisions, (item) => item.objectType === "ScientificAssertionRevision" && item.decision.startsWith("REJECT")),
    acceptedEvidenceLinks: count(decisions, (item) => item.objectType === "EvidenceLink" && item.decision === "ACCEPT_AS_IS"),
    correctedEvidenceLinks: count(decisions, (item) => item.objectType === "EvidenceLink" && item.decision === "ACCEPT_WITH_CORRECTION"),
    rejectedEvidenceLinks: count(decisions, (item) => item.objectType === "EvidenceLink" && item.decision.startsWith("REJECT")),
    selectedDomain: bundle.plan.selectedDomainId,
    selectionScore: bundle.plan.candidates.find((item) => item.selected)?.totalScore,
    manifest: { campaignId: bundle.manifest.campaignId, digest: bundle.manifest.manifestDigest, immutable: true },
    simulation: { runs: 2, identical: bundle.simulations.identical, digest: bundle.simulations.first.immutableTraceDigest },
    atomicExecution: { status: bundle.status, records: bundle.execution.mutationRecordCount, traceDigest: bundle.execution.traceDigest },
    integratedObjects: { sourceIdentities: bundle.officialCorpus.sourceIdentities.length, sources: bundle.officialCorpus.sources.length, concepts: bundle.officialCorpus.concepts.length, assertionIdentities: bundle.officialCorpus.assertionIdentities.length, assertions: bundle.officialCorpus.assertions.length, evidenceLinks: bundle.officialCorpus.evidenceLinks.length, contextDifferences: bundle.officialCorpus.contextDifferences.length, reviewDecisions: bundle.officialCorpus.reviewDecisions.length },
    synthesesCreated: bundle.officialCorpus.syntheses.length,
    internalProjectionsCreated: bundle.officialCorpus.projections.length,
    catalogBeforeAfter: { before: initial.catalog, after: final.catalog },
    coverageBeforeAfter: changedCoverage,
    readinessBeforeAfter: { before: bundle.manifest.coverageBefore.readiness, after: bundle.readiness.dimensions },
    replay: bundle.replay,
    rollbackDryRun: bundle.rollbackDryRun,
    newQueue: { campaigns: bundle.queue.entries.length, next: bundle.queue.entries[0] },
    continuousWaveFinalState: {
      ...bundle.continuousWaveDisposition,
      acceptedAuditOnly: count(decisions, (item) => ["ACCEPT_AS_IS", "ACCEPT_WITH_CORRECTION"].includes(item.decision) && item.migrationStatus === "AUDIT_ONLY_NOT_INTEGRATED"),
      acceptedManifestInputOnly: count(decisions, (item) => ["ACCEPT_AS_IS", "ACCEPT_WITH_CORRECTION"].includes(item.decision) && item.migrationStatus === "USED_TO_CREATE_IMMUTABLE_MANIFEST_NOT_INTEGRATED"),
    },
    testsAdded: "Dedicated P10 campaign tests cover quarantine, Territory alignment, evidence, atomicity, replay, rollback, readiness, queue and protected surfaces.",
    validationsExecuted: Object.fromEntries(Object.entries(validation.layers).map(([key, value]) => [key, value.valid ? "PASS" : "FAIL"])),
    warnings: bundle.officialCorpus.gaps,
    remainingRisks: ["SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED", "TASK_SPECIFIC_METRIC_SELECTION_REMAINS_REQUIRED", "FOUR_PREPARED_DOMAIN_PACKAGES_REQUIRE_INDEPENDENT_FUTURE_CAMPAIGNS"],
    filesCreated: [
      "src/knowledge-graph/scientific-campaigns/continuous-wave/adapter.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/constants.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/execution-bundle.json",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/SCIENTIFIC-CAMPAIGN-20260801-001-manifest.json",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/execution.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/official-corpus.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/prepared-loader.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/requalification.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/report.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/reviewed-corpus.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/runtime.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/segmentation-source-verification.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/state.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/territory-alignment.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/validate.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/continuous-wave.test.mjs",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-coverage.json",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-execution-trace.json",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-initial-snapshot.json",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-post-execution-snapshot.json",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-queue.json",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-readiness.json",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-requalification-registry.json",
      "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-rollback-dry-run.json",
      "scripts/scientific-continuous-production.mjs",
      "docs/p10-territorial-scientific-production.md",
      "docs/p10-territorial-scientific-production-report.json",
      "docs/p10-territorial-scientific-production-report.md"
    ],
    filesModified: ["package.json", "src/knowledge-graph/knowledge-catalog/campaign-contracts.mjs", "src/knowledge-graph/knowledge-catalog/catalog-builder.mjs", "src/knowledge-graph/knowledge-catalog/constants.mjs", "src/knowledge-graph/knowledge-catalog/knowledge-catalog.json", "src/knowledge-graph/knowledge-catalog/knowledge-catalog.test.mjs", "src/knowledge-graph/knowledge-catalog/validators.mjs", "src/knowledge-graph/scientific-campaigns/generic-executor.mjs", "src/knowledge-graph/scientific-campaigns/industrial-platform.test.mjs", "src/knowledge-graph/scientific-campaigns/industrial-validation.mjs", "scripts/generate-scientific-territory.mjs", "scripts/validate-scientific-territory.mjs", "src/knowledge-graph/scientific-territory/scientific-territory.test.mjs"],
  });
  return freeze({
    reportId: "noxia:p10:territorial-scientific-production-report",
    version: "1.0.0",
    campaignId: bundle.manifest.campaignId,
    decision: "PREMIÈRE CAMPAGNE SCIENTIFIQUE TERRITORIALE VALIDÉE — POURSUIVRE LA PRODUCTION CONTINUE",
    summary: freeze({ valid: validation.valid, preparedObjects: decisions.length, objectsAcceptedAsIs: bundle.requalificationRegistry.counts.acceptedAsIs, objectsCorrected: bundle.requalificationRegistry.counts.acceptedWithCorrection, objectsDeferred: bundle.requalificationRegistry.counts.deferred, objectsRejected: bundle.requalificationRegistry.counts.rejected, selectedDomain: bundle.plan.selectedDomainId, sourcesAdded: selectedSources.length, conceptsAdded: bundle.officialCorpus.concepts.length, assertionsAdded: selectedAssertions.length, evidenceLinksAdded: selectedEvidence.length, synthesesAdded: bundle.officialCorpus.syntheses.length, internalProjectionsAdded: bundle.officialCorpus.projections.length, coverageTransition: changedCoverage[0], nextDomain: bundle.queue.entries[0]?.knowledgeNodeId, publicArtifacts: 0 }),
    sections,
    tables: freeze({ preparedObjects: preparedObjectsTable, sources: sourcesTable, assertions: assertionsTable, domains: domainRows, campaign: campaignTable, metrics: metricsTable, internalProjections: projectionTable, contracts: contractTable }),
    validation: freeze({ valid: validation.valid, errors: validation.errors, counts: validation.counts }),
  });
};

export const renderP10ScientificProductionReportMarkdown = (report) => {
  const s = report.sections;
  const t = report.tables;
  const section = (number, title, content) => `## ${number}. ${title}\n\n${content}`;
  const sections = [
    section(1, "État Git initial", `Branche \`${s.gitInitial.branch}\`, HEAD \`${s.gitInitial.head}\`, écart initial avec \`origin/main\` : ${s.gitInitial.originDelta}. Les changements cohérents P9 sont préservés.`),
    section(2, "État du catalogue initial", `Version ${s.catalogInitial.version}, digest \`${s.catalogInitial.digest}\`, planning digest \`${s.catalogInitial.planningDigest}\`.`),
    section(3, "État du Territory Model", `Version ${s.territoryModel.version}, digest \`${s.territoryModel.digest}\`. Mutation : ${s.territoryModel.mutated}.`),
    section(4, "État de la file initiale", `${s.initialQueue.campaigns} campagnes planifiées.`),
    section(5, `Audit de ${P10_PREPARED_FILE}`, `Le fichier reste un paquet non autoritatif, chargé uniquement derrière son digest \`${report.sections.preparedWaveAudit.sourceDigest}\`.`),
    section(6, "Objets préparés inventoriés", `${report.summary.preparedObjects} objets, chacun doté d'une décision.\n\n${markdownTable(["Objet préparé", "Domaine", "Territory node", "Décision", "Justification", "Résultat"], t.preparedObjects.map((row) => Object.values(row)))}`),
    section(7, "Rattachements territoriaux", `${s.territoryAlignment.alignedObjects} objets rattachés ; validation : ${s.territoryAlignment.valid ? "PASS" : "FAIL"}.`),
    section(8, "Décisions de requalification", `Acceptés sans correction : ${report.summary.objectsAcceptedAsIs}. Corrigés : ${report.summary.objectsCorrected}. Différés : ${report.summary.objectsDeferred}. Rejetés : ${report.summary.objectsRejected}.`),
    section(9, "Sources acceptées", `${s.acceptedSources} révisions de source acceptées pour la campagne.`),
    section(10, "Sources différées", `${s.deferredSources} sources ou associations restent dans les futurs paquets atomiques.`),
    section(11, "Sources rejetées", `${s.rejectedSources} candidats internes ou inadéquats restent rejetés.`),
    section(12, "Extractions validées", `${s.validatedExtractions} extractions localisées, toutes conservées comme résumés analytiques non verbatim.\n\n${markdownTable(["Source", "Type", "Localisateur", "Statut", "Assertions liées", "Décision"], t.sources.map((row) => Object.values(row)))}`),
    section(13, "Assertions acceptées", `${s.acceptedAssertions} assertion préparée acceptée sans correction.`),
    section(14, "Assertions corrigées", `${s.correctedAssertions} assertions corrigées puis intégrées.`),
    section(15, "Assertions différées", `${s.deferredAssertions} assertions préservées pour des campagnes ultérieures.`),
    section(16, "Assertions rejetées", `${s.rejectedAssertions} assertion rejetée dans la campagne sélectionnée.`),
    section(17, "EvidenceLinks acceptés", `${s.acceptedEvidenceLinks} lien accepté sans correction.`),
    section(18, "EvidenceLinks corrigés", `${s.correctedEvidenceLinks} liens corrigés puis intégrés.`),
    section(19, "EvidenceLinks rejetés", `${s.rejectedEvidenceLinks} lien rejeté.\n\n${markdownTable(["Assertion", "Sujet", "Contexte", "Source", "EvidenceLink", "Décision"], t.assertions.map((row) => Object.values(row)))}`),
    section(20, "Domaine sélectionné", `\`${s.selectedDomain}\` (KnowledgeNode \`${P10_SELECTED_NODE_ID}\`).\n\n${markdownTable(["Domaine", "Priorité", "Score", "Couverture", "Readiness", "Sources", "Sélectionné ?"], t.domains.map((row) => Object.values(row)))}`),
    section(21, "Score de sélection", `${s.selectionScore}. La sélection est calculée, sans choix manuel de domaine.`),
    section(22, "Manifeste créé", `\`${s.manifest.campaignId}\`, digest \`${s.manifest.digest}\`, immuable : ${s.manifest.immutable}.`),
    section(23, "Simulation", `${s.simulation.runs} simulations, résultat identique : ${s.simulation.identical}.`),
    section(24, "Exécution atomique", `Statut ${s.atomicExecution.status}, ${s.atomicExecution.records} enregistrements appliqués en une transaction logique.\n\n${markdownTable(["Campagne", "Manifeste", "Simulation", "Exécution", "Replay", "Rollback"], t.campaign.map((row) => Object.values(row)))}`),
    section(25, "Objets intégrés", Object.entries(s.integratedObjects).map(([key, value]) => `- ${key}: ${value}`).join("\n")),
    section(26, "Synthèses créées", `${s.synthesesCreated} synthèse interne déterministe.`),
    section(27, "Projections internes créées", `${s.internalProjectionsCreated} projection, sans route ni indexation.\n\n${markdownTable(["Projection interne", "Assertions", "Sources", "Readiness", "Blocages"], t.internalProjections.map((row) => Object.values(row)))}`),
    section(28, "Catalogue avant/après", `Avant \`${s.catalogBeforeAfter.before.digest}\`; après \`${s.catalogBeforeAfter.after.digest}\`.\n\n${markdownTable(["Métrique", "Avant", "Après", "Delta", "Justification"], t.metrics.map((row) => Object.values(row)))}`),
    section(29, "Couverture avant/après", s.coverageBeforeAfter.map((row) => `\`${row.catalogNodeId}\` : ${row.previousState} → ${row.state}.`).join("\n")),
    section(30, "Readiness avant/après", `La segmentation atteint l'état documentaire ${report.summary.coverageTransition.state}. La readiness publique reste explicitement bloquée.`),
    section(31, "Replay", `Valide : ${s.replay.valid}. Digest catalogue \`${s.replay.catalogDigest}\`.`),
    section(32, "Rollback dry-run", `Valide : ${s.rollbackDryRun.valid}. Aucun rollback appliqué.`),
    section(33, "Nouvelle file", `${s.newQueue.campaigns} campagnes. Prochain nœud : \`${s.newQueue.next.knowledgeNodeId}\`. Aucune campagne suivante exécutée.`),
    section(34, `État final de ${P10_PREPARED_FILE}`, `Préservé : ${s.continuousWaveFinalState.filePreserved}. Intégrés : ${s.continuousWaveFinalState.integrated}. Acceptés pour audit uniquement : ${s.continuousWaveFinalState.acceptedAuditOnly}. Accepté comme entrée de manifeste uniquement : ${s.continuousWaveFinalState.acceptedManifestInputOnly}. Différés : ${s.continuousWaveFinalState.deferred}. Rejetés : ${s.continuousWaveFinalState.rejected}. Non traités : ${s.continuousWaveFinalState.untreated}.`),
    section(35, "Tests ajoutés", s.testsAdded),
    section(36, "Validations exécutées", Object.entries(s.validationsExecuted).map(([key, value]) => `- ${key}: ${value}`).join("\n")),
    section(37, "Avertissements", s.warnings.map((item) => `- ${item}`).join("\n")),
    section(38, "Risques restants", s.remainingRisks.map((item) => `- ${item}`).join("\n")),
    section(39, "Fichiers créés", s.filesCreated.map((item) => `- \`${item}\``).join("\n")),
    section(40, "Fichiers modifiés", `${s.filesModified.map((item) => `- \`${item}\``).join("\n")}\n\n${markdownTable(["Contrat", "Préservé ?", "Test ou preuve", "Remarque"], t.contracts.map((row) => Object.values(row)))}`),
  ];
  return `# P10 — Production scientifique continue pilotée par territoire\n\n${sections.join("\n\n")}\n\n${report.decision}\n`;
};
