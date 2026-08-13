import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SemanticConversationalWorkspace from "../SemanticConversationalWorkspace";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "./fixtures";

const reconstructed = canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate: comparisonCandidate(), critic: acceptedCritic(), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" });

vi.mock("../client", () => ({
  requestSemanticReconstruction: vi.fn(async () => ({ mode: "LIVE_LLM", providerStatus: "AVAILABLE", model: reconstructed })),
  SemanticClientError: class SemanticClientError extends Error {},
}));
vi.mock("../knowledge", () => ({ verifySemanticModelWithKnowledge: (model: unknown) => model }));

describe("SEM-001 conversational workspace", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts with free conversation and no generic Actor or Mandate form", () => {
    render(<SemanticConversationalWorkspace onOpenStructuredProject={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Conversation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Projet en construction" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Décrivez librement/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Acteur humain/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Mandat/i)).not.toBeInTheDocument();
  });

  it("shows semantic objects and relations after a natural message", async () => {
    render(<SemanticConversationalWorkspace onOpenStructuredProject={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Décrivez librement/), { target: { value: "Je veux comparer CT et IRM cardiaque." } });
    fireEvent.click(screen.getByRole("button", { name: /Commencer la conversation/ }));
    await waitFor(() => expect(screen.getAllByText("CT").length).toBeGreaterThan(0));
    expect(screen.getAllByText("IRM").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/critère de comparaison/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Confirmer cette compréhension/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Audit / mode expert" }));
    expect(screen.getByRole("heading", { name: "Audit du modèle sémantique" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Conversation" })).toBeInTheDocument();
    expect(screen.getByLabelText("Votre question scientifique")).toBeInTheDocument();
    expect(screen.getByText("Relations du graphe sémantique")).toBeInTheDocument();
  });
});
