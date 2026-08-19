import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProtocolDesignerErrorBoundary from "@/features/protocol-designer/ProtocolDesignerErrorBoundary";
import {
  executeKnowledgeEngineForPresentation,
  prepareScientificObjectTerms,
  SCIENTIFIC_OBJECT_ORIGINAL_TERM_MAX_LENGTH,
} from "@/features/knowledge-engine";
import { HybridScientificInterpretationRuntimeAdapter } from "@/features/scientific-interpretation/hybrid-adapter";
import { ScientificInterpretationTechnicalError } from "@/features/scientific-interpretation/contracts";
import { createEmptyInterpretation } from "@/features/protocol-designer/intake/schema";
import {
  buildValidatedIntent,
  createProtocolDesignerSession,
  loadProtocolDesignerOwnerSessionV2,
  PROTOCOL_DESIGNER_OWNER_SESSION_KEY_V2,
} from "@/features/protocol-designer/intake/session";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";

const NOW = "2026-08-15T12:00:00.000Z";
const EXACT_PRODUCTION_TEXT = "Je souhaite étudier l'effet de la colchicine dans l'infarctus du myocarde, étudier les marqueurs de l'inflammation et quantifier les lésions à l'IRM et en biologie, chez deux populations médicaments vs placebo, dans une étude multicentrique créée de toutes pièces.";
const textOfLength = (length: number) => "x".repeat(length);

const persistedProductionSession = () => {
  const interpretation = createEmptyInterpretation({ question: EXACT_PRODUCTION_TEXT, language: "fr", schemaVersion: "1.0" });
  interpretation.reformulatedQuestion = EXACT_PRODUCTION_TEXT;
  const session = createProtocolDesignerSession(NOW);
  session.currentStep = 3;
  session.originalQuestion = EXACT_PRODUCTION_TEXT;
  session.validatedIntent = buildValidatedIntent(interpretation, {}, EXACT_PRODUCTION_TEXT, NOW);
  session.scientificContext = {
    ...session.scientificContext,
    routeIntent: "UNDERSTAND",
    centralScientificObject: "infarctus du myocarde",
    preservedScientificTerms: ["colchicine", "infarctus du myocarde", "placebo", EXACT_PRODUCTION_TEXT],
    contextVersion: 2,
  };
  return session;
};

