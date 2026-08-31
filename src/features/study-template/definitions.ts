import { templateDigest, uniqueSorted } from "./canonical.ts";
import type {
  BlockDefinition,
  DocumentDefinition,
  SectionDefinition,
  StudyFamilyDefinition,
  StudyTemplateDefinition,
  TemplateDetailLevel,
  TemplateGraph,
  TemplateNodeDefinition,
  TemplateNodeKind,
  TemplateRelation,
} from "./types.ts";

const ALL_LEVELS: TemplateDetailLevel[] = ["FULL", "MEDIUM", "SHORT", "MINIMAL"];
const EXTENDED_LEVELS: TemplateDetailLevel[] = ["FULL", "MEDIUM"];
const TMP_PROVENANCE = ["TMP-001:Study Template Engine", "PD-003:Research Object Model", "RDE-001:Research Design Engine"];

export const STUDY_FAMILY_DEFINITIONS: StudyFamilyDefinition[] = [
  ["CLINICAL_STUDY", "Clinical Study", "STUDY", "ALWAYS", []],
  ["INTERVENTIONAL", "Interventional", "DESIGN", "REGULATORY_TOKEN", ["interventional", "intervention"]],
  ["OBSERVATIONAL", "Observational", "DESIGN", "PROJECT_DESIGN", ["observational", "cohort", "case control"]],
  ["REGISTRY", "Registry", "DATA_SOURCE", "REGULATORY_TOKEN", ["registry", "registre"]],
  ["SNDS", "SNDS", "DATA_SOURCE", "REGULATORY_TOKEN", ["snds"]],
  ["RIPH", "RIPH", "JURISDICTION", "REGULATORY_TOKEN", ["riph"]],
  ["PHRC", "PHRC", "FUNDING", "FUNDING_PROGRAM", ["phrc"]],
  ["RHU", "RHU", "FUNDING", "FUNDING_PROGRAM", ["rhu"]],
  ["ANR", "ANR", "FUNDING", "FUNDING_PROGRAM", ["anr"]],
  ["FRANCE_2030", "France 2030", "FUNDING", "FUNDING_PROGRAM", ["france 2030", "france_2030"]],
  ["DEVICE", "Device", "PRODUCT", "REGULATORY_TOKEN", ["medical device", "dispositif medical", "mdr"]],
  ["DRUG", "Drug", "PRODUCT", "REGULATORY_TOKEN", ["medicinal product", "medicament", "drug trial", "ctr"]],
  ["IMAGING", "Imaging", "METHOD", "PROJECT_IMAGING", ["imaging"]],
].map(([familyId, label, axis, resolver, resolverTokens]) => ({
  familyId: familyId as string,
  label: label as string,
  axis: axis as StudyFamilyDefinition["axis"],
  description: `Axe structurel ${label as string} ; sa sélection reste fondée sur les entrées gouvernées et ne constitue pas une qualification par TMP-001.`,
  resolver: resolver as StudyFamilyDefinition["resolver"],
  resolverTokens: resolverTokens as string[],
  provenance: [...TMP_PROVENANCE],
}));

type SharedBlockSpec = {
  id: string;
  label: string;
  kind: TemplateNodeKind;
  selector: string;
  defaultStatus?: TemplateNodeDefinition["defaultStatus"];
  categories?: string[];
  detailLevels?: TemplateDetailLevel[];
};

