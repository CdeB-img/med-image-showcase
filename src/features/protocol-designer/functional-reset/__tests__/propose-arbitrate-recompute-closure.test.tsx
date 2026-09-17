import { mkdirSync, writeFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { renderToStaticMarkup } from "react-dom/server";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { buildPersistentSourceCatalog, type ProductBridgeRequest, type ProductBridgeResponse } from "../../product-bridge";
import { confirmResearchProjectContribution, prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { ensureCanonicalProjectState } from "@/features/research-project-construction/canonical-project-backbone";
import { buildStudyCandidateProjections } from "@/features/data-analysis-planning/projections";
import { calculateStudyProposalScenarios, type ContextualStudyProposal, type StudyProposalComposition } from "@/features/scientific-thinking/contextual-study-proposal";
import { buildStudyProposalSelectionContribution, selectedStudyProposalAtoms, propagateStudyProposalDecision, propagateFreeformStudyProposalDecision, planStudyProposalRecomputation, assertScopedStudyProposalRecomputation, rehydrateStudyProposal, requireStudyProposalReview } from "../study-proposal-standard";
import { createFunctionalResetSession, persistFunctionalResetSession, loadFunctionalResetSession, type FunctionalResetSession } from "../session";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import StudyProposalReview from "../StudyProposalReview";
import { DOMAINS, controlledStudyProposal, explicitWire, requestFor, FIBROSIS_EXACT } from "./study-proposal-fixtures";
const ROOT = "validation/protocol-designer-v1-propose-arbitrate-recompute-closure-01/";
const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
beforeEach(() => { mkdirSync(ROOT, { recursive: true }); vi.stubGlobal("fetch", vi.fn(() => { throw new Error("LIVE_FORBIDDEN"); })); });
afterEach(() => { cleanup(); bridge.mockReset(); vi.unstubAllGlobals(); localStorage.clear(); });
type Domain = typeof DOMAINS[number];
type Wire = { changes: Array<Record<string, unknown>>; relations: unknown[]; temporalQualifications: unknown[]; expectedVariableOccasions: unknown[] };
const run = async (request: Omit<ProductBridgeRequest, "apiVersion">, wire: Wire, generate: (packet: Record<string, unknown>) => ContextualStudyProposal | string) => {
  let howPacket: Record<string, unknown> = {}, calls = 0;
  const fetchImpl: typeof fetch = async (url, init) => {
    calls++; const payload = JSON.parse(String(init?.body));
    if (String(url) === "https://api.openai.com/v1/responses") {
      const anchor = buildPersistentSourceCatalog(request.conversation).anchors.find(a => a.fragmentKind === "FULL_TURN")!;
      const output = { ...wire, changes: wire.changes.map(({ sourceText: _text, ...c }) => ({ ...c, sourceAnchorId: anchor.anchorId })) };
      return new Response(JSON.stringify({ id: "LOCAL_SYNTHETIC_N1", model: "gpt-5.6-terra", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }] }));
    }
    if (!String(url).includes("generativelanguage.googleapis.com")) throw new Error("UNQUALIFIED_TRANSPORT");
    howPacket = JSON.parse(payload.contents[0].parts[0].text); const result = generate(howPacket);
    return new Response(JSON.stringify({ modelVersion: "gemini-3.5-flash-lite", responseId: "LOCAL_SYNTHETIC_HOW", candidates: [{ content: { parts: [{ text: typeof result === "string" ? result : JSON.stringify(result) }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10 } }));
  };
  const result = await executeProtocolDesignerBridge({ body: { ...request, apiVersion: "1.0.0" }, apiKey: "LOCAL_SYNTHETIC", openAiApiKey: "LOCAL_SYNTHETIC", fetchImpl, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
  if (result.status !== 200) writeFileSync(ROOT + "invalid-request.json", JSON.stringify({ request, result }, null, 2));
  expect(result.status).toBe(200); return { response: result.body as ProductBridgeResponse, howPacket, syntheticCalls: calls };
};
const first = async (domain: Domain = DOMAINS[0]) => (await run(requestFor(domain.text), explicitWire(domain), p => controlledStudyProposal(logicalDigest(p), domain))).response;
const adopt = (bundle: StudyProposalComposition, session: FunctionalResetSession, options: string[], atoms: string[]) => {
  const turn = { role: "USER" as const, turnId: "human-selection", content: "Je confirme uniquement les choix sélectionnés", createdAt: session.createdAt };
  const contribution = buildStudyProposalSelectionContribution({ composition: bundle, selectedOptionRefs: options, selectedAtomRefs: atoms, project: session.project,
    projectId: session.projectId, conversationId: session.conversationId, proposalTurn: { role: "NOXIA", turnId: bundle.sourceResponseRef, content: bundle.proposal.reply }, selectionTurn: turn, createdAt: session.createdAt });
  const candidate = prepareResearchProjectContributionCandidate(contribution, session.project);
  const project = confirmResearchProjectContribution({ contribution, current: session.project, projectId: session.projectId, authority: session.projectAuthority, confirmedAt: session.createdAt,
    reviewedProjection: candidate.humanReviewProjection, selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs, confirmationSourceRefs: [turn.turnId] });
  return { project, composition: propagateStudyProposalDecision(bundle, project, selectedStudyProposalAtoms(bundle, options, atoms), options, turn) };
};
const CASES = [
  { id: "A", text: "non finalement je veux uniquement des personnes qui n'ont jamais fumé", atom: "eligibility-smoking", type: "ELIGIBILITY_CRITERION", content: "Inclure uniquement des personnes n'ayant jamais fumé" },
  { id: "B", text: "finalement on garde les hypertendus mais on les prend en compte dans l'analyse", atom: "eligibility-metabolic", type: "ELIGIBILITY_CRITERION", content: "Hypertension autorisée et recueillie pour ajustement ; autres critères de santé à vérifier séparément" },
  { id: "C", text: "au lieu de sept tranches je veux cinq tranches", atom: "age-classes", type: "PROJECT_INFORMATION", content: "Cinq classes d'âge ; bornes, allocation, analyse et effectif restent des choix distincts" },
] as const;
const correction = (bundle: StudyProposalComposition, project: FunctionalResetSession["project"], test: { text: string; atom: string; type: string; content: string }, initialText = FIBROSIS_EXACT) => {
  const object = project && ensureCanonicalProjectState(project).objects.find(o => o.actuality === "CURRENT" && o.sourceItemRefs.some(r =>
    r === `${bundle.proposalRef}:atom:${test.atom}` || bundle.adoptionSourceRefs?.[test.atom]?.includes(r)));
  const request: Omit<ProductBridgeRequest, "apiVersion"> = { ...requestFor(test.text), preProjectNavigation: undefined,
    currentProject: project, studyProposalContext: bundle, conversation: { conversationId: "offline-recompute", language: "fr", turns: [
      { turnId: "original-u", role: "USER", content: initialText }, { turnId: bundle.sourceResponseRef, role: "NOXIA", content: bundle.proposal.reply },
      { turnId: `freeform-${test.atom}`, role: "USER", content: test.text }] } };
  const wire: Wire = { changes: [{ operation: object ? "REPLACE" : "ADD", ...(object ? { targetProjectRef: object.objectId } : {}), candidateRef: `human-correction:${test.atom}`, proposedType: test.type, content: test.content,
    sourceText: test.text, polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [] }], relations: [], temporalQualifications: [], expectedVariableOccasions: [] };
  return { request, wire };
};
const candidateReply = (packet: Record<string, unknown>, test: { text: string; atom: string; type: string; content: string }) => {
  const proposal = structuredClone(packet.previousStudyProposal) as ContextualStudyProposal;
  proposal.contextDigest = logicalDigest(packet); proposal.reply = `Correction comprise : ${test.content}. Les aperçus dépendants sont actualisés comme propositions ; le projet confirmé reste inchangé jusqu'à votre confirmation.`;
  proposal.understanding = [test.content, "Les conséquences restent candidates", "Aucun autre choix n'est adopté"];
  const change = (packet.studyProposalRecomputation as ReturnType<typeof planStudyProposalRecomputation>).changes[0]!;
  const atom = proposal.atoms.find(a => a.ref === test.atom)!;
  Object.assign(atom, { content: change.content, targetType: change.targetType, userChangeRefs: [change.itemId] });
  // These controlled outputs are test data, never runtime scientific rules.
  if (test.atom === "eligibility-smoking") {
    Object.assign(proposal.atoms.find(a => a.ref === "smoking")!, { content: "Tabagisme — déclaration d'absence de tabagisme à vérifier au screening", variableRoles: ["EXCLUSION_VARIABLE", "DESCRIPTIVE_VARIABLE"] });
    proposal.atoms.find(a => a.ref === "confounders")!.content = "Sexe et autres facteurs cardiovasculaires à considérer ; tabagisme constant dans cette population";
    proposal.atoms.find(a => a.ref === "recruitment")!.content = "Recruter des volontaires déclarant n'avoir jamais fumé ; faisabilité à revoir";
  }
  if (test.atom === "eligibility-metabolic") {
    Object.assign(proposal.atoms.find(a => a.ref === "diabetes")!, { content: "Antécédents — hypertension recueillie comme covariable ; diabète à vérifier séparément", variableRoles: ["DESCRIPTIVE_VARIABLE", "ADJUSTMENT_COVARIATE"] });
    proposal.atoms.find(a => a.ref === "analysis-classes")!.content = "Comparer les classes en considérant l'hypertension comme covariable ; modèle ajusté encore à qualifier";
    proposal.atoms.find(a => a.ref === "analysis")!.content = "Régression de l'ECV sur l'âge avec hypertension comme covariable ; effets et hypothèses encore proposés";
    proposal.dimensioningScenarios.find(s => s.analysisAtomRef === "analysis")!.input.totalPredictors = 2;
    // ANCOVA with additional adjustment is not the supported one-way ANOVA.
    proposal.atoms.find(a => a.ref === "analysis-classes")!.analysisMethod = null;
    proposal.atoms.find(a => a.ref === "recruitment")!.content = "Recrutement ouvert aux hypertendus selon les autres critères";
  }
  if (test.atom === "age-classes") {
    atom.strataCount = 5;
    proposal.atoms.find(a => a.ref === "recruitment")!.content = "Couverture candidate de cinq classes ; quotas et bornes à arbitrer";
    proposal.atoms.find(a => a.ref === "analysis-classes")!.content = "Comparer l'ECV entre cinq classes par ANOVA ; hypothèses à vérifier";
    const scenario = proposal.dimensioningScenarios.find(s => s.ref === "seven-strata-scenario")!;
    scenario.label = "Illustration ANOVA à cinq classes — hypothétique"; scenario.input.groups = 5;
    proposal.arbitrations[0]!.options.find(o => o.ref === "classes-option")!.label = "Cinq classes d'âge ; bornes à discuter";
  }
  return proposal;
};
const confirmFreeform = (session: FunctionalResetSession, project: NonNullable<FunctionalResetSession["project"]>, response: ProductBridgeResponse) => {
  const contribution = response.persistentExtraction.contribution!; const candidate = prepareResearchProjectContributionCandidate(contribution, project);
  const nextProject = confirmResearchProjectContribution({ contribution, current: project, projectId: session.projectId, authority: session.projectAuthority,
    confirmedAt: session.createdAt, reviewedProjection: candidate.humanReviewProjection, selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs, confirmationSourceRefs: ["human-freeform-confirmation"] });
  return { project: nextProject, composition: propagateFreeformStudyProposalDecision(response.scientificConversation!.studyProposal!, nextProject, contribution) };
};

describe("Propose/arbitrate/recompute — native offline closure", () => {
  it.each(CASES)("PROPERTY_RECOMPUTE_01/02/03/04/05/13/14 freeform $id rebuilds previews before and after native adoption", async test => {
    const initial = await first(), session = createFunctionalResetSession(); const seeded = adopt(initial.scientificConversation!.studyProposal!, session, ["classes-option"], ["question", "population", "design", "eligibility-smoking", "eligibility-metabolic"]);
    const oldDigest = logicalDigest(seeded.project), oldN = seeded.composition.dimensioning.find(s => s.role === "PRIMARY")?.calculation?.totalSampleSize;
    const { request, wire } = correction(seeded.composition, seeded.project, test);
    const output = await run(request, wire, p => candidateReply(p, test));
    expect(output.response.persistentExtraction.validation?.valid).toBe(true);
    expect(output.response.scientificConversation?.studyProposalStatus).toBe("AVAILABLE");
    const candidate = output.response.scientificConversation!.studyProposal!;
    expect(logicalDigest(seeded.project)).toBe(oldDigest); expect(candidate.adoptedAtomRefs).not.toContain(test.atom);
    const before = buildStudyCandidateProjections(candidate, seeded.project); expect(before.every(p => p.freshness === "CURRENT")).toBe(true);
    expect(candidate.recomputation!.evaluatedOwners).not.toContain("IMAGING");
    expect(candidate.ownerReceipts.find(r => r.owner === "IMAGING")).toEqual(seeded.composition.ownerReceipts.find(r => r.owner === "IMAGING"));
    expect(before.find(p => p.projectionType === "IMAGING_GUIDE")!.content).toBe(buildStudyCandidateProjections(seeded.composition, seeded.project).find(p => p.projectionType === "IMAGING_GUIDE")!.content);
    const next = confirmFreeform(session, seeded.project, output.response); expect(next.project.revision).toBe(seeded.project.revision + 1);
    expect(next.composition.state).toBe("CURRENT"); expect(next.composition.adoptedAtomRefs).toContain(test.atom);
    const previews = buildStudyCandidateProjections(next.composition, next.project); expect(previews.every(p => p.freshness === "CURRENT")).toBe(true);
    const newObjects = ensureCanonicalProjectState(next.project).objects.filter(o => o.actuality === "CURRENT");
    expect(newObjects.filter(o => o.content === test.content)).toHaveLength(1);
    expect(newObjects.length).toBe(ensureCanonicalProjectState(seeded.project).objects.filter(o => o.actuality === "CURRENT").length);
    expect(newObjects.some(o => /259|177/u.test(o.content))).toBe(false);
    expect(next.composition.qrySelection?.selected).toBeTruthy();
    if (test.id === "A") expect(previews.find(p => p.projectionType === "RECRUITMENT_NOTICE")!.content).toContain("jamais fumé");
    if (test.id === "B") {
      expect(next.composition.dimensioning.find(s => s.role === "PRIMARY")?.status).toBe("BLOCKED");
      expect(next.composition.qrySelection?.nonDominated.some(c => c.owner === "BIOSTATISTICS" && c.actionCategory === "BUILD_OR_REVISE_OBJECT")).toBe(true);
    }
    if (test.id === "C") { expect(next.composition.dimensioning.filter(s => s.role === "PRIMARY")).toHaveLength(1); expect(next.composition.dimensioning[0]!.calculation!.strata).toBe(5); expect(next.composition.dimensioning[0]!.calculation!.totalSampleSize).not.toBe(oldN); }
    persistFunctionalResetSession(localStorage, { ...session, project: next.project, studyProposal: next.composition });
    expect(loadFunctionalResetSession(localStorage).studyProposal).toEqual(next.composition);
    writeFileSync(ROOT + `case-${test.id}.json`, JSON.stringify({ provenance: "ACTUAL_BRIDGE_NATIVE_HUMAN_DECISION_LOCAL_SYNTHETIC", input: test.text, response: output.response.assistantReply, beforeProject: seeded.project, candidate, afterProject: next.project, composition: next.composition, previews, providerCalls: 0 }, null, 2));
  });
  it("PROPERTY_RECOMPUTE_02 correction before any adoption keeps Project null", async () => {
    const bundle = (await first()).scientificConversation!.studyProposal!; const test = CASES[0], { request, wire } = correction(bundle, null, test);
    const output = await run(request, wire, p => candidateReply(p, test));
    expect(output.response.scientificConversation?.studyProposalStatus).toBe("AVAILABLE"); expect(output.response.scientificConversation!.studyProposal!.sourceProject).toBeNull();
    expect(output.response.scientificConversation!.projectWrites).toBe(0); expect(output.response.scientificConversation!.projectWriteAuthorized).toBe(false);
  });
  it("PROPERTY_RECOMPUTE_06/07/08 participant declarations and full site CRF are separate", async () => {
    const bundle = (await first()).scientificConversation!.studyProposal!, previews = buildStudyCandidateProjections(bundle, null);
    const questionnaire = previews.find(p => p.projectionType === "RECRUITED_PARTICIPANT_QUESTIONNAIRE")!, crf = previews.find(p => p.projectionType === "CRF_SPECIFICATION")!;
    expect(questionnaire.fields.map(f => f.declarationRef)).toEqual(["sex", "history", "treatments", "smoking", "sport", "alcohol"]);
    for (const ref of ["consent", "quality", "deviation", "missing", "height", "weight", "ecv", "acquisition", "hematocrit"]) { expect(questionnaire.fields.some(f => f.declarationRef === ref)).toBe(false); expect(crf.fields.some(f => f.declarationRef === ref)).toBe(true); }
    expect(new Set(previews.filter(p => ["RECRUITMENT_NOTICE", "SCREENING", "RECRUITED_PARTICIPANT_QUESTIONNAIRE", "CRF_SPECIFICATION"].includes(p.projectionType)).map(p => p.projectionType)).size).toBe(4);
  });
  it("PROPERTY_RECOMPUTE_09/10/11 regression and ANOVA have exactly one compatible candidate main N", async () => {
    const bundle = (await first()).scientificConversation!.studyProposal!, session = createFunctionalResetSession();
    expect(bundle.dimensioning.filter(s => s.role === "PRIMARY")).toHaveLength(1); expect(bundle.dimensioning.find(s => s.role === "PRIMARY")!.calculation!.inputs.method).toBe("LINEAR_REGRESSION");
    const continuous = adopt(bundle, session, ["continuous-option"], []);
    expect(continuous.composition.dimensioning).toHaveLength(1); expect(continuous.composition.dimensioning[0]!.calculation!.inputs.method).toBe("LINEAR_REGRESSION");
    const classes = adopt(bundle, createFunctionalResetSession(), ["classes-option"], []);
    expect(classes.composition.dimensioning).toHaveLength(1); expect(classes.composition.dimensioning[0]!.calculation!.inputs.method).toBe("ONE_WAY_ANOVA");
    expect(classes.composition.dimensioning[0]!.calculation!.inputs.assumptions.every(a => a.provenance === "PROVISIONAL_ASSUMPTION")).toBe(true);
    const bad = structuredClone(bundle.proposal); bad.atoms.find(a => a.ref === "analysis-classes")!.analysisMethod = "LINEAR_REGRESSION";
    expect(calculateStudyProposalScenarios(bad)[0]!.status).toBe("BLOCKED");
    expect(buildStudyCandidateProjections(bundle, null).find(p => p.projectionType === "DIMENSIONING")!.content).toContain("Alternative");
  });
  it("PROPERTY_RECOMPUTE_12 first view exposes understanding, substantive proposals and work prepared without expanded dump", async () => {
    const bundle = (await first()).scientificConversation!.studyProposal!;
    render(<StudyProposalReview composition={bundle} project={null} onValidate={() => undefined} onDiscuss={() => undefined} />);
    expect(screen.getByTestId("proposal-substantive-work").querySelectorAll("li")).toHaveLength(6); expect(screen.getByText(/Déjà préparé/u)).toBeVisible();
    expect(screen.getByTestId("study-proposal-detail")).not.toHaveAttribute("open");
    writeFileSync(ROOT + "first-turn.html", renderToStaticMarkup(<StudyProposalReview composition={bundle} project={null} onValidate={() => undefined} onDiscuss={() => undefined} />));
  });
  it("unbound or unrelated scientific changes fail closed, old N never remains current", async () => {
    const bundle = (await first()).scientificConversation!.studyProposal!; const test = CASES[0], { request, wire } = correction(bundle, null, test);
    const output = await run(request, wire, p => { const raw = candidateReply(p, test); raw.atoms.find(a => a.ref === "measurement")!.content = "Nouvelle acquisition non demandée"; return raw; });
    expect(output.response.scientificConversation?.studyProposal).toBeUndefined(); expect(output.response.scientificConversation?.fallbackReason).toBe("TECHNICAL_FAILURE");
    const failed = requireStudyProposalReview(bundle, null); expect(failed.state).toBe("REVIEW_REQUIRED"); expect(failed.dimensioning).toHaveLength(0); expect(rehydrateStudyProposal(failed, null)?.state).toBe("REVIEW_REQUIRED");
    expect(buildStudyCandidateProjections(failed, null).every(p => p.freshness === "REVIEW_REQUIRED" && !p.content.includes("259"))).toBe(true);
  });
  it.each(DOMAINS.slice(1, 4))("cross-domain $id freeform uses existing bridge and native human adoption", async domain => {
    const bundle = (await first(domain)).scientificConversation!.studyProposal!, session = createFunctionalResetSession();
    const seed = adopt(bundle, session, ["continuous-option"], ["question", "population", "design"]);
    const test = { text: `finalement je retiens ${domain.population} avec des critères d'inclusion plus larges`, atom: "population", type: "POPULATION", content: `${domain.population} avec critères d'inclusion élargis à préciser` };
    const { request, wire } = correction(seed.composition, seed.project, test, domain.text); const output = await run(request, wire, p => candidateReply(p, test));
    expect(output.response.scientificConversation?.studyProposalStatus).toBe("AVAILABLE"); const next = confirmFreeform(session, seed.project, output.response);
    expect(next.project.revision).toBe(2); expect(next.composition.state).toBe("CURRENT"); expect(next.composition.recomputation!.evaluatedOwners).not.toContain("IMAGING");
    writeFileSync(ROOT + `cross-${domain.id}.json`, JSON.stringify({ input: test.text, response: output.response.assistantReply, project: next.project, composition: next.composition, providerCalls: 0 }, null, 2));
  });
  it("PROPERTY_RECOMPUTE_10 actual freeform continuous-to-groups revision replaces the main N", async () => {
    const bundle = (await first()).scientificConversation!.studyProposal!, session = createFunctionalResetSession();
    const seed = adopt(bundle, session, ["continuous-option"], ["question", "population", "design"]);
    const oldN = seed.composition.dimensioning[0]!.calculation!.totalSampleSize;
    const test = { text: "finalement je veux comparer sept groupes d'âge plutôt que garder l'âge continu comme stratégie principale", atom: "age-continuous", type: "PROJECT_INFORMATION", content: "Comparaison principale entre sept groupes d'âge ; autres paramètres à arbitrer" };
    const { request, wire } = correction(seed.composition, seed.project, test);
    const output = await run(request, wire, p => {
      const raw = candidateReply(p, test); raw.atoms.find(a => a.ref === test.atom)!.strataCount = 7;
      Object.assign(raw.atoms.find(a => a.ref === "analysis")!, { content: "Comparaison candidate entre sept classes par ANOVA", analysisMethod: "ONE_WAY_ANOVA" });
      const scenario = raw.dimensioningScenarios.find(s => s.analysisAtomRef === "analysis")!;
      scenario.label = "Comparaison sept groupes — scénario provisoire"; Object.assign(scenario.input, { method: "ONE_WAY_ANOVA", effectSize: .25, groups: 7, allocation: "BALANCED_GROUPS" });
      scenario.input.assumptions.find(a => a.parameter === "effectSize")!.value = .25;
      return raw;
    });
    expect(output.response.scientificConversation?.studyProposalStatus).toBe("AVAILABLE");
    const next = confirmFreeform(session, seed.project, output.response), main = next.composition.dimensioning.filter(s => s.role === "PRIMARY");
    expect(main).toHaveLength(1); expect(main[0]!.calculation!.inputs.method).toBe("ONE_WAY_ANOVA"); expect(main[0]!.calculation!.totalSampleSize).not.toBe(oldN);
    expect(buildStudyCandidateProjections(next.composition, next.project).find(p => p.projectionType === "DIMENSIONING")!.content).not.toContain(`${oldN} à recruter`);
    writeFileSync(ROOT + "analysis-transition.json", JSON.stringify({ input: test.text, response: output.response.assistantReply, oldN, newMain: main[0], composition: next.composition, project: next.project, providerCalls: 0 }, null, 2));
  });
  it("affected neuro Imaging reuses the native owner context on the existing shared HOW call", async () => {
    const domain = DOMAINS[3], bundle = (await first(domain)).scientificConversation!.studyProposal!, session = createFunctionalResetSession();
    const seed = adopt(bundle, session, ["continuous-option"], ["question", "population", "design", "measurement"]);
    const test = { text: "finalement je veux une IRM ASL multi délai hors crise avec une acquisition adaptée au transit artériel", atom: "measurement", type: "ACQUISITION", content: "IRM ASL multi-délai hors crise avec acquisition adaptée au transit artériel" };
    const { request, wire } = correction(seed.composition, seed.project, test, domain.text), output = await run(request, wire, p => candidateReply(p, test));
    expect(output.response.scientificConversation?.studyProposalStatus).toBe("AVAILABLE"); expect(output.syntheticCalls).toBe(2);
    expect(output.response.scientificConversation!.studyProposal!.recomputation!.evaluatedOwners).toContain("IMAGING");
    const next = confirmFreeform(session, seed.project, output.response); expect(next.composition.state).toBe("CURRENT");
    writeFileSync(ROOT + "neuro-imaging-impact.json", JSON.stringify({ input: test.text, response: output.response.assistantReply, composition: next.composition, project: next.project, providerCalls: 0 }, null, 2));
  });

  it("successive corrections preserve prior native decisions and their exact provenance", async () => {
    const session = createFunctionalResetSession(); let seed: { project: NonNullable<FunctionalResetSession["project"]>; composition: StudyProposalComposition } = adopt((await first()).scientificConversation!.studyProposal!, session, ["classes-option"], ["question", "population", "design", "eligibility-smoking", "eligibility-metabolic"]);
    for (const test of CASES) {
      const { request, wire } = correction(seed.composition, seed.project, test), output = await run(request, wire, p => candidateReply(p, test));
      expect(output.response.scientificConversation?.studyProposalStatus).toBe("AVAILABLE"); seed = confirmFreeform(session, seed.project, output.response);
      expect(rehydrateStudyProposal(seed.composition, seed.project)?.state).toBe("CURRENT");
    }
    expect(seed.project.revision).toBe(4); expect(seed.composition.adoptedAtomRefs).toEqual(expect.arrayContaining(CASES.map(c => c.atom)));
    expect(ensureCanonicalProjectState(seed.project).objects.filter(o => o.actuality === "CURRENT").map(o => o.content)).toEqual(expect.arrayContaining(CASES.map(c => c.content)));
    writeFileSync(ROOT + "successive-corrections.json", JSON.stringify({ inputs: CASES.map(c => c.text), project: seed.project, composition: seed.composition, providerCalls: 0 }, null, 2));
  });
  it("unbound direct corrections, scope tampering and stale inputs are rejected", async () => {
    const bundle = (await first()).scientificConversation!.studyProposal!, test = CASES[0], { request, wire } = correction(bundle, null, test);
    const output = await run(request, wire, p => { const raw = candidateReply(p, test); raw.atoms.find(a => a.ref === test.atom)!.userChangeRefs = []; return raw; });
    expect(output.response.scientificConversation?.studyProposal).toBeUndefined();
    const contribution = output.response.persistentExtraction.contribution!;
    expect(() => assertScopedStudyProposalRecomputation(bundle, controlledStudyProposal("irrelevant"), contribution)).toThrow("FREEFORM_CHANGE_OMITTED");
    const tampered = structuredClone(bundle); tampered.proposal.atoms[0]!.content = "Mutation non autorisée";
    expect(rehydrateStudyProposal(tampered, null)).toBeNull();
  });

});

it.each(CASES.flatMap(test => (["button", "natural"] as const).map(mode => ({ ...test, mode }))))("actual Standard freeform $id $mode confirmation writes without returning to the bundle", async test => {
  const mode = `${test.id}-${test.mode}`;
  let latest = createFunctionalResetSession(); latest.conversationLanguageGateway = { ...latest.conversationLanguageGateway, conversationLanguage: "fr" };
  bridge.mockImplementation(async (request: ProductBridgeRequest) => {
    if (!request.studyProposalContext) return (await run(request, explicitWire(), p => controlledStudyProposal(logicalDigest(p)))).response;
    const wire = correction(request.studyProposalContext, request.currentProject, test).wire;
    const response = (await run(request, wire, p => candidateReply(p, test))).response; writeFileSync(ROOT + `standard-response-${mode}.json`, JSON.stringify({ request, response }, null, 2)); return response;
  });
  render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={latest} onSessionChange={s => { latest = s; }} /></HelmetProvider>);
  const send = (text: string) => { fireEvent.change(screen.getByRole("textbox"), { target: { value: text } }); fireEvent.click(screen.getByRole("button", { name: "Envoyer" })); };
  send(FIBROSIS_EXACT); await waitFor(() => expect(screen.getByTestId("study-proposal-review")).toBeVisible());
  if (test.id === "C") fireEvent.click(screen.getByLabelText("Sept classes d'âge ; bornes à discuter", { exact: false }));
  for (const atom of ["eligibility-smoking", "eligibility-metabolic"]) fireEvent.click(screen.getByLabelText(latest.studyProposal!.proposal.atoms.find(a => a.ref === atom)!.content));
  fireEvent.click(screen.getByRole("button", { name: "Valider les propositions" })); await waitFor(() => expect(latest.project?.revision).toBe(1));
  const original = logicalDigest(latest.project); send(test.text);
  await waitFor(() => expect(latest.pendingContribution?.scientificContent.candidateObjects[0]?.content).toBe(test.content)).catch(error => { writeFileSync(ROOT + `standard-failure-${mode}.json`, JSON.stringify({ latest, bridgeCalls: bridge.mock.calls }, null, 2)); throw error; });
  expect(logicalDigest(latest.project)).toBe(original);
  expect(screen.getAllByRole("heading", { name: "Compréhension de travail" })).toHaveLength(1);
  if (test.mode === "button") fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" })); else send("oui je confirme");
  await waitFor(() => expect(latest.project?.revision).toBe(2)); expect(latest.studyProposal?.state).toBe("CURRENT"); expect(latest.studyProposal!.adoptedAtomRefs).toContain(test.atom);
  expect(latest.documents.projections).toHaveLength(0); expect(bridge).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId("conversation-composer")).toHaveClass("sticky");
  persistFunctionalResetSession(localStorage, latest); expect(loadFunctionalResetSession(localStorage).studyProposal).toEqual(latest.studyProposal);
  writeFileSync(ROOT + `standard-${mode}.json`, JSON.stringify({ provenance: "REAL_STANDARD_COMPONENT_NATIVE_REVIEW_SYNTHETIC_TRANSPORT", project: latest.project, composition: latest.studyProposal, humanDecisions: latest.retainedContributionCandidates.filter(c => c.humanDecision).map(c => c.humanDecision), providerCalls: 0, documentGenerations: 0 }, null, 2));
});
