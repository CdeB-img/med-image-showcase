import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { handleProtocolDesignerBridge, type ApiResponse } from "../../../../../api/protocol-designer-bridge";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { ensureCanonicalProjectState } from "@/features/research-project-construction";
import { FUNCTIONAL_RESET_STORAGE_KEY, type FunctionalResetSession } from "../session";

import { T01, T02, T03, T04, T05, NORMALIZED_ENDPOINT, FAMILY_A_TURNS, FAMILY_B_TURNS, FAMILY_C_TURNS, SEMANTIC_TURN_EXPECTATIONS, createLongHorizonProviderReplay, type SoakTurn, type ProviderCallWitness } from "./fixtures/long-horizon-provider-replay";

const deterministicResponse = (
  body: unknown,
  status = 200,
  headers: Readonly<Record<string, string>> = { "content-type": "application/json" },
) => {
  const serialized = JSON.stringify(body);
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
  );
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => normalizedHeaders[name.toLowerCase()] ?? null },
    json: async () => JSON.parse(serialized) as unknown,
    text: async () => serialized,
  } as unknown as Response;
};

const currentSession = () => JSON.parse(
  window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!,
) as FunctionalResetSession;

const renderWorkspace = () => render(
  <HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>,
);

const submit = async (text: string) => {
  await act(async () => {
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: text } });
  });
  const send = screen.getByRole("button", { name: "Envoyer" });
  await waitFor(() => expect(send).not.toBeDisabled());
  await act(async () => {
    fireEvent.click(send);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const clickAndFlush = async (button: HTMLElement) => {
  await act(async () => {
    fireEvent.click(button);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const waitForComposerReady = async () => {
  await waitFor(() => expect(document.querySelector(".animate-spin")).toBeNull(), { timeout: 5_000 });
};

const waitForVisibleProjectRevision = async (revision: number) => {
  await waitFor(() => expect(
    within(screen.getByTestId("functional-research-project")).getByText(`Version ${revision}`),
  ).toBeInTheDocument(), { timeout: 5_000 });
};

const waitForPostAdoptionContinuation = async () => {
  const projectVersion = currentSession().project?.versionId;
  expect(projectVersion).toBeTruthy();
  await waitFor(() => expect(currentSession().bridgeTraces.some((trace) =>
    trace.requestKind === "POST_ADOPTION_QRY_CONTINUATION"
    && trace.projectVersionBefore === projectVersion,
  )).toBe(true), { timeout: 5_000 });
};

const installRuntimeReplayTransport = (
  witnesses: ProviderCallWitness[],
  options: { how: "SUCCESS" | "UNAVAILABLE" } = { how: "SUCCESS" },
) => {
  const providerReplay = createLongHorizonProviderReplay(witnesses, options);
  const browserTransport = vi.fn(async (resource: string | URL | Request, init?: RequestInit) => {
    if (String(resource) !== "/api/protocol-designer-bridge" || typeof init?.body !== "string") {
      throw new Error(`RUNTIME_REPLAY_UNEXPECTED_BROWSER_TRANSPORT:${String(resource)}`);
    }
    let responseStatus = 0;
    let responseBody: unknown;
    const headers: Record<string, string> = {};
    const response: ApiResponse = {
      status(code) { responseStatus = code; return this; },
      setHeader(name, value) { headers[name] = value; },
      json(value) { responseBody = value; },
    };
    const actualHeaders = Object.fromEntries(new Headers(init.headers).entries());
    await handleProtocolDesignerBridge({
      method: init.method,
      headers: { ...actualHeaders, host: "127.0.0.1:5198", origin: "http://127.0.0.1:5198" },
      body: init.body,
    }, response, {
      NODE_ENV: "development", GEMINI_API_KEY: "offline-gemini-key", OPENAI_API_KEY: "offline-openai-key",
    }, { fetchImpl: providerReplay, now: () => Date.parse("2026-09-14T08:00:00.000Z") });
    return deterministicResponse(responseBody, responseStatus, headers);
  });
  vi.stubGlobal("fetch", browserTransport);
  return browserTransport;
};

const productBridgeRequestCount = (browserTransport: ReturnType<typeof vi.fn>) => browserTransport.mock.calls
  .filter(([, init]) => typeof init?.body === "string"
    && (JSON.parse(init.body as string) as { operation?: string }).operation !== "LANGUAGE_PROJECTION")
  .length;

const activeObjects = (session: FunctionalResetSession) => session.project
  ? ensureCanonicalProjectState(session.project).objects.filter((item) => item.actuality === "CURRENT") : [];

const assertCurrentNavigation = (session: FunctionalResetSession) => {
  if (!session.project) return;
  expect(session.queryNavigation).toMatchObject({ projectRef: session.project.projectId,
    projectVersion: session.project.versionId, projectDigest: session.project.projectDigest });
  const selectedNeeds = session.queryNavigation!.standardQuestion?.informationNeedRefs ?? [];
  expect(selectedNeeds.some((ref) => session.queryNavigation!.memory.resolvedNeedRefs.includes(ref))).toBe(false);
  if (session.queryNavigation!.status === "QUESTION_READY") {
    expect(session.queryNavigation!.standardQuestion?.text.trim().length).toBeGreaterThan(5);
    expect(session.queryNavigation!.currentAction).not.toBeNull();
  } else {
    expect(["OWNER_ACTION_READY", "NO_USEFUL_QUESTION"]).toContain(session.queryNavigation!.status);
  }
  if (activeObjects(session).some((item) => /tout venant/iu.test(item.content))) {
    const genericPopulationNeeds = session.queryNavigation!.selection.needs.filter((need) => need.status === "OPEN"
      && need.affectedBranchRefs.some((ref) => ["project-facet:POPULATION:INCLUSION", "project-facet:POPULATION:EXCLUSION",
        "project-facet:POPULATION:ELIGIBILITY", "project-facet:POPULATION:POPULATION_DEFINITION"].includes(ref)));
    expect(genericPopulationNeeds).toEqual([]);
    expect(session.queryNavigation!.standardQuestion?.text ?? "").not.toMatch(/inclusion.*exclusion|exclusion.*inclusion/iu);
  }
};

const foldedContent = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "")
  .toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const assertScientificResponse = (session: FunctionalResetSession, text: string) => {
  expect(text.trim().length).toBeGreaterThan(80);
  expect(text).not.toMatch(/^(?:merci|bien reçu|c'est noté|d'accord)[.!\s]*$/iu);
  const materialObjects = activeObjects(session).filter((item) =>
    ["PRIMARY_ENDPOINT", "INTERVENTION_ARM", "COMPARATOR_ARM"].includes(item.scientificRole ?? ""));
  expect(materialObjects.length).toBeGreaterThanOrEqual(3);
  for (const object of materialObjects) expect(foldedContent(text)).toContain(foldedContent(object.content));
  expect(session.scientificThinkingInteraction).toMatchObject({ sourceProjectRef: session.project!.projectId,
    sourceProjectVersion: session.project!.versionId, sourceProjectDigest: session.project!.projectDigest });
};

const assertUntargetedObjectsPreserved = (before: FunctionalResetSession, after: FunctionalResetSession) => {
  const candidate = before.bridgeTraces.at(-1)?.persistentCandidate;
  const modifiedIds = new Set(candidate?.changes.filter((item) => item.operation !== "ADD")
    .map((item) => item.targetProjectRef).filter(Boolean) ?? []);
  for (const previous of activeObjects(before).filter((item) => !modifiedIds.has(item.objectId))) {
    expect(activeObjects(after).find((item) => item.objectId === previous.objectId), `Unchanged object ${previous.objectId}`).toEqual(previous);
  }
};

const runSoak = async (turns: readonly SoakTurn[]) => {
  const providerWitnesses: ProviderCallWitness[] = [];
  const browserTransport = installRuntimeReplayTransport(providerWitnesses);
  renderWorkspace();
  let expectedCandidateCount = 0;
  let expectedRevision = 0;

  for (const turn of turns) {
    expect(turn.intendedMeaning.trim().length).toBeGreaterThan(10);
    const before = currentSession();
    const beforeProjectDigest = before.project?.projectDigest ?? null;
    const beforeProductBridgeCalls = productBridgeRequestCount(browserTransport);
    const beforeRuntimeLength = before.runtimeTurns.length;

    await submit(turn.text);

    if (turn.outcome === "CANDIDATE") {
      expectedCandidateCount += 1;
      await waitFor(() => {
        const observed = currentSession().retainedContributionCandidates?.length ?? 0;
        if (observed !== expectedCandidateCount) {
          const errors = currentSession().entries.filter((entry) => entry.kind === "ERROR").map((entry) => entry.content);
          const routing = currentSession().bridgeTraces.at(-1)?.entryRouting;
          const composer = screen.getByLabelText("Votre message") as HTMLTextAreaElement;
          const send = screen.getByRole("button", { name: "Envoyer" }) as HTMLButtonElement;
          throw new Error(`SOAK_CANDIDATE_NOT_PRESENT:${turn.text}:expected=${expectedCandidateCount}:observed=${observed}:browser=${browserTransport.mock.calls.length}:draft=${JSON.stringify(composer.value)}:sendDisabled=${send.disabled}:busy=${Boolean(document.querySelector(".animate-spin"))}:routing=${JSON.stringify(routing)}:errors=${JSON.stringify(errors)}`);
        }
      }, { timeout: 5_000 });
      await waitFor(() => expect(screen.getAllByTestId("functional-contribution-review")).toHaveLength(expectedCandidateCount), {
        timeout: 5_000,
      });
      const pending = currentSession().retainedContributionCandidates?.at(-1);
      expect(pending).toMatchObject({ downstreamState: "PRESENTED", humanDecision: null });
      const expectedMeaning = SEMANTIC_TURN_EXPECTATIONS[turn.text];
      expect(expectedMeaning?.length).toBeGreaterThan(0);
      const candidateText = Object.values(pending!.contribution.scientificContent).flatMap((value): unknown[] => Array.isArray(value) ? value : [])
        .filter((item): item is { content: string } => Boolean(item) && typeof item === "object" && "content" in item && typeof item.content === "string")
        .map((item) => item.content).join("\n");
      for (const pattern of expectedMeaning) expect(candidateText, turn.intendedMeaning).toMatch(pattern);
      expect(activeObjects(currentSession())).toEqual(activeObjects(before));
      expect(currentSession().project?.projectDigest ?? null).toBe(beforeProjectDigest);
      expect(productBridgeRequestCount(browserTransport)).toBe(beforeProductBridgeCalls + 1);
      if (turn.confirmWithButton) {
        const review = screen.getAllByTestId("functional-contribution-review").at(-1)!;
        await clickAndFlush(within(review).getByRole("button", { name: "Cela correspond à mon projet" }));
        expectedRevision += 1;
        await waitFor(() => expect(currentSession().project?.revision).toBe(expectedRevision));
        await waitForVisibleProjectRevision(expectedRevision);
        await waitForPostAdoptionContinuation();
        await waitForComposerReady();
      }
      assertCurrentNavigation(currentSession());
      continue;
    }

    await waitFor(() => expect(currentSession().runtimeTurns.length).toBeGreaterThan(beforeRuntimeLength));
    expect(currentSession().runtimeTurns.some((item) => item.role === "USER" && item.content === turn.text)).toBe(true);
    await waitFor(() => expect(screen.queryAllByText(turn.text, { exact: true }).length).toBeGreaterThan(0), { timeout: 5_000 });
    expect(productBridgeRequestCount(browserTransport)).toBe(beforeProductBridgeCalls);

    if (turn.outcome === "CONFIRM") {
      expectedRevision += 1;
      await waitFor(() => expect(currentSession().project?.revision).toBe(expectedRevision));
      await waitForVisibleProjectRevision(expectedRevision);
      await waitForPostAdoptionContinuation();
      await waitForComposerReady();
      expect(currentSession().retainedContributionCandidates?.at(-1)?.humanDecision?.status).toBe("ADOPTED");
      assertUntargetedObjectsPreserved(before, currentSession());
    } else if (turn.outcome === "REFUSE") {
      await waitFor(() => expect(currentSession().retainedContributionCandidates?.at(-1)?.humanDecision?.status).toBe("REJECTED"));
      expect(currentSession().project?.projectDigest ?? null).toBe(beforeProjectDigest);
      expect(currentSession().project?.revision ?? 0).toBe(expectedRevision);
    } else {
      expect(currentSession().project?.projectDigest ?? null).toBe(beforeProjectDigest);
      expect(currentSession().project?.revision ?? 0).toBe(expectedRevision);
      if (turn.outcome === "PROPOSAL" || turn.outcome === "DISCUSS") {
        await waitFor(() => {
          const replies = currentSession().runtimeTurns.slice(beforeRuntimeLength).filter((item) => item.role === "NOXIA");
          expect(replies.length).toBeGreaterThan(0);
          assertScientificResponse(currentSession(), replies.map((item) => item.content).join("\n"));
        });
      }
    }
    assertCurrentNavigation(currentSession());
  }

  await waitFor(() => expect(currentSession().entries.some((entry) => entry.kind === "ERROR")).toBe(false));
  const observedUserTurns = currentSession().runtimeTurns.filter((turn) => turn.role === "USER");
  expect(observedUserTurns.map((turn) => turn.content)).toEqual(turns.map((turn) => turn.text));
  const cumulativeCosts = currentSession().bridgeTraces
    .map((trace) => trace.cumulativeSessionCostUsd)
    .filter((cost): cost is number => typeof cost === "number");
  expect(cumulativeCosts.every((cost, index) => index === 0 || cost >= cumulativeCosts[index - 1]!)).toBe(true);
  return { session: currentSession(), browserTransport, providerWitnesses };
};

describe("V1 long-horizon representative Standard runtime harness", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    window.history.replaceState({}, "", "/protocol-designer/demo?traceCaptureLevel=LEVEL_2_DIAGNOSTIC");
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("traverses Standard UI, real client, bridge, validators and provider adapters for T01–T05", async () => {
    const providerWitnesses: ProviderCallWitness[] = [];
    const browserTransport = installRuntimeReplayTransport(providerWitnesses);
    renderWorkspace();

    await submit(T01);
    const firstReview = await screen.findByTestId("functional-contribution-review");
    expect(currentSession().project).toBeNull();
    expect(currentSession().retainedContributionCandidates?.[0]).toMatchObject({
      downstreamState: "PRESENTED",
      humanDecision: null,
    });
    expect(providerWitnesses.map((item) => item.endpoint)).toEqual([
      "https://api.openai.com/v1/responses",
    ]);

    await clickAndFlush(within(firstReview).getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(currentSession().project?.revision).toBe(1));
    await waitForPostAdoptionContinuation();
    await waitForComposerReady();

    await submit(T02);
    await waitFor(() => expect(currentSession().retainedContributionCandidates).toHaveLength(2));
    const correctionReview = screen.getAllByTestId("functional-contribution-review").at(-1)!;
    expect(correctionReview).toHaveTextContent(NORMALIZED_ENDPOINT);
    const howResponse = await (await browserTransport.mock.results.at(-1)!.value).json();
    expect(howResponse.governedRealization).toMatchObject({ providerReplyAccepted: true, conformance: { structuralStatus: "PASS" } });
    expect(currentSession().runtimeTurns.at(-1)?.content).toBe(howResponse.assistantReply);
    const effectiveExtraction = providerWitnesses.filter((item) => item.endpoint === "https://api.openai.com/v1/responses").at(-1)!;
    const missingProjectBody = { ...(effectiveExtraction.requestBody as Record<string, unknown>) };
    missingProjectBody.input = String(missingProjectBody.input).replace(/RESEARCH PROJECT ADOPTÉ \(lecture seule\) :\n[\s\S]*$/u,
      "RESEARCH PROJECT ADOPTÉ (lecture seule) :\nnull");
    await expect(createLongHorizonProviderReplay([])(effectiveExtraction.endpoint, {
      method: "POST", body: JSON.stringify(missingProjectBody),
    })).rejects.toThrow("CURRENT_PROJECT_CONTEXT_MISSING_OR_UNEXPECTED");
    await expect(createLongHorizonProviderReplay([])(effectiveExtraction.endpoint, {
      method: "POST", body: JSON.stringify({ ...effectiveExtraction.requestBody as Record<string, unknown>, input: "" }),
    })).rejects.toThrow("REQUIRED_PROVIDER_CONTEXT_MISSING");
    expect(providerWitnesses.every((item) => item.requestDigest && item.provenance === "SYNTHETIC_CONTRACT_FIXTURE")).toBe(true);
    expect(currentSession().project?.revision).toBe(1);
    expect(providerWitnesses.map((item) => item.endpoint)).toEqual([
      "https://api.openai.com/v1/responses",
      "https://api.openai.com/v1/responses",
      expect.stringMatching(/^https:\/\/generativelanguage\.googleapis\.com\//),
    ]);

    await submit(T03);
    await waitFor(() => expect(currentSession().runtimeTurns.some((turn) => turn.role === "USER" && turn.content === T03)).toBe(true));

    // This is the historical runtime boundary under test: a natural approval
    // must confirm the currently presented candidate, not merely acknowledge it.
    const afterNaturalConfirmation = currentSession();
    expect(afterNaturalConfirmation.project?.revision).toBe(2);
    expect(afterNaturalConfirmation.project?.confirmationDecision.reason).toBe(
      "L’utilisateur a explicitement confirmé la candidate courante dans son message.",
    );
    const naturalDecisionTurn = afterNaturalConfirmation.runtimeTurns.find((turn) => turn.role === "USER" && turn.content === T03);
    expect(afterNaturalConfirmation.project?.confirmationDecision.provenance).toContain(naturalDecisionTurn?.turnId);
    expect(afterNaturalConfirmation.project?.canonicalState?.objects.some((item) => item.actuality === "CURRENT"
      && item.scientificRole === "PRIMARY_ENDPOINT" && item.content === NORMALIZED_ENDPOINT)).toBe(true);
    await waitForPostAdoptionContinuation();
    await waitForComposerReady();
    expect(browserTransport).toHaveBeenCalledTimes(2);

    await submit(T04);
    await waitFor(() => expect(currentSession().runtimeTurns.some((turn) => turn.role === "USER" && turn.content === T04)).toBe(true));
    await waitFor(() => expect(currentSession().retainedContributionCandidates).toHaveLength(3));
    const populationReview = screen.getAllByTestId("functional-contribution-review").at(-1)!;
    expect(populationReview).toHaveTextContent(/primo-infarctus/iu);
    expect(populationReview).toHaveTextContent(/35 ans/iu);
    expect(populationReview).toHaveTextContent(/85 ans/iu);
    expect(populationReview).toHaveTextContent(/populations sensibles ou vulnérables/iu);
    expect(currentSession().project?.revision).toBe(2);
    expect(providerWitnesses.map((item) => item.endpoint)).toEqual([
      "https://api.openai.com/v1/responses",
      "https://api.openai.com/v1/responses",
      expect.stringMatching(/^https:\/\/generativelanguage\.googleapis\.com\//),
      "https://api.openai.com/v1/responses",
      expect.stringMatching(/^https:\/\/generativelanguage\.googleapis\.com\//),
    ]);

    await clickAndFlush(within(populationReview).getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(currentSession().project?.revision).toBe(3));
    await waitForPostAdoptionContinuation();
    await waitForComposerReady();
    const callsBeforeProposal = browserTransport.mock.calls.length;
    const turnsBeforeProposal = currentSession().runtimeTurns.length;
    await submit(T05);
    await waitFor(() => expect(currentSession().runtimeTurns.some((turn) => turn.role === "USER" && turn.content === T05)).toBe(true));
    await waitFor(() => assertScientificResponse(currentSession(), currentSession().runtimeTurns.slice(turnsBeforeProposal)
      .filter((turn) => turn.role === "NOXIA").map((turn) => turn.content).join("\n")));
    expect(browserTransport).toHaveBeenCalledTimes(callsBeforeProposal);
    expect(currentSession().entries.some((entry) => entry.kind === "ERROR")).toBe(false);
  });

  it("preserves the adopted Project when a natural-language decision refuses the current candidate", async () => {
    const providerWitnesses: ProviderCallWitness[] = [];
    const browserTransport = installRuntimeReplayTransport(providerWitnesses);
    renderWorkspace();

    await submit(T01);
    const initialReview = await screen.findByTestId("functional-contribution-review");
    await clickAndFlush(within(initialReview).getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(currentSession().project?.revision).toBe(1));
    await waitForPostAdoptionContinuation();
    await waitForComposerReady();
    const adoptedDigest = currentSession().project?.projectDigest;

    await submit(T02);
    await waitFor(() => expect(currentSession().retainedContributionCandidates).toHaveLength(2));
    await submit("je refuse");
    await waitFor(() => expect(currentSession().retainedContributionCandidates?.at(-1)?.humanDecision?.status).toBe("REJECTED"));

    expect(currentSession().project).toMatchObject({ revision: 1, projectDigest: adoptedDigest });
    expect(currentSession().project?.canonicalState?.objects.some((item) => item.actuality === "CURRENT"
      && item.content === NORMALIZED_ENDPOINT)).toBe(false);
    expect(browserTransport).toHaveBeenCalledTimes(2);
  });

  it("fails closed on a structurally invalid bridge response without creating a Project", async () => {
    const browserTransport = vi.fn(async () => deterministicResponse({ apiVersion: "1.0", assistantReply: "incomplete" }));
    vi.stubGlobal("fetch", browserTransport);
    renderWorkspace();

    await submit(T01);
    await waitFor(() => expect(currentSession().entries.some((entry) => entry.kind === "ERROR")).toBe(true));

    expect(currentSession().project).toBeNull();
    expect(currentSession().retainedContributionCandidates).toHaveLength(0);
    expect(currentSession().entries.filter((entry) => entry.kind === "ERROR").at(-1)).toMatchObject({
      content: "Réponse conversationnelle invalide.",
    });
    expect(browserTransport).toHaveBeenCalledTimes(1);
  });

  it("keeps human review reachable through the real handler when HOW returns 503", async () => {
    const witnesses: ProviderCallWitness[] = [];
    const browserTransport = installRuntimeReplayTransport(witnesses, { how: "UNAVAILABLE" });
    renderWorkspace();
    await submit(T01);
    const review = await screen.findByTestId("functional-contribution-review");
    await clickAndFlush(within(review).getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitForPostAdoptionContinuation();
    await waitForComposerReady();
    const before = currentSession();
    await submit(T02);
    await waitFor(() => expect(currentSession().retainedContributionCandidates).toHaveLength(2));
    const response = await (await browserTransport.mock.results.at(-1)!.value).json();
    expect(response.conversationFailure).toMatchObject({ stage: "HOW", code: "CONVERSATION_PROVIDER_FAILURE" });
    expect(witnesses.some((item) => item.endpoint.includes("googleapis") && item.responseStatus === 503)).toBe(true);
    expect(currentSession().project).toEqual(before.project);
    expect(currentSession().retainedContributionCandidates?.at(-1)).toMatchObject({ humanDecision: null, downstreamState: "PRESENTED" });
  });

  it("replays the IDM/IRM family for 15 meaningful Standard turns from turn 1", async () => {
    const { session, browserTransport } = await runSoak(FAMILY_A_TURNS);
    const state = ensureCanonicalProjectState(session.project!);
    const currentContent = state.objects.filter((item) => item.actuality === "CURRENT").map((item) => item.content);

    expect(session.project?.revision).toBe(4);
    expect(productBridgeRequestCount(browserTransport)).toBe(FAMILY_A_TURNS.filter((turn) => turn.outcome === "CANDIDATE").length);
    expect(currentContent).toEqual(expect.arrayContaining([
      expect.stringMatching(/Âge minimal : 35 ans/iu),
      expect.stringMatching(/Âge maximal : 85 ans/iu),
      expect.stringMatching(/populations sensibles ou vulnérables/iu),
      expect.stringMatching(/suivi clinique à 12 mois/iu),
    ]));
    expect(currentContent.some((content) => /suivi clinique à 6 mois/iu.test(content))).toBe(false);
    expect(currentContent.some((content) => /analyse exploratoire selon le territoire/iu.test(content))).toBe(false);
    expect(state.objects.filter((item) => item.actuality === "CURRENT" && /^pacemaker$/iu.test(item.content))).toHaveLength(0);
    for (const item of currentContent.filter((content) => /pacemaker/iu.test(content))) {
      expect(item).toMatch(/(?:contre.indication|exemple)/iu);
    }
    for (const pattern of [/signification de précoce et tardif/iu, /infarctus silencieux/iu]) {
      const unknown = state.objects.find((item) => item.actuality === "CURRENT" && pattern.test(item.content));
      expect(unknown, `Unresolved epistemic state: ${pattern}`).toMatchObject({ epistemicState: "UNKNOWN" });
    }
    expect(session.queryNavigation).toMatchObject({
      projectRef: session.project?.projectId,
      projectVersion: session.project?.versionId,
      projectDigest: session.project?.projectDigest,
    });
    expect(session.queryNavigation?.standardQuestion?.text ?? "").not.toMatch(/inclusion.*exclusion|exclusion.*inclusion/iu);
  }, 20_000);

  it("replays a non-imaging clinical family for 15 meaningful Standard turns from turn 1", async () => {
    const { session, browserTransport } = await runSoak(FAMILY_B_TURNS);
    const state = ensureCanonicalProjectState(session.project!);
    const currentContent = state.objects.filter((item) => item.actuality === "CURRENT").map((item) => item.content);

    expect(session.project?.revision).toBe(3);
    expect(productBridgeRequestCount(browserTransport)).toBe(FAMILY_B_TURNS.filter((turn) => turn.outcome === "CANDIDATE").length);
    expect(currentContent).toEqual(expect.arrayContaining([
      "Suivi à 24 semaines",
      "Hypoglycémies sévères",
      expect.stringMatching(/multicentrique/iu),
    ]));
    expect(currentContent).not.toContain("Suivi à 36 semaines");
    expect(currentContent.some((content) => /analyse exploratoire selon l'ancienneté/iu.test(content))).toBe(false);
    expect(state.objects.find((item) => item.actuality === "CURRENT" && /quatre centres/iu.test(item.content)))
      .toMatchObject({ epistemicState: "UNKNOWN" });
    expect(session.queryNavigation?.projectVersion).toBe(session.project?.versionId);
  }, 20_000);

  it("replays a non-medical experimental family for 15 meaningful Standard turns from turn 1", async () => {
    const { session, browserTransport } = await runSoak(FAMILY_C_TURNS);
    const state = ensureCanonicalProjectState(session.project!);
    const currentContent = state.objects.filter((item) => item.actuality === "CURRENT").map((item) => item.content);

    expect(session.project?.revision).toBe(3);
    expect(productBridgeRequestCount(browserTransport)).toBe(FAMILY_C_TURNS.filter((turn) => turn.outcome === "CANDIDATE").length);
    expect(currentContent).toEqual(expect.arrayContaining([
      expect.stringMatching(/vieillissement humide de 40 cycles/iu),
      expect.stringMatching(/lecture en aveugle des ruptures par deux opérateurs/iu),
    ]));
    expect(currentContent.some((content) => /60 cycles/iu.test(content))).toBe(false);
    expect(currentContent.some((content) => /rugosité de surface/iu.test(content))).toBe(false);
    expect(session.queryNavigation?.projectDigest).toBe(session.project?.projectDigest);
    expect(session.entries.filter((entry) => entry.kind === "TEXT").map((entry) => entry.content).join(" "))
      .not.toMatch(/ownerResult|candidateRef|QUERY_NAVIGATION|CONTROLLED_VULNERABLE_POPULATION_SET/u);
  }, 20_000);
});
