import { comparableScientificText } from "./canonical";

const aliases: Record<string, string> = {
  ct: "CT",
  scanner: "CT",
  tomodensitometrie: "CT",
  mr: "MRI",
  mri: "MRI",
  irm: "MRI",
  pet: "PET",
  tep: "PET",
};

/** Canonicalizes only the modality identities already admitted by KE-001. */
export const canonicalModality = (value: string) => {
  const comparable = comparableScientificText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(":")
    .at(-1)
    ?.replace(/[^a-z0-9]+/g, " ")
    .trim() ?? "";
  const exact = aliases[comparable];
  if (exact) return exact;
  const token = comparable.split(" ").find((item) => aliases[item]);
  return token ? aliases[token] : comparable.toLocaleUpperCase("en-US");
};

export const modalitiesAreCompatible = (left: string, right: string) => canonicalModality(left) === canonicalModality(right);
