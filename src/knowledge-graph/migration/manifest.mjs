import {
  biomarkerProfileMigrations,
  conceptIdentities,
  deferredHistoricalRelations,
  entityMigrationEntries,
  inactiveHistoricalRelations,
  publicationVersions,
  publicationWorks,
  publicationCorrectionAudit,
  relationMigrationEntries,
  scientificAssertionRevisions,
  scientificEvidenceLinks,
  sourceIdentities,
  sourceRevisions,
  sourceSnapshot,
} from "./migrated-knowledge.mjs";
import { sha256Digest } from "./stable-json.mjs";
import { validateScientificKnowledgeGraph } from "../multilayer-validation.mjs";

const MIGRATION_AT = "2026-07-31T00:00:00.000Z";

export const createKnowledgeGraphMigrationManifest = ({ root = process.cwd() } = {}) => {
  const validation = validateScientificKnowledgeGraph({ root });
  const coreFlags = ["structureValid", "semanticsValid", "scientificValid", "provenanceValid", "coverageValid", "competencyValid", "migrationIntegrityValid", "projectionReady"];
  const errors = Object.entries(validation.layers).flatMap(([layer, result]) => (result.errors ?? []).map((error) => ({ layer, ...error })));
  const warningSummary = Object.fromEntries(Object.entries(validation.layers).map(([layer, result]) => [layer, (result.warnings ?? []).length]));
  const manifest = {
    manifestVersion: "1.0.0",
    migrationId: "noxia:radiology:migration:p3m-web:1.0.0-to-2.0.0-web",
    perimeter: "NOXIA_PUBLIC_WEBSITE_SCIENTIFIC_DOCUMENTARY_KNOWLEDGE",
    sourceVersion: sourceSnapshot.data.graphVersion,
    targetVersion: "2.0.0-web",
    sourceGitSha: sourceSnapshot.data.gitSha,
    deterministicMigrationAt: MIGRATION_AT,
    digests: {
      before: sourceSnapshot.digests,
      after: validation.layers.migration.digests.after,
    },
    counts: {
      entitiesBefore: sourceSnapshot.counts.entities,
      entitiesMigrated: conceptIdentities.length,
      entityMigrationEntries: entityMigrationEntries.length,
      relationsBefore: sourceSnapshot.counts.relations,
      relationsInventoried: relationMigrationEntries.length,
      relationsMigrated: relationMigrationEntries.filter((entry) => entry.migrationApplied).length,
      relationsActive: relationMigrationEntries.filter((entry) => entry.active).length,
      relationsDeferred: deferredHistoricalRelations.length,
      relationsDisabled: inactiveHistoricalRelations.length,
      publicationsBefore: sourceSnapshot.counts.publications,
      publicationWorks: publicationWorks.length,
      publicationVersions: publicationVersions.length,
      biomarkerProfilesBefore: sourceSnapshot.counts.biomarkerProfiles,
      biomarkerProfilesMigrated: biomarkerProfileMigrations.length,
      sourceIdentities: sourceIdentities.length,
      sourceRevisions: sourceRevisions.length,
      scientificAssertionsCreated: scientificAssertionRevisions.length,
      evidenceLinksCreated: scientificEvidenceLinks.length,
    },
    entityMigrations: entityMigrationEntries,
    relationMigrations: relationMigrationEntries.map(({ historicalRecord, ...entry }) => entry),
    deferredRelationIds: deferredHistoricalRelations.map((entry) => entry.oldId).sort(),
    disabledRelationIds: inactiveHistoricalRelations.map((entry) => entry.oldId).sort(),
    publicationMigrations: publicationVersions.map((version) => ({ stableId: version.stableId, revisionId: version.revisionId, doi: version.doi, pmid: version.pmid, authors: version.authors, status: version.documentStatus })),
    publicationCorrectionAudit,
    biomarkerProfileMigrations: biomarkerProfileMigrations.map(({ historicalProfile, ...migration }) => ({ ...migration, historicalProfileDigest: sha256Digest(historicalProfile) })),
    relationIdentityMigrations: relationMigrationEntries.map((entry) => ({ oldId: entry.oldId, newId: entry.newId, digest: entry.migratedIdentityDigest })),
    validation: {
      ...Object.fromEntries(coreFlags.map((flag) => [flag, validation[flag]])),
      publicScientificContentReady: validation.publicScientificContentReady,
      layerErrorCounts: Object.fromEntries(Object.entries(validation.layers).map(([layer, result]) => [layer, (result.errors ?? []).length])),
      layerWarningCounts: warningSummary,
    },
    rollback: {
      sourceSnapshot: "src/knowledge-graph/migration/snapshots/knowledge-graph-v1.0.0-before-migration.json",
      historicalRegistriesPreserved: true,
      historicalDataDeleted: false,
      legacyRelationResolver: "src/knowledge-graph/migration/relation-id-resolver.mjs",
      rollbackProcedure: "Stop consuming the v2 web projection and read the frozen snapshot or unchanged v1 registries; no reverse data rewrite is required.",
    },
    excludedProductScope: [
      "PACS",
      "VIEWERS",
      "EXECUTABLE_PROTOCOLS",
      "APPLICATION_WORKFLOWS",
      "CORELAB_ASSIGNMENTS",
      "INSTALLED_EQUIPMENT",
      "OPERATIONAL_LICENSES",
      "INTERNAL_DATASET_MANAGEMENT",
      "DEPLOYED_AI_MODELS",
      "CLINICAL_RECOMMENDATION_ENGINE",
      "SUPABASE",
      "AUTH",
      "STRIPE",
    ],
    errors,
    warnings: [
      { code: "SOURCED_SCIENTIFIC_ENRICHMENT_REQUIRED", count: validation.layers.coverage.warnings.length },
      { code: "PUBLIC_PROJECTION_REQUIRES_EDITORIAL_APPROVAL", count: 1 },
      { code: "P3_AUDIT_REUSED_NOT_REGENERATED", count: 1 },
    ],
    status: errors.length === 0 && coreFlags.every((flag) => validation[flag]) ? "VALIDATED_SAFE_WEB_MIGRATION_READY_FOR_SOURCED_ENRICHMENT" : "PARTIAL_SAFE_MIGRATION_REQUIRES_CORRECTIONS",
  };
  return Object.freeze({ ...manifest, manifestDigest: sha256Digest(manifest) });
};
