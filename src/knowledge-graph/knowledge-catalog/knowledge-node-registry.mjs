import { stableStringify } from "../migration/stable-json.mjs";
import { calculateCoverage, calculateNextReview, calculateReadiness, deriveKnowledgeNodeStatus } from "./coverage-engine.mjs";
import {
  KNOWLEDGE_CATALOG_GENERATED_AT,
  KNOWLEDGE_CATALOG_VERSION,
  KNOWLEDGE_NODE_DEPENDENCY_FIELDS,
} from "./constants.mjs";
import { calculateNodePriority } from "./priority-engine.mjs";
import { calculateProjectionCapabilities } from "./projection-engine.mjs";

const relationFields = Object.freeze(["parents", "children", "related", ...KNOWLEDGE_NODE_DEPENDENCY_FIELDS]);
const unique = (values = []) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
const clone = (value) => structuredClone(value);

const emptyMetrics = () => ({
  sourceCount: 0,
  scientificSourceCount: 0,
  fullTextSourceCount: 0,
  abstractOnlySourceCount: 0,
  assertionCount: 0,
  evidenceLinkCount: 0,
  localizedEvidenceLinkCount: 0,
  contradictionCount: 0,
  openQuestionCount: 0,
  synthesisCount: 0,
  projectionCount: 0,
  publicPageCount: 0,
  potentialProjectionCount: 0,
  potentialPageCount: 0,
  parentCount: 0,
  childCount: 0,
  relatedCount: 0,
});

const bumpPatchVersion = (version = "1.0.0") => {
  const [major = 1, minor = 0, patch = 0] = String(version).split(".").map((value) => Number.parseInt(value, 10));
  return `${major}.${minor}.${Number.isFinite(patch) ? patch + 1 : 1}`;
};

const recalculateNode = (input) => {
  const base = {
    nodeId: input.nodeId,
    nodeType: input.nodeType,
    preferredLabel: input.preferredLabel,
    aliases: unique(input.aliases),
    description: input.description,
    parents: unique(input.parents),
    children: unique(input.children),
    related: unique(input.related),
    prerequisites: unique(input.prerequisites),
    dependencies: unique(input.dependencies),
    relatedDomains: unique(input.relatedDomains),
    successors: unique(input.successors),
    replacements: unique(input.replacements),
    supersededBy: unique(input.supersededBy),
    blockingNodes: unique(input.blockingNodes),
    metrics: { ...emptyMetrics(), ...(input.metrics ?? {}) },
    roadmapSignals: input.roadmapSignals ?? null,
    provenance: input.provenance ?? { sourceLayers: [], sourceIdentityIds: [], catalogRevisionIds: [], sourceRevisionIds: [] },
    lastReview: input.lastReview ?? KNOWLEDGE_CATALOG_GENERATED_AT,
    version: input.version ?? "1.0.0",
    createdAt: input.createdAt ?? KNOWLEDGE_CATALOG_GENERATED_AT,
    updatedAt: input.updatedAt ?? KNOWLEDGE_CATALOG_GENERATED_AT,
    planned: Boolean(input.planned),
    modeled: Boolean(input.modeled),
    sourceStatus: input.sourceStatus ?? null,
    lifecycle: input.lifecycle ?? { archived: false, migrations: [] },
  };
  base.metrics.parentCount = base.parents.length;
  base.metrics.childCount = base.children.length;
  base.metrics.relatedCount = base.related.length;
  const initialProjection = input.projectionCapabilities ?? calculateProjectionCapabilities(base);
  base.metrics.potentialProjectionCount = initialProjection.estimatedProjectionCount;
  base.metrics.potentialPageCount = initialProjection.estimatedPageCount;
  const coverage = input.coverage && input.scientificCoverage
    ? {
        coverage: input.coverage,
        scientificCoverage: input.scientificCoverage,
        editorialCoverage: input.editorialCoverage,
        projectionCoverage: input.projectionCoverage,
        sourceCoverage: input.sourceCoverage,
        assertionCoverage: input.assertionCoverage,
      }
    : calculateCoverage({ nodeType: base.nodeType, metrics: base.metrics });
  const readiness = input.readiness ?? calculateReadiness({ nodeType: base.nodeType, metrics: base.metrics, coverage });
  const status = input.status ?? deriveKnowledgeNodeStatus({ sourceStatus: base.sourceStatus, metrics: base.metrics, readiness, planned: base.planned, modeled: base.modeled });
  const priority = input.priority ?? calculateNodePriority({ ...base, projectionCapabilities: initialProjection, ...coverage });
  return {
    ...base,
    priority,
    status,
    ...coverage,
    readiness,
    projectionCapabilities: initialProjection,
    nextReview: input.nextReview ?? calculateNextReview(base.lastReview, status),
  };
};

export const createKnowledgeNode = (input) => Object.freeze(recalculateNode(input));

export class KnowledgeNodeRegistry {
  constructor(nodes = [], { version = KNOWLEDGE_CATALOG_VERSION, at = KNOWLEDGE_CATALOG_GENERATED_AT } = {}) {
    this.version = version;
    this.updatedAt = at;
    this.nodes = new Map();
    this.migrations = [];
    for (const node of nodes) this.register(node, { recalculate: false });
    this.normalizeGraph();
  }

