import { logicalDigest, stableStringify } from "../knowledge-engine/canonical.js";
import { buildProjectContextSnapshot } from "../research-project-construction/canonical-project-backbone.js";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import type { ScientificDiscussionContext } from "../protocol-designer/functional-reset/contribution-discussion-context.js";
import type { StudyProposalComposition } from "./contextual-study-proposal.js";
import { assertStudioScientificInput, studioScientificRoute, type StudioPreparationSource } from "./studio-runtime.js";

/** One native ST input, not a store, transcript or second preparation lifecycle.
 * Content stays attached to its native source; source order grants no priority.
 */
export type ScientificPreparationSource = Readonly<{
  ref: string; origin: "CONVERSATION" | "STUDIO" | "SCIENTIFIC_PREPARATION";
  status: "PENDING" | "ALREADY_ADOPTED" | "SUPERSEDED" | "REJECTED" | "CLOSED";
  contentDigest: string; provenanceRefs: readonly string[];
  native: NonNullable<ScientificDiscussionContext["retainedMeaning"]>[number]
    | ScientificDiscussionContext["active"][number]
    | StudioPreparationSource["request"]["delta"][number]
    | Readonly<{ proposal: StudyProposalComposition; pendingAtomRefs: readonly string[] }>
    | Readonly<{ sourceRef: string; sourceText: string; coverage: "PARTIAL" | "UNKNOWN" }>;
}>;
export type ScientificPreparationSourceSet = Readonly<{
  contract: "SCIENTIFIC_PREPARATION_SOURCE_SET_V1"; owner: "SCIENTIFIC_THINKING";
  project: { projectId: string; projectVersion: string; projectDigest: string };
  scientificState: StudioPreparationSource["request"]["scientificState"];
  studioBinding: { requestDigest: string; assessmentRef: string; assessmentDigest: string };
  sources: readonly ScientificPreparationSource[];
  groups: readonly Readonly<{ ref: string; sourceRefs: readonly string[]; proof: "SINGLE_NATIVE_SOURCE" | "EXACT_NATIVE_BINDING" }>[];
  sourceSetId: string; sourceSetDigest: string;
}>;
const ordered = <T extends { ref: string }>(items: readonly T[]) => [...items].sort((a, b) => a.ref.localeCompare(b.ref));
const refs = (items: readonly string[]) => [...new Set(items)].sort();

type GovernedSources = {
  project: ResearchProjectOwnerProjection; request: StudioPreparationSource["request"];
  discussion?: ScientificDiscussionContext; proposal?: StudyProposalComposition | null;
};
/** Capture precedes semantic assessment. It freezes native sources, not a fake
 * assessment or a competing scientific source-set taxonomy. */
