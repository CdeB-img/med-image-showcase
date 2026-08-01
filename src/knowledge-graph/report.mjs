import { constraints } from "./constraints.mjs";
import { entities, relations } from "./catalog.mjs";
import { registries } from "./registries.mjs";
import { entityFamilies, relationDefinitions } from "./schema.mjs";
import { sources } from "./sources.mjs";
import { validateKnowledgeGraph } from "./validate.mjs";
import {
  assertionEvidence,
  assertionMigrationState,
  scientificAssertions,
  scientificSources,
} from "./assertion-catalog.mjs";
import {
  SCIENTIFIC_ASSERTION_LAYER_VERSION,
  assertionSynthesisFields,
  legacyScientificRelationTypes,
} from "./assertion-schema.mjs";
import { scientificRegistries } from "./assertion-registries.mjs";

const countBy = (values, key) => Object.fromEntries([...new Set(values.map((value) => value[key]))].sort().map((name) => [name, values.filter((value) => value[key] === name).length]));

export const createKnowledgeGraphReport = ({ root } = {}) => {
  const validation = validateKnowledgeGraph({ root });
  const familyCounts = Object.fromEntries(entityFamilies.map((family) => [family, entities.filter((entity) => entity.entityType === family).length]));
  const relationCounts = countBy(relations, "relationType");
  const aliasCount = entities.reduce((count, entity) => count + entity.aliases.length, 0);
  const synonymCount = familyCounts.Synonym;
  const abbreviationCount = familyCounts.Abbreviation;
  const publicationCount = familyCounts.Publication;
  const incompleteFamilies = entityFamilies.filter((family) => familyCounts[family] === 0);
  const entityById = new Map(entities.map((entity) => [entity.entityId, entity]));
  const legacyAssertionCandidates = relations.filter((relation) => legacyScientificRelationTypes.includes(relation.relationType));
  const directPublicationRelationCandidates = legacyAssertionCandidates.filter((relation) => entityById.get(relation.sourceId)?.entityType === "Publication");
  const lexicalReferenceCandidates = legacyAssertionCandidates.filter((relation) => ["Synonym", "Abbreviation", "Terminology", "Definition"].includes(entityById.get(relation.sourceId)?.entityType));
  return {
    reportVersion: "2.0.0",
    entityFamilyCount: entityFamilies.length,
    entityCount: entities.length,
    relationCount: relations.length,
    constraintCount: constraints.length,
    synonymCount,
    abbreviationCount,
    aliasCount,
    publicationCount,
    sourceCount: sources.length,
    familyCoverage: entityFamilies.map((family) => ({
      family,
      entityCount: familyCounts[family],
      coverage: familyCounts[family] > 0 ? "repository-sourced" : "not-observed-in-repository",
      completeness: familyCounts[family] > 0 ? "initial" : "empty-by-design",
    })),
    relationCoverage: Object.entries(relationDefinitions).map(([relationType, definition]) => ({
      relationType,
      cardinality: definition.cardinality,
      constraints: definition.acyclic ? ["typed", "versioned", "sourced", "acyclic"] : ["typed", "versioned", "sourced"],
      evidenceStatus: "UNKNOWN-until-qualified",
      count: relationCounts[relationType] ?? 0,
    })),
    registryCoverage: Object.entries(registries).map(([registryName, registry]) => ({
      registryName,
      entryCount: registry.entryCount,
      validation: "covered-by-validate-knowledge-graph",
      source: registry.source,
    })),
    contracts: [
      { contract: "existing-routes", preserved: true, test: "protected-surface test", note: "No route source is changed." },
      { contract: "public-sitemap", preserved: true, test: "protected-surface test", note: "No sitemap source is changed." },
      { contract: "viewers", preserved: true, test: "protected-surface test", note: "No viewer source is changed." },
      { contract: "saas", preserved: true, test: "knowledge graph import scan", note: "No SaaS integration is added." },
      { contract: "publication", preserved: true, test: "static graph validation", note: "No campaign, publication or deployment code is added." },
    ],
    coverage: {
      currentDomain: "Repository-sourced radiology, workflow, viewer, project, format and publication facts only.",
      incompleteFamilies,
      remainingWork: [
        "Bibliographic completion and evidence qualification from authoritative source records.",
        "Declarative protocols with sourced indication and contraindication data.",
        "Manufacturer, equipment, generation and software-version records when supplied as source data.",
        "Named datasets, formal standards, guideline records and recommendation records with complete provenance.",
      ],
    },
    scientificAssertionLayer: {
      version: SCIENTIFIC_ASSERTION_LAYER_VERSION,
      modelStatus: validation.assertionLayer.valid ? "MODEL_VALIDATED_NO_DATA_MIGRATED" : "MODEL_INVALID",
      entityRole: "stable-concept",
      scientificFactCarrier: "ScientificAssertion",
      publicationRole: "evidence-source-through-AssertionEvidence",
      migrationState: assertionMigrationState,
      counts: {
        assertions: scientificAssertions.length,
        scientificSources: scientificSources.length,
        evidenceLinks: assertionEvidence.length,
        legacyAssertionCandidates: legacyAssertionCandidates.length,
        directPublicationRelationCandidates: directPublicationRelationCandidates.length,
      },
      registries: Object.keys(scientificRegistries),
      synthesisFields: assertionSynthesisFields,
      differencesFromPreviousModel: [
        "Entities remain stable concepts and no longer carry new scientific truth directly.",
        "Scientific facts are versioned ScientificAssertion records with explicit subject, predicate, object and context.",
        "Sources and publications take a SUPPORTS, REFUTES, QUALIFIES or NEUTRAL stance through AssertionEvidence.",
        "Contradictions are retained and surfaced rather than rejected or overwritten.",
        "Synthesis is structured data only; no narrative text is generated.",
      ],
      knowledgeGraphImpact: [
        "Existing entities and relations are unchanged in this model-only pass.",
        "Legacy scientific relations are migration candidates, not validated assertions.",
        "Future scientific writes must target the assertion and evidence registries.",
        "Consumers must eventually read assertion syntheses instead of inferring truth from direct entity relations.",
      ],
      requiredMigrations: [
        "Classify every legacy scientific relation as structural, lexical, operational or assertion-bearing.",
        "Create versioned provenance records from authoritative sources without inferring evidence stance from page copy.",
        "Convert eligible relations to DRAFT assertions while preserving original identifiers and source references.",
        "Obtain scientific review before activating clinical, anatomical, biomarker, protocol or equipment assertions.",
        "Deprecate direct publication-to-concept scientific relations only after downstream consumers have moved to AssertionEvidence.",
      ],
      automaticallyDerivableAsDraft: [
        {
          category: "legacy-relation-preservation",
          candidateCount: legacyAssertionCandidates.length,
          rule: "Copy subject, predicate, object and repository provenance into DRAFT/UNASSESSED migration candidates without changing scientific status.",
        },
        {
          category: "bibliographic-identity",
          candidateCount: publicationCount,
          rule: "Create source identity records from explicit publication metadata; do not infer SUPPORTS or REFUTES.",
        },
        {
          category: "lexical-reference",
          candidateCount: lexicalReferenceCandidates.length,
          rule: "Create DRAFT lexical assertions only when the existing relation is explicit; retain language and ambiguity for review.",
        },
      ],
      requiresScientificValidation: [
        "Clinical and anatomical applicability, including disease and population scope.",
        "Biomarker measurement, derivation, formula, threshold, interpretation and limitation claims.",
        "Publication stance, evidence level, contradiction and consensus qualification.",
        "Protocol indication, contraindication, fallback, preference and exception rules.",
        "Equipment, software, field-strength, licence and sequence compatibility.",
        "Guideline and recommendation strength, jurisdiction, version and effective period.",
      ],
      validation: validation.assertionLayer,
    },
    validation,
  };
};
