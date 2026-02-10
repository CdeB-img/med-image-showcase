// ============================================================
// src/data/projects.ts
// ============================================================

/* ============================================================
   TYPES
============================================================ */

export interface Project {
  id: string;
  title: string;
  description: string;
  modality: string;
  analysisType:
    | "Segmentation"
    | "Registration"
    | "Quantification"
    | "Prototypage";
  technologies: string[];
  thumbnailUrl: string;
  sliceCount: number;
  nativeSlices: string[];
  processedSlices: string[];
  useSliderOverlay?: boolean;
}

/* ============================================================
   CONSTANTS
============================================================ */

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

/**
 * Génère slice_000.png → slice_XXX.png
 */
const slices = (basePath: string, count: number): string[] =>
  Array.from({ length: count }, (_, i) =>
    `${RAW_BASE}/${basePath}/slice_${String(i).padStart(3, "0")}.png`
  );

<<<<<<< HEAD
// ============================================================
// PROJECTS
// ============================================================
=======


/* ============================================================
   PROJECTS
============================================================ */

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
      "Segmentation multi-composants des lésions tumorales cérébrales (cœur nécrotique, anneau tumoral, régions périphériques).",
    modality: "MRI",
    analysisType: "Segmentation",
    technologies: ["Python", "NiBabel", "SimpleITK"],
    thumbnailUrl: `${RAW_BASE}/projets/neuro-onco.png`,
    sliceCount: 5,
    nativeSlices: slices("neuro-onco/natives", 5),
    processedSlices: slices("neuro-onco/overlays", 5),
    useSliderOverlay: true,
  },

  {
    id: "recalage",
    title: "Recalage CT / IRM",
    description:
      "Pipelines de recalage rigide et affine pour données multimodales (CT/IRM) et suivis longitudinaux.",
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
      "Quantification fonctionnelle cardiaque (ciné IRM) et analyse du rehaussement tardif myocardique.",
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
      "Analyse morphologique et quantification anatomique en imagerie CT, à visée clinique ou de recherche.",
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
      "Développement d’outils dédiés à l’analyse, la quantification et l’exploration avancée de données d’imagerie médicale.",
    modality: "CT / MRI",
    analysisType: "Prototypage",
    technologies: ["Python", "DICOM"],
    thumbnailUrl: `${RAW_BASE}/projets/outils.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
  },
];

// ============================================================
// HELPERS
// ============================================================

export const getProjectById = (id: string) => {
  return projects.find((p) => p.id === id);
};

export const getAdjacentProjects = (id: string) => {
  const index = projects.findIndex((p) => p.id === id);

  return {
    prev: index > 0 ? projects[index - 1] : null,
    next: index < projects.length - 1 ? projects[index + 1] : null,
  };
};