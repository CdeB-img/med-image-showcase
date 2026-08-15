import { computeNavigationMemoryDigest, computeQuestionResponseDigest, computeSelectedActionDigest } from "./lifecycle-canonical";
import type { NavigationLifecycleValidationResult, QueryNavigationMemory, QuestionPresentationRequest, QuestionResponseEnvelope, SelectedNavigationAction } from "./lifecycle-contracts";
import { replayQueryNavigationLifecycle } from "./lifecycle";

export const validateSelectedNavigationAction = (action: SelectedNavigationAction): NavigationLifecycleValidationResult => {
  const errors: NavigationLifecycleValidationResult["errors"] = [];
  if (action.projectWriteAuthorized || action.autoExecutionAuthorized || action.sourceOfTruth) errors.push({ code: "QRY_ACTION_BOUNDARY_VIOLATION", path: "action", message: "Selected action remains non-executing and read-only." });
  if (!action.projectRef || !action.projectVersion || !action.sourceStateDigest) errors.push({ code: "QRY_ACTION_SOURCE_IDENTITY_REQUIRED", path: "action.projectRef", message: "Project identity, version and source digest are required." });
  if (action.digest !== computeSelectedActionDigest(action)) errors.push({ code: "QRY_ACTION_DIGEST_MISMATCH", path: "action.digest", message: "Selected action digest is not reconstructible." });
  return { valid: errors.length === 0, errors };
};

export const validateQuestionPresentationRequest = (request: QuestionPresentationRequest): NavigationLifecycleValidationResult => {
  const errors: NavigationLifecycleValidationResult["errors"] = [];
  if (request.sourceOfTruth || request.projectWriteAuthorized || !request.presentationOnly) errors.push({ code: "QRY_PRESENTATION_BOUNDARY_VIOLATION", path: "presentation", message: "Presentation is read-only." });
  if (request.wordingOwnedBy !== "PD-004") errors.push({ code: "QRY_PRESENTATION_OWNER_INVALID", path: "presentation.wordingOwnedBy", message: "PD-004 owns wording." });
  if (!request.informationNeedRefs.length) errors.push({ code: "QRY_PRESENTATION_INFORMATION_NEEDS_REQUIRED", path: "presentation.informationNeedRefs", message: "At least one information need reference is required." });
  if (!request.informationNeedRefs.includes(request.informationNeedRef)) errors.push({ code: "QRY_PRESENTATION_LEGACY_NEED_NOT_INCLUDED", path: "presentation.informationNeedRef", message: "The transitional scalar reference must be included in informationNeedRefs." });
  return { valid: errors.length === 0, errors };
};

export const validateQuestionResponseEnvelope = (response: QuestionResponseEnvelope, presentation?: QuestionPresentationRequest): NavigationLifecycleValidationResult => {
  const errors: NavigationLifecycleValidationResult["errors"] = [];
  if (response.rawResponseIsProjectTruth || response.projectWriteAuthorized) errors.push({ code: "QRY_RAW_RESPONSE_PROMOTION_FORBIDDEN", path: "response", message: "Raw response is never Project truth." });
  if (!response.actorRef || !response.actorRole) errors.push({ code: "QRY_RESPONSE_ACTOR_REQUIRED", path: "response.actorRef", message: "Response actor is required." });
  if (presentation && response.responseKind !== presentation.expectedAnswerKind) errors.push({ code: "QRY_RESPONSE_KIND_MISMATCH", path: "response.responseKind", message: "Response kind must match the presentation contract." });
  if (presentation && ["SINGLE_OPTION", "MULTIPLE_OPTIONS"].includes(response.responseKind) && !response.selectedOptionRefs.length) errors.push({ code: "QRY_RESPONSE_OPTION_REQUIRED", path: "response.selectedOptionRefs", message: "A structured option response must reference an option." });
  if (response.digest !== computeQuestionResponseDigest(response)) errors.push({ code: "QRY_RESPONSE_DIGEST_MISMATCH", path: "response.digest", message: "Response digest is not reconstructible." });
  return { valid: errors.length === 0, errors };
};

export const validateQueryNavigationMemory = (memory: QueryNavigationMemory): NavigationLifecycleValidationResult => {
  const errors: NavigationLifecycleValidationResult["errors"] = [];
  if (memory.sourceOfTruth || memory.projectWriteAuthorized) errors.push({ code: "QRY_MEMORY_BOUNDARY_VIOLATION", path: "memory", message: "Navigation memory is derived and read-only." });
  if (memory.digest !== computeNavigationMemoryDigest(memory)) errors.push({ code: "QRY_MEMORY_DIGEST_MISMATCH", path: "memory.digest", message: "Memory digest is not reconstructible." });
  if (!replayQueryNavigationLifecycle(memory).validCausalOrder) errors.push({ code: "QRY_MEMORY_CAUSAL_ORDER_INVALID", path: "memory.events", message: "Lifecycle event sequence must be contiguous." });
  return { valid: errors.length === 0, errors };
};
