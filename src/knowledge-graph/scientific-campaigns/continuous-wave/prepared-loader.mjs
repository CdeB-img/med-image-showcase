import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import {
  P10_PREPARED_FILE,
  P10_PREPARED_FILE_SHA256,
} from "./constants.mjs";

const REQUIRED_EXPORTS = Object.freeze([
  "CONTINUOUS_WAVE_ADAPTER_ID",
  "CONTINUOUS_WAVE_LIMITS",
  "CONTINUOUS_WAVE_PUBLICATION_GUARDS",
  "CONTINUOUS_WAVE_REUSED_SOURCES",
  "continuousWaveAssertionRevisions",
  "continuousWaveConcepts",
  "continuousWaveContextDifferences",
  "continuousWaveDataSummary",
  "continuousWaveDomainPackages",
  "continuousWaveEvidenceLinks",
  "continuousWaveInternalProjections",
  "continuousWaveInternalSourceAudit",
  "continuousWaveRejectedSources",
  "continuousWaveReviewDecisions",
  "continuousWaveScientificSyntheses",
  "continuousWaveSourceRevisions",
]);

const digestText = (value) => createHash("sha256").update(value).digest("hex");
const freeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, freeze(nested)])));
};

// This is a quarantine gate, not an authoritative registry import. The module is
// evaluated only after its exact source digest has been checked, then cloned so
// none of its live objects can be written into the official catalogue directly.
export const loadPreparedScientificWave = async ({ root = process.cwd() } = {}) => {
  const absolutePath = resolve(root, P10_PREPARED_FILE);
  const source = await readFile(absolutePath, "utf8");
  const sourceDigest = digestText(source);
  if (sourceDigest !== P10_PREPARED_FILE_SHA256) throw new Error(`PREPARED_WAVE_SOURCE_DIGEST_MISMATCH:${sourceDigest}`);
  const candidateModule = await import(`${pathToFileURL(absolutePath).href}?quarantineDigest=${sourceDigest}`);
  const missingExports = REQUIRED_EXPORTS.filter((name) => !(name in candidateModule));
  if (missingExports.length) throw new Error(`PREPARED_WAVE_EXPORTS_MISSING:${missingExports.join(",")}`);
  const cloned = Object.fromEntries(REQUIRED_EXPORTS.map((name) => [name, structuredClone(candidateModule[name])]));
  return freeze({
    trustStatus: "UNTRUSTED_PREPARED_PACKAGE_LOADED_THROUGH_DIGEST_GATE",
    sourcePath: P10_PREPARED_FILE,
    sourceDigest,
    exports: cloned,
  });
};

export const preparedWaveRequiredExports = REQUIRED_EXPORTS;
