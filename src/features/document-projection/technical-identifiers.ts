/** Shared ASCII stem of the existing DOC/REDCap field-name adapter. */
export const asciiIdentifierStem = (value: string, casing: "LOWER" | "UPPER" = "LOWER") => {
  const normalized = value.normalize("NFKD").replace(/\p{M}/gu, "");
  const cased = casing === "UPPER" ? normalized.toUpperCase() : normalized.toLowerCase();
  return cased.replace(/[^A-Za-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
};

export const DRCI_CRF_VARIABLE_ID_PATTERN = /^[A-Z][A-Z0-9_]{1,63}$/u;

const canonicalCrfVariableId = (raw: string) => {
  // A native valid identifier is already authoritative at this technical boundary.
  if (DRCI_CRF_VARIABLE_ID_PATTERN.test(raw)) return raw;
  const canonical = asciiIdentifierStem(raw, "UPPER");
  // No truncation, invented prefix or suffix: ambiguous candidates fail closed.
  if (canonical.length > 64) throw new Error("DRCI_CRF_TECHNICAL_IDENTIFIER_TOO_LONG");
  if (!DRCI_CRF_VARIABLE_ID_PATTERN.test(canonical)) throw new Error("DRCI_CRF_TECHNICAL_IDENTIFIER_INVALID");
  return canonical;
};

const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** Only DOC machine definitions and their structured references may change. */
export const canonicalizeDrciCrfTechnicalIdentifiers = (value: unknown): unknown => {
  if (!record(value) || !Array.isArray(value.crfRows)) return value;
  const mapping = new Map<string, string>();
  const canonicalDefinitions = new Map<string, string>();
  for (const row of value.crfRows) {
    if (!record(row) || typeof row.variableId !== "string") continue;
    const canonical = canonicalCrfVariableId(row.variableId);
    const previousRaw = canonicalDefinitions.get(canonical);
    if (previousRaw !== undefined && previousRaw !== row.variableId) throw new Error("DRCI_CRF_TECHNICAL_IDENTIFIER_COLLISION");
    mapping.set(row.variableId, canonical);
    // Identical duplicate definitions remain rejected by the existing native
    // coverage/operational validators, with their original failure semantics.
    canonicalDefinitions.set(canonical, row.variableId);
  }
  return { ...value, crfRows: value.crfRows.map(row => {
    if (!record(row)) return row;
    return { ...row,
      ...(typeof row.variableId === "string" ? { variableId: mapping.get(row.variableId)! } : {}),
      ...(Array.isArray(row.derivedFrom) ? { derivedFrom: row.derivedFrom.map(ref => {
        // Leave wrong types to the unchanged native schema; never coerce them.
        if (typeof ref !== "string") return ref;
        const canonical = mapping.get(ref) ?? (canonicalDefinitions.has(ref) ? ref : undefined);
        if (!canonical) throw new Error("DRCI_OPERATIONAL_CRF_SPECIFICATION_INCOMPLETE");
        return canonical;
      }) } : {}),
    };
  }) };
};