const SHARED_BLOCK_SPECS: SharedBlockSpec[] = [
  { id: "PROJECT_IDENTITY", label: "Project identity", kind: "REQUIRED_BLOCK", selector: "PROJECT_ID" },
  { id: "SCIENTIFIC_QUESTION", label: "Scientific question", kind: "REQUIRED_BLOCK", selector: "SCIENTIFIC_QUESTION" },
  { id: "OBJECTIVES", label: "Objectives", kind: "CONDITIONAL_BLOCK", selector: "OBJECTIVES" },
  { id: "HYPOTHESES", label: "Hypotheses", kind: "CONDITIONAL_BLOCK", selector: "HYPOTHESES", detailLevels: EXTENDED_LEVELS },
  { id: "POPULATION", label: "Population structure", kind: "REQUIRED_BLOCK", selector: "POPULATION" },
  { id: "STUDY_DESIGN", label: "Study design candidates and decision", kind: "REQUIRED_BLOCK", selector: "STUDY_DESIGN" },
  { id: "ENDPOINTS", label: "Endpoint structure", kind: "CONDITIONAL_BLOCK", selector: "ENDPOINTS" },
  { id: "IMAGING_CONTRIBUTION", label: "Imaging contribution", kind: "CONDITIONAL_BLOCK", selector: "IMAGING", categories: ["Imaging", "Acquisition", "CoreLab"] },
  { id: "BIOSPECIMENS", label: "Biospecimen and material collection", kind: "CONDITIONAL_BLOCK", selector: "BIOSPECIMENS", categories: ["Project", "Data"] },
  { id: "REQUIREMENT_REGISTER", label: "Applicable requirement register", kind: "TABLE", selector: "REG_REQUIREMENTS", categories: ["Regulatory Interaction", "Document Structure"] },
  { id: "DEPENDENCY_WORKFLOW", label: "Dependency workflow", kind: "WORKFLOW", selector: "DEPENDENCIES", categories: ["Workflow", "Project"] },
  { id: "HUMAN_DECISIONS", label: "Human decision trace", kind: "DECISION", selector: "HUMAN_DECISIONS", categories: ["Human Decision", "Decision"] },
  { id: "UNKNOWNS", label: "Unknowns", kind: "REQUIRED_BLOCK", selector: "UNKNOWNS", categories: ["Decision", "Risk"] },
  { id: "LIMITATIONS", label: "Limitations", kind: "REQUIRED_BLOCK", selector: "LIMITATIONS", categories: ["Risk", "Quality"] },
  { id: "CONFLICTS", label: "Open conflicts", kind: "REQUIRED_BLOCK", selector: "CONTRADICTIONS", categories: ["Decision", "Risk"] },
  { id: "READINESS", label: "Local template readiness", kind: "BLOCK", selector: "READINESS", categories: ["Review", "Validation"] },
  { id: "PROVENANCE", label: "Provenance", kind: "REFERENCE", selector: "PROVENANCE", categories: ["Document Structure", "Quality"] },
  { id: "REVIEW_NOTES", label: "Review notes", kind: "OPTIONAL_BLOCK", selector: "HUMAN_REVIEW", categories: ["Review", "Human Decision"] },
  { id: "FUTURE_SPECIALIZED_INPUTS", label: "Future specialized inputs", kind: "FUTURE_BLOCK", selector: "SPECIALIZED_DEPENDENCY", defaultStatus: "FUTURE", categories: ["Workflow", "Project"] },
  { id: "TRACE_ANNEX", label: "Traceability annex", kind: "ANNEX", selector: "PROVENANCE", categories: ["Document Structure", "Quality"], detailLevels: EXTENDED_LEVELS },
  { id: "PROVENANCE_SUBSECTION", label: "Provenance detail", kind: "SUBSECTION", selector: "PROVENANCE", categories: ["Document Structure"], detailLevels: EXTENDED_LEVELS },
];

type DocumentSpec = {
  id: string;
  label: string;
  blockLabel: string;
  familyIds?: string[];
  futureSpecialty?: string | null;
};

