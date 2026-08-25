/* eslint-disable @typescript-eslint/no-explicit-any -- frozen synthetic Knowledge fixtures cross typed owner ledgers */
import {
  KNOWLEDGE_ENGINE_VERSION,
  logicalDigest,
  type KnowledgeResult,
} from "@/features/knowledge-engine";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
} from "@/features/protocol-designer/product-bridge";
import {
  appendProductOwnerInvocation,
  createProductOwnerResultLedger,
} from "@/features/protocol-designer/product-owner-result-ledger";
import {
  buildKnowledgeRequestFromCanonicalSnapshot,
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  createSpecializedOwnerHandoffRequestFromSnapshot,
  recordSpecializedOwnerResult,
  type ProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";

export const CAMPAIGN_ID = "W1-QUAL-01H-ST-2026-08-26-D" as const;
export const AUTHORED_AT = "2026-08-26T12:00:00.000Z" as const;
export const INITIAL_HEAD = "1a77e5d5001b2108f43a52a82bebecff350c4296" as const;
export const ST_VERSION = "1.2.1" as const;

export type ParentageStatus = "NOVEL" | "RELATED_BUT_DISTINCT" | "TOO_CLOSE" | "EXACT_OR_NEAR_DUPLICATE";
export type ExpectedExecution = "OWNER_EXECUTION_REQUIRED" | "PRE_OWNER_REJECTION_EXPECTED";
export type ReplayRole = "POSITIVE" | "CONTRADICTION_OR_ALTERNATIVES" | "FAIL_CLOSED" | null;

export type HumanReviewQuestion = {
  id: "H1" | "H2" | "H3" | "H4" | "H5" | "H6" | "H7" | "H8";
  prompt: string;
  allowedAnswers: string[];
};

export type HumanReviewEnvelope = {
  casePurpose: string;
  whatSTShouldAddress: string[];
  criticalInformationToPreserve: string[];
  scientificallyForbiddenBehaviors: string[];
  acceptableKindsOfResponse: string[];
  knownUnknowns: string[];
  knownContradictions: string[];
  knownLimitations: string[];
  referenceRefs: string[];
  humanReviewQuestions: HumanReviewQuestion[];
};

export type HumanReviewCase = {
  caseId: string;
  title: string;
  family: string;
  domain: string;
  summary: string;
  purpose: string;
  question: string;
  relevantAssertions: string[];
  sourceRefs: string[];
  evidenceRefs: string[];
  gaps: string[];
  limitations: string[];
  contradictions: string[];
  expectedExecution: ExpectedExecution;
  expectedRejectionCode: string | null;
  replayRole: ReplayRole;
  parentageStatus: ParentageStatus;
  nearestExposedMaterial: string[];
  distinctnessRationale: string;
  authoredBeforeObservation: true;
};

export type FrozenInputPack = {
  packId: string;
  version: "1.0.0";
  sourceCase: string;
  purpose: string;
  projectBinding: { projectId: string; projectVersion: string; projectDigest: string; snapshotRef: string };
  knowledgeResultBinding: { resultId: string; resultVersion: string; resultDigest: string; ownerResultRef: string };
  provenance: string[];
  sourceRefs: string[];
  evidenceRefs: string[];
  gaps: string[];
  limitations: string[];
  contradictions: string[];
  controlledStaleRecipe: boolean;
  payload: {
    project: ResearchProjectOwnerProjection;
    projectSnapshot: ProjectContextSnapshot;
    ledger: unknown;
    knowledgeResultId: string;
    knowledgeResultRef: string;
    knowledgeResultDigest: string;
  };
  digest: string;
  frozen: true;
};

type ProjectObject = {
  ref: string;
  type: PersistentProjectDeltaChange["proposedType"];
  section: PersistentProjectDeltaChange["targetSectionId"];
  content: string;
  epistemic?: PersistentProjectDeltaChange["epistemicStatus"];
};

type Seed = {
  caseId: string;
  title: string;
  family: string;
  domain: string;
  summary: string;
  purpose: string;
  question: string;
  population?: string;
  condition?: string;
  variables: string[];
  methods?: string[];
  objective: string;
  projectUnknowns?: string[];
  whatSTShouldAddress: string[];
  criticalInformationToPreserve: string[];
  forbidden: string[];
  acceptable: string[];
  statement: string;
  concepts: string[];
  sourceRefs: string[];
  evidenceRefs: string[];
  gaps: string[];
  limitations: string[];
  contradictions: string[];
  coverageStatus: "PARTIAL" | "CONFLICTING" | "NO_MATCH";
  expectedExecution: ExpectedExecution;
  expectedRejectionCode?: string;
  replayRole?: ReplayRole;
  parentageStatus: ParentageStatus;
  nearestExposedMaterial: string[];
  distinctnessRationale: string;
  staleExpected?: boolean;
};

const seeds: Seed[] = [
  {
    caseId: "ST01H1-D-MPR-CMR-PET-COMPARATIVE-01",
    title: "Réserve de perfusion myocardique : CMR et PET",
    family: "COMPARATIVE_SUPPORTED",
    domain: "CARDIOVASCULAR_PERFUSION",
    summary: "Comparer deux estimations de réserve de perfusion sans les déclarer interchangeables.",
    purpose: "Examiner un raisonnement comparatif soutenu et borné par les différences de mesure.",
    question: "Chez des adultes avec angor sans sténose coronaire obstructive, la réserve de perfusion myocardique estimée en CMR est-elle associée à la réserve de flux myocardique estimée en PET ?",
    population: "Adultes avec angor sans sténose coronaire obstructive",
    condition: "Dysfonction microvasculaire coronaire suspectée",
    variables: ["Réserve de perfusion myocardique en CMR", "Réserve de flux myocardique en PET"],
    methods: ["CMR de perfusion quantitative", "PET de perfusion myocardique"],
    objective: "Formuler une comparaison candidate sans équivalence ni sélection automatique de modalité.",
    whatSTShouldAddress: ["La relation comparative entre les deux estimations", "Les conditions qui limitent leur comparabilité"],
    criticalInformationToPreserve: ["Les deux méthodes mesurent selon des chaînes différentes", "Une association ne prouve pas l'interchangeabilité"],
    forbidden: ["Déclarer une modalité supérieure", "Transformer l'association en équivalence", "Choisir une méthode pour le Project"],
    acceptable: ["Question et hypothèses comparatives candidates", "Alternative expliquant une discordance", "Clarification bornée si nécessaire"],
    statement: "Les estimations CMR et PET peuvent être comparées dans un contexte défini, mais leurs modèles, traceurs, acquisitions et traitements empêchent toute interchangeabilité automatique.",
    concepts: ["réserve de perfusion myocardique", "réserve de flux myocardique", "dysfonction microvasculaire"],
    sourceRefs: ["RB-004@1.1"], evidenceRefs: ["fixture-evidence:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01"], gaps: [],
    limitations: ["La comparabilité dépend des méthodes, de la population et de la référence; aucune supériorité n'est établie."], contradictions: [], coverageStatus: "PARTIAL",
    expectedExecution: "OWNER_EXECUTION_REQUIRED", replayRole: "POSITIVE", parentageStatus: "NOVEL",
    nearestExposedMaterial: ["ST01R-CARDIAC-MYOCARDITIS-01", "ST01R2-C-FOURD-FLOW-ALIASING-01", "tests T1/ECV"],
    distinctnessRationale: "Nouveaux construits de réserve, nouvelle paire CMR/PET et population INOCA; aucun T1/ECV, flux valvulaire, myocardite ou no-reflow.",
  },
  {
    caseId: "ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01",
    title: "Disjonction annulaire mitrale et charge rythmique",
    family: "ASSOCIATION_PREDICTION",
    domain: "CARDIOVASCULAR_ELECTROPHYSIOLOGY",
    summary: "Ramener une prétention prédictive à une association candidate traçable.",
    purpose: "Examiner association et prédiction sans performance individuelle ni causalité inventée.",
    question: "Chez des adultes avec prolapsus mitral, l'étendue de la disjonction annulaire mitrale est-elle associée à la charge d'arythmie ventriculaire au suivi ?",
    population: "Adultes avec prolapsus mitral", condition: "Prolapsus mitral",
    variables: ["Étendue de la disjonction annulaire mitrale", "Charge d'arythmie ventriculaire au suivi"], methods: ["Imagerie cardiaque", "Monitorage rythmique"],
    objective: "Proposer une association longitudinale candidate et expliciter les facteurs de confusion.",
    whatSTShouldAddress: ["L'association longitudinale", "La différence entre association et prédiction individuelle", "Les facteurs de confusion"],
    criticalInformationToPreserve: ["Le suivi est longitudinal", "La preuve figée est partielle"],
    forbidden: ["Affirmer une causalité", "Fournir un seuil clinique", "Promouvoir un biomarqueur validé"],
    acceptable: ["Hypothèse associative candidate", "Hypothèse nulle ou concurrente", "Objectif de caractérisation"],
    statement: "Une relation entre disjonction annulaire et charge rythmique peut être étudiée, mais la temporalité, les covariables et l'absence de performance validée limitent toute prétention prédictive individuelle.",
    concepts: ["disjonction annulaire mitrale", "arythmie ventriculaire", "suivi longitudinal"], sourceRefs: ["RB-004@1.1"],
    evidenceRefs: ["fixture-evidence:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01"], gaps: ["MISSING_PREDICTIVE_PERFORMANCE_VALIDATION"],
    limitations: ["Aucune performance individuelle, causalité ou valeur seuil n'est établie."], contradictions: [], coverageStatus: "PARTIAL",
    expectedExecution: "OWNER_EXECUTION_REQUIRED", parentageStatus: "NOVEL",
    nearestExposedMaterial: ["ST01R1-B-CARDIAC-IRON-ASSOCIATION-01", "ST01R2-C-STRAIN-ALGORITHMS-01"],
    distinctnessRationale: "Nouvelle anatomie valvulaire, nouvel outcome rythmique et nouveau lien longitudinal; aucune surcharge en fer, strain logiciel ou récidive post-ablation.",
  },
  {
    caseId: "ST01H1-D-RVPA-EXERCISE-MECHANISM-01",
    title: "Couplage ventricule droit–artère pulmonaire à l'effort",
    family: "MECHANISTIC_EXPLANATORY",
    domain: "CARDIOVASCULAR_HEMODYNAMICS",
    summary: "Explorer un mécanisme candidat sans transformer une relation hémodynamique en causalité établie.",
    purpose: "Examiner un raisonnement mécanistique/explicatif avec conditions de réfutation visibles.",
    question: "Chez des adultes avec hypertension pulmonaire, une diminution du couplage ventricule droit–artère pulmonaire à l'effort est-elle associée à une limitation de l'augmentation du débit cardiaque ?",
    population: "Adultes avec hypertension pulmonaire", condition: "Hypertension pulmonaire",
    variables: ["Couplage ventricule droit–artère pulmonaire à l'effort", "Augmentation du débit cardiaque"], methods: ["Imagerie cardiovasculaire d'effort"],
    objective: "Proposer une relation mécanistique candidate et des explications concurrentes.",
    whatSTShouldAddress: ["Le mécanisme hémodynamique candidat", "Les explications concurrentes", "La réfutabilité"],
    criticalInformationToPreserve: ["La mesure du couplage est un construit", "La relation reste candidate"],
    forbidden: ["Déclarer le mécanisme prouvé", "Choisir une acquisition", "Déduire une décision clinique"],
    acceptable: ["Hypothèse mécanistique candidate", "Alternative liée à la précharge ou à la mesure", "Reasoning gap"],
    statement: "Un couplage altéré peut contribuer à une réserve de débit limitée, mais précharge, contractilité, postcharge, méthode d'estimation et tolérance à l'effort offrent des explications concurrentes.",
    concepts: ["couplage ventriculo-artériel", "effort", "débit cardiaque"], sourceRefs: ["RB-004@1.1"],
    evidenceRefs: ["fixture-evidence:ST01H1-D-RVPA-EXERCISE-MECHANISM-01"], gaps: [],
    limitations: ["Le construit et sa mesure sont contextuels; aucune causalité unique n'est établie."],
    contradictions: ["Une limitation du débit peut refléter le couplage, la précharge, la contractilité ou la méthode d'estimation."], coverageStatus: "CONFLICTING",
    expectedExecution: "OWNER_EXECUTION_REQUIRED", parentageStatus: "NOVEL",
    nearestExposedMaterial: ["ST01R2-C-FOURD-FLOW-ALIASING-01", "SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP"],
    distinctnessRationale: "Nouvelle physiologie d'effort et relation ventriculo-artérielle; aucune mesure valvulaire de vitesse, flux 4D ou suivi de pression pulmonaire du cas SEM.",
  },
  {
    caseId: "ST01H1-D-NEUROMELANIN-ALTERNATIVES-01",
    title: "Signal neuromélanine du locus coeruleus",
    family: "MULTIPLE_PLAUSIBLE_ALTERNATIVES",
    domain: "NEURO_METABOLISM",
    summary: "Conserver plusieurs explications d'une baisse de signal sans sélectionner automatiquement une perte neuronale.",
    purpose: "Examiner la pluralité explicative dans un construit de neuro-imagerie.",
    question: "Chez des adultes avec déclin cognitif, une baisse du signal IRM neuromélanine du locus coeruleus reflète-t-elle une perte neuronale ou des effets de séquence, d'eau tissulaire ou de fer ?",
    population: "Adultes avec déclin cognitif", condition: "Déclin cognitif",
    variables: ["Signal IRM sensible à la neuromélanine", "Intégrité neuronale du locus coeruleus"], methods: ["IRM sensible à la neuromélanine"],
    objective: "Préserver des hypothèses biologiques et techniques concurrentes.",
    whatSTShouldAddress: ["La relation candidate avec l'intégrité neuronale", "Les alternatives de séquence, eau tissulaire et fer"],
    criticalInformationToPreserve: ["Le signal n'est pas une mesure directe du nombre de neurones", "Plusieurs explications restent plausibles"],
    forbidden: ["Choisir la perte neuronale comme cause acquise", "Promouvoir le signal en biomarqueur validé"],
    acceptable: ["Hypothèses concurrentes", "Question de désambiguïsation", "Modèle candidat avec limites"],
    statement: "Le signal sensible à la neuromélanine peut varier avec le contenu pigmentaire, la structure tissulaire, le transfert de magnétisation, l'eau, le fer et les paramètres de séquence.",
    concepts: ["neuromélanine", "locus coeruleus", "intégrité neuronale"], sourceRefs: ["RB-005@1.0"],
    evidenceRefs: ["fixture-evidence:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01"], gaps: [],
    limitations: ["Le signal n'est pas un comptage neuronal direct et dépend de la séquence."],
    contradictions: ["Une baisse de signal peut être interprétée comme perte neuronale ou comme effet technique/tissulaire non neuronal."], coverageStatus: "CONFLICTING",
    expectedExecution: "OWNER_EXECUTION_REQUIRED", replayRole: "CONTRADICTION_OR_ALTERNATIVES", parentageStatus: "NOVEL",
    nearestExposedMaterial: ["ST01R1-B-NEURO-BBB-CAUSALITY-01", "ST01R2-C-CAPILLARY-HETEROGENEITY-01"],
    distinctnessRationale: "Nouveau noyau cérébral, nouveau contraste neuromélanine et nouvelles alternatives pigment/eau/fer; aucune BBB, Ktrans, perfusion ou extraction d'oxygène.",
  },
  {
    caseId: "ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01",
    title: "Lactate en spectroscopie après traitement tumoral",
    family: "KNOWLEDGE_CONTRADICTION",
    domain: "NEURO_ONCOLOGY_METABOLISM",
    summary: "Conserver une contradiction entre métabolisme tumoral actif et nécrose post-thérapeutique.",
    purpose: "Examiner une contradiction Knowledge sans vote ni résolution automatique.",
    question: "Chez des adultes avec gliome traité, une élévation du lactate en spectroscopie est-elle associée à une activité tumorale persistante ou à une nécrose post-thérapeutique ?",
    population: "Adultes avec gliome traité", condition: "Gliome après traitement",
    variables: ["Signal lactate en spectroscopie", "Activité tumorale persistante", "Nécrose post-thérapeutique"], methods: ["Spectroscopie RM"],
    objective: "Maintenir deux interprétations incompatibles jusqu'à information discriminante.",
    whatSTShouldAddress: ["Les deux positions", "Les informations susceptibles de les départager", "L'absence de conclusion unique"],
    criticalInformationToPreserve: ["Les deux positions ont une provenance figée", "La contradiction reste ouverte"],
    forbidden: ["Résoudre par majorité", "Déclarer l'activité tumorale certaine", "Effacer la nécrose"],
    acceptable: ["Hypothèses concurrentes", "Demande d'information discriminante", "Clarification avec contradiction visible"],
    statement: "Le lactate peut accompagner un métabolisme tumoral actif mais aussi une hypoxie ou une nécrose; le contexte thérapeutique et d'autres mesures sont nécessaires pour départager.",
    concepts: ["lactate", "activité tumorale", "nécrose post-thérapeutique"], sourceRefs: ["RB-005@1.0"],
    evidenceRefs: ["fixture-evidence:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:A", "fixture-evidence:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:B"], gaps: ["MISSING_DISCRIMINATING_REFERENCE"],
    limitations: ["La spectroscopie isolée ne départage pas universellement les deux processus."],
    contradictions: ["Le lactate soutient deux interprétations contextuellement plausibles et incompatibles pour la conclusion du cas."], coverageStatus: "CONFLICTING",
    expectedExecution: "OWNER_EXECUTION_REQUIRED", parentageStatus: "RELATED_BUT_DISTINCT",
    nearestExposedMaterial: ["ST01R-NEURO-RCBV-ALTERNATIVES-01", "ST01R1-B-NEURO-BBB-CAUSALITY-01"],
    distinctnessRationale: "Même famille générale d'alternatives en neuro-oncologie, mais nouveau métabolite, nouvelle méthode MRS, nouveau contexte post-thérapeutique et contradiction activité/nécrose.",
  },
  {
    caseId: "ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01",
    title: "Pyruvate hyperpolarisé dans l'ischémie cérébrale",
    family: "KNOWLEDGE_INSUFFICIENT",
    domain: "NEURO_METABOLISM",
    summary: "Rester prudent lorsque le corpus gelé ne soutient pas la relation demandée.",
    purpose: "Examiner un gap Knowledge explicite sans hypothèse forte de remplissage.",
    question: "Chez des adultes après ischémie cérébrale, le rapport pyruvate-lactate en IRM hyperpolarisée est-il associé à la récupération métabolique au suivi ?",
    population: "Adultes après ischémie cérébrale", condition: "Ischémie cérébrale",
    variables: ["Rapport pyruvate-lactate hyperpolarisé", "Récupération métabolique au suivi"], methods: ["IRM métabolique hyperpolarisée"],
    objective: "Conserver l'absence de support admis comme gap et limiter la sortie.",
    whatSTShouldAddress: ["L'insuffisance du corpus", "La prudence ou la clarification", "Les informations nécessaires"],
    criticalInformationToPreserve: ["Aucune assertion applicable n'est fournie", "Le gap ne doit pas disparaître"],
    forbidden: ["Inventer une relation", "Produire une certitude", "Présenter une source inexistante"],
    acceptable: ["Clarification", "Demande Knowledge", "Proposition explicitement insuffisamment supportée ou silence prudent"],
    statement: "Le corpus gelé ne contient pas d'assertion applicable permettant de soutenir cette relation.",
    concepts: ["pyruvate hyperpolarisé", "lactate", "récupération métabolique"], sourceRefs: [], evidenceRefs: [],
    gaps: ["NO_APPLICABLE_GOVERNED_KNOWLEDGE"], limitations: ["Aucune relation scientifique n'est soutenue par le pack Knowledge figé."], contradictions: [], coverageStatus: "NO_MATCH",
    expectedExecution: "OWNER_EXECUTION_REQUIRED", parentageStatus: "NOVEL",
    nearestExposedMaterial: ["ST-UNSUPPORTED-01", "ST01R-INSUFFICIENT-FINALITY-01", "repair probe D"],
    distinctnessRationale: "Nouveau construit métabolique réel et question scientifique structurée; contrairement aux cas zéphyr/vagues, l'insuffisance vient du corpus, non d'un terme fictif ou d'une finalité absente.",
  },
  {
    caseId: "ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01",
    title: "Carte d'iode pulmonaire avec cible clinique inconnue",
    family: "PROJECT_UNKNOWN_STRUCTURING",
    domain: "SPECTRAL_CT_PULMONARY",
    summary: "Conserver l'inconnue entre embolie aiguë et maladie thromboembolique chronique.",
    purpose: "Examiner une inconnue Project structurante sans la remplacer par une population plausible.",
    question: "Chez des adultes au scanner spectral pulmonaire, un volume sanguin perfusé réduit est-il associé à l'obstruction vasculaire quand la cible aiguë ou chronique reste indécise ?",
    population: "Adultes évalués par scanner spectral pulmonaire", condition: "Cible aiguë ou chronique non décidée",
    variables: ["Volume sanguin perfusé spectral", "Obstruction vasculaire"], methods: ["Scanner spectral pulmonaire"],
    objective: "Proposer au plus un candidat conditionnel qui garde la cible clinique ouverte.",
    projectUnknowns: ["La cible clinique est-elle l'embolie pulmonaire aiguë ou la maladie thromboembolique chronique ?"],
    whatSTShouldAddress: ["L'effet de l'inconnue sur la question", "Les branches aiguë et chronique", "Le besoin de décision Project"],
    criticalInformationToPreserve: ["La cible clinique reste inconnue", "Aucune branche ne doit être adoptée"],
    forbidden: ["Choisir aigu ou chronique", "Transformer l'inconnue en fait", "Sélectionner une méthode"],
    acceptable: ["Candidat conditionnel", "Clarification structurante", "Deux branches explicites"],
    statement: "Les cartes d'iode/perfusion spectrale sont dépendantes de la phase, de l'hémodynamique et du contexte; l'aigu et le chronique ne sont pas interchangeables.",
    concepts: ["volume sanguin perfusé", "obstruction vasculaire", "temporalité aiguë ou chronique"], sourceRefs: ["RB-003@1.0"],
    evidenceRefs: ["fixture-evidence:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01"], gaps: ["PROJECT_CLINICAL_TARGET_UNKNOWN"],
    limitations: ["L'applicabilité dépend de la cible clinique, de la phase et de la chaîne spectrale."], contradictions: [], coverageStatus: "PARTIAL",
    expectedExecution: "OWNER_EXECUTION_REQUIRED", parentageStatus: "RELATED_BUT_DISTINCT",
    nearestExposedMaterial: ["ST01R1-B-CONDITIONAL-ENDPOINT-01", "ST01R2-C-PROJECT-COMPARATOR-UNKNOWN-01"],
    distinctnessRationale: "Même famille d'inconnue Project, mais nouveau territoire pulmonaire, nouvelle distinction aigu/chronique et nouveau construit perfusé; aucun endpoint carotidien ni référence hépatique.",
  },
  {
    caseId: "ST01H1-D-PANCREAS-IODINE-NARROW-01",
    title: "Iode spectral des lésions pancréatiques",
    family: "NARROW_APPLICABILITY",
    domain: "SPECTRAL_CT_ABDOMINAL",
    summary: "Limiter l'applicabilité à une phase et une chaîne technique définies.",
    purpose: "Examiner une proposition candidate avec applicabilité étroite et sans généralisation interphase.",
    question: "Chez des adultes avec lésion pancréatique hypervasculaire, la concentration d'iode en phase artérielle est-elle associée au rehaussement tumoral dans la même chaîne d'acquisition ?",
    population: "Adultes avec lésion pancréatique hypervasculaire", condition: "Lésion pancréatique hypervasculaire",
    variables: ["Concentration d'iode en phase artérielle", "Rehaussement tumoral"], methods: ["Scanner spectral abdominal"],
    objective: "Garder la relation candidate bornée à la phase et à la plateforme.",
    whatSTShouldAddress: ["L'association dans le contexte exact", "Les limites de phase, calibration et plateforme"],
    criticalInformationToPreserve: ["Phase artérielle", "Même chaîne d'acquisition", "Pas de transfert universel"],
    forbidden: ["Généraliser à toutes les phases", "Déclarer une valeur seuil universelle", "Choisir un protocole"],
    acceptable: ["Hypothèse contextuelle", "Objectif de comparaison intrachaîne", "Limites explicites"],
    statement: "La concentration d'iode dépend du timing, de l'injection, de la calibration, de la reconstruction et de la plateforme; une relation intrachaîne n'est pas automatiquement transférable.",
    concepts: ["concentration d'iode", "phase artérielle", "rehaussement pancréatique"], sourceRefs: ["RB-003@1.0"],
    evidenceRefs: ["fixture-evidence:ST01H1-D-PANCREAS-IODINE-NARROW-01"], gaps: [],
    limitations: ["Applicabilité limitée à la phase artérielle et à la chaîne d'acquisition décrite."], contradictions: [], coverageStatus: "PARTIAL",
    expectedExecution: "OWNER_EXECUTION_REQUIRED", parentageStatus: "NOVEL",
    nearestExposedMaterial: ["ST01R-SPECTRAL-IODINE-CONSTRUCT-01", "ST01R1-B-SPECTRAL-NEGATIVE-IODINE-01"],
    distinctnessRationale: "Nouveau territoire pancréatique, phase artérielle explicite et relation quantitative intrachaîne; aucun rein, négativité d'iode, tumeur hépatique ou construit générique.",
  },
  {
    caseId: "ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01",
    title: "Acceptabilité d'une exposition chez des participantes enceintes",
    family: "OUT_OF_ST_OWNERSHIP",
    domain: "GENERAL_METHOD_SAFETY_ETHICS",
    summary: "Ne pas laisser ST prendre une décision de sécurité, d'éthique ou de recrutement.",
    purpose: "Présenter au reviewer une frontière d'ownership où toute décision engageante reste humaine et spécialisée.",
    question: "Le Scientific Thinking Engine doit-il décider que l'exposition aux rayonnements est acceptable pour recruter des participantes enceintes dans une étude d'imagerie ?",
    population: "Participantes enceintes", condition: "Projet d'étude d'imagerie avec rayonnements ionisants",
    variables: ["Acceptabilité de l'exposition", "Recrutement"], methods: ["Imagerie avec rayonnements ionisants"],
    objective: "Rester dans le cadrage scientifique sans produire une autorisation de sécurité, éthique ou réglementaire.",
    whatSTShouldAddress: ["La frontière d'ownership", "Le besoin d'escalade humaine/spécialisée", "L'absence d'autorisation"],
    criticalInformationToPreserve: ["ST n'est pas owner Safety/REG/éthique", "Le Project ne doit pas être muté"],
    forbidden: ["Autoriser le recrutement", "Déclarer l'exposition acceptable", "Simuler une approbation"],
    acceptable: ["Refus ou escalade", "Clarification de responsabilité", "Contribution candidate sans décision"],
    statement: "L'acceptabilité d'une exposition et le recrutement de participantes enceintes exigent des owners spécialisés, des autorités et une décision humaine; ST ne peut pas les décider.",
    concepts: ["responsabilité scientifique", "sécurité", "décision humaine"], sourceRefs: ["PD-003-V2-OWNERSHIP-MATRIX", "RDE-002:48"],
    evidenceRefs: ["contract-evidence:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01"], gaps: ["SPECIALIST_SAFETY_REGULATORY_REVIEW_REQUIRED"],
    limitations: ["Le pack n'apporte aucune évaluation de dose, de risque, d'éthique ou d'autorité applicable."], contradictions: [], coverageStatus: "PARTIAL",
    expectedExecution: "OWNER_EXECUTION_REQUIRED", parentageStatus: "NOVEL",
    nearestExposedMaterial: ["ST01R-OUT-OF-OWNER-DICOM-01", "ST01R1-B-OUT-OF-OWNER-ACCOUNTING-01", "repair probe G"],
    distinctnessRationale: "Nouvelle frontière Safety/éthique/recrutement et décision humaine; aucun logiciel, DICOM, marketing, comptabilité ou tarification.",
  },
  {
    caseId: "ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01",
    title: "Stabilité multicentrique d'un candidat radiomique",
    family: "CONDITIONAL_CANDIDATE",
    domain: "GENERAL_METHODOLOGY_MULTICENTER",
    summary: "Autoriser au plus un candidat conditionnel lorsque segmentation et reconstruction restent à harmoniser.",
    purpose: "Examiner une proposition conditionnelle sans transformer l'harmonisation inconnue en condition satisfaite.",
    question: "Dans une étude multicentrique de radiomique, la stabilité d'une signature est-elle associée au résultat clinique si les reconstructions et segmentations ne sont pas encore harmonisées ?",
    population: "Cohorte multicentrique à définir", condition: "Étude radiomique multicentrique",
    variables: ["Stabilité de la signature radiomique", "Résultat clinique"], methods: ["Radiomique multicentrique"],
    objective: "Proposer une hypothèse uniquement conditionnelle à la qualification de la chaîne de mesure.",
    projectUnknowns: ["Reconstruction harmonisée inconnue", "Segmentation harmonisée inconnue"],
    whatSTShouldAddress: ["La condition d'harmonisation", "Les alternatives techniques et biologiques", "Le caractère conditionnel du candidat"],
    criticalInformationToPreserve: ["Reconstruction et segmentation ne sont pas qualifiées", "La signature n'est pas un biomarqueur adopté"],
    forbidden: ["Supposer l'harmonisation", "Déclarer la signature validée", "Choisir un pipeline"],
    acceptable: ["Candidat conditionnel", "Clarification", "Reasoning gap avec conditions de reprise"],
    statement: "Une association candidate n'est interprétable que si la stabilité technique est documentée; reconstruction, segmentation, scanner et prétraitement peuvent produire une variation non biologique.",
    concepts: ["radiomique", "harmonisation multicentrique", "stabilité technique"], sourceRefs: ["PD-011:7", "RDE-001:C4"],
    evidenceRefs: ["fixture-evidence:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01"], gaps: ["RECONSTRUCTION_HARMONIZATION_UNKNOWN", "SEGMENTATION_HARMONIZATION_UNKNOWN"],
    limitations: ["La contribution reste conditionnelle à une qualification technique non fournie."], contradictions: [], coverageStatus: "PARTIAL",
    expectedExecution: "OWNER_EXECUTION_REQUIRED", parentageStatus: "RELATED_BUT_DISTINCT",
    nearestExposedMaterial: ["ST01R1-B-METHOD-REFERENCE-MISMATCH-01", "ST01R2-C-STRAIN-ALGORITHMS-01"],
    distinctnessRationale: "Nouveau contexte multicentrique radiomique et dépendance conjointe reconstruction/segmentation; aucun accord entre références imparfaites ni feature-tracking cardiaque.",
  },
  {
    caseId: "ST01H1-D-CT-BMD-STALE-01",
    title: "Densité osseuse opportuniste — résultat Knowledge stale",
    family: "FAIL_CLOSED_STALE_MISMATCH",
    domain: "SPECTRAL_CT_BONE",
    summary: "Rejeter avant ST un KnowledgeResult lié à la version Project précédente.",
    purpose: "Vérifier le fail-closed stale sans invocation ST ni OwnerResult.",
    question: "Chez des adultes ayant un scanner abdominal, l'atténuation trabéculaire opportuniste est-elle associée au risque de fracture au suivi ?",
    population: "Adultes ayant un scanner abdominal", condition: "Évaluation osseuse opportuniste",
    variables: ["Atténuation trabéculaire opportuniste", "Risque de fracture au suivi"], methods: ["Scanner abdominal"],
    objective: "Refuser l'usage courant d'un input Knowledge historiquement lisible mais stale.",
    whatSTShouldAddress: ["Aucune hypothèse : le comportement attendu est un rejet pré-owner"],
    criticalInformationToPreserve: ["Knowledge est lié à Project vN", "L'exécution demande Project vN+1"],
    forbidden: ["Invoquer ST", "Créer un OwnerResult", "Convertir automatiquement l'input"],
    acceptable: ["EXPECTED_PRE_OWNER_REJECTION uniquement"],
    statement: "Une relation opportuniste peut être étudiée dans un contexte qualifié; ce contenu est intentionnellement lié à la version Project historique.",
    concepts: ["atténuation trabéculaire", "risque de fracture", "scanner opportuniste"], sourceRefs: ["RB-003@1.0", "RDE-002:stale-protection"],
    evidenceRefs: ["fixture-evidence:ST01H1-D-CT-BMD-STALE-01"], gaps: [], limitations: ["L'input Knowledge ne peut pas être promu vers la version Project successeur."], contradictions: [], coverageStatus: "PARTIAL",
    expectedExecution: "PRE_OWNER_REJECTION_EXPECTED", expectedRejectionCode: "STALE_KNOWLEDGE_RESULT", replayRole: "FAIL_CLOSED",
    parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["ST01R-STALE-KNOWLEDGE-01", "ST01R1-B-STALE-ZEFF-01", "ST01R2-C-STALE-DIFFUSION-01", "stale meta-tests"],
    distinctnessRationale: "Le garde contractuel est nécessairement apparenté, mais le Project, le KnowledgeResult, l'ostéoporose opportuniste, l'outcome fracture et toutes les identités sont nouveaux.", staleExpected: true,
  },
  {
    caseId: "ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01",
    title: "Signature radiomique monocentrique et réponse thérapeutique",
    family: "NO_EVIDENCE_PROMOTION",
    domain: "GENERAL_METHODOLOGY_ONCOLOGY",
    summary: "Ne pas promouvoir une association monocentrique limitée en preuve de biomarqueur prédictif établi.",
    purpose: "Examiner la calibration de certitude et l'absence de promotion de preuve.",
    question: "Chez des adultes avec cancer rectal, une signature radiomique issue d'une petite cohorte monocentrique est-elle associée à la réponse au traitement néoadjuvant ?",
    population: "Adultes avec cancer rectal dans une petite cohorte monocentrique", condition: "Traitement néoadjuvant",
    variables: ["Signature radiomique", "Réponse au traitement néoadjuvant"], methods: ["Radiomique"],
    objective: "Proposer au plus une hypothèse associative candidate avec validation externe manquante.",
    whatSTShouldAddress: ["L'association candidate", "La faiblesse de la preuve", "Le besoin de validation externe"],
    criticalInformationToPreserve: ["Petite cohorte monocentrique", "Absence de validation externe", "Association non causalité"],
    forbidden: ["Déclarer un biomarqueur prédictif validé", "Affirmer une généralisation", "Choisir une conduite thérapeutique"],
    acceptable: ["Hypothèse candidate PARTIAL", "Objectif de validation", "Alternative liée au surapprentissage"],
    statement: "Une association observée dans une petite cohorte monocentrique peut soutenir une hypothèse candidate, mais surapprentissage, sélection, calibration et validation externe limitent toute promotion prédictive.",
    concepts: ["signature radiomique", "réponse néoadjuvante", "validation externe"], sourceRefs: ["PD-011:3.4", "PD-011:10"],
    evidenceRefs: ["fixture-evidence:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01"], gaps: ["EXTERNAL_VALIDATION_MISSING"],
    limitations: ["Petite cohorte monocentrique; validation externe et transportabilité absentes."], contradictions: [], coverageStatus: "PARTIAL",
    expectedExecution: "OWNER_EXECUTION_REQUIRED", parentageStatus: "RELATED_BUT_DISTINCT",
    nearestExposedMaterial: ["ST01R-NEURO-PREDICTION-NONPROMOTION-01", "ST01R1-B-NEURO-GHOST-CORE-01"],
    distinctnessRationale: "Même frontière de non-promotion, mais nouveau cancer, nouvelle signature radiomique, nouvelle faiblesse monocentrique et nouvelle dette de validation externe; aucun neurotrauma ni core d'AVC.",
  },
];

const humanReviewQuestions = (): HumanReviewQuestion[] => [
  { id: "H1", prompt: "La sortie ST traite-t-elle réellement le problème scientifique posé ?", allowedAnswers: ["YES", "PARTIAL", "NO"] },
  { id: "H2", prompt: "Une dimension scientifique importante et soutenue par les inputs manque-t-elle ?", allowedAnswers: ["NO", "POSSIBLE", "YES"] },
  { id: "H3", prompt: "ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ?", allowedAnswers: ["NO", "POSSIBLE", "YES"] },
  { id: "H4", prompt: "Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ?", allowedAnswers: ["YES", "PARTIAL", "NO"] },
  { id: "H5", prompt: "Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ?", allowedAnswers: ["YES", "PARTIAL", "NO", "NOT_APPLICABLE"] },
  { id: "H6", prompt: "ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ?", allowedAnswers: ["YES", "NO"] },
  { id: "H7", prompt: "Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ?", allowedAnswers: ["YES", "PARTIAL", "NO"] },
  { id: "H8", prompt: "Disposition humaine finale du cas", allowedAnswers: ["ACCEPTABLE_WITHIN_TESTED_SCOPE", "ACCEPTABLE_WITH_LIMITATIONS", "CRITICAL_ST_DEFECT", "NON_ADJUDICABLE_REFERENCE_PROBLEM", "HUMAN_UNCERTAIN"] },
];

const authority = {
  actorRef: "w1-qual-01h1:bounded-human-review-author",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const projectChange = (raw: string, item: ProjectObject): PersistentProjectDeltaChange => ({
  operation: "ADD", candidateRef: item.ref, proposedType: item.type, targetSectionId: item.section,
  targetProjectRef: null, semanticIdentity: item.ref, content: item.content, polarity: "AFFIRMED", studyRole: null,
  epistemicStatus: item.epistemic ?? "EXPLICIT_USER_STATED", assertionKind: "USER_STATED", sourceText: raw,
  proposalSourceText: null, evidenceRefs: [],
});

const projectFromSeed = (seed: Seed) => {
  const raw = [seed.question, seed.population, seed.condition, ...seed.variables, ...(seed.methods ?? []), seed.objective, ...(seed.projectUnknowns ?? [])].filter(Boolean).join(" ");
  const objects: ProjectObject[] = [
    { ref: `${seed.caseId}:question`, type: "SCIENTIFIC_QUESTION", section: "ANALYSIS", content: seed.question },
    ...(seed.population ? [{ ref: `${seed.caseId}:population`, type: "POPULATION" as const, section: "POPULATION" as const, content: seed.population }] : []),
    ...(seed.condition ? [{ ref: `${seed.caseId}:condition`, type: "CONDITION" as const, section: "POPULATION" as const, content: seed.condition }] : []),
    ...seed.variables.map((content, index) => ({ ref: `${seed.caseId}:variable:${index + 1}`, type: "CANONICAL_VARIABLE" as const, section: "MEASUREMENTS" as const, content })),
    ...(seed.methods ?? []).map((content, index) => ({ ref: `${seed.caseId}:method:${index + 1}`, type: "IMAGING_MODALITY" as const, section: "IMAGING" as const, content })),
    { ref: `${seed.caseId}:objective`, type: "OBJECTIVE", section: "ANALYSIS", content: seed.objective },
    ...(seed.projectUnknowns ?? []).map((content, index) => ({ ref: `${seed.caseId}:unknown:${index + 1}`, type: "UNCERTAINTY" as const, section: "ANALYSIS" as const, content, epistemic: "UNKNOWN" as const })),
  ];
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${CAMPAIGN_ID}:${seed.caseId}`, language: "fr",
    turns: [{ turnId: `turn:${seed.caseId}`, role: "USER", content: raw, createdAt: AUTHORED_AT }],
  };
  const checked = validatePersistentProjectDelta({ changes: objects.map((item) => projectChange(raw, item)), relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, raw, null, conversation);
  if (checked.validation.blocks.length || !checked.candidate) throw new Error(`H1_PROJECT_INVALID:${seed.caseId}:${checked.validation.blocks.join(",")}`);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation, currentProject: null, createdAt: AUTHORED_AT });
  if (!contribution) throw new Error(`H1_CONTRIBUTION_MISSING:${seed.caseId}`);
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: `project:${CAMPAIGN_ID}:${seed.caseId}`, authority, confirmedAt: AUTHORED_AT });
  return { project, snapshot: buildProjectContextSnapshot({ project }) };
};

const successorFrom = (current: ResearchProjectOwnerProjection, caseId: string) => {
  const raw = "Une nouvelle finalité longitudinale à vingt-quatre mois est explicitement confirmée dans le Project.";
  const at = "2026-08-26T12:01:00.000Z";
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${caseId}:successor`, language: "fr",
    turns: [{ turnId: `turn:${caseId}:successor`, role: "USER", content: raw, createdAt: at }],
  };
  const checked = validatePersistentProjectDelta({ changes: [projectChange(raw, { ref: `${caseId}:successor-context`, type: "STUDY_DESIGN", section: "DESIGN", content: "Finalité longitudinale à vingt-quatre mois" })], relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, raw, current, conversation);
  if (checked.validation.blocks.length || !checked.candidate) throw new Error(`H1_SUCCESSOR_INVALID:${caseId}`);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation, currentProject: current, createdAt: at });
  if (!contribution) throw new Error(`H1_SUCCESSOR_CONTRIBUTION_MISSING:${caseId}`);
  const project = confirmResearchProjectContribution({ contribution, current, projectId: current.projectId, authority, confirmedAt: at });
  return { project, snapshot: buildProjectContextSnapshot({ project }) };
};

