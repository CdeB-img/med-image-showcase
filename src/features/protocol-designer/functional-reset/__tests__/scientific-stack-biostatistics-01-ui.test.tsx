import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BiostatisticsStandardCard from "../BiostatisticsStandardCard";
import type { StandardBiostatisticsInteraction, StandardBiostatisticsPresentation } from "../biostatistics-standard";

const presentation: StandardBiostatisticsPresentation = {
  presentationId: "biostatistics-standard-presentation:test",
  resultRef: "biostatistics-result:test",
  title: "Stratégie analytique à discuter",
  introduction: "Deux stratégies restent défendables et aucune n’est sélectionnée.",
  options: [{
    optionRef: "strategy:longitudinal",
    label: "Estimation longitudinale exploitant les mesures répétées",
    rationale: "Les mêmes patients contribuent à plusieurs visites.",
    prerequisites: ["Définir l’estimand longitudinal"],
    assumptions: ["Qualifier la structure de dépendance"],
    tradeOffs: ["Utilise la trajectoire complète, avec davantage d’hypothèses."],
  }],
  informationNeeds: ["Préciser la stratégie de données manquantes"],
  limitations: [],
  plainText: "Estimation longitudinale exploitant les mesures répétées.",
};

const interaction: StandardBiostatisticsInteraction = {
  contract: "FUNCTIONAL_RESET_BIOSTATISTICS_INTERACTION",
  contractVersion: "1.0.0",
  owner: "BIOSTATISTICS",
  capabilityId: "BIOSTATISTICS_PLANNING",
  ownerResultRef: presentation.resultRef,
  ownerResultVersion: "1.0.0",
  sourceActionRef: "qry:analysis",
  sourceProjectRef: "project:1",
  sourceProjectVersion: "project:1:v1",
  sourceProjectDigest: "digest:project:1",
  presentationTurnRef: "turn:presentation",
  traceRunId: null,
  status: "ACTIVE",
  selectedStrategyRef: null,
  pendingContributionRef: null,
  adoptedProjectVersion: null,
  staleReason: null,
  projectWriteAuthorized: false,
};

describe("SCIENTIFIC-STACK-BIOSTATISTICS-01 — Standard projection", () => {
  it("keeps free-text methodological explanation primary and selection explicit", () => {
    const onSelect = vi.fn();
    const onDiscuss = vi.fn();
    const { container } = render(<BiostatisticsStandardCard presentation={presentation} interaction={interaction} onSelect={onSelect} onDiscuss={onDiscuss} />);
    expect(screen.getByTestId("standard-biostatistics-proposal")).toHaveTextContent("Les mêmes patients contribuent à plusieurs visites");
    expect(screen.getByText("Préciser la stratégie de données manquantes")).toBeVisible();
    expect(container.textContent).not.toMatch(/BIOSTATISTICS|contract|TRACE|epistemic/i);
    fireEvent.click(screen.getByRole("button", { name: "Retenir cette stratégie pour revue" }));
    expect(onSelect).toHaveBeenCalledWith("strategy:longitudinal");
    fireEvent.click(screen.getByRole("button", { name: "Discuter librement" }));
    expect(onDiscuss).toHaveBeenCalledOnce();
  });

  it("disables adoption of stale alternatives", () => {
    render(<BiostatisticsStandardCard presentation={presentation} interaction={{ ...interaction, status: "STALE" }} onSelect={vi.fn()} onDiscuss={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Retenir cette stratégie pour revue" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("version antérieure");
  });
});
