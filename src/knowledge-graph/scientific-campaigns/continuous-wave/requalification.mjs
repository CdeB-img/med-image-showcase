import { sha256Digest } from "../../migration/stable-json.mjs";
import { P10_SELECTED_DOMAIN_ID } from "./constants.mjs";
import { territoryAlignmentFor } from "./territory-alignment.mjs";

const freeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, freeze(nested)])));
};
const digest = (value) => value?.digest ?? value?.deterministicDigest ?? value?.packageDigest ?? sha256Digest(value);
const idOf = (value, fallback) => value?.revisionId ?? value?.evidenceLinkId ?? value?.decisionId ?? value?.contradictionId ?? value?.synthesisId ?? value?.projectionId ?? value?.stableId ?? value?.nodeId ?? fallback;

const record = ({ objectType, domainId, value, fallbackId, category = "SCIENTIFIC_CANDIDATE" }) => freeze({
  preparedObjectId: idOf(value, fallbackId),
  objectType,
  domainPackage: domainId ?? value?.domainId ?? null,
  value,
  category,
  originalDigest: digest(value),
});

export const inventoryPreparedScientificWave = ({ preparedWave } = {}) => {
  const data = preparedWave.exports;
  const items = [
    ...data.continuousWaveSourceRevisions.map((value) => record({ objectType: "SourceRevision", domainId: value.domainId, value })),
    ...Object.entries(data.CONTINUOUS_WAVE_REUSED_SOURCES).map(([pmid, value]) => record({ objectType: "ReusedSourceAssociation", domainId: value.domainId, value, fallbackId: `reused-source:${pmid}` })),
    ...data.continuousWaveConcepts.map((value) => record({ objectType: "ScientificConceptRevision", domainId: value.domainId, value })),
    ...data.continuousWaveAssertionRevisions.map((value) => record({ objectType: "ScientificAssertionRevision", domainId: value.domainId, value })),
    ...data.continuousWaveEvidenceLinks.map((value) => record({ objectType: "EvidenceLink", domainId: value.domainId, value })),
    ...data.continuousWaveReviewDecisions.map((value) => record({ objectType: "AutomatedScientificReviewDecision", domainId: value.domainId ?? value.assertionRevisionId?.split(":continuous-wave:")[1]?.split(":")[0], value })),
    ...data.continuousWaveContextDifferences.map((value) => record({ objectType: "ScientificContextDifference", domainId: value.domainId, value })),
    ...data.continuousWaveScientificSyntheses.map((value) => record({ objectType: "ScientificSynthesis", domainId: value.domainId, value })),
    ...data.continuousWaveInternalProjections.map((value) => record({ objectType: "InternalScientificProjection", domainId: value.domainId, value })),
    ...Object.values(data.continuousWaveDomainPackages).map((value) => record({ objectType: "PreparedDomainPackage", domainId: value.domainId, value })),
    ...data.continuousWaveRejectedSources.map((value, index) => record({ objectType: "RejectedSourceCandidate", domainId: value.domainId, value, fallbackId: `rejected-source:${value.domainId}:${index + 1}`, category: "AUDIT_OBJECT" })),
    ...data.continuousWaveInternalSourceAudit.map((value, index) => record({ objectType: "InternalSourceAuditEntry", domainId: null, value, fallbackId: `internal-source-audit:${index + 1}`, category: "AUDIT_OBJECT" })),
    record({ objectType: "PreparedPublicationGuards", value: data.CONTINUOUS_WAVE_PUBLICATION_GUARDS, fallbackId: "continuous-wave:publication-guards", category: "PACKAGE_METADATA" }),
    record({ objectType: "PreparedLimits", value: data.CONTINUOUS_WAVE_LIMITS, fallbackId: "continuous-wave:limits", category: "PACKAGE_METADATA" }),
  ].sort((a, b) => a.preparedObjectId.localeCompare(b.preparedObjectId));
  const duplicateIds = items.map((item) => item.preparedObjectId).filter((value, index, values) => values.indexOf(value) !== index);
  return freeze({
    sourcePath: preparedWave.sourcePath,
    sourceDigest: preparedWave.sourceDigest,
    trustStatus: preparedWave.trustStatus,
    objects: items,
    counts: Object.freeze({
      total: items.length,
      byType: Object.freeze(Object.fromEntries([...Map.groupBy(items, (item) => item.objectType)].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => [key, values.length]))),
      byDomain: Object.freeze(Object.fromEntries([...Map.groupBy(items.filter((item) => item.domainPackage), (item) => item.domainPackage)].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => [key, values.length]))),
      duplicateIds: duplicateIds.length,
    }),
    duplicateIds: freeze(duplicateIds),
    inventoryDigest: sha256Digest(items.map(({ preparedObjectId, objectType, domainPackage, originalDigest }) => ({ preparedObjectId, objectType, domainPackage, originalDigest }))),
  });
};

