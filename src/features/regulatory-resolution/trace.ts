import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { ApplicabilityCheck, RegulatoryTraceEntry } from "./types";

export class RegulatoryResolutionTrace {
  private readonly entries: RegulatoryTraceEntry[] = [];

  add(operation: string, requirementId: string | null, input: unknown, output: unknown, decision: string, checks: ApplicabilityCheck[] = []) {
    this.entries.push({
      sequence: this.entries.length + 1,
      operation,
      requirementId,
      inputDigest: logicalDigest(input),
      outputDigest: logicalDigest(output),
      decision,
      checks,
    });
  }

  build(): RegulatoryTraceEntry[] {
    return this.entries.map((entry) => ({ ...entry, checks: entry.checks.map((check) => ({ ...check, provenance: [...check.provenance] })) }));
  }
}
