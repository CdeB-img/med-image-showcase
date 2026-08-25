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
import type { FailureClass, FirstDivergentStage, NegativeExpectationMode } from "../../harness/contracts";
import type { EnvelopeObligation, EvaluationCase, EvaluationEnvelope } from "../../harness/evaluator";

export const CAMPAIGN_ID = "W1-QUAL-01R1-ST-2026-08-25-B" as const;
export const AUTHORED_AT = "2026-08-25T23:30:00.000Z" as const;
export const INITIAL_HEAD = "efc11c98b3310dc77c90e7357a83f96dc9d82820" as const;
export const ST_VERSION = "1.2.1" as const;

export type ParentageStatus = "NOVEL" | "RELATED_BUT_DISTINCT" | "TOO_CLOSE" | "EXACT_OR_NEAR_DUPLICATE";

export type CharacterizationCase = EvaluationCase & {
  coverageClass: string;
  domain: string;
  purpose: string;
  scientificContext: string;
  testedCapabilities: string[];
  FrozenProjectRef: string;
  FrozenKnowledgeResultRef: string;
  frozenProjectRef: string;
  frozenKnowledgeResultRef: string;
  requiredObligations: string[];
  forbiddenBehaviors: string[];
  allowedAlternatives: string[];
  criticalObligations: string[];
  referenceRefs: string[];
  positiveOpportunity: boolean;
  replayPredeclared: boolean;
  replayRole: "POSITIVE" | "CONDITIONAL_OR_NO_CANDIDATE" | "CONTRADICTION_OR_ALTERNATIVES" | null;
  parentageStatus: ParentageStatus;
  nearestExposedMaterial: string[];
  distinctnessRationale: string;
  authoredBeforeObservation: true;
};

