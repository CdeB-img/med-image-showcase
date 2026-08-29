export type ExplicitScientificDimension = Readonly<{
  dimensionRef: string;
  sourceText: string;
  sourceTurnRef: string;
  sourceOrder: number;
  representationKind: "EXPLICIT_SOURCE_SPAN";
}>;

const normalized = (value: string) => value
  .normalize("NFKC")
  .toLocaleLowerCase("fr-FR")
  .replace(/\s+/gu, " ")
  .trim();

const splitExplicitSourceSpans = (raw: string) => raw
  .replace(/\s+/gu, " ")
  .trim()
  .split(/(?<=[.!?;:,])\s+|\s+(?:ainsi\s+que|de\s+même\s+que|versus|vs\.?|et|\+)\s+/giu)
  .map((value) => value.trim().replace(/^[,;:]+|[,;:]+$/gu, "").trim())
  .filter((value) => /[\p{L}\p{N}]/u.test(value));

/**
 * Represents the user's explicit scientific material without interpreting its
 * scientific role. Source spans are generic, ordered and lossless: downstream
 * owners may type or transform them, but cannot silently make them disappear.
 */
export const representExplicitScientificDimensions = (input: {
  raw: string;
  sourceTurnRef: string;
}): readonly ExplicitScientificDimension[] => {
  const spans = splitExplicitSourceSpans(input.raw);
  const seen = new Set<string>();
  return Object.freeze(spans.flatMap((sourceText, index) => {
    const key = normalized(sourceText);
    if (!key || seen.has(key)) return [];
    seen.add(key);
    return [Object.freeze({
      dimensionRef: `${input.sourceTurnRef}:explicit-dimension:${index + 1}`,
      sourceText,
      sourceTurnRef: input.sourceTurnRef,
      sourceOrder: index + 1,
      representationKind: "EXPLICIT_SOURCE_SPAN" as const,
    })];
  }));
};
