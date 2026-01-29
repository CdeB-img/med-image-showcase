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
  // If true, use slider overlay mode (for registration projects)
  // If false, show mask overlaid on native image
  useSliderOverlay?: boolean;
  // Available masks for perfusion projects
  availableMasks?: string[];
}

// Perfusion masks available for selection
export const PERFUSION_MASKS = [
  { id: "oef", label: "OEF" },
  { id: "MASK_CBF30_SEEDED", label: "CBF < 30%" },
  { id: "MASK_CBF60_SEEDED", label: "CBF < 60%" },
  { id: "MASK_CMRO2_30", label: "CMRO2 < 30%" },
  { id: "MASK_TMAX6", label: "Tmax > 6s" },
];

// Helper to generate slice arrays
const generateSlices = (basePath: string, count: number = 16): string[] =>
  Array.from({ length: count }, (_, i) =>
    `${basePath}/slice_${String(i).padStart(3, "0")}.png`
  );

// Real projects with actual medical imaging data
export const projects: Project[] = [
  {
    id: "diffusion-stroke",
    title: "Segmentation Lésion Diffusion - Stroke",
    description: "Segmentation automatique des lésions ischémiques en diffusion (DWI) avec recalage sur scanner. Pipeline incluant le recalage multimodal IRM-CT, la détection des zones de restriction de diffusion et la génération de masques lésionnels pour l'évaluation du core ischémique.",
    modality: "IRM / Scanner",
    analysisType: "Segmentation",
    technologies: ["Python", "ANTsPy", "NiBabel", "NumPy", "SimpleITK"],
    thumbnailUrl: "/images/diffusion/native/slice_008.png",
    sliceCount: 16,
    nativeSlices: generateSlices("/images/diffusion/native"),
    processedSlices: generateSlices("/images/diffusion/mask"),
  },
  {
    id: "perfusion-stroke",
    title: "Analyse Perfusion CT - Stroke Cercare",
    description: "Analyse multiparamétrique de perfusion cérébrale pour évaluation de l'AVC. Calcul des cartes Tmax, rCBF, OEF et CMRO2 avec génération de masques de pénombre (Tmax>6s) et core (rCBF<30%). Intégration du modèle métabolique pour estimation de l'OEF et du CMRO2.",
    modality: "Scanner Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "Cercare", "NumPy", "Matplotlib", "NiBabel"],
    thumbnailUrl: "/images/perfusion/exemple/oef/slice_008.png",
    sliceCount: 16,
    nativeSlices: generateSlices("/images/perfusion/exemple/oef"),
    processedSlices: generateSlices("/images/perfusion/exemple/MASK_TMAX6"),
    availableMasks: ["oef", "MASK_CBF30_SEEDED", "MASK_CBF60_SEEDED", "MASK_CMRO2_30", "MASK_TMAX6"],
  },
  {
    id: "recalage-irm-ct",
    title: "Recalage Multimodal IRM-CT",
    description: "Pipeline de recalage rigide et déformable entre IRM de diffusion et scanner cérébral. Fusion des données anatomiques et fonctionnelles pour une meilleure visualisation des lésions ischémiques dans l'espace du scanner natif.",
    modality: "IRM / Scanner",
    analysisType: "Recalage",
    technologies: ["Python", "ANTsPy", "Elastix", "SimpleITK", "ITK"],
    thumbnailUrl: "/images/recalage/ct/slice_008.png",
    sliceCount: 16,
    useSliderOverlay: true,
    nativeSlices: generateSlices("/images/recalage/ct"),
    processedSlices: generateSlices("/images/recalage/maxip"),
  },
  {
    id: "perfusion-metabolique",
    title: "Cartographie Métabolique Cérébrale",
    description: "Estimation des paramètres métaboliques cérébraux (OEF, CMRO2) à partir des données de perfusion CT. Modélisation de la fraction d'extraction d'oxygène et du taux métabolique cérébral pour identifier les zones de souffrance tissulaire réversible.",
    modality: "Scanner Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "Cercare", "SciPy", "NumPy", "Matplotlib"],
    thumbnailUrl: "/images/perfusion/exemple/oef/slice_008.png",
    sliceCount: 16,
    nativeSlices: generateSlices("/images/perfusion/exemple/oef"),
    processedSlices: generateSlices("/images/perfusion/exemple/MASK_CMRO2_30"),
    availableMasks: ["oef", "MASK_CBF30_SEEDED", "MASK_CBF60_SEEDED", "MASK_CMRO2_30", "MASK_TMAX6"],
  },
  {
    id: "cbf-analysis",
    title: "Analyse du Débit Sanguin Cérébral",
    description: "Quantification du débit sanguin cérébral relatif (rCBF) avec génération de masques de seuillage (CBF<30% et CBF<60%) pour délimitation du core ischémique et de la zone oligémique. Corrélation avec les données de diffusion pour mismatch analysis.",
    modality: "Scanner Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "NumPy", "scikit-image", "NiBabel", "Matplotlib"],
    thumbnailUrl: "/images/perfusion/exemple/oef/slice_008.png",
    sliceCount: 16,
    nativeSlices: generateSlices("/images/perfusion/exemple/oef"),
    processedSlices: generateSlices("/images/perfusion/exemple/MASK_CBF60_SEEDED"),
    availableMasks: ["oef", "MASK_CBF30_SEEDED", "MASK_CBF60_SEEDED", "MASK_CMRO2_30", "MASK_TMAX6"],
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

// Helper to build mask slices for perfusion projects
export const buildPerfusionMaskSlices = (maskId: string): string[] =>
  generateSlices(`/images/perfusion/exemple/${maskId}`);
