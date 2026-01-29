export interface Project {
  id: string;
  title: string;
  nativeSlices: string[];
  processedSlices: string[];
  useSliderOverlay?: boolean;
}

const slices = (base: string, count = 16): string[] =>
  Array.from({ length: count }, (_, i) =>
    `${base}/slice_${String(i).padStart(3, "0")}.png`
  );

export const projects: Project[] = [
  {
    id: "diffusion",
    title: "Diffusion IRM",
    nativeSlices: slices("/images/diffusion/native"),
    processedSlices: slices("/images/diffusion/mask"),
  },
  {
    id: "perfusion",
    title: "Perfusion OEF",
    nativeSlices: slices("/images/perfusion/exemple/oef"),
    processedSlices: slices("/images/perfusion/exemple/MASK_TMAX6"),
  },
  {
    id: "recalage",
    title: "Recalage IRM / CT",
    nativeSlices: slices("/images/recalage/ct"),
    processedSlices: slices("/images/recalage/maxip"),
    useSliderOverlay: true,
  },
];

export const getProjectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);

export const getAdjacentProjects = (id: string) => {
  const idx = projects.findIndex((p) => p.id === id);
  return {
    prev: idx > 0 ? projects[idx - 1] : null,
    next: idx < projects.length - 1 ? projects[idx + 1] : null,
  };
};
