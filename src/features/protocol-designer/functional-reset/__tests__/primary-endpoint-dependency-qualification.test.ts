import { readFileSync } from "node:fs";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { acceptContextualStudyProposal } from "@/features/scientific-thinking/contextual-study-proposal";
import { prepareStandardContextualReasoningRequest } from "@/features/scientific-thinking/contextual-reasoning-input";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import { buildCanonicalCrfPackage, buildStudyDeliverablePortfolio } from "@/features/document-projection/study-deliverable-portfolio";
import { projectDocumentSourceFromFunctionalProject } from "@/features/document-projection/functional-reset-boundary";
import type { ProductBridgeRequest } from "../../product-bridge";
import { acceptWorkingDraftUpdate, normalizeUnresolvedOutcomeInputDependencies, prepareContinuousWorkingDraft, prepareWorkingDraftRequest, recommendedWorkingScope, type WorkingDraftUpdate } from "../continuous-project-build";
import { createFunctionalResetSession } from "../session";
import { buildStudyProposalSelectionContribution, propagateStudyProposalDecision, selectedStudyProposalAtoms } from "../study-proposal-standard";
import ContributionReview from "../ContributionReview";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";

const synthetic = () => {
  const domain = DOMAINS[3];
  const session = createFunctionalResetSession();
  session.runtimeTurns = [
    { turnId: "u1", role: "USER", content: domain.text, createdAt: session.createdAt },
    { turnId: "a1", role: "NOXIA", content: "Proposition de travail non adoptée.", createdAt: session.createdAt },
  ];
  const request: ProductBridgeRequest = {
    apiVersion: "1.0.0", conversation: { conversationId: session.conversationId, language: "fr", turns: session.runtimeTurns },
    currentProject: null, evaluatePersistentDelta: false, prepareWorkingDraft: true,
    workingDraftScientificSource: { kind: "BOUND_USER_TURN", sourceUserTurnId: "u1", sourceResponseTurnId: "a1", sourceDigest: logicalDigest(domain.text) },
  };
  const packet = prepareWorkingDraftRequest(request);
  const proposal = controlledStudyProposal(packet.inputDigest, domain);
  const anchor = proposal.atoms.find(atom => atom.ref === "measurement")!;
  Object.assign(anchor, { targetType: "IMAGING_MODALITY", plannedSource: "Imagerie spécialisée", plannedMethod: null });
  const open = { ...structuredClone(anchor), ref: "technical-acquisition", semanticKey: "technical-acquisition", targetType: "ACQUISITION" as const,
    status: "OPEN_DECISION" as const, content: "Les paramètres techniques de l'acquisition restent à choisir.",
    dependsOn: [anchor.ref], dependencyQualifications: [{ ref: anchor.ref, kind: "HARD_BLOCKING_DEPENDENCY" as const, rationale: "Même modalité." }] };
  const input = { ...structuredClone(proposal.atoms.find(atom => atom.ref === "descriptor")!), ref: "source-value", semanticKey: "source-value",
    owner: "IMAGING" as const, area: "MEASUREMENTS" as const, status: "STRONG_CONTEXTUAL_INFERENCE" as const,
    content: "Recueillir la valeur d'entrée de la mesure.", plannedSource: "Imagerie spécialisée", plannedMethod: null,
    dependsOn: [open.ref], dependencyQualifications: [{ ref: open.ref, kind: "HARD_BLOCKING_DEPENDENCY" as const, rationale: "Acquisition requise." }] };
  const outcome = { ...structuredClone(input), ref: "outcome-value", semanticKey: "outcome-value",
    content: "Calculer le résultat quantitatif pour chaque participant ; formule à préciser.", variableRoles: ["OUTCOME_VARIABLE" as const],
    dependsOn: [input.ref], dependencyQualifications: [{ ref: input.ref, kind: "HARD_BLOCKING_DEPENDENCY" as const, rationale: "Entrée requise pour le calcul." }] };
  const endpoint = proposal.atoms.find(atom => atom.ref === "endpoint")!;
  Object.assign(endpoint, { content: "Résultat quantitatif comme critère principal ; définition régionale ouverte.",
    dependsOn: [outcome.ref], dependencyQualifications: [{ ref: outcome.ref, kind: "HARD_BLOCKING_DEPENDENCY", rationale: "Critère fondé sur le résultat." }] });
  proposal.atoms.push(open, input, outcome);
  const update: WorkingDraftUpdate = { requestType: "STUDY_UPDATE", proposal, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] };
  return { session, request, packet, update };
};

