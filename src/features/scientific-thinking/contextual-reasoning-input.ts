import { executeKnowledgeEngine, prepareKnowledgeEngineRequest } from "../knowledge-engine/engine.js";
import { extractScientificObjectTerms } from "../knowledge-engine/concept-resolver.js";
import { projectScientificContributionToV1IfAllowed } from "../scientific-interpretation/v1-compatibility.js";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationTurn } from "../scientific-interpretation/contracts.js";
import { buildImagingDesignInput } from "../imaging-study-designer/input.js";
import { executeImagingStudyDesigner } from "../imaging-study-designer/engine.js";
import { buildScientificThinkingInput } from "./input.js";
import { buildContextualReasoningRequest } from "./contextual-reasoning.js";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import { ensureCanonicalProjectState } from "../research-project-construction/canonical-project-backbone.js";
import type { ProductBridgeRequest } from "../protocol-designer/product-bridge.js";
import { studioScientificRoute } from "./studio-runtime.js";

/** Validate the Knowledge input already fixed by a Working Draft checkpoint, before a paid dispatch. */
export const preflightWorkingDraftKnowledgeSource = (request: Pick<ProductBridgeRequest,
  "conversation" | "currentProject" | "workingDraftScientificSource" | "studioPreparationSource">) => {
  const source = request.workingDraftScientificSource;
  const turns = request.conversation.turns;
  let content: string;
  let createdAt: string;
  if (source?.kind === "BOUND_USER_TURN") {
    const sourceIndex = turns.findIndex(turn => turn.turnId === source.sourceUserTurnId && turn.role === "USER");
    const responseIndex = turns.findIndex(turn => turn.turnId === source.sourceResponseTurnId && turn.role === "NOXIA");
    if (sourceIndex < 0 || responseIndex <= sourceIndex
      || turns.some((turn, index) => index > sourceIndex && index < responseIndex && turn.role === "USER"))
      throw new Error("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
    const turn = turns[sourceIndex]!;
    content = turn.content; createdAt = turn.createdAt;
  } else if (source?.kind === "CURRENT_PROJECT_QUESTION") {
    const project = request.currentProject;
    if (!project || project.projectId !== source.projectId || project.versionId !== source.versionId
      || project.projectDigest !== source.projectDigest) throw new Error("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
    const questions = ensureCanonicalProjectState(project).objects.filter(object =>
      object.actuality === "CURRENT" && object.objectType === "SCIENTIFIC_QUESTION"
      && object.objectVersionId === source.objectVersionId);
    if (questions.length !== 1) throw new Error("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
    content = questions[0]!.content; createdAt = questions[0]!.adoptedAt;
  } else if (source?.kind === "NATIVE_STUDIO_CONTRIBUTION") {
    const studio = request.studioPreparationSource;
    if (!studio || !request.currentProject || source.requestDigest !== studio.request.requestDigest
      || source.assessmentRef !== studio.assessment.resultId) throw new Error("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
    const route = studioScientificRoute(studio, request.currentProject);
    if (!route.workingDraftRequired) throw new Error("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
    content = route.edits.map(edit => edit.afterText).join("\n"); createdAt = studio.assessment.completedAt;
  } else throw new Error("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
  if (logicalDigest(content) !== source.sourceDigest) throw new Error("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
  try {
    prepareKnowledgeEngineRequest({ originalQuestion: content,
      scientificObjectTerms: extractScientificObjectTerms([...(source.kind === "NATIVE_STUDIO_CONTRIBUTION" ? [content] : []), ...turns.filter(turn => turn.role === "USER")
        .map(turn => turn.content)].join("\n")), createdAt });
  } catch {
    throw new Error("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
  }
  return { source, content, createdAt };
};

/** Read-only existing owner inputs; no second semantic extractor or clinical map. */
export const prepareStandardContextualReasoningRequest = (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  turns: readonly ScientificInterpretationTurn[];
  sessionId: string;
  candidateRecomputation?: boolean;
  workingDraftKnowledgeSource?: ReturnType<typeof preflightWorkingDraftKnowledgeSource>;
  nativeStudioSource?: import("./studio-runtime.js").StudioPreparationProvenance;
}) => {
  const projection = projectScientificContributionToV1IfAllowed(input.contribution).projection;
  if (!projection) return null;
  // Request the scientific competence only for a typed scientific intention;
  // an isolated administrative visit/occurrence receipt keeps its existing path.
  const scientificTypes = new Set(["SCIENTIFIC_INTENT", "SCIENTIFIC_QUESTION", "OBJECTIVE", "HYPOTHESIS", "PHENOMENON",
    "SCIENTIFIC_OBJECT", "CONDITION", "CLINICAL_CONDITION", "POPULATION", "IMAGING_MODALITY", "IMAGING_METHOD", "EXPOSURE"]);
  if (!input.candidateRecomputation && !input.contribution.scientificContent.candidateObjects.some(item => scientificTypes.has(item.proposedType))) return null;
  const latest = [...input.turns].reverse().find(t => t.role === "USER");
  if (!input.nativeStudioSource && (!latest || input.contribution.source.originalRequest !== latest.content)) throw new Error("ST_CONTEXT_INPUT_NOT_CURRENT");
  const { validatedIntent: intent, scientificSessionContext: context } = projection;
  const visibleUsers = [...input.turns.filter(t => t.role === "USER").map(t => t.content),
    ...input.nativeStudioSource?.edits.map(edit => edit.afterText) ?? []].join("\n");
  const knowledgeSource = input.workingDraftKnowledgeSource ?? { content: latest!.content, createdAt: latest!.createdAt };
  const knowledge = executeKnowledgeEngine({ originalQuestion: knowledgeSource.content,
    scientificObjectTerms: extractScientificObjectTerms(visibleUsers), createdAt: knowledgeSource.createdAt });
  const scientificIntent = { ...intent, originalQuestion: knowledgeSource.content };
  const scientificInput = buildScientificThinkingInput(scientificIntent, context.preservedScientificTerms, context.detectedRelationships, knowledge,
    { sessionId: input.sessionId, contextVersion: context.contextVersion });
  const conversationInput = buildScientificThinkingInput({ ...intent, originalQuestion: visibleUsers },
    context.preservedScientificTerms, context.detectedRelationships, knowledge, { sessionId: input.sessionId });
  const methods = [...new Set([...scientificInput.methodsMentioned, ...conversationInput.methodsMentioned])];
  const imagingInput = methods.length ? buildImagingDesignInput(scientificIntent, context.preservedScientificTerms,
    context.detectedRelationships, knowledge, null, { sessionId: input.sessionId, contextVersion: context.contextVersion }) : null;
  if (imagingInput) imagingInput.methodPreferences = [...new Set([...imagingInput.methodPreferences, ...methods])];
  const imaging = imagingInput ? { input: imagingInput, result: executeImagingStudyDesigner(imagingInput) } : null;
  const request = buildContextualReasoningRequest({ sourceTurnRef: input.nativeStudioSource?.requestId ?? latest!.turnId,
    sourceText: input.nativeStudioSource ? input.contribution.source.originalRequest : latest!.content,
    turns: input.turns, project: input.nativeStudioSource ? { projectId: input.nativeStudioSource.currentProject.projectId,
      versionId: input.nativeStudioSource.currentProject.projectVersion, projectDigest: input.nativeStudioSource.currentProject.projectDigest } : null,
    ...(input.nativeStudioSource ? { nativeStudioSource: input.nativeStudioSource } : {}),
    explicitRefs: input.contribution.scientificContent.candidateObjects.map(i => i.itemId), knowledge, imaging });
  return { request, scientificInput };
};
