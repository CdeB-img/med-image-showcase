import { describe, expect, it, vi, afterEach } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { buildProjectContextSnapshot } from "@/features/research-project-construction/canonical-project-backbone";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation/functional-reset-progression";
import { currentGovernedNavigationInput } from "@/features/query-navigation/current-navigation-evidence";
import type { ProductBridgeRequest } from "../../product-bridge";
import type { ConversationContextPacketPreflight } from "../../provider-call-observability";
import { richStudyContribution, behaviorContribution, adoptBehaviorContribution, behaviorItem, behaviorTurn } from "./p1-behavior-01a-contract-fixtures";
import { createFunctionalResetSession } from "../session";
import { buildScientificDiscussionContext } from "../contribution-discussion-context";
import { retainScientificDiscussionResult, type ScientificDiscussionRetention } from "../contribution-discussion-retention";
import { retainValidatedContributionCandidate, markContributionCandidatePresented } from "../contribution-lifecycle";
const at = "2026-10-04T12:00:00.000Z";
const trajectory = (additions: boolean, count: number) => {
  let contribution = richStudyContribution();
  let project = adoptBehaviorContribution(contribution, null, 1);
  const versions = [project];
  for (let revision = 2; revision <= count; revision++) {
    const before = logicalDigest(project);
    const old = contribution.scientificContent.candidateObjects.find(i => i.semanticIdentity === "measurement:z" && i.epistemicBoundary.activeState)!;
    const turnId = `version-${revision}`;
    const value = revision % 2 ? "mesure ZA" : "mesure ZB";
    const source = behaviorTurn(turnId, `Remplacer ${old.content} par ${value}.`);
    const replacement = behaviorItem({ itemId: `measurement-${revision}`, semanticIdentity: "measurement:z", proposedType: "MEASUREMENT",
      content: value, turnId, previousItemIds: [old.itemId] });
    const extra = additions ? [0, 1].map(index => behaviorItem({ itemId: `new-${revision}-${index}`, proposedType: "PROJECT_INFORMATION",
      content: `Condition de contrôle ${revision}.${index} : conserver la traçabilité sans nouveau résultat.`, turnId })) : [];
    const next = behaviorContribution({ contributionId: `version-${additions}-${revision}`, previousContributionId: contribution.identity.contributionId,
      turns: [...contribution.source.turns, source], candidateObjects: contribution.scientificContent.candidateObjects.map(i => i.itemId === old.itemId
        ? { ...i, epistemicBoundary: { ...i.epistemicBoundary, activeState: false } } : i).concat(replacement, ...extra),
      temporalElements: contribution.scientificContent.temporalElements, relations: contribution.scientificContent.candidateRelations,
      corrections: [behaviorItem({ itemId: `replace-${revision}`, semanticIdentity: "measurement:z:replacement", proposedType: "MEASUREMENT",
        content: `remplacer ${old.content} par ${value}`, turnId, previousItemIds: [old.itemId] })] });
    const candidate = prepareResearchProjectContributionCandidate(next, project);
    expect(candidate.canonicalChangeSet.conflicts).toHaveLength(0);
    expect(candidate.humanReviewProjection.status).toBe("COMPLETE");
    const adopted = adoptBehaviorContribution(next, project, revision);
    expect(logicalDigest(project)).toBe(before);
    contribution = next; project = adopted; versions.push(project);
  }
  return versions;
};
const recent = () => Array.from({ length: 10 }, (_, i) => ({ turnId: `current-${i}`, role: i % 2 ? "USER" as const : "NOXIA" as const,
  content: "Échange courant synthétique de qualification.", createdAt: at }));
