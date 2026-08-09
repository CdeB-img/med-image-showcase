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

export const logicalDigest = (value: unknown) => {
  const input = stableStringify(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193) >>> 0;
    second = Math.imul(second ^ code, 0x85ebca6b) >>> 0;
  }
  return `ke1-${first.toString(16).padStart(8, "0")}${second.toString(16).padStart(8, "0")}`;
};

export const uniqueSorted = <T extends string>(values: T[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b)) as T[];

export const normalizeScientificText = (value: string) => value.normalize("NFKC").replace(/[’]/g, "'").replace(/\s+/g, " ").trim();
export const comparableScientificText = (value: string) => normalizeScientificText(value).toLocaleLowerCase("fr-FR");

