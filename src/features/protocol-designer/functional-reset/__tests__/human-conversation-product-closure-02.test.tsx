import { readFileSync, writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { createFunctionalResetSession, persistFunctionalResetSession, loadFunctionalResetSession } from "../session";
import { routeProductEntry } from "../product-entry-routing";
import { classifyNaturalConversationActs, readNaturalCandidateDecision } from "../natural-conversation-policy";
import { projectVisibleDiscussionOptions } from "../contribution-discussion-context";
import { prepareConversationalDimensioning, calculateTwoGroupContinuousSampleSize } from "@/features/data-analysis-planning/dimensioning-calculator";
import { projectActionableSourceCoverage } from "../../actionable-source-coverage";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import ContributionReview from "../ContributionReview";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildBoundedConversationReferentContext, selectBoundedConversationInteraction } from "@/features/query-navigation/current-navigation-evidence";
import { prepareScientificCollaboratorConversation, guardScientificCollaboratorLiteratureReply } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { contributionFromPersistentDelta, validatePersistentProjectDelta, parseProductBridgeRequest, buildPersistentSourceCatalog, type ProductBridgeRequest, type ProductBridgeResponse } from "../../product-bridge";
import { bridgeRequest, wire } from "../../../../../validation/protocol-designer-v1-contextual-scientific-reasoning-runtime-01/offline-fixtures";

const ROOT = "validation/protocol-designer-v1-human-conversation-product-closure-02/";
const frozen = JSON.parse(readFileSync("validation/protocol-designer-v1-single-conversational-owner-recovery-01/frozen-human-inputs.json", "utf8")) as { inputs: string[] };
const T1 = frozen.inputs[0]!;
const ageProposal = "Une stratification possible serait :\n20–29 ans\n30–39 ans\n40–49 ans\n50–59 ans\n60–69 ans\n70 ans et plus.\nSouhaitez-vous partir sur cette répartition ?";
const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); bridge.mockReset(); localStorage.clear(); });
const noNetwork = () => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("OFFLINE_ONLY_PROVIDER_FORBIDDEN"); }));

const initial = () => {
  const r = bridgeRequest(T1);
  const checked = validatePersistentProjectDelta(wire(T1, [["OBJECTIVE", "Variation de l’ECV selon l’âge"], ["POPULATION", "Volontaires sains de différentes tranches d’âge"],
      ["STUDY_DESIGN", "Comparaison transversale"], ["ACQUISITION", "IRM cardiaque"], ["CANONICAL_VARIABLE", "ECV"], ["PROJECT_INFORMATION", "Participation sans rémunération"]]), T1, null, r.conversation);
  const contribution = contributionFromPersistentDelta({ conversation: r.conversation, currentProject: null, candidate: checked.candidate! })!;
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  return { contribution, candidate };
};

describe("Human product closure — bounded offline regressions", () => {
  it("retains a real baseline/after render of the same synthetic review fixture", () => {
    noNetwork(); const { contribution, candidate } = initial();
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    const html = renderToStaticMarkup(<ContributionReview contribution={contribution} candidate={candidate} status="PENDING"
      detailedUnderstanding={<p>Audit : compréhension de travail complète</p>} onConfirm={() => undefined} onCorrect={() => undefined} onReject={() => undefined} />);
    const phase = process.env.NOXIA_CLOSURE_RENDER_PHASE === "BEFORE" ? "BEFORE" : "AFTER";
    writeFileSync(ROOT + `HUMAN_REVIEW_${phase}.html`, `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Human Review ${phase}</title><body>${html}</body></html>`);
    expect(html).toContain("Volontaires sains");
  });
  it("binds the exact unique age proposal without asking the user to retype", () => {
    noNetwork(); const runtimeTurns = [{ turnId: "u0", role: "USER" as const, content: "proposons les tranches" },
      { turnId: "a1", role: "NOXIA" as const, content: ageProposal }, { turnId: "u2", role: "USER" as const, content: "oui" }];
    const context = buildBoundedConversationReferentContext({ retained: [], currentProject: null, conversationId: "closure", runtimeTurns, requestingTurnRef: "u2" });
    expect(context.visibleProposal?.options.some(c => c.content.includes("20–29"))).toBe(true);
    expect(context.projectWriteAuthorized).toBe(false);
  });
  it("blocks the demonstrated anonymous literature attribution using retiennent", () => {
    noNetwork(); const request = prepareScientificCollaboratorConversation(bridgeRequest("quelles études ont choisi ces tranches ?"));
    expect(guardScientificCollaboratorLiteratureReply(request, "Les études de référence retiennent généralement une stratification par décennies : 20–29, 30–39, 40–49 ans.").accepted).toBe(false);
  });
});