const DOCUMENT_SPECS: DocumentSpec[] = [
  { id: "PROTOCOL", label: "Protocol", blockLabel: "Protocol-specific logical structure" },
  { id: "SYNOPSIS", label: "Synopsis", blockLabel: "Synopsis-specific logical structure" },
  { id: "IMAGING_CHARTER", label: "Imaging Charter", blockLabel: "Imaging governance structure", familyIds: ["IMAGING"] },
  { id: "CORE_LAB_MANUAL", label: "Core Lab Manual", blockLabel: "Core Lab governance structure", familyIds: ["IMAGING"], futureSpecialty: "Clinical Operations" },
  { id: "SAP", label: "Statistical Analysis Plan", blockLabel: "Statistical analysis requirements structure", futureSpecialty: "Biostatistics" },
  { id: "DATA_MANAGEMENT_PLAN", label: "Data Management Plan", blockLabel: "Data management requirements structure", futureSpecialty: "Data Management" },
  { id: "CRF_SPECIFICATION", label: "CRF Specification", blockLabel: "CRF specification structure", futureSpecialty: "Data Management" },
  { id: "DATA_DICTIONARY", label: "Data Dictionary", blockLabel: "Data dictionary structure", futureSpecialty: "Data Management" },
  { id: "MONITORING_PLAN", label: "Monitoring Plan", blockLabel: "Monitoring structure", futureSpecialty: "Clinical Operations" },
  { id: "QUALITY_PLAN", label: "Quality Plan", blockLabel: "Quality governance structure", futureSpecialty: "Quality" },
  { id: "RISK_PLAN", label: "Risk Plan", blockLabel: "Risk governance structure", futureSpecialty: "Quality" },
  { id: "TRAINING_PLAN", label: "Training Plan", blockLabel: "Training structure", futureSpecialty: "Clinical Operations" },
  { id: "FUNDING_APPLICATION", label: "Funding Application", blockLabel: "Funding application structure", familyIds: ["PHRC", "RHU", "ANR", "FRANCE_2030"], futureSpecialty: "Funding" },
  { id: "BUDGET", label: "Budget", blockLabel: "Budget structure", futureSpecialty: "Economics" },
  { id: "INVESTIGATOR_BROCHURE", label: "Investigator Brochure", blockLabel: "Investigator brochure structure", familyIds: ["DEVICE", "DRUG"], futureSpecialty: "Regulatory" },
  { id: "SITE_DOCUMENTS", label: "Site Documents", blockLabel: "Site document package structure", futureSpecialty: "Clinical Operations" },
  { id: "PATIENT_INFORMATION", label: "Patient Information", blockLabel: "Patient information structure", familyIds: ["RIPH"], futureSpecialty: "Regulatory" },
  { id: "CONSENT", label: "Consent", blockLabel: "Consent structure", familyIds: ["RIPH"], futureSpecialty: "Regulatory" },
  { id: "REGULATORY_SUBMISSION", label: "Regulatory Submission", blockLabel: "Regulatory submission package structure", familyIds: ["RIPH", "DEVICE", "DRUG"], futureSpecialty: "Regulatory" },
  { id: "PUBLICATION_PLAN", label: "Publication Plan", blockLabel: "Publication planning structure" },
  { id: "REGISTRY_SUBMISSION", label: "Registry Submission", blockLabel: "Registry submission structure", familyIds: ["REGISTRY"], futureSpecialty: "Regulatory" },
  { id: "STUDY_REPORT", label: "Study Report", blockLabel: "Study report structure" },
  { id: "ARCHIVE_MANIFEST", label: "Archive Manifest", blockLabel: "Archive manifest structure", futureSpecialty: "Clinical Operations" },
];

const sharedNodes: TemplateNodeDefinition[] = SHARED_BLOCK_SPECS.map((spec) => ({
  nodeId: `TMP-NODE:${spec.id}`,
  kind: spec.kind,
  label: spec.label,
  description: `Bloc logique réutilisable « ${spec.label} ». Il référence les objets gouvernés sans produire de contenu documentaire.`,
  documentIds: DOCUMENT_SPECS.map((document) => document.id),
  familyIds: [],
  defaultStatus: spec.defaultStatus ?? "CONDITIONAL",
  projectSelectors: [spec.selector],
  requirementTokens: [],
  patternCategories: spec.categories ?? ["Document Structure"],
  dependencyIds: [],
  detailLevels: spec.detailLevels ?? ALL_LEVELS,
  provenance: [...TMP_PROVENANCE],
}));

const documentNodes: TemplateNodeDefinition[] = DOCUMENT_SPECS.flatMap((document) => {
  const future = Boolean(document.futureSpecialty);
  return [
    {
      nodeId: `TMP-DOC:${document.id}`,
      kind: "DOCUMENT" as const,
      label: document.label,
      description: `Définition logique de ${document.label} ; aucun document ni texte n’est généré par TMP-001.`,
      documentIds: [document.id],
      familyIds: document.familyIds ?? [],
      defaultStatus: future ? "FUTURE" as const : "CONDITIONAL" as const,
      projectSelectors: [`PROJECTION:${document.label}`],
      requirementTokens: [document.id, document.label],
      patternCategories: ["Document Structure", "Editorial"],
      dependencyIds: future ? [`TMP-NODE:FUTURE_SPECIALIZED_INPUTS`] : [],
      detailLevels: ALL_LEVELS,
      provenance: [...TMP_PROVENANCE, "DOC-001:future-consumer-contract"],
    },
    {
      nodeId: `TMP-SECTION:${document.id}:PRIMARY`,
      kind: "SECTION" as const,
      label: `${document.label} — primary structure`,
      description: `Section logique primaire de ${document.label}.`,
      documentIds: [document.id],
      familyIds: document.familyIds ?? [],
      defaultStatus: future ? "FUTURE" as const : "CONDITIONAL" as const,
      projectSelectors: [`PROJECTION:${document.label}`],
      requirementTokens: [document.id, document.label],
      patternCategories: ["Document Structure", "Editorial"],
      dependencyIds: [`TMP-DOC:${document.id}`],
      detailLevels: ALL_LEVELS,
      provenance: [...TMP_PROVENANCE],
    },
    {
      nodeId: `TMP-BLOCK:${document.id}:SPECIFIC`,
      kind: future ? "FUTURE_BLOCK" as const : "BLOCK" as const,
      label: document.blockLabel,
      description: `Emplacement logique spécifique à ${document.label}, sans contenu scientifique, réglementaire ou rédactionnel.`,
      documentIds: [document.id],
      familyIds: document.familyIds ?? [],
      defaultStatus: future ? "FUTURE" as const : "CONDITIONAL" as const,
      projectSelectors: [`PROJECTION:${document.label}`, ...(future ? [`SPECIALTY:${document.futureSpecialty}`] : [])],
      requirementTokens: [document.id, document.label],
      patternCategories: document.id.includes("IMAGING") || document.id.includes("CORE_LAB") ? ["Document Structure", "Imaging", "CoreLab"] : ["Document Structure"],
      dependencyIds: future ? [`TMP-NODE:FUTURE_SPECIALIZED_INPUTS`] : [],
      detailLevels: ALL_LEVELS,
      provenance: [...TMP_PROVENANCE],
    },
  ];
});

