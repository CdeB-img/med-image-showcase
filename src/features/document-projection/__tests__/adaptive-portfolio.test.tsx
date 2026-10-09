import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { composeStudyTemplateInstance } from "../../study-template/composition";
import { CLINICAL_STUDY_TEMPLATE } from "../../study-template/definitions";
import { makeNativeTemplateInput } from "../../study-template/__tests__/fixtures";
import { projectAdaptivePortfolio, additionalDocumentRequest } from "../adaptive-portfolio";
import AdaptiveDocumentPortfolio from "../AdaptiveDocumentPortfolio";
import { inspectFunctionalDocumentPortfolio } from "../functional-reset-boundary";
import { workingRevisionFixture } from "./working-revision-fixture";
import { prepareDocumentInstruction } from "../../protocol-designer/functional-reset/documentary-conversation";
import { createFunctionalResetSession } from "../../protocol-designer/functional-reset/session";

const context = (imaging = false) => {
  const input = makeNativeTemplateInput({ imaging });
  return { definition: CLINICAL_STUDY_TEMPLATE, instance: composeStudyTemplateInstance(input) };
};
describe("Adaptive document portfolio / existing TMP REG DOC owners", () => {
  it.each([false, true])("projects native applicability without mutation (imaging=%s)", imaging => {
    const source = context(imaging), before = JSON.stringify(source);
    const items = projectAdaptivePortfolio(source, [], source.instance.inputRefs.researchProjectDigest);
    const charter = items.find(item => item.documentId === "IMAGING_CHARTER")!;
    expect(charter.applicability).toBe(imaging ? "APPLICABLE" : "UNKNOWN");
    expect(JSON.stringify(source)).toBe(before);
    expect(items.find(item => item.documentId === "CONSENT")!.applicability).not.toBe("APPLICABLE");
    expect(items.every(item => item.delivery === "NOT_GENERATED")).toBe(true);
  });
  it("preserves an explicit TMP exclusion and omits it from visible recommendations", () => {
    const source = context(true);
    source.instance.documents.find(item => item.documentId === "IMAGING_CHARTER")!.status = "NOT_APPLICABLE";
    const items = projectAdaptivePortfolio(source, [], source.instance.inputRefs.researchProjectDigest);
    render(<AdaptiveDocumentPortfolio items={items} />);
    expect(screen.queryByText("Charte d’imagerie")).not.toBeInTheDocument(); cleanup();
  });
  it("retains an additional conversational request, with native production limitation and no obligation", () => {
    const source = context(), instruction = "Prépare également un questionnaire pour évaluer l’activité sportive des participants.";
    const items = projectAdaptivePortfolio(source, [], source.instance.inputRefs.researchProjectDigest, [{ content: instruction, sourceRef: "turn:request" }]);
    expect(items.find(item => item.documentId === "QUESTIONNAIRE")).toMatchObject({ requested: true, applicability: "UNKNOWN", productionSupported: false, delivery: "NOT_GENERATED", sourceRefs: ["turn:request"] });
    expect(additionalDocumentRequest("Le questionnaire cardiovasculaire est réalisé à l’inclusion")).toBeNull();
    const session = createFunctionalResetSession();
    expect(prepareDocumentInstruction(session, undefined, instruction, "turn:request", "2026-10-09T02:00:00Z")?.update).toEqual({});
  });
  it("uses committed metadata, distinguishes changed Project and does not duplicate generations", async () => {
    const fixture = await workingRevisionFixture();
    const source = inspectFunctionalDocumentPortfolio(fixture.project2), before = fixture.fixture.bodies();
    // Current fixture has no materialized files. Metadata from real native
    // identities is enriched without constructing/reading any scientific body.
    const { logicalDigest } = await import("../../knowledge-engine/canonical");
    const ref = { ...fixture.g2.ref, files: [{ artifactId: `drci-document:${logicalDigest([fixture.g2.body.native.family === "DRCI" ? fixture.g2.body.native.value.packDigest : "", "PROTOCOL_FULL"])}`,
      fileName: "not-an-identity.html", format: "HTML" as const, mimeType: "text/html", byteLength: 1, renderOrigin: "GENERATION_TIME" as const, sha256: "a".repeat(64) }] };
    const items = projectAdaptivePortfolio(source, [ref, ref], fixture.project2.projectDigest);
    expect(items.filter(item => item.documentId === "PROTOCOL")).toHaveLength(1);
    expect(items.find(item => item.documentId === "PROTOCOL")!.delivery).toBe("GENERATED");
    const next = inspectFunctionalDocumentPortfolio(fixture.project3);
    expect(projectAdaptivePortfolio(next, [ref], fixture.project3.projectDigest).find(item => item.documentId === "PROTOCOL")!.delivery).toBe("POTENTIALLY_OUTDATED");
    expect(fixture.fixture.bodies()).toEqual(before);
  });
  it("rejects foreign Project binding and viewing dispatches no production", () => {
    const source = context(true);
    expect(() => projectAdaptivePortfolio(source, [], "foreign")).toThrow("DOC_PORTFOLIO_PROJECT_BINDING_MISMATCH");
    const onConversation = vi.fn(), provider = vi.fn();
    render(<AdaptiveDocumentPortfolio items={projectAdaptivePortfolio(source, [], source.instance.inputRefs.researchProjectDigest)} onConversation={onConversation} />);
    expect(provider).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Demander un autre document/u }));
    expect(onConversation).toHaveBeenCalledOnce(); cleanup();
  });
});
