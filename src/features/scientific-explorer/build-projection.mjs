import knowledgeCatalog from "../../knowledge-graph/knowledge-catalog/knowledge-catalog.json" with { type: "json" };
import { p4rContradictionAssessments } from "../../knowledge-graph/scientific-consolidation/contradictions.mjs";
import {
  p4rInternalScientificProjections,
  p4rScientificSyntheses,
} from "../../knowledge-graph/scientific-consolidation/corpus.mjs";
import {
  consolidatedAssertionRevisions,
  consolidatedEvidenceLinks,
} from "../../knowledge-graph/scientific-consolidation/review.mjs";
import { consolidatedSourceRevisions } from "../../knowledge-graph/scientific-consolidation/sources.mjs";
import {
  hepaticImagingAssertionRevisions,
  hepaticImagingContextDifferences,
  hepaticImagingEvidenceLinks,
  hepaticImagingInternalProjections,
  hepaticImagingScientificSyntheses,
  hepaticImagingSourceRevisions,
} from "../../knowledge-graph/scientific-campaigns/hepatic-imaging.mjs";
import { officialContinuousTerritorialCampaignCorpus } from "../../knowledge-graph/scientific-campaigns/territorial-wave/official-corpus.mjs";
import {
  multidomainAssertionRevisions,
  multidomainEvidenceLinks,
} from "../../knowledge-graph/scientific-multidomain/assertions.mjs";
import { multidomainContradictionAssessments } from "../../knowledge-graph/scientific-multidomain/contradictions.mjs";
import { multidomainInternalProjections } from "../../knowledge-graph/scientific-multidomain/projections.mjs";
import { multidomainSourceRevisions } from "../../knowledge-graph/scientific-multidomain/sources.mjs";
import { multidomainScientificSyntheses } from "../../knowledge-graph/scientific-multidomain/synthesis.mjs";
import { sha256Digest } from "../../knowledge-graph/migration/stable-json.mjs";

const unique = (values = []) => [...new Set(values.filter(Boolean))].sort((left, right) => String(left).localeCompare(String(right)));
const asArray = (value) => Array.isArray(value) ? value : value === null || value === undefined ? [] : [value];
const lastSegment = (value) => String(value ?? "").split(":").at(-1);
const recordId = (record, fields) => fields.map((field) => record?.[field]).find(Boolean) ?? null;
const uniqueRecords = (records, fields) => {
  const byId = new Map();
  for (const record of records.flat()) {
    const id = recordId(record, fields);
    if (id && !byId.has(id)) byId.set(id, record);
  }
  return [...byId.values()].sort((left, right) => recordId(left, fields).localeCompare(recordId(right, fields)));
};

const sourceRegistry = uniqueRecords([
  consolidatedSourceRevisions,
  multidomainSourceRevisions,
  hepaticImagingSourceRevisions,
  officialContinuousTerritorialCampaignCorpus.sources,
], ["revisionId"]);
const assertionRegistry = uniqueRecords([
  consolidatedAssertionRevisions,
  multidomainAssertionRevisions,
  hepaticImagingAssertionRevisions,
  officialContinuousTerritorialCampaignCorpus.assertions,
], ["revisionId"]);
const evidenceRegistry = uniqueRecords([
  consolidatedEvidenceLinks,
  multidomainEvidenceLinks,
  hepaticImagingEvidenceLinks,
  officialContinuousTerritorialCampaignCorpus.evidenceLinks,
], ["evidenceLinkId"]);
const synthesisRegistry = uniqueRecords([
  p4rScientificSyntheses,
  multidomainScientificSyntheses,
  hepaticImagingScientificSyntheses,
  officialContinuousTerritorialCampaignCorpus.syntheses,
], ["synthesisId"]);
const projectionRegistry = uniqueRecords([
  p4rInternalScientificProjections,
  multidomainInternalProjections,
  hepaticImagingInternalProjections,
  officialContinuousTerritorialCampaignCorpus.projections,
], ["projectionId"]);
const contradictionRegistry = uniqueRecords([
  p4rContradictionAssessments,
  multidomainContradictionAssessments,
  hepaticImagingContextDifferences,
  officialContinuousTerritorialCampaignCorpus.contextDifferences,
], ["contradictionId", "contextDifferenceId"]);

