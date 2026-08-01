import {
  activeStructuralRelations,
  entityRevisions,
} from "../migration/migrated-knowledge.mjs";
import { sha256Digest } from "../migration/stable-json.mjs";
import {
  p4rContradictionAssessments,
} from "../scientific-consolidation/contradictions.mjs";
import {
  p4rInternalScientificProjections,
  p4rScientificSyntheses,
} from "../scientific-consolidation/corpus.mjs";
import {
  consolidatedAssertionRevisions,
  consolidatedEvidenceLinks,
} from "../scientific-consolidation/review.mjs";
import { consolidatedSourceRevisions } from "../scientific-consolidation/sources.mjs";
import {
  scientificCorpusConceptIdentities,
  scientificCorpusEntityRevisions,
} from "../scientific-corpus/concepts.mjs";
import {
  multidomainAssertionRevisions,
  multidomainEvidenceLinks,
} from "../scientific-multidomain/assertions.mjs";
import { multidomainConcepts } from "../scientific-multidomain/concepts.mjs";
import { multidomainContradictionAssessments } from "../scientific-multidomain/contradictions.mjs";
import { nextScientificWaves } from "../scientific-multidomain/generality.mjs";
import { scientificDomainManifests } from "../scientific-multidomain/manifests.mjs";
import { multidomainInternalProjections } from "../scientific-multidomain/projections.mjs";
import { multidomainSourceRevisions } from "../scientific-multidomain/sources.mjs";
import { multidomainScientificSyntheses } from "../scientific-multidomain/synthesis.mjs";
import { buildScientificEnrichmentCampaigns, campaignSummary } from "./campaign-engine.mjs";
import {
  KNOWLEDGE_CATALOG_GENERATED_AT,
  KNOWLEDGE_CATALOG_ID,
  KNOWLEDGE_CATALOG_SCOPE,
  KNOWLEDGE_CATALOG_VERSION,
  KNOWLEDGE_CATALOG_NAMESPACE,
  READY_LIKE_STATUSES,
} from "./constants.mjs";
import { createKnowledgeNode } from "./knowledge-node-registry.mjs";

const unique = (values = []) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
const asArray = (value) => Array.isArray(value) ? value : value === null || value === undefined ? [] : [value];
const canonicalSourceId = (value) => String(value).replace(/:revision:\d+$/, "");
const domainNodeId = (domainId) => `${KNOWLEDGE_CATALOG_NAMESPACE}:domain:${domainId}`;
const lastSegment = (value) => String(value).split(":").at(-1);
const isIsoDate = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const maxDate = (values) => unique(values.filter(isIsoDate)).sort().at(-1) ?? KNOWLEDGE_CATALOG_GENERATED_AT;

const DOMAIN_LABELS = Object.freeze({
  "ecv-t1": "ECV et mapping T1 myocardique",
  "diffusion-adc": "Diffusion et ADC",
  "cerebral-perfusion": "Perfusion cérébrale",
  "myocardial-tissue-characterization": "Caractérisation tissulaire myocardique",
  "spectral-ct": "CT spectral",
  "oef-cmro2": "OEF et CMRO2",
  "t2-mapping": "Mapping T2",
  segmentation: "Segmentation en imagerie",
  "quality-control": "Contrôle qualité en imagerie",
  registration: "Recalage d'images",
  "photon-counting-ct-applications": "Applications du CT à comptage photonique",
  radiomics: "Radiomique",
  "neuro-oncology": "Neuro-oncologie",
  "hepatic-imaging": "Imagerie hépatique",
  "nuclear-medicine": "Médecine nucléaire",
});

const seed = (input) => ({
  ...input,
  aliases: new Set(input.aliases ?? []),
  parents: new Set(),
  children: new Set(),
  related: new Set(),
  prerequisites: new Set(),
  dependencies: new Set(),
  relatedDomains: new Set(),
  successors: new Set(),
  replacements: new Set(),
  supersededBy: new Set(),
  sourceRefs: new Set(input.sourceRefs ?? []),
  assertionIds: new Set(),
  evidenceIds: new Set(),
  contradictionIds: new Set(),
  openQuestions: new Set(),
  synthesisIds: new Set(),
  projectionIds: new Set(),
  reviewDates: new Set([input.updatedAt, input.createdAt].filter(Boolean)),
});