export type FrozenScientificPreparationSources = Readonly<{
  contract: "SCIENTIFIC_PREPARATION_SOURCE_CAPTURE_V1"; owner: "SCIENTIFIC_THINKING";
  request: StudioPreparationSource["request"];
  discussion?: ScientificDiscussionContext; proposal?: StudyProposalComposition | null;
  captureDigest: string;
}>;
export const freezeScientificPreparationSources = (input: GovernedSources): FrozenScientificPreparationSources => {
  assertStudioScientificInput(input.request, input.project);
  collectGovernedSources(input);
  const material = { contract: "SCIENTIFIC_PREPARATION_SOURCE_CAPTURE_V1" as const, owner: "SCIENTIFIC_THINKING" as const,
    request: input.request, ...(input.discussion ? { discussion: input.discussion } : {}),
    ...(input.proposal ? { proposal: input.proposal } : {}) };
  return structuredClone({ ...material, captureDigest: logicalDigest(material) });
};
export const assertFrozenScientificSources = (capture: FrozenScientificPreparationSources, project: ResearchProjectOwnerProjection) => {
  if (stableStringify(capture) !== stableStringify(freezeScientificPreparationSources({ ...capture, project })))
    throw new Error("SCIENTIFIC_PREPARATION_CAPTURE_INVALID");
};
export const resolveFrozenScientificSources = (capture: FrozenScientificPreparationSources, project: ResearchProjectOwnerProjection,
  studio: StudioPreparationSource) => {
  assertFrozenScientificSources(capture, project);
  if (logicalDigest(capture.request) !== logicalDigest(studio.request)) throw new Error("SCIENTIFIC_PREPARATION_CAPTURE_INVALID");
  return buildScientificPreparationSourceSet({ ...capture, project, studio });
};
const collectGovernedSources = (input: GovernedSources) => {
  const project = { projectId: input.project.projectId, projectVersion: input.project.versionId, projectDigest: input.project.projectDigest };
  const discussion = input.discussion;
  if (discussion && (discussion.boundary !== "COMPLETE" || discussion.projectWriteAuthorized !== false
    || logicalDigest(discussion.baseProject) !== logicalDigest({ projectId: project.projectId,
      versionId: project.projectVersion, projectDigest: project.projectDigest }))) throw new Error("SCIENTIFIC_PREPARATION_SOURCE_INVALID");
  const sources: ScientificPreparationSource[] = [];
  const add = (source: ScientificPreparationSource) => {
    const previous = sources.find(item => item.ref === source.ref);
    if (previous && stableStringify(previous) !== stableStringify(source)) throw new Error("SCIENTIFIC_PREPARATION_SOURCE_COLLISION");
    if (!previous) sources.push(source);
  };
  for (const element of discussion?.retainedMeaning ?? []) add({ ref: element.ref, origin: "CONVERSATION", status: "PENDING",
    contentDigest: logicalDigest(element), provenanceRefs: refs([element.ref, element.sourceTurnRef, element.sourceDigest,
      ...element.linkedRefs]), native: structuredClone(element) });
  for (const element of discussion?.active ?? []) add({ ref: element.ref, origin: "CONVERSATION", status: "PENDING",
    contentDigest: logicalDigest(element), provenanceRefs: refs([element.nativeRef, ...element.sourceRefs]), native: structuredClone(element) });
  // PARTIAL/UNKNOWN cannot certify their own eviction. Retain the exact original
  // source as an unassessed contribution, never reconstruct missing meaning.
  for (const coverage of discussion?.sourceCoverage ?? []) if (coverage.coverage !== "COMPLETE") {
    const source = discussion?.sources.find(item => item.turnRef === coverage.turnRef && item.turnDigest === coverage.sourceDigest);
    if (!source?.sourceText) throw new Error("SCIENTIFIC_PREPARATION_SOURCE_UNAVAILABLE");
    const native = { sourceRef: coverage.turnRef, sourceText: source.sourceText, coverage: coverage.coverage };
    add({ ref: `scientific-residual:${coverage.turnRef}`, origin: "CONVERSATION", status: "PENDING",
      contentDigest: logicalDigest(native), provenanceRefs: refs([source.ref, coverage.turnRef, coverage.sourceDigest]), native });
  }
  const pendingProposal = input.request.scientificState.pendingPreparationId ? input.proposal : null;
  if (pendingProposal) {
    const unavailable = new Set([...pendingProposal.adoptedAtomRefs, ...pendingProposal.dispositions?.flatMap(item => item.atomRefs) ?? []]);
    const pendingAtomRefs = refs(pendingProposal.proposal.atoms.filter(atom => !unavailable.has(atom.ref)).map(atom => atom.ref));
    if (pendingAtomRefs.length) add({ ref: pendingProposal.proposalRef, origin: "SCIENTIFIC_PREPARATION", status: "PENDING",
      contentDigest: logicalDigest(pendingProposal), provenanceRefs: refs([pendingProposal.digest, pendingProposal.sourceTurnRef,
        pendingProposal.sourceResponseRef, ...pendingAtomRefs]), native: { proposal: structuredClone(pendingProposal), pendingAtomRefs } });
  }
  const pendingTurn = input.request.scientificState.pendingTurnRef;
  if (pendingTurn && !discussion?.sourceCoverage?.some(item => item.turnRef === pendingTurn)
    && !discussion?.sources.some(item => item.turnRef === pendingTurn)
    && pendingProposal?.sourceTurnRef !== pendingTurn) throw new Error("SCIENTIFIC_PREPARATION_SOURCE_UNAVAILABLE");
  if (input.request.scientificState.pendingPreparationId && !pendingProposal)
    throw new Error("SCIENTIFIC_PREPARATION_SOURCE_UNAVAILABLE");
  return { sources, add };
};
export const buildScientificPreparationSourceSet = (input: {
  project: ResearchProjectOwnerProjection; studio: StudioPreparationSource;
  discussion?: ScientificDiscussionContext; proposal?: StudyProposalComposition | null;
}): ScientificPreparationSourceSet => {
  const route = studioScientificRoute(input.studio, input.project);
  if (route.action === "EXISTING_QRY_PATH") throw new Error("SCIENTIFIC_PREPARATION_AMBIGUOUS");
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const project = { projectId: input.project.projectId, projectVersion: input.project.versionId, projectDigest: input.project.projectDigest };
  const { sources, add } = collectGovernedSources({ ...input, request: input.studio.request });
  const classifications = input.studio.assessment.nativePayload.edits;
  for (const edit of input.studio.request.delta.filter(item => item.change !== "UNCHANGED")) {
    const assessment = classifications.find(item => item.editRef === edit.editRef)!;
    if (assessment.classification !== "PROJECT_CHANGE") continue;
    const adopted = assessment.projectCoverage?.coverage === "COMPLETE";
    // COMPLETE is validated by the existing ST assessment owner against exact
    // CURRENT/KNOWN Project versions and human decisions, not text equality.
    if (adopted && !assessment.projectCoverage!.projectVersionRefs.every(ref => snapshot.objects.some(object =>
      object.versionRef === ref && object.decisionRefs.length)))
      throw new Error("SCIENTIFIC_PREPARATION_SOURCE_INVALID");
    add({ ref: edit.editRef, origin: "STUDIO", status: adopted ? "ALREADY_ADOPTED" : "PENDING",
      contentDigest: logicalDigest(edit), provenanceRefs: refs([edit.editRef, ...edit.provenanceRefs,
        input.studio.assessment.resultId, input.studio.request.workingRevisionId]), native: structuredClone(edit) });
  }
  const groups: ScientificPreparationSourceSet["groups"][number][] = [];
  const grouped = new Set<string>();
  for (const studio of ordered(sources.filter(source => source.origin === "STUDIO" && source.status === "PENDING"))) {
    const edit = studio.native as StudioPreparationSource["request"]["delta"][number];
    const assessment = classifications.find(item => item.editRef === edit.editRef)!;
    // Reuse an explicit native provenance binding AND exact unqualified native
    // content. A shared digest, similar wording or chronology is not a proof.
    const same = sources.filter(source => source.origin === "CONVERSATION" && source.status === "PENDING"
      && "epistemicState" in source.native && source.native.epistemicState === "USER_STATED"
      && "polarity" in source.native && source.native.polarity === "AFFIRMED"
      && "conditions" in source.native && source.native.conditions.length === 0
      && source.native.content === edit.afterText && edit.provenanceRefs.includes(source.ref)
      && assessment.provenanceRefs.includes(source.ref));
    if (same.length) {
      const boundRefs = [studio.ref, ...same.map(source => source.ref)];
      const overlaps = groups.filter(group => group.sourceRefs.some(ref => boundRefs.includes(ref)));
      const sourceRefs = refs([...boundRefs, ...overlaps.flatMap(group => group.sourceRefs)]);
      for (const group of overlaps) groups.splice(groups.indexOf(group), 1);
      groups.push({ ref: `scientific-source-group:${logicalDigest(sourceRefs)}`, sourceRefs, proof: "EXACT_NATIVE_BINDING" });
      sourceRefs.forEach(ref => grouped.add(ref));
    }
  }
  for (const source of sources.filter(item => item.status === "PENDING" && !grouped.has(item.ref)))
    groups.push({ ref: `scientific-source-group:${logicalDigest([source.ref])}`, sourceRefs: [source.ref], proof: "SINGLE_NATIVE_SOURCE" });
  const material = { contract: "SCIENTIFIC_PREPARATION_SOURCE_SET_V1" as const, owner: "SCIENTIFIC_THINKING" as const,
    project, scientificState: { ...input.studio.request.scientificState,
      preparations: [...input.studio.request.scientificState.preparations].sort((a, b) => a.preparationId.localeCompare(b.preparationId)) },
    studioBinding: { requestDigest: input.studio.request.requestDigest, assessmentRef: input.studio.assessment.resultId,
      assessmentDigest: logicalDigest(input.studio.assessment) }, sources: ordered(sources), groups: ordered(groups) };
  const sourceSetDigest = logicalDigest(material);
  return structuredClone({ ...material, sourceSetDigest, sourceSetId: `scientific-source-set:${sourceSetDigest}` });
};

export const assertScientificPreparationSourceSet = (set: ScientificPreparationSourceSet, input: Parameters<typeof buildScientificPreparationSourceSet>[0]) => {
  if (stableStringify(set) !== stableStringify(buildScientificPreparationSourceSet(input)))
    throw new Error("SCIENTIFIC_PREPARATION_SOURCE_SET_INVALID");
};

/** Text required only by existing Knowledge/specialized native contracts; never
 * a USER turn or source of adoption. The WD packet keeps the typed set intact. */
export const scientificPreparationSourceText = (set: ScientificPreparationSourceSet) => set.sources.filter(source => source.status === "PENDING").map(source => {
  if ("afterText" in source.native) return source.native.afterText;
  if ("content" in source.native) return source.native.content;
  if ("sourceText" in source.native) return source.native.sourceText;
  return source.native.proposal.proposal.atoms.filter(atom => source.native && "pendingAtomRefs" in source.native
    && source.native.pendingAtomRefs.includes(atom.ref)).map(atom => atom.content).join("\n");
}).join("\n");
