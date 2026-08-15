import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildProjectDataAnalysisView } from "@/features/data-analysis-planning/project-integration";
import { buildQueryNavigationProductProjection } from "@/features/query-navigation/product";
import { executeResearchProjectConstruction } from "@/features/research-project-construction/engine";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import { buildValidationProductSummary } from "@/features/validation-architecture/product-gates";
import AdaptiveResearchWorkspace from "../AdaptiveResearchWorkspace";
import { buildAdaptiveResearchWorkspaceProjection, computeWorkspaceVisibility, inspectWorkspaceProjectionFreshness } from "../projection";
import { projectSemanticStateForWorkspace } from "../semantic-state";
import type { WorkspaceSemanticState } from "../contracts";

const project = () => executeResearchProjectConstruction(makeProjectInput({
  uncertainties: ["fenêtre temporelle à préciser"],
  outcomes: ["évolution du biomarqueur"],
}));

const fixture = () => {
  const value = project();
  const validation = buildValidationProductSummary([]);
  const navigation = buildQueryNavigationProductProjection(value);
  const dataAnalysis = buildProjectDataAnalysisView(value);
  return { project: value, validation, navigation, dataAnalysis, projection: buildAdaptiveResearchWorkspaceProjection({ project: value, validation, navigation, dataAnalysis }) };
};

describe("UX-001 Part 2 — workspace projection", () => {
  it("UX2-WSP-C01 is a Level 3 projection, not truth", () => { const { projection } = fixture(); expect(projection).toMatchObject({ projectionOnly: true, sourceOfTruth: false }); });
  it("UX2-WSP-C02 forbids every owner write", () => { const { projection } = fixture(); expect([projection.projectWriteAuthorized, projection.validationWriteAuthorized, projection.queryWriteAuthorized, projection.documentWriteAuthorized]).toEqual([false, false, false, false]); });
  it("UX2-WSP-C03 carries references and summaries, not a Project clone", () => { const { projection } = fixture(); expect(projection).not.toHaveProperty("variables"); expect(projection).not.toHaveProperty("canonicalVariables"); expect(projection.sourceProjectRef).toBeTruthy(); });
  it("UX2-WSP-C04 is deterministic", () => { const first = fixture(); expect(buildAdaptiveResearchWorkspaceProjection(first)).toEqual(first.projection); });
  it("UX2-WSP-C05 does not mutate sources", () => { const value = fixture(); const before = JSON.stringify(value.project); buildAdaptiveResearchWorkspaceProjection(value); expect(JSON.stringify(value.project)).toBe(before); });
  it("UX2-WSP-C06 binds the exact Project version and digest", () => { const value = fixture(); expect(value.projection).toMatchObject({ sourceProjectVersion: value.project.candidateVersion.versionId, sourceProjectDigest: value.project.resultDigest }); });
  it("UX2-WSP-C07 has no provider or progress score", () => { const { projection } = fixture(); expect(projection.providerCalls).toBe(0); expect(projection.globalProgressScore).toBeNull(); });
  it("UX2-WSP-C08 keeps QRY owner output", () => { const value = fixture(); expect(value.projection.navigation.projectionRef).toBe(value.navigation.projectionId); expect(value.projection.navigation.whyNow).toBe(value.navigation.summary.whyNow); });
  it("UX2-WSP-C09 preserves all non-dominated alternatives", () => { const value = fixture(); expect(value.projection.navigation.alternatives.map((item) => item.candidateRef)).toEqual(value.navigation.alternatives.map((item) => item.candidateId)); });
  it("UX2-WSP-C10 exposes the QRY system prerequisite", () => { const { projection, navigation } = fixture(); expect(projection.navigation.systemPrerequisite).toBe(navigation.summary.systemPrerequisite); });
  it("UX2-WSP-C11 keeps VAL NOT_EVALUABLE distinct", () => { const { projection } = fixture(); expect(projection.validation.status).toBe("NOT_EVALUABLE"); expect(projection.attention.some((item) => item.kind === "TECHNICAL_PREREQUISITE")).toBe(true); });
  it("UX2-WSP-C12 never presents technical NOT_EVALUABLE as a scientific question", () => { const { projection } = fixture(); const item = projection.attention.find((value) => value.kind === "TECHNICAL_PREREQUISITE"); expect(item?.actionable).toBe(false); expect(item?.summary).toMatch(/n’est pas une question scientifique/); });
  it("UX2-WSP-C13 every attention item has a source and owner", () => { const { projection } = fixture(); expect(projection.attention.every((item) => item.sourceRef && item.owner)).toBe(true); });
  it("UX2-WSP-C14 unknowns are not errors", () => { const { projection } = fixture(); const unknown = projection.attention.find((item) => item.kind === "UNKNOWN"); expect(unknown?.semanticState).toBe("UNKNOWN"); expect(unknown?.blocking).toBe(false); });
  it("UX2-WSP-C15 decisions remain candidate human actions", () => { const { projection } = fixture(); expect(projection.attention.filter((item) => item.sourceType === "PROJECT_DECISION").every((item) => item.semanticState === "CANDIDATE")).toBe(true); });
  it("UX2-WSP-C16 domain summaries retain owners", () => { const { projection } = fixture(); expect(projection.domains.every((item) => item.owner && item.sourceRefs.length)).toBe(true); });
  it("UX2-WSP-C17 DAI is a projected domain", () => { const { projection, dataAnalysis } = fixture(); expect(projection.domains.find((item) => item.domainId === "DATA_ANALYSIS")?.sourceRefs).toContain(dataAnalysis.projectionId); });
  it("UX2-WSP-C18 documents retain DOC ownership", () => { const { projection } = fixture(); expect(projection.documents.every((item) => item.owner === "DOC-001")).toBe(true); });
  it("UX2-WSP-C19 document generatability is not approval", () => { const { projection } = fixture(); expect(projection.documents.map((item) => item.state)).not.toContain("ADOPTED"); });
  it("UX2-WSP-C20 freshness is version-aware", () => { const { projection, project: value } = fixture(); expect(inspectWorkspaceProjectionFreshness(projection, value).state).toBe("CURRENT"); expect(inspectWorkspaceProjectionFreshness({ ...projection, sourceProjectVersion: "old" }, value).state).toBe("STALE"); });
});

