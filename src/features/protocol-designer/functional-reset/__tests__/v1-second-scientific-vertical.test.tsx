import { loadFunctionalResetSession as readPersistedSessionForTest } from "@/features/protocol-designer/functional-reset/session";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type { ProductBridgeRequest, ProductBridgeResponse } from "@/features/protocol-designer/product-bridge";
import {
  behaviorContribution,
  behaviorItem,
} from "./p1-behavior-01a-contract-fixtures";
import {
  makeFunctionalResetBridgeResponse,
  makeGovernedPostAdoptionResponse,
} from "./functional-reset-fixtures";
import { confirmResearchProjectContribution, ensureCanonicalProjectState } from "@/features/research-project-construction";
import {
  FUNCTIONAL_RESET_STORAGE_KEY,
  type FunctionalResetSession,
} from "../session";
import { buildStudyDeliverablePortfolio, buildStudyPackageZipBytes } from "@/features/document-projection";

const runtime = vi.hoisted(() => ({ bridge: vi.fn(), language: vi.fn() }));
vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>();
  return {
    ...original,
    requestProtocolDesignerBridge: runtime.bridge,
    requestConversationLanguageProjection: runtime.language,
  };
});

const INITIAL = "Nous avons développé une mesure quantitative automatisée de la fibrose myocardique à partir d’une IRM cardiaque avec rehaussement tardif au gadolinium. Nous souhaitons la valider dans plusieurs centres par rapport à une évaluation manuelle réalisée par des experts, mais nous n’avons pas encore décidé du cadre exact de validation ni du critère principal de performance.";
const CORRECTION = "Je modifie cette étude : je retiens une validation méthodologique prospective multicentrique. La mesure automatisée sera comparée à l’évaluation manuelle experte au niveau du patient. Le critère principal sera l’accord absolu entre les deux mesures.";
const OBJECTIVE = "Valider dans plusieurs centres la mesure quantitative automatisée de la fibrose myocardique par rapport à une évaluation manuelle experte";
const QUESTION = "Dans quelle mesure la mesure quantitative automatisée de la fibrose myocardique concorde-t-elle avec une évaluation manuelle experte dans plusieurs centres ?";
const AUTOMATED_MEASUREMENT = "Mesure quantitative automatisée de la fibrose myocardique";
const EXPERT_REFERENCE = "Évaluation manuelle réalisée par des experts";
const IMAGING = "IRM cardiaque avec rehaussement tardif au gadolinium";
const DESIGN = "Étude de validation méthodologique prospective multicentrique";
const PRIMARY_ENDPOINT = "Accord absolu entre la mesure automatisée et l’évaluation manuelle experte au niveau du patient";

