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

export const stableTemplateStringify = (value: unknown) => JSON.stringify(canonicalize(value));

export const templateDigest = (value: unknown) => {
  const input = stableTemplateStringify(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193) >>> 0;
    second = Math.imul(second ^ code, 0x85ebca6b) >>> 0;
  }
  return `tmp1-${first.toString(16).padStart(8, "0")}${second.toString(16).padStart(8, "0")}`;
};

export const stableTemplateId = (prefix: string, value: unknown) => `${prefix}-${templateDigest(value).slice(5, 17).toUpperCase()}`;

export const uniqueSorted = <T extends string>(values: readonly T[]) => [...new Set(values)].sort((left, right) => left.localeCompare(right)) as T[];

export const normalizeTemplateText = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[’]/g, "'")
  .replace(/[^a-zA-Z0-9]+/g, " ")
  .trim()
  .toLowerCase();

export const containsTemplateToken = (values: readonly string[], tokens: readonly string[]) => {
  const text = normalizeTemplateText(values.join(" "));
  return tokens.some((token) => text.includes(normalizeTemplateText(token)));
};

export const countBy = (values: readonly string[]) => Object.fromEntries(
  uniqueSorted(values).map((value) => [value, values.filter((item) => item === value).length]),
);

export const deepCloneTemplateValue = <T>(value: T): T => JSON.parse(stableTemplateStringify(value)) as T;
