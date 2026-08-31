import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  FUNCTIONAL_RESET_DOCUMENT_BOUNDARY,
  type FunctionalResetDocumentPortfolio,
} from "@/features/document-projection";
import {
  CANONICAL_PROJECT_OBJECT_TYPES,
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
  RESEARCH_PROJECT_SECTION_LABELS,
  RESEARCH_PROJECT_SECTION_ORDER,
  sectionForContributionItem,
} from "@/features/research-project-construction";
import {
  validatePersistentProviderContract,
} from "@/features/protocol-designer/product-bridge";
import ResearchProjectPanel from "../ResearchProjectPanel";
import {
  adoptBehaviorContribution,
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
} from "./p1-behavior-01a-contract-fixtures";

const documents: FunctionalResetDocumentPortfolio = {
  contract: "FUNCTIONAL_RESET_DOCUMENT_PORTFOLIO",
  contractVersion: "1.0.0",
  boundary: FUNCTIONAL_RESET_DOCUMENT_BOUNDARY,
  owner: "DOC-001",
  projectRef: null,
  handoffDecision: null,
  projections: [],
  cards: [],
  lastFailure: null,
};

const contributionWith = (input: {
  id: string;
  proposedType: string;
  studyRole?: string | null;
  content: string;
}) => {
  const turn = behaviorTurn(`turn:p1-behavior-01c:${input.id}`, `Projet synthétique ${input.id}.`);
  const item = behaviorItem({
    itemId: `item:p1-behavior-01c:${input.id}`,
    proposedType: input.proposedType,
    studyRole: input.studyRole,
    content: input.content,
    turnId: turn.turnId,
  });
  return {
    item,
    contribution: behaviorContribution({
      contributionId: `contribution:p1-behavior-01c:${input.id}`,
      turns: [turn],
      candidateObjects: [item],
    }),
  };
};

