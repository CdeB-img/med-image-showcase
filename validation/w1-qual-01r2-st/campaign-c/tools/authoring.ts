/* eslint-disable @typescript-eslint/no-explicit-any -- frozen synthetic Knowledge fixtures cross the generic owner boundary */
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
import type {
  FailureClass,
  FirstDivergentStage,
  NegativeExpectationMode,
} from "../../../w1-qual-01r1-st/harness/contracts";
import type { ExpectedExecutionMode } from "../../harness/contracts";
import type {
  EnvelopeObligation,
  EvaluationCaseR2,
  EvaluationEnvelopeR2,
} from "../../harness/evaluator";

export const CAMPAIGN_ID = "W1-QUAL-01R2-ST-2026-08-26-C" as const;
export const AUTHORED_AT = "2026-08-26T09:00:00.000Z" as const;
export const INITIAL_HEAD = "d85f790a0a70de9eadffc8f20ce4196e3c9a61ec" as const;
export const ST_VERSION = "1.2.1" as const;

export type ParentageStatus = "NOVEL" | "RELATED_BUT_DISTINCT" | "TOO_CLOSE" | "EXACT_OR_NEAR_DUPLICATE";

export type CharacterizationCase = EvaluationCaseR2 & {
  coverageClass: string;
  domain: string;
  purpose: string;
  scientificContext: string;
  testedCapabilities: string[];
  frozenProjectRef: string;
  frozenKnowledgeResultRef: string;
  requiredObligations: string[];
  forbiddenBehaviors: string[];
  allowedAlternatives: string[];
  criticalObligations: string[];
  referenceRefs: string[];
  positiveOpportunity: boolean;
  replayPredeclared: boolean;
  replayRole: "POSITIVE" | "CONTRADICTION_OR_ALTERNATIVES" | "EXPECTED_PRE_OWNER_REJECTION" | null;
  parentageStatus: ParentageStatus;
  nearestExposedMaterial: string[];
  distinctnessRationale: string;
  authoredBeforeObservation: true;
};

export type AcceptanceEnvelope = EvaluationEnvelopeR2 & {
  envelopeId: string;
  negativeExpectationMode: NegativeExpectationMode;
  requiredObligations: string[];
  forbiddenBehaviors: string[];
  allowedAlternatives: string[];
  expectedGaps: string[];
  expectedLimitations: string[];
  expectedContradictions: string[];
  criticalObligations: string[];
  referenceRefs: string[];
  authoredBeforeObservation: true;
  mutableAfterObservation: false;
};

