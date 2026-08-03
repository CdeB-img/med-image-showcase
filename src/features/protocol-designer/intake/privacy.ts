export type SensitiveFinding = {
  code: "EMAIL" | "PHONE" | "NATIONAL_ID" | "DATE_OF_BIRTH" | "PATIENT_IDENTIFIER" | "POSTAL_ADDRESS" | "IDENTIFIABLE_CASE";
};

const RULES: Array<{ code: SensitiveFinding["code"]; pattern: RegExp }> = [
  { code: "EMAIL", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { code: "PHONE", pattern: /(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}\b/ },
  { code: "NATIONAL_ID", pattern: /\b[12]\s?\d{2}\s?(?:0\d|1[0-2])\s?(?:\d{2}|2A|2B)\s?\d{3}\s?\d{3}\s?\d{2}\b/i },
  { code: "DATE_OF_BIRTH", pattern: /\b(?:n[ée]e?\s+le|date\s+de\s+naissance|dob)\s*[:：]?\s*\d{1,2}[/. -]\d{1,2}[/. -]\d{2,4}\b/i },
  { code: "PATIENT_IDENTIFIER", pattern: /\b(?:patient|dossier|ipp|id\s*patient|mrn|hospital\s*id)\s*(?:n[°o]|num[ée]ro|id)?\s*[:#-]?\s*[A-Z0-9-]{4,}\b/i },
  { code: "POSTAL_ADDRESS", pattern: /\b\d{1,4}\s+(?:rue|avenue|av\.|boulevard|bd|chemin|impasse|route)\s+[\p{L}' -]{3,}/iu },
  { code: "IDENTIFIABLE_CASE", pattern: /\b(?:m\.|mme|monsieur|madame|patient(?:e)?)\s+[A-ZÀ-ÖØ-Ý][\p{L}'-]+\s+[A-ZÀ-ÖØ-Ý][\p{L}'-]+/u },
];

export const detectSensitiveData = (text: string): SensitiveFinding[] => {
  const codes = RULES.filter(({ pattern }) => pattern.test(text)).map(({ code }) => code);
  return [...new Set(codes)].map((code) => ({ code }));
};

export const hasSensitiveData = (text: string) => detectSensitiveData(text).length > 0;
