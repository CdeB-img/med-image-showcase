import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authorizeResearchProjectDocumentHandoff } from "@/features/research-project-construction";
import { adoptBehaviorContribution, behaviorAuthority, richStudyContribution } from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import { refreshFunctionalResetDocumentPortfolio } from "../functional-reset-boundary";
import { buildCanonicalCrfPackage, buildStudyDeliverablePortfolio } from "../study-deliverable-portfolio";
import { DRCI_DOCUMENT_KINDS, prepareDrciDraftPack, materializeDrciDraftPack, drciDraftPackFiles, projectDrciDraftPackPortfolio, isDrciDraftPackCurrent } from "../drci-draft-pack";
import StudyDeliverableWorkspace from "@/features/protocol-designer/functional-reset/StudyDeliverableWorkspace";
import ProtocolPreview from "@/features/protocol-designer/functional-reset/ProtocolPreview";
import { createProjectSession, readProjectSessions, saveProjectSession } from "@/features/protocol-designer/functional-reset/project-workspace-storage";
import { executeProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";
import { bridgeRequest } from "../../../../validation/protocol-designer-v1-contextual-scientific-reasoning-runtime-01/offline-fixtures";
import { completeDrciOperationalProjection, polishDrciEditorialText, prepareDrciGenerationBatches, prepareDrciDraftSource } from "../drci-draft-contract";
import { readRetainedDrciProtocolEvidence } from "../../../../server/protocol-designer-document-evidence";
import { executeOpenAIDrciDraft, executeOpenAITerraConversation } from "../../../../api/protocol-designer-openai-extraction-provider";
import { mkdtemp } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanaryCampaignPolicy, SINGLE_ATTEMPT_FAIL_CLOSED } from "../../../../server/protocol-designer-canary-policy";
import { createRecordedProtocolDesignerFetch, readCanaryState } from "../../../../server/protocol-designer-provider-replay";
import { executeKnowledgeEngine } from "@/features/knowledge-engine";
import { collectProjectKnowledgeSources, emptyProjectSourceLibrary } from "@/features/knowledge-engine/project-source-library";
import { documentEvidenceSections, validateDocumentEvidence } from "../scientific-document-revision";

const at = "2026-09-17T15:00:00.000Z";
const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
const handoffDecision = authorizeResearchProjectDocumentHandoff({ project, authority: behaviorAuthority, confirmedAt: at });
const projection = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision, requestedAt: at, generateProtocol: true }).projections.at(-1)!;
const source = { handoffDecision, protocolProjection: projection, crf: buildCanonicalCrfPackage(project) };
const packet = () => prepareDrciDraftPack(project, source);
const generated = () => ({ documents: DRCI_DOCUMENT_KINDS.map(kind => ({ kind, title: `LOCAL_SYNTHETIC ${kind}`,
  sections: [{ title: "Rationnel", paragraphs: [`${packet().sourceFacts[0].content} [[FACT:${packet().sourceFacts[0].ref}]] <script>test</script> ${kind === "PROTOCOL_SYNOPSIS" ? "Texte synthétique de qualification ".repeat(140) : ""}`.trim()], sourceRefs: [packet().sourceFacts[0].ref] }],
  missingElements: ["[À compléter : promoteur]"] })),
  crfRows: source.crf.fields.map((field, index) => ({ variableRef: field.canonicalVariableId, variableId: `FIELD_${index}`, label: field.label,
    visit: "Visite à préciser", condition: null, derivedFrom: [], analysisImpact: null, domain: "Visite à préciser", definition: field.label,
    entryType: "Texte", unit: field.unit, categories: null, dataOrigin: "UNSPECIFIED", source: "À définir", required: "À définir",
    derivation: null, controls: [], specificationStatus: "UNSPECIFIED" })) });
const pack = () => materializeDrciDraftPack(generated(), { project, packet: packet(), generatedAt: at });
const portfolio = () => buildStudyDeliverablePortfolio({ project, protocolProjection: projection, generatedAt: at });
afterEach(() => { vi.useRealTimers(); cleanup(); localStorage.clear(); });

