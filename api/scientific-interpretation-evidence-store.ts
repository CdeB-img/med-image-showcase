import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stableStringify } from "../src/features/knowledge-engine/canonical.js";
import { ScientificInterpretationTechnicalError } from "../src/features/scientific-interpretation/contracts.js";
import type { RawScientificInterpretationRecord, ScientificInterpretationRawStore } from "../src/features/scientific-interpretation/raw-persistence.js";
import type { HybridNativeExecution } from "../src/features/scientific-interpretation/hybrid-adapter.js";

const digest = (value: unknown) => createHash("sha256").update(stableStringify(value)).digest("hex");
const safeFilePart = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 160);

export class FileScientificInterpretationEvidenceStore implements ScientificInterpretationRawStore {
  constructor(private readonly root: string) {}

  private rawDirectory() { return join(this.root, "raw"); }
  private ledgerPath() { return join(this.root, "provider-ledger.jsonl"); }

  async persistAtomically(input: { operationId: string; payload: unknown; persistedAt?: string }): Promise<RawScientificInterpretationRecord> {
    const rawOutputDigest = digest(input.payload);
    const rawOutputRef = `scientific-interpretation-raw:${rawOutputDigest}`;
    const record: RawScientificInterpretationRecord = {
      rawOutputRef,
      rawOutputDigest,
      persistedAt: input.persistedAt ?? new Date().toISOString(),
      payload: input.payload,
    };
    try {
      await mkdir(this.rawDirectory(), { recursive: true });
      const target = join(this.rawDirectory(), `${safeFilePart(input.operationId)}-${rawOutputDigest}.json`);
      const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
      await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
      await rename(temporary, target);
      return record;
    } catch (caught) {
      throw new ScientificInterpretationTechnicalError("RAW_PERSISTENCE_FAILURE", caught instanceof Error ? caught.message : "RAW_PERSISTENCE_FAILURE", null, input.operationId);
    }
  }

  async read(rawOutputRef: string): Promise<RawScientificInterpretationRecord | null> {
    if (!rawOutputRef.startsWith("scientific-interpretation-raw:")) return null;
    const expectedDigest = rawOutputRef.slice("scientific-interpretation-raw:".length);
    try {
      const file = (await readdir(this.rawDirectory())).find((name) => name.endsWith(`-${expectedDigest}.json`));
      if (!file) return null;
      const record = JSON.parse(await readFile(join(this.rawDirectory(), file), "utf8")) as RawScientificInterpretationRecord;
      return record.rawOutputDigest === expectedDigest ? record : null;
    } catch {
      return null;
    }
  }

  async appendProviderLedger(input: {
    operationId: string;
    runtimeId: string;
    runtimeVersion: string;
    provider: string | null;
    model: string | null;
    configurationDigest: string | null;
    rawOutputRef: string | null;
    rawOutputDigest: string | null;
    attempts: HybridNativeExecution["providerAttempts"];
    finalDisposition: string;
  }) {
    await mkdir(this.root, { recursive: true });
    await appendFile(this.ledgerPath(), `${JSON.stringify({ ...input, recordedAt: new Date().toISOString() })}\n`, "utf8");
  }
}
