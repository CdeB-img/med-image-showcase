import { comparableScientificText, logicalDigest, uniqueSorted } from "./canonical.js";
import type { KnowledgeContextPackage, KnowledgeRequest, PrivacyClass } from "./types.js";

// A possessive marks ownership, not a patient: bind it to a personal referent.
// These are sensitive referent classes, never exceptions for research wording.
const CLINICAL_REFERENT = [
  "(?:examen|bilan|traitement|tension|pression|poids)(?:s)?(?=\\s*(?:$|[.,;:!?]|(?:est|sont|a|ont|montre|montrent|reste|restent|monte|descend)\\b))",
  "(?:examen|bilan|traitement)(?:s)?\\s+(?:medica(?:l(?:e)?s?|ux)|clinique(?:s)?|habituel(?:le)?s?)",
  "(?:pression|tension)\\s+arterielle", "diagnostic(?:s)?", "biomarqueur(?:s)?",
  "t[12]", "ecv", "fevg", "irm", "scanner(?:s)?", "radiographie(?:s)?", "echographie(?:s)?",
  "symptome(?:s)?", "douleur(?:s)?", "fatigue", "sommeil", "glycemie", "sante",
  "maladie(?:s)?", "pathologie(?:s)?", "medicament(?:s)?", "antecedent(?:s)?", "grossesse(?:s)?",
  "toux", "fievre", "nausee(?:s)?", "vomissement(?:s)?", "vertige(?:s)?", "essoufflement", "saignement(?:s)?",
  "cancer", "tumeur(?:s)?", "diabete", "hypertension", "infarctus", "allergie(?:s)?", "infection(?:s)?", "insomnie", "anxiete", "depression",
  "corps", "coeur", "sang", "rein(?:s)?", "poumon(?:s)?",
].join("|");
const QUALIFIED_PERSONAL_DATA = `(?:resultat|valeur|mesure|donnee|information|dossier|compte[ -]rendu|score)(?:s)?\\s+(?:personnel(?:le)?s?|prive(?:e)?s?|medica(?:l(?:e)?s?|ux)|(?:clinique|biologique|bancaire)s?|(?:(?:de|du|en)\\s+|d')?(?:${CLINICAL_REFERENT}))`;
const PRIVATE_REFERENT = [
  "age", "coordonnee(?:s)?", "identite", "nom", "prenom", "adresse(?:s)?", "telephone", "courriel", "email",
  "revenu(?:s)?", "salaire", "compte(?:s)?[ -]bancaire(?:s)?", "vie[ -]privee", "situation[ -]familiale",
  "mere", "pere", "parent(?:s)?", "enfant(?:s)?", "fils", "fille(?:s)?", "frere(?:s)?", "soeur(?:s)?", "conjoint(?:e|s|es)?", "epoux", "epouse", "patient(?:e|s|es)?",
].join("|");
const PERSONAL_MODIFIER = "(?:(?:propre(?:s)?|dernier(?:e|s|es)?|premier(?:e|s|es)?|nouveau(?:x)?|nouvelle(?:s)?|ancien(?:ne|s|nes)?|recent(?:e|s|es)?)\\s+){0,2}";
const OWNED_PERSONAL_REFERENT = new RegExp(`\\b(?:mon|ma|mes)\\s+${PERSONAL_MODIFIER}(?:${CLINICAL_REFERENT}|${QUALIFIED_PERSONAL_DATA}|${PRIVATE_REFERENT})\\b`, "i");
const EXPERIENCED_DETERMINERS = "(?:(?:eu|un|une|des|du|de|le|la|les|plusieurs|quelques|beaucoup|souvent|parfois|encore|toujours|pas|aucun|aucune|forte?s?)\\s+|(?:d|l)'){0,6}";
const PERSONAL_CLINICAL_EXPERIENCE = new RegExp(`\\b(?:j'ai|je\\s+(?:presente|ressens))\\s+${EXPERIENCED_DETERMINERS}${PERSONAL_MODIFIER}(?:${CLINICAL_REFERENT}|${QUALIFIED_PERSONAL_DATA})\\b|\\bj'ai\\s+\\d{1,3}\\s+ans\\b|\\bj'ai\\s+mal(?:\\s+(?:au|aux|a|dans|depuis|partout)\\b|\\s*[,.;!?]|\\s*$)`, "i");
const PERSONAL_HEALTH_STATE = /\bje\s+(?:ne\s+)?(?:souffre|saigne|vomis|tousse|suis\s+(?:malade|enceinte|diabetique|hypertendu(?:e)?|hospitalise(?:e)?))\b/i;
const PERSONAL_VALUE_CONTEXT = new RegExp(`\\b(?:chez moi|pour moi)\\s*,?\\s*(?:(?:le|la|les|mon|ma|mes)\\s+|l')?(?:${CLINICAL_REFERENT})\\b|\\b(?:${CLINICAL_REFERENT}|${QUALIFIED_PERSONAL_DATA}|valeur)(?:\\s+(?:eleve(?:e|s|es)?|bas(?:se|ses)?|anormal(?:e|es)?|normal(?:e|es)?)){0,2}\\s+(?:chez moi|pour moi)\\b`, "i");
const DIRECT_IDENTIFIER = /(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}\b|\b[12]\s?\d{2}\s?(?:0\d|1[0-2])\s?(?:\d{2}|2A|2B)\s?\d{3}\s?\d{3}\s?\d{2}\b|\b(?:patient|dossier|ipp|id\s*patient|mrn)\s*(?:n[°o]|num[ée]ro|id)?\s*[:#-]?\s*[A-Z0-9-]{4,}\b|\b(?:n[ée]e?\s+le|date\s+de\s+naissance|dob)\s*[:：]?\s*\d{1,2}[/. -]\d{1,2}[/. -]\d{2,4}\b)/i;
const SECRET = /(?:\b(?:api[_ -]?key|access[_ -]?token|secret|bearer)\s*[:=]\s*\S+|\bsk-[A-Za-z0-9_-]{12,})/i;

export const classifySensitivity = (question: string): PrivacyClass => {
  if (DIRECT_IDENTIFIER.test(question) || isPatientLevelExpression(question)) return "RESTRICTED_PERSONAL";
  return "PUBLIC";
};

export const isPatientLevelExpression = (question: string) => {
  const normalized = comparableScientificText(question).normalize("NFD").replace(/\p{M}/gu, "");
  return OWNED_PERSONAL_REFERENT.test(normalized) || PERSONAL_CLINICAL_EXPERIENCE.test(normalized)
    || PERSONAL_HEALTH_STATE.test(normalized) || PERSONAL_VALUE_CONTEXT.test(normalized);
};
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
