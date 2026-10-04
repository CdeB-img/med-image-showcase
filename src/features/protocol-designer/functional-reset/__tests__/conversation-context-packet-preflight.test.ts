import { afterEach, describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { acceptContextualStudyProposal } from "@/features/scientific-thinking/contextual-study-proposal";
import { buildCurrentTurnNavigation } from "@/features/query-navigation/current-turn-navigation";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { PRODUCT_BRIDGE_API_VERSION, type ProductBridgeRequest, type ProductBridgeResponse } from "../../product-bridge";
import { CONVERSATION_CONTEXT_PACKET_NUMERIC_FIELDS, providerCallRequestObservability,
  readConversationContextPacketPreflight, type ConversationContextPacketPreflight } from "../../provider-call-observability";
import { adoptBehaviorContribution, richStudyContribution } from "./p1-behavior-01a-contract-fixtures";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
import { declaredNonScientificDiscussionFixture } from "./terra-result-fixture";

// Synthetic inputs only; fetch is forbidden unless explicitly replaced by a mock.
const forbiddenProvider = vi.fn(() => { throw new Error("NO_PROVIDER_IN_BYTE_ATTRIBUTION_TEST"); });
const requestFor = (content = "LOCAL_SYNTHETIC — question é 🧪") : ProductBridgeRequest => ({
  apiVersion: PRODUCT_BRIDGE_API_VERSION,
  conversation: { conversationId: "synthetic-byte-attribution", language: "fr",
    turns: [{ turnId: "synthetic-current", role: "USER", content }] },
  currentProject: null, evaluatePersistentDelta: false,
});
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;
const fieldBytes = (key: string, value: unknown) => bytes(key) + 1 + bytes(value);
const measure = (request: ProductBridgeRequest, autonomous = false) => {
  const receipts: ConversationContextPacketPreflight[] = [];
  const prepared = prepareTerraConversation(request, autonomous, receipt => receipts.push(receipt));
  expect(receipts).toHaveLength(1);
  return { prepared, packet: JSON.parse(prepared.context), receipt: receipts[0] };
};
const expectPartition = (receipt: ConversationContextPacketPreflight) => {
  expect(receipt.systemContextBytes + receipt.currentUserMessageBytes + receipt.conversationHistoryBytes
    + receipt.projectContextBytes + receipt.qryContextBytes + receipt.specializedOwnerContextBytes + receipt.otherContextBytes)
    .toBe(receipt.packetTotalBytes);
  expect(receipt.userHistoryBytes + receipt.assistantHistoryBytes).toBe(receipt.conversationHistoryBytes);
  expect(receipt.projectObjectsBytes + receipt.projectRelationsBytes + receipt.projectTemporalQualificationsBytes
    + receipt.projectOpenPointsBytes + receipt.projectOtherBytes).toBe(receipt.projectContextBytes);
  expect(receipt.workingStudyProposalBytes + receipt.workingNextActionBytes
    + receipt.discussionContextBytes + receipt.openDecisionsBytes).toBe(receipt.specializedOwnerContextBytes);
};
afterEach(() => { expect(forbiddenProvider).not.toHaveBeenCalled(); forbiddenProvider.mockClear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("passive conversation packet UTF-8 accounting", () => {
  it("keeps packet, instructions and digest identical; no compaction or content mutation", () => {
    const request = requestFor();
    const before = JSON.stringify(request);
    const original = prepareTerraConversation(request);
    const { prepared, receipt, packet } = measure(request);
    expect(prepared).toEqual(original);
    expect(prepared.contextDigest).toBe(logicalDigest(packet));
    expect(packet.RECENT_CONVERSATION).toEqual(request.conversation.turns.map(t => ({ ref: t.turnId, role: t.role, content: t.content })));
    expect(JSON.stringify(request)).toBe(before);
    expect(receipt).toMatchObject({ status: "SUCCEEDED", limitBytes: 80_000, includedTurnCount: 1,
      oldestIncludedTurnIndex: 0, newestIncludedTurnIndex: 0, largestSingleTurnRole: "USER" });
    expect(receipt.packetTotalBytes).toBe(new TextEncoder().encode(prepared.context).length);
    expectPartition(receipt);
  });

  it("accounts exact JSON escaping and UTF-8, not character count", () => {
    const request = requestFor('LOCAL_SYNTHETIC é🧪 "cité"\n\\chemin');
    const { prepared, receipt, packet } = measure(request);
    expect(receipt.packetTotalBytes).toBeGreaterThan(prepared.context.length);
    expect(receipt.currentUserMessageBytes).toBe(bytes(packet.RECENT_CONVERSATION[0]));
    expect(receipt.systemContextBytes).toBe(fieldBytes("HISTORY_POLICY", packet.HISTORY_POLICY) + fieldBytes("coverage", packet.coverage));
    expectPartition(receipt);
  });

  it("accounts only the recent window once older technical sources have explicit non-scientific disposition", () => {
    const request = requestFor();
    request.conversation.turns = Array.from({ length: 40 }, (_, i) => ({ turnId: `synthetic-${i}`,
      role: i % 2 ? "NOXIA" : "USER", content: `LOCAL_SYNTHETIC-${i} — é🧪 `.repeat(i === 7 ? 150 : 25) }));
    request.scientificDiscussionContext = declaredNonScientificDiscussionFixture(request);
    const before = JSON.stringify(request);
    const { packet, receipt } = measure(request);
    const included = packet.RECENT_CONVERSATION;
    const turnSizes = included.map(bytes) as number[];
    expect(packet.RECENT_CONVERSATION).toHaveLength(10);
    expect(packet.UNPROJECTED_USER_CONTEXT).toBeUndefined();
    const currentIndex = included.findIndex(t => t.ref === "synthetic-38");
    expect(receipt).toMatchObject({ conversationTurnCount: 40, userTurnCount: 20, assistantTurnCount: 20,
      includedTurnCount: 10, oldestIncludedTurnIndex: 30, newestIncludedTurnIndex: 39,
      largestSingleTurnRole: "NOXIA", currentUserMessageBytes: turnSizes[currentIndex] });
    expect(receipt.userHistoryBytes).toBe(turnSizes.reduce((sum, n, i) => sum + (included[i].role === "USER" && i !== currentIndex ? n : 0), 0));
    expect(receipt.assistantHistoryBytes).toBe(turnSizes.reduce((sum, n, i) => sum + (included[i].role === "NOXIA" ? n : 0), 0));
    expect(JSON.stringify(request)).toBe(before);
    expectPartition(receipt);
  });

  it("handles an empty turn list without inventing indices, content or roles", () => {
    const request = requestFor(); request.conversation.turns = [];
    const { receipt } = measure(request);
    expect(receipt).toMatchObject({ includedTurnCount: 0, oldestIncludedTurnIndex: -1, newestIncludedTurnIndex: -1,
      largestSingleTurnBytes: 0, largestSingleTurnRole: null, currentUserMessageBytes: 0, conversationHistoryBytes: 0 });
    expect(readConversationContextPacketPreflight(receipt)).toEqual(receipt);
    expectPartition(receipt);
  });

  it.each([80_000, 80_001])("preserves the exact inclusive 80,000-byte gate at %i bytes", target => {
    const request = requestFor("");
    const baseline = new TextEncoder().encode(prepareTerraConversation(request).context).length;
    request.conversation.turns[0].content = "x".repeat(target - baseline);
    const observe = vi.fn();
    if (target === 80_000) expect(() => prepareTerraConversation(request, false, observe)).not.toThrow();
    else expect(() => prepareTerraConversation(request, false, observe)).toThrow("CONVERSATION_MEMORY_LIMIT");
    expect(observe).toHaveBeenCalledTimes(1);
    const receipt = observe.mock.calls[0][0] as ConversationContextPacketPreflight;
    expect(receipt).toMatchObject({ packetTotalBytes: target, limitBytes: 80_000, status: target > 80_000 ? "FAILED" : "SUCCEEDED" });
    expectPartition(receipt);
  });

  it("measures large current Project fragments without changing its snapshot or adopted state", () => {
    const request = requestFor();
    request.currentProject = adoptBehaviorContribution(richStudyContribution(), null, 1);
    request.currentProject.canonicalState!.objects.forEach(o => { o.content += " LOCAL_SYNTHETIC_PROJECT é🧪".repeat(70); });
    const before = JSON.stringify(request);
    const { packet, receipt, prepared } = measure(request);
    expect(prepared).toEqual(prepareTerraConversation(request));
    expect(receipt.projectContextBytes).toBe(fieldBytes("CURRENT_PROJECT", packet.CURRENT_PROJECT));
    expect(receipt.projectContextBytes).toBeGreaterThan(receipt.conversationHistoryBytes + receipt.currentUserMessageBytes);
    expect(receipt).toMatchObject({ projectObjectCount: packet.CURRENT_PROJECT.decisions.length,
      projectRelationCount: packet.CURRENT_PROJECT.relations.length, projectOpenPointCount: packet.CURRENT_PROJECT.openIssues.length,
      projectObjectsBytes: fieldBytes("decisions", packet.CURRENT_PROJECT.decisions),
      projectRelationsBytes: fieldBytes("relations", packet.CURRENT_PROJECT.relations),
      projectTemporalQualificationsBytes: fieldBytes("temporalQualifications", packet.CURRENT_PROJECT.temporalQualifications),
      projectOpenPointsBytes: fieldBytes("openIssues", packet.CURRENT_PROJECT.openIssues) });
    expect(JSON.stringify(request)).toBe(before);
    expectPartition(receipt);
  });

  it("attributes the existing Working Draft and open decisions without changing their contents", () => {
    const request = requestFor(DOMAINS[4].text);
    request.conversation.turns.push({ turnId: "synthetic-proposal", role: "NOXIA", content: "LOCAL_SYNTHETIC — proposal" });
    request.studyProposalContext = acceptContextualStudyProposal(controlledStudyProposal("synthetic-context", DOMAINS[4]), {
      contextDigest: "synthetic-context", sourceTurnRef: request.conversation.turns[0].turnId,
      sourceResponseRef: "synthetic-proposal", sourceProject: null, applicableEvidenceRefs: [],
    });
    const before = JSON.stringify(request);
    const { prepared, packet, receipt } = measure(request, true);
    expect(prepared).toEqual(prepareTerraConversation(request, true));
    expect(receipt.workingStudyProposalBytes).toBe(fieldBytes("WORKING_STUDY_PROPOSAL", packet.WORKING_STUDY_PROPOSAL));
    expect(receipt.workingNextActionBytes).toBe(fieldBytes("WORKING_NEXT_ACTION", packet.WORKING_NEXT_ACTION));
    expect(receipt.openDecisionsBytes).toBe(fieldBytes("OPEN_DECISIONS", packet.OPEN_DECISIONS));
    expect(JSON.stringify(request)).toBe(before);
    expectPartition(receipt);
  });

  it("attributes the existing selected QRY projection and native need refs", () => {
    const contribution = richStudyContribution();
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    const navigation = buildCurrentTurnNavigation({ sourceTurnRef: contribution.source.turns[0].turnId,
      sourceText: contribution.source.turns[0].content, contribution, candidate, validation: null, currentProject: null });
    const selected = navigation.selection.selected!;
    expect(selected).toBeTruthy();
    const request = requestFor();
    request.currentNavigation = { projectId: "synthetic-project", projectVersion: "synthetic-v1", projectDigest: "synthetic-digest",
      selectedActionRef: selected.candidateId, sourceStateDigest: navigation.contextDigest, selected,
      authorizedContent: [], alreadyProvidedInformationRefs: [] };
    const before = JSON.stringify(request);
    const { packet, receipt } = measure(request);
    expect(receipt.qryContextBytes).toBe(fieldBytes("QRY", packet.QRY));
    expect(receipt.qryNeedCount).toBe(new Set(selected.navigationNeedRefs).size);
    expect(JSON.stringify(request)).toBe(before);
    expectPartition(receipt);
  });

  it("preserves accounting in the bridge after oversize rejection, with zero provider calls and zero writes", async () => {
    vi.stubGlobal("fetch", forbiddenProvider);
    const request = requestFor("LOCAL_SYNTHETIC_CURRENT");
    request.currentProject = adoptBehaviorContribution(richStudyContribution(), null, 1);
    request.conversation.turns.unshift(...Array.from({ length: 24 }, (_, i) => ({ turnId: `synthetic-history-${i}`,
      role: "NOXIA" as const, content: "LOCAL_SYNTHETIC_HISTORY é🧪".repeat(400) })));
    request.scientificDiscussionContext = declaredNonScientificDiscussionFixture(request);
    const before = JSON.stringify(request);
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: null, openAiApiKey: "LOCAL_SYNTHETIC_KEY",
      chatRuntime: "TERRA", fetchImpl: forbiddenProvider, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
    const body = result.body as ProductBridgeResponse;
    expect(result.status).toBe(200);
    expect(body.conversationFailure?.code).toBe("CONVERSATION_MEMORY_LIMIT");
    expect(body.observability).toMatchObject({ calls: 0, conversationCalls: 0, projectWrites: 0, providerCalls: [] });
    expect(body.persistentExtraction.called).toBe(false);
    expect(body.observability.conversationContextPacketPreflight?.status).toBe("FAILED");
    expect(body.observability.conversationContextPacketPreflight!.conversationHistoryBytes).toBeGreaterThan(80_000);
    expectPartition(body.observability.conversationContextPacketPreflight!);
    expect(body.scientificConversation).toBeUndefined();
    expect(JSON.stringify(request)).toBe(before);
  });

  it("does not copy scientific text, identifiers or secrets into byte diagnostics", () => {
    const request = requestFor("LOCAL_SYNTHETIC_SCIENTIFIC_SENTINEL Authorization: Bearer FAKE_DIAGNOSTIC_SECRET");
    request.conversation.turns[0].turnId = "LOCAL_SYNTHETIC_PRIVATE_REF";
    const { receipt } = measure(request);
    const serialized = JSON.stringify(providerCallRequestObservability([], receipt));
    for (const fragment of ["SCIENTIFIC_SENTINEL", "Authorization", "FAKE_DIAGNOSTIC_SECRET", "PRIVATE_REF", "content", "instruction"]) {
      expect(serialized).not.toContain(fragment);
    }
    expect(Object.keys(receipt).sort()).toEqual([...CONVERSATION_CONTEXT_PACKET_NUMERIC_FIELDS, "status", "largestSingleTurnRole"].sort());
  });

  it("allowlists diagnostics before TRACE and discards extra text and secrets", () => {
    const { receipt } = measure(requestFor());
    expect(readConversationContextPacketPreflight({ ...receipt, content: "SCIENTIFIC_SENTINEL", apiKey: "FAKE_SECRET" })).toEqual(receipt);
    expect(readConversationContextPacketPreflight({ ...receipt, packetTotalBytes: NaN })).toBeNull();
    expect(readConversationContextPacketPreflight({ ...receipt, status: "FAILED" })).toBeNull();
    expect(readConversationContextPacketPreflight({ ...receipt, limitBytes: 100_000 })).toBeNull();
    expect(readConversationContextPacketPreflight({ get status() { throw new Error("LOCAL_SYNTHETIC_OBSERVER_FAILURE"); } })).toBeNull();
  });

  it("an observer exception neither blocks an admitted packet nor replaces the original oversize failure", () => {
    const request = requestFor();
    const observer = vi.fn(() => { throw new Error("LOCAL_SYNTHETIC_OBSERVER_FAILURE"); });
    expect(prepareTerraConversation(request, false, observer)).toEqual(prepareTerraConversation(request));
    request.conversation.turns[0].content = "x".repeat(80_001);
    expect(() => prepareTerraConversation(request, false, observer)).toThrow("CONVERSATION_MEMORY_LIMIT");
    expect(observer).toHaveBeenCalledTimes(2);
  });
});
