import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { logicalDigest } from "../../src/features/knowledge-engine/canonical";
import { adversarialExtractionContext, adversarialDeltaResponse, type AdversarialSemanticDelta } from "../protocol-designer-v1-autonomous-adversarial-stabilization-01/provider-transport";
import { createRepairOfflineProvider } from "../protocol-designer-v1-multi-scenario-live-causal-repair-01/offline-provider";
import { createLongHorizonProviderReplay, replayJsonResponse, type ProviderCallWitness } from "../../src/features/protocol-designer/functional-reset/__tests__/fixtures/long-horizon-provider-replay";

export const demoTurns = JSON.parse(readFileSync(resolve("validation/protocol-designer-v1-product-closure-and-demo-readiness-01/demo-scenarios.json"), "utf8")).turns as Array<{
  id: string; text: string; decision: string; semanticDelta?: AdversarialSemanticDelta[]; recordedRepairScenario?: string;
}>;

export const createClosureOfflineProvider = (witnesses: ProviderCallWitness[]) => {
  const how = createLongHorizonProviderReplay(witnesses, { how: "SUCCESS" });
  const recordedNeuro = createRepairOfflineProvider(witnesses);
  const seen = new Set<string>();
  return (async (resource: string | URL | Request, init?: RequestInit) => {
    const endpoint = String(resource);
    if (endpoint.startsWith("https://generativelanguage.googleapis.com/")) return how(resource, init);
    if (endpoint !== "https://api.openai.com/v1/responses" || typeof init?.body !== "string") throw new Error("CLOSURE_OFFLINE_TRANSPORT_ONLY");
    const body = JSON.parse(init.body);
    const context = adversarialExtractionContext(body);
    const turn = demoTurns.find((t) => t.text === context.sourceText);
    if (!turn) throw new Error("CLOSURE_UNFROZEN_SCIENTIFIC_INPUT");
    const identity = `${context.sourceTurnRef}:${turn.id}`;
    if (seen.has(identity)) throw new Error("CLOSURE_SINGLE_ATTEMPT_EXCEEDED");
    seen.add(identity);
    if (turn.recordedRepairScenario) return recordedNeuro(resource, init);
    // A range adopted through the existing owner is represented by two
    // current bound objects. Rebind the unchanged frozen range to both exact
    // current identities; this changes transport shape, not scenario meaning.
    const deltas = (turn.semanticDelta ?? []).flatMap((delta) => {
      const targets = context.currentProject?.objects.filter((o) => o.sourceItemRefs.includes(delta.key)) ?? [];
      if (delta.operation !== "REPLACE" || targets.length !== 2 || delta.type !== "ELIGIBILITY_CRITERION") return [delta];
      const range = delta.content.match(/^Âge de (\d+) à (\d+) ans$/u);
      const minimum = targets.find((o) => /^Âge minimal :/u.test(o.content));
      const maximum = targets.find((o) => /^Âge maximal :/u.test(o.content));
      if (!range || !minimum || !maximum) throw new Error("CLOSURE_BOUND_RANGE_REBIND_AMBIGUOUS");
      return [{ ...delta, key: minimum.stableId, content: `Âge minimal : ${range[1]} ans` },
        { ...delta, key: maximum.stableId, content: `Âge maximal : ${range[2]} ans` }];
    });
    const output = adversarialDeltaResponse(context, { id: turn.id, semanticDelta: deltas });
    const response = { id: `synthetic:${identity}`, model: body.model, status: "completed", output_text: JSON.stringify(output), usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 } };
    witnesses.push({ endpoint, turnText: context.sourceText, requestDigest: logicalDigest({ endpoint, body }), requestBody: body, responseBody: response, responseStatus: 200, provenance: "SYNTHETIC_CONTRACT_FIXTURE" });
    return replayJsonResponse(response);
  }) as typeof fetch;
};
