import { logicalDigest } from "../../../../knowledge-engine/canonical";
import type { ProjectContextSnapshot } from "../../../../research-project-construction/canonical-project-backbone";
import type { GovernedConversationEnvelope } from "../../../../query-navigation/governed-conversation-realization";

/** SYNTHETIC_CONTRACT_FIXTURE, not a recorded model response or proof of live extraction fidelity. */
export const REPLAY_PROVENANCE = "SYNTHETIC_CONTRACT_FIXTURE" as const;
type ExtractionReplayContext = { sourceText: string; sourceAnchorId: string; currentProject: ProjectContextSnapshot | null };

export const T01 = "je veux faire une étude évaluant l'effet de méthodes de reperfusion post IDM avec mise en place immédiate ou différée d'un stent afin d'évaluer l'efficacité sur la viabilité myocardique. avec donc deux groupes en double aveugle, une IRM a J3-6 évaluant la cinétique segmentaire, le strain, le T1/T2, le précoce et tardif le critere de jugement principale étant la taille des lésions microvasculaire a 3min post injection";
export const T02 = "c'est ca mais a la place de taille j'utiliserais peut être % de la masse vg que représentent les lésions microvasculaires afin de pouvoir comparer les sujets entre eux.";
export const T03 = "c'est bon";
export const T04 = "alors on va prendre une population de primo infarctus (en gardant a l'esprit qu'il peut y avoir eu des infarctus silencieux). La tranche d'age va etre 35/85, les citeres c'est le tout venant. Bien sur en exclusion on met les contre indication à l'irm cardiaque (produit de contraste ou peacemaker par exemple), et les personnes qui ont deja eu des problemes coronariens. On exclu également toutes les populations sensibles et si tu vois autre chose on peut discuter";
export const T05 = "fais moi des propositions";
export const NORMALIZED_ENDPOINT = "Pourcentage de la masse VG représenté par les lésions microvasculaires";

export type SoakTurn = Readonly<{
  text: string;
  intendedMeaning: string;
  outcome: "CANDIDATE" | "CONFIRM" | "REFUSE" | "PRESERVE" | "PROPOSAL" | "DISCUSS";
  confirmWithButton?: boolean;
}>;

export const FAMILY_A_TURNS: readonly SoakTurn[] = [
  { text: T01, intendedMeaning: "Construire l'étude IDM/IRM comparative et son critère principal.", outcome: "CANDIDATE", confirmWithButton: true },
  { text: T02, intendedMeaning: "Remplacer seulement la mesure absolue par un pourcentage de masse VG.", outcome: "CANDIDATE" },
  { text: T03, intendedMeaning: "Confirmer la candidate courante.", outcome: "CONFIRM" },
  { text: T04, intendedMeaning: "Ajouter population, réserves, âge et critères sans promouvoir l'exemple pacemaker.", outcome: "CANDIDATE", confirmWithButton: true },
  { text: T05, intendedMeaning: "Demander des propositions scientifiques depuis le Project courant.", outcome: "PROPOSAL" },
  { text: "on garde le projet actuel, le pacemaker c'était juste un exemple", intendedMeaning: "Préserver le Project et rappeler que l'exemple n'est pas une règle autonome.", outcome: "PRESERVE" },
  { text: "j'ajouterais aussi une visite de suivi clinique à 6 mois, mais c'est peut-être trop tôt", intendedMeaning: "Proposer un suivi à 6 mois sans transformer la réserve en fait.", outcome: "CANDIDATE" },
  { text: "je refuse", intendedMeaning: "Refuser cette candidate et préserver le Project.", outcome: "REFUSE" },
  { text: "ajoute également un suivi clinique à 12 mois, avec les événements cardiovasculaires", intendedMeaning: "Proposer un suivi à 12 mois et son objet clinique.", outcome: "CANDIDATE" },
  { text: "je valide", intendedMeaning: "Confirmer le suivi à 12 mois.", outcome: "CONFIRM" },
  { text: "fais-moi des propositions", intendedMeaning: "Obtenir une contribution scientifique utile sans nouvel appel externe.", outcome: "PROPOSAL" },
  { text: "explique la première hypothèse ?", intendedMeaning: "Discuter une proposition sans l'adopter.", outcome: "DISCUSS" },
  { text: "finalement on garde le projet actuel", intendedMeaning: "Sortir du chemin puis revenir sans mutation.", outcome: "PRESERVE" },
  { text: "ajoute également une analyse exploratoire selon le territoire de l'infarctus", intendedMeaning: "Proposer une analyse exploratoire additionnelle.", outcome: "CANDIDATE" },
  { text: "je refuse", intendedMeaning: "Refuser l'analyse proposée.", outcome: "REFUSE" },
];

