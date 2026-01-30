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
 * Base RAW GitHub du dépôt contenant les images
 */
const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

/**
 * Génère une plage explicite de slices :
 * ex: slice_006.png → slice_010.png
 */
const slicesRange = (
  relativePath: string,
  start: number,
  end: number
): string[] =>
  Array.from({ length: end - start + 1 }, (_, i) =>
    `${RAW_BASE}/${relativePath}/slice_${String(start + i).padStart(3, "0")}.png`
  );

// ============================================================
// PROJETS
// ============================================================

export const projects: Project[] = [
  // ============================================================
  // DIFFUSION
  // ============================================================
  {
    id: "diffusion",
    title: "Diffusion IRM",
    description:
      "Segmentation des lésions ischémiques sur IRM de diffusion.",
    modality: "IRM / CT",
    analysisType: "Segmentation",
    technologies: ["Python", "ANTsPy", "NiBabel", "NumPy", "SimpleITK"],

    thumbnailUrl: `${RAW_BASE}/diffusion/native/slice_008.png`,
    sliceCount: 5,

    nativeSlices: slicesRange(
      "diffusion/native",
      6,
      10
    ),

    processedSlices: slicesRange(
      "diffusion/mask",
      6,
      10
    ),
  },

  // ============================================================
  // PERFUSION — OEF (MODEL-BASED)
  // ============================================================
  {
    id: "perfusion",
    title: "Perfusion CT – OEF",
    description:
      "Carte OEF issue d’un modèle physiologique avec superposition du masque OEF.",
    modality: "CT Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "Cercare", "NumPy"],

    // vignette = image native (pas le masque)
    thumbnailUrl: `${RAW_BASE}/perfusion/exemple/OEF_Model_based/slice_008.png`,
    sliceCount: 5,

    // =========================
    // IMAGES NATIVES OEF
    // =========================
    nativeSlices: slicesRange(
      "perfusion/exemple/OEF_Model_based",
      6,
      10
    ),

    // =========================
    // MASQUE OEF
    // =========================
    processedSlices: slicesRange(
      "perfusion/exemple/oef",
      6,
      10
    ),
  },

  // ============================================================
  // RECALAGE
  // ============================================================
  {
    id: "recalage",
    title: "Recalage IRM / CT",
    description:
      "Recalage multimodal IRM–CT avec visualisation comparative.",
    modality: "IRM / CT",
    analysisType: "Registration",
    technologies: ["Python", "ANTsPy", "Elastix"],

    thumbnailUrl: `${RAW_BASE}/recalage/ct/slice_008.png`,
    sliceCount: 5,

    nativeSlices: slicesRange(
      "recalage/ct",
      6,
      10
    ),

    processedSlices: slicesRange(
      "recalage/maxip",
      6,
      10
    ),

    useSliderOverlay: true,
  },
];

// ============================================================
// HELPERS
// ============================================================

/**
 * Accès direct à un projet par son id
 */
export const getProjectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);

/**
 * Navigation précédent / suivant
 */
export const getAdjacentProjects = (id: string) => {
  const idx = projects.findIndex((p) => p.id === id);

  return {
    prev: idx > 0 ? projects[idx - 1] : null,
    next: idx < projects.length - 1 ? projects[idx + 1] : null,
  };
};