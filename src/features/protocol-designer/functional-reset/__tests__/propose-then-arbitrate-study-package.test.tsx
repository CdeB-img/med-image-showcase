import { writeFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { acceptContextualStudyProposal, hasSufficientStudyIntent } from "@/features/scientific-thinking/contextual-study-proposal";
import { buildStudyCandidateProjections } from "@/features/data-analysis-planning/projections";
import { buildCurrentTurnNavigation, selectStudyProposalArbitrations } from "@/features/query-navigation/current-turn-navigation";
import { contributionFromPersistentDelta, buildPersistentSourceCatalog, validatePersistentProjectDelta, type ProductBridgeRequest, type ProductBridgeResponse } from "../../product-bridge";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { prepareResearchProjectContributionCandidate, confirmResearchProjectContribution, rejectResearchProjectContribution } from "@/features/research-project-construction";
import { deferResearchProjectContribution } from "@/features/research-project-construction/contribution-owner-boundary";
import { prepareScientificCollaboratorConversation, buildScientificCollaboratorPayload, guardScientificCollaboratorLiteratureReply } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { prepareStandardContextualReasoningRequest } from "@/features/scientific-thinking/contextual-reasoning-input";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession } from "../session";
import { buildStudyProposalSelectionContribution, propagateStudyProposalDecision, selectedStudyProposalAtoms, projectStudyProposalDisposition, rehydrateStudyProposal } from "../study-proposal-standard";
import StudyProposalReview from "../StudyProposalReview";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { DOMAINS, FIBROSIS_EXACT, controlledStudyProposal, explicitWire, requestFor } from "./study-proposal-fixtures";
const ROOT = "validation/protocol-designer-v1-propose-then-arbitrate-study-package-01/";
const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
afterEach(() => { cleanup(); bridge.mockReset(); vi.unstubAllGlobals(); localStorage.clear(); });
const noNetwork = () => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("LIVE_PROVIDER_FORBIDDEN"); }));
const composition = () => { const initial = n1(); return acceptContextualStudyProposal(controlledStudyProposal("context"), { contextDigest: "context", sourceTurnRef: "u1", sourceResponseRef: "a1", sourceProject: null, applicableEvidenceRefs: [], sourceText: FIBROSIS_EXACT,
  ownerContext: prepareStandardContextualReasoningRequest({ contribution: initial.contribution, turns: initial.request.conversation.turns, sessionId: "offline-proposal" })?.request }); };