export const FAMILY_B_TURNS: readonly SoakTurn[] = [
  { text: "je veux construire un essai randomisé ouvert chez des adultes avec diabète de type 2, comparant un suivi coordonné infirmier au suivi habituel, avec variation de l'HbA1c à 24 semaines comme critère principal", intendedMeaning: "Construire un essai clinique non centré sur l'imagerie.", outcome: "CANDIDATE" },
  { text: "je valide", intendedMeaning: "Confirmer le premier Project.", outcome: "CONFIRM" },
  { text: "ajoute aussi les hypoglycémies sévères comme critère secondaire", intendedMeaning: "Ajouter un critère secondaire de sécurité.", outcome: "CANDIDATE" },
  { text: "c'est bon", intendedMeaning: "Confirmer le critère secondaire.", outcome: "CONFIRM" },
  { text: "finalement remplace le suivi de 24 semaines par 36 semaines, je pense que ce sera plus informatif", intendedMeaning: "Proposer une correction temporelle partielle.", outcome: "CANDIDATE" },
  { text: "je refuse", intendedMeaning: "Refuser la correction et conserver 24 semaines.", outcome: "REFUSE" },
  { text: "garde le projet actuel malgré cette hésitation", intendedMeaning: "Préserver explicitement l'état adopté.", outcome: "PRESERVE" },
  { text: "ajoute également que l'étude sera multicentrique, probablement quatre centres", intendedMeaning: "Proposer un cadre multicentrique avec réserve sur le nombre exact.", outcome: "CANDIDATE" },
  { text: "je valide", intendedMeaning: "Confirmer le cadre multicentrique proposé.", outcome: "CONFIRM" },
  { text: "fais moi des propositions", intendedMeaning: "Demander les prochaines propositions gouvernées.", outcome: "PROPOSAL" },
  { text: "explique la première hypothèse ?", intendedMeaning: "Demander une explication sans adoption.", outcome: "DISCUSS" },
  { text: "on garde le projet actuel", intendedMeaning: "Préserver le Project après la discussion.", outcome: "PRESERVE" },
  { text: "ajoute aussi une analyse exploratoire selon l'ancienneté du diabète", intendedMeaning: "Proposer une analyse exploratoire.", outcome: "CANDIDATE" },
  { text: "je refuse", intendedMeaning: "Refuser cette analyse sans revenir sur les décisions antérieures.", outcome: "REFUSE" },
  { text: "propose moi des pistes", intendedMeaning: "Revenir à la navigation scientifique courante.", outcome: "PROPOSAL" },
];

export const FAMILY_C_TURNS: readonly SoakTurn[] = [
  { text: "je veux concevoir une étude de laboratoire comparant deux traitements thermiques d'un alliage d'aluminium pour voir leur effet sur la résistance en fatigue, sur 60 éprouvettes réparties par lots, essais à 20 °C", intendedMeaning: "Construire une étude expérimentale non médicale.", outcome: "CANDIDATE" },
  { text: "je valide", intendedMeaning: "Confirmer le premier Project matériaux.", outcome: "CONFIRM" },
  { text: "ajoute aussi un vieillissement humide de 40 cycles avant l'essai mécanique", intendedMeaning: "Ajouter une exposition expérimentale structurée.", outcome: "CANDIDATE" },
  { text: "c'est bon", intendedMeaning: "Confirmer l'exposition.", outcome: "CONFIRM" },
  { text: "en fait remplace 40 cycles par 60 cycles, peut-être que l'effet sera plus visible", intendedMeaning: "Proposer une correction quantitative sans promouvoir la supposition.", outcome: "CANDIDATE" },
  { text: "je refuse", intendedMeaning: "Refuser la correction et conserver 40 cycles.", outcome: "REFUSE" },
  { text: "garde le projet actuel", intendedMeaning: "Préserver l'état adopté.", outcome: "PRESERVE" },
  { text: "ajoute également une lecture en aveugle des ruptures par deux opérateurs", intendedMeaning: "Ajouter une contrainte de lecture indépendante.", outcome: "CANDIDATE" },
  { text: "je valide", intendedMeaning: "Confirmer la lecture en aveugle.", outcome: "CONFIRM" },
  { text: "fais moi des propositions", intendedMeaning: "Demander des propositions depuis le Project matériaux courant.", outcome: "PROPOSAL" },
  { text: "explique la première hypothèse ?", intendedMeaning: "Demander une explication réversible.", outcome: "DISCUSS" },
  { text: "on garde le projet actuel", intendedMeaning: "Préserver le Project après discussion.", outcome: "PRESERVE" },
  { text: "ajoute aussi la rugosité de surface comme mesure secondaire", intendedMeaning: "Proposer une mesure secondaire.", outcome: "CANDIDATE" },
  { text: "je refuse", intendedMeaning: "Refuser cette mesure secondaire.", outcome: "REFUSE" },
  { text: "donne moi des pistes", intendedMeaning: "Reprendre le corridor de proposition gouverné.", outcome: "PROPOSAL" },
];

