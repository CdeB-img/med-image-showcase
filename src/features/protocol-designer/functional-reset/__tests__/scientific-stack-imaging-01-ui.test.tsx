import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ImagingStandardCard from "../ImagingStandardCard";
import type { StandardImagingInteraction, StandardImagingPresentation } from "../imaging-standard";

const presentation: StandardImagingPresentation = {
  presentationId: "internal:presentation:1",
  resultRef: "internal:result:1",
  title: "Stratégie d’imagerie à discuter",
  introduction: "Deux modalités sont conservées sans classement automatique.",
  options: [{
    optionRef: "internal:acquisition:irm",
    modalityRef: "internal:modality:irm",
    modalityLabel: "IRM cardiaque",
    acquisitionLabel: "Acquisition ciné et cartographie quantitative",
    rationale: "Documenter une mesure reproductible compatible avec l’objectif du Project.",
    requirements: ["Même fenêtre de mesure aux visites comparées"],
    limitations: ["La faisabilité locale reste à confirmer"],
    projectCandidateType: "ACQUISITION",
  }],
  unresolvedQuestions: ["Quel niveau de standardisation inter-site est disponible ?"],
  commonRequirements: ["Contrôle de qualité documenté"],
  downstreamHandoffs: ["Les conséquences analytiques restent à qualifier par Biostatistics."],
  plainText: "Projection Standard Imaging",
};

const interaction: StandardImagingInteraction = {
  contract: "FUNCTIONAL_RESET_IMAGING_INTERACTION",
  contractVersion: "1.0.0",
  owner: "IMAGING",
  capabilityId: "IMAGING_STUDY_DESIGN",
  ownerResultRef: "internal:result:1",
  ownerResultVersion: "1.2.1",
  sourceActionRef: "internal:qry:1",
  sourceProjectRef: "internal:project:1",
  sourceProjectVersion: "internal:project:version:1",
  sourceProjectDigest: "internal:digest:1",
  presentationTurnRef: "internal:turn:1",
  traceRunId: "internal:trace:1",
  status: "ACTIVE",
  selectedOptionRef: null,
  pendingContributionRef: null,
  adoptedProjectVersion: null,
  staleReason: null,
  projectWriteAuthorized: false,
};

describe("SCIENTIFIC-STACK-IMAGING-01 — Standard projection", () => {
  it("renders progressive free-text-compatible guidance without exposing owner internals", () => {
    const onSelect = vi.fn();
    const onDiscuss = vi.fn();
    const { container } = render(<ImagingStandardCard
      presentation={presentation}
      interaction={interaction}
      onSelect={onSelect}
      onDiscuss={onDiscuss}
    />);

    expect(screen.getByText(/IRM cardiaque/)).toBeInTheDocument();
    expect(screen.getByText("Points à préciser")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/internal:|traceRunId|ownerResultRef|IMAGING_STUDY_DESIGN/);
    fireEvent.click(screen.getByRole("button", { name: "Discuter librement" }));
    fireEvent.click(screen.getByRole("button", { name: "Retenir cette acquisition pour revue" }));
    expect(onDiscuss).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith("internal:acquisition:irm");
  });
});
