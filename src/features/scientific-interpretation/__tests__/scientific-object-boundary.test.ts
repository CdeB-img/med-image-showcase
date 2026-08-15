import { describe, expect, it } from "vitest";
import { contributionToKnowledgeRequest, executeContributionKnowledgeVerification } from "../knowledge";
import { projectScientificContributionToV1 } from "../v1-compatibility";
import type { ScientificInterpretationContributionEnvelope } from "../contracts";

const NOW = "2026-08-15T12:00:00.000Z";
const RAW = "Je souhaite étudier l'effet de la colchicine dans l'infarctus du myocarde, étudier les marqueurs de l'inflammation et quantifier les lésions à l'IRM et en biologie, chez deux populations médicaments vs placebo, dans une étude multicentrique créée de toutes pièces.";

const boundary = () => ({
  ownership: "USER",
  epistemicStatus: "EXPLICIT_USER_STATED",
  adoptionStatus: null,
  activeState: true,
  sourceTurnIds: ["turn:raw"],
  sourceText: null,
});

const contribution = (): ScientificInterpretationContributionEnvelope => ({
  contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
  contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
  identity: { contributionId: "contribution:production", contractVersion: "1.0.0", runtimeId: "HYBRID_PRIMARY_STRUCTURED", runtimeVersion: "1.2.0", createdAt: NOW, contributionDigest: "digest:production" },
  source: { conversationId: "conversation:production", originalRequest: RAW, turns: [{ turnId: "turn:raw", role: "USER", content: RAW, createdAt: NOW }], sourceRefs: ["turn:raw"], rawOutputRef: "raw:production", rawOutputDigest: "raw-digest:production" },
  runtimeEvidence: { provider: "GEMINI", model: "fixture", promptDigest: "prompt", schemaDigest: "schema", configurationDigest: "configuration", technicalStatus: "STRUCTURED_CONTRACT_VALID", parseStatus: "PARSED", validationErrors: [] },
  scientificContent: {
    normalizedUnderstanding: RAW,
    routeProposal: { route: "DESIGN_STUDY", confidence: 1, reason: "Demande explicite." },
    explicitStatements: [],
    candidateObjects: [
      { itemId: "intervention:colchicine", semanticIdentity: "colchicine", proposedType: "INTERVENTION", content: "colchicine", polarity: "AFFIRMED", studyRole: "INTERVENTION_ARM", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "condition:idm", semanticIdentity: "myocardial-infarction", proposedType: "CONDITION", content: "infarctus du myocarde", polarity: "AFFIRMED", studyRole: "CONDITION", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "comparator:placebo", semanticIdentity: "placebo", proposedType: "COMPARATOR", content: "placebo", polarity: "AFFIRMED", studyRole: "COMPARATOR_ARM", confidence: 1, epistemicBoundary: boundary() },
      { itemId: "object:lossy-full-sentence", semanticIdentity: null, proposedType: "SCIENTIFIC_OBJECT", content: RAW, polarity: "AFFIRMED", studyRole: "SCIENTIFIC_OBJECT", confidence: 0.7, epistemicBoundary: boundary() },
    ],
    candidateRelations: [], inferredContext: [], contextualCandidates: [], negationsAndConstraints: [], temporalElements: [], ambiguities: [], unknowns: [], missingInformation: [], correctionsAndSupersessions: [], openDecisions: [], clarificationNeeds: [],
  },
  epistemicBoundary: { candidateIsAdopted: false, knowledgeSupportIsProjectDecision: false, projectOwnershipTransferred: false, humanDecisionEnvelopeRef: null },
  mapping: [], audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
  decisionBoundary: { decisionRequired: true, decisionEnvelopeRef: null, permittedHumanDispositions: ["ACCEPT_WORKING_BASIS"], projectWriteAuthorized: false },
});

describe("Contribution → Knowledge scientific object boundary", () => {
  it("keeps the 264-character raw object in Contribution while refusing to fabricate originalTerm", () => {
    const value = contribution();
    const request = contributionToKnowledgeRequest(value);
    const projection = projectScientificContributionToV1(value);

    expect(value.scientificContent.candidateObjects[3].content).toBe(RAW);
    expect(value.scientificContent.candidateObjects[3].content).toHaveLength(264);
    expect(value.source.originalRequest).toBe(RAW);
    expect(request.scientificObjectTerms.map((item) => item.term)).toEqual(["colchicine", "infarctus du myocarde", "placebo"]);
    expect(request.diagnostics).toContainEqual(expect.objectContaining({
      code: "SCIENTIFIC_OBJECT_ORIGINAL_TERM_TOO_LONG",
      path: ["scientificObjects", 3, "originalTerm"],
      payloadRef: "object:lossy-full-sentence",
      receivedLength: 264,
      originalValue: RAW,
    }));
    expect(projection.scientificSessionContext.preservedScientificTerms).toEqual(["colchicine", "infarctus du myocarde", "placebo"]);
    expect(projection.scientificSessionContext.interpretationTrace?.legacyProjectionLosses).toContainEqual(expect.objectContaining({
      itemId: "object:lossy-full-sentence",
      reason: expect.stringContaining("SCIENTIFIC_OBJECT_ORIGINAL_TERM_TOO_LONG"),
    }));
  });

  it("uses a grounded atomic source span without shortening or summarizing free content", () => {
    const value = contribution();
    value.scientificContent.candidateObjects[3].epistemicBoundary.sourceText = "inflammation";
    const request = contributionToKnowledgeRequest(value);
    expect(request.scientificObjectTerms[3]).toMatchObject({ term: "inflammation", role: "CONTEXT" });
    expect(request.diagnostics).toEqual([]);
    expect(value.scientificContent.candidateObjects[3].content).toBe(RAW);
  });

  it("keeps an overlong relation in Contribution while the Knowledge verification remains executable", () => {
    const value = contribution();
    value.scientificContent.candidateRelations = [{
      relationId: "relation:long",
      relationType: "ASSOCIATED_WITH",
      sourceItemId: "intervention:colchicine",
      targetItemId: "object:lossy-full-sentence",
      polarity: "AFFIRMED",
      confidence: 0.7,
      epistemicBoundary: boundary(),
    }];
    const request = contributionToKnowledgeRequest(value);

    expect(value.scientificContent.candidateRelations).toHaveLength(1);
    expect(request.relations).toEqual([]);
    expect(request.diagnostics).toContainEqual(expect.objectContaining({
      code: "KNOWLEDGE_RELATION_TOO_LONG",
      path: ["relations", 0],
      originalValue: expect.stringContaining(RAW),
    }));
    expect(() => executeContributionKnowledgeVerification(value)).not.toThrow();
    expect(executeContributionKnowledgeVerification(value)).not.toBeNull();
  });
});
