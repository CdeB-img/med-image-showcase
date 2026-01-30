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
  // PERFUSION — OEF
  // ============================================================
  {
    id: "perfusion",
    title: "Perfusion CT – OEF",
    description:
      "Model-based OEF map with derived mask overlay for perfusion analysis.",
    modality: "CT Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "Cercare", "NumPy"],
    thumbnailUrl: `${RAW_BASE}/perfusion/exemple/oef/slice_008.png`,
    sliceCount: 16,
    nativeSlices: slices("perfusion/exemple/oef"),
    processedSlices: slices("perfusion/exemple/MASK_TMAX6"),
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
  // QUALITY CONTROL (QC)
  // ============================================================
  {
    id: "qc",
    title: "Quality Control Viewer",
    description:
      "Multi-parametric perfusion QC viewer with synchronized slice navigation across Tmax, CBF30, CBF60, OEF and CMRO2 maps.",
    modality: "CT Perfusion / MRI",
    analysisType: "Quality Control",
    technologies: ["Python", "NiBabel", "NumPy", "Matplotlib", "React"],

    // IMPORTANT : le QCViewer gère tout
    thumbnailUrl: `${RAW_BASE}/perfusion/exemple/Tmax_seq/slice_008.png`,
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