  register(node, { recalculate = true } = {}) {
    if (!node?.nodeId) throw new Error("KnowledgeNode requires nodeId.");
    if (this.nodes.has(node.nodeId)) throw new Error(`KnowledgeNode already exists: ${node.nodeId}`);
    const value = recalculate ? createKnowledgeNode(node) : clone(node);
    this.nodes.set(value.nodeId, value);
    return clone(value);
  }

  get(nodeId) {
    const node = this.nodes.get(nodeId);
    return node ? clone(node) : null;
  }

  has(nodeId) {
    return this.nodes.has(nodeId);
  }

  list() {
    return [...this.nodes.values()].map(clone).sort((a, b) => a.nodeId.localeCompare(b.nodeId));
  }

  replace(node) {
    if (!this.nodes.has(node.nodeId)) throw new Error(`Unknown KnowledgeNode: ${node.nodeId}`);
    this.nodes.set(node.nodeId, clone(node));
    return this.get(node.nodeId);
  }

  rename({ nodeId, preferredLabel, aliases = [], at = this.updatedAt }) {
    const node = this.get(nodeId);
    if (!node) throw new Error(`Unknown KnowledgeNode: ${nodeId}`);
    const renamed = recalculateNode({
      ...node,
      preferredLabel,
      aliases: unique([...node.aliases, node.preferredLabel, ...aliases]).filter((value) => value !== preferredLabel),
      version: bumpPatchVersion(node.version),
      updatedAt: at,
      lastReview: at,
      priority: null,
      nextReview: null,
    });
    this.replace(renamed);
    return this.get(nodeId);
  }

  deprecate({ nodeId, replacementId = null, reason = "SUPERSEDED", at = this.updatedAt }) {
    const node = this.get(nodeId);
    if (!node) throw new Error(`Unknown KnowledgeNode: ${nodeId}`);
    if (replacementId && !this.nodes.has(replacementId)) throw new Error(`Unknown replacement KnowledgeNode: ${replacementId}`);
    const replacements = replacementId ? unique([...node.replacements, replacementId]) : node.replacements;
    this.replace({
      ...node,
      status: "DEPRECATED",
      replacements,
      successors: unique([...node.successors, ...replacements]),
      supersededBy: unique([...node.supersededBy, ...replacements]),
      version: bumpPatchVersion(node.version),
      updatedAt: at,
      lastReview: at,
      nextReview: calculateNextReview(at, "DEPRECATED"),
      lifecycle: { ...node.lifecycle, deprecationReason: reason, deprecatedAt: at },
    });
    return this.get(nodeId);
  }

  archive({ nodeId, reason = "ARCHIVED", at = this.updatedAt }) {
    const node = this.get(nodeId);
    if (!node) throw new Error(`Unknown KnowledgeNode: ${nodeId}`);
    this.replace({
      ...node,
      status: "OBSOLETE",
      version: bumpPatchVersion(node.version),
      updatedAt: at,
      lastReview: at,
      nextReview: calculateNextReview(at, "OBSOLETE"),
      lifecycle: { ...node.lifecycle, archived: true, archivedAt: at, archiveReason: reason },
    });
    return this.get(nodeId);
  }

  merge({ sourceNodeIds, targetNode, reason = "CATALOG_MERGE", at = this.updatedAt }) {
    const sources = unique(sourceNodeIds).map((nodeId) => this.get(nodeId));
    if (sources.some((node) => !node)) throw new Error("Every merge source must exist.");
    if (!targetNode?.nodeId) throw new Error("Merge target requires nodeId.");
    if (sourceNodeIds.includes(targetNode.nodeId)) throw new Error("Merge target must differ from sources.");
    const inherited = (field) => unique([...sources.flatMap((node) => node[field] ?? []), ...(targetNode[field] ?? [])]).filter((nodeId) => !sourceNodeIds.includes(nodeId) && nodeId !== targetNode.nodeId);
    const merged = createKnowledgeNode({
      ...targetNode,
      aliases: unique([...sources.flatMap((node) => [node.preferredLabel, ...node.aliases]), ...(targetNode.aliases ?? [])]).filter((value) => value !== targetNode.preferredLabel),
      parents: inherited("parents"),
      children: inherited("children"),
      related: inherited("related"),
      prerequisites: inherited("prerequisites"),
      dependencies: inherited("dependencies"),
      relatedDomains: inherited("relatedDomains"),
      successors: inherited("successors"),
      replacements: inherited("replacements"),
      supersededBy: inherited("supersededBy"),
      createdAt: targetNode.createdAt ?? at,
      updatedAt: at,
      lastReview: at,
      lifecycle: { ...(targetNode.lifecycle ?? {}), mergedFrom: unique(sourceNodeIds), mergeReason: reason, mergedAt: at },
    });
    this.register(merged, { recalculate: false });
    for (const [nodeId, rawNode] of this.nodes) {
      if (sourceNodeIds.includes(nodeId) || nodeId === merged.nodeId) continue;
      const node = clone(rawNode);
      let changed = false;
      for (const field of relationFields) {
        const replaced = unique((node[field] ?? []).map((value) => sourceNodeIds.includes(value) ? merged.nodeId : value)).filter((value) => value !== node.nodeId);
        if (stableStringify(replaced, 0) !== stableStringify(node[field] ?? [], 0)) { node[field] = replaced; changed = true; }
      }
      if (changed) this.nodes.set(nodeId, node);
    }
    for (const source of sources) {
      this.replace({
        ...source,
        parents: [],
        children: [],
        related: [merged.nodeId],
        prerequisites: [],
        dependencies: [],
        blockingNodes: [],
        status: "DEPRECATED",
        replacements: [merged.nodeId],
        successors: [merged.nodeId],
        supersededBy: [merged.nodeId],
        version: bumpPatchVersion(source.version),
        updatedAt: at,
        lastReview: at,
        nextReview: calculateNextReview(at, "DEPRECATED"),
        lifecycle: { ...source.lifecycle, mergedInto: merged.nodeId, mergeReason: reason, mergedAt: at },
      });
    }
    this.normalizeGraph();
    return this.get(merged.nodeId);
  }

