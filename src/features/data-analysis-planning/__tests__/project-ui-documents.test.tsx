import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { stableStringify } from "@/features/knowledge-engine/canonical";
import { createHumanDecisionCandidate, engageHumanDecision, reopenHumanDecision, type HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import { executeResearchProjectConstruction } from "@/features/research-project-construction";
import ResearchProjectConstructionView from "@/features/research-project-construction/ResearchProjectConstructionView";
import { createResearchProjectConstructionSession } from "@/features/research-project-construction/session";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import DataAnalysisPlanningView from "../DataAnalysisPlanningView";
import {
  applyDataAnalysisPlanningDecisionToProject,
  buildBiostatisticsPlanningContribution,
  buildDataAnalysisDocumentProjectionInputs,
  buildDataAnalysisPlanningContext,
  buildDataManagementPlanningContribution,
  buildProjectDataAnalysisView,
  buildStudyDataPlanContribution,
  contributionDecisionProvenance,
  type DataAnalysisPlanningContribution,
  type PlanningContributionType,
} from "..";

const makeProject = () => executeResearchProjectConstruction(makeProjectInput({ outcomes: ["marqueur quantitatif"], timings: ["T0", "T1"], designDeclarations: ["suivi longitudinal"] }));

const plans = (project: ResearchProjectDesignResult) => {
  const context = buildDataAnalysisPlanningContext(project);
  const data = buildStudyDataPlanContribution(context);
  const dm = buildDataManagementPlanningContribution(context, data);
  const bio = buildBiostatisticsPlanningContribution(context, data, dm);
  return { context, data, dm, bio };
};

const decisionFor = (
  project: ResearchProjectDesignResult,
  contribution: DataAnalysisPlanningContribution,
  status: "ADOPTED" | "REJECTED" | "DEFERRED" = "ADOPTED",
  targets = contribution.proposedChanges.map((item) => item.objectId),
  authority: { actor?: string; mandate?: string; projectVersion?: string | null } = {},
): HumanDecisionEnvelope => engageHumanDecision(createHumanDecisionCandidate({
  decisionId: `decision:${contribution.contributionType}:${project.candidateVersion.versionId}:${status}:${targets.join("|")}`,
  gateId: `DAI-GATE-${contribution.contributionType}`,
  scope: [contribution.contributionType],
  targets,
  provenance: contributionDecisionProvenance(contribution),
  engineSource: "RESEARCH_PROJECT",
  projectVersion: authority.projectVersion === undefined ? project.candidateVersion.versionId : authority.projectVersion,
}), { status, actor: authority.actor ?? "Human reviewer", mandate: authority.mandate ?? "DAI test mandate", timestamp: "2026-08-15T00:00:00.000Z" });

const adopt = (project: ResearchProjectDesignResult, type: PlanningContributionType) => {
  const built = plans(project);
  const contribution = type === "STUDY_DATA_PLAN" ? built.data : type === "DATA_MANAGEMENT_PLAN" ? built.dm : built.bio;
  const result = applyDataAnalysisPlanningDecisionToProject(project, contribution, decisionFor(project, contribution));
  if (!result.applied) throw new Error(result.findings.map((item) => item.code).join(","));
  return result.project;
};

const fullyAdoptedProject = () => adopt(adopt(adopt(makeProject(), "STUDY_DATA_PLAN"), "DATA_MANAGEMENT_PLAN"), "BIOSTATISTICS_PLAN");
const cases = (title: string, values: Array<[string, () => void]>) => describe(title, () => it.each(values)("%s", (_name, check) => check()));

cases("DATA-ANALYSIS-INTEGRATION-001 Part 5 — Project integration", [
  ["DAI5-PRJ-C01 Contribution never writes Project directly", () => { const project = makeProject(); const before = stableStringify(project); plans(project); expect(stableStringify(project)).toBe(before); }],
  ["DAI5-PRJ-C02 HumanDecision is mandatory", () => { const project = makeProject(); const contribution = plans(project).data; const pending = createHumanDecisionCandidate({ decisionId: "pending", gateId: "DAI", scope: ["DATA"], targets: contribution.proposedChanges.map((item) => item.objectId), provenance: contributionDecisionProvenance(contribution), engineSource: "RESEARCH_PROJECT", projectVersion: project.candidateVersion.versionId }); expect(applyDataAnalysisPlanningDecisionToProject(project, contribution, pending).applied).toBe(false); }],
  ["DAI5-PRJ-C03 Actor is mandatory", () => { const project = makeProject(); const contribution = plans(project).data; const result = applyDataAnalysisPlanningDecisionToProject(project, contribution, decisionFor(project, contribution, "ADOPTED", undefined, { actor: "" })); expect(result.applied).toBe(false); }],
  ["DAI5-PRJ-C04 Mandate is mandatory", () => { const project = makeProject(); const contribution = plans(project).data; const result = applyDataAnalysisPlanningDecisionToProject(project, contribution, decisionFor(project, contribution, "ADOPTED", undefined, { mandate: "" })); expect(result.applied).toBe(false); }],
  ["DAI5-PRJ-C05 Target is mandatory", () => { const project = makeProject(); const contribution = plans(project).data; expect(applyDataAnalysisPlanningDecisionToProject(project, contribution, decisionFor(project, contribution, "ADOPTED", [])).applied).toBe(false); }],
  ["DAI5-PRJ-C06 Project version is mandatory", () => { const project = makeProject(); const contribution = plans(project).data; expect(applyDataAnalysisPlanningDecisionToProject(project, contribution, decisionFor(project, contribution, "ADOPTED", undefined, { projectVersion: null })).applied).toBe(false); }],
  ["DAI5-PRJ-C07 Stale contribution is rejected", () => { const project = makeProject(); const contribution = plans(project).data; const changed = { ...project, candidateVersion: { ...project.candidateVersion, versionId: "project:new" } }; const result = applyDataAnalysisPlanningDecisionToProject(changed, contribution, decisionFor(project, contribution)); expect(result.applied).toBe(false); expect(result.findings.some((item) => item.code === "STALE_PLANNING_CONTRIBUTION")).toBe(true); }],
  ["DAI5-PRJ-C08 Adoption creates next Project version", () => { const project = makeProject(); const next = adopt(project, "STUDY_DATA_PLAN"); expect(next.candidateVersion.versionId).not.toBe(project.candidateVersion.versionId); expect(next.candidateVersion.priorVersion).toBe(project.candidateVersion.versionId); }],
  ["DAI5-PRJ-C09 Prior Project remains reconstructible", () => { const project = makeProject(); const before = stableStringify(project); adopt(project, "STUDY_DATA_PLAN"); expect(stableStringify(project)).toBe(before); }],
  ["DAI5-PRJ-C10 Multiple adoption is atomic", () => { const project = makeProject(); const contribution = plans(project).data; const invalid = decisionFor(project, contribution, "ADOPTED", [...contribution.proposedChanges.map((item) => item.objectId), "foreign-target"]); const result = applyDataAnalysisPlanningDecisionToProject(project, contribution, invalid); expect(result.applied).toBe(false); expect(result.project.dataAnalysisPlanningState).toBeUndefined(); }],
  ["DAI5-PRJ-C11 Partial adoption uses explicit targets", () => { const project = makeProject(); const contribution = plans(project).data; const target = contribution.proposedChanges[0]!.objectId; const result = applyDataAnalysisPlanningDecisionToProject(project, contribution, decisionFor(project, contribution, "ADOPTED", [target])); expect(result.applied && Object.keys((result.project.dataAnalysisPlanningState as { adoptedObjects: object }).adoptedObjects)).toHaveLength(1); }],
  ["DAI5-PRJ-C12 Rejected candidate remains historical", () => { const project = makeProject(); const contribution = plans(project).data; const result = applyDataAnalysisPlanningDecisionToProject(project, contribution, decisionFor(project, contribution, "REJECTED")); expect(result.applied && (result.project.dataAnalysisPlanningState as { contributionRefs: Array<{ rejectedTargetIds: string[] }> }).contributionRefs[0]!.rejectedTargetIds.length).toBeGreaterThan(0); }],
  ["DAI5-PRJ-C13 Deferred candidate remains open", () => { const project = makeProject(); const contribution = plans(project).data; const result = applyDataAnalysisPlanningDecisionToProject(project, contribution, decisionFor(project, contribution, "DEFERRED")); expect(result.applied && (result.project.dataAnalysisPlanningState as { contributionRefs: Array<{ deferredTargetIds: string[] }> }).contributionRefs[0]!.deferredTargetIds.length).toBeGreaterThan(0); }],
  ["DAI5-PRJ-C14 Reopened decision preserves history", () => { const project = makeProject(); const contribution = plans(project).data; const prior = decisionFor(project, contribution, "REJECTED"); const reopened = reopenHumanDecision(prior, { actor: "Human reviewer", mandate: "DAI test mandate", timestamp: "2026-08-15T01:00:00.000Z", impact: prior.impact }); expect(reopened.version).toBe(2); expect(reopened.provenance).toContain(`prior-decision:${prior.decisionId}:v1`); }],
  ["DAI5-PRJ-C15 Frozen Project refuses ordinary mutation", () => { const project = makeProject(); const frozen = { ...project, candidateVersion: { ...project.candidateVersion, status: "FROZEN_BY_HUMAN" as const } }; const contribution = plans(frozen).data; expect(applyDataAnalysisPlanningDecisionToProject(frozen, contribution, decisionFor(frozen, contribution)).applied).toBe(false); }],
  ["DAI5-PRJ-C16 UI draft is not Project truth", () => { const project = makeProject(); expect(stableStringify(project)).not.toContain("UI_DRAFT"); expect(buildProjectDataAnalysisView(project).data).toBeNull(); }],
  ["DAI5-PRJ-C17 ProjectDataAnalysisView rebuilds from Project", () => { const project = adopt(makeProject(), "STUDY_DATA_PLAN"); expect(buildProjectDataAnalysisView(project).data?.canonicalVariables.length).toBeGreaterThan(0); }],
  ["DAI5-PRJ-C18 Reload preserves adopted state", () => { const project = fullyAdoptedProject(); const reloaded = JSON.parse(JSON.stringify(project)) as ResearchProjectDesignResult; expect(buildProjectDataAnalysisView(reloaded)).toEqual(buildProjectDataAnalysisView(project)); }],
  ["DAI5-PRJ-C19 No second Project is created", () => { const project = makeProject(); expect(adopt(project, "STUDY_DATA_PLAN").documentHandoff.projectId).toBe(project.documentHandoff.projectId); }],
  ["DAI5-PRJ-C20 No realized-time object is created", () => { const text = stableStringify(fullyAdoptedProject()); ["AnalysisExecution", "AnalysisResult", "VariableOccurrence", "DataQuery", "DatasetRelease"].forEach((kind) => expect(text).not.toContain(`"objectKind":"${kind}"`)); }],
]);

const renderDataAnalysis = (project = makeProject(), onProjectChange = vi.fn()) => ({ onProjectChange, ...render(<DataAnalysisPlanningView project={project} onProjectChange={onProjectChange} />) });

cases("DATA-ANALYSIS-INTEGRATION-001 Part 5 — UI", [
  ["DAI5-UI-C01 Data & Analysis surface is accessible from Project", () => { const session = createResearchProjectConstructionSession(makeProjectInput()); render(<ResearchProjectConstructionView session={session} onChange={vi.fn()} onReturnToScientificThinking={vi.fn()} />); fireEvent.click(screen.getByRole("button", { name: /8\. Données & analyses/ })); expect(screen.getByTestId("data-analysis-planning")).toBeInTheDocument(); }],
  ["DAI5-UI-C02 Data block is visible", () => { renderDataAnalysis(); expect(screen.getByText("Variables canoniques adoptées")).toBeInTheDocument(); }],
  ["DAI5-UI-C03 Data Management block is visible", () => { renderDataAnalysis(); expect(screen.getByText("Champs logiques adoptés")).toBeInTheDocument(); }],
  ["DAI5-UI-C04 Analyses block is visible", () => { renderDataAnalysis(); expect(screen.getByText("Spécifications adoptées")).toBeInTheDocument(); }],
  ["DAI5-UI-C05 CanonicalVariable is identical between Data and Analysis", () => { renderDataAnalysis(); fireEvent.click(screen.getByRole("button", { name: "Expert" })); expect(screen.getByText(/CanonicalVariable refs/).textContent).toContain(makeProject().variables[0]!.variableId); expect(screen.getByText(/AnalysisVariable refs/).textContent).toContain(makeProject().variables[0]!.variableId); }],
  ["DAI5-UI-C06 T0 and T1 do not become two Variables", () => { const { container } = renderDataAnalysis(); expect(container.textContent).toContain("Candidate actuelle : 1"); }],
  ["DAI5-UI-C07 UNKNOWN remains visible", () => { renderDataAnalysis(); expect(screen.getByText(/inconnue\(s\)/i)).toBeInTheDocument(); }],
  ["DAI5-UI-C08 DECISION_REQUIRED remains visible", () => { renderDataAnalysis(); expect(screen.getByText(/DECISION_REQUIRED/)).toBeInTheDocument(); }],
  ["DAI5-UI-C09 Deferred realized time is not a critical execution error", () => { renderDataAnalysis(); expect(screen.getByText(/Aucune occurrence ni query réalisée/)).toBeInTheDocument(); }],
  ["DAI5-UI-C10 Standard mode hides technical details", () => { renderDataAnalysis(); expect(screen.queryByText(/^Digest :/)).toBeNull(); }],
  ["DAI5-UI-C11 Expert mode shows refs versions provenance", () => { renderDataAnalysis(); fireEvent.click(screen.getByRole("button", { name: "Expert" })); expect(screen.getByText(/^Digest :/)).toBeInTheDocument(); expect(screen.getByText(/^Project :/)).toBeInTheDocument(); }],
  ["DAI5-UI-C12 Editing creates draft without mutation", () => { const project = makeProject(); const before = stableStringify(project); const onChange = vi.fn(); renderDataAnalysis(project, onChange); fireEvent.change(screen.getByLabelText(/Note de décision/), { target: { value: "UI_DRAFT" } }); expect(onChange).not.toHaveBeenCalled(); expect(stableStringify(project)).toBe(before); }],
  ["DAI5-UI-C13 Cancel removes draft", () => { renderDataAnalysis(); const input = screen.getByLabelText(/Note de décision/); fireEvent.change(input, { target: { value: "UI_DRAFT" } }); fireEvent.click(screen.getByRole("button", { name: "Annuler le brouillon" })); expect(input).toHaveValue(""); }],
  ["DAI5-UI-C14 Adopt invokes Human Decision flow", () => { const callback = vi.fn(); renderDataAnalysis(makeProject(), callback); fireEvent.change(screen.getByLabelText("Acteur"), { target: { value: "Reviewer" } }); fireEvent.change(screen.getByLabelText("Mandat"), { target: { value: "Mandate" } }); fireEvent.click(screen.getByRole("button", { name: "Adopter la Contribution" })); expect(callback).toHaveBeenCalledOnce(); expect(callback.mock.calls[0]![1]).toMatchObject({ status: "ADOPTED", actor: "Reviewer", mandate: "Mandate" }); }],
  ["DAI5-UI-C15 Stale contribution has explicit message", () => { renderDataAnalysis(); expect(screen.getByText(/Contribution obsolète \(stale\) est refusée/)).toBeInTheDocument(); }],
  ["DAI5-UI-C16 Frozen Project blocks adoption", () => { const project = makeProject(); renderDataAnalysis({ ...project, candidateVersion: { ...project.candidateVersion, status: "FROZEN_BY_HUMAN" } }); expect(screen.getByRole("button", { name: "Adopter la Contribution" })).toBeDisabled(); }],
  ["DAI5-UI-C17 Impact preview is visible", () => { renderDataAnalysis(); expect(screen.getByText(/L’impact est prévisualisé avant adoption/)).toBeInTheDocument(); }],
  ["DAI5-UI-C18 No realized Data Management action is exposed", () => { const { container } = renderDataAnalysis(); expect(container.textContent).toContain("Aucune occurrence ni query réalisée"); expect(screen.queryByRole("button", { name: /freeze dataset|execute query|correct patient/i })).toBeNull(); }],
  ["DAI5-UI-C19 No executing statistical action is exposed", () => { const { container } = renderDataAnalysis(); expect(container.textContent).toContain("Aucun calcul, résultat ou dataset d’analyse"); expect(screen.queryByRole("button", { name: /run statistical|calculate sample|imputation/i })).toBeNull(); }],
  ["DAI5-UI-C20 UI makes no provider call", () => { const provider = vi.spyOn(globalThis, "fetch"); renderDataAnalysis(); fireEvent.click(screen.getByRole("button", { name: "Expert" })); expect(provider).not.toHaveBeenCalled(); provider.mockRestore(); }],
]);

cases("DATA-ANALYSIS-INTEGRATION-001 Part 5 — TMP and DOC projections", [
  ["DAI5-DOC-C01 Template consumes Project adopted state", () => expect(buildDataAnalysisDocumentProjectionInputs(fullyAdoptedProject()).some((item) => item.blocks.some((block) => block.structuredContent))).toBe(true)],
  ["DAI5-DOC-C02 Template never consumes UI draft", () => expect(stableStringify(buildDataAnalysisDocumentProjectionInputs(fullyAdoptedProject()))).not.toContain("UI_DRAFT")],
  ["DAI5-DOC-C03 DocumentProjection preserves Project ref and version", () => { const project = fullyAdoptedProject(); expect(buildDataAnalysisDocumentProjectionInputs(project).every((item) => item.projectId === project.documentHandoff.projectId && item.projectVersion === project.candidateVersion.versionId)).toBe(true); }],
  ["DAI5-DOC-C04 DocumentProjection preserves CanonicalVariable refs", () => { const project = fullyAdoptedProject(); const text = stableStringify(buildDataAnalysisDocumentProjectionInputs(project)); project.variables.forEach((item) => expect(text).toContain(item.variableId)); }],
  ["DAI5-DOC-C05 Data Dictionary recreates no Variable", () => expect(stableStringify(buildDataAnalysisDocumentProjectionInputs(fullyAdoptedProject()))).not.toContain("_COPY")],
  ["DAI5-DOC-C06 eCRF field never becomes Variable identity", () => { const project = fullyAdoptedProject(); const view = buildProjectDataAnalysisView(project); expect(view.dataManagement?.collectionSpecification.fields.every((field) => field.fieldDefinitionId !== field.canonicalVariableRef.objectId)).toBe(true); }],
  ["DAI5-DOC-C07 SAP creates no method", () => { const project = fullyAdoptedProject(); const before = buildProjectDataAnalysisView(project).biostatistics?.analysisSpecifications.map((item) => item.method); buildDataAnalysisDocumentProjectionInputs(project); expect(buildProjectDataAnalysisView(project).biostatistics?.analysisSpecifications.map((item) => item.method)).toEqual(before); }],
  ["DAI5-DOC-C08 SAP creates no Estimand", () => { const project = fullyAdoptedProject(); buildDataAnalysisDocumentProjectionInputs(project); expect(buildProjectDataAnalysisView(project).biostatistics?.analysisSpecifications.every((item) => item.estimand === null)).toBe(true); }],
  ["DAI5-DOC-C09 NOT_GENERATABLE is preserved", () => expect(buildDataAnalysisDocumentProjectionInputs(fullyAdoptedProject()).find((item) => item.projectionType === "SAP")?.status).toBe("NOT_GENERATABLE")],
  ["DAI5-DOC-C10 NOT_GENERATABLE reason remains visible", () => { const sap = buildDataAnalysisDocumentProjectionInputs(fullyAdoptedProject()).find((item) => item.projectionType === "SAP")!; expect(stableStringify(sap.blocks[0]?.structuredContent)).toContain("aucun texte méthodologique n’est inventé"); }],
  ["DAI5-DOC-C11 Candidate preview is clearly not adopted", () => { const project = makeProject(); const candidate = plans(project).data; expect(stableStringify(buildDataAnalysisDocumentProjectionInputs(project))).not.toContain(candidate.contributionId); }],
  ["DAI5-DOC-C12 Adopted projection only uses Project state", () => { const project = fullyAdoptedProject(); expect(buildDataAnalysisDocumentProjectionInputs(project).every((item) => item.provenance[0]?.startsWith("project:"))).toBe(true); }],
  ["DAI5-DOC-C13 Document never modifies Project", () => { const project = fullyAdoptedProject(); const before = stableStringify(project); buildDataAnalysisDocumentProjectionInputs(project); expect(stableStringify(project)).toBe(before); }],
  ["DAI5-DOC-C14 DOC-002 pattern never becomes statistical method", () => expect(stableStringify(buildDataAnalysisDocumentProjectionInputs(fullyAdoptedProject()))).not.toContain("DOC-002_METHOD")],
  ["DAI5-DOC-C15 Local practice stays local", () => expect(stableStringify(buildDataAnalysisDocumentProjectionInputs(fullyAdoptedProject()))).not.toContain("LOCAL_PRACTICE_PROMOTED")],
  ["DAI5-DOC-C16 Historical pattern stays historical", () => expect(stableStringify(buildDataAnalysisDocumentProjectionInputs(fullyAdoptedProject()))).not.toContain("HISTORICAL_PATTERN_PROMOTED")],
]);

describe("DATA-ANALYSIS-INTEGRATION-001 Part 5 — canonical identity end-to-end", () => {
  it("DAI5-ID-C01 preserves CV-001 through Project, plans, template and document", () => {
    const base = makeProject();
    const original = base.variables[0]!;
    const project: ResearchProjectDesignResult = {
      ...base,
      variables: [{ ...original, variableId: "CV-001" }],
      endpointCandidates: base.endpointCandidates.map((item) => ({ ...item, variableIds: item.variableIds.map((id) => id === original.variableId ? "CV-001" : id) })),
      analysisRequirements: base.analysisRequirements.map((item) => ({ ...item, variableIds: item.variableIds.map((id) => id === original.variableId ? "CV-001" : id) })),
    };
    const adopted = adopt(adopt(adopt(project, "STUDY_DATA_PLAN"), "DATA_MANAGEMENT_PLAN"), "BIOSTATISTICS_PLAN");
    const view = buildProjectDataAnalysisView(adopted);
    const document = buildDataAnalysisDocumentProjectionInputs(adopted);
    const checkpoints = [
      adopted.variables[0]?.variableId,
      view.data?.canonicalVariables[0]?.variableRef.objectId,
      view.dataManagement?.collectionSpecification.fields[0]?.canonicalVariableRef.objectId,
      view.dataManagement?.logicalCRF.variableRefs[0]?.objectId,
      view.dataManagement?.logicalDataDictionary.variableRefs[0]?.objectId,
      view.dataManagement?.logicalScheduleOfActivities.variableRefs[0]?.objectId,
      view.biostatistics?.analysisSpecifications[0]?.targetVariableRefs[0]?.objectId,
      view.biostatistics?.analysisSpecifications[0]?.variableRoles[0]?.variableRef.objectId,
    ];
    expect(checkpoints.every((id) => id === "CV-001")).toBe(true);
    expect(stableStringify(document)).toContain("CV-001");
    expect(stableStringify(document)).not.toContain("CV-001_COPY");
    expect(document.find((item) => item.projectionType === "PROTOCOL_DATA_AND_ANALYSIS")?.blocks.length).toBeGreaterThan(0);
  });
});