export type FrozenInputPack = {
  packId: string;
  version: "2.1.0";
  sourceCase: string;
  provenance: string[];
  purpose: string;
  controlledStaleRecipe: boolean;
  knowledgeGateBinding: { projectId: string; projectVersion: string; projectDigest: string };
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

type CaseSeed = {
  caseId: string;
  coverageClass: string;
  domain: string;
  question: string | null;
  population?: string;
  condition?: string;
  variables: string[];
  methods?: string[];
  objective?: string;
  unknowns?: string[];
  purpose: string;
  testedCapabilities: string[];
  negativeExpectationMode: NegativeExpectationMode;
  expectedExecutionMode: ExpectedExecutionMode;
  expectedRejectionCodes?: string[];
  coverageStatus: "PARTIAL" | "CONFLICTING" | "NO_MATCH";
  statement: string;
  concepts: string[];
  limitation: string;
  gapCode?: string;
  controversy?: string;
  referenceRefs: string[];
  positiveOpportunity: boolean;
  mechanisticObligation?: boolean;
  alternativesObligation?: boolean;
  replayRole?: CharacterizationCase["replayRole"];
  parentageStatus: ParentageStatus;
  nearestExposedMaterial: string[];
  distinctnessRationale: string;
  staleExpected?: boolean;
};

const authority = {
  actorRef: "w1-qual-01r2-st:campaign-c-author",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const seeds: CaseSeed[] = [
  {
    caseId: "ST01R2-C-VNCA-EDEMA-01", coverageClass: "C01_SUPPORTED_CANDIDATE", domain: "SPECTRAL_CT_MUSCULOSKELETAL",
    question: "Chez des adultes avec traumatisme vertébral occulte, un signal positif en Virtual Non-Calcium est-il associé à un œdème médullaire défini sur une référence IRM indépendante ?",
    population: "Adultes avec traumatisme vertébral occulte", condition: "Traumatisme vertébral", variables: ["Signal Virtual Non-Calcium", "Œdème médullaire sur référence IRM"], methods: ["Dual-energy CT Virtual Non-Calcium"],
    objective: "Formuler une association candidate bornée par la référence et la densité minérale.", purpose: "Tester une génération candidate soutenue sur VNCa et une référence indépendante.",
    testedCapabilities: ["supported candidate reasoning", "reference fidelity", "non-promotion"], negativeExpectationMode: "CANDIDATE_REQUIRED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "PARTIAL",
    statement: "Le VNCa peut rendre visible un œdème médullaire, mais sa performance dépend de la densité minérale, de la région, du métal et de la référence IRM.", concepts: ["VNCa", "œdème médullaire", "référence IRM"],
    limitation: "Une détection accrue ne transforme pas le VNCa en substitut universel de l'IRM.", referenceRefs: ["RB-003@1.0:section-27-VNCa", "RB-003@1.0:R15"], positiveOpportunity: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign B VMI and iodine cases"], distinctnessRationale: "Nouvel output VNCa, nouvelle population traumatique, nouveau tissu cible et nouvelle référence; aucune carte d'iode, VMI ou décomposition rénale.",
  },
  {
    caseId: "ST01R2-C-URATE-RECURRENCE-01", coverageClass: "C02_PREDICTIVE_ASSOCIATIVE", domain: "SPECTRAL_CT_RHEUMATOLOGY",
    question: "Chez des adultes avec goutte traitée, le volume de dépôts d'urate en dual-energy CT est-il associé à la récidive clinique au suivi ?",
    population: "Adultes avec goutte traitée", condition: "Goutte", variables: ["Volume de dépôts d'urate", "Récidive clinique au suivi"], methods: ["Dual-energy CT"],
    objective: "Ramener une prétention pronostique à une association longitudinale candidate.", purpose: "Tester le raisonnement prédictif sans performance ni causalité inventée.",
    testedCapabilities: ["predictive associative reasoning", "longitudinal candidate", "evidence promotion safety"], negativeExpectationMode: "CANDIDATE_REQUIRED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "PARTIAL",
    statement: "La détection de dépôts d'urate a une exactitude contextuelle, mais le corpus figé n'établit pas une performance universelle pour la récidive après traitement.", concepts: ["dépôt d'urate", "volume DECT", "récidive"],
    limitation: "Aucune performance prédictive individuelle ou règle thérapeutique n'est démontrée.", gapCode: "MISSING_OUTCOME_VALIDATION", referenceRefs: ["RB-003@1.0:section-63-musculoskeletal", "RB-003@1.0:R51"], positiveOpportunity: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign A/B predictive controls"], distinctnessRationale: "Nouvelle maladie rhumatologique, nouveau matériau urate, temporalité post-traitement et outcome de récidive.",
  },
  {
    caseId: "ST01R2-C-PCCT-CROSSTALK-01", coverageClass: "C03_MECHANISTIC_EXPLANATORY", domain: "PHOTON_COUNTING_CROSSTALK",
    question: "Dans des phantoms à petits inserts, le cross-talk spatio-énergétique est-il associé à une perte d'indépendance des bins et à un biais de détectabilité ?",
    population: "Phantoms à petits inserts", variables: ["Cross-talk spatio-énergétique", "Indépendance des bins", "Détectabilité"], methods: ["Photon-counting CT"],
    objective: "Représenter une relation explicative candidate entre interaction interpixel et sortie de tâche.", purpose: "Tester un mécanisme physique distinct avec lien explicatif inspectable.",
    testedCapabilities: ["mechanistic explanatory reasoning", "falsifiability", "measurement boundary"], negativeExpectationMode: "CANDIDATE_REQUIRED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "PARTIAL",
    statement: "Le cross-talk peut coupler pixels ou canaux voisins et dégrader l'indépendance spatiale et spectrale selon le détecteur et le traitement.", concepts: ["cross-talk", "bins énergétiques", "détectabilité"],
    limitation: "L'effet dépend du détecteur, du flux et des corrections; aucune magnitude universelle n'est établie.", referenceRefs: ["RB-003@1.0:section-38-cross-talk", "RB-003@1.0:R33"], positiveOpportunity: true, mechanisticObligation: true, replayRole: "POSITIVE",
    parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["Campaign B charge-sharing mechanism"], distinctnessRationale: "Le voisin le plus proche porte sur le partage de charge et le classement énergétique; C cible le couplage spatio-énergétique interpixel et la détectabilité de petits objets.",
  },
  {
    caseId: "ST01R2-C-STRAIN-ALGORITHMS-01", coverageClass: "C04_MULTIPLE_ALTERNATIVES", domain: "CARDIAC_MRI_STRAIN",
    question: "Chez des adultes avec cardiomyopathie, une différence de strain longitudinal entre logiciels est-elle associée à l'algorithme de feature tracking plutôt qu'à une évolution biologique ?",
    population: "Adultes avec cardiomyopathie", condition: "Cardiomyopathie", variables: ["Strain longitudinal", "Logiciel de feature tracking", "Évolution biologique"], methods: ["CMR feature tracking"],
    objective: "Conserver des explications technique et biologique concurrentes.", purpose: "Tester plusieurs alternatives sans sélectionner automatiquement une cause.",
    testedCapabilities: ["multiple alternatives", "technical versus biological explanation", "no causal selection"], negativeExpectationMode: "CANDIDATE_REQUIRED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "CONFLICTING",
    statement: "Le strain par feature tracking dépend du logiciel, du contour, de la qualité et de la reproductibilité; une différence longitudinale peut être technique ou biologique.", concepts: ["strain longitudinal", "feature tracking", "variabilité logicielle"],
    limitation: "Aucune interchangeabilité logicielle ni causalité biologique automatique n'est établie.", controversy: "Une variation observée peut refléter un changement biologique, un algorithme ou leurs interactions.", referenceRefs: ["RB-004@1.1:feature-tracking-reproducibility", "RB-004@1.1:R42"], positiveOpportunity: true, alternativesObligation: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["No exposed strain case"], distinctnessRationale: "Nouveaux objets mécaniques, nouvelle classe logicielle et nouvelle distinction changement biologique/algorithme.",
  },
  {
    caseId: "ST01R2-C-FOURD-FLOW-ALIASING-01", coverageClass: "C05_CONTRADICTION_PRESERVATION", domain: "CARDIAC_MRI_FLOW",
    question: "Chez des adultes avec flux valvulaire complexe, une vitesse de pointe plus élevée en 4D Flow est-elle associée à un meilleur échantillonnage du jet ou à un biais d'aliasing et de correction de phase ?",
    population: "Adultes avec flux valvulaire complexe", condition: "Flux valvulaire complexe", variables: ["Vitesse de pointe 4D Flow", "Échantillonnage du jet", "Aliasing", "Correction de phase"], methods: ["4D Flow MRI"],
    objective: "Préserver des interprétations concurrentes d'une différence de vitesse.", purpose: "Tester contradiction, alternatives et limites de mesure de flux.",
    testedCapabilities: ["contradiction preservation", "competing explanations", "measurement uncertainty"], negativeExpectationMode: "CANDIDATE_REQUIRED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "CONFLICTING",
    statement: "Une vitesse différente peut dépendre de l'échantillonnage spatial et temporel, du VENC, de l'aliasing, des courants de Foucault et des corrections de phase.", concepts: ["4D Flow", "VENC", "aliasing", "correction de phase"],
    limitation: "La valeur la plus élevée n'est pas automatiquement la mesure la plus exacte.", controversy: "Meilleur échantillonnage du jet et biais de phase restent deux explications concurrentes à départager.", referenceRefs: ["RB-004@1.1:4D-flow-errors-and-validation"], positiveOpportunity: true, alternativesObligation: true, replayRole: "CONTRADICTION_OR_ALTERNATIVES",
    parentageStatus: "NOVEL", nearestExposedMaterial: ["No exposed flow case"], distinctnessRationale: "Nouveau domaine de vitesse, nouvelles erreurs de phase et aucun mapping tissulaire ou perfusion cérébrale.",
  },
  {
    caseId: "ST01R2-C-CARDIAC-DTI-HELIX-01", coverageClass: "C06_NARROW_APPLICABILITY", domain: "CARDIAC_DIFFUSION",
    question: "Chez des volontaires sains à fréquence cardiaque contrôlée, l'angle d'hélice estimé en diffusion cardiaque est-il comparable entre séquences et champs sans harmonisation spécifique ?",
    population: "Volontaires sains à fréquence cardiaque contrôlée", variables: ["Angle d'hélice estimé", "Séquence de diffusion", "Champ magnétique"], methods: ["Diffusion tensor cardiac MRI"],
    objective: "Conserver une applicabilité étroite et refuser une transférabilité automatique.", purpose: "Tester une qualification bornée dans une chaîne de diffusion cardiaque.",
    testedCapabilities: ["narrow applicability", "comparison", "no automatic transfer"], negativeExpectationMode: "CANDIDATE_REQUIRED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "PARTIAL",
    statement: "La diffusion cardiaque et l'angle d'hélice dépendent de la séquence, du mouvement, du champ et du modèle de tenseur.", concepts: ["diffusion cardiaque", "angle d'hélice", "harmonisation"],
    limitation: "La comparabilité doit être démontrée pour chaque chaîne; aucune plage universelle n'est transférée.", referenceRefs: ["RB-004@1.1:cardiac-diffusion-and-tensor-boundary"], positiveOpportunity: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign B T1 field transfer"], distinctnessRationale: "Nouvelle physique de diffusion, nouvelle géométrie microstructurale et nouveau mesurande; pas de T1 ni de relaxation.",
  },
  {
    caseId: "ST01R2-C-CVR-CO2-01", coverageClass: "C07_CONDITIONAL_CANDIDATE", domain: "NEURO_CEREBROVASCULAR_REACTIVITY",
    question: "Chez des adultes avec sténose carotidienne, une réactivité cérébrovasculaire réduite sous CO2 est-elle associée à une réserve hémodynamique altérée lorsque le stimulus exact est inconnu ?",
    population: "Adultes avec sténose carotidienne", condition: "Sténose carotidienne", variables: ["Réactivité cérébrovasculaire", "Réserve hémodynamique", "Stimulus CO2"], methods: ["IRM de réactivité cérébrovasculaire"],
    unknowns: ["Concentration, administration et réponse physiologique au stimulus CO2 inconnues"], objective: "Autoriser au plus un candidat conditionnel qui conserve le stimulus inconnu.", purpose: "Tester une proposition conditionnelle sans remplacer l'inconnue par une valeur plausible.",
    testedCapabilities: ["conditional candidate", "unknown preservation", "no imputation"], negativeExpectationMode: "CONDITIONAL_CANDIDATE_ALLOWED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "PARTIAL",
    statement: "La réactivité dépend du stimulus, de la réponse systémique, de l'état de base et de la méthode; un stimulus non caractérisé limite l'interprétation.", concepts: ["réactivité cérébrovasculaire", "CO2", "réserve hémodynamique"],
    limitation: "La concentration et la réponse au stimulus restent inconnues; aucune valeur n'est imputée.", gapCode: "MISSING_STIMULUS_CHARACTERIZATION", referenceRefs: ["RB-005@1.0:section-16-cerebrovascular-reactivity", "RB-005@1.0:R60"], positiveOpportunity: false,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign A Project-unknown conditional case"], distinctnessRationale: "L'inconnue porte sur un stimulus physiologique mesurable dans un nouveau domaine CVR, non sur l'absence de question Project.",
  },
  {
    caseId: "ST01R2-C-DECONVOLUTION-DELAY-01", coverageClass: "C08_EVIDENCE_PROMOTION_SAFETY", domain: "NEURO_DECONVOLUTION",
    question: "Chez des adultes avec occlusion chronique, une méthode de déconvolution dite delay-insensitive est-elle associée à une estimation du CBF indépendante de toute physiologie de délai ?",
    population: "Adultes avec occlusion chronique", condition: "Occlusion chronique", variables: ["Déconvolution delay-insensitive", "CBF estimé", "Physiologie de délai"], methods: ["Perfusion par bolus"],
    objective: "Refuser la promotion d'une robustesse algorithmique en indépendance physiologique.", purpose: "Tester la sécurité épistémique et la conservation d'une qualification méthodologique.",
    testedCapabilities: ["evidence promotion safety", "algorithm versus physiology", "bounded candidate"], negativeExpectationMode: "CANDIDATE_REQUIRED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "CONFLICTING",
    statement: "Une méthode delay-insensitive réduit une dépendance algorithmique au décalage sans rendre la physiologie insensible au délai; la régularisation stabilise au prix d'un biais.", concepts: ["déconvolution", "délai", "CBF", "régularisation"],
    limitation: "Aucune indépendance physiologique totale ni absence de biais n'est établie.", controversy: "La robustesse au décalage algorithmique ne supprime pas les effets physiologiques de délai et de dispersion.", referenceRefs: ["RB-005@1.0:section-24-deconvolution"], positiveOpportunity: true, alternativesObligation: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign B ASL transit"], distinctnessRationale: "Nouveau problème inverse par bolus, nouvelle régularisation et nouvelle frontière algorithme/physiologie; pas de PLD ou traceur endogène.",
  },
  {
    caseId: "ST01R2-C-CAPILLARY-HETEROGENEITY-01", coverageClass: "C09_MECHANISTIC_ALTERNATIVES", domain: "NEURO_MICROCIRCULATION",
    question: "Dans des tissus ayant le même CBF moyen, une hétérogénéité accrue des temps de transit capillaire est-elle associée à une extraction d'oxygène différente ?",
    population: "Tissus avec CBF moyen comparable", variables: ["Hétérogénéité des temps de transit capillaire", "Extraction d'oxygène"],
    objective: "Proposer une relation mécanistique candidate sans la transformer en fait humain in vivo.", purpose: "Tester mécanisme, alternative et limite de l'observation macroscopique.",
    testedCapabilities: ["mechanistic explanatory reasoning", "micro versus macro boundary", "alternatives"], negativeExpectationMode: "CANDIDATE_REQUIRED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "PARTIAL",
    statement: "L'extraction dépend du temps de contact, de la surface d'échange, de la diffusion et de la distribution des vitesses capillaires; un CBF moyen identique n'impose pas une extraction identique.", concepts: ["hétérogénéité capillaire", "CBF moyen", "extraction d'oxygène"],
    limitation: "L'observation humaine in vivo de ces mécanismes reste partielle et dépend du modèle.", referenceRefs: ["RB-005@1.0:section-32-capillary-heterogeneity"], positiveOpportunity: true, mechanisticObligation: true, alternativesObligation: true,
    parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["Campaign A OEF/CMRO2"], distinctnessRationale: "Le nouveau cas compare deux tissus à CBF égal via la distribution microvasculaire; A portait sur compensation OEF et dérivation CMRO2.",
  },
  {
    caseId: "ST01R2-C-INSUFFICIENT-RELATION-01", coverageClass: "C10_INSUFFICIENT_EVIDENCE", domain: "CARDIAC_FLOW_EXPLORATORY",
    question: "Explorer sans objectif des trajectoires de flux intracardiaque.", variables: ["Trajectoires de flux intracardiaque"], methods: ["4D Flow MRI"],
    purpose: "Conserver l'absence de relation, population et finalité comme besoin de clarification.", testedCapabilities: ["insufficient evidence", "clarification", "no forced candidate"],
    negativeExpectationMode: "CLARIFICATION_OR_GAP_EXPECTED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "NO_MATCH",
    statement: "Aucune relation, population, comparateur ou finalité testable n'est définie pour ces trajectoires.", concepts: ["trajectoire de flux"], limitation: "Une sortie scientifique forte serait artificielle sans question testable.",
    gapCode: "MISSING_TESTABLE_RELATION", referenceRefs: ["RDE-002:Knowledge-to-ST-preconditions", "PD-011:honest-stop"], positiveOpportunity: false,
    parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["Campaign B insufficient density target"], distinctnessRationale: "La structure d'arrêt est un contrôle nécessaire, mais l'objet de flux, la méthode, le vocabulaire et la relation manquante sont nouveaux.",
  },
  {
    caseId: "ST01R2-C-PROJECT-COMPARATOR-UNKNOWN-01", coverageClass: "C11_PROJECT_UNKNOWN", domain: "SPECTRAL_CT_LIVER",
    question: null, population: "Adultes avec lésion hépatique indéterminée", condition: "Lésion hépatique indéterminée", variables: ["Pente de courbe spectrale", "Comparateur histologique inconnu"], methods: ["Spectral CT"],
    unknowns: ["Le comparateur de référence du Project n'est pas adopté"], purpose: "Chez des adultes avec lésion hépatique indéterminée, la pente de courbe spectrale est-elle associée à un comparateur de référence encore inconnu ?",
    testedCapabilities: ["Project unknown", "conditional candidate", "unknown preservation"], negativeExpectationMode: "CONDITIONAL_CANDIDATE_ALLOWED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "PARTIAL",
    statement: "Les courbes spectrales sont des sorties dérivées dont l'interprétation dépend du protocole, de la phase et d'une référence adaptée au construit.", concepts: ["pente spectrale", "lésion hépatique", "comparateur"],
    limitation: "Le comparateur reste inconnu; aucun diagnostic ou objectif Project n'est adopté automatiquement.", gapCode: "PROJECT_REFERENCE_COMPARATOR_UNKNOWN", referenceRefs: ["RB-003@1.0:section-28-spectral-curves", "Manifesto-V2:candidate-not-adopted"], positiveOpportunity: false,
    parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["Campaign A/B Project unknown controls"], distinctnessRationale: "L'inconnue Project est ici le comparateur de référence d'une sortie spectrale hépatique, non la question scientifique elle-même ou un outcome cardiaque.",
  },
  {
    caseId: "ST01R2-C-OUT-OF-OWNER-ACCOUNTING-01", coverageClass: "C12_OUT_OF_OWNER", domain: "ADMINISTRATIVE_ACCOUNTING",
    question: "La comptabilité doit-elle choisir automatiquement le tarif de remboursement d'un examen d'imagerie ?", variables: ["Tarif de remboursement"],
    purpose: "Tester le refus d'une demande comptable et décisionnelle hors Scientific Thinking.", testedCapabilities: ["out-of-owner refusal", "zero candidate", "zero adoption"],
    negativeExpectationMode: "STRICT_NO_CANDIDATE_EXPECTED", expectedExecutionMode: "OWNER_EXECUTION_REQUIRED", coverageStatus: "NO_MATCH",
    statement: "La fixation comptable ou réglementaire d'un tarif ne relève pas du raisonnement scientifique candidat en imagerie.", concepts: ["comptabilité", "tarif de remboursement"],
    limitation: "Aucune décision financière, réglementaire ou Project ne peut être produite par ST.", gapCode: "OUT_OF_SCIENTIFIC_THINKING_OWNER", referenceRefs: ["RDE-001:ST-owner-boundary", "PD-003-V2:ownership"], positiveOpportunity: false,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign A DICOM pipeline", "Campaign B software release", "repair marketing probe"], distinctnessRationale: "Nouvelle frontière financière/comptable, sans pipeline, code, marketing, linguistique ou infrastructure.",
  },
  {
    caseId: "ST01R2-C-STALE-DIFFUSION-01", coverageClass: "C13_EXPECTED_PRE_OWNER_STALE", domain: "CARDIAC_DIFFUSION_STALE",
    question: "Chez des adultes avec cardiomyopathie hypertrophique, l'anisotropie de diffusion est-elle associée à l'évolution fonctionnelle au suivi ?",
    population: "Adultes avec cardiomyopathie hypertrophique", condition: "Cardiomyopathie hypertrophique", variables: ["Anisotropie de diffusion", "Évolution fonctionnelle au suivi"], methods: ["Diffusion cardiac MRI"],
    objective: "Rejeter avant ST un KnowledgeResult figé sur la version précédente du Project.", purpose: "Tester un nouveau rejet stale qualifiant sans OwnerResult.",
    testedCapabilities: ["expected pre-owner rejection", "stale protection", "zero side effect"], negativeExpectationMode: "STRICT_NO_CANDIDATE_EXPECTED", expectedExecutionMode: "PRE_OWNER_REJECTION_EXPECTED", expectedRejectionCodes: ["STALE_KNOWLEDGE_RESULT"], coverageStatus: "PARTIAL",
    statement: "L'anisotropie de diffusion cardiaque est dépendante de la séquence, du mouvement et du modèle; sa relation au suivi reste contextuelle.", concepts: ["anisotropie de diffusion", "cardiomyopathie hypertrophique", "évolution fonctionnelle"],
    limitation: "Le KnowledgeResult appartient intentionnellement à Project vN et ne peut être converti pour vN+1.", referenceRefs: ["RB-004@1.1:cardiac-diffusion-boundary", "RDE-002:stale-protection"], positiveOpportunity: false, staleExpected: true, replayRole: "EXPECTED_PRE_OWNER_REJECTION",
    parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["Campaign A/B stale controls"], distinctnessRationale: "Le mécanisme de garde est nécessairement apparenté, mais l'identité, le Project, le KnowledgeResult, le domaine de diffusion et la relation scientifique sont entièrement nouveaux.",
  },
];

const projectChange = (raw: string, item: ProjectObject): PersistentProjectDeltaChange => ({
  operation: "ADD", candidateRef: item.ref, proposedType: item.type, targetSectionId: item.section,
  targetProjectRef: null, semanticIdentity: item.ref, content: item.content, polarity: "AFFIRMED", studyRole: null,
  epistemicStatus: item.epistemic ?? "EXPLICIT_USER_STATED", assertionKind: "USER_STATED", sourceText: raw,
  proposalSourceText: null, evidenceRefs: [],
});

const projectFromSeed = (seed: CaseSeed) => {
  const raw = [seed.question, seed.population, seed.condition, ...seed.variables, ...(seed.methods ?? []), seed.objective, ...(seed.unknowns ?? [])].filter(Boolean).join(" ");
  const objects: ProjectObject[] = [
    ...(seed.question ? [{ ref: `${seed.caseId}:question`, type: "SCIENTIFIC_QUESTION" as const, section: "ANALYSIS" as const, content: seed.question }] : []),
    ...(seed.population ? [{ ref: `${seed.caseId}:population`, type: "POPULATION" as const, section: "POPULATION" as const, content: seed.population }] : []),
    ...(seed.condition ? [{ ref: `${seed.caseId}:condition`, type: "CONDITION" as const, section: "POPULATION" as const, content: seed.condition }] : []),
    ...seed.variables.map((content, index) => ({ ref: `${seed.caseId}:variable:${index + 1}`, type: "CANONICAL_VARIABLE" as const, section: "MEASUREMENTS" as const, content })),
    ...(seed.methods ?? []).map((content, index) => ({ ref: `${seed.caseId}:method:${index + 1}`, type: "IMAGING_MODALITY" as const, section: "IMAGING" as const, content })),
    ...(seed.objective ? [{ ref: `${seed.caseId}:objective`, type: "OBJECTIVE" as const, section: "ANALYSIS" as const, content: seed.objective }] : []),
    ...(seed.unknowns ?? []).map((content, index) => ({ ref: `${seed.caseId}:unknown:${index + 1}`, type: "UNCERTAINTY" as const, section: "ANALYSIS" as const, content, epistemic: "UNKNOWN" as const })),
  ];
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${CAMPAIGN_ID}:${seed.caseId}`, language: "fr",
    turns: [{ turnId: `turn:${seed.caseId}`, role: "USER", content: raw, createdAt: AUTHORED_AT }],
  };
  const checked = validatePersistentProjectDelta({ changes: objects.map((item) => projectChange(raw, item)), relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, raw, null, conversation);
  if (checked.validation.blocks.length || !checked.candidate) throw new Error(`CAMPAIGN_C_PROJECT_INVALID:${seed.caseId}:${checked.validation.blocks.join(",")}`);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation, currentProject: null, createdAt: AUTHORED_AT });
  if (!contribution) throw new Error(`CAMPAIGN_C_CONTRIBUTION_MISSING:${seed.caseId}`);
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: `project:${CAMPAIGN_ID}:${seed.caseId}`, authority, confirmedAt: AUTHORED_AT });
  return { project, snapshot: buildProjectContextSnapshot({ project }) };
};

const successorFrom = (current: ResearchProjectOwnerProjection, caseId: string) => {
  const raw = "Un suivi multicentrique à douze mois est explicitement confirmé comme nouveau contexte Project.";
  const at = "2026-08-26T09:01:00.000Z";
  const conversation: ScientificInterpretationConversation = { conversationId: `conversation:${caseId}:successor`, language: "fr", turns: [{ turnId: `turn:${caseId}:successor`, role: "USER", content: raw, createdAt: at }] };
  const checked = validatePersistentProjectDelta({ changes: [projectChange(raw, { ref: `${caseId}:successor-context`, type: "STUDY_DESIGN", section: "DESIGN", content: "Suivi multicentrique à douze mois" })], relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, raw, current, conversation);
  if (checked.validation.blocks.length || !checked.candidate) throw new Error(`CAMPAIGN_C_SUCCESSOR_INVALID:${caseId}`);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation, currentProject: current, createdAt: at });
  if (!contribution) throw new Error(`CAMPAIGN_C_SUCCESSOR_CONTRIBUTION_MISSING:${caseId}`);
  const project = confirmResearchProjectContribution({ contribution, current, projectId: current.projectId, authority, confirmedAt: at });
  return { project, snapshot: buildProjectContextSnapshot({ project }) };
};

const frozenKnowledgeFor = (seed: CaseSeed, snapshot: ProjectContextSnapshot) => {
  const request = buildKnowledgeRequestFromCanonicalSnapshot({ projectSnapshot: snapshot, question: seed.question ?? seed.purpose, createdAt: AUTHORED_AT });
  const resultId = `knowledge-result:${CAMPAIGN_ID}:${seed.caseId}`;
  const assertionId = `knowledge-assertion:${CAMPAIGN_ID}:${seed.caseId}`;
  const evidenceId = `knowledge-evidence:${CAMPAIGN_ID}:${seed.caseId}`;
  const sourceId = seed.referenceRefs[0];
  const resultDigest = logicalDigest({ resultId, requestId: request.requestId, statement: seed.statement, concepts: seed.concepts, limitation: seed.limitation, coverageStatus: seed.coverageStatus, controversy: seed.controversy ?? null });
  const supported = seed.coverageStatus !== "NO_MATCH";
  const nativePayload = {
    resultId, resultRevision: 1, resultDigest, request,
    queryPlan: { queryPlanId: `query-plan:${seed.caseId}` }, registrySnapshotRef: "W1-QUAL-01R2-CAMPAIGN-C-FROZEN-REGISTRY@1.0.0", providerVersions: { "W1-QUAL-01R2-FROZEN": "1.0.0" }, runtimeStatus: "GOVERNED_DOCUMENTARY",
    coverageStatus: seed.coverageStatus, coverageMap: { items: [], externalResearchRequired: false, digest: logicalDigest(seed.caseId) }, contextStatus: "SUFFICIENT", specificity: "SPECIFIC",
    resolvedConcepts: seed.concepts.map((label, index) => ({ conceptId: `concept:${seed.caseId}:${index + 1}`, preferredLabel: label, originalTerms: [label], kind: "DOCUMENT_BOUND_CONCEPT", objectType: "PHYSIOLOGICAL_CONSTRUCT", providerConcepts: { "W1-QUAL-01R2-FROZEN": [`provider-concept:${seed.caseId}:${index + 1}`] } })),
    unresolvedConcepts: supported ? [] : [...seed.concepts], ambiguities: [],
    applicableAssertions: supported ? [{ stableId: assertionId, revision: "1", providerId: "W1-QUAL-01R2-FROZEN", status: "GOVERNED_DOCUMENTARY", text: seed.statement, atomicContent: { boundedFixture: true }, conceptIds: seed.concepts.map((_item, index) => `concept:${seed.caseId}:${index + 1}`), context: { applicability: "BOUNDED_INDEPENDENT_CHARACTERIZATION" }, polarity: "QUALIFIED", evidenceRelations: ["QUALIFIES"], limitations: [seed.limitation], reviewStatus: "AUTHORED_REFERENCE_FIXTURE", locator: sourceId, applicability: seed.coverageStatus === "CONFLICTING" ? "CONTRADICTORY_CONTEXT" : "APPLICABLE_WITH_LIMITATIONS", applicabilityReasons: [seed.limitation] }] : [],
    excludedAssertions: [], documentaryStatements: [], candidateAssertions: [],
    sources: supported ? [{ sourceId, revision: "1", title: sourceId, status: "GOVERNED_DOCUMENTARY", locator: sourceId }] : [],
    evidence: supported ? [{ evidenceId, assertionId, sourceId, relation: "QUALIFIES", locator: sourceId, limitations: [seed.limitation] }] : [],
    applicability: supported ? { [assertionId]: seed.coverageStatus === "CONFLICTING" ? "CONTRADICTORY_CONTEXT" : "APPLICABLE_WITH_LIMITATIONS" } : {}, synthesis: { text: seed.statement },
    controversies: seed.controversy ? [{ conflictId: `conflict:${seed.caseId}`, state: "OPEN", explanation: seed.controversy }] : [],
    gaps: seed.gapCode ? [{ gapId: `gap:${seed.caseId}:${seed.gapCode}`, code: seed.gapCode, scope: seed.caseId, explanation: supported ? "Critical context remains missing." : "No admitted evidence supports a scientific candidate for this request.", affectedConceptIds: [], resumeCondition: "Human review with an admitted source; no automatic inference." }] : [],
    limitations: [seed.limitation], provenance: [{ providerId: "W1-QUAL-01R2-FROZEN", version: "1.0.0", representationDigest: logicalDigest(seed.referenceRefs) }],
    freshness: { requirement: "FROZEN_CHARACTERIZATION_INPUT", corpusStateDate: "2026-08-26" }, consumerHints: [], humanReviewRequirements: ["HUMAN_REVIEW_REQUIRED"], providerExecutions: [],
    trace: { traceId: `knowledge-trace:${seed.caseId}`, engineVersion: KNOWLEDGE_ENGINE_VERSION, events: [], registrySnapshotDigest: logicalDigest("W1-QUAL-01R2-CAMPAIGN-C-FROZEN-REGISTRY@1.0.0"), policyRefs: ["INTERNAL_ONLY"], privacy: { transmittedFields: [], redactedFields: [], externalCallMade: false }, digest: logicalDigest({ caseId: seed.caseId, trace: "frozen" }) }, externalEvidence: null,
  } as any as KnowledgeResult;
  const handoff = createSpecializedOwnerHandoffRequestFromSnapshot({ handoffId: `knowledge-handoff:${seed.caseId}`, owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", purpose: `Frozen Knowledge input for ${seed.caseId}.`, sourceProject: snapshot, nativeInputType: "KnowledgeRequest", nativeInputVersion: KNOWLEDGE_ENGINE_VERSION, nativeInput: request });
  const result = recordSpecializedOwnerResult({ request: handoff, resultId, resultVersion: "1", completedAt: AUTHORED_AT, status: supported ? "COMPLETED_WITH_LIMITATIONS" : "REFUSED" as any, resultKind: supported ? "EVIDENCE_DIAGNOSTIC" : "GAP", nativePayloadType: "KnowledgeResult", nativePayloadVersion: KNOWLEDGE_ENGINE_VERSION, nativePayload, stableProjectRefs: snapshot.objects.map((item) => item.stableId), evidenceRefs: supported ? [sourceId, evidenceId] : [], unknowns: supported ? [] : seed.concepts, gaps: seed.gapCode ? [`gap:${seed.caseId}:${seed.gapCode}`] : [], limitations: [seed.limitation], provenance: [...seed.referenceRefs, resultDigest] });
  const observation = { contract: "PROJECT_SPINE_03_NATIVE_OWNER_INVOCATION", contractVersion: "0.1.0", invocationId: `knowledge-invocation:${seed.caseId}`, handoffId: handoff.handoffId, owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", ownerRuntimeVersion: KNOWLEDGE_ENGINE_VERSION, sourceProjectRef: snapshot.sourceProjectRef, sourceProjectVersion: snapshot.sourceProjectVersion, sourceProjectDigest: snapshot.sourceProjectDigest, requestRef: request.requestId, resultRef: `${result.resultId}@${result.resultVersion}`, status: supported ? "COMPLETED" : "OWNER_EVIDENCE_GAP", failureCode: null, provenance: [...result.provenance], evidenceRefs: [...result.evidenceRefs], unknowns: [...result.unknowns], gaps: [...result.gaps], limitations: [...result.limitations], startedAt: AUTHORED_AT, completedAt: AUTHORED_AT, latencyMs: 0, runtimeStarts: 0, llmFallbackCalls: 0, projectWrites: 0 } as any;
  const retained = appendProductOwnerInvocation({ ledger: createProductOwnerResultLedger(`session:${CAMPAIGN_ID}:${seed.caseId}`), callerRef: CAMPAIGN_ID, retainedAt: AUTHORED_AT, request: handoff, result, observation, dependencies: [] });
  return { ledger: retained.ledger, result, nativePayload };
};

const obligation = (caseId: string, checkId: string, critical: boolean, statement: string, failureClass: FailureClass, firstDivergentStage: FirstDivergentStage, refs: string[]): EnvelopeObligation => ({
  obligationId: `${caseId}:${checkId}`, checkId, critical, statement, failureClass, firstDivergentStage, referenceRefs: refs,
});

export const buildAuthoredCampaign = () => {
  const cases: CharacterizationCase[] = [];
  const envelopes: AcceptanceEnvelope[] = [];
  const inputs: FrozenInputPack[] = [];
  for (const seed of seeds) {
    const base = projectFromSeed(seed);
    const knowledge = frozenKnowledgeFor(seed, base.snapshot);
    const executionBinding = seed.staleExpected ? successorFrom(base.project, seed.caseId) : base;
    const expectedGaps = seed.gapCode ? [seed.gapCode] : [];
    const expectedLimitations = [seed.limitation];
    const expectedContradictions = seed.controversy ? [seed.controversy] : [];
    const obligations = [
      obligation(seed.caseId, "PROJECT_IDENTITY", true, "Preserve exact canonical Project tuple or reject the pre-authored stale binding.", "LINEAGE_BREAK", "ST_OWNER_RESULT_PACKAGING", seed.referenceRefs),
      obligation(seed.caseId, "KNOWLEDGE_LINEAGE", true, "Preserve the exact frozen Knowledge ref/digest without ownership transfer.", "LINEAGE_BREAK", "ST_KNOWLEDGE_EVIDENCE_SELECTION", seed.referenceRefs),
      obligation(seed.caseId, "ZERO_PROJECT_WRITE", true, "Perform no Project write, adoption or simulated Human Decision.", "OWNERSHIP_LEAK", "ST_OWNER_RESULT_PACKAGING", ["Manifesto-V2:candidate-not-adopted"]),
      obligation(seed.caseId, "NO_PROVIDER_CALL", true, "Perform no LLM or external provider call.", "UNKNOWN_FAILURE", "ST_REQUEST_ACCEPTANCE", ["W1-QUAL-01R2:bounded-campaign"]),
      obligation(seed.caseId, "NEGATIVE_EXPECTATION", true, `Respect ${seed.negativeExpectationMode} without forced candidate or unjustified silence.`, "ST_CRITICAL_REASONING_OMISSION", "ST_CANDIDATE_ELIGIBILITY", seed.referenceRefs),
      obligation(seed.caseId, "MECHANISTIC_OR_EXPLANATORY", Boolean(seed.mechanisticObligation), "Represent an inspectable explanatory candidate when pre-authored and supported.", "ST_CRITICAL_REASONING_OMISSION", "ST_SCIENTIFIC_MODEL_CONSTRUCTION", seed.referenceRefs),
      obligation(seed.caseId, "ALTERNATIVES_PRESERVED", Boolean(seed.alternativesObligation), "Keep a competing explanation visible and unselected when required.", "ST_CRITICAL_REASONING_OMISSION", "ST_ALTERNATIVE_CONSTRUCTION", seed.referenceRefs),
      obligation(seed.caseId, "GAPS_PRESERVED", true, "Preserve all pre-authored Knowledge gaps when an OwnerResult is expected.", "KNOWLEDGE_GAP_LOSS", "ST_KNOWLEDGE_EVIDENCE_SELECTION", seed.referenceRefs),
      obligation(seed.caseId, "LIMITATIONS_PRESERVED", false, "Keep bounded limitations inspectable.", "UNKNOWN_FAILURE", "ST_OUTPUT_CANONICALIZATION", seed.referenceRefs),
      obligation(seed.caseId, "CONTRADICTIONS_PRESERVED", true, "Preserve Knowledge contradictions without selection.", "CONTRADICTION_LOSS", "ST_KNOWLEDGE_EVIDENCE_SELECTION", seed.referenceRefs),
      obligation(seed.caseId, "PROJECT_QUESTION_FIDELITY", true, "Preserve the explicit Project question without semantic drift when applicable.", "PROJECT_QUESTION_DRIFT", "ST_PROJECT_QUESTION_RECONSTRUCTION", seed.referenceRefs),
      obligation(seed.caseId, "EPISTEMIC_SAFETY", true, "Do not emit unsupported primary certainty, evidence promotion or adoption.", "EVIDENCE_PROMOTION", "ST_EPISTEMIC_GUARD", ["PD-011:evidence-strength"]),
      obligation(seed.caseId, "STALE_PROTECTION", Boolean(seed.staleExpected), "Reject intentional stale Knowledge before ST runtime without conversion or fabricated OwnerResult.", "STALE_INPUT_ACCEPTED", "STALE_VALIDATION", ["RDE-002:stale-protection"]),
    ];
    const forbiddenBehaviors = ["PROJECT_WRITE", "AUTOMATIC_ADOPTION", "KNOWLEDGE_OWNERSHIP_TRANSFER", "CERTAINTY_PROMOTION", "METHOD_SELECTION", "LLM_OR_EXTERNAL_CALL", "SILENT_GAP_OR_CONTRADICTION_SUPPRESSION"];
    const allowedAlternatives = seed.negativeExpectationMode === "CONDITIONAL_CANDIDATE_ALLOWED"
      ? ["Pending conditional candidate with explicit unknowns", "Clarification without candidate", "Explicit gap without candidate"]
      : seed.negativeExpectationMode === "CLARIFICATION_OR_GAP_EXPECTED"
        ? ["Clarification required", "Explicit gap", "Pending candidate only if explicitly bounded"]
        : seed.negativeExpectationMode === "STRICT_NO_CANDIDATE_EXPECTED"
          ? ["Explicit owner refusal", "Expected pre-owner stale rejection"]
          : ["Different scientifically equivalent candidate wording", "Additional explicit limitation", "Additional competing alternative"];
    const frozenProjectRef = `${executionBinding.snapshot.sourceProjectRef}@${executionBinding.snapshot.sourceProjectVersion}#${executionBinding.snapshot.sourceProjectDigest}`;
    const frozenKnowledgeResultRef = `${knowledge.result.resultId}@${knowledge.result.resultVersion}#${knowledge.nativePayload.resultDigest}`;
    const caseItem: CharacterizationCase = {
      caseId: seed.caseId, coverageClass: seed.coverageClass, domain: seed.domain, purpose: seed.purpose,
      scientificContext: seed.question ?? seed.purpose, testedCapabilities: seed.testedCapabilities,
      frozenProjectRef, frozenKnowledgeResultRef, negativeExpectationMode: seed.negativeExpectationMode,
      expectedExecutionMode: seed.expectedExecutionMode, expectedRejectionCodes: seed.expectedRejectionCodes ?? [], explicitProjectQuestion: seed.question,
      expectedGaps, expectedLimitations, expectedContradictions, mechanisticObligation: Boolean(seed.mechanisticObligation), alternativesObligation: Boolean(seed.alternativesObligation), staleExpected: Boolean(seed.staleExpected),
      requiredObligations: obligations.map((item) => item.statement), forbiddenBehaviors, allowedAlternatives,
      criticalObligations: obligations.filter((item) => item.critical).map((item) => item.obligationId), referenceRefs: seed.referenceRefs,
      positiveOpportunity: seed.positiveOpportunity, replayPredeclared: Boolean(seed.replayRole), replayRole: seed.replayRole ?? null,
      parentageStatus: seed.parentageStatus, nearestExposedMaterial: seed.nearestExposedMaterial, distinctnessRationale: seed.distinctnessRationale,
      authoredBeforeObservation: true,
    };
    cases.push(caseItem);
    envelopes.push({
      envelopeId: `acceptance-envelope:${seed.caseId}`, caseId: seed.caseId, referenceStatus: "VALID", obligations,
      expectedExecutionMode: seed.expectedExecutionMode, ownerResultRequired: seed.expectedExecutionMode === "OWNER_EXECUTION_REQUIRED",
      negativeExpectationMode: seed.negativeExpectationMode, requiredObligations: obligations.map((item) => item.statement), forbiddenBehaviors,
      allowedAlternatives, expectedGaps, expectedLimitations, expectedContradictions,
      criticalObligations: obligations.filter((item) => item.critical).map((item) => item.obligationId), referenceRefs: seed.referenceRefs,
      authoredBeforeObservation: true, mutableAfterObservation: false,
    });
    const material = {
      version: "2.1.0" as const, sourceCase: seed.caseId,
      provenance: [...seed.referenceRefs, frozenKnowledgeResultRef, base.snapshot.snapshotDigest], purpose: seed.purpose,
      controlledStaleRecipe: Boolean(seed.staleExpected),
      knowledgeGateBinding: { projectId: base.snapshot.sourceProjectRef, projectVersion: base.snapshot.sourceProjectVersion, projectDigest: base.snapshot.sourceProjectDigest },
      payload: { project: executionBinding.project, projectSnapshot: executionBinding.snapshot, ledger: knowledge.ledger, knowledgeResultId: knowledge.result.resultId, knowledgeResultRef: `${knowledge.result.resultId}@${knowledge.result.resultVersion}`, knowledgeResultDigest: knowledge.nativePayload.resultDigest },
    };
    inputs.push({ packId: `frozen-input-pack:${seed.caseId}`, ...material, digest: logicalDigest(material), frozen: true });
  }
  return { cases, envelopes, inputs };
};

export const EXPOSED_EXCLUSIONS = Object.freeze({
  w1Qual: ["ST-CARDIAC-01", "ST-SPECTRAL-01", "ST-NEURO-01", "ST-UNSUPPORTED-01"],
  campaignA: ["all 12 W1-QUAL-01R Campaign A cases"],
  campaignB: ["all 13 W1-QUAL-01R1 Campaign B cases"],
  repairProbes: ["ST-REPAIR-A", "ST-REPAIR-B", "ST-REPAIR-C", "ST-REPAIR-D", "ST-REPAIR-E", "ST-REPAIR-F", "ST-REPAIR-G", "ST-REPAIR-H"],
  metaFixtures: ["R2 stale", "R2 Project ID mismatch", "R2 Project digest mismatch", "R2 dependency mismatch", "R2 owner-runtime failure"],
  exactOrNearDuplicateAuthorized: false,
  campaignACaseReusedAsIndependentEvidence: false,
  campaignBCaseReusedAsIndependentEvidence: false,
  repairProbeReusedAsIndependentEvidence: false,
  harnessMetaFixtureReusedAsIndependentEvidence: false,
});
