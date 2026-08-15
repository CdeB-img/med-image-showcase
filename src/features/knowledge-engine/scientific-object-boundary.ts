import { normalizeScientificText } from "./canonical.js";

export const SCIENTIFIC_OBJECT_ORIGINAL_TERM_MAX_LENGTH = 200;
export const KNOWLEDGE_RELATION_MAX_LENGTH = 200;

export type ScientificObjectTermRole = "SUBJECT" | "COMPARATOR" | "CONTEXT" | "UNKNOWN";

export type ScientificObjectTermCandidate = {
  term: string;
  role?: ScientificObjectTermRole;
  sourceText?: string | null;
  sourceRef?: string | null;
  payloadRef?: string | null;
};

export type ScientificObjectBoundaryDiagnostic = {
  code: "SCIENTIFIC_OBJECT_ORIGINAL_TERM_TOO_LONG" | "KNOWLEDGE_RELATION_TOO_LONG" | "KNOWLEDGE_REQUEST_SCHEMA_INVALID" | "KNOWLEDGE_EXECUTION_FAILURE";
  message: string;
  path: Array<string | number>;
  owner: "KNOWLEDGE";
  payloadRef: string | null;
  sourceRef: string | null;
  receivedLength: number | null;
  originalValue: string | null;
  projectWriteAuthorized: false;
  recoverable: true;
};

export type PreparedScientificObjectTerms = {
  accepted: Array<{ term: string; role: ScientificObjectTermRole }>;
  diagnostics: ScientificObjectBoundaryDiagnostic[];
};

const groundedAtomicSource = (originalQuestion: string, sourceText: string | null | undefined) => {
  if (!sourceText || !originalQuestion.includes(sourceText)) return null;
  const normalized = normalizeScientificText(sourceText);
  return normalized && normalized.length <= SCIENTIFIC_OBJECT_ORIGINAL_TERM_MAX_LENGTH ? normalized : null;
};

/**
 * `originalTerm` is the bounded atomic surface form used for Knowledge lookup.
 * It is not the free scientific statement and it is not the verbatim provenance.
 */
export const prepareScientificObjectTerms = (input: {
  originalQuestion: string;
  candidates: ScientificObjectTermCandidate[];
  payloadRef?: string | null;
}): PreparedScientificObjectTerms => {
  const accepted: PreparedScientificObjectTerms["accepted"] = [];
  const diagnostics: ScientificObjectBoundaryDiagnostic[] = [];

  input.candidates.forEach((candidate, index) => {
    const originalTerm = normalizeScientificText(candidate.term);
    if (!originalTerm) return;
    if (originalTerm.length <= SCIENTIFIC_OBJECT_ORIGINAL_TERM_MAX_LENGTH) {
      accepted.push({ term: originalTerm, role: candidate.role ?? "UNKNOWN" });
      return;
    }

    const sourceTerm = groundedAtomicSource(input.originalQuestion, candidate.sourceText);
    if (sourceTerm) {
      accepted.push({ term: sourceTerm, role: candidate.role ?? "UNKNOWN" });
      return;
    }

    diagnostics.push({
      code: "SCIENTIFIC_OBJECT_ORIGINAL_TERM_TOO_LONG",
      message: "Le contenu scientifique libre ne peut pas devenir un originalTerm atomique sans source textuelle fiable.",
      path: ["scientificObjects", index, "originalTerm"],
      owner: "KNOWLEDGE",
      payloadRef: candidate.payloadRef ?? input.payloadRef ?? null,
      sourceRef: candidate.sourceRef ?? null,
      receivedLength: originalTerm.length,
      originalValue: originalTerm,
      projectWriteAuthorized: false,
      recoverable: true,
    });
  });

  return { accepted, diagnostics };
};

export const prepareKnowledgeRelations = (input: {
  relations: string[];
  payloadRef?: string | null;
}): { accepted: string[]; diagnostics: ScientificObjectBoundaryDiagnostic[] } => {
  const accepted: string[] = [];
  const diagnostics: ScientificObjectBoundaryDiagnostic[] = [];
  input.relations.forEach((relation, index) => {
    const normalized = normalizeScientificText(relation);
    if (!normalized) return;
    if (normalized.length <= KNOWLEDGE_RELATION_MAX_LENGTH) {
      accepted.push(normalized);
      return;
    }
    diagnostics.push({
      code: "KNOWLEDGE_RELATION_TOO_LONG",
      message: "Une relation libre trop longue reste dans la trace et ne devient pas une relation Knowledge atomique.",
      path: ["relations", index],
      owner: "KNOWLEDGE",
      payloadRef: input.payloadRef ?? null,
      sourceRef: null,
      receivedLength: normalized.length,
      originalValue: normalized,
      projectWriteAuthorized: false,
      recoverable: true,
    });
  });
  return { accepted, diagnostics };
};