const addRelated = (seeds, leftId, rightId) => {
  if (!leftId || !rightId || leftId === rightId || !seeds.has(leftId) || !seeds.has(rightId)) return;
  seeds.get(leftId).related.add(rightId);
  seeds.get(rightId).related.add(leftId);
};

const addParent = (seeds, childId, parentId) => {
  if (!childId || !parentId || childId === parentId || !seeds.has(childId) || !seeds.has(parentId)) return;
  seeds.get(childId).parents.add(parentId);
  seeds.get(parentId).children.add(childId);
};

const addDomainMembership = (seeds, nodeId, domainId) => {
  const parentId = domainNodeId(domainId);
  if (!seeds.has(nodeId) || !seeds.has(parentId) || nodeId === parentId) return;
  seeds.get(nodeId).relatedDomains.add(parentId);
  addParent(seeds, nodeId, parentId);
};

const buildSeeds = () => {
  const seeds = new Map();
  for (const revision of entityRevisions) {
    const payload = revision.payload;
    seeds.set(revision.stableId, seed({
      nodeId: revision.stableId,
      nodeType: payload.entityType,
      preferredLabel: payload.preferredLabel,
      aliases: payload.aliases,
      description: payload.description,
      sourceRefs: unique([...(revision.sourceRefs ?? []), ...(payload.sourceRefs ?? [])]),
      version: payload.version ?? "1.0.0",
      createdAt: revision.createdAt,
      updatedAt: revision.updatedAt,
      sourceStatus: revision.status ?? payload.status,
      modeled: true,
      planned: false,
      roadmapSignals: null,
      provenance: { sourceLayers: ["P3M_WEB_HISTORICAL"], sourceIdentityIds: [revision.stableId], catalogRevisionIds: [revision.revisionId], sourceRevisionIds: [] },
    }));
  }
  for (let index = 0; index < scientificCorpusEntityRevisions.length; index += 1) {
    const revision = scientificCorpusEntityRevisions[index];
    const identity = scientificCorpusConceptIdentities[index];
    seeds.set(revision.stableId, seed({
      nodeId: revision.stableId,
      nodeType: identity.entityType,
      preferredLabel: revision.payload.preferredLabel,
      aliases: unique(revision.payload.designations).filter((value) => value !== revision.payload.preferredLabel),
      description: revision.payload.description,
      sourceRefs: revision.sourceRefs,
      version: "1.0.0",
      createdAt: revision.createdAt,
      updatedAt: revision.updatedAt,
      sourceStatus: revision.status,
      modeled: true,
      planned: false,
      roadmapSignals: null,
      provenance: { sourceLayers: ["P4R_ECV_T1"], sourceIdentityIds: [identity.stableId], catalogRevisionIds: [revision.revisionId], sourceRevisionIds: [] },
    }));
  }
  for (const concept of multidomainConcepts) {
    seeds.set(concept.stableId, seed({
      nodeId: concept.stableId,
      nodeType: concept.ontologicalClass,
      preferredLabel: concept.preferredLabel,
      aliases: concept.designations.map((item) => item.value).filter((value) => value !== concept.preferredLabel),
      description: concept.description,
      sourceRefs: concept.sourceRefs,
      version: "1.0.0",
      createdAt: KNOWLEDGE_CATALOG_GENERATED_AT,
      updatedAt: KNOWLEDGE_CATALOG_GENERATED_AT,
      sourceStatus: concept.status,
      modeled: true,
      planned: false,
      roadmapSignals: null,
      provenance: { sourceLayers: ["P5_MULTIDOMAIN"], sourceIdentityIds: [concept.stableId], catalogRevisionIds: [concept.revisionId], sourceRevisionIds: [] },
    }));
  }
  const enrichedDomains = [
    { domainId: "ecv-t1", objective: "Pilot corpus for myocardial T1 mapping and extracellular volume across MR and CT documentary branches." },
    ...scientificDomainManifests.map((manifest) => ({ domainId: manifest.domainId, objective: manifest.objective })),
  ];
  for (const domain of enrichedDomains) {
    const nodeId = domainNodeId(domain.domainId);
    seeds.set(nodeId, seed({
      nodeId,
      nodeType: "Domain",
      preferredLabel: DOMAIN_LABELS[domain.domainId] ?? domain.domainId,
      aliases: [domain.domainId],
      description: domain.objective,
      sourceRefs: [],
      version: "1.0.0",
      createdAt: KNOWLEDGE_CATALOG_GENERATED_AT,
      updatedAt: KNOWLEDGE_CATALOG_GENERATED_AT,
      sourceStatus: "ACTIVE",
      modeled: true,
      planned: false,
      roadmapSignals: null,
      provenance: { sourceLayers: [domain.domainId === "ecv-t1" ? "P4R_DOMAIN" : "P5_DOMAIN_MANIFEST"], sourceIdentityIds: [domain.domainId], catalogRevisionIds: [], sourceRevisionIds: [] },
    }));
  }
  for (const wave of nextScientificWaves) {
    const nodeId = domainNodeId(wave.domainId);
    seeds.set(nodeId, seed({
      nodeId,
      nodeType: "Domain",
      preferredLabel: DOMAIN_LABELS[wave.domainId] ?? wave.domainId,
      aliases: [wave.domainId],
      description: `Planned scientific domain testing ${wave.newDimension}. No corpus is created in P6.`,
      sourceRefs: [],
      version: "1.0.0",
      createdAt: KNOWLEDGE_CATALOG_GENERATED_AT,
      updatedAt: KNOWLEDGE_CATALOG_GENERATED_AT,
      sourceStatus: "PLANNED",
      modeled: false,
      planned: true,
      roadmapSignals: wave,
      provenance: { sourceLayers: ["P5_EXPLICIT_NEXT_WAVE"], sourceIdentityIds: [wave.domainId], catalogRevisionIds: [], sourceRevisionIds: [] },
    }));
  }
  return seeds;
};

