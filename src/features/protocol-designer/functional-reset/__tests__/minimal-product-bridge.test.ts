import { describe, expect, it, vi } from "vitest";
import {
  buildNaturalConversationPayload,
  buildPersistentDeltaPayload,
} from "../../../../../api/protocol-designer-bridge-provider";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import {
  contributionFromPersistentDelta,
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  validatePersistentProjectDelta,
  type ProductBridgeRequest,
  type ProductBridgeResponse,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  rejectResearchProjectContribution,
} from "@/features/research-project-construction";
import {
  clarifyFunctionalResetQueryAfterMisunderstanding,
  isFunctionalResetQueryMisunderstanding,
} from "@/features/query-navigation";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import {
  COLCHICINE_INITIAL,
  COLCHICINE_MODIFICATION,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

const authority = {
  actorRef: "minimal-bridge:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (turnId: string, content: string, role: "USER" | "NOXIA" = "USER"): ScientificInterpretationTurn => ({
  turnId,
  role,
  content,
  createdAt: "2026-08-23T09:00:00.000Z",
});

const currentProject = () => confirmResearchProjectContribution({
  contribution: makeFunctionalResetContribution([
    turn("initial", COLCHICINE_INITIAL),
    turn("age-75", COLCHICINE_MODIFICATION),
  ]),
  current: null,
  projectId: "project:minimal-bridge",
  authority,
  confirmedAt: "2026-08-23T09:01:00.000Z",
});

const requestFor = (raw: string, evaluatePersistentDelta = true): ProductBridgeRequest => ({
  apiVersion: "1.0.0",
  conversation: { conversationId: "conversation:minimal-bridge", language: "fr", turns: [turn("user-current", raw)] },
  currentProject: currentProject(),
  evaluatePersistentDelta,
});

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
});