  split({ sourceNodeId, newNodes, reason = "CATALOG_SPLIT", at = this.updatedAt }) {
    const source = this.get(sourceNodeId);
    if (!source) throw new Error(`Unknown KnowledgeNode: ${sourceNodeId}`);
    if (!Array.isArray(newNodes) || newNodes.length < 2) throw new Error("A split requires at least two new KnowledgeNodes.");
    for (const node of newNodes) this.register(createKnowledgeNode({ ...node, createdAt: node.createdAt ?? at, updatedAt: at, lastReview: at }), { recalculate: false });
    const replacements = newNodes.map((node) => node.nodeId);
    this.replace({
      ...source,
      status: "DEPRECATED",
      replacements,
      successors: replacements,
      supersededBy: replacements,
      related: unique([...source.related, ...replacements]),
      version: bumpPatchVersion(source.version),
      updatedAt: at,
      lastReview: at,
      nextReview: calculateNextReview(at, "DEPRECATED"),
      lifecycle: { ...source.lifecycle, splitInto: replacements, splitReason: reason, splitAt: at },
    });
    this.normalizeGraph();
    return replacements.map((nodeId) => this.get(nodeId));
  }

  migrate({ toVersion, transform = (node) => node, migrationId = `migration:${this.version}:${toVersion}`, at = this.updatedAt }) {
    if (!toVersion || toVersion === this.version) throw new Error("Migration requires a distinct target version.");
    const migrated = this.list().map((node) => transform(clone(node)));
    const ids = migrated.map((node) => node.nodeId);
    if (new Set(ids).size !== ids.length) throw new Error("Migration produced duplicate KnowledgeNode IDs.");
    this.nodes = new Map(migrated.map((node) => [node.nodeId, clone(node)]));
    this.migrations.push({ migrationId, fromVersion: this.version, toVersion, at });
    this.version = toVersion;
    this.updatedAt = at;
    this.normalizeGraph();
    return clone(this.migrations.at(-1));
  }

  normalizeGraph() {
    const ids = new Set(this.nodes.keys());
    for (const [nodeId, rawNode] of this.nodes) {
      const node = clone(rawNode);
      for (const field of relationFields) node[field] = unique(node[field]).filter((value) => ids.has(value) && value !== nodeId);
      this.nodes.set(nodeId, node);
    }
    for (const node of this.list()) {
      for (const parentId of node.parents) {
        const parent = this.get(parentId);
        if (!parent.children.includes(node.nodeId)) this.replace({ ...parent, children: unique([...parent.children, node.nodeId]) });
      }
      for (const childId of node.children) {
        const child = this.get(childId);
        if (!child.parents.includes(node.nodeId)) this.replace({ ...child, parents: unique([...child.parents, node.nodeId]) });
      }
      for (const relatedId of node.related) {
        const related = this.get(relatedId);
        if (!related.related.includes(node.nodeId)) this.replace({ ...related, related: unique([...related.related, node.nodeId]) });
      }
    }
    return this;
  }

  export() {
    return Object.freeze({ version: this.version, updatedAt: this.updatedAt, migrations: Object.freeze(clone(this.migrations)), nodes: Object.freeze(this.list()) });
  }

  exportJSON(space = 2) {
    return stableStringify(this.export(), space);
  }

  static import(input) {
    const parsed = typeof input === "string" ? JSON.parse(input) : clone(input);
    const registry = new KnowledgeNodeRegistry(parsed.nodes ?? [], { version: parsed.version, at: parsed.updatedAt });
    registry.migrations = clone(parsed.migrations ?? []);
    return registry;
  }
}

export const exportKnowledgeNodeRegistry = (registry, space = 2) => registry.exportJSON(space);
export const importKnowledgeNodeRegistry = (input) => KnowledgeNodeRegistry.import(input);
