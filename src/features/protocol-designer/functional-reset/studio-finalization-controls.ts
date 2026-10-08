import { logicalDigest } from "../../knowledge-engine/canonical.js";
import { studioIntentDecisionScope, type StudioFinalizationIntent } from "../../document-projection/studio-finalization-intent.js";
import type { FunctionalResetSession } from "./session.js";

/** Native owner evidence only. An unbound control is not proof of irrelevance;
 * its presence is also not corruption of the immutable scientific receipt. */
export const studioIntentPostCutoffControl = (intent: StudioFinalizationIntent, session: FunctionalResetSession): {
  disposition: "NONE" | "UNRELATED" | "MATERIAL" | "UNKNOWN"; controlRef: string | null;
} => {
  const cp = intent.resolution.preparation?.checkpoint;
  const marker = session.workingDraftPreparations?.find(p => p.checkpoint?.preparationId === cp?.preparationId)?.postCutoffBlocker;
  if (!marker) return { disposition: "NONE", controlRef: null };
  const turnRef = marker.startsWith("REFUSAL_OR_CORRECTION:") ? marker.slice("REFUSAL_OR_CORRECTION:".length) : marker;
  const turn = session.runtimeTurns.find(t => t.turnId === turnRef && t.role === "USER");
  const retention = session.scientificDiscussionRetention;
  const source = retention?.sourceCoverage.find(item => item.turnRef === turnRef && turn && item.sourceDigest === logicalDigest(turn.content));
  const scope = intent.resolution.preparation?.result ? studioIntentDecisionScope(intent) : null;
  const frozenRefs = new Set([...(scope && !("clarification" in scope) ? scope.sources.map(item => item.ref) : []),
    ...(scope && !("clarification" in scope) ? scope.atoms.flatMap(atom => atom.userChangeRefs ?? []) : [])]);
  if (retention?.elements.some(element => element.dispositionSourceRef === turnRef && frozenRefs.has(element.ref)
    && ["SUPERSEDED", "REJECTED"].includes(element.status))) return { disposition: "MATERIAL", controlRef: turnRef };
  if (source?.coverage === "COMPLETE" && ["NO_SCIENTIFIC_MEANING", "PRESENTATION_ONLY"].includes(source.nonPersistentReason ?? "")
    && source.elementRefs.length === 0 && !retention?.elements.some(element => element.sourceTurnRef === turnRef))
    return { disposition: "UNRELATED", controlRef: turnRef };
  return { disposition: "UNKNOWN", controlRef: turnRef };
};