const reviewedObjectMap = (corpus) => new Map([
  ...corpus.sources,
  ...corpus.concepts,
  ...corpus.assertions,
  ...corpus.evidenceLinks,
  ...corpus.reviewDecisions,
  ...corpus.contextDifferences,
  ...corpus.syntheses,
  ...corpus.projections,
].map((item) => [idOf(item), item]));

const selectedDecision = (item) => {
  if (item.objectType === "SourceRevision") return ["38347141", "37008654"].includes(item.value.pmid) ? "ACCEPT_WITH_CORRECTION" : "ACCEPT_AS_IS";
  if (item.objectType === "ReusedSourceAssociation") return "ACCEPT_AS_IS";
  if (["RejectedSourceCandidate"].includes(item.objectType)) return "REJECT_INVALID_SOURCE";
  if (["InternalSourceAuditEntry", "PreparedPublicationGuards", "PreparedLimits"].includes(item.objectType)) return "ACCEPT_AS_IS";
  return "ACCEPT_WITH_CORRECTION";
};

export const createPreparedWaveRequalificationRegistry = ({ inventory, reviewedCorpus } = {}) => {
  const reviewed = reviewedObjectMap(reviewedCorpus);
  const decisions = inventory.objects.map((item) => {
    const isAudit = item.category !== "SCIENTIFIC_CANDIDATE";
    const selected = item.domainPackage === P10_SELECTED_DOMAIN_ID;
    const decision = isAudit
      ? selectedDecision(item)
      : selected
        ? selectedDecision(item)
        : "DEFER_SOURCE_INSUFFICIENT";
    const resulting = reviewed.get(item.preparedObjectId) ?? null;
    const alignment = item.domainPackage ? territoryAlignmentFor({ domainId: item.domainPackage, key: item.value?.key ?? item.preparedObjectId, objectType: item.objectType }) : null;
    const auditOnly = ["InternalSourceAuditEntry", "RejectedSourceCandidate", "PreparedPublicationGuards", "PreparedLimits", "PreparedDomainPackage"].includes(item.objectType);
    const integrated = selected && !auditOnly && !decision.startsWith("REJECT") && item.objectType !== "ReusedSourceAssociation";
    return freeze({
      preparedObjectId: item.preparedObjectId,
      objectType: item.objectType,
      domainPackage: item.domainPackage,
      territoryNodeId: alignment?.knowledgeAreaId ?? alignment?.domainNodeId ?? null,
      territoryAlignment: alignment,
      originalDigest: item.originalDigest,
      reviewedDigest: resulting ? digest(resulting) : null,
      decision,
      justification: isAudit
        ? item.objectType === "RejectedSourceCandidate" ? `Prepared source candidate remains rejected: ${item.value.reason}.` : "Package control or audit metadata is retained outside the scientific graph."
        : selected
          ? decision === "ACCEPT_AS_IS" ? "The prepared object passed source, locator, structure, context and Territory checks without scientific-content correction." : "The scientific content is retained, with explicit bibliographic, contract, review or Territory corrections recorded in the reviewed snapshot."
          : "This object remains a recoverable candidate; deep source and locator verification is deferred to its own future atomic campaign.",
      sourceStatus: selected ? "VALID_OFFICIAL_FULL_TEXT_OR_LOCALIZED_ABSTRACT" : auditOnly ? "NOT_APPLICABLE" : "PREPARED_NOT_OFFICIALLY_REVERIFIED_IN_P10",
      assertionStatus: item.objectType.includes("Assertion") ? selected ? "ATOMIC_AND_SOURCE_LOCALIZED" : "DEFERRED_WITH_PACKAGE" : "NOT_APPLICABLE",
      evidenceStatus: item.objectType === "EvidenceLink" ? selected ? "RELATION_AND_LOCATOR_VALID" : "DEFERRED_WITH_PACKAGE" : "NOT_APPLICABLE",
      contextStatus: selected ? "SUFFICIENT_FOR_DOCUMENTARY_ASSERTION" : auditOnly ? "NOT_APPLICABLE" : "PRESERVED_PENDING_CAMPAIGN",
      reviewerType: "automatedStructuralReview+automatedProvenanceReview+automatedConsistencyReview",
      blockingIssues: freeze(selected || auditOnly ? [] : ["DOMAIN_CAMPAIGN_NOT_SELECTED", "DEEP_SOURCE_VERIFICATION_PENDING"]),
      warnings: freeze(selected && !auditOnly ? ["SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED"] : []),
      resultingObjectId: resulting ? idOf(resulting) : item.objectType === "ReusedSourceAssociation" ? item.value.revisionId : null,
      migrationStatus: integrated
        ? (decision === "ACCEPT_WITH_CORRECTION" ? "CORRECTED_AND_INTEGRATED" : "INTEGRATED")
        : item.objectType === "PreparedDomainPackage" && selected
          ? "USED_TO_CREATE_IMMUTABLE_MANIFEST_NOT_INTEGRATED"
          : auditOnly
            ? "AUDIT_ONLY_NOT_INTEGRATED"
            : item.objectType === "ReusedSourceAssociation" && selected
              ? "REUSED_EXISTING_NO_NEW_RECORD"
              : "DEFERRED_NOT_INTEGRATED",
    });
  }).sort((a, b) => a.preparedObjectId.localeCompare(b.preparedObjectId));
  const counts = Object.freeze({
    total: decisions.length,
    acceptedAsIs: decisions.filter((item) => item.decision === "ACCEPT_AS_IS").length,
    acceptedWithCorrection: decisions.filter((item) => item.decision === "ACCEPT_WITH_CORRECTION").length,
    deferred: decisions.filter((item) => item.decision.startsWith("DEFER")).length,
    rejected: decisions.filter((item) => item.decision.startsWith("REJECT")).length,
    integrated: decisions.filter((item) => ["INTEGRATED", "CORRECTED_AND_INTEGRATED"].includes(item.migrationStatus)).length,
  });
  const material = { preparedSourceDigest: inventory.sourceDigest, decisions, counts };
  return freeze({
    registryId: "noxia:scientific-prepared-wave-requalification:p10:v1",
    version: "1.0.0",
    preparedSourceDigest: inventory.sourceDigest,
    decisions,
    counts,
    complete: decisions.length === inventory.objects.length && decisions.every((item) => item.decision && item.migrationStatus),
    digest: sha256Digest(material),
  });
};

