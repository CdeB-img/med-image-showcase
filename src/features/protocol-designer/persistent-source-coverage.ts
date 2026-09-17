import type { PersistentProjectDeltaCandidate } from "./product-bridge.js";
import { representExplicitScientificDimensions } from "./functional-reset/pre-project-intent.js";
import { hasExplicitConversationRequestMood, requestsAssistedProposal } from "../query-navigation/conversation-proposal-request.js";
import { presentCanonicalTemporalAnchor } from "../research-project-construction/temporal-presentation.js";
import type { ScientificInterpretationFinding } from "../scientific-interpretation/contracts.js";

// Diagnostic evidence about the extraction, never a Project object or an
// epistemic/adoption decision. Unknown lexical equivalence stays unknown.
type CoverageStatus = "REPRESENTED" | "PARTIALLY_REPRESENTED" | "UNREPRESENTED"
  | "CONVERSATIONAL_OR_DISCOURSE" | "UNKNOWN";
type Evidence = { contentOnly?: boolean; comparison?: boolean; refs: string[]; sources: string[]; text: string; objectRefs: string[] };

const folded = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "")
  .toLocaleLowerCase("fr-FR").replace(/[’']/gu, " ")
  .replace(/\b([jm])\s*\+\s*(\d+)/gu, "$1$2")
  .replace(/(\d)[.,](\d)/gu, "$1decimal$2")
  .replace(/\b([jm])\s*(-?\d+)/gu, (_match, code: string, value: string) => `${code}${value.replace("-", "minus")}`)
  .replace(/%/gu, " pourcent ").replace(/≥/gu, " ge ").replace(/≤/gu, " leq ")
  .replace(/>/gu, " gt ").replace(/</gu, " lt ").replace(/=/gu, " eq ")
  .replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/gu, " ").trim();

// Function words and surface carriers only. Descriptors, logical operators,
// quantities, modalities and comparison direction are deliberately retained.
const grammar = new Set(folded("le la les l de du des d un une a au aux en et pour par sur son sa ses je nous on il elle qui que qu avec comme sera seront est sont c ce cette ces bien garde gardant acquisition score classe notamment").split(" "));
const words = (text: string) => folded(text).split(" ").filter(word => word && !grammar.has(word));
const sameWord = (a: string, b: string) => a === b || a.length > 3 && b.length > 3
  && (a === `${b}s` || b === `${a}s`);
const sourceOverlaps = (source: string, fragment: string) => {
  const a = folded(source), b = folded(fragment);
  return Boolean(a && b && (` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `)));
};
const grounding = (source: string, raw: string) => Boolean(source.trim() && folded(raw).includes(folded(source)));

