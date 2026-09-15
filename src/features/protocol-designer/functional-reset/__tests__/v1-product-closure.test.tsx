import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { authorizeResearchProjectDocumentHandoff, confirmResearchProjectContribution, prepareResearchProjectContributionCandidate, buildProjectContextSnapshot } from "@/features/research-project-construction";
import { refreshFunctionalResetDocumentPortfolio, renderProjection } from "@/features/document-projection";
import { createProjectSession, readProjectSessions, saveProjectSession, readResearcherProfile, RESEARCHER_PROFILE_STORAGE_KEY, ACTIVE_PROJECT_STORAGE_KEY } from "../project-workspace-storage";
import { documentAdministrationFrom, emptyLocalProfile, emptyProjectAdministration } from "../project-administration";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import { buildCurrentTurnNavigation } from "@/features/query-navigation/current-turn-navigation";
import { realizeGovernedConversation, validateGovernedConversationRealization } from "@/features/query-navigation/governed-conversation-realization";
import ProjectContinuum from "../ProjectContinuum";
import { invokeStudyDesignForProjectSnapshot } from "../../product-study-design-owner-runtime";
import { createProductOwnerResultLedger } from "../../product-owner-result-ledger";
import { behaviorAuthority, behaviorContribution, behaviorItem, behaviorTurn, richStudyContribution, adoptBehaviorContribution } from "./p1-behavior-01a-contract-fixtures";

const NOW = "2026-09-15T14:00:00.000Z";
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const metadata = () => ({ title: "Étude générale", revision: 1, administration: emptyProjectAdministration() });
const generate = (project: ReturnType<typeof adoptBehaviorContribution>, admin = metadata(), previous?: ReturnType<typeof refreshFunctionalResetDocumentPortfolio>) => refreshFunctionalResetDocumentPortfolio({
  project, previous, requestedAt: NOW, generateProtocol: true,
  handoffDecision: authorizeResearchProjectDocumentHandoff({ project, authority: behaviorAuthority, confirmedAt: NOW }),
  administration: documentAdministrationFrom(project.projectId, admin),
});

