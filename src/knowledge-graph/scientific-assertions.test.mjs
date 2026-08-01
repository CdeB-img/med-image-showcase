import { describe, expect, it } from "vitest";
import {
  SCIENTIFIC_ASSERTION_LAYER_VERSION,
  assertionEvidence,
  assertionMigrationState,
  assertionPredicateDefinitions,
  createAssertionContext,
  createAssertionContextVariant,
  createAssertionEvidence,
  createKnowledgeGraphReport,
  createScientificAssertion,
  createScientificSource,
  evidenceLevels,
  registries,
  scientificAssertionId,
  scientificAssertions,
  scientificSources,
  synthesizeScientificAssertion,
  validateScientificAssertionLayer,
} from "./index.mjs";

const FIXED_TIME = "2026-07-31T12:00:00.000Z";
const id = (family, slug) => `noxia:radiology:${family.toLowerCase()}:${slug}`;
const concept = (entityType, slug) => ({ entityId: id(entityType, slug), entityType });

const fixtureEntities = Object.freeze([
  concept("Biomarker", "synthetic-marker"),
  concept("Sequence", "synthetic-sequence-a"),
  concept("Sequence", "synthetic-sequence-b"),
  concept("Manufacturer", "synthetic-vendor-a"),
  concept("Manufacturer", "synthetic-vendor-b"),
  concept("Equipment", "synthetic-scanner"),
  concept("EquipmentGeneration", "synthetic-generation"),
  concept("SoftwareVersion", "synthetic-version-a"),
  concept("SoftwareVersion", "synthetic-version-b"),
  concept("Disease", "synthetic-condition"),
  concept("Workflow", "synthetic-workflow"),
  concept("Protocol", "synthetic-protocol"),
  concept("Modality", "synthetic-modality"),
  concept("Publication", "synthetic-publication-a"),
  concept("Publication", "synthetic-publication-b"),
]);

const entityId = (entityType, slug) => fixtureEntities.find((entity) => entity.entityId === id(entityType, slug)).entityId;

const sourceA = createScientificSource({
  sourceId: "synthetic:source:primary-a",
  sourceType: "PrimarySource",
  title: "Synthetic primary source A",
  publicationEntityId: entityId("Publication", "synthetic-publication-a"),
  createdAt: FIXED_TIME,
});
const sourceB = createScientificSource({
  sourceId: "synthetic:source:primary-b",
  sourceType: "PrimarySource",
  title: "Synthetic primary source B",
  publicationEntityId: entityId("Publication", "synthetic-publication-b"),
  createdAt: FIXED_TIME,
});
const consensusSource = createScientificSource({
  sourceId: "synthetic:source:consensus",
  sourceType: "Consensus",
  title: "Synthetic consensus source",
  createdAt: FIXED_TIME,
});

