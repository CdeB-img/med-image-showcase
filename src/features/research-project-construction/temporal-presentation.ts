import type { CanonicalTemporalAnchorValue } from "./canonical-project-backbone.js";

type FrenchTemporalUnit = "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR" | "MINUTE";

const TEMPORAL_UNIT_ALIASES: Readonly<Record<string, FrenchTemporalUnit>> = Object.freeze({
  HOUR: "HOUR", HOURS: "HOUR", HEURE: "HOUR", HEURES: "HOUR",
  DAY: "DAY", DAYS: "DAY", JOUR: "DAY", JOURS: "DAY",
  WEEK: "WEEK", WEEKS: "WEEK", SEMAINE: "WEEK", SEMAINES: "WEEK",
  MONTH: "MONTH", MONTHS: "MONTH", MOIS: "MONTH",
  YEAR: "YEAR", YEARS: "YEAR", AN: "YEAR", ANS: "YEAR", ANNÉE: "YEAR", ANNÉES: "YEAR",
  MINUTE: "MINUTE", MINUTES: "MINUTE",
});

const TEMPORAL_UNIT_FORMS: Readonly<Record<FrenchTemporalUnit, readonly [string, string]>> = Object.freeze({
  HOUR: ["heure", "heures"],
  DAY: ["jour", "jours"],
  WEEK: ["semaine", "semaines"],
  MONTH: ["mois", "mois"],
  YEAR: ["an", "ans"],
  MINUTE: ["minute", "minutes"],
});

export const canonicalFrenchTemporalUnit = (unit: string): FrenchTemporalUnit | null => (
  TEMPORAL_UNIT_ALIASES[unit.trim().toLocaleUpperCase("fr-FR")] ?? null
);

export const frenchTemporalQuantity = (unit: string, value: number) => {
  const canonicalUnit = canonicalFrenchTemporalUnit(unit);
  if (!canonicalUnit) return `${value} ${unit.trim().toLocaleLowerCase("fr-FR")}`;
  const forms = TEMPORAL_UNIT_FORMS[canonicalUnit];
  return `${value} ${Math.abs(value) === 1 ? forms[0] : forms[1]}`;
};

const directionFor = (direction: CanonicalTemporalAnchorValue["direction"]) => (
  direction === "BEFORE" ? "avant" : direction === "AFTER" ? "après" : "au moment de"
);

const numericTemporalValue = (anchor: Readonly<CanonicalTemporalAnchorValue>) => {
  const unit = canonicalFrenchTemporalUnit(anchor.unit);
  if ((anchor.kind === "WINDOW" || anchor.kind === "INTERVAL")
    && anchor.lowerBound !== null && anchor.upperBound !== null) {
    if (unit === "DAY") return `entre J${anchor.lowerBound} et J${anchor.upperBound} (${anchor.lowerBound} à ${frenchTemporalQuantity(anchor.unit, anchor.upperBound)})`;
    return `${anchor.lowerBound} à ${frenchTemporalQuantity(anchor.unit, anchor.upperBound)}`;
  }
  if (anchor.offset === null) return null;
  const quantity = frenchTemporalQuantity(anchor.unit, anchor.offset);
  const conventionalCode = unit === "DAY" ? `J${anchor.offset}` : unit === "MONTH" ? `M${anchor.offset}` : null;
  const visibleValue = conventionalCode ? `${conventionalCode} (${quantity})` : quantity;
  return anchor.tolerance ? `autour de ${visibleValue}` : `à ${visibleValue}`;
};

/**
 * Read-only French presentation of one PRJ-owned canonical temporal value.
 * It localizes existing units and exposes existing tolerance/reference state;
 * it neither infers an anchor nor changes the canonical temporal claim.
 */
export const presentCanonicalTemporalAnchor = (
  anchor: Readonly<CanonicalTemporalAnchorValue>,
  objectLabels: ReadonlyMap<string, string> = new Map(),
) => {
  const numericValue = numericTemporalValue(anchor);
  if (!numericValue) {
    if (anchor.relativeEventLabel) {
      const suffix = anchor.reference.status === "EXPLICIT"
        ? " — référentiel à relier au projet"
        : anchor.reference.status === "UNKNOWN" ? " — référentiel à préciser" : "";
      return `${directionFor(anchor.direction)} ${anchor.relativeEventLabel}${suffix}`;
    }
    if (anchor.reference.status === "KNOWN") {
      const reference = objectLabels.get(anchor.reference.referenceProjectRef) ?? anchor.reference.referenceProjectRef;
      return `${directionFor(anchor.direction)} ${reference}`;
    }
    if (anchor.reference.status === "EXPLICIT" && anchor.relativeEventLabel) {
      return `${directionFor(anchor.direction)} ${anchor.relativeEventLabel} — référentiel à relier au projet`;
    }
    return "Temporalité relative — référentiel à préciser";
  }

  if (anchor.reference.status === "KNOWN") {
    const reference = objectLabels.get(anchor.reference.referenceProjectRef) ?? anchor.reference.referenceProjectRef;
    if (anchor.direction === "BEFORE") return `${numericValue} avant ${reference}`;
    if (anchor.direction === "AFTER") return `${numericValue} après ${reference}`;
    return `${numericValue} par rapport à ${reference}`;
  }
  if (anchor.reference.status === "EXPLICIT" && anchor.relativeEventLabel) {
    return `${numericValue} ${directionFor(anchor.direction)} ${anchor.relativeEventLabel} — référentiel à relier au projet`;
  }
  return `${numericValue} — référentiel à préciser`;
};
