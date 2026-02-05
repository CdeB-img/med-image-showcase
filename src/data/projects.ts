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
    title: "Segmentation experte | Perfusion CT/IRM",
    description:
      "Segmentation automatique des lesions de perfusion cerebrale basee sur des seuils parametrables et une validation physiopathologique rigoureuse.",
    modality: "CT Perfusion / MRI",
    analysisType: "Segmentation",
    technologies: ["Python", "NiBabel", "NumPy", "Matplotlib", "React"],
    thumbnailUrl: `${RAW_BASE}/projets/perfusion.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
  },

  // ============================================================
  // NEURO-ONCOLOGIE
  // ============================================================
  {
    id: "neuro-onco",
    title: "Segmentation experte | Neuro-Oncologie IRM",
    description:
      "Segmentation automatique des lesions tumorales cerebrales avec distinction multi-composants : coeur necrotique, anneau tumoral et regions peripheriques.",
    modality: "MRI",
    analysisType: "Segmentation",
    technologies: ["Python", "NiBabel", "NumPy", "SimpleITK"],
    thumbnailUrl: `${RAW_BASE}/projets/neuro-onco.png`,
    sliceCount: 5,
    nativeSlices: slices("neuro-onco/natives", 5),
    processedSlices: slices("neuro-onco/overlays", 5),
  },

  // ============================================================
  // RECALAGE (Registration)
  // ============================================================
  {
    id: "recalage",
    title: "MRI / CT Registration",
    description:
      "Rigid and affine registration pipelines for multimodal (CT/MRI) and monomodal (MRI longitudinal) image alignment with overlay visualization.",
    modality: "MRI / CT",
    analysisType: "Registration",
    technologies: ["Python", "ANTsPy", "Elastix", "SimpleITK", "NiBabel"],
    thumbnailUrl: `${RAW_BASE}/projets/registration.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
  },

  // ============================================================
  // CARDIAC MRI
  // ============================================================
  {
    id: "cardiac",
    title: "Cardiac MRI",
    description:
      "Cardiac function assessment (cine diastole/systole) and late gadolinium enhancement for myocardial scar quantification.",
    modality: "MRI Cardiac",
    analysisType: "Quantification",
    technologies: ["Python", "SimpleITK", "NumPy", "Matplotlib"],
    thumbnailUrl: `${RAW_BASE}/projets/cardio.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
  },

  // ============================================================
  // CT SCAN
  // ============================================================
  {
    id: "ct-scan",
    title: "CT Scan Expertise",
    description:
      "Advanced CT imaging expertise covering morphological analysis, data preparation and anatomical quantification for cardiovascular and thoracic structures.",
    modality: "CT Scan",
    analysisType: "Quantification",
    technologies: ["Python", "SimpleITK", "DICOM", "NumPy"],
    thumbnailUrl: `${RAW_BASE}/projets/ct.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
  },

  // ============================================================
  // OUTILS SUR MESURE
  // ============================================================
  {
    id: "outils",
    title: "Outils sur mesure",
    description:
      "Developpement d'outils dedies a l'analyse, la quantification et l'exploration avancee des donnees d'imagerie medicale (pneumologie CT, CT spectral).",
    modality: "CT Scan",
    analysisType: "Prototypage",
    technologies: ["Python", "DICOM", "NumPy", "Matplotlib"],
    thumbnailUrl: `${RAW_BASE}/projets/outils.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
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