/** Independent acceptance oracle: scientific meaning to observe after the real materializer, not provider assertions. */
export const SEMANTIC_TURN_EXPECTATIONS: Readonly<Record<string, readonly RegExp[]>> = {
  [T01]: [/viabilité myocardique/iu, /immédiate/iu, /différée/iu, /double aveugle/iu, /J3.{1,3}J6/iu,
    /cinétique segmentaire/iu, /strain/iu, /T1\/T2/u, /précoce et tardif/iu, /lésions microvasculaires.*3 min/iu],
  [T02]: [/pourcentage.*masse VG.*lésions microvasculaires/iu],
  [T04]: [/primo.infarctus/iu, /silencieux/iu, /35/iu, /85/iu, /tout venant/iu,
    /contre.indication.*IRM/iu, /coronarien/iu, /populations sensibles/iu],
  [FAMILY_A_TURNS[6]!.text]: [/6 mois/iu, /reste à discuter/iu],
  [FAMILY_A_TURNS[8]!.text]: [/12 mois/iu, /événements cardiovasculaires/iu],
  [FAMILY_A_TURNS[13]!.text]: [/analyse exploratoire.*territoire/iu],
  [FAMILY_B_TURNS[0]!.text]: [/adultes.*diabète de type 2/iu, /infirmier/iu, /suivi habituel/iu, /randomisé ouvert/iu, /HbA1c.*24 semaines/iu],
  [FAMILY_B_TURNS[2]!.text]: [/hypoglycémies sévères/iu],
  [FAMILY_B_TURNS[4]!.text]: [/36 semaines/iu],
  [FAMILY_B_TURNS[7]!.text]: [/multicentrique/iu, /quatre centres.*sans confirmation/iu],
  [FAMILY_B_TURNS[12]!.text]: [/analyse exploratoire.*ancienneté/iu],
  [FAMILY_C_TURNS[0]!.text]: [/60 éprouvettes/iu, /aluminium/iu, /thermique A/iu, /thermique B/iu, /fatigue/iu, /20 °C/u],
  [FAMILY_C_TURNS[2]!.text]: [/vieillissement humide.*40 cycles/iu],
  [FAMILY_C_TURNS[4]!.text]: [/60 cycles/iu],
  [FAMILY_C_TURNS[7]!.text]: [/aveugle.*deux opérateurs/iu],
  [FAMILY_C_TURNS[12]!.text]: [/rugosité de surface/iu],
};

const anchoredChange = (
  sourceAnchorId: string,
  candidateRef: string,
  proposedType: string,
  content: string,
  studyRole?: string,
  epistemicState: "KNOWN" | "UNKNOWN" = "KNOWN",
) => ({
  operation: "ADD",
  sourceAnchorId,
  candidateRef,
  semanticIdentity: candidateRef,
  proposedType,
  content,
  polarity: "AFFIRMED",
  ...(studyRole ? { studyRole } : {}),
  epistemicStatus: "EXPLICIT_USER_STATED",
  epistemicState,
  assertionKind: "USER_STATED",
  evidenceRefs: [sourceAnchorId],
});

