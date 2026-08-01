const source = (id, file, label, evidenceStatus = "INTERNAL_SOURCE") => ({ id, file, label, evidenceStatus });

export const sourceCatalog = [
  source("source-irm", "src/pages/IRMImagerieQuantitative.tsx", "Page IRM quantitative"),
  source("source-ct-perfusion", "src/pages/CTPerfusionQuantitative.tsx", "Page CT perfusion quantitative"),
  source("source-ecv", "src/pages/ECVMappingCardiaque.tsx", "Page ECV et mapping T1/T2"),
  source("source-corelab", "src/pages/CorelabEC.tsx", "Page Core Lab"),
  source("source-dicom", "src/pages/AnalyseDICOM.tsx", "Page analyse DICOM"),
  source("source-prestations", "src/pages/Prestations.tsx", "Page prestations"),
  source("source-qc-viewer", "src/components/QCViewer.tsx", "Composant QC Viewer"),
  source("source-projects", "src/data/projects.ts", "Catalogue de projets"),
  source("source-publications", "src/pages/ReferencesPublications.tsx", "Références et publications", "PEER_REVIEWED"),
];

const entity = ({ entityId, entityType, preferredLabel, aliases = [], description, sourceRefs, evidenceStatus, relations = [] }) => ({
  entityId,
  entityType,
  preferredLabel,
  aliases,
  description,
  status: "active",
  visibility: "internal-pilot",
  sourceRefs,
  evidenceStatus,
  relations,
});

export const pilotEntities = [
  entity({ entityId: "modality-mri", entityType: "modality", preferredLabel: "IRM", aliases: ["imagerie par résonance magnétique"], description: "Modalité présente dans l'offre et les pages quantitatives NOXIA.", sourceRefs: ["source-irm"], evidenceStatus: "INTERNAL_SOURCE", relations: [{ type: "APPLIES_TO", targetId: "anatomy-heart", kind: "sourced" }, { type: "APPLIES_TO", targetId: "anatomy-brain", kind: "sourced" }] }),
  entity({ entityId: "modality-ct", entityType: "modality", preferredLabel: "CT", aliases: ["scanner", "tomodensitométrie"], description: "Modalité CT quantitative décrite par les pages NOXIA.", sourceRefs: ["source-ct-perfusion"], evidenceStatus: "INTERNAL_SOURCE", relations: [{ type: "APPLIES_TO", targetId: "anatomy-brain", kind: "sourced" }, { type: "MEASURES", targetId: "biomarker-cbf", kind: "sourced" }] }),
  entity({ entityId: "anatomy-heart", entityType: "anatomy", preferredLabel: "Cœur", aliases: ["myocarde", "cardiaque"], description: "Domaine cardiaque du pilote, limité aux contenus existants.", sourceRefs: ["source-ecv"], evidenceStatus: "INTERNAL_SOURCE", relations: [{ type: "PART_OF", targetId: "workflow-corelab", kind: "structural" }] }),
  entity({ entityId: "anatomy-brain", entityType: "anatomy", preferredLabel: "Cerveau", aliases: ["cérébral", "neuro-imagerie"], description: "Domaine neurovasculaire utilisé par les contenus de perfusion existants.", sourceRefs: ["source-ct-perfusion"], evidenceStatus: "INTERNAL_SOURCE", relations: [{ type: "PART_OF", targetId: "workflow-corelab", kind: "structural" }] }),
  entity({ entityId: "sequence-lge", entityType: "sequence_family", preferredLabel: "Rehaussement tardif", aliases: ["LGE", "Late Gadolinium Enhancement"], description: "Famille de séquence mentionnée dans les contenus d'IRM cardiaque existants.", sourceRefs: ["source-irm", "source-projects"], evidenceStatus: "INTERNAL_SOURCE", relations: [{ type: "USES", targetId: "modality-mri", kind: "sourced" }, { type: "APPLIES_TO", targetId: "anatomy-heart", kind: "sourced" }] }),
  entity({ entityId: "sequence-t1-t2-mapping", entityType: "sequence_family", preferredLabel: "Mapping T1/T2", aliases: ["T1 mapping", "T2 mapping"], description: "Famille de cartographies tissulaires présentée dans les pages cardiaques existantes.", sourceRefs: ["source-ecv"], evidenceStatus: "INTERNAL_SOURCE", relations: [{ type: "USES", targetId: "modality-mri", kind: "sourced" }, { type: "APPLIES_TO", targetId: "anatomy-heart", kind: "sourced" }, { type: "MEASURES", targetId: "biomarker-ecv", kind: "sourced" }] }),
  entity({ entityId: "biomarker-ecv", entityType: "biomarker", preferredLabel: "Volume extracellulaire", aliases: ["ECV", "Extracellular Volume"], description: "Biomarqueur tissulaire décrit avec ses contraintes méthodologiques dans le contenu NOXIA.", sourceRefs: ["source-ecv"], evidenceStatus: "INTERNAL_SOURCE", relations: [{ type: "SUPPORTS", targetId: "workflow-corelab", kind: "structural" }] }),
  entity({ entityId: "biomarker-cbf", entityType: "biomarker", preferredLabel: "Débit sanguin cérébral", aliases: ["CBF", "Cerebral Blood Flow"], description: "Mesure de perfusion explicitement traitée par la page CT perfusion.", sourceRefs: ["source-ct-perfusion"], evidenceStatus: "INTERNAL_SOURCE", relations: [{ type: "APPLIES_TO", targetId: "anatomy-brain", kind: "sourced" }, { type: "SUPPORTS", targetId: "workflow-corelab", kind: "structural" }] }),
  entity({ entityId: "workflow-corelab", entityType: "workflow", preferredLabel: "Workflow Core Lab", aliases: ["Core Lab imagerie"], description: "Workflow de structuration multicentrique présenté par NOXIA.", sourceRefs: ["source-corelab"], evidenceStatus: "INTERNAL_SOURCE", relations: [{ type: "USES", targetId: "tool-qc-viewer", kind: "sourced" }, { type: "PRODUCES", targetId: "service-imagerie-quantitative", kind: "structural" }] }),
  entity({ entityId: "tool-qc-viewer", entityType: "tool", preferredLabel: "QC Viewer", aliases: ["viewer de contrôle qualité"], description: "Composant de démonstration de contrôle qualité déjà présent dans le dépôt.", sourceRefs: ["source-qc-viewer", "source-projects"], evidenceStatus: "INTERNAL_SOURCE", relations: [{ type: "SUPPORTS", targetId: "workflow-corelab", kind: "sourced" }] }),
  entity({ entityId: "service-imagerie-quantitative", entityType: "service", preferredLabel: "Prestation d'imagerie quantitative", aliases: ["prestation Core Lab IRM/CT"], description: "Prestation méthodologique décrite sur la page commerciale existante.", sourceRefs: ["source-prestations"], evidenceStatus: "INTERNAL_SOURCE", relations: [{ type: "IMPLEMENTED_BY", targetId: "workflow-corelab", kind: "structural" }] }),
  entity({ entityId: "reference-stroke-2024", entityType: "publication", preferredLabel: "Référence scientifique NOXIA 2024", aliases: ["10.1161/STROKEAHA.124.047311"], description: "Publication identifiée par DOI dans la page de références existante.", sourceRefs: ["source-publications"], evidenceStatus: "PEER_REVIEWED", relations: [{ type: "DOCUMENTS", targetId: "biomarker-cbf", kind: "structural" }] }),
];

