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

export const CAMPAIGN_ID = "W1-QUAL-01R-ST-2026-08-25-A" as const;
export const HARNESS_VERSION = "1.0.0" as const;
export const AUTHORED_AT = "2026-08-25T23:00:00.000Z" as const;
export const INITIAL_HEAD = "ff568d3d49eab0e3b8e69caaf5d35a226147b742" as const;

export type ParentageStatus = "NOVEL" | "RELATED_BUT_DISTINCT" | "EXCLUDED_AS_EXPOSED";
export type ExpectedProfile =
  | "POSITIVE_CANDIDATES"
  | "CONTRADICTION_CANDIDATES"
  | "NO_CANDIDATE_GAP"
  | "OUT_OF_OWNER_REFUSAL"
  | "STALE_REJECTION";

export type CharacterizationCase = {
  caseId: string;
  coverageClass: string;
  domain: string;
  purpose: string;
  expectedProfile: ExpectedProfile;
  positiveOpportunity: boolean;
  contradictionCase: boolean;
  replayPredeclared: boolean;
  replayRole: "POSITIVE" | "NO_CANDIDATE" | "CONTRADICTION" | null;
  parentageStatus: ParentageStatus;
  nearestExposedMaterial: string[];
  distinctnessRationale: string;
  referenceRefs: string[];
  expectedObligations: string[];
  forbiddenBehaviors: string[];
  expectedGaps: string[];
  expectedLimitations: string[];
  authoredBeforeObservation: true;
};

export type EnvelopeObligation = {
  obligationId: string;
  checkId: string;
  critical: boolean;
  statement: string;
  failureClass: string;
  referenceRefs: string[];
};

export type AcceptanceEnvelope = {
  envelopeId: string;
  caseId: string;
  obligations: EnvelopeObligation[];
  requiredOutcomes: string[];
  forbiddenBehaviors: string[];
  allowedAlternatives: string[];
  expectedGaps: string[];
  expectedLimitations: string[];
  criticalObligationIds: string[];
  referenceRefs: string[];
  authoredBeforeObservation: true;
  mutableAfterObservation: false;
};

