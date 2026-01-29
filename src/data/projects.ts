// src/data/projects.ts

export interface ProjectImageDir {
  id: string;        // ex: "native", "mask"
  label: string;     // ex: "DWI", "Mask"
  path: string;      // ex: "diffusion/native"
}

export interface Project {
  id: string;
  title: string;
  description: string;
  modality: string;
  analysisType: string;
  technologies: string[];
  thumbnailPath: string; // relatif à /public/images
  imageDirs: ProjectImageDir[];
  useSliderOverlay?: boolean;
}

export const projects: Project[] = [
  {
    id: "diffusion",
    title: "Diffusion IRM",
    description: "Segmentation des lésions ischémiques sur IRM de diffusion.",
    modality: "IRM / CT",
    analysisType: "Segmentation",
    technologies: ["Python", "ANTsPy", "NiBabel", "NumPy", "SimpleITK"],

    thumbnailPath: "diffusion/native/slice_008.png",

    imageDirs: [
      { id: "native", label: "DWI", path: "diffusion/native" },
      { id: "mask", label: "Mask", path: "diffusion/mask" },
    ],
  },

  {
    id: "perfusion",
    title: "Perfusion CT – OEF",
    description: "Analyse multiparamétrique de la perfusion cérébrale.",
    modality: "CT Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "Cercare", "NumPy"],

    thumbnailPath: "perfusion/exemple/oef/slice_008.png",

    imageDirs: [
      { id: "oef", label: "OEF", path: "perfusion/exemple/oef" },
      { id: "tmax", label: "Tmax", path: "perfusion/exemple/MASK_TMAX6" },
    ],
  },

  {
    id: "recalage",
    title: "Recalage IRM / CT",
    description: "Recalage multimodal IRM–CT.",
    modality: "IRM / CT",
    analysisType: "Registration",
    technologies: ["Python", "ANTsPy", "Elastix"],

    thumbnailPath: "recalage/ct/slice_008.png",

    imageDirs: [
      { id: "ct", label: "CT", path: "recalage/ct" },
      { id: "maxip", label: "MaxIP", path: "recalage/maxip" },
    ],

    useSliderOverlay: true,
  },
];

export const getProjectById = (id: string): Project | undefined =>
  projects.find(p => p.id === id);

export const getAdjacentProjects = (id: string) => {
  const idx = projects.findIndex(p => p.id === id);
  return {
    prev: idx > 0 ? projects[idx - 1] : null,
    next: idx < projects.length - 1 ? projects[idx + 1] : null,
  };
};