const sourceReferenceNodes: TemplateNodeDefinition[] = [
  ["TMP-REF:RESEARCH_PROJECT", "Research Project source"],
  ["TMP-REF:REG-001", "Applicable Requirement Set source"],
  ["TMP-REF:DOC-002", "Documentary Pattern Graph source"],
].map(([nodeId, label]) => ({
  nodeId,
  kind: "REFERENCE",
  label,
  description: "Référence de source en lecture seule.",
  documentIds: [],
  familyIds: [],
  defaultStatus: "CONDITIONAL",
  projectSelectors: [],
  requirementTokens: [],
  patternCategories: [],
  dependencyIds: [],
  detailLevels: ALL_LEVELS,
  provenance: [...TMP_PROVENANCE],
}));

const relation = (fromId: string, type: TemplateRelation["type"], toId: string, reason: string): TemplateRelation => ({
  relationId: `TMP-REL:${templateDigest([fromId, type, toId]).slice(5, 17).toUpperCase()}`,
  fromId,
  type,
  toId,
  reason,
  provenance: [...TMP_PROVENANCE],
});

const structuralRelations = DOCUMENT_SPECS.flatMap((document) => [
  relation(`TMP-DOC:${document.id}`, "CONTAINS", `TMP-SECTION:${document.id}:PRIMARY`, "Le document logique contient sa section primaire."),
  relation(`TMP-SECTION:${document.id}:PRIMARY`, "CONTAINS", `TMP-BLOCK:${document.id}:SPECIFIC`, "La section référence son bloc spécifique sans duplication."),
  relation(`TMP-SECTION:${document.id}:PRIMARY`, "CONTAINS", "TMP-NODE:PROJECT_IDENTITY", "Le bloc partagé est référencé par plusieurs définitions documentaires."),
  relation(`TMP-SECTION:${document.id}:PRIMARY`, "CONTAINS", "TMP-NODE:UNKNOWNS", "Les inconnues restent visibles dans toute projection future."),
  relation(`TMP-SECTION:${document.id}:PRIMARY`, "CONTAINS", "TMP-NODE:PROVENANCE", "La provenance reste visible dans toute projection future."),
  relation(`TMP-SECTION:${document.id}:PRIMARY`, "GENERATES", `TMP-DOC:${document.id}`, "Relation de composition logique pour un futur consommateur ; TMP-001 ne génère aucun document."),
  relation(`TMP-DOC:${document.id}`, "USES_PROJECT_OBJECT", "TMP-REF:RESEARCH_PROJECT", "La structure s’appuie sur le Research Project sans le modifier."),
  relation(`TMP-DOC:${document.id}`, "USES_REQUIREMENT", "TMP-REF:REG-001", "La nécessité éventuelle provient exclusivement du résultat REG-001."),
  relation(`TMP-DOC:${document.id}`, "USES_PATTERN", "TMP-REF:DOC-002", "Les patterns sont des références documentaires non normatives."),
  ...(document.futureSpecialty ? [relation(`TMP-DOC:${document.id}`, "DEPENDS_ON", "TMP-NODE:FUTURE_SPECIALIZED_INPUTS", `La complétude dépend du futur moteur ${document.futureSpecialty}.`)] : []),
]);

