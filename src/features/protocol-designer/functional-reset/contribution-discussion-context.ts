import { logicalDigest } from "../../knowledge-engine/canonical.js";
import type { ResearchProjectOwnerProjection } from "../../research-project-construction/contribution-owner-boundary.js";
import type { ScientificInterpretationTurn } from "../../scientific-interpretation/contracts.js";
import type { RetainedContributionCandidate } from "./contribution-lifecycle.js";
import type { CanonicalProjectProvenance } from "../../research-project-construction/canonical-project-backbone.js";

/** Read-only projection of the existing retained-contribution owner. No store,
 * extraction, human decision, canonical mutation or scientific inference. */
export type DiscussionStatus = "PROPOSED_NOT_ADOPTED" | "CORRECTED" | "REJECTED" | "SUPERSEDED" | "OPEN_UNKNOWN";
export type DiscussionSource = Readonly<{
  ref: string; candidateRef: string | null; candidateDigest: string | null;
  turnRef: string; turnDigest: string; sourceText: string | null;
  evidenceRefs: readonly string[]; assertionKind: string;
  nativeProvenance: Omit<CanonicalProjectProvenance, "sourceText"> | null;
}>;
export type DiscussionElement = Readonly<{
  ref: string; nativeRef: string; candidateRef: string;
  kind: "OBJECT" | "RELATION" | "TEMPORAL_QUALIFICATION" | "EXPECTED_VARIABLE_OCCASION";
  scientificType: string; content: string; status: DiscussionStatus;
  epistemicState: string; studyRole: string | null;
  polarity: string;
  sourceRefs: readonly string[]; linkedRefs: readonly string[];
  temporalValue?: Readonly<{ unit: string | null; offset: number | null; direction: string; reference: unknown;
    kind: string; lowerBound: number | null; upperBound: number | null; relativeEventLabel: string | null; tolerance: unknown }>;
  scopeStatement?: string;
  deferred?: true; doNotAutomaticallyReask?: true;
}>;
export type VisibleDiscussionOption = Readonly<{
  ref: string; pointOrdinal: number | null; optionOrdinal: number;
  content: string; sourceRef: string; status: "PROPOSED_NOT_ADOPTED";
}>;
export type ScientificDiscussionContext = Readonly<{
  contract: "RETAINED_CONTRIBUTION_DISCUSSION_CONTEXT"; contractVersion: "1.0.0";
  owner: "RETAINED_CONTRIBUTION_LIFECYCLE"; conversationId: string; requestingTurnRef: string;
  baseProject: RetainedContributionCandidate["baseProject"];
  lastActiveCandidateRef: string | null;
  active: readonly DiscussionElement[];
  history: readonly Readonly<{ element: DiscussionElement; status: "REJECTED" | "SUPERSEDED"; reasonSourceRef: string }>[];
  historicalReferences: readonly Readonly<{ elementRef: string; content: string; status: "REJECTED" | "SUPERSEDED"; requestingSourceRef: string }>[];
  visibleOptions: readonly VisibleDiscussionOption[];
  resolvedReferences: readonly Readonly<{ sourceRef: string; targetRefs: readonly string[]; status: "PROPOSED_NOT_ADOPTED" }>[];
  unresolved: readonly Readonly<{ sourceRef: string; reason: string; status: "OPEN_UNKNOWN" }>[];
  sources: readonly DiscussionSource[];
  excludedCandidateRefs: readonly string[];
  boundary: "COMPLETE" | "BOUND_EXCEEDED_CONTEXT_UNAVAILABLE";
  projectionOnly: true; sourceOfTruth: false;
  projectWriteAuthorized: false; projectAdoptionAuthorized: false;
  contextDigest: string;
}>;

