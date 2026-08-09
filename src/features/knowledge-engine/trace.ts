import { logicalDigest } from "./canonical";
import { LLM_POLICY_VERSION, classifyLlmOperation, type LlmOperation } from "./llm-policy";
import { KNOWLEDGE_ENGINE_VERSION, type KnowledgeTrace, type KnowledgeTraceEvent } from "./types";

export class KnowledgeTraceBuilder {
  private readonly events: KnowledgeTraceEvent[] = [];

  add(operation: LlmOperation, decision: string, input: unknown, output: unknown) {
    this.events.push({
      sequence: this.events.length + 1,
      operation,
      mode: classifyLlmOperation(operation),
      decision,
      inputDigest: logicalDigest(input),
      outputDigest: logicalDigest(output),
    });
  }

  build(traceId: string, registrySnapshotDigest: string, privacy: KnowledgeTrace["privacy"]): KnowledgeTrace {
    const material = { engineVersion: KNOWLEDGE_ENGINE_VERSION, events: this.events, registrySnapshotDigest, policyRefs: ["KE-001-v1.0", LLM_POLICY_VERSION], privacy };
    return { traceId, ...material, digest: logicalDigest(material) };
  }
}

