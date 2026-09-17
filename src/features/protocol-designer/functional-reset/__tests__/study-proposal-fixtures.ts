import type { ContextualStudyProposal, StudyProposalAtom, StudyArbitration } from "@/features/scientific-thinking/contextual-study-proposal";
import type { ProductBridgeRequest } from "../../product-bridge";
import { routeProductEntry } from "../product-entry-routing";
import { buildPreProjectNavigationDecision } from "@/features/query-navigation/pre-project-navigation";

// Exact human spelling and line breaks from the mission. Controlled owner
// outputs below are LOCAL_SYNTHETIC, never a naturalness/scientific approval.
export const FIBROSIS_EXACT = "je veux créer un projet sur la fibrose normale. évaluer l'évolution de la\nfibrose en fonction de l'age en prenant plusieurs patients sains de différentes\ntranche d'age et en leur faisant passer une irm cardiaque et en évaluant l'ECV\npour chacun d'eux. C'est donc une étude sur volontaire sains sans rémunération";
export const DOMAINS = [
  { id: "FIBROSIS", text: FIBROSIS_EXACT, question: "Décrire l'association entre âge et ECV chez des volontaires sains", population: "Volontaires sains de différents âges", outcome: "ECV myocardique", exposure: "Âge", design: "Étude transversale : participants différents, une mesure par personne", timing: "Une visite de travail proposée, à confirmer", measure: "IRM cardiaque avec mesure d'ECV", practical: "Participation sans rémunération", variable: "Âge du volontaire", bias: "Biais de sélection des volontaires et de cohorte générationnelle" },
  { id: "DRUG_RCT", text: "je veux comparer un médicament A au placebo chez des adultes hypertendus, randomisé et en aveugle, avec la pression systolique à trois mois comme critère principal", question: "Comparer la pression systolique à trois mois sous A ou placebo", population: "Adultes hypertendus", outcome: "Pression systolique à trois mois", exposure: "A versus placebo", design: "Essai randomisé contrôlé en aveugle", timing: "Mesure initiale et trois mois", measure: "Mesure standardisée de pression systolique", practical: "Organisation et sécurité de l'essai à instruire", variable: "Pression systolique initiale", bias: "Adhérence et rupture de l'aveugle" },
  { id: "OBS_NON_IMAGING", text: "je veux suivre des travailleurs de nuit et de jour pendant un an pour comparer les absences au travail à partir des registres, sans intervention", question: "Associer horaires de travail et absences enregistrées", population: "Travailleurs de nuit et de jour", outcome: "Absences enregistrées", exposure: "Horaires nuit/jour", design: "Cohorte observationnelle sans intervention", timing: "Registres sur un an", measure: "Ascertainment des absences dans les registres", practical: "Accès aux registres à organiser", variable: "Ancienneté professionnelle", bias: "Confusion par métier et sélection des horaires" },
  { id: "NEUROIMAGING", text: "je veux comparer la perfusion cérébrale en ASL entre adultes avec migraine et témoins sans migraine, une IRM par sujet en dehors des crises", question: "Comparer la perfusion cérébrale hors crise", population: "Adultes migraineux et témoins sans migraine", outcome: "Perfusion cérébrale ASL", exposure: "Migraine versus absence de migraine", design: "Comparaison transversale hors crise", timing: "Une IRM par sujet hors crise", measure: "ASL avec paramètres de transit à qualifier", practical: "Disponibilité et qualité ASL à contrôler", variable: "Délai depuis la dernière crise", bias: "Transit artériel et traitements concomitants" },
  { id: "NON_MEDICAL", text: "je veux évaluer la reproductibilité de trois méthodes de mesure de rugosité sur les mêmes plaques industrielles, avec des opérateurs et des jours différents", question: "Comparer la reproductibilité des méthodes de rugosité", population: "Plaques industrielles mesurées par trois méthodes", outcome: "Variabilité de la mesure de rugosité", exposure: "Méthode, opérateur et jour", design: "Étude méthodologique appariée à mesures répétées", timing: "Répétitions par opérateur et jour", measure: "Mesure de rugosité selon trois méthodes", practical: "Étalonnage et traçabilité du matériau", variable: "Identifiant de plaque", bias: "Confusion méthode/opérateur et dérive instrumentale" },
] as const;
export const requestFor = (text: string): Omit<ProductBridgeRequest, "apiVersion"> => ({ conversation: { conversationId: "offline-proposal", language: "fr", turns: [{ turnId: "u1", role: "USER", content: text, createdAt: "2026-09-17T10:00:00Z" }] }, currentProject: null, evaluatePersistentDelta: true,
  preProjectNavigation: buildPreProjectNavigationDecision({ routing: routeProductEntry({ raw: text, sourceTurnRef: "u1", routedAt: "2026-09-17T10:00:00Z" }) }) });