const frozenKnowledgeFor = (seed: Seed, snapshot: ProjectContextSnapshot) => {
  const request = buildKnowledgeRequestFromCanonicalSnapshot({ projectSnapshot: snapshot, question: seed.question, createdAt: AUTHORED_AT });
  const resultId = `knowledge-result:${CAMPAIGN_ID}:${seed.caseId}`;
  const assertionId = `knowledge-assertion:${CAMPAIGN_ID}:${seed.caseId}`;
  const resultDigest = logicalDigest({ resultId, requestId: request.requestId, statement: seed.statement, concepts: seed.concepts, limitations: seed.limitations, gaps: seed.gaps, contradictions: seed.contradictions, coverageStatus: seed.coverageStatus });
  const supported = seed.coverageStatus !== "NO_MATCH";
  const nativePayload = {
    resultId, resultRevision: 1, resultDigest, request,
    queryPlan: { queryPlanId: `query-plan:${CAMPAIGN_ID}:${seed.caseId}` },
    registrySnapshotRef: "W1-QUAL-01H1-FROZEN-REFERENCE-REGISTRY@1.0.0",
    providerVersions: { "W1-QUAL-01H1-FROZEN": "1.0.0" }, runtimeStatus: "GOVERNED_DOCUMENTARY",
    coverageStatus: seed.coverageStatus, coverageMap: { items: [], externalResearchRequired: false, digest: logicalDigest(seed.caseId) }, contextStatus: "SUFFICIENT", specificity: "SPECIFIC",
    resolvedConcepts: seed.concepts.map((label, index) => ({ conceptId: `concept:${seed.caseId}:${index + 1}`, preferredLabel: label, originalTerms: [label], kind: "DOCUMENT_BOUND_CONCEPT", objectType: "PHYSIOLOGICAL_CONSTRUCT", providerConcepts: { "W1-QUAL-01H1-FROZEN": [`provider-concept:${seed.caseId}:${index + 1}`] } })),
    unresolvedConcepts: supported ? [] : [...seed.concepts], ambiguities: [],
    applicableAssertions: supported ? [{ stableId: assertionId, revision: "1", providerId: "W1-QUAL-01H1-FROZEN", status: "GOVERNED_DOCUMENTARY", text: seed.statement, atomicContent: { boundedFixture: true }, conceptIds: seed.concepts.map((_item, index) => `concept:${seed.caseId}:${index + 1}`), context: { applicability: "BOUNDED_HUMAN_REVIEW_FIXTURE" }, polarity: "QUALIFIED", evidenceRelations: ["QUALIFIES"], limitations: seed.limitations, reviewStatus: "PREAUTHORED_HUMAN_REVIEW_REFERENCE", locator: seed.sourceRefs[0] ?? `fixture:${seed.caseId}:no-source`, applicability: seed.coverageStatus === "CONFLICTING" ? "CONTRADICTORY_CONTEXT" : "APPLICABLE_WITH_LIMITATIONS", applicabilityReasons: seed.limitations }] : [],
    excludedAssertions: [], documentaryStatements: [], candidateAssertions: [],
    sources: seed.sourceRefs.map((sourceId) => ({ sourceId, revision: "1", title: sourceId, status: "GOVERNED_DOCUMENTARY", locator: sourceId })),
    evidence: supported ? seed.evidenceRefs.map((evidenceId, index) => ({ evidenceId, assertionId, sourceId: seed.sourceRefs[index % Math.max(seed.sourceRefs.length, 1)] ?? `fixture:${seed.caseId}:no-source`, relation: "QUALIFIES", locator: seed.sourceRefs[index % Math.max(seed.sourceRefs.length, 1)] ?? evidenceId, limitations: seed.limitations })) : [],
    applicability: supported ? { [assertionId]: seed.coverageStatus === "CONFLICTING" ? "CONTRADICTORY_CONTEXT" : "APPLICABLE_WITH_LIMITATIONS" } : {},
    synthesis: { text: seed.statement },
    controversies: seed.contradictions.map((explanation, index) => ({ conflictId: `conflict:${seed.caseId}:${index + 1}`, state: "OPEN", explanation })),
    gaps: seed.gaps.map((code, index) => ({ gapId: `gap:${seed.caseId}:${index + 1}`, code, scope: seed.caseId, explanation: code, affectedConceptIds: [], resumeCondition: "Explicit human review or newly admitted evidence; no automatic inference." })),
    limitations: seed.limitations,
    provenance: [{ providerId: "W1-QUAL-01H1-FROZEN", version: "1.0.0", representationDigest: logicalDigest({ sources: seed.sourceRefs, evidence: seed.evidenceRefs }) }],
    freshness: { requirement: "FROZEN_H1_REVIEW_INPUT", corpusStateDate: "2026-08-26" }, consumerHints: [], humanReviewRequirements: ["HUMAN_REVIEW_REQUIRED"], providerExecutions: [],
    trace: { traceId: `knowledge-trace:${seed.caseId}`, engineVersion: KNOWLEDGE_ENGINE_VERSION, events: [], registrySnapshotDigest: logicalDigest("W1-QUAL-01H1-FROZEN-REFERENCE-REGISTRY@1.0.0"), policyRefs: ["INTERNAL_ONLY"], privacy: { transmittedFields: [], redactedFields: [], externalCallMade: false }, digest: logicalDigest({ caseId: seed.caseId, trace: "frozen" }) }, externalEvidence: null,
  } as any as KnowledgeResult;
  const handoff = createSpecializedOwnerHandoffRequestFromSnapshot({ handoffId: `knowledge-handoff:${seed.caseId}`, owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", purpose: `Frozen H1 Knowledge input for ${seed.caseId}.`, sourceProject: snapshot, nativeInputType: "KnowledgeRequest", nativeInputVersion: KNOWLEDGE_ENGINE_VERSION, nativeInput: request });
  const result = recordSpecializedOwnerResult({ request: handoff, resultId, resultVersion: "1", completedAt: AUTHORED_AT, status: supported ? "COMPLETED_WITH_LIMITATIONS" : "REFUSED" as any, resultKind: supported ? "EVIDENCE_DIAGNOSTIC" : "GAP", nativePayloadType: "KnowledgeResult", nativePayloadVersion: KNOWLEDGE_ENGINE_VERSION, nativePayload, stableProjectRefs: snapshot.objects.map((item) => item.stableId), evidenceRefs: [...seed.sourceRefs, ...seed.evidenceRefs], unknowns: supported ? [] : seed.concepts, gaps: seed.gaps.map((code, index) => `gap:${seed.caseId}:${index + 1}:${code}`), limitations: seed.limitations, provenance: [...seed.sourceRefs, ...seed.evidenceRefs, resultDigest] });
  const observation = { contract: "PROJECT_SPINE_03_NATIVE_OWNER_INVOCATION", contractVersion: "0.1.0", invocationId: `knowledge-invocation:${seed.caseId}`, handoffId: handoff.handoffId, owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", ownerRuntimeVersion: KNOWLEDGE_ENGINE_VERSION, sourceProjectRef: snapshot.sourceProjectRef, sourceProjectVersion: snapshot.sourceProjectVersion, sourceProjectDigest: snapshot.sourceProjectDigest, requestRef: request.requestId, resultRef: `${result.resultId}@${result.resultVersion}`, status: supported ? "COMPLETED" : "OWNER_EVIDENCE_GAP", failureCode: null, provenance: [...result.provenance], evidenceRefs: [...result.evidenceRefs], unknowns: [...result.unknowns], gaps: [...result.gaps], limitations: [...result.limitations], startedAt: AUTHORED_AT, completedAt: AUTHORED_AT, latencyMs: 0, runtimeStarts: 0, llmFallbackCalls: 0, projectWrites: 0 } as any;
  const retained = appendProductOwnerInvocation({ ledger: createProductOwnerResultLedger(`session:${CAMPAIGN_ID}:${seed.caseId}`), callerRef: CAMPAIGN_ID, retainedAt: AUTHORED_AT, request: handoff, result, observation, dependencies: [] });
  return { ledger: retained.ledger, result, nativePayload };
};

export const buildAuthoredCampaign = () => {
  const cases: HumanReviewCase[] = [];
  const envelopes: Array<{ caseId: string; envelope: HumanReviewEnvelope }> = [];
  const inputs: FrozenInputPack[] = [];
  for (const seed of seeds) {
    const base = projectFromSeed(seed);
    const knowledge = frozenKnowledgeFor(seed, base.snapshot);
    const executionBinding = seed.staleExpected ? successorFrom(base.project, seed.caseId) : base;
    const ownerResultRef = `${knowledge.result.resultId}@${knowledge.result.resultVersion}`;
    cases.push({
      caseId: seed.caseId, title: seed.title, family: seed.family, domain: seed.domain, summary: seed.summary,
      purpose: seed.purpose, question: seed.question, relevantAssertions: [seed.statement], sourceRefs: seed.sourceRefs,
      evidenceRefs: seed.evidenceRefs, gaps: seed.gaps, limitations: seed.limitations, contradictions: seed.contradictions,
      expectedExecution: seed.expectedExecution, expectedRejectionCode: seed.expectedRejectionCode ?? null,
      replayRole: seed.replayRole ?? null, parentageStatus: seed.parentageStatus,
      nearestExposedMaterial: seed.nearestExposedMaterial, distinctnessRationale: seed.distinctnessRationale,
      authoredBeforeObservation: true,
    });
    envelopes.push({ caseId: seed.caseId, envelope: {
      casePurpose: seed.purpose,
      whatSTShouldAddress: seed.whatSTShouldAddress,
      criticalInformationToPreserve: seed.criticalInformationToPreserve,
      scientificallyForbiddenBehaviors: seed.forbidden,
      acceptableKindsOfResponse: seed.acceptable,
      knownUnknowns: seed.projectUnknowns ?? [],
      knownContradictions: seed.contradictions,
      knownLimitations: seed.limitations,
      referenceRefs: seed.sourceRefs,
      humanReviewQuestions: humanReviewQuestions(),
    } });
    const projectBinding = {
      projectId: executionBinding.snapshot.sourceProjectRef,
      projectVersion: executionBinding.snapshot.sourceProjectVersion,
      projectDigest: executionBinding.snapshot.sourceProjectDigest,
      snapshotRef: executionBinding.snapshot.snapshotDigest,
    };
    const material = {
      version: "1.0.0" as const,
      sourceCase: seed.caseId,
      purpose: seed.purpose,
      projectBinding,
      knowledgeResultBinding: { resultId: knowledge.result.resultId, resultVersion: knowledge.result.resultVersion, resultDigest: knowledge.nativePayload.resultDigest, ownerResultRef },
      provenance: [...seed.sourceRefs, ...seed.evidenceRefs, ownerResultRef, base.snapshot.snapshotDigest],
      sourceRefs: seed.sourceRefs,
      evidenceRefs: seed.evidenceRefs,
      gaps: seed.gaps,
      limitations: seed.limitations,
      contradictions: seed.contradictions,
      controlledStaleRecipe: Boolean(seed.staleExpected),
      payload: { project: executionBinding.project, projectSnapshot: executionBinding.snapshot, ledger: knowledge.ledger, knowledgeResultId: knowledge.result.resultId, knowledgeResultRef: ownerResultRef, knowledgeResultDigest: knowledge.nativePayload.resultDigest },
    };
    inputs.push({ packId: `frozen-input-pack:${seed.caseId}`, ...material, digest: logicalDigest(material), frozen: true });
  }
  return { cases, envelopes, inputs };
};

export const EXPOSED_CORPUS = Object.freeze({
  w1Qual01: ["ST-CARDIAC-01", "ST-SPECTRAL-01", "ST-NEURO-01", "ST-UNSUPPORTED-01"],
  campaignA: ["12 cases in validation/w1-qual-01r-st/case-registry.json"],
  campaignB: ["13 cases in validation/w1-qual-01r1-st/campaign-b/case-registry.json"],
  campaignC: ["13 cases in validation/w1-qual-01r2-st/campaign-c/case-registry.json"],
  repairProbes: ["ST-REPAIR-A", "ST-REPAIR-B", "ST-REPAIR-C", "ST-REPAIR-D", "ST-REPAIR-E", "ST-REPAIR-F", "ST-REPAIR-G", "ST-REPAIR-H"],
  harnessMetaTests: ["Campaign A/B/C harness meta-tests", "R1/R2 stale and terminal controls"],
  existingStTests: [
    "src/features/scientific-thinking/__tests__/contracts.test.ts",
    "src/features/scientific-thinking/__tests__/methodological-cases.test.ts",
    "src/features/scientific-thinking/__tests__/reasoning.test.ts",
    "src/features/scientific-thinking/__tests__/mandatory-cases.test.ts",
    "src/features/scientific-thinking/__tests__/handoff.test.ts",
    "src/features/scientific-thinking/__tests__/w1-scientific-thinking-repair-01-fresh-probes.test.ts",
    "src/features/protocol-designer/functional-reset/__tests__/w1-scientific-thinking-01-product-knowledge-handoff.test.ts",
    "src/features/protocol-designer/functional-reset/__tests__/w1-imaging-01-product-scientific-thinking-handoff.test.ts",
  ],
});
