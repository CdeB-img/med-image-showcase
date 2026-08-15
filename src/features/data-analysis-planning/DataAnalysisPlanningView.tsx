import { useMemo, useState } from "react";
import { createHumanDecisionCandidate, engageHumanDecision, type HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import { buildBiostatisticsPlanningContribution } from "./biostatistics";
import { buildDataAnalysisPlanningContext, digestPlanningValue } from "./contracts";
import { buildDataManagementPlanningContribution } from "./data-management";
import { buildDataAnalysisDocumentProjectionInputs } from "./projections";
import { applyDataAnalysisPlanningDecisionToProject, buildProjectDataAnalysisView, contributionDecisionProvenance } from "./project-integration";
import { buildStudyDataPlanContribution } from "./study-data";
import type { DataAnalysisPlanningContribution, PlanningContributionType } from "./types";

type Props = {
  project: ResearchProjectDesignResult;
  onProjectChange: (project: ResearchProjectDesignResult, decision: HumanDecisionEnvelope) => void;
};

const labels: Record<PlanningContributionType, string> = {
  STUDY_DATA_PLAN: "Données",
  DATA_MANAGEMENT_PLAN: "Data Management",
  BIOSTATISTICS_PLAN: "Analyses",
};

const Card = ({ children }: { children: React.ReactNode }) => <section className="rounded-xl border bg-card p-4">{children}</section>;
const codeLabel = (value: string) => value.replace(/_/g, " ").toLocaleLowerCase("fr-FR");

export default function DataAnalysisPlanningView({ project, onProjectChange }: Props) {
  const [mode, setMode] = useState<"STANDARD" | "EXPERT">("STANDARD");
  const [category, setCategory] = useState<PlanningContributionType>("STUDY_DATA_PLAN");
  const [actor, setActor] = useState("");
  const [mandate, setMandate] = useState("");
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const candidates = useMemo(() => {
    const context = buildDataAnalysisPlanningContext(project);
    const data = buildStudyDataPlanContribution(context);
    const dataManagement = buildDataManagementPlanningContribution(context, data);
    const biostatistics = buildBiostatisticsPlanningContribution(context, data, dataManagement);
    return { STUDY_DATA_PLAN: data, DATA_MANAGEMENT_PLAN: dataManagement, BIOSTATISTICS_PLAN: biostatistics } satisfies Record<PlanningContributionType, DataAnalysisPlanningContribution>;
  }, [project]);
  const view = useMemo(() => buildProjectDataAnalysisView(project), [project]);
  const documents = useMemo(() => buildDataAnalysisDocumentProjectionInputs(project), [project]);
  const contribution = candidates[category];
  const adopted = new Set(view.contributionRefs.flatMap((item) => item.adoptedTargetIds));

  const decide = (status: "ADOPTED" | "REJECTED" | "DEFERRED") => {
    if (!actor.trim() || !mandate.trim()) return;
    const targets = contribution.proposedChanges.map((item) => item.objectId);
    const candidate = createHumanDecisionCandidate({
      decisionId: `data-analysis-decision:${digestPlanningValue({ contribution: contribution.contributionId, status, project: project.candidateVersion.versionId })}`,
      gateId: `DAI-GATE-${category}`,
      scope: [category, "RESEARCH_PROJECT"],
      targets,
      reason: draft.trim() || `Décision humaine ${status} sur la Contribution ${category}.`,
      provenance: contributionDecisionProvenance(contribution),
      engineSource: "RESEARCH_PROJECT",
      projectVersion: project.candidateVersion.versionId,
      impact: { affectedObjects: targets, affectedEngines: ["RESEARCH_PROJECT", "DOCUMENT"], reopenedGates: ["PRJ-GATE-DOCUMENT-HANDOFF"], obsoleteProjections: documents.map((item) => item.projectionId) },
    });
    const decision = engageHumanDecision(candidate, { status, actor, mandate, reason: draft, timestamp: new Date().toISOString() });
    const result = applyDataAnalysisPlanningDecisionToProject(project, contribution, decision);
    if (!result.applied) {
      setMessage(result.findings.map((item) => item.message).join(" "));
      return;
    }
    onProjectChange(result.project, decision);
    setDraft("");
    setMessage(status === "ADOPTED" ? "Contribution adoptée dans une nouvelle version candidate du Project." : status === "REJECTED" ? "Contribution refusée et décision tracée." : "Contribution différée et décision tracée.");
  };

  return <section data-testid="data-analysis-planning" aria-labelledby="data-analysis-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 id="data-analysis-title" className="text-2xl font-bold">Données & analyses</h3><p className="mt-1 text-muted-foreground">Plans de design-time, décisions humaines et projections documentaires. Aucune donnée réalisée ni analyse n’est exécutée.</p></div>
      <div className="flex rounded-lg border p-1" aria-label="Niveau de détail"><button type="button" aria-pressed={mode === "STANDARD"} onClick={() => setMode("STANDARD")} className="rounded px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Standard</button><button type="button" aria-pressed={mode === "EXPERT"} onClick={() => setMode("EXPERT")} className="rounded px-3 py-2 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Expert</button></div>
    </div>

    {project.candidateVersion.status === "FROZEN_BY_HUMAN" && <p role="alert" className="mt-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">Cette version Project est gelée. Ouvrez une nouvelle version candidate avant toute adoption.</p>}
    <div className="mt-5 flex flex-wrap gap-2" aria-label="Plans Data & Analysis">{(Object.keys(labels) as PlanningContributionType[]).map((type) => <button type="button" key={type} aria-pressed={category === type} onClick={() => setCategory(type)} className="rounded-full border px-3 py-2 text-sm aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">{labels[type]}</button>)}</div>

    <div className="mt-5 grid gap-4 lg:grid-cols-3">
      <Card><p className="text-xs font-semibold uppercase text-muted-foreground">Données</p><p className="mt-2 text-2xl font-bold">{view.data?.canonicalVariables.length ?? 0}</p><p className="text-sm">Variables canoniques adoptées</p><p className="mt-2 text-xs text-muted-foreground">Candidate actuelle : {candidates.STUDY_DATA_PLAN.content.canonicalVariables.length}</p></Card>
      <Card><p className="text-xs font-semibold uppercase text-muted-foreground">Data Management</p><p className="mt-2 text-2xl font-bold">{view.dataManagement?.collectionSpecification.fields.length ?? 0}</p><p className="text-sm">Champs logiques adoptés</p><p className="mt-2 text-xs text-muted-foreground">Aucune occurrence ni query réalisée.</p></Card>
      <Card><p className="text-xs font-semibold uppercase text-muted-foreground">Analyses</p><p className="mt-2 text-2xl font-bold">{view.biostatistics?.analysisSpecifications.length ?? 0}</p><p className="text-sm">Spécifications adoptées</p><p className="mt-2 text-xs text-muted-foreground">Aucun calcul, résultat ou dataset d’analyse.</p></Card>
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <Card><h4 className="font-semibold">Contribution candidate — {labels[category]}</h4><p className="mt-2 text-sm">{contribution.proposedChanges.length} objet(s) proposés · statut {codeLabel(contribution.content.readiness.overallStatus)}</p>{contribution.content.decisionsRequired.length > 0 && <p className="mt-2 text-sm font-medium text-amber-700">DECISION_REQUIRED · {contribution.content.decisionsRequired.length} décision(s) explicite(s)</p>}{contribution.content.readiness.blockingItems.slice(0, 5).map((item) => <p key={item} className="mt-2 text-sm text-amber-700">Blocage : {item}</p>)}{contribution.content.readiness.warningItems.slice(0, 5).map((item) => <p key={item} className="mt-2 text-sm text-muted-foreground">Ouvert : {item}</p>)}</Card>
      <Card><h4 className="font-semibold">Readiness Project</h4><p className="mt-2 text-sm">{codeLabel(view.readiness.overallStatus)} · {view.readiness.blockingCount} blocage(s) · {view.readiness.unknownCount} inconnue(s)</p><p className="mt-2 text-sm">{view.decisions.length} décision(s) Data & Analysis tracée(s).</p><p className="mt-2 text-sm">{adopted.size} objet(s) adopté(s).</p></Card>
    </div>

    <Card><div className="mt-1"><h4 className="font-semibold">Documents dérivés</h4><div className="mt-3 grid gap-2 sm:grid-cols-2">{documents.map((item) => <div key={item.projectionId} className="rounded-lg border p-3"><p className="font-medium">{item.blocks[0]?.label}</p><p className="mt-1 text-xs text-muted-foreground">{codeLabel(item.status)} · projection uniquement</p></div>)}</div></div></Card>

    <div className="mt-5 rounded-xl border p-4"><h4 className="font-semibold">Décision humaine</h4><p className="mt-2 text-xs text-muted-foreground">L’impact est prévisualisé avant adoption : une nouvelle version candidate est créée et les projections documentaires antérieures deviennent obsolètes. Une Contribution obsolète (stale) est refusée explicitement.</p><label htmlFor="dai-actor" className="mt-3 block text-sm">Acteur</label><input id="dai-actor" value={actor} onChange={(event) => setActor(event.target.value.slice(0, 120))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2" /><label htmlFor="dai-mandate" className="mt-3 block text-sm">Mandat</label><input id="dai-mandate" value={mandate} onChange={(event) => setMandate(event.target.value.slice(0, 200))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2" /><label htmlFor="dai-draft" className="mt-3 block text-sm">Note de décision — brouillon local</label><textarea id="dai-draft" value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 1000))} className="mt-1 min-h-20 w-full rounded-lg border bg-background p-3" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!actor.trim() || !mandate.trim() || project.candidateVersion.status === "FROZEN_BY_HUMAN"} onClick={() => decide("ADOPTED")} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Adopter la Contribution</button><button type="button" disabled={!actor.trim() || !mandate.trim()} onClick={() => decide("REJECTED")} className="rounded-lg border px-4 py-2 disabled:opacity-50">Refuser</button><button type="button" disabled={!actor.trim() || !mandate.trim()} onClick={() => decide("DEFERRED")} className="rounded-lg border px-4 py-2 disabled:opacity-50">Différer</button><button type="button" onClick={() => { setDraft(""); setMessage("Brouillon annulé ; le Project est inchangé."); }} className="rounded-lg border px-4 py-2">Annuler le brouillon</button></div>{message && <p role="status" className="mt-3 text-sm">{message}</p>}</div>

    {mode === "EXPERT" && <details open className="mt-5 rounded-xl border p-4"><summary className="font-semibold">Identités, provenance et limites</summary><p className="mt-3 break-all text-xs">Project : {project.documentHandoff.projectId}@{project.candidateVersion.versionId}</p><p className="mt-2 break-all text-xs">Contribution : {contribution.contributionId}</p><p className="mt-2 break-all text-xs">Digest : {contribution.integrity.contributionDigest}</p><p className="mt-2 break-all text-xs">CanonicalVariable refs : {candidates.STUDY_DATA_PLAN.content.canonicalVariables.map((item) => item.variableRef.objectId).join(", ") || "aucune"}</p><p className="mt-2 break-all text-xs">AnalysisVariable refs : {candidates.BIOSTATISTICS_PLAN.content.analysisSpecifications.flatMap((item) => item.targetVariableRefs.map((ref) => ref.objectId)).join(", ") || "aucune"}</p><p className="mt-2 text-xs">Owner : {contribution.governance.owner} · sourceOfTruth=false · projectWriteAuthorized=false avant décision</p>{view.unknowns.slice(0, 8).map((item) => <p key={item} className="mt-2 text-xs text-muted-foreground">Inconnue : {item}</p>)}</details>}
  </section>;
}