export type AcceptanceEnvelope = EvaluationEnvelope & {
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
  version: "2.0.0";
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
  actorRef: "w1-qual-01r1-st:campaign-b-author",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const seeds: CaseSeed[] = [
  {
    caseId: "ST01R1-B-SPECTRAL-NEGATIVE-IODINE-01", coverageClass: "B01_CANDIDATE_GENERATION", domain: "SPECTRAL_CT_RENAL",
    question: "Chez des adultes avec masse rénale, une carte d'iode négative est-elle associée à l'absence de rehaussement sur une référence indépendante ?",
    population: "Adultes avec masse rénale", condition: "Masse rénale", variables: ["Carte d'iode négative", "Rehaussement sur référence indépendante"], methods: ["Scanner spectral"],
    objective: "Formuler une association candidate sans transformer un résultat négatif en preuve d'absence.",
    purpose: "Tester une génération candidate soutenue et l'interprétation négative bornée.", testedCapabilities: ["candidate generation", "negative interpretation", "evidence non-promotion"], negativeExpectationMode: "CANDIDATE_REQUIRED", coverageStatus: "PARTIAL",
    statement: "Une carte d'iode négative ne prouve pas l'absence de rehaussement lorsque sensibilité, timing, dose, mouvement ou mélange sont inadéquats.", concepts: ["carte d'iode", "rehaussement", "référence indépendante"],
    limitation: "La sensibilité et la référence doivent être appariées à la tâche; aucune exclusion clinique universelle n'est établie.", referenceRefs: ["RB-003@1.0:negative-iodine-map-interpretation"], positiveOpportunity: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign A iodine/perfusion case"], distinctnessRationale: "Le cas B teste une inférence négative et une référence indépendante; A testait l'identité de construit entre distribution d'iode et perfusion.",
  },
  {
    caseId: "ST01R1-B-SPECTRAL-VMI-TRADEOFF-01", coverageClass: "B02_COMPETING_ALTERNATIVES", domain: "SPECTRAL_CT_METAL",
    question: "Chez des adultes porteurs de matériel métallique, l'augmentation de l'énergie VMI est-elle associée à une réduction des artefacts mais à une perte de contraste de la lésion ?",
    population: "Adultes porteurs de matériel métallique", variables: ["Énergie VMI", "Artefacts métalliques", "Contraste de la lésion"], methods: ["Imagerie monoénergétique virtuelle"],
    objective: "Conserver deux effets concurrents sans sélectionner une énergie universelle.", purpose: "Tester des alternatives concurrentes liées à un compromis de tâche.", testedCapabilities: ["alternatives", "task-dependent reasoning", "no method selection"], negativeExpectationMode: "CANDIDATE_REQUIRED", coverageStatus: "PARTIAL",
    statement: "Une VMI à énergie élevée peut réduire certains artefacts au prix d'une baisse de contraste; l'énergie utile dépend de la tâche, de la taille, du matériau, de la dose et de la reconstruction.", concepts: ["VMI", "artefact métallique", "contraste"], limitation: "Aucune énergie universelle ni sélection de méthode n'est autorisée.", referenceRefs: ["RB-003@1.0:VMI-task-tradeoff"], positiveOpportunity: true, alternativesObligation: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign A spectral architecture case"], distinctnessRationale: "La structure causale porte sur un compromis intra-sortie VMI artefact/contraste, non sur un transfert entre architectures.",
  },
  {
    caseId: "ST01R1-B-SPECTRAL-CHARGE-SHARING-01", coverageClass: "B03_MECHANISTIC_EXPLANATION", domain: "PHOTON_COUNTING_METROLOGY",
    question: "Dans des phantoms multi-matériaux, le partage de charge est-il associé à un biais de classement énergétique pouvant altérer la décomposition ?",
    population: "Phantoms multi-matériaux", variables: ["Partage de charge", "Classement énergétique", "Biais de décomposition"], methods: ["Scanner à comptage photonique"],
    objective: "Représenter une relation explicative candidate entre défaut de détecteur et sortie dérivée.", purpose: "Tester l'obligation mécanistique générique sur une chaîne physique distincte.", testedCapabilities: ["mechanistic reasoning", "falsifiability", "derived-measure boundary"], negativeExpectationMode: "CANDIDATE_REQUIRED", coverageStatus: "PARTIAL",
    statement: "Le partage de charge peut répartir l'énergie d'un photon entre pixels, déplacer le classement spectral et altérer une décomposition selon les corrections et le flux.", concepts: ["partage de charge", "classement énergétique", "décomposition de matériaux"], limitation: "L'importance du biais dépend du détecteur, du flux, des seuils et des corrections; aucun effet universel n'est établi.", referenceRefs: ["RB-003@1.0:charge-sharing-and-energy-binning"], positiveOpportunity: true, mechanisticObligation: true, replayRole: "POSITIVE",
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign A OEF/CMRO2 mechanistic case"], distinctnessRationale: "Nouveau domaine physique, nouveaux objets et nouvelle chaîne explicative détecteur-vers-décomposition; aucun construit physiologique OEF/CMRO2.",
  },
  {
    caseId: "ST01R1-B-CARDIAC-IRON-ASSOCIATION-01", coverageClass: "B04_ASSOCIATION_PREDICTION", domain: "CARDIAC_MRI_IRON",
    question: "Chez des adultes avec surcharge en fer, le T2 étoile myocardique est-il associé à l'évolution de la fonction ventriculaire lors du suivi ?",
    population: "Adultes avec surcharge en fer", condition: "Surcharge en fer", variables: ["T2 étoile myocardique", "Évolution de la fonction ventriculaire"], methods: ["IRM cardiaque"],
    objective: "Construire une association longitudinale candidate sans déclarer une performance pronostique.", purpose: "Tester association/prédiction dans un construit cardiaque non exposé.", testedCapabilities: ["association", "longitudinal candidate", "non-promotion"], negativeExpectationMode: "CANDIDATE_REQUIRED", coverageStatus: "PARTIAL",
    statement: "Le T2 étoile est sensible aux effets de susceptibilité liés au fer, mais sa relation à l'évolution fonctionnelle dépend de la méthode, du suivi et du contexte clinique.", concepts: ["T2 étoile", "surcharge en fer", "fonction ventriculaire"], limitation: "Le corpus figé ne démontre ni causalité ni performance pronostique pour cette formulation.", gapCode: "MISSING_CRITICAL_CONTEXT", referenceRefs: ["RB-004@1.1:T2star-iron-quantification-boundary"], positiveOpportunity: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign A myocarditis T1/T2 cases"], distinctnessRationale: "Nouvelle pathologie, nouveau contraste physique T2*, nouvelle temporalité et nouvel outcome; aucun couple myocardite T1/T2.",
  },
  {
    caseId: "ST01R1-B-CARDIAC-FIELD-TRANSFER-01", coverageClass: "B05_NARROW_APPLICABILITY", domain: "CARDIAC_MRI_METROLOGY",
    question: "Chez des adultes sans pathologie cardiaque connue, les valeurs de T1 natif sont-elles comparables entre champs magnétiques sans harmonisation spécifique ?",
    population: "Adultes sans pathologie cardiaque connue", variables: ["T1 natif", "Champ magnétique", "Comparabilité intersite"], methods: ["IRM cardiaque"],
    objective: "Conserver l'applicabilité étroite et refuser une transférabilité automatique.", purpose: "Tester une qualification d'applicabilité métrologique distincte.", testedCapabilities: ["narrow applicability", "comparison", "no universal threshold"], negativeExpectationMode: "CANDIDATE_REQUIRED", coverageStatus: "PARTIAL",
    statement: "Les valeurs de T1 natif dépendent notamment du champ, de la séquence, du site et de la calibration; des valeurs nominales ne sont pas automatiquement interchangeables.", concepts: ["T1 natif", "champ magnétique", "harmonisation"], limitation: "La comparabilité doit être démontrée pour chaque chaîne; aucun seuil universel n'est transféré.", referenceRefs: ["RB-004@1.1:T1-field-site-dependency"], positiveOpportunity: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["ST unit Fabry/T1 fixtures"], distinctnessRationale: "Le cas B porte sur transférabilité métrologique chez témoins et non sur une préférence MOLLI/SASHA, Fabry ou une interprétation pathologique.",
  },
  {
    caseId: "ST01R1-B-NEURO-ASL-TRANSIT-01", coverageClass: "B06_MECHANISTIC_EXPLANATION", domain: "NEURO_ASL",
    question: "Chez des adultes avec sténose intracrânienne, un délai de transit artériel prolongé est-il associé à une sous-estimation apparente du CBF en ASL single-delay ?",
    population: "Adultes avec sténose intracrânienne", condition: "Sténose intracrânienne", variables: ["Délai de transit artériel", "CBF apparent"], methods: ["ASL single-delay"],
    objective: "Formuler une chaîne explicative candidate reliant arrivée tardive et estimation apparente.", purpose: "Tester mécanisme, alternative et incertitude sur une chaîne ASL non exposée.", testedCapabilities: ["mechanistic reasoning", "measurement bias", "alternative explanation"], negativeExpectationMode: "CANDIDATE_REQUIRED", coverageStatus: "PARTIAL",
    statement: "Si le post-labeling delay est trop court, l'arrivée tardive peut sous-estimer le CBF tissulaire et augmenter le signal artériel; faible débit et transit prolongé ne sont pas automatiquement distingués.", concepts: ["ATT", "PLD", "CBF", "ASL"], limitation: "La causalité apparente dépend du modèle, du territoire et de l'acquisition; la correction peut aussi retirer une information collatérale.", referenceRefs: ["RB-005@1.0:ASL-PLD-ATT-bias"], positiveOpportunity: true, mechanisticObligation: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["ST-NEURO-01", "Campaign A OEF/CMRO2"], distinctnessRationale: "La question cible une erreur de mesure ASL single-delay causée par ATT/PLD, pas une comparaison ASL/DSC/CTP ni une compensation métabolique.",
  },
  {
    caseId: "ST01R1-B-NEURO-GHOST-CORE-01", coverageClass: "B07_EVIDENCE_NON_PROMOTION", domain: "NEURO_CTP_STROKE",
    question: "Chez des adultes avec AVC ischémique reperfusé rapidement, un volume de core estimé élevé prédit-il nécessairement un infarctus final irréversible ?",
    population: "Adultes avec AVC ischémique reperfusé rapidement", condition: "AVC ischémique", variables: ["Volume de core estimé", "Infarctus final"], methods: ["CT de perfusion"],
    objective: "Ramener une prétention nécessaire à une association candidate et conserver le ghost core.", purpose: "Tester la non-promotion d'un estimateur précoce en vérité histologique ou pronostique.", testedCapabilities: ["prediction", "evidence non-promotion", "alternative explanation"], negativeExpectationMode: "CANDIDATE_REQUIRED", coverageStatus: "PARTIAL",
    statement: "Le ghost core montre qu'un estimateur précoce peut surestimer le tissu finalement infarci après reperfusion rapide; un seuil n'établit pas l'irréversibilité universelle.", concepts: ["core estimé", "ghost core", "infarctus final"], limitation: "Les seuils sont propres à une chaîne validée et ne constituent ni histologie future ni certitude individuelle.", referenceRefs: ["RB-005@1.0:CTP-ghost-core"], positiveOpportunity: true, alternativesObligation: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign A TBI prediction case"], distinctnessRationale: "Nouveau contexte AVC/reperfusion, nouvel estimateur core et frontière irréversibilité; A concernait une réserve de perfusion et récupération fonctionnelle après traumatisme.",
  },
  {
    caseId: "ST01R1-B-NEURO-BBB-CAUSALITY-01", coverageClass: "B08_KNOWLEDGE_CONTRADICTION", domain: "NEURO_DCE_BBB",
    question: "Chez des adultes avec maladie cérébrale inflammatoire, une augmentation de Ktrans est-elle associée à une altération de barrière primaire plutôt qu'à un effet de flux, surface vasculaire ou modèle ?",
    population: "Adultes avec maladie cérébrale inflammatoire", condition: "Maladie cérébrale inflammatoire", variables: ["Ktrans", "Altération de barrière", "Flux", "Surface vasculaire"], methods: ["DCE-MRI"],
    objective: "Préserver les explications concurrentes et la contradiction sur le construit Ktrans.", purpose: "Tester contradiction Knowledge, alternatives et non-sélection causale.", testedCapabilities: ["contradiction", "competing explanations", "causal restraint"], negativeExpectationMode: "CANDIDATE_REQUIRED", coverageStatus: "CONFLICTING",
    statement: "Ktrans dépend du modèle et du régime; il peut refléter davantage le flux ou le produit perméabilité-surface et ne doit pas être renommé perméabilité sans qualification.", concepts: ["Ktrans", "flux", "perméabilité-surface", "barrière hémato-encéphalique"], limitation: "Une association à la maladie ne prouve ni cause primaire ni rupture franche de la barrière.", controversy: "Ktrans peut représenter des régimes et mécanismes distincts; plusieurs interprétations restent défendables.", referenceRefs: ["RB-005@1.0:Ktrans-regime-and-causality"], positiveOpportunity: true, alternativesObligation: true, replayRole: "CONTRADICTION_OR_ALTERNATIVES",
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign A rCBV leakage case"], distinctnessRationale: "Nouveau paramètre DCE, nouveau compartiment BBB et opposition flow-limited/permeability-limited; A portait sur rCBV tumoral DSC et post-traitement.",
  },
  {
    caseId: "ST01R1-B-METHOD-REFERENCE-MISMATCH-01", coverageClass: "B09_METHOD_REFERENCE", domain: "IMAGING_BIOMARKER_METHODOLOGY",
    question: "Dans une étude de biomarqueur d'imagerie, l'accord entre deux mesures imparfaites est-il associé à l'exactitude du construit biologique cible ?",
    population: "Études de biomarqueurs d'imagerie", variables: ["Accord entre mesures", "Exactitude du construit cible"],
    objective: "Distinguer accord et exactitude sans inventer un gold standard universel.", purpose: "Tester la généricité dans un contexte méthodologique non pathologique.", testedCapabilities: ["methodological reasoning", "reference mismatch", "alternative explanation"], negativeExpectationMode: "CANDIDATE_REQUIRED", coverageStatus: "PARTIAL",
    statement: "L'accord entre deux mesures imparfaites ne prouve pas l'exactitude; la référence doit viser le même construit et les désaccords peuvent venir du compartiment, du temps ou du modèle.", concepts: ["accord", "exactitude", "construit", "référence"], limitation: "Aucun gold standard universel n'est présumé et la validité reste propre au couple mesurande-chaîne-domaine.", referenceRefs: ["RB-005@1.0:no-universal-gold-standard", "PD-011:reference-evidence"], positiveOpportunity: true, alternativesObligation: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: [], distinctnessRationale: "Cas méthodologique transversal nouveau, sans reprise d'une pathologie, modalité ou structure causale de Campaign A ou des probes.",
  },
  {
    caseId: "ST01R1-B-INSUFFICIENT-TARGET-01", coverageClass: "B10_INSUFFICIENT_EVIDENCE", domain: "IMAGING_METROLOGY",
    question: "Explorer sans objectif une valeur de densité électronique en imagerie.", variables: ["Densité électronique"], methods: ["Imagerie spectrale"],
    purpose: "Conserver une finalité absente comme clarification/gap sans forcer un candidat.", testedCapabilities: ["clarification", "reasoning gap", "no forced candidate"], negativeExpectationMode: "CLARIFICATION_OR_GAP_EXPECTED", coverageStatus: "NO_MATCH",
    statement: "Aucune relation, population, comparateur ou finalité testable n'est définie dans l'entrée figée.", concepts: ["densité électronique"], limitation: "La valeur dérivée ne possède aucune finalité scientifique adoptée dans ce Project.", gapCode: "MISSING_CRITICAL_CONTEXT", referenceRefs: ["KE-001:honest-gap", "RDE-001:negative-output-valid"], positiveOpportunity: false, replayRole: "CONDITIONAL_OR_NO_CANDIDATE",
    parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["Campaign A radiomics no-finality", "ST unit vague imaging fixture"], distinctnessRationale: "Contrôle de sécurité nécessaire mais nouveau construit de métrologie; il est exclu du numérateur de candidate coverage et ne réutilise aucune conclusion scientifique exposée.",
  },
  {
    caseId: "ST01R1-B-CONDITIONAL-ENDPOINT-01", coverageClass: "B11_PROJECT_UNKNOWN_CONDITIONAL", domain: "SPECTRAL_CT_VASCULAR",
    question: "Chez des adultes avec plaque carotidienne, la composition spectrale est-elle associée à un résultat clinique restant à définir ?",
    population: "Adultes avec plaque carotidienne", condition: "Plaque carotidienne", variables: ["Composition spectrale", "Résultat clinique non défini"], methods: ["Scanner spectral"], unknowns: ["Outcome clinique non adopté", "Temporalité non adoptée"],
    objective: "Autoriser au plus un candidat pending explicitement conditionnel à la définition de l'outcome.", purpose: "Tester un Project unknown structurant sans imposer zéro candidat ni remplir le gap.", testedCapabilities: ["conditional candidate", "Project unknown", "non-promotion"], negativeExpectationMode: "CONDITIONAL_CANDIDATE_ALLOWED", coverageStatus: "PARTIAL",
    statement: "Une composition spectrale est une sortie dérivée dont l'usage dépend du construit, de la référence et de l'outcome; aucun résultat clinique n'est encodé ici.", concepts: ["composition spectrale", "plaque carotidienne"], limitation: "Outcome et temporalité restent des unknowns Project qui conditionnent toute proposition.", gapCode: "MISSING_CRITICAL_CONTEXT", referenceRefs: ["RB-003@1.0:derived-output-needs-construct", "PD-003-V2:Project-unknowns"], positiveOpportunity: false,
    parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["Campaign A missing Project question", "Repair Probe E"], distinctnessRationale: "Ici la question relationnelle existe mais l'outcome et la temporalité restent inconnus; A/E omettaient la question ou la relation centrale. L'obligation scientifique est donc distincte.",
  },
  {
    caseId: "ST01R1-B-OUT-OF-OWNER-ACCOUNTING-01", coverageClass: "B12_OUT_OF_OWNER", domain: "ADMINISTRATIVE_ACCOUNTING",
    question: "Comment automatiser la comptabilité analytique d'un centre d'imagerie ?", variables: ["Comptabilité analytique", "Automatisation"],
    purpose: "Refuser une demande administrative hors ownership scientifique sans pseudo-candidat.", testedCapabilities: ["owner boundary", "strict no-candidate", "refusal"], negativeExpectationMode: "STRICT_NO_CANDIDATE_EXPECTED", coverageStatus: "NO_MATCH",
    statement: "La demande relève de la comptabilité et non du raisonnement scientifique de recherche propriétaire de ST.", concepts: ["comptabilité analytique"], limitation: "Hors périmètre Scientific Thinking.", gapCode: "OUT_OF_DOMAIN", referenceRefs: ["RDE-001:owner-boundary", "PD-005:role-boundary"], positiveOpportunity: false,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Repair Probe G marketing", "Campaign A JavaScript/DICOM"], distinctnessRationale: "Troisième frontière hors owner entièrement distincte: gestion comptable, sans marketing ni développement logiciel DICOM.",
  },
  {
    caseId: "ST01R1-B-STALE-ZEFF-01", coverageClass: "B13_STALE_KNOWLEDGE", domain: "SPECTRAL_CT_ZEFF",
    question: "Chez des adultes avec lésion hépatique, le Zeff est-il associé à une classification tissulaire reproductible ?",
    population: "Adultes avec lésion hépatique", condition: "Lésion hépatique", variables: ["Zeff", "Classification tissulaire"], methods: ["Scanner spectral"],
    objective: "Échouer avant ST lorsque le KnowledgeResult appartient à la version précédente du Project.", purpose: "Tester le fail-closed stale sur un contenu et un Project entièrement nouveaux.", testedCapabilities: ["stale protection", "historical readability", "no automatic recomputation"], negativeExpectationMode: "STRICT_NO_CANDIDATE_EXPECTED", coverageStatus: "PARTIAL",
    statement: "Zeff est une valeur effective dépendante du modèle et ne prouve pas l'identité chimique d'un tissu.", concepts: ["Zeff", "classification tissulaire"], limitation: "Le résultat Knowledge est volontairement lié au Project vN; le runtime reçoit vN+1 et doit refuser sans conversion.", referenceRefs: ["RB-003@1.0:Zeff-model-boundary", "RDE-002:stale-protection"], positiveOpportunity: false, staleExpected: true,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Campaign A stale myocarditis case"], distinctnessRationale: "Le contenu scientifique, le Project et le KnowledgeResult sont nouveaux; seule l'obligation technique de stale protection, requise par le prompt, est commune.",
  },
];

const projectChange = (raw: string, item: ProjectObject): PersistentProjectDeltaChange => ({
  operation: "ADD", candidateRef: item.ref, proposedType: item.type, targetSectionId: item.section,
  targetProjectRef: null, semanticIdentity: item.ref, content: item.content, polarity: "AFFIRMED", studyRole: null,
  epistemicStatus: item.epistemic ?? "EXPLICIT_USER_STATED", assertionKind: "USER_STATED", sourceText: raw,
  proposalSourceText: null, evidenceRefs: [],
});

const projectFromSeed = (seed: CaseSeed) => {
  const raw = [seed.question, seed.population, seed.condition, ...seed.variables, ...(seed.methods ?? []), seed.objective].filter(Boolean).join(" ");
  const objects: ProjectObject[] = [
    ...(seed.question ? [{ ref: `${seed.caseId}:question`, type: "SCIENTIFIC_QUESTION" as const, section: "ANALYSIS" as const, content: seed.question }] : []),
    ...(seed.population ? [{ ref: `${seed.caseId}:population`, type: "POPULATION" as const, section: "POPULATION" as const, content: seed.population }] : []),
    ...(seed.condition ? [{ ref: `${seed.caseId}:condition`, type: "CONDITION" as const, section: "POPULATION" as const, content: seed.condition }] : []),
    ...seed.variables.map((content, index) => ({ ref: `${seed.caseId}:variable:${index + 1}`, type: "CANONICAL_VARIABLE" as const, section: "MEASUREMENTS" as const, content })),
    ...(seed.methods ?? []).map((content, index) => ({ ref: `${seed.caseId}:method:${index + 1}`, type: "IMAGING_MODALITY" as const, section: "IMAGING" as const, content })),
    ...(seed.objective ? [{ ref: `${seed.caseId}:objective`, type: "OBJECTIVE" as const, section: "ANALYSIS" as const, content: seed.objective }] : []),
    ...(seed.unknowns ?? []).map((content, index) => ({ ref: `${seed.caseId}:unknown:${index + 1}`, type: "UNCERTAINTY" as const, section: "ANALYSIS" as const, content, epistemic: "UNKNOWN" as const })),
  ];
  const conversation: ScientificInterpretationConversation = { conversationId: `conversation:${CAMPAIGN_ID}:${seed.caseId}`, language: "fr", turns: [{ turnId: `turn:${seed.caseId}`, role: "USER", content: raw, createdAt: AUTHORED_AT }] };
  const checked = validatePersistentProjectDelta({ changes: objects.map((item) => projectChange(raw, item)), relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, raw, null, conversation);
  if (checked.validation.blocks.length || !checked.candidate) throw new Error(`CAMPAIGN_B_PROJECT_INVALID:${seed.caseId}:${checked.validation.blocks.join(",")}`);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation, currentProject: null, createdAt: AUTHORED_AT });
  if (!contribution) throw new Error(`CAMPAIGN_B_CONTRIBUTION_MISSING:${seed.caseId}`);
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: `project:${CAMPAIGN_ID}:${seed.caseId}`, authority, confirmedAt: AUTHORED_AT });
  return { project, snapshot: buildProjectContextSnapshot({ project }) };
};