const scientificSources = Object.freeze([...consolidatedSourceRevisions, ...multidomainSourceRevisions]);
const scientificSourceByCanonicalId = new Map(scientificSources.flatMap((source) => [
  [canonicalSourceId(source.revisionId), source],
  [canonicalSourceId(source.stableId), source],
]));
const p5ConceptByDomainKey = new Map(multidomainConcepts.map((concept) => [`${concept.domainId}:${concept.key}`, concept.stableId]));

const resolveReference = (value, domainId, knownIds, uniqueSlugIds) => {
  if (typeof value !== "string") return null;
  if (knownIds.has(value)) return value;
  const modality = { MR: "noxia:radiology:modality:irm", MRI: "noxia:radiology:modality:irm", IRM: "noxia:radiology:modality:irm", CT: "noxia:radiology:modality:ct" }[value];
  if (modality && knownIds.has(modality)) return modality;
  const domainConcept = p5ConceptByDomainKey.get(`${domainId}:${value}`);
  if (domainConcept) return domainConcept;
  return uniqueSlugIds.get(value) ?? null;
};

const flattenStrings = (value, output = []) => {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) for (const item of value) flattenStrings(item, output);
  else if (value && typeof value === "object") for (const item of Object.values(value)) flattenStrings(item, output);
  return output;
};

const assertionReferences = (assertion, domainId, knownIds, uniqueSlugIds) => {
  const candidates = [assertion.subjectEntityId, assertion.objectEntityId, assertion.method, assertion.modality, assertion.sequence, assertion.fieldStrength, assertion.facets, assertion.context?.dimensions?.map((item) => item.value)];
  return unique(flattenStrings(candidates).map((value) => resolveReference(value, domainId, knownIds, uniqueSlugIds)));
};

