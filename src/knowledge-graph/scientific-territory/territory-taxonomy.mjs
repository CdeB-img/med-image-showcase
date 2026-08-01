import { SCIENTIFIC_TERRITORY_NAMESPACE } from "./constants.mjs";

const freeze = (value) => Object.freeze(value);
const subdomain = (id, label, knowledgeAreas, options = {}) => freeze({ id, label, knowledgeAreas: freeze(knowledgeAreas), ...options });
const domain = (id, label, subdomains, options = {}) => freeze({ id, label, subdomains: freeze(subdomains), ...options });
const territory = (id, label, domains, options = {}) => freeze({ id, label, domains: freeze(domains), ...options });

export const territoryConceptFamilies = freeze([
  freeze({ familyId: "ANATOMY_AND_CLINICAL_CONTEXT", label: "Anatomie et contexte clinique", knowledgeNodeTypes: freeze(["BodySystem", "Organ", "Region", "Disease", "Finding", "ClinicalQuestion", "ClinicalApplication", "Endpoint"]) }),
  freeze({ familyId: "MODALITY_AND_ACQUISITION", label: "Modalité et acquisition", knowledgeNodeTypes: freeze(["Modality", "Sequence", "SequenceFamily", "AcquisitionMethod", "AcquisitionCondition", "AcquisitionInput", "AcquisitionParameter", "Protocol", "ProtocolConcept", "ContrastAgentClass"]) }),
  freeze({ familyId: "MEASUREMENT_AND_BIOMARKER", label: "Mesure et biomarqueur", knowledgeNodeTypes: freeze(["Measurement", "MeasurementDefinition", "MeasurementMethod", "DerivedMeasurement", "Observation", "Biomarker", "ParametricMap", "ModelInput", "ModelComponent", "PhysicalPhenomenon"]) }),
  freeze({ familyId: "TECHNOLOGY_AND_EQUIPMENT", label: "Technologie et équipement", knowledgeNodeTypes: freeze(["Technology", "TechnologyImplementation", "Equipment", "EquipmentGeneration", "Manufacturer", "ReconstructionMethod", "ReconstructionOutput", "TechnicalContext"]) }),
  freeze({ familyId: "COMPUTATION_AND_SOFTWARE", label: "Calcul, logiciel et outils", knowledgeNodeTypes: freeze(["Software", "SoftwareVersion", "SoftwareMethod", "Pipeline", "Tool", "Viewer", "Feature", "Dataset"]) }),
  freeze({ familyId: "QUALITY_AND_METROLOGY", label: "Qualité et métrologie", knowledgeNodeTypes: freeze(["QualityAttribute", "QualityMetric", "QualityMethod", "QualityControlObject", "Confounder", "Limitation"]) }),
  freeze({ familyId: "STANDARDS_AND_WORKFLOWS", label: "Standards et workflows documentaires", knowledgeNodeTypes: freeze(["Standard", "Format", "Workflow", "WorkflowConcept", "Service", "CoreLab"]) }),
  freeze({ familyId: "EVIDENCE_AND_RESEARCH", label: "Preuve et recherche", knowledgeNodeTypes: freeze(["Publication", "PublicationTopic", "ResearchArea", "ResearchProject", "Study", "Guideline", "Recommendation"]) }),
  freeze({ familyId: "TERMINOLOGY_AND_DEFINITION", label: "Terminologie et définition", knowledgeNodeTypes: freeze(["Definition", "Terminology", "Abbreviation", "Synonym"]) }),
]);

export const transverseDimensions = freeze([
  freeze({ dimensionId: "manufacturers-platforms", label: "Constructeurs, plateformes et générations", appliesToTerritoryIds: freeze(["modalities-acquisition", "physics-instrumentation", "measurements-biomarkers", "quality-safety", "informatics-workflows"]) }),
  freeze({ dimensionId: "field-strength", label: "Champ magnétique", appliesToTerritoryIds: freeze(["modalities-acquisition", "physics-instrumentation", "measurements-biomarkers", "quality-safety"]) }),
  freeze({ dimensionId: "energy-spectrum", label: "Énergie, spectre et paramètres d'exposition", appliesToTerritoryIds: freeze(["modalities-acquisition", "physics-instrumentation", "measurements-biomarkers", "quality-safety", "interventional-imaging"]) }),
  freeze({ dimensionId: "contrast-tracers", label: "Agents de contraste, traceurs et radiopharmaceutiques", appliesToTerritoryIds: freeze(["modalities-acquisition", "clinical-applications", "measurements-biomarkers", "physics-instrumentation", "quality-safety", "interventional-imaging"]) }),
  freeze({ dimensionId: "acquisition-protocols", label: "Protocoles et paramètres d'acquisition documentaires", appliesToTerritoryIds: freeze(["modalities-acquisition", "anatomy-specialties", "clinical-applications", "quality-safety", "informatics-workflows"]) }),
  freeze({ dimensionId: "reconstruction", label: "Reconstruction et corrections", appliesToTerritoryIds: freeze(["modalities-acquisition", "physics-instrumentation", "computational-imaging", "quality-safety"]) }),
  freeze({ dimensionId: "post-processing", label: "Post-traitement et visualisation", appliesToTerritoryIds: freeze(["measurements-biomarkers", "computational-imaging", "quality-safety", "informatics-workflows"]) }),
  freeze({ dimensionId: "quantification", label: "Quantification", appliesToTerritoryIds: freeze(["modalities-acquisition", "anatomy-specialties", "clinical-applications", "measurements-biomarkers", "computational-imaging", "quality-safety"]) }),
  freeze({ dimensionId: "metrology-units", label: "Métrologie, unités, formules et incertitude", appliesToTerritoryIds: freeze(["measurements-biomarkers", "physics-instrumentation", "quality-safety", "research-evidence"]) }),
  freeze({ dimensionId: "reproducibility", label: "Répétabilité, reproductibilité et harmonisation", appliesToTerritoryIds: freeze(["measurements-biomarkers", "computational-imaging", "quality-safety", "research-evidence"]) }),
  freeze({ dimensionId: "normalization", label: "Normalisation et valeurs de référence", appliesToTerritoryIds: freeze(["measurements-biomarkers", "quality-safety", "research-evidence"]) }),
  freeze({ dimensionId: "interoperability", label: "Interopérabilité et échange", appliesToTerritoryIds: freeze(["modalities-acquisition", "computational-imaging", "quality-safety", "informatics-workflows", "research-evidence"]) }),
  freeze({ dimensionId: "terminology", label: "Terminologies, codages et définitions", appliesToTerritoryIds: freeze(["anatomy-specialties", "clinical-applications", "measurements-biomarkers", "quality-safety", "informatics-workflows", "research-evidence"]) }),
  freeze({ dimensionId: "safety-dose", label: "Sécurité, dose et bénéfice-risque", appliesToTerritoryIds: freeze(["modalities-acquisition", "clinical-applications", "physics-instrumentation", "quality-safety", "interventional-imaging"]) }),
  freeze({ dimensionId: "population", label: "Population, âge, sexe, grossesse et vulnérabilités", appliesToTerritoryIds: freeze(["anatomy-specialties", "clinical-applications", "measurements-biomarkers", "quality-safety", "research-evidence"]) }),
  freeze({ dimensionId: "disease-time", label: "Stade, temporalité et trajectoire de maladie", appliesToTerritoryIds: freeze(["clinical-applications", "measurements-biomarkers", "interventional-imaging", "research-evidence"]) }),
  freeze({ dimensionId: "multicenter-context", label: "Centre, scanner, lecteur et contexte multicentrique", appliesToTerritoryIds: freeze(["measurements-biomarkers", "computational-imaging", "quality-safety", "informatics-workflows", "research-evidence"]) }),
  freeze({ dimensionId: "software-versions", label: "Logiciels, versions et implémentations", appliesToTerritoryIds: freeze(["modalities-acquisition", "measurements-biomarkers", "computational-imaging", "quality-safety", "informatics-workflows"]) }),
  freeze({ dimensionId: "data-provenance", label: "Données, provenance et cycle de vie documentaire", appliesToTerritoryIds: freeze(["computational-imaging", "quality-safety", "informatics-workflows", "research-evidence"]) }),
  freeze({ dimensionId: "ai-validation", label: "Validation, biais, robustesse et explicabilité de l'IA", appliesToTerritoryIds: freeze(["clinical-applications", "computational-imaging", "quality-safety", "research-evidence"]) }),
  freeze({ dimensionId: "historical-evolution", label: "Évolution historique des connaissances et technologies", appliesToTerritoryIds: freeze(["modalities-acquisition", "physics-instrumentation", "informatics-workflows", "research-evidence"]) }),
  freeze({ dimensionId: "human-factors", label: "Facteurs humains, ergonomie et communication", appliesToTerritoryIds: freeze(["quality-safety", "informatics-workflows", "interventional-imaging", "research-evidence"]) }),
  freeze({ dimensionId: "equity-access", label: "Accès, équité et diversité", appliesToTerritoryIds: freeze(["anatomy-specialties", "clinical-applications", "quality-safety", "research-evidence"]) }),
  freeze({ dimensionId: "sustainability", label: "Durabilité environnementale", appliesToTerritoryIds: freeze(["modalities-acquisition", "physics-instrumentation", "quality-safety", "informatics-workflows", "research-evidence"]) }),
]);

const commonProjectionSets = freeze({
  modality: freeze(["Glossary", "Guide", "FAQ", "Comparison", "Tutorial", "Reference", "Documentation", "Comparator"]),
  clinical: freeze(["Glossary", "Guide", "FAQ", "StateOfKnowledge", "Comparison", "Reference", "CaseStudy", "DecisionTree"]),
  quantitative: freeze(["Glossary", "Guide", "StateOfKnowledge", "Comparison", "Tutorial", "Reference", "Documentation", "Comparator", "API"]),
  technical: freeze(["Glossary", "Guide", "FAQ", "Comparison", "Tutorial", "Reference", "Documentation", "API"]),
  workflow: freeze(["Glossary", "Guide", "FAQ", "Reference", "Documentation", "DocumentaryWorkflow", "API"]),
  evidence: freeze(["Glossary", "Guide", "StateOfKnowledge", "Comparison", "Reference", "Documentation"]),
});

