import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ResearchProjectConstructionView from "../ResearchProjectConstructionView";
import { createResearchProjectConstructionSession } from "../session";
import { makeProjectInput } from "./fixtures";

describe("PRJ-001 — UX progressive et retours amont", () => {
  it("affiche les huit étapes métier, la progression et aucune sortie JSON", () => {
    const session = createResearchProjectConstructionSession(makeProjectInput());
    const { container } = render(<ResearchProjectConstructionView session={session} onChange={vi.fn()} onReturnToScientificThinking={vi.fn()} />);
    ["Question scientifique", "Population", "Design", "Groupes et temporalité", "Critères et mesures", "Faisabilité", "Risques et alternatives", "Stratégie de projet"].forEach((label) => expect(screen.getByRole("button", { name: new RegExp(label, "i") })).toBeInTheDocument());
    expect(screen.getByText(/Étape 1 sur environ 8/)).toBeInTheDocument();
    expect(container.querySelector("pre")).toBeNull();
    expect(container.textContent).not.toContain('"projectId"');
  });

  it("explique pourquoi chaque question adaptative est posée et accepte Je ne sais pas", () => {
    const session = createResearchProjectConstructionSession(makeProjectInput({ population: [], pathology: [], outcomes: [], objectives: false, hypotheses: false }));
    render(<ResearchProjectConstructionView session={session} onChange={vi.fn()} onReturnToScientificThinking={vi.fn()} />);
    expect(screen.getAllByText(/Pourquoi :/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Influence :/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Je ne sais pas" }).length).toBeGreaterThan(0);
  });

  it("permet les retours vers Scientific Thinking, Imaging et Knowledge sans réinitialiser la session", () => {
    const onST = vi.fn();
    const onIMG = vi.fn();
    const onKnowledge = vi.fn();
    const session = createResearchProjectConstructionSession(makeProjectInput());
    render(<ResearchProjectConstructionView session={session} onChange={vi.fn()} onReturnToScientificThinking={onST} onReturnToImaging={onIMG} onExploreKnowledge={onKnowledge} />);
    fireEvent.click(screen.getByRole("button", { name: /Revenir à Scientific Thinking/ }));
    fireEvent.click(screen.getByRole("button", { name: /Revenir à Imaging/ }));
    fireEvent.click(screen.getByRole("button", { name: /Explorer le concept/ }));
    expect(onST).toHaveBeenCalledOnce();
    expect(onIMG).toHaveBeenCalledOnce();
    expect(onKnowledge).toHaveBeenCalledOnce();
  });

  it("montre les impacts avant confirmation d’un changement majeur", async () => {
    const { requestProjectChange } = await import("../session");
    let session = createResearchProjectConstructionSession(makeProjectInput());
    const endpoint = session.result.endpointCandidates[0];
    session = requestProjectChange(session, { eventType: "EndpointChanged", description: "Modification majeure du Critère.", sourceIds: [endpoint.endpointId], targetIds: [endpoint.endpointId] });
    render(<ResearchProjectConstructionView session={session} onChange={vi.fn()} onReturnToScientificThinking={vi.fn()} />);
    expect(screen.getByRole("alertdialog", { name: /Modification majeure du Critère/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmer et créer une nouvelle révision candidate/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Conserver la version actuelle/ })).toBeInTheDocument();
  });
});
