import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
  type PersistentProjectRelation,
  type PersistentTemporalQualification,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  mergeInitialResearchProjectContributions,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { projectDocumentSourceFromFunctionalProject } from "@/features/document-projection";

const authority = {
  actorRef: "hands-on-03:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turnConversation = (turnId: string, raw: string, assistant?: string): ScientificInterpretationConversation => ({
  conversationId: "conversation:hands-on-03",
  language: "fr",
  turns: [
    ...(assistant ? [{ turnId: `${turnId}:assistant`, role: "NOXIA" as const, content: assistant }] : []),
    { turnId, role: "USER", content: raw },
  ],
});

const change = (
  raw: string,
  candidateRef: string,
  proposedType: string,
  content: string,
  studyRole?: string,
): PersistentProjectDeltaChange => ({
  operation: "ADD",
  sourceText: raw,
  candidateRef,
  semanticIdentity: candidateRef,
  proposedType,
  content,
  polarity: "AFFIRMED",
  ...(studyRole ? { studyRole } : {}),
  epistemicStatus: "EXPLICIT_USER_STATED",
  epistemicState: "KNOWN",
  assertionKind: "USER_STATED",
  evidenceRefs: [],
});

const relation = (
  raw: string,
  relationRef: string,
  relationType: string,
  sourceObjectRef: string,
  targetObjectRef: string,
  assertionKind: "USER_STATED" | "USER_ADOPTED_PROPOSAL" = "USER_STATED",
  proposalSourceText?: string,
): PersistentProjectRelation => ({
  relationRef,
  sourceText: raw,
  relationType,
  sourceObjectRef,
  targetObjectRef,
  polarity: "AFFIRMED",
  epistemicStatus: assertionKind === "USER_ADOPTED_PROPOSAL" ? "CONFIRMED_BY_USER" : "EXPLICIT_USER_STATED",
  epistemicState: "KNOWN",
  assertionKind,
  ...(proposalSourceText ? { proposalSourceText } : {}),
  evidenceRefs: [],
});

const dayWindow = (
  raw: string,
  qualificationId: string,
  subjectProjectRef: string,
  assertionKind: "USER_STATED" | "USER_ADOPTED_PROPOSAL" = "USER_STATED",
  proposalSourceText?: string,
): PersistentTemporalQualification => ({
  operation: "ADD",
  qualificationId,
  sourceText: raw,
  subjectProjectRef,
  temporalRole: "ACQUISITION_TIME",
  anchor: {
    kind: "WINDOW",
    direction: "AFTER",
    unit: "DAY",
    offset: null,
    lowerBound: 5,
    upperBound: 7,
    relativeEventLabel: "induction de l'ischémie",
    tolerance: null,
    reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
  },
  assertionKind,
  ...(proposalSourceText ? { proposalSourceText } : {}),
  evidenceRefs: [],
});

const contribution = (input: {
  turnId: string;
  raw: string;
  changes: PersistentProjectDeltaChange[];
  relations?: PersistentProjectRelation[];
  temporalQualifications?: PersistentTemporalQualification[];
  project?: ResearchProjectOwnerProjection | null;
  assistant?: string;
}) => {
  const conversation = turnConversation(input.turnId, input.raw, input.assistant);
  const checked = validatePersistentProjectDelta({
    changes: input.changes,
    relations: input.relations ?? [],
    temporalQualifications: input.temporalQualifications ?? [],
    expectedVariableOccasions: [],
  }, input.raw, input.project ?? null, conversation);
  expect(checked.validation.blocks).toEqual([]);
  expect(checked.validation.valid).toBe(true);
  return contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation,
    currentProject: input.project ?? null,
  })!;
};

const rawA = "Nous comparerons quantitativement le CT et l’IRM chez un modèle animal, avec des acquisitions entre J5 et J7.";
const rawB = "La méthode anatomique ex vivo avec découpe et marquage sera la référence de quantification.";

