import { executeKnowledgeEngine } from "../knowledge-engine/engine.js";
import { extractScientificObjectTerms } from "../knowledge-engine/concept-resolver.js";
import { projectScientificContributionToV1IfAllowed } from "../scientific-interpretation/v1-compatibility.js";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationTurn } from "../scientific-interpretation/contracts.js";
import { buildImagingDesignInput } from "../imaging-study-designer/input.js";
import { executeImagingStudyDesigner } from "../imaging-study-designer/engine.js";
import { buildScientificThinkingInput } from "./input.js";
import { buildContextualReasoningRequest } from "./contextual-reasoning.js";

/** Read-only existing owner inputs; no second semantic extractor or clinical map. */
export const prepareStandardContextualReasoningRequest = (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  turns: readonly ScientificInterpretationTurn[];
  sessionId: string;
}) => {
  const projection = projectScientificContributionToV1IfAllowed(input.contribution).projection;
  if (!projection) return null;
  // Request the scientific competence only for a typed scientific intention;
  // an isolated administrative visit/occurrence receipt keeps its existing path.
  const scientificTypes = new Set(["SCIENTIFIC_INTENT", "SCIENTIFIC_QUESTION", "OBJECTIVE", "HYPOTHESIS", "PHENOMENON",
    "SCIENTIFIC_OBJECT", "CONDITION", "CLINICAL_CONDITION", "POPULATION", "IMAGING_MODALITY", "IMAGING_METHOD", "EXPOSURE"]);
  if (!input.contribution.scientificContent.candidateObjects.some(item => scientificTypes.has(item.proposedType))) return null;
  const latest = [...input.turns].reverse().find(t => t.role === "USER");
  if (!latest || input.contribution.source.originalRequest !== latest.content) throw new Error("ST_CONTEXT_INPUT_NOT_CURRENT");
  const { validatedIntent: intent, scientificSessionContext: context } = projection;
  const visibleUsers = input.turns.filter(t => t.role === "USER").map(t => t.content).join("\n");
  const knowledge = executeKnowledgeEngine({ originalQuestion: latest.content,
    scientificObjectTerms: extractScientificObjectTerms(visibleUsers), createdAt: latest.createdAt });
  const scientificInput = buildScientificThinkingInput(intent, context.preservedScientificTerms, context.detectedRelationships, knowledge,
    { sessionId: input.sessionId, contextVersion: context.contextVersion });
  const conversationInput = buildScientificThinkingInput({ ...intent, originalQuestion: visibleUsers },
    context.preservedScientificTerms, context.detectedRelationships, knowledge, { sessionId: input.sessionId });
  const methods = [...new Set([...scientificInput.methodsMentioned, ...conversationInput.methodsMentioned])];
  const imagingInput = methods.length ? buildImagingDesignInput(intent, context.preservedScientificTerms,
    context.detectedRelationships, knowledge, null, { sessionId: input.sessionId, contextVersion: context.contextVersion }) : null;
  if (imagingInput) imagingInput.methodPreferences = [...new Set([...imagingInput.methodPreferences, ...methods])];
  const imaging = imagingInput ? { input: imagingInput, result: executeImagingStudyDesigner(imagingInput) } : null;
  const request = buildContextualReasoningRequest({ sourceTurnRef: latest.turnId, sourceText: latest.content,
    turns: input.turns, project: null, explicitRefs: input.contribution.scientificContent.candidateObjects.map(i => i.itemId), knowledge, imaging });
  return { request, scientificInput };
};