export const explicitWire = (domain: typeof DOMAINS[number] = DOMAINS[0]) => ({ changes: [
  ["OBJECTIVE", domain.question], ["POPULATION", domain.population], ["CANONICAL_VARIABLE", domain.outcome],
  ...(domain.id === "FIBROSIS" || domain.id === "NEUROIMAGING" ? [["IMAGING_MODALITY", "IRM"]] : []),
].map(([proposedType, content], i) => ({ operation: "ADD", candidateRef: `explicit:${i}`, proposedType, content,
  sourceText: domain.text, polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [] })), relations: [], temporalQualifications: [], expectedVariableOccasions: [] });

export const controlledStudyProposal = (contextDigest: string, domain: typeof DOMAINS[number] = DOMAINS[0]): ContextualStudyProposal => {
  const atom = (ref: string, area: StudyProposalAtom["area"], owner: StudyProposalAtom["owner"], targetType: StudyProposalAtom["targetType"], content: string, extra: Partial<StudyProposalAtom> = {}): StudyProposalAtom => ({ ref, semanticKey: ref, area, owner, targetType, content,
    rationale: "Proposition de travail liée à l'intention ; vérifier les limites avant adoption.", status: "NOXIA_PROPOSAL", evidenceRefs: [], dependsOn: [], variableRoles: [], unit: null, strataCount: null, plannedSource: null, plannedMethod: null, participantReported: false, analysisMethod: null, userChangeRefs: [], ...extra });
  const fibrosis = domain.id === "FIBROSIS";
  const atoms = [
    atom("question", "QUESTION", "SCIENTIFIC_THINKING", "SCIENTIFIC_QUESTION", domain.question),
    atom("objective", "OBJECTIVES", "SCIENTIFIC_THINKING", "OBJECTIVE", domain.question),
    atom("population", "POPULATION", "STUDY_DESIGN", "POPULATION", domain.population),
    atom("design", "DESIGN", "STUDY_DESIGN", "STUDY_DESIGN", domain.design, { status: "STRONG_CONTEXTUAL_INFERENCE" }),
    atom("eligibility", "ELIGIBILITY", "STUDY_DESIGN", "ELIGIBILITY_CRITERION", fibrosis ? "Absence de maladie cardiovasculaire connue et compatibilité IRM à discuter" : "Critères correspondant à la population et aux ressources, à discuter"),
    atom("recruitment", "RECRUITMENT", "STUDY_DESIGN", "PROJECT_INFORMATION", "Recrutement diversifié pour limiter l'autosélection"),
    atom("exposure", "EXPOSURE", "STUDY_DESIGN", "INTERVENTION_OR_EXPOSURE", domain.exposure),
    atom("measurement", "MEASUREMENTS", domain.id === "FIBROSIS" || domain.id === "NEUROIMAGING" ? "IMAGING" : "OBS", "ACQUISITION", domain.measure),
    atom("timing", "TIMING", "STUDY_DESIGN", "VISIT", domain.timing, { status: "PROVISIONAL_ASSUMPTION" }),
    atom("descriptor", "DESCRIPTION", "DATA_MANAGEMENT", "CANONICAL_VARIABLE", domain.variable, { variableRoles: ["DESCRIPTIVE_VARIABLE"] }),
    atom("confounders", "CONFOUNDERS", "BIOSTATISTICS", "PROJECT_INFORMATION", fibrosis ? "Âge, sexe et facteurs cardiovasculaires à considérer ; rôles à arbitrer" : "Facteurs liés à l'exposition et au critère à qualifier"),
    atom("endpoint", "ENDPOINTS", "OBS", "ENDPOINT", domain.outcome),
    atom("analysis", "ANALYSIS", "BIOSTATISTICS", "ANALYSIS_SPECIFICATION", fibrosis ? "Régression de l'ECV sur l'âge ; non-linéarité et ajustements à examiner" : "Analyse compatible avec le design ; dépendance des mesures à préserver"),
    atom("dimensioning", "DIMENSIONING", "BIOSTATISTICS", "PROJECT_INFORMATION", "Scénarios sur effet cible, dispersion, puissance et non-évaluabilité ; hypothèses non adoptées"),
    atom("bias", "BIASES", "STUDY_DESIGN", "PROJECT_INFORMATION", domain.bias),
    atom("practical", "PRACTICAL", "STUDY_DESIGN", "CONSTRAINT", domain.practical),
    atom("age-continuous", "DESIGN", "STUDY_DESIGN", "PROJECT_INFORMATION", fibrosis ? "Recruter sur l'étendue des âges ; l'analyse continue reste proposée séparément" : "Une stratégie principale prespécifiée avec analyses secondaires explicites"),
    atom("age-classes", "DESIGN", "STUDY_DESIGN", "PROJECT_INFORMATION", fibrosis ? "Sept classes d'âge ; bornes, allocation, analyse et effectif restent à arbitrer" : "Plusieurs strates ou conditions, sans adopter l'analyse ni les effectifs", { strataCount: fibrosis ? 7 : null }),
    atom("allocation", "RECRUITMENT", "STUDY_DESIGN", "PROJECT_INFORMATION", "Allocation équilibrée proposée entre classes", { status: "PROVISIONAL_ASSUMPTION" }),
    atom("bounds", "POPULATION", "STUDY_DESIGN", "PROJECT_INFORMATION", "Bornes des classes à discuter", { status: "OPEN_DECISION" }),
  ];
  if (fibrosis) {
    atoms.push(
      atom("eligibility-metabolic", "ELIGIBILITY", "STUDY_DESIGN", "ELIGIBILITY_CRITERION", "Diabète, hypertension, maladie coronarienne ou cardiovasculaire, pathologie rénale ou systémique : exclusions candidates à discuter selon la définition de population saine"),
      atom("eligibility-smoking", "ELIGIBILITY", "STUDY_DESIGN", "ELIGIBILITY_CRITERION", "Exclure les fumeurs actuels et documenter l'ancien tabagisme : proposition, à comparer à jamais-fumeurs ou inclusion avec ajustement"),
      atom("eligibility-safety", "ELIGIBILITY", "STUDY_DESIGN", "ELIGIBILITY_CRITERION", "Vérifier les contre-indications IRM et contraste ; médicaments influençant le phénotype cardiovasculaire à examiner, sans exclusion automatique"),
      atom("secondary-objective", "OBJECTIVES", "SCIENTIFIC_THINKING", "OBJECTIVE", "Décrire la dispersion de l'ECV et explorer l'hétérogénéité selon sexe et facteurs cardiovasculaires, sans hypothèse causale artificielle"),
      atom("analysis-sensitivity", "ANALYSIS", "BIOSTATISTICS", "ANALYSIS_SPECIFICATION", "Âge continu en analyse principale ; spline seulement si justifiée et dimensionnable ; classes descriptives, ajustements limités et interaction sexe × âge exploratoire, à arbitrer"),
    );
    const declarations: [string, string, string | null, StudyProposalAtom["variableRoles"]][] = [
      ["sex", "Démographie — sexe", null, ["DESCRIPTIVE_VARIABLE", "ADJUSTMENT_COVARIATE"]],
      ["height", "Anthropométrie — taille", "cm", ["DESCRIPTIVE_VARIABLE"]],
      ["weight", "Anthropométrie — poids", "kg", ["DESCRIPTIVE_VARIABLE"]],
      ["bmi", "Anthropométrie — BMI dérivé du poids et de la taille", "kg/m²", ["DESCRIPTIVE_VARIABLE", "ADJUSTMENT_COVARIATE"]],
      ["bp", "Constantes — pression artérielle", "mmHg", ["DESCRIPTIVE_VARIABLE", "ADJUSTMENT_COVARIATE"]],
      ["history", "Antécédents médicaux et cardiovasculaires ; histoire familiale pertinente", null, ["DESCRIPTIVE_VARIABLE"]],
      ["treatments", "Traitements actuels pouvant modifier le phénotype", null, ["DESCRIPTIVE_VARIABLE", "ADJUSTMENT_COVARIATE"]],
      ["diabetes", "Screening — diabète et hypertension", null, ["EXCLUSION_VARIABLE", "DESCRIPTIVE_VARIABLE"]],
      ["renal", "Biologie — fonction rénale", null, ["EXCLUSION_VARIABLE", "DESCRIPTIVE_VARIABLE"]],
      ["smoking", "Tabagisme — actuel, antérieur, quantité/pack-years et date d'arrêt", null, ["EXCLUSION_VARIABLE", "DESCRIPTIVE_VARIABLE", "ADJUSTMENT_COVARIATE"]],
      ["sport", "Activité physique — fréquence, intensité, compétition et entraînement important", null, ["DESCRIPTIVE_VARIABLE", "ADJUSTMENT_COVARIATE"]],
      ["alcohol", "Alcool — exposition à caractériser si pertinente", null, ["DESCRIPTIVE_VARIABLE"]],
      ["screen", "Screening — contre-indications IRM et contraste découvertes", null, ["EXCLUSION_VARIABLE"]],
      ["consent", "Inclusion — statut de consentement, sans consentement simulé", null, ["DESCRIPTIVE_VARIABLE"]],
      ["hematocrit", "Biologie — hématocrite lié à l'examen", "%", ["OUTCOME_VARIABLE"]],
      ["acquisition", "IRM — appareil et paramètres d'acquisition à qualifier", null, ["OUTCOME_VARIABLE"]],
      ["native-t1", "IRM — T1 natif", "ms", ["OUTCOME_VARIABLE"]],
      ["post-t1", "IRM — T1 post-contraste", "ms", ["OUTCOME_VARIABLE"]],
      ["ecv", "IRM — ECV myocardique", "%", ["OUTCOME_VARIABLE"]],
      ["quality", "Qualité — évaluabilité, examen incomplet et T1 non exploitable", null, ["DESCRIPTIVE_VARIABLE"]],
      ["deviation", "Déviation protocolaire et retrait avant examen", null, ["DESCRIPTIVE_VARIABLE"]],
      ["missing", "Données critiques manquantes et motifs", null, ["DESCRIPTIVE_VARIABLE"]],
    ];
    atoms.push(...declarations.map(([ref, label, unit, variableRoles]) => atom(ref, "DESCRIPTION", "DATA_MANAGEMENT", "CANONICAL_VARIABLE", label, { unit, variableRoles })));
  } else {
    // Controlled owner contributions differ by domain; these are fixture data,
    // never runtime scientific rules or evidence of generated LLM reasoning.
    const branches = domain.id === "DRUG_RCT"
      ? { owner: "BIOSTATISTICS" as const, area: "ANALYSIS" as const, type: "ANALYSIS_SPECIFICATION" as const, labels: ["Analyse en intention de traiter ajustée sur la pression initiale", "Analyse du changement de pression ; estimand à expliciter"] }
      : domain.id === "OBS_NON_IMAGING"
        ? { owner: "BIOSTATISTICS" as const, area: "ANALYSIS" as const, type: "ANALYSIS_SPECIFICATION" as const, labels: ["Taux d'absence avec modèle de Poisson et temps d'exposition", "Modèle binomial négatif si surdispersion démontrée"] }
        : domain.id === "NEUROIMAGING"
          ? { owner: "IMAGING" as const, area: "MEASUREMENTS" as const, type: "ACQUISITION" as const, labels: ["ASL multi-délai pour examiner le transit artériel", "ASL à délai unique avec limites de transit explicites"] }
          : { owner: "BIOSTATISTICS" as const, area: "ANALYSIS" as const, type: "ANALYSIS_SPECIFICATION" as const, labels: ["Modèle à composantes de variance : plaque, méthode, opérateur et jour", "Accord et répétabilité par méthode ; corrélation intra-plaque conservée"] };
    ["age-continuous", "age-classes"].forEach((ref, index) => Object.assign(atoms.find(a => a.ref === ref)!, { owner: branches.owner, area: branches.area, targetType: branches.type, content: branches.labels[index] }));
  }
  if (fibrosis) {
    Object.assign(atoms.find(a => a.ref === "analysis")!, { analysisMethod: "LINEAR_REGRESSION", dependsOn: ["age-continuous"] });
    Object.assign(atoms.find(a => a.ref === "analysis-sensitivity")!, { dependsOn: ["age-continuous"] });
    atoms.push(atom("analysis-classes", "ANALYSIS", "BIOSTATISTICS", "ANALYSIS_SPECIFICATION", "Comparer l'ECV entre classes par ANOVA ; homogénéité et indépendance à vérifier", { analysisMethod: "ONE_WAY_ANOVA", dependsOn: ["age-classes"] }));
    for (const a of atoms.filter(a => a.targetType === "CANONICAL_VARIABLE")) {
      const self = ["sex", "history", "treatments", "smoking", "sport", "alcohol"].includes(a.ref);
      Object.assign(a, { participantReported: self, plannedSource: self ? "Déclaration du participant" : "Recueil par le site", plannedMethod: self ? "Questionnaire auto-déclaré" : "Mesure, dossier ou contrôle technique à qualifier" });
    }
  }
  const option = (ref: string, label: string, atomRefs: string[], consequences: string) => ({ ref, label, atomRefs, benefits: "Lisibilité et cohérence avec l'intention", limits: "Hypothèses et contraintes à examiner", consequences });
  return { contract: "SCIENTIFIC_THINKING_STUDY_PROPOSAL_1", contextDigest,
    reply: fibrosis ? "Je comprends une comparaison transversale de l'ECV selon l'âge chez des volontaires sains : des personnes différentes, avec une mesure par personne. Une stratégie de travail et les premiers aperçus sont proposés. L'arbitrage principal porte sur une approche continue ou des classes d'âge ; les bornes, l'allocation et l'effectif restent distincts." : `Une stratégie candidate est proposée pour ${domain.question}. Le design et les mesures restent séparés de leur adoption ; l'arbitrage utile est présenté avec ses conséquences.`,
    understanding: [domain.question, domain.population, domain.practical], atoms,
    arbitrations: ([{ ref: "age-strategy", label: fibrosis ? "Comment couvrir les âges ?" : "Stratégie principale", rationale: "Ce choix change recrutement, analyse et dimensionnement", selection: "ONE", material: true, reversible: true,
      affectedBranches: ["RECRUITMENT", "ANALYSIS", "DIMENSIONING"], options: [option("continuous-option", fibrosis ? "Âge continu ; répartition du recrutement à décider" : "Stratégie principale continue ou prespécifiée", ["age-continuous"], "Favorise une estimation globale ; quotas et analyse restent des choix séparés"), option("classes-option", fibrosis ? "Sept classes d'âge ; bornes à discuter" : "Strates ou conditions distinctes", ["age-classes"], "Description par classe ; bornes, allocation, modèle et dimensionnement sont rouvertes")], recommendedRefs: ["continuous-option"] },
      { ref: "allocation-choice", label: "Allocation entre classes", rationale: "Décision distincte des classes et de leurs bornes", selection: "INDEPENDENT", material: false, reversible: true, affectedBranches: ["RECRUITMENT"], options: [option("equal-allocation", "Effectifs équilibrés entre classes", ["allocation"], "Contrainte de recrutement supplémentaire, non décidée par la stratification")], recommendedRefs: [] }] satisfies StudyArbitration[]).map(a => fibrosis ? a : { ...a, label: a.ref === "age-strategy" ? "Choix méthodologique structurant" : "Organisation du recrutement ou des unités", options: a.options.map(o => ({ ...o, label: atoms.find(atom => atom.ref === o.atomRefs[0])!.content })) }),
    recruitmentNotice: "Appel à volontaires — brouillon non réglementaire", participantQuestionnaireIntroduction: "Questionnaire de travail destiné aux personnes recrutées. Aucune réponse réelle n'est recueillie dans cet aperçu.",
    participantArtifactsApplicable: domain.id !== "NON_MEDICAL",
    dimensioningScenarios: fibrosis ? [{ ref: "seven-strata-scenario", label: "Illustration ANOVA à sept classes — hypothétique", branchAtomRefs: ["age-classes"], analysisAtomRef: "analysis-classes", input: {
      method: "ONE_WAY_ANOVA", alpha: .05, power: .8, effectSize: .25, groups: 7, testedPredictors: 1, totalPredictors: 1,
      allocation: "BALANCED_GROUPS", quotaStrata: 1, anticipatedNonEvaluableRate: .1, visits: "SINGLE", nonEvaluableReasons: ["Examen non interprétable", "Acquisition incomplète"],
      assumptions: [["alpha", .05], ["power", .8], ["effectSize", .25], ["anticipatedNonEvaluableRate", .1]].map(([parameter, value]) => ({ parameter: String(parameter), value: Number(value), provenance: "PROVISIONAL_ASSUMPTION", sourceRef: "LOCAL_SYNTHETIC_HYPOTHETICAL_SCENARIO" }))
    } }, { ref: "continuous-regression-scenario", label: "Illustration régression âge continu — hypothétique", branchAtomRefs: ["age-continuous"], analysisAtomRef: "analysis", input: {
      method: "LINEAR_REGRESSION", alpha: .05, power: .8, effectSize: .05, groups: 2, testedPredictors: 1, totalPredictors: 1,
      allocation: "UNSTRATIFIED", quotaStrata: 1, anticipatedNonEvaluableRate: .1, visits: "SINGLE", nonEvaluableReasons: ["Examen non interprétable", "Acquisition incomplète"],
      assumptions: [["alpha", .05], ["power", .8], ["effectSize", .05], ["anticipatedNonEvaluableRate", .1]].map(([parameter, value]) => ({ parameter: String(parameter), value: Number(value), provenance: "PROVISIONAL_ASSUMPTION", sourceRef: "LOCAL_SYNTHETIC_HYPOTHETICAL_SCENARIO" }))
    } }] : [], candidateIsAdopted: false, projectWriteAuthorized: false };
};
