import { loadFunctionalResetSession as readPersistedSessionForTest } from "@/features/protocol-designer/functional-reset/session";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type { ScientificContributionItem, ScientificInterpretationTurn } from "@/features/scientific-interpretation";
import { FUNCTIONAL_RESET_STORAGE_KEY, type FunctionalResetSession } from "../session";
import CanonicalStudyDataStandardCard from "../CanonicalStudyDataStandardCard";
import DataManagementStandardCard from "../DataManagementStandardCard";
import type { StandardCanonicalStudyDataInteraction, StandardCanonicalStudyDataPresentation } from "../canonical-study-data-standard";
import type { StandardDataManagementInteraction, StandardDataManagementPresentation } from "../data-management-standard";
import { makeFunctionalResetBridgeResponse, makeFunctionalResetContribution } from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>();
  return { ...original, requestProtocolDesignerBridge: runtime.request };
});

const REQUEST = "Je veux construire une étude longitudinale avec une mesure IRM principale, plusieurs visites et une analyse déjà définie.";
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const stored = () => readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true) as FunctionalResetSession;

const completeContribution = (turns: ScientificInterpretationTurn[]) => {
  const contribution = makeFunctionalResetContribution(turns);
  const source = contribution.scientificContent.candidateObjects[0]!;
  const make = (id: string, proposedType: string, content: string, studyRole = proposedType): ScientificContributionItem => ({
    ...source, itemId: id, semanticIdentity: id, proposedType, content, studyRole,
  });
  return {
    ...contribution,
    identity: { ...contribution.identity, contributionId: "contribution:scientific-stack-data-01r:standard", contributionDigest: "digest:scientific-stack-data-01r:standard" },
    scientificContent: {
      ...contribution.scientificContent,
      candidateObjects: [
        make("question:data:standard", "SCIENTIFIC_QUESTION", "Quelle trajectoire du critère principal faut-il estimer ?"),
        make("objective:data:standard", "OBJECTIVE", "Estimer la trajectoire du critère principal", "PRIMARY"),
        make("hypothesis:data:standard", "HYPOTHESIS", "Le critère évolue au cours du suivi", "PRIMARY"),
        make("design:data:standard", "STUDY_DESIGN", "cohorte longitudinale prospective"),
        make("population:data:standard", "POPULATION", "adultes avec condition, âge, éligibilité, critères d’inclusion et d’exclusion"),
        make("intervention:data:standard", "INTERVENTION", "exposition étudiée"),
        make("comparator:data:standard", "COMPARATOR", "groupe de référence"),
        make("group:data:standard:1", "GROUP", "groupe exposé"),
        make("group:data:standard:2", "GROUP", "groupe de référence"),
        make("endpoint:data:standard", "ENDPOINT", "volume ventriculaire gauche", "PRIMARY"),
        make("variable:data:standard", "CANONICAL_VARIABLE", "Volume télédiastolique ventriculaire gauche", "PRIMARY"),
        make("modality:data:standard", "MODALITY", "IRM"),
        make("acquisition:data:standard", "ACQUISITION", "acquisition IRM avec lecture, qualité, comparabilité et faisabilité qualifiées"),
        make("visit:data:standard", "VISIT", "visites à l’inclusion, 6 mois et 12 mois"),
        make("analysis:data:standard", "ANALYSIS_SPECIFICATION", "estimation longitudinale déjà définie"),
      ],
      candidateRelations: [],
    },
  };
};

const cdmPresentation: StandardCanonicalStudyDataPresentation = {
  presentationId: "cdm-presentation:test",
  resultRef: "cdm-result:test",
  title: "Structure canonique des données",
  introduction: "La structure est liée au projet courant. Aucune donnée réalisée n’a été créée.",
  variables: [{ label: "Volume télédiastolique ventriculaire gauche", occasionCount: 3 }],
  informationNeeds: [],
  limitations: [],
  plainText: "Structure canonique des données.",
};

const cdmInteraction: StandardCanonicalStudyDataInteraction = {
  contract: "FUNCTIONAL_RESET_CDM_INTERACTION",
  contractVersion: "1.0.0",
  owner: "STUDY_DATA_CDM",
  capabilityId: "STUDY_DATA_PLANNING",
  ownerResultRef: cdmPresentation.resultRef,
  ownerResultVersion: "1.0.0",
  sourceActionRef: "qry:cdm",
  sourceProjectRef: "project:1",
  sourceProjectVersion: "project:1:v1",
  sourceProjectDigest: "project:digest:1",
  presentationTurnRef: "turn:cdm",
  traceRunId: null,
  status: "ACTIVE",
  staleReason: null,
  projectWriteAuthorized: false,
};

const dmPresentation: StandardDataManagementPresentation = {
  presentationId: "dm-presentation:test",
  resultRef: "dm-result:test",
  title: "Préparation opérationnelle des données",
  introduction: "Les exigences opérationnelles restent logiques et aucune opération réelle n’a été exécutée.",
  collectionRequirementCount: 2,
  releaseStatus: "REQUIRED_UNRESOLVED",
  informationNeeds: ["Définir la source mandatée"],
  limitations: [],
  plainText: "Préparation opérationnelle des données.",
};

