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
  it("updates the URL and visible scientific result when a useful facet changes", () => {
    renderExplorer();
    expect(screen.getByRole("heading", { name: "État général — Segmentation en imagerie" })).toBeInTheDocument();
    expect(screen.getByText("12 assertions applicables, reliées à 12 preuves localisées.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Type de tâche"), { target: { value: "staple-consensus" } });

    expect(screen.getByTestId("location")).toHaveTextContent("/connaissances?task=staple-consensus");
    expect(screen.getByRole("heading", { name: /Lecture ciblée — Estimation consensuelle STAPLE/ })).toBeInTheDocument();
    expect(screen.getByText("2 assertions applicables, reliées à 2 preuves localisées.")).toBeInTheDocument();
    expect(screen.getAllByText(/STAPLE estime/)).toHaveLength(2);
  });

  it("restores the same selected state from a shared URL", () => {
    renderExplorer("/connaissances?metric=dice-similarity-coefficient");
    expect(screen.getByLabelText("Métrique")).toHaveValue("dice-similarity-coefficient");
    expect(screen.getByRole("heading", { name: /Coefficient de similarité de Dice/ })).toBeInTheDocument();
    expect(screen.getByText(/1 assertion applicable/)).toBeInTheDocument();
    expect(screen.getAllByText("Sensibilité aux petites structures").length).toBeGreaterThan(0);
  });

  it("renders an honest empty result and can return to the general view", () => {
    renderExplorer("/connaissances?metric=dice-similarity-coefficient&task=staple-consensus");
    expect(screen.getByRole("heading", { name: "Données insuffisantes pour cette combinaison" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revenir à la vue générale" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/connaissances");
    expect(screen.getByText("12 assertions applicables, reliées à 12 preuves localisées.")).toBeInTheDocument();
  });

  it("renders no placeholder or reserved space when no illustration exists", () => {
    const { container } = render(<ScientificIllustration illustration={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