const contextualAssertion = createScientificAssertion({
  assertionId: scientificAssertionId("synthetic-contextual-claim"),
  subjectEntityId: entityId("Biomarker", "synthetic-marker"),
  predicate: "MEASURED_BY",
  objectEntityId: entityId("Sequence", "synthetic-sequence-a"),
  statement: "Synthetic statement used only to validate the assertion model.",
  context: createAssertionContext({
    scope: "SYNTHETIC_TEST_ONLY",
    includeEntityIds: [entityId("Disease", "synthetic-condition")],
    excludeEntityIds: [],
    tags: ["synthetic"],
    combination: "ANY_OF",
    variants: [
      createAssertionContextVariant({
        contextId: "synthetic-context-a",
        equipmentContext: { manufacturerIds: [entityId("Manufacturer", "synthetic-vendor-a")], equipmentIds: [entityId("Equipment", "synthetic-scanner")], equipmentGenerationIds: [entityId("EquipmentGeneration", "synthetic-generation")], optionIds: [] },
        softwareContext: { softwareVersionIds: [entityId("SoftwareVersion", "synthetic-version-a")], buildIds: [], optionIds: [], licenseIds: [] },
        sequenceContext: { sequenceIds: [entityId("Sequence", "synthetic-sequence-a")], sequenceFamilyIds: [], implementationIds: [], parameterSetIds: [] },
        fieldStrength: { value: 3, unit: "T" },
      }),
      createAssertionContextVariant({
        contextId: "synthetic-context-b",
        equipmentContext: { manufacturerIds: [entityId("Manufacturer", "synthetic-vendor-b")], equipmentIds: [entityId("Equipment", "synthetic-scanner")], equipmentGenerationIds: [entityId("EquipmentGeneration", "synthetic-generation")], optionIds: [] },
        softwareContext: { softwareVersionIds: [entityId("SoftwareVersion", "synthetic-version-b")], buildIds: [], optionIds: [], licenseIds: [] },
        sequenceContext: { sequenceIds: [entityId("Sequence", "synthetic-sequence-b")], sequenceFamilyIds: [], implementationIds: [], parameterSetIds: [] },
        fieldStrength: { value: 1.5, unit: "T" },
      }),
    ],
  }),
  population: {
    label: "Synthetic population",
    entityIds: [],
    inclusionCriteria: ["synthetic-inclusion"],
    exclusionCriteria: ["synthetic-exclusion"],
  },
  clinicalContext: {
    diseaseIds: [entityId("Disease", "synthetic-condition")],
    clinicalQuestionIds: [],
    indicationIds: [],
    contraindicationIds: [],
  },
  technicalContext: {
    modalityIds: [entityId("Modality", "synthetic-modality")],
    formatIds: [],
    standardIds: [],
    acquisitionParameterIds: ["synthetic:acquisition-parameter"],
  },
  workflowContext: {
    workflowIds: [entityId("Workflow", "synthetic-workflow")],
    centerIds: ["synthetic:center:a", "synthetic:center:b"],
    protocolIds: [entityId("Protocol", "synthetic-protocol")],
    stageIds: ["synthetic:stage:a"],
  },
  equipmentContext: {
    manufacturerIds: [entityId("Manufacturer", "synthetic-vendor-a"), entityId("Manufacturer", "synthetic-vendor-b")],
    equipmentIds: [entityId("Equipment", "synthetic-scanner")],
    equipmentGenerationIds: [entityId("EquipmentGeneration", "synthetic-generation")],
    optionIds: ["synthetic:option:a"],
  },
  softwareContext: {
    softwareVersionIds: [entityId("SoftwareVersion", "synthetic-version-a"), entityId("SoftwareVersion", "synthetic-version-b")],
    buildIds: ["synthetic:build:a"],
    optionIds: ["synthetic:software-option:a"],
    licenseIds: ["synthetic:license:a"],
  },
  sequenceContext: {
    sequenceIds: [entityId("Sequence", "synthetic-sequence-a"), entityId("Sequence", "synthetic-sequence-b")],
    sequenceFamilyIds: [],
    implementationIds: ["synthetic:sequence-implementation:a"],
    parameterSetIds: ["synthetic:parameter-set:a"],
  },
  fieldStrength: { value: 3, unit: "T" },
  contrastAgent: { entityId: null, label: "Synthetic contrast context", dose: null, unit: null, timing: null },
  measurementMethod: { entityId: null, label: "Synthetic method", version: "test", unit: "synthetic-unit" },
  limitations: ["SYNTHETIC_LIMITATION"],
  confidence: "MODERATE",
  evidenceLevel: "MODERATE",
  sourceIds: [sourceA.sourceId, sourceB.sourceId, consensusSource.sourceId],
  publicationIds: [sourceA.publicationEntityId, sourceB.publicationEntityId],
  validFrom: "2026-01-01T00:00:00.000Z",
  status: "CONTESTED",
  reviewer: "synthetic-reviewer",
  createdAt: FIXED_TIME,
});