const firstTurnReplay = (request: ExtractionReplayContext) => {
  const sourceAnchorId = request.sourceAnchorId;
  return {
    changes: [
      anchoredChange(sourceAnchorId, "condition:post-idm", "CONDITION", "Contexte post-infarctus du myocarde (IDM)"),
      anchoredChange(sourceAnchorId, "objective:reperfusion-viability", "OBJECTIVE", "Évaluer l'efficacité des stratégies de reperfusion sur la viabilité myocardique"),
      anchoredChange(sourceAnchorId, "intervention:stent-immediate", "INTERVENTION", "Mise en place immédiate d'un stent", "INTERVENTION_ARM"),
      anchoredChange(sourceAnchorId, "comparator:stent-delayed", "COMPARATOR", "Mise en place différée d'un stent", "COMPARATOR_ARM"),
      anchoredChange(sourceAnchorId, "design:two-groups-double-blind", "STUDY_DESIGN", "Étude à deux groupes en double aveugle"),
      anchoredChange(sourceAnchorId, "modality:mri", "IMAGING_MODALITY", "IRM"),
      anchoredChange(sourceAnchorId, "acquisition:mri-j3-j6", "ACQUISITION", "Acquisition IRM à J3–J6"),
      anchoredChange(sourceAnchorId, "variable:segmental-motion", "CANONICAL_VARIABLE", "Cinétique segmentaire"),
      anchoredChange(sourceAnchorId, "variable:strain", "CANONICAL_VARIABLE", "Strain"),
      anchoredChange(sourceAnchorId, "variable:t1-t2", "CANONICAL_VARIABLE", "T1/T2"),
      anchoredChange(sourceAnchorId, "information:early-late", "PROJECT_INFORMATION", "La signification de précoce et tardif reste à préciser", undefined, "UNKNOWN"),
      anchoredChange(sourceAnchorId, "variable:microvascular-lesions", "CANONICAL_VARIABLE", "Taille des lésions microvasculaires", "OUTCOME_ROLE"),
      anchoredChange(sourceAnchorId, "endpoint:microvascular-lesions", "ENDPOINT", "Taille des lésions microvasculaires à 3 min post-injection", "PRIMARY_ENDPOINT"),
    ],
    relations: [{
      relationRef: "relation:immediate-vs-delayed",
      sourceAnchorId,
      relationType: "COMPARES_WITH",
      sourceObjectRef: "intervention:stent-immediate",
      targetObjectRef: "comparator:stent-delayed",
      polarity: "AFFIRMED",
      epistemicStatus: "EXPLICIT_USER_STATED",
      epistemicState: "KNOWN",
      assertionKind: "USER_STATED",
      evidenceRefs: [sourceAnchorId],
    }],
    temporalQualifications: [],
    expectedVariableOccasions: [{
      operation: "ADD",
      occasionId: "occasion:microvascular-lesions:3-min-post-injection",
      sourceAnchorId,
      variableProjectRef: "variable:microvascular-lesions",
      anchor: {
        kind: "TIMEPOINT",
        direction: "AFTER",
        unit: "minutes",
        offset: 3,
        lowerBound: null,
        upperBound: null,
        relativeEventLabel: "injection",
        tolerance: null,
        reference: { status: "EXPLICIT", bindingStatus: "PROJECT_REF_UNRESOLVED" },
      },
      studyUnitOrGroupRef: null,
      applicableContext: null,
      assertionKind: "USER_STATED",
      evidenceRefs: [sourceAnchorId],
    }],
  };
};

const endpointCorrectionReplay = (request: ExtractionReplayContext) => {
  if (!request.currentProject) throw new Error("RUNTIME_REPLAY_CURRENT_PROJECT_REQUIRED");
  const sourceAnchorId = request.sourceAnchorId;
  const state = request.currentProject;
  const endpoint = state.objects.find((item) => item.scientificRole === "PRIMARY_ENDPOINT");
  const variable = state.objects.find((item) => item.type === "CANONICAL_VARIABLE" && /lésions microvasculaires/iu.test(item.content));
  if (!endpoint || !variable) throw new Error("RUNTIME_REPLAY_ENDPOINT_VARIABLE_REQUIRED");
  const replace = (targetProjectRef: string, proposedType: string, studyRole?: string) => ({
    operation: "REPLACE",
    sourceAnchorId,
    targetProjectRef,
    proposedType,
    content: NORMALIZED_ENDPOINT,
    polarity: "AFFIRMED",
    ...(studyRole ? { studyRole } : {}),
    epistemicStatus: "EXPLICIT_USER_STATED",
    epistemicState: "KNOWN",
    assertionKind: "USER_STATED",
    evidenceRefs: [sourceAnchorId],
  });
  return {
    changes: [
      replace(endpoint.stableId, "ENDPOINT", "PRIMARY_ENDPOINT"),
      replace(variable.stableId, "CANONICAL_VARIABLE", "OUTCOME_ROLE"),
    ],
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
  };
};

const populationReplay = (request: ExtractionReplayContext) => {
  if (!request.currentProject) throw new Error("RUNTIME_REPLAY_CURRENT_PROJECT_REQUIRED");
  const sourceAnchorId = request.sourceAnchorId;
  return {
    changes: [
      anchoredChange(sourceAnchorId, "population:primary-mi", "POPULATION", "Population de primo-infarctus du myocarde"),
      anchoredChange(sourceAnchorId, "information:silent-mi", "PROJECT_INFORMATION", "La qualification de primo-infarctus doit tenir compte d'éventuels infarctus silencieux antérieurs", undefined, "UNKNOWN"),
      anchoredChange(sourceAnchorId, "criterion:age-range", "ELIGIBILITY_CRITERION", "Tranche d'âge : 35/85 ans"),
      anchoredChange(sourceAnchorId, "criterion:all-comers", "INCLUSION_CRITERION", "Tout venant"),
      anchoredChange(sourceAnchorId, "criterion:mri-contraindications", "EXCLUSION_CRITERION", "Contre-indication à l'IRM cardiaque ou au produit de contraste, par exemple pacemaker"),
      anchoredChange(sourceAnchorId, "criterion:prior-coronary-disease", "EXCLUSION_CRITERION", "Antécédent de problème coronarien"),
      anchoredChange(sourceAnchorId, "criterion:vulnerable-populations", "EXCLUSION_CRITERION", "Exclure toutes les populations sensibles"),
    ],
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
  };
};