const renderProductionSession = () => {
  window.localStorage.setItem(PROTOCOL_DESIGNER_OWNER_SESSION_KEY_V2, JSON.stringify(persistedProductionSession()));
  return render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
};

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("CONV-UX-V2-01C — schema boundary hardening", () => {
  it("CONV-V2C-C01 exact production payload cannot crash ProtocolDesignerDemo render", async () => {
    expect(() => renderProductionSession()).not.toThrow();
    expect(await screen.findByText(/Décris-moi le projet de recherche/)).toBeInTheDocument();
  });

  it("CONV-V2C-C02 runtime-derived schema validation never throws uncaught from React render", () => {
    expect(() => executeKnowledgeEngineForPresentation({
      originalQuestion: EXACT_PRODUCTION_TEXT,
      scientificObjectTerms: ["colchicine", "infarctus", "placebo", textOfLength(201)].map((term) => ({ term })),
      createdAt: NOW,
    })).not.toThrow();
  });

  it("CONV-V2C-C03 invalid scientificObject produces a controlled diagnostic, not a blank page", () => {
    const outcome = executeKnowledgeEngineForPresentation({
      originalQuestion: EXACT_PRODUCTION_TEXT,
      scientificObjectTerms: ["colchicine", "infarctus", "placebo", textOfLength(201)].map((term) => ({ term })),
      createdAt: NOW,
      payloadRef: "contribution:production",
    });
    expect(outcome.status).toBe("PARTIAL");
    expect(outcome.result).not.toBeNull();
    expect(outcome.diagnostics).toContainEqual(expect.objectContaining({
      code: "SCIENTIFIC_OBJECT_ORIGINAL_TERM_TOO_LONG",
      path: ["scientificObjects", 3, "originalTerm"],
      owner: "KNOWLEDGE",
      payloadRef: "contribution:production",
    }));
  });

  it("CONV-V2C-C04 raw user text is preserved when a structured scientificObject is invalid", () => {
    const invalid = textOfLength(201);
    const outcome = executeKnowledgeEngineForPresentation({ originalQuestion: EXACT_PRODUCTION_TEXT, scientificObjectTerms: [{ term: invalid }], createdAt: NOW });
    expect(outcome.preservedRawUserText).toBe(EXACT_PRODUCTION_TEXT);
    expect(outcome.diagnostics[0]?.originalValue).toBe(invalid);
  });

  it("CONV-V2C-C05 no silent truncation is used to satisfy originalTerm constraints", () => {
    const source = [
      readFileSync(resolve(process.cwd(), "src/features/knowledge-engine/scientific-object-boundary.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "src/features/knowledge-engine/presentation.ts"), "utf8"),
    ].join("\n");
    expect(source).not.toMatch(/\.slice\(\s*0\s*,\s*200|substring\(\s*0\s*,\s*200/);
  });

  it("CONV-V2C-C06 originalTerm semantics match the authoritative atomic source-term contract", () => {
    expect(SCIENTIFIC_OBJECT_ORIGINAL_TERM_MAX_LENGTH).toBe(200);
    const boundary = prepareScientificObjectTerms({
      originalQuestion: `La colchicine est étudiée. ${textOfLength(201)}`,
      candidates: [{ term: textOfLength(201), sourceText: "colchicine", sourceRef: "turn:one" }],
    });
    expect(boundary.accepted).toEqual([{ term: "colchicine", role: "UNKNOWN" }]);
    expect(boundary.diagnostics).toEqual([]);
    expect(prepareScientificObjectTerms({ originalQuestion: textOfLength(201), candidates: [{ term: textOfLength(201) }] }).diagnostics).toHaveLength(1);
  });

  it("CONV-V2C-C07 provider/runtime invalid structured output is distinguished from provider failure", async () => {
    const rawStore = {
      persistAtomically: vi.fn(async ({ payload }: { operationId: string; payload: unknown }) => ({ rawOutputRef: "raw:one", rawOutputDigest: "digest:one", persistedAt: NOW, payload })),
      read: vi.fn(async () => null),
    };
    const conversation = { conversationId: "conversation:one", language: "fr" as const, turns: [{ turnId: "turn:one", role: "USER" as const, content: EXACT_PRODUCTION_TEXT }] };
    const providerFailure = new HybridScientificInterpretationRuntimeAdapter("HYBRID", "1", async () => { throw new Error("offline"); }, rawStore, () => ({}));
    const schemaFailure = new HybridScientificInterpretationRuntimeAdapter("HYBRID", "1", async () => ({ operationId: "operation:one", provider: "fixture", model: "fixture", promptDigest: null, schemaDigest: null, configurationDigest: null, runtimeId: "HYBRID", runtimeVersion: "1", rawOutput: {} }), rawStore, () => { throw new Error("invalid structured contract"); });
    await expect(providerFailure.interpret(conversation)).rejects.toMatchObject({ failureClass: "PROVIDER_FAILURE" });
    await expect(schemaFailure.interpret(conversation)).rejects.toMatchObject({ failureClass: "STRUCTURED_CONTRACT_FAILURE" });
  });

  it("CONV-V2C-C08 persisted invalid data cannot create a reload crash loop", async () => {
    const serialized = JSON.stringify(persistedProductionSession());
    const storage = new Map([[PROTOCOL_DESIGNER_OWNER_SESSION_KEY_V2, serialized]]);
    const adapter = { getItem: (key: string) => storage.get(key) ?? null, removeItem: (key: string) => storage.delete(key) };
    expect(loadProtocolDesignerOwnerSessionV2(adapter)?.scientificContext.preservedScientificTerms[3]).toHaveLength(264);
    expect(storage.get(PROTOCOL_DESIGNER_OWNER_SESSION_KEY_V2)).toBe(serialized);
    renderProductionSession();
    await screen.findByText(/Décris-moi le projet de recherche/);
    expect(window.localStorage.getItem(PROTOCOL_DESIGNER_OWNER_SESSION_KEY_V2)).not.toBeNull();
  });

  it("CONV-V2C-C09 Protocol Designer/app shell remains visible after projection failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const Throw = () => { throw new Error("projection failed"); };
    render(<div><span>NOXIA shell</span><ProtocolDesignerErrorBoundary><Throw /></ProtocolDesignerErrorBoundary></div>);
    expect(screen.getByText("NOXIA shell")).toBeInTheDocument();
    expect(await screen.findByText("L’espace Protocol Designer a rencontré une erreur d’affichage.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Réessayer l’affichage" })).toBeInTheDocument();
  });

  it("CONV-V2C-C10 error recovery creates neither Project truth nor a new scientific owner", () => {
    const outcome = executeKnowledgeEngineForPresentation({ originalQuestion: EXACT_PRODUCTION_TEXT, scientificObjectTerms: [{ term: textOfLength(201) }], createdAt: NOW });
    expect(outcome.diagnostics[0]).toMatchObject({ owner: "KNOWLEDGE", projectWriteAuthorized: false, recoverable: true });
    expect(JSON.stringify(outcome)).not.toMatch(/PROJECT_ADOPTED|projectWriteAuthorized":true/);
  });

  it("CONV-V2C-C11 CONV-V2B route-intent behavior remains PASS", () => {
    const source = readFileSync(resolve(process.cwd(), "src/features/protocol-designer/conversation/__tests__/conv-ux-v2-part1b.test.tsx"), "utf8");
    expect(source).toContain("CONV-V2B-C10 progresses the exact colchicine scenario past route intent");
  });

  it("CONV-V2C-C12 MRI/biology separation remains PASS", () => {
    const source = readFileSync(resolve(process.cwd(), "src/features/protocol-designer/conversation/__tests__/conv-ux-v2-part1b.test.tsx"), "utf8");
    expect(source).toContain("CONV-V2B-C07 never classifies a hybrid generic method or biological measurement as imaging");
  });

  it("CONV-V2C-C13 single submit still produces one raw conversation turn", () => {
    const source = readFileSync(resolve(process.cwd(), "src/features/scientific-interpretation/ScientificInterpretationWorkspace.tsx"), "utf8");
    expect(source.match(/const userMessage = createScientificInterpretationMessage\("USER",\s*content\)/g)).toHaveLength(1);
  });

  it("CONV-V2C-C14 no scientific content is silently discarded to recover the UI", async () => {
    const invalid = textOfLength(201);
    const outcome = executeKnowledgeEngineForPresentation({ originalQuestion: EXACT_PRODUCTION_TEXT, scientificObjectTerms: [{ term: invalid }], createdAt: NOW });
    expect(outcome.diagnostics[0]?.originalValue).toBe(invalid);
    expect(outcome.preservedRawUserText).toBe(EXACT_PRODUCTION_TEXT);
    expect(outcome.result?.request.originalQuestion).toBe(EXACT_PRODUCTION_TEXT);
  });

  it.each([199, 200])("accepts an atomic originalTerm at length %i", (length) => {
    const result = prepareScientificObjectTerms({ originalQuestion: textOfLength(length), candidates: [{ term: textOfLength(length) }] });
    expect(result.accepted[0]?.term).toHaveLength(length);
    expect(result.diagnostics).toEqual([]);
  });

  it("rejects and diagnoses an atomic originalTerm at length 201", () => {
    const result = prepareScientificObjectTerms({ originalQuestion: textOfLength(201), candidates: [{ term: textOfLength(201) }] });
    expect(result.accepted).toEqual([]);
    expect(result.diagnostics[0]).toMatchObject({ code: "SCIENTIFIC_OBJECT_ORIGINAL_TERM_TOO_LONG", receivedLength: 201 });
  });

  it("diagnoses the same 201-character boundary violation for a Knowledge relation without truncation", () => {
    const relation = textOfLength(201);
    const outcome = executeKnowledgeEngineForPresentation({ originalQuestion: EXACT_PRODUCTION_TEXT, scientificObjectTerms: [{ term: "colchicine" }], relations: [relation], createdAt: NOW });
    expect(outcome.status).toBe("PARTIAL");
    expect(outcome.result).not.toBeNull();
    expect(outcome.diagnostics[0]).toMatchObject({ code: "KNOWLEDGE_RELATION_TOO_LONG", path: ["relations", 0], originalValue: relation });
  });
});
