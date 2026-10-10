import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { prepareWorkingDraftRequest } from "../continuous-project-build";
import { compactRetainedMeaningProviderContext, type ScientificDiscussionContext } from "../contribution-discussion-context";
import type { ProductBridgeRequest } from "../../product-bridge";
import { declaredNonScientificDiscussionFixture } from "./terra-result-fixture";

const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;
type Meaning = NonNullable<ScientificDiscussionContext["retainedMeaning"]>[number];
const elements = (): Meaning[] => Array.from({ length: 61 }, (_, index) => ({
  ref: `retained:synthetic-${index}`, sourceTurnRef: `user:synthetic-${index % 6}`,
  sourceDigest: logicalDigest(`source-${index % 6}`),
  content: `Condition scientifique synthétique ${index} : conserver la négation et l'incertitude, sans adoption.`,
  epistemicState: index % 2 ? "OPEN_UNKNOWN" : "PROPOSED_NOT_ADOPTED", polarity: index % 2 ? "NEGATED" : "CONDITIONAL",
  conditions: ["Sans décision humaine, ce contenu reste non adopté."],
  linkedRefs: index ? [`retained:synthetic-${index - 1}`] : [], status: "NOT_ADOPTED",
}));
const decode = (wire: ReturnType<typeof compactRetainedMeaningProviderContext>) => "retainedMeaningTable" in wire
  ? wire.retainedMeaningTable.rows.map(row => Object.fromEntries(wire.retainedMeaningTable.fields.map((field, index) => [field, row[index]])))
  : wire.retainedMeaning;

describe("lossless retained-meaning provider wire projection", () => {
  it("preserves every native value, reference, condition, polarity and source in the real 61-element envelope", () => {
    const source = elements(), before = logicalDigest(source), wire = compactRetainedMeaningProviderContext(source);
    expect("retainedMeaningTable" in wire).toBe(true);
    expect(decode(wire)).toEqual(source);
    expect(bytes(wire)).toBeLessThan(bytes({ retainedMeaning: source }) - 1_500);
    expect(logicalDigest(source)).toBe(before);
    expect(decode(wire).every(e => e.status === "NOT_ADOPTED")).toBe(true);
  });

  it("keeps empty and small existing provider shapes unchanged", () => {
    expect(compactRetainedMeaningProviderContext([])).toEqual({ retainedMeaning: [] });
    const small = elements().slice(0, 2);
    expect(compactRetainedMeaningProviderContext(small)).toEqual({ retainedMeaning: small });
  });

  it("recovers the observed 81,763-byte failure without dropping science or raising the 80,000-byte gate", () => {
    const request: ProductBridgeRequest = { apiVersion: "1.0.0", currentProject: null, evaluatePersistentDelta: false,
      prepareWorkingDraft: true, conversation: { conversationId: "synthetic-retained-envelope", language: "fr",
        turns: [{ turnId: "user:current", role: "USER", content: "Composition scientifique synthétique, sans autorisation d'adoption." }] } };
    request.scientificDiscussionContext = { ...declaredNonScientificDiscussionFixture(request), retainedMeaning: elements() };
    const initial = JSON.parse(prepareTerraConversation(request).context);
    const uncompressed = { ...initial, CURRENT_DISCUSSION: { ...initial.CURRENT_DISCUSSION,
      retainedMeaning: request.scientificDiscussionContext.retainedMeaning } };
    delete uncompressed.CURRENT_DISCUSSION.retainedMeaningTable;
    delete uncompressed.CURRENT_DISCUSSION.retainedMeaningReferenceBasis;
    const target = 81_763;
    const padding = "x".repeat(target - bytes(uncompressed));
    request.conversation.turns[0].content += padding;
    const before = logicalDigest(request);
    const current = JSON.parse(prepareTerraConversation(request).context);
    const conceptualBefore = { ...current, CURRENT_DISCUSSION: { ...current.CURRENT_DISCUSSION,
      retainedMeaning: request.scientificDiscussionContext.retainedMeaning } };
    delete conceptualBefore.CURRENT_DISCUSSION.retainedMeaningTable;
    delete conceptualBefore.CURRENT_DISCUSSION.retainedMeaningReferenceBasis;
    expect(bytes(conceptualBefore)).toBe(target);
    expect(bytes(current)).toBeLessThan(80_000);
    expect(decode(current.CURRENT_DISCUSSION)).toEqual(request.scientificDiscussionContext.retainedMeaning);
    const working = JSON.parse(prepareWorkingDraftRequest(request).context);
    expect(decode(working.CURRENT_DISCUSSION)).toEqual(request.scientificDiscussionContext.retainedMeaning);
    expect(logicalDigest(request)).toBe(before);
    request.conversation.turns[0].content += "x".repeat(10_000);
    expect(() => prepareTerraConversation(request)).toThrow("CONVERSATION_MEMORY_LIMIT");
  });
});