describe("Repeated study-design requests retain exact owner results", () => {
  it("reuses the same native input without reexecution or a duplicate ledger entry", () => {
    const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
    const snapshot = buildProjectContextSnapshot({ project });
    const first = invokeStudyDesignForProjectSnapshot({ projectSnapshot: snapshot, ledger: createProductOwnerResultLedger("closure"), callerRef: "automatic", purpose: "Study design", startedAt: NOW, completedAt: NOW });
    const next = invokeStudyDesignForProjectSnapshot({ projectSnapshot: snapshot, ledger: first.ledger, callerRef: "explicit-request", purpose: "Study design again", startedAt: "2026-09-15T15:00:00Z", completedAt: "2026-09-15T15:00:00Z" });
    expect(next.result).toEqual(first.result);
    expect(next.ledger).toEqual(first.ledger);
    expect(next.reused).toBe(true);
    expect(next.projectWrites).toBe(0);
    expect(buildProjectContextSnapshot({ project })).toEqual(snapshot);
  });

  it("does not reuse a result for a different explicit need", () => {
    const projectSnapshot = buildProjectContextSnapshot({ project: adoptBehaviorContribution(richStudyContribution(), null, 1) });
    const input = { projectSnapshot, callerRef: "request", purpose: "Study design", startedAt: NOW, completedAt: NOW };
    const first = invokeStudyDesignForProjectSnapshot({ ...input, ledger: createProductOwnerResultLedger("closure") });
    const next = invokeStudyDesignForProjectSnapshot({ ...input, ledger: first.ledger, selectedNeed: { sourceTurnRef: "turn:population", purpose: "Préciser la population", focusSectionIds: ["POPULATION"] } });
    expect(next.ledger.entries).toHaveLength(2);
    expect(next.result?.resultId).not.toBe(first.result?.resultId);
    expect(next.result?.nativePayload.options).toEqual([]);
  });
});

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("V1 product closure: independent durable projects", () => {
  it("MULTI_PROJECT_ISOLATION / PROJECT_PERSISTENCE: preserves separate full sessions", () => {
    const a = createProjectSession(localStorage, "Cardio A");
    a.session.runtimeTurns.push({ turnId: "a:t1", role: "USER", content: "La science du projet A" });
    a.raw = saveProjectSession(localStorage, a, a.session);
    const b = createProjectSession(localStorage, "Neuro B");
    b.session.runtimeTurns.push({ turnId: "b:t1", role: "USER", content: "La science du projet B" });
    b.raw = saveProjectSession(localStorage, b, b.session);
    expect(b.key).not.toBe(a.key);
    const read = readProjectSessions(localStorage);
    expect(read.unreadable).toEqual([]);
    expect(read.projects).toHaveLength(2);
    expect(read.projects.find((p) => p.key === a.key)!.session.runtimeTurns).toEqual(a.session.runtimeTurns);
    expect(read.projects.find((p) => p.key === b.key)!.session.runtimeTurns).toEqual(b.session.runtimeTurns);
    expect(localStorage.getItem(a.key)).not.toContain("La science du projet B");
  });

  it("PROJECT_REOPEN / CONVERSATION_REHYDRATION: retains canonical identity, human decisions and pending conversation", () => {
    const saved = createProjectSession(localStorage, "Projet A");
    saved.session.project = confirmResearchProjectContribution({ contribution: richStudyContribution(), current: null, projectId: saved.session.projectId, authority: saved.session.projectAuthority, confirmedAt: NOW });
    saved.session.runtimeTurns.push({ turnId: "a:pending", role: "USER", content: "Cette modification reste à discuter" });
    saved.session.pendingContribution = richStudyContribution();
    saved.raw = saveProjectSession(localStorage, saved, saved.session);
    const read = readProjectSessions(localStorage).projects[0]!.session;
    expect(read.project).toEqual(saved.session.project);
    expect(read.pendingContribution).toEqual(saved.session.pendingContribution);
    expect(read.runtimeTurns).toEqual(saved.session.runtimeTurns);
    expect(read.projectAuthority).toEqual(saved.session.projectAuthority);
  });

  it("refuses a concurrent stale write and preserves the latest saved bytes", () => {
    const a = createProjectSession(localStorage, "A"); a.raw = saveProjectSession(localStorage, a, a.session);
    const otherTab = { ...a };
    a.raw = saveProjectSession(localStorage, a, { ...a.session, updatedAt: NOW });
    expect(() => saveProjectSession(localStorage, otherTab, otherTab.session)).toThrow(/autre écran/);
    expect(localStorage.getItem(a.key)).toBe(a.raw);
  });

  it("preserves unreadable evidence without silently creating its replacement", () => {
    localStorage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, "corrupt JSON");
    expect(readProjectSessions(localStorage)).toEqual({ projects: [], unreadable: [FUNCTIONAL_RESET_STORAGE_KEY] });
    renderDemo();
    expect(screen.getByRole("alert")).toHaveTextContent("conservées sans remplacement");
    expect(localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)).toBe("corrupt JSON");
  });

  it("rejects contamination by another Project's projection", () => {
    const a = createProjectSession(localStorage, "A");
    a.session.documents.projections = generate(adoptBehaviorContribution(richStudyContribution(), null, 1)).projections;
    saveProjectSession(localStorage, a, a.session);
    expect(readProjectSessions(localStorage).unreadable).toEqual([a.key]);
  });

  it("reports quota errors without deleting the previous saved session", () => {
    const a = createProjectSession(localStorage, "A"); a.raw = saveProjectSession(localStorage, a, a.session);
    const original = a.raw;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Quota exceeded", "QuotaExceededError"); });
    expect(() => saveProjectSession(localStorage, a, { ...a.session, updatedAt: NOW })).toThrow("Quota exceeded");
    expect(localStorage.getItem(a.key)).toBe(original);
  });

  it("REFRESH_RECOVERY: closes to the list, creates B and reopens A through Standard UI", () => {
    const mounted = renderDemo();
    const a = JSON.parse(localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!);
    fireEvent.click(screen.getByRole("button", { name: "← Mes projets" }));
    fireEvent.change(screen.getByLabelText("Nouveau projet"), { target: { value: "Neuro B" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer un projet" }));
    expect(screen.getByRole("heading", { level: 1, name: "Neuro B" })).toBeInTheDocument();
    expect(readProjectSessions(localStorage).projects).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "← Mes projets" }));
    mounted.unmount(); renderDemo();
    expect(screen.getByRole("heading", { name: "Mes projets" })).toBeInTheDocument();
    const firstCard = screen.getByRole("heading", { name: "Projet sans titre" }).closest("article")!;
    fireEvent.click(within(firstCard).getByRole("button", { name: "Ouvrir" }));
    expect(localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)).toBe(FUNCTIONAL_RESET_STORAGE_KEY);
    expect(JSON.parse(localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!).sessionId).toBe(a.sessionId);
    expect(screen.getByLabelText("Votre message")).toBeInTheDocument();
  });
});