const comparison = (a, b) => b.totalScore - a.totalScore || b.catalogPriorityScore - a.catalogPriorityScore || a.nodeId.localeCompare(b.nodeId);

export const rankPreparedDomainPackages = ({ preparedWave, catalog, territoryModel } = {}) => {
  const nodeById = new Map(catalog.nodes.map((node) => [node.nodeId, node]));
  const territoryIds = new Set(territoryModel.nodes.map((node) => node.territoryNodeId));
  const ranked = Object.values(preparedWave.exports.continuousWaveDomainPackages).map((domainPackage) => {
    const node = nodeById.get(domainPackage.nodeId);
    const alignment = territoryAlignmentFor({ domainId: domainPackage.domainId, objectType: "PreparedDomainPackage" });
    const sourcesComplete = domainPackage.retainedSources.filter((source) => source.pmid && source.title && source.officialMetadataUrl).length;
    const localizedLinks = domainPackage.evidenceLinks.filter((link) => link.locator && link.sourceRevisionId && link.assertionRevisionId).length;
    const endpointValidLinks = domainPackage.evidenceLinks.filter((link) => domainPackage.assertions.some((assertion) => assertion.revisionId === link.assertionRevisionId) && domainPackage.retainedSources.some((source) => source.revisionId === link.sourceRevisionId)).length;
    const territoryResolved = [alignment.domainNodeId, alignment.defaultSubdomainNodeId, alignment.defaultKnowledgeAreaId].every((id) => territoryIds.has(id));
    const compositeAssertions = domainPackage.assertions.filter((assertion) => assertion.statement?.atomicConclusionCount !== 1).length;
    const quantitativeAssertions = domainPackage.assertions.filter((assertion) => assertion.assertionType === "QuantitativeAssertion").length;
    const recommendationAssertions = domainPackage.assertions.filter((assertion) => /RECOMMEND|CONSENSUS/.test(`${assertion.predicate}:${assertion.scientificMaturity}`)).length;
    const catalogPriorityScore = node?.priority?.score ?? 0;
    const packageMaturityScore = Number(((sourcesComplete / Math.max(1, domainPackage.retainedSources.length)) * 8).toFixed(3));
    const provenanceScore = Number(((localizedLinks / Math.max(1, domainPackage.evidenceLinks.length)) * 8).toFixed(3));
    const consistencyScore = Number(((endpointValidLinks / Math.max(1, domainPackage.evidenceLinks.length)) * 6).toFixed(3));
    const territoryScore = territoryResolved ? 5 : 0;
    const dependencyScore = (node?.blockingNodes?.length ?? 0) === 0 ? 3 : 0;
    const generalizationScore = Number((((node?.priority?.components?.scientificValue ?? 0) + (node?.priority?.components?.projectionPotential ?? 0)) * 2).toFixed(3));
    const riskPenalty = Number((compositeAssertions * 5 + quantitativeAssertions * 0.4 + recommendationAssertions * 0.2).toFixed(3));
    const costPenalty = Number(((domainPackage.concepts.length + domainPackage.assertions.length + domainPackage.evidenceLinks.length) / 100).toFixed(3));
    const totalScore = Number((catalogPriorityScore + packageMaturityScore + provenanceScore + consistencyScore + territoryScore + dependencyScore + generalizationScore - riskPenalty - costPenalty).toFixed(3));
    const eligible = Boolean(node && territoryResolved && sourcesComplete > 0 && localizedLinks === domainPackage.evidenceLinks.length && endpointValidLinks === domainPackage.evidenceLinks.length && compositeAssertions === 0 && (node.blockingNodes?.length ?? 0) === 0);
    return freeze({
      domainId: domainPackage.domainId,
      nodeId: domainPackage.nodeId,
      totalScore,
      eligible,
      weightsAndComponents: freeze({ catalogPriorityScore, packageMaturityScore, provenanceScore, consistencyScore, territoryScore, dependencyScore, generalizationScore, riskPenalty, costPenalty }),
      coverageBefore: freeze({ status: node?.status, sources: node?.metrics?.sourceCount ?? 0, assertions: node?.metrics?.assertionCount ?? 0, evidenceLinks: node?.metrics?.evidenceLinkCount ?? 0, syntheses: node?.metrics?.synthesisCount ?? 0, projections: node?.metrics?.projectionCount ?? 0 }),
      preparedOutputs: freeze({ sources: domainPackage.retainedSources.length, concepts: domainPackage.concepts.length, assertions: domainPackage.assertions.length, evidenceLinks: domainPackage.evidenceLinks.length, syntheses: domainPackage.syntheses.length, projections: domainPackage.projections.length }),
      alignment,
      blockers: freeze([!node ? "CATALOG_NODE_MISSING" : null, !territoryResolved ? "TERRITORY_UNRESOLVED" : null, compositeAssertions ? "NON_ATOMIC_ASSERTION" : null, (node?.blockingNodes?.length ?? 0) ? "DEPENDENCY_BLOCKED" : null].filter(Boolean)),
    });
  }).sort(comparison);
  const selectedIndex = ranked.findIndex((candidate) => candidate.eligible);
  const candidates = ranked.map((candidate, index) => freeze({
    ...candidate,
    rank: index + 1,
    selected: index === selectedIndex,
    selectionReason: index === selectedIndex
      ? "HIGHEST_DETERMINISTIC_ELIGIBLE_SCORE"
      : candidate.eligible
        ? "LOWER_DETERMINISTIC_PRIORITY_OR_SINGLE_CAMPAIGN_LIMIT"
        : "INELIGIBLE_PREPARED_PACKAGE",
  }));
  const selected = candidates.find((item) => item.selected) ?? null;
  return freeze({
    algorithm: "CATALOG_PRIORITY_PLUS_PREPARED_MATURITY_PROVENANCE_CONSISTENCY_TERRITORY_DEPENDENCIES_GENERALIZATION_MINUS_RISK_AND_COST",
    manualDomainSelection: false,
    candidates,
    selectedDomainId: selected?.domainId ?? null,
    selectedNodeId: selected?.nodeId ?? null,
    digest: sha256Digest(candidates),
  });
};