const candidateEvidence = (candidate: PersistentProjectDeltaCandidate, raw: string): Evidence[] => {
  const objects = candidate.changes.filter(change => change.operation !== "REMOVE" && grounding(change.sourceText, raw));
  const byRef = new Map(objects.flatMap(change => [change.candidateRef, change.semanticIdentity]
    .filter((ref): ref is string => Boolean(ref)).map(ref => [ref, change] as const)));
  const objectEvidence = objects.map(change => ({
    refs: [change.candidateRef, ...(change.evidenceRefs ?? [])].filter((ref): ref is string => Boolean(ref)),
    contentOnly: true, sources: [change.sourceText], objectRefs: [change.candidateRef, change.semanticIdentity].filter((ref): ref is string => Boolean(ref)),
    text: `${change.polarity === "NEGATED" ? "pas sans absence " : ""}${change.content}`,
  }));
  const units: Evidence[] = [...objectEvidence];
  const relationUnits: Evidence[] = [];
  for (const relation of candidate.relations) {
    const source = byRef.get(relation.sourceObjectRef), target = byRef.get(relation.targetObjectRef);
    if (!source || !target || !grounding(relation.sourceText, raw)) continue;
    // Only the existing comparison predicate has a bounded lexical rendering
    // here. Unsupported predicates cannot discharge an unknown phrase.
    if (relation.relationType !== "COMPARES_WITH" && relation.relationType !== "COMPARED_WITH") continue;
    relationUnits.push({ comparison: true, refs: [relation.relationRef, source.candidateRef!, target.candidateRef!, ...(relation.evidenceRefs ?? [])],
      sources: [relation.sourceText], objectRefs: [relation.sourceObjectRef, relation.targetObjectRef],
      text: `${source.content} comparé comparée comparés comparer comparaison ${target.content}` });
  }
  units.push(...relationUnits);
  const labels = new Map(objects.flatMap(object => [object.candidateRef, object.semanticIdentity]
    .filter((ref): ref is string => Boolean(ref)).map(ref => [ref, object.content] as const)));
  const temporalUnits: Evidence[] = [];
  for (const value of [...candidate.temporalQualifications, ...candidate.expectedVariableOccasions]) {
    if (value.operation === "REMOVE" || !value.anchor || !grounding(value.sourceText, raw)) continue;
    if (value.anchor.offset === null && value.anchor.lowerBound === null && value.anchor.upperBound === null
      && !value.anchor.relativeEventLabel && value.anchor.reference.status !== "KNOWN") continue;
    const subjectRef = "subjectProjectRef" in value ? value.subjectProjectRef : value.variableProjectRef;
    const subject = byRef.get(subjectRef);
    if (!subject) continue; // No repaired or invented reference, including Project refs absent from this delta.
    const contextRef = "studyUnitOrGroupRef" in value ? value.studyUnitOrGroupRef : null;
    const context = contextRef ? byRef.get(contextRef) : null;
    const id = "qualificationId" in value ? value.qualificationId : value.occasionId;
    temporalUnits.push({ refs: [id, subject.candidateRef!, ...(context?.candidateRef ? [context.candidateRef] : []), ...(value.evidenceRefs ?? [])],
      sources: [value.sourceText, subject.sourceText], objectRefs: [subjectRef],
      text: `${subject.content} ${context?.content ?? ""} ${presentCanonicalTemporalAnchor(value.anchor as Parameters<typeof presentCanonicalTemporalAnchor>[0], labels).split(" —")[0]}` });
  }
  // Compose only explicit links. Unrelated objects/anchors never lend a time
  // or a comparator merely because they occur in the same paragraph.
  for (const temporal of temporalUnits) {
    units.push(temporal);
    for (const relation of relationUnits) {
      if (!temporal.objectRefs.some(ref => relation.objectRefs.includes(ref))) continue;
      units.push({ comparison: true, refs: [...relation.refs, ...temporal.refs], sources: [...relation.sources, ...temporal.sources],
        objectRefs: [...relation.objectRefs], text: `${relation.text} ${temporal.text}` });
    }
  }
  // Independent content atoms can jointly render a source enumeration, but
  // only with the exact same provenance. Source text itself supplies no words.
  const groups = new Map<string, Evidence[]>();
  for (const object of objectEvidence) {
    const key = folded(object.sources[0]!);
    groups.set(key, [...(groups.get(key) ?? []), object]);
  }
  for (const group of groups.values()) if (group.length > 1 && group.every(unit => {
    const object = byRef.get(unit.objectRefs[0]!);
    return object && ["CANONICAL_VARIABLE", "IMAGING_MODALITY"].includes(object.proposedType ?? "")
      && object.polarity === "AFFIRMED" && !/\d|\b(?:sans|pas|si|possible|inferieur|superieur)\b/u.test(folded(unit.text));
  })) units.push({
    refs: group.flatMap(unit => unit.refs), sources: group[0]!.sources,
    objectRefs: [], text: group.map(unit => unit.text).join(" "),
  });
  return units;
};