const request = (project: ProductBridgeRequest["currentProject"]): ProductBridgeRequest => ({
  apiVersion: "1.0.0", conversation: { conversationId: "conversation:p1-behavior-01a", language: "fr", turns: recent() },
  currentProject: project, evaluatePersistentDelta: false,
  ...(project ? { currentNavigation: currentGovernedNavigationInput({ project,
    navigation: buildFunctionalResetQueryNavigation({ project, recordedAt: at }) }) } : {}),
});
afterEach(() => vi.unstubAllGlobals());
describe("M3 current-only Project / active QRY / pending Review envelope", () => {
  it("V1→V20→V50 native adoption preserves history without sending historical versions", () => {
    const versions = trajectory(false, 50);
    const size = (project: typeof versions[number]) => new TextEncoder().encode(prepareTerraConversation(request(project)).context).length;
    // V1's original value is one byte shorter; version identity may also grow.
    const sizes = [size(versions[0]), size(versions[19]), size(versions[49])];
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThan(20);
    const p = JSON.parse(prepareTerraConversation(request(versions[49])).context);
    expect(p.CURRENT_PROJECT.decisions).toHaveLength(buildProjectContextSnapshot({ project: versions[49] }).objects.length);
    expect(p.CURRENT_PROJECT.historicalObjectVersions).toBeUndefined();
    expect(versions[49].canonicalState!.objects.length).toBeGreaterThan(versions[0].canonicalState!.objects.length);
    expect(p.QRY).toBeTruthy();
    console.info("M3_PROJECT_VERSION_PACKET_BYTES=" + JSON.stringify({ V1: sizes[0], V20: sizes[1], V50: sizes[2] }));
  });
  it("a growing current V20 fits the unchanged 80k packet, independent of DOC generations/raw provider artifacts", () => {
    const project = trajectory(true, 20)[19];
    const r = request(project); let measurement: ConversationContextPacketPreflight | undefined;
    const before = logicalDigest(r);
    const prepared = prepareTerraConversation(r, false, m => { measurement = m; });
    expect(measurement!.packetTotalBytes).toBeLessThan(80000);
    expect(logicalDigest(r)).toBe(before);
    const session = createFunctionalResetSession(at); session.project = project;
    const direct = prepareTerraConversation(r).context;
    for (const count of [1, 20, 100]) {
      const withUnconsumedArtifacts = Object.assign(structuredClone(r), { documents: Array.from({ length: count }, () => "DOC_RAW_SENTINEL".repeat(1000)),
        providerArtifact: "RAW_PROVIDER_SENTINEL".repeat(1000), historicalVersions: session });
      expect(prepareTerraConversation(withUnconsumedArtifacts).context).toBe(direct);
    }
    console.info("M3_V20_CONTEXT_PARTS=" + JSON.stringify({ total: measurement!.packetTotalBytes,
      recent: measurement!.conversationHistoryBytes + measurement!.currentUserMessageBytes,
      project: measurement!.projectContextBytes, discussion: measurement!.discussionContextBytes,
      review: measurement!.workingStudyProposalBytes, qry: measurement!.qryContextBytes, documentGrowth: 0 }));
  });
  it("old pending native Review and QRY remain available beside a partially represented source residual", () => {
    const network = vi.fn(() => { throw new Error("FORBIDDEN"); }); vi.stubGlobal("fetch", network);
    const project = trajectory(false, 2)[1], conversationId = "conversation:p1-behavior-01a";
    const turns: ProductBridgeRequest["conversation"]["turns"] = [];
    let retention: ScientificDiscussionRetention | undefined;
    for (let i = 0; i < 8; i++) {
      const user = behaviorTurn(`history-${i}`, i ? "Merci." : "Un contrôle indépendant et une condition encore ouverte.");
      const assistant = { turnId: `response-${i}`, role: "NOXIA" as const, content: "Réponse.", createdAt: at };
      turns.push(user, assistant);
      retention = retainScientificDiscussionResult({ state: retention, conversationId, runtimeTurns: turns, userTurn: user, assistantTurn: assistant,
        retained: [], result: { reply: assistant.content, userContribution: i ? { coverage: "COMPLETE", nonPersistentReason: "NO_SCIENTIFIC_MEANING", elements: [] }
          : { coverage: "COMPLETE", nonPersistentReason: null, elements: [{ id: "residual", content: "Condition encore ouverte.", epistemicState: "OPEN_UNKNOWN", polarity: "CONDITIONAL", conditions: ["Non précisée"], linkedIds: [] }] },
          assistantContribution: { coverage: "COMPLETE", nonPersistentReason: "NO_SCIENTIFIC_MEANING", elements: [] }, dispositions: [], candidateBindings: [] } });
    }
    const source = turns[0];
    const contribution = behaviorContribution({ contributionId: "pending-review", turns: [source], candidateObjects: [
      behaviorItem({ itemId: "control", proposedType: "PROJECT_INFORMATION", content: "Contrôle indépendant.", turnId: source.turnId })] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    const retained = markContributionCandidatePresented({ retained: retainValidatedContributionCandidate({ retained: [], contribution, candidate,
      validation: { valid: true, blocks: [] }, validatorRef: "PRJ_NATIVE", sourceTurnRef: source.turnId, baseProject: project,
      dependencyBindings: [], traceRunId: null, retainedAt: at }), candidateRef: candidate.contributionRef, presentedAt: at });
    const r = request(project); r.conversation.turns = turns;
    r.scientificDiscussionContext = buildScientificDiscussionContext({ retained, retention, currentProject: project, conversationId, runtimeTurns: turns });
    const packet = JSON.parse(prepareTerraConversation(r).context);
    expect(packet.CURRENT_DISCUSSION.active.some(e => e.content === "Contrôle indépendant.")).toBe(true);
    expect(packet.CURRENT_DISCUSSION.retainedMeaning.some(e => e.content === "Condition encore ouverte.")).toBe(true);
    expect(packet.CURRENT_DISCUSSION.sources.every(s => s.sourceText === null)).toBe(true);
    expect(packet.QRY).toBeTruthy();
    expect(candidate.humanReviewProjection.status).toBe("COMPLETE");
    expect(network).not.toHaveBeenCalled();
  });
});