describe("P1-BEHAVIOR-01C — generic Biospecimen/material-collection Project projection", () => {
  afterEach(cleanup);

  it("C15-A keeps a broad acquisition carrying an existing non-material role in Imaging", () => {
    const testCase = contributionWith({
      id: "imaging-acquisition",
      proposedType: "ACQUISITION",
      studyRole: "REFERENCE_STANDARD",
      content: "acquisition instrumentale A",
    });

    expect(sectionForContributionItem(testCase.item, testCase.contribution)).toBe("IMAGING");
  });

  it("C15-B gives the governed material-collection role precedence over the broad acquisition type", () => {
    const testCase = contributionWith({
      id: "material-collection",
      proposedType: "ACQUISITION",
      studyRole: "SAMPLE_COLLECTION",
      content: "ressource matérielle B à collecter",
    });
    const candidate = prepareResearchProjectContributionCandidate(testCase.contribution, null);
    const section = candidate.proposedSections.find((value) => value.sectionId === "BIOSPECIMENS");
    const canonicalCandidate = candidate.canonicalChangeSet.objectChanges[0]?.candidate;
    const review = candidate.humanReviewProjection.sections.find((value) => value.label === "Prélèvements / échantillons");

    expect(sectionForContributionItem(testCase.item, testCase.contribution)).toBe("BIOSPECIMENS");
    expect(section).toMatchObject({
      label: "Prélèvements / échantillons",
      state: "PARTIAL",
      elements: [expect.objectContaining({
        content: "ressource matérielle B à collecter",
        sourceProposedType: "ACQUISITION",
        sourceStudyRole: "SAMPLE_COLLECTION",
      })],
    });
    expect(candidate.proposedSections.find((value) => value.sectionId === "IMAGING")?.elements).toEqual([]);
    expect(canonicalCandidate).toMatchObject({
      objectType: "ACQUISITION",
      scientificRole: "SAMPLE_COLLECTION",
      sectionId: "BIOSPECIMENS",
    });
    expect(review?.items).toEqual([expect.objectContaining({ projectSectionId: "BIOSPECIMENS", statusLabel: "Déclaré" })]);
  });

  it("C15-C exposes the projection section without claiming canonical Biospecimen runtime support", () => {
    expect(RESEARCH_PROJECT_SECTION_ORDER).toContain("BIOSPECIMENS");
    expect(RESEARCH_PROJECT_SECTION_LABELS.BIOSPECIMENS).toBe("Prélèvements / échantillons");
    expect(CANONICAL_PROJECT_OBJECT_TYPES).not.toContain("BIOSPECIMEN");
  });

  it("C15-D retains the existing Imaging fallback when no specialized governed role exists", () => {
    const testCase = contributionWith({
      id: "unqualified-acquisition",
      proposedType: "ACQUISITION",
      content: "acquisition technique C",
    });

    expect(sectionForContributionItem(testCase.item, testCase.contribution)).toBe("IMAGING");
  });

  it("C15-E adds no Imaging or Biospecimen content to a non-imaging study", () => {
    const testCase = contributionWith({
      id: "non-imaging-design",
      proposedType: "STUDY_DESIGN",
      content: "étude observationnelle D",
    });
    const candidate = prepareResearchProjectContributionCandidate(testCase.contribution, null);

    expect(candidate.proposedSections.find((value) => value.sectionId === "DESIGN")?.elements).toHaveLength(1);
    expect(candidate.proposedSections.find((value) => value.sectionId === "IMAGING")?.elements).toEqual([]);
    expect(candidate.proposedSections.find((value) => value.sectionId === "BIOSPECIMENS")?.elements).toEqual([]);
  });

  it("preserves the projection through adoption, canonical state, Project panel, and provider-contract checks", () => {
    const testCase = contributionWith({
      id: "adopted-material-collection",
      proposedType: "ACQUISITION",
      studyRole: "SAMPLE_COLLECTION",
      content: "ressource matérielle E à collecter",
    });
    const project = adoptBehaviorContribution(testCase.contribution, null, 21);
    const canonicalObject = ensureCanonicalProjectState(project).objects.find((object) => object.objectId === testCase.item.itemId);

    expect(project.sections.find((section) => section.sectionId === "BIOSPECIMENS")).toMatchObject({
      state: "PARTIAL",
      elements: [expect.objectContaining({ content: "ressource matérielle E à collecter" })],
    });
    expect(project.sections.find((section) => section.sectionId === "IMAGING")?.elements).toEqual([]);
    expect(canonicalObject).toMatchObject({
      objectType: "ACQUISITION",
      scientificRole: "SAMPLE_COLLECTION",
      sectionId: "BIOSPECIMENS",
    });

    render(<ResearchProjectPanel
      project={project}
      documents={documents}
      mode="STANDARD"
      onOpenProtocol={() => undefined}
      onRequestProtocol={() => undefined}
    />);
    const biospecimenSection = screen.getByRole("heading", { name: "Prélèvements / échantillons" }).closest("section")!;
    const imagingSection = screen.getByRole("heading", { name: "Imagerie" }).closest("section")!;
    expect(within(biospecimenSection).getByText("ressource matérielle E à collecter")).toBeInTheDocument();
    expect(within(imagingSection).queryByText("ressource matérielle E à collecter")).toBeNull();

    const validProviderProjection = validatePersistentProviderContract({
      changes: [{
        operation: "ADD",
        sourceText: "ressource matérielle E à collecter",
        targetSectionId: "BIOSPECIMENS",
        content: "ressource matérielle E à collecter",
        proposedType: "ACQUISITION",
        studyRole: "SAMPLE_COLLECTION",
      }],
      relations: [],
      temporalQualifications: [],
      expectedVariableOccasions: [],
    });
    const mismatchedProviderProjection = validatePersistentProviderContract({
      changes: [{
        operation: "ADD",
        sourceText: "ressource matérielle E à collecter",
        targetSectionId: "IMAGING",
        content: "ressource matérielle E à collecter",
        proposedType: "ACQUISITION",
        studyRole: "SAMPLE_COLLECTION",
      }],
      relations: [],
      temporalQualifications: [],
      expectedVariableOccasions: [],
    });
    expect(validProviderProjection).toEqual({ valid: true, blocks: [] });
    expect(mismatchedProviderProjection).toMatchObject({
      valid: false,
      blocks: ["change:0:SAMPLE_COLLECTION_SECTION_MISMATCH"],
    });
  });
});
