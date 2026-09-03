import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type { ScientificContributionItem, ScientificInterpretationTurn } from "@/features/scientific-interpretation";
import { FUNCTIONAL_RESET_STORAGE_KEY, type FunctionalResetSession } from "../session";
import { makeFunctionalResetBridgeResponse, makeFunctionalResetContribution } from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>();
  return { ...original, requestProtocolDesignerBridge: runtime.request };
});

const REQUEST = "Je veux construire une étude comparative avec un critère quantitatif principal et discuter la stratégie analytique.";
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const stored = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;

const completePreAnalysisContribution = (turns: ScientificInterpretationTurn[]) => {
  const contribution = makeFunctionalResetContribution(turns);
  const source = contribution.scientificContent.candidateObjects[0]!;
  const make = (id: string, proposedType: string, content: string, studyRole = proposedType): ScientificContributionItem => ({
    ...source,
    itemId: id,
    semanticIdentity: id,
    proposedType,
    content,
    studyRole,
  });
  const candidateObjects = [
    make("question:biostatistics:standard", "SCIENTIFIC_QUESTION", "Quel est le contraste du critère principal entre les groupes ?"),
    make("objective:biostatistics:standard", "OBJECTIVE", "Estimer et comparer le critère principal entre les groupes", "PRIMARY"),
    make("hypothesis:biostatistics:standard", "HYPOTHESIS", "Le critère principal diffère entre les groupes", "PRIMARY"),
    make("design:biostatistics:standard", "STUDY_DESIGN", "étude comparative prospective"),
    make("population:biostatistics:standard", "POPULATION", "adultes avec condition, âge, éligibilité, critères d’inclusion et d’exclusion"),
    make("intervention:biostatistics:standard", "INTERVENTION", "exposition étudiée"),
    make("comparator:biostatistics:standard", "COMPARATOR", "groupe de référence"),
    make("group:biostatistics:standard:1", "GROUP", "groupe exposé"),
    make("group:biostatistics:standard:2", "GROUP", "groupe de référence"),
    make("endpoint:biostatistics:standard", "ENDPOINT", "critère quantitatif principal", "PRIMARY"),
    make("variable:biostatistics:standard", "CANONICAL_VARIABLE", "mesure quantitative principale", "PRIMARY"),
    make("modality:biostatistics:standard", "MODALITY", "IRM"),
    make("acquisition:biostatistics:standard", "ACQUISITION", "acquisition IRM avec lecture, qualité, comparabilité et faisabilité qualifiées"),
    make("visit:biostatistics:standard", "VISIT", "visite principale à J30"),
  ];
  return {
    ...contribution,
    identity: {
      ...contribution.identity,
      contributionId: "contribution:scientific-stack-biostatistics-01:standard",
      contributionDigest: "digest:scientific-stack-biostatistics-01:standard",
    },
    scientificContent: {
      ...contribution.scientificContent,
      candidateObjects,
      candidateRelations: [],
    },
  };
};

describe("SCIENTIFIC-STACK-BIOSTATISTICS-01 — corridor Standard réel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async (request: { conversation: { turns: ScientificInterpretationTurn[] } }) =>
      makeFunctionalResetBridgeResponse(
        request.conversation.turns,
        completePreAnalysisContribution(request.conversation.turns.filter((turn) => turn.role === "USER")),
        "Je vous présente cette intention pour confirmation.",
      ));
  });

  afterEach(cleanup);

  it("dispatches QRY to Biostatistics, discusses read-only, then adopts only after the existing Human Review confirmation", async () => {
    renderDemo();
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: REQUEST } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await screen.findByTestId("functional-contribution-review");
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(stored().queryNavigation?.currentAction?.owner).toBe("BIOSTATISTICS"));
    await screen.findByTestId("standard-biostatistics-proposal");

    const afterDispatch = stored();
    const initialProjectVersion = afterDispatch.project!.versionId;
    expect(runtime.request).toHaveBeenCalledTimes(1);
    expect(afterDispatch.biostatisticsInteraction).toMatchObject({
      owner: "BIOSTATISTICS",
      capabilityId: "BIOSTATISTICS_PLANNING",
      status: "ACTIVE",
      sourceProjectVersion: initialProjectVersion,
      projectWriteAuthorized: false,
    });
    expect(afterDispatch.bridgeTraces.at(-1)).toMatchObject({
      requestKind: "POST_ADOPTION_QRY_CONTINUATION",
      provider: "NONE",
      calls: 0,
      continuationPresentationSource: "BIOSTATISTICS_STANDARD_PROJECTION",
    });
    expect(afterDispatch.scientificExecutionTraceLedger.events.some((event) => event.owner === "BIOSTATISTICS"
      && event.common?.stage === "BIOSTATISTICS_RESULT"
      && event.common.provider === "NONE")).toBe(true);
    expect(screen.queryByText(/BIOSTATISTICS_PLANNING|BIOSTATISTICS_REASONING_RESULT|TRACE/i)).toBeNull();

    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: "Pourquoi cette stratégie plutôt que des comparaisons séparées ?" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(await screen.findAllByText(/Aucune structure comparative ou longitudinale|Le Project porte une structure comparative/i))
      .not.toHaveLength(0);
    expect(stored().project?.versionId).toBe(initialProjectVersion);
    expect(runtime.request).toHaveBeenCalledTimes(1);

    const card = screen.getByTestId("standard-biostatistics-proposal");
    fireEvent.click(within(card).getByRole("button", { name: "Retenir cette stratégie pour revue" }));
    expect(await screen.findAllByTestId("functional-contribution-review")).toHaveLength(2);
    expect(stored().project?.versionId).toBe(initialProjectVersion);
    expect(stored().biostatisticsInteraction?.status).toBe("PENDING_HUMAN_REVIEW");

    fireEvent.click(screen.getAllByRole("button", { name: "Cela correspond à mon projet" }).at(-1)!);
    await waitFor(() => expect(stored().project?.versionId).not.toBe(initialProjectVersion));
    expect(stored().biostatisticsInteraction?.status).toBe("ADOPTED");
    expect(stored().project?.sections.find((section) => section.sectionId === "ANALYSIS")?.elements)
      .toContainEqual(expect.objectContaining({ sourceProposedType: "ANALYSIS_SPECIFICATION" }));
    expect(runtime.request).toHaveBeenCalledTimes(1);
  });
});