const sourceIsFullText = (source) => source ? !(source.abstractOnly ?? source.metadata?.abstractOnly ?? source.fullTextAvailability === "ABSTRACT_ONLY") : false;
const sourceIsAbstractOnly = (source) => source ? Boolean(source.abstractOnly ?? source.metadata?.abstractOnly ?? source.fullTextAvailability === "ABSTRACT_ONLY") : false;

const graphDepth = (nodes) => {
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  const indegree = new Map(nodes.map((node) => [node.nodeId, node.parents.length]));
  const depth = new Map(nodes.map((node) => [node.nodeId, 0]));
  const queue = nodes.filter((node) => node.parents.length === 0).map((node) => node.nodeId).sort();
  let visited = 0;
  while (queue.length) {
    const nodeId = queue.shift();
    visited += 1;
    for (const childId of byId.get(nodeId)?.children ?? []) {
      depth.set(childId, Math.max(depth.get(childId) ?? 0, (depth.get(nodeId) ?? 0) + 1));
      indegree.set(childId, (indegree.get(childId) ?? 0) - 1);
      if (indegree.get(childId) === 0) { queue.push(childId); queue.sort(); }
    }
  }
  return { maxDepth: Math.max(0, ...depth.values()), visited, cyclic: visited !== nodes.length };
};

const countBy = (items, selector) => Object.freeze(Object.fromEntries([...Map.groupBy(items, selector).entries()].sort(([a], [b]) => String(a).localeCompare(String(b))).map(([key, values]) => [key, values.length])));

