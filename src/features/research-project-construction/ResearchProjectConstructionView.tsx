import { useMemo, useState } from "react";
import AdaptiveResearchWorkspace from "@/features/adaptive-research-workspace/AdaptiveResearchWorkspace";
import { buildAdaptiveResearchWorkspaceProjection } from "@/features/adaptive-research-workspace/projection";
import WorkspaceNextActionInteraction from "@/features/adaptive-research-workspace/WorkspaceNextActionInteraction";
import DataAnalysisPlanningView from "@/features/data-analysis-planning/DataAnalysisPlanningView";
import { buildProjectDataAnalysisView } from "@/features/data-analysis-planning/project-integration";
import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import { buildQueryNavigationProductProjection } from "@/features/query-navigation/product";
import { buildValidationProductSummary } from "@/features/validation-architecture/product-gates";
import { decideProjectChange, decideProjectGate, proposeEndpointRole, proposeStudyDesign, requestProjectChange } from "./session";
import type { ResearchProjectConstructionSession, SpecializedEvaluationState } from "./types";

const STAGES = ["Question scientifique", "Population", "Design", "Groupes et temporalité", "Critères et mesures", "Faisabilité", "Risques et alternatives", "Données & analyses", "Stratégie de projet"] as const;
const stateLabel: Record<SpecializedEvaluationState, string> = {
  READY: "Prêt", READY_WITH_OPEN_ITEMS: "Prêt avec éléments ouverts", READY_WITH_LIMITATIONS: "Prêt avec limites", PARTIAL: "Partiel", SPECIALIZED_ENGINE_REQUIRED: "Moteur spécialisé requis", NOT_EVALUATED_BY_SPECIALIZED_ENGINE: "Non évalué par le moteur spécialisé", NOT_APPLICABLE: "Non applicable", BLOCKED: "Bloqué",
};
const projectStatusLabel = { PROJECT_CANDIDATES: "Stratégies candidates", PARTIAL_PROJECT: "Projet partiel", REFUSED: "Construction suspendue" } as const;
const versionStatusLabel = { CANDIDATE_NOT_FROZEN: "Version candidate", FROZEN_BY_HUMAN: "Version gelée par décision humaine" } as const;
const documentStatusLabel = { NOT_READY: "Handoff non disponible", READY_FOR_HUMAN_AUTHORIZATION: "Autorisation humaine requise", AUTHORIZED: "Handoff autorisé" } as const;
const projectionStatusLabel = { NOT_AVAILABLE: "Non disponible", STRUCTURE_ONLY: "Structure disponible", PARTIALLY_GENERATABLE: "Partiellement générable", READY_FOR_PROJECTION: "Prête pour projection" } as const;
const humanizeCode = (value: string) => value.replace(/_/g, " ").toLocaleLowerCase("fr-FR");
const Card = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLElement>) => <section {...props} className={`min-w-0 break-words rounded-2xl border bg-card p-5 shadow-sm ${className}`}>{children}</section>;
const Pill = ({ children, warning = false }: { children: React.ReactNode; warning?: boolean }) => <span className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-xs font-medium ${warning ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200" : "border-border bg-muted text-muted-foreground"}`}>{children}</span>;

type Props = {
  session: ResearchProjectConstructionSession;
  onChange: (session: ResearchProjectConstructionSession) => void;
  onReturnToScientificThinking: () => void;
  onReturnToImaging?: () => void;
  onExploreKnowledge?: () => void;
  onOpenDocument?: () => void;
};

export default function ResearchProjectConstructionView({ session, onChange, onReturnToScientificThinking, onReturnToImaging, onExploreKnowledge, onOpenDocument }: Props) {
  const [stage, setStage] = useState(0);
  const [actor, setActor] = useState("");
  const [mandate, setMandate] = useState("");
  const [reason, setReason] = useState("");
  const result = session.result;
  const pendingChange = result.impactGraph.changes.find((item) => item.status === "PENDING_CONFIRMATION");
  const currentDecision = result.decisionsRequired.find((item) => item.status === "PENDING");
  const selectedCandidateId = session.controls.selectedDesignId ?? null;
  const selectedPrimaryEndpointId = Object.entries(session.controls.endpointRoles ?? {}).find(([, role]) => role === "PRIMARY_CANDIDATE")?.[0] ?? null;
  const navigationProjection = useMemo(() => buildQueryNavigationProductProjection(result), [result]);
  const validationSummary = useMemo(() => buildValidationProductSummary([]), []);
  const dataAnalysisProjection = useMemo(() => buildProjectDataAnalysisView(result), [result]);
  const workspaceProjection = useMemo(() => buildAdaptiveResearchWorkspaceProjection({
    project: result,
    navigation: navigationProjection,
    validation: validationSummary,
    dataAnalysis: dataAnalysisProjection,
  }), [dataAnalysisProjection, navigationProjection, result, validationSummary]);

  const openWorkspaceTarget = (targetRef: string) => {
    if (targetRef.includes("data-analysis") || targetRef.includes("BIOSTATISTICS") || targetRef.includes("DATA_MANAGEMENT")) setStage(7);
    else if (targetRef.includes("document") || targetRef.includes("projection")) setStage(8);
    else if (targetRef.includes("decision")) setStage(2);
    else if (targetRef.includes("IMAGING") && onReturnToImaging) onReturnToImaging();
    else if (targetRef.includes("unknown") || targetRef.includes("contradiction")) setStage(0);
    else setStage(5);
  };

  const decide = (decision: "APPROVED" | "REJECTED") => {
    if (!currentDecision || !actor.trim() || !mandate.trim() || !reason.trim()) return;
    onChange(decideProjectGate(session, currentDecision.gateId, decision, reason, actor, mandate));
    setReason("");
  };

  const triggerEndpointChange = () => {
    const endpoint = result.endpointCandidates[0];
    if (!endpoint) return;
    onChange(requestProjectChange(session, { eventType: "EndpointChanged", description: `Modification proposée du Critère candidat « ${endpoint.label} ».`, sourceIds: [endpoint.endpointId], targetIds: [endpoint.endpointId] }));
  };

  const updateDataAnalysisProject = (nextProject: typeof result, decision: HumanDecisionEnvelope) => onChange({
    ...session,
    result: nextProject,
    controls: {
      ...session.controls,
      dataAnalysisPlanningState: nextProject.dataAnalysisPlanningState,
      priorFrozenVersionId: result.candidateVersion.versionId,
      frozenVersion: null,
      decisionRecords: [...(session.controls.decisionRecords ?? []), decision],
      decisionRecordIds: [...new Set([...(session.controls.decisionRecordIds ?? []), decision.decisionId])],
      versionDecisionRecordIds: [...new Set([...(session.controls.versionDecisionRecordIds ?? []), decision.decisionId])],
    },
    decisionHistory: [...session.decisionHistory, decision],
    versionHistory: [...session.versionHistory, result.candidateVersion],
    revisions: session.revisions + 1,
  });

  if (result.refusal) return <div className="mt-8" data-testid="research-project-construction" role="alert">
    <Card className="border-amber-500/50"><Pill warning>Construction suspendue</Pill><h2 className="mt-3 text-2xl font-bold">Le projet ne peut pas être complété artificiellement.</h2><p className="mt-3">{result.refusal.reason}</p><p className="mt-2 text-sm text-muted-foreground">Pour reprendre : {result.refusal.resumeCondition}</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={onReturnToScientificThinking} className="rounded-lg border px-4 py-2">Revenir à Scientific Thinking</button>{onReturnToImaging && <button type="button" onClick={onReturnToImaging} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Revenir à Imaging</button>}</div></Card>
  </div>;

  return <div className="mt-8 min-w-0" data-testid="research-project-construction">
    <AdaptiveResearchWorkspace
      projection={workspaceProjection}
      validation={validationSummary}
      navigation={<WorkspaceNextActionInteraction
        projection={navigationProjection}
        currentProjectVersion={result.candidateVersion.versionId}
        currentSourceStateDigest={navigationProjection.sourceStateDigest}
        onOpenTarget={openWorkspaceTarget}
        onChooseNavigationPreference={(candidateRef) => openWorkspaceTarget(navigationProjection.alternatives.find((item) => item.candidateId === candidateRef)?.targetRef ?? "project:construction")}
      />}
      onOpenSurface={openWorkspaceTarget}
      onOpenDocument={(targetRef) => targetRef === "document:protocol" && onOpenDocument && result.documentHandoff.status === "AUTHORIZED" ? onOpenDocument() : setStage(8)}
    />

    <Card className="mt-5">
      <div aria-label="Carte secondaire du projet"><div className="flex items-center justify-between gap-3 text-sm"><span>Carte du projet</span><span aria-live="polite">Étape {stage + 1} sur environ {STAGES.length}</span></div><p className="mt-2 text-sm text-muted-foreground">Cette carte ouvre une vue spécialisée. QRY reste propriétaire de la prochaine action scientifique.</p><ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{STAGES.map((label, index) => <li key={label}><button type="button" onClick={() => setStage(index)} aria-current={stage === index ? "page" : undefined} className={`min-h-11 w-full rounded-lg border px-3 py-2 text-left text-sm ${stage === index ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{index + 1}. {label}</button></li>)}</ol></div>
    </Card>

    <Card className="mt-5"><h3 className="font-semibold">Mandat de l’acteur humain</h3><p className="mt-2 text-sm text-muted-foreground">La porte peut rester candidate sans acteur ni mandat. Dès qu’une décision produit un effet sur le projet, son gel, un handoff ou une projection, les deux deviennent obligatoires.</p><label htmlFor="project-decision-mandate" className="mt-4 block text-sm font-medium">Mandat</label><input id="project-decision-mandate" value={mandate} onChange={(event) => setMandate(event.target.value.slice(0, 160))} className="mt-2 w-full rounded-lg border bg-background px-3 py-2" /></Card>

    <div className="mt-6" aria-live="polite" aria-atomic="false">
      {stage === 0 && <><h3 className="text-2xl font-bold">Question, Objectifs et Hypothèses</h3><p className="mt-1 text-muted-foreground">La Question reste la racine ; le moteur construit l’étude en aval sans la reformuler.</p><Card className="mt-4"><Pill>Question confirmée</Pill><h4 className="mt-3 text-lg font-semibold">{result.scientificQuestion.text}</h4><div className="mt-4 grid gap-4 md:grid-cols-2"><div><h5 className="font-semibold">Objectifs</h5>{result.objectives.length ? result.objectives.map((item) => <p key={item.objectiveId} className="mt-2 text-sm">• {item.text} <span className="text-muted-foreground">({item.level})</span></p>) : <p className="mt-2 text-sm text-amber-700">Aucun Objectif adopté.</p>}</div><div><h5 className="font-semibold">Hypothèses</h5>{result.hypotheses.length ? result.hypotheses.map((item) => <p key={item.hypothesisId} className="mt-2 text-sm">• {item.text} <span className="text-muted-foreground">({item.kind})</span></p>) : <p className="mt-2 text-sm text-amber-700">Aucune Hypothèse adoptée.</p>}</div></div><details className="mt-5 text-sm"><summary className="cursor-pointer font-medium">Niveau 3 — provenance et historique</summary><p className="mt-2 break-all">Input : {session.input.inputId}</p><p className="mt-1">Knowledge : {session.input.knowledgeResults.resultId ?? "non disponible"}</p><p className="mt-1">Imaging : {session.input.sourceHandoffs.imaging.status}</p></details></Card></>}

      {stage === 1 && <><h3 className="text-2xl font-bold">Population</h3><p className="mt-1 text-muted-foreground">Population scientifique d’abord ; critères opérationnels futurs séparés.</p><div className="mt-4 grid gap-4 lg:grid-cols-2"><Card><Pill>POPULATION_CONCEPT</Pill><h4 className="mt-3 text-lg font-semibold">Pourquoi cette Population ?</h4><p className="mt-2 text-sm">{result.populationDesign.justification}</p>{result.populationDesign.populationConcept.conditionOrPathology.map((item) => <p key={item} className="mt-2 text-sm">Condition : {item}</p>)}{result.populationDesign.populationConcept.clinicalContext.map((item) => <p key={item} className="mt-2 text-sm">Contexte : {item}</p>)}{result.populationDesign.missingInformation.map((item) => <p key={item} className="mt-2 text-sm text-amber-700">Inconnue : {item}</p>)}</Card><Card><Pill warning>OPERATIONAL_ELIGIBILITY · futur</Pill><h4 className="mt-3 text-lg font-semibold">Ce qui devra être défini plus tard</h4>{result.populationDesign.operationalEligibility.requirements.length ? result.populationDesign.operationalEligibility.requirements.map((item) => <div key={item.requirement} className="mt-3"><p className="font-medium">{item.requirement}</p><p className="mt-1 text-sm text-muted-foreground">{item.whyNeeded}</p></div>) : <p className="mt-3 text-sm text-muted-foreground">Aucune formulation d’éligibilité n’est inventée à ce stade.</p>}</Card></div></>}

      {stage === 2 && <><h3 className="text-2xl font-bold">Plans d’étude candidats</h3><p className="mt-1 text-muted-foreground">Plusieurs stratégies restent visibles. Le classement automatique est interdit.</p><div className="mt-4 grid gap-4 lg:grid-cols-2">{result.studyDesignCandidates.map((item) => <Card key={item.designId} className={selectedCandidateId === item.designId ? "border-primary" : ""}><div className="flex flex-wrap gap-2"><Pill>{humanizeCode(item.family)}</Pill>{selectedCandidateId === item.designId && <Pill>Candidat soumis à décision</Pill>}</div><h4 className="mt-3 text-lg font-semibold">{item.label}</h4><p className="mt-2 text-sm"><strong>Pourquoi :</strong> {item.whyItAnswersQuestion}</p><p className="mt-2 text-sm"><strong>Permet d’estimer :</strong> {item.estimandPurpose}</p><button type="button" aria-pressed={selectedCandidateId === item.designId} onClick={() => onChange(proposeStudyDesign(session, item.designId))} className="mt-4 rounded-lg border px-4 py-2 text-sm aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">Soumettre ce plan à la décision humaine</button><details className="mt-4 text-sm"><summary className="cursor-pointer">Niveau 2 — limites, biais et contraintes</summary>{item.limitations.map((value) => <p key={value} className="mt-2 text-muted-foreground">Limite : {value}</p>)}{item.biases.map((value) => <p key={value} className="mt-2">Biais : {value}</p>)}{item.constraints.map((value) => <p key={value} className="mt-2">Contrainte : {value}</p>)}</details></Card>)}</div></>}

      {stage === 3 && <><h3 className="text-2xl font-bold">Groupes et temporalité</h3><p className="mt-1 text-muted-foreground">Chaque groupe et chaque Visit existent pour une raison scientifique nommée.</p><div className="mt-4 grid gap-4 lg:grid-cols-2"><Card><h4 className="text-lg font-semibold">Groupes et comparateurs</h4>{result.groups.map((item) => <div key={item.groupId} className="mt-4 rounded-lg border p-3"><Pill>{humanizeCode(item.role)}</Pill><p className="mt-2 font-medium">{item.label}</p><p className="mt-1 text-sm text-muted-foreground">{item.justification}</p></div>)}</Card><Card><h4 className="text-lg font-semibold">Structure temporelle</h4><p className="mt-2 text-sm">{result.temporalStructure.rationale}</p><p className="mt-2 text-sm"><strong>Ancrage :</strong> {result.temporalStructure.anchor ?? "inconnu"}</p>{result.visits.map((item) => <div key={item.visitId} className="mt-4 rounded-lg border p-3"><div className="flex flex-wrap gap-2"><Pill>{humanizeCode(item.temporalRole)}</Pill><Pill warning={item.timingStatus !== "KNOWN"}>{humanizeCode(item.timingStatus)}</Pill></div><p className="mt-2 font-medium">{item.label}</p><p className="mt-1 text-sm text-muted-foreground">{item.justification}</p></div>)}</Card></div></>}

      {stage === 4 && <><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-2xl font-bold">Critères, Variables et analyses requises</h3><p className="mt-1 text-muted-foreground">Le Critère principal reste une proposition soumise à l’humain ; le modèle statistique reste au futur moteur.</p></div>{result.endpointCandidates.length > 0 && <button type="button" onClick={triggerEndpointChange} className="rounded-lg border px-4 py-2 text-sm">Examiner l’impact d’un changement de Critère</button>}</div><div className="mt-4 grid gap-4 lg:grid-cols-2">{result.endpointCandidates.map((item) => <Card key={item.endpointId} className={selectedPrimaryEndpointId === item.endpointId ? "border-primary" : ""}><Pill warning={item.proposedRole === "UNDECIDED_CANDIDATE"}>{humanizeCode(item.proposedRole)}</Pill><h4 className="mt-3 font-semibold">{item.label}</h4><p className="mt-2 text-sm">Variable : {item.variableIds.map((id) => result.variables.find((variable) => variable.variableId === id)?.definition).filter(Boolean).join(", ")}.</p><p className="mt-2 text-sm text-muted-foreground">{item.justification}</p><button type="button" aria-pressed={selectedPrimaryEndpointId === item.endpointId} onClick={() => onChange(proposeEndpointRole(session, item.endpointId, "PRIMARY_CANDIDATE"))} className="mt-4 rounded-lg border px-3 py-2 text-sm aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">Proposer comme Critère principal</button></Card>)}</div>{!result.endpointCandidates.length && <Card className="mt-4 border-amber-500/40"><h4 className="font-semibold">Aucun Critère construit artificiellement</h4><p className="mt-2 text-sm">Une Variable ou un outcome défendable manque ; la Question adaptative reste ouverte.</p></Card>}<details className="mt-5 rounded-2xl border bg-card p-5"><summary className="cursor-pointer text-lg font-semibold">Niveau 2 — Variables et exigences analytiques</summary><div className="mt-4 grid gap-4 md:grid-cols-2"><div>{result.variables.map((item) => <p key={item.variableId} className="mt-2 text-sm">• {item.definition} · source {humanizeCode(item.source)} · nom Data Dictionary non défini</p>)}</div><div>{result.analysisRequirements.map((item) => <p key={item.requirementId} className="mt-2 text-sm">• {humanizeCode(item.purpose)} — {item.reason}</p>)}</div></div><p className="mt-4 text-sm text-amber-700">N = {String(result.sizingRequirements.sampleSize)} · puissance = {String(result.sizingRequirements.power)} · aucune valeur statistique inventée.</p></details></>}

      {stage === 5 && <><h3 className="text-2xl font-bold">Faisabilité multidimensionnelle</h3><p className="mt-1 text-muted-foreground">Chaque domaine est évalué séparément ; aucun score global n’existe.</p><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{result.feasibilityAssessment.map((item) => <Card key={item.domain}><Pill warning={["BLOCKED", "PARTIAL", "NOT_EVALUATED_BY_SPECIALIZED_ENGINE"].includes(item.state)}>{stateLabel[item.state]}</Pill><h4 className="mt-3 font-semibold">{item.domain}</h4>{item.basis.map((value) => <p key={value} className="mt-2 text-sm">• {value}</p>)}{item.gaps.map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">Ouvert : {value}</p>)}</Card>)}</div><Card className="mt-5"><h4 className="font-semibold">Recrutement et multicentrique</h4><p className="mt-2 text-sm">Rareté : {result.recruitmentModelRequirements.raritySignal}. Nombre de centres, cadence et durée : non calculés.</p><p className="mt-2 text-sm">{result.multicenterAssessment.notice}. Alternative monocentrique préservée : {result.multicenterAssessment.monocenterAlternativePreserved ? "oui" : "non"}.</p></Card></>}

      {stage === 6 && <><h3 className="text-2xl font-bold">Risques, biais et alternatives</h3><p className="mt-1 text-muted-foreground">Seulement les éléments ayant un chemin vers le projet courant ; aucune probabilité numérique inventée.</p><div className="mt-4 grid gap-4 lg:grid-cols-2"><Card><h4 className="text-lg font-semibold">Biais et facteurs de confusion</h4>{result.biases.map((item) => <div key={item.biasId} className="mt-3"><p className="font-medium">{item.label}</p><p className="mt-1 text-sm text-muted-foreground">{item.justification}</p></div>)}{result.confounders.map((item) => <div key={item.confounderId} className="mt-3"><p className="font-medium">Confusion candidate : {item.label}</p><p className="mt-1 text-sm text-muted-foreground">{item.whyPlausible}</p></div>)}</Card><Card><h4 className="text-lg font-semibold">Risques méthodologiques</h4>{result.risks.length ? result.risks.map((item) => <div key={item.riskId} className="mt-3"><p className="font-medium">{item.source}</p><p className="mt-1 text-sm">Impact : {item.impact}</p><p className="mt-1 text-sm text-muted-foreground">Probabilité : non renseignée · mitigation candidate : {item.mitigationCandidate}</p></div>) : <p className="mt-2 text-sm text-muted-foreground">Aucun risque contextualisé supplémentaire n’a été construit.</p>}</Card></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{result.alternatives.map((item) => <Card key={item.alternativeId}><Pill>Aucune meilleure stratégie automatique</Pill><h4 className="mt-3 font-semibold">{item.label}</h4>{item.enables.map((value) => <p key={value} className="mt-2 text-sm">Permet : {value}</p>)}{item.cannotEstablish.map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">Ne permet pas d’établir : {value}</p>)}</Card>)}</div></>}

      {stage === 7 && <DataAnalysisPlanningView project={result} onProjectChange={updateDataAnalysisProject} />}

      {stage === 8 && <><h3 className="text-2xl font-bold">Stratégie de projet</h3><p className="mt-1 text-muted-foreground">Version candidate, générabilité locale et handoff propre vers Document — aucun document n’est produit ici.</p><div className="mt-4 grid gap-4 lg:grid-cols-2"><Card><div className="flex flex-wrap gap-2"><Pill>{versionStatusLabel[result.candidateVersion.status]}</Pill><Pill>{result.candidateVersion.decisionRecordIds.length} décision(s)</Pill></div><h4 className="mt-3 font-semibold">Version candidate identifiée</h4><p className="mt-2 text-sm">Version antérieure : {result.candidateVersion.priorVersion}</p><p className="mt-2 text-sm text-muted-foreground">Une version gelée est immuable ; toute évolution crée un changement et une nouvelle version.</p></Card><Card><Pill warning={result.documentHandoff.status !== "AUTHORIZED"}>{documentStatusLabel[result.documentHandoff.status]}</Pill><h4 className="mt-3 font-semibold">Handoff Document Engine</h4><p className="mt-2 text-sm">Aucun document n’est généré ici ; le Document Engine reste propriétaire des projections.</p>{result.documentHandoff.blockedBy.map((item) => <p key={item} className="mt-2 text-sm text-muted-foreground">Blocage : {humanizeCode(item)}</p>)}</Card></div><details className="mt-5 rounded-2xl border bg-card p-5"><summary className="cursor-pointer text-lg font-semibold">Générabilité des projections</summary><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{result.projectionReadiness.map((item) => <div key={item.projection} className="rounded-lg border p-3"><Pill warning={item.availability === "NOT_AVAILABLE"}>{projectionStatusLabel[item.availability]}</Pill><p className="mt-2 font-medium">{item.projection}</p>{item.missing.map((value) => <p key={value} className="mt-1 text-xs text-muted-foreground">Manque : {value}</p>)}</div>)}</div></details><details className="mt-5 rounded-2xl border bg-card p-5"><summary className="cursor-pointer text-lg font-semibold">Niveau 3 — graphe, dépendances et traçabilité</summary><p className="mt-3 text-sm">{result.impactGraph.nodes.length} nœuds · {result.impactGraph.edges.length} relations · {result.dependencies.length} dépendances explicites.</p><p className="mt-2 break-all text-xs text-muted-foreground">Version : {result.candidateVersion.versionId}</p><p className="mt-2 break-all text-xs text-muted-foreground">Digest : {result.resultDigest}</p></details></>}
    </div>

    {pendingChange && <Card className="mt-8 border-amber-500/50" role="alertdialog" aria-labelledby="project-change-title">
      <Pill warning>Modification majeure · avant application</Pill>
      <h3 id="project-change-title" className="mt-3 text-xl font-bold">{pendingChange.description}</h3>
      <p className="mt-2 text-sm">NOXIA ne modifiera rien silencieusement. Les impacts sont montrés avant confirmation.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{result.impactGraph.impacts.filter((item) => item.changeId === pendingChange.changeId && item.state !== "UNAFFECTED_DEMONSTRATED").map((item) => <div key={item.impactId} className="rounded-lg border p-3 text-sm"><Pill warning>{humanizeCode(item.state)}</Pill><p className="mt-2 break-all">{humanizeCode(item.targetType)}</p><p className="mt-1 text-xs text-muted-foreground">{item.reason}</p></div>)}</div>
      <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={!actor.trim() || !mandate.trim()} onClick={() => onChange(decideProjectChange(session, pendingChange.changeId, "CONFIRMED", actor, mandate))} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Confirmer et créer une nouvelle révision candidate</button><button type="button" onClick={() => onChange(decideProjectChange(session, pendingChange.changeId, "REJECTED"))} className="rounded-lg border px-4 py-2">Conserver la version actuelle</button></div>
    </Card>}

    <section className="mt-8" aria-labelledby="project-decision-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 id="project-decision-title" className="text-2xl font-bold">Prochaine décision humaine</h3><p className="mt-1 text-muted-foreground">NOXIA prépare la décision et ses conséquences ; l’acteur humain l’adopte ou la refuse.</p></div><Pill>{result.decisionsRequired.filter((item) => item.status === "PENDING").length} en attente</Pill></div>{currentDecision ? <Card className="mt-4 border-primary/40"><Pill>{humanizeCode(currentDecision.type)}</Pill><h4 className="mt-3 text-lg font-semibold">{currentDecision.label}</h4><p className="mt-2 text-sm text-muted-foreground">{currentDecision.reason}</p>{currentDecision.gateId === "PRJ-GATE-STUDY-DESIGN" && !selectedCandidateId && <p role="alert" className="mt-3 text-sm text-amber-700">Soumettez d’abord un plan dans l’étape Design.</p>}{currentDecision.gateId === "PRJ-GATE-PRIMARY-ENDPOINT" && !selectedPrimaryEndpointId && <p role="alert" className="mt-3 text-sm text-amber-700">Proposez d’abord un Critère principal dans l’étape Critères et mesures.</p>}<label htmlFor="project-decision-actor" className="mt-4 block text-sm font-medium">Acteur humain</label><input id="project-decision-actor" value={actor} onChange={(event) => setActor(event.target.value.slice(0, 100))} className="mt-2 w-full rounded-lg border bg-background px-3 py-2" /><label htmlFor="project-decision-reason" className="mt-4 block text-sm font-medium">Justification de la décision</label><textarea id="project-decision-reason" value={reason} onChange={(event) => setReason(event.target.value.slice(0, 500))} className="mt-2 min-h-24 w-full rounded-lg border bg-background p-3" /><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!actor.trim() || !reason.trim() || (currentDecision.gateId === "PRJ-GATE-STUDY-DESIGN" && !selectedCandidateId) || (currentDecision.gateId === "PRJ-GATE-PRIMARY-ENDPOINT" && !selectedPrimaryEndpointId)} onClick={() => decide("APPROVED")} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Adopter cette décision</button><button type="button" disabled={!actor.trim() || !reason.trim()} onClick={() => decide("REJECTED")} className="rounded-lg border px-4 py-2 disabled:opacity-50">Refuser cette proposition</button></div></Card> : <Card className="mt-4"><p>Toutes les décisions actuellement applicables sont documentées. Le handoff reste lié à la version et à ses décisions.</p></Card>}</section>

    <div className="mt-8 flex flex-wrap gap-2 print:hidden"><button type="button" onClick={onReturnToScientificThinking} className="rounded-lg border px-4 py-2">Revenir à Scientific Thinking</button>{onReturnToImaging && <button type="button" onClick={onReturnToImaging} className="rounded-lg border px-4 py-2">Revenir à Imaging</button>}{onExploreKnowledge && <button type="button" onClick={onExploreKnowledge} className="rounded-lg border px-4 py-2">Explorer le concept</button>}{onOpenDocument && result.documentHandoff.status === "AUTHORIZED" && <button type="button" onClick={onOpenDocument} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Composer le Protocol</button>}</div>
  </div>;
}
