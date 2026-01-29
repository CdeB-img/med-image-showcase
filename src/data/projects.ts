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

const slices = (base: string) =>
  Array.from({ length: 16 }, (_, i) =>
    `${base}/slice_${String(i).padStart(3, "0")}.png`
  );

export const projects: Project[] = [
  {
    id: "diffusion",
    title: "Diffusion IRM",
    description: "Segmentation of ischemic lesions on diffusion-weighted MRI with CT registration.",
    modality: "MRI / CT",
    analysisType: "Segmentation",
    technologies: ["Python", "ANTsPy", "NiBabel", "NumPy", "SimpleITK"],
    thumbnailUrl: "/images/diffusion/native/slice_008.png",
    sliceCount: 16,
    nativeSlices: slices("/images/diffusion/native"),
    processedSlices: slices("/images/diffusion/mask"),
  },
  {
    id: "perfusion-oef",
    title: "Perfusion OEF",
    description: "CT perfusion analysis with Tmax, rCBF, OEF and CMRO2 mapping.",
    modality: "CT Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "Cercare", "NumPy", "Matplotlib", "NiBabel"],
    thumbnailUrl: "/images/perfusion/exemple/oef/slice_008.png",
    sliceCount: 16,
    nativeSlices: slices("/images/perfusion/exemple/oef"),
    processedSlices: slices("/images/perfusion/exemple/MASK_TMAX6"),
  },
  {
    id: "recalage",
    title: "Recalage IRM / CT",
    description: "Rigid and deformable registration between diffusion MRI and cerebral CT.",
    modality: "MRI / CT",
    analysisType: "Registration",
    technologies: ["Python", "ANTsPy", "Elastix", "SimpleITK", "ITK"],
    thumbnailUrl: "/images/recalage/ct/slice_008.png",
    sliceCount: 16,
    nativeSlices: slices("/images/recalage/ct"),
    processedSlices: slices("/images/recalage/maxip"),
    useSliderOverlay: true,
  },
];

export const getProjectById = (id: string): Project | undefined => {
  return projects.find((project) => project.id === id);
};

export const getAdjacentProjects = (currentId: string): { prev: Project | null; next: Project | null } => {
  const currentIndex = projects.findIndex((p) => p.id === currentId);
  return {
    prev: currentIndex > 0 ? projects[currentIndex - 1] : null,
    next: currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null,
  };
};