const initialContribution = () => {
  const first = contribution({
    turnId: "turn:a",
    raw: rawA,
    changes: [
      change(rawA, "acquisition:ct", "ACQUISITION", "Acquisition CT"),
      change(rawA, "acquisition:mri", "ACQUISITION", "Acquisition IRM"),
      change(rawA, "population:animal", "POPULATION", "Modèle animal", "SUBJECT"),
      change(rawA, "data-need:lesion-quantification", "DATA_NEED", "Quantification des lésions"),
    ],
    relations: [relation(rawA, "relation:ct-mri", "COMPARES_WITH", "acquisition:ct", "acquisition:mri")],
    temporalQualifications: [
      dayWindow(rawA, "timing:ct:j5-j7", "acquisition:ct"),
      dayWindow(rawA, "timing:mri:j5-j7", "acquisition:mri"),
    ],
  });
  const second = contribution({
    turnId: "turn:b",
    raw: rawB,
    changes: [
      change(rawB, "analysis:ex-vivo-reference", "ANALYSIS_SPECIFICATION", "Découpe, marquage et quantification anatomique ex vivo", "REFERENCE_STANDARD"),
    ],
  });
  return mergeInitialResearchProjectContributions(first, second);
};

function baseProject() {
  return confirmResearchProjectContribution({
    contribution: initialContribution(),
    current: null,
    projectId: "project:hands-on-03",
    authority,
    confirmedAt: "2026-08-24T12:00:00.000Z",
  });
}

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
});