type AddSpec = Readonly<{ id: string; type: string; content: string; studyRole?: string; epistemicState?: "KNOWN" | "UNKNOWN" }>;

const addReplay = (
  request: ExtractionReplayContext,
  specs: readonly AddSpec[],
  comparisons: readonly Readonly<{ id: string; sourceRef: string; targetRef: string }>[] = [],
) => {
  const sourceAnchorId = request.sourceAnchorId;
  return {
    changes: specs.map((item) => anchoredChange(sourceAnchorId, item.id, item.type, item.content, item.studyRole, item.epistemicState)),
    relations: comparisons.map((comparison) => ({
      relationRef: comparison.id,
      sourceAnchorId,
      relationType: "COMPARES_WITH",
      sourceObjectRef: comparison.sourceRef,
      targetObjectRef: comparison.targetRef,
      polarity: "AFFIRMED",
      epistemicStatus: "EXPLICIT_USER_STATED",
      epistemicState: "KNOWN",
      assertionKind: "USER_STATED",
      evidenceRefs: [sourceAnchorId],
    })),
    temporalQualifications: [],
    expectedVariableOccasions: [],
  };
};

const replaceCurrentReplay = (request: ExtractionReplayContext, input: {
  objectType: string;
  contentPattern: RegExp;
  proposedType: string;
  content: string;
  studyRole?: string;
}) => {
  if (!request.currentProject) throw new Error("RUNTIME_REPLAY_CURRENT_PROJECT_REQUIRED");
  const state = request.currentProject;
  const target = state.objects.find((item) => item.type === input.objectType && input.contentPattern.test(item.content));
  if (!target) throw new Error(`RUNTIME_REPLAY_TARGET_REQUIRED:${input.objectType}:${input.contentPattern.source}`);
  const sourceAnchorId = request.sourceAnchorId;
  return {
    changes: [{
      operation: "REPLACE",
      sourceAnchorId,
      targetProjectRef: target.stableId,
      proposedType: input.proposedType,
      content: input.content,
      polarity: "AFFIRMED",
      ...(input.studyRole ? { studyRole: input.studyRole } : {}),
      epistemicStatus: "EXPLICIT_USER_STATED",
      epistemicState: "KNOWN",
      assertionKind: "USER_STATED",
      evidenceRefs: [sourceAnchorId],
    }],
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
  };
};

