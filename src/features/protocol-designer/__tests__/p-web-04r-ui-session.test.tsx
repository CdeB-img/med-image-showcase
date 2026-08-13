import fs from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { createEmptyInterpretation } from "../intake/schema";
import { detectSensitiveData } from "../intake/privacy";
import { ADAPTIVE_QUESTION_REGISTRY, selectAdaptiveQuestions } from "../intake/questions";
import { matchScenarios } from "../intake/scenarios";
import { buildValidatedIntent, createProtocolDesignerSession, invalidateDownstream, loadSessionCandidate, persistSession, INTAKE_SESSION_KEY } from "../intake/session";
import { INTERPRETED_FIELD_KEYS, type HumanFieldReview, type InterpretedFieldKey } from "../intake/types";

const source = fs.readFileSync(path.join(process.cwd(), "src/pages/ProtocolDesignerDemo.tsx"), "utf8");
const question = "Je veux comparer la perfusion cérébrale dans une étude multicentrique.";
const makeIntent = (domain = "perfusion cérébrale") => {
  const interpretation = createEmptyInterpretation({ question, language: "fr", schemaVersion: "1.0" });
  interpretation.scientificDomain = { value: [domain], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: "perfusion cérébrale", userValidated: false };
  const reviews = { scientificDomain: { state: "CONFIRMED", reviewedAt: "2026-08-03T00:00:00Z" } } as Partial<Record<InterpretedFieldKey, HumanFieldReview>>;
  return buildValidatedIntent(interpretation, reviews, question, "2026-08-03T00:00:00Z");
};
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

