import { logicalDigest } from "./canonical";
import type { KnowledgeProviderDefinition } from "./types";

const providers = ([
  {
    id: "knowledge-graph", version: "1.0.0", type: "KNOWLEDGE_GRAPH", authoritySource: "src/knowledge-graph/catalog.mjs",
    domains: ["IMAGING_INFRASTRUCTURE", "CARDIAC_IMAGING"], coverageConcepts: ["tool:numpy", "format:dicom", "biomarker:ecv", "method:t1-mapping", "biomarker:t2"],
    capabilities: ["CONCEPT", "RELATION"], contextDimensions: ["domain", "modality", "technique"], granularity: "ENTITY_RELATION", provenanceSupport: "SOURCE_REFS",
    limitations: ["SCIENTIFIC_ASSERTION_REGISTRY_EMPTY", "RELATION_EVIDENCE_MAY_BE_UNKNOWN", "NO_GENERAL_TECHNICAL_ANSWER"], availability: "AVAILABLE", adapterId: "knowledge-graph-adapter-v1",
  },
  {
    id: "p4r-ecv-t1", version: "2026-08-01", type: "STRUCTURED_CORPUS", authoritySource: "src/knowledge-graph/scientific-consolidation",
    domains: ["CARDIAC_MRI", "CARDIAC_CT", "ECV_T1"], coverageConcepts: ["biomarker:ecv", "method:t1-mapping", "measurement:native-t1", "method:synthetic-hematocrit", "phenomenon:myocardial-fibrosis", "modality:mri", "modality:ct"],
    capabilities: ["CONCEPT", "ASSERTION", "EVIDENCE"], contextDimensions: ["domain", "pathology", "population", "phenomenon", "biomarker", "modality", "technique", "timing", "equipment", "usage"], granularity: "ATOMIC_ASSERTION", provenanceSupport: "SOURCE_AND_LOCATOR",
    limitations: ["ECV_T1_DOMAIN_ONLY", "NO_GENERAL_MRI_CT_COMPARISON", "HUMAN_SCIENTIFIC_REVIEW_NOT_CLAIMED"], availability: "AVAILABLE", adapterId: "p4r-adapter-v1",
  },
  {
    id: "p5-multidomain", version: "2026-08-01", type: "STRUCTURED_CORPUS", authoritySource: "src/knowledge-graph/scientific-multidomain",
    domains: ["DIFFUSION_ADC", "CEREBRAL_PERFUSION", "MYOCARDIAL_TISSUE_CHARACTERIZATION", "SPECTRAL_CT"], coverageConcepts: ["phenomenon:microvascular-obstruction", "biomarker:cerebral-perfusion", "technology:spectral-ct", "technology:dual-energy-ct", "technology:photon-counting-ct", "modality:ct", "modality:mri"],
    capabilities: ["CONCEPT", "ASSERTION", "EVIDENCE"], contextDimensions: ["domain", "pathology", "population", "phenomenon", "biomarker", "modality", "technique", "timing", "equipment", "usage"], granularity: "ATOMIC_ASSERTION", provenanceSupport: "SOURCE_AND_LOCATOR",
    limitations: ["FOUR_DECLARED_DOMAINS_ONLY", "NO_PATIENT_LEVEL_INTERPRETATION", "HUMAN_SCIENTIFIC_REVIEW_NOT_CLAIMED"], availability: "AVAILABLE", adapterId: "p5-adapter-v1",
  },
  {
    id: "rb-003", version: "1.0", type: "REASONING_BOOK", authoritySource: "Reasoning Book 03 — Spectral Imaging (DOCX master)", domains: ["SPECTRAL_CT"], coverageConcepts: ["technology:spectral-ct", "technology:dual-energy-ct", "technology:photon-counting-ct", "modality:ct"], capabilities: ["CONCEPT", "DOCUMENTARY_STATEMENT"], contextDimensions: ["domain", "phenomenon", "modality", "technique", "usage"], granularity: "DOCUMENTARY_BLOCK", provenanceSupport: "SOURCE_AND_LOCATOR", limitations: ["NARRATIVE_CORPUS", "NOT_ATOMIC_ASSERTIONS", "DEMO_PROJECTION_ONLY"], availability: "AVAILABLE", adapterId: "reasoning-book-adapter-v1",
  },
  {
    id: "rb-004", version: "1.1", type: "REASONING_BOOK", authoritySource: "Reasoning Book 04 — Cardiac MRI & Quantitative Cardiac Imaging (DOCX master)", domains: ["CARDIAC_MRI"], coverageConcepts: ["modality:mri", "phenomenon:myocardial-fibrosis", "phenomenon:no-reflow", "phenomenon:microvascular-obstruction", "method:t1-mapping", "measurement:native-t1", "biomarker:ecv", "biomarker:t2"], capabilities: ["CONCEPT", "DOCUMENTARY_STATEMENT"], contextDimensions: ["domain", "pathology", "population", "phenomenon", "biomarker", "modality", "technique", "usage"], granularity: "DOCUMENTARY_BLOCK", provenanceSupport: "SOURCE_AND_LOCATOR", limitations: ["NARRATIVE_CORPUS", "NOT_ATOMIC_ASSERTIONS", "DEMO_PROJECTION_ONLY"], availability: "AVAILABLE", adapterId: "reasoning-book-adapter-v1",
  },
  {
    id: "rb-005", version: "1.0", type: "REASONING_BOOK", authoritySource: "Reasoning Book 05 — Neuro Perfusion & Metabolism Foundations (DOCX master)", domains: ["NEURO_PERFUSION_METABOLISM"], coverageConcepts: ["modality:mri", "modality:ct", "biomarker:oef", "biomarker:cmro2", "biomarker:cerebral-perfusion"], capabilities: ["CONCEPT", "DOCUMENTARY_STATEMENT"], contextDimensions: ["domain", "pathology", "population", "phenomenon", "biomarker", "modality", "technique", "timing", "usage"], granularity: "DOCUMENTARY_BLOCK", provenanceSupport: "SOURCE_AND_LOCATOR", limitations: ["NARRATIVE_CORPUS", "NOT_ATOMIC_ASSERTIONS", "DEMO_PROJECTION_ONLY"], availability: "AVAILABLE", adapterId: "reasoning-book-adapter-v1",
  },
] satisfies KnowledgeProviderDefinition[]).sort((left, right) => left.id.localeCompare(right.id));

const snapshotMaterial = providers.map((provider) => ({ id: provider.id, version: provider.version, adapterId: provider.adapterId, availability: provider.availability, coverageConcepts: provider.coverageConcepts }));

export const KNOWLEDGE_PROVIDER_REGISTRY = Object.freeze({
  registryId: "noxia-knowledge-provider-registry",
  version: "1.0.0",
  providers: Object.freeze(providers),
  diagnostics: Object.freeze(["SCIENTIFIC_ASSERTION_LAYER_HAS_ZERO_ASSERTIONS_AND_IS_NOT_A_POSITIVE_ASSERTION_PROVIDER"]),
  digest: logicalDigest(snapshotMaterial),
});

export const getKnowledgeProvider = (id: string) => KNOWLEDGE_PROVIDER_REGISTRY.providers.find((provider) => provider.id === id);