const EXTRA_LONG_REPLAYS: Readonly<Record<string, (request: ExtractionReplayContext) => unknown>> = {
  [FAMILY_A_TURNS[6]!.text]: (request) => addReplay(request, [
    { id: "visit:clinical-followup-6m", type: "VISIT", content: "Visite de suivi clinique à 6 mois" },
    { id: "uncertainty:followup-6m", type: "PROJECT_INFORMATION", content: "La pertinence d'un suivi à 6 mois reste à discuter", epistemicState: "UNKNOWN" },
  ]),
  [FAMILY_A_TURNS[8]!.text]: (request) => addReplay(request, [
    { id: "visit:clinical-followup-12m", type: "VISIT", content: "Visite de suivi clinique à 12 mois" },
    { id: "endpoint:cardiovascular-events", type: "ENDPOINT", content: "Événements cardiovasculaires au suivi" },
  ]),
  [FAMILY_A_TURNS[13]!.text]: (request) => addReplay(request, [
    { id: "analysis:infarct-territory", type: "ANALYSIS_SPECIFICATION", content: "Analyse exploratoire selon le territoire de l'infarctus" },
  ]),
  [FAMILY_B_TURNS[0]!.text]: (request) => addReplay(request, [
    { id: "objective:coordinated-care", type: "OBJECTIVE", content: "Comparer l'effet d'un suivi coordonné infirmier au suivi habituel sur le contrôle glycémique" },
    { id: "population:type-2-diabetes-adults", type: "POPULATION", content: "Adultes avec diabète de type 2" },
    { id: "intervention:nurse-coordinated-care", type: "INTERVENTION", content: "Suivi coordonné infirmier", studyRole: "INTERVENTION_ARM" },
    { id: "comparator:usual-care", type: "COMPARATOR", content: "Suivi habituel", studyRole: "COMPARATOR_ARM" },
    { id: "design:randomized-open", type: "STUDY_DESIGN", content: "Essai randomisé ouvert" },
    { id: "variable:hba1c-change", type: "CANONICAL_VARIABLE", content: "Variation de l'HbA1c" },
    { id: "endpoint:hba1c-24w", type: "ENDPOINT", content: "Variation de l'HbA1c à 24 semaines", studyRole: "PRIMARY_ENDPOINT" },
    { id: "visit:24-weeks", type: "VISIT", content: "Suivi à 24 semaines" },
  ], [{ id: "relation:coordinated-vs-usual", sourceRef: "intervention:nurse-coordinated-care", targetRef: "comparator:usual-care" }]),
  [FAMILY_B_TURNS[2]!.text]: (request) => addReplay(request, [
    { id: "endpoint:severe-hypoglycemia", type: "ENDPOINT", content: "Hypoglycémies sévères" },
  ]),
  [FAMILY_B_TURNS[4]!.text]: (request) => replaceCurrentReplay(request, {
    objectType: "VISIT", contentPattern: /24 semaines/iu, proposedType: "VISIT", content: "Suivi à 36 semaines",
  }),
  [FAMILY_B_TURNS[7]!.text]: (request) => addReplay(request, [
    { id: "setting:multicenter", type: "PROJECT_INFORMATION", content: "Étude multicentrique ; quatre centres envisagés sans confirmation définitive", epistemicState: "UNKNOWN" },
  ]),
  [FAMILY_B_TURNS[12]!.text]: (request) => addReplay(request, [
    { id: "analysis:diabetes-duration", type: "ANALYSIS_SPECIFICATION", content: "Analyse exploratoire selon l'ancienneté du diabète" },
  ]),
  [FAMILY_C_TURNS[0]!.text]: (request) => addReplay(request, [
    { id: "objective:thermal-fatigue", type: "OBJECTIVE", content: "Comparer l'effet de deux traitements thermiques sur la résistance en fatigue" },
    { id: "population:aluminum-specimens", type: "POPULATION", content: "60 éprouvettes d'alliage d'aluminium réparties par lots" },
    { id: "intervention:thermal-a", type: "INTERVENTION", content: "Traitement thermique A", studyRole: "INTERVENTION_ARM" },
    { id: "comparator:thermal-b", type: "COMPARATOR", content: "Traitement thermique B", studyRole: "COMPARATOR_ARM" },
    { id: "design:controlled-laboratory", type: "STUDY_DESIGN", content: "Étude expérimentale contrôlée en laboratoire" },
    { id: "variable:fatigue-resistance", type: "CANONICAL_VARIABLE", content: "Résistance en fatigue" },
    { id: "endpoint:fatigue-resistance", type: "ENDPOINT", content: "Résistance en fatigue des éprouvettes", studyRole: "PRIMARY_ENDPOINT" },
    { id: "condition:test-temperature", type: "PROJECT_INFORMATION", content: "Essais mécaniques à 20 °C" },
  ], [{ id: "relation:thermal-a-vs-b", sourceRef: "intervention:thermal-a", targetRef: "comparator:thermal-b" }]),
  [FAMILY_C_TURNS[2]!.text]: (request) => addReplay(request, [
    { id: "exposure:humidity-40-cycles", type: "INTERVENTION", content: "Vieillissement humide de 40 cycles avant l'essai mécanique" },
  ]),
  [FAMILY_C_TURNS[4]!.text]: (request) => replaceCurrentReplay(request, {
    objectType: "INTERVENTION_OR_EXPOSURE", contentPattern: /40 cycles/iu,
    proposedType: "INTERVENTION", content: "Vieillissement humide de 60 cycles avant l'essai mécanique",
  }),
  [FAMILY_C_TURNS[7]!.text]: (request) => addReplay(request, [
    { id: "analysis:blind-fracture-reading", type: "ANALYSIS_SPECIFICATION", content: "Lecture en aveugle des ruptures par deux opérateurs" },
  ]),
  [FAMILY_C_TURNS[12]!.text]: (request) => addReplay(request, [
    { id: "variable:surface-roughness", type: "CANONICAL_VARIABLE", content: "Rugosité de surface" },
  ]),
};

const extractionReplayFor = (
  request: ExtractionReplayContext,
  additionalReplays: Readonly<Record<string, (request: ExtractionReplayContext) => unknown>> = {},
) => {
  const latest = request.sourceText;
  if (latest === T01) return firstTurnReplay(request);
  if (latest === T02) return endpointCorrectionReplay(request);
  if (latest === T04) return populationReplay(request);
  if (latest && additionalReplays[latest]) return additionalReplays[latest](request);
  throw new Error(`RUNTIME_REPLAY_EXTRACTION_NOT_FROZEN:${latest ?? "NO_USER_TURN"}`);
};

export type ProviderCallWitness = Readonly<{
  endpoint: string;
  turnText: string;
  requestDigest: string;
  requestBody: unknown;
  responseBody: unknown;
  responseStatus: number;
  provenance: typeof REPLAY_PROVENANCE;
}>;

function required(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new Error(`OFFLINE_REPLAY_CONTRACT:${reason}`);
}

