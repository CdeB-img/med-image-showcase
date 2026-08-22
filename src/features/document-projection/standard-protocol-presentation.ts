import type { DocumentProjection, DocumentSectionInstance } from "./types";

export const STANDARD_PROTOCOL_PRESENTATION_BOUNDARY = "DOC_001_STANDARD_PROTOCOL_PRESENTATION" as const;

export type StandardProtocolSectionId =
  | "question"
  | "objectives"
  | "population"
  | "design"
  | "intervention"
  | "comparator"
  | "imaging"
  | "measurements"
  | "temporality"
  | "analysis";

export type StandardProtocolEntry = {
  entryId: string;
  kind: "PARAGRAPH" | "LABELED_VALUE" | "LIST_ITEM";
  label: string | null;
  value: string;
};

export type StandardProtocolSection = {
  sectionId: StandardProtocolSectionId;
  title: string;
  completeness: "KNOWN" | "PARTIAL" | "MISSING";
  entries: StandardProtocolEntry[];
  sourceSectionIds: string[];
};

export type StandardProtocolOpenItem = {
  itemId: string;
  label: string;
  sourceSectionId: string;
  sourceKind: "UNKNOWN" | "STATUS";
  sourceIndex: number;
};

export type StandardProtocolPresentation = {
  contract: "STANDARD_PROTOCOL_PRESENTATION";
  contractVersion: "1.0.0";
  boundary: typeof STANDARD_PROTOCOL_PRESENTATION_BOUNDARY;
  sourceProjectionId: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  sourceOfTruth: false;
  persisted: false;
  readOnly: true;
  projectWriteAuthorized: false;
  sections: StandardProtocolSection[];
  openItems: StandardProtocolOpenItem[];
};

type ProjectedFact = {
  label: string;
  value: string;
};

type SectionBuilder = {
  sectionId: StandardProtocolSectionId;
  title: string;
  sourceSectionIds: string[];
  entries: (sections: DocumentSectionInstance[]) => StandardProtocolEntry[];
};

const normalizedKey = (value: string) => value
  .normalize("NFKC")
  .toLocaleLowerCase("fr-FR")
  .replace(/[\s.;:]+$/g, "")
  .replace(/\s+/g, " ")
  .trim();

const unique = <T>(values: T[], key: (value: T) => string) => [...new Map(values.map((value) => [key(value), value])).values()];

const capitalize = (value: string) => value
  ? `${value.charAt(0).toLocaleUpperCase("fr-FR")}${value.slice(1)}`
  : value;

const sentence = (value: string) => {
  const clean = capitalize(value.trim());
  return clean && !/[.!?]$/.test(clean) ? `${clean}.` : clean;
};

const visibleLanguage = (value: string) => value
  .replace(/\bIRM\b/gi, "IRM")
  .replace(/\bMRI\b/gi, "IRM")
  .replace(/\bCT\b/g, "CT")
  .replace(/\bPET\b/g, "TEP")
  .replace(/\bfollow[- ]?up\b/gi, "suivi")
  .replace(/\b(\d+(?:[.,]\d+)?)\s+months?\b/gi, "$1 mois")
  .replace(/\bknown\b/gi, "")
  .replace(/\s+/g, " ")
  .trim();

const parseFact = (raw: string): ProjectedFact | null => {
  const match = raw.match(/^(?:Confirmé|Adopté|Candidat|Exigence|Inconnu|Limite|Contradiction|Rejeté)\s+—\s+(.+?)\s*:\s*(.*)$/i);
  return match?.[1] && match[2] !== undefined
    ? { label: match[1].trim(), value: match[2].trim() }
    : null;
};

const factsFrom = (sections: DocumentSectionInstance[], sectionIds: string[]) => sections
  .filter((section) => sectionIds.includes(section.sectionId))
  .flatMap((section) => section.blocks)
  .filter((block) => block.kind !== "EMPTY_STATE")
  .flatMap((block) => block.items)
  .map(parseFact)
  .filter((fact): fact is ProjectedFact => Boolean(fact));

const entry = (
  sectionId: StandardProtocolSectionId,
  kind: StandardProtocolEntry["kind"],
  value: string,
  label: string | null = null,
): StandardProtocolEntry => ({
  entryId: `${sectionId}:${normalizedKey(`${label ?? ""}:${value}`)}`,
  kind,
  label,
  value: visibleLanguage(value),
});

const simpleFacts = (
  sectionId: StandardProtocolSectionId,
  facts: ProjectedFact[],
  labelPattern: RegExp,
  kind: StandardProtocolEntry["kind"] = "PARAGRAPH",
) => unique(facts
  .filter((fact) => labelPattern.test(fact.label))
  .map((fact) => entry(sectionId, kind, kind === "PARAGRAPH" ? sentence(fact.value.split(/\s+—\s+/)[0]!) : fact.value.split(/\s+—\s+/)[0]!)),
(value) => normalizedKey(value.value));

const questionEntries = (sections: DocumentSectionInstance[]) => simpleFacts(
  "question",
  factsFrom(sections, ["scientific-question"]),
  /Question scientifique/i,
);

