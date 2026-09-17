import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import { logicalDigest } from "../../../knowledge-engine/canonical";
import { prepareResearchProjectContributionCandidate, type ResearchProjectOwnerProjection } from "../../../research-project-construction/contribution-owner-boundary";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationTurn } from "../../../scientific-interpretation/contracts";
import { contributionFromPersistentDelta, parseProductBridgeRequest, validatePersistentProjectDelta, type PersistentProjectDeltaCandidate, type PersistentProjectDeltaChange, type PersistentTemporalQualification, type ProductBridgeRequest } from "../../product-bridge";
import { buildScientificDiscussionContext, retainValidatedContributionCandidate, markContributionCandidateNonCurrent, markContributionCandidatePresented, recordContributionCandidateHumanDecision, type RetainedContributionCandidate } from "../contribution-lifecycle";
import type { HumanDecisionEnvelope } from "../../human-decision";
import { scientificDiscussionProviderContext, validateScientificDiscussionContext } from "../contribution-discussion-context";
import { createFunctionalResetSession, persistFunctionalResetSession, loadFunctionalResetSession } from "../session";
import { adoptBehaviorContribution, behaviorContribution, behaviorItem, behaviorTurn } from "./p1-behavior-01a-contract-fixtures";

const AT = "2026-09-16T12:00:00.000Z";
const turn = (id: string, content: string, role: "USER" | "NOXIA" = "USER"): ScientificInterpretationTurn => ({ turnId: id, role, content, createdAt: AT });
const object = (ref: string, content: string, type = "PROJECT_INFORMATION", role?: string): PersistentProjectDeltaChange => ({
  operation: "ADD", candidateRef: ref, semanticIdentity: ref, proposedType: type, content, sourceText: content,
  polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [], ...(role ? { studyRole: role } : {}),
});
const time = (ref: string, code: string, offset: number, unit = "jour"): PersistentTemporalQualification => ({
  operation: "ADD", qualificationId: `time:${ref}`, subjectProjectRef: ref, temporalRole: "ACQUISITION_TIME", sourceText: code,
  assertionKind: "USER_STATED", evidenceRefs: [], anchor: { kind: "TIMEPOINT", direction: "AT", unit, offset,
    lowerBound: null, upperBound: null, relativeEventLabel: null, tolerance: null, reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } },
});
const proposal = (id: string, objects: PersistentProjectDeltaChange[], times: PersistentTemporalQualification[] = [], project: ResearchProjectOwnerProjection | null = null) => {
  const source = turn(id, [...objects.map(o => o.sourceText), ...times.map(t => t.sourceText)].join(". "));
  const delta: PersistentProjectDeltaCandidate = { contract: "PERSISTENT_PROJECT_DELTA_CANDIDATE", contractVersion: "0.4.0", projectWriteAuthorized: false, changes: objects, relations: [], temporalQualifications: times, expectedVariableOccasions: [] };
  const conversation = { conversationId: "continuity-test", language: "fr" as const, turns: [source] };
  const checked = validatePersistentProjectDelta({ changes: delta.changes, relations: delta.relations, temporalQualifications: delta.temporalQualifications, expectedVariableOccasions: delta.expectedVariableOccasions }, source.content, project, conversation);
  expect(checked.validation.blocks).toEqual([]);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation, currentProject: project, createdAt: AT })!;
  const candidate = prepareResearchProjectContributionCandidate(contribution, project);
  const retained = retainValidatedContributionCandidate({ retained: [], contribution, candidate, validation: checked.validation,
    validatorRef: "PERSISTENT_PROJECT_DELTA_AND_PRJ_CONTRIBUTION_V1", sourceTurnRef: id, baseProject: project, dependencyBindings: [], traceRunId: null, retainedAt: AT });
  expect(retained).toHaveLength(1);
  return { source, record: retained[0] };
};
const projectContext = (p: ReturnType<typeof proposal>, messages: ScientificInterpretationTurn[], project: ResearchProjectOwnerProjection | null = null) => buildScientificDiscussionContext({ retained: [p.record], currentProject: project, conversationId: "continuity-test", runtimeTurns: [p.source, ...messages] });
const recorded: { id: string; user: string; contribution: ScientificInterpretationContributionEnvelope; candidate: RetainedContributionCandidate["candidate"]; validation: RetainedContributionCandidate["validation"] }[] = JSON.parse(readFileSync(resolve("validation/protocol-designer-v1-source-coverage-actionable-review-repair-02/replayed-stages.json"), "utf8"));
const recordedTrajectory = (prefix: string, until: number) => {
  let retained: readonly RetainedContributionCandidate[] = [];
  const runtimeTurns: ScientificInterpretationTurn[] = [];
  const conversationId = `audit-${prefix}`;
  for (const r of recorded.filter(r => r.id.startsWith(prefix)).slice(0, until)) {
    const source = r.contribution.source.turns.find(t => t.role === "USER")!;
    runtimeTurns.push(source);
    for (const t of r.contribution.source.turns.filter(t => t.role === "NOXIA")) if (!runtimeTurns.some(s => s.turnId === t.turnId)) runtimeTurns.splice(runtimeTurns.length - 1, 0, t);
    retained = retainValidatedContributionCandidate({ retained, contribution: r.contribution, candidate: r.candidate, validation: r.validation,
      validatorRef: "PERSISTENT_PROJECT_DELTA_AND_PRJ_CONTRIBUTION_V1", sourceTurnRef: source.turnId, baseProject: null, dependencyBindings: [], traceRunId: null, retainedAt: AT });
  }
  return { retained, runtimeTurns, conversationId, currentProject: null };
};
const requestFor = (input: Parameters<typeof buildScientificDiscussionContext>[0]): ProductBridgeRequest => ({
  apiVersion: "1.0.0", evaluatePersistentDelta: true, conversation: { conversationId: input.conversationId, language: "fr", turns: [...input.runtimeTurns] }, currentProject: input.currentProject,
  scientificDiscussionContext: buildScientificDiscussionContext(input),
});
const payloadContext = (request: ProductBridgeRequest) => {
  const raw = buildPersistentDeltaPayload(request).contents[0].parts[0].text;
  return { raw, discussion: JSON.parse(raw.split("\n\n").find(b => b.startsWith("CONTEXTE SCIENTIFIQUE DISCUTÉ"))!.split("\n").slice(1).join("\n")) };
};