const semanticRelations: TemplateRelation[] = [
  ...SHARED_BLOCK_SPECS
    .filter((spec) => !["PROJECT_IDENTITY", "UNKNOWNS", "PROVENANCE"].includes(spec.id))
    .map((spec) => relation("TMP-SECTION:PROTOCOL:PRIMARY", "CONTAINS", `TMP-NODE:${spec.id}`, "La structure Protocol de référence expose le bloc partagé sans le dupliquer.")),
  relation("TMP-NODE:OBJECTIVES", "DEPENDS_ON", "TMP-NODE:SCIENTIFIC_QUESTION", "Les objectifs structurés dépendent de la question gouvernée."),
  relation("TMP-NODE:HYPOTHESES", "DEPENDS_ON", "TMP-NODE:SCIENTIFIC_QUESTION", "Les hypothèses structurées dépendent de la question gouvernée."),
  relation("TMP-NODE:ENDPOINTS", "REQUIRES", "TMP-NODE:OBJECTIVES", "La structure des critères conserve sa dépendance aux objectifs."),
  relation("TMP-NODE:REVIEW_NOTES", "OPTIONALLY_REQUIRES", "TMP-NODE:HUMAN_DECISIONS", "Les notes de revue n’existent que sur décision humaine explicite."),
  relation("TMP-DOC:PROTOCOL", "PRECEDES", "TMP-DOC:STUDY_REPORT", "Le rapport d’étude est logiquement postérieur au protocole."),
  relation("TMP-DOC:STUDY_REPORT", "FOLLOWS", "TMP-DOC:PROTOCOL", "Le rapport d’étude suit logiquement le protocole."),
  relation("TMP-DOC:CORE_LAB_MANUAL", "SPECIALIZES", "TMP-DOC:IMAGING_CHARTER", "Le manuel Core Lab est une spécialisation documentaire possible de la gouvernance Imaging."),
  relation("TMP-DOC:IMAGING_CHARTER", "GENERALIZES", "TMP-DOC:CORE_LAB_MANUAL", "L’Imaging Charter porte la structure plus générale."),
  relation("TMP-DOC:CONSENT", "REQUIRES", "TMP-DOC:PATIENT_INFORMATION", "Une exigence de consentement conserve son lien structurel avec l’information participant."),
  relation("TMP-DOC:SITE_DOCUMENTS", "OPTIONALLY_REQUIRES", "TMP-DOC:TRAINING_PLAN", "Le besoin de formation doit rester conditionnel à une exigence ou décision explicite."),
];

const graphNodes = [...sharedNodes, ...documentNodes, ...sourceReferenceNodes].sort((left, right) => left.nodeId.localeCompare(right.nodeId));
const graphRelations = [...structuralRelations, ...semanticRelations].sort((left, right) => left.relationId.localeCompare(right.relationId));

export const STUDY_TEMPLATE_GRAPH: TemplateGraph = {
  graphId: "TMP-GRAPH:CLINICAL-STUDY:1.0.0",
  graphVersion: "1.0.0",
  nodes: graphNodes,
  relations: graphRelations,
  digest: templateDigest({ nodes: graphNodes, relations: graphRelations }),
  boundary: "LOGICAL_STRUCTURE_ONLY_NO_DOCUMENT_GENERATION",
};

export const STUDY_TEMPLATE_BLOCKS: BlockDefinition[] = [
  ...SHARED_BLOCK_SPECS.map((spec) => ({
    blockId: `TMP-BLOCK-DEF:${spec.id}`,
    nodeId: `TMP-NODE:${spec.id}`,
    label: spec.label,
    purpose: "Référencer une structure gouvernée sans produire de contenu.",
    reusable: true,
    detailLevels: spec.detailLevels ?? ALL_LEVELS,
    provenance: [...TMP_PROVENANCE],
  })),
  ...DOCUMENT_SPECS.map((document) => ({
    blockId: `TMP-BLOCK-DEF:${document.id}:SPECIFIC`,
    nodeId: `TMP-BLOCK:${document.id}:SPECIFIC`,
    label: document.blockLabel,
    purpose: `Déclarer la place logique propre à ${document.label}.`,
    reusable: false,
    detailLevels: ALL_LEVELS,
    provenance: [...TMP_PROVENANCE],
  })),
].sort((left, right) => left.blockId.localeCompare(right.blockId));