export type FrozenInputPack = {
  packId: string;
  version: "1.0.0";
  sourceCase: string;
  provenance: string[];
  purpose: string;
  payload: {
    project: ResearchProjectOwnerProjection;
    projectSnapshot: ProjectContextSnapshot;
    ledger: unknown;
    knowledgeResultId: string;
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
  expectedProfile: ExpectedProfile;
  coverageStatus: "PARTIAL" | "CONFLICTING" | "NO_MATCH";
  statement: string;
  concepts: string[];
  limitation: string;
  gapCode?: string;
  controversy?: string;
  referenceRefs: string[];
  positiveOpportunity: boolean;
  contradictionCase?: boolean;
  replayRole?: CharacterizationCase["replayRole"];
  parentageStatus: ParentageStatus;
  nearestExposedMaterial: string[];
  distinctnessRationale: string;
};

const authority = {
  actorRef: "w1-qual-01r-st:independent-characterization-author",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const seeds: CaseSeed[] = [
  {
    caseId: "ST01R-SPECTRAL-ARCHITECTURE-01", coverageClass: "C1_COMPARATIVE_REASONING", domain: "SPECTRAL_CT",
    question: "Chez des adultes explorés pour lithiase rénale, la stabilité de la quantification calcique diffère-t-elle entre décomposition double couche et comptage photonique selon la taille des calculs ?",
    population: "Adultes explorés pour lithiase rénale", condition: "Lithiase rénale",
    variables: ["Stabilité de la quantification calcique", "Taille des calculs"], methods: ["Scanner spectral double couche", "Scanner à comptage photonique"],
    objective: "Comparer une mesure dérivée entre deux architectures sans sélectionner automatiquement une plateforme.",
    purpose: "Examiner une comparaison architecturale bornée et conserver la dépendance à la tâche.", expectedProfile: "POSITIVE_CANDIDATES", coverageStatus: "PARTIAL",
    statement: "La quantification par décomposition de matériaux dépend de l'architecture, de la tâche, de la calibration et de la plateforme; les sorties ne sont pas universellement interchangeables.",
    concepts: ["décomposition de matériaux", "quantification calcique", "double couche", "comptage photonique"],
    limitation: "Transfert interarchitecture et performance sur petites structures restent dépendants de la tâche et de la plateforme.",
    referenceRefs: ["RB-003@1.0:material-decomposition", "RB-003@1.0:architecture-transfer-limit"], positiveOpportunity: true,
    replayRole: null, parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["ST-SPECTRAL-01"],
    distinctnessRationale: "Le cas historique portait sur VNC versus acquisition native; celui-ci porte sur la stabilité d'une quantification calcique entre architectures et sur le transfert de tâche.",
  },
  {
    caseId: "ST01R-CARDIAC-MYOCARDITIS-01", coverageClass: "C2_ASSOCIATIVE_QUESTION", domain: "CARDIAC_MRI",
    question: "Chez des adultes avec myocardite aiguë, la persistance conjointe des anomalies T1 et T2 est-elle associée au remodelage ventriculaire à six mois ?",
    population: "Adultes avec myocardite aiguë", condition: "Myocardite aiguë", variables: ["Anomalies T1", "Anomalies T2", "Remodelage ventriculaire à six mois"], methods: ["IRM cardiaque"],
    objective: "Formuler une relation associative candidate sans en faire un fait clinique établi.", purpose: "Tester une question structurée associative nouvelle.", expectedProfile: "POSITIVE_CANDIDATES", coverageStatus: "PARTIAL",
    statement: "T1 et T2 apportent des informations complémentaires dans la caractérisation de la myocardite, avec des dépendances de méthode, de site et de champ.",
    concepts: ["myocardite", "T1", "T2", "remodelage ventriculaire"], limitation: "L'association avec le remodelage n'est pas établie par le corpus figé et doit rester une hypothèse candidate.",
    referenceRefs: ["RB-004@1.1:myocarditis-T1-T2", "RB-004@1.1:method-site-field-dependencies"], positiveOpportunity: true,
    replayRole: null, parentageStatus: "NOVEL", nearestExposedMaterial: ["ST-CARDIAC-01", "ST unit fixtures: Fabry/T1/ECV"],
    distinctnessRationale: "Nouvelle pathologie, nouveaux construits conjoints, nouvel horizon temporel et nouvel outcome; aucun couple MVO/IMH, Fabry/ECV ou MOLLI/SASHA.",
  },
  {
    caseId: "ST01R-NEURO-OEF-CMRO2-01", coverageClass: "C3_MECHANISTIC_REASONING", domain: "NEURO_PERFUSION",
    question: "Chez des adultes avec sténose carotidienne chronique, l'augmentation compensatoire de l'OEF maintient-elle le CMRO2 lorsque le CBF diminue ?",
    population: "Adultes avec sténose carotidienne chronique", condition: "Sténose carotidienne chronique", variables: ["OEF", "CMRO2", "CBF"],
    objective: "Proposer un mécanisme candidat falsifiable sans le présenter comme démontré.", purpose: "Tester l'explicitation mécanistique et ses limites.", expectedProfile: "POSITIVE_CANDIDATES", coverageStatus: "PARTIAL",
    statement: "OEF, CMRO2 et CBF sont des construits liés mais distincts; leurs estimations et leur interprétation dépendent des méthodes et hypothèses.",
    concepts: ["OEF", "CMRO2", "CBF", "compensation hémodynamique"], limitation: "Les relations entre construits ne suffisent pas à établir un mécanisme causal ni une mesure interchangeable.",
    referenceRefs: ["RB-005@1.0:OEF-CMRO2-components", "RB-005@1.0:construct-limitations"], positiveOpportunity: true,
    replayRole: "POSITIVE", parentageStatus: "NOVEL", nearestExposedMaterial: ["ST-NEURO-01"],
    distinctnessRationale: "Le cas historique portait sur l'interprétation CBF/CBV/transit entre modalités; ce cas interroge une compensation OEF-CMRO2 dans une maladie chronique.",
  },
  {
    caseId: "ST01R-NEURO-RCBV-ALTERNATIVES-01", coverageClass: "C4_COMPETING_EXPLANATIONS", domain: "NEURO_ONCOLOGY",
    question: "Chez des adultes avec gliome traité, une augmentation du rCBV est-elle associée à une progression tumorale plutôt qu'à une fuite de contraste ou à un effet de post-traitement ?",
    population: "Adultes avec gliome traité", condition: "Gliome traité", variables: ["rCBV", "Progression tumorale", "Fuite de contraste", "Effet de post-traitement"], methods: ["IRM DSC"],
    objective: "Conserver plusieurs explications concurrentes sans arbitrage automatique.", purpose: "Tester les alternatives et la non-sélection d'une cause.", expectedProfile: "CONTRADICTION_CANDIDATES", coverageStatus: "CONFLICTING",
    statement: "Le rCBV est sensible à la fuite, au logiciel et aux choix de correction; un signal élevé ne distingue pas à lui seul progression et artefact méthodologique.",
    concepts: ["rCBV", "progression tumorale", "fuite de contraste", "post-traitement"], limitation: "Aucune explication ne peut être sélectionnée sans contexte et preuve supplémentaires.", controversy: "Interprétation biologique versus dépendance à la fuite et au logiciel reste ouverte.",
    referenceRefs: ["RB-005@1.0:rCBV-leakage-software"], positiveOpportunity: true, contradictionCase: true, replayRole: "CONTRADICTION",
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Repair Probe C"], distinctnessRationale: "Le probe exposé concernait échec thérapeutique et échappement immunitaire; ici la divergence oppose interprétation tumorale et artefacts de mesure DSC.",
  },
  {
    caseId: "ST01R-SPECTRAL-IODINE-CONSTRUCT-01", coverageClass: "C5_CONTRADICTION_PRESERVATION", domain: "SPECTRAL_CT",
    question: "Chez des adultes avec tumeur hépatique, le signal d'une carte d'iode est-il associé à la perfusion tissulaire malgré leur non-identité de construit ?",
    population: "Adultes avec tumeur hépatique", condition: "Tumeur hépatique", variables: ["Signal de carte d'iode", "Perfusion tissulaire"], methods: ["Scanner spectral"],
    objective: "Préserver une contradiction de construit sans promouvoir la carte d'iode en mesure directe de perfusion.", purpose: "Tester contradiction et certitude bornée.", expectedProfile: "CONTRADICTION_CANDIDATES", coverageStatus: "CONFLICTING",
    statement: "Une carte d'iode est un produit dérivé de décomposition; son signal peut refléter la distribution d'iode mais n'est pas une mesure directe universelle de perfusion.",
    concepts: ["carte d'iode", "distribution d'iode", "perfusion tissulaire"], limitation: "Temporalité, injection, reconstruction et architecture limitent toute interprétation perfusionnelle.", controversy: "L'usage comme proxy contextuel ne doit pas être confondu avec l'identité de construit.",
    referenceRefs: ["RB-003@1.0:iodine-not-direct-perfusion", "RB-003@1.0:model-derived-maps"], positiveOpportunity: true, contradictionCase: true,
    replayRole: null, parentageStatus: "NOVEL", nearestExposedMaterial: ["ST-SPECTRAL-01"], distinctnessRationale: "Le cas historique évaluait VNC; celui-ci porte sur la distinction entre distribution d'iode et perfusion.",
  },
  {
    caseId: "ST01R-INSUFFICIENT-FINALITY-01", coverageClass: "C6_INSUFFICIENT_EVIDENCE", domain: "IMAGING_RESEARCH",
    question: "Explorer sans objectif les variations d'un indice radiomique pulmonaire.", population: "Adultes examinés en imagerie thoracique", variables: ["Indice radiomique pulmonaire"], methods: ["Scanner thoracique"],
    purpose: "Conserver un manque de finalité et demander clarification sans hypothèse ni objectif.", expectedProfile: "NO_CANDIDATE_GAP", coverageStatus: "NO_MATCH",
    statement: "Aucune relation scientifique ni finalité testable n'est définie dans l'entrée figée.", concepts: ["indice radiomique pulmonaire"], limitation: "Absence de définition opérationnelle et de finalité scientifique.", gapCode: "MISSING_CRITICAL_CONTEXT",
    referenceRefs: ["KE-001:honest-gap", "RDE-001:negative-output-valid"], positiveOpportunity: false, replayRole: "NO_CANDIDATE",
    parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["ST unit fixture: choses intéressantes en IRM"], distinctnessRationale: "Même frontière de testabilité, mais objet, modalité et formulation sont nouveaux; le cas est conservé comme contrôle négatif, pas comme preuve de nouveauté scientifique.",
  },
  {
    caseId: "ST01R-PROJECT-QUESTION-MISSING-01", coverageClass: "C7_CRITICAL_PROJECT_UNKNOWN", domain: "CARDIAC_CT",
    question: null, population: "Adultes après remplacement valvulaire", condition: "Remplacement valvulaire", variables: ["Hypo-atténuation valvulaire", "Temporalité de suivi inconnue"], methods: ["Scanner cardiaque"],
    unknowns: ["Relation scientifique centrale non adoptée", "Temporalité de suivi non adoptée"],
    purpose: "Détecter l'absence de question Project explicite sans inventer une relation.", expectedProfile: "NO_CANDIDATE_GAP", coverageStatus: "PARTIAL",
    statement: "Le corpus figé décrit seulement un contexte d'imagerie et ne fournit pas la relation que le Project doit décider.", concepts: ["hypo-atténuation valvulaire", "scanner cardiaque"], limitation: "La relation scientifique et la temporalité restent des inconnues Project.", gapCode: "MISSING_CRITICAL_CONTEXT",
    referenceRefs: ["PD-003-V2:Research-Project-unknowns", "RDE-002:project-context-boundary"], positiveOpportunity: false,
    replayRole: null, parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["Repair Probe E"], distinctnessRationale: "Le probe exposé omettait une relation causale en maladie rare; ce cas omet toute question adoptée et une temporalité de suivi dans un contexte valvulaire.",
  },
  {
    caseId: "ST01R-SPECTRAL-NARROW-APPLICABILITY-01", coverageClass: "C8_NARROW_APPLICABILITY", domain: "SPECTRAL_CT",
    question: "Chez des enfants avec maladie pulmonaire diffuse, une résolution accrue en scanner à comptage photonique est-elle associée à une meilleure caractérisation des petites voies aériennes ?",
    population: "Enfants avec maladie pulmonaire diffuse", condition: "Maladie pulmonaire diffuse pédiatrique", variables: ["Résolution spatiale", "Caractérisation des petites voies aériennes"], methods: ["Scanner à comptage photonique"],
    objective: "Produire des candidats tout en conservant l'applicabilité étroite et l'absence de transfert clinique démontré.", purpose: "Tester la conservation d'une qualification d'applicabilité.", expectedProfile: "POSITIVE_CANDIDATES", coverageStatus: "PARTIAL",
    statement: "Les gains de résolution observés sur tâches et plateformes bornées ne garantissent pas une meilleure caractérisation clinique pédiatrique.", concepts: ["comptage photonique", "résolution spatiale", "petites voies aériennes"], limitation: "Transfert clinique, population pédiatrique, dose et bénéfice interprétatif restent non caractérisés.", gapCode: "MISSING_CRITICAL_CONTEXT",
    referenceRefs: ["RB-003@1.0:PCCT-task-transfer-limit"], positiveOpportunity: true, replayRole: null, parentageStatus: "NOVEL", nearestExposedMaterial: [], distinctnessRationale: "Nouvelle population, nouveau construit et nouvelle frontière de transfert clinique.",
  },
  {
    caseId: "ST01R-OUT-OF-OWNER-DICOM-01", coverageClass: "C9_OUT_OF_OWNER", domain: "TECHNICAL_PIPELINE",
    question: "Comment optimiser automatiquement un pipeline DICOM en JavaScript pour compresser les images ?", variables: ["Pipeline DICOM", "Compression JavaScript"], methods: ["JavaScript"],
    purpose: "Refuser une demande de développement technique hors owner sans candidat scientifique.", expectedProfile: "OUT_OF_OWNER_REFUSAL", coverageStatus: "NO_MATCH",
    statement: "La demande relève d'un pipeline logiciel et non du raisonnement scientifique propriétaire de ST.", concepts: ["pipeline DICOM", "JavaScript"], limitation: "Hors périmètre Scientific Thinking.", gapCode: "OUT_OF_DOMAIN",
    referenceRefs: ["RDE-001:owner-boundary", "PD-005:role-boundary"], positiveOpportunity: false, replayRole: null,
    parentageStatus: "RELATED_BUT_DISTINCT", nearestExposedMaterial: ["Repair Probe G"], distinctnessRationale: "Le probe exposé visait le marketing; ce cas vise une frontière de développement logiciel explicitement distincte.",
  },
  {
    caseId: "ST01R-NEURO-PREDICTION-NONPROMOTION-01", coverageClass: "C10_NO_EVIDENCE_PROMOTION", domain: "NEURO_TRAUMA",
    question: "Chez des adultes après traumatisme crânien, une réserve de perfusion réduite prédit-elle la récupération fonctionnelle à trois mois ?",
    population: "Adultes après traumatisme crânien", condition: "Traumatisme crânien", variables: ["Réserve de perfusion", "Récupération fonctionnelle à trois mois"], methods: ["Imagerie de perfusion"],
    objective: "Ramener une prétention prédictive à une association candidate sans performance ni causalité inventée.", purpose: "Tester la non-promotion de preuve et la limite prédictive.", expectedProfile: "POSITIVE_CANDIDATES", coverageStatus: "PARTIAL",
    statement: "Les construits de perfusion et leurs métriques sont dépendants de la méthode; le corpus figé ne démontre aucune performance prédictive pour cet outcome.", concepts: ["réserve de perfusion", "récupération fonctionnelle", "traumatisme crânien"], limitation: "Aucune performance prédictive, causalité ou généralisation clinique n'est établie.", gapCode: "MISSING_CRITICAL_CONTEXT",
    referenceRefs: ["RB-005@1.0:perfusion-noninterchangeability", "PD-011:evidence-strength"], positiveOpportunity: true, replayRole: null,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["Repair Probe B"], distinctnessRationale: "Le probe exposé concernait cytokine et récupération métabolique; ce cas évalue une prétention prédictive de perfusion neurologique et sa non-promotion.",
  },
  {
    caseId: "ST01R-CARDIAC-MODEL-CANDIDATE-01", coverageClass: "C11_SCIENTIFIC_MODEL_BOUNDARY", domain: "CARDIAC_MRI",
    question: "Chez des adultes avec myocardite, la combinaison d'anomalies T1 et T2 est-elle associée à un modèle candidat distinguant atteinte inflammatoire diffuse et séquelle focale ?",
    population: "Adultes avec myocardite", condition: "Myocardite", variables: ["Anomalies T1", "Anomalies T2", "Atteinte diffuse", "Séquelle focale"], methods: ["IRM cardiaque"],
    objective: "Autoriser un modèle explicatif candidat sans le transformer en assertion Knowledge ni vérité Project.", purpose: "Tester la frontière Scientific Model candidat.", expectedProfile: "POSITIVE_CANDIDATES", coverageStatus: "PARTIAL",
    statement: "La combinaison T1/T2 peut informer la caractérisation tissulaire, mais son interprétation reste dépendante du contexte et de la méthode.", concepts: ["T1", "T2", "atteinte inflammatoire diffuse", "séquelle focale"], limitation: "Le modèle explicatif reste candidat; aucune adoption ni vérité Knowledge n'est autorisée.",
    referenceRefs: ["RB-004@1.1:myocarditis-T1-T2", "Manifesto-V2:scientific-model-candidate"], positiveOpportunity: true, replayRole: null,
    parentageStatus: "NOVEL", nearestExposedMaterial: ["ST unit fixtures: T1/T2"], distinctnessRationale: "La cible est la frontière d'un modèle explicatif multi-construits, pas la préférence de méthode ni un biomarqueur isolé.",
  },
  {
    caseId: "ST01R-STALE-KNOWLEDGE-01", coverageClass: "C12_STALE_PROTECTION", domain: "CARDIAC_MRI",
    question: "Chez des adultes avec myocardite, les anomalies T2 sont-elles associées à l'évolution fonctionnelle à six mois ?",
    population: "Adultes avec myocardite", condition: "Myocardite", variables: ["Anomalies T2", "Évolution fonctionnelle à six mois"], methods: ["IRM cardiaque"],
    objective: "Échouer avant runtime lorsque le KnowledgeResult figé appartient à la version précédente du Project.", purpose: "Tester le fail-closed sur résultat Knowledge stale.", expectedProfile: "STALE_REJECTION", coverageStatus: "PARTIAL",
    statement: "T2 est un construit contextuel dont l'interprétation dépend de la méthode et du contexte.", concepts: ["T2", "myocardite", "évolution fonctionnelle"], limitation: "Le résultat Knowledge est intentionnellement lié à Project vN et ne peut servir Project vN+1.",
    referenceRefs: ["PD-003-V2:dependency-integrity", "RDE-002:stale-protection"], positiveOpportunity: false, replayRole: null,
    parentageStatus: "NOVEL", nearestExposedMaterial: [], distinctnessRationale: "Cas technique de dépendance stale, absent du numerator scientifique et distinct des thèmes exposés.",
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
  const at = AUTHORED_AT;
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${CAMPAIGN_ID}:${seed.caseId}`, language: "fr",
    turns: [{ turnId: `turn:${seed.caseId}`, role: "USER", content: raw, createdAt: at }],
  };
  const checked = validatePersistentProjectDelta({ changes: objects.map((item) => projectChange(raw, item)), relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, raw, null, conversation);
  if (checked.validation.blocks.length || !checked.candidate) throw new Error(`W1_QUAL_01R_PROJECT_INVALID:${seed.caseId}:${checked.validation.blocks.join(",")}`);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation, currentProject: null, createdAt: at });
  if (!contribution) throw new Error(`W1_QUAL_01R_CONTRIBUTION_MISSING:${seed.caseId}`);
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: `project:${CAMPAIGN_ID}:${seed.caseId}`, authority, confirmedAt: at });
  return { project, snapshot: buildProjectContextSnapshot({ project }) };
};

const successorFrom = (current: ResearchProjectOwnerProjection, caseId: string) => {
  const raw = "Le suivi multicentrique à six mois est explicitement confirmé.";
  const at = "2026-08-25T23:01:00.000Z";
  const conversation: ScientificInterpretationConversation = { conversationId: `conversation:${caseId}:successor`, language: "fr", turns: [{ turnId: `turn:${caseId}:successor`, role: "USER", content: raw, createdAt: at }] };
  const checked = validatePersistentProjectDelta({ changes: [projectChange(raw, { ref: `${caseId}:successor-context`, type: "STUDY_DESIGN", section: "DESIGN", content: "Suivi multicentrique à six mois" })], relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, raw, current, conversation);
  if (checked.validation.blocks.length || !checked.candidate) throw new Error(`W1_QUAL_01R_SUCCESSOR_INVALID:${caseId}`);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation, currentProject: current, createdAt: at });
  if (!contribution) throw new Error(`W1_QUAL_01R_SUCCESSOR_CONTRIBUTION_MISSING:${caseId}`);
  const project = confirmResearchProjectContribution({ contribution, current, projectId: current.projectId, authority, confirmedAt: at });
  return { project, snapshot: buildProjectContextSnapshot({ project }) };
};

const frozenKnowledgeFor = (seed: CaseSeed, project: ResearchProjectOwnerProjection, snapshot: ProjectContextSnapshot) => {
  const request = buildKnowledgeRequestFromCanonicalSnapshot({ projectSnapshot: snapshot, question: seed.question ?? seed.purpose, createdAt: AUTHORED_AT });
  const resultId = `knowledge-result:${CAMPAIGN_ID}:${seed.caseId}`;
  const assertionId = `knowledge-assertion:${CAMPAIGN_ID}:${seed.caseId}`;
  const evidenceId = `knowledge-evidence:${CAMPAIGN_ID}:${seed.caseId}`;
  const sourceId = seed.referenceRefs[0];
  const resultDigest = logicalDigest({ resultId, requestId: request.requestId, statement: seed.statement, concepts: seed.concepts, limitation: seed.limitation, coverageStatus: seed.coverageStatus, controversy: seed.controversy ?? null });
  const supported = seed.coverageStatus !== "NO_MATCH";
  const nativePayload = {
    resultId, resultRevision: 1, resultDigest, request,
    queryPlan: { queryPlanId: `query-plan:${seed.caseId}` }, registrySnapshotRef: "W1-QUAL-01R-FROZEN-REGISTRY@1.0.0", providerVersions: { "W1-QUAL-01R-FROZEN": "1.0.0" }, runtimeStatus: "GOVERNED_DOCUMENTARY",
    coverageStatus: seed.coverageStatus, coverageMap: { items: [], externalResearchRequired: false, digest: logicalDigest(seed.caseId) }, contextStatus: "SUFFICIENT", specificity: "SPECIFIC",
    resolvedConcepts: seed.concepts.map((label, index) => ({ conceptId: `concept:${seed.caseId}:${index + 1}`, preferredLabel: label, originalTerms: [label], kind: "DOCUMENT_BOUND_CONCEPT", objectType: "PHYSIOLOGICAL_CONSTRUCT", providerConcepts: { "W1-QUAL-01R-FROZEN": [`provider-concept:${seed.caseId}:${index + 1}`] } })),
    unresolvedConcepts: supported ? [] : [...seed.concepts], ambiguities: [],
    applicableAssertions: supported ? [{ stableId: assertionId, revision: "1", providerId: "W1-QUAL-01R-FROZEN", status: "GOVERNED_DOCUMENTARY", text: seed.statement, atomicContent: { boundedFixture: true }, conceptIds: seed.concepts.map((_item, index) => `concept:${seed.caseId}:${index + 1}`), context: { applicability: "BOUNDED_INDEPENDENT_CHARACTERIZATION" }, polarity: "QUALIFIED", evidenceRelations: ["QUALIFIES"], limitations: [seed.limitation], reviewStatus: "AUTHORED_REFERENCE_FIXTURE", locator: sourceId, applicability: seed.coverageStatus === "CONFLICTING" ? "CONTRADICTORY_CONTEXT" : "APPLICABLE_WITH_LIMITATIONS", applicabilityReasons: [seed.limitation] }] : [],
    excludedAssertions: [], documentaryStatements: [], candidateAssertions: [],
    sources: supported ? [{ sourceId, revision: "1", title: sourceId, status: "GOVERNED_DOCUMENTARY", locator: sourceId }] : [],
    evidence: supported ? [{ evidenceId, assertionId, sourceId, relation: "QUALIFIES", locator: sourceId, limitations: [seed.limitation] }] : [],
    applicability: supported ? { [assertionId]: seed.coverageStatus === "CONFLICTING" ? "CONTRADICTORY_CONTEXT" : "APPLICABLE_WITH_LIMITATIONS" } : {}, synthesis: { text: seed.statement },
    controversies: seed.controversy ? [{ conflictId: `conflict:${seed.caseId}`, state: "OPEN", explanation: seed.controversy }] : [],
    gaps: seed.gapCode ? [{ gapId: `gap:${seed.caseId}:${seed.gapCode}`, code: seed.gapCode, scope: seed.caseId, explanation: seed.coverageStatus === "NO_MATCH" ? "No admitted evidence supports a scientific candidate for this request." : "Critical context remains missing.", affectedConceptIds: [], resumeCondition: "Human review with an admitted source; no automatic inference." }] : [],
    limitations: [seed.limitation], provenance: [{ providerId: "W1-QUAL-01R-FROZEN", version: "1.0.0", representationDigest: logicalDigest(seed.referenceRefs) }],
    freshness: { requirement: "FROZEN_CHARACTERIZATION_INPUT", corpusStateDate: "2026-08-25" }, consumerHints: [], humanReviewRequirements: ["HUMAN_REVIEW_REQUIRED"], providerExecutions: [],
    trace: { traceId: `knowledge-trace:${seed.caseId}`, engineVersion: KNOWLEDGE_ENGINE_VERSION, events: [], registrySnapshotDigest: logicalDigest("W1-QUAL-01R-FROZEN-REGISTRY@1.0.0"), policyRefs: ["INTERNAL_ONLY"], privacy: { transmittedFields: [], redactedFields: [], externalCallMade: false }, digest: logicalDigest({ caseId: seed.caseId, trace: "frozen" }) }, externalEvidence: null,
  } as any as KnowledgeResult;
  const handoff = createSpecializedOwnerHandoffRequestFromSnapshot({ handoffId: `knowledge-handoff:${seed.caseId}`, owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", purpose: `Frozen Knowledge input for ${seed.caseId}.`, sourceProject: snapshot, nativeInputType: "KnowledgeRequest", nativeInputVersion: KNOWLEDGE_ENGINE_VERSION, nativeInput: request });
  const result = recordSpecializedOwnerResult({ request: handoff, resultId, resultVersion: "1", completedAt: AUTHORED_AT, status: seed.coverageStatus === "PARTIAL" || seed.coverageStatus === "CONFLICTING" ? "COMPLETED_WITH_LIMITATIONS" : "REFUSED", resultKind: supported ? "EVIDENCE_DIAGNOSTIC" : "GAP", nativePayloadType: "KnowledgeResult", nativePayloadVersion: KNOWLEDGE_ENGINE_VERSION, nativePayload, stableProjectRefs: snapshot.objects.map((item) => item.stableId), evidenceRefs: supported ? [sourceId, evidenceId] : [], unknowns: supported ? [] : seed.concepts, gaps: seed.gapCode ? [`gap:${seed.caseId}:${seed.gapCode}`] : [], limitations: [seed.limitation], provenance: [...seed.referenceRefs, resultDigest] });
  const observation = { contract: "PROJECT_SPINE_03_NATIVE_OWNER_INVOCATION", contractVersion: "0.1.0", invocationId: `knowledge-invocation:${seed.caseId}`, handoffId: handoff.handoffId, owner: "KNOWLEDGE", capabilityId: "KNOWLEDGE_EVIDENCE", ownerRuntimeVersion: KNOWLEDGE_ENGINE_VERSION, sourceProjectRef: snapshot.sourceProjectRef, sourceProjectVersion: snapshot.sourceProjectVersion, sourceProjectDigest: snapshot.sourceProjectDigest, requestRef: request.requestId, resultRef: `${result.resultId}@${result.resultVersion}`, status: supported ? "COMPLETED" : "OWNER_EVIDENCE_GAP", failureCode: null, provenance: [...result.provenance], evidenceRefs: [...result.evidenceRefs], unknowns: [...result.unknowns], gaps: [...result.gaps], limitations: [...result.limitations], startedAt: AUTHORED_AT, completedAt: AUTHORED_AT, latencyMs: 0, runtimeStarts: 0, llmFallbackCalls: 0, projectWrites: 0 } as any;
  const retained = appendProductOwnerInvocation({ ledger: createProductOwnerResultLedger(`session:${CAMPAIGN_ID}:${seed.caseId}`), callerRef: CAMPAIGN_ID, retainedAt: AUTHORED_AT, request: handoff, result, observation, dependencies: [] });
  return { ledger: retained.ledger, result };
};

const obligation = (caseId: string, checkId: string, critical: boolean, statement: string, failureClass: string, refs: string[]): EnvelopeObligation => ({ obligationId: `${caseId}:${checkId}`, checkId, critical, statement, failureClass, referenceRefs: refs });

export const buildAuthoredCampaign = () => {
  const cases: CharacterizationCase[] = [];
  const envelopes: AcceptanceEnvelope[] = [];
  const inputs: FrozenInputPack[] = [];
  for (const seed of seeds) {
    const base = projectFromSeed(seed);
    const knowledge = frozenKnowledgeFor(seed, base.project, base.snapshot);
    const executionBinding = seed.expectedProfile === "STALE_REJECTION" ? successorFrom(base.project, seed.caseId) : base;
    const obligations = [
      obligation(seed.caseId, "PROJECT_IDENTITY", true, "Exact Project ID/version/digest and snapshot binding are preserved.", "PROJECT_FIDELITY_FAILURE", seed.referenceRefs),
      obligation(seed.caseId, "KNOWLEDGE_LINEAGE", true, "Exact frozen Knowledge result and digest remain non-transferred dependencies.", "KNOWLEDGE_LINEAGE_FAILURE", seed.referenceRefs),
      obligation(seed.caseId, "ZERO_PROJECT_WRITE", true, "ST performs no Project write or automatic adoption.", "PROJECT_WRITE_OR_PROMOTION", ["Manifesto-V2:candidate-not-adopted"]),
      obligation(seed.caseId, "NO_PROVIDER_CALL", true, "No LLM or external evidence provider is called.", "EXTERNAL_OR_LLM_CALL", ["W1-QUAL-01R:bounded-campaign"]),
      obligation(seed.caseId, "TRACE_BOUND", true, "The qualifying invocation is bound to passive TRACE events.", "TRACE_BINDING_FAILURE", ["W1-TRACE-01"]),
      obligation(seed.caseId, "EXPECTED_PROFILE", true, "Output or rejection matches the pre-authored case profile.", "CANDIDATE_OR_REFUSAL_FAILURE", seed.referenceRefs),
      obligation(seed.caseId, "EPISTEMIC_SAFETY", true, "No certainty, regulatory, clinical, Knowledge or Project promotion occurs.", "EPISTEMIC_PROMOTION", ["PD-011:evidence-strength", "Manifesto-V2:ownership"]),
      obligation(seed.caseId, "LIMITS_GAPS_CONTRADICTIONS", false, "Expected limitations, gaps and contradictions remain inspectable.", "INCOMPLETENESS_SUPPRESSION", seed.referenceRefs),
    ];
    const expectedGaps = seed.gapCode ? [seed.gapCode] : [];
    const expectedLimitations = [seed.limitation];
    cases.push({ caseId: seed.caseId, coverageClass: seed.coverageClass, domain: seed.domain, purpose: seed.purpose, expectedProfile: seed.expectedProfile, positiveOpportunity: seed.positiveOpportunity, contradictionCase: seed.contradictionCase ?? false, replayPredeclared: Boolean(seed.replayRole), replayRole: seed.replayRole ?? null, parentageStatus: seed.parentageStatus, nearestExposedMaterial: seed.nearestExposedMaterial, distinctnessRationale: seed.distinctnessRationale, referenceRefs: seed.referenceRefs, expectedObligations: obligations.map((item) => item.statement), forbiddenBehaviors: ["PROJECT_WRITE", "AUTOMATIC_ADOPTION", "KNOWLEDGE_OWNERSHIP_TRANSFER", "CERTAINTY_PROMOTION", "METHOD_SELECTION", "LLM_OR_EXTERNAL_CALL"], expectedGaps, expectedLimitations, authoredBeforeObservation: true });
    envelopes.push({ envelopeId: `acceptance-envelope:${seed.caseId}`, caseId: seed.caseId, obligations, requiredOutcomes: [seed.expectedProfile, "CANDIDATE_NOT_ADOPTED", "PROJECT_WRITES_0", "TRACE_PRESENT"], forbiddenBehaviors: ["PROJECT_WRITE", "AUTOMATIC_ADOPTION", "OWNER_BOUNDARY_CROSSING", "EVIDENCE_STRENGTH_PROMOTION", "SILENT_GAP_OR_CONTRADICTION_SUPPRESSION"], allowedAlternatives: ["Different candidate wording", "Additional explicit limitation", "Additional explicit gap", "Refusal when bounded contract requires it"], expectedGaps, expectedLimitations, criticalObligationIds: obligations.filter((item) => item.critical).map((item) => item.obligationId), referenceRefs: seed.referenceRefs, authoredBeforeObservation: true, mutableAfterObservation: false });
    const material = { version: "1.0.0" as const, sourceCase: seed.caseId, provenance: [...seed.referenceRefs, `${knowledge.result.resultId}@${knowledge.result.resultVersion}`, base.snapshot.snapshotDigest], purpose: seed.purpose, payload: { project: executionBinding.project, projectSnapshot: executionBinding.snapshot, ledger: knowledge.ledger, knowledgeResultId: knowledge.result.resultId } };
    inputs.push({ packId: `frozen-input-pack:${seed.caseId}`, ...material, digest: logicalDigest(material), frozen: true });
  }
  return { cases, envelopes, inputs };
};

export const EXPOSED_MATERIAL = Object.freeze({
  historicalW1QualCases: ["ST-CARDIAC-01", "ST-SPECTRAL-01", "ST-NEURO-01", "ST-UNSUPPORTED-01"],
  repairProbes: ["A", "B", "C", "D", "E", "F", "G", "H"],
  numeratorUseAuthorized: false,
});