const byId = (records, fields) => new Map(records.map((record) => [recordId(record, fields), record]));
const sourceById = byId(sourceRegistry, ["revisionId"]);
const assertionById = byId(assertionRegistry, ["revisionId"]);
const evidenceById = byId(evidenceRegistry, ["evidenceLinkId"]);
const synthesisById = byId(synthesisRegistry, ["synthesisId"]);
const projectionById = byId(projectionRegistry, ["projectionId"]);
const contradictionById = byId(contradictionRegistry, ["contradictionId", "contextDifferenceId"]);
const catalogNodeById = new Map(knowledgeCatalog.nodes.map((node) => [node.nodeId, node]));

const readyForExplorer = (node) => node.nodeType === "Domain"
  && node.readiness?.editorialProjectionReady?.ready === true
  && node.readiness?.provenanceReady?.ready === true
  && node.readiness?.scientificReady?.ready === true
  && node.readiness?.synthesisReady?.ready === true;

const scoreCandidate = (node) => {
  const metrics = node.metrics ?? {};
  const modalityCount = node.children?.filter((id) => id.includes(":modality:")).length ?? 0;
  const sourceCount = metrics.scientificSourceCount ?? 0;
  const assertionCoverage = node.assertionCoverage?.ratio ?? 0;
  const sourceCoverage = node.sourceCoverage?.ratio ?? 0;
  const components = {
    sufficientAssertionCoverage: assertionCoverage * 25,
    sufficientSourceCoverage: sourceCoverage * 20,
    sourceQuality: sourceCount ? ((metrics.fullTextSourceCount ?? 0) / sourceCount) * 20 : 0,
    deterministicSynthesisAvailable: (metrics.synthesisCount ?? 0) > 0 ? 12.5 : 0,
    internalProjectionAvailable: (metrics.projectionCount ?? 0) > 0 ? 12.5 : 0,
    implementationSimplicity: (metrics.assertionCount ?? 0) <= 24 && modalityCount <= 1 ? 10 : modalityCount <= 2 ? 6 : 2,
  };
  return {
    components,
    score: Number(Object.values(components).reduce((sum, value) => sum + value, 0).toFixed(4)),
  };
};

export const selectScientificExplorerPilot = (nodes = knowledgeCatalog.nodes) => {
  const candidates = nodes.filter(readyForExplorer).map((node) => ({ node, ...scoreCandidate(node) }));
  if (!candidates.length) throw new Error("P12_NO_EDITORIAL_READY_DOMAIN");
  return candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    const leftIsSegmentation = left.node.nodeId.endsWith(":domain:segmentation");
    const rightIsSegmentation = right.node.nodeId.endsWith(":domain:segmentation");
    if (leftIsSegmentation !== rightIsSegmentation) return leftIsSegmentation ? -1 : 1;
    return left.node.nodeId.localeCompare(right.node.nodeId);
  })[0];
};

const humanize = (value) => {
  const token = lastSegment(value).replace(/[_-]+/g, " ").trim();
  if (!token) return "Information non renseignée";
  const replacements = new Map([
    ["ecv", "ECV"], ["irm", "IRM"], ["ct", "CT"], ["t1", "T1"], ["t2", "T2"],
    ["molli", "MOLLI"], ["sasha", "SASHA"], ["shmolli", "ShMOLLI"], ["cmro2", "CMRO2"], ["oef", "OEF"],
  ]);
  return token.split(" ").map((part) => replacements.get(part.toLowerCase()) ?? part.toLowerCase()).join(" ").replace(/^./, (letter) => letter.toUpperCase());
};

const labelFor = (value) => catalogNodeById.get(value)?.preferredLabel ?? humanize(value);
const valueLabel = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number") return labelFor(value);
  if (typeof value === "object") {
    const amount = value.value ?? value.estimate ?? value.literalValue ?? null;
    const unit = value.unit ? labelFor(value.unit) : null;
    return amount === null ? null : [amount, unit].filter(Boolean).join(" ");
  }
  return String(value);
};
const displayItem = (value) => ({ id: String(value), label: labelFor(value) });

const assertionModalities = (assertion) => unique([
  ...asArray(assertion.modality),
  ...asArray(assertion.facets?.modalities),
  ...asArray(assertion.context?.dimensions)
    .filter((dimension) => dimension.dimension === "modality" && dimension.operator !== "NOT_APPLICABLE")
    .flatMap((dimension) => [...asArray(dimension.value), ...asArray(dimension.values)]),
]).filter((value) => value !== "NOT_APPLICABLE" && value !== "UNKNOWN");

