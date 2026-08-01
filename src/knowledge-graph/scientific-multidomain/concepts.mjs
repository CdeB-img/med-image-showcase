import { sha256Digest } from "../migration/stable-json.mjs";
import { sourceByPmid } from "./sources.mjs";

const definitions = [
  // Diffusion / ADC
  ["diffusion-adc", "diffusion", "Diffusion moléculaire", ["PhysicalPhenomenon"], "Mouvement microscopique des molécules auquel l'imagerie pondérée en diffusion est sensible.", "26892827", ["molecular diffusion"]],
  ["diffusion-adc", "dwi", "Imagerie pondérée en diffusion", ["AcquisitionMethod"], "Acquisition IRM produisant un contraste dépendant de la pondération en diffusion.", "26892827", ["DWI", "diffusion-weighted imaging"]],
  ["diffusion-adc", "diffusion-weighting", "Pondération en diffusion", ["AcquisitionParameter"], "Degré de sensibilisation d'une acquisition au phénomène de diffusion.", "26892827", ["diffusion weighting"]],
  ["diffusion-adc", "b-value", "Valeur b", ["AcquisitionParameter", "Quantity"], "Paramètre décrivant la pondération en diffusion d'une acquisition.", "39377680", ["b value", "b-value"]],
  ["diffusion-adc", "adc-map", "Carte ADC", ["ParametricMap", "ReconstructionOutput"], "Carte calculée de coefficient apparent de diffusion.", "39377680", ["ADC map"]],
  ["diffusion-adc", "adc-value", "Valeur ADC", ["DerivedMeasurement", "Biomarker"], "Mesure dérivée du coefficient apparent de diffusion dans un contexte d'acquisition et de calcul défini.", "39377680", ["apparent diffusion coefficient", "ADC"]],
  ["diffusion-adc", "monoexponential-adc", "Calcul ADC mono-exponentiel", ["MeasurementMethod"], "Méthode de dérivation d'ADC reposant sur un modèle mono-exponentiel et des valeurs b spécifiées.", "26892827", ["monoexponential ADC"]],
  ["diffusion-adc", "diffusion-restriction", "Restriction de diffusion", ["Finding"], "Interprétation d'un signal DWI et d'une carte ADC, distincte de la valeur ADC elle-même.", "33836457", ["restricted diffusion"]],
  ["diffusion-adc", "qiba-adc-profile", "Profil QIBA ADC", ["Standard", "QualityFramework"], "Profil documentaire QIBA consacré à l'ADC comme biomarqueur quantitatif.", "39377680", ["QIBA ADC Profile"]],
  ["diffusion-adc", "diffusion-phantom", "Fantôme de diffusion", ["QualityControlObject"], "Objet de référence utilisé pour évaluer la performance métrologique de mesures ADC.", "23023785", ["diffusion phantom"]],
  ["diffusion-adc", "gradient-nonlinearity", "Non-linéarité des gradients", ["Limitation"], "Source documentée de variation spatiale de l'ADC mesuré hors isocentre.", "23023785", ["gradient nonlinearity"]],
  ["diffusion-adc", "low-b-perfusion", "Contribution de perfusion aux faibles valeurs b", ["Confounder"], "Composante de signal susceptible d'influencer une estimation de diffusion lorsque les faibles valeurs b sont incluses.", "26892827", ["low-b perfusion contribution"]],
  ["diffusion-adc", "adc-repeatability", "Répétabilité ADC", ["QualityMetric"], "Variation d'une mesure ADC sous des conditions répétées définies.", "23023785", ["ADC repeatability"]],
  ["diffusion-adc", "adc-reproducibility", "Reproductibilité ADC", ["QualityMetric"], "Variation d'une mesure ADC lorsque des conditions telles que site, scanner ou analyse changent.", "25802212", ["ADC reproducibility"]],
  ["diffusion-adc", "acute-ischemic-stroke", "Accident vasculaire cérébral ischémique aigu", ["Disease"], "Contexte clinique dans lequel la DWI et l'ADC sont étudiés, avec des limites d'interprétation documentées.", "33836457", ["acute ischemic stroke"]],

  // Cerebral perfusion
  ["cerebral-perfusion", "ct-perfusion", "Perfusion cérébrale CT", ["AcquisitionMethod"], "Acquisition dynamique CT après bolus destinée à produire des informations de perfusion cérébrale.", "30346227", ["CT perfusion", "CTP"]],
  ["cerebral-perfusion", "mr-dsc-perfusion", "Perfusion IRM DSC", ["AcquisitionMethod"], "Méthode de perfusion IRM dynamique de susceptibilité après passage d'un bolus.", "25907520", ["DSC MRI perfusion"]],
  ["cerebral-perfusion", "contrast-bolus", "Bolus de contraste", ["AcquisitionInput"], "Administration dynamique dont l'arrivée et la durée influencent l'analyse de perfusion.", "21640299", ["contrast bolus"]],
  ["cerebral-perfusion", "arterial-input-function", "Fonction d'entrée artérielle", ["ModelInput", "MeasurementMethodComponent"], "Courbe artérielle utilisée dans les méthodes de déconvolution de perfusion.", "21640299", ["arterial input function", "AIF"]],
  ["cerebral-perfusion", "deconvolution", "Déconvolution de perfusion", ["ReconstructionMethod", "MeasurementMethod"], "Traitement mathématique reliant une courbe tissulaire à une fonction d'entrée pour estimer des paramètres de perfusion.", "21640299", ["perfusion deconvolution"]],
  ["cerebral-perfusion", "residue-function", "Fonction résidu", ["ModelComponent"], "Fonction issue de la déconvolution dont l'amplitude et la temporalité sont utilisées pour certains paramètres.", "21640299", ["residue function"]],
  ["cerebral-perfusion", "cbf", "Débit sanguin cérébral", ["DerivedMeasurement", "Biomarker"], "Estimation quantitative du débit sanguin cérébral dans un contexte de méthode défini.", "21640299", ["cerebral blood flow", "CBF"]],
  ["cerebral-perfusion", "cbv", "Volume sanguin cérébral", ["DerivedMeasurement", "Biomarker"], "Estimation quantitative du volume sanguin cérébral dans un contexte de méthode défini.", "21640299", ["cerebral blood volume", "CBV"]],
  ["cerebral-perfusion", "mtt", "Temps de transit moyen", ["DerivedMeasurement"], "Paramètre temporel de perfusion dont le calcul dépend du modèle et de l'algorithme.", "21640299", ["mean transit time", "MTT"]],
  ["cerebral-perfusion", "tmax", "Tmax", ["DerivedMeasurement"], "Temps jusqu'au maximum de la fonction résidu déconvoluée, distinct du CBF.", "21640299", ["time to maximum of the residue function"]],
  ["cerebral-perfusion", "perfusion-parametric-map", "Carte paramétrique de perfusion", ["ParametricMap", "ReconstructionOutput"], "Représentation spatiale d'un paramètre de perfusion calculé.", "30346227", ["perfusion map"]],
  ["cerebral-perfusion", "ischemic-core-segmentation", "Segmentation de core ischémique", ["Finding", "DerivedSegmentation"], "Volume lésionnel dérivé de règles logicielles, distinct d'une carte paramétrique brute.", "30346227", ["ischemic core"]],
  ["cerebral-perfusion", "penumbra-segmentation", "Segmentation de pénombre", ["Finding", "DerivedSegmentation"], "Volume hypoperfusé potentiellement distinct du core selon des règles et seuils contextualisés.", "30346227", ["penumbra", "perfusion lesion"]],
  ["cerebral-perfusion", "lesion-volume", "Volume lésionnel de perfusion", ["DerivedMeasurement", "Endpoint"], "Volume calculé à partir d'une segmentation de perfusion et d'un logiciel donné.", "37021148", ["perfusion lesion volume"]],
  ["cerebral-perfusion", "perfusion-software", "Logiciel de post-traitement de perfusion", ["SoftwareMethod", "ReconstructionMethod"], "Implémentation logicielle susceptible d'affecter cartes, seuils et volumes dérivés.", "31203208", ["perfusion post-processing software"]],

  // Myocardial tissue characterization
  ["myocardial-tissue-characterization", "lge-acquisition", "Acquisition de rehaussement tardif", ["AcquisitionMethod"], "Acquisition post-contraste pondérée pour mettre en évidence des différences de rétention et de lavage du gadolinium.", "30231886", ["late gadolinium enhancement acquisition", "LGE acquisition"]],
  ["myocardial-tissue-characterization", "inversion-recovery", "Inversion-récupération", ["SequenceFamily"], "Famille de séquences utilisée pour annuler un signal tissulaire dans l'imagerie LGE.", "30231886", ["inversion recovery", "IR"]],
  ["myocardial-tissue-characterization", "psir", "PSIR", ["ReconstructionMethod", "Sequence"], "Méthode sensible à la phase utilisée pour la reconstruction ou l'acquisition LGE.", "30231886", ["phase-sensitive inversion recovery"]],
  ["myocardial-tissue-characterization", "myocardial-nulling", "Annulation myocardique", ["AcquisitionCondition"], "Réglage de l'inversion visant à supprimer le signal du myocarde de référence.", "30231886", ["myocardial nulling"]],
  ["myocardial-tissue-characterization", "gadolinium-contrast", "Contraste gadoliné", ["ContrastAgentClass"], "Agent paramagnétique utilisé dans les acquisitions LGE documentées.", "30231886", ["gadolinium-based contrast"]],
  ["myocardial-tissue-characterization", "lge-finding", "Rehaussement tardif myocardique", ["Finding", "Biomarker"], "Finding tissulaire observé sur une acquisition LGE, distinct de la méthode d'acquisition.", "30231886", ["late gadolinium enhancement", "LGE"]],
  ["myocardial-tissue-characterization", "lge-pattern", "Motif de rehaussement tardif", ["Finding"], "Distribution morphologique du LGE utilisée comme information de caractérisation tissulaire.", "30231886", ["LGE pattern"]],
  ["myocardial-tissue-characterization", "lge-quantification", "Quantification du LGE", ["MeasurementMethod"], "Délimitation de l'étendue du LGE selon une méthode explicite telle qu'un seuil ou FWHM.", "21329899", ["LGE quantification"]],
  ["myocardial-tissue-characterization", "microvascular-obstruction", "Obstruction microvasculaire", ["Finding", "Biomarker", "Endpoint"], "Zone de non-reflow myocardique après infarctus, pouvant apparaître comme un noyau non rehaussé dans une zone lésée.", "23021401", ["microvascular obstruction", "MVO"]],
  ["myocardial-tissue-characterization", "intramyocardial-hemorrhage", "Hémorragie intramyocardique", ["Finding", "Biomarker", "Endpoint"], "Finding post-infarctus lié à la présence de produits sanguins dans le myocarde lésé.", "23021401", ["intramyocardial hemorrhage", "IMH"]],
  ["myocardial-tissue-characterization", "t2-star", "T2* myocardique", ["MeasurementMethod", "DerivedMeasurement"], "Mesure sensible aux effets de susceptibilité associés aux produits sanguins.", "25759823", ["T2*"]],
  ["myocardial-tissue-characterization", "t2-weighted-iron-sensitive", "Séquence T2 sensible aux produits sanguins", ["SequenceFamily"], "Acquisition T2 ou apparentée utilisée dans la documentation de l'hémorragie intramyocardique.", "23021401", ["T2-weighted iron-sensitive imaging"]],
  ["myocardial-tissue-characterization", "myocardial-infarction", "Infarctus du myocarde", ["Disease"], "Contexte pathologique principal des observations MVO et hémorragie intramyocardique retenues.", "29712696", ["myocardial infarction"]],
  ["myocardial-tissue-characterization", "myocarditis", "Myocardite", ["Disease"], "Contexte pathologique dans lequel différentes méthodes de quantification du LGE ont été comparées.", "30813942", ["myocarditis"]],
  ["myocardial-tissue-characterization", "dark-blood-lge", "LGE sang noir", ["AcquisitionMethod", "ReconstructionMethod"], "Approche LGE visant à réduire le signal sanguin pour améliorer le contraste entre cicatrice et cavité.", "29162123", ["dark-blood LGE"]],

  // Spectral CT
  ["spectral-ct", "spectral-ct", "CT spectral", ["Technology", "ModalityExtension"], "Famille d'approches CT acquérant ou discriminant des informations dépendantes de l'énergie.", "36828369", ["spectral CT"]],
  ["spectral-ct", "dual-energy-ct", "CT double énergie", ["Technology", "AcquisitionMethod"], "Imagerie CT exploitant deux spectres énergétiques pour permettre des reconstructions spectrales.", "36828369", ["dual-energy CT", "DECT"]],
  ["spectral-ct", "dual-source-de", "Double énergie bi-source", ["TechnologyImplementation"], "Implémentation double énergie utilisant deux chaînes tube-détecteur.", "36828369", ["dual-source dual-energy CT"]],
  ["spectral-ct", "rapid-kvp-switching", "Commutation rapide de kVp", ["TechnologyImplementation"], "Implémentation séquentielle rapide alternant les tensions du tube pendant l'acquisition.", "36828369", ["rapid kVp switching"]],
  ["spectral-ct", "dual-layer-detector", "Détecteur double couche", ["TechnologyImplementation"], "Implémentation séparant l'information énergétique dans deux couches détectrices.", "28168368", ["dual-layer detector"]],
  ["spectral-ct", "split-filter", "Filtre divisé", ["TechnologyImplementation"], "Implémentation créant deux spectres au moyen d'un filtre partagé.", "36828369", ["split-filter dual energy"]],
  ["spectral-ct", "sequential-dual-energy", "Double énergie séquentielle", ["TechnologyImplementation"], "Acquisitions successives à des réglages énergétiques différents.", "36828369", ["sequential dual energy"]],
  ["spectral-ct", "photon-counting-ct", "CT à comptage photonique", ["Technology", "DetectorTechnology"], "Technologie de détection directe comptant les photons et discriminant leur énergie, distincte des implémentations DECT conventionnelles.", "36047540", ["photon-counting detector CT", "PCCT"]],
  ["spectral-ct", "material-decomposition", "Décomposition de matériaux", ["ReconstructionMethod"], "Reconstruction séparant des composantes selon des bases de matériaux choisies.", "33411614", ["material decomposition"]],
  ["spectral-ct", "iodine-map", "Carte d'iode", ["ParametricMap", "ReconstructionOutput"], "Carte issue d'une décomposition de matériaux représentant la distribution estimée d'iode.", "33411614", ["iodine map"]],
  ["spectral-ct", "iodine-concentration", "Concentration iodée", ["DerivedMeasurement", "Biomarker"], "Quantification de l'iode dérivée d'une reconstruction spectrale et dépendante de la plateforme et du contexte.", "28168368", ["iodine concentration"]],
  ["spectral-ct", "virtual-monoenergetic-image", "Image monoénergétique virtuelle", ["ReconstructionOutput"], "Image reconstruite pour représenter une énergie monoénergétique virtuelle spécifiée.", "30919651", ["virtual monoenergetic image", "VMI"]],
  ["spectral-ct", "virtual-non-contrast", "Image virtuelle sans contraste", ["ReconstructionOutput"], "Image reconstruite après soustraction estimée de la composante iodée, distincte d'une acquisition sans contraste réelle.", "33411614", ["virtual non-contrast", "VNC"]],
  ["spectral-ct", "effective-atomic-number", "Numéro atomique effectif", ["DerivedMeasurement", "ParametricMap"], "Sortie spectrale estimant un numéro atomique effectif selon une implémentation donnée.", "33411614", ["effective atomic number", "Z-effective"]],
  ["spectral-ct", "spectral-calibration", "Calibration spectrale", ["QualityMethod"], "Procédure de caractérisation ou d'ajustement nécessaire à une quantification spectrale contextualisée.", "34668387", ["spectral calibration"]],
];