describe("UX-001 Part 2 — semantic state presentation", () => {
  const states: WorkspaceSemanticState[] = ["UNKNOWN", "AMBIGUOUS", "CANDIDATE", "ADOPTED", "REJECTED", "DEFERRED", "BLOCKING", "WARNING", "NOT_APPLICABLE", "NOT_EVALUABLE", "NOT_GENERATABLE", "DEFERRED_TO_REALIZED_TIME", "STALE"];
  it("UX2-SEM-C01 covers all required states", () => expect(states.map(projectSemanticStateForWorkspace)).toHaveLength(13));
  it("UX2-SEM-C02 unknown differs from blocking", () => expect(projectSemanticStateForWorkspace("UNKNOWN")).not.toEqual(projectSemanticStateForWorkspace("BLOCKING")));
  it("UX2-SEM-C03 candidate differs from adopted", () => expect(projectSemanticStateForWorkspace("CANDIDATE").label).not.toBe(projectSemanticStateForWorkspace("ADOPTED").label));
  it("UX2-SEM-C04 deferred differs from rejected", () => expect(projectSemanticStateForWorkspace("DEFERRED").explanation).not.toBe(projectSemanticStateForWorkspace("REJECTED").explanation));
  it("UX2-SEM-C05 not applicable is not missing", () => expect(projectSemanticStateForWorkspace("NOT_APPLICABLE").actionable).toBe(false));
  it("UX2-SEM-C06 not evaluable is not valid", () => expect(projectSemanticStateForWorkspace("NOT_EVALUABLE").visualIntent).toBe("CAUTION"));
  it("UX2-SEM-C07 not generatable is not system failure", () => expect(projectSemanticStateForWorkspace("NOT_GENERATABLE").explanation).toMatch(/DOC/));
  it("UX2-SEM-C08 color is not the only indicator", () => expect(states.every((state) => Boolean(projectSemanticStateForWorkspace(state).indicator) && Boolean(projectSemanticStateForWorkspace(state).label))).toBe(true));
});