const assertionConcepts = (assertion) => unique([
  assertion.subjectEntityId,
  assertion.objectEntityId,
  ...asArray(assertion.facets?.concepts),
]).filter((id) => catalogNodeById.has(id) && !id.includes(":modality:"));

const domainFacetItem = (domainNode, value) => {
  const exact = catalogNodeById.get(value);
  const childId = exact ? value : domainNode.children?.find((id) => lastSegment(id) === lastSegment(value));
  const resolvedId = childId ?? String(value);
  return { id: resolvedId, key: lastSegment(value), label: labelFor(resolvedId) };
};

const idList = (records, field) => unique(records.map((record) => record?.[field] ?? record?.id ?? record).filter((id) => typeof id === "string"));

const selectRecords = (ids, index) => unique(ids).map((id) => index.get(id)).filter(Boolean);

const sourceYear = (source) => {
  const candidate = source.publicationDate ?? source.publishedAt ?? source.year ?? null;
  const match = String(candidate ?? "").match(/\d{4}/);
  return match ? Number(match[0]) : null;
};

const editorialLinksFor = (domainNode) => {
  const links = [];
  const childIds = new Set(domainNode.children ?? []);
  const primary = {
    "ecv-t1": { label: "ECV et mapping T1/T2", to: "/ecv-mapping-t1-t2-irm-cardiaque" },
    segmentation: { label: "Segmentation IRM", to: "/segmentation-irm" },
    "cerebral-perfusion": { label: "Perfusion cérébrale", to: "/perfusion-cerebrale" },
    "oef-cmro2": { label: "Métabolisme cérébral", to: "/metabolisme-cerebral" },
    "quality-control": { label: "Méthodologie quantitative", to: "/methodologie-imagerie-quantitative" },
  }[lastSegment(domainNode.nodeId)];
  if (primary) links.push(primary);
  if (childIds.has("noxia:radiology:modality:irm")) links.push({ label: "IRM quantitative", to: "/irm-imagerie-quantitative" });
  if (childIds.has("noxia:radiology:modality:ct")) links.push({ label: "CT quantitative", to: "/ct-imagerie-quantitative" });
  links.push({ label: "Méthodologie d’imagerie quantitative", to: "/methodologie-imagerie-quantitative" });
  links.push({ label: "Références et publications", to: "/references-publications" });
  return [...new Map(links.map((link) => [link.to, link])).values()];
};

const resolveDomainRecords = (node) => {
  const provenance = node.provenance ?? {};
  return {
    assertions: selectRecords(provenance.assertionRevisionIds, assertionById),
    evidenceLinks: selectRecords(provenance.evidenceLinkIds, evidenceById),
    sources: selectRecords(provenance.scientificSourceRevisionIds, sourceById),
    syntheses: selectRecords(provenance.synthesisIds, synthesisById),
    projections: selectRecords(provenance.projectionIds, projectionById),
    contradictions: selectRecords(provenance.contradictionIds, contradictionById),
  };
};

const simplifyContext = (context) => asArray(context?.dimensions).map((dimension) => ({
  dimension: dimension.dimension,
  label: humanize(dimension.dimension),
  operator: dimension.operator,
  value: valueLabel(dimension.value) ?? (asArray(dimension.values).map(valueLabel).filter(Boolean).join(", ") || null),
  unknown: dimension.unknownState ?? null,
}));

const simplifyContradiction = (contradiction) => ({
  id: contradiction.contradictionId ?? contradiction.contextDifferenceId ?? sha256Digest(contradiction),
  classification: contradiction.finalClassification ?? contradiction.classification ?? contradiction.type ?? "CONTEXT_DIFFERENCE",
  label: humanize(contradiction.finalClassification ?? contradiction.classification ?? contradiction.type ?? "CONTEXT_DIFFERENCE"),
});

