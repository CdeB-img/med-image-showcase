import { comparableScientificText, logicalDigest, uniqueSorted } from "./canonical";
import type { KnowledgeContextPackage, KnowledgeRequest, PrivacyClass } from "./types";

const PATIENT_LEVEL = /\b(j['’]?ai|mon|ma|mes|chez moi|pour moi|mon examen|mon t[12]|ma valeur)\b/i;
const DIRECT_IDENTIFIER = /(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}\b|\b[12]\s?\d{2}\s?(?:0\d|1[0-2])\s?(?:\d{2}|2A|2B)\s?\d{3}\s?\d{3}\s?\d{2}\b|\b(?:patient|dossier|ipp|id\s*patient|mrn)\s*(?:n[°o]|num[ée]ro|id)?\s*[:#-]?\s*[A-Z0-9-]{4,}\b|\b(?:n[ée]e?\s+le|date\s+de\s+naissance|dob)\s*[:：]?\s*\d{1,2}[/. -]\d{1,2}[/. -]\d{2,4}\b)/i;
const SECRET = /(?:\b(?:api[_ -]?key|access[_ -]?token|secret|bearer)\s*[:=]\s*\S+|\bsk-[A-Za-z0-9_-]{12,})/i;

export const classifySensitivity = (question: string): PrivacyClass => {
  if (DIRECT_IDENTIFIER.test(question) || PATIENT_LEVEL.test(question)) return "RESTRICTED_PERSONAL";
  return "PUBLIC";
};

export const isPatientLevelExpression = (question: string) => PATIENT_LEVEL.test(comparableScientificText(question));
export const hasDirectIdentifier = (text: string) => DIRECT_IDENTIFIER.test(text);
export const canPersistKnowledgeQuestion = (question: string) => !isPatientLevelExpression(question) && !hasDirectIdentifier(question) && !SECRET.test(question);

export const minimizeKnowledgeContext = (request: Pick<KnowledgeRequest, "scientificObjects" | "relations" | "context" | "sensitivityClassification">) => {
  const allowedDimensions = request.context.dimensions.filter((dimension) => dimension.state !== "WITHHELD").map((dimension) => ({
    name: dimension.name,
    values: dimension.values,
    state: dimension.state,
  }));
  const payload = {
    scientificObjectIds: uniqueSorted(request.scientificObjects.map((item) => item.objectId)),
    relations: uniqueSorted(request.relations),
    context: allowedDimensions,
    sensitivityClassification: request.sensitivityClassification,
  };
  return {
    payload,
    transmittedFields: ["scientificObjectIds", "relations", "context", "sensitivityClassification"],
    redactedFields: ["originalQuestion", "researchProjectId", "strategyVersion", "freeTextHistory", "patientIdentifiers", "projectDocument"],
    digest: logicalDigest(payload),
  };
};

export const assertExternalTransmissionAllowed = (privacyClass: PrivacyClass) => privacyClass !== "RESTRICTED_PERSONAL" && privacyClass !== "CONFIDENTIAL_PROJECT";

export const privacyContextStatus = (context: KnowledgeContextPackage) => context.dimensions.some((item) => item.state === "WITHHELD") ? "PARTIAL" : context.status;
