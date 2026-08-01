import { constraints } from "../constraints.mjs";
import { entities, relations } from "../catalog.mjs";
import { biomarkerProfiles, registries } from "../registries.mjs";
import {
  KNOWLEDGE_GRAPH_UPDATED_AT,
  KNOWLEDGE_GRAPH_VERSION,
  entityFamilies,
  entityFamilyDefinitions,
  relationDefinitions,
} from "../schema.mjs";
import { sources } from "../sources.mjs";
import { validateKnowledgeGraph } from "../validate.mjs";
import { sha256Digest } from "./stable-json.mjs";

const sorted = (values, key) => [...values].sort((left, right) => String(left[key]).localeCompare(String(right[key])));

export const createKnowledgeGraphSnapshot = ({ root, gitSha }) => {
  const snapshotData = {
    graphVersion: KNOWLEDGE_GRAPH_VERSION,
    graphUpdatedAt: KNOWLEDGE_GRAPH_UPDATED_AT,
    gitSha,
    entities: sorted(entities, "entityId"),
    relations: sorted(relations, "relationId"),
    sources: sorted(sources, "sourceId"),
    publications: sorted(entities.filter((entity) => entity.entityType === "Publication"), "entityId"),
    biomarkerProfiles,
    constraints,
    taxonomy: {
      entityFamilies,
      entityFamilyDefinitions,
      relationDefinitions,
    },
    registryCounts: Object.fromEntries(Object.entries(registries).sort(([left], [right]) => left.localeCompare(right)).map(([registryName, registry]) => [registryName, registry.entryCount])),
    validation: validateKnowledgeGraph({ root }),
  };
  const digests = {
    entities: sha256Digest(snapshotData.entities),
    relations: sha256Digest(snapshotData.relations),
    sources: sha256Digest(snapshotData.sources),
    publications: sha256Digest(snapshotData.publications),
    biomarkerProfiles: sha256Digest(snapshotData.biomarkerProfiles),
    constraints: sha256Digest(snapshotData.constraints),
    taxonomy: sha256Digest(snapshotData.taxonomy),
    validation: sha256Digest(snapshotData.validation),
    contract: sha256Digest(snapshotData),
  };
  return {
    snapshotFormatVersion: "1.0.0",
    snapshotId: `knowledge-graph:${KNOWLEDGE_GRAPH_VERSION}:${digests.contract}`,
    deterministicTimestamp: KNOWLEDGE_GRAPH_UPDATED_AT,
    counts: {
      entities: snapshotData.entities.length,
      relations: snapshotData.relations.length,
      sources: snapshotData.sources.length,
      publications: snapshotData.publications.length,
      biomarkerProfiles: Object.keys(snapshotData.biomarkerProfiles).length,
      constraints: snapshotData.constraints.length,
      entityFamilies: snapshotData.taxonomy.entityFamilies.length,
      registries: Object.keys(snapshotData.registryCounts).length,
      warnings: snapshotData.validation.warnings.length,
      validationErrors: snapshotData.validation.errors.length,
    },
    digests,
    data: snapshotData,
  };
};

export const validateFrozenKnowledgeGraphSnapshot = (snapshot) => {
  const errors = [];
  if (!snapshot?.data || !snapshot?.digests || !snapshot?.counts) return { valid: false, errors: [{ code: "INVALID_SNAPSHOT_SHAPE" }] };
  const expectedDigests = {
    entities: sha256Digest(snapshot.data.entities),
    relations: sha256Digest(snapshot.data.relations),
    sources: sha256Digest(snapshot.data.sources),
    publications: sha256Digest(snapshot.data.publications),
    biomarkerProfiles: sha256Digest(snapshot.data.biomarkerProfiles),
    constraints: sha256Digest(snapshot.data.constraints),
    taxonomy: sha256Digest(snapshot.data.taxonomy),
    validation: sha256Digest(snapshot.data.validation),
    contract: sha256Digest(snapshot.data),
  };
  for (const [name, digest] of Object.entries(expectedDigests)) if (snapshot.digests[name] !== digest) errors.push({ code: "SNAPSHOT_DIGEST_MISMATCH", name, expected: digest, actual: snapshot.digests[name] });
  const expectedCounts = {
    entities: snapshot.data.entities.length,
    relations: snapshot.data.relations.length,
    sources: snapshot.data.sources.length,
    publications: snapshot.data.publications.length,
    biomarkerProfiles: Object.keys(snapshot.data.biomarkerProfiles).length,
    constraints: snapshot.data.constraints.length,
    entityFamilies: snapshot.data.taxonomy.entityFamilies.length,
    registries: Object.keys(snapshot.data.registryCounts).length,
    warnings: snapshot.data.validation.warnings.length,
    validationErrors: snapshot.data.validation.errors.length,
  };
  for (const [name, count] of Object.entries(expectedCounts)) if (snapshot.counts[name] !== count) errors.push({ code: "SNAPSHOT_COUNT_MISMATCH", name, expected: count, actual: snapshot.counts[name] });
  const expectedId = `knowledge-graph:${snapshot.data.graphVersion}:${expectedDigests.contract}`;
  if (snapshot.snapshotId !== expectedId) errors.push({ code: "SNAPSHOT_ID_MISMATCH", expected: expectedId, actual: snapshot.snapshotId });
  return { valid: errors.length === 0, errors, expectedDigests, expectedCounts };
};
