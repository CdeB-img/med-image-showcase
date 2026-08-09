import { comparableScientificText, logicalDigest, normalizeScientificText, uniqueSorted } from "./canonical";
import { KNOWLEDGE_ENGINE_VERSION, type ContextDimension, type ContextDimensionName, type KnowledgeContextPackage, type KnowledgePurpose } from "./types";

export type KnowledgeContextInput = Partial<Record<ContextDimensionName, string | string[] | null>> & {
  unknowns?: string[];
  contradictions?: string[];
  exclusions?: string[];
};

const normalizeValues = (value: string | string[] | null | undefined) => value == null
  ? []
  : uniqueSorted((Array.isArray(value) ? value : [value]).map(normalizeScientificText).filter(Boolean));

const explicitFromQuestion = (question: string): Partial<Record<ContextDimensionName, string[]>> => {
  const text = comparableScientificText(question);
  const modalities = [
    [/(?:\birm\b|\bmri\b|\bcmr\b)/, "MRI"],
    [/(?:\bct\b|scanner|tomodensitometr)/, "CT"],
    [/(?:\bpet\b|\btep\b)/, "PET"],
  ] as const;
  const modality = modalities.filter(([pattern]) => pattern.test(text)).map(([, value]) => value);
  const result: Partial<Record<ContextDimensionName, string[]>> = {};
  if (modality.length) result.modality = uniqueSorted(modality);
  if (/myocard|cardia/.test(text)) result.domain = ["CARDIAC_IMAGING"];
  else if (/cerebr|neuro/.test(text)) result.domain = ["NEURO_IMAGING"];
  else if (/dicom|numpy|pipeline|fourier/.test(text)) result.domain = ["IMAGING_METHODS"];
  else if (/spectral|double energie|dual energy|photon counting/.test(text)) result.domain = ["SPECTRAL_CT"];
  if (/fibrose myocard/.test(text)) result.phenomenon = ["MYOCARDIAL_FIBROSIS"];
  if (/maladie de fabry|fabry disease/.test(text)) result.pathology = ["FABRY_DISEASE"];
  else {
    const pathology = text.match(/\bmaladie\s+(?:non\s+couverte\s+)?[\p{L}-]+/u)?.[0];
    if (pathology) result.pathology = [pathology.toLocaleUpperCase("fr-FR")];
  }
  if (/no[- ]?reflow/.test(text)) result.phenomenon = ["NO_REFLOW"];
  if (/obstruction microvascul|\bmvo\b/.test(text)) result.phenomenon = [...(result.phenomenon ?? []), "MICROVASCULAR_OBSTRUCTION"];
  if (/\becv\b|volume extracellulaire/.test(text)) result.biomarker = [...(result.biomarker ?? []), "ECV"];
  if (/t1 mapping|cartographie t1/.test(text)) result.technique = ["T1_MAPPING"];
  if (/\bt2\b|t2 mapping/.test(text)) result.biomarker = [...(result.biomarker ?? []), "T2"];
  if (/stent|stenting|angioplast/.test(text)) result.intervention = ["STENTING"];
  if (/apres (?:un |le )?(?:stent|stenting|angioplast)|reperfusion/.test(text)) result.timing = ["POST_REPERFUSION"];
  return result;
};

const criticalForPurpose = (name: ContextDimensionName, purpose: KnowledgePurpose) => {
  if (purpose === "CLARIFY_SELECTION") return ["pathology", "population", "phenomenon", "objective", "usage"].includes(name);
  if (purpose === "COMPARE") return ["modality", "phenomenon", "biomarker", "technique", "usage"].includes(name);
  if (purpose === "CHECK_APPLICABILITY") return ["pathology", "population", "modality", "technique", "timing", "usage"].includes(name);
  return ["domain", "phenomenon", "biomarker", "technique", "usage"].includes(name);
};

export const createKnowledgeContextPackage = (
  question: string,
  purpose: KnowledgePurpose,
  input: KnowledgeContextInput = {},
): KnowledgeContextPackage => {
  const inferred = explicitFromQuestion(question);
  const names: ContextDimensionName[] = ["domain", "pathology", "population", "phenomenon", "biomarker", "modality", "technique", "equipment", "timing", "objective", "criterion", "intervention", "usage"];
  const dimensions: ContextDimension[] = names.map((name) => {
    const explicitlyProvided = Object.prototype.hasOwnProperty.call(input, name);
    const values = explicitlyProvided ? normalizeValues(input[name]) : normalizeValues(inferred[name]);
    const contradictory = values.some((value) => value.includes("CONTRADICTORY:"));
    return {
      name,
      values,
      state: contradictory ? "CONTRADICTORY" : values.length ? "KNOWN" : "UNKNOWN",
      force: criticalForPurpose(name, purpose) ? "HARD" : "SOFT",
      source: explicitlyProvided ? "VALIDATED_SESSION" : values.length ? "EXPLICIT_USER_STATEMENT" : "NOT_PROVIDED",
      critical: criticalForPurpose(name, purpose),
      exclusions: [],
    };
  });
  const contradictions = uniqueSorted(input.contradictions ?? []);
  const criticalUnknowns = dimensions.filter((item) => item.critical && item.state === "UNKNOWN");
  const status = contradictions.length || dimensions.some((item) => item.state === "CONTRADICTORY")
    ? "CONTRADICTORY"
    : criticalUnknowns.length
      ? "UNKNOWN"
      : dimensions.some((item) => item.state === "UNKNOWN")
        ? "PARTIAL"
        : "EXACT";
  const material = {
    version: KNOWLEDGE_ENGINE_VERSION,
    dimensions,
    unknowns: uniqueSorted([...(input.unknowns ?? []), ...criticalUnknowns.map((item) => `MISSING_${item.name.toUpperCase()}`)]),
    contradictions,
    explicitExclusions: uniqueSorted(input.exclusions ?? []),
    relaxation: null,
  };
  const digest = logicalDigest(material);
  return { contextId: `knowledge-context:${digest}`, ...material, status, digest };
};

export const relaxKnowledgeContext = (
  context: KnowledgeContextPackage,
  removedDimensions: ContextDimensionName[],
  authorizedBy: string,
  level: "R1" | "R2" = "R1",
): KnowledgeContextPackage => {
  if (!authorizedBy.trim()) throw new Error("CONTEXT_RELAXATION_REQUIRES_AUTHORITY");
  const selected = context.dimensions.filter((item) => removedDimensions.includes(item.name));
  if (level === "R1" && selected.some((item) => item.force === "HARD")) throw new Error("R1_CANNOT_RELAX_HARD_DIMENSION");
  const dimensions = context.dimensions.filter((item) => !removedDimensions.includes(item.name));
  const relaxation = {
    level,
    authorizedBy: normalizeScientificText(authorizedBy),
    removedDimensions: uniqueSorted(removedDimensions),
    lossOfScope: `Résultat séparé après retrait explicite de : ${uniqueSorted(removedDimensions).join(", ")}.`,
  } as const;
  const material = { ...context, contextId: undefined, digest: undefined, dimensions, relaxation };
  const digest = logicalDigest(material);
  return { ...context, contextId: `knowledge-context:${digest}`, digest, dimensions, relaxation, status: dimensions.some((item) => item.critical && item.state === "UNKNOWN") ? "UNKNOWN" : "PARTIAL" };
};
