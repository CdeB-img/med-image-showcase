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

// Real projects with actual medical imaging data
export const projects: Project[] = [
  {
    id: "diffusion-stroke",
    title: "Segmentation Lésion Diffusion - Stroke",
    description: "Segmentation automatique des lésions ischémiques en diffusion (DWI) avec recalage sur scanner. Pipeline incluant le recalage multimodal IRM-CT, la détection des zones de restriction de diffusion et la génération de masques lésionnels pour l'évaluation du core ischémique.",
    modality: "IRM / Scanner",
    analysisType: "Segmentation",
    technologies: ["Python", "ANTsPy", "NiBabel", "NumPy", "SimpleITK"],
    thumbnailUrl: "/images/diffusion/Diff_coreg_CT/slice_008.png",
    sliceCount: 16,
    nativeSlices: Array.from({ length: 16 }, (_, i) => `/images/diffusion/Diff_coreg_CT/slice_${String(i).padStart(3, '0')}.png`),
    processedSlices: Array.from({ length: 16 }, (_, i) => `/images/diffusion/mask_diff/slice_${String(i).padStart(3, '0')}.png`),
  },
  {
    id: "perfusion-stroke",
    title: "Analyse Perfusion CT - Stroke Cercare",
    description: "Analyse multiparamétrique de perfusion cérébrale pour évaluation de l'AVC. Calcul des cartes Tmax, rCBF, OEF et CMRO2 avec génération de masques de pénombre (Tmax>6s) et core (rCBF<30%). Intégration du modèle métabolique pour estimation de l'OEF et du CMRO2.",
    modality: "Scanner Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "Cercare", "NumPy", "Matplotlib", "NiBabel"],
    thumbnailUrl: "/images/perfusion/exemple/Tmax_Basic_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clinical_use#_Tmax_Basic_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clinical_use#_1025000001/slice_008.png",
    sliceCount: 16,
    nativeSlices: Array.from({ length: 16 }, (_, i) => `/images/perfusion/exemple/Tmax_Basic_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clinical_use#_Tmax_Basic_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clinical_use#_1025000001/slice_${String(i).padStart(3, '0')}.png`),
    processedSlices: Array.from({ length: 16 }, (_, i) => `/images/perfusion/exemple/MASK_TMAX6/slice_${String(i).padStart(3, '0')}.png`),
  },
  {
    id: "recalage-irm-ct",
    title: "Recalage Multimodal IRM-CT",
    description: "Pipeline de recalage rigide et déformable entre IRM de diffusion et scanner cérébral. Fusion des données anatomiques et fonctionnelles pour une meilleure visualisation des lésions ischémiques dans l'espace du scanner natif.",
    modality: "IRM / Scanner",
    analysisType: "Recalage",
    technologies: ["Python", "ANTsPy", "Elastix", "SimpleITK", "ITK"],
    thumbnailUrl: "/images/recalage_irm_ct/Diff_coreg_CT/slice_008.png",
    sliceCount: 16,
    nativeSlices: Array.from({ length: 16 }, (_, i) => `/images/recalage_irm_ct/Diff_coreg_CT/slice_${String(i).padStart(3, '0')}.png`),
    processedSlices: Array.from({ length: 16 }, (_, i) => `/images/recalage_irm_ct/MaxIP_(ctp,dn,moco,mono,ncu,pp)_#Not_for_clinical_use#_MaxIP_(ctp,dn,moco,mono,ncu,pp)_#Not_for_clinical_use#_1027000001/slice_${String(i).padStart(3, '0')}.png`),
  },
  {
    id: "perfusion-metabolique",
    title: "Cartographie Métabolique Cérébrale",
    description: "Estimation des paramètres métaboliques cérébraux (OEF, CMRO2) à partir des données de perfusion CT. Modélisation de la fraction d'extraction d'oxygène et du taux métabolique cérébral pour identifier les zones de souffrance tissulaire réversible.",
    modality: "Scanner Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "Cercare", "SciPy", "NumPy", "Matplotlib"],
    thumbnailUrl: "/images/perfusion/exemple/OEF_Model_Based_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clini..._OEF_Model_Based_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clini..._1039000001/slice_008.png",
    sliceCount: 16,
    nativeSlices: Array.from({ length: 16 }, (_, i) => `/images/perfusion/exemple/OEF_Model_Based_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clini..._OEF_Model_Based_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clini..._1039000001/slice_${String(i).padStart(3, '0')}.png`),
    processedSlices: Array.from({ length: 16 }, (_, i) => `/images/perfusion/exemple/MASK_OEF/slice_${String(i).padStart(3, '0')}.png`),
  },
  {
    id: "cbf-analysis",
    title: "Analyse du Débit Sanguin Cérébral",
    description: "Quantification du débit sanguin cérébral relatif (rCBF) avec génération de masques de seuillage (CBF<30% et CBF<60%) pour délimitation du core ischémique et de la zone oligémique. Corrélation avec les données de diffusion pour mismatch analysis.",
    modality: "Scanner Perfusion",
    analysisType: "Quantification",
    technologies: ["Python", "NumPy", "scikit-image", "NiBabel", "Matplotlib"],
    thumbnailUrl: "/images/perfusion/exemple/rCBF_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clinical_use#_rCBF_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clinical_use#_1034000001/slice_008.png",
    sliceCount: 16,
    nativeSlices: Array.from({ length: 16 }, (_, i) => `/images/perfusion/exemple/rCBF_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clinical_use#_rCBF_(aaif,ctp,dn,moco,mono,ncu,pp)_#Not_for_clinical_use#_1034000001/slice_${String(i).padStart(3, '0')}.png`),
    processedSlices: Array.from({ length: 16 }, (_, i) => `/images/perfusion/exemple/MASK_CBF60_SEEDED/slice_${String(i).padStart(3, '0')}.png`),
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