const contextualEvidence = Object.freeze([
  createAssertionEvidence({
    evidenceId: "synthetic:evidence:support",
    assertionId: contextualAssertion.assertionId,
    sourceId: sourceA.sourceId,
    publicationId: sourceA.publicationEntityId,
    stance: "SUPPORTS",
    evidenceLevel: "HIGH",
    confidence: "HIGH",
    reviewer: "synthetic-reviewer",
    createdAt: FIXED_TIME,
  }),
  createAssertionEvidence({
    evidenceId: "synthetic:evidence:refute",
    assertionId: contextualAssertion.assertionId,
    sourceId: sourceB.sourceId,
    publicationId: sourceB.publicationEntityId,
    stance: "REFUTES",
    evidenceLevel: "LOW",
    confidence: "MODERATE",
    reviewer: "synthetic-reviewer",
    createdAt: FIXED_TIME,
  }),
  createAssertionEvidence({
    evidenceId: "synthetic:evidence:consensus",
    assertionId: contextualAssertion.assertionId,
    sourceId: consensusSource.sourceId,
    stance: "SUPPORTS",
    evidenceLevel: "HIGH",
    confidence: "HIGH",
    reviewer: "synthetic-reviewer",
    createdAt: FIXED_TIME,
  }),
]);

const validateFixture = (overrides = {}) => validateScientificAssertionLayer({
  entities: fixtureEntities,
  assertions: [contextualAssertion],
  sources: [sourceA, sourceB, consensusSource],
  evidenceLinks: contextualEvidence,
  asOf: FIXED_TIME,
  ...overrides,
});