/** Parse only the serialized provider input; there is no access to UI/session/Project state. */
export const extractionContextFromProviderBody = (body: Record<string, unknown>): ExtractionReplayContext => {
  required(body.model === "gpt-5.6-terra", "EXTRACTION_MODEL_CHANGED");
  required(typeof body.instructions === "string" && body.instructions.includes("sourceAnchorId"), "EXTRACTION_INSTRUCTIONS_MISSING");
  const format = (body.text as { format?: { type?: string; name?: string; schema?: { properties?: Record<string, unknown> } } })?.format;
  required(format?.type === "json_schema" && format.name === "propose_persistent_project_delta"
    && format.schema?.properties?.changes && format.schema.properties.expectedVariableOccasions, "EXTRACTION_SCHEMA_CHANGED");
  required(typeof body.input === "string", "EXTRACTION_INPUT_MISSING");
  const blocks = body.input.split("\n\n");
  const sourceBlock = blocks.find((part) => part.startsWith("DERNIER MESSAGE UTILISATEUR"));
  const catalogBlock = blocks.find((part) => part.startsWith("CATALOGUE D'ANCRAGES"));
  const projectBlock = blocks.find((part) => part.startsWith("RESEARCH PROJECT ADOPTÉ"));
  required(sourceBlock && catalogBlock && projectBlock, "REQUIRED_PROVIDER_CONTEXT_MISSING");
  const sourceText = sourceBlock.slice(sourceBlock.indexOf("\n") + 1);
  const catalog = JSON.parse(catalogBlock.slice(catalogBlock.indexOf("\n") + 1)) as {
    currentUserTurnId: string;
    anchors: Array<{ anchorId: string; turnId: string; fragmentKind: string; exactText: string }>;
  };
  const full = catalog.anchors.find((item) => item.fragmentKind === "FULL_TURN");
  required(full && full.exactText === sourceText && full.turnId === catalog.currentUserTurnId, "SOURCE_CATALOG_MISMATCH");
  const currentProject = JSON.parse(projectBlock.slice(projectBlock.indexOf("\n") + 1)) as ProjectContextSnapshot | null;
  const initialTexts = [T01, FAMILY_B_TURNS[0]!.text, FAMILY_C_TURNS[0]!.text];
  required(initialTexts.includes(sourceText) ? currentProject === null : currentProject?.contract === "PROJECT_CONTEXT_SNAPSHOT",
    "CURRENT_PROJECT_CONTEXT_MISSING_OR_UNEXPECTED");
  if (currentProject) {
    required(currentProject.sourceProjectRef && currentProject.sourceProjectVersion && currentProject.sourceProjectDigest
      && currentProject.objects.length > 0 && currentProject.objects.every((item) => item.stableId && item.versionRef), "PROJECT_IDENTITY_INCOMPLETE");
  }
  return { sourceText, sourceAnchorId: full.anchorId, currentProject };
};

const syntheticGovernedHow = (envelope: GovernedConversationEnvelope) => {
  required(envelope.contract === "GOVERNED_CONVERSATION_REALIZATION" && envelope.whatRef
    && envelope.sourceTurnRef && envelope.humanDecisionBoundary === "NO_ADOPTION_NO_PROJECT_WRITE", "GOVERNED_HOW_ENVELOPE_MISSING");
  const contents = envelope.authorizedContent.filter((item) => envelope.requiredContentRefs.includes(item.ref));
  const target = contents.find((item) => envelope.targetRefs.includes(item.ref)) ?? contents[0];
  const actionWitness = envelope.action === "ASK_QUESTION"
    ? `Pouvez-vous préciser ${target?.text.replace(/[?!.]+$/u, "") ?? envelope.purpose} ?`
    : envelope.intervention.kind === "EXPLAIN_REFERENCED_CONTENT"
    ? "Ces éléments sont distincts et doivent être discutés séparément."
    : "Vous avez indiqué les éléments suivants.";
  const fragments = envelope.action === "ASK_QUESTION" ? [] : [
    ...contents.map((item) => item.text),
    ...envelope.requiredVisibleObligations.map((item) => item.exactText),
    ...envelope.protectedLiterals.map((item) => item.literal),
  ];
  const assistantReply = [actionWitness, ...new Set(fragments)].join("\n");
  return {
    assistantReply,
    claim: {
      whatRef: envelope.whatRef,
      action: envelope.action,
      actionWitness,
      interventionKind: envelope.intervention.kind,
      contentSource: envelope.intervention.contentSource,
      targetRefs: envelope.targetRefs,
      informationNeedRefs: envelope.selectedInformationNeedRef ? [envelope.selectedInformationNeedRef] : [],
      contentClaims: contents.map((item) => ({ ref: item.ref, witness: envelope.action === "ASK_QUESTION" ? item.text.replace(/[?!.]+$/u, "") : item.text, status: item.status })),
      relationClaims: envelope.requiredRelations.map((item) => ({ ...item, witness: contents.map((content) => content.text).join("\n") })),
      adoptionClaimed: false,
      projectWriteClaimed: false,
    },
  };
};

