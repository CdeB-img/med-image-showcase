// src/data/projects.ts

export interface ProjectImageDir {
  id: string;      // ex: "native", "mask"
  label: string;   // ex: "DWI", "Mask"
  path: string;    // ex: "diffusion/native"
}

export interface Project {
  id: string;
  title: string;
  description: string;
  modality: string;
  analysisType: string;
  technologies: string[];
  thumbnailPath: string; // relatif à public/images
  imageDirs: ProjectImageDir[];
  useSliderOverlay?: boolean;
}

export const projects: Project[] = [
  {
    id: "diffusion",
    title: "Diffusion IRM",
    description:
      "Segmentation des lésions ischémiques sur IRM de diffusion.",
    modality: "IRM / CT",
    analysisType: "Segmentation",
    technologies: ["Python", "ANTsPy", "NiBabel", "NumPy", "SimpleITK"],

    thumbnailPath: "diffusion/native/slice_008.png",

    imageDirs: [
      { id: "native", label: "DWI", path: "diffusion/native" },
      { id: "mask", label: "Mask", path: "diffusion/mask" },
    ],
  },
];

export const getProjectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);