const n1 = (domain: typeof DOMAINS[number] = DOMAINS[0]) => {
  const request = requestFor(domain.text), checked = validatePersistentProjectDelta(explicitWire(domain), domain.text, null, request.conversation);
  expect(checked.validation.valid).toBe(true);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: request.conversation, currentProject: null })!;
  return { request, contribution, candidate: prepareResearchProjectContributionCandidate(contribution, null), validation: checked.validation };
};
const commit = (optionRefs: string[] = ["classes-option"], atomRefs: string[] = []) => {
  const session = createFunctionalResetSession(), bundle = composition();
  const selectionTurn = { turnId: "human-selection", role: "USER" as const, content: "Je valide uniquement les choix sélectionnés", createdAt: session.createdAt };
  const contribution = buildStudyProposalSelectionContribution({ composition: bundle, selectedOptionRefs: optionRefs, selectedAtomRefs: atomRefs,
    project: null, projectId: session.projectId, conversationId: session.conversationId,
    proposalTurn: { turnId: "a1", role: "NOXIA", content: bundle.proposal.reply }, selectionTurn, createdAt: session.createdAt });
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: session.projectId, authority: session.projectAuthority,
    confirmedAt: session.createdAt, reviewedProjection: candidate.humanReviewProjection, selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs,
    confirmationSourceRefs: [selectionTurn.turnId] });
  const next = propagateStudyProposalDecision(bundle, project, selectedStudyProposalAtoms(bundle, optionRefs, atomRefs), optionRefs, selectionTurn);
  return { bundle, session, contribution, candidate, project, next };
};
const runBridge = async (request: Omit<ProductBridgeRequest, "apiVersion">, domain: typeof DOMAINS[number] = DOMAINS[0], emptyKnowledgeClaim = false) => {
  const invocations: { provider: string; payload: unknown }[] = [];
  const fetchImpl: typeof fetch = vi.fn(async (url, init) => {
    const payload = JSON.parse(String(init?.body));
    if (String(url) === "https://api.openai.com/v1/responses") {
      invocations.push({ provider: "LOCAL_SYNTHETIC_N1", payload });
      const anchor = buildPersistentSourceCatalog(request.conversation).anchors.find(a => a.fragmentKind === "FULL_TURN")!;
      const wire = explicitWire(domain);
      const anchored = { ...wire, changes: wire.changes.map(({ sourceText: _s, ...change }) => ({ ...change, sourceAnchorId: anchor.anchorId })) };
      return new Response(JSON.stringify({ id: "LOCAL_SYNTHETIC_N1", model: "gpt-5.6-terra", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(anchored) }] }] }));
    }
    invocations.push({ provider: "LOCAL_SYNTHETIC_HOW", payload });
    const packet = JSON.parse(payload.contents[0].parts[0].text), digest = logicalDigest(packet);
    const proposal = controlledStudyProposal(digest, domain);
    if (emptyKnowledgeClaim) { proposal.atoms[0]!.status = "EVIDENCE_SUPPORTED_PROPOSAL"; proposal.atoms[0]!.evidenceRefs = [packet.knowledge.resultRef]; }
    return new Response(JSON.stringify({ modelVersion: "gemini-3.5-flash-lite", responseId: "LOCAL_SYNTHETIC_HOW", candidates: [{ content: { parts: [{ text: JSON.stringify(proposal) }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10 } }));
  });
  const result = await executeProtocolDesignerBridge({ body: { ...request, apiVersion: "1.0.0" }, apiKey: "LOCAL_SYNTHETIC", openAiApiKey: "LOCAL_SYNTHETIC", fetchImpl,
    providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
  expect(result.status).toBe(200); const response = result.body as ProductBridgeResponse;
  if (!emptyKnowledgeClaim) {
    if (response.scientificConversation?.studyProposalStatus !== "AVAILABLE") writeFileSync(ROOT + `debug-${domain.id}.json`, JSON.stringify({ response, invocations }, null, 2));
    expect(response.scientificConversation?.studyProposalStatus).toBe("AVAILABLE");
  }
  return { response, invocations };
};

describe("Propose then arbitrate — offline product properties", () => {
  it("PROPERTY_PROPOSAL_01 substantial first-turn proposal on the actual bridge", async () => {
    noNetwork(); const { response, invocations } = await runBridge(requestFor(FIBROSIS_EXACT));
    expect(invocations).toHaveLength(2); const bundle = response.scientificConversation!.studyProposal!;
    expect(bundle.proposal.atoms.length).toBeGreaterThanOrEqual(16);
    expect(new Set(bundle.proposal.atoms.map(a => a.area)).size).toBe(16);
    expect(response.assistantReply).toBe(bundle.proposal.reply); expect(response.assistantReply).not.toContain("SCIENTIFIC_THINKING");
    expect(response.scientificConversation!.projectWrites).toBe(0); expect(response.persistentExtraction.contribution).not.toBeNull();
    writeFileSync(ROOT + "fibrosis-first-turn-offline.json", JSON.stringify({ provenance: "ACTUAL_PRODUCT_BRIDGE_LOCAL_SYNTHETIC_NOT_NATURALNESS", input: FIBROSIS_EXACT, providerCalls: 0, response, syntheticTransportInvocations: invocations.length }, null, 2));
    writeFileSync(ROOT + "first-turn-review.html", renderToStaticMarkup(<StudyProposalReview composition={bundle} project={null} onValidate={() => undefined} onDiscuss={() => undefined} />));
  });
  it("PROPERTY_PROPOSAL_02 proposals do not adopt the Project", () => {
    const s = createFunctionalResetSession(), before = logicalDigest(s), bundle = composition();
    buildStudyCandidateProjections(bundle, s.project); expect(logicalDigest(s)).toBe(before); expect(s.project).toBeNull();
    expect(bundle.proposal.candidateIsAdopted).toBe(false);
  });
  it("PROPERTY_PROPOSAL_03 real alternatives are visible before a question", () => {
    render(<StudyProposalReview composition={composition()} project={null} onValidate={() => undefined} onDiscuss={() => undefined} />);
    expect(screen.getAllByRole("radio")).toHaveLength(2); expect(screen.getByText("Sept classes d'âge ; bornes à discuter")).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Autre / Modifier / Discuter" }).length).toBeGreaterThan(0);
  });
  it("PROPERTY_PROPOSAL_04 several selections create one real HumanDecisionEnvelope", () => {
    const { project, contribution } = commit(["classes-option", "equal-allocation"], ["population"]);
    expect(project.revision).toBe(1); expect(project.confirmationDecision.status).toBe("ADOPTED");
    expect(project.confirmationDecision.provenance).toEqual(expect.arrayContaining(["classes-option", "equal-allocation", "population", "human-selection"]));
    expect(project.canonicalState!.objects.filter(o => o.actuality === "CURRENT")).toHaveLength(3);
    expect(project.contributionRef).toBe(contribution.identity.contributionId);
  });
  it("PROPERTY_PROPOSAL_05 unselected proposals remain non-adopted", () => {
    const { project, next } = commit(); expect(project.canonicalState!.objects.filter(o => o.actuality === "CURRENT")).toHaveLength(1);
    expect(next.adoptedAtomRefs).toEqual(["age-classes"]); expect(next.adoptedAtomRefs).not.toContain("allocation");
    expect(next.unavailableOptionRefs).toContain("continuous-option");
    expect(next.proposal.atoms.find(a => a.ref === "bounds")!.status).toBe("OPEN_DECISION");
  });
  it("PROPERTY_PROPOSAL_06 decision refreshes all affected read-only previews", () => {
    const { bundle, project, next } = commit(); const before = buildStudyCandidateProjections(bundle, null), after = buildStudyCandidateProjections(next, project);
    expect(before.every(p => p.SOURCE_PROJECT_VERSION === null)).toBe(true);
    expect(after.every(p => p.SOURCE_PROJECT_VERSION === project.versionId && p.freshness === "CURRENT")).toBe(true);
    expect(after.every(p => p.ADOPTED_REFS.length === 1)).toBe(true); expect(after.find(p => p.projectionType === "WORKING_PROTOCOL")!.content).toContain("Confirmé — Sept classes");
    expect(buildStudyCandidateProjections(bundle, project).every(p => p.freshness === "STALE")).toBe(true);
  });
  it("PROPERTY_PROPOSAL_07 QRY prefers the represented high-value arbitration", () => {
    const a = n1(); const navigation = buildCurrentTurnNavigation({ sourceTurnRef: "u1", sourceText: FIBROSIS_EXACT, currentProject: null,
      contribution: a.contribution, candidate: a.candidate, validation: a.validation, substantiveProposalEligible: true });
    expect(navigation.envelope.purpose).toContain("stratégie de travail substantielle");
    const selection = selectStudyProposalArbitrations({ composition: composition(), navigation });
    expect(selection.selected?.candidateId).toBe("age-strategy"); expect(selection.trace.arbitraryScoreUsed).toBe(false);
    expect(selection.candidates.every(c => c.actionCategory !== "CLARIFY_BY_ADAPTIVE_EXCHANGE")).toBe(true);
  });
  it("PROPERTY_PROPOSAL_08 infer-before-ask keeps cross-sectional reversible interpretation", () => {
    const a = n1(); expect(hasSufficientStudyIntent(a.contribution)).toBe(true);
    const request = prepareScientificCollaboratorConversation(a.request, null, { qryAction: "BUILD_OR_REVISE_OBJECT", ownerContextRef: null });
    const context = JSON.parse(request.context); expect(context.currentDesignInterpretation.value).toBe("CROSS_SECTIONAL");
    expect(context.currentDesignInterpretation.reversible).toBe(true);
    expect(buildScientificCollaboratorPayload(request).generationConfig.responseMimeType).toBe("application/json");
  });
  it("PROPERTY_PROPOSAL_09 deterministic dimensioning is attempted before asking for N", () => {
    const bundle = composition(); expect(bundle.dimensioning[0]!.status).toBe("CALCULATED");
    expect(bundle.dimensioning[0]!.calculation!.totalSampleSize).toBe(259); expect(bundle.dimensioning[0]!.calculation!.strata).toBe(7);
    expect(bundle.adoptedAtomRefs).toHaveLength(0);
  });
  it("PROPERTY_PROPOSAL_10 hypothetical values do not become literature evidence", () => {
    const raw = controlledStudyProposal("context"); raw.atoms[0]!.status = "EVIDENCE_SUPPORTED_PROPOSAL";
    expect(() => acceptContextualStudyProposal(raw, { contextDigest: "context", sourceTurnRef: "u1", sourceResponseRef: "a1", sourceProject: null, applicableEvidenceRefs: [] })).toThrow("EVIDENCE_INVALID");
    expect(composition().dimensioning[0]!.calculation!.inputs.assumptions.every(a => a.provenance === "PROVISIONAL_ASSUMPTION")).toBe(true);
  });
  it("an empty Knowledge result receipt is not evidence support on the actual bridge", async () => {
    noNetwork(); const { response, invocations } = await runBridge(requestFor(DOMAINS[4].text), DOMAINS[4], true);
    expect(invocations).toHaveLength(2);
    expect(response.scientificConversation?.studyProposal).toBeUndefined();
    expect(response.scientificConversation?.fallbackReason).toBe("TECHNICAL_FAILURE");
    expect(response.scientificConversation?.projectWrites).toBe(0);
  });
  it("numerical user attribution requires an exact native declared-assumption receipt", () => {
    const raw = controlledStudyProposal("context"); const alpha = raw.dimensioningScenarios[0]!.input.assumptions[0]!;
    alpha.provenance = "USER_ASSUMPTION"; alpha.sourceRef = "user-turn:twoSidedAlpha";
    const input = { contextDigest: "context", sourceTurnRef: "u1", sourceResponseRef: "a1", sourceProject: null, applicableEvidenceRefs: [], ownerContext: prepareStandardContextualReasoningRequest({ contribution: n1().contribution, turns: n1().request.conversation.turns, sessionId: "offline-proposal" })?.request };
    expect(() => acceptContextualStudyProposal(raw, input)).toThrow("USER_ASSUMPTION_UNVERIFIED");
    expect(() => acceptContextualStudyProposal(raw, { ...input, userAssumptions: [{ parameter: "alpha", value: .01, sourceRef: alpha.sourceRef }] })).toThrow("USER_ASSUMPTION_UNVERIFIED");
    expect(acceptContextualStudyProposal(raw, { ...input, userAssumptions: [{ parameter: "alpha", value: .05, sourceRef: alpha.sourceRef }] }).dimensioning[0]!.status).toBe("CALCULATED");
  });
  it("PROPERTY_PROPOSAL_11 recruitment announcement and participant questionnaire are different", () => {
    const previews = buildStudyCandidateProjections(composition(), null);
    const notice = previews.find(p => p.projectionType === "RECRUITMENT_NOTICE")!, questionnaire = previews.find(p => p.projectionType === "RECRUITED_PARTICIPANT_QUESTIONNAIRE")!;
    expect(notice.content).toContain("Appel à volontaires"); expect(notice.content).toContain("ni une notice réglementaire ni un consentement");
    expect(questionnaire.content).toContain("réponse à renseigner"); expect(questionnaire.content).not.toBe(notice.content);
  });
  it("PROPERTY_PROPOSAL_12 CRF starts before a complete or adopted protocol", () => {
    const crf = buildStudyCandidateProjections(composition(), null).find(p => p.projectionType === "CRF_SPECIFICATION")!;
    expect(crf.fields.length).toBeGreaterThan(0); expect(crf.SOURCE_PROJECT_VERSION).toBeNull(); expect(crf.content).toContain("aucun résultat simulé");
  });
  it("PROPERTY_PROPOSAL_13 projections are read-only and never a second source of truth", () => {
    const { next, project } = commit(), before = logicalDigest(project);
    const projections = buildStudyCandidateProjections(next, project);
    expect(projections.every(p => p.projectionOnly && !p.sourceOfTruth && !p.projectWriteAuthorized)).toBe(true);
    expect(logicalDigest(project)).toBe(before);
    const proposalBefore = logicalDigest(next); projections.find(p => p.projectionType === "CRF_SPECIFICATION")!.fields[0]!.roles.push("EXCLUSION_VARIABLE");
    expect(logicalDigest(next)).toBe(proposalBefore);
  });
  it("PROPERTY_PROPOSAL_14 adopting seven classes expands no other decision scope", () => {
    const { project } = commit(); const contents = project.canonicalState!.objects.filter(o => o.actuality === "CURRENT").map(o => o.content).join("\n");
    expect(contents).not.toContain("équilibrée"); expect(contents).not.toContain("Régression"); expect(contents).not.toContain("259");
    expect(project.llmProjectWrites).toBe(0); expect(project.canonicalState!.objects[0]!.provenance.assertionKind).toBe("USER_ADOPTED_PROPOSAL");
    expect(project.canonicalState!.objects[0]!.provenance.sourceTurnRefs).toEqual(expect.arrayContaining(["a1", "human-selection"]));
  });
  it("PROPERTY_PROPOSAL_15 primary UI stays compact, with no duplicate technical panel", () => {
    render(<StudyProposalReview composition={composition()} project={null} onValidate={() => undefined} onDiscuss={() => undefined} />);
    expect(screen.getByRole("heading", { name: "Compréhension de travail" })).toBeVisible();
    expect(screen.getByTestId("study-proposal-detail")).not.toHaveAttribute("open");
    expect(screen.queryByText("À enregistrer dans le projet")).not.toBeInTheDocument();
    expect(screen.queryByText("Synthèse de l'étude")).not.toBeInTheDocument();
  });
  it("radio exclusivity, independent checkboxes, partial selection and discuss use real controls", () => {
    const validate = vi.fn(), discuss = vi.fn(); render(<StudyProposalReview composition={composition()} project={null} onValidate={validate} onDiscuss={discuss} />);
    fireEvent.click(screen.getByLabelText("Sept classes d'âge ; bornes à discuter", { exact: false }));
    expect(screen.getAllByRole("radio").filter(r => (r as HTMLInputElement).checked)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Valider les propositions" }));
    expect(validate).toHaveBeenCalledWith(["classes-option"], expect.arrayContaining(["question", "population", "design"]), composition().digest);
    fireEvent.click(screen.getAllByRole("button", { name: "Autre / Modifier / Discuter" })[0]!); expect(discuss).toHaveBeenCalled();
    expect(validate).toHaveBeenCalledTimes(1);
  });
  it.each(DOMAINS.slice(1))("cross-domain actual shared bridge: $id", async domain => {
    noNetwork(); const result = await runBridge(requestFor(domain.text), domain);
    const previews = buildStudyCandidateProjections(result.response.scientificConversation!.studyProposal!, null);
    expect(result.invocations).toHaveLength(2); expect(previews.some(p => p.projectionType === "CRF_SPECIFICATION")).toBe(true);
    expect(result.response.scientificConversation!.projectWrites).toBe(0);
    if (domain.id === "NON_MEDICAL") expect(result.response.assistantReply).not.toContain("ECV");
    if (domain.id === "NON_MEDICAL") expect(previews.some(p => p.projectionType === "RECRUITED_PARTICIPANT_QUESTIONNAIRE" || p.projectionType === "RECRUITMENT_NOTICE")).toBe(false);
    writeFileSync(ROOT + `cross-domain-${domain.id}.json`, JSON.stringify({ provenance: "LOCAL_SYNTHETIC_ACTUAL_ORCHESTRATION", input: domain.text, response: result.response, providerCalls: 0 }, null, 2));
  });
  it("rejects stale, mutually exclusive, unknown and unselected dependencies without widening", () => {
    const bundle = composition(); expect(() => selectedStudyProposalAtoms(bundle, ["classes-option", "continuous-option"])).toThrow("EXCLUSIVE");
    expect(() => selectedStudyProposalAtoms(bundle, [], ["bounds"])).toThrow("UNKNOWN");
    const modified = { ...bundle, proposal: { ...bundle.proposal, atoms: bundle.proposal.atoms.map(a => a.ref === "age-classes" ? { ...a, dependsOn: ["population"] } : a) } };
    expect(() => selectedStudyProposalAtoms(modified, ["classes-option"])).toThrow("DEPENDENCY_NOT_SELECTED");
    const { project } = commit(); expect(() => buildStudyProposalSelectionContribution({ composition: bundle, project, projectId: project.projectId,
      selectedOptionRefs: ["classes-option"], conversationId: "x", proposalTurn: { turnId: "a1", role: "NOXIA", content: bundle.proposal.reply },
      selectionTurn: { turnId: "u2", role: "USER", content: "oui" }, createdAt: "2026-09-17T10:00:00Z" })).toThrow("STALE_PROJECT");
  });
  it.each(["REJECTED", "DEFERRED"] as const)("native human %s leaves the Project unchanged and retains exact scope", status => {
    const s = createFunctionalResetSession(), bundle = composition(); const before = logicalDigest(s);
    const userTurn = { turnId: `human-${status}`, role: "USER" as const, content: `${status}: seulement les classes`, createdAt: s.createdAt };
    const contribution = buildStudyProposalSelectionContribution({ composition: bundle, selectedOptionRefs: ["classes-option"], project: null,
      projectId: s.projectId, conversationId: s.conversationId, proposalTurn: { turnId: "a1", role: "NOXIA", content: bundle.proposal.reply },
      selectionTurn: userTurn, createdAt: s.createdAt, disposition: status });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null), common = { contribution, current: null, authority: s.projectAuthority,
      selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs, reviewedProjection: candidate.humanReviewProjection };
    const decision = status === "REJECTED" ? rejectResearchProjectContribution({ ...common, rejectedAt: s.createdAt, rejectionSourceRefs: [userTurn.turnId] })
      : deferResearchProjectContribution({ ...common, deferredAt: s.createdAt });
    expect(decision.status).toBe(status); expect(decision.provenance).toContain("classes-option"); expect(logicalDigest(s)).toBe(before);
    const next = projectStudyProposalDisposition(bundle, decision, ["age-classes"], ["classes-option"]);
    expect(next.adoptedAtomRefs).toHaveLength(0); expect(rehydrateStudyProposal(next, null)).not.toBeNull();
    expect(next.dispositions![0]!.atomRefs).toEqual(["age-classes"]);
    if (status === "REJECTED") expect(next.dimensioning.some(s => s.ref === "seven-strata-scenario")).toBe(false);
  });
  it("local reload rejects candidate drift while preserving an adopted Project", () => {
    const { next, project } = commit(); const altered = structuredClone(next); altered.proposal.atoms[0]!.content = "Changed silently";
    expect(rehydrateStudyProposal(altered, project)).toBeNull();
    const wrongProject = { ...project, versionId: "another-version" }; expect(rehydrateStudyProposal(next, wrongProject)?.state).toBe("STALE");
    expect(rehydrateStudyProposal(next, project)).toEqual(next);
  });
  it("the next ordinary conversation receives current multi-strata consequences without adopting them", () => {
    const { next, project } = commit();
    const request = { ...requestFor(FIBROSIS_EXACT), currentProject: project, studyProposalContext: next };
    const collaborator = prepareScientificCollaboratorConversation(request);
    const packet = JSON.parse(collaborator.context);
    expect(packet.currentStudyProposal.status).toBe("PROPOSALS_NEVER_CANONICAL");
    expect(packet.currentStudyProposal.adoptedAtomRefs).toEqual(["age-classes"]);
    expect(packet.currentStudyProposal.dimensioning[0].calculation.totalSampleSize).toBe(259);
    const payload = buildScientificCollaboratorPayload(collaborator);
    expect(payload.generationConfig.responseMimeType).toBe("text/plain");
    expect(payload.systemInstruction.parts[0].text).toContain("currentStudyProposal.dimensioning");
    expect(guardScientificCollaboratorLiteratureReply(collaborator, "Le scénario hypothétique donne 37 sujets par tranche et 259 sujets au total ; l'effectif n'est pas adopté.").accepted).toBe(true);
    expect(guardScientificCollaboratorLiteratureReply(collaborator, "Le calcul donne 666 sujets au total.").accepted).toBe(false);
    expect(project.canonicalState!.objects.some(o => o.content.includes("259"))).toBe(false);
    const stale = prepareScientificCollaboratorConversation({ ...request, currentProject: { ...project, versionId: "new-version" } });
    expect(JSON.parse(stale.context).currentStudyProposal).toBeNull();
    expect(guardScientificCollaboratorLiteratureReply(stale, "Le calcul donne 259 sujets au total.").accepted).toBe(false);
  });
});

it("actual Standard UI bulk click writes once and survives reopen, without provider or real document generation", async () => {
  noNetwork(); let latest = createFunctionalResetSession(); latest.conversationLanguageGateway = { ...latest.conversationLanguageGateway, conversationLanguage: "fr" };
  bridge.mockImplementation(async (request: ProductBridgeRequest) => (await runBridge(request)).response);
  render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={latest} onSessionChange={s => { latest = s; }} /></HelmetProvider>);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: FIBROSIS_EXACT } }); fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
  await waitFor(() => expect(screen.getByTestId("study-proposal-review")).toBeVisible()); expect(latest.project).toBeNull();
  const review = within(screen.getByTestId("study-proposal-review")); fireEvent.click(review.getByLabelText("Sept classes d'âge ; bornes à discuter", { exact: false }));
  fireEvent.click(review.getByRole("button", { name: "Valider les propositions" }));
  await waitFor(() => expect(latest.project?.revision).toBe(1)); expect(bridge).toHaveBeenCalledTimes(1);
  expect(latest.studyProposal?.adoptedAtomRefs).toEqual(expect.arrayContaining(["question", "population", "design", "age-classes"]));
  expect(latest.studyProposal?.adoptedAtomRefs).not.toContain("allocation"); expect(latest.documents.projections).toHaveLength(0);
  expect(latest.retainedContributionCandidates.some(c => c.humanDecision?.status === "ADOPTED" && c.downstreamState === "PRESENTED")).toBe(true);
  expect(screen.getByTestId("conversation-composer")).toHaveClass("sticky");
  persistFunctionalResetSession(localStorage, latest); const restored = loadFunctionalResetSession(localStorage);
  expect(restored.project).toEqual(latest.project); expect(restored.studyProposal).toEqual(latest.studyProposal);
  const allPreviews = buildStudyCandidateProjections(restored.studyProposal!, restored.project); expect(allPreviews.every(p => p.freshness === "CURRENT")).toBe(true);
  writeFileSync(ROOT + "bulk-human-decision-offline.json", JSON.stringify({ provenance: "ACTUAL_STANDARD_UI_PRJ_HUMAN_DECISION_LOCAL_SYNTHETIC", project: latest.project, retained: latest.retainedContributionCandidates, composition: latest.studyProposal, providerCalls: 0, documentGenerations: 0 }, null, 2));
});

