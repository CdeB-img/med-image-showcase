import { logicalDigest } from "./canonical";
import type { KnowledgeProviderDefinition } from "./types";

type ProviderInput = Omit<KnowledgeProviderDefinition,
  "id" | "type" | "domains" | "capabilities" | "contextDimensions" | "granularity" | "provenanceSupport" | "limitations"
>;

const defineProvider = (input: ProviderInput): KnowledgeProviderDefinition => ({
  ...input,
  id: input.providerId,
  type: input.providerType,
  domains: input.domain,
  capabilities: input.queryCapabilities,
  contextDimensions: input.supportedContextDimensions,
  granularity: input.resultGranularity,
  provenanceSupport: input.sourceLocatorSupport,
  limitations: input.knownLimitations,
});

const providers = ([
  defineProvider({
    providerId: "assertion-layer", version: "1.0.0", providerType: "ASSERTION_LAYER",
    authoritySource: "src/knowledge-graph/assertion-registries.mjs", authority: "Scientific Assertion Layer — registre officiel actuellement vide",
    domain: [], coverageConcepts: [], queryCapabilities: ["ASSERTION", "EVIDENCE"], supportedEntities: [], supportedRelations: [],
    supportedContextDimensions: ["domain", "pathology", "population", "phenomenon", "biomarker", "modality", "technique", "timing", "usage"],
    resultGranularity: "ATOMIC_ASSERTION", sourceLocatorSupport: "SOURCE_AND_LOCATOR", evidenceSupport: "EVIDENCE_LINKS",
    knownLimitations: ["ZERO_SCIENTIFIC_ASSERTIONS", "ZERO_SCIENTIFIC_SOURCES", "MUST_NOT_MASK_SPECIALIZED_PROVIDERS"],
    completenessClaim: "Registre exhaustif de la couche générique à sa version 1.0.0 ; contenu scientifique positif nul.",
    status: "CURRENT_EMPTY", availability: "AVAILABLE_EMPTY", adapterId: "empty-provider-adapter-v1",
  }),
  defineProvider({
    providerId: "knowledge-graph", version: "1.0.0", providerType: "KNOWLEDGE_GRAPH",
    authoritySource: "src/knowledge-graph/catalog.mjs", authority: "Scientific Knowledge Graph — entités et relations gouvernées",
    domain: ["IMAGING_INFRASTRUCTURE", "CARDIAC_IMAGING"], coverageConcepts: ["tool:numpy", "format:dicom", "biomarker:ecv", "method:t1-mapping", "biomarker:t2"],
    queryCapabilities: ["CONCEPT", "RELATION"], supportedEntities: ["ScientificConcept", "Modality", "Biomarker", "Method", "Format", "Tool"],
    supportedRelations: ["ENTITY_RELATION_WITHOUT_ASSERTION_PROMOTION"], supportedContextDimensions: ["domain", "modality", "technique"],
    resultGranularity: "ENTITY_RELATION", sourceLocatorSupport: "SOURCE_REFS", evidenceSupport: "NONE",
    knownLimitations: ["SCIENTIFIC_ASSERTION_REGISTRY_EMPTY", "RELATION_EVIDENCE_MAY_BE_UNKNOWN", "NO_GENERAL_TECHNICAL_ANSWER"],
    completenessClaim: "Couverture limitée aux entités et relations présentes dans catalog.mjs ; aucune couverture scientifique générale revendiquée.",
    status: "CURRENT_EFFECTIVE", availability: "AVAILABLE", adapterId: "knowledge-graph-adapter-v1",
  }),
  defineProvider({
    providerId: "p4-historical", version: "1.0.0-ecv-t1-pilot", providerType: "STRUCTURED_CORPUS",
    authoritySource: "src/knowledge-graph/scientific-corpus", authority: "P4 — baseline scientifique historique, remplacée en exécution courante par P4R",
    domain: ["ECV_T1"], coverageConcepts: ["biomarker:ecv", "method:t1-mapping", "measurement:native-t1", "method:synthetic-hematocrit", "phenomenon:myocardial-fibrosis", "modality:mri", "modality:ct"],
    queryCapabilities: ["CONCEPT", "ASSERTION", "EVIDENCE"], supportedEntities: ["SourceRevision", "ScientificAssertionRevision", "EvidenceLink"],
    supportedRelations: ["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS"], supportedContextDimensions: ["domain", "pathology", "population", "phenomenon", "biomarker", "modality", "technique", "timing", "equipment", "usage"],
    resultGranularity: "ATOMIC_ASSERTION", sourceLocatorSupport: "SOURCE_AND_LOCATOR", evidenceSupport: "EVIDENCE_LINKS",
    knownLimitations: ["HISTORICAL_REPLAY_ONLY", "SUPERSEDED_BY_P4R_FOR_CURRENT_RETRIEVAL", "NO_HUMAN_SCIENTIFIC_VALIDATION_CLAIM"],
    completenessClaim: "Baseline P4 préservée pour audit et replay ; non sélectionnable comme provider courant concurrent de P4R.",
    status: "HISTORICAL_SUPERSEDED", availability: "REPLAY_ONLY", adapterId: "p4-historical-adapter-v1",
  }),
  defineProvider({
    providerId: "p4r-ecv-t1", version: "1.1.0-ecv-t1-consolidated", providerType: "STRUCTURED_CORPUS",
    authoritySource: "src/knowledge-graph/scientific-consolidation", authority: "P4R — consolidation courante ECV/T1 à revue scientifique automatisée qualifiée",
    domain: ["CARDIAC_MRI", "CARDIAC_CT", "ECV_T1"], coverageConcepts: ["biomarker:ecv", "method:t1-mapping", "measurement:native-t1", "method:synthetic-hematocrit", "phenomenon:myocardial-fibrosis", "modality:mri", "modality:ct"],
    queryCapabilities: ["CONCEPT", "ASSERTION", "EVIDENCE"], supportedEntities: ["SourceRevision", "ScientificAssertionRevision", "EvidenceLink", "ContradictionAssessment"],
    supportedRelations: ["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS", "CORRECTS", "RETRACTS"], supportedContextDimensions: ["domain", "pathology", "population", "phenomenon", "biomarker", "modality", "technique", "timing", "equipment", "usage"],
    resultGranularity: "ATOMIC_ASSERTION", sourceLocatorSupport: "SOURCE_AND_LOCATOR", evidenceSupport: "EVIDENCE_LINKS",
    knownLimitations: ["ECV_T1_DOMAIN_ONLY", "NO_GENERAL_MRI_CT_COMPARISON", "AUTOMATED_REVIEW_IS_NOT_HUMAN_SCIENTIFIC_REVIEW"],
    completenessClaim: "Les 58 assertions, 84 EvidenceLinks et 27 sources de la consolidation P4R sont disponibles dans leur périmètre ECV/T1.",
    status: "CURRENT_EFFECTIVE", availability: "AVAILABLE", adapterId: "p4r-adapter-v1",
  }),
  defineProvider({
    providerId: "p5-multidomain", version: "1.0.0-multidomain-wave-1", providerType: "STRUCTURED_CORPUS",
    authoritySource: "src/knowledge-graph/scientific-multidomain", authority: "P5 — extension structurée multidomaine interne",
    domain: ["DIFFUSION_ADC", "CEREBRAL_PERFUSION", "MYOCARDIAL_TISSUE_CHARACTERIZATION", "SPECTRAL_CT"], coverageConcepts: ["phenomenon:microvascular-obstruction", "biomarker:cerebral-perfusion", "technology:spectral-ct", "technology:dual-energy-ct", "technology:photon-counting-ct", "modality:ct", "modality:mri"],
    queryCapabilities: ["CONCEPT", "ASSERTION", "EVIDENCE"], supportedEntities: ["ScientificConcept", "SourceRevision", "ScientificAssertionRevision", "EvidenceLink", "ContradictionAssessment"],
    supportedRelations: ["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS", "DERIVES", "CORRECTS", "RETRACTS"], supportedContextDimensions: ["domain", "pathology", "population", "phenomenon", "biomarker", "modality", "technique", "timing", "equipment", "usage"],
    resultGranularity: "ATOMIC_ASSERTION", sourceLocatorSupport: "SOURCE_AND_LOCATOR", evidenceSupport: "EVIDENCE_LINKS",
    knownLimitations: ["FOUR_DECLARED_DOMAINS_ONLY", "NO_PATIENT_LEVEL_INTERPRETATION", "AUTOMATED_REVIEW_IS_NOT_HUMAN_SCIENTIFIC_REVIEW"],
    completenessClaim: "Couverture exhaustive des quatre domaines déclarés par la wave P5, sans généralisation aux territoires voisins.",
    status: "CURRENT_EFFECTIVE", availability: "AVAILABLE", adapterId: "p5-adapter-v1",
  }),
  defineProvider({
    providerId: "rb-003", version: "1.0", providerType: "REASONING_BOOK",
    authoritySource: "output/documents/noxia-protocol-designer-reasoning-book-rb-003-spectral-imaging.docx", authority: "Reasoning Book 03 — Spectral Imaging, DOCX maître officiel",
    domain: ["SPECTRAL_CT"], coverageConcepts: ["technology:spectral-ct", "technology:dual-energy-ct", "technology:photon-counting-ct", "modality:ct"],
    queryCapabilities: ["CONCEPT", "DOCUMENTARY_STATEMENT"], supportedEntities: ["ScientificConstruct", "Objective", "Hypothesis", "Decision", "Limitation", "Controversy", "OpenQuestion", "RefusalCondition", "EvidenceMap"],
    supportedRelations: ["QUALIFIES", "BOUNDS", "DOCUMENTS_CONTROVERSY"], supportedContextDimensions: ["domain", "phenomenon", "biomarker", "modality", "technique", "usage"],
    resultGranularity: "DOCUMENTARY_BLOCK", sourceLocatorSupport: "SOURCE_AND_LOCATOR", evidenceSupport: "DOCUMENTARY_LOCALIZERS",
    knownLimitations: ["NARRATIVE_CORPUS", "NOT_ATOMIC_ASSERTIONS", "UNSTRUCTURED_SECTIONS_DECLARED_NOT_CONVERTED"], completenessClaim: "Toutes les familles de sections fiables du DOCX maître sont inventoriées ; seuls les blocs contrôlés sont restitués comme texte documentaire.",
    status: "CURRENT_DOCUMENTARY", availability: "AVAILABLE", programOwner: "NXP-000001", adapterId: "reasoning-book-adapter-v1-1",
  }),
  defineProvider({
    providerId: "rb-004", version: "1.1", providerType: "REASONING_BOOK",
    authoritySource: "output/documents/noxia-protocol-designer-reasoning-book-rb-004-cardiac-mri-quantitative-cardiac-imaging.docx", authority: "Reasoning Book 04 — Cardiac MRI & Quantitative Cardiac Imaging, DOCX maître officiel",
    domain: ["CARDIAC_MRI"], coverageConcepts: ["modality:mri", "phenomenon:myocardial-fibrosis", "phenomenon:no-reflow", "phenomenon:microvascular-obstruction", "method:t1-mapping", "measurement:native-t1", "biomarker:ecv", "biomarker:t2"],
    queryCapabilities: ["CONCEPT", "DOCUMENTARY_STATEMENT"], supportedEntities: ["ScientificConstruct", "Objective", "Hypothesis", "Decision", "Limitation", "Controversy", "OpenQuestion", "RefusalCondition", "EvidenceMap"],
    supportedRelations: ["QUALIFIES", "BOUNDS", "DOCUMENTS_CONTROVERSY"], supportedContextDimensions: ["domain", "pathology", "population", "phenomenon", "biomarker", "modality", "technique", "usage"],
    resultGranularity: "DOCUMENTARY_BLOCK", sourceLocatorSupport: "SOURCE_AND_LOCATOR", evidenceSupport: "DOCUMENTARY_LOCALIZERS",
    knownLimitations: ["NARRATIVE_CORPUS", "NOT_ATOMIC_ASSERTIONS", "UNSTRUCTURED_SECTIONS_DECLARED_NOT_CONVERTED"], completenessClaim: "Toutes les familles de sections fiables du DOCX maître sont inventoriées ; seuls les blocs contrôlés sont restitués comme texte documentaire.",
    status: "CURRENT_DOCUMENTARY", availability: "AVAILABLE", programOwner: "NXP-000002", adapterId: "reasoning-book-adapter-v1-1",
  }),
  defineProvider({
    providerId: "rb-005", version: "1.0", providerType: "REASONING_BOOK",
    authoritySource: "output/documents/noxia-protocol-designer-reasoning-book-rb-005-neuro-perfusion-metabolism-foundations.docx", authority: "Reasoning Book 05 — Neuro Perfusion & Metabolism Foundations, DOCX maître officiel",
    domain: ["NEURO_PERFUSION_METABOLISM"], coverageConcepts: ["modality:mri", "modality:ct", "modality:pet", "biomarker:oef", "biomarker:cmro2", "biomarker:cerebral-perfusion"],
    queryCapabilities: ["CONCEPT", "DOCUMENTARY_STATEMENT"], supportedEntities: ["ScientificConstruct", "Objective", "Hypothesis", "Decision", "Limitation", "Controversy", "OpenQuestion", "RefusalCondition", "EvidenceMap"],
    supportedRelations: ["QUALIFIES", "BOUNDS", "DOCUMENTS_CONTROVERSY"], supportedContextDimensions: ["domain", "pathology", "population", "phenomenon", "biomarker", "modality", "technique", "timing", "usage"],
    resultGranularity: "DOCUMENTARY_BLOCK", sourceLocatorSupport: "SOURCE_AND_LOCATOR", evidenceSupport: "DOCUMENTARY_LOCALIZERS",
    knownLimitations: ["NARRATIVE_CORPUS", "NOT_ATOMIC_ASSERTIONS", "UNSTRUCTURED_SECTIONS_DECLARED_NOT_CONVERTED"], completenessClaim: "Toutes les familles de sections fiables du DOCX maître sont inventoriées ; seuls les blocs contrôlés sont restitués comme texte documentaire.",
    status: "CURRENT_DOCUMENTARY", availability: "AVAILABLE", programOwner: "NXP-000003", adapterId: "reasoning-book-adapter-v1-1",
  }),
] satisfies KnowledgeProviderDefinition[]).sort((left, right) => left.providerId.localeCompare(right.providerId));