export const createScientificKnowledgeCatalog = () => {
  const seeds = buildSeeds();
  const knownIds = new Set(seeds.keys());
  const slugGroups = Map.groupBy([...knownIds], lastSegment);
  const uniqueSlugIds = new Map([...slugGroups.entries()].filter(([, ids]) => ids.length === 1).map(([key, ids]) => [key, ids[0]]));

  for (const concept of scientificCorpusEntityRevisions) addDomainMembership(seeds, concept.stableId, "ecv-t1");
  for (const concept of multidomainConcepts) addDomainMembership(seeds, concept.stableId, concept.domainId);

  for (const relation of activeStructuralRelations) {
    if (!knownIds.has(relation.sourceId) || !knownIds.has(relation.targetId)) continue;
    if (["PART_OF", "IS_A"].includes(relation.relationType)) addParent(seeds, relation.sourceId, relation.targetId);
    else addRelated(seeds, relation.sourceId, relation.targetId);
    if (relation.relationType === "REQUIRES") {
      seeds.get(relation.sourceId).prerequisites.add(relation.targetId);
      seeds.get(relation.sourceId).dependencies.add(relation.targetId);
    }
    if (relation.relationType === "DERIVED_FROM") seeds.get(relation.sourceId).dependencies.add(relation.targetId);
    if (relation.relationType === "SUPERSEDES") {
      seeds.get(relation.targetId).successors.add(relation.sourceId);
      seeds.get(relation.targetId).replacements.add(relation.sourceId);
      seeds.get(relation.targetId).supersededBy.add(relation.sourceId);
    }
  }

  const assertions = [
    ...consolidatedAssertionRevisions.map((assertion) => ({ domainId: "ecv-t1", assertion })),
    ...multidomainAssertionRevisions.map((assertion) => ({ domainId: assertion.domainId, assertion })),
  ];
  const evidence = [...consolidatedEvidenceLinks, ...multidomainEvidenceLinks];
  const evidenceByAssertion = Map.groupBy(evidence, (item) => item.assertionRevisionId);
  const referencesByAssertion = new Map();
  for (const { domainId, assertion } of assertions) {
    const references = assertionReferences(assertion, domainId, knownIds, uniqueSlugIds);
    referencesByAssertion.set(assertion.revisionId, references);
    const domainSeed = seeds.get(domainNodeId(domainId));
    const links = evidenceByAssertion.get(assertion.revisionId) ?? [];
    for (const nodeId of references) {
      const node = seeds.get(nodeId);
      node.assertionIds.add(assertion.revisionId);
      node.reviewDates.add(assertion.updatedAt ?? assertion.date);
      addDomainMembership(seeds, nodeId, domainId);
      for (const link of links) {
        node.evidenceIds.add(link.evidenceLinkId);
        node.sourceRefs.add(link.sourceRevisionId);
        node.reviewDates.add(link.date ?? link.reviewedAt);
      }
    }
    if (domainSeed) {
      domainSeed.assertionIds.add(assertion.revisionId);
      domainSeed.reviewDates.add(assertion.updatedAt ?? assertion.date);
      for (const link of links) {
        domainSeed.evidenceIds.add(link.evidenceLinkId);
        domainSeed.sourceRefs.add(link.sourceRevisionId);
        domainSeed.reviewDates.add(link.date ?? link.reviewedAt);
      }
    }
    const subjectId = resolveReference(assertion.subjectEntityId, domainId, knownIds, uniqueSlugIds);
    for (const relatedId of references) addRelated(seeds, subjectId, relatedId);
  }

  const contradictions = [
    ...p4rContradictionAssessments.map((item) => ({ domainId: "ecv-t1", item })),
    ...multidomainContradictionAssessments.map((item) => ({ domainId: item.domainId, item })),
  ];
  for (const { domainId, item } of contradictions) {
    const relatedNodeIds = unique((item.assertionRevisionIds ?? []).flatMap((assertionId) => referencesByAssertion.get(assertionId) ?? []));
    for (const nodeId of relatedNodeIds) seeds.get(nodeId).contradictionIds.add(item.contradictionId);
    seeds.get(domainNodeId(domainId))?.contradictionIds.add(item.contradictionId);
  }

  const syntheses = [
    ...p4rScientificSyntheses.map((item) => ({ domainId: "ecv-t1", item })),
    ...multidomainScientificSyntheses.map((item) => ({ domainId: item.domainId, item })),
  ];
  for (const { domainId, item } of syntheses) {
    const synthesisId = item.synthesisId ?? `noxia:scientific-synthesis:${domainId}:${item.key}`;
    const nodeIds = new Set(asArray(item.concepts).map((value) => resolveReference(value, domainId, knownIds, uniqueSlugIds)).filter(Boolean));
    for (const assertion of item.applicableAssertions ?? item.assertions ?? []) {
      if (typeof assertion === "string") for (const nodeId of referencesByAssertion.get(assertion) ?? []) nodeIds.add(nodeId);
      else for (const nodeId of assertionReferences(assertion, domainId, knownIds, uniqueSlugIds)) nodeIds.add(nodeId);
    }
    const questions = unique([...(item.openQuestions ?? []), ...(item.questionsOpen ?? []), ...(item.gaps ?? []), ...(item.missingData ?? [])]);
    for (const nodeId of nodeIds) {
      seeds.get(nodeId).synthesisIds.add(synthesisId);
      questions.forEach((question) => seeds.get(nodeId).openQuestions.add(question));
    }
    const domainSeed = seeds.get(domainNodeId(domainId));
    domainSeed.synthesisIds.add(synthesisId);
    questions.forEach((question) => domainSeed.openQuestions.add(question));
  }

  const projections = [
    ...p4rInternalScientificProjections.map((item) => ({ domainId: "ecv-t1", item })),
    ...multidomainInternalProjections.map((item) => ({ domainId: item.domainId, item })),
  ];
  for (const { domainId, item } of projections) {
    const projectionId = item.projectionId;
    const nodeIds = new Set(asArray(item.concepts).map((value) => resolveReference(value, domainId, knownIds, uniqueSlugIds)).filter(Boolean));
    for (const assertion of item.assertions ?? []) {
      if (typeof assertion === "string") for (const nodeId of referencesByAssertion.get(assertion) ?? []) nodeIds.add(nodeId);
      else for (const nodeId of assertionReferences(assertion, domainId, knownIds, uniqueSlugIds)) nodeIds.add(nodeId);
    }
    for (const nodeId of nodeIds) seeds.get(nodeId).projectionIds.add(projectionId);
    seeds.get(domainNodeId(domainId)).projectionIds.add(projectionId);
  }

  const nodesFirstPass = [...seeds.values()].map((item) => {
    const canonicalSources = unique([...item.sourceRefs].map(canonicalSourceId));
    const resolvedScientificSources = unique(canonicalSources.filter((sourceId) => scientificSourceByCanonicalId.has(sourceId)));
    const fullTextSourceCount = resolvedScientificSources.filter((sourceId) => sourceIsFullText(scientificSourceByCanonicalId.get(sourceId))).length;
    const abstractOnlySourceCount = resolvedScientificSources.filter((sourceId) => sourceIsAbstractOnly(scientificSourceByCanonicalId.get(sourceId))).length;
    const metrics = {
      sourceCount: canonicalSources.length,
      scientificSourceCount: resolvedScientificSources.length,
      fullTextSourceCount,
      abstractOnlySourceCount,
      assertionCount: item.assertionIds.size,
      evidenceLinkCount: item.evidenceIds.size,
      localizedEvidenceLinkCount: [...item.evidenceIds].filter((evidenceId) => evidence.find((link) => link.evidenceLinkId === evidenceId)?.locator).length,
      contradictionCount: item.contradictionIds.size,
      openQuestionCount: item.openQuestions.size,
      synthesisCount: item.synthesisIds.size,
      projectionCount: item.projectionIds.size,
      publicPageCount: 0,
      parentCount: item.parents.size,
      childCount: item.children.size,
      relatedCount: item.related.size,
    };
    return createKnowledgeNode({
      nodeId: item.nodeId,
      nodeType: item.nodeType,
      preferredLabel: item.preferredLabel,
      aliases: [...item.aliases],
      description: item.description,
      parents: [...item.parents],
      children: [...item.children],
      related: [...item.related],
      prerequisites: [...item.prerequisites],
      dependencies: [...item.dependencies],
      relatedDomains: [...item.relatedDomains],
      successors: [...item.successors],
      replacements: [...item.replacements],
      supersededBy: [...item.supersededBy],
      blockingNodes: [],
      metrics,
      roadmapSignals: item.roadmapSignals,
      provenance: {
        ...item.provenance,
        sourceRevisionIds: unique([...item.provenance.sourceRevisionIds, ...item.sourceRefs]),
        scientificSourceIdentityIds: resolvedScientificSources,
        assertionRevisionIds: unique([...item.assertionIds]),
        evidenceLinkIds: unique([...item.evidenceIds]),
        synthesisIds: unique([...item.synthesisIds]),
        projectionIds: unique([...item.projectionIds]),
        contradictionIds: unique([...item.contradictionIds]),
        openQuestions: unique([...item.openQuestions]),
      },
      lastReview: maxDate([...item.reviewDates, ...resolvedScientificSources.map((sourceId) => {
        const source = scientificSourceByCanonicalId.get(sourceId);
        return source?.retrievedAt ?? source?.updatedAt;
      })]),
      version: item.version,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      sourceStatus: item.sourceStatus,
      planned: item.planned,
      modeled: item.modeled,
    });
  }).sort((a, b) => a.nodeId.localeCompare(b.nodeId));

  const nodeById = new Map(nodesFirstPass.map((node) => [node.nodeId, node]));
  const nodes = Object.freeze(nodesFirstPass.map((node) => Object.freeze({
    ...node,
    blockingNodes: unique([...node.prerequisites, ...node.dependencies].filter((nodeId) => !READY_LIKE_STATUSES.includes(nodeById.get(nodeId)?.status))),
  })));
  const campaigns = buildScientificEnrichmentCampaigns(nodes);
  const depth = graphDepth(nodes);
  const parentEdges = nodes.reduce((sum, node) => sum + node.parents.length, 0);
  const dependencyEdges = nodes.reduce((sum, node) => sum + node.dependencies.length, 0);
  const relatedEdges = nodes.reduce((sum, node) => sum + node.related.length, 0) / 2;
  const totalPotentialProjections = nodes.reduce((sum, node) => sum + node.projectionCapabilities.estimatedProjectionCount, 0);
  const totalPotentialPages = nodes.reduce((sum, node) => sum + node.projectionCapabilities.estimatedPageCount, 0);
  const completeNodes = nodes.filter((node) => node.coverage.complete).length;
  const sourceIdentityIds = unique(nodes.flatMap((node) => node.provenance.sourceRevisionIds).map(canonicalSourceId));
  const assertionIds = unique(nodes.flatMap((node) => node.provenance.assertionRevisionIds));
  const evidenceIds = unique(nodes.flatMap((node) => node.provenance.evidenceLinkIds));
  const contradictionIds = unique(nodes.flatMap((node) => node.provenance.contradictionIds));
  const synthesisIds = unique(nodes.flatMap((node) => node.provenance.synthesisIds));
  const projectionIds = unique(nodes.flatMap((node) => node.provenance.projectionIds));
  const summary = Object.freeze({
    knowledgeNodes: nodes.length,
    concepts: nodes.filter((node) => node.nodeType !== "Domain").length,
    domains: nodes.filter((node) => node.nodeType === "Domain").length,
    byNodeType: countBy(nodes, (node) => node.nodeType),
    byStatus: countBy(nodes, (node) => node.status),
    byPriority: countBy(nodes, (node) => node.priority.level),
    maxDepth: depth.maxDepth,
    graphCyclic: depth.cyclic,
    parentEdges,
    dependencyEdges,
    relatedEdges,
    graphDensity: Number(((parentEdges + dependencyEdges) / Math.max(1, nodes.length * (nodes.length - 1))).toFixed(6)),
    completeNodes,
    incompleteNodes: nodes.length - completeNodes,
    sources: sourceIdentityIds.length,
    assertions: assertionIds.length,
    evidenceLinks: evidenceIds.length,
    contradictions: contradictionIds.length,
    openQuestions: unique(nodes.flatMap((node) => node.provenance.openQuestions)).length,
    syntheses: synthesisIds.length,
    internalProjections: projectionIds.length,
    estimatedProjections: totalPotentialProjections,
    estimatedPages: totalPotentialPages,
    averageScientificCoverage: Number((nodes.reduce((sum, node) => sum + node.scientificCoverage.ratio, 0) / nodes.length).toFixed(4)),
    averageEditorialCoverage: Number((nodes.reduce((sum, node) => sum + node.editorialCoverage.ratio, 0) / nodes.length).toFixed(4)),
    campaignSummary: campaignSummary(campaigns),
  });
  const base = Object.freeze({
    catalogId: KNOWLEDGE_CATALOG_ID,
    version: KNOWLEDGE_CATALOG_VERSION,
    generatedAt: KNOWLEDGE_CATALOG_GENERATED_AT,
    scope: KNOWLEDGE_CATALOG_SCOPE,
    sourceBaselines: Object.freeze({ historicalConcepts: entityRevisions.length, p4rConcepts: scientificCorpusEntityRevisions.length, p5Concepts: multidomainConcepts.length, enrichedDomains: 5, plannedDomains: nextScientificWaves.length }),
    contracts: Object.freeze({
      knowledgeStoredInCatalog: false,
      scientificKnowledgeGraphMutated: false,
      assertionsCreated: 0,
      publicPagesCreated: 0,
      seoArtifactsCreated: 0,
      routesCreated: 0,
      publicationAuthorized: false,
      futureEnrichmentOutsideCatalogAllowed: false,
      futureProjectionOutsideCatalogAllowed: false,
    }),
    summary,
    campaigns,
    nodes,
  });
  return Object.freeze({ ...base, digest: sha256Digest(base) });
};

export const scientificKnowledgeCatalog = createScientificKnowledgeCatalog();
export const knowledgeNodeRegistry = Object.freeze(Object.fromEntries(scientificKnowledgeCatalog.nodes.map((node) => [node.nodeId, node])));