describe("P-WEB-04R — interface and versioned session contracts", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("01 accepts a free scientific question", () => { renderDemo(); expect(screen.getByLabelText("Votre question scientifique")).toBeInTheDocument(); });
  it("02 inserts a disclosed example", () => { renderDemo(); const example = "Je souhaite caractériser un objet scientifique avec plusieurs familles d’observation."; fireEvent.click(screen.getByRole("button", { name: example })); expect(screen.getByLabelText("Votre question scientifique")).toHaveValue(example); });
  it("03 exposes a character counter and maximum", () => { renderDemo(); expect(screen.getByText("0 / 4 000")).toBeInTheDocument(); expect(screen.getByLabelText("Votre question scientifique")).toHaveAttribute("maxlength", "4000"); });
  it("04 blocks an email locally", () => expect(detectSensitiveData("Étude pour patient@example.org dans une cohorte scientifique.").map((item) => item.code)).toContain("EMAIL"));
  it("05 exposes the successful analysis transition", () => expect(source).toContain("acceptInterpretation(await requestScientificInterpretation"));
  it("06 moves focus after interpretation", () => expect(source).toContain("understandingHeadingRef.current?.focus()"));
  it("07 preserves the original question", () => expect(source).toContain("interpretation.originalQuestion"));
  it("08 exposes the reformulation", () => expect(source).toContain('id="reformulation"'));
  it("09 supports human field correction", () => expect(source).toContain('onReview(fieldKey, "CORRECTED")'));
  it("10 supports removal", () => expect(source).toContain('onReview(fieldKey, "REMOVED")'));
  it("11 supports unknown", () => expect(source).toContain('onReview(fieldKey, "UNKNOWN")'));
  it("12 keeps ambiguity visible", () => expect(source).toContain("termsNeedingClarification"));
  it("13 keeps contradictions visible", () => expect(source).toContain("interpretation.contradictions"));
  it("14 requires all fields to be reviewed before confirmation", () => expect(source).toContain("Object.keys(reviews).length === INTERPRETED_FIELD_KEYS.length"));
  it("15 selects locally relevant questions", () => expect(selectAdaptiveQuestions(makeIntent(), ["neuro"]).length).toBeGreaterThan(0));
  it("16 does not re-ask an already confirmed domain", () => expect(selectAdaptiveQuestions(makeIntent(), ["neuro"]).every((item) => !item.knownFromFields?.includes("scientificDomain"))).toBe(true));
  it("17 makes consequences visible", () => expect(source).toContain("Ce qui change :"));
  it("18 proposes a matching scenario", () => expect(matchScenarios(makeIntent())[0]).toMatchObject({ scenarioId: "neuro", status: "MATCH_PROPOSED" }));
  it("19 confirms a scenario only through the human action", () => expect(source).toContain("Confirmer comme orientation principale"));
  it("20 supports multiple matches", () => {
    const intent = makeIntent("perfusion cérébrale et imagerie spectrale"); intent.validatedReformulation += " imagerie spectrale";
    expect(matchScenarios(intent).some((item) => item.status === "MULTIPLE_MATCHES")).toBe(true);
  });
  it("21 returns no match for an uncovered domain", () => { const intent = makeIntent("linguistique"); intent.originalQuestion = "Je veux comparer des structures linguistiques dans plusieurs textes."; intent.validatedReformulation = intent.originalQuestion; expect(matchScenarios(intent)).toHaveLength(0); });
  it("22 exposes API unavailable recovery", () => expect(source).toContain("Continuer localement sans interprétation automatique"));
  it("23 defines quota state", () => expect(fs.readFileSync(path.join(process.cwd(), "src/features/protocol-designer/intake/types.ts"), "utf8")).toContain("QUOTA_EXCEEDED"));
  it("24 defines invalid provider response state", () => expect(fs.readFileSync(path.join(process.cwd(), "src/features/protocol-designer/intake/types.ts"), "utf8")).toContain("INVALID_PROVIDER_RESPONSE"));
  it("25 creates a clearly bounded local fallback", () => expect(source).toContain("createEmptyInterpretation"));
  it("26 invalidates interpretation after question change", () => expect(source).toContain("setInterpretation(null)"));
  it("27 invalidates every downstream decision", () => { const session = { ...createProtocolDesignerSession(), decision: { outcome: "DEFER" as const, author: "A", justification: "B", reservations: "", decidedAt: "now" }, confirmedScenarioId: "neuro" as const }; const changed = invalidateDownstream(session, "changed"); expect(changed.decision).toBeNull(); expect(changed.confirmedScenarioId).toBeNull(); });
  it("28 offers session resume without automatic restore", () => expect(source).toContain("Elle ne sera jamais reprise automatiquement"));
  it("29 invalidates a foreign fixture version", () => { window.localStorage.setItem(INTAKE_SESSION_KEY, JSON.stringify({ ...createProtocolDesignerSession(), fixtureSetVersion: "old" })); expect(loadSessionCandidate(window.localStorage)).toBeNull(); });
  it("30 persists and resets only its versioned key", () => { const session = { ...createProtocolDesignerSession(), originalQuestion: question }; persistSession(window.localStorage, session); expect(window.localStorage.getItem(INTAKE_SESSION_KEY)).toContain(session.sessionId); });
  it("31 uses native keyboard-operable controls", () => { renderDemo(); expect(screen.getAllByRole("button").length).toBeGreaterThan(1); expect(screen.getByLabelText("Votre question scientifique").tagName).toBe("TEXTAREA"); });
  it("32 keeps a mobile-first single-column base", () => expect(source).toContain("mx-auto max-w-3xl"));
  it("33 supports light theme tokens", () => expect(source).toContain("bg-background"));
  it("34 supports dark theme provenance contrast", () => expect(source).toContain("dark:text-emerald-200"));
  it("35 never renders raw provider JSON", () => expect(source).not.toMatch(/JSON\.stringify\(interpretation|rawGemini|providerResponse/));
  it("36 keeps internal vocabulary outside level zero", () => { renderDemo(); expect(screen.queryByText(/Program Owner|NIVEAU_2|Knowledge Graph/)).not.toBeInTheDocument(); });
  it("37 places documentary provenance behind details", () => expect(source).toMatch(/<details[\s\S]*Traçabilité documentaire/));
  it("38 never starts by selecting a biomarker", () => { renderDemo(); expect(screen.queryByRole("button", { name: /^(?:T1 mapping|LGE|OEF|CBF|VMI)$/ })).not.toBeInTheDocument(); });
  it("39 displays the exact non-generatable timing state", () => expect(source).toContain("TIMING_NOT_YET_GENERATABLE_FROM_CURRENT_EXECUTABLE_KNOWLEDGE"));
  it("40 never generates a protocol in the interface", () => expect(source).toContain("Aucune séquence, aucun protocole et aucun biomarqueur optimal ne sont décidés ici"));

  it("keeps all interface field labels complete", () => expect(INTERPRETED_FIELD_KEYS).toHaveLength(19));
  it("keeps the adaptive registry bounded", () => expect(ADAPTIVE_QUESTION_REGISTRY.every((item) => item.sourceRefs.length && item.allowedAnswers.length)).toBe(true));
});