describe("MINIMAL PRODUCT BRIDGE — conversation and persistent ownership", () => {
  it("keeps the validated first call free of schema, tools and machine labels", () => {
    const payload = buildNaturalConversationPayload(requestFor("Pourquoi cette question ?", false));
    expect(payload).toHaveProperty("systemInstruction");
    expect(payload).toHaveProperty("contents");
    expect(payload).not.toHaveProperty("tools");
    expect(payload).not.toHaveProperty("toolConfig");
    expect(payload).not.toHaveProperty("generationConfig.responseJsonSchema");
    expect(payload.systemInstruction.parts[0].text).not.toContain("NOTE DE CONTRÔLE EXPÉRIMENTALE");
  });

  it("provides recent assistant proposals only as read-only adoption context", () => {
    const request = requestFor("Que proposes-tu ?");
    request.conversation.turns = [
      turn("assistant-suggestion", "Cette MVO pourrait devenir un critère principal", "NOXIA"),
      turn("user-current", "Que proposes-tu ?"),
    ];
    const payload = buildPersistentDeltaPayload(request);
    const serialized = JSON.stringify(payload);
    expect(serialized).toContain("Que proposes-tu ?");
    expect(serialized).toContain("Cette MVO pourrait devenir un critère principal");
    expect(serialized).toContain("utilisables uniquement si le dernier message les adopte explicitement");
    expect(serialized).toContain("Omit for ADD");
    expect(serialized).toContain("never use it only to provide context for a new object");
    expect(serialized).toContain("Null is allowed only on REPLACE to clear an existing role");
    expect(serialized).toContain("Existing canonical Project stable ID or candidateRef declared in this same output");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("Une mention dans une question");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("retourne une liste vide");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("Un changement de rôle scientifique ne remplace pas l'identité scientifique");

    const checked = validatePersistentProjectDelta({ changes: [{
      operation: "ADD",
      sourceText: "MVO",
      targetSectionId: "MEASUREMENTS",
      targetProjectRef: null,
      content: "MVO",
    }] }, "Pourquoi cette question ?", currentProject());
    expect(checked.validation).toMatchObject({ valid: false, blocks: ["change:0:SOURCE_TEXT_NOT_IN_USER_TURN"] });
    expect(checked.candidate).toBeNull();
  });

  it("keeps a pure Project question conversational when the extractor reports no persistent consequence", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        candidates: [{ content: { parts: [{ text: "Le nombre de procédures n'est pas encore défini dans le Project adopté." }] } }],
        responseId: "question-conversation",
      }))
      .mockResolvedValueOnce(jsonResponse({
        candidates: [{ content: { parts: [{ functionCall: { name: "propose_persistent_project_delta", args: { changes: [] } } }] } }],
        responseId: "question-no-delta",
      })) as unknown as typeof fetch;
    const result = await executeProtocolDesignerBridge({
      body: requestFor("Combien de procédures sont prévues ?"),
      apiKey: "test-key",
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.body).toMatchObject({
      assistantReply: expect.stringContaining("pas encore défini"),
      persistentExtraction: { called: true, status: "NO_CHANGE", contribution: null },
      observability: { calls: 2, projectWrites: 0 },
    });
  });

  it("accepts an explicit Project assertion as a candidate without writing the Project", () => {
    const project = currentProject();
    const before = JSON.stringify(project);
    const raw = "Le suivi à 6 mois fait partie de ce projet.";
    const checked = validatePersistentProjectDelta({ changes: [{
      operation: "ADD",
      sourceText: "suivi à 6 mois",
      targetSectionId: "TEMPORALITY",
      targetProjectRef: null,
      content: "Suivi à 6 mois",
    }] }, raw, project);
    expect(checked.validation).toMatchObject({ valid: true, blocks: [], acceptedChanges: [expect.any(Object)] });
    const contribution = contributionFromPersistentDelta({
      candidate: checked.candidate!,
      conversation: requestFor(raw).conversation,
      currentProject: project,
    });
    expect(contribution?.decisionBoundary.projectWriteAuthorized).toBe(false);
    expect(JSON.stringify(project)).toBe(before);
  });

  it("carries an MRI AcquisitionTime value without targetSectionId or a temporal root object", () => {
    const initial = currentProject();
    const acquisitionRaw = "Le projet comporte une acquisition IRM.";
    const acquisitionChecked = validatePersistentProjectDelta({ changes: [{
      operation: "ADD",
      sourceText: "acquisition IRM",
      targetProjectRef: null,
      candidateRef: "acquisition:irm",
      semanticIdentity: "acquisition:irm",
      proposedType: "ACQUISITION",
      content: "Acquisition IRM",
    }] }, acquisitionRaw, initial);
    const acquisitionContribution = contributionFromPersistentDelta({
      candidate: acquisitionChecked.candidate!,
      conversation: { conversationId: "conversation:acquisition", language: "fr", turns: [turn("acquisition", acquisitionRaw)] },
      currentProject: initial,
    })!;
    const project = confirmResearchProjectContribution({
      contribution: acquisitionContribution,
      current: initial,
      projectId: initial.projectId,
      authority,
      confirmedAt: "2026-08-23T09:01:30.000Z",
    });
    const raw = "L’IRM sera réalisée entre J3 et J5.";
    const checked = validatePersistentProjectDelta({
      changes: [],
      relations: [],
      temporalQualifications: [{
        operation: "ADD",
        qualificationId: "temporal-qualification:irm-acquisition",
        sourceText: raw,
        subjectProjectRef: "acquisition:irm",
        temporalRole: "ACQUISITION_TIME",
        anchor: {
          kind: "WINDOW",
          direction: "AFTER",
          unit: "DAY",
          offset: null,
          lowerBound: 3,
          upperBound: 5,
          relativeEventLabel: null,
          tolerance: null,
          reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
        },
        assertionKind: "USER_STATED",
        proposalSourceText: null,
        evidenceRefs: [],
      }],
      expectedVariableOccasions: [],
    }, raw, project);
    expect(checked.validation).toMatchObject({ valid: true, blocks: [], acceptedTemporalQualifications: [expect.any(Object)] });
    const contribution = contributionFromPersistentDelta({
      candidate: checked.candidate!,
      conversation: { conversationId: "conversation:timing", language: "fr", turns: [turn("timing", raw)] },
      currentProject: project,
    })!;
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.canonicalChangeSet).toMatchObject({
      status: "READY_FOR_HUMAN_DECISION",
      objectChanges: [],
      legacyTemporalChanges: [],
      temporalQualificationChanges: [expect.objectContaining({
        candidate: expect.objectContaining({
          subjectProjectRef: "acquisition:irm",
          temporalRole: "ACQUISITION_TIME",
          anchor: expect.objectContaining({ lowerBound: 3, upperBound: 5, reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } }),
        }),
      })],
    });
    const payload = buildPersistentDeltaPayload({ ...requestFor(raw), currentProject: project });
    const declaration = payload.tools[0].functionDeclarations[0].parametersJsonSchema;
    expect(declaration.required).toEqual(["changes", "relations", "temporalQualifications", "expectedVariableOccasions"]);
    expect(declaration.properties.temporalQualifications).toBeDefined();
    expect(JSON.stringify(declaration.properties.temporalQualifications)).not.toContain("targetSectionId");
  });

  it("validates a stable ref and compiles 75 to 80 without mutating before Human Decision", () => {
    const project = currentProject();
    const projectBefore = JSON.stringify(project);
    const age = project.sections.find((section) => section.sectionId === "POPULATION")?.elements
      .find((element) => element.semanticKey === "POPULATION:ELIGIBILITY:AGE:MAX");
    expect(age).toBeDefined();
    const raw = "Finalement jusqu'à 80 ans.";
    const checked = validatePersistentProjectDelta({ changes: [{
      operation: "REPLACE",
      sourceText: "jusqu'à 80 ans",
      targetSectionId: "POPULATION",
      targetProjectRef: age!.elementId,
      content: "Âge maximal : 80 ans",
    }] }, raw, project);
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: requestFor(raw).conversation, currentProject: project })!;
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate).toMatchObject({ projectWriteAuthorized: false, changeSet: { effectiveChangeCount: 1 } });
    expect(candidate.changeSet.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ operation: "REPLACE", presentation: "Âge maximal : 75 ans → 80 ans" }),
    ]));
    expect(JSON.stringify(project)).toBe(projectBefore);

    const accepted = confirmResearchProjectContribution({ contribution, current: project, projectId: project.projectId, authority, confirmedAt: "2026-08-23T09:02:00.000Z" });
    expect(accepted).toMatchObject({ revision: project.revision + 1, previousVersionId: project.versionId, llmProjectWrites: 0 });
    expect(accepted.confirmationDecision).toMatchObject({ status: "ADOPTED", mandate: "PROJECT_OWNER" });
  });

  it("rejects invalid refs, duplicates and obvious no-ops locally", () => {
    const project = currentProject();
    const invalid = validatePersistentProjectDelta({ changes: [{
      operation: "REMOVE",
      sourceText: "retirer",
      targetSectionId: "IMAGING",
      targetProjectRef: "project:missing",
      content: "IRM",
    }] }, "retirer", project);
    expect(invalid.validation.valid).toBe(false);
    expect(invalid.validation.blocks[0]).toContain("PROJECT_REF_INVALID");

    const reusedIdentity = validatePersistentProjectDelta({ changes: [{
      operation: "ADD",
      sourceText: "nouvelle mesure",
      targetSectionId: "MEASUREMENTS",
      targetProjectRef: null,
      candidateRef: project.canonicalState?.objects.find((object) => object.actuality === "CURRENT")?.objectId,
      content: "Nouvelle mesure",
    }] }, "nouvelle mesure", project);
    expect(reusedIdentity.validation.blocks).toEqual(["change:0:ADD_MUST_USE_NEW_IDENTITY"]);

    const duplicate = validatePersistentProjectDelta({ changes: [{
      operation: "ADD",
      sourceText: "colchicine",
      targetSectionId: "INTERVENTION",
      targetProjectRef: null,
      content: "colchicine",
    }] }, "colchicine", project);
    expect(duplicate.validation).toMatchObject({ valid: true, acceptedChanges: [] });
    expect(duplicate.validation.noOps).toEqual(["change:0:DUPLICATE_EXISTING_ELEMENT"]);
  });

  it("records a rejected Human Decision while preserving the exact Project", () => {
    const project = currentProject();
    const raw = "Ajouter un suivi à 6 mois.";
    const checked = validatePersistentProjectDelta({ changes: [{
      operation: "ADD",
      sourceText: "suivi à 6 mois",
      targetSectionId: "TEMPORALITY",
      targetProjectRef: null,
      content: "Suivi à 6 mois",
    }] }, raw, project);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: requestFor(raw).conversation, currentProject: project })!;
    const before = JSON.stringify(project);
    const decision = rejectResearchProjectContribution({ contribution, current: project, authority, rejectedAt: "2026-08-23T09:03:00.000Z" });
    expect(decision).toMatchObject({ status: "REJECTED", engineSource: "RESEARCH_PROJECT", projectVersion: project.versionId });
    expect(JSON.stringify(project)).toBe(before);
  });

  it("uses one provider start for a conversation-only turn and performs zero Project writes", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({
      candidates: [{ content: { parts: [{ text: "Le nombre de centres aide à apprécier la faisabilité et l'hétérogénéité attendue." }] } }],
      responseId: "conversation-only",
    })) as unknown as typeof fetch;
    const result = await executeProtocolDesignerBridge({ body: requestFor("Pourquoi tu me demandes le nombre de centres ?", false), apiKey: "test-key", fetchImpl });
    expect(result.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.body).toMatchObject({
      assistantReply: expect.stringContaining("nombre de centres"),
      persistentExtraction: { called: false, contribution: null },
      observability: { calls: 1, projectWrites: 0 },
    });
  });

  it("uses the optional second pass only to return a source-grounded Project candidate", async () => {
    const project = currentProject();
    const age = project.sections.find((section) => section.sectionId === "POPULATION")?.elements
      .find((element) => element.semanticKey === "POPULATION:ELIGIBILITY:AGE:MAX");
    if (!age) throw new Error("AGE_MAX_FIXTURE_MISSING");
    const request = requestFor("Finalement jusqu'à 80 ans.");
    request.currentProject = project;
    const exactProviderArgs = { changes: [{
      operation: "REPLACE",
      sourceText: "jusqu'à 80 ans",
      targetSectionId: "POPULATION",
      targetProjectRef: age.elementId,
      content: "Âge maximal : 80 ans",
    }] };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        candidates: [{ content: { parts: [{ text: "Je comprends que vous souhaitez porter la borne d'âge à 80 ans. Cette modification restera une proposition jusqu'à votre confirmation." }] } }],
        responseId: "conversation-change",
      }))
      .mockResolvedValueOnce(jsonResponse({
        candidates: [{ content: { parts: [{ functionCall: { name: "propose_persistent_project_delta", args: exactProviderArgs } }] } }],
        responseId: "delta-change",
      })) as unknown as typeof fetch;
    const before = JSON.stringify(project);
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: "test-key", fetchImpl });
    expect(result.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.body).toMatchObject({
      persistentExtraction: {
        called: true,
        status: "CANDIDATE",
        providerArtifact: {
          requestTurnRef: "user-current",
          providerResponseId: "delta-change",
          structuredArgsExact: exactProviderArgs,
          structuredArgsSerialized: JSON.stringify(exactProviderArgs),
          structuredArgsDigest: expect.any(String),
        },
        wireCandidate: expect.objectContaining({ changes: exactProviderArgs.changes, relations: [], temporalQualifications: [], expectedVariableOccasions: [] }),
        candidate: expect.objectContaining({ changes: exactProviderArgs.changes }),
        contribution: {
          source: { rawOutputRef: expect.stringMatching(/^gemini-structured-args:/), rawOutputDigest: expect.any(String) },
          decisionBoundary: { projectWriteAuthorized: false },
        },
      },
      observability: { calls: 2, projectWrites: 0 },
    });
    const response = result.body as ProductBridgeResponse;
    const prepared = prepareResearchProjectContributionCandidate(response.persistentExtraction.contribution!, project);
    expect({
      raw: request.conversation.turns.at(-1)?.content,
      providerArgs: response.persistentExtraction.providerArtifact?.structuredArgsExact,
      wire: response.persistentExtraction.wireCandidate?.changes,
      normalized: response.persistentExtraction.candidate?.changes,
      canonical: prepared.canonicalChangeSet.objectChanges.map((change) => change.changeRef),
      review: prepared.humanReviewProjection.coveredChangeRefs,
    }).toEqual({
      raw: "Finalement jusqu'à 80 ans.",
      providerArgs: exactProviderArgs,
      wire: exactProviderArgs.changes,
      normalized: exactProviderArgs.changes,
      canonical: prepared.humanReviewProjection.expectedChangeRefs,
      review: prepared.humanReviewProjection.expectedChangeRefs,
    });
    expect(JSON.stringify(project)).toBe(before);
  });

  it("keeps the active QRY action when the user asks why", () => {
    const project = currentProject();
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-08-23T09:04:00.000Z" });
    const raw = "Pourquoi tu me demandes ça ?";
    expect(isFunctionalResetQueryMisunderstanding(raw)).toBe(true);
    const explained = clarifyFunctionalResetQueryAfterMisunderstanding({
      navigation,
      rawResponse: raw,
      actorRef: authority.actorRef,
      actorRole: "RESEARCHER",
      receivedAt: "2026-08-23T09:05:00.000Z",
      responseId: "response:why",
    });
    expect(explained.currentAction?.selectedActionId).toBe(navigation.currentAction?.selectedActionId);
    expect(explained.projectVersion).toBe(navigation.projectVersion);
    expect(explained.memory.responses.at(-1)?.disposition).toBe("REQUEST_CLARIFICATION");
  });
});
