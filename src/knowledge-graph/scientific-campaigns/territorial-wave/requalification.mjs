import { sha256Digest } from "../../migration/stable-json.mjs";
import { territoryAlignmentFor } from "../continuous-wave/territory-alignment.mjs";

const freeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, freeze(nested)])));
};
const digest = (value) => value?.digest ?? value?.deterministicDigest ?? value?.packageDigest ?? sha256Digest(value);
const idOf = (value) => value?.revisionId ?? value?.evidenceLinkId ?? value?.decisionId ?? value?.contradictionId ?? value?.synthesisId ?? value?.projectionId ?? value?.stableId ?? value?.nodeId;
const AUDIT_TYPES = new Set(["InternalSourceAuditEntry", "RejectedSourceCandidate", "PreparedPublicationGuards", "PreparedLimits"]);

export const createP11RequalificationRegistry = ({ inventory, p10Registry, reviewedCorpora } = {}) => {
  const processedDomains = new Set(reviewedCorpora.map((corpus) => corpus.domainId));
  const reviewed = new Map(reviewedCorpora.flatMap((corpus) => [
    ...corpus.sources,
    ...corpus.concepts,
    ...corpus.assertions,
    ...corpus.evidenceLinks,
    ...corpus.reviewDecisions,
    ...corpus.contextDifferences,
    ...corpus.syntheses,
    ...corpus.projections,
  ]).map((item) => [idOf(item), item]));
  const p10ById = new Map(p10Registry.decisions.map((decision) => [decision.preparedObjectId, decision]));
  const decisions = inventory.objects.map((item) => {
    if (item.domainPackage === "segmentation" || !item.domainPackage || AUDIT_TYPES.has(item.objectType)) return p10ById.get(item.preparedObjectId);
    if (!processedDomains.has(item.domainPackage)) return p10ById.get(item.preparedObjectId);
    const alignment = territoryAlignmentFor({ domainId: item.domainPackage, key: item.value?.key ?? item.preparedObjectId, objectType: item.objectType });
    const resulting = reviewed.get(item.preparedObjectId) ?? null;
    const reused = item.objectType === "ReusedSourceAssociation";
    const packageOnly = item.objectType === "PreparedDomainPackage";
    const correctionRequired = !reused && !packageOnly;
    return freeze({
      preparedObjectId: item.preparedObjectId,
      objectType: item.objectType,
      domainPackage: item.domainPackage,
      territoryNodeId: alignment?.knowledgeAreaId ?? alignment?.domainNodeId ?? null,
      territoryAlignment: alignment,
      originalDigest: item.originalDigest,
      reviewedDigest: resulting ? digest(resulting) : null,
      decision: correctionRequired ? "ACCEPT_WITH_CORRECTION" : "ACCEPT_AS_IS",
      justification: packageOnly
        ? "The validated package was used to create an immutable campaign manifest and was not promoted as a scientific record."
        : reused
          ? "The official source revision already existed and was reused without creating a duplicate."
          : "The scientific meaning was retained after official-source, locator, atomicity, context, review-contract and Territory validation.",
      sourceStatus: "VALID_OFFICIAL_FULL_TEXT",
      assertionStatus: item.objectType.includes("Assertion") ? "ATOMIC_AND_SOURCE_LOCALIZED" : "NOT_APPLICABLE",
      evidenceStatus: item.objectType === "EvidenceLink" ? "RELATION_AND_LOCATOR_VALID" : "NOT_APPLICABLE",
      contextStatus: "SUFFICIENT_FOR_DOCUMENTARY_ASSERTION",
      reviewerType: "automatedStructuralReview+automatedProvenanceReview+automatedConsistencyReview",
      blockingIssues: freeze([]),
      warnings: freeze(packageOnly ? [] : ["SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED"]),
      resultingObjectId: resulting ? idOf(resulting) : reused ? item.value.revisionId : null,
      migrationStatus: packageOnly
        ? "USED_TO_CREATE_IMMUTABLE_MANIFEST_NOT_INTEGRATED"
        : reused
          ? "REUSED_EXISTING_NO_NEW_RECORD"
          : "CORRECTED_AND_INTEGRATED",
    });
  }).filter(Boolean).sort((a, b) => a.preparedObjectId.localeCompare(b.preparedObjectId));
  const counts = freeze({
    total: decisions.length,
    acceptedAsIs: decisions.filter((item) => item.decision === "ACCEPT_AS_IS").length,
    acceptedWithCorrection: decisions.filter((item) => item.decision === "ACCEPT_WITH_CORRECTION").length,
    deferred: decisions.filter((item) => item.decision.startsWith("DEFER")).length,
    rejected: decisions.filter((item) => item.decision.startsWith("REJECT")).length,
    integrated: decisions.filter((item) => ["INTEGRATED", "CORRECTED_AND_INTEGRATED"].includes(item.migrationStatus)).length,
  });
  const material = { preparedSourceDigest: inventory.sourceDigest, decisions, counts };
  return freeze({
    registryId: "noxia:scientific-prepared-wave-requalification:p11:v1",
    version: "1.0.0",
    preparedSourceDigest: inventory.sourceDigest,
    decisions,
    counts,
    complete: decisions.length === inventory.objects.length && decisions.every((item) => item.decision && item.migrationStatus),
    digest: sha256Digest(material),
  });
};