export const buildScientificExplorerProjection = () => {
  const selected = selectScientificExplorerPilot();
  const domainNode = selected.node;
  const records = resolveDomainRecords(domainNode);
  if (!records.assertions.length || !records.evidenceLinks.length || !records.sources.length || !records.syntheses.length) {
    throw new Error(`P12_SELECTED_DOMAIN_RECORDS_INCOMPLETE:${domainNode.nodeId}`);
  }

  const evidenceForAssertion = new Map();
  for (const link of records.evidenceLinks) {
    const current = evidenceForAssertion.get(link.assertionRevisionId) ?? [];
    current.push(link);
    evidenceForAssertion.set(link.assertionRevisionId, current);
  }

  const assertions = records.assertions.map((assertion) => {
    const links = evidenceForAssertion.get(assertion.revisionId) ?? [];
    return {
      id: assertion.revisionId,
      subjectId: assertion.subjectEntityId,
      subjectLabel: labelFor(assertion.subjectEntityId),
      predicate: assertion.predicate,
      objectId: assertion.objectEntityId ?? null,
      objectLabel: valueLabel(assertion.objectEntityId ?? assertion.literalValue ?? assertion.quantitativeValue ?? assertion.normativeStatement),
      statementText: typeof assertion.statement?.text === "string" ? assertion.statement.text : null,
      assertionType: assertion.assertionType,
      status: assertion.status,
      reviewState: assertion.reviewState ?? assertion.reviewerStatus ?? null,
      polarity: assertion.polarity,
      confidence: assertion.confidence ?? "UNKNOWN",
      evidenceQuality: typeof assertion.evidenceQuality === "string" ? assertion.evidenceQuality : assertion.evidenceQuality?.methodologicalQuality ?? "UNKNOWN",
      scientificMaturity: assertion.scientificMaturity ?? "UNKNOWN",
      humanReviewed: assertion.humanReviewed === true
        || (assertion.scientificHumanReview !== null && assertion.scientificHumanReview !== undefined),
      conceptIds: assertionConcepts(assertion),
      modalityIds: assertionModalities(assertion),
      metricKeys: unique(asArray(assertion.facets?.measurements)).map(lastSegment),
      taskKeys: unique(asArray(assertion.facets?.techniques)).map(lastSegment),
      evidenceTypeKey: typeof assertion.evidenceQuality === "string"
        ? lastSegment(assertion.evidenceQuality)
        : lastSegment(assertion.evidenceQuality?.methodologicalQuality ?? "UNKNOWN"),
      contexts: simplifyContext(assertion.context),
      limitations: unique(asArray(assertion.limitations)).map(displayItem),
      evidenceLinkIds: links.map((link) => link.evidenceLinkId).sort(),
    };
  }).sort((left, right) => left.id.localeCompare(right.id));

  const assertionCounts = new Map();
  for (const assertion of assertions) for (const conceptId of assertion.conceptIds) assertionCounts.set(conceptId, (assertionCounts.get(conceptId) ?? 0) + 1);
  const concepts = [...assertionCounts]
    .map(([id, assertionCount]) => {
      const node = catalogNodeById.get(id);
      return node ? {
        id,
        key: lastSegment(id),
        label: node.preferredLabel,
        description: node.description ?? null,
        type: node.nodeType,
        assertionCount,
      } : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.assertionCount - left.assertionCount || left.label.localeCompare(right.label));
  const conceptKeys = new Set();
  for (const concept of concepts) {
    if (conceptKeys.has(concept.key)) throw new Error(`P12_CONCEPT_KEY_COLLISION:${concept.key}`);
    conceptKeys.add(concept.key);
  }
  const facetOptions = (field) => {
    const counts = new Map();
    for (const assertion of assertions) {
      for (const key of asArray(assertion[field])) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts]
      .filter(([, count]) => count > 0 && count < assertions.length)
      .map(([key, assertionCount]) => ({ ...domainFacetItem(domainNode, key), assertionCount }))
      .sort((left, right) => right.assertionCount - left.assertionCount || left.label.localeCompare(right.label));
  };
  const metrics = facetOptions("metricKeys");
  const tasks = facetOptions("taskKeys");
  const evidenceTypes = facetOptions("evidenceTypeKey");

  const evidenceLinks = records.evidenceLinks.map((link) => ({
    id: link.evidenceLinkId,
    assertionId: link.assertionRevisionId,
    sourceId: link.sourceRevisionId,
    relationType: link.relationType,
    locator: link.locator ?? null,
    confidence: link.confidence ?? "UNKNOWN",
    extractionType: link.extraction?.extractionType ?? null,
    analyticalSummary: link.extraction?.analyticalSummary ?? null,
    limitations: unique(asArray(link.limitations)).map(displayItem),
  })).sort((left, right) => left.id.localeCompare(right.id));

  const sources = records.sources.map((source) => ({
    id: source.revisionId,
    title: source.title,
    authors: asArray(source.authors),
    year: sourceYear(source),
    journal: source.journal ?? source.authority ?? null,
    sourceType: source.sourceType ?? "SCIENTIFIC_PUBLICATION",
    documentStatus: source.documentStatus ?? source.status ?? "UNKNOWN",
    doi: source.doi ?? null,
    pmid: source.pmid ?? null,
    url: source.officialMetadataUrl ?? source.url ?? null,
    fullTextUrl: source.officialFullTextUrl ?? null,
    abstractOnly: source.abstractOnly === true,
  })).sort((left, right) => (right.year ?? 0) - (left.year ?? 0) || left.title.localeCompare(right.title));

  const syntheses = records.syntheses.map((synthesis) => ({
    id: synthesis.synthesisId,
    key: synthesis.key ?? lastSegment(synthesis.synthesisId),
    label: synthesis.label ?? humanize(synthesis.key ?? lastSegment(synthesis.synthesisId)),
    assertionIds: idList(asArray(synthesis.applicableAssertions), "revisionId"),
    conceptIds: unique(asArray(synthesis.concepts)),
    modalityIds: unique(asArray(synthesis.query?.modalities)),
    limitations: unique(asArray(synthesis.limitations)).map(displayItem),
    contradictions: asArray(synthesis.contradictions).map(simplifyContradiction),
    convergence: synthesis.convergence?.state ?? null,
    consensus: {
      detected: synthesis.consensus?.detected === true,
      state: synthesis.consensus?.state ?? "NO_EXPLICIT_CURRENT_CONSENSUS",
    },
    openQuestions: unique(asArray(synthesis.openQuestions)).map(displayItem),
    missingData: unique(asArray(synthesis.missingData)).map(displayItem),
    confidence: synthesis.confidence ?? synthesis.overallConfidence ?? "UNKNOWN",
    statisticalMetaAnalysisPerformed: synthesis.statisticalMetaAnalysisPerformed === true,
    humanReviewed: synthesis.scientificHumanReview !== null && synthesis.scientificHumanReview !== undefined,
  })).sort((left, right) => left.id.localeCompare(right.id));

  const data = {
    version: "1.0.0",
    sourceCatalog: {
      catalogId: knowledgeCatalog.catalogId,
      version: knowledgeCatalog.version,
      digest: knowledgeCatalog.digest,
      planningDigest: knowledgeCatalog.planningDigest,
    },
    selectedDomain: {
      id: domainNode.nodeId,
      key: lastSegment(domainNode.nodeId),
      label: domainNode.preferredLabel,
      description: domainNode.description,
      status: domainNode.status,
      selection: {
        rule: "EDITORIAL_READY_RICHNESS_DEMONSTRATION_SIMPLICITY_V1",
        score: selected.score,
        components: selected.components,
        tieBreaker: "SEGMENTATION_THEN_STABLE_ID",
      },
      metrics: domainNode.metrics,
      readiness: {
        scientific: domainNode.readiness.scientificReady.ready,
        provenance: domainNode.readiness.provenanceReady.ready,
        synthesis: domainNode.readiness.synthesisReady.ready,
        editorialProjection: domainNode.readiness.editorialProjectionReady.ready,
        publicPublication: domainNode.readiness.publicPublicationReady.ready,
      },
    },
    defaultConceptKey: null,
    concepts,
    facets: {
      metrics,
      tasks,
      evidenceTypes,
    },
    assertions,
    evidenceLinks,
    sources,
    syntheses,
    contradictions: records.contradictions.map(simplifyContradiction),
    projectionIds: records.projections.map((projection) => projection.projectionId).sort(),
    editorialLinks: editorialLinksFor(domainNode),
    illustration: null,
    safeguards: {
      sourceOfTruth: "SCIENTIFIC_KNOWLEDGE_GRAPH",
      mentionsAreEvidence: false,
      missingDataVisible: true,
      humanScientificReviewPerformed: false,
      publicPublicationReady: false,
    },
  };
  return Object.freeze({ ...data, digest: sha256Digest(data) });
};