it.each(["REJECTED", "DEFERRED"] as const)("actual Standard UI %s is recorded once, leaves the Project untouched and survives reopen", async status => {
  noNetwork(); let latest = createFunctionalResetSession(); latest.conversationLanguageGateway = { ...latest.conversationLanguageGateway, conversationLanguage: "fr" };
  bridge.mockImplementation(async (request: ProductBridgeRequest) => (await runBridge(request)).response);
  render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={latest} onSessionChange={s => { latest = s; }} /></HelmetProvider>);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: FIBROSIS_EXACT } }); fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
  await waitFor(() => expect(screen.getByTestId("study-proposal-review")).toBeVisible());
  const review = within(screen.getByTestId("study-proposal-review"));
  fireEvent.click(review.getByLabelText("Sept classes d'âge ; bornes à discuter", { exact: false }));
  fireEvent.click(review.getByRole("button", { name: status === "REJECTED" ? "Refuser la sélection" : "Différer la sélection" }));
  await waitFor(() => expect(latest.studyProposal?.dispositions?.[0]?.status).toBe(status));
  expect(latest.project).toBeNull(); expect(latest.documents.projections).toHaveLength(0); expect(bridge).toHaveBeenCalledTimes(1);
  const retained = latest.retainedContributionCandidates.find(c => c.humanDecision?.status === status)!;
  expect(retained.humanDecision!.provenance).toContain("classes-option"); expect(retained.downstreamState).toBe("PRESENTED");
  expect(latest.studyProposal!.adoptedAtomRefs).toHaveLength(0);
  persistFunctionalResetSession(localStorage, latest); expect(loadFunctionalResetSession(localStorage).studyProposal).toEqual(latest.studyProposal);
});