describe("N4 — retained scientific discussion before adoption", () => {
  const network = vi.fn(() => { throw new Error("NO_PROVIDER_IN_CONTINUITY_REPAIR"); });
  beforeEach(() => { network.mockClear(); vi.stubGlobal("fetch", network); });
  afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

  it.each(["oui c'est ça", "garde le reste", "celui-là", "comme on disait avant", "vous pouvez enregistrer cette formulation"])("preserves a rich unadopted proposal for %s", raw => {
    const p = proposal("first", [object("model-a", "Modèle alpha"), object("model-b", "Modèle bêta"), object("threshold", "Seuil 30 %"), object("group", "Deux groupes", "POPULATION")]);
    const before = JSON.stringify(p);
    const ctx = projectContext(p, [turn("next", raw)]);
    expect(ctx.active.map(e => e.content)).toEqual(expect.arrayContaining(["Modèle alpha", "Modèle bêta", "Seuil 30 %", "Deux groupes"]));
    expect(ctx.active.every(e => e.status === "PROPOSED_NOT_ADOPTED")).toBe(true);
    expect(ctx.projectWriteAuthorized).toBe(false); expect(ctx.projectAdoptionAuthorized).toBe(false);
    expect(JSON.stringify(p)).toBe(before); expect(ctx.baseProject).toBeNull();
  });
  it.each([
    ["Âge maximum 90 ans", "90 ans → 85 ans", "85 ans"],
    ["Construire un outil", "remplace outil par algorithme", "algorithme"],
    ["Critère survie", "remplace survie par douleur", "douleur"],
    ["Critère survie", "ce n'est pas la survie, c'est bien la douleur", "douleur"],
    ["Endpoint A", "endpoint A → endpoint B", "endpoint B"],
    ["Critère primaire", "primaire → secondaire", "secondaire"],
  ])("supersedes a local value without losing provenance: %s", (content, raw, next) => {
    const p = proposal("first", [object("changing", content), object("unchanged", "Deux cohortes")]);
    const ctx = projectContext(p, [turn("correction", raw)]);
    expect(ctx.active.find(e => e.nativeRef === "changing")?.content).toContain(next);
    expect(ctx.active.find(e => e.nativeRef === "changing")?.status).toBe("CORRECTED");
    expect(ctx.active.find(e => e.nativeRef === "changing")?.sourceRefs).toHaveLength(2);
    expect(ctx.history.some(h => h.element.content === content && h.status === "SUPERSEDED")).toBe(true);
    expect(ctx.active.some(e => e.content === "Deux cohortes")).toBe(true);
    expect(ctx.sources.map(s => s.turnRef)).toEqual(expect.arrayContaining(["first", "correction"]));
  });
  it("supersedes J3 with M3, leaving J7 and two cohorts intact", () => {
    const p = proposal("first", [object("follow", "Suivi à J3", "ACQUISITION"), object("initial", "Inclusion à J7", "ACQUISITION"), object("cohorts", "Deux cohortes")], [time("follow", "J3", 3), time("initial", "J7", 7)]);
    const ctx = projectContext(p, [turn("second", "ce n'est pas J3, c'est bien M3"), turn("third", "oui garde le reste")]);
    expect(ctx.active.some(e => /\bJ3\b/u.test(e.content))).toBe(false);
    expect(ctx.active.some(e => e.content.includes("J7"))).toBe(true);
    expect(ctx.active.find(e => e.temporalValue?.offset === 3)?.temporalValue?.unit).toBe("mois");
    expect(ctx.history.some(e => e.element.content.includes("J3"))).toBe(true);
    expect(ctx.active.some(e => e.content === "Deux cohortes")).toBe(true);
    expect(ctx.history.every(h => !ctx.active.some(e => e.ref === h.element.ref))).toBe(true);
  });
  it("resolves a qualified finalement M3 and does not guess a bare ambiguous time", () => {
    const p = proposal("first", [object("follow", "Suivi à J3", "ACQUISITION"), object("initial", "Inclusion à J7", "ACQUISITION")], [time("follow", "J3", 3), time("initial", "J7", 7)]);
    expect(projectContext(p, [turn("next", "suivi finalement M3")]).active.some(e => e.temporalValue?.unit === "mois")).toBe(true);
    expect(projectContext(p, [turn("next", "suivi finalement M3")]).active.some(e => /\bJ3\b/u.test(e.content))).toBe(false);
    const ambiguous = projectContext(p, [turn("next", "finalement M3")]);
    expect(ambiguous.unresolved.some(e => e.reason === "UNQUALIFIED_TIME_REFERENCE_NOT_UNIQUE")).toBe(true);
    expect(ambiguous.active.some(e => e.temporalValue?.unit === "mois")).toBe(false);
  });
  it("does not apply a numeric correction to unrelated quantities", () => {
    const p = proposal("first", [object("age", "Âge 90 ans"), object("pressure", "Pression 90 mmHg")]);
    const ctx = projectContext(p, [turn("second", "90 → 85")]);
    expect(ctx.active.every(e => e.status === "PROPOSED_NOT_ADOPTED")).toBe(true);
    expect(ctx.unresolved).toHaveLength(1);
  });
  it("does not replace an unqualified time shared by different acquisitions", () => {
    const p = proposal("first", [object("one", "Acquisition rouge J3", "ACQUISITION"), object("two", "Acquisition bleue J3", "ACQUISITION")], [time("one", "J3", 3), time("two", "J3", 3)]);
    const ctx = projectContext(p, [turn("next", "J3 → M3")]);
    expect(ctx.active.some(e => e.temporalValue?.unit === "mois")).toBe(false); expect(ctx.unresolved).toHaveLength(1);
  });
  it.each(["si je remplace outil par algorithme", "remplace outil par algorithme ?", 'exemple : "outil → algorithme"'])("keeps a hypothetical/quoted direction separate: %s", raw => {
    const p = proposal("first", [object("tool", "Construire un outil")]);
    expect(projectContext(p, [turn("next", raw)]).active[0].content).toBe("Construire un outil");
  });
  it("does not replace J3 inside a different time or a range", () => {
    const p = proposal("first", [object("one", "Acquisition J30", "ACQUISITION"), object("two", "Fenêtre J3-6")]);
    const ctx = projectContext(p, [turn("next", "J3 → M3")]);
    expect(ctx.active.map(e => e.content)).toEqual(["Acquisition J30", "Fenêtre J3-6"]);
  });
  it("demotes an explicitly named central role without inventing adoption", () => {
    const p = proposal("first", [object("model", "Modèle central", "PROJECT_INFORMATION", "PRIMARY_REFERENCE_ARM")]);
    const ctx = projectContext(p, [turn("next", "central → secondaire")]);
    expect(ctx.active[0].content).toBe("Modèle secondaire"); expect(ctx.active[0].studyRole).toBe("SECONDARY_DISCUSSION_ROLE");
  });
  it("demotes a named comparison without demoting its reference or losing the models", () => {
    const p = proposal("first", [object("diff", "Diffusion IRM", "IMAGING_MODALITY", "PRIMARY_REFERENCE_ARM"), object("ref", "IRM J1 référence", "ACQUISITION", "REFERENCE_STANDARD"), object("a", "Modèle alpha"), object("b", "Modèle bêta")]);
    const ctx = projectContext(p, [turn("next", "en gardant la diffusion IRM comme comparaison secondaire et l'IRM J1 comme référence")]);
    expect(ctx.active.find(e => e.nativeRef === "diff")?.studyRole).toBe("SECONDARY_DISCUSSION_ROLE");
    expect(ctx.active.find(e => e.nativeRef === "ref")?.studyRole).toBe("REFERENCE_STANDARD");
    expect(ctx.active.find(e => e.nativeRef === "a")?.status).toBe("PROPOSED_NOT_ADOPTED");
  });
  it("keeps a refusal historical and excludes its wording from the next provider context", () => {
    const p = proposal("first", [object("alpha", "Modèle alpha")]);
    const ctx = projectContext(p, [turn("refuse", "je refuse cette proposition"), turn("next", "que proposer autrement ?")]);
    expect(ctx.active).toEqual([]); expect(ctx.history[0]?.status).toBe("REJECTED");
    expect(ctx.historicalReferences).toEqual([]);
    expect(JSON.stringify(scientificDiscussionProviderContext(ctx))).not.toContain("Modèle alpha");
    expect(p.record.humanDecision).toBeNull();
  });
  it("permits an explicit return to a refusal without silently readopting it", () => {
    const p = proposal("first", [object("alpha", "Modèle alpha")]);
    const ctx = projectContext(p, [turn("refuse", "je refuse cette proposition"), turn("next", "revenons au modèle alpha")]);
    expect(ctx.active).toEqual([]); expect(ctx.historicalReferences.some(r => r.content === "Modèle alpha" && r.status === "REJECTED")).toBe(true);
    expect(ctx.projectAdoptionAuthorized).toBe(false);
  });
  it("a local refusal leaves unrelated parts of the proposal available", () => {
    const p = proposal("first", [object("alpha", "Hypothèse alpha", "HYPOTHESIS"), object("cohorts", "Deux cohortes")]);
    const ctx = projectContext(p, [turn("refuse", "je refuse l'hypothèse alpha"), turn("next", "garde le reste")]);
    expect(ctx.active.map(e => e.content)).toEqual(["Deux cohortes"]); expect(ctx.history[0].status).toBe("REJECTED");
    expect(JSON.stringify(scientificDiscussionProviderContext(ctx))).not.toContain("Hypothèse alpha");
  });
  it("does not leak a refused proposal through a shared broad historical source", () => {
    const broad = "Hypothèse alpha et deux cohortes";
    const p = proposal("first", [{ ...object("alpha", "Hypothèse alpha", "HYPOTHESIS"), sourceText: broad }, { ...object("cohorts", "Deux cohortes"), sourceText: broad }]);
    const ctx = projectContext(p, [turn("refuse", "je refuse l'hypothèse alpha"), turn("next", "garde les cohortes")]);
    expect(ctx.active.map(e => e.content)).toEqual(["Deux cohortes"]);
    expect(JSON.stringify(scientificDiscussionProviderContext(ctx))).not.toContain("Hypothèse alpha");
    expect(ctx.sources.some(s => s.sourceText === broad)).toBe(true);
  });
  it("preserves native provenance losslessly and does not collapse distinct identities", () => {
    const p = proposal("first", [object("one", "Deux cohortes")]), second = proposal("second", [object("two", "Deux cohortes")]);
    const ctx = buildScientificDiscussionContext({ retained: [p.record, second.record], currentProject: null, conversationId: "continuity-test", runtimeTurns: [p.source, second.source, turn("next", "oui")] }), provider = scientificDiscussionProviderContext(ctx);
    expect(ctx.active).toHaveLength(2); expect(provider.active).toHaveLength(1); expect(provider.active[0].otherOccurrences).toHaveLength(1);
    const { contextDigest: digest, ...projection } = provider;
    expect(digest).toBe(logicalDigest(projection)); expect(provider.sourceContextDigest).toBe(ctx.contextDigest);
    const native = p.record.candidate.canonicalChangeSet.objectChanges[0].candidate!.provenance;
    const projected = ctx.sources.find(s => ctx.active[0].sourceRefs.includes(s.ref))!;
    expect({ ...projected.nativeProvenance, sourceText: projected.sourceText }).toEqual(native);
  });
  it("new visible alternatives remain available after a different proposal was refused", () => {
    const p = proposal("first", [object("alpha", "Modèle alpha")]);
    const ctx = projectContext(p, [turn("refuse", "je refuse cette proposition"), turn("other", "Option 1 : modèle bêta\nOption 2 : modèle gamma", "NOXIA"), turn("next", "premiere option")]);
    expect(ctx.resolvedReferences).toHaveLength(1); expect(ctx.visibleOptions).toHaveLength(2);
  });
  it("respects explicit lifecycle invalidation without deleting its source", () => {
    const p = proposal("first", [object("alpha", "Modèle alpha")]);
    const retained = markContributionCandidateNonCurrent({ retained: [p.record], candidateRef: p.record.candidateRef, actuality: "SUPERSEDED", reasonRef: "correction:explicit", recordedAt: AT });
    const ctx = buildScientificDiscussionContext({ retained, currentProject: null, conversationId: "continuity-test", runtimeTurns: [p.source, turn("next", "garde le reste")] });
    expect(ctx.active).toEqual([]); expect(ctx.history[0]?.status).toBe("SUPERSEDED"); expect(ctx.sources[0]?.turnRef).toBe("first");
  });
  it.each(["REJECTED", "DEFERRED", "ADOPTED"] as const)("honors an existing %s Human Decision without manufacturing a new one", status => {
    const p = proposal("first", [object("alpha", "Modèle alpha")]);
    const presented = markContributionCandidatePresented({ retained: [p.record], candidateRef: p.record.candidateRef, presentedAt: AT });
    const decision: HumanDecisionEnvelope = { envelopeVersion: "1.0", decisionId: `decision:${status}`, gateId: "HUMAN_REVIEW", actor: "fixture:user", mandate: "PROJECT_OWNER", scope: [p.record.candidateRef], status, version: 1, timestamp: AT,
      impact: { affectedObjects: [], affectedEngines: [], reopenedGates: [], obsoleteProjections: [] }, targets: [p.record.candidateRef], reason: "Décision humaine explicite de fixture", provenance: [p.source.turnId], engineSource: "RESEARCH_PROJECT", projectVersion: null };
    const retained = recordContributionCandidateHumanDecision({ retained: presented, candidateRef: p.record.candidateRef, decision });
    const before = JSON.stringify(retained);
    const ctx = buildScientificDiscussionContext({ retained, currentProject: null, conversationId: "continuity-test", runtimeTurns: [p.source, turn("next", "que faire ensuite ?")] });
    if (status === "REJECTED") { expect(ctx.active).toEqual([]); expect(ctx.history[0].status).toBe("REJECTED"); }
    if (status === "DEFERRED") { expect(ctx.active[0].status).toBe("OPEN_UNKNOWN"); expect(ctx.active[0].doNotAutomaticallyReask).toBe(true); }
    if (status === "ADOPTED") { expect(ctx.active).toEqual([]); expect(ctx.excludedCandidateRefs).toContain(p.record.candidateRef); }
    expect(JSON.stringify(retained)).toBe(before); expect(ctx.projectWriteAuthorized).toBe(false);
  });
  it("resolves the first option of the second actual printed point", () => {
    const p = proposal("first", [object("cohorts", "Deux cohortes")]);
    const options = turn("visible", "1. Population\nOption 1 : ouverte\nOption 2 : restreinte\n2. Calendrier\nOption 1 : suivi à M3\nOption 2 : suivi à M6", "NOXIA");
    const ctx = projectContext(p, [options, turn("next", "second point premiere option")]);
    expect(ctx.resolvedReferences).toHaveLength(1);
    expect(ctx.visibleOptions.find(o => ctx.resolvedReferences[0].targetRefs.includes(o.ref))?.content).toBe("Option 1 : suivi à M3");
    expect(ctx.sources.find(s => s.turnRef === "visible")?.assertionKind).toBe("ASSISTANT_VISIBLE_PROPOSAL_NOT_ADOPTED");
  });
  it("does not fabricate options missing from the visible conversation", () => {
    const p = proposal("first", [object("cohorts", "Deux cohortes")]);
    const ctx = projectContext(p, [turn("next", "second point premiere option")]);
    expect(ctx.resolvedReferences).toEqual([]); expect(ctx.visibleOptions).toEqual([]); expect(ctx.unresolved).toHaveLength(1);
  });
  it("changes software scope without losing cohorts, times or the scientific base", () => {
    const p = proposal("first", [object("software", "Valider le logiciel", "OBJECTIVE"), object("cohorts", "Deux cohortes"), object("base", "Biobanque clinique biologique et imagerie"), object("follow", "Suivi à M3", "ACQUISITION")], [time("follow", "M3", 3, "mois")]);
    const ctx = projectContext(p, [turn("next", "le logiciel reste seulement un volet"), turn("later", "oui c'est ça")]);
    expect(ctx.active.find(e => e.nativeRef === "software")?.scopeStatement).toContain("seulement un volet");
    expect(ctx.active.map(e => e.content)).toEqual(expect.arrayContaining(["Deux cohortes", "Biobanque clinique biologique et imagerie", "Suivi à M3"]));
  });
  it("preserves a deferred open point without generating a new information request", () => {
    const p = proposal("first", [object("open", "Modalités avancées à préciser plus tard", "UNCERTAINTY"), object("cohorts", "Deux cohortes")]);
    const ctx = projectContext(p, [turn("next", "on garde le reste")]);
    const open = ctx.active.find(e => e.nativeRef === "open")!;
    expect(open.status).toBe("OPEN_UNKNOWN"); expect(open.deferred).toBe(true); expect(open.doNotAutomaticallyReask).toBe(true);
    expect(ctx.unresolved).toEqual([]);
  });
  it("keeps canonical Project A authoritative while discussing unadopted B", () => {
    const source = behaviorTurn("adopted", "Objectif alpha");
    const contribution = behaviorContribution({ contributionId: "adopted:a", turns: [source], candidateObjects: [behaviorItem({ itemId: "objective:alpha", proposedType: "OBJECTIVE", content: "Objectif alpha", turnId: source.turnId })] });
    const project = adoptBehaviorContribution(contribution, null, 1);
    const p = proposal("change", [object("objective:b", "Objectif bêta", "OBJECTIVE")], [], project);
    const before = JSON.stringify(project);
    const input = { retained: [p.record], currentProject: project, conversationId: "continuity-test", runtimeTurns: [p.source, turn("next", "oui garde cette proposition")] };
    const ctx = buildScientificDiscussionContext(input), payload = payloadContext(requestFor(input));
    expect(ctx.active.find(e => e.content === "Objectif bêta")?.status).toBe("PROPOSED_NOT_ADOPTED");
    expect(payload.raw).toContain("Objectif alpha"); expect(payload.discussion.authority).toContain("seule vérité adoptée");
    expect(JSON.stringify(project)).toBe(before); expect(ctx.baseProject?.versionId).toBe(project.versionId);
  });
  it("validates conversation and Project binding and rejects authority escalation", () => {
    const p = proposal("first", [object("alpha", "Modèle alpha")]);
    const input = { retained: [p.record], currentProject: null, conversationId: "continuity-test", runtimeTurns: [p.source, turn("next", "oui")] };
    const request = requestFor(input);
    expect(parseProductBridgeRequest(request)).not.toBeNull();
    for (const mutation of [ { projectWriteAuthorized: true }, { projectAdoptionAuthorized: true }, { sourceOfTruth: true }, { conversationId: "foreign" } ]) {
      const context = { ...request.scientificDiscussionContext!, ...mutation };
      const { contextDigest: _digest, ...unsigned } = context;
      expect(parseProductBridgeRequest({ ...request, scientificDiscussionContext: { ...context, contextDigest: logicalDigest(unsigned) } })).toBeNull();
    }
    expect(validateScientificDiscussionContext(request.scientificDiscussionContext, { ...input, runtimeTurns: [turn("first", "drift"), turn("next", "oui")] })).toBe(false);
  });
  it("retains the context through the existing session storage and reload", () => {
    const p = proposal("first", [object("alpha", "Modèle alpha")]);
    const session = createFunctionalResetSession(AT);
    session.conversationId = "continuity-test"; session.retainedContributionCandidates = [p.record]; session.runtimeTurns = [p.source, turn("next", "oui")];
    const values = new Map<string, string>();
    const storage: Storage = { get length() { return values.size; }, clear: () => { values.clear(); }, key: (i: number) => [...values.keys()][i] ?? null,
      getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); }, removeItem: (k: string) => { values.delete(k); } };
    persistFunctionalResetSession(storage, session);
    const restored = loadFunctionalResetSession(storage);
    expect(buildScientificDiscussionContext({ retained: restored.retainedContributionCandidates!, currentProject: restored.project, conversationId: restored.conversationId, runtimeTurns: restored.runtimeTurns })).toEqual(buildScientificDiscussionContext({ retained: session.retainedContributionCandidates!, currentProject: null, conversationId: session.conversationId, runtimeTurns: session.runtimeTurns }));
  });
  it("preserves older rich information when a newer candidate covers only a local change", () => {
    const a = proposal("rich", [object("model:a", "Modèle alpha"), object("model:b", "Modèle bêta"), object("groups", "Deux cohortes"), object("base", "Biobanque")]);
    const b = proposal("local", [object("reference", "Référence à J1")]);
    const input = { retained: [a.record, b.record], currentProject: null, conversationId: "continuity-test", runtimeTurns: [a.source, b.source, turn("next", "oui garde le reste")] };
    expect(buildScientificDiscussionContext(input).active.map(e => e.content)).toEqual(expect.arrayContaining(["Modèle alpha", "Modèle bêta", "Deux cohortes", "Biobanque", "Référence à J1"]));
  });
  it("fails closed on a bound overflow rather than silently dropping the comparison", () => {
    const ps = Array.from({ length: 11 }, (_, i) => proposal(`many:${i}`, Array.from({ length: 50 }, (_, j) => object(`o:${i}:${j}`, `Élément ${i} ${j}`))));
    const ctx = buildScientificDiscussionContext({ retained: ps.map(p => p.record), currentProject: null, conversationId: "continuity-test", runtimeTurns: [...ps.map(p => p.source), turn("next", "oui")] });
    expect(ctx.boundary).toBe("BOUND_EXCEEDED_CONTEXT_UNAVAILABLE"); expect(ctx.active).toEqual([]); expect(ctx.lastActiveCandidateRef).toBeNull();
  });
  it("AVC T05 sends the perfusion/metabolic comparison, reference MRI and secondary diffusion", () => {
    const input = recordedTrajectory("AVC", 4);
    const t5 = recorded.find(r => r.id === "AVC-T05")!;
    input.runtimeTurns.push(t5.contribution.source.turns.find(t => t.role === "USER")!);
    const request = requestFor(input), before = JSON.stringify(input), { raw, discussion } = payloadContext(request);
    expect(parseProductBridgeRequest(request)).not.toBeNull();
    const comparison = discussion.active.find((e: { kind: string; content: string }) => e.kind === "RELATION" && /perfusionnel.*COMPARES_WITH.*métabolique/iu.test(e.content));
    expect(comparison).toBeTruthy(); expect(comparison.status).toBe("PROPOSED_NOT_ADOPTED");
    expect(comparison.studyRole).not.toBe("SECONDARY_DISCUSSION_ROLE");
    expect(discussion.active.filter((e: { kind: string; content: string }) => e.kind === "RELATION" && /perfusionnel.*COMPARES_WITH.*métabolique/iu.test(e.content)).every((e: { studyRole: string }) => e.studyRole !== "SECONDARY_DISCUSSION_ROLE")).toBe(true);
    expect(raw).toContain("CBF"); expect(raw).toContain("Tmax"); expect(raw).toContain("OEF"); expect(raw).toContain("CMRO2"); expect(raw).toContain("TICI");
    expect(discussion.active.some((e: { studyRole: string; content: string }) => e.studyRole === "REFERENCE_STANDARD" && /IRM/iu.test(e.content))).toBe(true);
    expect(discussion.active.some((e: { studyRole: string; content: string }) => e.studyRole === "SECONDARY_DISCUSSION_ROLE" && /diffusion/iu.test(e.content))).toBe(true);
    expect(discussion.active.some((e: { temporalValue?: { offset: number; unit: string } }) => e.temporalValue?.offset === 1 && e.temporalValue.unit === "jour")).toBe(true);
    expect(raw).toContain("PROPOSITIONS NOXIA RÉCENTES"); expect(raw).not.toContain("La formulation de cette étape n’a pas abouti");
    expect(discussion.projectWriteAuthorized).toBe(false); expect(discussion.baseProject).toBeNull(); expect(JSON.stringify(input)).toBe(before);
  });
  it("RHU T03/T04 retain J7/M3 and never make J3 current again", () => {
    const input = recordedTrajectory("RHU", 3); input.runtimeTurns.push(turn("rhu-next", "oui garde le reste"));
    const ctx = buildScientificDiscussionContext(input);
    expect(ctx.boundary).toBe("COMPLETE");
    expect(ctx.active.some(e => /\bJ3\b/u.test(e.content))).toBe(false);
    expect(ctx.active.some(e => e.temporalValue?.offset === 3 && e.temporalValue.unit === "mois")).toBe(true);
    expect(ctx.active.some(e => e.temporalValue?.offset === 7 && e.temporalValue.unit === "jour")).toBe(true);
    expect(ctx.history.some(h => /\bJ3\b/u.test(h.element.content))).toBe(true);
    expect(ctx.active.some(e => /cohorte AVC/iu.test(e.content))).toBe(true); expect(ctx.active.some(e => /cohorte IDM/iu.test(e.content))).toBe(true);
  });
  it.each(recorded.map(r => r.id))("recorded %s remains compatible with the context projection, without replaying a provider", id => {
    const index = Number(id.slice(-2)); const input = recordedTrajectory(id.slice(0, 3), index);
    const ctx = buildScientificDiscussionContext(input);
    expect(validateScientificDiscussionContext(ctx, input)).toBe(true);
    expect(ctx.projectWriteAuthorized).toBe(false); expect(input.retained).toHaveLength(index);
  });
});