export const replayJsonResponse = (body: unknown, status = 200): Response => {
  const serialized = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => name.toLowerCase() === "content-type" ? "application/json" : null },
    json: async () => JSON.parse(serialized),
    text: async () => serialized,
  } as unknown as Response;
};

/** Offline contract fixture only. Each immutable response is keyed by the ACTUAL serialized request digest. */
export const createLongHorizonProviderReplay = (
  witnesses: ProviderCallWitness[],
  options: { how: "SUCCESS" | "UNAVAILABLE" } = { how: "SUCCESS" },
): typeof fetch => {
  const responses = new Map<string, { body: unknown; status: number; turnText: string }>();
  return (async (resource: string | URL | Request, init?: RequestInit) => {
    const endpoint = String(resource);
    required(init?.method === "POST" && typeof init.body === "string", "PROVIDER_POST_BODY_REQUIRED");
    const requestBody = JSON.parse(init.body) as Record<string, unknown>;
    const requestDigest = logicalDigest({ endpoint, method: init.method, body: requestBody });
    let fixture = responses.get(requestDigest);
    if (!fixture && endpoint === "https://api.openai.com/v1/responses" && requestBody.model === "gpt-5.6-luna") {
      required((requestBody.reasoning as { effort?: string })?.effort === "low", "LANGUAGE_EFFORT_CHANGED");
      required(typeof requestBody.input === "string" && requestBody.input.includes("\nSOURCE_TEXT:\n"), "LANGUAGE_SOURCE_MISSING");
      const sourceText = requestBody.input.split("\nSOURCE_TEXT:\n")[1]!;
      required(sourceText === FAMILY_B_TURNS[2]!.text, "LANGUAGE_FIXTURE_NOT_FROZEN");
      const semanticInvariants = ["NEGATION", "UNCERTAINTY", "CONDITIONALITY", "COMPARISON", "TEMPORAL_RELATION"]
        .map((invariantId) => ({ invariantId, attestationStatus: "ATTESTED", sourcePresent: false,
          preserved: false, sourceEvidence: [], targetEvidence: [] }));
      fixture = { turnText: sourceText, status: 200, body: {
        id: `synthetic-luna:${requestDigest}`, model: "gpt-5.6-luna", status: "completed",
        output_text: JSON.stringify({ detectedLanguage: "fr", supportStatus: "SUPPORTED", qualificationStatus: "QUALIFIED",
          translatedText: sourceText, translatedTextLanguage: "fr", ambiguityPreserved: true, semanticInvariants, limitations: [] }),
        usage: { input_tokens: 600, output_tokens: 120, total_tokens: 720 },
      } };
    }
    if (!fixture && endpoint === "https://api.openai.com/v1/responses") {
      const context = extractionContextFromProviderBody(requestBody);
      fixture = {
        turnText: context.sourceText,
        status: 200,
        body: { id: `synthetic-terra:${requestDigest}`, model: "gpt-5.6-terra", status: "completed",
          output_text: JSON.stringify(extractionReplayFor(context, EXTRA_LONG_REPLAYS)),
          usage: { input_tokens: 4_000, output_tokens: 800, total_tokens: 4_800 } },
      };
    }
    if (!fixture && endpoint.startsWith("https://generativelanguage.googleapis.com/")) {
      required(endpoint.includes("gemini-3.5-flash-lite:generateContent"), "HOW_MODEL_CHANGED");
      const contents = requestBody.contents as Array<{ parts: Array<{ text: string }> }>;
      required(contents?.[0]?.parts?.[0]?.text, "HOW_CONTEXT_MISSING");
      const envelope = JSON.parse(contents[0]!.parts[0]!.text) as GovernedConversationEnvelope;
      const output = syntheticGovernedHow(envelope);
      fixture = options.how === "UNAVAILABLE"
        ? { turnText: envelope.sourceTurnRef, status: 503, body: { error: { status: "UNAVAILABLE", message: "Synthetic HOW failure" } } }
        : { turnText: envelope.sourceTurnRef, status: 200, body: {
          responseId: `synthetic-gemini:${requestDigest}`, modelVersion: "gemini-3.5-flash-lite",
          candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }],
          usageMetadata: { promptTokenCount: 1_000, candidatesTokenCount: 250, totalTokenCount: 1_250 },
        } };
    }
    required(fixture, `UNEXPECTED_PROVIDER_ENDPOINT:${endpoint}`);
    responses.set(requestDigest, fixture);
    witnesses.push(Object.freeze({ endpoint, requestDigest, requestBody,
      responseBody: fixture.body, responseStatus: fixture.status, turnText: fixture.turnText, provenance: REPLAY_PROVENANCE }));
    return replayJsonResponse(fixture.body, fixture.status);
  }) as typeof fetch;
};
