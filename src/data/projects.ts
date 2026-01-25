export interface Project {
  id: string;
  title: string;
  description: string;
  modality: string;
  analysisType: string;
  technologies: string[];
  thumbnailUrl: string;
  sliceCount: number;
  // In a real app, these would be arrays of image URLs
  // For demo, we'll generate placeholder paths
  nativeSlices: string[];
  processedSlices: string[];
}

// Demo projects with placeholder data
// Images will be placeholder URLs that can be replaced with real slice images
export const projects: Project[] = [
  {
    id: "brain-segmentation",
    title: "Segmentation Cérébrale Automatique",
    description: "Segmentation automatique des structures cérébrales (matière grise, matière blanche, LCR) à partir d'IRM T1. Pipeline de prétraitement incluant correction de biais N4, recalage sur template MNI, et segmentation par réseau de neurones convolutif 3D.",
    modality: "IRM",
    analysisType: "Segmentation",
    technologies: ["Python", "PyTorch", "ANTsPy", "NiBabel", "FSL"],
    thumbnailUrl: "/placeholder.svg",
    sliceCount: 10,
    nativeSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
    processedSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
  },
  {
    id: "lung-nodule-detection",
    title: "Détection de Nodules Pulmonaires",
    description: "Système de détection assistée par ordinateur (CADe) pour l'identification de nodules pulmonaires sur scanner thoracique. Utilisation d'un modèle de détection 3D avec estimation de la malignité et mesure volumétrique automatique.",
    modality: "Scanner",
    analysisType: "Détection",
    technologies: ["Python", "TensorFlow", "SimpleITK", "lungmask", "MONAI"],
    thumbnailUrl: "/placeholder.svg",
    sliceCount: 10,
    nativeSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
    processedSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
  },
  {
    id: "cardiac-mri-analysis",
    title: "Analyse Fonctionnelle Cardiaque",
    description: "Quantification automatique de la fonction ventriculaire gauche à partir de séquences ciné-IRM. Segmentation du myocarde et calcul des paramètres fonctionnels : fraction d'éjection, volumes télédiastolique et télésystolique, masse myocardique.",
    modality: "IRM",
    analysisType: "Quantification",
    technologies: ["Python", "nnU-Net", "OpenCV", "NumPy", "Matplotlib"],
    thumbnailUrl: "/placeholder.svg",
    sliceCount: 10,
    nativeSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
    processedSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
  },
  {
    id: "liver-tumor-segmentation",
    title: "Segmentation Tumorale Hépatique",
    description: "Segmentation semi-automatique des lésions hépatiques sur scanner avec injection de produit de contraste. Délimitation précise pour planification chirurgicale et suivi thérapeutique, avec calcul volumétrique et rapport au volume hépatique total.",
    modality: "Scanner",
    analysisType: "Segmentation",
    technologies: ["Python", "3D Slicer", "ITK-SNAP", "scikit-image"],
    thumbnailUrl: "/placeholder.svg",
    sliceCount: 10,
    nativeSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
    processedSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
  },
  {
    id: "bone-reconstruction",
    title: "Reconstruction 3D Orthopédique",
    description: "Génération de modèles 3D haute résolution à partir de scanners osseux pour impression 3D préopératoire. Segmentation osseuse, maillage surfacique et export STL pour guides chirurgicaux personnalisés.",
    modality: "Scanner",
    analysisType: "Reconstruction 3D",
    technologies: ["Python", "VTK", "MeshLab", "Blender", "PyMesh"],
    thumbnailUrl: "/placeholder.svg",
    sliceCount: 10,
    nativeSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
    processedSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
  },
  {
    id: "pet-ct-fusion",
    title: "Fusion TEP-Scanner Oncologique",
    description: "Recalage et fusion multimodale TEP-Scanner pour bilan d'extension oncologique. Superposition des données métaboliques et anatomiques avec quantification SUV et délimitation des volumes cibles pour radiothérapie.",
    modality: "TEP-Scanner",
    analysisType: "Fusion multimodale",
    technologies: ["Python", "Elastix", "ANTsPy", "pydicom", "RTStructBuilder"],
    thumbnailUrl: "/placeholder.svg",
    sliceCount: 10,
    nativeSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
    processedSlices: Array.from({ length: 10 }, (_, i) => `/placeholder.svg`),
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