describe("UX-001 Part 2 — product surface", () => {
  const renderWorkspace = () => {
    const value = fixture();
    const openSurface = vi.fn();
    const openDocument = vi.fn();
    render(<AdaptiveResearchWorkspace projection={value.projection} validation={value.validation} navigation={<section><h3>Prochaine action</h3><p>{value.navigation.summary.whyNow}</p></section>} onOpenSurface={openSurface} onOpenDocument={openDocument} />);
    return { ...value, openSurface, openDocument };
  };
  it("UX2-UI-C01 presents a Project-centric workspace", () => { renderWorkspace(); expect(screen.getByRole("heading", { name: "Votre étude, au même endroit" })).toBeInTheDocument(); expect(screen.getByRole("heading", { name: "Résumé actuel" })).toBeInTheDocument(); });
  it("UX2-UI-C02 keeps next action high in the hierarchy", () => { renderWorkspace(); expect(screen.getByRole("heading", { name: "Prochaine action" })).toBeInTheDocument(); });
  it("UX2-UI-C03 shows Project state, contextual attention, and documents", () => { renderWorkspace(); expect(screen.getByRole("heading", { name: "État du projet" })).toBeInTheDocument(); expect(screen.getByText(/Autres éléments à garder en vue/)).toBeInTheDocument(); expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument(); });
  it("UX2-UI-C04 Standard hides IDs and digests", () => { const value = renderWorkspace(); expect(screen.queryByText(value.projection.workspaceProjectionId)).toBeNull(); });
  it("UX2-UI-C05 Expert reveals reconstructible trace", () => { const value = renderWorkspace(); fireEvent.click(screen.getByRole("button", { name: "Expert" })); expect(screen.getByText(value.projection.workspaceProjectionId)).toBeInTheDocument(); expect(screen.getByText("Traçabilité de la projection")).toBeInTheDocument(); });
  it("UX2-UI-C06 switching modes performs no source mutation", () => { const value = renderWorkspace(); const before = JSON.stringify(value.project); fireEvent.click(screen.getByRole("button", { name: "Expert" })); fireEvent.click(screen.getByRole("button", { name: "Standard" })); expect(JSON.stringify(value.project)).toBe(before); });
  it("UX2-UI-C07 domain navigation emits only a target ref", () => { const value = renderWorkspace(); fireEvent.click(screen.getByRole("button", { name: /Question scientifique/ })); expect(value.openSurface).toHaveBeenCalledTimes(1); expect(typeof value.openSurface.mock.calls[0][0]).toBe("string"); });
  it("UX2-UI-C08 document navigation emits only a target ref", () => { const value = renderWorkspace(); fireEvent.click(screen.getAllByRole("button", { name: "Voir l’aperçu disponible" })[0]); expect(value.openDocument).toHaveBeenCalledTimes(1); });
  it("UX2-UI-C09 uses landmark and named sections", () => { renderWorkspace(); expect(screen.getByRole("main")).toBeInTheDocument(); expect(screen.getByRole("complementary", { name: "Contexte du projet" })).toBeInTheDocument(); });
  it("UX2-UI-C10 uses 44px-equivalent minimum interactive targets", () => { renderWorkspace(); expect(screen.getByRole("button", { name: "Expert" }).className).toContain("min-h-10"); expect(screen.getByRole("button", { name: /Question scientifique/ }).className).toContain("min-h-11"); });
  it("UX2-UI-C11 has responsive one/two-column foundations", () => { renderWorkspace(); const main = screen.getByRole("main"); expect(main.parentElement?.className).toContain("lg:grid-cols"); });
  it("UX2-UI-C12 states remain textually understandable", () => { renderWorkspace(); expect(screen.getAllByText(/Non évaluable|Information inconnue|Proposition candidate|Bloquant/).length).toBeGreaterThan(0); });
  it("UX2-UI-C13 Standard/Expert visibility is explicit", () => { expect(computeWorkspaceVisibility("STANDARD").digests).toBe(false); expect(computeWorkspaceVisibility("EXPERT").digests).toBe(true); });
  it("UX2-UI-C14 contains no automatic decision or correction affordance", () => { renderWorkspace(); expect(screen.queryByText(/Auto-fix|Décider automatiquement|Score global\s*:/i)).toBeNull(); });
});