const createConcept = ([domainId, key, preferredLabel, roles, description, pmid, aliases]) => {
  const source = sourceByPmid[pmid];
  if (!source) throw new Error(`Unknown source PMID ${pmid} for concept ${key}`);
  const stableId = `noxia:radiology:scientific-concept:${domainId}:${key}`;
  const revisionId = `${stableId}:revision:1`;
  const material = { domainId, key, preferredLabel, roles, description, sourceRevisionId: source.revisionId };
  return Object.freeze({
    stableId,
    revisionId,
    revisionNumber: 1,
    domainId,
    key,
    ontologicalClass: roles[0],
    roles: Object.freeze(roles),
    preferredLabel,
    designations: Object.freeze([{ language: "fr", value: preferredLabel, preferred: true }, ...aliases.map((value) => ({ language: "en", value, preferred: false }))]),
    description,
    sourceRefs: Object.freeze([source.revisionId]),
    status: "DOCUMENTED_INTERNAL_CONCEPT",
    completenessProfile: Object.freeze({ identity: true, ontology: true, designation: true, description: true, provenance: true }),
    publicProjection: false,
    digest: sha256Digest(material),
  });
};

export const multidomainConcepts = Object.freeze(definitions.map(createConcept).sort((a, b) => a.stableId.localeCompare(b.stableId)));
export const conceptByKey = Object.freeze(Object.fromEntries(multidomainConcepts.map((concept) => [concept.key, concept])));