describe("Scientific Assertion model", () => {
  it("registers a first-class, versioned assertion layer without migrating data", () => {
    expect(SCIENTIFIC_ASSERTION_LAYER_VERSION).toBe("1.0.0");
    expect(scientificAssertions).toEqual([]);
    expect(scientificSources).toEqual([]);
    expect(assertionEvidence).toEqual([]);
    expect(assertionMigrationState.status).toBe("NOT_STARTED");
    for (const registryName of ["scientific-assertions", "assertion-types", "predicates", "contexts", "provenance", "assertion-status", "evidence-model"]) {
      expect(registries[registryName]).toBeDefined();
      expect(registries[registryName].version).toBe(SCIENTIFIC_ASSERTION_LAYER_VERSION);
    }
    expect(registries["scientific-assertions"].entries.contract.directPublicationToConceptFactsAllowed).toBe(false);
  });

  it("accepts several publications, evidence levels, contexts, manufacturers, versions and sequences", () => {
    const validation = validateFixture();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(contextualAssertion.publicationIds).toHaveLength(2);
    expect(contextualAssertion.equipmentContext.manufacturerIds).toHaveLength(2);
    expect(contextualAssertion.softwareContext.softwareVersionIds).toHaveLength(2);
    expect(contextualAssertion.sequenceContext.sequenceIds).toHaveLength(2);
    expect(contextualAssertion.context.variants).toHaveLength(2);
    expect(new Set(contextualEvidence.map((evidence) => evidence.evidenceLevel))).toEqual(new Set(["HIGH", "LOW"]));
    expect(evidenceLevels).toContain(contextualAssertion.evidenceLevel);
  });

  it("retains contradictory evidence and detects consensus without invalidating the layer", () => {
    const validation = validateFixture();
    expect(validation.valid).toBe(true);
    expect(validation.contradictions).toEqual([{
      assertionId: contextualAssertion.assertionId,
      supportingEvidenceIds: ["synthetic:evidence:consensus", "synthetic:evidence:support"],
      refutingEvidenceIds: ["synthetic:evidence:refute"],
    }]);

    const synthesis = synthesizeScientificAssertion({
      assertion: contextualAssertion,
      evidenceLinks: contextualEvidence,
      sources: [sourceA, sourceB, consensusSource],
      updatedAt: FIXED_TIME,
    });
    expect(synthesis.stateOfKnowledge.status).toBe("CONTESTED");
    expect(synthesis.controversies.detected).toBe(true);
    expect(synthesis.consensus.detected).toBe(true);
    expect(synthesis.consensus.sourceIds).toEqual([consensusSource.sourceId]);
    expect(synthesis.history.evidenceEvents).toHaveLength(3);
    expect(synthesis.openQuestions).toContain("UNRESOLVED_CONTRADICTION");
  });

  it("retains opposite assertions in the same context as an explicit contradiction", () => {
    const contradictionSource = createScientificSource({ sourceId: "synthetic:source:opposite-claims", sourceType: "InternalValidation", title: "Synthetic opposite-claim source", createdAt: FIXED_TIME });
    const assertions = ["VALID_FOR", "NOT_VALID_FOR"].map((predicate) => createScientificAssertion({
      assertionId: scientificAssertionId(`synthetic-${predicate.toLowerCase().replaceAll("_", "-")}`),
      subjectEntityId: entityId("Biomarker", "synthetic-marker"),
      predicate,
      objectEntityId: entityId("Disease", "synthetic-condition"),
      statement: `Synthetic ${predicate} statement.`,
      sourceIds: [contradictionSource.sourceId],
      createdAt: FIXED_TIME,
    }));
    const evidenceLinks = assertions.map((assertion) => createAssertionEvidence({
      evidenceId: `synthetic:evidence:${assertion.predicate.toLowerCase()}`,
      assertionId: assertion.assertionId,
      sourceId: contradictionSource.sourceId,
      stance: "SUPPORTS",
      createdAt: FIXED_TIME,
    }));
    const validation = validateScientificAssertionLayer({ entities: fixtureEntities, assertions, sources: [contradictionSource], evidenceLinks, asOf: FIXED_TIME });
    expect(validation.valid).toBe(true);
    expect(validation.contradictions).toEqual(expect.arrayContaining([expect.objectContaining({ type: "opposite-predicates" })]));
  });

  it("detects orphan assertions and absent sources", () => {
    const invalidAssertion = createScientificAssertion({
      assertionId: scientificAssertionId("synthetic-orphan"),
      subjectEntityId: "noxia:radiology:biomarker:missing",
      predicate: "RELATED_TO",
      objectEntityId: entityId("Sequence", "synthetic-sequence-a"),
      statement: "Synthetic orphan assertion.",
      sourceIds: [],
      createdAt: FIXED_TIME,
    });
    const validation = validateScientificAssertionLayer({ entities: fixtureEntities, assertions: [invalidAssertion], sources: [], evidenceLinks: [], asOf: FIXED_TIME });
    expect(validation.valid).toBe(false);
    expect(validation.errors.map((error) => error.code)).toEqual(expect.arrayContaining(["orphan-assertion-subject", "assertion-without-source"]));
  });

  it("detects forbidden mixed dependency cycles", () => {
    const cycleSource = createScientificSource({ sourceId: "synthetic:source:cycle", sourceType: "InternalValidation", title: "Synthetic cycle source", createdAt: FIXED_TIME });
    const first = createScientificAssertion({
      assertionId: scientificAssertionId("synthetic-cycle-a"),
      subjectEntityId: entityId("Biomarker", "synthetic-marker"),
      predicate: "DERIVED_FROM",
      objectEntityId: entityId("Sequence", "synthetic-sequence-a"),
      statement: "Synthetic dependency A.",
      sourceIds: [cycleSource.sourceId],
      createdAt: FIXED_TIME,
    });
    const second = createScientificAssertion({
      assertionId: scientificAssertionId("synthetic-cycle-b"),
      subjectEntityId: entityId("Sequence", "synthetic-sequence-a"),
      predicate: "DEPENDS_ON",
      objectEntityId: entityId("Biomarker", "synthetic-marker"),
      statement: "Synthetic dependency B.",
      sourceIds: [cycleSource.sourceId],
      createdAt: FIXED_TIME,
    });
    const evidenceLinks = [first, second].map((assertion) => createAssertionEvidence({
      evidenceId: `synthetic:evidence:${assertion.assertionId.split(":").at(-1)}`,
      assertionId: assertion.assertionId,
      sourceId: cycleSource.sourceId,
      stance: "SUPPORTS",
      createdAt: FIXED_TIME,
    }));
    const validation = validateScientificAssertionLayer({ entities: fixtureEntities, assertions: [first, second], sources: [cycleSource], evidenceLinks, asOf: FIXED_TIME });
    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: "forbidden-assertion-cycle", cycleGroup: "dependency" })]));
  });

  it("detects incompatible contexts", () => {
    const invalidContextAssertion = createScientificAssertion({
      ...contextualAssertion,
      assertionId: scientificAssertionId("synthetic-incompatible-context"),
      context: createAssertionContext({
        scope: "SYNTHETIC_TEST_ONLY",
        includeEntityIds: [entityId("Manufacturer", "synthetic-vendor-a")],
        excludeEntityIds: [entityId("Manufacturer", "synthetic-vendor-a")],
        tags: [],
      }),
      sourceIds: [sourceA.sourceId],
      publicationIds: [sourceA.publicationEntityId],
    });
    const evidence = createAssertionEvidence({
      evidenceId: "synthetic:evidence:incompatible-context",
      assertionId: invalidContextAssertion.assertionId,
      sourceId: sourceA.sourceId,
      publicationId: sourceA.publicationEntityId,
      stance: "SUPPORTS",
      createdAt: FIXED_TIME,
    });
    const validation = validateScientificAssertionLayer({ entities: fixtureEntities, assertions: [invalidContextAssertion], sources: [sourceA], evidenceLinks: [evidence], asOf: FIXED_TIME });
    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: "incompatible-context-inclusion" })]));
  });

  it("detects obsolete assertions without deleting their history", () => {
    const obsoleteAssertion = createScientificAssertion({
      ...contextualAssertion,
      assertionId: scientificAssertionId("synthetic-obsolete"),
      sourceIds: [sourceA.sourceId],
      publicationIds: [sourceA.publicationEntityId],
      status: "OBSOLETE",
      validFrom: "2024-01-01T00:00:00.000Z",
      validUntil: "2025-01-01T00:00:00.000Z",
    });
    const evidence = createAssertionEvidence({
      evidenceId: "synthetic:evidence:obsolete",
      assertionId: obsoleteAssertion.assertionId,
      sourceId: sourceA.sourceId,
      publicationId: sourceA.publicationEntityId,
      stance: "QUALIFIES",
      createdAt: FIXED_TIME,
    });
    const validation = validateScientificAssertionLayer({ entities: fixtureEntities, assertions: [obsoleteAssertion], sources: [sourceA], evidenceLinks: [evidence], asOf: FIXED_TIME });
    expect(validation.valid).toBe(true);
    expect(validation.obsoleteAssertions).toEqual([expect.objectContaining({ assertionId: obsoleteAssertion.assertionId, expired: true })]);
    expect(validation.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "obsolete-assertion" })]));
  });

  it("reports migration candidates without generating scientific assertions", () => {
    const report = createKnowledgeGraphReport({ root: process.cwd() });
    expect(report.scientificAssertionLayer.modelStatus).toBe("MODEL_VALIDATED_NO_DATA_MIGRATED");
    expect(report.scientificAssertionLayer.counts.assertions).toBe(0);
    expect(report.scientificAssertionLayer.counts.legacyAssertionCandidates).toBeGreaterThan(0);
    expect(report.scientificAssertionLayer.automaticallyDerivableAsDraft.every((candidate) => candidate.rule.includes("DRAFT") || candidate.category === "bibliographic-identity")).toBe(true);
    expect(Object.keys(assertionPredicateDefinitions)).toEqual(expect.arrayContaining(["SUPPORTS", "REFUTES", "DERIVED_FROM", "REQUIRES", "RELATED_TO"]));
  });
});