const MAX_ELEMENTS = 512;
const MAX_CONTEXT_CHARS = 512_000;
const normal = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[’']/gu, " ").replace(/\s+/gu, " ").trim();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
const literal = (s: string) => new RegExp(`(?<![\\p{L}\\p{N}])${escape(s)}(?![\\p{L}\\p{N}]|[-–—]\\d)`, "giu");
const words = (s: string) => normal(s).match(/[a-z0-9]+/gu)?.filter(w => w.length > 2 && !["les", "des", "une", "dans", "pour", "avec", "puis", "bien", "est", "pas", "cette", "proposition", "premiere", "deuxieme", "point", "option", "refuse", "rejette", "finalement", "seulement", "reste", "comme", "garde", "gardant"].includes(w)) ?? [];
const overlaps = (a: string, b: string) => words(a).some(w => words(b).includes(w));
const secondaryComparison = (source: string | null, endpoints: readonly string[]) => (source ?? "").split(/[.;\n]/u)
  .some(clause => /comparaison secondaire/iu.test(clause)
    && endpoints.some(label => normal(clause).includes(normal(label).replace(/\.$/u, ""))));
const assertedDirection = (s: string) => !/\?|[«»“”"]|\b(?:si|supposons|imaginons|exemple|peut-être|peut etre)\b/iu.test(s);
const sourceClause = (s: string, start: number, length: number) => {
  const prefix = s.slice(0, start);
  const boundary = Math.max(...[".", "!", "?", ";", "\n"].map(c => prefix.lastIndexOf(c)));
  const following = s.slice(start + length).search(/[.!?;\n]/u);
  return s.slice(boundary + 1, following < 0 ? s.length : start + length + following + 1);
};
const timeCode = (unit: string | null, offset: number | null) => offset === null ? "" : `${/^jours?$/u.test(unit ?? "") ? "J" : /^mois$/u.test(unit ?? "") ? "M" : /^ans?$/u.test(unit ?? "") ? "A" : unit ?? ""}${offset}`;
const replacementPairs = (source: string): { old: string; next: string; inverse: boolean }[] => {
  const pairs: { old: string; next: string; inverse: boolean }[] = [];
  const spans: { start: number; end: number }[] = [];
  for (const pattern of [
    /([\p{L}]+\s+[A-Z])(?![\p{L}\p{N}])\s*(?:→|->)\s*((?:[\p{L}]+\s+)?[A-Z])(?![\p{L}\p{N}])/giu,
    /ce n['’]est pas\s+(?:le |la |l['’])?([\p{L}\p{N}+%-]+(?:\s+ans?)?)\s*,?\s*c['’]est\s+(?:bien\s+)?(?:le |la |l['’])?([\p{L}\p{N}+%-]+(?:\s+ans?)?)/giu,
    /([\p{L}\p{N}+%-]+(?:\s+ans?)?)\s*(?:→|->)\s*([\p{L}\p{N}+%-]+(?:\s+ans?)?)/giu,
    /(?:remplace[rz]?|change[rz]?)\s+(?:le |la |l['’])?([\p{L}\p{N}+%-]+(?:\s+ans?)?)\s+(?:par|en)\s+(?:le |la |l['’])?([\p{L}\p{N}+%-]+(?:\s+ans?)?)/giu,
    /([\p{L}\p{N}+%-]+(?:\s+ans?)?)\s+(?:plutôt|plutot)\s+que\s+([\p{L}\p{N}+%-]+(?:\s+ans?)?)/giu,
  ]) for (const match of source.matchAll(pattern)) {
    if (spans.some(s => match.index! < s.end && match.index! + match[0].length > s.start)) continue;
    if (!assertedDirection(sourceClause(source, match.index!, match[0].length))) continue;
    const inverse = /plut[oô]t/u.test(match[0]);
    spans.push({ start: match.index!, end: match.index! + match[0].length });
    pairs.push({ old: (inverse ? match[2] : match[1]).trim(), next: (inverse ? match[1] : match[2]).trim(), inverse });
  }
  return pairs.filter((p, i) => pairs.findIndex(q => normal(q.old) === normal(p.old) && normal(q.next) === normal(p.next)) === i);
};

/** Project explicit labelled options or concrete native offers, preserving their
 * visible NOXIA source. General explanations are not scientific candidates. */
export const projectVisibleDiscussionOptions = (turn: Pick<ScientificInterpretationTurn, "turnId" | "content">): VisibleDiscussionOption[] => {
  let point: number | null = null;
  const result: VisibleDiscussionOption[] = [];
  for (const line of turn.content.split("\n")) {
    const heading = line.match(/^\s*(?:point\s+)?(\d+)\s*[.)—:-]\s*(.*)$/iu);
    if (heading) point = Number(heading[1]);
    const option = line.match(/^\s*(?:[-*]\s*)?option\s+(\d+)\s*[.)—:-]\s*(.+)$/iu);
    if (option) result.push({ ref: `visible-option:${turn.turnId}:${point ?? "root"}:${option[1]}`, pointOrdinal: point,
      optionOrdinal: Number(option[1]), content: line.trim(), sourceRef: `visible-source:${turn.turnId}`, status: "PROPOSED_NOT_ADOPTED" });
  }
  if (result.length) return result;
  // Reuse the visible-option projection for an explicit native offer. This is
  // presentation evidence only: no scientific object or candidate is invented.
  const offers = [...turn.content.matchAll(/\b(?:je (?:vous |te )?propose\b|(?:une?|la|le) [^.!?\n]{0,65} possible (?:serait|est)\b)/giu)];
  if (!offers.length || /^(?:\s*)(?:par exemple|si\b|supposons\b)/iu.test(turn.content)) return [];
  return offers.flatMap((offer, index) => {
    const span = turn.content.slice(offer.index, offers[index + 1]?.index ?? turn.content.length).trim();
    // An invitation to decide is not part of the scientific payload.
    const content = span.replace(/\s*(?:Souhaitez-vous|Voulez-vous|Veux-tu|Voulez vous|Souhaitez vous)[\s\S]*$/iu, "").trim();
    if (!content || content.length > 4_000) return [];
    const alternatives = content.split(/\s+ou\s+/iu);
    return alternatives.map((text, alternative) => ({
      ref: `visible-option:${turn.turnId}:root:${index + 1}:${alternative + 1}`, pointOrdinal: null,
      optionOrdinal: index + alternative + 1, content: text.trim(),
      sourceRef: `visible-source:${turn.turnId}`, status: "PROPOSED_NOT_ADOPTED" as const,
    }));
  });
};

