// src/data/projects.ts

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
 * Base RAW GitHub du dépôt contenant les images médicales
 * (dépôt : CdeB-img / expert-imagerie)
 */
const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

/**
 * Génère une liste de slices PNG :
 * slice_000.png → slice_015.png
 */
const slices = (relativePath: string, count = 16): string[] =>
  Array.from({ length: count }, (_, i) =>
    `${RAW_BASE}/${relativePath}/slice_${String(i).padStart(3, "0")}.png`
  );

export const projects: Project[] = [
  {
    id: "diffusion",
    title: "Diffusion IRM",
    description:
      "Segmentation des lésions ischémiques sur IRM de diffusion.",
    modality: "IRM / CT",
    analysisType: "Segmentation",
    technologies: [
      "Python",
      "ANTsPy",
      "NiBabel",
      "NumPy",
      "SimpleITK",
    ],
    thumbnailUrl: `${RAW_BASE}/diffusion/native/slice_008.png`,
    sliceCount: 16,
    nativeSlices: slices("diffusion/native"),
    processedSlices: slices("diffusion/mask"),
  },

  {
    id: "perfusion",
    title: "Perfusion CT – OEF",
    description:
      "Analyse multiparamétrique de la perfusion cérébrale (OEF, Tmax, rCBF).",
    modality: "CT Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "Cercare", "NumPy"],
    thumbnailUrl: `${RAW_BASE}/perfusion/exemple/oef/slice_008.png`,
    sliceCount: 16,
    nativeSlices: slices("perfusion/exemple/oef"),
    processedSlices: slices("perfusion/exemple/MASK_TMAX6"),
  },

  {
    id: "recalage",
    title: "Recalage IRM / CT",
    description:
      "Recalage multimodal IRM–CT pour fusion anatomique et fonctionnelle.",
    modality: "IRM / CT",
    analysisType: "Registration",
    technologies: ["Python", "ANTsPy", "Elastix"],
    thumbnailUrl: `${RAW_BASE}/recalage/ct/slice_008.png`,
    sliceCount: 16,
    nativeSlices: slices("recalage/ct"),
    processedSlices: slices("recalage/maxip"),
    useSliderOverlay: true,
  },
];

/**
 * Accès direct à un projet par son id
 */
export const getProjectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);