const dmInteraction: StandardDataManagementInteraction = {
  contract: "FUNCTIONAL_RESET_DATA_MANAGEMENT_INTERACTION",
  contractVersion: "1.0.0",
  owner: "DATA_MANAGEMENT",
  capabilityId: "DATA_MANAGEMENT_PLANNING",
  ownerResultRef: dmPresentation.resultRef,
  ownerResultVersion: "1.0.0",
  sourceActionRef: "qry:dm",
  sourceProjectRef: "project:1",
  sourceProjectVersion: "project:1:v1",
  sourceProjectDigest: "project:digest:1",
  sourceCdmResultDigest: "cdm:digest:1",
  presentationTurnRef: "turn:dm",
  traceRunId: null,
  status: "ACTIVE",
  staleReason: null,
  projectWriteAuthorized: false,
};

describe("SCIENTIFIC-STACK-DATA-01R — projections Standard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async (request: { conversation: { turns: ScientificInterpretationTurn[] } }) => makeFunctionalResetBridgeResponse(
      request.conversation.turns,
      completeContribution(request.conversation.turns.filter((turn) => turn.role === "USER")),
      "Je vous présente cette intention pour confirmation.",
    ));
  });

  afterEach(cleanup);

  it("keeps both cards concise, non-technical and explicitly actioned", () => {
    const onContinue = vi.fn();
    const onDiscuss = vi.fn();
    const { container, rerender } = render(<CanonicalStudyDataStandardCard presentation={cdmPresentation} interaction={cdmInteraction} onContinue={onContinue} onDiscuss={onDiscuss} />);
    expect(screen.getByTestId("standard-cdm-result")).toHaveTextContent("3 occasions attendues");
    expect(container.textContent).not.toMatch(/STUDY_DATA_CDM|STUDY_DATA_PLANNING|TRACE|resultDigest|projectWriteAuthorized/);
    fireEvent.click(screen.getByRole("button", { name: "Préparer la gestion des données" }));
    expect(onContinue).toHaveBeenCalledOnce();
    rerender(<DataManagementStandardCard presentation={dmPresentation} interaction={dmInteraction} onDiscuss={onDiscuss} />);
    expect(screen.getByTestId("standard-data-management-result")).toHaveTextContent("release encore requise");
    expect(container.textContent).not.toMatch(/DATA_MANAGEMENT_PLANNING|TRACE|resultDigest|projectWriteAuthorized/);
  });

  it("runs Project → QRY → CDM, then only after explicit action QRY → DM, with zero extra provider calls", async () => {
    renderDemo();
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: REQUEST } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await screen.findByTestId("functional-contribution-review");
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await screen.findByTestId("standard-cdm-result");

    const afterCdm = stored();
    expect(afterCdm.queryNavigation).toMatchObject({ owner: "QUERY_NAVIGATION", status: "OWNER_ACTION_READY", currentAction: { owner: "STUDY_DATA_CDM" } });
    expect(afterCdm.canonicalStudyDataInteraction).toMatchObject({ owner: "STUDY_DATA_CDM", status: "ACTIVE", projectWriteAuthorized: false });
    expect(afterCdm.dataManagementInteraction).toBeNull();
    expect(runtime.request).toHaveBeenCalledTimes(1);

    fireEvent.click(within(screen.getByTestId("standard-cdm-result")).getByRole("button", { name: "Préparer la gestion des données" }));
    await screen.findByTestId("standard-data-management-result");
    await waitFor(() => expect(stored().dataManagementInteraction?.status).toBe("ACTIVE"));
    const afterDm = stored();
    expect(afterDm.queryNavigation).toMatchObject({ owner: "QUERY_NAVIGATION", status: "OWNER_ACTION_READY", currentAction: { owner: "DATA_MANAGEMENT" } });
    expect(afterDm.canonicalStudyDataInteraction?.status).toBe("COMPLETED");
    expect(afterDm.dataManagementInteraction).toMatchObject({ owner: "DATA_MANAGEMENT", projectWriteAuthorized: false });
    expect(afterDm.project?.versionId).toBe(afterCdm.project?.versionId);
    expect(afterDm.bridgeTraces.at(-1)).toMatchObject({ requestKind: "POST_ADOPTION_QRY_CONTINUATION", provider: "NONE", calls: 0, continuationPresentationSource: "DATA_MANAGEMENT_STANDARD_PROJECTION" });
    expect(afterDm.scientificExecutionTraceLedger.events.map((event) => event.common?.stage)).toEqual(expect.arrayContaining(["CDM_RESULT", "DATA_MANAGEMENT_RESULT"]));
    expect(runtime.request).toHaveBeenCalledTimes(1);
  });
});