describe("PROJECT-HANDS-ON-03 — canonical runtime path convergence", () => {
  it("P01 initial Project creation uses the canonical backbone", () => {
    const project = baseProject();
    expect(project).toMatchObject({ revision: 1, canonicalBackboneStatus: "PRJ_OWNED_CANONICAL_PROJECT_BACKBONE_ACTIVE", llmProjectWrites: 0 });
    expect(project.canonicalState?.currentVersionId).toBe(project.versionId);
  });

  it("P02 initial creation preserves multiple objects from successive unadopted turns", () => {
    const objects = ensureCanonicalProjectState(baseProject()).objects.filter((item) => item.actuality === "CURRENT");
    expect(objects.map((item) => item.content)).toEqual(expect.arrayContaining([
      "Acquisition CT",
      "Acquisition IRM",
      "Modèle animal",
      "Quantification des lésions",
      "Découpe, marquage et quantification anatomique ex vivo",
    ]));
  });

  it("P03 initial creation preserves a CT/MRI comparison relation", () => {
    const state = ensureCanonicalProjectState(baseProject());
    const ct = state.objects.find((item) => item.content === "Acquisition CT" && item.actuality === "CURRENT")!;
    const mri = state.objects.find((item) => item.content === "Acquisition IRM" && item.actuality === "CURRENT")!;
    expect(state.relations).toEqual(expect.arrayContaining([expect.objectContaining({
      actuality: "CURRENT",
      relationType: "COMPARES_WITH",
      sourceObjectRef: ct.objectId,
      targetObjectRef: mri.objectId,
    })]));
  });

  it("P04 initial creation preserves typed temporal facts", () => {
    const temporal = ensureCanonicalProjectState(baseProject()).temporalQualifications.filter((item) => item.actuality === "CURRENT");
    expect(temporal).toHaveLength(2);
    expect(temporal).toEqual(expect.arrayContaining([expect.objectContaining({ anchor: expect.objectContaining({ lowerBound: 5, upperBound: 7, unit: "DAY" }) })]));
  });

  it("P05 reference measurement method cannot be classified as a study intervention", () => {
    const raw = "La procédure ex vivo sera la référence.";
    const checked = validatePersistentProjectDelta({
      changes: [change(raw, "reference:invalid", "INTERVENTION", "Procédure ex vivo", "REFERENCE_STANDARD")],
      relations: [], temporalQualifications: [], expectedVariableOccasions: [],
    }, raw, null, turnConversation("turn:invalid-reference", raw));
    expect(checked.validation).toMatchObject({ valid: false, blocks: ["change:0:REFERENCE_STANDARD_NOT_STUDY_INTERVENTION_OR_ARM"] });
  });

  it("P06 post-creation Project-affecting turn invokes persistence", async () => {
    const project = baseProject();
    const raw = "Le suivi inclura une analyse de segmentation.";
    const args = { changes: [change(raw, "analysis:segmentation", "ANALYSIS_SPECIFICATION", "Analyse de segmentation")], relations: [], temporalQualifications: [], expectedVariableOccasions: [] };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ candidates: [{ content: { parts: [{ text: "Je retiens cette proposition d'analyse." }] } }] }))
      .mockResolvedValueOnce(jsonResponse({ id: "terra:p06", model: "gpt-5.6-terra", status: "completed", output_text: JSON.stringify(args) })) as unknown as typeof fetch;
    const request: ProductBridgeRequest = { apiVersion: "1.0.0", conversation: turnConversation("turn:p06", raw), currentProject: project, evaluatePersistentDelta: true };
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: "test-key", openAiApiKey: "test-openai-key", fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.body).toMatchObject({ persistentExtraction: { called: true, status: "CANDIDATE", contribution: expect.any(Object) } });
  });

  it("P07 blocked persistence is never reported as NO_CHANGE", async () => {
    const project = baseProject();
    const raw = "Je remplace une référence inexistante.";
    const args = { changes: [{ ...change(raw, "candidate:replacement", "ANALYSIS_SPECIFICATION", "Nouvelle analyse"), operation: "REPLACE", targetProjectRef: "project:missing" }], relations: [], temporalQualifications: [], expectedVariableOccasions: [] };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ candidates: [{ content: { parts: [{ text: "Je comprends la correction demandée." }] } }] }))
      .mockResolvedValueOnce(jsonResponse({ id: "terra:p07", model: "gpt-5.6-terra", status: "completed", output_text: JSON.stringify(args) })) as unknown as typeof fetch;
    const request: ProductBridgeRequest = { apiVersion: "1.0.0", conversation: turnConversation("turn:p07", raw), currentProject: project, evaluatePersistentDelta: true };
    const result = await executeProtocolDesignerBridge({ body: request, apiKey: "test-key", openAiApiKey: "test-openai-key", fetchImpl });
    expect(result.body).toMatchObject({ persistentExtraction: {
      status: "BLOCKED",
      failure: { code: "PERSISTENT_VALIDATION_BLOCKED", details: expect.arrayContaining([expect.stringContaining("PROJECT_REF_INVALID")]) },
    } });
  });

  it("P08 blocked persistence cannot advance Project truth", () => {
    const project = baseProject();
    const before = JSON.stringify(project);
    const raw = "Je remplace une référence inexistante.";
    const checked = validatePersistentProjectDelta({
      changes: [{ ...change(raw, "candidate:replacement", "ANALYSIS_SPECIFICATION", "Nouvelle analyse"), operation: "REPLACE", targetProjectRef: "project:missing" }],
      relations: [], temporalQualifications: [], expectedVariableOccasions: [],
    }, raw, project, turnConversation("turn:p08", raw));
    expect(checked.candidate).toBeNull();
    expect(JSON.stringify(project)).toBe(before);
  });

  it("P09 CT and MRI survive together as distinct acquisitions", () => {
    const current = ensureCanonicalProjectState(baseProject()).objects.filter((item) => item.actuality === "CURRENT");
    expect(current.filter((item) => item.objectType === "ACQUISITION").map((item) => item.content)).toEqual(expect.arrayContaining(["Acquisition CT", "Acquisition IRM"]));
  });

  it("P10 the comparison survives canonical adoption", () => {
    expect(ensureCanonicalProjectState(baseProject()).relations.some((item) => item.actuality === "CURRENT" && item.relationType === "COMPARES_WITH")).toBe(true);
  });

  it("P11 a user hypothesis remains Project hypothesis, not Knowledge evidence", () => {
    const project = baseProject();
    const raw = "Le CT pourrait être aussi précis que l’IRM grâce à sa résolution spatiale.";
    const value = contribution({ turnId: "turn:hypothesis", raw, project, changes: [change(raw, "hypothesis:ct-precision", "HYPOTHESIS", raw)] });
    const updated = confirmResearchProjectContribution({ contribution: value, current: project, projectId: project.projectId, authority, confirmedAt: "2026-08-24T12:01:00.000Z" });
    const hypothesis = ensureCanonicalProjectState(updated).objects.find((item) => item.objectId === "hypothesis:ct-precision" && item.actuality === "CURRENT")!;
    expect(hypothesis).toMatchObject({ objectType: "HYPOTHESIS", provenance: { sourcePlan: "USER", evidenceQualification: "NOT_EVALUATED" } });
  });

  it("P12 anatomical and imaging reference levels remain distinct", () => {
    const project = baseProject();
    const state = ensureCanonicalProjectState(project);
    const mri = state.objects.find((item) => item.content === "Acquisition IRM" && item.actuality === "CURRENT")!;
    const raw = "L’IRM est la référence actuelle en imagerie.";
    const replacement: PersistentProjectDeltaChange = {
      ...change(raw, "candidate:mri-reference", "ACQUISITION", "Acquisition IRM", "REFERENCE_STANDARD"),
      operation: "REPLACE",
      targetProjectRef: mri.objectId,
      semanticIdentity: mri.objectId,
    };
    const value = contribution({ turnId: "turn:mri-reference", raw, project, changes: [replacement] });
    const updated = confirmResearchProjectContribution({ contribution: value, current: project, projectId: project.projectId, authority, confirmedAt: "2026-08-24T12:02:00.000Z" });
    const refs = ensureCanonicalProjectState(updated).objects.filter((item) => item.actuality === "CURRENT" && item.scientificRole === "REFERENCE_STANDARD");
    expect(refs.map((item) => item.objectType)).toEqual(expect.arrayContaining(["ANALYSIS_SPECIFICATION", "ACQUISITION"]));
    expect(new Set(refs.map((item) => item.objectId)).size).toBe(2);
  });

  it("P13 grams/output unit survives as a canonical variable", () => {
    const project = baseProject();
    const raw = "Le résultat sera la masse de tissu lésé en grammes après segmentation.";
    const value = contribution({ turnId: "turn:grams", raw, project, changes: [change(raw, "variable:lesion-mass", "CANONICAL_VARIABLE", "Masse de tissu lésé en grammes", "MEASUREMENT")] });
    const candidate = prepareResearchProjectContributionCandidate(value, project);
    expect(candidate.canonicalChangeSet.objectChanges).toEqual([expect.objectContaining({ candidate: expect.objectContaining({ objectType: "CANONICAL_VARIABLE", content: expect.stringContaining("grammes") }) })]);
  });

  it("P14 segmentation survives without an invented algorithm", () => {
    const project = baseProject();
    const raw = "La quantification sera obtenue après segmentation.";
    const value = contribution({ turnId: "turn:segmentation", raw, project, changes: [change(raw, "analysis:segmentation", "ANALYSIS_SPECIFICATION", "Segmentation pour la quantification")] });
    const candidate = prepareResearchProjectContributionCandidate(value, project);
    const serialized = JSON.stringify(candidate.canonicalChangeSet);
    expect(serialized).toContain("Segmentation pour la quantification");
    expect(serialized).not.toMatch(/automatique|algorithme|seuil/i);
  });

  it("P15 an elliptical direct-comparison answer resolves only from supplied context", () => {
    const project = baseProject();
    const state = ensureCanonicalProjectState(project);
    const ct = state.objects.find((item) => item.content === "Acquisition CT" && item.actuality === "CURRENT")!;
    const exVivo = state.objects.find((item) => item.scientificRole === "REFERENCE_STANDARD" && item.actuality === "CURRENT")!;
    const raw = "la première";
    const assistant = "Première option : comparaison directe des mesures CT et IRM à la référence ex vivo.";
    const checked = validatePersistentProjectDelta({
      changes: [],
      relations: [relation(raw, "relation:direct-reference", "COMPARES_WITH", ct.objectId, exVivo.objectId, "USER_ADOPTED_PROPOSAL", assistant)],
      temporalQualifications: [], expectedVariableOccasions: [],
    }, raw, project, turnConversation("turn:elliptical", raw, assistant));
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.relations[0]).toMatchObject({ assertionKind: "USER_ADOPTED_PROPOSAL" });
  });

  it("P16 pig plus myocardial infarction survives as population and condition", () => {
    const project = baseProject();
    const raw = "Le modèle sera un infarctus du myocarde chez le cochon.";
    const value = contribution({ turnId: "turn:pig-mi", raw, project, changes: [
      change(raw, "population:pig", "POPULATION", "Cochon", "SUBJECT"),
      change(raw, "condition:mi", "CONDITION", "Infarctus du myocarde"),
    ] });
    const candidate = prepareResearchProjectContributionCandidate(value, project);
    expect(candidate.proposedSections.find((section) => section.sectionId === "POPULATION")?.elements.map((item) => item.content)).toEqual(expect.arrayContaining(["Cochon", "Infarctus du myocarde"]));
  });

  it("P17 J5-J7 preserves contextual anchor and user-adopted provenance", () => {
    const project = baseProject();
    const state = ensureCanonicalProjectState(project);
    const ct = state.objects.find((item) => item.content === "Acquisition CT" && item.actuality === "CURRENT")!;
    const mri = state.objects.find((item) => item.content === "Acquisition IRM" && item.actuality === "CURRENT")!;
    const raw = "J5-J7";
    const assistant = "Les acquisitions CT et IRM seront réalisées après l’induction de l’ischémie.";
    const value = contribution({
      turnId: "turn:j5-j7", raw, project, assistant, changes: [],
      temporalQualifications: [
        dayWindow(raw, "timing:ct:post-induction", ct.objectId, "USER_ADOPTED_PROPOSAL", assistant),
        dayWindow(raw, "timing:mri:post-induction", mri.objectId, "USER_ADOPTED_PROPOSAL", assistant),
      ],
    });
    const candidate = prepareResearchProjectContributionCandidate(value, project);
    expect(candidate.canonicalChangeSet.temporalQualificationChanges).toHaveLength(2);
    expect(candidate.canonicalChangeSet.temporalQualificationChanges[0]?.candidate?.provenance).toMatchObject({ assertionKind: "USER_ADOPTED_PROPOSAL", sourcePlan: "ASSISTANT_PROPOSAL" });
  });

  it("P18 Human Review covers every engaging canonical change", () => {
    const candidate = prepareResearchProjectContributionCandidate(initialContribution(), null);
    expect(candidate.humanReviewProjection).toMatchObject({
      status: "COMPLETE",
      missingChangeRefs: [],
      expectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs,
    });
  });

  it("P19 reload reconstructs the exact canonical Project", () => {
    const project = baseProject();
    expect(JSON.parse(JSON.stringify(project))).toEqual(project);
  });

  it("P20 DOC source remains a projection of adopted Project facts only", () => {
    const project = baseProject();
    const documentSource = projectDocumentSourceFromFunctionalProject(project, null);
    const serialized = JSON.stringify(documentSource);
    expect(serialized).toContain("Acquisition CT");
    expect(serialized).toContain("Acquisition IRM");
    expect(serialized).not.toContain("Première option :");
  });

  it("P21 QRY reads the current adopted Project version", () => {
    const project = baseProject();
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-08-24T12:10:00.000Z" });
    expect(navigation).toMatchObject({ projectRef: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest });
  });
});