const successorFrom = (current: ResearchProjectOwnerProjection, caseId: string) => {
  const raw = "Une extension multicentrique est explicitement confirmée comme nouveau contexte Project.";
  const at = "2026-08-25T23:31:00.000Z";
  const conversation: ScientificInterpretationConversation = { conversationId: `conversation:${caseId}:successor`, language: "fr", turns: [{ turnId: `turn:${caseId}:successor`, role: "USER", content: raw, createdAt: at }] };
  const checked = validatePersistentProjectDelta({ changes: [projectChange(raw, { ref: `${caseId}:successor-context`, type: "STUDY_DESIGN", section: "DESIGN", content: "Extension multicentrique" })], relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, raw, current, conversation);
  if (checked.validation.blocks.length || !checked.candidate) throw new Error(`CAMPAIGN_B_SUCCESSOR_INVALID:${caseId}`);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation, currentProject: current, createdAt: at });
  if (!contribution) throw new Error(`CAMPAIGN_B_SUCCESSOR_CONTRIBUTION_MISSING:${caseId}`);
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
    queryPlan: { queryPlanId: `query-plan:${seed.caseId}` }, registrySnapshotRef: "W1-QUAL-01R1-CAMPAIGN-B-FROZEN-REGISTRY@1.0.0", providerVersions: { "W1-QUAL-01R1-FROZEN": "1.0.0" }, runtimeStatus: "GOVERNED_DOCUMENTARY",
    coverageStatus: seed.coverageStatus, coverageMap: { items: [], externalResearchRequired: false, digest: logicalDigest(seed.caseId) }, contextStatus: "SUFFICIENT", specificity: "SPECIFIC",
    resolvedConcepts: seed.concepts.map((label, index) => ({ conceptId: `concept:${seed.caseId}:${index + 1}`, preferredLabel: label, originalTerms: [label], kind: "DOCUMENT_BOUND_CONCEPT", objectType: "PHYSIOLOGICAL_CONSTRUCT", providerConcepts: { "W1-QUAL-01R1-FROZEN": [`provider-concept:${seed.caseId}:${index + 1}`] } })),
    unresolvedConcepts: supported ? [] : [...seed.concepts], ambiguities: [],
    applicableAssertions: supported ? [{ stableId: assertionId, revision: "1", providerId: "W1-QUAL-01R1-FROZEN", status: "GOVERNED_DOCUMENTARY", text: seed.statement, atomicContent: { boundedFixture: true }, conceptIds: seed.concepts.map((_item, index) => `concept:${seed.caseId}:${index + 1}`), context: { applicability: "BOUNDED_INDEPENDENT_CHARACTERIZATION" }, polarity: "QUALIFIED", evidenceRelations: ["QUALIFIES"], limitations: [seed.limitation], reviewStatus: "AUTHORED_REFERENCE_FIXTURE", locator: sourceId, applicability: seed.coverageStatus === "CONFLICTING" ? "CONTRADICTORY_CONTEXT" : "APPLICABLE_WITH_LIMITATIONS", applicabilityReasons: [seed.limitation] }] : [],
    excludedAssertions: [], documentaryStatements: [], candidateAssertions: [],
    sources: supported ? [{ sourceId, revision: "1", title: sourceId, status: "GOVERNED_DOCUMENTARY", locator: sourceId }] : [],
    evidence: supported ? [{ evidenceId, assertionId, sourceId, relation: "QUALIFIES", locator: sourceId, limitations: [seed.limitation] }] : [],
    applicability: supported ? { [assertionId]: seed.coverageStatus === "CONFLICTING" ? "CONTRADICTORY_CONTEXT" : "APPLICABLE_WITH_LIMITATIONS" } : {}, synthesis: { text: seed.statement },
    controversies: seed.controversy ? [{ conflictId: `conflict:${seed.caseId}`, state: "OPEN", explanation: seed.controversy }] : [],
    gaps: seed.gapCode ? [{ gapId: `gap:${seed.caseId}:${seed.gapCode}`, code: seed.gapCode, scope: seed.caseId, explanation: seed.coverageStatus === "NO_MATCH" ? "No admitted evidence supports a scientific candidate for this request." : "Critical context remains missing.", affectedConceptIds: [], resumeCondition: "Human review with an admitted source; no automatic inference." }] : [],
    limitations: [seed.limitation], provenance: [{ providerId: "W1-QUAL-01R1-FROZEN", version: "1.0.0", representationDigest: logicalDigest(seed.referenceRefs) }],
    freshness: { requirement: "FROZEN_CHARACTERIZATION_INPUT", corpusStateDate: "2026-08-25" }, consumerHints: [], humanReviewRequirements: ["HUMAN_REVIEW_REQUIRED"], providerExecutions: [],
    trace: { traceId: `knowledge-trace:${seed.caseId}`, engineVersion: KNOWLEDGE_ENGINE_VERSION, events: [], registrySnapshotDigest: logicalDigest("W1-QUAL-01R1-CAMPAIGN-B-FROZEN-REGISTRY@1.0.0"), policyRefs: ["INTERNAL_ONLY"], privacy: { transmittedFields: [], redactedFields: [], externalCallMade: false }, digest: logicalDigest({ caseId: seed.caseId, trace: "frozen" }) }, externalEvidence: null,
  } as any as KnowledgeResult;
  const handoff = createSpecializedOwnerHandoffRequestFromSnapshot({ handoffId: `knowledge-handoff:${seed.caseId}`, owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", purpose: `Frozen Knowledge input for ${seed.caseId}.`, sourceProject: snapshot, nativeInputType: "KnowledgeRequest", nativeInputVersion: KNOWLEDGE_ENGINE_VERSION, nativeInput: request });
  const result = recordSpecializedOwnerResult({ request: handoff, resultId, resultVersion: "1", completedAt: AUTHORED_AT, status: supported ? "COMPLETED_WITH_LIMITATIONS" : "REFUSED", resultKind: supported ? "EVIDENCE_DIAGNOSTIC" : "GAP", nativePayloadType: "KnowledgeResult", nativePayloadVersion: KNOWLEDGE_ENGINE_VERSION, nativePayload, stableProjectRefs: snapshot.objects.map((item) => item.stableId), evidenceRefs: supported ? [sourceId, evidenceId] : [], unknowns: supported ? [] : seed.concepts, gaps: seed.gapCode ? [`gap:${seed.caseId}:${seed.gapCode}`] : [], limitations: [seed.limitation], provenance: [...seed.referenceRefs, resultDigest] });
  const observation = { contract: "PROJECT_SPINE_03_NATIVE_OWNER_INVOCATION", contractVersion: "0.1.0", invocationId: `knowledge-invocation:${seed.caseId}`, handoffId: handoff.handoffId, owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", ownerRuntimeVersion: KNOWLEDGE_ENGINE_VERSION, sourceProjectRef: snapshot.sourceProjectRef, sourceProjectVersion: snapshot.sourceProjectVersion, sourceProjectDigest: snapshot.sourceProjectDigest, requestRef: request.requestId, resultRef: `${result.resultId}@${result.resultVersion}`, status: supported ? "COMPLETED" : "OWNER_EVIDENCE_GAP", failureCode: null, provenance: [...result.provenance], evidenceRefs: [...result.evidenceRefs], unknowns: [...result.unknowns], gaps: [...result.gaps], limitations: [...result.limitations], startedAt: AUTHORED_AT, completedAt: AUTHORED_AT, latencyMs: 0, runtimeStarts: 0, llmFallbackCalls: 0, projectWrites: 0 } as any;
  const retained = appendProductOwnerInvocation({ ledger: createProductOwnerResultLedger(`session:${CAMPAIGN_ID}:${seed.caseId}`), callerRef: CAMPAIGN_ID, retainedAt: AUTHORED_AT, request: handoff, result, observation, dependencies: [] });
  return { ledger: retained.ledger, result, nativePayload, sourceId, evidenceId };
};

const obligation = (caseId: string, checkId: string, critical: boolean, statement: string, failureClass: FailureClass, firstDivergentStage: FirstDivergentStage, refs: string[]): EnvelopeObligation => ({ obligationId: `${caseId}:${checkId}`, checkId, critical, statement, failureClass, firstDivergentStage, referenceRefs: refs });

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
      obligation(seed.caseId, "PROJECT_IDENTITY", true, "Preserve exact canonical Project tuple or reject intentional stale binding.", "LINEAGE_BREAK", "ST_OWNER_RESULT_PACKAGING", seed.referenceRefs),
      obligation(seed.caseId, "KNOWLEDGE_LINEAGE", true, "Preserve exact frozen Knowledge ref/digest without ownership transfer.", "LINEAGE_BREAK", "ST_KNOWLEDGE_EVIDENCE_SELECTION", seed.referenceRefs),
      obligation(seed.caseId, "ZERO_PROJECT_WRITE", true, "Perform no Project write, adoption or simulated Human Decision.", "OWNERSHIP_LEAK", "ST_OWNER_RESULT_PACKAGING", ["Manifesto-V2:candidate-not-adopted"]),
      obligation(seed.caseId, "NO_PROVIDER_CALL", true, "Perform no LLM or external provider call.", "UNKNOWN_FAILURE", "ST_REQUEST_ACCEPTANCE", ["W1-QUAL-01R1:bounded-campaign"]),
      obligation(seed.caseId, "NEGATIVE_EXPECTATION", true, `Respect ${seed.negativeExpectationMode} without forced candidate or unjustified silence.`, "ST_CRITICAL_REASONING_OMISSION", "ST_CANDIDATE_ELIGIBILITY", seed.referenceRefs),
      obligation(seed.caseId, "MECHANISTIC_OR_EXPLANATORY", Boolean(seed.mechanisticObligation), "Represent an inspectable explanatory candidate when pre-authored and supported.", "ST_CRITICAL_REASONING_OMISSION", "ST_SCIENTIFIC_MODEL_CONSTRUCTION", seed.referenceRefs),
      obligation(seed.caseId, "ALTERNATIVES_PRESERVED", Boolean(seed.alternativesObligation), "Keep a competing explanation visible and unselected when required.", "ST_CRITICAL_REASONING_OMISSION", "ST_ALTERNATIVE_CONSTRUCTION", seed.referenceRefs),
      obligation(seed.caseId, "GAPS_PRESERVED", true, "Preserve all pre-authored Knowledge gaps.", "KNOWLEDGE_GAP_LOSS", "ST_KNOWLEDGE_EVIDENCE_SELECTION", seed.referenceRefs),
      obligation(seed.caseId, "LIMITATIONS_PRESERVED", false, "Keep bounded limitations inspectable.", "UNKNOWN_FAILURE", "ST_OUTPUT_CANONICALIZATION", seed.referenceRefs),
      obligation(seed.caseId, "CONTRADICTIONS_PRESERVED", true, "Preserve Knowledge contradictions without selection.", "CONTRADICTION_LOSS", "ST_KNOWLEDGE_EVIDENCE_SELECTION", seed.referenceRefs),
      obligation(seed.caseId, "PROJECT_QUESTION_FIDELITY", true, "Preserve the explicit Project question without semantic drift when applicable.", "PROJECT_QUESTION_DRIFT", "ST_PROJECT_QUESTION_RECONSTRUCTION", seed.referenceRefs),
      obligation(seed.caseId, "EPISTEMIC_SAFETY", true, "Do not emit unsupported primary certainty, evidence promotion or adoption.", "EVIDENCE_PROMOTION", "ST_EPISTEMIC_GUARD", ["PD-011:evidence-strength"]),
      obligation(seed.caseId, "STALE_PROTECTION", Boolean(seed.staleExpected), "Reject intentional stale Knowledge before ST runtime without conversion.", "STALE_INPUT_ACCEPTED", "STALE_VALIDATION", ["RDE-002:stale-protection"]),
    ];
    const forbiddenBehaviors = ["PROJECT_WRITE", "AUTOMATIC_ADOPTION", "KNOWLEDGE_OWNERSHIP_TRANSFER", "CERTAINTY_PROMOTION", "METHOD_SELECTION", "LLM_OR_EXTERNAL_CALL", "SILENT_GAP_OR_CONTRADICTION_SUPPRESSION"];
    const allowedAlternatives = seed.negativeExpectationMode === "CONDITIONAL_CANDIDATE_ALLOWED"
      ? ["Pending conditional candidate with explicit unknowns", "Clarification without candidate", "Explicit gap without candidate"]
      : seed.negativeExpectationMode === "CLARIFICATION_OR_GAP_EXPECTED"
        ? ["Clarification required", "Explicit gap", "Pending candidate only if explicitly bounded"]
        : seed.negativeExpectationMode === "STRICT_NO_CANDIDATE_EXPECTED"
          ? ["Explicit owner refusal", "Pre-runtime stale rejection"]
          : ["Different scientifically equivalent candidate wording", "Additional explicit limitation", "Additional competing alternative"];
    const frozenProjectRef = `${executionBinding.snapshot.sourceProjectRef}@${executionBinding.snapshot.sourceProjectVersion}#${executionBinding.snapshot.sourceProjectDigest}`;
    const frozenKnowledgeResultRef = `${knowledge.result.resultId}@${knowledge.result.resultVersion}#${knowledge.nativePayload.resultDigest}`;
    cases.push({
      caseId: seed.caseId, coverageClass: seed.coverageClass, domain: seed.domain, purpose: seed.purpose,
      scientificContext: seed.question ?? seed.purpose, testedCapabilities: seed.testedCapabilities,
      FrozenProjectRef: frozenProjectRef, FrozenKnowledgeResultRef: frozenKnowledgeResultRef,
      frozenProjectRef, frozenKnowledgeResultRef,
      negativeExpectationMode: seed.negativeExpectationMode, explicitProjectQuestion: seed.question,
      expectedGaps, expectedLimitations, expectedContradictions,
      mechanisticObligation: Boolean(seed.mechanisticObligation), alternativesObligation: Boolean(seed.alternativesObligation), staleExpected: Boolean(seed.staleExpected),
      requiredObligations: obligations.map((item) => item.statement), forbiddenBehaviors, allowedAlternatives,
      criticalObligations: obligations.filter((item) => item.critical).map((item) => item.obligationId), referenceRefs: seed.referenceRefs,
      positiveOpportunity: seed.positiveOpportunity, replayPredeclared: Boolean(seed.replayRole), replayRole: seed.replayRole ?? null,
      parentageStatus: seed.parentageStatus, nearestExposedMaterial: seed.nearestExposedMaterial, distinctnessRationale: seed.distinctnessRationale,
      authoredBeforeObservation: true,
    });
    envelopes.push({
      envelopeId: `acceptance-envelope:${seed.caseId}`, caseId: seed.caseId, referenceStatus: "VALID", obligations,
      negativeExpectationMode: seed.negativeExpectationMode, requiredObligations: obligations.map((item) => item.statement), forbiddenBehaviors,
      allowedAlternatives, expectedGaps, expectedLimitations, expectedContradictions,
      criticalObligations: obligations.filter((item) => item.critical).map((item) => item.obligationId), referenceRefs: seed.referenceRefs,
      authoredBeforeObservation: true, mutableAfterObservation: false,
    });
    const material = {
      version: "2.0.0" as const, sourceCase: seed.caseId,
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
  campaignA: ["ST01R-SPECTRAL-ARCHITECTURE-01", "ST01R-CARDIAC-MYOCARDITIS-01", "ST01R-NEURO-OEF-CMRO2-01", "ST01R-NEURO-RCBV-ALTERNATIVES-01", "ST01R-SPECTRAL-IODINE-CONSTRUCT-01", "ST01R-INSUFFICIENT-FINALITY-01", "ST01R-PROJECT-QUESTION-MISSING-01", "ST01R-SPECTRAL-NARROW-APPLICABILITY-01", "ST01R-OUT-OF-OWNER-DICOM-01", "ST01R-NEURO-PREDICTION-NONPROMOTION-01", "ST01R-CARDIAC-MODEL-CANDIDATE-01", "ST01R-STALE-KNOWLEDGE-01"],
  repairProbes: ["ST-REPAIR-A", "ST-REPAIR-B", "ST-REPAIR-C", "ST-REPAIR-D", "ST-REPAIR-E", "ST-REPAIR-F", "ST-REPAIR-G", "ST-REPAIR-H"],
  unitAndHistoricalThemes: ["Fabry/T1/ECV/MOLLI/SASHA", "fibrose myocardique vague", "patient T2", "zéphyr", "no-reflow/MVO/IMH", "VNC native substitution", "CBF/CBV/transit cross-modal"],
  exactOrNearDuplicateAuthorized: false,
  campaignACaseReusedAsIndependentEvidence: false,
  repairProbeReusedAsIndependentEvidence: false,
});
