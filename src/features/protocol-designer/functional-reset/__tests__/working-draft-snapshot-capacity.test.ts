import { describe, expect, it, vi } from "vitest";
import Ajv from "ajv";
import { Tiktoken } from "js-tiktoken/lite";
import o200kBase from "js-tiktoken/ranks/o200k_base";
import { contextualStudyProposalSchema, assertStudyProposalOptionBindings } from "@/features/scientific-thinking/contextual-study-proposal";
import { STUDY_PROPOSAL_CAPACITY } from "@/features/scientific-thinking/study-proposal-capacity";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { buildOpenAITerraConversationPayload } from "../../../../../api/protocol-designer-openai-extraction-provider";
import { boundPublicProviderCall } from "../../../../../server/protocol-designer-local-token-admission";
import { boundCanaryProviderCall, canaryBudgetAdmission, settleCanaryProviderCall } from "../../../../../server/protocol-designer-canary-policy";
import { durableGuardPublicBudget } from "../../../../../server/protocol-designer-durable-guard";
import { parseProductBridgeRequest, type ProductBridgeRequest } from "../../product-bridge";
import { acceptWorkingDraftUpdate, prepareWorkingDraftRequest, workingDraftProviderSchema, type WorkingDraftUpdate } from "../continuous-project-build";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
import { realStudyUpdateClosure } from "./fixtures/study-update-closure-real-run";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { preflightStudyProposalCapacity } from "@/features/scientific-thinking/study-proposal-capacity";

// Existing deterministic scientific fixture, never a new provider experiment.
const requestFor = (): ProductBridgeRequest => ({ apiVersion: "1.0.0", currentProject: null,
  evaluatePersistentDelta: false, prepareWorkingDraft: true,
  workingDraftScientificSource: { kind: "BOUND_USER_TURN", sourceUserTurnId: "u1", sourceResponseTurnId: "a1",
    sourceDigest: logicalDigest(DOMAINS[0].text) },
  conversation: { conversationId: "LOCAL_SYNTHETIC_CAPACITY", language: "fr", turns: [
    { turnId: "u1", role: "USER", content: DOMAINS[0].text },
    { turnId: "a1", role: "NOXIA", content: "LOCAL_SYNTHETIC — proposition non adoptée." },
  ] },
});
const extendTo = (update: WorkingDraftUpdate, count: number) => {
  const template = update.proposal!.atoms.find(atom => atom.status === "OPEN_DECISION")!;
  while (update.proposal!.atoms.length < count) {
    const ref = `capacity-open-${update.proposal!.atoms.length}`;
    update.proposal!.atoms.push({ ...structuredClone(template), ref, semanticKey: ref, dependsOn: [],
      dependencyQualifications: [], content: `LOCAL_SYNTHETIC — précision ${ref} non décidée.` });
  }
  return update;
};
const updateFor = (request: ProductBridgeRequest, count = 53): WorkingDraftUpdate => extendTo({
  requestType: "STUDY_UPDATE", proposal: controlledStudyProposal(prepareWorkingDraftRequest(request).inputDigest),
  explicitDecisions: [{ atomRef: "design", sourceTurnRef: "u1", quote: DOMAINS[0].text }],
  inferredAtomRefs: [], rejectedAtomRefs: [], supersededAtomRefs: [],
}, count);
const previousFor = () => {
  const request = requestFor(), previous = acceptWorkingDraftUpdate(updateFor(request), request).composition!;
  return { previous, request: { ...request, studyProposalContext: previous } };
};
const strictWireFor = (update: WorkingDraftUpdate) => ({ ...structuredClone(update),
  retainedDiscussionBindings: update.retainedDiscussionBindings ?? [],
  explicitDecisions: update.explicitDecisions.map(decision => ({ ...decision, quote: decision.quote.replace(/\s+/gu, " ") })),
  proposal: { ...structuredClone(update.proposal!), atoms: update.proposal!.atoms.map(atom => ({ ...atom,
    dependencyQualifications: atom.dependencyQualifications ?? atom.dependsOn.map(ref =>
      ({ ref, kind: "HARD_BLOCKING_DEPENDENCY", rationale: "LOCAL_SYNTHETIC — prérequis." })),
    plannedSource: atom.plannedSource ?? null, plannedMethod: atom.plannedMethod ?? null,
    participantReported: atom.participantReported ?? false, analysisMethod: atom.analysisMethod ?? null,
    userChangeRefs: atom.userChangeRefs ?? [],
  })) },
});