const objectiveEntries = (sections: DocumentSectionInstance[]) => simpleFacts(
  "objectives",
  factsFrom(sections, ["objectives-hypotheses"]),
  /^Objectif\b/i,
  "LIST_ITEM",
);

const ageBound = (value: string, direction: "minimal" | "maximal") => {
  const match = value.match(new RegExp(`^Âge\\s+${direction}\\s*:\\s*(.+)$`, "i"));
  return match?.[1]?.trim() ?? null;
};

const populationEntries = (sections: DocumentSectionInstance[]) => {
  const facts = factsFrom(sections, ["population"]);
  const primary = facts.filter((fact) => !/Éligibilité opérationnelle future/i.test(fact.label));
  const conditions = primary.filter((fact) => /Condition ou pathologie|Contexte clinique/i.test(fact.label));
  const characteristics = primary.filter((fact) => /Caractéristique requise/i.test(fact.label));
  const minimum = characteristics.map((fact) => ageBound(fact.value, "minimal")).find(Boolean) ?? null;
  const maximum = characteristics.map((fact) => ageBound(fact.value, "maximal")).find(Boolean) ?? null;
  const values: StandardProtocolEntry[] = conditions.map((fact) => entry("population", "PARAGRAPH", sentence(fact.value)));
  if (minimum && maximum) {
    values.push(entry("population", "LABELED_VALUE", `${minimum.replace(/\s*ans$/i, "")} à ${maximum}`, "Âge"));
  } else if (minimum) {
    values.push(entry("population", "LABELED_VALUE", minimum, "Âge minimal"));
  } else if (maximum) {
    values.push(entry("population", "LABELED_VALUE", maximum, "Âge maximal"));
  }
  for (const fact of characteristics) {
    if (ageBound(fact.value, "minimal") || ageBound(fact.value, "maximal")) continue;
    const delay = fact.value.match(/(?:datant de\s+)?(moins de\s+\d+\s+(?:jours?|semaines?|mois|ans?))/i);
    values.push(delay?.[1]
      ? entry("population", "LABELED_VALUE", delay[1], "Délai depuis l’événement")
      : entry("population", "LIST_ITEM", fact.value));
  }
  return unique(values, (value) => normalizedKey(`${value.label ?? ""}:${value.value}`));
};

const designEntries = (sections: DocumentSectionInstance[]) => simpleFacts(
  "design",
  factsFrom(sections, ["study-design"]),
  /Plan adopté|Caractéristique de design confirmée/i,
);

const groupEntries = (sections: DocumentSectionInstance[], role: "EXPOSURE" | "COMPARATOR", sectionId: "intervention" | "comparator") => {
  const facts = factsFrom(sections, ["groups-comparators"]);
  return unique(facts
    .filter((fact) => new RegExp(`^Groupe\\s+${role}$`, "i").test(fact.label))
    .map((fact) => entry(sectionId, "PARAGRAPH", sentence(fact.value.split(/\s+—\s+/)[0]!))),
  (value) => normalizedKey(value.value));
};

const imagingEntries = (sections: DocumentSectionInstance[]) => simpleFacts(
  "imaging",
  factsFrom(sections, ["imaging"]),
  /Référence d’acquisition conceptuelle/i,
);

const measurementEntries = (sections: DocumentSectionInstance[]) => {
  const facts = factsFrom(sections, ["endpoints-variables"]);
  const variables = facts.filter((fact) => /^Variable\b/i.test(fact.label));
  const source = variables.length ? variables : facts.filter((fact) => /^Critère\b/i.test(fact.label));
  return unique(source.map((fact) => entry("measurements", "LIST_ITEM", fact.value.split(/\s+—\s+/)[0]!)),
    (value) => normalizedKey(value.value));
};

const temporalEntries = (sections: DocumentSectionInstance[]) => {
  const visits = factsFrom(sections, ["visits-temporal"]).filter((fact) => /^Visit\b/i.test(fact.label));
  return unique(visits.flatMap((fact) => {
    const clean = fact.value
      .replace(/^Temporalité confirmée\s+—\s+/i, "")
      .replace(/\s+(?:KNOWN|PARTIAL|UNKNOWN)\s+—\s+.*$/i, "")
      .trim();
    const separator = clean.indexOf(":");
    return separator > 0
      ? [entry("temporality", "LABELED_VALUE", clean.slice(separator + 1).trim(), clean.slice(0, separator).trim())]
      : clean ? [entry("temporality", "PARAGRAPH", sentence(clean))] : [];
  }), (value) => normalizedKey(`${value.label ?? ""}:${value.value}`));
};

const analysisEntries = (sections: DocumentSectionInstance[]) => simpleFacts(
  "analysis",
  factsFrom(sections, ["analysis-statistics"]),
  /^Exigence\s+(?:COMPARISON|comparaison)/i,
);

