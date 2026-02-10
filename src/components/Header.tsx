// ============================================================
// src/data/projects.ts
// ============================================================

export interface Project {
  id: string;
  title: string;
  description: string;
  modality: string;
  analysisType: string;
  technologies: string[];
  thumbnailUrl: string;
  sliceCount: number;
  nativeSlices: string[];
  processedSlices: string[];
  useSliderOverlay?: boolean;
}

/**
 * Base RAW GitHub URL for images
 */
const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

const slices = (basePath: string, count = 16): string[] =>
  Array.from({ length: count }, (_, i) =>
    `${RAW_BASE}/${basePath}/slice_${String(i).padStart(3, "0")}.png`
  );

// ============================================================
// EDITORIAL (PAGE PROJETS)
// ============================================================

export const projectsEditorial = {
  intro: [
    "Les projets présentés ici sont des exemples représentatifs de problématiques rencontrées en imagerie médicale (CT, IRM, multimodal) et des approches méthodologiques mises en œuvre pour y répondre.",
    "Ils ne constituent pas des solutions figées ni des produits standardisés. Chaque étude, chaque jeu de données et chaque contexte clinique ou de recherche possède ses propres contraintes.",
    "La démarche repose avant tout sur l’échange et la compréhension du besoin réel afin de définir une approche adaptée : segmentation, recalage, quantification, développement d’outils sur mesure ou accompagnement méthodologique.",
    "Les aspects pratiques — périmètre, délais et cadre tarifaire — sont abordés de manière simple et proportionnée, en fonction du projet et de ses objectifs."
  ],
};

// ============================================================
// PROJECTS
// ============================================================

export const projects: Project[] = [
  {
    id: "perfusion-segmentation",
    title: "Perfusion CT / IRM",
    description:
      "Segmentation automatique des lésions de perfusion cérébrale basée sur des seuils paramétrables et une validation physiopathologique.",
    modality: "CT Perfusion / MRI",
    analysisType: "Segmentation",
    technologies: ["Python", "NiBabel", "NumPy", "Matplotlib"],
    thumbnailUrl: `${RAW_BASE}/projets/perfusion.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
  },
  {
    id: "neuro-onco",
    title: "Neuro-oncologie IRM",
    description:
      "Segmentation multi-composants des lésions tumorales cérébrales (cœur nécrotique, anneau, régions périphériques).",
    modality: "MRI",
    analysisType: "Segmentation",
    technologies: ["Python", "NiBabel", "SimpleITK"],
    thumbnailUrl: `${RAW_BASE}/projets/neuro-onco.png`,
    sliceCount: 5,
    nativeSlices: slices("neuro-onco/natives", 5),
    processedSlices: slices("neuro-onco/overlays", 5),
  },
  {
    id: "recalage",
    title: "Recalage CT / IRM",
    description:
      "Pipelines de recalage rigide et affine pour données multimodales et longitudinales.",
    modality: "MRI / CT",
    analysisType: "Registration",
    technologies: ["ANTsPy", "Elastix", "SimpleITK"],
    thumbnailUrl: `${RAW_BASE}/projets/registration.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
  },
  {
    id: "cardiac",
    title: "IRM cardiaque",
    description:
      "Quantification fonctionnelle cardiaque et analyse du rehaussement tardif.",
    modality: "MRI Cardiac",
    analysisType: "Quantification",
    technologies: ["Python", "SimpleITK"],
    thumbnailUrl: `${RAW_BASE}/projets/cardio.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
  },
  {
    id: "ct-scan",
    title: "Expertise CT",
    description:
      "Analyse morphologique et quantification anatomique en imagerie CT.",
    modality: "CT Scan",
    analysisType: "Quantification",
    technologies: ["DICOM", "NumPy"],
    thumbnailUrl: `${RAW_BASE}/projets/ct.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
  },
  {
    id: "outils",
    title: "Outils sur mesure",
    description:
      "Développement d’outils dédiés à l’analyse et à l’exploration avancée de données d’imagerie médicale.",
    modality: "CT / MRI",
    analysisType: "Prototypage",
    technologies: ["Python", "DICOM"],
    thumbnailUrl: `${RAW_BASE}/projets/outils.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
  },
];