describe("Working Draft full-snapshot capacity — offline only", () => {
  it("preflights realistic and near-limit FULL SNAPSHOT inputs without trimming", () => {
    const { previous, request } = previousFor();
    expect(preflightStudyProposalCapacity(previous.proposal, 0).minimumSnapshotAtoms).toBe(53);
    const near = acceptWorkingDraftUpdate(updateFor(request, STUDY_PROPOSAL_CAPACITY.maxAtoms), request).composition!;
    const input = { ...request, studyProposalContext: near };
    const before = JSON.stringify(input);
    expect(preflightStudyProposalCapacity(near.proposal, 0).minimumSnapshotAtoms).toBe(STUDY_PROPOSAL_CAPACITY.maxAtoms);
    // Capacity approval is not a bypass of the distinct context/output guards.
    // This near-limit proposal is natively valid; the realistic prior snapshot
    // enters preparation. Large prose combinations may still hit context bounds.
    expect(() => prepareWorkingDraftRequest(request)).not.toThrow();
    expect(JSON.stringify(input)).toBe(before);
  });

  it("rejects an impossible capacity combination at the owner before any provider work", async () => {
    const { previous, request } = previousFor();
    const tooMany = extendTo(updateFor(request), STUDY_PROPOSAL_CAPACITY.maxAtoms + 1).proposal!;
    const input = { ...request, studyProposalContext: { ...previous, proposal: tooMany } };
    expect(() => prepareWorkingDraftRequest(input)).toThrow("STUDY_PROPOSAL_CAPACITY_PREFLIGHT_REJECTED");
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await executeProtocolDesignerBridge({ body: input, apiKey: null, chatRuntime: "TERRA",
      autonomousProjectBuild: true, openAiApiKey: "LOCAL_SYNTHETIC_NOT_A_KEY", fetchImpl });
    expect(result.status).toBe(422);
    expect(result.body).toMatchObject({ error: { details: ["STUDY_PROPOSAL_CAPACITY_PREFLIGHT_REJECTED"] } });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("bounds coupled options, arbitrations, referential closure and rejection history", () => {
    const proposal = controlledStudyProposal("LOCAL_SYNTHETIC_CAPACITY");
    expect(() => preflightStudyProposalCapacity({ ...proposal, arbitrations: Array(9).fill(proposal.arbitrations[0]) }, 0))
      .toThrow("STUDY_PROPOSAL_CAPACITY_PREFLIGHT_REJECTED");
    const arbitration = proposal.arbitrations[0];
    expect(() => preflightStudyProposalCapacity({ ...proposal, arbitrations: [{ ...arbitration,
      options: Array(6).fill(arbitration.options[0]) }] }, 0)).toThrow("STUDY_PROPOSAL_CAPACITY_PREFLIGHT_REJECTED");
    expect(() => preflightStudyProposalCapacity({ ...proposal, arbitrations: [{ ...arbitration,
      options: [{ ...arbitration.options[0], atomRefs: Array.from({ length: 129 }, (_, i) => "required:" + i) }] }] }, 0))
      .toThrow("STUDY_PROPOSAL_CAPACITY_PREFLIGHT_REJECTED");
    expect(() => preflightStudyProposalCapacity(proposal, STUDY_PROPOSAL_CAPACITY.maxRejectedHistoryEntries + 1))
      .toThrow("STUDY_PROPOSAL_CAPACITY_PREFLIGHT_REJECTED");
  });
  it("admits 53 previous atoms plus 20 additions without losing an old identity or adopting Project", () => {
    const { request, previous } = previousFor(), frozen = JSON.stringify(previous);
    const update = updateFor(request, 73);
    expect(previous.proposal.atoms).toHaveLength(53);
    expect(update.proposal!.atoms.filter(atom => !previous.proposal.atoms.some(old => old.ref === atom.ref))).toHaveLength(20);
    const validate = new Ajv({ allErrors: true }).compile(prepareWorkingDraftRequest(request).outputSchema);
    expect(validate(strictWireFor(update)), JSON.stringify(validate.errors)).toBe(true);
    const result = acceptWorkingDraftUpdate(update, request);
    expect(result.composition!.proposal.atoms).toHaveLength(73);
    expect(() => assertStudyProposalOptionBindings(result.composition!.proposal)).not.toThrow();
    expect(result.composition!.proposal.candidateIsAdopted).toBe(false);
    expect(result.composition!.proposal.projectWriteAuthorized).toBe(false);
    expect(request.currentProject).toBeNull();
    expect(JSON.stringify(previous)).toBe(frozen);
  });

  it("uses the same actual atom upper bound in native validation and strict provider JSON Schema", () => {
    const request = requestFor(), update = updateFor(request, STUDY_PROPOSAL_CAPACITY.maxAtoms);
    const validate = new Ajv({ allErrors: true }).compile(prepareWorkingDraftRequest(request).outputSchema);
    expect(validate(strictWireFor(update)), JSON.stringify(validate.errors)).toBe(true);
    expect(acceptWorkingDraftUpdate(update, request).composition!.proposal.atoms).toHaveLength(STUDY_PROPOSAL_CAPACITY.maxAtoms);
    const schema = workingDraftProviderSchema(prepareWorkingDraftRequest(request).inputDigest, request.conversation.turns);
    const candidates = (schema.properties as Record<string, { anyOf: Array<{ properties?: Record<string, { maxItems?: number }> }> }>).proposal.anyOf;
    const proposal = candidates.find(candidate => candidate.properties)!;
    expect(proposal.properties!.atoms.maxItems).toBe(STUDY_PROPOSAL_CAPACITY.maxAtoms);
    extendTo(update, STUDY_PROPOSAL_CAPACITY.maxAtoms + 1);
    expect(validate(strictWireFor(update))).toBe(false);
    expect(contextualStudyProposalSchema.safeParse(update.proposal).success).toBe(false);
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow();
  });

  it("admits atom-sized decision/reference sets and keeps the upper bound plus one rejected", () => {
    const request = requestFor(), update = updateFor(request, STUDY_PROPOSAL_CAPACITY.maxAtoms);
    // Exercise the collection bound, not an adoption of mutually exclusive
    // alternatives: those remain protected by the separate arbitration guard.
    update.explicitDecisions = Array.from({ length: STUDY_PROPOSAL_CAPACITY.maxAtoms }, () =>
      ({ atomRef: "design", sourceTurnRef: "u1", quote: DOMAINS[0].text }));
    update.inferredAtomRefs = update.proposal!.atoms.map(atom => atom.ref);
    expect(acceptWorkingDraftUpdate(update, request).update.explicitDecisions).toHaveLength(STUDY_PROPOSAL_CAPACITY.maxAtoms);
    update.explicitDecisions.push(update.explicitDecisions[0]);
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow();
    const relations = updateFor(request, STUDY_PROPOSAL_CAPACITY.maxAtoms);
    const last = relations.proposal!.atoms.at(-1)!;
    last.dependsOn = relations.proposal!.atoms.slice(0, -1).map(atom => atom.ref);
    last.dependencyQualifications = last.dependsOn.map(ref => ({ ref, kind: "OPTIONAL_DETAIL", rationale: "LOCAL_SYNTHETIC" }));
    expect(contextualStudyProposalSchema.safeParse(relations.proposal).success).toBe(true);
  });

  it("still rejects dangling option references at the increased capacity", () => {
    const request = requestFor(), update = updateFor(request, 73);
    update.proposal!.arbitrations[0].options[0].atomRefs = ["missing-atom"];
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
  });

  it("rejects disappearance even for an old atom with no arbitration or dependency reference", () => {
    const { request, previous } = previousFor(), frozen = JSON.stringify(previous), update = updateFor(request);
    update.proposal!.atoms.pop();
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("WORKING_DRAFT_SNAPSHOT_CONTINUITY_INVALID");
    expect(update.proposal!.atoms).toHaveLength(52);
    expect(JSON.stringify(previous)).toBe(frozen);
  });

  it("allows an explicitly rejected old atom without copying it back", () => {
    const { request, previous } = previousFor(), frozen = JSON.stringify(previous), update = updateFor(request);
    const removed = update.proposal!.atoms.pop()!;
    update.rejectedAtomRefs = [removed.ref];
    const result = acceptWorkingDraftUpdate(update, request);
    expect(result.composition!.proposal.atoms.some(atom => atom.ref === removed.ref)).toBe(false);
    expect(JSON.stringify(previous)).toBe(frozen);
  });

  it("allows an explicit one-to-one supersession only with the replacement actually emitted", () => {
    const { request, previous } = previousFor(), frozen = JSON.stringify(previous), update = updateFor(request);
    const old = update.proposal!.atoms.at(-1)!;
    update.supersededAtomRefs = [old.ref];
    update.proposal!.atoms[update.proposal!.atoms.length - 1] = { ...old, ref: "replacement-open-atom",
      content: "LOCAL_SYNTHETIC — précision candidate révisée." };
    const result = acceptWorkingDraftUpdate(update, request);
    expect(result.composition!.proposal.atoms.some(atom => atom.ref === old.ref)).toBe(false);
    expect(result.composition!.proposal.atoms.some(atom => atom.ref === "replacement-open-atom")).toBe(true);
    expect(result.update.supersededAtomRefs).toEqual([old.ref]);
    expect(JSON.stringify(previous)).toBe(frozen);
  });

  it.each(["absent", "different-identity", "different-type", "multiple", "duplicate-declaration", "unknown-old-reference"])("rejects %s supersession rather than guessing a replacement", kind => {
    const { request } = previousFor(), update = updateFor(request), old = update.proposal!.atoms.pop()!;
    update.supersededAtomRefs = kind === "duplicate-declaration" ? [old.ref, old.ref] : [old.ref];
    if (kind === "unknown-old-reference") update.supersededAtomRefs = ["never-current"];
    if (kind !== "absent") update.proposal!.atoms.push({ ...old, ref: "replacement",
      ...(kind === "different-identity" ? { semanticKey: "another-semantic-identity" } : {}),
      ...(kind === "different-type" ? { targetType: "DATA_NEED" } : {}) });
    if (kind === "multiple") update.proposal!.atoms.push({ ...old, ref: "second-replacement" });
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("WORKING_DRAFT_SUPERSESSION_INVALID");
  });

  it("does not demand resurrection of an atom already rejected by a human", () => {
    const { request, previous } = previousFor(), update = updateFor(request), old = update.proposal!.atoms.pop()!;
    const frozen = JSON.stringify(previous);
    request.studyProposalContext = { ...previous, dispositions: [
      { decisionRef: "LOCAL_SYNTHETIC_HUMAN_REJECTION", status: "REJECTED", atomRefs: [old.ref], optionRefs: [] },
    ] };
    expect(acceptWorkingDraftUpdate(update, request).composition!.proposal.atoms.some(atom => atom.ref === old.ref)).toBe(false);
    expect(JSON.stringify(previous)).toBe(frozen);
  });

  it("aligns rejected-history transport capacity without dropping historical entries", () => {
    const request = requestFor(), atom = updateFor(request).proposal!.atoms[0];
    request.workingDraftHistory = Array.from({ length: STUDY_PROPOSAL_CAPACITY.maxRejectedHistoryEntries }, (_, i) => ({
      status: "REJECTED" as const, atom: { ...atom, ref: `old-rejected-${i}` },
    }));
    expect(parseProductBridgeRequest(request)).not.toBeNull();
    request.workingDraftHistory = [...request.workingDraftHistory,
      { status: "REJECTED", atom: { ...atom, ref: "old-rejected-overflow" } }];
    expect(parseProductBridgeRequest(request)).toBeNull();
  });

  it("keeps the historical 60-atom response rejected without reconstructing its four missing atoms", () => {
    const request = requestFor(), update = updateFor(request), atom = update.proposal!.atoms[0], arbitration = update.proposal!.arbitrations[0];
    update.proposal!.atoms = realStudyUpdateClosure.atomRefs.map(ref => ({ ...atom, ref, semanticKey: ref }));
    update.proposal!.arbitrations = realStudyUpdateClosure.arbitrations.map(current => ({ ...arbitration, ...current,
      options: current.options.map(option => ({ ...arbitration.options[0], ...option })) }));
    const frozen = JSON.stringify(update);
    expect(update.proposal!.atoms).toHaveLength(60);
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
    expect(JSON.stringify(update)).toBe(frozen);
  });

  it("fits compact iterative snapshots in the output envelope and reuses exact existing input/cost admission", () => {
    const { request } = previousFor(), encoder = new Tiktoken(o200kBase);
    for (const count of [73, STUDY_PROPOSAL_CAPACITY.maxAtoms]) {
      const update = updateFor(request, count);
      const outputEstimate = encoder.encode(JSON.stringify(update), [], []).length;
      // An offline text estimate, NOT model usage or a guarantee about reasoning.
      expect(outputEstimate).toBeLessThan(STUDY_PROPOSAL_CAPACITY.workingDraftMaxOutputTokens / 2);
      const packet = prepareWorkingDraftRequest(request);
      const payload = { ...buildOpenAITerraConversationPayload(packet,
        { maxOutputTokens: STUDY_PROPOSAL_CAPACITY.workingDraftMaxOutputTokens }), model: "gpt-6-sol" };
      const bound = boundPublicProviderCall("https://synthetic.services.ai.azure.com/api/projects/qualification/openai/v1/responses", JSON.stringify(payload))!;
      expect(bound).not.toBeNull();
      expect(bound.outputTokenUpperBound).toBe(STUDY_PROPOSAL_CAPACITY.workingDraftMaxOutputTokens);
      expect(bound.inputTokenUpperBound + bound.outputTokenUpperBound).toBeLessThanOrEqual(bound.contextTokenLimit);
      expect(canaryBudgetAdmission(0, bound, 0)).toBe("ADMITTED");
      expect(canaryBudgetAdmission(1, bound, 1)).toBe("DENIED_SOFT_STOP");
      expect(canaryBudgetAdmission(6, bound, 0)).toBe("DENIED_HARD_BUDGET");
      console.info("OFFLINE_WORKING_DRAFT_CAPACITY", { atoms: count, outputTextEstimate: outputEstimate,
        outputTokenCeiling: bound.outputTokenUpperBound, inputTokenUpperBound: bound.inputTokenUpperBound,
        contextTokenLimit: bound.contextTokenLimit, reservedUpperBoundUsd: bound.upperBoundUsd });
    }
  });

  it("reserves 64000 as an upper bound, never as probable consumption or a soft-stop debit", () => {
    const { request } = previousFor();
    const additions = Array.from({ length: 20 }, (_, i) =>
      `La précision synthétique ${i + 1} doit être représentée séparément et rester candidate jusqu'à confirmation humaine.`).join(" ");
    request.conversation.turns.push({ turnId: "u2", role: "USER", content: additions },
      { turnId: "a2", role: "NOXIA", content: "LOCAL_SYNTHETIC — vingt précisions candidates, sans adoption." });
    request.workingDraftScientificSource = { kind: "BOUND_USER_TURN", sourceUserTurnId: "u2", sourceResponseTurnId: "a2",
      sourceDigest: logicalDigest(additions) };
    expect(acceptWorkingDraftUpdate(updateFor(request, 73), request).composition!.proposal.atoms).toHaveLength(73);
    const packet = prepareWorkingDraftRequest(request);
    const endpoint = "https://synthetic.services.ai.azure.com/api/projects/qualification/openai/v1/responses";
    const payloadAt = (maxOutputTokens: number) => JSON.stringify({
      ...buildOpenAITerraConversationPayload(packet, { maxOutputTokens }), model: "gpt-6-sol",
    });
    const old = boundPublicProviderCall(endpoint, payloadAt(24_000))!;
    const current = boundPublicProviderCall(endpoint, payloadAt(STUDY_PROPOSAL_CAPACITY.workingDraftMaxOutputTokens))!;
    const oldAbsolute = boundCanaryProviderCall(endpoint, payloadAt(24_000))!;
    const newAbsolute = boundCanaryProviderCall(endpoint, payloadAt(STUDY_PROPOSAL_CAPACITY.workingDraftMaxOutputTokens))!;
    expect(oldAbsolute.upperBoundUsd).toBe(4.97);
    expect(newAbsolute.upperBoundUsd).toBe(5.57);
    expect(current.upperBoundUsd).toBeCloseTo(old.upperBoundUsd + 0.4, 9);
    expect(current.upperBoundUsd).toBeGreaterThan(1);
    for (const environment of [
      { VERCEL_ENV: "preview" }, { VERCEL_ENV: "production" },
      { VERCEL_ENV: "preview", NOXIA_PREVIEW_PUBLIC_SOFT_STOP_USD: "3" },
      { VERCEL_ENV: "production", NOXIA_PUBLIC_SOFT_STOP_USD: "3" },
    ]) {
      const policy = durableGuardPublicBudget(environment);
      // Remaining hard-budget headroom matters; a reservation greater than
      // the soft stop does NOT turn into already-measured spend.
      expect(canaryBudgetAdmission(0.75, current, 0.75, policy)).toBe("ADMITTED");
      expect(canaryBudgetAdmission(policy.measuredCostSoftStopUsd, current,
        policy.measuredCostSoftStopUsd, policy)).toBe("DENIED_SOFT_STOP");
      expect(canaryBudgetAdmission(6, current, 0, policy)).toBe("DENIED_HARD_BUDGET");
    }
    const settlement = settleCanaryProviderCall(current, JSON.stringify({ model: "gpt-6-sol", status: "completed",
      usage: { input_tokens: 1000, output_tokens: 100, input_tokens_details: { cached_tokens: 0 } } }))!;
    expect(settlement.measuredCostUsd).toBe(0.003);
    expect(settlement.committedCostUpperBoundUsd).toBe(0.0035);
    expect(canaryBudgetAdmission(settlement.committedCostUpperBoundUsd, current,
      settlement.measuredCostUsd)).toBe("ADMITTED");
    console.info("OFFLINE_WORKING_DRAFT_RESERVATION_COMPARISON", {
      oldMaxReservationUsd: oldAbsolute.upperBoundUsd, newMaxReservationUsd: newAbsolute.upperBoundUsd,
      oldRepresentativeReservationUsd: old.upperBoundUsd, newRepresentativeReservationUsd: current.upperBoundUsd,
      inputTokenUpperBound: current.inputTokenUpperBound, representativeAtoms: 73,
      softStopComparedWithMeasuredSpendOnly: true, settledMeasuredUsd: settlement.measuredCostUsd,
    });
  });
});
