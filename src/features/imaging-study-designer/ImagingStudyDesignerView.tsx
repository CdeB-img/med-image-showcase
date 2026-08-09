import { useMemo, useState } from "react";
import {
  answerImagingQuestion,
  decideImagingChange,
  decideImagingGate,
  requestImagingChange,
  reviewImagingCandidate,
} from "./session";
import type { HumanReviewState, ImagingDesignSession, SupportState } from "./types";

const STAGES = ["Phénomènes", "Biomarqueurs", "Modalités", "Acquisitions", "Faisabilité technique", "QA", "Analyse", "Stratégie Imaging"] as const;
const supportLabel: Record<SupportState, string> = {
  SUPPORTED: "Soutenu", PARTIALLY_SUPPORTED: "Partiellement soutenu", UNKNOWN: "Inconnu", NOT_APPLICABLE: "Non applicable", CONFLICTING: "Conflit",
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <section className={`min-w-0 break-words rounded-2xl border bg-card p-5 shadow-sm ${className}`}>{children}</section>;
const Pill = ({ children, warning = false }: { children: React.ReactNode; warning?: boolean }) => <span className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-xs font-medium ${warning ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200" : "border-border bg-muted text-muted-foreground"}`}>{children}</span>;
const CandidateActions = ({ state, onReview }: { state: HumanReviewState; onReview: (state: HumanReviewState) => void }) => <div className="mt-4 flex flex-wrap gap-2" aria-label="Revue humaine du candidat">
  <button type="button" aria-pressed={state === "ADOPTED"} onClick={() => onReview("ADOPTED")} className="rounded-lg border px-3 py-2 text-sm aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">Retenir</button>
  <button type="button" aria-pressed={state === "REJECTED"} onClick={() => onReview("REJECTED")} className="rounded-lg border px-3 py-2 text-sm aria-pressed:border-destructive aria-pressed:text-destructive">Écarter</button>
  <button type="button" aria-pressed={state === "PENDING"} onClick={() => onReview("PENDING")} className="rounded-lg border px-3 py-2 text-sm">Garder à examiner</button>
</div>;

type Props = {
  session: ImagingDesignSession;
  onChange: (session: ImagingDesignSession) => void;
  onReturnToScientificThinking: () => void;
  onExploreKnowledge?: () => void;
  onProjectConstructionHandoff: () => void;
};

export default function ImagingStudyDesignerView({ session, onChange, onReturnToScientificThinking, onExploreKnowledge, onProjectConstructionHandoff }: Props) {
  const [stage, setStage] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const result = session.result;
  const pendingChange = result.changes.find((item) => item.status === "PENDING_CONFIRMATION");
  const currentDecision = result.decisionsRequired.find((item) => item.status === "PENDING");
  const progress = `${stage + 1}/${STAGES.length}`;
  const visibleQuestions = useMemo(() => result.adaptiveQuestions.filter((item) => !item.answeredValue), [result.adaptiveQuestions]);

  const triggerBiomarkerChange = () => {
    const biomarker = result.biomarkerCandidates[0];
    if (!biomarker) return;
    onChange(requestImagingChange(session, {
      eventType: "BiomarkerChanged",
      description: `Changement proposé du biomarqueur structurant ${biomarker.label}.`,
      sourceIds: [biomarker.biomarkerId],
      targetIds: result.biomarkerCandidates.slice(1).map((item) => item.biomarkerId),
    }));
  };

  if (result.refusal?.code === "PATIENT_LEVEL") return <div className="mt-8" role="alert">
    <Card className="border-amber-500/50">
      <Pill warning>Domain Gate · demande individuelle refusée</Pill>
      <h2 className="mt-3 text-2xl font-bold">NOXIA ne conçoit pas un protocole pour une situation patient.</h2>
      <p className="mt-3 text-muted-foreground">{result.refusal.reason}</p>
      <p className="mt-2 text-sm">Pour continuer : {result.refusal.resumeCondition}</p>
    </Card>
  </div>;

  return <div className="mt-8 min-w-0" data-testid="imaging-study-designer">
    <Card className="border-primary/40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Imaging Research Strategy Engine · projection runtime</p>
          <h2 className="mt-2 text-2xl font-bold">Comment l’imagerie peut-elle examiner cette question ?</h2>
          <p className="mt-3"><strong>Question confirmée :</strong> {result.scientificQuestion.text}</p>
          <p className="mt-2 text-sm text-muted-foreground">Objet conservé : {session.input.centralScientificObject}. Aucune modalité n’est choisie depuis sa seule disponibilité.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill warning={result.status !== "STRATEGY_CANDIDATES"}>{result.status}</Pill>
          <Pill>Contexte {session.input.strategyVersion}</Pill>
        </div>
      </div>
      <div className="mt-5" aria-label="Progression Imaging">
        <div className="flex items-center justify-between gap-3 text-sm"><span>Construction de la stratégie</span><span aria-live="polite">Étape {stage + 1} sur environ {STAGES.length}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }} /></div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((label, index) => <li key={label}><button type="button" onClick={() => setStage(index)} aria-current={stage === index ? "step" : undefined} className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${stage === index ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{index + 1}. {label}</button></li>)}
        </ol>
      </div>
    </Card>

    <div className="mt-6" aria-live="polite" aria-atomic="false">
      {stage === 0 && <>
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-2xl font-bold">Phénomènes</h3><p className="mt-1 text-muted-foreground">Ce que la Question et les Hypothèses impliquent biologiquement, avant tout choix de biomarqueur.</p></div><Pill>{result.phenomena.length} candidat(s)</Pill></div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{result.phenomena.map((item) => <Card key={item.phenomenonId}><div className="flex flex-wrap gap-2"><Pill>{item.role}</Pill><Pill warning={item.knowledgeSupport === "UNKNOWN"}>{supportLabel[item.knowledgeSupport]}</Pill></div><h4 className="mt-3 text-xl font-semibold">{item.label}</h4><p className="mt-2 text-sm">Observabilité : {item.observability === "INDIRECT_ONLY" ? "indirecte — via un biomarqueur à défendre" : "à établir"}.</p>{item.unknowns.map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">Inconnue : {value}</p>)}<CandidateActions state={item.reviewState} onReview={(state) => onChange(reviewImagingCandidate(session, "phenomenon", item.phenomenonId, state))} /><details className="mt-4 text-sm"><summary className="cursor-pointer">Contexte, limites et preuves</summary><p className="mt-2">Objectifs reliés : {item.objectiveIds.length || "aucun"}</p><p className="mt-1">Hypothèses reliées : {item.hypothesisIds.length || "aucune"}</p>{item.limitations.map((value) => <p key={value} className="mt-1 text-muted-foreground">• {value}</p>)}{item.evidenceRefs.map((value) => <p key={value} className="mt-1 break-all font-mono text-xs">{value}</p>)}</details></Card>)}</div>
        {!result.phenomena.length && <Card className="mt-4 border-amber-500/40"><h4 className="font-semibold">Aucun phénomène défendable identifié</h4><p className="mt-2 text-sm">NOXIA ne forcera ni biomarqueur ni modalité. Un retour vers Scientific Thinking est requis.</p></Card>}
      </>}

      {stage === 1 && <>
        <h3 className="text-2xl font-bold">Biomarqueurs candidats</h3><p className="mt-1 text-muted-foreground">Seuls les candidats reliés à un phénomène et à une connaissance gouvernée sont affichés.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{result.biomarkerCandidates.map((item) => <Card key={item.biomarkerId}><div className="flex flex-wrap gap-2"><Pill>{item.measurementType}</Pill><Pill warning={item.applicability === "UNKNOWN"}>{supportLabel[item.applicability]}</Pill></div><h4 className="mt-3 text-xl font-semibold">{item.label}</h4><p className="mt-2 text-sm">Quantification : {supportLabel[item.quantification]} · reproductibilité : {supportLabel[item.reproducibility]}.</p><CandidateActions state={item.reviewState} onReview={(state) => onChange(reviewImagingCandidate(session, "biomarker", item.biomarkerId, state))} /><details className="mt-4 text-sm"><summary className="cursor-pointer">Dépendances, limites et preuves</summary>{item.dependencies.map((value) => <p key={value} className="mt-2">• {value}</p>)}{item.limitations.map((value) => <p key={value} className="mt-2 text-muted-foreground">Limite : {value}</p>)}{item.evidenceRefs.map((value) => <p key={value} className="mt-1 break-all font-mono text-xs">{value}</p>)}</details></Card>)}</div>
        {!result.biomarkerCandidates.length && <Card className="mt-4 border-amber-500/40"><h4 className="font-semibold">Chaîne interrompue avant le biomarqueur</h4><p className="mt-2 text-sm">Aucun biomarqueur ne sera inventé. La stratégie reste partielle et le gap Knowledge est conservé.</p></Card>}
        {result.biomarkerComparison.map((comparison) => <details key={comparison.comparisonId} className="mt-5 rounded-2xl border bg-card p-5"><summary className="cursor-pointer text-lg font-semibold">Comparer les biomarqueurs — aucune hiérarchie automatique</summary><div className="mt-4 grid gap-3 md:grid-cols-2">{Object.entries(comparison.dimensions).map(([dimension, values]) => <div key={dimension} className="rounded-lg border p-3"><p className="font-medium">{dimension}</p>{Object.entries(values).map(([candidate, value]) => <p key={candidate} className="mt-1 text-sm">{result.biomarkerCandidates.find((item) => item.biomarkerId === candidate)?.label}: {supportLabel[value]}</p>)}</div>)}</div></details>)}
      </>}

      {stage === 2 && <>
        <h3 className="text-2xl font-bold">Options Imaging</h3><p className="mt-1 text-muted-foreground">Chaque modalité reste reliée au même besoin de mesure ; une branche peu documentée n’est pas supprimée.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{result.modalityCandidates.map((item) => <Card key={item.modalityId}><div className="flex flex-wrap gap-2"><Pill>CANDIDATE</Pill><Pill warning={item.support === "UNKNOWN"}>{supportLabel[item.support]}</Pill></div><h4 className="mt-3 text-xl font-semibold">{item.label}</h4><p className="mt-2 text-sm">Biomarqueur(s) relié(s) : {item.biomarkerIds.map((id) => result.biomarkerCandidates.find((candidate) => candidate.biomarkerId === id)?.label).filter(Boolean).join(", ") || "aucun"}.</p><CandidateActions state={item.reviewState} onReview={(state) => onChange(reviewImagingCandidate(session, "modality", item.modalityId, state))} />{item.limitations.map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">Limite : {value}</p>)}</Card>)}</div>
        {result.modalityComparison.map((comparison) => <details key={comparison.comparisonId} className="mt-5 rounded-2xl border bg-card p-5"><summary className="cursor-pointer text-lg font-semibold">Comparer les modalités pour « {comparison.scientificNeed} »</summary><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Object.entries(comparison.dimensions).map(([dimension, values]) => <div key={dimension} className="rounded-lg border p-3"><p className="font-medium">{dimension}</p>{Object.entries(values).map(([candidate, value]) => <p key={candidate} className="mt-1 text-sm">{result.modalityCandidates.find((item) => item.modalityId === candidate)?.label}: {supportLabel[value]}</p>)}</div>)}</div></details>)}
      </>}

      {stage === 3 && <>
        <h3 className="text-2xl font-bold">Stratégie d’acquisition</h3><p className="mt-1 text-muted-foreground">Niveaux 1 et 2 seulement. Le protocole exécutable reste bloqué.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{result.acquisitionStrategies.map((item) => <Card key={item.acquisitionId}><Pill>{item.role}</Pill><h4 className="mt-3 text-lg font-semibold">{item.level2.acquisitionFamily}</h4><p className="mt-3"><strong>Niveau 1 — pourquoi :</strong> {item.level1.scientificReason}</p><p className="mt-2"><strong>Niveau 2 — conditions :</strong> {item.level2.conditions.join(" ; ")}.</p><div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"><strong>Niveau 3 bloqué :</strong> {item.level3.reason}</div><CandidateActions state={item.reviewState} onReview={(state) => onChange(reviewImagingCandidate(session, "acquisition", item.acquisitionId, state))} /><details className="mt-4 text-sm"><summary className="cursor-pointer">Dépendances et paramètres interdits</summary><p className="mt-2">Retrait : {item.consequenceIfRemoved}</p><p className="mt-2 text-muted-foreground">Aucun {item.level3.forbiddenParameterFamilies.join(", ")} n’est généré.</p></details></Card>)}</div>
      </>}

      {stage === 4 && <>
        <h3 className="text-2xl font-bold">Faisabilité technique</h3><p className="mt-1 text-muted-foreground">Équipements réellement déclarés, compatibilité jamais supposée et différences intersites visibles.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{result.equipmentAssessment.map((item) => <Card key={item.assessmentId}><div className="flex flex-wrap gap-2"><Pill>{item.availability}</Pill><Pill warning={item.compatibility !== "EXACT_MATCH"}>{item.compatibility}</Pill></div><h4 className="mt-3 font-semibold">{session.input.declaredEquipment.find((equipment) => equipment.equipmentId === item.equipmentId)?.siteLabel ?? "Équipement non déclaré"}</h4>{item.gaps.map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">• {value}</p>)}</Card>)}</div>
        <Card className="mt-5"><h4 className="text-lg font-semibold">Harmonisation candidate</h4><p className="mt-2">Contexte : {result.harmonizationStrategy.centerMode}</p>{result.harmonizationStrategy.commonCore.map((value) => <p key={value} className="mt-2 text-sm">Noyau commun : {value}</p>)}{result.harmonizationStrategy.variantsToQualify.map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">Variante à qualifier : {value}</p>)}</Card>
      </>}

      {stage === 5 && <>
        <h3 className="text-2xl font-bold">Quality Assurance avant la mesure</h3><p className="mt-1 text-muted-foreground">Aucun seuil numérique inventé. Chaque échec a une conséquence explicite.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{result.qualityStrategy.map((item) => <Card key={item.ruleId}><div className="flex flex-wrap gap-2"><Pill>{item.surface}</Pill><Pill>{item.timing}</Pill></div><h4 className="mt-3 font-semibold">{item.acceptanceConcept}</h4><p className="mt-2 text-sm">Méthode : {item.method}</p><p className="mt-2 text-sm text-muted-foreground">Si échec : {item.consequenceOfFailure}</p></Card>)}</div>
        <details className="mt-5 rounded-2xl border bg-card p-5"><summary className="cursor-pointer text-lg font-semibold">Non-évaluabilité — donnée absente ≠ résultat normal</summary><div className="mt-4 grid gap-3 md:grid-cols-2">{result.nonEvaluabilityRules.slice(0, 7).map((item) => <div key={item.ruleId} className="rounded-lg border p-3"><Pill warning={item.state !== "BIOLOGICALLY_NEGATIVE"}>{item.state}</Pill><p className="mt-2 text-sm">{item.cause}</p></div>)}</div></details>
      </>}

      {stage === 6 && <>
        <h3 className="text-2xl font-bold">Analyse d’image et Variables</h3><p className="mt-1 text-muted-foreground">NOXIA définit des besoins d’analyse mais n’analyse aucune image et ne choisit aucun test statistique.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{result.imageAnalysisStrategy.map((item) => <Card key={item.analysisId}><Pill>{item.boundary}</Pill><h4 className="mt-3 font-semibold">{item.readingModel}</h4>{item.operationNeeds.map((value) => <p key={value} className="mt-2 text-sm">• {value}</p>)}<CandidateActions state={item.reviewState} onReview={(state) => onChange(reviewImagingCandidate(session, "analysis", item.analysisId, state))} /></Card>)}</div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">{result.imagingVariables.map((item) => <Card key={item.variableId}><h4 className="font-semibold">{item.definition}</h4><p className="mt-2 text-sm">Unité : {item.unit ?? "non gouvernée"} · QA : {item.qualityRuleIds.length} règle(s).</p><p className="mt-2 text-sm text-muted-foreground">Analyse statistique encore requise en aval.</p></Card>)}</div>
      </>}

      {stage === 7 && <>
        <h3 className="text-2xl font-bold">Stratégie Imaging</h3><p className="mt-1 text-muted-foreground">Alternatives, compromis, décisions humaines et handoff vers Project Construction. Il exclut dimensionnement, budget, CRF, plan réglementaire et protocole final.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{result.alternatives.map((item) => <Card key={item.alternativeId}><Pill>Aucune option optimale</Pill><h4 className="mt-3 font-semibold">{item.label}</h4><p className="mt-2 text-sm">Préserve : {item.preserves.join(" ; ") || "à établir"}.</p><p className="mt-2 text-sm text-muted-foreground">Modifie : {item.changes.join(" ; ") || "à établir"}.</p>{item.losses.map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">Perte : {value}</p>)}</Card>)}</div>
        <Card className="mt-5"><h4 className="text-lg font-semibold">Core Lab assessment</h4><p className="mt-2">Options conservées : {result.coreLabAssessment.options.join(" · ")}.</p><p className="mt-2 text-sm text-muted-foreground">Aucune option n’est proposée automatiquement comme optimale.</p></Card>
        <Card className="mt-5"><h4 className="text-lg font-semibold">Handoff Project Construction</h4><div className="mt-2 flex flex-wrap gap-2"><Pill warning={result.projectConstructionHandoff.status === "NOT_READY"}>{result.projectConstructionHandoff.status}</Pill><Pill>{result.projectConstructionHandoff.scientificStrategyStatus}</Pill><Pill warning={result.projectConstructionHandoff.equipmentCompatibilityStatus === "INCOMPATIBLE"}>{result.projectConstructionHandoff.equipmentCompatibilityStatus}</Pill><Pill warning>{result.projectConstructionHandoff.executableProtocolReadiness}</Pill></div><p className="mt-3 text-sm">Le projet peut recevoir une stratégie scientifique gelée même si la compatibilité technique reste inconnue ou seulement déclarée. Cette inconnue demeure visible et interdit tout protocole exécutable.</p>{result.projectConstructionHandoff.unknowns.length > 0 && <details className="mt-3 rounded-lg border p-3"><summary className="cursor-pointer text-sm font-semibold">Inconnues et revues futures</summary>{result.projectConstructionHandoff.unknowns.slice(0, 5).map((value) => <p key={value} className="mt-2 text-sm text-muted-foreground">• {value}</p>)}{result.projectConstructionHandoff.requiredFutureReviews.map((value) => <p key={value} className="mt-2 text-sm">Revue requise : {value}</p>)}</details>}<p className="mt-3 text-sm text-muted-foreground">Version Imaging : {result.projectConstructionHandoff.imagingStrategyVersion}. Handoff : {result.projectConstructionHandoff.projectHandoffReadiness}. Historique gelé conservé : {session.handoffHistory.length}.</p><button type="button" disabled={result.projectConstructionHandoff.status !== "FROZEN_BY_HUMAN"} onClick={onProjectConstructionHandoff} className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Passer à Project Construction</button></Card>
      </>}
    </div>

    {visibleQuestions.length > 0 && <section className="mt-8" aria-labelledby="imaging-questions-title"><h3 id="imaging-questions-title" className="text-2xl font-bold">Questions qui changent réellement la stratégie</h3><div className="mt-4 grid gap-4">{visibleQuestions.map((item, index) => <Card key={item.questionId}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Question {index + 1} sur environ {visibleQuestions.length}</p><Pill>{item.decisionBlock}</Pill></div><h4 className="mt-3 text-lg font-semibold">{item.label}</h4><div className="mt-3 grid gap-3 rounded-xl bg-muted/60 p-4 text-sm md:grid-cols-2"><p><strong>Pourquoi :</strong> {item.whyAsked}</p><p><strong>Influence :</strong> {item.decisionImpact}</p></div><div className="mt-4 flex flex-wrap gap-2">{item.suggestedAnswers.map((option) => <button type="button" key={option.value} onClick={() => onChange(answerImagingQuestion(session, item.questionId, option.value))} className="rounded-full border px-3 py-2 text-sm">{option.label}</button>)}</div><label htmlFor={`img-free-${item.questionId}`} className="mt-4 block text-sm font-medium">Ou répondez avec vos propres mots</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id={`img-free-${item.questionId}`} value={drafts[item.questionId] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [item.questionId]: event.target.value.slice(0, 500) }))} className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring" /><button type="button" disabled={!drafts[item.questionId]?.trim()} onClick={() => onChange(answerImagingQuestion(session, item.questionId, `free:${drafts[item.questionId].trim()}`))} className="rounded-lg border px-4 py-2 disabled:opacity-50">Enregistrer</button></div></Card>)}</div></section>}

    <section className="mt-8" aria-labelledby="imaging-decision-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 id="imaging-decision-title" className="text-2xl font-bold">Prochaine décision humaine</h3><p className="mt-1 text-muted-foreground">NOXIA prépare et trace la décision ; il ne la prend pas.</p></div><Pill>{result.decisionsRequired.filter((item) => item.status === "PENDING").length} en attente</Pill></div>{currentDecision ? <Card className="mt-4 border-primary/40"><Pill>{currentDecision.type}</Pill><h4 className="mt-3 text-lg font-semibold">{currentDecision.label}</h4><p className="mt-2 text-sm text-muted-foreground">{currentDecision.reason}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onChange(decideImagingGate(session, currentDecision.gateId, "APPROVED", "Décision explicitement approuvée dans l’interface Imaging."))} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Approuver</button><button type="button" onClick={() => onChange(decideImagingGate(session, currentDecision.gateId, "REJECTED", "Décision explicitement refusée dans l’interface Imaging."))} className="rounded-lg border px-4 py-2">Refuser</button></div></Card> : <Card className="mt-4"><p>Toutes les portes humaines actuellement applicables sont documentées.</p></Card>}</section>

    {result.biomarkerCandidates.length > 0 && <section className="mt-8" aria-labelledby="imaging-change-title"><h3 id="imaging-change-title" className="text-xl font-bold">Modifier une décision structurante</h3><p className="mt-1 text-sm text-muted-foreground">Un changement majeur affiche ses impacts avant toute confirmation.</p>{!pendingChange ? <button type="button" onClick={triggerBiomarkerChange} className="mt-4 rounded-lg border px-4 py-2">Proposer un changement du biomarqueur principal</button> : <Card className="mt-4 border-amber-500/50"><Pill warning>Changement majeur · confirmation requise</Pill><h4 className="mt-3 font-semibold">{pendingChange.description}</h4><div className="mt-3 grid gap-2 sm:grid-cols-2">{result.impacts.filter((item) => item.changeId === pendingChange.changeId && item.state === "REVIEW_REQUIRED").map((item) => <p key={item.impactId} className="rounded-lg bg-muted p-3 text-sm">{item.targetType} : {item.state}</p>)}</div><div className="mt-4 flex gap-2"><button type="button" onClick={() => onChange(decideImagingChange(session, pendingChange.changeId, "CONFIRMED"))} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Confirmer le changement et rouvrir</button><button type="button" onClick={() => onChange(decideImagingChange(session, pendingChange.changeId, "REJECTED"))} className="rounded-lg border px-4 py-2">Conserver la stratégie actuelle</button></div></Card>}</section>}

    <details className="mt-8 rounded-2xl border bg-card p-5"><summary className="cursor-pointer font-semibold">Niveau 3 — preuves, provenance, graphe et historique</summary><div className="mt-4 grid gap-4 lg:grid-cols-2"><div><h4 className="font-semibold">Chaînes cassées</h4>{result.graph.brokenChains.length ? result.graph.brokenChains.map((item) => <p key={`${item.code}-${item.affectedIds.join("-")}`} className="mt-2 text-sm"><strong>{item.label}</strong> — {item.consequence}</p>) : <p className="mt-2 text-sm">Aucune chaîne cassée détectée.</p>}</div><div><h4 className="font-semibold">Provenance</h4><p className="mt-2 text-sm">Knowledge : {result.knowledgeHandoff.coverageStatus}</p><p className="mt-2 text-sm">Sémantique : exact-first, aucun closest-corpus fallback.</p><p className="mt-2 text-sm">Graphe : {result.graph.nodes.length} nœuds, {result.graph.edges.length} relations.</p><p className="mt-2 text-sm">Historique : {session.decisionHistory.length} décision(s), {result.changes.length} changement(s).</p></div></div></details>

    <div className="mt-8 flex flex-wrap justify-between gap-3"><button type="button" onClick={onReturnToScientificThinking} className="rounded-lg border px-4 py-2">Retour à Scientific Thinking</button><div className="flex flex-wrap gap-2">{onExploreKnowledge && <button type="button" onClick={onExploreKnowledge} className="rounded-lg border px-4 py-2">Explorer les connaissances</button>}<button type="button" disabled={stage === 0} onClick={() => setStage((value) => Math.max(0, value - 1))} className="rounded-lg border px-4 py-2 disabled:opacity-50">Étape précédente</button><button type="button" disabled={stage === STAGES.length - 1} onClick={() => setStage((value) => Math.min(STAGES.length - 1, value + 1))} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Étape suivante</button></div></div>
    <span className="sr-only" aria-live="polite">Progression Imaging {progress}</span>
  </div>;
}
