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
  // PERFUSION SEGMENTATION (ex-QC)
  // ============================================================
  {
    id: "perfusion-segmentation",
    title: "Segmentation experte — Perfusion CT/IRM",
    description:
      "Segmentation automatique des lésions de perfusion cérébrale basée sur des seuils paramétrables et une validation physiopathologique rigoureuse.",
    modality: "CT Perfusion / MRI",
    analysisType: "Segmentation",
    technologies: ["Python", "NiBabel", "NumPy", "Matplotlib", "React"],
    thumbnailUrl: `${RAW_BASE}/perfusion/exemple/Tmax_seq/slice_008.png`,
    sliceCount: 0,
    nativeSlices: [],
    processedSlices: [],
  },

  // ============================================================
  // NEURO-ONCOLOGIE
  // ============================================================
  {
    id: "neuro-onco",
    title: "Segmentation experte — Neuro-Oncologie IRM",
    description:
      "Segmentation automatique des lésions tumorales cérébrales avec distinction multi-composants : cœur nécrotique, anneau tumoral et régions périphériques.",
    modality: "MRI",
    analysisType: "Segmentation",
    technologies: ["Python", "NiBabel", "NumPy", "SimpleITK"],
    thumbnailUrl: `${RAW_BASE}/neuro-onco/overlays/slice_002.png`,
    sliceCount: 5,
    nativeSlices: slices("neuro-onco/natives", 5),
    processedSlices: slices("neuro-onco/overlays", 5),
  },

  // ============================================================
  // DIFFUSION
  // ============================================================
  {
    id: "diffusion",
    title: "Diffusion MRI",
    description:
      "Ischemic lesion segmentation on diffusion-weighted MRI sequences.",
    modality: "MRI / CT",
    analysisType: "Segmentation",
    technologies: ["Python", "ANTsPy", "NiBabel", "NumPy", "SimpleITK"],
    thumbnailUrl: `${RAW_BASE}/diffusion/native/slice_008.png`,
    sliceCount: 16,
    nativeSlices: slices("diffusion/native"),
    processedSlices: slices("diffusion/mask"),
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
    thumbnailUrl: `${RAW_BASE}/recalage/ct/slice_001.png`,
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
    thumbnailUrl: `${RAW_BASE}/cardio/diastole.png`,
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
    thumbnailUrl: `${RAW_BASE}/cardio/ct-coeur.png`,
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