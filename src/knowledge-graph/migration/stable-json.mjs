import { createHash } from "node:crypto";

export const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
};

export const stableStringify = (value, space = 2) => JSON.stringify(canonicalize(value), null, space);

export const sha256Digest = (value) => createHash("sha256").update(stableStringify(value, 0)).digest("hex");
