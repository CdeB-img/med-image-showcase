import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ScientificExplorer from "./ScientificExplorer";
import ScientificIllustration from "./ScientificIllustration";

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
};

const renderExplorer = (initialEntry = "/connaissances") => render(
  <MemoryRouter initialEntries={[initialEntry]}>
    <ScientificExplorer />
    <LocationProbe />
  </MemoryRouter>,
);

describe("P12 scientific explorer interactions", () => {
  it("starts from four explicit user intentions instead of graph terminology", () => {
    renderExplorer();

    expect(screen.getByRole("heading", { name: "Comprendre et évaluer la segmentation en imagerie médicale" })).toBeInTheDocument();
    expect(screen.getAllByText("Délimitation ou attribution de classes à des régions d'une image médicale.").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Pourquoi l’évaluer avec soin/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Comprendre le sujet/ })).toHaveAttribute("href", "#comprendre");
    expect(screen.getByRole("link", { name: /Choisir un angle/ })).toHaveAttribute("href", "#choisir");
    expect(screen.getByRole("link", { name: /Comparer les repères/ })).toHaveAttribute("href", "#comparer");
    expect(screen.getByRole("link", { name: /Vérifier les conclusions/ })).toHaveAttribute("href", "#verifier");
    expect(screen.queryByText("Données issues du Knowledge Graph")).not.toBeInTheDocument();
  });

  it("updates the URL and visible scientific result when a useful facet changes", () => {
    renderExplorer();
    expect(screen.getByRole("heading", { name: "État général — Segmentation en imagerie" })).toBeInTheDocument();
    expect(screen.getByText(/12 conclusions documentées par 5 publications/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Type de tâche"), { target: { value: "staple-consensus" } });

    expect(screen.getByTestId("location")).toHaveTextContent("/connaissances?task=staple-consensus");
    expect(screen.getByRole("heading", { name: /Lecture ciblée — Estimation consensuelle STAPLE/ })).toBeInTheDocument();
    expect(screen.getByText(/2 conclusions documentées par 1 publication/)).toBeInTheDocument();
    expect(screen.getAllByText(/STAPLE estime/).length).toBeGreaterThanOrEqual(2);
  });

  it("restores the same selected state from a shared URL", () => {
    renderExplorer("/connaissances?metric=dice-similarity-coefficient");
    expect(screen.getByLabelText("Métrique")).toHaveValue("dice-similarity-coefficient");
    expect(screen.getByRole("heading", { name: "Lecture ciblée — Coefficient de similarité de Dice" })).toBeInTheDocument();
    expect(screen.getByText(/1 conclusion documentée par 1 publication/)).toBeInTheDocument();
    expect(screen.getAllByText("Sensibilité aux petites structures").length).toBeGreaterThan(0);
  });

  it("renders an honest empty result and can return to the general view", () => {
    renderExplorer("/connaissances?metric=dice-similarity-coefficient&task=staple-consensus");
    expect(screen.getByRole("heading", { name: "Données insuffisantes pour cette combinaison" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revenir à la vue générale" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/connaissances");
    expect(screen.getByText(/12 conclusions documentées par 5 publications/)).toBeInTheDocument();
  });

  it("keeps detailed conclusions and proof behind an explicit verification step", () => {
    const { container } = renderExplorer();
    const supportedGroupLabel = screen.getByText("Conclusions soutenues");
    const supportedGroup = supportedGroupLabel.closest("details");
    expect(supportedGroup).not.toHaveAttribute("open");

    fireEvent.click(supportedGroupLabel);

    expect(screen.getAllByText("Voir la justification scientifique (1)").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("details[open]").length).toBeGreaterThan(0);
  });

  it("turns a comparison repère into the existing concept filter", () => {
    renderExplorer();
    fireEvent.click(screen.getByRole("button", { name: "Explorer Coefficient de similarité de Dice" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/connaissances?concept=dice-similarity-coefficient");
    expect(screen.getByLabelText("Concept")).toHaveValue("dice-similarity-coefficient");
  });

  it("renders no placeholder or reserved space when no illustration exists", () => {
    const { container } = render(<ScientificIllustration illustration={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