const snapshotMaterial = providers.map((provider) => ({
  providerId: provider.providerId,
  version: provider.version,
  adapterId: provider.adapterId,
  status: provider.status,
  availability: provider.availability,
  coverageConcepts: provider.coverageConcepts,
}));

export const KNOWLEDGE_PROVIDER_REGISTRY = Object.freeze({
  registryId: "noxia-knowledge-provider-registry",
  version: "1.1.0",
  providers: Object.freeze(providers),
  diagnostics: Object.freeze([
    "P4_IS_HISTORICAL_REPLAY_ONLY_AND_P4R_IS_CURRENT",
    "SCIENTIFIC_ASSERTION_LAYER_HAS_ZERO_ASSERTIONS_AND_IS_NOT_A_POSITIVE_ASSERTION_PROVIDER",
    "REASONING_BOOKS_RETURN_GOVERNED_DOCUMENTARY_STATEMENTS_NOT_ATOMIC_ASSERTIONS",
  ]),
  digest: logicalDigest(snapshotMaterial),
});

export const getKnowledgeProvider = (id: string) => KNOWLEDGE_PROVIDER_REGISTRY.providers.find((provider) => provider.providerId === id);
export const currentProviderVersions = () => Object.fromEntries(KNOWLEDGE_PROVIDER_REGISTRY.providers.map((provider) => [provider.providerId, provider.version]));
