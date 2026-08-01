import { KNOWLEDGE_GRAPH_UPDATED_AT, KNOWLEDGE_GRAPH_VERSION } from "./schema.mjs";

const source = (sourceId, path, label, kind = "repository-source") => ({
  sourceId,
  path,
  label,
  kind,
  version: KNOWLEDGE_GRAPH_VERSION,
  updatedAt: KNOWLEDGE_GRAPH_UPDATED_AT,
});

export const sources = Object.freeze([
  source("source:projects", "src/data/projects.ts", "Catalogue de projets NOXIA"),
  source("source:irm", "src/pages/IRMImagerieQuantitative.tsx", "IRM quantitative"),
  source("source:ct", "src/pages/CTImagerieQuantitative.tsx", "CT quantitatif"),
  source("source:ct-perfusion", "src/pages/CTPerfusionQuantitative.tsx", "CT perfusion quantitative"),
  source("source:ecv", "src/pages/ECVMappingCardiaque.tsx", "ECV et mapping T1/T2"),
  source("source:corelab", "src/pages/CorelabEC.tsx", "Core Lab IRM cardiovasculaire"),
  source("source:dicom", "src/pages/AnalyseDICOM.tsx", "Analyse DICOM"),
  source("source:methodology", "src/pages/MethodologieImagerieQuantitative.tsx", "Méthodologie imagerie quantitative"),
  source("source:segmentation", "src/pages/SegmentationIRM.tsx", "Segmentation IRM"),
  source("source:perfusion-metabolic", "src/pages/PerfusionMetaboliqueNeuro.tsx", "Perfusion métabolique neuro"),
  source("source:perfusion-hemodynamic", "src/pages/PerfusionHemodynamiqueNeuro.tsx", "Perfusion hémodynamique neuro"),
  source("source:cmro2", "src/pages/CMRO2Imagerie.tsx", "CMRO2 en imagerie cérébrale"),
  source("source:oef", "src/pages/OEFImagerie.tsx", "OEF en imagerie cérébrale"),
  source("source:publications", "src/pages/ReferencesPublications.tsx", "Registre de publications affiché"),
  source("source:about", "src/pages/APropos.tsx", "Études et contributions affichées"),
  source("source:services", "src/pages/Prestations.tsx", "Prestations NOXIA"),
  source("source:cardiac-viewer", "src/components/CardiacViewer.tsx", "Viewer cardiaque"),
  source("source:ct-viewer", "src/components/CTScanViewer.tsx", "Viewer CT"),
  source("source:neuro-viewer", "src/components/NeuroOncoViewer.tsx", "Viewer neuro-oncologie"),
  source("source:perfusion-viewer", "src/components/PerfusionSegmentationViewer.tsx", "Viewer perfusion et segmentation"),
  source("source:qc-viewer", "src/components/QCViewer.tsx", "Viewer de contrôle qualité"),
  source("source:registration-viewer", "src/components/RegistrationViewer.tsx", "Viewer de recalage"),
  source("source:slice-viewer", "src/components/SliceViewer.tsx", "Viewer de coupes"),
  source("source:tools-viewer", "src/components/OutilsViewer.tsx", "Démonstrations d'outils sur mesure"),
]);

export const sourceById = Object.freeze(Object.fromEntries(sources.map((item) => [item.sourceId, item])));