export const territoryBlueprint = freeze([
  territory("modalities-acquisition", "Modalités et acquisition", [
    domain("radiography-fluoroscopy", "Radiographie, fluoroscopie et imagerie de projection", [
      subdomain("projection-radiography", "Radiographie de projection", ["Formation de l'image de projection", "Radiographie numérique directe et indirecte", "Techniques haute et basse énergie", "Radiographie au lit et mobile", "Mesures et indices issus de radiographies"]),
      subdomain("fluoroscopy", "Fluoroscopie", ["Imagerie dynamique pulsée et continue", "Angiographie soustraite", "Navigation fluoroscopique", "Optimisation temporelle et dosimétrique", "Artéfacts et corrections fluoroscopiques"]),
      subdomain("mammography", "Mammographie et tomosynthèse mammaire", ["Mammographie numérique", "Tomosynthèse mammaire", "Mammographie avec contraste", "Imagerie stéréotaxique documentaire", "Évaluation de la densité mammaire"]),
      subdomain("dental-cbct", "Imagerie dentaire et cone-beam CT", ["Radiographie intra-orale", "Panoramique dentaire", "Céphalométrie", "Cone-beam CT dento-maxillo-facial", "Dosimétrie et qualité en CBCT"]),
      subdomain("tomosynthesis-other", "Tomosynthèse hors sein", ["Tomosynthèse thoracique", "Tomosynthèse musculosquelettique", "Reconstruction de plans limités", "Comparaison tomosynthèse et radiographie"]),
    ]),
    domain("computed-tomography", "Tomodensitométrie", [
      subdomain("conventional-ct", "CT conventionnel", ["Acquisition hélicoïdale et séquentielle", "Pitch, collimation et temps de rotation", "Reconstruction multiplanaire", "Angiographie CT", "Acquisitions dynamiques et multiphasiques"]),
      subdomain("cardiac-ct", "CT cardiaque", ["Synchronisation ECG", "Angiographie coronaire CT", "Calcium coronaire", "Fonction cardiaque CT", "Perfusion myocardique CT"]),
      subdomain("perfusion-ct", "Perfusion CT", ["Acquisition dynamique de perfusion", "Fonction d'entrée artérielle", "Modèles de perfusion CT", "Cartes paramétriques de perfusion", "Couverture et temporalité de perfusion"]),
      subdomain("dual-energy-spectral", "CT double énergie et spectral", ["Acquisitions double énergie", "Décomposition de matériaux", "Cartes d'iode", "Images monoénergétiques virtuelles", "Images virtuelles sans contraste", "Quantification spectrale"], { catalogNodeIds: ["noxia:knowledge-catalog:domain:spectral-ct"], catalogMappingScope: "EXACT" }),
      subdomain("photon-counting", "CT à comptage photonique", ["Détecteurs à comptage photonique", "Seuils d'énergie", "Résolution spatiale élevée", "Imagerie multi-énergie", "Applications cliniques documentées du photon-counting"], { catalogNodeIds: ["noxia:knowledge-catalog:domain:photon-counting-ct-applications"], catalogMappingScope: "EXACT" }),
      subdomain("low-dose-screening", "CT faible dose et dépistage", ["Protocoles faible dose", "Reconstruction pour réduction de dose", "CT thoracique de dépistage", "CT pédiatrique optimisé", "Suivi dosimétrique"]),
      subdomain("cone-beam-ct", "Cone-beam CT", ["Géométrie cone-beam", "Reconstruction volumique", "CBCT interventionnel", "CBCT musculosquelettique", "Artéfacts spécifiques au CBCT"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:spectral-ct", "noxia:knowledge-catalog:domain:photon-counting-ct-applications"] }),
    domain("magnetic-resonance", "Imagerie par résonance magnétique", [
      subdomain("structural-mri", "IRM morphologique", ["Pondérations T1, T2 et densité protonique", "Écho de spin et gradient echo", "Suppression de graisse", "Imagerie 2D et 3D", "Contraste morphologique et résolution"]),
      subdomain("diffusion-mri", "Diffusion IRM", ["DWI", "Valeur b", "Cartographie ADC", "Diffusion tensorielle", "Diffusion non gaussienne", "IVIM et modèles multicompartimentaux"], { catalogNodeIds: ["noxia:knowledge-catalog:domain:diffusion-adc"], catalogMappingScope: "EXACT" }),
      subdomain("perfusion-mri", "Perfusion IRM", ["DSC", "DCE", "ASL", "Perfusion sans contraste", "Modèles pharmacocinétiques", "Cartes de perfusion"]),
      subdomain("mapping-relaxometry", "Mapping et relaxométrie", ["Mapping T1", "Mapping T2", "Mapping T2 étoile", "Mapping T1rho", "Fraction de volume extracellulaire", "Relaxométrie quantitative"], { catalogNodeIds: ["noxia:knowledge-catalog:domain:ecv-t1", "noxia:knowledge-catalog:domain:t2-mapping"], catalogMappingScope: "PARTIAL" }),
      subdomain("susceptibility", "Susceptibilité magnétique", ["SWI", "QSM", "Effets de susceptibilité", "Quantification du fer", "Désoxyhémoglobine et contraste BOLD"]),
      subdomain("spectroscopy-cest", "Spectroscopie et échanges chimiques", ["Spectroscopie protonique", "Spectroscopie multinoyaux", "CEST", "Transfert d'aimantation", "Imagerie métabolique MR"]),
      subdomain("angiography-flow", "Angiographie et flux IRM", ["Angiographie TOF", "Angiographie avec contraste", "Phase-contrast MRI", "4D flow MRI", "Quantification de débit"]),
      subdomain("functional-mri", "IRM fonctionnelle", ["BOLD fMRI", "Paradigmes de tâche", "Resting-state fMRI", "Connectivité fonctionnelle", "Cartographie préopératoire"]),
      subdomain("mre", "Élastographie IRM", ["Génération d'ondes mécaniques", "Imagerie du mouvement", "Inversion élastographique", "Rigidité tissulaire", "Applications hépatiques et extra-hépatiques"]),
      subdomain("motion-cine", "Mouvement et ciné IRM", ["Ciné cardiaque", "Tagging myocardique", "Feature tracking", "Imagerie temps réel", "Correction et compensation de mouvement"]),
      subdomain("interventional-mri", "IRM interventionnelle", ["Guidage IRM", "Compatibilité du matériel", "Imagerie temps réel interventionnelle", "Thermométrie IRM", "Navigation et fusion"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:diffusion-adc", "noxia:knowledge-catalog:domain:ecv-t1", "noxia:knowledge-catalog:domain:t2-mapping"] }),
    domain("ultrasound", "Échographie", [
      subdomain("b-mode", "Échographie B-mode", ["Formation de l'image ultrasonore", "Imagerie harmonique", "Focalisation et beamforming", "Mesures morphologiques", "Artéfacts échographiques"]),
      subdomain("doppler", "Doppler", ["Doppler pulsé", "Doppler couleur", "Power Doppler", "Mesures de vitesse et de flux", "Indices vasculaires"]),
      subdomain("ultrasound-elastography", "Élastographie ultrasonore", ["Strain elastography", "Shear-wave elastography", "Mesure de vitesse d'onde", "Estimation de rigidité", "Variabilité et standardisation"]),
      subdomain("contrast-enhanced-us", "Échographie avec contraste", ["Microbulles", "Imagerie harmonique de contraste", "Courbes temps-intensité", "Perfusion ultrasonore", "Applications focales documentées"]),
      subdomain("volumetric-us", "Échographie 3D et 4D", ["Acquisition volumique", "Reconstruction 3D", "Imagerie 4D", "Mesures volumétriques", "Fusion échographie-volume"]),
      subdomain("point-of-care-us", "Échographie au point de soin", ["Protocoles POCUS documentaires", "Échographie d'urgence", "Guidage de gestes", "Formation et qualité", "Limites d'interprétation"]),
    ]),
    domain("nuclear-medicine-modalities", "Médecine nucléaire et imagerie moléculaire", [
      subdomain("planar-scintigraphy", "Scintigraphie planaire", ["Gamma-caméra", "Acquisition statique et dynamique", "Collimateurs", "Quantification planaire", "Contrôle qualité des gamma-caméras"]),
      subdomain("spect", "SPECT", ["Acquisition tomographique SPECT", "Reconstruction SPECT", "Correction d'atténuation", "Correction de diffusion", "Quantification SPECT"]),
      subdomain("pet", "PET", ["Détection en coïncidence", "Temps de vol", "Reconstruction PET", "Valeurs d'uptake", "Cinétique dynamique PET", "Quantification absolue PET"]),
      subdomain("hybrid-imaging", "Imagerie hybride", ["PET/CT", "SPECT/CT", "PET/MR", "Correction d'atténuation multimodale", "Fusion anatomique et fonctionnelle"]),
      subdomain("radiopharmaceutical-imaging", "Radiopharmaceutiques d'imagerie", ["Traceurs métaboliques", "Traceurs récepteurs", "Traceurs de perfusion", "Biodistribution", "Dosimétrie d'imagerie"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:nuclear-medicine"] }),
    domain("hybrid-multimodal", "Imagerie hybride et multimodale", [
      subdomain("image-fusion", "Fusion d'images", ["Fusion rigide", "Fusion déformable", "Fusion temporelle", "Fusion intermodale", "Validation de fusion"]),
      subdomain("cross-modality-quantification", "Quantification intermodalité", ["Comparabilité des biomarqueurs", "Transformations entre modalités", "Références croisées", "Calibration croisée", "Incertitude intermodalité"]),
      subdomain("multimodal-protocols", "Protocoles multimodaux", ["Ordonnancement documentaire des acquisitions", "Co-enregistrement", "Contrastes complémentaires", "Temporalité inter-examens", "Synthèses multimodales"]),
    ]),
    domain("emerging-modalities", "Modalités émergentes", [
      subdomain("photoacoustic", "Imagerie photoacoustique", ["Génération photoacoustique", "Reconstruction photoacoustique", "Contraste endogène", "Agents exogènes", "Applications radiologiques émergentes"]),
      subdomain("hyperpolarized-mri", "IRM hyperpolarisée", ["Substrats hyperpolarisés", "Imagerie multinoyaux", "Cinétique métabolique", "Contraintes d'acquisition", "Applications émergentes"]),
      subdomain("portable-low-field", "Imagerie portable et bas champ", ["IRM bas champ", "IRM portable", "CT portable", "Contraintes de qualité", "Applications en environnement contraint"]),
    ], { priority: "FUTURE", targetCoverage: "FUTURE" }),
  ], { priority: "FOUNDATION", projectionTypes: commonProjectionSets.modality }),

  territory("anatomy-specialties", "Anatomie, organes et spécialités", [
    domain("neuroradiology", "Neuroradiologie", [
      subdomain("brain", "Encéphale", ["Anatomie cérébrale", "Substance blanche et grise", "Noyaux profonds", "Ventricules et espaces liquidiens", "Barrière hémato-encéphalique"]),
      subdomain("cerebrovascular", "Neurovasculaire", ["Artères intracrâniennes", "Veines et sinus", "Circulation collatérale", "Perfusion cérébrale", "Accidents vasculaires"], { catalogNodeIds: ["noxia:knowledge-catalog:domain:cerebral-perfusion", "noxia:knowledge-catalog:domain:diffusion-adc", "noxia:knowledge-catalog:domain:oef-cmro2"], catalogMappingScope: "PARTIAL" }),
      subdomain("spine-cord", "Rachis et moelle", ["Rachis cervical", "Rachis thoracique", "Rachis lombosacré", "Moelle épinière", "Racines et espaces périmédullaires"]),
      subdomain("neurodegeneration", "Neurodégénératif", ["Atrophie cérébrale", "Maladies démyélinisantes", "Troubles neurodégénératifs", "Biomarqueurs d'imagerie", "Suivi longitudinal"]),
      subdomain("functional-neuro", "Neurofonctionnel", ["Activation cérébrale", "Connectivité", "Langage et motricité", "Cartographie préopératoire", "Réseaux cérébraux"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:cerebral-perfusion", "noxia:knowledge-catalog:domain:diffusion-adc", "noxia:knowledge-catalog:domain:neuro-oncology", "noxia:knowledge-catalog:domain:oef-cmro2"] }),
    domain("head-neck", "Tête et cou", [
      subdomain("sinonasal", "Sinus et massif facial", ["Cavités nasosinusiennes", "Base du crâne antérieure", "Infections et inflammations", "Tumeurs nasosinusiennes"]),
      subdomain("temporal-bone", "Rocher et oreille", ["Oreille externe et moyenne", "Oreille interne", "Nerfs facial et vestibulocochléaire", "Imagerie postopératoire"]),
      subdomain("neck-spaces", "Espaces cervicaux", ["Fascias et espaces profonds", "Ganglions cervicaux", "Voies aérodigestives supérieures", "Infections cervicales"]),
      subdomain("salivary-thyroid", "Glandes salivaires et thyroïde", ["Parotide et sous-mandibulaire", "Thyroïde", "Parathyroïdes", "Lésions focales et diffuses"]),
      subdomain("orbit", "Orbite et voies visuelles", ["Globe oculaire", "Muscles oculomoteurs", "Nerf optique", "Apex orbitaire et sinus caverneux"]),
    ]),
    domain("cardiac-vascular", "Imagerie cardiaque et vasculaire", [
      subdomain("cardiac-anatomy-function", "Anatomie et fonction cardiaques", ["Volumes et fonction ventriculaires", "Fonction atriale", "Valves", "Péricarde", "Flux intracardiaques"]),
      subdomain("myocardial-tissue", "Caractérisation tissulaire myocardique", ["Œdème myocardique", "Fibrose focale", "Fibrose diffuse", "Infiltration", "Hémorragie et obstruction microvasculaire"], { catalogNodeIds: ["noxia:knowledge-catalog:domain:ecv-t1", "noxia:knowledge-catalog:domain:myocardial-tissue-characterization"], catalogMappingScope: "PARTIAL" }),
      subdomain("coronary", "Artères coronaires", ["Anatomie coronaire", "Plaque athéromateuse", "Sténose", "Perfusion et ischémie", "Suivi des interventions"]),
      subdomain("aorta", "Aorte", ["Aorte thoracique", "Aorte abdominale", "Dissection et syndrome aortique", "Anévrisme", "Suivi endovasculaire"]),
      subdomain("peripheral-vascular", "Vasculaire périphérique", ["Artères des membres", "Veines", "Malformations vasculaires", "Ischémie périphérique", "Accès vasculaires"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:ecv-t1", "noxia:knowledge-catalog:domain:myocardial-tissue-characterization"] }),
    domain("thoracic", "Imagerie thoracique", [
      subdomain("lung-parenchyma", "Parenchyme pulmonaire", ["Nodules et masses", "Maladies infiltrantes diffuses", "Infection pulmonaire", "Emphysème et voies aériennes", "Quantification pulmonaire"]),
      subdomain("mediastinum", "Médiastin", ["Compartiments médiastinaux", "Adénopathies", "Masses médiastinales", "Thymus"]),
      subdomain("pleura", "Plèvre et paroi thoracique", ["Épanchement", "Pneumothorax", "Épaississement pleural", "Tumeurs pleurales", "Paroi thoracique"]),
      subdomain("pulmonary-vascular", "Vasculaire pulmonaire", ["Embolie pulmonaire", "Hypertension pulmonaire", "Perfusion pulmonaire", "Vascularisation bronchique"]),
    ]),
    domain("breast", "Imagerie mammaire", [
      subdomain("screening-breast", "Dépistage mammaire", ["Mammographie de dépistage", "Tomosynthèse de dépistage", "Densité mammaire", "Stratification du risque", "Rappels et surveillance"]),
      subdomain("diagnostic-breast", "Diagnostic mammaire", ["Masses et asymétries", "Calcifications", "Échographie ciblée", "IRM mammaire", "Imagerie avec contraste"]),
      subdomain("breast-intervention", "Intervention mammaire", ["Biopsie stéréotaxique", "Biopsie échoguidée", "Biopsie guidée par IRM", "Repérage préopératoire", "Contrôle de prélèvement"]),
    ]),
    domain("abdominal-digestive", "Imagerie abdominale et digestive", [
      subdomain("gastrointestinal", "Tube digestif", ["Œsophage", "Estomac", "Intestin grêle", "Côlon et rectum", "Motilité et transit"]),
      subdomain("peritoneum", "Péritoine et mésentère", ["Péritoine", "Mésentère", "Omentum", "Carcinose", "Inflammation et collections"]),
      subdomain("pancreas", "Pancréas", ["Pancréatite", "Tumeurs pancréatiques", "Canal pancréatique", "Lésions kystiques", "Imagerie fonctionnelle"]),
      subdomain("spleen", "Rate", ["Traumatisme splénique", "Lésions focales", "Infiltration", "Vascularisation"]),
    ]),
    domain("hepatobiliary", "Imagerie hépatobiliaire", [
      subdomain("liver-focal", "Lésions focales hépatiques", ["Carcinome hépatocellulaire", "Métastases", "Tumeurs bénignes", "Systèmes de classification", "Réponse thérapeutique"]),
      subdomain("liver-diffuse", "Maladies diffuses du foie", ["Stéatose", "Fibrose", "Surcharge en fer", "Inflammation", "Cirrhose et hypertension portale"]),
      subdomain("biliary", "Voies biliaires", ["Cholestase", "Lithiase", "Cholangite", "Tumeurs biliaires", "Imagerie postopératoire"]),
      subdomain("liver-transplant", "Transplantation hépatique", ["Évaluation pré-greffe", "Complications vasculaires", "Complications biliaires", "Suivi du greffon"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:hepatic-imaging"] }),
    domain("urogenital", "Imagerie urogénitale", [
      subdomain("kidney", "Rein", ["Masses rénales", "Maladies kystiques", "Obstruction", "Fonction rénale", "Greffe rénale"]),
      subdomain("urinary-tract", "Voies urinaires", ["Uretères", "Vessie", "Lithiase", "Urothélium", "Urographie"]),
      subdomain("prostate", "Prostate", ["IRM multiparamétrique", "Lésions prostatiques", "Stadification", "Biopsie guidée", "Suivi après traitement"]),
      subdomain("testis-penis", "Scrotum et pénis", ["Testicule", "Épididyme", "Torsion", "Tumeurs", "Doppler génital"]),
      subdomain("adrenal", "Surrénales", ["Adénome", "Phéochromocytome", "Métastase", "Caractérisation lipidique", "Imagerie fonctionnelle"]),
    ]),
    domain("gynecology-obstetrics", "Imagerie gynécologique, obstétricale et fœtale", [
      subdomain("uterus-cervix", "Utérus et col", ["Fibromes", "Adénomyose", "Cancer du col", "Cancer de l'endomètre", "Malformations utérines"]),
      subdomain("adnexa", "Ovaires et annexes", ["Masses ovariennes", "Endométriose", "Torsion", "Classification des lésions", "Suivi thérapeutique"]),
      subdomain("pregnancy", "Grossesse", ["Datation et biométrie", "Placenta", "Complications maternelles", "Urgences obstétricales", "Sécurité de l'imagerie"]),
      subdomain("fetal", "Imagerie fœtale", ["Échographie morphologique", "IRM fœtale", "Système nerveux fœtal", "Thorax et abdomen fœtaux", "Malformations"]),
    ]),
    domain("musculoskeletal", "Imagerie musculosquelettique", [
      subdomain("bone", "Os", ["Traumatisme osseux", "Tumeurs osseuses", "Infection", "Métabolisme osseux", "Microarchitecture"]),
      subdomain("joints", "Articulations", ["Cartilage", "Ligaments", "Synoviale", "Arthropathies", "Instabilité"]),
      subdomain("muscle-tendon", "Muscle et tendon", ["Déchirures", "Tendinopathies", "Dénervation", "Composition musculaire", "Élastographie"]),
      subdomain("spine-msk", "Rachis musculosquelettique", ["Disques", "Articulations postérieures", "Canal rachidien", "Déformation", "Postopératoire"]),
      subdomain("sports", "Imagerie du sport", ["Lésions aiguës", "Surcharge", "Retour au sport", "Biomécanique", "Suivi longitudinal"]),
    ]),
    domain("pediatric", "Radiologie pédiatrique", [
      subdomain("neonatal", "Imagerie néonatale", ["Prématurité", "Cerveau néonatal", "Thorax néonatal", "Abdomen néonatal", "Échographie transfontanellaire"]),
      subdomain("pediatric-body", "Imagerie pédiatrique corps entier", ["Pathologies congénitales", "Oncologie pédiatrique", "Imagerie abdominale", "Imagerie thoracique", "Imagerie musculosquelettique"]),
      subdomain("pediatric-protocols", "Protocoles pédiatriques", ["Adaptation à l'âge et au poids", "Réduction de dose", "Sédation comme contexte documentaire", "Mouvement", "Communication avec l'enfant"]),
    ]),
    domain("emergency-trauma", "Radiologie d'urgence et traumatologique", [
      subdomain("polytrauma", "Polytraumatisme", ["Stratégies d'imagerie", "Traumatisme crânien", "Traumatisme thoracoabdominal", "Traumatisme pelvien", "Suivi interventionnel"]),
      subdomain("acute-abdomen", "Abdomen aigu", ["Occlusion", "Ischémie", "Perforation", "Inflammation aiguë", "Hémorragie"]),
      subdomain("acute-neuro", "Urgences neurologiques", ["AVC", "Hémorragie intracrânienne", "Compression médullaire", "Crise épileptique", "Altération aiguë de conscience"]),
      subdomain("acute-vascular", "Urgences vasculaires", ["Syndrome aortique aigu", "Embolie pulmonaire", "Ischémie de membre", "Hémorragie active", "Thrombose veineuse"]),
    ]),
    domain("oncologic-imaging", "Imagerie oncologique", [
      subdomain("detection-staging", "Détection et stadification", ["Détection tumorale", "Stadification locale", "Stadification ganglionnaire", "Métastases", "Bilan d'extension multimodal"]),
      subdomain("response", "Évaluation de réponse", ["Critères morphologiques", "Critères fonctionnels", "Réponse métabolique", "Pseudo-progression", "Suivi longitudinal"]),
      subdomain("treatment-planning", "Planification et guidage", ["Délinéation tumorale", "Planification chirurgicale", "Planification interventionnelle", "Interface radiothérapie", "Biopsie ciblée"]),
      subdomain("surveillance", "Surveillance oncologique", ["Récidive", "Complications thérapeutiques", "Toxicité", "Second cancer", "Incidentalomes"]),
    ]),
    domain("whole-body", "Imagerie corps entier", [
      subdomain("whole-body-mri", "IRM corps entier", ["Protocoles corps entier", "Diffusion corps entier", "Charge tumorale", "Moelle osseuse", "Applications systémiques"]),
      subdomain("whole-body-pet", "PET corps entier", ["Acquisition corps entier", "Correction et reconstruction", "Distribution multi-organes", "Quantification globale", "Suivi longitudinal"]),
      subdomain("multi-organ", "Approches multi-organes", ["Composition corporelle", "Maladies systémiques", "Phénotypage multi-organes", "Incidentalomes", "Cohortes populationnelles"]),
    ]),
  ], { priority: "PRIMARY", projectionTypes: commonProjectionSets.clinical }),

  territory("clinical-applications", "Pathologies et applications cliniques", [
    domain("screening-prevention", "Dépistage et détection précoce", [
      subdomain("population-screening", "Dépistage organisé ou populationnel", ["Sein", "Poumon", "Côlon", "Risque cardiovasculaire", "Populations à haut risque"]),
      subdomain("opportunistic-screening", "Dépistage opportuniste", ["Composition corporelle", "Calcifications vasculaires", "Ostéoporose", "Stéatose", "Anomalies fortuites"]),
      subdomain("risk-stratification", "Stratification du risque par l'image", ["Scores d'imagerie", "Biomarqueurs prédictifs", "Modèles multimodaux", "Validation externe", "Bénéfice-risque du dépistage"]),
    ]),
    domain("diagnosis-characterization", "Diagnostic et caractérisation", [
      subdomain("lesion-detection", "Détection de lésions", ["Sensibilité de détection", "Lésions focales", "Lésions diffuses", "Incidentalomes", "Comparaison de modalités"]),
      subdomain("differential-diagnosis", "Diagnostic différentiel", ["Caractérisation morphologique", "Caractérisation fonctionnelle", "Caractérisation quantitative", "Signes négatifs", "Contexte clinique"]),
      subdomain("tissue-characterization", "Caractérisation tissulaire", ["Fibrose", "Œdème", "Graisse", "Fer", "Calcification", "Nécrose et hémorragie"]),
    ]),
    domain("staging-prognosis", "Stadification et pronostic", [
      subdomain("local-staging", "Stadification locale", ["Extension anatomique", "Envahissement vasculaire", "Envahissement nerveux", "Atteinte ganglionnaire", "Résécabilité documentaire"]),
      subdomain("systemic-staging", "Stadification systémique", ["Métastases", "Charge lésionnelle", "Atteinte médullaire", "Distribution multi-organes", "Stadification multimodale"]),
      subdomain("prognostic-imaging", "Biomarqueurs pronostiques", ["Association au pronostic", "Stratification", "Survie et événements", "Validation de modèle", "Limites de généralisation"]),
    ]),
    domain("treatment-response", "Réponse au traitement et suivi", [
      subdomain("response-criteria", "Critères de réponse", ["Critères dimensionnels", "Critères fonctionnels", "Critères métaboliques", "Critères spécifiques d'organe", "Progression et pseudo-progression"]),
      subdomain("longitudinal-monitoring", "Suivi longitudinal", ["Changement mesuré", "Variabilité de mesure", "Temporalité du suivi", "Comparabilité inter-examens", "Détection de récidive"]),
      subdomain("toxicity-complications", "Toxicité et complications", ["Complications postopératoires", "Toxicité médicamenteuse", "Toxicité radique", "Complications interventionnelles", "Effets tardifs"]),
    ]),
    domain("cardiovascular-disease", "Applications cardiovasculaires", [
      subdomain("ischemic-heart", "Cardiopathie ischémique", ["Ischémie", "Infarctus", "Viabilité", "Obstruction microvasculaire", "Hémorragie intramyocardique"]),
      subdomain("cardiomyopathy", "Cardiomyopathies", ["Dilatée", "Hypertrophique", "Infiltrative", "Inflammatoire", "Arythmogène"]),
      subdomain("vascular-disease", "Maladies vasculaires", ["Athérosclérose", "Anévrisme", "Dissection", "Thrombose", "Malformations"]),
      subdomain("heart-failure", "Insuffisance cardiaque", ["Phénotypage", "Remodelage", "Congestion", "Fonction ventriculaire", "Pronostic d'imagerie"]),
    ]),
    domain("neurologic-disease", "Applications neurologiques", [
      subdomain("stroke", "Maladies cérébrovasculaires", ["AVC ischémique", "Hémorragie", "Pénombre et core", "Collatéralité", "Récupération"]),
      subdomain("neuro-oncology-application", "Neuro-oncologie", ["Gliomes", "Métastases", "Lymphome", "Réponse au traitement", "Progression et pseudo-progression"]),
      subdomain("neurodegenerative", "Neurodégénératif", ["Démences", "Maladie de Parkinson", "Atrophie", "Métabolisme cérébral", "Connectivité"]),
      subdomain("inflammatory-demyelinating", "Inflammatoire et démyélinisant", ["Sclérose en plaques", "Encéphalite", "Vascularite", "Infection", "Suivi de charge lésionnelle"]),
      subdomain("epilepsy", "Épilepsie", ["Lésion épileptogène", "Imagerie fonctionnelle", "Imagerie métabolique", "Planification chirurgicale", "Réseaux"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:neuro-oncology"] }),
    domain("respiratory-disease", "Applications thoraciques et respiratoires", [
      subdomain("lung-cancer", "Cancer pulmonaire", ["Dépistage", "Caractérisation du nodule", "Stadification", "Réponse", "Surveillance"]),
      subdomain("diffuse-lung", "Maladies pulmonaires diffuses", ["Fibrose", "Pneumopathies interstitielles", "Emphysème", "Quantification", "Progression"]),
      subdomain("pulmonary-infection", "Infections pulmonaires", ["Pneumonie", "Infection opportuniste", "Tuberculose", "Complications", "Suivi"]),
      subdomain("pulmonary-vascular-application", "Maladies vasculaires pulmonaires", ["Embolie", "Hypertension pulmonaire", "Perfusion", "Shunts", "Thromboembolie chronique"]),
    ]),
    domain("digestive-hepatobiliary-disease", "Applications digestives et hépatobiliaires", [
      subdomain("liver-disease", "Maladies hépatiques", ["Fibrose", "Stéatose", "Surcharge", "Cirrhose", "Hypertension portale"]),
      subdomain("liver-oncology", "Oncologie hépatique", ["Carcinome hépatocellulaire", "Métastases", "Cholangiocarcinome", "Réponse locorégionale", "Surveillance"]),
      subdomain("bowel-disease", "Maladies intestinales", ["Inflammation chronique", "Ischémie", "Occlusion", "Cancer colorectal", "Motilité"]),
      subdomain("pancreatic-biliary", "Pancréas et voies biliaires", ["Pancréatite", "Cancer pancréatique", "Lésions kystiques", "Obstruction biliaire", "Cholangite"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:hepatic-imaging"] }),
    domain("urogenital-reproductive-disease", "Applications urogénitales et reproductives", [
      subdomain("renal-disease", "Maladies rénales", ["Tumeurs", "Maladies parenchymateuses", "Obstruction", "Lithiase", "Greffe"]),
      subdomain("pelvic-oncology", "Oncologie pelvienne", ["Prostate", "Vessie", "Col", "Endomètre", "Ovaire"]),
      subdomain("benign-pelvic", "Pathologies pelviennes bénignes", ["Endométriose", "Fibromes", "Adénomyose", "Prolapsus", "Douleur pelvienne"]),
      subdomain("fertility-pregnancy", "Fertilité et grossesse", ["Infertilité", "Implantation", "Placenta", "Développement fœtal", "Complications"]),
    ]),
    domain("musculoskeletal-rheumatic-disease", "Applications musculosquelettiques et rhumatologiques", [
      subdomain("trauma-sports", "Traumatologie et sport", ["Fractures", "Lésions ligamentaires", "Lésions tendineuses", "Surcharge", "Cicatrisation"]),
      subdomain("arthritis", "Arthropathies", ["Inflammatoires", "Dégénératives", "Cristallines", "Infectieuses", "Quantification structurale"]),
      subdomain("bone-tumor", "Tumeurs osseuses et tissus mous", ["Caractérisation", "Extension locale", "Biopsie", "Réponse", "Surveillance"]),
      subdomain("metabolic-bone", "Maladies métaboliques osseuses", ["Ostéoporose", "Densité minérale", "Microarchitecture", "Fractures de fragilité", "Composition médullaire"]),
    ]),
    domain("infection-inflammation", "Infection et inflammation", [
      subdomain("infection-imaging", "Imagerie de l'infection", ["Foyer profond", "Ostéite", "Endocardite", "Infection de dispositif", "Imagerie moléculaire"]),
      subdomain("systemic-inflammation", "Inflammation systémique", ["Vascularites", "Sarcoïdose", "Maladies auto-immunes", "Inflammation multiorgane", "Activité thérapeutique"]),
      subdomain("fever-unknown-origin", "Fièvre d'origine indéterminée", ["Stratégies multimodales", "PET", "Sites occultes", "Rendement diagnostique", "Limites"]),
    ]),
    domain("appropriateness-incidental", "Pertinence, indications et découvertes fortuites", [
      subdomain("appropriateness", "Pertinence d'imagerie", ["Question clinique", "Choix documentaire de modalité", "Population", "Bénéfice-risque", "Recommandations institutionnelles"]),
      subdomain("incidental-findings", "Découvertes fortuites", ["Nodules", "Masses surrénaliennes", "Kystes", "Calcifications", "Suivi documentaire"]),
      subdomain("negative-imaging", "Résultats négatifs et exclusions", ["Valeur d'un examen négatif", "Limites de sensibilité", "Diagnostics non exclus", "Contexte prétest", "Questions ouvertes"]),
    ]),
  ], { priority: "PRIMARY", projectionTypes: commonProjectionSets.clinical }),

  territory("measurements-biomarkers", "Mesures, biomarqueurs et quantification", [
    domain("morphology-volumetry", "Morphologie et volumétrie", [
      subdomain("linear-measurements", "Mesures linéaires et angulaires", ["Diamètre", "Longueur", "Épaisseur", "Angle", "Règles de mesure"]),
      subdomain("area-volume", "Aire et volume", ["Segmentation volumétrique", "Volume d'organe", "Volume lésionnel", "Charge tumorale", "Changement longitudinal"]),
      subdomain("shape", "Forme et géométrie", ["Sphéricité", "Surface", "Courbure", "Complexité", "Asymétrie"]),
    ]),
    domain("signal-intensity", "Signal, intensité et texture", [
      subdomain("signal-measures", "Mesures de signal", ["Intensité relative", "Rapport signal-bruit", "Contraste-bruit", "Normalisation du signal", "Références internes"]),
      subdomain("texture", "Texture", ["Premier ordre", "Matrices de cooccurrence", "Hétérogénéité", "Filtrage", "Robustesse des textures"]),
      subdomain("enhancement", "Rehaussement", ["Amplitude", "Cinétique", "Wash-in et wash-out", "Courbes temps-intensité", "Rehaussement relatif"]),
    ]),
    domain("attenuation-density-composition", "Atténuation, densité et composition", [
      subdomain("ct-attenuation", "Atténuation CT", ["Unités Hounsfield", "Densité tissulaire", "Calibration", "Atténuation avant et après contraste", "Variabilité scanner"]),
      subdomain("material-decomposition", "Décomposition de matériaux", ["Iode", "Calcium", "Acide urique", "Graisse", "Matériaux de base"]),
      subdomain("body-composition", "Composition corporelle", ["Graisse viscérale", "Graisse sous-cutanée", "Muscle", "Os", "Distribution multi-organes"]),
    ]),
    domain("relaxation-mapping", "Relaxation et mapping quantitatif", [
      subdomain("t1-relaxation", "T1", ["T1 natif", "T1 post-contraste", "Mapping T1", "R1", "Dépendance au champ et à la méthode"]),
      subdomain("t2-relaxation", "T2", ["Mapping T2", "Œdème", "Modèles d'ajustement", "Dépendance à la séquence", "Reproductibilité"]),
      subdomain("t2star-r2star", "T2 étoile et R2 étoile", ["Mapping T2 étoile", "R2 étoile", "Surcharge en fer", "Effets de susceptibilité", "Correction du bruit"]),
      subdomain("extracellular-space", "Espace extracellulaire", ["Fraction de volume extracellulaire", "Coefficient de partition", "Hématocrite", "Variation de R1", "ECV IRM et ECV CT"], { catalogNodeIds: ["noxia:knowledge-catalog:domain:ecv-t1"], catalogMappingScope: "EXACT" }),
      subdomain("other-relaxometry", "Autres relaxométries", ["T1rho", "Transfert d'aimantation", "Myelin water fraction", "Modèles multicompartimentaux", "Temps de relaxation multinoyaux"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:ecv-t1", "noxia:knowledge-catalog:domain:t2-mapping"] }),
    domain("diffusion-metrics", "Diffusion", [
      subdomain("adc", "ADC", ["Définition ADC", "Calcul mono-exponentiel", "Valeurs b", "Unités", "Répétabilité et reproductibilité"], { catalogNodeIds: ["noxia:knowledge-catalog:domain:diffusion-adc"], catalogMappingScope: "EXACT" }),
      subdomain("tensor", "Tenseur de diffusion", ["Fractional anisotropy", "Mean diffusivity", "Eigenvalues", "Tractographie", "Incertaines de direction"]),
      subdomain("advanced-diffusion", "Diffusion avancée", ["Kurtosis", "IVIM", "NODDI", "Modèles multi-shell", "Diffusion restriction spectrum"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:diffusion-adc"] }),
    domain("perfusion-hemodynamics", "Perfusion et hémodynamique", [
      subdomain("flow-volume-time", "Débit, volume et temps", ["CBF", "CBV", "MTT", "Tmax", "Temps au pic"], { catalogNodeIds: ["noxia:knowledge-catalog:domain:cerebral-perfusion"], catalogMappingScope: "EXACT" }),
      subdomain("kinetic-models", "Modèles cinétiques", ["Fonction d'entrée", "Déconvolution", "Perméabilité", "Volume plasmatique", "Constantes de transfert"]),
      subdomain("vascular-function", "Fonction vasculaire", ["Réserve", "Réactivité", "Collatéralité", "Transit capillaire", "Shunt"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:cerebral-perfusion"] }),
    domain("oxygenation-metabolism", "Oxygénation et métabolisme", [
      subdomain("oxygen-extraction", "Extraction d'oxygène", ["OEF", "Saturation veineuse", "Désoxyhémoglobine", "Hypothèses physiologiques", "Comparaison PET et IRM"], { catalogNodeIds: ["noxia:knowledge-catalog:domain:oef-cmro2"], catalogMappingScope: "EXACT" }),
      subdomain("oxygen-metabolism", "Métabolisme de l'oxygène", ["CMRO2", "Couplage débit-métabolisme", "Mesures PET", "Estimations IRM", "Unités et calibration"], { catalogNodeIds: ["noxia:knowledge-catalog:domain:oef-cmro2"], catalogMappingScope: "EXACT" }),
      subdomain("metabolic-imaging", "Métabolisme d'imagerie", ["Glucose", "Lipides", "Métabolites MR", "Traceurs moléculaires", "Cinétique métabolique"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:oef-cmro2"] }),
    domain("mechanics-elastography", "Mécanique et élastographie", [
      subdomain("stiffness", "Rigidité", ["Module de cisaillement", "Vitesse d'onde", "Élasticité apparente", "Viscoélasticité", "Dépendance fréquentielle"]),
      subdomain("strain-motion", "Déformation et mouvement", ["Strain", "Strain rate", "Déplacement", "Tracking", "Mécanique régionale"]),
      subdomain("pressure-compliance", "Pression et compliance", ["Compliance vasculaire", "Distensibilité", "Onde de pouls", "Estimations de pression", "Couplage fluide-structure"]),
    ]),
    domain("flow-function", "Flux et fonction", [
      subdomain("cardiac-function", "Fonction cardiaque", ["Volumes", "Fraction d'éjection", "Masse", "Débit cardiaque", "Fonction régionale"]),
      subdomain("vascular-flow", "Flux vasculaire", ["Vitesse", "Débit", "Wall shear stress", "Vorticité", "Flux 4D"]),
      subdomain("organ-function", "Fonction d'organe", ["Ventilation", "Excrétion rénale", "Motilité", "Fonction biliaire", "Fonction placentaire"]),
    ]),
    domain("molecular-tracer-kinetics", "Biomarqueurs moléculaires et cinétique des traceurs", [
      subdomain("uptake", "Uptake et fixation", ["SUV", "Rapport cible-référence", "Volume métabolique", "Glycolyse totale", "Normalisation"]),
      subdomain("dynamic-pet", "PET dynamique", ["Courbes temps-activité", "Modèles compartimentaux", "Patlak", "Liaison récepteur", "Débit sanguin"]),
      subdomain("radiopharmaceutical-dosimetry", "Dosimétrie radiopharmaceutique", ["Activité cumulée", "Temps de résidence", "Dose absorbée", "Dosimétrie d'organe", "Incertitude"]),
    ]),
    domain("radiomics-phenotyping", "Radiomique et phénotypage", [
      subdomain("handcrafted-radiomics", "Radiomique conventionnelle", ["Prétraitement", "Discrétisation", "Caractéristiques", "Sélection", "Robustesse"]),
      subdomain("deep-features", "Caractéristiques profondes", ["Embeddings", "Représentations latentes", "Transfer learning", "Stabilité", "Interprétabilité"]),
      subdomain("imaging-phenotypes", "Phénotypes d'imagerie", ["Signatures", "Clusters", "Habitat imaging", "Intégration multimodale", "Validation clinique"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:radiomics"] }),
    domain("reference-values-thresholds", "Valeurs de référence et seuils", [
      subdomain("normal-ranges", "Intervalles de référence", ["Population de référence", "Méthode", "Champ et plateforme", "Âge et sexe", "Incertitude"]),
      subdomain("thresholds", "Seuils", ["Seuil diagnostique", "Seuil pronostique", "Seuil technique", "Validation externe", "Hétérogénéité"]),
      subdomain("change-criteria", "Changement significatif", ["Repeatability coefficient", "Smallest detectable change", "Limites d'accord", "Erreur de mesure", "Réponse longitudinale"]),
    ]),
  ], { priority: "FOUNDATION", projectionTypes: commonProjectionSets.quantitative }),

  territory("physics-instrumentation", "Physique, instrumentation et technologies", [
    domain("radiation-matter", "Rayonnements et interaction avec la matière", [
      subdomain("xray-production", "Production des rayons X", ["Tube à rayons X", "Spectre", "Filtration", "Géométrie du faisceau", "Stabilité de sortie"]),
      subdomain("photon-interactions", "Interactions photon-matière", ["Photoélectrique", "Compton", "Atténuation", "Diffusion", "Dépendance énergétique"]),
      subdomain("radiation-detection", "Détection des rayonnements", ["Scintillateurs", "Semi-conducteurs", "Détecteurs intégrateurs", "Comptage photonique", "Efficacité et bruit"]),
    ]),
    domain("mr-physics", "Physique IRM", [
      subdomain("magnetization", "Magnétisation et relaxation", ["Précession", "T1", "T2", "T2 étoile", "Équations de Bloch"]),
      subdomain("spatial-encoding", "Encodage spatial", ["Gradients", "K-space", "Échantillonnage cartésien", "Trajectoires non cartésiennes", "Bande passante"]),
      subdomain("rf-coils", "Radiofréquence et antennes", ["Excitation RF", "Antennes émission-réception", "Parallélisation", "Profil B1", "SAR"]),
      subdomain("mr-contrast", "Mécanismes de contraste IRM", ["Pondération", "Inversion", "Saturation", "Diffusion", "Susceptibilité et échange"]),
    ]),
    domain("ultrasound-physics", "Physique ultrasonore", [
      subdomain("wave-propagation", "Propagation ultrasonore", ["Impédance", "Réflexion", "Réfraction", "Atténuation", "Diffusion"]),
      subdomain("transducers", "Transducteurs", ["Piézoélectricité", "Réseaux phasés", "Fréquence", "Focalisation", "Bande passante"]),
      subdomain("beamforming", "Formation de faisceau", ["Délais", "Aperture", "Beamforming adaptatif", "Imagerie ultrarapide", "Compounding"]),
    ]),
    domain("nuclear-physics", "Physique de médecine nucléaire", [
      subdomain("radioactive-decay", "Décroissance radioactive", ["Types de désintégration", "Demi-vie", "Activité", "Énergie", "Chaînes de décroissance"]),
      subdomain("gamma-pet-detection", "Détection gamma et PET", ["Collimation", "Coïncidences", "Temps de vol", "Résolution énergétique", "Temps mort"]),
      subdomain("corrections-nuclear", "Corrections de médecine nucléaire", ["Atténuation", "Diffusion", "Randoms", "Mouvement", "Décroissance"]),
    ]),
    domain("sampling-acquisition", "Échantillonnage et acquisition", [
      subdomain("spatial-resolution", "Résolution spatiale", ["Taille de voxel", "Fonction d'étalement", "Résolution dans le plan", "Épaisseur de coupe", "Partial volume"]),
      subdomain("temporal-resolution", "Résolution temporelle", ["Cadence", "Fenêtre temporelle", "Gating", "Acquisition dynamique", "Compromis signal-temps"]),
      subdomain("sampling-theory", "Théorie de l'échantillonnage", ["Nyquist", "Aliasing", "Sous-échantillonnage", "Compressed sensing", "Échantillonnage adaptatif"]),
    ]),
    domain("reconstruction-science", "Science de la reconstruction", [
      subdomain("analytic-reconstruction", "Reconstruction analytique", ["Filtered back projection", "Transformées", "Interpolation", "Regridding", "Limites analytiques"]),
      subdomain("iterative-reconstruction", "Reconstruction itérative", ["Modèle système", "Régularisation", "Optimisation", "Convergence", "Texture du bruit"]),
      subdomain("learned-reconstruction", "Reconstruction apprise", ["Dénoyage profond", "Reconstruction end-to-end", "Modèles hybrides", "Hallucination", "Validation"]),
      subdomain("quantitative-reconstruction", "Reconstruction quantitative", ["Corrections physiques", "Calibration", "Modèles paramétriques", "Propagation d'incertitude", "Comparabilité"]),
    ]),
    domain("artifacts-corrections", "Artéfacts et corrections", [
      subdomain("motion-artifacts", "Mouvement", ["Mouvement respiratoire", "Mouvement cardiaque", "Mouvement patient", "Gating", "Correction prospective et rétrospective"]),
      subdomain("hardware-artifacts", "Artéfacts matériels", ["Inhomogénéité", "Gradient", "Détecteur", "Anneaux", "Dérive"]),
      subdomain("physics-artifacts", "Artéfacts physiques", ["Métal", "Beam hardening", "Aliasing", "Chemical shift", "Susceptibilité"]),
      subdomain("correction-methods", "Méthodes de correction", ["Correction de mouvement", "Correction d'atténuation", "Correction de champ", "Correction de diffusion", "Réduction d'artéfacts métalliques"]),
    ]),
    domain("contrast-agents", "Agents de contraste et traceurs", [
      subdomain("gadolinium", "Agents gadolinés", ["Classes", "Relaxivité", "Distribution", "Dose comme contexte documentaire", "Sécurité et rétention"]),
      subdomain("iodinated", "Contrastes iodés", ["Concentration iodée", "Osmolalité", "Cinétique", "Dose comme contexte documentaire", "Sécurité"]),
      subdomain("ultrasound-agents", "Agents échographiques", ["Microbulles", "Résonance", "Destruction", "Cinétique", "Sécurité"]),
      subdomain("radiopharmaceuticals", "Radiopharmaceutiques", ["Production", "Marquage", "Biodistribution", "Cinétique", "Dosimétrie"]),
    ]),
    domain("equipment-platforms", "Équipements, plateformes et constructeurs", [
      subdomain("scanner-architecture", "Architecture des systèmes", ["Aimants et gradients", "Gantry et tubes", "Détecteurs", "Antennes", "Tables et accessoires"]),
      subdomain("equipment-generations", "Générations technologiques", ["Générations CT", "Générations IRM", "Générations PET/SPECT", "Plateformes échographiques", "Compatibilité documentaire"]),
      subdomain("manufacturer-context", "Contexte constructeur", ["Constructeur", "Gamme", "Modèle", "Version logicielle publiée", "Capacité documentée"]),
      subdomain("installed-vs-documentary", "Frontière équipement documentaire", ["Modèle documentaire", "Instance installée exclue", "Licence exclue", "Option technique publiée", "Contexte multicentrique"]),
    ]),
    domain("metrology-calibration", "Métrologie et calibration", [
      subdomain("traceability", "Traçabilité métrologique", ["Mesurande", "Chaîne de traçabilité", "Référence", "Incertitude", "Comparabilité"]),
      subdomain("phantoms", "Fantômes", ["Fantômes géométriques", "Fantômes quantitatifs", "Fantômes anthropomorphiques", "Stabilité", "Protocoles multicentriques"]),
      subdomain("calibration", "Calibration", ["Calibration scanner", "Calibration croisée", "Drift", "Contrôle longitudinal", "Seuils d'acceptation documentaires"]),
    ]),
    domain("emerging-technology", "Technologies émergentes", [
      subdomain("advanced-detectors", "Détecteurs avancés", ["Comptage photonique", "Détecteurs numériques directs", "Temps de vol avancé", "Capteurs portables", "Détection hybride"]),
      subdomain("novel-fields", "Nouveaux champs et aimants", ["Ultra-haut champ", "Bas champ", "Aimants compacts", "Gradients haute performance", "Noyaux non protoniques"]),
      subdomain("robotics-navigation", "Robotique et navigation", ["Systèmes robotiques", "Navigation électromagnétique", "Réalité augmentée", "Fusion temps réel", "Validation de précision"]),
    ], { priority: "FUTURE", targetCoverage: "FUTURE" }),
  ], { priority: "FOUNDATION", projectionTypes: commonProjectionSets.technical }),

  territory("computational-imaging", "Traitement d'image, informatique scientifique et IA", [
    domain("preprocessing", "Prétraitement", [
      subdomain("denoising-bias", "Dénoyage et correction d'intensité", ["Dénoyage", "Bias field", "Normalisation", "Standardisation", "Préservation quantitative"]),
      subdomain("resampling", "Rééchantillonnage", ["Interpolation", "Résolution cible", "Orientation", "Cropping", "Propagation des labels"]),
      subdomain("harmonization", "Harmonisation", ["Harmonisation d'intensité", "ComBat", "Style transfer", "Calibration intersite", "Validation des effets"]),
    ]),
    domain("registration", "Recalage", [
      subdomain("rigid-affine", "Recalage rigide et affine", ["Transformations", "Métriques de similarité", "Optimisation", "Initialisation", "Validation"]),
      subdomain("deformable", "Recalage déformable", ["Champs de déplacement", "Régularisation", "Difféomorphisme", "Correspondance anatomique", "Erreurs locales"]),
      subdomain("multimodal-registration", "Recalage multimodal", ["Information mutuelle", "Fusion CT-IRM", "Fusion PET-anatomique", "Atlas", "Validation intermodale"]),
      subdomain("motion-registration", "Recalage temporel", ["Mouvement respiratoire", "Mouvement cardiaque", "Séries dynamiques", "Suivi longitudinal", "Propagation"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:registration"] }),
    domain("segmentation", "Segmentation", [
      subdomain("manual-semi", "Segmentation manuelle et semi-automatique", ["Contours", "Région d'intérêt", "Seuil", "Region growing", "Outils interactifs"]),
      subdomain("atlas-model", "Atlas et modèles", ["Atlas probabiliste", "Modèles déformables", "Shape models", "Graph cuts", "Fusion de labels"]),
      subdomain("deep-segmentation", "Segmentation profonde", ["CNN", "Transformers", "3D", "Segmentation multi-classes", "Généralisation"]),
      subdomain("segmentation-validation", "Validation de segmentation", ["Dice", "Distance de surface", "Erreurs de volume", "Interlecteur", "Références et consensus"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:segmentation"] }),
    domain("detection-classification", "Détection, classification et diagnostic assisté", [
      subdomain("detection", "Détection", ["Candidats", "Localisation", "Faux positifs", "Sensibilité lésionnelle", "Évaluation free-response"]),
      subdomain("classification", "Classification", ["Classes diagnostiques", "Probabilités", "Calibration", "Multi-label", "Validation externe"]),
      subdomain("computer-aided", "Aide à la détection et au diagnostic", ["CAD", "Triage documentaire", "Second lecteur", "Aide à la caractérisation", "Interaction humain-algorithme"]),
    ]),
    domain("quantitative-pipelines", "Pipelines quantitatifs", [
      subdomain("measurement-pipeline", "Chaîne de mesure", ["Entrées", "Prétraitement", "Calcul", "Sorties", "Contrôle qualité"]),
      subdomain("parametric-mapping", "Cartographie paramétrique", ["Ajustement", "Masques", "Cartes", "Incertitude", "Visualisation"]),
      subdomain("batch-processing", "Traitement de corpus", ["Reproductibilité", "Paramétrage", "Provenance", "Échec et données manquantes", "Rapport documentaire"]),
    ]),
    domain("radiomics-computation", "Calcul radiomique", [
      subdomain("feature-engineering", "Ingénierie de caractéristiques", ["Discrétisation", "Filtres", "Morphologie", "Texture", "Conformité des définitions"]),
      subdomain("feature-selection", "Sélection et réduction", ["Redondance", "Stabilité", "Sélection supervisée", "Réduction dimensionnelle", "Fuites de données"]),
      subdomain("radiomic-models", "Modèles radiomiques", ["Construction", "Calibration", "Validation", "Transportabilité", "Rapportage"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:radiomics"] }),
    domain("machine-learning", "Apprentissage automatique", [
      subdomain("supervised", "Apprentissage supervisé", ["Classification", "Régression", "Survie", "Déséquilibre", "Validation"]),
      subdomain("unsupervised", "Apprentissage non supervisé", ["Clustering", "Représentation", "Phénotypage", "Détection d'anomalie", "Stabilité"]),
      subdomain("self-supervised", "Auto-supervisé et faible supervision", ["Pré-entraînement", "Contraste", "Pseudo-labels", "Apprentissage fédéré documentaire", "Transfert"]),
      subdomain("multimodal-ai", "IA multimodale", ["Image et texte", "Image et clinique", "Image et omiques", "Fusion de modalités", "Données manquantes"]),
    ]),
    domain("foundation-generative", "Modèles fondamentaux et génératifs", [
      subdomain("foundation-models", "Modèles fondamentaux d'imagerie", ["Pré-entraînement à grande échelle", "Adaptation", "Embeddings", "Zero-shot", "Évaluation"]),
      subdomain("generative-imaging", "Imagerie générative", ["Synthèse", "Traduction intermodalité", "Augmentation", "Reconstruction", "Hallucination"]),
      subdomain("vision-language", "Modèles vision-langage", ["Rapportage", "Recherche image-texte", "Questions-réponses", "Alignement", "Sécurité"]),
    ], { priority: "SECONDARY" }),
    domain("data-annotation", "Données et annotation", [
      subdomain("dataset-design", "Conception de datasets documentaires", ["Population", "Échantillonnage", "Partitions", "Données manquantes", "Provenance"]),
      subdomain("annotation", "Annotation", ["Schéma d'annotation", "Lecteurs", "Consensus", "Adjudication documentée", "Qualité des labels"]),
      subdomain("data-shift", "Variation et dérive", ["Domain shift", "Site", "Scanner", "Population", "Temporal drift"]),
    ]),
    domain("ai-evaluation", "Évaluation et validation de l'IA", [
      subdomain("performance", "Performance", ["Discrimination", "Calibration", "Localisation", "Courbes décisionnelles documentaires", "Intervalles d'incertitude"]),
      subdomain("robustness", "Robustesse", ["Perturbations", "Sous-groupes", "Sites externes", "Modalités", "Cas hors distribution"]),
      subdomain("bias-fairness", "Biais et équité", ["Représentation", "Performance par sous-groupe", "Biais d'annotation", "Biais de sélection", "Mitigation documentée"]),
      subdomain("clinical-evaluation", "Évaluation en contexte clinique", ["Études lecteur", "Impact sur le workflow", "Prospectif", "Utilité clinique", "Surveillance post-déploiement documentée"]),
    ]),
    domain("explainability-uncertainty", "Explicabilité et incertitude", [
      subdomain("explainability", "Explicabilité", ["Attribution", "Cartes de saillance", "Exemples", "Concept-based", "Évaluation humaine"]),
      subdomain("uncertainty", "Incertitude", ["Aléatoire", "Épistémique", "Calibration", "Conformal prediction", "Abstention"]),
      subdomain("failure-analysis", "Analyse d'échec", ["Taxonomie des erreurs", "Cas limites", "Faux positifs et négatifs", "Dérive", "Documentation des limites"]),
    ]),
    domain("visualization", "Visualisation et interaction", [
      subdomain("viewing", "Visualisation d'images", ["Fenêtrage", "MPR", "MIP", "Volume rendering", "Fusion"]),
      subdomain("quantitative-display", "Affichage quantitatif", ["Cartes paramétriques", "Échelles", "Superpositions", "Incertitude", "Comparaison longitudinale"]),
      subdomain("immersive", "Visualisation immersive", ["3D", "Réalité augmentée", "Réalité virtuelle", "Impression 3D", "Navigation"]),
    ]),
  ], { priority: "PRIMARY", projectionTypes: commonProjectionSets.technical }),

  territory("quality-safety", "Qualité, sécurité, standards et gouvernance", [
    domain("image-quality", "Qualité d'image", [
      subdomain("objective-quality", "Mesures objectives", ["Résolution", "Bruit", "Contraste", "Uniformité", "Artéfacts"]),
      subdomain("task-based-quality", "Qualité orientée tâche", ["Détectabilité", "Observer models", "Tâche clinique", "Dose-qualité", "Validation"]),
      subdomain("subjective-quality", "Évaluation subjective", ["Échelles", "Lecteurs", "Accord", "Préférence", "Biais"]),
    ]),
    domain("quality-control", "Contrôle et assurance qualité", [
      subdomain("acceptance-testing", "Recette et constance documentaires", ["Tests d'acceptation", "Contrôles périodiques", "Seuils documentés", "Dérive", "Traçabilité"]),
      subdomain("phantom-qc", "Contrôle sur fantôme", ["Géométrie", "Résolution", "Signal", "Quantification", "Automatisation documentaire"]),
      subdomain("clinical-qc", "Contrôle qualité des données", ["Complétude", "Artéfacts", "Conformité protocole", "Qualité de carte", "Exclusions"]),
    ], { catalogNodeIds: ["noxia:knowledge-catalog:domain:quality-control"] }),
    domain("reproducibility-harmonization", "Reproductibilité et harmonisation", [
      subdomain("repeatability", "Répétabilité", ["Intra-session", "Test-retest", "Coefficient de répétabilité", "Erreur de mesure", "Variabilité biologique"]),
      subdomain("reproducibility", "Reproductibilité", ["Interlecteur", "Interscanner", "Intersite", "Interlogiciel", "Interopérateur"]),
      subdomain("harmonization-quality", "Harmonisation", ["Protocoles", "Fantômes", "Calibration", "Post-traitement", "Normalisation statistique"]),
    ]),
    domain("radiation-safety", "Radioprotection et dose", [
      subdomain("dose-metrics", "Grandeurs de dose", ["CTDI", "DLP", "Dose efficace comme estimation", "Dose peau", "Dose organe"]),
      subdomain("optimization", "Optimisation", ["Justification", "ALARA", "Protocoles", "Pédiatrie", "Suivi de dose"]),
      subdomain("occupational-public", "Exposition professionnelle et du public", ["Blindage", "Personnel", "Grossesse", "Interventionnel", "Événements"]),
    ]),
    domain("mr-safety", "Sécurité IRM", [
      subdomain("static-field", "Champ statique", ["Projectiles", "Implants", "Déplacement", "Vertiges", "Zones de sécurité"]),
      subdomain("rf-gradient-safety", "RF et gradients", ["SAR", "Échauffement", "Stimulation", "Bruit acoustique", "Câbles et brûlures"]),
      subdomain("implant-safety", "Implants et dispositifs", ["MR Safe", "MR Conditional", "Conditions documentées", "Artéfacts", "Gestion du risque"]),
    ]),
    domain("contrast-safety", "Sécurité des contrastes et traceurs", [
      subdomain("acute-reactions", "Réactions aiguës", ["Classification", "Facteurs de risque", "Prévention documentaire", "Prise en charge comme référence", "Traçabilité"]),
      subdomain("organ-risks", "Risques d'organe", ["Fonction rénale", "Grossesse et allaitement", "Thyroïde", "Rétention", "Population pédiatrique"]),
      subdomain("extravasation", "Extravasation", ["Détection", "Volume", "Facteurs techniques", "Suivi documentaire", "Prévention"]),
    ]),
    domain("patient-safety", "Sécurité patient", [
      subdomain("identification", "Identité et côté", ["Identitovigilance", "Latéralité", "Concordance demande-examen", "Marquage", "Erreurs évitées"]),
      subdomain("communication-safety", "Communication des résultats", ["Résultats critiques", "Boucle fermée", "Incidentalomes", "Traçabilité", "Délais"]),
      subdomain("procedural-safety", "Sécurité procédurale", ["Asepsie", "Hémorragie", "Sédation comme contexte", "Matériel", "Complications"]),
    ]),
    domain("standards", "Standards et référentiels", [
      subdomain("dicom", "DICOM", ["Information objects", "Services", "Encodage", "DICOMweb", "Conformance", "Sécurité"]),
      subdomain("ihe", "IHE Radiology", ["Profils d'intégration", "Transactions", "Workflow", "Échange interentreprise", "IA et imagerie"]),
      subdomain("hl7-fhir", "HL7, CDA et FHIR", ["Ordres", "Résultats", "ImagingStudy", "DiagnosticReport", "Terminologies"]),
      subdomain("quantitative-standards", "Standards quantitatifs", ["QIBA", "Profils de biomarqueurs", "Conformité", "Métrologie", "Claims"]),
    ]),
    domain("structured-reporting", "Terminologie et rapportage structuré", [
      subdomain("terminologies", "Terminologies", ["RadLex", "SNOMED CT", "LOINC", "UCUM", "Terminologies locales"]),
      subdomain("reporting-systems", "Systèmes de rapportage", ["RADS", "Lexiques", "Catégories", "Templates", "Comparabilité"]),
      subdomain("semantic-interoperability", "Interopérabilité sémantique", ["Mapping de codes", "Identifiants", "Versionnement", "Provenance", "Ambiguïtés"]),
    ]),
    domain("regulation-accreditation", "Réglementation, accréditation et évaluation", [
      subdomain("device-regulation", "Dispositifs médicaux", ["Classification", "Évaluation clinique", "Logiciel médical", "Changement de version", "Surveillance"]),
      subdomain("accreditation", "Accréditation", ["Modalités", "Personnel", "Équipement", "Qualité", "Audit documentaire"]),
      subdomain("ai-regulation", "Régulation de l'IA", ["Intended use", "Validation", "Dérive", "Transparence", "Surveillance"]),
    ]),
    domain("privacy-security", "Confidentialité et cybersécurité", [
      subdomain("privacy", "Confidentialité", ["Données personnelles", "Dé-identification", "Consentement comme contexte", "Partage", "Traçabilité"]),
      subdomain("cybersecurity", "Cybersécurité", ["Authentification", "Chiffrement comme propriété documentée", "Journalisation", "Vulnérabilités", "Continuité"]),
      subdomain("data-integrity", "Intégrité des données", ["Authenticité", "Hash", "Version", "Correction", "Audit"]),
    ]),
    domain("sustainability", "Durabilité", [
      subdomain("energy-resources", "Énergie et ressources", ["Consommation des équipements", "Hélium", "Refroidissement", "Cycle de vie", "Mesure environnementale"]),
      subdomain("contrast-waste", "Contraste et déchets", ["Volumes inutilisés", "Rejets", "Matériaux", "Réutilisation", "Pratiques documentées"]),
      subdomain("workflow-footprint", "Empreinte des workflows", ["Déplacements", "Stockage", "Calcul", "Téléradiologie", "Optimisation"]),
    ], { priority: "SECONDARY" }),
  ], { priority: "FOUNDATION", projectionTypes: commonProjectionSets.technical }),

  territory("informatics-workflows", "Informatique d'imagerie et workflows documentaires", [
    domain("image-formats", "Formats et objets d'imagerie", [
      subdomain("dicom-objects", "Objets DICOM", ["Images", "Segmentation", "Structured reports", "Parametric maps", "Presentation states"]),
      subdomain("research-formats", "Formats de recherche", ["NIfTI", "BIDS", "NRRD", "Formats tabulaires", "Conversion et perte d'information"]),
      subdomain("multimedia", "Multimédia clinique", ["Images encapsulées", "Vidéo", "Photographie médicale", "Waveforms", "Documents liés"]),
    ]),
    domain("interoperability-workflows", "Interopérabilité et profils de workflow", [
      subdomain("orders-scheduling", "Demande et planification documentaires", ["Ordre", "Protocole demandé", "Identité", "Rendez-vous comme concept", "États documentés"]),
      subdomain("acquisition-workflow", "Workflow d'acquisition documentaire", ["Worklist", "Performed procedure step", "Stockage", "Réconciliation", "Gestion des changements"]),
      subdomain("report-distribution", "Rapport et distribution", ["Rapport diagnostique", "Résultats", "Notification", "Partage interentreprise", "Accès web"]),
      subdomain("ai-workflow", "Workflow IA documentaire", ["Entrée", "Orchestration comme concept", "Résultat IA", "Évaluation", "Retour au lecteur"]),
    ]),
    domain("pacs-vna-archives", "PACS, VNA et archives comme sujets documentaires", [
      subdomain("archive-architecture", "Architecture d'archive", ["PACS", "VNA", "Hiérarchie de stockage", "Migration", "Cycle de vie"]),
      subdomain("retrieval", "Recherche et récupération", ["Query-retrieve", "DICOMweb", "Priors", "Federation", "Cache"]),
      subdomain("data-lifecycle", "Cycle de vie des données", ["Création", "Correction", "Rejet", "Rétention", "Traçabilité"]),
    ]),
    domain("viewers-visualization", "Viewers et visualisation comme sujets documentaires", [
      subdomain("diagnostic-viewing", "Visualisation diagnostique", ["Affichage", "Calibration", "Navigation", "Comparaison", "Priors"]),
      subdomain("advanced-visualization", "Visualisation avancée", ["MPR", "MIP", "3D", "Fusion", "Cartes quantitatives"]),
      subdomain("web-mobile-viewing", "Visualisation web et mobile", ["Streaming", "DICOMweb", "Compression", "Latence", "Limites d'affichage"]),
    ]),
    domain("structured-reporting-informatics", "Rapportage structuré", [
      subdomain("templates", "Templates", ["Sections", "Champs", "Mesures", "Terminologie", "Versionnement"]),
      subdomain("data-extraction", "Extraction de données", ["Structuré", "NLP", "Codage", "Qualité", "Provenance"]),
      subdomain("multimedia-report", "Rapport multimédia", ["Key images", "Mesures liées", "Hyperliens", "Graphiques", "Interopérabilité"]),
    ]),
    domain("protocol-management-documentary", "Gestion documentaire des protocoles", [
      subdomain("protocol-definition", "Définition de protocole", ["Objectif", "Séquences ou séries", "Paramètres", "Contraste", "Population"]),
      subdomain("protocol-versioning", "Versionnement", ["Identité stable", "Révision", "Constructeur", "Site", "Historique"]),
      subdomain("protocol-comparison", "Comparaison de protocoles", ["Variantes", "Paramètres", "Qualité", "Dose", "Compatibilité documentaire"]),
    ]),
    domain("core-lab-documentary", "Core Lab documentaire", [
      subdomain("core-lab-methods", "Méthodes Core Lab", ["Charte", "Mesures", "Lectures", "Adjudication décrite", "Contrôle qualité documenté"]),
      subdomain("multicenter-organization", "Organisation multicentrique", ["Centres", "Modalités", "Harmonisation", "Formation", "Provenance"]),
      subdomain("reading-design", "Plans de lecture", ["Lecteur", "Aveugle", "Répétition", "Consensus", "Statistiques d'accord"]),
    ]),
    domain("teleradiology-collaboration", "Téléradiologie et collaboration", [
      subdomain("remote-reading", "Lecture distante", ["Transfert", "Priors", "Rapport", "Communication", "Qualité"]),
      subdomain("collaboration", "Collaboration", ["Réunion multidisciplinaire", "Annotation partagée", "Second avis", "Enseignement", "Provenance"]),
      subdomain("cross-enterprise", "Échange interentreprise", ["Identité", "Découverte", "Consentement comme contexte", "Accès", "Audit"]),
    ]),
    domain("research-data-informatics", "Informatique des données de recherche", [
      subdomain("research-repositories", "Dépôts de recherche", ["Cohortes publiées", "Métadonnées", "Formats", "Version", "Accès"]),
      subdomain("provenance-reproducibility", "Provenance et reproductibilité", ["Pipeline", "Paramètres", "Environnement", "Digest", "Rejeu"]),
      subdomain("federated-analysis", "Analyse distribuée documentaire", ["Fédération", "Apprentissage fédéré comme méthode", "Sécurité", "Hétérogénéité", "Validation"]),
    ]),
    domain("terminology-knowledge-representation", "Terminologie et représentation des connaissances", [
      subdomain("coding-systems", "Systèmes de codage", ["RadLex", "SNOMED CT", "LOINC", "UCUM", "Mappings"]),
      subdomain("ontologies", "Ontologies", ["Concept", "Relation", "Identité", "Version", "Alignement"]),
      subdomain("knowledge-graphs", "Knowledge Graphs", ["Entités", "Assertions", "Provenance", "Contradictions", "Requêtes"]),
    ]),
  ], { priority: "FOUNDATION", projectionTypes: commonProjectionSets.workflow }),

  territory("interventional-imaging", "Radiologie interventionnelle et guidage par l'image", [
    domain("vascular-intervention", "Interventions vasculaires", [
      subdomain("angiography-intervention", "Angiographie interventionnelle", ["Accès", "Roadmap", "Soustraction", "Mesures vasculaires", "Dose"]),
      subdomain("embolization", "Embolisation", ["Cibles", "Agents emboliques", "Guidage", "Évaluation du résultat", "Complications"]),
      subdomain("revascularization", "Revascularisation", ["Angioplastie", "Stent", "Thrombectomie", "Contrôle de flux", "Suivi"]),
      subdomain("endovascular-aortic", "Aorte endovasculaire", ["Planification", "Endoprothèse", "Fusion", "Endofuite", "Surveillance"]),
    ]),
    domain("neurointervention", "Neuroradiologie interventionnelle", [
      subdomain("stroke-intervention", "Intervention AVC", ["Sélection par l'image", "Thrombectomie", "Perfusion", "Recanalisation", "Complications"]),
      subdomain("aneurysm-avm", "Anévrisme et malformation", ["Morphologie", "Embolisation", "Stents et flow diverters", "Contrôle angiographique", "Suivi"]),
      subdomain("spinal-intervention", "Intervention neurospinale", ["Malformations", "Embolisation", "Guidage", "Risques", "Suivi"]),
    ]),
    domain("nonvascular-intervention", "Interventions non vasculaires", [
      subdomain("biopsy", "Biopsie", ["Ciblage", "Guidage CT", "Guidage échographique", "Guidage IRM", "Contrôle de prélèvement"]),
      subdomain("drainage", "Drainage", ["Collection", "Voie d'abord", "Guidage", "Cathéter", "Suivi"]),
      subdomain("access-stenting", "Accès et stenting non vasculaire", ["Biliaire", "Urinaire", "Digestif", "Respiratoire", "Contrôle"]),
    ]),
    domain("interventional-oncology", "Oncologie interventionnelle", [
      subdomain("ablation", "Ablation", ["Radiofréquence", "Micro-ondes", "Cryoablation", "IRE", "Thermométrie et marges"]),
      subdomain("intraarterial-therapy", "Traitements intra-artériels", ["Chimioembolisation", "Radioembolisation", "Perfusion", "Dosimétrie", "Réponse"]),
      subdomain("image-guided-delivery", "Administration guidée", ["Ciblage", "Navigation", "Distribution", "Contrôle immédiat", "Suivi"]),
    ]),
    domain("musculoskeletal-intervention", "Intervention musculosquelettique", [
      subdomain("spine-procedures", "Gestes rachidiens", ["Infiltration", "Vertébroplastie", "Biopsie", "Ablation", "Guidage"]),
      subdomain("joint-soft-tissue", "Articulations et tissus mous", ["Injection", "Ponction", "Biopsie", "Calcification", "Guidage échographique"]),
      subdomain("bone-intervention", "Interventions osseuses", ["Cimentoplastie", "Ablation", "Fixation", "Navigation", "Suivi"]),
    ]),
    domain("breast-interventional", "Intervention mammaire", [
      subdomain("breast-biopsy", "Biopsies", ["Échoguidée", "Stéréotaxique", "Tomosynthèse", "IRM", "Pathologie comme référence"]),
      subdomain("localization", "Repérage", ["Fil", "Grain", "Marqueur", "Guidage", "Contrôle"]),
      subdomain("breast-ablation", "Ablation mammaire", ["Techniques", "Guidage", "Sélection", "Évaluation", "Suivi"]),
    ]),
    domain("pediatric-intervention", "Intervention pédiatrique", [
      subdomain("pediatric-vascular", "Vasculaire pédiatrique", ["Malformations", "Accès", "Embolisation", "Dose", "Suivi"]),
      subdomain("pediatric-nonvascular", "Non vasculaire pédiatrique", ["Drainage", "Biopsie", "Gastrostomie", "Guidage", "Sécurité"]),
    ]),
    domain("image-guidance-navigation", "Guidage, fusion et navigation", [
      subdomain("fusion-guidance", "Fusion", ["CT-échographie", "IRM-échographie", "PET-CT", "Recalage", "Erreur de ciblage"]),
      subdomain("navigation", "Navigation", ["Optique", "Électromagnétique", "Robotique", "Réalité augmentée", "Validation géométrique"]),
      subdomain("intra-procedural-imaging", "Imagerie per-procédurale", ["CBCT", "Échographie", "CT", "IRM", "Contrôle immédiat"]),
    ]),
    domain("peri-procedural", "Évaluation péri-procédurale", [
      subdomain("planning", "Planification", ["Anatomie", "Cible", "Voie", "Risque", "Matériel documentaire"]),
      subdomain("endpoints", "Résultats techniques", ["Succès technique", "Couverture", "Flux", "Complication", "Reintervention"]),
      subdomain("follow-up", "Suivi", ["Imagerie précoce", "Réponse", "Récidive", "Perméabilité", "Complications tardives"]),
    ]),
  ], { priority: "SECONDARY", projectionTypes: commonProjectionSets.clinical }),

  territory("research-evidence", "Recherche, preuves, éducation et services", [
    domain("study-design", "Plans d'étude et méthodologie", [
      subdomain("observational", "Études observationnelles", ["Transversale", "Cohorte", "Cas-témoins", "Rétrospective et prospective", "Biais"]),
      subdomain("diagnostic-accuracy", "Précision diagnostique", ["Standard de référence", "Sensibilité et spécificité", "ROC", "Biais de vérification", "Applicabilité"]),
      subdomain("interventional-trials", "Essais et études interventionnelles", ["Randomisation", "Comparateur", "Endpoints", "Aveugle", "Rapportage"]),
      subdomain("prediction-models", "Modèles prédictifs", ["Développement", "Validation", "Calibration", "Utilité", "Mise à jour"]),
    ]),
    domain("evidence-synthesis", "Synthèse des preuves", [
      subdomain("systematic-review", "Revue systématique", ["Question", "Recherche", "Sélection", "Extraction", "Risque de biais"]),
      subdomain("meta-analysis", "Méta-analyse", ["Effets compatibles", "Variance", "Hétérogénéité", "Biais de publication", "Applicabilité"]),
      subdomain("structured-synthesis", "Synthèse structurée", ["Assertions", "Convergence", "Contradictions", "Contextes", "Lacunes"]),
      subdomain("living-evidence", "Preuve vivante", ["Surveillance", "Mise à jour", "Version", "Correction", "Position dépassée"]),
    ]),
    domain("guidelines-consensus", "Recommandations, consensus et standards de pratique", [
      subdomain("guideline-development", "Développement", ["Émetteur", "Méthode", "Population", "Grade", "Date"]),
      subdomain("consensus", "Consensus", ["Consensus officiel", "Convergence", "Divergence", "Position historique", "Mise à jour"]),
      subdomain("appropriateness-guidance", "Pertinence", ["Scénario", "Modalité", "Bénéfice-risque", "Ressources", "Limites"]),
    ]),
    domain("quantitative-biomarker-qualification", "Qualification des biomarqueurs", [
      subdomain("technical-performance", "Performance technique", ["Précision", "Répétabilité", "Reproductibilité", "Sensibilité au changement", "Limites"]),
      subdomain("biological-validation", "Validation biologique", ["Plausibilité", "Référence", "Corrélation", "Spécificité", "Confondants"]),
      subdomain("clinical-validation", "Validation clinique", ["Diagnostic", "Pronostic", "Prédictif", "Surrogacy", "Généralisation"]),
    ]),
    domain("multicenter-core-lab", "Recherche multicentrique et Core Lab documentaire", [
      subdomain("site-harmonization", "Harmonisation des sites", ["Protocoles", "Fantômes", "Formation", "Scanner", "Contrôle"]),
      subdomain("central-reading", "Lecture centralisée", ["Lecteurs", "Aveugle", "Consensus", "Adjudication décrite", "Accord"]),
      subdomain("data-provenance", "Provenance", ["Centre", "Acquisition", "Révision", "Extraction", "Décision"]),
    ]),
    domain("publication-lifecycle", "Cycle de vie documentaire", [
      subdomain("source-identity", "Identité des sources", ["DOI", "PMID", "Version", "Localisateur", "Digest"]),
      subdomain("corrections-retractions", "Corrections et rétractations", ["Erratum", "Correction", "Expression of concern", "Rétractation", "Remplacement"]),
      subdomain("evidence-links", "Liens de preuve", ["Support", "Réfutation", "Qualification", "Mention", "Dérivation"]),
    ]),
    domain("open-science-reproducibility", "Science ouverte et reproductibilité", [
      subdomain("reporting", "Rapportage", ["Protocoles", "Checklists", "Données", "Code", "Limites"]),
      subdomain("replication", "Réplication", ["Reproduction", "Réutilisation", "Validation externe", "Résultats négatifs", "Divergence"]),
      subdomain("research-software", "Logiciels de recherche", ["Version", "Environnement", "Conteneur", "Tests", "Provenance"]),
    ]),
    domain("education-training", "Éducation et formation", [
      subdomain("foundational-education", "Fondamentaux", ["Anatomie", "Physique", "Modalités", "Sécurité", "Interprétation"]),
      subdomain("subspecialty-training", "Sous-spécialisation", ["Neuro", "Cardiaque", "Thorax", "Abdomen", "Interventionnel", "Informatique"]),
      subdomain("technical-training", "Formation technique", ["Protocoles", "Post-traitement", "Qualité", "Standards", "Quantification"]),
      subdomain("assessment", "Évaluation pédagogique", ["Compétences", "Cas", "Simulation", "Feedback", "Mise à jour"]),
    ]),
    domain("health-services", "Services, accès et organisation documentaire", [
      subdomain("access-equity", "Accès et équité", ["Disponibilité", "Délais", "Géographie", "Population", "Inégalités"]),
      subdomain("value-utilization", "Valeur et utilisation", ["Pertinence", "Rendement", "Répétition", "Coûts comme contexte", "Résultats"]),
      subdomain("communication", "Communication", ["Demande", "Rapport", "Résultat critique", "Patient", "Équipe multidisciplinaire"]),
    ]),
    domain("ethics-society", "Éthique et société", [
      subdomain("consent-autonomy", "Consentement et autonomie", ["Information", "Consentement comme contexte", "Découverte fortuite", "Données", "Recherche"]),
      subdomain("ai-ethics", "Éthique de l'IA", ["Biais", "Transparence", "Responsabilité", "Supervision humaine", "Équité"]),
      subdomain("resource-allocation", "Allocation des ressources", ["Priorisation documentaire", "Accès", "Durabilité", "Innovation", "Bénéfice-risque"]),
    ]),
    domain("history-future", "Histoire et prospective", [
      subdomain("historical-evolution", "Évolution historique", ["Découverte des modalités", "Évolution des séquences", "Évolution des détecteurs", "Évolution des standards", "Positions dépassées"]),
      subdomain("technology-horizon", "Horizon technologique", ["Technologies émergentes", "Niveaux de maturité", "Preuves manquantes", "Adoption", "Questions ouvertes"]),
      subdomain("future-practice", "Futurs usages", ["Imagerie quantitative", "IA", "Imagerie portable", "Personnalisation", "Interopérabilité"]),
    ]),
  ], { priority: "PRIMARY", projectionTypes: commonProjectionSets.evidence }),
]);

const nodeId = (...parts) => `${SCIENTIFIC_TERRITORY_NAMESPACE}:${parts.join(":")}`;

export const territoryCrossMemberships = freeze([
  freeze({ sourceId: nodeId("measurements-biomarkers", "domain", "relaxation-mapping", "subdomain", "extracellular-space"), targetIds: freeze([nodeId("modalities-acquisition", "domain", "magnetic-resonance"), nodeId("anatomy-specialties", "domain", "cardiac-vascular")]), reason: "ECV and partition measurements cross modality, cardiac tissue characterization and quantitative measurement axes." }),
  freeze({ sourceId: nodeId("measurements-biomarkers", "domain", "diffusion-metrics"), targetIds: freeze([nodeId("modalities-acquisition", "domain", "magnetic-resonance"), nodeId("anatomy-specialties", "domain", "neuroradiology")]), reason: "Diffusion measurements are modality-independent concepts frequently instantiated in neuroradiology." }),
  freeze({ sourceId: nodeId("measurements-biomarkers", "domain", "perfusion-hemodynamics"), targetIds: freeze([nodeId("modalities-acquisition", "domain", "computed-tomography"), nodeId("modalities-acquisition", "domain", "magnetic-resonance"), nodeId("anatomy-specialties", "domain", "neuroradiology")]), reason: "Perfusion spans CT, MRI, organs and clinical applications." }),
  freeze({ sourceId: nodeId("measurements-biomarkers", "domain", "oxygenation-metabolism"), targetIds: freeze([nodeId("modalities-acquisition", "domain", "magnetic-resonance"), nodeId("modalities-acquisition", "domain", "nuclear-medicine-modalities"), nodeId("anatomy-specialties", "domain", "neuroradiology")]), reason: "Oxygenation and metabolism are cross-modality quantitative domains." }),
  freeze({ sourceId: nodeId("computational-imaging", "domain", "registration"), targetIds: freeze([nodeId("modalities-acquisition", "domain", "hybrid-multimodal"), nodeId("informatics-workflows", "domain", "viewers-visualization")]), reason: "Registration supports multimodal fusion and visualization." }),
  freeze({ sourceId: nodeId("computational-imaging", "domain", "segmentation"), targetIds: freeze([nodeId("measurements-biomarkers", "domain", "morphology-volumetry"), nodeId("research-evidence", "domain", "quantitative-biomarker-qualification")]), reason: "Segmentation is both a computational method and a prerequisite for quantitative endpoints." }),
  freeze({ sourceId: nodeId("quality-safety", "domain", "standards"), targetIds: freeze([nodeId("informatics-workflows", "domain", "interoperability-workflows"), nodeId("research-evidence", "domain", "quantitative-biomarker-qualification")]), reason: "Standards cross interoperability and quantitative qualification." }),
  freeze({ sourceId: nodeId("interventional-imaging", "domain", "image-guidance-navigation"), targetIds: freeze([nodeId("computational-imaging", "domain", "registration"), nodeId("modalities-acquisition", "domain", "hybrid-multimodal")]), reason: "Guidance relies on registration and multimodal imaging without becoming an operational workflow engine." }),
  freeze({ sourceId: nodeId("research-evidence", "domain", "publication-lifecycle"), targetIds: freeze([nodeId("informatics-workflows", "domain", "terminology-knowledge-representation"), nodeId("quality-safety", "domain", "structured-reporting")]), reason: "Provenance and lifecycle apply across knowledge representation and documentary quality." }),
]);

export const taxonomyNodeId = nodeId;