export const buildScientificDiscussionContext = (input: {
  retained: readonly RetainedContributionCandidate[];
  currentProject: ResearchProjectOwnerProjection | null;
  conversationId: string; runtimeTurns: readonly Pick<ScientificInterpretationTurn, "turnId" | "role" | "content">[];
  selectedReviewRef?: string | null;
}): ScientificDiscussionContext => {
  const lastUser = [...input.runtimeTurns].reverse().find(t => t.role === "USER");
  const baseProject = input.currentProject ? { projectId: input.currentProject.projectId, versionId: input.currentProject.versionId, projectDigest: input.currentProject.projectDigest } : null;
  const sources = new Map<string, DiscussionSource>();
  let active: DiscussionElement[] = [];
  const history: ScientificDiscussionContext["history"][number][] = [];
  const historicalReferences: ScientificDiscussionContext["historicalReferences"][number][] = [];
  const unresolved: ScientificDiscussionContext["unresolved"][number][] = [];
  const resolvedReferences: ScientificDiscussionContext["resolvedReferences"][number][] = [];
  let visibleOptions: VisibleDiscussionOption[] = [];
  let lastActiveCandidateRef: string | null = null;
  const excludedCandidateRefs: string[] = [];
  const turns = new Map(input.runtimeTurns.map(t => [t.turnId, t]));
  const rejectedRefs = new Set<string>();
  let precedingUserRef: string | null = null;
  const usable = input.retained.filter(record => {
    const source = turns.get(record.sourceTurnRef);
    const valid = source?.role === "USER" && logicalDigest(source.content) === record.sourceDigest
      && record.contribution.source.conversationId === input.conversationId
      && record.validation.valid && !record.validation.blocks.length
      && record.candidate.projectWriteAuthorized === false
      && logicalDigest({ contribution: record.contribution, candidate: record.candidate }) === record.candidateDigest
      && record.dependencyBindings.every(binding => binding.actuality === "CURRENT")
      && logicalDigest(record.baseProject) === logicalDigest(baseProject);
    if (!valid || record.actuality === "STALE" || record.humanDecision?.status === "ADOPTED") excludedCandidateRefs.push(record.candidateRef);
    return valid && record.actuality !== "STALE" && record.humanDecision?.status !== "ADOPTED";
  });
  const addSource = (record: RetainedContributionCandidate, provenance: CanonicalProjectProvenance) => {
    const sourceRef = `discussion-source:${logicalDigest({ candidateRef: record.candidateRef, provenance })}`;
    const { sourceText, ...nativeProvenance } = provenance;
    sources.set(sourceRef, { ref: sourceRef, candidateRef: record.candidateRef, candidateDigest: record.candidateDigest,
      turnRef: record.sourceTurnRef, turnDigest: record.sourceDigest, sourceText,
      evidenceRefs: provenance.evidenceRefs ?? [], assertionKind: provenance.assertionKind ?? "OWNER_SUPPORTED", nativeProvenance: structuredClone(nativeProvenance) });
    return sourceRef;
  };
  const sourceForTurn = (turn: Pick<ScientificInterpretationTurn, "turnId" | "role" | "content">) => {
    const ref = `discussion-turn:${turn.turnId}`;
    sources.set(ref, { ref, candidateRef: null, candidateDigest: null, turnRef: turn.turnId, turnDigest: logicalDigest(turn.content), sourceText: turn.content, evidenceRefs: [], assertionKind: "USER_STATED_CONTEXTUAL_DIRECTION", nativeProvenance: null });
    return ref;
  };
  const supersede = (entry: DiscussionElement, updated: DiscussionElement, sourceRef: string) => {
    history.push({ element: entry, status: "SUPERSEDED", reasonSourceRef: sourceRef });
    const ref = `discussion-version:${logicalDigest({ previousRef: entry.ref, updated, sourceRef })}`;
    active = active.map(e => e.ref === entry.ref ? { ...updated, ref } : {
      ...e, linkedRefs: e.linkedRefs.map(link => link === entry.ref ? ref : link),
    });
  };
  for (const turn of input.runtimeTurns) {
    if (turn.role === "NOXIA") {
      const options = projectVisibleDiscussionOptions(turn);
      const closedParent = usable.some(r => r.sourceTurnRef === precedingUserRef
        && (rejectedRefs.has(r.candidateRef) || r.humanDecision?.status === "REJECTED" || r.actuality === "SUPERSEDED"));
      if (options.length && !closedParent) {
        const ref = `visible-source:${turn.turnId}`;
        sources.set(ref, { ref, candidateRef: null, candidateDigest: null, turnRef: turn.turnId, turnDigest: logicalDigest(turn.content), sourceText: turn.content, evidenceRefs: [], assertionKind: "ASSISTANT_VISIBLE_PROPOSAL_NOT_ADOPTED", nativeProvenance: null });
        visibleOptions = options;
      }
      continue;
    }
    if (turn.role !== "USER") continue;
    precedingUserRef = turn.turnId;
    for (const record of usable.filter(r => r.sourceTurnRef === turn.turnId)) {
      const changes = record.candidate.canonicalChangeSet;
      const objectContents = new Map(changes.objectChanges.flatMap(c => c.candidate ? [[c.objectId, c.candidate.content] as const] : []));
      const scopedRef = (ref: string) => `discussion:${logicalDigest({ candidateRef: record.candidateRef, nativeRef: ref })}`;
      const entries: DiscussionElement[] = [];
      for (const change of changes.objectChanges) if (change.candidate && change.operation !== "REMOVE") {
        const c = change.candidate, ref = scopedRef(c.objectId);
        entries.push({ ref, nativeRef: c.objectId, candidateRef: record.candidateRef, kind: "OBJECT", scientificType: c.objectType,
          content: c.content, epistemicState: c.epistemicState, studyRole: c.scientificRole ?? c.projection.sourceStudyRole ?? null, polarity: c.projection.sourcePolarity ?? "UNKNOWN",
          status: c.epistemicState === "UNKNOWN" || c.objectType === "UNCERTAINTY" ? "OPEN_UNKNOWN" : "PROPOSED_NOT_ADOPTED",
          sourceRefs: [addSource(record, c.provenance)], linkedRefs: [],
          ...(/plus tard|pour plus tard|défini\w* plus tard/iu.test(c.provenance.sourceText ?? "") ? { deferred: true as const, doNotAutomaticallyReask: true as const } : {}) });
      }
      for (const change of changes.relationChanges) if (change.candidate && change.operation !== "REMOVE") {
        const c = change.candidate, ref = scopedRef(c.relationId);
        entries.push({ ref, nativeRef: c.relationId, candidateRef: record.candidateRef, kind: "RELATION", scientificType: c.relationType,
          content: `${objectContents.get(c.sourceObjectRef) ?? c.sourceObjectRef} ${c.relationType} ${objectContents.get(c.targetObjectRef) ?? c.targetObjectRef}`,
          epistemicState: c.epistemicState, polarity: c.polarity, studyRole: secondaryComparison(c.provenance.sourceText,
            [objectContents.get(c.sourceObjectRef) ?? c.sourceObjectRef, objectContents.get(c.targetObjectRef) ?? c.targetObjectRef]) ? "SECONDARY_DISCUSSION_ROLE" : null,
          status: c.epistemicState === "UNKNOWN" ? "OPEN_UNKNOWN" : "PROPOSED_NOT_ADOPTED", sourceRefs: [addSource(record, c.provenance)], linkedRefs: [scopedRef(c.sourceObjectRef), scopedRef(c.targetObjectRef)] });
      }
      for (const change of [...changes.temporalQualificationChanges, ...changes.expectedVariableOccasionChanges]) if (change.candidate && change.operation !== "REMOVE") {
        const c = change.candidate, qualification = "qualificationId" in c;
        const nativeRef = qualification ? c.qualificationId : c.occasionId;
        const subject = qualification ? c.subjectProjectRef : c.variableProjectRef;
        const ref = scopedRef(nativeRef);
        entries.push({ ref, nativeRef, candidateRef: record.candidateRef, kind: qualification ? "TEMPORAL_QUALIFICATION" : "EXPECTED_VARIABLE_OCCASION",
          scientificType: qualification ? c.temporalRole : "EXPECTED_VARIABLE_OCCASION",
          content: `${objectContents.get(subject) ?? subject} : ${timeCode(c.anchor.unit, c.anchor.offset)} (${c.anchor.direction})`,
          epistemicState: c.anchor.reference.status === "UNKNOWN" ? "UNKNOWN" : "KNOWN", studyRole: null, polarity: "AFFIRMED",
          status: c.anchor.reference.status === "UNKNOWN" ? "OPEN_UNKNOWN" : "PROPOSED_NOT_ADOPTED",
          sourceRefs: [addSource(record, c.provenance)], linkedRefs: [scopedRef(subject)],
          temporalValue: { unit: c.anchor.unit, offset: c.anchor.offset, direction: c.anchor.direction, reference: structuredClone(c.anchor.reference),
            kind: c.anchor.kind, lowerBound: c.anchor.lowerBound, upperBound: c.anchor.upperBound, relativeEventLabel: c.anchor.relativeEventLabel, tolerance: structuredClone(c.anchor.tolerance) } });
      }
      const status = record.humanDecision?.status === "REJECTED" || rejectedRefs.has(record.candidateRef) ? "REJECTED" : record.actuality === "SUPERSEDED" ? "SUPERSEDED" : null;
      if (status) {
        rejectedRefs.add(record.candidateRef);
        for (const element of entries) history.push({ element, status, reasonSourceRef: record.humanDecision?.decisionId ?? record.history.at(-1)?.reasonRef ?? record.candidateRef });
      } else {
        active.push(...(record.humanDecision?.status === "DEFERRED" ? entries.map(e => ({ ...e, status: "OPEN_UNKNOWN" as const, deferred: true as const, doNotAutomaticallyReask: true as const })) : entries));
        lastActiveCandidateRef = record.candidateRef;
      }
    }
    const pairs = replacementPairs(turn.content);
    for (const pair of pairs) {
      const matches = active.filter(e => literal(pair.old).test(e.content));
      if (!matches.length && pair.inverse) continue;
      const ref = sourceForTurn(turn);
      if (!matches.length) { unresolved.push({ sourceRef: ref, reason: "EXPLICIT_REPLACEMENT_TARGET_NOT_IN_RETAINED_DISCUSSION", status: "OPEN_UNKNOWN" }); continue; }
      // Different values/identities sharing an unqualified number are ambiguous.
      const objects = matches.filter(e => e.kind === "OBJECT" && e.scientificType !== "UNCERTAINTY");
      if (/^\d+$/u.test(pair.old) && new Set(objects.map(e => normal(e.content.replace(literal(pair.old), "")))).size > 1) {
        unresolved.push({ sourceRef: ref, reason: "MULTIPLE_NUMERIC_REPLACEMENT_TARGETS_REQUIRE_SCOPE", status: "OPEN_UNKNOWN" }); continue;
      }
      const temporalTargetKeys = matches.filter(e => e.temporalValue).flatMap(e => e.linkedRefs)
        .map(ref => words(active.find(e => e.ref === ref)?.content ?? ref).join(" "));
      if (/^[JMA]\+?\d+$/iu.test(pair.old) && new Set(temporalTargetKeys).size > 1) {
        unresolved.push({ sourceRef: ref, reason: "MULTIPLE_TIME_REPLACEMENT_TARGETS_REQUIRE_SCOPE", status: "OPEN_UNKNOWN" }); continue;
      }
      for (const entry of matches) {
        const code = pair.next.match(/^([JMA])\+?(\d+)$/iu);
        const temporalValue = entry.temporalValue && code
          ? { ...entry.temporalValue, unit: code[1].toUpperCase() === "J" ? "jour" : code[1].toUpperCase() === "M" ? "mois" : "an", offset: Number(code[2]) }
          : entry.temporalValue;
        const role = /^(?:principal|primaire|primary|central)$/iu.test(pair.old) && /^(?:secondaire|secondary)$/iu.test(pair.next) ? "SECONDARY_DISCUSSION_ROLE" : entry.studyRole;
        supersede(entry, { ...entry, content: entry.content.replace(literal(pair.old), pair.next), status: "CORRECTED", studyRole: role,
          ...(temporalValue ? { temporalValue } : {}), sourceRefs: [...entry.sourceRefs, ref] }, ref);
      }
    }
    // A time given without its old value can only resolve a unique stated target.
    const finalTime = turn.content.match(/(?:finalement|plutôt|plutot)\s+(?:à |a )?([JMA]\+?\d+)/iu);
    if (finalTime && !pairs.length && assertedDirection(sourceClause(turn.content, finalTime.index!, finalTime[0].length))) {
      const targets = active.filter(e => e.temporalValue && overlaps(turn.content.replace(finalTime[0], ""), e.content));
      if (targets.length === 1) {
        const e = targets[0], ref = sourceForTurn(turn), code = finalTime[1].match(/^([JMA])\+?(\d+)$/iu)!;
        supersede(e, { ...e, content: e.content.replace(literal(timeCode(e.temporalValue!.unit, e.temporalValue!.offset)), finalTime[1]), status: "CORRECTED",
          temporalValue: { ...e.temporalValue!, unit: code[1].toUpperCase() === "J" ? "jour" : code[1].toUpperCase() === "M" ? "mois" : "an", offset: Number(code[2]) }, sourceRefs: [...e.sourceRefs, ref] }, ref);
        for (const object of active.filter(o => e.linkedRefs.includes(o.ref) && literal(timeCode(e.temporalValue!.unit, e.temporalValue!.offset)).test(o.content))) {
          supersede(object, { ...object, content: object.content.replace(literal(timeCode(e.temporalValue!.unit, e.temporalValue!.offset)), finalTime[1]), status: "CORRECTED", sourceRefs: [...object.sourceRefs, ref] }, ref);
        }
      } else unresolved.push({ sourceRef: sourceForTurn(turn), reason: "UNQUALIFIED_TIME_REFERENCE_NOT_UNIQUE", status: "OPEN_UNKNOWN" });
    }
    const refusal = /\b(?:je refuse|je rejette|nous refusons|nous rejetons)\b/iu.test(turn.content) && assertedDirection(turn.content);
    if (refusal) {
      const ref = sourceForTurn(turn);
      const scoped = active.filter(e => overlaps(turn.content, e.content));
      const candidates = new Set(scoped.map(e => e.candidateRef));
      const target = candidates.size === 1 ? [...candidates][0] : turn === lastUser && input.selectedReviewRef ? input.selectedReviewRef
        : new Set(active.map(e => e.candidateRef)).size === 1 ? active[0]?.candidateRef : null;
      if (target) {
        const wholeCandidate = /\b(?:proposition|structure|ensemble|tout)\b/iu.test(turn.content);
        const targets = new Set((wholeCandidate ? active.filter(e => e.candidateRef === target) : scoped).map(e => e.ref));
        if (!targets.size) unresolved.push({ sourceRef: ref, reason: "REFUSAL_TARGET_NOT_IDENTIFIED", status: "OPEN_UNKNOWN" });
        else {
          if (wholeCandidate) rejectedRefs.add(target);
          const rejected = active.filter(e => targets.has(e.ref) || e.linkedRefs.some(r => targets.has(r)));
          for (const element of rejected) history.push({ element, status: "REJECTED", reasonSourceRef: ref });
          active = active.filter(e => !rejected.some(r => r.ref === e.ref)); visibleOptions = [];
        }
      } else unresolved.push({ sourceRef: ref, reason: "REFUSAL_SCOPE_AMBIGUOUS", status: "OPEN_UNKNOWN" });
    }
    const secondary = turn.content.match(/(?:garde[rz]?|gardant)?\s*(?:le |la |l['’])?([^.;\n]+?)\s+(?:seulement\s+|uniquement\s+)?(?:comme |en )?(?:comparaison |critère |critere )?secondaire\b/iu);
    if (secondary && assertedDirection(sourceClause(turn.content, secondary.index!, secondary[0].length))) {
      const targetWords = words(secondary[1].split(/\b(?:gardant|garde[rz]?)\b|,/iu).at(-1) ?? "");
      for (const e of active.filter(e => e.kind === "OBJECT" && targetWords.length > 0 && targetWords.every(w => words(e.content).includes(w)))) {
        const ref = sourceForTurn(turn);
        supersede(e, { ...e, content: e.content.replace(/\b(?:principal|primaire|primary)\b/giu, "secondaire"), studyRole: "SECONDARY_DISCUSSION_ROLE", scopeStatement: secondary[0], status: "CORRECTED", sourceRefs: [...e.sourceRefs, ref] }, ref);
      }
    }
    const scopedOnly = turn.content.match(/([^.;\n]+?)\s+reste\s+(?:seulement\s+)?(?:un |une )?volet[^.;\n]*/iu);
    if (scopedOnly && assertedDirection(sourceClause(turn.content, scopedOnly.index!, scopedOnly[0].length))) for (const e of active.filter(e => e.kind === "OBJECT" && overlaps(scopedOnly[1], e.content))) {
      const ref = sourceForTurn(turn);
      supersede(e, { ...e, status: "CORRECTED", scopeStatement: scopedOnly[0], sourceRefs: [...e.sourceRefs, ref] }, ref);
    }
    const pointOrdinal = normal(turn.content).match(/\b(premier|second|deuxieme|troisieme)\s+point\b/u);
    const optionOrdinal = normal(turn.content).match(/\b(premiere|deuxieme|seconde|troisieme)\s+option\b/u);
    if (optionOrdinal) {
      const ordinal = (s: string) => /^premier/u.test(s) ? 1 : /^(?:second|deuxieme)/u.test(s) ? 2 : 3;
      const options = visibleOptions.filter(o => o.optionOrdinal === ordinal(optionOrdinal[1]) && (!pointOrdinal || o.pointOrdinal === ordinal(pointOrdinal[1])));
      if (options.length === 1) resolvedReferences.push({ sourceRef: sourceForTurn(turn), targetRefs: [options[0].ref], status: "PROPOSED_NOT_ADOPTED" });
      else unresolved.push({ sourceRef: sourceForTurn(turn), reason: "VISIBLE_OPTION_REFERENCE_NOT_UNIQUE", status: "OPEN_UNKNOWN" });
    }
    if (turn === lastUser && /\b(?:revenons|revenir|reprenons|reparlons|comme avant)\b/iu.test(turn.content)) {
      for (const h of history.filter(h => overlaps(turn.content, h.element.content))) historicalReferences.push({ elementRef: h.element.ref, content: h.element.content, status: h.status, requestingSourceRef: sourceForTurn(turn) });
    }

  }
  // A prior source remains evidence for a correction, never a new current-user
  // source anchor. Closed content is omitted unless an explicit return needs it.
  const context = {
    contract: "RETAINED_CONTRIBUTION_DISCUSSION_CONTEXT" as const, contractVersion: "1.0.0" as const, owner: "RETAINED_CONTRIBUTION_LIFECYCLE" as const,
    conversationId: input.conversationId, requestingTurnRef: lastUser?.turnId ?? "", baseProject,
    lastActiveCandidateRef: active.some(e => e.candidateRef === lastActiveCandidateRef) ? lastActiveCandidateRef : active.at(-1)?.candidateRef ?? null,
    active, history, historicalReferences, visibleOptions, resolvedReferences, unresolved, sources: [...sources.values()], excludedCandidateRefs,
    boundary: "COMPLETE" as ScientificDiscussionContext["boundary"], projectionOnly: true as const, sourceOfTruth: false as const,
    projectWriteAuthorized: false as const, projectAdoptionAuthorized: false as const,
  };
  if (active.length + history.length > MAX_ELEMENTS || JSON.stringify(context).length > MAX_CONTEXT_CHARS) {
    context.active = []; context.history = []; context.historicalReferences = []; context.visibleOptions = []; context.resolvedReferences = []; context.sources = [];
    context.lastActiveCandidateRef = null; context.unresolved = []; context.boundary = "BOUND_EXCEEDED_CONTEXT_UNAVAILABLE";
  }
  return { ...context, contextDigest: logicalDigest(context) };
};

/** HTTP projection validation. All statuses remain non-adopted and all source
 * digests bind to the actual conversation; none grant persistent-write rights. */
export const validateScientificDiscussionContext = (value: unknown, input: {
  conversationId: string; runtimeTurns: readonly Pick<ScientificInterpretationTurn, "turnId" | "role" | "content">[]; currentProject: ResearchProjectOwnerProjection | null;
}): value is ScientificDiscussionContext => {
  try {
    const c = value as ScientificDiscussionContext;
    const { contextDigest, ...unsigned } = c;
    const lastUser = [...input.runtimeTurns].reverse().find(t => t.role === "USER");
    const base = input.currentProject ? { projectId: input.currentProject.projectId, versionId: input.currentProject.versionId, projectDigest: input.currentProject.projectDigest } : null;
    if (c.contract !== "RETAINED_CONTRIBUTION_DISCUSSION_CONTEXT" || c.contractVersion !== "1.0.0" || c.owner !== "RETAINED_CONTRIBUTION_LIFECYCLE"
      || c.conversationId !== input.conversationId || c.requestingTurnRef !== lastUser?.turnId || logicalDigest(c.baseProject) !== logicalDigest(base)
      || c.projectionOnly !== true || c.sourceOfTruth !== false || c.projectWriteAuthorized !== false || c.projectAdoptionAuthorized !== false
      || logicalDigest(unsigned) !== contextDigest || JSON.stringify(c).length > MAX_CONTEXT_CHARS + 100
      || !["COMPLETE", "BOUND_EXCEEDED_CONTEXT_UNAVAILABLE"].includes(c.boundary)
      || !Array.isArray(c.active) || !Array.isArray(c.history) || c.active.length + c.history.length > MAX_ELEMENTS
      || !Array.isArray(c.sources) || !Array.isArray(c.visibleOptions) || !Array.isArray(c.resolvedReferences)
      || !Array.isArray(c.historicalReferences) || !Array.isArray(c.unresolved) || !Array.isArray(c.excludedCandidateRefs)) return false;
    const sourceRefs = new Set(c.sources.map(s => s.ref));
    if (new Set(c.active.map(e => e.ref)).size !== c.active.length || sourceRefs.size !== c.sources.length || c.sources.some(s => {
      const turn = input.runtimeTurns.find(t => t.turnId === s.turnRef);
      return !turn || logicalDigest(turn.content) !== s.turnDigest || typeof s.ref !== "string" || (s.sourceText !== null && typeof s.sourceText !== "string") || !Array.isArray(s.evidenceRefs);
    })) return false;
    const validEntry = (e: DiscussionElement) => typeof e.ref === "string" && typeof e.content === "string" && e.content.length > 0
      && typeof e.candidateRef === "string" && typeof e.nativeRef === "string" && typeof e.scientificType === "string"
      && ["OBJECT", "RELATION", "TEMPORAL_QUALIFICATION", "EXPECTED_VARIABLE_OCCASION"].includes(e.kind)
      && ["PROPOSED_NOT_ADOPTED", "CORRECTED", "OPEN_UNKNOWN"].includes(e.status)
      && Array.isArray(e.sourceRefs) && e.sourceRefs.length > 0 && e.sourceRefs.every(r => sourceRefs.has(r)) && Array.isArray(e.linkedRefs);
    return c.active.every(validEntry) && c.history.every(h => ["REJECTED", "SUPERSEDED"].includes(h.status) && validEntry(h.element))
      && c.visibleOptions.every(o => o.status === "PROPOSED_NOT_ADOPTED" && sourceRefs.has(o.sourceRef))
      && c.resolvedReferences.every(r => r.status === "PROPOSED_NOT_ADOPTED" && sourceRefs.has(r.sourceRef))
      && c.unresolved.every(r => r.status === "OPEN_UNKNOWN" && sourceRefs.has(r.sourceRef))
      && c.historicalReferences.every(r => ["REJECTED", "SUPERSEDED"].includes(r.status) && sourceRefs.has(r.requestingSourceRef));
  } catch { return false; }
};

/** Separate current science from closed history. Rejected scientific wording
 * never goes to the provider unless the user explicitly asks to revisit it. */
export const scientificDiscussionProviderContext = (context: ScientificDiscussionContext) => {
  const sourceRefs = new Set([...context.active.flatMap(e => e.sourceRefs), ...context.visibleOptions.map(o => o.sourceRef), ...context.resolvedReferences.map(r => r.sourceRef), ...context.unresolved.map(r => r.sourceRef), ...context.historicalReferences.map(r => r.requestingSourceRef)]);
  const rejectedSourceRefs = new Set(context.history.filter(h => h.status === "REJECTED").flatMap(h => h.element.sourceRefs));
  // Coalesce strictly identical displayed content, never scientific identities.
  // All distinct native refs, graph links and provenance remain occurrences.
  const groups = new Map<string, DiscussionElement & { otherOccurrences: Pick<DiscussionElement, "ref" | "nativeRef" | "candidateRef" | "sourceRefs" | "linkedRefs">[] }>();
  for (const e of context.active) {
    const { ref, nativeRef, candidateRef, sourceRefs: refs, linkedRefs, ...content } = e;
    const key = logicalDigest(content);
    const previous = groups.get(key);
    if (previous) previous.otherOccurrences.push({ ref, nativeRef, candidateRef, sourceRefs: refs, linkedRefs });
    else groups.set(key, { ...e, otherOccurrences: [] });
  }
  const { contextDigest: sourceContextDigest, ...sourceContext } = context;
  const projection = { ...sourceContext, contract: "RETAINED_CONTRIBUTION_DISCUSSION_PROVIDER_PROJECTION" as const, sourceContextDigest,
    active: [...groups.values()], history: context.history.map(h => ({ elementRef: h.element.ref, status: h.status, reasonSourceRef: h.reasonSourceRef })),
    sources: context.sources.filter(s => sourceRefs.has(s.ref)).map(s => rejectedSourceRefs.has(s.ref)
      ? { ...s, sourceText: null, sourceTextOmissionReason: "SOURCE_SHARED_WITH_REJECTED_CONTENT_REFERENCES_ONLY" } : s),
    authority: "Le Project adopté demeure la seule vérité adoptée. Les éléments discutés et corrigés ne sont pas adoptés. Les refs discussion/nativeRef ne sont pas des identifiants Project utilisables pour REPLACE/REMOVE. Les sources antérieures sont des référents, jamais des ancrages du dernier message. Conserver les rôles et relations explicites ; une correction locale ne transforme pas une comparaison secondaire ou une référence en modèle central. OPEN_UNKNOWN et deferred ne constituent pas un nouvel ordre de relance." };
  return { ...projection, contextDigest: logicalDigest(projection) };
};
