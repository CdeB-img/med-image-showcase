export const p4InitialGitState = Object.freeze({
  inspectedAt: "2026-07-31T00:00:00.000Z",
  branch: "main",
  head: "857e94b6df88289b59de149fe8f77e84dbee9492",
  diffCheck: "PASS",
  worktree: "DIRTY_P1_TO_P3M_WEB_WORK_PRESERVED",
  modifiedTrackedFiles: Object.freeze(["package-lock.json", "package.json", "vitest.config.ts"]),
  untrackedScopes: Object.freeze(["docs P1-P3M-Web", "scripts P1-P3M-Web", "src/editorial", "src/knowledge-graph"]),
  foreignOrAmbiguousChanges: Object.freeze([]),
  automaticRestorePerformed: false,
});

export const p4InitialScientificState = Object.freeze({
  historicalConcepts: 118,
  historicalRelations: 93,
  activeStructuralRelations: 44,
  deferredHistoricalRelations: 47,
  disabledHistoricalRelations: 2,
  migratedPublications: 9,
  migratedBiomarkerProfiles: 13,
  realScientificAssertions: 0,
  realScientificEvidenceLinks: 0,
  publicScientificProjectionBlocked: true,
  existingTests: { passed: 131, failed: 0 },
  protectedSurfacesChanged: false,
  editorialEngineHead: "335fbbea8d138901f0cdf4f5e2d3b96144880e8b",
});

export const p4AuthorizedFileScopes = Object.freeze([
  "src/knowledge-graph/scientific-corpus/",
  "src/knowledge-graph/scientific-model-schema.mjs",
  "src/knowledge-graph/scientific-model-factories.mjs",
  "src/knowledge-graph/multilayer-validation.mjs",
  "src/knowledge-graph/index.mjs",
  "scripts/*scientific-corpus*.mjs",
  "scripts/*scientific-synthesis*.mjs",
  "scripts/*scientific-readiness*.mjs",
  "scripts/*scientific-projections*.mjs",
  "docs/p4-scientific-corpus*.md",
  "package.json",
]);
