const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
};

export const stableStringify = (value: unknown) => JSON.stringify(canonicalize(value));

export const documentaryDigest = (value: unknown) => {
  const input = stableStringify(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193) >>> 0;
    second = Math.imul(second ^ code, 0x85ebca6b) >>> 0;
  }
  return `doc2-${first.toString(16).padStart(8, "0")}${second.toString(16).padStart(8, "0")}`;
};

export const uniqueSorted = <T extends string>(values: readonly T[]) => [...new Set(values)].sort((left, right) => left.localeCompare(right)) as T[];

export const normalizeDocumentaryText = (value: string) => value
  .normalize("NFKC")
  .replace(/[’]/g, "'")
  .replace(/\s+/g, " ")
  .trim();

export const comparableDocumentaryText = (value: string) => normalizeDocumentaryText(value).toLocaleLowerCase("fr-FR");

export const stablePatternId = (behaviorKey: string) => `DKP-${documentaryDigest(comparableDocumentaryText(behaviorKey)).slice(5, 17).toUpperCase()}`;
export const stableFactId = (sourceId: string, behaviorKey: string) => `DKF-${documentaryDigest([sourceId, comparableDocumentaryText(behaviorKey)]).slice(5, 17).toUpperCase()}`;
export const stableRelationId = (fromId: string, type: string, toId: string) => `DKR-${documentaryDigest([fromId, type, toId]).slice(5, 17).toUpperCase()}`;

export const canonicalPatternInput = (value: unknown) => JSON.parse(stableStringify(value)) as unknown;
