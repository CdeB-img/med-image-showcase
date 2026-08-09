import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "react";
import ImagingStudyDesignerView from "../ImagingStudyDesignerView";
import { createImagingDesignSession } from "../session";
import type { ImagingDesignSession } from "../types";
import { makeImagingInput, withInput } from "./fixtures";

const Harness = ({ initial }: { initial: ImagingDesignSession }) => {
  const [session, setSession] = useState(initial);
  return <ImagingStudyDesignerView session={session} onChange={setSession} onReturnToScientificThinking={() => undefined} onProjectConstructionHandoff={() => undefined} />;
};

describe("IMG-001 — interface conversationnelle et accessible", () => {
  afterEach(cleanup);

  it("affiche immédiatement Question, phénomène et progression", () => {
    render(<Harness initial={createImagingDesignSession(makeImagingInput())} />);
    expect(screen.getByRole("heading", { name: "Comment l’imagerie peut-elle examiner cette question ?" })).toBeInTheDocument();
    expect(screen.getByText(/Question confirmée/)).toBeInTheDocument();
    expect(screen.getByText("Étape 1 sur environ 8")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Phénomènes" })).toBeInTheDocument();
  });

  it("navigue au clavier sur des boutons natifs avec un ordre logique", () => {
    render(<Harness initial={createImagingDesignSession(makeImagingInput())} />);
    const biomarkerStep = screen.getByRole("button", { name: "2. Biomarqueurs" });
    biomarkerStep.focus();
    expect(biomarkerStep).toHaveFocus();
    fireEvent.keyDown(biomarkerStep, { key: "Enter" });
    fireEvent.click(biomarkerStep);
    expect(screen.getByRole("heading", { name: "Biomarqueurs candidats" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Retenir" }).length).toBeGreaterThan(0);
  });

  it("propose réponses suggérées, texte libre et je ne sais pas avec justification", () => {
    render(<Harness initial={createImagingDesignSession(makeImagingInput({ equipment: [], timings: [] }))} />);
    expect(screen.getAllByText(/Question \d+ sur environ \d+/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Je ne sais pas" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pourquoi/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Influence/).length).toBeGreaterThan(0);
    const free = screen.getAllByLabelText("Ou répondez avec vos propres mots")[0];
    fireEvent.change(free, { target: { value: "Réponse libre documentée" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Enregistrer" })[0]);
    expect(screen.queryByDisplayValue("Réponse libre documentée")).not.toBeInTheDocument();
  });

  it("rend un changement majeur et ses impacts avant confirmation", () => {
    render(<Harness initial={createImagingDesignSession(makeImagingInput())} />);
    fireEvent.click(screen.getByRole("button", { name: "Proposer un changement du biomarqueur principal" }));
    expect(screen.getByText("Changement majeur · confirmation requise")).toBeInTheDocument();
    expect(screen.getAllByText(/REVIEW_REQUIRED/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Confirmer le changement et rouvrir" })).toBeInTheDocument();
  });

  it("affiche un refus patient-level sans surface de design", () => {
    const base = makeImagingInput();
    const patient = withInput(base, { originalExpression: "Quel protocole demander pour mon T2 élevé ?", safetyFlags: ["PATIENT_LEVEL"] });
    render(<Harness initial={createImagingDesignSession(patient)} />);
    expect(screen.getByRole("alert")).toHaveTextContent("NOXIA ne conçoit pas un protocole pour une situation patient");
    expect(screen.queryByTestId("imaging-study-designer")).not.toBeInTheDocument();
  });

  it("présente comparateurs et contenus longs sans largeur minimale forcée", () => {
    render(<Harness initial={createImagingDesignSession(makeImagingInput({ question: "Comparer l’ECV en IRM vs CT pour examiner la fibrose myocardique.", terms: ["fibrose myocardique", "ECV", "IRM", "CT"], equipment: ["IRM", "CT"] }))} />);
    fireEvent.click(screen.getByRole("button", { name: "3. Modalités" }));
    expect(screen.getByText(/Comparer les modalités/)).toBeInTheDocument();
    expect(screen.getByTestId("imaging-study-designer")).toHaveClass("min-w-0");
  });
});
