import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import { buildOpenAIPersistentDeltaPayload } from "../../../../../api/protocol-designer-openai-extraction-provider";
import {
  buildPersistentExtractionLanguageContract,
  buildPersistentSourceCatalog,
  PERSISTENT_PROJECT_OBJECT_TYPES,
  PERSISTENT_PROJECT_RELATION_TYPES,
  type ProductBridgeRequest,
  type ProductBridgeResponse,
} from "@/features/protocol-designer/product-bridge";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";

const CEC_INPUT = "je veux créer une étude se basant sur le principe que suite a circulation extra corporelle la troponine augmente et qu'il y a donc atteinte des myocites. je voudrais étudier cette atteinte à l'irm pour explorer ce domaine afin de voir s'il y a de réelles lésions visibles en rehaussement tardif ou si l'on peut observer une modification de l'ECV ou de la contractilité";

const request = (language: "fr" | "en", content: string): ProductBridgeRequest => ({
  apiVersion: "1.0.0",
  conversation: {
    conversationId: `conversation:p1-ux-restore-01lang:${language}`,
    language,
    turns: [{ turnId: `turn:p1-ux-restore-01lang:${language}`, role: "USER", content }],
  },
  currentProject: null,
  evaluatePersistentDelta: true,
});

const jsonResponse = (body: unknown, headers?: Record<string, string>) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { "content-type": "application/json", ...headers },
});

const anchoredArgs = (
  body: ProductBridgeRequest,
  content: { objective: string; dataNeed: string },
) => {
  const anchor = buildPersistentSourceCatalog(body.conversation).anchors
    .find((candidate) => candidate.fragmentKind === "FULL_TURN")!;
  return {
    changes: [{
      operation: "ADD",
      sourceAnchorId: anchor.anchorId,
      candidateRef: "objective:recovery",
      semanticIdentity: "objective-recovery",
      proposedType: "OBJECTIVE",
      content: content.objective,
      polarity: "AFFIRMED",
      epistemicStatus: "EXPLICIT_USER_STATED",
      epistemicState: "KNOWN",
      assertionKind: "USER_STATED",
      evidenceRefs: [anchor.anchorId],
    }, {
      operation: "ADD",
      sourceAnchorId: anchor.anchorId,
      candidateRef: "data-need:recovery",
      semanticIdentity: "data-need-recovery",
      proposedType: "DATA_NEED",
      content: content.dataNeed,
      polarity: "AFFIRMED",
      epistemicStatus: "EXPLICIT_USER_STATED",
      epistemicState: "KNOWN",
      assertionKind: "USER_STATED",
      evidenceRefs: [anchor.anchorId],
    }],
    relations: [{
      relationRef: "relation:objective-motivates-recovery",
      sourceAnchorId: anchor.anchorId,
      relationType: "MOTIVATES_DATA_NEED",
      sourceObjectRef: "objective:recovery",
      targetObjectRef: "data-need:recovery",
      polarity: "AFFIRMED",
      epistemicStatus: "EXPLICIT_USER_STATED",
      epistemicState: "KNOWN",
      assertionKind: "USER_STATED",
      evidenceRefs: [anchor.anchorId],
    }],
    temporalQualifications: [],
    expectedVariableOccasions: [],
  };
};

const run = async (body: ProductBridgeRequest, args: unknown) => {
  const fetchImpl = vi.fn()
    .mockResolvedValueOnce(jsonResponse({
      candidates: [{ content: { parts: [{ text: body.conversation.language === "fr" ? "Je vous propose une première structure." : "I can propose an initial structure." }] } }],
      responseId: `gemini:${body.conversation.language}`,
    }))
    .mockResolvedValueOnce(jsonResponse({
      id: `openai:${body.conversation.language}`,
      model: "gpt-5.6-terra",
      status: "completed",
      output_text: JSON.stringify(args),
    }, { "x-request-id": `request:${body.conversation.language}` })) as unknown as typeof fetch;
  const result = await executeProtocolDesignerBridge({
    body,
    apiKey: "test-gemini-key",
    openAiApiKey: "test-openai-key",
    fetchImpl,
    now: () => Date.parse("2026-08-30T14:00:00.000Z"),
  });
  return { response: result.body as ProductBridgeResponse, fetchImpl };
};

