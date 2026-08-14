import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { ScientificInterpretationTechnicalError } from "./contracts";

export type RawScientificInterpretationRecord = {
  rawOutputRef: string;
  rawOutputDigest: string;
  persistedAt: string;
  payload: unknown;
};

export interface ScientificInterpretationRawStore {
  persistAtomically(input: { operationId: string; payload: unknown; persistedAt?: string }): Promise<RawScientificInterpretationRecord>;
  read(rawOutputRef: string): Promise<RawScientificInterpretationRecord | null>;
}

export class InMemoryScientificInterpretationRawStore implements ScientificInterpretationRawStore {
  private readonly records = new Map<string, RawScientificInterpretationRecord>();

  async persistAtomically(input: { operationId: string; payload: unknown; persistedAt?: string }) {
    try {
      const rawOutputRef = `memory://scientific-interpretation/${input.operationId}`;
      const rawOutputDigest = logicalDigest(input.payload);
      const existing = this.records.get(rawOutputRef);
      if (existing && existing.rawOutputDigest !== rawOutputDigest) throw new Error("RAW_REFERENCE_COLLISION");
      const record = existing ?? {
        rawOutputRef,
        rawOutputDigest,
        persistedAt: input.persistedAt ?? new Date().toISOString(),
        payload: input.payload,
      };
      this.records.set(rawOutputRef, record);
      return record;
    } catch (error) {
      throw new ScientificInterpretationTechnicalError("RAW_PERSISTENCE_FAILURE", error instanceof Error ? error.message : "RAW_PERSISTENCE_FAILURE");
    }
  }

  async read(rawOutputRef: string) {
    return this.records.get(rawOutputRef) ?? null;
  }
}
