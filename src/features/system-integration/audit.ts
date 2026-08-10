export type IntegrationFindingSeverity = "BLOCKING" | "LIMITATION";

export type IntegrationFinding = {
  code: string;
  severity: IntegrationFindingSeverity;
  surface: string;
  message: string;
  missingFields: string[];
};

const DECISION_FIELDS = ["decisionId", "actor", "mandate", "scope", "status", "version", "timestamp", "impact"] as const;

export const auditHumanDecisionContract = (surface: string, value: unknown): IntegrationFinding[] => {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const missingFields = DECISION_FIELDS.filter((field) => {
    const fieldValue = record[field];
    return fieldValue === undefined || fieldValue === null || fieldValue === "" || Array.isArray(fieldValue) && fieldValue.length === 0;
  });
  return missingFields.length ? [{
    code: "SYS-HUMAN-DECISION-CONTRACT-INCOMPLETE",
    severity: "BLOCKING",
    surface,
    message: "La décision ne transporte pas l’identité, le mandat, la portée, la version, l’horodatage et l’impact exigés de bout en bout.",
    missingFields,
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