describe("V1 documentary administration, current sources and traceability", () => {
  it("PROFILE_VS_PROJECT_METADATA: saving a reusable profile never writes Project science or roles", () => {
    const a = createProjectSession(localStorage, "A"); a.raw = saveProjectSession(localStorage, a, a.session);
    const profile = { ...emptyLocalProfile(), name: "Chercheur Démo", organization: "Institut Démo" };
    localStorage.setItem(RESEARCHER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    expect(readResearcherProfile(localStorage)).toEqual(profile);
    expect(localStorage.getItem(a.key)).toBe(a.raw);
    expect(a.session.workspace!.administration.principalInvestigator).toBe("");
    expect(a.session.workspace!.administration.sponsor).toBe("");
  });

  it("PLACEHOLDER_GENERATION / NO_PLACEHOLDER_HALLUCINATION: creates a concrete document with explicit missing fields", () => {
    const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
    const before = JSON.stringify(project);
    const doc = generate(project).projections[0]!;
    expect(doc.administration?.status).toBe("DRAFT_WITH_PLACEHOLDERS");
    const html = renderProjection(doc, "HTML").content;
    expect(html).toContain("[Investigateur principal à compléter]");
    expect(html).toContain("[Promoteur à compléter]");
    expect(html).toContain("[Numéro de version à compléter]");
    expect(html).toContain("population A");
    expect(doc.administration!.fields.find((f) => f.key === "sponsor")).toMatchObject({ value: null, sourceRef: null });
    expect(JSON.stringify(project)).toBe(before);
  });

  it("DOCUMENT_REGENERATION: admin-only change invalidates projection but not the scientific Project", () => {
    const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
    const previous = generate(project);
    const original = JSON.stringify(previous.projections[0]);
    const admin = metadata(); admin.revision++; admin.administration.principalInvestigator = "Investigateur Démo";
    const preview = refreshFunctionalResetDocumentPortfolio({ project, previous, requestedAt: NOW, administration: documentAdministrationFrom(project.projectId, admin) });
    expect(preview.cards[0].freshness).toBe("STALE");
    const result = generate(project, admin, previous);
    expect(result.projections).toHaveLength(2);
    expect(JSON.stringify(result.projections[0])).toBe(original);
    expect(result.projections[1].priorProjectionId).toBe(result.projections[0].projectionId);
    expect(result.projections[1].projectionVersion).not.toBe(result.projections[0].projectionVersion);
    expect(result.projections[1].source.projectDigest).toBe(result.projections[0].source.projectDigest);
    expect(result.projections[1].administration?.status).toBe("DRAFT_WITH_PLACEHOLDERS");
    expect(renderProjection(result.projections[1], "HTML").content).toContain("Investigateur Démo");
  });

  it("DOCUMENT_FROM_CURRENT_PROJECT / PROJECT_VERSION_TRACEABILITY: adopted science changes create a new version", () => {
    const p1 = adoptBehaviorContribution(richStudyContribution(), null, 1);
    const d1 = generate(p1);
    const turn = behaviorTurn("closure:later", "Ajouter une évaluation à douze mois.");
    const p2 = adoptBehaviorContribution(behaviorContribution({ contributionId: "closure:later", turns: [turn], temporalElements: [behaviorItem({ itemId: "closure:t12", proposedType: "TIMEPOINT", content: "Évaluation à douze mois", turnId: turn.turnId })] }), p1, 2);
    const d2 = generate(p2, metadata(), d1);
    expect(d2.projections).toHaveLength(2);
    expect(d2.projections[1].source).toMatchObject({ projectVersion: p2.versionId, projectDigest: p2.projectDigest });
    expect(renderProjection(d2.projections[1], "HTML").content).toContain("douze mois");
    expect(renderProjection(d2.projections[0], "HTML").content).not.toContain("douze mois");
    expect(p2.previousVersionId).toBe(p1.versionId);
  });

  it("complete admin never implies submission approval and deterministic regeneration keeps one projection", () => {
    const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
    const admin = metadata(); Object.assign(admin.administration, { principalInvestigator: "Démo", sponsor: "Organisme Démo", protocolVersion: "0.1" });
    const result = generate(project, admin);
    expect(result.projections[0].administration?.status).toBe("ADMIN_COMPLETE_FOR_REVIEW");
    expect(result.projections[0].readiness).toBe("PARTIAL");
    expect(generate(project, admin, result).projections).toHaveLength(1);
  });

  it("rejects administrative metadata bound to a different Project", () => {
    const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
    expect(() => refreshFunctionalResetDocumentPortfolio({ project, requestedAt: NOW, generateProtocol: true,
      handoffDecision: authorizeResearchProjectDocumentHandoff({ project, authority: behaviorAuthority, confirmedAt: NOW }),
      administration: documentAdministrationFrom("another-project", metadata()),
    })).toThrow("DOCUMENT_ADMINISTRATION_PROJECT_MISMATCH");
  });

  it("escapes administrative text in the downloadable artifact", () => {
    const admin = metadata(); admin.administration.sponsor = '<script>alert("x")</script>';
    const doc = generate(adoptBehaviorContribution(richStudyContribution(), null, 1), admin).projections[0];
    expect(renderProjection(doc, "HTML").content).toContain("&lt;script&gt;");
    expect(renderProjection(doc, "HTML").content).not.toContain("<script>");
  });
});

it("FUTURE_CONTINUUM_VISIBLE / NO_FALSE_CAPABILITY_CLAIM: disabled WIP modules have no action", () => {
  const conversation = vi.fn(), documents = vi.fn();
  render(<ProjectContinuum disabled={false} documentsAvailable documentsOpen={false} onConversation={conversation} onDocuments={documents} />);
  const nav = screen.getByRole("navigation", { name: "Parcours longitudinal du projet" });
  for (const name of ["Revues", "Interprétation des résultats", "Publication"]) {
    const button = within(nav).getByRole("button", { name: `${name} À venir` });
    expect(button).toBeDisabled(); expect(button).toHaveAttribute("data-capability-status", "WORK_IN_PROGRESS");
    fireEvent.click(button);
  }
  expect(conversation).not.toHaveBeenCalled(); expect(documents).not.toHaveBeenCalled();
  expect(nav).not.toHaveTextContent("Elles ne sont pas disponibles dans cette version");
});


describe("Browser-discovered presentation defects", () => {
  it.each([
    ["Adultes de 45 à 75 ans. Une IRM à l'inclusion.", "IRM à l'inclusion"],
    ["On élargit de 45 à 75 ans vers 35 à 80 ans. Seconde IRM à douze mois.", "Seconde IRM à douze mois"],
  ])("does not borrow a demographic duration for a temporal object: %s", (source, temporal) => {
    const turn = behaviorTurn("closure:temporal", source);
    const contribution = behaviorContribution({ contributionId: "closure:temporal", turns: [turn], temporalElements: [
      behaviorItem({ itemId: "temporal:one", proposedType: "TIMEPOINT", content: temporal, sourceText: source, turnId: turn.turnId }),
    ] });
    const project = adoptBehaviorContribution(contribution, null, 1);
    const contents = project.sections.find((section) => section.sectionId === "TEMPORALITY")!.elements.map((item) => item.content);
    expect(contents).toContain(temporal);
    expect(contents.join(" ")).not.toMatch(/75 ans|80 ans/);
  });

  it("keeps a scientific question in review without turning the local acknowledgement into a new question", () => {
    const turn = behaviorTurn("closure:question", "Je voudrais étudier le lien entre les mesures alpha et beta.");
    const question = "Quel est le lien entre alpha et beta ?";
    const contribution = behaviorContribution({ contributionId: "closure:question:contribution", turns: [turn], candidateObjects: [
      behaviorItem({ itemId: "question:one", proposedType: "SCIENTIFIC_QUESTION", content: question, sourceText: turn.content, turnId: turn.turnId }),
    ] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    const navigation = buildCurrentTurnNavigation({ sourceTurnRef: turn.turnId, sourceText: turn.content, candidate, contribution, currentProject: null,
      validation: { valid: true, acceptedChanges: [], acceptedRelations: [], acceptedTemporalQualifications: [], acceptedExpectedVariableOccasions: [], blocks: [], noOps: [], normalizations: [] } });
    const result = realizeGovernedConversation({ envelope: navigation.envelope, providerReply: null, localWhatText: navigation.localWhatText });
    expect(result.assistantReply).toContain("structurer pour revue");
    expect(result.assistantReply).not.toContain("n’a pas abouti");
    expect(navigation.envelope.authorizedContent).toContainEqual(expect.objectContaining({ text: question }));
    expect(validateGovernedConversationRealization({ envelope: navigation.envelope, assistantReply: "Voulez-vous changer votre étude ?" }).structuralStatus).toBe("FAIL");
  });
});


it("does not overwrite explicit age bounds with the previous interval quoted in the same correction", () => {
  const turn = behaviorTurn("closure:bounds", "Élargir l'âge de 45 à 75 ans vers 35 à 80 ans.");
  const contribution = behaviorContribution({ contributionId: "closure:bounds:contribution", turns: [turn], candidateObjects: [
    behaviorItem({ itemId: "bound:min", proposedType: "ELIGIBILITY_CRITERION", content: "Âge minimal : 35 ans", sourceText: turn.content, turnId: turn.turnId }),
    behaviorItem({ itemId: "bound:max", proposedType: "ELIGIBILITY_CRITERION", content: "Âge maximal : 80 ans", sourceText: turn.content, turnId: turn.turnId }),
  ] });
  const values = adoptBehaviorContribution(contribution, null, 1).sections.find((s) => s.sectionId === "POPULATION")!.elements.map((o) => o.content);
  expect(values).toEqual(["Âge minimal : 35 ans", "Âge maximal : 80 ans"]);
});

it("preserves negation through the Project snapshot, panel and real document without rewriting adopted science", () => {
  const turn = behaviorTurn("closure:negative", "Une étude d'observation, pas un essai de traitement. Exclure l'AVC aigu.");
  const contribution = behaviorContribution({ contributionId: "closure:negative:contribution", turns: [turn], candidateObjects: [
    behaviorItem({ itemId: "design:positive", proposedType: "STUDY_DESIGN", content: "Étude d’observation", turnId: turn.turnId }),
    behaviorItem({ itemId: "design:negative", proposedType: "STUDY_DESIGN", content: "Essai de traitement", polarity: "NEGATED", turnId: turn.turnId }),
    behaviorItem({ itemId: "eligibility:negative", proposedType: "ELIGIBILITY_CRITERION", content: "AVC aigu", polarity: "NEGATED", turnId: turn.turnId }),
  ] });
  const saved = createProjectSession(localStorage, "Neuro");
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: saved.session.projectId, authority: saved.session.projectAuthority, confirmedAt: NOW });
  const before = JSON.stringify(project);
  const snapshot = buildProjectContextSnapshot({ project });
  expect(snapshot.objects.find((o) => o.stableId === "design:negative")).toMatchObject({ content: "Essai de traitement", polarity: "NEGATED" });
  const doc = generate(project).projections[0];
  const html = renderProjection(doc, "HTML").content;
  expect(html).toMatch(/Exclusion \/ absence\s*:\s*Essai de traitement/);
  expect(html).toMatch(/Exclusion \/ absence\s*:\s*AVC aigu/);
  expect(JSON.stringify(project)).toBe(before);
  saved.session.project = project; saved.raw = saveProjectSession(localStorage, saved, saved.session);
  localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key); renderDemo();
  const panel = screen.getByRole("complementary", { name: "Projet de recherche" });
  expect(panel).toHaveTextContent("Exclusion / absence : AVC aigu");
  expect(panel).toHaveTextContent("Exclusion / absence : Essai de traitement");
});
