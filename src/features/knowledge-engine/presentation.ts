import { ZodError } from "zod";
import { executeKnowledgeEngine, type ExecuteKnowledgeInput } from "./engine.js";
import {
  prepareScientificObjectTerms,
  prepareKnowledgeRelations,
  type ScientificObjectBoundaryDiagnostic,
  type ScientificObjectTermCandidate,
} from "./scientific-object-boundary.js";
import type { KnowledgeResult } from "./types.js";

export type KnowledgePresentationExecutionInput = Omit<ExecuteKnowledgeInput, "scientificObjectTerms"> & {
  scientificObjectTerms?: ScientificObjectTermCandidate[];
  payloadRef?: string | null;
};

export type KnowledgePresentationExecution = {
  status: "SUCCESS" | "PARTIAL" | "FAILURE";
  result: KnowledgeResult | null;
  diagnostics: ScientificObjectBoundaryDiagnostic[];
  preservedRawUserText: string;
};

const diagnosticFromError = (
  error: unknown,
  input: KnowledgePresentationExecutionInput,
): ScientificObjectBoundaryDiagnostic => {
  const issue = error instanceof ZodError ? error.issues[0] : null;
  return {
    code: issue ? "KNOWLEDGE_REQUEST_SCHEMA_INVALID" : "KNOWLEDGE_EXECUTION_FAILURE",
    message: issue?.message ?? (error instanceof Error ? error.message : "KNOWLEDGE_EXECUTION_FAILURE"),
    path: issue?.path ?? [],
    owner: "KNOWLEDGE",
    payloadRef: input.payloadRef ?? null,
    sourceRef: null,
    receivedLength: null,
    originalValue: null,
    projectWriteAuthorized: false,
    recoverable: true,
  };
};

/** Strict engine validation is retained; presentation receives a non-throwing result. */
export const executeKnowledgeEngineForPresentation = (
  input: KnowledgePresentationExecutionInput,
): KnowledgePresentationExecution => {
  const prepared = prepareScientificObjectTerms({
    originalQuestion: input.originalQuestion,
    candidates: input.scientificObjectTerms ?? [],
    payloadRef: input.payloadRef,
  });
  const preparedRelations = prepareKnowledgeRelations({ relations: input.relations ?? [], payloadRef: input.payloadRef });
  const boundaryDiagnostics = [...prepared.diagnostics, ...preparedRelations.diagnostics];
  try {
    const result = executeKnowledgeEngine({
      ...input,
      scientificObjectTerms: prepared.accepted,
      relations: preparedRelations.accepted,
    });
    return {
      status: boundaryDiagnostics.length ? "PARTIAL" : "SUCCESS",
      result,
      diagnostics: boundaryDiagnostics,
      preservedRawUserText: input.originalQuestion,
    };
  } catch (error) {
    return {
      status: "FAILURE",
      result: null,
      diagnostics: [...boundaryDiagnostics, diagnosticFromError(error, input)],
      preservedRawUserText: input.originalQuestion,
    };
  }
};