const structuralProjection = (response: ProductBridgeResponse) => {
  const contribution = response.persistentExtraction.contribution!;
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  return {
    persistentStatus: response.persistentExtraction.status,
    validationValid: response.persistentExtraction.validation?.valid,
    itemTypes: contribution.scientificContent.candidateObjects.map((item) => item.proposedType),
    semanticIdentities: contribution.scientificContent.candidateObjects.map((item) => item.semanticIdentity),
    epistemicStatuses: contribution.scientificContent.candidateObjects.map((item) => item.epistemicBoundary.epistemicStatus),
    relationTypes: contribution.scientificContent.candidateRelations.map((relation) => relation.relationType),
    changeSetStatus: candidate.changeSet.status,
    canonicalObjectTypes: candidate.canonicalChangeSet.objectChanges.map((change) => change.candidate?.objectType),
    canonicalRelationTypes: candidate.canonicalChangeSet.relationChanges.map((change) => change.candidate?.relationType),
  };
};

describe("P1-UX-RESTORE-01LANG — governed extraction language fidelity", () => {
  it("binds the existing conversation language to the OpenAI extraction instruction", () => {
    const french = request("fr", "Je veux évaluer une intervention et observer la récupération clinique.");
    const english = request("en", "I want to evaluate an intervention and observe clinical recovery.");
    const frenchPayload = buildOpenAIPersistentDeltaPayload(french);
    const englishPayload = buildOpenAIPersistentDeltaPayload(english);

    expect(buildPersistentExtractionLanguageContract("fr")).toContain("français (fr)");
    expect(buildPersistentExtractionLanguageContract("en")).toContain("English (en)");
    expect(frenchPayload.instructions).toContain("LANGUE D'INTERACTION REQUISE");
    expect(frenchPayload.instructions).toContain("Rédige en français toutes les chaînes libres candidates");
    expect(englishPayload.instructions).toContain("REQUIRED INTERACTION LANGUAGE");
    expect(englishPayload.instructions).toContain("Write in English every candidate free-text value");
    expect(frenchPayload.instructions).toContain("types d'objet, types de relation, rôles, statuts, opérations, valeurs d'enum, identifiants, références, versions et digests");
    expect(englishPayload.instructions).toContain("object types, relation types, roles, statuses, operations, enum values, identifiers, references, versions and digests");
    expect(frenchPayload.input).toContain(french.conversation.turns[0]!.content);
    expect(englishPayload.input).toContain(english.conversation.turns[0]!.content);
    expect(frenchPayload.text.format.schema).toEqual(englishPayload.text.format.schema);
  });

  it("keeps canonical values unchanged across French and English governed candidates", async () => {
    const frenchRequest = request("fr", "Je veux évaluer une intervention et observer la récupération clinique.");
    const englishRequest = request("en", "I want to evaluate an intervention and observe clinical recovery.");
    const french = await run(frenchRequest, anchoredArgs(frenchRequest, {
      objective: "Évaluer l'effet de l'intervention sur la récupération.",
      dataNeed: "Récupération clinique.",
    }));
    const english = await run(englishRequest, anchoredArgs(englishRequest, {
      objective: "Evaluate the effect of the intervention on recovery.",
      dataNeed: "Clinical recovery.",
    }));

    expect(french.fetchImpl).toHaveBeenCalledTimes(2);
    expect(english.fetchImpl).toHaveBeenCalledTimes(2);
    expect(french.response.persistentExtraction.contribution?.scientificContent.candidateObjects.map((item) => item.content))
      .toEqual(["Évaluer l'effet de l'intervention sur la récupération.", "Récupération clinique."]);
    expect(english.response.persistentExtraction.contribution?.scientificContent.candidateObjects.map((item) => item.content))
      .toEqual(["Evaluate the effect of the intervention on recovery.", "Clinical recovery."]);
    expect(structuralProjection(french.response)).toEqual(structuralProjection(english.response));
    expect(structuralProjection(french.response)).toMatchObject({
      persistentStatus: "CANDIDATE",
      validationValid: true,
      itemTypes: ["OBJECTIVE", "DATA_NEED"],
      semanticIdentities: ["objective-recovery", "data-need-recovery"],
      epistemicStatuses: ["EXPLICIT_USER_STATED", "EXPLICIT_USER_STATED"],
      relationTypes: ["MOTIVATES_DATA_NEED"],
      canonicalObjectTypes: ["OBJECTIVE", "DATA_NEED"],
      canonicalRelationTypes: ["MOTIVATES_DATA_NEED"],
    });
    expect(PERSISTENT_PROJECT_OBJECT_TYPES).toContain("OBJECTIVE");
    expect(PERSISTENT_PROJECT_RELATION_TYPES).toContain("MOTIVATES_DATA_NEED");
  });

  it("keeps the qualified CEC semantic structure while accepting French human-readable wording", async () => {
    const body = request("fr", CEC_INPUT);
    const anchor = buildPersistentSourceCatalog(body.conversation).anchors
      .find((candidate) => candidate.fragmentKind === "FULL_TURN")!;
    const change = (candidateRef: string, semanticIdentity: string, proposedType: string, content: string, epistemicState: "KNOWN" | "UNKNOWN" = "KNOWN") => ({
      operation: "ADD",
      sourceAnchorId: anchor.anchorId,
      candidateRef,
      semanticIdentity,
      proposedType,
      content,
      polarity: "AFFIRMED",
      epistemicStatus: "EXPLICIT_USER_STATED",
      epistemicState,
      assertionKind: "USER_STATED",
      evidenceRefs: [anchor.anchorId],
    });
    const args = {
      changes: [
        change("context:cec", "context-circulation-extracorporelle", "PROJECT_INFORMATION", "La circulation extracorporelle constitue le contexte précédant les modifications myocardiques étudiées."),
        change("hypothesis:troponin", "hypothesis-troponin-myocyte-injury", "HYPOTHESIS", "Après circulation extracorporelle, l'élévation de la troponine peut refléter une atteinte des myocytes."),
        change("objective:mri", "objective-explore-myocardial-injury-with-mri", "OBJECTIVE", "Explorer par IRM cardiaque l'existence de lésions ou de modifications fonctionnelles myocardiques."),
        change("modality:mri", "imaging-modality-mri", "IMAGING_MODALITY", "IRM cardiaque."),
        change("data-need:myocardium", "data-need-myocardial-characterization", "DATA_NEED", "Caractérisation IRM de l'atteinte myocardique.", "UNKNOWN"),
        change("variable:lge", "variable-late-gadolinium-enhancement", "CANONICAL_VARIABLE", "Lésions visibles en rehaussement tardif."),
        change("variable:ecv", "variable-extracellular-volume", "CANONICAL_VARIABLE", "Volume extracellulaire (ECV)."),
        change("variable:contractility", "variable-contractility", "CANONICAL_VARIABLE", "Contractilité."),
      ],
      relations: [],
      temporalQualifications: [],
      expectedVariableOccasions: [],
    };
    const { response } = await run(body, args);
    const contents = response.persistentExtraction.contribution?.scientificContent.candidateObjects.map((item) => item.content) ?? [];
    const prepared = prepareResearchProjectContributionCandidate(response.persistentExtraction.contribution!, null);

    expect(response.persistentExtraction).toMatchObject({ status: "CANDIDATE", validation: { valid: true } });
    expect(contents).toEqual(expect.arrayContaining([
      expect.stringContaining("circulation extracorporelle"),
      expect.stringContaining("troponine"),
      expect.stringContaining("IRM cardiaque"),
      expect.stringContaining("rehaussement tardif"),
      expect.stringContaining("ECV"),
      expect.stringContaining("Contractilité"),
    ]));
    expect(contents.join(" ")).not.toMatch(/Cardiopulmonary bypass|Explore suspected|Magnetic resonance|Presence of lesions|Extracellular volume|Contractility/);
    expect(prepared.proposedSections.find((section) => section.sectionId === "POPULATION")).toMatchObject({ state: "TO_CLARIFY", elements: [] });
    expect(prepared.proposedSections.find((section) => section.sectionId === "QUESTION")).toMatchObject({ state: "TO_CLARIFY", elements: [] });
    expect(prepared.proposedSections.find((section) => section.sectionId === "ANALYSIS")).toMatchObject({ state: "TO_CLARIFY", elements: [] });
    const canonicalObjectTypes = prepared.canonicalChangeSet.objectChanges.map((entry) => entry.candidate?.objectType);
    expect(canonicalObjectTypes).toHaveLength(8);
    expect(canonicalObjectTypes).toEqual(expect.arrayContaining([
      "PROJECT_INFORMATION",
      "HYPOTHESIS",
      "OBJECTIVE",
      "IMAGING_MODALITY",
      "DATA_NEED",
      "CANONICAL_VARIABLE",
      "CANONICAL_VARIABLE",
      "CANONICAL_VARIABLE",
    ]));
    expect(buildPersistentDeltaPayload(body).systemInstruction.parts[0].text).toContain("français (fr)");
  });
});