const bounded = (reply: string, raw = "oui") => {
  const r = bridgeRequest(raw);
  r.preProjectNavigation = undefined;
  r.conversation.turns = [{ turnId: "u0", role: "USER", content: "Discutons des modalités." },
    { turnId: "a1", role: "NOXIA", content: reply }, { turnId: "u2", role: "USER", content: raw }];
  const context = buildBoundedConversationReferentContext({ retained: [], currentProject: null, conversationId: r.conversation.conversationId,
    runtimeTurns: r.conversation.turns, requestingTurnRef: "u2" });
  return { r, context, interaction: selectBoundedConversationInteraction({ sourceText: raw, correctionMode: false, referentContext: context }) };
};
const calcInput = "Calcule l’effectif pour deux groupes indépendants, comparaison de moyennes, allocation égale : différence cible=2 points, SD=3 points, alpha bilatéral=5 %, puissance=80 %, non-évaluabilité=10 %.";
const stats = (text: string) => prepareConversationalDimensioning({ turns: [{ turnRef: "user:stats", role: "USER", content: text }] });

describe("Visible proposal evidence and Human Decision boundaries", () => {
  it.each([ageProposal, "Je vous propose une IRM à M3.", "Je te propose un questionnaire à J30."])("a unique explicit offer prepares extraction without authorizing Project writes: %s", text => {
    noNetwork(); const { r, context, interaction } = bounded(text);
    expect(context.visibleProposal?.options).toHaveLength(1);
    expect(interaction?.kind).toBe("ACKNOWLEDGE_USER_DIRECTION");
    expect(context.resolution).toBe("NONE"); expect(context.candidateRef).toBeNull();
    expect(parseProductBridgeRequest({ ...r, boundedReferentContext: context, boundedInteraction: interaction })).not.toBeNull();
    expect(routeProductEntry({ raw: "oui", sourceTurnRef: "u2", routedAt: "2026-09-17T12:00:00Z", adoptsVisibleProposal: true }).projectConstructionEligible).toBe(true);
    expect(context.projectWriteAuthorized).toBe(false);
  });
  it.each(["T1 et T2 peuvent être utiles selon l’objectif.", "Par exemple, je vous propose une IRM à M3.", "Si nécessaire, je vous propose une IRM à M3."])("discussion and conditional examples do not invent an engageable proposal: %s", text => {
    expect(projectVisibleDiscussionOptions({ turnId: "a", content: text })).toEqual([]);
    expect(bounded(text).context.visibleProposal).toBeUndefined();
  });
  it.each(["Je vous propose une IRM à M3 ou une échographie à M1.", "Je vous propose une IRM à M3. Je vous propose un prélèvement à J1.", "Option 1 : questionnaire à J1\nOption 2 : entretien à J30"])("multiple options require a targeted clarification: %s", text => {
    const { context, interaction } = bounded(text);
    expect(context.visibleProposal?.options.length).toBeGreaterThan(1);
    expect(interaction?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE"); expect(interaction?.clarificationText).toContain("option");
  });
  it.each(["oui mais à M6", "non", "je refuse"])("qualification or refusal never adopts the whole visible offer: %s", raw => {
    const { context, interaction } = bounded("Je vous propose une IRM à M3.", raw);
    expect(context.projectWriteAuthorized).toBe(false);
    expect(interaction?.kind).not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
    const act = readNaturalCandidateDecision(raw);
    expect(act?.act === "CONFIRM" && !act.qualified).toBe(false);
  });
  it("does not resurrect an older visible offer after refusal", () => {
    const { r } = bounded(ageProposal);
    r.conversation.turns.splice(2, 0, { turnId: "refusal", role: "USER", content: "non" });
    const context = buildBoundedConversationReferentContext({ retained: [], currentProject: null,
      conversationId: r.conversation.conversationId, runtimeTurns: r.conversation.turns, requestingTurnRef: "u2" });
    expect(context.visibleProposal).toBeUndefined();
  });
  it.each(["digest", "source", "text", "option", "candidate", "status"])("rejects forged visible presentation evidence: %s", field => {
    const { r, context, interaction } = bounded(ageProposal); const fake = structuredClone(context);
    if (field === "digest") Object.assign(fake.visibleProposal!, { displayDigest: "forged" });
    if (field === "source") Object.assign(fake.visibleProposal!, { sourceResponseRef: "old" });
    if (field === "text") Object.assign(fake.visibleProposal!, { visibleText: "modified" });
    if (field === "option") Object.assign(fake.visibleProposal!, { options: [{ ...fake.visibleProposal!.options[0]!, content: "modified" }] });
    if (field === "candidate") Object.assign(fake.visibleProposal!, { structuredCandidateRef: "injected" });
    if (field === "status") Object.assign(fake.visibleProposal!, { status: "ADOPTED" });
    expect(parseProductBridgeRequest({ ...r, boundedReferentContext: fake, boundedInteraction: interaction })).toBeNull();
  });
});

describe("Internal Knowledge attribution and bounded methodological reasoning", () => {
  it.each(["quelles études ont fait cela ?", "qu'est-ce que dit la littérature ?", "quels seuils ont été utilisés dans les études ?", "quelles tranches d'âge ont choisi les autres équipes ?", "quelle est la référence pour ça ?"])("routes a documentary request without performing retrieval: %s", raw => {
    noNetwork(); expect(classifyNaturalConversationActs(raw)).toContain("EXTERNAL_EVIDENCE_REQUEST");
    const packet = JSON.parse(prepareScientificCollaboratorConversation(bridgeRequest(raw)).context);
    expect(packet.knowledge.externalResearchStatus).toBe("EXTERNAL_RESEARCH_REQUIRED_NOT_EXECUTED");
  });
  it.each(["Les études de référence retiennent généralement une stratification par décennies.", "La littérature montre que ce découpage est pertinent.", "Les autres équipes privilégient ces tranches."])("blocks anonymous attribution: %s", reply => {
    const request = prepareScientificCollaboratorConversation(bridgeRequest("quelle est la référence ?"));
    expect(guardScientificCollaboratorLiteratureReply(request, reply).accepted).toBe(false);
  });
  it.each(["Une stratification par décennies est une option méthodologique simple.", "T1 et T2 peuvent être utiles selon l’objectif.", "Il faudrait vérifier quelles études ont choisi ces classes d’âge.", "Votre étude utilise des classes d’âge."])("allows general reasoning or an explicit verification limit: %s", reply => {
    expect(guardScientificCollaboratorLiteratureReply(prepareScientificCollaboratorConversation(bridgeRequest("comment choisir les classes ?")), reply).accepted).toBe(true);
  });
  it("only accepts an identifiable supplied source; an unrelated citation does not excuse anonymous studies", () => {
    const request = prepareScientificCollaboratorConversation(bridgeRequest("quelle référence ?")); const packet = JSON.parse(request.context);
    packet.knowledge.sources = [{ sourceId: "source:verified", title: "Principes de mesure", locator: "internal:principles" }];
    const scoped = { ...request, context: JSON.stringify(packet) };
    expect(guardScientificCollaboratorLiteratureReply(scoped, "L’article Principes de mesure rapporte une limite méthodologique.").accepted).toBe(true);
    expect(guardScientificCollaboratorLiteratureReply(scoped, "L’article Another paper rapporte un résultat.").accepted).toBe(false);
  });
});

describe("Calculation inputs have numerical provenance, not invented bibliographic authority", () => {
  it("uses the existing deterministic formula with complete explicit assumptions", () => {
    noNetwork(); const assessment = stats(calcInput);
    expect(assessment.status).toBe("CALCULATED_SCENARIO_NOT_PROJECT_DECISION");
    const expected = calculateTwoGroupContinuousSampleSize({ difference: 2, commonStandardDeviation: 3, twoSidedAlpha: .05, power: .8,
      anticipatedNonEvaluableRate: .1, sourceRefs: { difference: "d", commonStandardDeviation: "s", twoSidedAlpha: "a", power: "p", anticipatedNonEvaluableRate: "n" } });
    expect(assessment.calculation?.adjustedPerGroup).toBe(expected.adjustedPerGroup);
    expect(expected.adjustedPerGroup).toBe(40); expect(expected.totalSampleSize).toBe(80);
    expect(assessment.assumptions).toHaveLength(5);
    for (const a of assessment.assumptions) { expect(a.origin).toBe("USER_DECLARED_ASSUMPTION"); expect(calcInput).toContain(a.sourceText); expect(a.sourceTurnRef).toBe("user:stats"); }
    expect(assessment.projectWriteAuthorized).toBe(false); expect(assessment.literatureDerivedAssumptions).toEqual([]);
  });
  it.each([calcInput.replace("SD=3 points, ", ""), calcInput.replace("non-évaluabilité=10 %", ""), calcInput.replace("deux groupes indépendants", "six groupes"), calcInput.replace("différence cible=2 points", "différence cible=2–3 points"), calcInput.replace("SD=3 points", "SD=3 %")])("does not invent inputs or a method: %s", text => {
    expect(stats(text).calculation).toBeNull(); expect(stats(text).status).toBe("INPUTS_OR_SUPPORTED_METHOD_REQUIRED");
  });
  it("preserves a missing dispersion, alpha and power rather than choosing conventional values", () => {
    const r = bridgeRequest("peux tu le calculer ?"); r.conversation.turns.unshift({ turnId: "prior", role: "USER", content: "Discutons de l’effectif." });
    const packet = JSON.parse(prepareScientificCollaboratorConversation(r).context);
    expect(packet.statisticalAssessment.calculation).toBeNull(); expect(packet.statisticalAssessment.missingInputs).toEqual(expect.arrayContaining(["difference", "commonStandardDeviation", "twoSidedAlpha", "power"]));
  });
  it("rejects invalid probabilities with the existing calculator", () => {
    expect(stats(calcInput.replace("puissance=80 %", "puissance=120 %")).status).toBe("INVALID_INPUTS");
  });
  it("a range elsewhere in the conversation does not invalidate explicitly labelled statistical assumptions", () => {
    expect(stats(calcInput + " Population âgée de 18–80 ans.").calculation).not.toBeNull();
  });
  it("a hypothetically offered scenario remains model originated after a unique yes", () => {
    const content = "Je vous propose ce scénario hypothétique : " + calcInput;
    const assessment = prepareConversationalDimensioning({ turns: [{ turnRef: "u", role: "USER", content: "oui" }],
      acceptedVisibleProposal: { turnRef: "a", content, decisionTurnRef: "u" } });
    expect(assessment.calculation).not.toBeNull(); expect(assessment.assumptions.every(a => a.origin === "MODEL_SUGGESTED_ASSUMPTION" && a.decisionTurnRef === "u")).toBe(true);
    expect(assessment.projectWriteAuthorized).toBe(false);
  });
  it.each(["La SD ECV classique est 2–3 points.", "Il faut 20–25 participants par tranche.", "On retient 25 sujets par groupe."])("blocks unverified parameters or an unsupported sample size: %s", reply => {
    expect(guardScientificCollaboratorLiteratureReply(prepareScientificCollaboratorConversation(bridgeRequest("peux tu calculer l’effectif ?")), reply).accepted).toBe(false);
  });
  it("allows hypothetical assumptions without inventing a calculated result", () => {
    const reply = "Pour illustrer un scénario hypothétique, supposons SD=2,5 points et différence cible=2 points ; ces valeurs restent à vérifier.";
    expect(guardScientificCollaboratorLiteratureReply(prepareScientificCollaboratorConversation(bridgeRequest("peux tu calculer l’effectif ?")), reply).accepted).toBe(true);
  });
  it("renders the actual deterministic result when native synthetic text announces a wrong sample size", () => {
    const request = prepareScientificCollaboratorConversation(bridgeRequest(calcInput));
    const guarded = guardScientificCollaboratorLiteratureReply(request, "Il faut 25 sujets par groupe.");
    expect(guarded.accepted).toBe(false); expect(guarded.reason).toBe("UNSUPPORTED_SAMPLE_SIZE_RESULT");
    expect(guarded.visibleReply).toContain("40 sujets par groupe"); expect(guarded.visibleReply).toContain("80 au total"); expect(guarded.visibleReply).toContain("non-évaluabilité=0.1");
  });
});

it("primary review is compact while exact source, IDs, statuses and complete provenance remain inspectable", async () => {
  noNetwork(); const { contribution, candidate } = initial(); const frozenBefore = JSON.stringify({ contribution, candidate });
  render(<ContributionReview contribution={contribution} candidate={candidate} status="PENDING" detailedUnderstanding={<p>Compréhension de travail complète</p>}
    onConfirm={() => undefined} onCorrect={() => undefined} onReject={() => undefined} />);
  expect(screen.queryByTestId("review-audit-detail")).toBeNull(); expect(screen.queryByText("Compréhension de travail complète")).toBeNull();
  expect(screen.getByText("À enregistrer dans le projet")).toBeVisible();
  const details = screen.getByTestId("functional-review-details") as HTMLDetailsElement;
  details.open = true; fireEvent(details, new Event("toggle"));
  await waitFor(() => expect(screen.getByTestId("review-audit-detail")).toBeVisible());
  expect(screen.getByTestId("review-original-source")).toHaveTextContent(T1);
  expect(screen.getByTestId("review-provenance-detail")).toHaveTextContent(contribution.identity.contributionId);
  expect(screen.getByTestId("review-provenance-detail")).toHaveTextContent(candidate.changeSet.sourceContributionRef);
  expect(screen.getByText("Compréhension de travail complète")).toBeVisible();
  expect(JSON.stringify({ contribution, candidate })).toBe(frozenBefore);
});

const send = (text: string) => { fireEvent.change(screen.getByRole("textbox"), { target: { value: text } }); fireEvent.click(screen.getByRole("button", { name: "Envoyer" })); };
const native = (text: string) => new Response(JSON.stringify({ modelVersion: "gemini-3.5-flash-lite", responseId: "LOCAL_SYNTHETIC_ONLY",
  candidates: [{ content: { parts: [{ text }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10 } }));

it("actual Standard fibrosis trajectory keeps review, binding, evidence and persistence in their existing owners", async () => {
  const forbidden = vi.fn(() => { throw new Error("LIVE_FORBIDDEN"); }); vi.stubGlobal("fetch", forbidden);
  let latest = createFunctionalResetSession(); latest.conversationLanguageGateway = { ...latest.conversationLanguageGateway, conversationLanguage: "fr" };
  const requests: ProductBridgeRequest[] = [], outputs: ProductBridgeResponse[] = [];
  const literature = "y a t'il d'autres études qui ont fait la même chose ou quelque chose d'approchant et quels tranches ont ils choisis ?";
  const replies = ["LOCAL_SYNTHETIC — comparaison transversale de l’ECV selon l’âge.", "LOCAL_SYNTHETIC — discutons des classes d’âge.",
    "Les études de référence retiennent généralement des classes par décennies.", ageProposal, "LOCAL_SYNTHETIC — cette répartition est proposée pour confirmation.", "Il faut 20–25 participants par tranche."];
  bridge.mockImplementation(async (r: ProductBridgeRequest) => {
    const reply = replies[requests.length]!; requests.push(r);
    const text = r.conversation.turns.filter(t => t.role === "USER").at(-1)!.content;
    const fetchImpl = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url) !== "https://api.openai.com/v1/responses") return native(reply);
      const raw = text === T1 ? wire(text, [["OBJECTIVE", "Variation de l’ECV selon l’âge"], ["POPULATION", "Volontaires sains de différentes tranches d’âge"],
        ["STUDY_DESIGN", "Comparaison transversale"], ["ACQUISITION", "IRM cardiaque"], ["CANONICAL_VARIABLE", "ECV"], ["PROJECT_INFORMATION", "Participation sans rémunération"]])
        : text === "oui" ? wire(text, [["POPULATION", "Tranches d’âge : 20–29, 30–39, 40–49, 50–59, 60–69 et ≥70 ans"]])
        : { changes: [], relations: [], temporalQualifications: [], expectedVariableOccasions: [] };
      const sourceAnchorId = buildPersistentSourceCatalog(r.conversation).anchors.find(a => a.fragmentKind === "FULL_TURN")!.anchorId;
      const anchored = { ...raw, changes: raw.changes.map(c => { const { sourceText: _source, ...rest } = c; return { ...rest, ...(text === "oui" ? { candidateRef: "closure:age-strata" } : {}), sourceAnchorId,
        ...(text === "oui" ? { assertionKind: "USER_ADOPTED_PROPOSAL", proposalSourceText: r.boundedReferentContext!.visibleProposal!.options[0]!.content } : {}) }; }) };
      return new Response(JSON.stringify({ id: "LOCAL_SYNTHETIC_N1", model: "gpt-5.6-terra", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(anchored) }] }] }));
    });
    const result = await executeProtocolDesignerBridge({ body: { ...r, apiVersion: "1.0.0" }, apiKey: "LOCAL_SYNTHETIC", openAiApiKey: "LOCAL_SYNTHETIC", fetchImpl, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
    expect(result.status).toBe(200); const body = result.body as ProductBridgeResponse; outputs.push(body);
    expect(body.scientificConversation).toMatchObject({ owner: "SCIENTIFIC_THINKING", projectWrites: 0, projectWriteAuthorized: false });
    return body;
  });
  const mount = () => render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={latest} onSessionChange={s => { latest = s; }} /></HelmetProvider>);
  let ui = mount();
  const settle = async (count: number) => { await waitFor(() => expect(outputs).toHaveLength(count)); await waitFor(() => expect(screen.getByRole("textbox")).not.toBeDisabled()); };
  send(T1); await settle(1); await waitFor(() => expect(latest.pendingContribution).not.toBeNull());
  expect(latest.project).toBeNull(); expect(screen.getByText("À enregistrer dans le projet")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" })); await waitFor(() => expect(latest.project?.revision).toBe(1));
  const version1 = latest.project!.versionId;
  send("et ensuite ?"); await settle(2); expect(latest.pendingContribution).toBeNull(); expect(latest.project!.versionId).toBe(version1);
  send(literature); await settle(3); expect(outputs[2].scientificConversation?.fallbackReason).toBe("UNSOURCED_LITERATURE_CLAIM"); expect(latest.pendingContribution).toBeNull();
  send("peux tu proposer une répartition ?"); await settle(4); expect(latest.runtimeTurns.at(-1)?.content).toBe(ageProposal); expect(latest.pendingContribution).toBeNull();
  send("oui"); await settle(5);
  if (!latest.pendingContribution) writeFileSync(ROOT + "debug-visible-offer.json", JSON.stringify({request:requests[4],response:outputs[4],state:latest},null,2));
  await waitFor(() => expect(latest.pendingContribution).not.toBeNull());
  expect(requests[4].evaluatePersistentDelta).toBe(true); expect(requests[4].boundedReferentContext?.visibleProposal?.options).toHaveLength(1);
  expect(latest.project!.versionId).toBe(version1); expect(latest.runtimeTurns.at(-1)?.content).not.toContain("Quelle proposition");
  const review = screen.getByTestId("standard-update-review-summary"); expect(review).toHaveTextContent("20–29"); expect(review).not.toHaveTextContent("ECV");
  const html = renderToStaticMarkup(<ContributionReview contribution={latest.pendingContribution!} candidate={prepareResearchProjectContributionCandidate(latest.pendingContribution!, latest.project)}
    currentProject={latest.project} status="PENDING" onConfirm={() => undefined} onCorrect={() => undefined} onReject={() => undefined} />);
  writeFileSync(ROOT + "HUMAN_REVIEW_UPDATE_AFTER.html", html);
  fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" })); await waitFor(() => expect(latest.project?.revision).toBe(2));
  const adopted = latest.project!.canonicalState!.objects.find(o => o.content.includes("20–29"))!;
  expect(adopted.provenance.assertionKind).toBe("USER_ADOPTED_PROPOSAL");
  expect(adopted.provenance.sourceTurnRefs).toEqual(expect.arrayContaining([
    requests[4].boundedReferentContext!.visibleProposal!.sourceResponseRef, requests[4].conversation.turns.at(-1)!.turnId,
  ]));
  expect(latest.project!.llmProjectWrites).toBe(0); const version2 = latest.project!.versionId;
  persistFunctionalResetSession(localStorage, latest); const restored = loadFunctionalResetSession(localStorage); expect(restored.project).toEqual(latest.project);
  ui.unmount(); latest = restored; ui = mount();
  send("peux tu le calculer ?"); await settle(6); expect(outputs[5].scientificConversation?.fallbackReason).toBe("UNSUPPORTED_SAMPLE_SIZE_RESULT");
  expect(latest.project!.versionId).toBe(version2); expect(latest.pendingContribution).toBeNull(); expect(forbidden).not.toHaveBeenCalled();
  const packet = JSON.parse(prepareScientificCollaboratorConversation(requests[5]).context); expect(packet.statisticalAssessment.calculation).toBeNull();
  writeFileSync(ROOT + "fibrosis-trajectory-offline.json", JSON.stringify({ provenance: "ACTUAL_STANDARD_BRIDGE_N1_PRJ_LOCAL_SYNTHETIC_NOT_NATURALNESS", providerCalls: 0,
    visibleEntries: latest.entries.filter(e => e.kind === "TEXT").map(e => ({ role: e.role, content: e.content })),
    requestDecisions: requests.map(r => ({ currentText: r.conversation.turns.at(-1)?.content, evaluatePersistentDelta: r.evaluatePersistentDelta, boundedInteraction: r.boundedInteraction,
      visibleProposal: r.boundedReferentContext?.visibleProposal })), receipts: outputs.map(o => o.scientificConversation), finalProject: latest.project }, null, 2) + "\n");
  ui.unmount();
}, 30000);