export const STUDY_TEMPLATE_SECTIONS: SectionDefinition[] = DOCUMENT_SPECS.map((document, index) => ({
  sectionId: `TMP-SECTION-DEF:${document.id}:PRIMARY`,
  nodeId: `TMP-SECTION:${document.id}:PRIMARY`,
  label: `${document.label} — primary structure`,
  order: index + 1,
  blockIds: [
    "TMP-BLOCK-DEF:PROJECT_IDENTITY",
    "TMP-BLOCK-DEF:SCIENTIFIC_QUESTION",
    `TMP-BLOCK-DEF:${document.id}:SPECIFIC`,
    "TMP-BLOCK-DEF:UNKNOWNS",
    "TMP-BLOCK-DEF:LIMITATIONS",
    "TMP-BLOCK-DEF:PROVENANCE",
  ],
  detailLevels: ALL_LEVELS,
  provenance: [...TMP_PROVENANCE],
}));

export const STUDY_TEMPLATE_DOCUMENTS: DocumentDefinition[] = DOCUMENT_SPECS.map((document) => ({
  documentId: document.id,
  nodeId: `TMP-DOC:${document.id}`,
  label: document.label,
  familyIds: document.familyIds ?? [],
  sectionIds: [`TMP-SECTION-DEF:${document.id}:PRIMARY`],
  sharedBlockIds: ["TMP-BLOCK-DEF:PROJECT_IDENTITY", "TMP-BLOCK-DEF:SCIENTIFIC_QUESTION", "TMP-BLOCK-DEF:UNKNOWNS", "TMP-BLOCK-DEF:LIMITATIONS", "TMP-BLOCK-DEF:PROVENANCE"],
  variants: [
    { variantId: `${document.id}:FULL`, label: "Full", condition: "requestedDetailLevel = FULL", status: "DECLARED_LOGICAL_VARIANT" },
    { variantId: `${document.id}:SHORT`, label: "Short", condition: "requestedDetailLevel in [SHORT, MINIMAL]", status: "DECLARED_LOGICAL_VARIANT" },
  ],
  detailLevels: ALL_LEVELS,
  futureConsumer: "DOC-001",
  status: "LOGICAL_DEFINITION_ONLY",
  provenance: [...TMP_PROVENANCE, "DOC-001:future-consumer-contract"],
}));

const templateMaterial = {
  templateId: "TMP-STUDY:CLINICAL-STUDY",
  familyIds: STUDY_FAMILY_DEFINITIONS.map((family) => family.familyId),
  graph: STUDY_TEMPLATE_GRAPH,
  documents: STUDY_TEMPLATE_DOCUMENTS,
  sections: STUDY_TEMPLATE_SECTIONS,
  blocks: STUDY_TEMPLATE_BLOCKS,
};

const behaviorDigest = templateDigest(templateMaterial);

export const CLINICAL_STUDY_TEMPLATE: StudyTemplateDefinition = {
  templateId: "TMP-STUDY:CLINICAL-STUDY",
  label: "Clinical Study — multi-axis logical template",
  description: "Structure logique multi-axes pour une étude clinique ; elle ne qualifie ni la science, ni la réglementation, ni le contenu documentaire.",
  templateVersion: "1.0.0",
  templateRevision: 1,
  createdAt: "2026-08-11T00:00:00.000Z",
  updatedAt: "2026-08-11T00:00:00.000Z",
  derivedFrom: null,
  supersedes: null,
  supersededBy: null,
  reason: "Création de TMP-001 V1.",
  provenance: [...TMP_PROVENANCE],
  familyIds: uniqueSorted(STUDY_FAMILY_DEFINITIONS.map((family) => family.familyId)),
  graph: STUDY_TEMPLATE_GRAPH,
  documents: STUDY_TEMPLATE_DOCUMENTS,
  sections: STUDY_TEMPLATE_SECTIONS,
  blocks: STUDY_TEMPLATE_BLOCKS,
  contracts: Array.from({ length: 12 }, (_, index) => `TMP-C${String(index + 1).padStart(2, "0")}`),
  boundary: "COMPOSITION_ONLY_NO_SCIENCE_NO_REQUIREMENT_NO_PATTERN_NO_DOCUMENT",
  behaviorDigest,
  digest: templateDigest({ ...templateMaterial, description: "Clinical Study multi-axis", behaviorDigest }),
};

export const STUDY_TEMPLATE_DEFINITIONS: StudyTemplateDefinition[] = [CLINICAL_STUDY_TEMPLATE];