const projection = ({ editorialId, entityIds, templateKey, targetPath, audience, depth, evidenceRequirement, relations = [], title }) => ({
  id: editorialId,
  editorialId,
  entityIds,
  templateKey,
  targetPath,
  path: targetPath,
  audience,
  depth,
  evidenceRequirement,
  title,
  status: "fixture",
  indexable: false,
  publicationStatus: "existing-route-only",
  relations,
});

export const pilotProjections = [
  projection({ editorialId: "pilot-irm-hub", entityIds: ["modality-mri", "sequence-lge", "sequence-t1-t2-mapping"], templateKey: "hub", targetPath: "/irm-imagerie-quantitative", audience: "équipes de recherche clinique", depth: 0, evidenceRequirement: "INTERNAL_SOURCE", title: "IRM quantitative multicentrique" }),
  projection({ editorialId: "pilot-ecv-guide", entityIds: ["sequence-t1-t2-mapping", "biomarker-ecv", "anatomy-heart"], templateKey: "guide", targetPath: "/ecv-mapping-t1-t2-irm-cardiaque", audience: "équipes d'IRM cardiaque", depth: 1, evidenceRequirement: "INTERNAL_SOURCE", title: "ECV et mapping T1/T2", relations: { parentId: "pilot-irm-hub" } }),
  projection({ editorialId: "pilot-corelab-workflow", entityIds: ["workflow-corelab", "tool-qc-viewer"], templateKey: "workflow", targetPath: "/corelab-essais-cliniques", audience: "promoteurs et équipes multicentriques", depth: 1, evidenceRequirement: "INTERNAL_SOURCE", title: "Core Lab imagerie", relations: { parentId: "pilot-irm-hub", relatedIds: ["pilot-qc-tool"] } }),
  projection({ editorialId: "pilot-ct-perfusion-guide", entityIds: ["modality-ct", "anatomy-brain", "biomarker-cbf"], templateKey: "guide", targetPath: "/ct-perfusion-quantitative-avc", audience: "équipes neurovasculaires", depth: 0, evidenceRequirement: "INTERNAL_SOURCE", title: "CT perfusion quantitative" }),
  projection({ editorialId: "pilot-dicom-technical", entityIds: ["workflow-corelab", "modality-mri", "modality-ct"], templateKey: "technical-sheet", targetPath: "/analyse-dicom", audience: "équipes de données et Core Lab", depth: 1, evidenceRequirement: "INTERNAL_SOURCE", title: "Analyse DICOM", relations: { parentId: "pilot-corelab-workflow" } }),
  projection({ editorialId: "pilot-qc-tool", entityIds: ["tool-qc-viewer", "biomarker-cbf"], templateKey: "tool", targetPath: "/projet/perfusion-segmentation", audience: "équipes de contrôle qualité", depth: 2, evidenceRequirement: "INTERNAL_SOURCE", title: "Outil de contrôle qualité", relations: { parentId: "pilot-corelab-workflow" } }),
  projection({ editorialId: "pilot-service", entityIds: ["service-imagerie-quantitative", "workflow-corelab"], templateKey: "service", targetPath: "/prestations-imagerie-medicale", audience: "promoteurs et centres investigateurs", depth: 0, evidenceRequirement: "INTERNAL_SOURCE", title: "Prestations d'imagerie quantitative" }),
  projection({ editorialId: "pilot-reference", entityIds: ["reference-stroke-2024", "biomarker-cbf"], templateKey: "reference", targetPath: "/references-publications", audience: "lecteurs scientifiques", depth: 1, evidenceRequirement: "PEER_REVIEWED", title: "Références et publications", relations: { relatedIds: ["pilot-ct-perfusion-guide"] } }),
];