it.each(["UNKNOWN", "MATERIAL"])("N5 distinguishes an undecidable source fragment from a demonstrated material omission / %s", kind => {
  const { contribution } = initial(); const c = structuredClone(contribution);
  const span = kind === "UNKNOWN" ? "formulation inhabituelle" : "Pas de PET.";
  c.source.originalRequest += " " + span;
  c.audit.deterministicFindings = [{ findingId: "coverage:closure", code: "SOURCE_COVERAGE_UNKNOWN", severity: "WARNING", message: `Passage : « ${span} »`, sourceRefs: ["u1"], status: "OPEN" }];
  const result = projectActionableSourceCoverage(c);
  expect(result.dispositions).toHaveLength(1);
  expect(result.dispositions[0].classification).toBe(kind === "UNKNOWN" ? "UNKNOWN" : "TRUE_OMISSION");
  expect(result.partialComprehensionWarning).toBe(kind === "MATERIAL");
  expect(result.actionableItems).toHaveLength(1);
  const html = renderToStaticMarkup(<ContributionReview contribution={c} candidate={prepareResearchProjectContributionCandidate(c, null)} status="PENDING"
    onConfirm={() => undefined} onCorrect={() => undefined} onReject={() => undefined} />);
  expect(html.includes("Compréhension partielle")).toBe(kind === "MATERIAL");
});