const BUILDERS: SectionBuilder[] = [
  { sectionId: "question", title: "Question scientifique", sourceSectionIds: ["scientific-question"], entries: questionEntries },
  { sectionId: "objectives", title: "Objectifs", sourceSectionIds: ["objectives-hypotheses"], entries: objectiveEntries },
  { sectionId: "population", title: "Population", sourceSectionIds: ["population"], entries: populationEntries },
  { sectionId: "design", title: "Design", sourceSectionIds: ["study-design"], entries: designEntries },
  { sectionId: "intervention", title: "Intervention", sourceSectionIds: ["groups-comparators"], entries: (sections) => groupEntries(sections, "EXPOSURE", "intervention") },
  { sectionId: "comparator", title: "Comparateur", sourceSectionIds: ["groups-comparators"], entries: (sections) => groupEntries(sections, "COMPARATOR", "comparator") },
  { sectionId: "imaging", title: "Imagerie", sourceSectionIds: ["imaging"], entries: imagingEntries },
  { sectionId: "measurements", title: "Mesures", sourceSectionIds: ["endpoints-variables"], entries: measurementEntries },
  { sectionId: "temporality", title: "Temporalité", sourceSectionIds: ["visits-temporal"], entries: temporalEntries },
  { sectionId: "analysis", title: "Analyse", sourceSectionIds: ["analysis-statistics"], entries: analysisEntries },
];

const openItemLabel = (builder: SectionBuilder, sourceText: string, hasKnownContent: boolean) => {
  if (/objectif/i.test(sourceText) || builder.sectionId === "objectives") return "Objectifs";
  if (builder.sectionId === "population" && /crit[eè]re|population|inclusion|exclusion/i.test(sourceText)) return "Critères complémentaires de population";
  if (builder.sectionId === "analysis" && /statistic|Biostatistics|dimensionnement|numérique/i.test(sourceText)) return "Plan d’analyse statistique";
  if (hasKnownContent) return null;
  return builder.title;
};

const internalDiagnostic = (value: string) => /MeasurementDefinitions|ObservableProperties|BiomarkerRoles|canonicalPromotion|handoff|\b(?:IMAGING|BIOSTATISTICS|QRY|PRJ|OBSERVABILITY_MEASUREMENT):/i.test(value);

const openItemsFor = (
  builder: SectionBuilder,
  sourceSections: DocumentSectionInstance[],
  entries: StandardProtocolEntry[],
) => {
  const candidates: Array<{
    sourceText: string;
    sourceSectionId: string;
    sourceKind: StandardProtocolOpenItem["sourceKind"];
    sourceIndex: number;
  }> = sourceSections.flatMap((section) => section.unknowns.map((sourceText, sourceIndex) => ({
    sourceText,
    sourceSectionId: section.sectionId,
    sourceKind: "UNKNOWN" as const,
    sourceIndex,
  }))).filter((candidate) => !internalDiagnostic(candidate.sourceText));
  if (!candidates.length && entries.length === 0 && sourceSections.some((section) => section.applicability !== "NOT_APPLICABLE")) {
    const sourceSection = sourceSections[0];
    candidates.push({
      sourceText: sourceSection?.statusReasons[0] ?? `${builder.title} non renseigné dans la projection.`,
      sourceSectionId: sourceSection?.sectionId ?? builder.sourceSectionIds[0]!,
      sourceKind: "STATUS",
      sourceIndex: 0,
    });
  }
  return unique(candidates.flatMap((candidate) => {
    const label = openItemLabel(builder, candidate.sourceText, entries.length > 0);
    return label ? [{
      itemId: `${builder.sectionId}:${normalizedKey(label)}`,
      label,
      sourceSectionId: candidate.sourceSectionId,
      sourceKind: candidate.sourceKind,
      sourceIndex: candidate.sourceIndex,
    }] : [];
  }), (item) => normalizedKey(item.label));
};

/**
 * Pure, read-only consumer presentation of one existing DOC projection.
 * It selects and humanizes already-projected facts; it never reads or mutates Project.
 */
export const buildStandardProtocolPresentation = (
  projection: Readonly<DocumentProjection>,
): StandardProtocolPresentation => {
  const built = BUILDERS.map((builder) => {
    const sourceSections = projection.sections.filter((section) => builder.sourceSectionIds.includes(section.sectionId));
    const entries = builder.entries(projection.sections);
    const openItems = openItemsFor(builder, sourceSections, entries);
    const section: StandardProtocolSection = {
      sectionId: builder.sectionId,
      title: builder.title,
      completeness: entries.length === 0 ? "MISSING" : openItems.length > 0 ? "PARTIAL" : "KNOWN",
      entries,
      sourceSectionIds: builder.sourceSectionIds,
    };
    return { section, openItems };
  });
  return {
    contract: "STANDARD_PROTOCOL_PRESENTATION",
    contractVersion: "1.0.0",
    boundary: STANDARD_PROTOCOL_PRESENTATION_BOUNDARY,
    sourceProjectionId: projection.projectionId,
    sourceProjectVersion: projection.source.projectVersion,
    sourceProjectDigest: projection.source.projectDigest,
    sourceOfTruth: false,
    persisted: false,
    readOnly: true,
    projectWriteAuthorized: false,
    sections: built.map((item) => item.section),
    openItems: unique(built.flatMap((item) => item.openItems), (item) => normalizedKey(item.label)),
  };
};
