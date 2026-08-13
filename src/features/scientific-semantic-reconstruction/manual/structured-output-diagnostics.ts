import { chmod, mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type StructuredOutputFailureClassification =
  | "PARSER_FAILURE"
  | "MODEL_STRUCTURE_NON_COMPLIANCE"
  | "MODEL_ENUM_NON_COMPLIANCE"
  | "INTERNAL_INVARIANT_FAILURE";

export type StructuredOutputFailureArtifact = {
  caseId: string;
  stage: "ATOMIC_COMPOSITION_AUDIT";
  attempt: number;
  timestamp: string;
  model: string;
  promptVersion: string;
  providerSchemaDigest: string;
  internalSchemaDigest: string;
  classification: StructuredOutputFailureClassification;
  rawProviderStructuredResponse: string | null;
  validationIssues: Array<{ path: string; code: string; message: string }>;
};

const SECRET_KEY = /^(?:api[-_]?key|authorization|access[-_]?token|refresh[-_]?token|secret|password)$/i;
const redactText = (value: string) => value
  .replace(/(authorization\s*[:=]\s*["']?)(?:bearer\s+)?[^\s,"'}]+/gi, "$1[REDACTED]")
  .replace(/((?:api[-_]?key|access[-_]?token|refresh[-_]?token|secret|password)\s*[:=]\s*["']?)[^\s,"'}]+/gi, "$1[REDACTED]")
  .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED_GOOGLE_API_KEY]");

const sanitize = (value: unknown, key = ""): unknown => {
  if (SECRET_KEY.test(key)) return "[REDACTED]";
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, sanitize(child, childKey)]));
  }
  return value;
};

const safeSegment = (value: string) => value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "unknown";

export const persistStructuredOutputFailure = async (
  directory: string,
  artifact: StructuredOutputFailureArtifact,
): Promise<string> => {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const filename = `${safeSegment(artifact.caseId)}-${safeSegment(artifact.stage.toLowerCase())}-attempt-${artifact.attempt}-invalid-structured-output.json`;
  const destination = join(directory, filename);
  const temporary = `${destination}.tmp`;
  const payload = `${JSON.stringify(sanitize(artifact), null, 2)}\n`;
  await writeFile(temporary, payload, { encoding: "utf8", mode: 0o600 });
  await chmod(temporary, 0o600);
  await rename(temporary, destination);
  await chmod(destination, 0o600);
  return destination;
};
