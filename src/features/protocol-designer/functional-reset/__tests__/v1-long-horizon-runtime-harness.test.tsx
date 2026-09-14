import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import {
  buildPersistentSourceCatalog,
  constrainPersistentRelationsToCanonicalSignatures,
  materializePersistentSourceAnchors,
  validatePersistentProjectDelta,
  validatePersistentProviderContract,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import { ensureCanonicalProjectState } from "@/features/research-project-construction";
import { FUNCTIONAL_RESET_STORAGE_KEY, type FunctionalResetSession } from "../session";

const T01 = "je veux faire une étude évaluant l'effet de méthodes de reperfusion post IDM avec mise en place immédiate ou différée d'un stent afin d'évaluer l'efficacité sur la viabilité myocardique. avec donc deux groupes en double aveugle, une IRM a J3-6 évaluant la cinétique segmentaire, le strain, le T1/T2, le précoce et tardif le critere de jugement principale étant la taille des lésions microvasculaire a 3min post injection";
const T02 = "c'est ca mais a la place de taille j'utiliserais peut être % de la masse vg que représentent les lésions microvasculaires afin de pouvoir comparer les sujets entre eux.";
const T03 = "c'est bon";
const T04 = "alors on va prendre une population de primo infarctus (en gardant a l'esprit qu'il peut y avoir eu des infarctus silencieux). La tranche d'age va etre 35/85, les citeres c'est le tout venant. Bien sur en exclusion on met les contre indication à l'irm cardiaque (produit de contraste ou peacemaker par exemple), et les personnes qui ont deja eu des problemes coronariens. On exclu également toutes les populations sensibles et si tu vois autre chose on peut discuter";
const T05 = "fais moi des propositions";
const NORMALIZED_ENDPOINT = "Pourcentage de la masse VG représenté par les lésions microvasculaires";

type SoakTurn = Readonly<{
  text: string;
  intendedMeaning: string;
  outcome: "CANDIDATE" | "CONFIRM" | "REFUSE" | "PRESERVE" | "PROPOSAL" | "DISCUSS";
  confirmWithButton?: boolean;
}>;

const FAMILY_A_TURNS: readonly SoakTurn[] = [
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

const FAMILY_B_TURNS: readonly SoakTurn[] = [
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

const FAMILY_C_TURNS: readonly SoakTurn[] = [
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

type ProviderCallWitness = Readonly<{ endpoint: string; turnText: string }>;

const deterministicResponse = (
  body: unknown,
  status = 200,
  headers: Readonly<Record<string, string>> = { "content-type": "application/json" },
) => {
  const serialized = JSON.stringify(body);
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
  );
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => normalizedHeaders[name.toLowerCase()] ?? null },
    json: async () => JSON.parse(serialized) as unknown,
    text: async () => serialized,
  } as unknown as Response;
};

const currentSession = () => JSON.parse(
  window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!,
) as FunctionalResetSession;

const renderWorkspace = () => render(
  <HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>,
);

const submit = async (text: string) => {
  await act(async () => {
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: text } });
  });
  const send = screen.getByRole("button", { name: "Envoyer" });
  await waitFor(() => expect(send).not.toBeDisabled());
  await act(async () => {
    fireEvent.click(send);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const clickAndFlush = async (button: HTMLElement) => {
  await act(async () => {
    fireEvent.click(button);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const waitForComposerReady = async () => {
  await waitFor(() => expect(document.querySelector(".animate-spin")).toBeNull(), { timeout: 5_000 });
};

const waitForVisibleProjectRevision = async (revision: number) => {
  await waitFor(() => expect(
    within(screen.getByTestId("functional-research-project")).getByText(`Version ${revision}`),
  ).toBeInTheDocument(), { timeout: 5_000 });
};

const waitForPostAdoptionContinuation = async () => {
  const projectVersion = currentSession().project?.versionId;
  expect(projectVersion).toBeTruthy();
  await waitFor(() => expect(currentSession().bridgeTraces.some((trace) =>
    trace.requestKind === "POST_ADOPTION_QRY_CONTINUATION"
    && trace.projectVersionBefore === projectVersion,
  )).toBe(true), { timeout: 5_000 });
};

const anchoredChange = (
  sourceAnchorId: string,
  candidateRef: string,
  proposedType: string,
  content: string,
  studyRole?: string,
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
  epistemicState: "KNOWN",
  assertionKind: "USER_STATED",
  evidenceRefs: [sourceAnchorId],
});

const firstTurnReplay = (request: ProductBridgeRequest) => {
  const sourceAnchorId = buildPersistentSourceCatalog(request.conversation).anchors[0]!.anchorId;
  return {
    changes: [
      anchoredChange(sourceAnchorId, "condition:post-idm", "CONDITION", "Contexte post-infarctus du myocarde (IDM)"),
      anchoredChange(sourceAnchorId, "objective:reperfusion-viability", "OBJECTIVE", "Évaluer l'efficacité des stratégies de reperfusion sur la viabilité myocardique"),
      anchoredChange(sourceAnchorId, "intervention:stent-immediate", "INTERVENTION", "Mise en place immédiate d'un stent", "INTERVENTION_ARM"),
      anchoredChange(sourceAnchorId, "comparator:stent-delayed", "COMPARATOR", "Mise en place différée d'un stent", "COMPARATOR_ARM"),
      anchoredChange(sourceAnchorId, "design:two-groups-double-blind", "STUDY_DESIGN", "Étude à deux groupes en double aveugle"),
      anchoredChange(sourceAnchorId, "modality:mri", "IMAGING_MODALITY", "IRM"),
      anchoredChange(sourceAnchorId, "acquisition:mri-j3-j6", "ACQUISITION", "Acquisition IRM à J3–J6"),
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

const endpointCorrectionReplay = (request: ProductBridgeRequest) => {
  if (!request.currentProject) throw new Error("RUNTIME_REPLAY_CURRENT_PROJECT_REQUIRED");
  const sourceAnchorId = buildPersistentSourceCatalog(request.conversation).anchors[0]!.anchorId;
  const state = ensureCanonicalProjectState(request.currentProject);
  const endpoint = state.objects.find((item) => item.actuality === "CURRENT" && item.scientificRole === "PRIMARY_ENDPOINT");
  const variable = state.objects.find((item) => item.actuality === "CURRENT"
    && item.objectType === "CANONICAL_VARIABLE" && /lésions microvasculaires/iu.test(item.content));
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
      replace(endpoint.objectId, "ENDPOINT", "PRIMARY_ENDPOINT"),
      replace(variable.objectId, "CANONICAL_VARIABLE", "OUTCOME_ROLE"),
    ],
    relations: [],
    temporalQualifications: [],
    expectedVariableOccasions: [],
  };
};

const populationReplay = (request: ProductBridgeRequest) => {
  if (!request.currentProject) throw new Error("RUNTIME_REPLAY_CURRENT_PROJECT_REQUIRED");
  const sourceAnchorId = buildPersistentSourceCatalog(request.conversation).anchors[0]!.anchorId;
  return {
    changes: [
      anchoredChange(sourceAnchorId, "population:primary-mi", "POPULATION", "Population de primo-infarctus du myocarde"),
      anchoredChange(sourceAnchorId, "information:silent-mi", "PROJECT_INFORMATION", "La qualification de primo-infarctus doit tenir compte d'éventuels infarctus silencieux antérieurs"),
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

type AddSpec = Readonly<{ id: string; type: string; content: string; studyRole?: string }>;

const addReplay = (
  request: ProductBridgeRequest,
  specs: readonly AddSpec[],
  comparisons: readonly Readonly<{ id: string; sourceRef: string; targetRef: string }>[] = [],
) => {
  const sourceAnchorId = buildPersistentSourceCatalog(request.conversation).anchors[0]!.anchorId;
  return {
    changes: specs.map((item) => anchoredChange(sourceAnchorId, item.id, item.type, item.content, item.studyRole)),
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

const replaceCurrentReplay = (request: ProductBridgeRequest, input: {
  objectType: string;
  contentPattern: RegExp;
  proposedType: string;
  content: string;
  studyRole?: string;
}) => {
  if (!request.currentProject) throw new Error("RUNTIME_REPLAY_CURRENT_PROJECT_REQUIRED");
  const state = ensureCanonicalProjectState(request.currentProject);
  const target = state.objects.find((item) => item.actuality === "CURRENT"
    && item.objectType === input.objectType && input.contentPattern.test(item.content));
  if (!target) throw new Error(`RUNTIME_REPLAY_TARGET_REQUIRED:${input.objectType}:${input.contentPattern.source}`);
  const sourceAnchorId = buildPersistentSourceCatalog(request.conversation).anchors[0]!.anchorId;
  return {
    changes: [{
      operation: "REPLACE",
      sourceAnchorId,
      targetProjectRef: target.objectId,
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

const EXTRA_LONG_REPLAYS: Readonly<Record<string, (request: ProductBridgeRequest) => unknown>> = {
  [FAMILY_A_TURNS[6]!.text]: (request) => addReplay(request, [
    { id: "visit:clinical-followup-6m", type: "VISIT", content: "Visite de suivi clinique à 6 mois" },
    { id: "uncertainty:followup-6m", type: "PROJECT_INFORMATION", content: "La pertinence d'un suivi à 6 mois reste à discuter" },
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
    { id: "setting:multicenter", type: "PROJECT_INFORMATION", content: "Étude multicentrique ; quatre centres envisagés sans confirmation définitive" },
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
  request: ProductBridgeRequest,
  additionalReplays: Readonly<Record<string, (request: ProductBridgeRequest) => unknown>> = {},
) => {
  const latest = request.conversation.turns.filter((turn) => turn.role === "USER").at(-1)?.content;
  if (latest === T01) return firstTurnReplay(request);
  if (latest === T02) return endpointCorrectionReplay(request);
  if (latest === T04) return populationReplay(request);
  if (latest && additionalReplays[latest]) return additionalReplays[latest](request);
  throw new Error(`RUNTIME_REPLAY_EXTRACTION_NOT_FROZEN:${latest ?? "NO_USER_TURN"}`);
};

const installRuntimeReplayTransport = (
  witnesses: ProviderCallWitness[],
  additionalReplays: Readonly<Record<string, (request: ProductBridgeRequest) => unknown>> = {},
) => {
  const browserTransport = vi.fn(async (resource: string | URL | Request, init?: RequestInit) => {
    if (String(resource) !== "/api/protocol-designer-bridge" || typeof init?.body !== "string") {
      throw new Error(`RUNTIME_REPLAY_UNEXPECTED_BROWSER_TRANSPORT:${String(resource)}`);
    }
    const parsedRequest = JSON.parse(init.body) as ProductBridgeRequest | {
      operation: "LANGUAGE_PROJECTION";
      sourceText: string;
    };
    const languageProjection = "operation" in parsedRequest && parsedRequest.operation === "LANGUAGE_PROJECTION";
    const productRequest = languageProjection ? null : parsedRequest as ProductBridgeRequest;
    const latest = languageProjection
      ? parsedRequest.sourceText
      : productRequest!.conversation.turns.filter((turn) => turn.role === "USER").at(-1)?.content ?? "";
    const providerReplay = vi.fn(async (providerResource: string | URL | Request) => {
      const endpoint = String(providerResource);
      witnesses.push({ endpoint, turnText: latest });
      if (endpoint === "https://api.openai.com/v1/responses") {
        if (languageProjection) {
          const absentSemanticInvariants = ["NEGATION", "UNCERTAINTY", "CONDITIONALITY", "COMPARISON", "TEMPORAL_RELATION"]
            .map((invariantId) => ({
              invariantId,
              attestationStatus: "ATTESTED",
              sourcePresent: false,
              preserved: false,
              sourceEvidence: [],
              targetEvidence: [],
            }));
          return deterministicResponse({
            id: `offline-luna:${witnesses.length}`,
            model: "gpt-5.6-luna",
            status: "completed",
            output_text: JSON.stringify({
              detectedLanguage: "fr",
              supportStatus: "SUPPORTED",
              qualificationStatus: "QUALIFIED",
              translatedText: latest,
              translatedTextLanguage: "fr",
              ambiguityPreserved: true,
              semanticInvariants: absentSemanticInvariants,
              limitations: [],
            }),
            usage: { input_tokens: 600, output_tokens: 120, total_tokens: 720 },
          }, 200, { "content-type": "application/json", "x-request-id": `offline-request:${witnesses.length}` });
        }
        const structuredArgs = extractionReplayFor(productRequest!, additionalReplays);
        const providerContract = validatePersistentProviderContract(structuredArgs);
        const catalog = buildPersistentSourceCatalog(productRequest!.conversation);
        const materialized = materializePersistentSourceAnchors({
          value: structuredArgs,
          catalog,
          currentUserTurn: { turnId: catalog.currentUserTurnId, content: latest },
        });
        const constrained = materialized.value
          ? constrainPersistentRelationsToCanonicalSignatures(materialized.value, productRequest!.currentProject)
          : { value: null };
        const checked = constrained.value
          ? validatePersistentProjectDelta(constrained.value, latest, productRequest!.currentProject, productRequest!.conversation)
          : null;
        if (!providerContract.valid || !materialized.valid || !checked?.validation.valid) {
          throw new Error(`FROZEN_EXTRACTION_INVALID:${latest}:${JSON.stringify({
            provider: providerContract.blocks,
            materialized: materialized.blocks,
            canonical: checked?.validation.blocks ?? [],
          })}`);
        }
        return deterministicResponse({
          id: `offline-terra:${witnesses.length}`,
          model: "gpt-5.6-terra",
          status: "completed",
          output_text: JSON.stringify(structuredArgs),
          usage: { input_tokens: 4_000, output_tokens: 800, total_tokens: 4_800 },
        }, 200, { "content-type": "application/json", "x-request-id": `offline-request:${witnesses.length}` });
      }
      if (endpoint.startsWith("https://generativelanguage.googleapis.com/")) {
        return deterministicResponse({ error: { status: "UNAVAILABLE", message: "Frozen HOW failure witness" } }, 503);
      }
      throw new Error(`RUNTIME_REPLAY_UNEXPECTED_PROVIDER_ENDPOINT:${endpoint}`);
    }) as unknown as typeof fetch;
    const result = await executeProtocolDesignerBridge({
      body: parsedRequest,
      apiKey: "offline-gemini-key",
      openAiApiKey: "offline-openai-key",
      fetchImpl: providerReplay,
      now: () => Date.parse("2026-09-14T08:00:00.000Z"),
    });
    if (result.status !== 200) {
      throw new Error(`FROZEN_BRIDGE_FAILURE:${latest}:${JSON.stringify(result.body)}`);
    }
    return deterministicResponse(result.body, result.status);
  });
  vi.stubGlobal("fetch", browserTransport);
  return browserTransport;
};

const productBridgeRequestCount = (browserTransport: ReturnType<typeof vi.fn>) => browserTransport.mock.calls
  .filter(([, init]) => typeof init?.body === "string"
    && (JSON.parse(init.body as string) as { operation?: string }).operation !== "LANGUAGE_PROJECTION")
  .length;

const runSoak = async (turns: readonly SoakTurn[]) => {
  const providerWitnesses: ProviderCallWitness[] = [];
  const browserTransport = installRuntimeReplayTransport(providerWitnesses, EXTRA_LONG_REPLAYS);
  renderWorkspace();
  let expectedCandidateCount = 0;
  let expectedRevision = 0;

  for (const turn of turns) {
    expect(turn.intendedMeaning.trim().length).toBeGreaterThan(10);
    const before = currentSession();
    const beforeProjectDigest = before.project?.projectDigest ?? null;
    const beforeProductBridgeCalls = productBridgeRequestCount(browserTransport);
    const beforeRuntimeLength = before.runtimeTurns.length;

    await submit(turn.text);

    if (turn.outcome === "CANDIDATE") {
      expectedCandidateCount += 1;
      await waitFor(() => {
        const observed = currentSession().retainedContributionCandidates?.length ?? 0;
        if (observed !== expectedCandidateCount) {
          const errors = currentSession().entries.filter((entry) => entry.kind === "ERROR").map((entry) => entry.content);
          const routing = currentSession().bridgeTraces.at(-1)?.entryRouting;
          const composer = screen.getByLabelText("Votre message") as HTMLTextAreaElement;
          const send = screen.getByRole("button", { name: "Envoyer" }) as HTMLButtonElement;
          throw new Error(`SOAK_CANDIDATE_NOT_PRESENT:${turn.text}:expected=${expectedCandidateCount}:observed=${observed}:browser=${browserTransport.mock.calls.length}:draft=${JSON.stringify(composer.value)}:sendDisabled=${send.disabled}:busy=${Boolean(document.querySelector(".animate-spin"))}:routing=${JSON.stringify(routing)}:errors=${JSON.stringify(errors)}`);
        }
      }, { timeout: 5_000 });
      await waitFor(() => expect(screen.getAllByTestId("functional-contribution-review")).toHaveLength(expectedCandidateCount), {
        timeout: 5_000,
      });
      const pending = currentSession().retainedContributionCandidates?.at(-1);
      expect(pending).toMatchObject({ downstreamState: "PRESENTED", humanDecision: null });
      expect(currentSession().project?.projectDigest ?? null).toBe(beforeProjectDigest);
      expect(productBridgeRequestCount(browserTransport)).toBe(beforeProductBridgeCalls + 1);
      if (turn.confirmWithButton) {
        const review = screen.getAllByTestId("functional-contribution-review").at(-1)!;
        await clickAndFlush(within(review).getByRole("button", { name: "Cela correspond à mon projet" }));
        expectedRevision += 1;
        await waitFor(() => expect(currentSession().project?.revision).toBe(expectedRevision));
        await waitForVisibleProjectRevision(expectedRevision);
        await waitForPostAdoptionContinuation();
        await waitForComposerReady();
      }
      continue;
    }

    await waitFor(() => expect(currentSession().runtimeTurns.length).toBeGreaterThan(beforeRuntimeLength));
    expect(currentSession().runtimeTurns.some((item) => item.role === "USER" && item.content === turn.text)).toBe(true);
    await waitFor(() => expect(screen.queryAllByText(turn.text, { exact: true }).length).toBeGreaterThan(0), { timeout: 5_000 });
    expect(productBridgeRequestCount(browserTransport)).toBe(beforeProductBridgeCalls);

    if (turn.outcome === "CONFIRM") {
      expectedRevision += 1;
      await waitFor(() => expect(currentSession().project?.revision).toBe(expectedRevision));
      await waitForVisibleProjectRevision(expectedRevision);
      await waitForPostAdoptionContinuation();
      await waitForComposerReady();
      expect(currentSession().retainedContributionCandidates?.at(-1)?.humanDecision?.status).toBe("ADOPTED");
    } else if (turn.outcome === "REFUSE") {
      await waitFor(() => expect(currentSession().retainedContributionCandidates?.at(-1)?.humanDecision?.status).toBe("REJECTED"));
      expect(currentSession().project?.projectDigest ?? null).toBe(beforeProjectDigest);
      expect(currentSession().project?.revision ?? 0).toBe(expectedRevision);
    } else {
      expect(currentSession().project?.projectDigest ?? null).toBe(beforeProjectDigest);
      expect(currentSession().project?.revision ?? 0).toBe(expectedRevision);
      if (turn.outcome === "PROPOSAL" || turn.outcome === "DISCUSS") {
        await waitFor(() => {
          const userIndex = currentSession().runtimeTurns.findIndex((item) => item.role === "USER" && item.content === turn.text);
          expect(userIndex).toBeGreaterThanOrEqual(0);
          expect(currentSession().runtimeTurns.slice(userIndex + 1).some((item) => item.role === "NOXIA")).toBe(true);
        });
      }
    }
  }

  await waitFor(() => expect(currentSession().entries.some((entry) => entry.kind === "ERROR")).toBe(false));
  const observedUserTurns = currentSession().runtimeTurns.filter((turn) => turn.role === "USER");
  expect(observedUserTurns.map((turn) => turn.content)).toEqual(turns.map((turn) => turn.text));
  const cumulativeCosts = currentSession().bridgeTraces
    .map((trace) => trace.cumulativeSessionCostUsd)
    .filter((cost): cost is number => typeof cost === "number");
  expect(cumulativeCosts.every((cost, index) => index === 0 || cost >= cumulativeCosts[index - 1]!)).toBe(true);
  return { session: currentSession(), browserTransport, providerWitnesses };
};

describe("V1 long-horizon representative Standard runtime harness", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    window.history.replaceState({}, "", "/protocol-designer/demo?traceCaptureLevel=LEVEL_2_DIAGNOSTIC");
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("traverses Standard UI, real client, bridge, validators and provider adapters for T01–T05", async () => {
    const providerWitnesses: ProviderCallWitness[] = [];
    const browserTransport = installRuntimeReplayTransport(providerWitnesses);
    renderWorkspace();

    await submit(T01);
    const firstReview = await screen.findByTestId("functional-contribution-review");
    expect(currentSession().project).toBeNull();
    expect(currentSession().retainedContributionCandidates?.[0]).toMatchObject({
      downstreamState: "PRESENTED",
      humanDecision: null,
    });
    expect(providerWitnesses.map((item) => item.endpoint)).toEqual([
      "https://api.openai.com/v1/responses",
    ]);

    await clickAndFlush(within(firstReview).getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(currentSession().project?.revision).toBe(1));
    await waitForPostAdoptionContinuation();
    await waitForComposerReady();

    await submit(T02);
    await waitFor(() => expect(currentSession().retainedContributionCandidates).toHaveLength(2));
    const correctionReview = screen.getAllByTestId("functional-contribution-review").at(-1)!;
    expect(correctionReview).toHaveTextContent(NORMALIZED_ENDPOINT);
    expect(currentSession().project?.revision).toBe(1);
    expect(providerWitnesses.map((item) => item.endpoint)).toEqual([
      "https://api.openai.com/v1/responses",
      "https://api.openai.com/v1/responses",
      expect.stringMatching(/^https:\/\/generativelanguage\.googleapis\.com\//),
    ]);

    await submit(T03);
    await waitFor(() => expect(currentSession().runtimeTurns.some((turn) => turn.role === "USER" && turn.content === T03)).toBe(true));

    // This is the historical runtime boundary under test: a natural approval
    // must confirm the currently presented candidate, not merely acknowledge it.
    const afterNaturalConfirmation = currentSession();
    expect(afterNaturalConfirmation.project?.revision).toBe(2);
    expect(afterNaturalConfirmation.project?.confirmationDecision.reason).toBe(
      "L’utilisateur a explicitement confirmé la candidate courante dans son message.",
    );
    const naturalDecisionTurn = afterNaturalConfirmation.runtimeTurns.find((turn) => turn.role === "USER" && turn.content === T03);
    expect(afterNaturalConfirmation.project?.confirmationDecision.provenance).toContain(naturalDecisionTurn?.turnId);
    expect(afterNaturalConfirmation.project?.canonicalState?.objects.some((item) => item.actuality === "CURRENT"
      && item.scientificRole === "PRIMARY_ENDPOINT" && item.content === NORMALIZED_ENDPOINT)).toBe(true);
    await waitForPostAdoptionContinuation();
    await waitForComposerReady();
    expect(browserTransport).toHaveBeenCalledTimes(2);

    await submit(T04);
    await waitFor(() => expect(currentSession().runtimeTurns.some((turn) => turn.role === "USER" && turn.content === T04)).toBe(true));
    await waitFor(() => expect(currentSession().retainedContributionCandidates).toHaveLength(3));
    const populationReview = screen.getAllByTestId("functional-contribution-review").at(-1)!;
    expect(populationReview).toHaveTextContent(/primo-infarctus/iu);
    expect(populationReview).toHaveTextContent(/35 ans/iu);
    expect(populationReview).toHaveTextContent(/85 ans/iu);
    expect(populationReview).toHaveTextContent(/populations sensibles ou vulnérables/iu);
    expect(currentSession().project?.revision).toBe(2);
    expect(providerWitnesses.map((item) => item.endpoint)).toEqual([
      "https://api.openai.com/v1/responses",
      "https://api.openai.com/v1/responses",
      expect.stringMatching(/^https:\/\/generativelanguage\.googleapis\.com\//),
      "https://api.openai.com/v1/responses",
      expect.stringMatching(/^https:\/\/generativelanguage\.googleapis\.com\//),
    ]);

    await clickAndFlush(within(populationReview).getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(currentSession().project?.revision).toBe(3));
    await waitForPostAdoptionContinuation();
    await waitForComposerReady();
    const callsBeforeProposal = browserTransport.mock.calls.length;
    await submit(T05);
    await waitFor(() => expect(currentSession().runtimeTurns.some((turn) => turn.role === "USER" && turn.content === T05)).toBe(true));
    await waitFor(() => expect(currentSession().entries.some((entry) => entry.role === "NOXIA"
      && entry.kind === "TEXT" && /question scientifique|hypothèses scientifiques/iu.test(entry.content))).toBe(true));
    expect(browserTransport).toHaveBeenCalledTimes(callsBeforeProposal);
    expect(currentSession().entries.some((entry) => entry.kind === "ERROR")).toBe(false);
  });

  it("preserves the adopted Project when a natural-language decision refuses the current candidate", async () => {
    const providerWitnesses: ProviderCallWitness[] = [];
    const browserTransport = installRuntimeReplayTransport(providerWitnesses);
    renderWorkspace();

    await submit(T01);
    const initialReview = await screen.findByTestId("functional-contribution-review");
    await clickAndFlush(within(initialReview).getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(currentSession().project?.revision).toBe(1));
    await waitForPostAdoptionContinuation();
    await waitForComposerReady();
    const adoptedDigest = currentSession().project?.projectDigest;

    await submit(T02);
    await waitFor(() => expect(currentSession().retainedContributionCandidates).toHaveLength(2));
    await submit("je refuse");
    await waitFor(() => expect(currentSession().retainedContributionCandidates?.at(-1)?.humanDecision?.status).toBe("REJECTED"));

    expect(currentSession().project).toMatchObject({ revision: 1, projectDigest: adoptedDigest });
    expect(currentSession().project?.canonicalState?.objects.some((item) => item.actuality === "CURRENT"
      && item.content === NORMALIZED_ENDPOINT)).toBe(false);
    expect(browserTransport).toHaveBeenCalledTimes(2);
  });

  it("fails closed on a structurally invalid bridge response without creating a Project", async () => {
    const browserTransport = vi.fn(async () => deterministicResponse({ apiVersion: "1.0", assistantReply: "incomplete" }));
    vi.stubGlobal("fetch", browserTransport);
    renderWorkspace();

    await submit(T01);
    await waitFor(() => expect(currentSession().entries.some((entry) => entry.kind === "ERROR")).toBe(true));

    expect(currentSession().project).toBeNull();
    expect(currentSession().retainedContributionCandidates).toHaveLength(0);
    expect(currentSession().entries.filter((entry) => entry.kind === "ERROR").at(-1)).toMatchObject({
      content: "Réponse conversationnelle invalide.",
    });
    expect(browserTransport).toHaveBeenCalledTimes(1);
  });

  it("replays the IDM/IRM family for 15 meaningful Standard turns from turn 1", async () => {
    const { session, browserTransport } = await runSoak(FAMILY_A_TURNS);
    const state = ensureCanonicalProjectState(session.project!);
    const currentContent = state.objects.filter((item) => item.actuality === "CURRENT").map((item) => item.content);

    expect(session.project?.revision).toBe(4);
    expect(productBridgeRequestCount(browserTransport)).toBe(FAMILY_A_TURNS.filter((turn) => turn.outcome === "CANDIDATE").length);
    expect(currentContent).toEqual(expect.arrayContaining([
      expect.stringMatching(/Âge minimal : 35 ans/iu),
      expect.stringMatching(/Âge maximal : 85 ans/iu),
      expect.stringMatching(/populations sensibles ou vulnérables/iu),
      expect.stringMatching(/suivi clinique à 12 mois/iu),
    ]));
    expect(currentContent.some((content) => /suivi clinique à 6 mois/iu.test(content))).toBe(false);
    expect(currentContent.some((content) => /analyse exploratoire selon le territoire/iu.test(content))).toBe(false);
    expect(state.objects.filter((item) => item.actuality === "CURRENT" && /^pacemaker$/iu.test(item.content))).toHaveLength(0);
    expect(session.queryNavigation).toMatchObject({
      projectRef: session.project?.projectId,
      projectVersion: session.project?.versionId,
      projectDigest: session.project?.projectDigest,
    });
    expect(session.queryNavigation?.standardQuestion?.text ?? "").not.toMatch(/inclusion.*exclusion|exclusion.*inclusion/iu);
  }, 20_000);

  it("replays a non-imaging clinical family for 15 meaningful Standard turns from turn 1", async () => {
    const { session, browserTransport } = await runSoak(FAMILY_B_TURNS);
    const state = ensureCanonicalProjectState(session.project!);
    const currentContent = state.objects.filter((item) => item.actuality === "CURRENT").map((item) => item.content);

    expect(session.project?.revision).toBe(3);
    expect(productBridgeRequestCount(browserTransport)).toBe(FAMILY_B_TURNS.filter((turn) => turn.outcome === "CANDIDATE").length);
    expect(currentContent).toEqual(expect.arrayContaining([
      "Suivi à 24 semaines",
      "Hypoglycémies sévères",
      expect.stringMatching(/multicentrique/iu),
    ]));
    expect(currentContent).not.toContain("Suivi à 36 semaines");
    expect(currentContent.some((content) => /analyse exploratoire selon l'ancienneté/iu.test(content))).toBe(false);
    expect(session.queryNavigation?.projectVersion).toBe(session.project?.versionId);
  }, 20_000);

  it("replays a non-medical experimental family for 15 meaningful Standard turns from turn 1", async () => {
    const { session, browserTransport } = await runSoak(FAMILY_C_TURNS);
    const state = ensureCanonicalProjectState(session.project!);
    const currentContent = state.objects.filter((item) => item.actuality === "CURRENT").map((item) => item.content);

    expect(session.project?.revision).toBe(3);
    expect(productBridgeRequestCount(browserTransport)).toBe(FAMILY_C_TURNS.filter((turn) => turn.outcome === "CANDIDATE").length);
    expect(currentContent).toEqual(expect.arrayContaining([
      expect.stringMatching(/vieillissement humide de 40 cycles/iu),
      expect.stringMatching(/lecture en aveugle des ruptures par deux opérateurs/iu),
    ]));
    expect(currentContent.some((content) => /60 cycles/iu.test(content))).toBe(false);
    expect(currentContent.some((content) => /rugosité de surface/iu.test(content))).toBe(false);
    expect(session.queryNavigation?.projectDigest).toBe(session.project?.projectDigest);
    expect(session.entries.filter((entry) => entry.kind === "TEXT").map((entry) => entry.content).join(" "))
      .not.toMatch(/ownerResult|candidateRef|QUERY_NAVIGATION|CONTROLLED_VULNERABLE_POPULATION_SET/u);
  }, 20_000);
});
