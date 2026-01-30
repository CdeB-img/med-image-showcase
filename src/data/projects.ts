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
 * slice_006.png → slice_010.png
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
// CONSTANTES DE CHEMINS (ENCODÉS)
// ============================================================

/**
 * OEF – images natives (MODEL-BASED)
 * Dossier réel GitHub, URL-encodé
 */
const OEF_NATIVE_PATH =
  "perfusion/exemple/OEF_Model_Based_%28aaif%2Cctp%2Cdn%2Cmoco%2Cmono%2Cncu%2Cpp%29_%23Not_for_clini..._OEF_Model_Based_%28aaif%2Cctp%2Cdn%2Cmoco%2Cmono%2Cncu%2Cpp%29_%23Not_for_clini..._1039000001";

/**
 * OEF – masque dérivé
 */
const OEF_MASK_PATH =
  "perfusion/exemple/oef";

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
      "Carte OEF model-based avec superposition du masque OEF dérivé.",
    modality: "CT Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "Cercare", "NumPy"],

    thumbnailUrl: `${RAW_BASE}/${OEF_NATIVE_PATH}/slice_008.png`,
    sliceCount: 5,

    // Images natives OEF
    nativeSlices: slicesRange(
      OEF_NATIVE_PATH,
      6,
      10
    ),

    // Masque OEF
    processedSlices: slicesRange(
      OEF_MASK_PATH,
      6,
      10
    ),
  },


>>>>>>> 268535aadd8f596411fd2bcb3a09cd157ceab246

<<<<<<< HEAD

=======
// ============================================================
// HELPERS
// ============================================================

>>>>>>> 268535aadd8f596411fd2bcb3a09cd157ceab246
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