it("the existing server applies the deterministic calculator guard without a second synthetic attempt", async () => {
  noNetwork(); const fetchImpl = vi.fn(async () => native("Il faut 25 sujets par groupe."));
  const r = { ...bridgeRequest(calcInput), evaluatePersistentDelta: false };
  const result = await executeProtocolDesignerBridge({ body: r, apiKey: "LOCAL_SYNTHETIC", fetchImpl, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
  expect(result.status).toBe(200); expect(fetchImpl).toHaveBeenCalledTimes(1);
  const response = result.body as ProductBridgeResponse;
  expect(response.assistantReply).toContain("40 sujets par groupe");
  expect(response.scientificConversation?.fallbackReason).toBe("UNSUPPORTED_SAMPLE_SIZE_RESULT");
});

it("a stated feasible recruitment count is not mistaken for a powered sample size", () => {
  const request = prepareScientificCollaboratorConversation(bridgeRequest("Nous disposons de 25 sujets par groupe."));
  expect(guardScientificCollaboratorLiteratureReply(request, "Vous disposez de 25 sujets par groupe ; la puissance reste à évaluer.").accepted).toBe(true);
  expect(guardScientificCollaboratorLiteratureReply(request, "Vous disposez de 25 sujets par groupe, ce qui suffit.").accepted).toBe(false);
});