export const multidomainOntologicalDecisions = Object.freeze([
  { conceptKey: "adc-value", domainId: "diffusion-adc", options: ["DerivedMeasurement", "Biomarker"], decision: "MULTI_ROLE_MODEL", rationale: "ADC is a derived quantity; its biomarker role depends on the application and performance claim.", sourceRefs: [sourceByPmid["39377680"].revisionId] },
  { conceptKey: "diffusion-restriction", domainId: "diffusion-adc", options: ["Finding", "Biomarker"], decision: "FINDING_ROLE_PRESERVED", rationale: "Restriction is an interpretation of signal and ADC context, not the ADC measurement itself.", sourceRefs: [sourceByPmid["33836457"].revisionId] },
  { conceptKey: "tmax", domainId: "cerebral-perfusion", options: ["DerivedMeasurement", "PhysiologicalQuantity"], decision: "DERIVED_MEASUREMENT_ONLY", rationale: "Tmax derives from the residue function and is not a direct physiological flow measurement.", sourceRefs: [sourceByPmid["21640299"].revisionId] },
  { conceptKey: "lge-finding", domainId: "myocardial-tissue-characterization", options: ["Finding", "Biomarker", "Endpoint"], decision: "MULTI_ROLE_MODEL", rationale: "The observed LGE finding is distinct from acquisition and can play biomarker or endpoint roles only in specified contexts.", sourceRefs: [sourceByPmid["30231886"].revisionId] },
  { conceptKey: "microvascular-obstruction", domainId: "myocardial-tissue-characterization", options: ["Finding", "Biomarker", "Endpoint"], decision: "MULTI_ROLE_MODEL", rationale: "MVO is observed as a finding and may be quantified or used as an endpoint in a defined study.", sourceRefs: [sourceByPmid["30231886"].revisionId] },
  { conceptKey: "intramyocardial-hemorrhage", domainId: "myocardial-tissue-characterization", options: ["Finding", "Biomarker", "Endpoint"], decision: "MULTI_ROLE_MODEL", rationale: "IMH is not automatically a quantitative measure; its role depends on sequence and study endpoint.", sourceRefs: [sourceByPmid["23021401"].revisionId] },
  { conceptKey: "iodine-map", domainId: "spectral-ct", options: ["ParametricMap", "ReconstructionOutput", "MeasurementMethod"], decision: "OUTPUT_NOT_MEASUREMENT", rationale: "The map is a reconstruction output; iodine concentration is the separate derived measurement.", sourceRefs: [sourceByPmid["33411614"].revisionId] },
  { conceptKey: "photon-counting-ct", domainId: "spectral-ct", options: ["Technology", "Modality"], decision: "TECHNOLOGY_WITHIN_CT", rationale: "PCCT remains a CT detector technology and is not merged with all dual-energy implementations.", sourceRefs: [sourceByPmid["36047540"].revisionId] },
].map((item, index) => Object.freeze({
  decisionId: `noxia:radiology:p5:ontology-decision:${String(index + 1).padStart(2, "0")}`,
  historicalClassChanged: false,
  ...item,
})));

export const multidomainConceptSummary = Object.freeze({
  total: multidomainConcepts.length,
  byDomain: Object.freeze(Object.fromEntries([...new Set(multidomainConcepts.map((item) => item.domainId))].sort().map((domainId) => [domainId, multidomainConcepts.filter((item) => item.domainId === domainId).length]))),
  multiRole: multidomainConcepts.filter((item) => item.roles.length > 1).length,
  ontologicalDecisions: multidomainOntologicalDecisions.length,
  historicalClassificationsChanged: 0,
});