describe("primary endpoint dependency qualification", () => {
  it("keeps an outcome and endpoint reviewable while operational acquisition details stay open", () => {
    const fixture = synthetic();
    const original = structuredClone(fixture.update);
    const composition = acceptWorkingDraftUpdate(fixture.update, fixture.request).composition!;
    expect(fixture.update).toEqual(original);
    expect(composition.proposal.atoms.find(atom => atom.ref === "technical-acquisition")?.status).toBe("OPEN_DECISION");
    expect(composition.proposal.atoms.find(atom => atom.ref === "source-value")?.dependencyQualifications?.[0]?.kind).toBe("HARD_BLOCKING_DEPENDENCY");
    expect(composition.proposal.atoms.find(atom => atom.ref === "outcome-value")?.dependencyQualifications?.[0]?.kind).toBe("SOFT_REFINEMENT_DEPENDENCY");
    const scope = recommendedWorkingScope(composition);
    expect(scope.selectedAtomRefs).toEqual(expect.arrayContaining(["outcome-value", "endpoint"]));
    expect(scope.selectedAtomRefs).not.toContain("technical-acquisition");
    expect(scope.selectedAtomRefs).not.toContain("source-value");
    const review = prepareContinuousWorkingDraft(fixture.session, composition, fixture.update, fixture.packet.inputDigest);
    expect(review.failure).toBeNull();
    expect(review.readyReview?.contribution.scientificContent.candidateObjects.some(item => item.content.includes("Résultat quantitatif"))).toBe(true);
    const ready = review.readyReview!;
    const project = confirmResearchProjectContribution({ contribution: ready.contribution, current: null, projectId: fixture.session.projectId,
      authority: fixture.session.projectAuthority, confirmedAt: fixture.session.updatedAt,
      reviewedProjection: ready.candidate.humanReviewProjection,
      selectedChangeRefs: ready.candidate.humanReviewProjection.coveredChangeRefs });
    expect(project.canonicalState.objects.some(object => object.actuality === "CURRENT" && object.objectType === "CANONICAL_VARIABLE" && object.content.includes("résultat quantitatif"))).toBe(true);
    expect(project.canonicalState.objects.some(object => object.actuality === "CURRENT" && object.objectType === "ENDPOINT" && object.content.includes("Résultat quantitatif"))).toBe(true);
    expect(buildCanonicalCrfPackage(project).fields.some(field => field.label.includes("résultat quantitatif"))).toBe(true);
    const bound = propagateStudyProposalDecision(composition, project,
      selectedStudyProposalAtoms(composition, scope.selectedOptionRefs, scope.selectedAtomRefs), scope.selectedOptionRefs, fixture.session.runtimeTurns[0]);
    expect(bound.sourceProject?.projectDigest).toBe(project.projectDigest);
    expect(bound.proposal.atoms.find(atom => atom.ref === "technical-acquisition")?.status).toBe("OPEN_DECISION");
    expect(bound.adoptedAtomRefs).not.toContain("technical-acquisition");
  });

  it("preserves a genuinely unresolved scientific prerequisite", () => {
    const fixture = synthetic();
    const input = fixture.update.proposal!.atoms.find(atom => atom.ref === "source-value")!;
    input.status = "OPEN_DECISION";
    expect(normalizeUnresolvedOutcomeInputDependencies(fixture.update.proposal!)).toEqual([]);
    const composition = acceptWorkingDraftUpdate(fixture.update, fixture.request).composition!;
    expect(recommendedWorkingScope(composition).selectedAtomRefs).not.toContain("outcome-value");
  });

  it("does not requalify an input without a stable modality anchor", () => {
    const fixture = synthetic();
    fixture.update.proposal!.atoms.find(atom => atom.ref === "technical-acquisition")!.dependsOn = [];
    fixture.update.proposal!.atoms.find(atom => atom.ref === "technical-acquisition")!.dependencyQualifications = [];
    expect(normalizeUnresolvedOutcomeInputDependencies(fixture.update.proposal!)).toEqual([]);
  });

  it("retains a hard dependency when the input has a second unresolved prerequisite", () => {
    const fixture = synthetic();
    const input = fixture.update.proposal!.atoms.find(atom => atom.ref === "source-value")!;
    const other = structuredClone(fixture.update.proposal!.atoms.find(atom => atom.ref === "practical")!);
    Object.assign(other, { ref: "scientific-choice", semanticKey: "scientific-choice", status: "OPEN_DECISION" });
    fixture.update.proposal!.atoms.push(other);
    input.dependsOn.push(other.ref);
    input.dependencyQualifications!.push({ ref: other.ref, kind: "HARD_BLOCKING_DEPENDENCY", rationale: "Choix scientifique indispensable." });
    expect(normalizeUnresolvedOutcomeInputDependencies(fixture.update.proposal!)).toEqual([]);
    expect(fixture.update.proposal!.atoms.find(atom => atom.ref === "outcome-value")?.dependencyQualifications?.[0]?.kind).toBe("HARD_BLOCKING_DEPENDENCY");
  });

  it("does not create an outcome that was merely discussed rather than proposed", () => {
    const fixture = synthetic();
    fixture.update.proposal!.atoms = fixture.update.proposal!.atoms.filter(atom => atom.ref !== "outcome-value" && atom.ref !== "endpoint");
    const before = fixture.update.proposal!.atoms.length;
    expect(normalizeUnresolvedOutcomeInputDependencies(fixture.update.proposal!)).toEqual([]);
    expect(fixture.update.proposal!.atoms).toHaveLength(before);
  });

  it("does not adopt an unresolved option or invent a formula", () => {
    const fixture = synthetic();
    const before = fixture.update.proposal!.atoms.find(atom => atom.ref === "outcome-value")!.content;
    const composition = acceptWorkingDraftUpdate(fixture.update, fixture.request).composition!;
    expect(composition.proposal.atoms.find(atom => atom.ref === "outcome-value")!.content).toBe(before);
    expect(composition.proposal.arbitrations.flatMap(arbitration => arbitration.recommendedRefs)).not.toContain("classes-option");
    expect(recommendedWorkingScope(composition).selectedOptionRefs).not.toContain("classes-option");
  });

  it.skipIf(!process.env.NOXIA_EXACT_PAID_RESPONSE_PATH)("replays the exact paid human proposal without altering the original", () => {
    const fixture = JSON.parse(readFileSync(process.env.NOXIA_EXACT_PAID_RESPONSE_PATH!, "utf8")) as {
      raw: WorkingDraftUpdate; accepted: { sourceTurnRef: string; sourceResponseRef: string };
    };
    const original = structuredClone(fixture.raw);
    const proposal = structuredClone(fixture.raw.proposal!);
    const changed = normalizeUnresolvedOutcomeInputDependencies(proposal);
    expect(fixture.raw).toEqual(original);
    expect(changed).toEqual(["a26", "a27", "a28", "a29"].map(input => ({ dependent: "a31", input })));
    expect(proposal.atoms.map(atom => [atom.ref, atom.content, atom.status])).toEqual(
      original.proposal!.atoms.map(atom => [atom.ref, atom.content, atom.status]));
    expect(proposal.arbitrations).toEqual(original.proposal!.arbitrations);
    expect(proposal.atoms.find(atom => atom.ref === "a25")?.status).toBe("OPEN_DECISION");
    for (const input of ["a26", "a27", "a28", "a29"]) {
      expect(proposal.atoms.find(atom => atom.ref === input)?.dependencyQualifications).toEqual(
        original.proposal!.atoms.find(atom => atom.ref === input)?.dependencyQualifications);
    }
    expect(proposal.atoms.find(atom => atom.ref === "a31")?.content).toBe(original.proposal!.atoms.find(atom => atom.ref === "a31")?.content);
    const composition = acceptContextualStudyProposal(proposal, { contextDigest: proposal.contextDigest,
      sourceTurnRef: fixture.accepted.sourceTurnRef, sourceResponseRef: fixture.accepted.sourceResponseRef,
      sourceProject: null, applicableEvidenceRefs: [], scopedAtomRefs: [] });
    const scope = recommendedWorkingScope(composition);
    expect(scope.selectedAtomRefs).toEqual(expect.arrayContaining(["a31", "a32"]));
    expect(scope.selectedAtomRefs).not.toContain("a25");
    expect(scope.selectedOptionRefs).not.toContain("opt06");
    expect(scope.selectedOptionRefs).not.toContain("opt07");
    expect(scope.selectedAtomRefs).not.toContain("a33");
    expect(scope.selectedAtomRefs).not.toContain("a34");
    const session = createFunctionalResetSession();
    session.runtimeTurns = [
      { turnId: fixture.accepted.sourceTurnRef, role: "USER", content: "Source scientifique liée — replay hors ligne.", createdAt: session.createdAt },
      { turnId: fixture.accepted.sourceResponseRef, role: "NOXIA", content: "Proposition source — replay hors ligne.", createdAt: session.createdAt },
    ];
    const selectedContribution = buildStudyProposalSelectionContribution({ composition, ...scope,
      project: null, projectId: session.projectId, conversationId: session.conversationId,
      proposalTurn: session.runtimeTurns[1], selectionTurn: session.runtimeTurns[0], createdAt: session.createdAt, preparingReview: true });
    const ownerContext = prepareStandardContextualReasoningRequest({ contribution: selectedContribution,
      turns: session.runtimeTurns, sessionId: session.conversationId });
    const qualifiedEndpoint = acceptContextualStudyProposal(proposal, { contextDigest: proposal.contextDigest,
      sourceTurnRef: fixture.accepted.sourceTurnRef, sourceResponseRef: fixture.accepted.sourceResponseRef,
      sourceProject: null, applicableEvidenceRefs: [], scopedAtomRefs: ["a31", "a32"], ownerContext: ownerContext?.request });
    expect(qualifiedEndpoint.ownerReceipts.find(receipt => receipt.owner === "IMAGING")?.atomRefs).toEqual(["a31", "a32"]);
    const review = prepareContinuousWorkingDraft(session, composition, fixture.raw, proposal.contextDigest);
    expect(review.failure).toBeNull();
    expect(review.readyReview?.contribution.scientificContent.candidateObjects.some(item => item.content === proposal.atoms.find(atom => atom.ref === "a31")!.content)).toBe(true);
    expect(review.readyReview?.contribution.scientificContent.candidateObjects.some(item => item.content === proposal.atoms.find(atom => atom.ref === "a32")!.content)).toBe(true);
    expect(review.readyReview?.contribution.scientificContent.clarificationNeeds.some(item => item.content === proposal.atoms.find(atom => atom.ref === "a25")!.content)).toBe(true);
    const ready = review.readyReview!;
    render(createElement(ContributionReview, { contribution: ready.contribution, candidate: ready.candidate,
      status: "PENDING", expanded: true, onConfirm: () => undefined, onCorrect: () => undefined, onReject: () => undefined }));
    expect(screen.getByText(proposal.atoms.find(atom => atom.ref === "a25")!.content)).toBeInTheDocument();
    const project = confirmResearchProjectContribution({ contribution: ready.contribution, current: null,
      projectId: session.projectId, authority: session.projectAuthority, confirmedAt: session.updatedAt,
      reviewedProjection: ready.candidate.humanReviewProjection,
      selectedChangeRefs: ready.candidate.humanReviewProjection.coveredChangeRefs });
    const ecv = project.canonicalState.objects.find(object => object.actuality === "CURRENT"
      && object.objectType === "CANONICAL_VARIABLE" && object.content === proposal.atoms.find(atom => atom.ref === "a31")!.content);
    const endpoint = project.canonicalState.objects.find(object => object.actuality === "CURRENT"
      && object.objectType === "ENDPOINT" && object.content === proposal.atoms.find(atom => atom.ref === "a32")!.content);
    expect(ecv).toBeDefined();
    expect(endpoint).toBeDefined();
    expect(project.canonicalState.objects.some(object => object.actuality === "CURRENT"
      && [proposal.atoms.find(atom => atom.ref === "a33")!.content, proposal.atoms.find(atom => atom.ref === "a34")!.content].includes(object.content))).toBe(false);
    expect(projectDocumentSourceFromFunctionalProject(project, null).endpointCandidates.some(item => item.endpointId === endpoint!.objectId)).toBe(true);
    const canonicalCrf = buildCanonicalCrfPackage(project);
    expect(canonicalCrf.fields.some(field => field.canonicalVariableId === ecv!.objectId)).toBe(true);
    const portfolio = buildStudyDeliverablePortfolio({ project, protocolProjection: null, generatedAt: session.updatedAt });
    for (const kind of ["CRF", "DATA_DICTIONARY", "EDC_IMPORT_PACKAGE", "STATISTICAL_ANALYSIS_PLAN", "IMAGING_CORE_LAB_MANUAL"] as const) {
      const artifact = portfolio.artifacts.find(item => item.kind === kind)!;
      expect(artifact.canonicalVariableRefs).toContain(ecv!.objectId);
    }
    expect(portfolio.artifacts.find(item => item.kind === "STATISTICAL_ANALYSIS_PLAN")!.sourceObjectRefs).toContain(endpoint!.objectId);
  });
});