describe("DRCI DOC/DM projections: source, review, stale and actual reading mechanics", () => {
  it("keeps the real historical evidence readable without rebuilding it in the new editorial style", () => {
    const historical = JSON.parse(readFileSync("validation/noxia-drci-release-closure-from-astra-01/DEMONSTRATOR_DOCUMENT_EVIDENCE.json", "utf8"));
    const before = JSON.stringify(historical);
    expect(historical.narrative.editorialVersion).toBeUndefined();
    expect(validateDocumentEvidence(historical)).toBe(true);
    expect(documentEvidenceSections(historical).length).toBe(2);
    expect(JSON.stringify(historical)).toBe(before);
    const retained = { ...pack(), editorialVersion: undefined };
    const renal = { ref: "historical-open", type: "UNCERTAINTY", content: "Critère rénal restant à définir", polarity: "AFFIRMED", epistemicState: "UNKNOWN" };
    expect(drciDraftPackFiles({ ...retained, sourceFacts: [...retained.sourceFacts, renal] })[0].markdown).toContain(renal.content);
  });
  it("persists qualified scientific evidence and renders its native claim citations and bibliography separately from Project facts", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "ECV myocardique et fibrose en IRM",
      scientificObjectTerms: [{ term: "ECV myocardique", role: "SUBJECT" }], context: {}, externalSearchPolicy: "INTERNAL_ONLY",
      researchProjectId: project.projectId, researchProjectVersion: project.versionId, researchProjectDigest: project.projectDigest, createdAt: at });
    const library = collectProjectKnowledgeSources(emptyProjectSourceLibrary(project.projectId), result);
    const sourced = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision, requestedAt: at, generateProtocol: true, knowledgeLibrary: library }).projections.at(-1)!;
    const enrichedPacket = prepareDrciDraftPack(project, { ...source, protocolProjection: sourced });
    const providerEvidence = JSON.parse(prepareDrciGenerationBatches(enrichedPacket)[0].context).AVAILABLE_EVIDENCE;
    expect(providerEvidence.claims.map((claim: { claim: string; limitationRefs: string[] }) => ({
      text: claim.claim, limitations: claim.limitationRefs.map(ref => providerEvidence.limitationNotes[ref]),
    }))).toEqual(sourced.evidenceContent!.paragraphs.map(paragraph => ({ text: paragraph.text, limitations: paragraph.limitations })));
    expect(JSON.stringify(providerEvidence).length).toBeLessThan(JSON.stringify(sourced.evidenceContent).length);
    const enriched = materializeDrciDraftPack(generated(), { project, packet: enrichedPacket, generatedAt: at });
    const restored = JSON.parse(JSON.stringify(enriched));
    expect(restored.evidenceContent.sources.length).toBeGreaterThan(0);
    expect(validateDocumentEvidence(restored.evidenceContent)).toBe(true);
    expect(isDrciDraftPackCurrent(restored, project)).toBe(true);
    const full = drciDraftPackFiles(restored).find(file => file.kind === "PROTOCOL_FULL")!;
    const native = documentEvidenceSections(restored.evidenceContent);
    for (const section of native) for (const block of section.blocks) for (const paragraph of block.items) expect(full.markdown).toContain(paragraph);
    expect(full.markdown).toContain("Fondements scientifiques documentés");
    expect(full.markdown).toContain("Références scientifiques");
    const changed = structuredClone(restored); changed.evidenceContent.libraryDigest = "different";
    expect(isDrciDraftPackCurrent(changed, project)).toBe(false);
    const wrongBinding = structuredClone(sourced); wrongBinding.evidenceContent!.narrative!.projectContext.sourceProjectVersion = "other-project-version";
    expect(() => prepareDrciDraftPack(project, { ...source, protocolProjection: wrongBinding })).toThrow();
    const decorative = structuredClone(sourced); decorative.evidenceContent!.paragraphs[0]!.sourceRefs = [];
    expect(() => prepareDrciDraftPack(project, { ...source, protocolProjection: decorative })).toThrow();
    expect(project.versionId).toBe(enriched.project.projectVersion);
  });
  it("renders admitted inline citations without adding a second rationale or decorative references", () => {
    const result = executeKnowledgeEngine({ originalQuestion: "ECV myocardique et fibrose en IRM",
      scientificObjectTerms: [{ term: "ECV myocardique", role: "SUBJECT" }], context: {}, externalSearchPolicy: "INTERNAL_ONLY",
      researchProjectId: project.projectId, researchProjectVersion: project.versionId, researchProjectDigest: project.projectDigest, createdAt: at });
    const library = collectProjectKnowledgeSources(emptyProjectSourceLibrary(project.projectId), result);
    const sourced = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision, requestedAt: at, generateProtocol: true, knowledgeLibrary: library }).projections.at(-1)!;
    const enrichedPacket = prepareDrciDraftPack(project, { ...source, protocolProjection: sourced });
    const sourceId = sourced.evidenceContent!.sources[0].source.sourceId;
    const data = generated(); data.documents[1].sections[0].paragraphs = [`Contexte rédigé [[CITE:${sourceId}]].`];
    const candidate = materializeDrciDraftPack(data, { project, packet: enrichedPacket, generatedAt: at });
    const file = drciDraftPackFiles(candidate).find(file => file.kind === "PROTOCOL_FULL")!;
    expect(file.markdown).not.toContain("Fondements scientifiques documentés");
    expect(file.markdown).not.toContain("[[CITE:");
    expect(file.markdown).toContain(sourced.evidenceContent!.sources[0].source.title);
    for (const unused of sourced.evidenceContent!.sources.slice(1)) expect(file.markdown).not.toContain(unused.source.title);
    const invalid = structuredClone(data); invalid.documents[1].sections[0].paragraphs = ["Claim [[CITE:unadmitted]]."];
    expect(() => materializeDrciDraftPack(invalid, { project, packet: enrichedPacket, generatedAt: at })).toThrow("DRCI_CITATION_REFERENCE_INVALID");
    const batch = prepareDrciGenerationBatches(enrichedPacket)[0];
    const decoded = batch.expand({ documents: [{ ...data.documents[1], sections: [{ title: "Contexte", sourceRefs: [], paragraphs: ["Claim [[CITE:s0]]."] }] }], crfRows: [] });
    expect(decoded.documents[0].sections[0].paragraphs[0]).toContain(`[[CITE:${sourceId}]]`);
    expect(() => batch.expand({ documents: [{ ...data.documents[1], sections: [{ title: "Contexte", sourceRefs: [], paragraphs: ["Claim [[CITE:s999]]."] }] }], crfRows: [] })).toThrow("DRCI_CITATION_REFERENCE_INVALID");
  });
  it.each([549, 751])("fails closed on a synopsis of %i words without shortening its scientific content", count => {
    const data = generated(); data.documents[0].sections[0].paragraphs = [Array(count).fill("scientifique").join(" ")];
    expect(() => materializeDrciDraftPack(data, { project, packet: packet(), generatedAt: at })).toThrow("DRCI_SYNOPSIS_WORD_BOUND_EXCEEDED");
  });
  it("makes the existing native DOC update action available for a current working projection", () => {
    const onRegenerate = vi.fn(); const original = JSON.stringify(projection);
    render(<ProtocolPreview projection={projection} stale={false} onClose={() => undefined} onRegenerate={onRegenerate} />);
    fireEvent.click(screen.getByRole("button", { name: "Actualiser les documents de travail" }));
    expect(onRegenerate).toHaveBeenCalledOnce(); expect(JSON.stringify(projection)).toBe(original);
  });
  it("accepts DOC responses beyond 120 seconds through the same native transport and assembles both scopes", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body)); const context = JSON.parse(payload.input);
      expect(payload).toMatchObject({ model: "gpt-5.6-terra", reasoning: { effort: "medium" }, max_output_tokens: 8000, store: false });
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 150_000);
        init!.signal!.addEventListener("abort", () => { clearTimeout(timer); reject(Object.assign(new Error("Aborted"), { name: "AbortError" })); }, { once: true });
      });
      const refs = new Map(packet().sourceFacts.map((f, i) => [f.ref, `f${i}`])); const data = generated();
      const batch = { binding: context.PACK_PREPARATION,
        documents: data.documents.filter(d => context.DOCUMENT_SCOPE.includes(d.kind)).map(d => ({ ...d, sections: d.sections.map(s => ({ ...s,
          sourceRefs: s.sourceRefs.map(ref => refs.get(ref)), paragraphs: s.paragraphs.map(p => p.replace(/\[\[FACT:([^\]]+)\]\]/gu, (_, ref) => `[[FACT:${refs.get(ref)}]]`)) })) })),
        crfRows: context.INCLUDE_CRF_ROWS ? data.crfRows.map(row => ({ ...row, variableRef: refs.get(row.variableRef) })) : [] };
      return new Response(JSON.stringify({ status: "completed", model: "gpt-5.6-terra", output_text: JSON.stringify(batch) }));
    });
    const run = executeOpenAIDrciDraft(packet(), "LOCAL_SYNTHETIC", fetchImpl).then(value => ({ value }), error => ({ error }));
    await vi.advanceTimersByTimeAsync(300_001);
    const result = await run;
    expect(result).not.toHaveProperty("error");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const actual = materializeDrciDraftPack((result as { value: Awaited<ReturnType<typeof executeOpenAIDrciDraft>> }).value.value,
      { project, packet: packet(), generatedAt: at });
    expect(actual.documents).toHaveLength(4); expect(actual.crfRows).toEqual(generated().crfRows);
    expect(actual.project).toEqual(pack().project);
  });
  it.each([{ stage: "DOC", deadline: 300_000 }, { stage: "CHAT", deadline: 120_000 }])(
    "aborts $stage once at its respective boundary without starting another scope", async ({ stage, deadline }) => {
      vi.useFakeTimers(); let nativeSignal: AbortSignal;
      const fetchImpl = vi.fn<typeof fetch>(async (_url, init) => new Promise<Response>((_resolve, reject) => {
        nativeSignal = init!.signal!;
        nativeSignal.addEventListener("abort", () => reject(Object.assign(new Error("Aborted"), { name: "AbortError" })), { once: true });
      }));
      const call = stage === "DOC" ? executeOpenAIDrciDraft(packet(), "LOCAL_SYNTHETIC", fetchImpl)
        : executeOpenAITerraConversation({ instruction: "LOCAL_SYNTHETIC", context: "LOCAL_SYNTHETIC" }, "LOCAL_SYNTHETIC", fetchImpl);
      const run = call.then(() => null, error => error);
      await vi.advanceTimersByTimeAsync(deadline - 1);
      expect(nativeSignal!.aborted).toBe(false); expect(fetchImpl).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(nativeSignal!.aborted).toBe(true); expect(await run).toMatchObject({ providerStatus: "TIMEOUT" });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });
  it("transports the native DOC plan without rendered duplicates while preserving the entire generation context", () => {
    const compactSource = prepareDrciDraftSource(source);
    expect(prepareDrciDraftPack(project, compactSource)).toEqual(packet());
    expect(JSON.stringify(compactSource).length).toBeLessThan(JSON.stringify(source).length);
    expect(compactSource.handoffDecision).toBe(source.handoffDecision);
    expect(compactSource.crf).toBe(source.crf);
    expect(compactSource.protocolProjection.source).toBe(source.protocolProjection.source);
    expect(project.versionId).toBe(pack().project.projectVersion);
    for (const batch of prepareDrciGenerationBatches(packet())) {
      const transported = JSON.parse(batch.context);
      const restored = transported.DOCUMENT_PLAN.map((s: { unknowns: string[]; limitations: string[]; contradictions: string[] }) => ({ ...s,
        unknowns: s.unknowns.map(n => transported.DOCUMENT_PLAN_NOTES[n]),
        limitations: s.limitations.map(n => transported.DOCUMENT_PLAN_NOTES[n]),
        contradictions: s.contradictions.map(n => transported.DOCUMENT_PLAN_NOTES[n]) }));
      expect(restored).toEqual(JSON.parse(packet().context).DOCUMENT_PLAN);
    }
  });
  it("factors repeated DOC notes losslessly without raising the HTTP guard and rejects missing note references", () => {
    const longNote = "Information institutionnelle inconnue et à confirmer. ".repeat(50);
    const repeated = { ...source, protocolProjection: { ...projection,
      sections: projection.sections.map(section => ({ ...section, limitations: [longNote, ...section.limitations] })) } };
    const before = JSON.stringify(repeated);
    const compact = prepareDrciDraftSource(repeated);
    const transported = JSON.parse(JSON.stringify(compact));
    expect(prepareDrciDraftPack(project, transported)).toEqual(prepareDrciDraftPack(project, repeated));
    expect(JSON.stringify(compact).length).toBeLessThan(before.length / 2);
    expect(prepareDrciDraftSource(compact)).toBe(compact);
    expect(JSON.stringify(repeated)).toBe(before);
    delete transported.documentPlanNotes[transported.protocolProjection.sections[0].limitations[0]];
    expect(() => prepareDrciDraftPack(project, transported)).toThrow("DRCI_DOCUMENT_PLAN_NOTE_INVALID");
  });
  it("assembles two bounded DOC outputs losslessly into one version-bound pack through the original provider transport", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async (_url, init) => {
      calls++;
      const payload = JSON.parse(String(init?.body)); const context = JSON.parse(payload.input);
      // Responses JSON mode checks the input itself, including token counting.
      if (!/\bjson\b/iu.test(payload.input)) throw new Error("Response input messages must contain the word 'json'");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      if (String(_url).endsWith("/input_tokens")) return new Response(JSON.stringify({ object: "response.input_tokens", input_tokens: 100 }));
      expect(payload.max_output_tokens).toBe(8000); expect(payload.reasoning.effort).toBe("medium");
      const refs = new Map(packet().sourceFacts.map((f, i) => [f.ref, `f${i}`]));
      const data = generated();
      const batch = { binding: context.PACK_PREPARATION,
        documents: data.documents.filter(d => context.DOCUMENT_SCOPE.includes(d.kind)).map(d => ({ ...d, sections: d.sections.map(s => ({ ...s,
          sourceRefs: s.sourceRefs.map(ref => refs.get(ref)), paragraphs: s.paragraphs.map(p => p.replace(/\[\[FACT:([^\]]+)\]\]/gu, (_, ref) => `[[FACT:${refs.get(ref)}]]`)) })) })),
        crfRows: context.INCLUDE_CRF_ROWS ? data.crfRows.map(row => ({ ...row, variableRef: refs.get(row.variableRef) })) : [] };
      return new Response(JSON.stringify({ status: "completed", model: "gpt-5.6-terra", output_text: JSON.stringify(batch), usage: { input_tokens: 100, output_tokens: 100 } }));
    };
    const campaignPolicy = createCanaryCampaignPolicy({ campaignId: "local-synthetic-doc-test", maxSessions: 1,
      measuredSoftStopUsd: 3, absoluteHardBoundUsd: 5, singleAttemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED,
      allowedProviderModels: ["gpt-5.6-terra"], createdAt: at,
      exactInputCounting: { maxInputTokens: 24000, maxGenerationAttempts: 2, maxTokenCountRequests: 2, maxProviderHttpRequests: 4 } });
    const root = join(await mkdtemp(join(tmpdir(), "noxia-doc-boundary-")), `canary-${campaignPolicy.campaignId}`);
    const denials: string[] = [];
    const recorded = createRecordedProtocolDesignerFetch({ root, campaignPolicy, canaryCampaignId: campaignPolicy.campaignId, fetchImpl,
      onCanaryDenied: code => denials.push(code) });
    const result = await executeOpenAIDrciDraft(packet(), "LOCAL_SYNTHETIC", recorded,
      { context: { sessionId: "LOCAL_SYNTHETIC", conversationId: "LOCAL_SYNTHETIC", turnId: "doc-test", clientRequestId: "same-handoff", testSessionId: null },
        purpose: "DOCUMENT_PROJECTION", reasoningEffort: "medium", retryIndex: 0, retryReason: null, onRecord: () => undefined })
      .finally(() => expect(denials).toEqual([]));
    const actual = materializeDrciDraftPack(result.value, { project, packet: packet(), generatedAt: at });
    expect(calls).toBe(4); expect(result.calls).toBe(2);
    expect(await readCanaryState(root, campaignPolicy.campaignId, campaignPolicy)).toMatchObject({ generationAttempts: 2, tokenCountRequests: 2, providerHttpRequests: 4 });
    expect(actual.documents).toEqual([generated().documents[1], generated().documents[0], generated().documents[2], generated().documents[3]]);
    expect(actual.crfRows).toEqual(generated().crfRows); expect(actual.project).toEqual(pack().project);
    expect(actual.projectWriteAuthorized).toBe(false);
  });
  it("rejects incoherent runtime binding before any DOC call", async () => {
    let calls = 0;
    await expect(executeOpenAIDrciDraft({ ...packet(), projectBinding: { ...packet().projectBinding, projectVersion: "different" } }, "LOCAL_SYNTHETIC", async () => {
      calls++; return new Response(JSON.stringify({ status: "completed", model: "gpt-5.6-terra", output_text: JSON.stringify({ binding: "different", documents: [generated().documents[1]], crfRows: [] }) }));
    })).rejects.toThrow("DRCI_RUNTIME_BINDING_MISMATCH");
    expect(calls).toBe(0);
    const batch = prepareDrciGenerationBatches(packet())[0];
    expect(() => batch.expand({ binding: JSON.parse(batch.context).PACK_PREPARATION, documents: [generated().documents[0]], crfRows: [] })).toThrow("SCOPE_MISMATCH");
  });
  it("recovers only empty section-level missingElements without losing protocol content", () => {
    const batch = prepareDrciGenerationBatches(packet())[0];
    const sections = Array.from({ length: 17 }, (_, index) => ({ title: `Section ${index + 1}`,
      paragraphs: [`Contenu ${index + 1}`], sourceRefs: [], missingElements: [] as string[] }));
    const value = { documents: [{ kind: "PROTOCOL_FULL", title: "Protocole", sections }], crfRows: [] };
    const actual = batch.expand(value);
    expect(actual.documents[0].missingElements).toEqual([]);
    expect(actual.documents[0].sections).toEqual(sections.map(({ missingElements: _empty, ...section }) => section));
    const canonicalSections = sections.map(({ missingElements: _empty, ...section }) => section);
    const canonical = { documents: [{ kind: "PROTOCOL_FULL", title: "Protocole", sections: canonicalSections,
      missingElements: [] }], crfRows: [] };
    expect(batch.expand(canonical).documents[0].sections).toEqual(canonicalSections);
    expect(batch.expand({ ...value, documents: [{ ...value.documents[0], missingElements: [] }] })
      .documents[0].sections).toEqual(canonicalSections);
    const nonempty = structuredClone(value);
    nonempty.documents[0].sections[0].missingElements = ["Arbitrage scientifique encore ouvert"];
    expect(() => batch.expand(nonempty)).toThrow();
    expect(() => batch.expand({ ...value, documents: [{ ...value.documents[0], sections: [
      canonicalSections[0], ...sections.slice(1),
    ] }] })).toThrow();
    expect(() => batch.expand({ ...value, documents: [{ ...value.documents[0], missingElements: ["Ouvert"] }] })).toThrow();
    expect(() => batch.expand({ ...value, documents: [{ ...value.documents[0], sections: [
      { ...sections[0], unexpected: "forbidden" }, ...sections.slice(1),
    ] }] })).toThrow();
  });
  it("bounds paragraphs by document kind without losing recruitment questions", () => {
    const [protocolBatch, companionBatch] = prepareDrciGenerationBatches(packet());
    const paragraphs = (count: number) => Array.from({ length: count }, (_, index) => `Question ${index + 1} : ____`);
    const document = (kind: "PROTOCOL_FULL" | "PROTOCOL_SYNOPSIS" | "CRF" | "RECRUITMENT", count: number) => ({
      kind, title: kind, sections: [{ title: "Section", paragraphs: paragraphs(count), sourceRefs: [] }], missingElements: [],
    });
    const companion = (recruitmentCount: number, synopsisCount = 1, crfCount = 1) => ({ documents: [
      document("PROTOCOL_SYNOPSIS", synopsisCount), document("CRF", crfCount), document("RECRUITMENT", recruitmentCount),
    ], crfRows: [] });
    for (const kind of ["PROTOCOL_FULL", "PROTOCOL_SYNOPSIS", "CRF"] as const) {
      if (kind === "PROTOCOL_FULL") expect(() => protocolBatch.expand({ documents: [document(kind, 13)], crfRows: [] })).toThrow();
      else expect(() => companionBatch.expand(companion(19, kind === "PROTOCOL_SYNOPSIS" ? 13 : 1,
        kind === "CRF" ? 13 : 1))).toThrow();
    }
    for (const count of [19, 30]) {
      const expanded = companionBatch.expand(companion(count));
      expect(expanded.documents.find(doc => doc.kind === "RECRUITMENT")!.sections[0].paragraphs).toEqual(paragraphs(count));
    }
    expect(() => companionBatch.expand(companion(31))).toThrow();
  });
  it("requests the higher output cap only for the Azure companion DOC scope", async () => {
    const caps: Record<"openai" | "azure", number[]> = { openai: [], azure: [] };
    for (const destination of ["openai", "azure"] as const) {
      const fetchImpl: typeof fetch = async (_url, init) => {
        const payload = JSON.parse(String(init?.body));
        const context = JSON.parse(payload.input);
        caps[destination].push(payload.max_output_tokens);
        const refs = new Map(packet().sourceFacts.map((fact, index) => [fact.ref, `f${index}`]));
        const data = generated();
        const value = { documents: data.documents.filter(doc => context.DOCUMENT_SCOPE.includes(doc.kind)).map(doc => ({
          ...doc, sections: doc.sections.map(section => ({ ...section,
            sourceRefs: section.sourceRefs.map(ref => refs.get(ref)),
            paragraphs: section.paragraphs.map(paragraph => paragraph.replace(/\[\[FACT:([^\]]+)\]\]/gu,
              (_, ref: string) => `[[FACT:${refs.get(ref)}]]`)),
          })),
        })), crfRows: context.INCLUDE_CRF_ROWS ? data.crfRows.map(row => ({ ...row, variableRef: refs.get(row.variableRef) })) : [] };
        return new Response(JSON.stringify({ status: "completed", model: destination === "azure" ? "gpt-5.6-sol" : "gpt-5.6-terra",
          output_text: JSON.stringify(value) }));
      };
      const result = await executeOpenAIDrciDraft(packet(), "LOCAL_SYNTHETIC", fetchImpl, undefined, undefined,
        destination === "azure" ? { destination, responsesEndpoint: "https://test.services.ai.azure.com/api/projects/test/openai/v1/responses" } : undefined);
      expect(materializeDrciDraftPack(result.value, { project, packet: packet(), generatedAt: at }).documents).toHaveLength(4);
    }
    expect(caps.openai).toEqual([8000, 8000]);
    expect(caps.azure).toEqual([8000, 16000]);
  });
  it("does not return a partial pack when the Azure companion scope is incomplete", async () => {
    const scopes: string[] = [];
    const fetchImpl: typeof fetch = async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      const context = JSON.parse(payload.input);
      scopes.push(context.DOCUMENT_SCOPE.join("+"));
      if (context.INCLUDE_CRF_ROWS) return new Response(JSON.stringify({ status: "incomplete", model: "gpt-5.6-sol",
        incomplete_details: { reason: "max_output_tokens" }, usage: { input_tokens: 100, output_tokens: 8000 } }));
      const protocol = { ...generated().documents.find(doc => doc.kind === "PROTOCOL_FULL")!,
        sections: [{ title: "Rationnel", paragraphs: ["LOCAL_SYNTHETIC"], sourceRefs: [] }] };
      return new Response(JSON.stringify({ status: "completed", model: "gpt-5.6-sol",
        output_text: JSON.stringify({ documents: [protocol], crfRows: [] }) }));
    };
    await expect(executeOpenAIDrciDraft(packet(), "LOCAL_SYNTHETIC", fetchImpl, undefined, undefined,
      { destination: "azure", responsesEndpoint: "https://test.services.ai.azure.com/api/projects/test/openai/v1/responses" }))
      .rejects.toMatchObject({ stage: "DOCUMENT_PROJECTION", providerStatus: "incomplete:max_output_tokens" });
    expect(scopes).toEqual(["PROTOCOL_FULL", "PROTOCOL_SYNOPSIS+CRF+RECRUITMENT"]);
  });
  it.each(["wrong-project-version", undefined])("keeps runtime binding authoritative when the LLM binding is %s", binding => {
    const batches = prepareDrciGenerationBatches(packet());
    const refs = new Map(packet().sourceFacts.map((f, i) => [f.ref, `f${i}`]));
    const expanded = batches.map(batch => {
      const context = JSON.parse(batch.context); const data = generated();
      return batch.expand({ binding,
        documents: data.documents.filter(d => context.DOCUMENT_SCOPE.includes(d.kind)).map(d => ({ ...d, sections: d.sections.map(s => ({ ...s,
          sourceRefs: s.sourceRefs.map(ref => refs.get(ref)), paragraphs: s.paragraphs.map(p => p.replace(/\[\[FACT:([^\]]+)\]\]/gu, (_, ref) => `[[FACT:${refs.get(ref)}]]`)) })) })),
        crfRows: context.INCLUDE_CRF_ROWS ? data.crfRows.map(row => ({ ...row, variableRef: refs.get(row.variableRef) })) : [] });
    });
    const actual = materializeDrciDraftPack({ documents: expanded.flatMap(b => b.documents), crfRows: expanded.flatMap(b => b.crfRows) }, { project, packet: packet(), generatedAt: at });
    expect(actual.project).toEqual(packet().projectBinding);
    expect(actual.preparationBinding).toBe(batches[0].runtimeBinding.preparation);
    expect(actual.preparationBinding).not.toBe(binding);
  });
  it("rejects another Project version or tampered runtime source at final materialization", () => {
    for (const changed of [{ ...project, versionId: "another-version" }, { ...project, projectId: "another-project" }]) {
      expect(() => materializeDrciDraftPack(generated(), { project: changed, packet: packet(), generatedAt: at })).toThrow("RUNTIME_PROJECT_BINDING_MISMATCH");
    }
    const tampered = { ...packet(), projectBinding: { ...packet().projectBinding, projectDigest: "wrong" } };
    expect(() => materializeDrciDraftPack(generated(), { project, packet: tampered, generatedAt: at })).toThrow("RUNTIME_PROJECT_BINDING_MISMATCH");
  });
  it("reuses the paid native protocol and consumes only the remaining scope without resetting the ledger", async () => {
    const batches = prepareDrciGenerationBatches(packet());
    const p = createCanaryCampaignPolicy({ campaignId: "local-synthetic-retained-doc", maxSessions: 1, measuredSoftStopUsd: 3,
      absoluteHardBoundUsd: 5, singleAttemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED, allowedProviderModels: ["gpt-5.6-terra"], createdAt: at,
      exactInputCounting: { maxInputTokens: 24000, maxGenerationAttempts: 2, maxTokenCountRequests: 2, maxProviderHttpRequests: 4 } });
    const root = join(await mkdtemp(join(tmpdir(), "noxia-retained-doc-")), `canary-${p.campaignId}`);
    const refs = new Map(packet().sourceFacts.map((f, i) => [f.ref, `f${i}`]));
    const provider = vi.fn<typeof fetch>(async (url, init) => {
      if (String(url).endsWith("input_tokens")) return new Response(JSON.stringify({ object: "response.input_tokens", input_tokens: 100 }));
      const context = JSON.parse(JSON.parse(String(init?.body)).input); const data = generated();
      const dto = { binding: "PACK_PREPARATION",
        documents: data.documents.filter(d => context.DOCUMENT_SCOPE.includes(d.kind)).map(d => ({ ...d, sections: d.sections.map(s => ({ ...s,
          sourceRefs: s.sourceRefs.map(ref => refs.get(ref)), paragraphs: s.paragraphs.map(p => p.replace(/\[\[FACT:([^\]]+)\]\]/gu, (_, ref) => `[[FACT:${refs.get(ref)}]]`)) })) })),
        crfRows: context.INCLUDE_CRF_ROWS ? data.crfRows.map(row => ({ ...row, variableRef: refs.get(row.variableRef) })) : [] };
      return new Response(JSON.stringify({ status: "completed", model: "gpt-5.6-terra", output_text: JSON.stringify(dto), usage: { input_tokens: 100, output_tokens: 100 } }));
    });
    const recorded = createRecordedProtocolDesignerFetch({ root, campaignPolicy: p, canaryCampaignId: p.campaignId, fetchImpl: provider });
    const instrumentation = { context: { sessionId: "LOCAL_SYNTHETIC", conversationId: "LOCAL_SYNTHETIC", turnId: "doc", clientRequestId: "doc", testSessionId: null },
      purpose: "DOCUMENT_PROJECTION" as const, reasoningEffort: "medium" as const, retryIndex: 0, retryReason: null, onRecord: () => undefined };
    await recorded("https://api.openai.com/v1/responses", { method: "POST", signal: new AbortController().signal,
      body: JSON.stringify({ model: "gpt-5.6-terra", instructions: batches[0].instruction, input: batches[0].context,
        reasoning: { effort: "medium" }, max_output_tokens: 8000, store: false, service_tier: "default", text: { format: { type: "json_object" } } }),
      noxiaProviderObservation: { ...instrumentation, context: instrumentation.context } } as Parameters<typeof recorded>[1]);
    const retained = await readRetainedDrciProtocolEvidence({ root, policy: p, packet: packet(), sessionId: "LOCAL_SYNTHETIC" });
    expect(retained).not.toBeNull();
    const before = await readCanaryState(root, p.campaignId, p);
    expect(before.providerHttpRequests).toBe(2);
    expect(await readRetainedDrciProtocolEvidence({ root, policy: p, packet: packet(), sessionId: "FRESH_SESSION" })).toBeNull();
    expect(await readCanaryState(root, p.campaignId, p)).toEqual(before);
    expect(provider).toHaveBeenCalledTimes(2);
    await expect(readRetainedDrciProtocolEvidence({ root, policy: p, packet: packet(), sessionId: null })).rejects.toThrow("DRCI_RETAINED_SESSION_MISMATCH");
    const result = await executeOpenAIDrciDraft(packet(), "LOCAL_SYNTHETIC", recorded, instrumentation, retained);
    expect(result.calls).toBe(1); expect(provider).toHaveBeenCalledTimes(4);
    const actual = materializeDrciDraftPack(result.value, { project, packet: packet(), generatedAt: at, reusedProtocolEvidenceRef: result.reusedProtocolEvidenceRef });
    expect(actual.documents).toHaveLength(4); expect(actual.project).toEqual(packet().projectBinding);
    expect(actual.reusedProtocolEvidenceRef).toBe(retained!.rawOutputRef);
    const after = await readCanaryState(root, p.campaignId, p);
    expect(after.providerHttpRequests).toBe(4); expect(after.measured).toBeGreaterThan(before.measured);
    const bothPaid = await readRetainedDrciProtocolEvidence({ root, policy: p, packet: packet(), sessionId: "LOCAL_SYNTHETIC" });
    expect(bothPaid?.remainingScope).toBeDefined();
    const noProvider = vi.fn<typeof fetch>();
    const recovered = await executeOpenAIDrciDraft(packet(), "LOCAL_SYNTHETIC", noProvider, instrumentation, bothPaid);
    expect(recovered.calls).toBe(0); expect(noProvider).not.toHaveBeenCalled();
    expect(recovered.value).toEqual(result.value);
    expect(await readCanaryState(root, p.campaignId, p)).toEqual(after);
    const mismatchedScope = { ...bothPaid!, remainingScope: { ...bothPaid!.remainingScope!, requestContext: bothPaid!.remainingScope!.requestContext.replace(project.versionId, "wrong-version") } };
    await expect(executeOpenAIDrciDraft(packet(), "LOCAL_SYNTHETIC", noProvider, instrumentation, mismatchedScope)).rejects.toThrow("RETAINED_PROTOCOL_SOURCE_MISMATCH");
    expect(noProvider).not.toHaveBeenCalled();
    const wrong = { ...retained!, requestContext: retained!.requestContext.replace(project.versionId, "wrong-version") };
    const blocked = vi.fn<typeof fetch>();
    await expect(executeOpenAIDrciDraft(packet(), "LOCAL_SYNTHETIC", blocked, instrumentation, wrong)).rejects.toThrow("RETAINED_PROTOCOL_SOURCE_MISMATCH");
    expect(blocked).not.toHaveBeenCalled();
  });
  it("normalizes equivalent CRF representations without changing content or accepting invalid origins", () => {
    const data = generated();
    const row = { ...data.crfRows[0], categories: ["18–29", "30–39"], controls: "À définir", dataOrigin: "SITE_CLINIQUE", specificationStatus: "PROPOSED_FOR_REVIEW" };
    const value = { ...data, crfRows: [row, ...data.crfRows.slice(1)] };
    const actual = materializeDrciDraftPack(value, { project, packet: packet(), generatedAt: at });
    expect(actual.crfRows[0]).toEqual({ ...row, categories: "18–29 ; 30–39", controls: ["À définir"], dataOrigin: "SITE_RECORDED" });
    const crf = drciDraftPackFiles(actual).find(file => file.kind === "CRF")!;
    expect(crf.html).not.toContain("PROPOSED_FOR_REVIEW");
    expect(crf.html).toContain("Proposition à confirmer");
    for (const invalid of [{ dataOrigin: "INVENTED_ORIGIN" }, { controls: Array(11).fill("control") }, { categories: ["valid", 42] }]) {
      expect(() => materializeDrciDraftPack({ ...value, crfRows: [{ ...row, ...invalid }, ...data.crfRows.slice(1)] }, { project, packet: packet(), generatedAt: at })).toThrow();
    }
  });
  it("permits operational deduction without a new scientific decision and keeps uncertain methods open", () => {
    const instruction = packet().instruction;
    expect(instruction).toContain("Une spécification mécaniquement dérivée");
    expect(instruction).toContain("DERIVED_FROM_PROJECT");
    expect(instruction).toContain("stratégie de données manquantes non adoptés");
    expect(instruction).toContain("aucun diagnostic ou critère d'exclusion n'est déduit automatiquement");
    expect(JSON.parse(packet().context).DOCUMENT_SPECIFICATION).toBe("DRCI_OPERATIONAL_V2");
    expect(JSON.parse(packet().context).CURRENT_PROJECT.sourceFacts).toEqual(packet().sourceFacts);
    const data = generated();
    data.crfRows[0] = { ...data.crfRows[0], dataOrigin: "SYSTEM_DERIVED", specificationStatus: "DERIVED_FROM_PROJECT" };
    const actual = materializeDrciDraftPack(data, { project, packet: packet(), generatedAt: at });
    expect(actual.projectWriteAuthorized).toBe(false);
    expect(drciDraftPackFiles(actual).find(file => file.kind === "CRF")!.html).toContain("Déduite des décisions de l’étude");
  });
  it.each(["IMAGING_DERIVED", "IMAGING_READER_RECORDED", "LAB_RESULT", "SITE_RECORDED", "PARTICIPANT_REPORTED", "SYSTEM_DERIVED"])(
    "retains the distinct collection origin %s", dataOrigin => {
      const data = generated(); data.crfRows[0] = { ...data.crfRows[0], dataOrigin };
      expect(materializeDrciDraftPack(data, { project, packet: packet(), generatedAt: at }).crfRows[0].dataOrigin).toBe(dataOrigin);
    });
  it("rejects structurally obsolete rows, duplicate collection IDs and orphan derivation inputs", () => {
    for (const invalid of [{ variableId: undefined }, { condition: undefined }, { entryType: "PROPOSED_FOR_REVIEW" },
      { derivedFrom: ["ABSENT_PARENT"] }]) {
      const data = generated(); Object.assign(data.crfRows[0], invalid);
      expect(() => materializeDrciDraftPack(data, { project, packet: packet(), generatedAt: at })).toThrow("OPERATIONAL_CRF_SPECIFICATION_INCOMPLETE");
    }
    const duplicate = generated(); duplicate.crfRows[1].variableId = duplicate.crfRows[0].variableId;
    expect(() => materializeDrciDraftPack(duplicate, { project, packet: packet(), generatedAt: at })).toThrow("OPERATIONAL_CRF_SPECIFICATION_INCOMPLETE");
  });
  it("does not reuse paid prose when its documentary specification belongs to the old contract", async () => {
    const batch = prepareDrciGenerationBatches(packet())[0]; const obsolete = JSON.parse(batch.context); delete obsolete.DOCUMENT_SPECIFICATION;
    const provider = vi.fn<typeof fetch>();
    await expect(executeOpenAIDrciDraft(packet(), "LOCAL_SYNTHETIC", provider, undefined, {
      requestContext: JSON.stringify(obsolete), value: {}, rawOutputRef: "scientific-interpretation-raw:old-contract",
    })).rejects.toThrow("RETAINED_PROTOCOL_SOURCE_MISMATCH");
    expect(provider).not.toHaveBeenCalled();
  });
  it("renders a readable field dictionary and printable prescreen without raw IDs or executable HTML", () => {
    const data = generated(); data.documents[3].sections[0].paragraphs = ["Âge : ____ ans\n☐ Oui ☐ Non\nMotif : __________"];
    data.crfRows[0].condition = "Si le recueil est applicable";
    const actual = materializeDrciDraftPack(data, { project, packet: packet(), generatedAt: at });
    const files = drciDraftPackFiles(actual); const crf = files.find(file => file.kind === "CRF")!;
    expect(crf.html.match(/<article class="scientific-field">/gu)).toHaveLength(source.crf.fields.length);
    expect(crf.html).toContain("FIELD_0"); expect(crf.html).toContain("<dt>Condition</dt>");
    expect(crf.markdown).toContain("**Visite / moment**"); expect(crf.html).not.toContain(source.crf.fields[0].canonicalVariableId);
    expect(files[3].html).toContain("☐ Oui ☐ Non"); expect(files[3].html).toContain("white-space:pre-line");
  });
  it("polishes editorial terminology idempotently without changing fact citations or adopted science", () => {
    const text = "L’endpoint principal est évaluable. Pré-screening. [[FACT:endpoint-principal]]";
    const actual = polishDrciEditorialText(text);
    expect(actual).toBe("Le critère de jugement principal est évaluable. Présélection. [[FACT:endpoint-principal]]");
    expect(polishDrciEditorialText(actual)).toBe(actual);
    expect(polishDrciEditorialText("Le pré-screening. Issue du pré-screening.")).toBe("La présélection. Issue de la présélection.");
    const candidate = pack(); const before = JSON.stringify(candidate.sourceFacts);
    drciDraftPackFiles(candidate); expect(JSON.stringify(candidate.sourceFacts)).toBe(before);
  });
  it("repairs the accented evaluability typo without modifying source identifiers or larger tokens", () => {
    expect(polishDrciEditorialText("ECV global évalu able selon les conditions définies.")).toBe("ECV global évaluable selon les conditions définies.");
    expect(polishDrciEditorialText("évalu able")).toBe("évaluable");
    for (const text of ["[[FACT:évalu able]]", "préévalu able", "évalu able_extra", "évalu ables", "évaluable"])
      expect(polishDrciEditorialText(text)).toBe(text);
  });
  it("groups equivalent CRF headings once and orders collection modules without merging different methods or mutating the pack", () => {
    const original = pack();
    const candidate = { ...original, crfRows: [...original.crfRows], sourceFacts: [...original.sourceFacts] };
    const baseRow = candidate.crfRows[0];
    candidate.crfRows = ["PA/HTA", "Qualité/évaluabilité", "Acquisition", "Acquisition TDM", "Autre méthode"].map((domain, i) => ({
      ...baseRow, domain, variableId: `CHECK_${i}`, variableRef: `variable-${i}`, unit: "unité conservée", controls: [`contrôle-${i}`],
      derivedFrom: i === 1 ? ["CHECK_0"] : [], derivation: i === 1 ? "dérivation conservée" : null,
    }));
    candidate.sourceFacts.push(
      { ref: "visit", type: "VISIT", content: "Une visite IRM unique.", polarity: "AFFIRMED", epistemicState: "KNOWN" },
      { ref: "quality", type: "PROJECT_INFORMATION", content: "ECV : cartes interprétables et hématocrite disponible.", polarity: "AFFIRMED", epistemicState: "KNOWN" });
    candidate.documents.find(doc => doc.kind === "CRF")!.sections.push({ title: "Qualité / évaluabilité", paragraphs: ["Instruction qualité conservée."], sourceRefs: [] });
    const before = JSON.stringify(candidate);
    const file = drciDraftPackFiles(candidate).find(doc => doc.kind === "CRF")!;
    const div = document.createElement("div"); div.innerHTML = file.html;
    const headings = [...div.querySelectorAll("h2")].map(h => h.textContent);
    expect(headings.filter(h => h === "Qualité / évaluabilité")).toHaveLength(1);
    const quality = [...div.querySelectorAll("section")].find(s => s.querySelector("h2")?.textContent === "Qualité / évaluabilité")!;
    expect(quality.querySelectorAll(".scientific-field")).toHaveLength(1);
    expect(quality.querySelectorAll(".process-field")).toHaveLength(1);
    expect(file.markdown.match(/Instruction qualité conservée\./gu)).toHaveLength(1);
    expect(headings.indexOf("Visites")).toBeLessThan(headings.indexOf("PA / HTA"));
    expect(headings.indexOf("PA / HTA")).toBeLessThan(headings.indexOf("Acquisition"));
    expect(headings.indexOf("Acquisition")).toBeLessThan(headings.indexOf("Qualité / évaluabilité"));
    expect(headings).toContain("Acquisition TDM"); expect(headings).toContain("Autre méthode");
    expect(div.querySelectorAll(".scientific-field")).toHaveLength(candidate.crfRows.length);
    expect(file.markdown).toContain("dérivation conservée"); expect(file.markdown).toContain("unité conservée");
    candidate.crfRows.forEach((_, i) => expect(file.markdown).toContain(`contrôle-${i}`));
    expect(JSON.stringify(candidate)).toBe(before);
  });
  it("separates explicit open-item categories without inventing a category or removing an unknown", () => {
    const candidate = pack(); const synopsis = candidate.documents.find(doc => doc.kind === "PROTOCOL_SYNOPSIS")!;
    synopsis.missingElements = ["Technique : procédure locale. Analyse : données manquantes. Institution : promoteur et contact.",
      "Une précision non catégorisée reste ouverte ; ne pas interpréter le mot Analyse sans label."];
    const before = JSON.stringify(candidate);
    const file = drciDraftPackFiles(candidate).find(doc => doc.kind === "PROTOCOL_SYNOPSIS")!;
    expect(file.markdown).toContain("### Technique\n\n- ☐ Procédure locale.");
    expect(file.markdown).toContain("### Analyse\n\n- ☐ Données manquantes.");
    expect(file.markdown).toContain("### Institution\n\n- ☐ Promoteur et contact.");
    expect(file.markdown).toContain(synopsis.missingElements[1]);
    expect(JSON.stringify(candidate)).toBe(before);
  });
  it("adds collection controls separately and only from applicable known positive decisions", () => {
    const candidate = { ...pack(), sourceFacts: [
      { ref: "criterion", type: "ELIGIBILITY_CRITERION", content: "Consentement requis.", polarity: "AFFIRMED", epistemicState: "KNOWN" },
      { ref: "visit", type: "VISIT", content: "Une visite IRM unique.", polarity: "AFFIRMED", epistemicState: "KNOWN" },
      { ref: "quality", type: "PROJECT_INFORMATION", content: "ECV : cartes interprétables et hématocrite disponible.", polarity: "AFFIRMED", epistemicState: "KNOWN" },
      { ref: "lge", type: "PROJECT_INFORMATION", content: "LGE focal : exclusion de l’analyse principale sans supprimer la fiche.", polarity: "AFFIRMED", epistemicState: "KNOWN" },
    ] };
    const before = JSON.stringify(candidate); const files = drciDraftPackFiles(candidate);
    const crf = files.find(file => file.kind === "CRF")!;
    for (const id of ["SCREENING_STATUS", "SCREENING_REASON", "CONSENT_CONFIRMED", "VISIT_PERFORMED", "OUTCOME_EVALUABLE", "PRIMARY_ANALYSIS_ELIGIBLE", "PRIMARY_ANALYSIS_EXCLUSION_REASON", "STUDY_COMPLETION_STATUS"]) expect(crf.html).toContain(id);
    expect(crf.html.match(/class="process-field"/gu)).toHaveLength(8);
    expect(crf.html.match(/class="scientific-field"/gu)).toHaveLength(candidate.crfRows.length);
    expect(crf.markdown).toContain("un contrôle en attente reste vide");
    expect(crf.markdown).toContain("Conditionnelle"); expect(crf.markdown).toContain("ne vaut pas validation scientifique");
    expect(JSON.stringify(candidate)).toBe(before);
    const open = drciDraftPackFiles({ ...candidate, sourceFacts: candidate.sourceFacts.map(fact => ({ ...fact, epistemicState: "UNKNOWN" })) }).find(file => file.kind === "CRF")!;
    expect(open.html).not.toContain("PRIMARY_ANALYSIS_ELIGIBLE"); expect(open.html).not.toContain("OUTCOME_EVALUABLE");
    const negated = drciDraftPackFiles({ ...candidate, sourceFacts: candidate.sourceFacts.map(fact => ({ ...fact, polarity: "NEGATED" })) }).find(file => file.kind === "CRF")!;
    expect(negated.html).not.toContain("VISIT_PERFORMED"); expect(negated.html).not.toContain("CONSENT_CONFIRMED");
  });
  it("keeps candidate information separate from the internal form and all current open items", () => {
    const candidate = pack(); const unknown = { ref: "sequence", type: "UNCERTAINTY", content: "La séquence constructeur de T1 mapping reste à définir.", polarity: "AFFIRMED", epistemicState: "UNKNOWN" };
    const withUnknown = { ...candidate, sourceFacts: [...candidate.sourceFacts, unknown] };
    const document = candidate.documents.find(doc => doc.kind === "RECRUITMENT")!;
    document.sections = [{ title: "A. Information courte destinée aux personnes candidates", paragraphs: ["Une visite avec IRM et prélèvement. Participation volontaire."], sourceRefs: [] },
      { title: "B. Formulaire papier de pré-screening", paragraphs: ["Âge : ____ ans\n☐ Oui ☐ Non\nMotif : ____"], sourceRefs: [] }];
    document.missingElements = ["À définir avant gel du protocole — Technique : séquence constructeur de T1 mapping.", "Technique : séquence constructeur de T1 mapping.", "Institution : contact du site."];
    const file = drciDraftPackFiles(withUnknown).find(file => file.kind === "RECRUITMENT")!;
    const div = globalThis.document.createElement("div"); div.innerHTML = file.html;
    expect(div.querySelector(".candidate-information")?.textContent).not.toContain("constructeur");
    expect(div.querySelector(".candidate-information")?.textContent).not.toContain("données manquantes");
    expect(div.querySelector(".internal-information")?.textContent).toContain("Formulaire interne");
    const checklist = div.querySelector(".open-checklist")!;
    expect(checklist.textContent).toContain("Checklist interne avant mise en service");
    expect(checklist.textContent?.match(/séquence constructeur/giu)).toHaveLength(1);
    expect(checklist.textContent).toMatch(/contact du site/iu);
  });
  it("omits irrelevant field boilerplate but preserves genuine conditions, calculations and unknown specifications", () => {
    const candidate = pack(); const row = candidate.crfRows[0];
    row.condition = null; row.derivedFrom = []; row.derivation = null;
    const file = drciDraftPackFiles(candidate).find(file => file.kind === "CRF")!;
    expect(file.html).not.toContain("Sans objet — saisie directe");
    expect(file.html).toContain("À définir"); expect(file.html).toContain("Contrôles à préciser");
    const conditional = { ...candidate, crfRows: [{ ...row, condition: "Si ancien fumeur", derivedFrom: ["EXPOSITION"], derivation: "Calcul depuis les données sources", analysisImpact: "Condition d’admissibilité" }] };
    const actual = drciDraftPackFiles(conditional).find(file => file.kind === "CRF")!;
    for (const value of ["Si ancien fumeur", "EXPOSITION", "Calcul depuis les données sources", "Condition d’admissibilité"]) expect(actual.html).toContain(value);
  });
  it("corrects only operational obligations and an explicit misclassification against the adopted design", () => {
    const data = generated() as Parameters<typeof completeDrciOperationalProjection>[0];
    while (data.crfRows.length < 4) data.crfRows.push({ ...data.crfRows[0], variableRef: `test-${data.crfRows.length}`, variableId: `FIELD_${data.crfRows.length}` });
    data.documents[0].sections[0].paragraphs = ["Le projet est conçu comme une étude de faisabilité avec une cible pragmatique.",
      "Une étude de faisabilité serait une autre question, non retenue."];
    const scientificFacts = [{ ref: "design", type: "STUDY_DESIGN", content: "Étude observationnelle transversale.", polarity: undefined, epistemicState: "KNOWN" },
      ...data.crfRows.slice(0, 4).map((row, i) => ({ ref: row.variableRef, type: "CANONICAL_VARIABLE", content: ["Pression artérielle systolique, en mmHg.",
        "Pression artérielle diastolique, en mmHg.", "Traitement antihypertenseur.", "Qualité des acquisitions."][i], polarity: "AFFIRMED", epistemicState: "KNOWN" })),
      { ref: "quality", type: "PROJECT_INFORMATION", content: "Cartes T1 interprétables requises.", polarity: "AFFIRMED", epistemicState: "KNOWN" }];
    const original = JSON.stringify(data); const factsOriginal = JSON.stringify(scientificFacts);
    const actual = completeDrciOperationalProjection(data, scientificFacts);
    expect(actual.documents[0].sections[0].paragraphs[0]).toContain("une étude observationnelle");
    expect(actual.documents[0].sections[0].paragraphs[1]).toBe(data.documents[0].sections[0].paragraphs[1]);
    expect(actual.crfRows[0].condition).toBeNull(); expect(actual.crfRows[0].required).toContain("mesure prévue");
    expect(actual.crfRows[2].required).toContain("présent ou absent"); expect(actual.crfRows[3].required).toContain("même sans anomalie");
    expect(actual.crfRows[0].controls).toEqual(data.crfRows[0].controls);
    expect(actual.crfRows.slice(4)).toEqual(data.crfRows.slice(4)); expect(JSON.stringify(data)).toBe(original); expect(JSON.stringify(scientificFacts)).toBe(factsOriginal);
    expect(completeDrciOperationalProjection(data, scientificFacts.map(f => ({ ...f, epistemicState: "UNKNOWN" })))).toEqual(data);
  });
  it("derives prescreen decision paths only from current affirmed eligibility criteria, not LGE analysis exclusion", () => {
    const actual = { ...pack(), sourceFacts: [
      { ref: "min", type: "ELIGIBILITY_CRITERION", content: "Âge minimal : 18 ans", polarity: "AFFIRMED", epistemicState: "KNOWN" },
      { ref: "max", type: "ELIGIBILITY_CRITERION", content: "Âge maximal : 75 ans", polarity: "AFFIRMED", epistemicState: "KNOWN" },
      { ref: "hta", type: "ELIGIBILITY_CRITERION", content: "Exclusion en cas d’HTA connue, même contrôlée.", polarity: "AFFIRMED", epistemicState: "KNOWN" },
      { ref: "negative", type: "ELIGIBILITY_CRITERION", content: "Exclusion des anciens fumeurs.", polarity: "NEGATED", epistemicState: "KNOWN" },
      { ref: "open", type: "ELIGIBILITY_CRITERION", content: "Exclusion rénale restant à définir.", polarity: "AFFIRMED", epistemicState: "UNKNOWN" },
      { ref: "lge", type: "PROJECT_INFORMATION", content: "LGE focal excluant l’analyse principale.", polarity: "AFFIRMED", epistemicState: "KNOWN" },
    ] };
    const file = drciDraftPackFiles(actual).find(file => file.kind === "RECRUITMENT")!;
    const decision = file.markdown.split("## Règles internes de décision")[1].split("## C. Checklist interne")[0];
    expect(decision).toContain("18–75"); expect(decision).toContain("si Oui → non éligible"); expect(decision).toContain("investigateur");
    expect(decision).not.toContain("anciens fumeurs"); expect(decision).not.toContain("LGE"); expect(decision).not.toContain("Exclusion rénale");
  });
  it("keeps a single authored completion section without reprinting its open-items metadata", () => {
    const actual = pack(); actual.documents[0].sections = [{ title: "À définir avant gel du protocole", paragraphs: ["Circuit institutionnel à définir."], sourceRefs: actual.sourceFacts.filter(f => f.epistemicState === "UNKNOWN").map(f => f.ref) }];
    actual.documents[0].missingElements = ["Circuit institutionnel à définir."];
    const file = drciDraftPackFiles(actual)[0]; expect(file.markdown.split("Circuit institutionnel à définir.")).toHaveLength(2);
  });
  it("requires the native human handoff and exact Project/projection/CRF binding", () => {
    expect(packet().crf.packageId).toBe(source.crf.packageId);
    expect(() => prepareDrciDraftPack(project, { ...source, handoffDecision: { ...handoffDecision, status: "PENDING" } })).toThrow("HANDOFF_PROJECT_VERSION_MISMATCH");
    expect(() => prepareDrciDraftPack(project, { ...source, protocolProjection: { ...projection, source: { ...projection.source, projectVersion: "old" } } })).toThrow("PROJECTION_STALE");
    expect(() => prepareDrciDraftPack(project, { ...source, crf: { ...source.crf, sourceProject: { ...source.crf.sourceProject, projectDigest: "old" } } })).toThrow("NATIVE_SOURCE_MISMATCH");
  });
  it("rejects missing documents, invented facts and non-native CRF variables", () => {
    const incomplete = generated(); incomplete.documents[3] = incomplete.documents[0];
    expect(() => materializeDrciDraftPack(incomplete, { project, packet: packet(), generatedAt: at })).toThrow("DOCUMENT_SET_INCOMPLETE");
    const invented = generated(); invented.documents[0].sections[0].paragraphs = ["[[FACT:invented]]"];
    expect(() => materializeDrciDraftPack(invented, { project, packet: packet(), generatedAt: at })).toThrow("FACT_BINDING_INVALID");
    const wrongCrf = generated(); wrongCrf.crfRows.push({ ...wrongCrf.crfRows[0], variableRef: "invented" });
    expect(() => materializeDrciDraftPack(wrongCrf, { project, packet: packet(), generatedAt: at })).toThrow("NATIVE_COVERAGE_MISMATCH");
  });
  it("projects the same exact adopted values in all four files; escapes model HTML and keeps review pending", () => {
    const candidate = pack(); const files = drciDraftPackFiles(candidate);
    expect(files).toHaveLength(4); expect(candidate.projectWriteAuthorized).toBe(false);
    expect(candidate.crossConsistency).toBe("SOURCE_BINDINGS_CHECKED_HUMAN_REVIEW_PENDING");
    for (const file of files) { expect(file.markdown).toContain(packet().sourceFacts[0].content);
      expect(file.markdown).not.toContain("[[FACT:"); expect(file.html).toContain("&lt;script&gt;"); expect(file.html).not.toContain("<script>"); }
    expect(candidate.crfRows).toHaveLength(source.crf.fields.length);
  });
  it("removes legacy citation expansion and the final fact dump while retaining audit sources", () => {
    const candidate = pack(); const original = packet().sourceFacts[0];
    for (const file of drciDraftPackFiles(candidate)) {
      expect(file.markdown.split(original.content)).toHaveLength(2);
      expect(file.markdown).not.toContain("Décisions de référence"); expect(file.html).not.toContain("Décisions de référence");
      expect(file.markdown).not.toContain("[[FACT:"); expect(file.html).not.toContain("[[FACT:");
      expect(file.markdown).not.toContain(original.ref); expect(file.html).not.toContain(original.ref);
    }
    expect(candidate.sourceFacts).toEqual(packet().sourceFacts);
    expect(candidate.documents[0].sections[0].sourceRefs).toContain(original.ref);
    for (const artifact of projectDrciDraftPackPortfolio(portfolio(), candidate, project).artifacts.slice(0, 4)) {
      expect(artifact.sourceObjectRefs).toEqual(candidate.sourceFacts.map(f => f.ref));
    }
  });
  it("keeps negated facts in every document and consolidates the full unknown checklist outside the synopsis", () => {
    const original = pack();
    const candidate = { ...original, sourceFacts: [...original.sourceFacts,
      { ref: "negated-test", type: "ACQUISITION", content: "T2 systématique", polarity: "NEGATED", epistemicState: "KNOWN" },
      { ref: "unknown-test", type: "UNCERTAINTY", content: "Critère rénal restant à définir", polarity: "AFFIRMED", epistemicState: "UNKNOWN" }],
      documents: original.documents.map(doc => ({ ...doc, sections: [{ ...doc.sections[0], paragraphs: ["[[FACT:negated-test]]"] }], missingElements: [] })) };
    for (const file of drciDraftPackFiles(candidate)) {
      expect(file.markdown).toContain("Exclusion / absence : T2 systématique");
      expect(file.html).toContain("Exclusion / absence : T2 systématique");
      if (file.kind === "PROTOCOL_SYNOPSIS") expect(file.markdown).not.toContain("Critère rénal restant à définir");
      else { expect(file.markdown).toContain("Critère rénal restant à définir"); expect(file.html).toContain("Critère rénal restant à définir"); }
    }
  });
  it("marks every written document STALE after a Project change and preserves its original binding", () => {
    const candidate = pack(); const changed = { ...project, versionId: "changed", projectDigest: "changed" };
    expect(isDrciDraftPackCurrent(candidate, changed)).toBe(false);
    const projected = projectDrciDraftPackPortfolio(portfolio(), candidate, changed);
    for (const artifact of projected.artifacts.slice(0, 4)) {
      expect(artifact.status).toBe("STALE"); expect(artifact.sourceProject?.projectVersion).toBe(project.versionId);
      expect(artifact.preview).toContain("antérieure");
    }
    expect(isDrciDraftPackCurrent({ ...candidate, generatedAt: "tampered" }, project)).toBe(false);
  });
  it("retains the actual written pack losslessly on reopen, alongside the canonical Project", () => {
    const saved = createProjectSession(localStorage, "DRCI"); saved.session.projectId = project.projectId; const candidate = pack();
    saveProjectSession(localStorage, saved, { ...saved.session, projectId: project.projectId, project, drciDraftPacks: [candidate] });
    const reopened = readProjectSessions(localStorage).projects[0].session;
    expect(reopened.drciDraftPacks).toEqual([candidate]); expect(reopened.project?.projectDigest).toBe(project.projectDigest);
  });
  it("actually opens each document in a dedicated, sandboxed reading surface", () => {
    render(<StudyDeliverableWorkspace portfolio={projectDrciDraftPackPortfolio(portfolio(), pack(), project)} onClose={() => undefined} />);
    for (const kind of DRCI_DOCUMENT_KINDS) {
      fireEvent.click(screen.getByRole("button", { name: `Ouvrir LOCAL_SYNTHETIC ${kind}` }));
      const frame = screen.getByTitle(`LOCAL_SYNTHETIC ${kind}`); expect(frame).toHaveAttribute("sandbox", "");
      expect(frame.getAttribute("srcdoc")).toContain(packet().sourceFacts[0].content);
      fireEvent.click(screen.getByRole("button", { name: "Fermer le document" }));
    }
  });
  it("refuses document generation in the legacy/public runtime before any provider", async () => {
    let calls = 0;
    const result = await executeProtocolDesignerBridge({ body: { ...bridgeRequest("Rédiger le dossier"), currentProject: project,
      evaluatePersistentDelta: false, documentDraftRequest: source }, apiKey: "LOCAL_SYNTHETIC", openAiApiKey: "LOCAL_SYNTHETIC",
      fetchImpl: async () => { calls++; throw new Error("not expected"); } });
    expect(result.status).toBe(422); expect(calls).toBe(0);
  });
});
