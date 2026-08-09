import { comparableScientificText, logicalDigest, uniqueSorted } from "./canonical";
import type { KnowledgeContextPackage, KnowledgeRequest, PrivacyClass } from "./types";

const PATIENT_LEVEL = /\b(j['’]?ai|mon|ma|mes|chez moi|pour moi|mon examen|mon t[12]|ma valeur)\b/i;
const DIRECT_IDENTIFIER = /(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}\b)/i;

export const classifySensitivity = (question: string): PrivacyClass => {
  if (DIRECT_IDENTIFIER.test(question) || PATIENT_LEVEL.test(question)) return "RESTRICTED_PERSONAL";
  return "PUBLIC";
};

export const isPatientLevelExpression = (question: string) => PATIENT_LEVEL.test(comparableScientificText(question));

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

