const boundary = (id, label, status, justification, allowedAs = []) => Object.freeze({
  boundaryId: `noxia:scientific-territory:boundary:${id}`,
  label,
  status,
  justification,
  allowedAs: Object.freeze(allowedAs),
});

export const territoryBoundaryRules = Object.freeze([
  boundary("human-diagnostic-imaging", "Imagerie diagnostique humaine", "INCLUDED", "Cœur du territoire documentaire et scientifique de Noxia.", ["SCIENTIFIC_DOMAIN", "EDITORIAL_PROJECTION"]),
  boundary("image-guided-intervention", "Intervention guidée par l'image", "INCLUDED", "Incluse comme science de l'imagerie, des techniques guidées et de leurs résultats documentés.", ["SCIENTIFIC_DOMAIN", "DOCUMENTARY_WORKFLOW"]),
  boundary("nuclear-medicine-imaging", "Imagerie de médecine nucléaire", "INCLUDED", "PET, SPECT, imagerie hybride, traceurs et quantification appartiennent au territoire.", ["SCIENTIFIC_DOMAIN"]),
  boundary("medical-physics", "Physique médicale de l'imagerie", "INCLUDED", "Inclut acquisition, instrumentation, reconstruction, métrologie, dose, qualité et sécurité.", ["SCIENTIFIC_DOMAIN", "REFERENCE"]),
  boundary("imaging-informatics", "Informatique d'imagerie", "INCLUDED", "Standards, formats, interopérabilité, visualisation et workflows documentaires sont couverts.", ["DOCUMENTARY_TECHNOLOGY", "STANDARD", "WORKFLOW_CONCEPT"]),
  boundary("artificial-intelligence", "IA appliquée à l'imagerie", "INCLUDED", "Méthodes, validation, biais, reproductibilité et applications publiées sont documentables.", ["SCIENTIFIC_DOMAIN", "DOCUMENTARY_TECHNOLOGY"]),
  boundary("protocols", "Protocoles d'acquisition", "INCLUDED_DOCUMENTARY_ONLY", "Les protocoles, paramètres et variantes peuvent être décrits, jamais exécutés par cette couche.", ["PROTOCOL_CONCEPT", "DOCUMENTATION"]),
  boundary("equipment", "Équipements et constructeurs", "INCLUDED_DOCUMENTARY_ONLY", "Gamme, modèle, génération, capacité et contexte publié sont couverts sans instance installée ni licence.", ["EQUIPMENT_MODEL", "MANUFACTURER_CONTEXT"]),
  boundary("clinical-guidance", "Recommandations et consensus", "INCLUDED_DOCUMENTARY_ONLY", "Le texte, l'émetteur, la date, la population et le grade peuvent être représentés sans moteur de recommandation clinique.", ["GUIDELINE", "RECOMMENDATION_DOCUMENT"]),
  boundary("core-lab", "Core Lab", "INCLUDED_DOCUMENTARY_ONLY", "Définitions, méthodes, organisation et contrôles publiés sont couverts sans affectation ni production opérationnelle.", ["DOCUMENTARY_ORGANIZATION", "METHOD"]),
  boundary("radiation-oncology", "Radiothérapie", "ADJACENT_CONDITIONAL", "Inclure l'imagerie, le contourage, le guidage, la réponse et les interfaces dosimétriques; exclure la prescription et l'exécution thérapeutiques.", ["IMAGING_INTERFACE", "DOCUMENTARY_COMPARISON"]),
  boundary("histopathology", "Histopathologie et anatomopathologie", "ADJACENT_CONDITIONAL", "Inclure uniquement la corrélation ou la validation d'un résultat d'imagerie; ne pas construire une taxonomie diagnostique tissulaire autonome.", ["REFERENCE_STANDARD", "CORRELATION_CONTEXT"]),
  boundary("genomics", "Génomique", "ADJACENT_CONDITIONAL", "Inclure les liens radiogénomiques documentés; exclure l'interprétation génomique autonome et la médecine génomique.", ["CORRELATION_CONTEXT", "RESEARCH_AREA"]),
  boundary("microscopy", "Microscopie", "ADJACENT_CONDITIONAL", "Inclure seulement comme méthode de validation ou d'imagerie multimodale reliée à la radiologie.", ["REFERENCE_STANDARD"]),
  boundary("theranostics", "Théranostique", "ADJACENT_CONDITIONAL", "Inclure sélection par l'image, dosimétrie et suivi; exclure les schémas thérapeutiques opérationnels.", ["IMAGING_INTERFACE", "DOSIMETRY"]),
  boundary("clinical-specialties", "Cardiologie, neurologie, oncologie et autres spécialités", "ADJACENT_CONDITIONAL", "Inclure les questions, populations et résultats nécessaires à l'interprétation de l'imagerie, sans couvrir la prise en charge clinique générale.", ["CLINICAL_CONTEXT"]),
  boundary("veterinary", "Imagerie vétérinaire", "OUT_OF_SCOPE", "Le territoire cible l'imagerie médicale humaine; une extension vétérinaire nécessiterait une décision produit distincte."),
  boundary("industrial-imaging", "Imagerie industrielle et contrôle non médical", "OUT_OF_SCOPE", "Le domaine ne relève pas de la radiologie médicale humaine."),
  boundary("standalone-pathology", "Anatomopathologie autonome", "OUT_OF_SCOPE", "Absence de finalité radiologique directe hors corrélation d'imagerie."),
  boundary("standalone-genomics", "Génomique autonome", "OUT_OF_SCOPE", "Absence de finalité d'imagerie directe hors radiogénomique."),
  boundary("standalone-microscopy", "Microscopie autonome", "OUT_OF_SCOPE", "Absence de finalité radiologique directe hors validation multimodale."),
  boundary("product-pacs", "Logique PACS et viewers opérationnels", "OUT_OF_SCOPE", "La couche décrit les standards et concepts, mais ne configure ni n'exécute le produit Noxia."),
  boundary("installed-equipment", "Parc installé, licences et capacités locales", "OUT_OF_SCOPE", "Le territoire documentaire ne gère pas les installations d'un centre."),
  boundary("operational-workflows", "Workflows applicatifs et CoreLab opérationnel", "OUT_OF_SCOPE", "Aucun état applicatif, rôle, affectation, adjudication ou contrôle qualité de production."),
  boundary("internal-datasets", "Datasets internes et entraînement IA", "OUT_OF_SCOPE", "Les études et modèles publiés sont documentables; les actifs internes et l'entraînement ne relèvent pas du site."),
  boundary("clinical-recommendation-engine", "Moteur de recommandation clinique", "OUT_OF_SCOPE", "Noxia peut documenter une recommandation, jamais automatiser une décision clinique dans cette couche."),
]);

export const includedBoundaryRules = Object.freeze(territoryBoundaryRules.filter((item) => item.status.startsWith("INCLUDED")));
export const conditionalBoundaryRules = Object.freeze(territoryBoundaryRules.filter((item) => item.status === "ADJACENT_CONDITIONAL"));
export const excludedBoundaryRules = Object.freeze(territoryBoundaryRules.filter((item) => item.status === "OUT_OF_SCOPE"));

export const territoryBoundaryPolicy = Object.freeze({
  defaultDecision: "OUT_OF_SCOPE_UNTIL_EXPLICITLY_CLASSIFIED",
  conditionalContentRequiresRadiologyLink: true,
  operationalProductObjectsForbidden: true,
  scientificEvidenceCreatedHere: false,
  automaticBoundaryExpansionAllowed: false,
});
