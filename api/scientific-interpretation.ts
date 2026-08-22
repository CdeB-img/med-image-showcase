import { join } from "node:path";
import { FileScientificInterpretationEvidenceStore } from "./scientific-interpretation-evidence-store.js";
import { GeminiHybridScientificInterpretationProvider } from "./scientific-interpretation-provider.js";
import { HybridScientificInterpretationRuntimeAdapter } from "../src/features/scientific-interpretation/hybrid-adapter.js";
import { HYBRID_PRIMARY_RUNTIME_ID, HYBRID_PRIMARY_RUNTIME_VERSION, parseHybridPrimaryProviderOutput } from "../src/features/scientific-interpretation/hybrid-primary.js";
import { DEFAULT_SCIENTIFIC_INTERPRETATION_MODE, SCIENTIFIC_INTERPRETATION_MODES, ScientificInterpretationTechnicalError, type ScientificInterpretationMode, type ScientificInterpretationRuntime } from "../src/features/scientific-interpretation/contracts.js";
import { executeScientificInterpretation } from "../src/features/scientific-interpretation/runtime.js";
import { processScientificInterpretationHttp } from "../src/features/scientific-interpretation/server.js";

export type ApiRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown; socket?: { remoteAddress?: string } };
export type ApiResponse = { status(code: number): ApiResponse; setHeader(name: string, value: string): void; json(value: unknown): void };

const configuredMode = (): ScientificInterpretationMode => {
  const candidate = process.env.SCIENTIFIC_INTERPRETATION_MODE?.trim();
  return SCIENTIFIC_INTERPRETATION_MODES.includes(candidate as ScientificInterpretationMode)
    ? candidate as ScientificInterpretationMode
    : DEFAULT_SCIENTIFIC_INTERPRETATION_MODE;
};

export const handleScientificInterpretation = async (request: ApiRequest, response: ApiResponse) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || null;
  const model = process.env.GEMINI_MODEL?.trim() || null;
  const evidenceRoot = process.env.SCIENTIFIC_INTERPRETATION_EVIDENCE_DIR?.trim() || join("/tmp", "noxia-scientific-interpretation");
  const evidenceStore = new FileScientificInterpretationEvidenceStore(evidenceRoot);
  const mode = configuredMode();
  let nativeExecution: Awaited<ReturnType<GeminiHybridScientificInterpretationProvider["execute"]>> | null = null;

  const hybridRuntime: ScientificInterpretationRuntime = apiKey && model
    ? new HybridScientificInterpretationRuntimeAdapter(
      HYBRID_PRIMARY_RUNTIME_ID,
      HYBRID_PRIMARY_RUNTIME_VERSION,
      async (conversation, previousState) => {
        const provider = new GeminiHybridScientificInterpretationProvider({ apiKey, model, temperature: 0, maxAttempts: 2 });
        nativeExecution = await provider.execute(conversation, previousState);
        return nativeExecution;
      },
      evidenceStore,
      parseHybridPrimaryProviderOutput,
    )
    : {
      runtimeId: HYBRID_PRIMARY_RUNTIME_ID,
      runtimeVersion: HYBRID_PRIMARY_RUNTIME_VERSION,
      interpret: async () => { throw new ScientificInterpretationTechnicalError("HYBRID_RUNTIME_UNAVAILABLE", "HYBRID_PROVIDER_CONFIGURATION_MISSING"); },
    };

  const legacyRuntime: ScientificInterpretationRuntime = {
    runtimeId: "LEGACY_SEM_FULL",
    runtimeVersion: "1.1",
    interpret: async (conversation) => {
      const { executeLegacySemRollback } = await import("./scientific-interpretation-legacy-rollback.js");
      return executeLegacySemRollback({ conversation, apiKey, model });
    },
  };

  const result = await processScientificInterpretationHttp(
    { method: request.method, headers: request.headers, body: request.body, ip: request.socket?.remoteAddress },
    {
      mode,
      execute: async (parsed) => {
        const execution = await executeScientificInterpretation({
          conversation: parsed.conversation,
          previousState: parsed.previousContribution,
          mode,
          hybridRuntime,
          legacyRuntime,
        });
        const rawOutputRef = execution.fallback?.rawOutputRef
          ?? (execution.activeContribution.identity.runtimeId === HYBRID_PRIMARY_RUNTIME_ID ? execution.activeContribution.source.rawOutputRef : null);
        if (nativeExecution) {
          await evidenceStore.appendProviderLedger({
            operationId: nativeExecution.operationId,
            runtimeId: nativeExecution.runtimeId,
            runtimeVersion: nativeExecution.runtimeVersion,
            provider: nativeExecution.provider,
            model: nativeExecution.model,
            configurationDigest: nativeExecution.configurationDigest,
            rawOutputRef,
            rawOutputDigest: execution.activeContribution.identity.runtimeId === HYBRID_PRIMARY_RUNTIME_ID ? execution.activeContribution.source.rawOutputDigest : null,
            attempts: nativeExecution.providerAttempts,
            finalDisposition: execution.fallbackUsed ? `FALLBACK:${execution.fallback?.failureClass}` : "HYBRID_CONTRIBUTION",
          });
        }
        return execution;
      },
    },
  );
  Object.entries(result.headers).forEach(([name, value]) => response.setHeader(name, value));
  response.status(result.status).json(result.body);
};

export default handleScientificInterpretation;