export const evaluatePersistentSourceCoverage = (input: {
  candidate: PersistentProjectDeltaCandidate; raw: string; sourceTurnRef: string;
}) => {
  const units = candidateEvidence(input.candidate, input.raw);
  return representExplicitScientificDimensions(input).map(dimension => {
    const obligations = words(dimension.sourceText);
    const interaction = hasExplicitConversationRequestMood(dimension.sourceText, folded(dimension.sourceText))
      || requestsAssistedProposal(dimension.sourceText.normalize("NFKC")
      .replace(/[\u2018\u2019\u02bc\uff07]/gu, "'").toLocaleLowerCase("fr-FR").replace(/\s+/gu, " ").trim());
    const literalOrdered = (unit: Evidence) => {
      let position = 0;
      const candidateWords = words(unit.text);
      for (const word of obligations) {
        const next = candidateWords.findIndex((candidateWord, index) => index >= position && sameWord(word, candidateWord));
        if (next < 0) return false;
        position = next + 1;
      }
      return obligations.length > 0;
    };
    const supported = units.filter(unit => (!unit.comparison || obligations.some(word => word.startsWith("compar")))
      && (unit.sources.some(source => sourceOverlaps(source, dimension.sourceText))
      // A single object can explicitly repeat a fact selected elsewhere in the
      // same turn. Require the full ordered rendering, not borrowed words from
      // unrelated spans. Compositions still require granular source overlap.
      || unit.contentOnly && literalOrdered(unit)))
      .map(unit => ({ unit, matched: obligations.filter(word => words(unit.text).some(candidateWord => sameWord(word, candidateWord))),
        missing: obligations.filter(word => !words(unit.text).some(candidateWord => sameWord(word, candidateWord))) }));
    const best = supported.sort((a, b) => b.matched.length - a.matched.length || a.unit.refs.length - b.unit.refs.length)[0];
    // An act recognized in a mixed scientific clause cannot erase scientific
    // material. A request with no candidate evidence is kept as a request.
    const conversational = interaction && !best?.matched.length;
    // A negation embedded in a request/preamble is not proof that the span is
    // a persistent constraint. Only a bare unary constraint or an explicit
    // quantity can receive the absent-rendering diagnostic without evidence.
    const explicitOperator = /\b(?:\d+|[jm]\d+)\b/u.test(folded(dimension.sourceText))
      || /^(?:pas de|sans) [\p{L}\p{N}]+$/u.test(folded(dimension.sourceText));
    const status: CoverageStatus = conversational ? "CONVERSATIONAL_OR_DISCOURSE"
      : obligations.length && best && !best.missing.length && (!best.unit.contentOnly || literalOrdered(best.unit)) ? "REPRESENTED"
        : best?.matched.length ? "PARTIALLY_REPRESENTED"
          : explicitOperator ? "UNREPRESENTED" : "UNKNOWN";
    return { ...dimension, status, evidenceRefs: [...new Set(best?.matched.length ? best.unit.refs : [])],
      evidenceText: best?.matched.length ? best.unit.text : null,
      unmatchedTerms: status === "REPRESENTED" || conversational ? [] : best && !best.missing.length
        ? ["ORDERED_RECONSTRUCTION_NOT_PROVEN"] : best?.missing ?? obligations,
      recognizedConversationAct: conversational ? "EXISTING_REQUEST_RECOGNITION" : null };
  });
};

export const sourceCoverageFindings = (coverage: ReturnType<typeof evaluatePersistentSourceCoverage>): ScientificInterpretationFinding[] =>
  coverage.map(span => ({ findingId: `${span.dimensionRef}:coverage`, code: `SOURCE_COVERAGE_${span.status}`,
    severity: span.status === "REPRESENTED" || span.status === "CONVERSATIONAL_OR_DISCOURSE" ? "INFO" : "WARNING",
    status: span.status === "REPRESENTED" || span.status === "CONVERSATIONAL_OR_DISCOURSE" ? "RESOLVED" : "OPEN",
    message: span.status === "PARTIALLY_REPRESENTED" ? `Représentation partielle du passage : « ${span.sourceText} »`
      : span.status === "UNREPRESENTED" ? `Passage non représenté dans la proposition : « ${span.sourceText} »`
        : span.status === "UNKNOWN" ? `Couverture du passage non déterminée : « ${span.sourceText} »`
          : `« ${span.sourceText} »`,
    sourceRefs: [span.dimensionRef, span.sourceTurnRef, ...span.evidenceRefs],
  }));