const stored = () => readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true) as FunctionalResetSession;
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const submit = (text: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const fixtureResponse = (request: ProductBridgeRequest): ProductBridgeResponse => {
  if (request.requestKind === "POST_ADOPTION_QRY_CONTINUATION") {
    const governed = makeGovernedPostAdoptionResponse(request);
    return {
      ...governed,
      conversationFailure: {
        stage: "CONFORMANCE",
        code: "LOCAL_V1_PROVIDER_DISABLED",
        message: "Provider execution is disabled for this deterministic V1 qualification.",
        provider: null,
      },
      observability: {
        ...governed.observability,
        model: "GOVERNED_LOCAL_REALIZATION",
        conversationModel: "GOVERNED_LOCAL_REALIZATION",
        conversationCalls: 0,
        conversationResponseReceived: false,
        conversationLatencyMs: 0,
        calls: 0,
      },
    };
  }
  const userTurns = request.conversation.turns.filter((turn) => turn.role === "USER");
  const turn = userTurns.at(-1)!;
  const isCorrection = Boolean(request.currentProject);
  const contribution = behaviorContribution({
    contributionId: `contribution:v1-fibrosis-validation:${userTurns.length}`,
    previousContributionId: request.currentProject?.contributionRef ?? null,
    turns: [turn],
    candidateObjects: isCorrection ? [
      behaviorItem({
        itemId: "study-design:validation-framework:v2",
        semanticIdentity: "study-design:validation-framework",
        previousItemIds: ["study-design:validation-framework"],
        proposedType: "STUDY_DESIGN",
        content: DESIGN,
        turnId: turn.turnId,
      }),
      behaviorItem({
        itemId: "endpoint:primary-performance:v2",
        semanticIdentity: "endpoint:primary-performance",
        previousItemIds: ["endpoint:primary-performance"],
        proposedType: "ENDPOINT",
        studyRole: "PRIMARY_ENDPOINT",
        content: PRIMARY_ENDPOINT,
        turnId: turn.turnId,
      }),
    ] : [
      behaviorItem({ itemId: "question:automated-vs-expert", proposedType: "SCIENTIFIC_QUESTION", content: QUESTION, turnId: turn.turnId }),
      behaviorItem({ itemId: "objective:multicenter-validation", proposedType: "OBJECTIVE", studyRole: "PRIMARY", content: OBJECTIVE, turnId: turn.turnId }),
      behaviorItem({ itemId: "measurement:automated-fibrosis", proposedType: "MEASUREMENT", content: AUTOMATED_MEASUREMENT, turnId: turn.turnId }),
      behaviorItem({ itemId: "comparator:expert-manual", proposedType: "COMPARATOR", studyRole: "REFERENCE_METHOD", content: EXPERT_REFERENCE, turnId: turn.turnId }),
      behaviorItem({ itemId: "modality:lge-cmr", proposedType: "IMAGING_MODALITY", content: IMAGING, turnId: turn.turnId }),
      behaviorItem({ itemId: "setting:multicenter", proposedType: "PROJECT_INFORMATION", studyRole: "STUDY_SETTING", content: "Validation dans plusieurs centres", turnId: turn.turnId }),
      behaviorItem({
        itemId: "study-design:validation-framework",
        semanticIdentity: "study-design:validation-framework",
        proposedType: "STUDY_DESIGN",
        content: "Cadre exact de validation non encore décidé",
        turnId: turn.turnId,
        epistemicState: "UNKNOWN",
        polarity: "UNKNOWN",
      }),
      behaviorItem({
        itemId: "endpoint:primary-performance",
        semanticIdentity: "endpoint:primary-performance",
        proposedType: "ENDPOINT",
        studyRole: "PRIMARY_ENDPOINT",
        content: "Critère principal de performance non encore décidé",
        turnId: turn.turnId,
        epistemicState: "UNKNOWN",
        polarity: "UNKNOWN",
      }),
    ],
  });
  contribution.source.conversationId = request.conversation.conversationId;
  const response = makeFunctionalResetBridgeResponse(
    request.conversation.turns,
    contribution,
    isCorrection
      ? "J’ai compris votre correction du cadre de validation et du critère principal. Je vous la présente pour confirmation avant toute modification du projet."
      : "J’ai compris que vous souhaitez valider dans plusieurs centres une mesure automatisée de fibrose myocardique par rapport à une évaluation manuelle experte. Le cadre de validation et le critère principal restent ouverts avant votre confirmation.",
  );
  return {
    ...response,
    observability: {
      ...response.observability,
      model: "LOCAL_V1_FIBROSIS_VALIDATION_FIXTURE",
      conversationLatencyMs: 0,
      extractionLatencyMs: 0,
      conversationCalls: 0,
      conversationResponseReceived: false,
      calls: 0,
    },
  };
};

describe("V1 — seconde verticale Standard, validation multicentrique d’une mesure", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.bridge.mockReset();
    runtime.language.mockReset();
    runtime.bridge.mockImplementation(async (request: ProductBridgeRequest) => fixtureResponse(request));
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("V1_SECOND_VERTICAL_NETWORK_FORBIDDEN"); }));
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:v1-second-vertical") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps documentary projections available when a provider-shaped Project contains an UNKNOWN variable", () => {
    const sourceTurn = { turnId: "turn:v1-documents:unknown-variable", role: "USER" as const, content: "Une mesure précoce reste à définir.", createdAt: "2026-09-09T10:00:00.000Z" };
    const contribution = behaviorContribution({
      contributionId: "contribution:v1-documents:unknown-variable",
      turns: [sourceTurn],
      candidateObjects: [
        behaviorItem({ itemId: "objective:unknown-variable", proposedType: "OBJECTIVE", content: "Structurer une étude", turnId: sourceTurn.turnId }),
        behaviorItem({ itemId: "variable:early-unspecified", proposedType: "MEASURED_VARIABLE", content: "Évaluation d’un paramètre précoce, dont la nature n’est pas précisée", turnId: sourceTurn.turnId, epistemicState: "UNKNOWN", polarity: "UNKNOWN" }),
      ],
    });
    const project = confirmResearchProjectContribution({
      contribution,
      current: null,
      projectId: "project:v1-documents:unknown-variable",
      authority: { actorRef: "v1-documents:test", mandateRef: "PROJECT_OWNER", authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION", verification: "DEMO_SESSION_NOT_AUTHENTICATED" },
      confirmedAt: "2026-09-09T10:01:00.000Z",
    });
    expect(ensureCanonicalProjectState(project).objects).toContainEqual(expect.objectContaining({ objectType: "CANONICAL_VARIABLE", epistemicState: "UNKNOWN" }));
    const portfolio = buildStudyDeliverablePortfolio({ project, protocolProjection: null, generatedAt: project.adoptedAt });
    expect(portfolio.manifest.variableMappings).toEqual([]);
    expect(portfolio.artifacts.find((item) => item.kind === "CRF")).toMatchObject({ status: "MISSING_DECISION", files: [] });
  });

  it("advances from the free-text idea to a useful design decision, correction, Project v2, protocol and HTML export", async () => {
    renderDemo();

    submit(INITIAL);
    const firstReview = await screen.findByTestId("functional-contribution-review");
    expect(screen.getByText(/Je vous propose de les organiser dans une première compréhension structurée/)).toBeInTheDocument();
    expect(firstReview).toHaveTextContent(OBJECTIVE);
    expect(firstReview).toHaveTextContent(AUTOMATED_MEASUREMENT);
    expect(firstReview).toHaveTextContent(EXPERT_REFERENCE);
    expect(firstReview).toHaveTextContent(IMAGING);
    expect(stored().project).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await screen.findByText("Projet créé.");
    await waitFor(() => expect(stored().project?.revision).toBe(1));
    const projectV1 = structuredClone(stored().project!);

    const studyDesign = await screen.findByTestId("standard-study-design-proposal");
    expect(within(studyDesign).getByText(/Validation méthodologique comparative/)).toBeInTheDocument();
    expect(studyDesign).toHaveTextContent(/Estimer l’accord, les différences et la répétabilité entre méthodes/);
    expect(stored().studyDesignInteraction).toMatchObject({ status: "ACTIVE", projectWriteAuthorized: false });
    expect(stored().knowledgeOwnerLedger.entries.some((entry) => entry.request.owner === "STUDY_DESIGN"
      && entry.request.capabilityId === "STUDY_DESIGN_COHERENCE")).toBe(true);
    expect(stored().project).toEqual(projectV1);

    submit("Je rejette toutes ces options.");
    await screen.findByText(/Aucune option n’est retenue et le projet reste inchangé/);
    expect(stored().studyDesignInteraction).toMatchObject({ status: "REJECTED" });
    expect(stored().project).toEqual(projectV1);

    submit(CORRECTION);
    await waitFor(() => expect(runtime.bridge).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getAllByTestId("functional-contribution-review")).toHaveLength(2));
    expect(stored().project).toEqual(projectV1);
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await screen.findByText("Projet mis à jour.");
    await waitFor(() => expect(stored().project?.revision).toBe(2));

    const projectV2 = stored().project!;
    expect(projectV2.previousVersionId).toBe(projectV1.versionId);
    const currentObjects = projectV2.canonicalState.objects.filter((object) => object.actuality === "CURRENT");
    expect(currentObjects.map((object) => object.content)).toEqual(expect.arrayContaining([
      QUESTION,
      OBJECTIVE,
      AUTOMATED_MEASUREMENT,
      EXPERT_REFERENCE,
      IMAGING,
      DESIGN,
      PRIMARY_ENDPOINT,
    ]));
    expect(currentObjects).toContainEqual(expect.objectContaining({ objectType: "STUDY_DESIGN", content: DESIGN, epistemicState: "KNOWN" }));
    expect(currentObjects).toContainEqual(expect.objectContaining({ objectType: "ENDPOINT", content: PRIMARY_ENDPOINT, epistemicState: "KNOWN" }));

    submit("Affiche-moi un premier protocole de travail.");
    const preview = await screen.findByTestId("functional-protocol-preview");
    expect(within(preview).getByText("PROTOCOLE DE TRAVAIL")).toBeInTheDocument();
    expect(within(preview).getByText(/projet version 2/)).toBeInTheDocument();
    expect(preview.textContent).toContain(OBJECTIVE);
    expect(preview.textContent).toContain(DESIGN);
    expect(preview.textContent).toContain(PRIMARY_ENDPOINT);
    fireEvent.click(within(preview).getByRole("button", { name: "Télécharger le protocole (.html)" }));
    await waitFor(() => expect(stored().scientificExecutionTraceLedger.events.map((event) => event.common?.stage)).toContain("ARTIFACT_GENERATED"));
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));

    fireEvent.click(within(preview).getByRole("button", { name: "Retour à la conversation" }));
    submit("Exporte mon CRF pour mon logiciel de collecte.");
    const portfolioWorkspace = await screen.findByTestId("study-deliverable-workspace");
    for (const title of [
      "Protocole complet",
      "Synopsis",
      "Schedule of Activities",
      "CRF",
      "Data Dictionary",
      "Data Management Plan",
      "Export EDC",
      "Statistical Analysis Plan",
      "Documents réglementaires / éthiques",
      "Guide Imaging / Core Lab",
    ]) expect(within(portfolioWorkspace).getByRole("heading", { name: title })).toBeInTheDocument();
    expect(within(screen.getByTestId("study-deliverable-STATISTICAL_ANALYSIS_PLAN")).getByText("Décision requise")).toBeInTheDocument();
    expect(within(screen.getByTestId("study-deliverable-REGULATORY_DOCUMENT_PACKAGE")).getByText("Profil requis")).toBeInTheDocument();

    const finalSession = stored();
    const projectBeforeProjection = structuredClone(projectV2);
    const protocolProjection = finalSession.documents.projections.find((projection) => projection.source.projectVersion === projectV2.versionId)!;
    const portfolio = buildStudyDeliverablePortfolio({ project: projectV2, protocolProjection, generatedAt: protocolProjection.requestedAt });
    expect(projectV2).toEqual(projectBeforeProjection);
    expect(finalSession.project).toEqual(projectV2);
    expect(portfolio.owner).toBe("DOC-001");
    expect(portfolio.projectRef).toEqual({ projectId: projectV2.projectId, projectVersion: projectV2.versionId, projectDigest: projectV2.projectDigest });
    expect(portfolio.projectWriteAuthorized).toBe(false);
    expect(portfolio.manifest.regulatoryComplianceClaim).toBe(false);
    const canonicalVariable = currentObjects.find((object) => object.objectType === "CANONICAL_VARIABLE")!;
    expect(canonicalVariable.content).toBe(AUTOMATED_MEASUREMENT);
    for (const kind of ["SCHEDULE_OF_ACTIVITIES", "CRF", "DATA_DICTIONARY", "EDC_IMPORT_PACKAGE", "STATISTICAL_ANALYSIS_PLAN"] as const) {
      expect(portfolio.artifacts.find((item) => item.kind === kind)?.canonicalVariableRefs).toContain(canonicalVariable.objectId);
    }
    const redcap = portfolio.artifacts.find((item) => item.kind === "EDC_IMPORT_PACKAGE")!.files.find((file) => file.fileName === "redcap-data-dictionary.csv")!;
    expect(redcap.content).toContain("Variable / Field Name,Form Name");
    expect(redcap.content).toContain("record_id,study_identification");
    expect(redcap.content).toContain(canonicalVariable.objectId);
    const redcapScientificField = portfolio.manifest.variableMappings.find((item) => item.canonicalVariableId === canonicalVariable.objectId)!;
    expect(redcapScientificField.redcapFieldName.length).toBeLessThanOrEqual(26);
    expect(portfolio.artifacts.find((item) => item.kind === "EDC_IMPORT_PACKAGE")).toMatchObject({ status: "PARTIAL" });
    expect(portfolio.artifacts.find((item) => item.kind === "STATISTICAL_ANALYSIS_PLAN")).toMatchObject({ status: "MISSING_DECISION" });
    expect(portfolio.artifacts.find((item) => item.kind === "SCHEDULE_OF_ACTIVITIES")).toMatchObject({ status: "PARTIAL" });
    expect(portfolio.artifacts.find((item) => item.kind === "REGULATORY_DOCUMENT_PACKAGE")).toMatchObject({ status: "PROFILE_REQUIRED" });
    const fullProtocol = portfolio.artifacts.find((item) => item.kind === "PROTOCOL_FULL")!.files.find((file) => file.fileName === "protocol-complet.html")!;
    expect(fullProtocol.content).toContain("Données et collecte");
    expect(fullProtocol.content).toContain("Gestion des données");
    expect(fullProtocol.content).toContain("Cadre réglementaire et éthique");
    expect(fullProtocol.content).toContain(PRIMARY_ENDPOINT);
    expect(portfolio.manifest.canonicalCrfPackageRef).toMatch(/^canonical-crf-package:/u);
    expect(portfolio.manifest.variableMappings).toContainEqual(expect.objectContaining({ canonicalVariableId: canonicalVariable.objectId }));
    expect(() => buildStudyDeliverablePortfolio({
      project: projectV2,
      protocolProjection: { ...protocolProjection, source: { ...protocolProjection.source, projectDigest: "mismatched-digest" } },
      generatedAt: protocolProjection.requestedAt,
    })).toThrow("STUDY_DELIVERABLE_PROTOCOL_PROJECT_BINDING_MISMATCH");
    const zipBytes = buildStudyPackageZipBytes(portfolio);
    expect([...zipBytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect([...zipBytes.slice(-22, -18)]).toEqual([0x50, 0x4b, 0x05, 0x06]);
    expect(new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength).getUint16(zipBytes.byteLength - 12, true))
      .toBe(portfolio.artifacts.reduce((count, item) => count + item.files.length, 1));
    const uncompressedZipText = new TextDecoder().decode(zipBytes);
    for (const fileName of ["manifest.json", "protocol-complet.html", "synopsis.html", "schedule-of-activities.csv", "crf.html", "data-dictionary.csv", "canonical-crf-package.json", "redcap-data-dictionary.csv", "statistical-analysis-plan.html", "regulatory-package-index.json", "imaging-core-lab-manual.html"]) {
      expect(uncompressedZipText).toContain(fileName);
    }

    fireEvent.click(within(portfolioWorkspace).getByTestId("download-study-package"));
    expect(URL.createObjectURL).toHaveBeenLastCalledWith(expect.any(Blob));

    expect(runtime.language).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toMatch(/ownerResultRef|traceRunId|STUDY_DESIGN_COHERENCE|QUERY_NAVIGATION/);
  });
});
