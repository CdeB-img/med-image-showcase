// ============================================================
// src/data/projects.ts
// ============================================================

export interface Project {
  id: string;
  title: string;
  description: string;
  seoTitle: string;
  modality: string;
  analysisType: string;
  technologies: string[];
  thumbnailUrl: string;
  sliceCount: number;
  nativeSlices: string[];
  processedSlices: string[];
  context: string;
  contribution: string;
  limitations: string;
  status: string;
  relatedLinks: Array<{ label: string; to: string }>;
  useSliderOverlay?: boolean;
}

/**
 * Base RAW GitHub URL for images
 */
const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

/**
 * Generate slice range: slice_000.png to slice_015.png
 */
const slices = (basePath: string, count = 16): string[] =>
  Array.from({ length: count }, (_, i) =>
    `${RAW_BASE}/${basePath}/slice_${String(i).padStart(3, "0")}.png`
  );

// ============================================================
// PROJECTS
// ============================================================

export const projects: Project[] = [
  // ============================================================
  // PERFUSION SEGMENTATION
  // ============================================================
  {
    id: "perfusion-segmentation",
    title: "Perfusion cérébrale CT/IRM",
    description:
      "Segmentation automatique des lesions de perfusion cerebrale basee sur des seuils parametrables et une validation physiopathologique rigoureuse.",
    seoTitle: "Segmentation perfusion CT/IRM: démonstration de pipeline | NOXIA",
    modality: "CT perfusion / IRM",
    analysisType: "Segmentation",
    technologies: ["Python", "NiBabel", "NumPy", "Matplotlib", "React"],
    thumbnailUrl: `${RAW_BASE}/projets/perfusion.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
    context:
      "Démonstration d'exploration de cartes de perfusion, de diffusion et de masques dérivés en contexte neurovasculaire.",
    contribution:
      "Visualisation conjointe des cartes et des masques pour tester des règles de seuil, de cohérence spatiale et de contrôle qualité.",
    limitations:
      "Il s'agit d'une démonstration méthodologique. Les seuils, volumes et interprétations ne sont pas destinés à une décision clinique sans protocole, validation et contrôle qualité spécifiques.",
    status: "Démonstration de pipeline et de lecture QC.",
    relatedLinks: [
      { label: "Perfusion cérébrale", to: "/perfusion-cerebrale" },
      { label: "Perfusion métabolique", to: "/perfusion-metabolique-neuro-imagerie" },
      { label: "CT perfusion AVC", to: "/ct-perfusion-quantitative-avc" },
    ],
  },

  // ============================================================
  // NEURO-ONCOLOGIE
  // ============================================================
  {
    id: "neuro-onco",
    title: "Neuro-oncologie IRM",
    description:
      "Segmentation automatique des lesions tumorales cerebrales avec distinction multi-composants : coeur necrotique, anneau tumoral et regions peripheriques.",
    seoTitle: "Segmentation IRM neuro-oncologique: démonstration | NOXIA",
    modality: "IRM",
    analysisType: "Segmentation",
    technologies: ["Python", "NiBabel", "NumPy", "SimpleITK"],
    thumbnailUrl: `${RAW_BASE}/projets/neuro-onco.png`,
    sliceCount: 5,
    nativeSlices: slices("neuro-onco/natives", 5),
    processedSlices: slices("neuro-onco/overlays", 5),
    context:
      "Démonstration de segmentation multi-composants sur IRM cérébrale, avec visualisation des régions centrales, périphériques et nécrotiques.",
    contribution:
      "Structuration d'une lecture par composantes, génération d'overlays et contrôle visuel des limites de segmentation.",
    limitations:
      "Cette démonstration ne remplace pas une validation de performance sur cohorte indépendante ni une interprétation diagnostique ou thérapeutique.",
    status: "Démonstration technique de segmentation et de visualisation.",
    relatedLinks: [
      { label: "Segmentation IRM", to: "/segmentation-irm" },
      { label: "Recalage multimodal", to: "/recalage-multimodal" },
      { label: "IRM quantitative", to: "/irm-imagerie-quantitative" },
    ],
  },

  // ============================================================
  // RECALAGE (Registration)
  // ============================================================
  {
    id: "recalage",
    title: "Recalage IRM / CT",
    description:
      "Pipelines de recalage rigide et affine pour l’alignement multimodal CT/IRM et monomodal IRM longitudinal, avec visualisation par superposition.",
    seoTitle: "Recalage IRM/CT: démonstration multimodale | NOXIA",
    modality: "IRM / CT",
    analysisType: "Recalage",
    technologies: ["Python", "ANTsPy", "Elastix", "SimpleITK", "NiBabel"],
    thumbnailUrl: `${RAW_BASE}/projets/registration.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
    context:
      "Démonstration d'alignement monomodal longitudinal et multimodal CT/IRM, avec superposition des images de référence et recalées.",
    contribution:
      "Comparaison visuelle des transformations rigides et affines, avec mise en évidence du rôle des paramètres de recalage dans une analyse quantitative.",
    limitations:
      "Une superposition visuellement satisfaisante ne suffit pas à valider un recalage. Les métriques, zones d'intérêt et critères d'acceptation restent à définir par protocole.",
    status: "Démonstration de recalage et de contrôle visuel.",
    relatedLinks: [
      { label: "Recalage multimodal", to: "/recalage-multimodal" },
      { label: "Analyse DICOM", to: "/analyse-dicom" },
      { label: "Ingénierie quantitative", to: "/ingenierie-imagerie-quantitative" },
    ],
  },

  // ============================================================
  // CARDIAC MRI
  // ============================================================
  {
    id: "cardiac",
    title: "IRM cardiaque",
    description:
      "Évaluation de la fonction cardiaque en ciné (diastole/systole) et du rehaussement tardif pour une quantification de la cicatrice myocardique.",
    seoTitle: "IRM cardiaque: fonction et LGE en démonstration | NOXIA",
    modality: "IRM cardiaque",
    analysisType: "Quantification",
    technologies: ["Python", "SimpleITK", "NumPy", "Matplotlib"],
    thumbnailUrl: `${RAW_BASE}/projets/cardio.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
    context:
      "Démonstration de lecture d'IRM cardiaque cine et de rehaussement tardif, orientée fonction ventriculaire et quantification de cicatrice.",
    contribution:
      "Exploration des étapes nécessaires pour passer de la visualisation des séquences à des mesures cardiaques documentées.",
    limitations:
      "Les mesures présentées relèvent d'une démonstration. Leur emploi comme endpoint impose des règles de segmentation, de timing, de QA et de lecture centralisée.",
    status: "Démonstration de quantification IRM cardiaque.",
    relatedLinks: [
      { label: "IRM quantitative", to: "/irm-imagerie-quantitative" },
      { label: "ECV et mapping T1/T2", to: "/ecv-mapping-t1-t2-irm-cardiaque" },
      { label: "Biomarqueurs IRM cardiaque", to: "/biomarqueurs-irm-cardiaque-essais-cliniques" },
    ],
  },

  // ============================================================
  // CT SCAN
  // ============================================================
  {
    id: "ct-scan",
    title: "Analyse CT quantitative",
    description:
      "Analyse morphologique, préparation des données et quantification anatomique de structures cardiovasculaires et thoraciques en CT.",
    seoTitle: "CT quantitatif: démonstration d'analyse anatomique | NOXIA",
    modality: "CT",
    analysisType: "Quantification",
    technologies: ["Python", "SimpleITK", "DICOM", "NumPy"],
    thumbnailUrl: `${RAW_BASE}/projets/ct.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
    context:
      "Démonstration de préparation et d'analyse d'images CT pour des structures cardiovasculaires et thoraciques.",
    contribution:
      "Organisation des données, lecture morphologique et préparation de mesures anatomiques pour une chaîne quantitative.",
    limitations:
      "Cette page ne présente pas une calibration validée, un dispositif médical ni une performance clinique généralisable.",
    status: "Démonstration d'analyse CT et de préparation des données.",
    relatedLinks: [
      { label: "CT quantitatif", to: "/ct-imagerie-quantitative" },
      { label: "Quantification CT", to: "/quantification-ct" },
      { label: "CT spectral avancé", to: "/ct-quantitatif-avance-imagerie-spectrale" },
    ],
  },

  // ============================================================
  // OUTILS SUR MESURE
  // ============================================================
  {
    id: "outils",
    title: "Outils sur mesure",
    description:
      "Developpement d'outils dedies a l'analyse, la quantification et l'exploration avancee des donnees d'imagerie medicale (pneumologie CT, CT spectral).",
    seoTitle: "Outils d'imagerie médicale sur mesure: démonstrations | NOXIA",
    modality: "CT",
    analysisType: "Prototypage",
    technologies: ["Python", "DICOM", "NumPy", "Matplotlib"],
    thumbnailUrl: `${RAW_BASE}/projets/outils.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
    context:
      "Démonstrations d'outils dédiés à l'exploration, à la quantification et à la visualisation de données CT, notamment spectrales.",
    contribution:
      "Prototypage de viewers et de modules métier pour rendre les données, les mesures et les contrôles qualité plus lisibles.",
    limitations:
      "Ces outils sont des démonstrations de travail; ils ne constituent pas des produits cliniques validés ni des logiciels de diagnostic.",
    status: "Démonstrations d'outils et de viewers métier.",
    relatedLinks: [
      { label: "Ingénierie quantitative", to: "/ingenierie-imagerie-quantitative" },
      { label: "CT spectral avancé", to: "/ct-quantitatif-avance-imagerie-spectrale" },
      { label: "Analyse DICOM", to: "/analyse-dicom" },
    ],
  },
];

// ============================================================
// HELPERS
// ============================================================

export const getProjectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);

export const getAdjacentProjects = (id: string) => {
  const idx = projects.findIndex((p) => p.id === id);

  return {
    prev: idx > 0 ? projects[idx - 1] : null,
    next: idx < projects.length - 1 ? projects[idx + 1] : null,
  };
};
