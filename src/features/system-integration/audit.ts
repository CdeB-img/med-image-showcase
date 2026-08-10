export type IntegrationFindingSeverity = "BLOCKING" | "LIMITATION";

export type IntegrationFinding = {
  code: string;
  severity: IntegrationFindingSeverity;
  surface: string;
  message: string;
  missingFields: string[];
};

const DECISION_FIELDS = ["decisionId", "actor", "mandate", "scope", "status", "version", "timestamp", "impact", "targets", "reason", "provenance", "engineSource", "projectVersion"] as const;
const ENGAGING_DECISION_STATUSES = ["ADOPTED", "REJECTED", "DEFERRED", "REOPENED"];

export const auditHumanDecisionContract = (surface: string, value: unknown): IntegrationFinding[] => {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const status = typeof record.status === "string" ? record.status : "";
  const engaging = ENGAGING_DECISION_STATUSES.includes(status);
  const missingFields = DECISION_FIELDS.filter((field) => record[field] === undefined)
    .concat(engaging ? (["actor", "mandate", "timestamp"] as const).filter((field) => !record[field] || typeof record[field] === "string" && !record[field].trim()) : []);
  const impact = record.impact && typeof record.impact === "object" ? record.impact as Record<string, unknown> : null;
  if (impact && ["affectedObjects", "affectedEngines", "reopenedGates", "obsoleteProjections"].some((field) => !Array.isArray(impact[field]))) missingFields.push("impact");
  return missingFields.length ? [{
    code: "SYS-HUMAN-DECISION-CONTRACT-INCOMPLETE",
    severity: "BLOCKING",
    surface,
    message: engaging
      ? "La décision engageante ne transporte pas l’identité et le mandat humains requis, ou son enveloppe est incomplète."
      : "La décision candidate peut rester sans acteur ni mandat, mais son enveloppe non engageante doit être structurellement complète.",
    missingFields: [...new Set(missingFields)],
  }] : [];
};

const normalized = (value: string) => value.normalize("NFKC").toLocaleLowerCase("fr-FR").replace(/[‐‑‒–—]/g, "-").replace(/\s+/g, " ").trim();

export const auditPreservedObjects = (
  expected: string[],
  stages: Array<{ stage: string; values: string[] }>,
): IntegrationFinding[] => stages.flatMap(({ stage, values }) => {
  const observed = values.map(normalized);
  const missingFields = expected.filter((item) => !observed.some((candidate) => candidate.includes(normalized(item)) || normalized(item).includes(candidate)));
  return missingFields.length ? [{
    code: "SYS-SPECIALIZED-OBJECT-LOST",
    severity: "BLOCKING" as const,
    surface: stage,
    message: "Un objet scientifique spécialisé n’est plus reconstructible à cette étape.",
    missingFields,
  }] : [];
});

export const auditUnknownEquipmentProjection = (value: {
  equipmentCompatibilityStatus: string | null;
  executableProtocolReadiness: string | null;
}) => {
  const findings: IntegrationFinding[] = [];
  if (value.equipmentCompatibilityStatus !== "UNKNOWN") findings.push({
    code: "SYS-UNKNOWN-STRENGTHENED",
    severity: "BLOCKING",
    surface: "Imaging → Research Project → Document",
    message: "La compatibilité équipement inconnue a été renforcée ou remplacée.",
    missingFields: ["equipmentCompatibilityStatus=UNKNOWN"],
  });
  if (value.executableProtocolReadiness !== "EXECUTABLE_PROTOCOL_NOT_READY") findings.push({
    code: "SYS-EXECUTABLE-PROTOCOL-INVENTED",
    severity: "BLOCKING",
    surface: "Imaging → Research Project → Document",
    message: "La projection ne conserve pas le blocage du protocole exécutable.",
    missingFields: ["executableProtocolReadiness=EXECUTABLE_PROTOCOL_NOT_READY"],
  });
  return findings;
};

export const freezeSnapshot = <T>(value: T): string => JSON.stringify(value);
