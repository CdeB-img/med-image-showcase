import { logicalDigest } from "../knowledge-engine/canonical.js";
import {
  ensureCanonicalProjectState,
  type CanonicalProjectObjectType,
  type ResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "../research-project-construction/index.js";
import type { NavigationNeed } from "./contracts.js";

export const CURRENT_RELEVANT_PROJECT_CONTEXT_VERSION = "1.0.0" as const;

export type ConversationalImpactStatus =
  | "DEMONSTRATED_CURRENT"
  | "POSSIBLE_TO_CHECK"
  | "UNKNOWN"
  | "NOT_APPLICABLE"
  | "BLOCKED_BY_MISSING_INFORMATION";

export type CurrentRelevantProjectItem = Readonly<{
  ref: string;
  versionRef: string;
  objectType: CanonicalProjectObjectType;
  content: string;
  scientificRole: string | null;
  epistemicState: "KNOWN" | "ASSUMED" | "UNKNOWN" | "WITHHELD";
  relationDistance: number;
  relationRefs: readonly string[];
  provenanceRefs: readonly string[];
}>;

export type CurrentProjectImpact = Readonly<{
  impactRef: string;
  kind: "CURRENT_PROJECT_FACT" | "CURRENT_PROJECT_DEPENDENCY" | "PROJECT_CONSTRAINT" | "DOCUMENT_PROJECTION";
  label: string;
  status: ConversationalImpactStatus;
  sourceRefs: readonly string[];
}>;

export type StandardConversationFollowUpAction = Readonly<{
  actionRef: string;
  label: string;
  effect: string;
  status: ConversationalImpactStatus;
  responsibilityOwner: "QUERY_NAVIGATION" | "STUDY_DATA_CDM" | "DATA_MANAGEMENT" | "DOCUMENTS";
  sourceRefs: readonly string[];
  independent: true;
  projectWriteAuthorized: false;
}>;

export type CurrentProjectImpactProjection = Readonly<{
  contract: "CURRENT_RELEVANT_PROJECT_CONTEXT";
  contractVersion: typeof CURRENT_RELEVANT_PROJECT_CONTEXT_VERSION;
  projectionId: string;
  owner: "QUERY_NAVIGATION";
  sourceProject: Readonly<{ projectId: string; projectVersion: string; projectDigest: string }>;
  sourceCandidate: Readonly<{ candidateRef: string; candidateDigest: string; sourceTurnRef: string }>;
  currentSubjects: readonly Readonly<{ ref: string; content: string; objectType: CanonicalProjectObjectType }> [];
  relevantProjectItems: readonly CurrentRelevantProjectItem[];
  impacts: readonly CurrentProjectImpact[];
  actions: readonly StandardConversationFollowUpAction[];
  qryNeed: NavigationNeed;
  why: string;
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
}>;

type GraphEdge = Readonly<{ to: string; relationRef: string }>;

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
const quoteList = (values: readonly string[]) => values.map((value) => `« ${value} »`).join(" ; ");
const activeCandidateObjects = (candidate: Readonly<ResearchProjectContributionCandidate>) => candidate.canonicalChangeSet.objectChanges
  .filter((change) => change.operation !== "REMOVE" && change.candidate
    && !["UNKNOWN", "WITHHELD"].includes(change.candidate.epistemicState))
  .map((change) => ({ ref: change.objectId, content: change.candidate!.content, objectType: change.candidate!.objectType }));

const isMaterialRelation = (relationType: string) => ![
  "ASSOCIATED_WITH",
  "RELATED_TO",
  "MENTIONS",
  "DESCRIBES",
  "CONTEXT_OF",
].includes(relationType.toLocaleUpperCase("en-US"));

const addEdge = (graph: Map<string, GraphEdge[]>, left: string, right: string, relationRef: string) => {
  if (!left || !right || left === right) return;
  graph.set(left, [...(graph.get(left) ?? []), { to: right, relationRef }]);
  graph.set(right, [...(graph.get(right) ?? []), { to: left, relationRef }]);
};

const shortestProjectPaths = (
  starts: readonly string[],
  graph: ReadonlyMap<string, readonly GraphEdge[]>,
  currentRefs: ReadonlySet<string>,
) => {
  const paths = new Map<string, { distance: number; relationRefs: string[] }>();
  const queue = starts.map((ref) => ({ ref, distance: 0, relationRefs: [] as string[] }));
  const visited = new Map(starts.map((ref) => [ref, 0]));
  while (queue.length) {
    const cursor = queue.shift()!;
    if (cursor.distance >= 3) continue;
    for (const edge of graph.get(cursor.ref) ?? []) {
      const distance = cursor.distance + 1;
      if ((visited.get(edge.to) ?? Number.POSITIVE_INFINITY) <= distance) continue;
      const relationRefs = [...cursor.relationRefs, edge.relationRef];
      visited.set(edge.to, distance);
      queue.push({ ref: edge.to, distance, relationRefs });
      if (currentRefs.has(edge.to)) paths.set(edge.to, { distance, relationRefs });
    }
  }
  return paths;
};

const makeAction = (input: Omit<StandardConversationFollowUpAction, "actionRef" | "independent" | "projectWriteAuthorized">) => Object.freeze({
  ...input,
  actionRef: `conversation-follow-up:${logicalDigest({ label: input.label, effect: input.effect, sourceRefs: unique(input.sourceRefs) })}`,
  sourceRefs: Object.freeze(unique(input.sourceRefs)),
  independent: true as const,
  projectWriteAuthorized: false as const,
});

/**
 * Read-only, per-turn QRY projection. Relevance is supported by current Project
 * graph paths and exact version bindings, never by transcript recency or domain
 * vocabulary. It owns no Project fact and performs no adoption.
 */
export const buildCurrentProjectImpactProjection = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  candidate: Readonly<ResearchProjectContributionCandidate>;
  candidateDigest: string;
  sourceTurnRef: string;
}): CurrentProjectImpactProjection | null => {
  const { project, candidate } = input;
  if (candidate.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION"
    || candidate.projectWriteAuthorized !== false
    || candidate.canonicalChangeSet.baseProjectVersion !== project.versionId) return null;
  const subjects = activeCandidateObjects(candidate);
  if (!subjects.length) return null;
  const state = ensureCanonicalProjectState(project);
  const currentObjects = state.objects.filter((object) => object.actuality === "CURRENT");
  const currentRefs = new Set(currentObjects.map((object) => object.objectId));
  const graph = new Map<string, GraphEdge[]>();
  for (const relation of state.relations.filter((item) => item.actuality === "CURRENT" && isMaterialRelation(item.relationType))) {
    addEdge(graph, relation.sourceObjectRef, relation.targetObjectRef, relation.relationId);
  }
  for (const change of candidate.canonicalChangeSet.relationChanges) {
    if (change.operation === "REMOVE" || !change.candidate || !isMaterialRelation(change.candidate.relationType)) continue;
    addEdge(graph, change.candidate.sourceObjectRef, change.candidate.targetObjectRef, change.changeRef);
  }
  for (const occasion of state.expectedVariableOccasions.filter((item) => item.actuality === "CURRENT")) {
    if (occasion.studyUnitOrGroupRef) addEdge(graph, occasion.variableProjectRef, occasion.studyUnitOrGroupRef, occasion.occasionId);
    const reference = occasion.anchor.reference;
    if (reference.status === "KNOWN") addEdge(graph, occasion.variableProjectRef, reference.referenceProjectRef, occasion.occasionId);
  }
  for (const temporal of state.temporalQualifications.filter((item) => item.actuality === "CURRENT")) {
    const reference = temporal.anchor.reference;
    if (reference.status === "KNOWN") addEdge(graph, temporal.subjectProjectRef, reference.referenceProjectRef, temporal.qualificationId);
  }
  const paths = shortestProjectPaths(subjects.map((subject) => subject.ref), graph, currentRefs);
  const relevantProjectItems = currentObjects.flatMap((object): CurrentRelevantProjectItem[] => {
    const path = paths.get(object.objectId);
    if (!path) return [];
    return [{
      ref: object.objectId,
      versionRef: object.objectVersionId,
      objectType: object.objectType,
      content: object.content,
      scientificRole: object.scientificRole,
      epistemicState: object.epistemicState,
      relationDistance: path.distance,
      relationRefs: Object.freeze(unique(path.relationRefs)),
      provenanceRefs: Object.freeze(unique([
        object.objectId,
        object.objectVersionId,
        ...object.provenance.sourceTurnRefs,
        ...object.provenance.evidenceRefs,
      ])),
    }];
  }).sort((left, right) => left.relationDistance - right.relationDistance || left.ref.localeCompare(right.ref));
  if (!relevantProjectItems.length) return null;

  const subjectText = quoteList(subjects.map((subject) => subject.content));
  const coverage = relevantProjectItems.filter((item) => ["CANONICAL_VARIABLE", "VISIT", "ACQUISITION", "ENDPOINT"].includes(item.objectType));
  const constraints = relevantProjectItems.filter((item) => item.objectType === "CONSTRAINT");
  const supportingInformation = relevantProjectItems.filter((item) => item.objectType === "PROJECT_INFORMATION");
  const actions: StandardConversationFollowUpAction[] = [];
  if (coverage.length) {
    actions.push(makeAction({
      label: "Vérifier la couverture par les éléments déjà prévus",
      effect: `Examiner si ${quoteList(coverage.map((item) => item.content))} peuvent couvrir le besoin associé à ${subjectText}, sans conclure à leur compatibilité.`,
      status: "POSSIBLE_TO_CHECK",
      responsibilityOwner: "STUDY_DATA_CDM",
      sourceRefs: coverage.flatMap((item) => [item.ref, ...item.relationRefs]),
    }));
    actions.push(makeAction({
      label: "Préciser le besoin supplémentaire éventuel",
      effect: "Ne proposer une mesure, une collecte ou un temps supplémentaire que si la couverture existante s’avère insuffisante.",
      status: "BLOCKED_BY_MISSING_INFORMATION",
      responsibilityOwner: "STUDY_DATA_CDM",
      sourceRefs: coverage.flatMap((item) => [item.ref, ...item.relationRefs]),
    }));
  }
  if (supportingInformation.length) actions.push(makeAction({
    label: "Vérifier l’incidence sur l’organisation déjà prévue",
    effect: `Examiner l’incidence éventuelle sur ${quoteList(supportingInformation.map((item) => item.content))}, sans créer de nouvelle exigence.`,
    status: "POSSIBLE_TO_CHECK",
    responsibilityOwner: "DATA_MANAGEMENT",
    sourceRefs: supportingInformation.flatMap((item) => [item.ref, ...item.relationRefs]),
  }));
  if (constraints.length) actions.push(makeAction({
    label: `Estimer l’incidence sur ${quoteList(constraints.map((item) => item.content))}`,
    effect: "La contrainte est reliée aux éléments affectés ; l’incidence reste à estimer et aucun montant n’est déduit.",
    status: "UNKNOWN",
    responsibilityOwner: "QUERY_NAVIGATION",
    sourceRefs: constraints.flatMap((item) => [item.ref, ...item.relationRefs]),
  }));
  if (coverage.length && actions.length < 4) actions.push(makeAction({
    label: "Repérer les mises à jour documentaires après adoption",
    effect: "Après adoption seulement, vérifier le calendrier des activités, le CRF et le dictionnaire de données concernés.",
    status: "BLOCKED_BY_MISSING_INFORMATION",
    responsibilityOwner: "DOCUMENTS",
    sourceRefs: unique([candidate.contributionRef, ...coverage.map((item) => item.ref)]),
  }));
  const boundedActions = actions.slice(0, 4);
  if (!boundedActions.length) return null;

  const impacts: CurrentProjectImpact[] = [
    {
      impactRef: `impact:${logicalDigest({ candidate: candidate.contributionRef, currentFacts: relevantProjectItems.map((item) => item.ref) })}`,
      kind: "CURRENT_PROJECT_FACT" as const,
      label: `Éléments confirmés dans le projet courant : ${quoteList(relevantProjectItems.map((item) => item.content))}.`,
      status: "DEMONSTRATED_CURRENT" as const,
      sourceRefs: unique(relevantProjectItems.flatMap((item) => [item.ref, item.versionRef, ...item.relationRefs])),
    },
    ...(coverage.length ? [{
      impactRef: `impact:${logicalDigest({ candidate: candidate.contributionRef, coverage: coverage.map((item) => item.ref) })}`,
      kind: "CURRENT_PROJECT_DEPENDENCY" as const,
      label: `Le projet prévoit déjà ${quoteList(coverage.map((item) => item.content))}. La possibilité de réutilisation reste à vérifier.`,
      status: "POSSIBLE_TO_CHECK" as const,
      sourceRefs: unique(coverage.flatMap((item) => [item.ref, ...item.relationRefs])),
    }] : []),
    ...(constraints.length ? [{
      impactRef: `impact:${logicalDigest({ candidate: candidate.contributionRef, constraints: constraints.map((item) => item.ref) })}`,
      kind: "PROJECT_CONSTRAINT" as const,
      label: `Le projet contient déjà ${quoteList(constraints.map((item) => item.content))} ; l’impact de ${subjectText} est à estimer.`,
      status: "UNKNOWN" as const,
      sourceRefs: unique(constraints.flatMap((item) => [item.ref, ...item.relationRefs])),
    }] : []),
    ...(coverage.length ? [{
      impactRef: `impact:${logicalDigest({ candidate: candidate.contributionRef, documents: ["SCHEDULE_OF_ACTIVITIES", "CRF", "DATA_DICTIONARY"] })}`,
      kind: "DOCUMENT_PROJECTION" as const,
      label: "Après adoption, le calendrier des activités, le CRF et le dictionnaire de données devront être recalculés depuis le Project révisé.",
      status: "BLOCKED_BY_MISSING_INFORMATION" as const,
      sourceRefs: unique([candidate.contributionRef, ...coverage.map((item) => item.ref)]),
    }] : []),
  ];
  const projectionIdentity = {
    projectId: project.projectId,
    projectVersion: project.versionId,
    projectDigest: project.projectDigest,
    candidateRef: candidate.contributionRef,
    candidateDigest: input.candidateDigest,
    relevantRefs: relevantProjectItems.map((item) => item.ref),
    actionRefs: boundedActions.map((action) => action.actionRef),
  };
  const projectionId = `current-relevant-project-context:${logicalDigest(projectionIdentity)}`;
  const qryNeed: NavigationNeed = {
    needId: `qry-need:${logicalDigest({ projectionId, actions: boundedActions.map((action) => action.actionRef) })}`,
    sourceRef: projectionId,
    sourceType: "CURRENT_PROJECT_IMPACT",
    sourceVersion: CURRENT_RELEVANT_PROJECT_CONTEXT_VERSION,
    sourceObjectKind: "CurrentRelevantProjectContext",
    owner: "QUERY_NAVIGATION",
    informationIntent: `Ce nouvel élément réactive des éléments déjà présents dans le projet. Que souhaitez-vous que j’examine maintenant à propos de ${subjectText} ?`,
    affectedDecisionRefs: boundedActions.map((action) => action.actionRef),
    affectedBranchRefs: relevantProjectItems.map((item) => item.ref),
    blocking: "NON_BLOCKING",
    actionability: "USER_ANSWERABLE",
    status: "OPEN",
    availableFromOwner: null,
    knownOptions: [],
    provenance: {
      sourceRefs: unique([candidate.contributionRef, ...relevantProjectItems.flatMap((item) => [item.ref, ...item.relationRefs])]),
      owner: "QUERY_NAVIGATION",
      evidence: impacts.map((impact) => impact.label),
      limitations: ["RELEVANCE_SUPPORTED_BY_CURRENT_PROJECT_GRAPH", "POTENTIAL_IMPACT_IS_NOT_A_PROJECT_DECISION"],
    },
    limitations: ["CURRENT_CONTEXT_PROJECTION_ONLY", "CHECKBOX_SELECTION_REQUESTS_FOLLOW_UP_WITHOUT_PROJECT_WRITE"],
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };
  return Object.freeze({
    contract: "CURRENT_RELEVANT_PROJECT_CONTEXT",
    contractVersion: CURRENT_RELEVANT_PROJECT_CONTEXT_VERSION,
    projectionId,
    owner: "QUERY_NAVIGATION",
    sourceProject: { projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest },
    sourceCandidate: { candidateRef: candidate.contributionRef, candidateDigest: input.candidateDigest, sourceTurnRef: input.sourceTurnRef },
    currentSubjects: Object.freeze(subjects),
    relevantProjectItems: Object.freeze(relevantProjectItems),
    impacts: Object.freeze(impacts),
    actions: Object.freeze(boundedActions),
    qryNeed,
    why: "Ces options proviennent uniquement des dépendances et contraintes reliées au nouvel élément dans la version courante du Research Project.",
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  });
};
