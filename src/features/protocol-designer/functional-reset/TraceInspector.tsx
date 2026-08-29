import { useMemo, useState } from "react";
import type { ScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import {
  buildTraceInspectorRunProjection,
  compareTraceInspectorRuns,
  listTraceRunLineage,
  TRACE_STRUCTURAL_DIAGNOSTIC_OWNER,
  type TraceInspectorEventProjection,
} from "@/features/validation-architecture/trace-structural-validation";

type Props = {
  ledger: Readonly<ScientificExecutionTraceLedger>;
};

type ViewLevel = "SUMMARY" | "DIAGNOSTIC_DETAILS" | "FORENSIC_DETAILS";

const LabelValue = ({ label, value }: { label: string; value: string | number | null }) => <div className="min-w-0 rounded-lg border bg-card p-2.5">
  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
  <dd className="mt-1 break-all font-mono text-xs">{value ?? "UNKNOWN"}</dd>
</div>;

const ReferenceList = ({ label, references }: {
  label: string;
  references: TraceInspectorEventProjection["inputRefs"];
}) => <div>
  <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h5>
  {references.length === 0
    ? <p className="mt-1 font-mono text-xs">UNKNOWN</p>
    : <ul className="mt-1 space-y-1">{references.map((reference) => <li key={`${reference.ref}:${reference.version}:${reference.digest}`} className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] break-all">
      {reference.ref} · v={reference.version} · digest={reference.digest}
    </li>)}</ul>}
</div>;

const EventDetail = ({ event }: { event: TraceInspectorEventProjection }) => <details className="rounded-xl border bg-background p-3" data-testid={`trace-event-${event.stage}`}>
  <summary className="cursor-pointer list-none">
    <span className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <span className="min-w-0 font-mono text-xs font-semibold">{String(event.sequence).padStart(2, "0")} · {event.stage}</span>
      <span className="text-xs font-medium text-muted-foreground">{event.status}</span>
    </span>
  </summary>
  <div className="mt-3 space-y-3 border-t pt-3">
    <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <LabelValue label="OWNER" value={event.responsibilityOwner} />
      <LabelValue label="DECISION OWNER" value={event.decisionOwner} />
      <LabelValue label="EXECUTOR" value={event.executor} />
      <LabelValue label="PROVIDER" value={event.provider} />
      <LabelValue label="Component" value={event.component.componentId} />
      <LabelValue label="Component version" value={event.component.componentVersion} />
      <LabelValue label="Reason code" value={event.reasonCode} />
      <LabelValue label="Duration" value={event.durationMs == null ? "UNKNOWN" : `${event.durationMs} ms`} />
      <LabelValue label="Upstream event" value={event.upstreamEventId} />
      <LabelValue label="Dependencies" value={event.dependencies.length ? event.dependencies.join(", ") : "NONE"} />
    </dl>
    <div className="grid gap-3 lg:grid-cols-2">
      <ReferenceList label="Input refs / versions / digests" references={event.inputRefs} />
      <ReferenceList label="Output refs / versions / digests" references={event.outputRefs} />
    </div>
  </div>
</details>;

const DimensionList = ({ label, dimensions }: {
  label: string;
  dimensions: readonly { dimensionId: string; status: string; source: string; reasonCode: string }[] | undefined;
}) => <div className="rounded-lg border bg-card p-2.5">
  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
  <dd className="mt-1">
    {!dimensions?.length ? <span className="font-mono text-xs">UNKNOWN</span> : <ul className="space-y-1">{dimensions.map((dimension) => <li key={`${label}:${dimension.dimensionId}`} className="font-mono text-xs">
      {dimension.dimensionId} · {dimension.status} · {dimension.source} · {dimension.reasonCode}
    </li>)}</ul>}
  </dd>
</div>;

const DiagnosticDetails = ({ run }: { run: ReturnType<typeof buildTraceInspectorRunProjection> }) => {
  if (run.captureLevel === "LEVEL_1_CORE") return <p className="rounded-xl border bg-background p-3 text-sm text-muted-foreground">UNKNOWN — ce run CORE ne capture pas les transformations sémantiques détaillées.</p>;
  const enrichedEvents = run.events.filter((event) => event.semanticTransformation || event.actionDecision);
  return <div className="space-y-3" data-testid="trace-inspector-diagnostic-view">
    <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <LabelValue label="ASK_VS_PROPOSE_OWNER" value={run.ownerFacts.askVsProposeOwner} />
      <LabelValue label="WHAT_TO_ASK_OWNER" value={run.ownerFacts.whatToAskOwner} />
      <LabelValue label="QUESTION_FORMULATION_OWNER" value={run.ownerFacts.questionFormulationOwner} />
      <LabelValue label="QRY WHAT / LLM HOW" value={run.ownerFacts.qryWhatLlmHowContract} />
      <LabelValue label="FIRST_UNEXPLAINED_DIVERGENCE_STAGE" value={run.firstUnexplainedDivergenceStage ?? "NONE"} />
      <LabelValue label="STRUCTURAL_DIAGNOSTIC_OWNER" value={TRACE_STRUCTURAL_DIAGNOSTIC_OWNER} />
    </dl>

    {enrichedEvents.length === 0 ? <p className="font-mono text-xs">UNKNOWN</p> : enrichedEvents.map((event) => <article key={`diagnostic:${event.eventId}`} className="rounded-xl border bg-background p-3">
      <h4 className="font-mono text-xs font-semibold">{event.stage}</h4>
      <dl className="mt-3 grid gap-2 lg:grid-cols-2">
        <DimensionList label="INPUT_DIMENSIONS" dimensions={event.semanticTransformation?.inputDimensions} />
        <DimensionList label="OUTPUT_DIMENSIONS" dimensions={event.semanticTransformation?.outputDimensions} />
        <DimensionList label="RETAINED" dimensions={event.semanticTransformation?.retainedDimensions} />
        <DimensionList label="TRANSFORMED" dimensions={event.semanticTransformation?.transformedDimensions} />
        <DimensionList label="DROPPED" dimensions={event.semanticTransformation?.droppedDimensions} />
        <LabelValue label="TRANSFORMATION_REASON" value={event.semanticTransformation?.transformationReason ?? "UNKNOWN"} />
        <LabelValue label="DROP_REASON" value={event.semanticTransformation?.dropReason ?? "UNKNOWN"} />
        <LabelValue label="ASK_VS_PROPOSE" value={event.actionDecision?.askVsPropose ?? "UNKNOWN"} />
        <LabelValue label="SELECTED_INFORMATION_NEED" value={event.actionDecision?.selectedInformationNeed ?? "UNKNOWN"} />
        <LabelValue label="WHY_SELECTED" value={event.actionDecision?.whySelected ?? "UNKNOWN"} />
        <LabelValue label="EXPECTED_INFORMATION_GAIN" value={event.actionDecision?.expectedInformationGain ?? "UNKNOWN"} />
        <LabelValue label="ALREADY_PROVIDED_INFORMATION_REFS" value={event.actionDecision?.alreadyProvidedInformationRefs.join(", ") || "UNKNOWN"} />
        <LabelValue label="CANDIDATE_ALTERNATIVES" value={event.actionDecision?.candidateAlternatives.join(", ") || "UNKNOWN"} />
        <LabelValue label="REJECTED_ALTERNATIVES" value={event.actionDecision?.rejectedAlternatives.join(", ") || "UNKNOWN"} />
      </dl>
    </article>)}

    <div className="rounded-xl border bg-background p-3">
      <h4 className="text-sm font-semibold">Diagnostics structurels déterministes</h4>
      <p className="mt-1 text-xs text-muted-foreground">Ces constats VAL décrivent uniquement les faits TRACE et n'adjugent pas la valeur scientifique.</p>
      {run.diagnostics.length === 0 ? <p className="mt-2 font-mono text-xs">NONE</p> : <ul className="mt-2 space-y-2">{run.diagnostics.map((finding) => <li key={finding.diagnosticId} className="rounded-lg bg-muted p-2 text-xs">
        <p className="font-mono font-semibold">{finding.code} · {finding.status}</p>
        <p className="mt-1">{finding.explanation}</p>
        <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">rule={finding.ruleId} · evidence={finding.evidenceEventIds.join(", ")}</p>
      </li>)}</ul>}
    </div>
  </div>;
};

const ForensicDetails = ({ run }: { run: ReturnType<typeof buildTraceInspectorRunProjection> }) => {
  const [revealed, setRevealed] = useState(false);
  if (run.captureLevel !== "LEVEL_3_FORENSIC") return <p className="rounded-xl border bg-background p-3 font-mono text-xs">NOT_CAPTURED — la capture de ce run n'est pas FORENSIC.</p>;
  if (!revealed) return <div className="rounded-xl border bg-background p-3">
    <p className="text-sm">Les payloads forensic redacted restent fermés jusqu'à une action explicite.</p>
    <button type="button" className="mt-3 min-h-10 rounded-lg border px-3 text-sm font-medium" onClick={() => setRevealed(true)}>Afficher les données forensic autorisées</button>
  </div>;
  return <div className="space-y-3" data-testid="trace-inspector-forensic-view">{run.events.map((event) => <article key={`forensic:${event.eventId}`} className="rounded-xl border bg-background p-3">
    <h4 className="font-mono text-xs font-semibold">{event.stage}</h4>
    <ul className="mt-2 space-y-2">{event.forensic.map((field, index) => <li key={`${event.eventId}:${field.field}:${index}`} className="rounded-lg bg-muted p-2 text-xs">
      <p className="font-mono font-semibold">{field.field} · {field.classification}</p>
      <p className="mt-1 break-all font-mono text-[11px]">source={field.source}</p>
      {field.value !== null && <p className="mt-1 break-all font-mono text-[11px]">{field.value}</p>}
    </li>)}</ul>
  </article>)}</div>;
};

export default function TraceInspector({ ledger }: Props) {
  const lineage = useMemo(() => listTraceRunLineage(ledger), [ledger]);
  const [selectedRunId, setSelectedRunId] = useState(() => lineage.at(-1)?.traceRunId ?? "");
  const [viewLevel, setViewLevel] = useState<ViewLevel>("SUMMARY");
  const [compareRunId, setCompareRunId] = useState("");
  const effectiveRunId = lineage.some((entry) => entry.traceRunId === selectedRunId)
    ? selectedRunId
    : lineage.at(-1)?.traceRunId ?? "";
  const run = useMemo(() => effectiveRunId
    ? buildTraceInspectorRunProjection({ ledger, traceRunId: effectiveRunId })
    : null, [effectiveRunId, ledger]);
  const comparison = useMemo(() => run && compareRunId && compareRunId !== run.traceRunId
    ? compareTraceInspectorRuns({ ledger, leftTraceRunId: run.traceRunId, rightTraceRunId: compareRunId })
    : null, [compareRunId, ledger, run]);

  return <section className="mt-5 rounded-2xl border bg-muted/30 p-3 sm:p-4" aria-labelledby="trace-inspector-title" data-testid="trace-inspector">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h3 id="trace-inspector-title" className="text-base font-semibold">Trace Inspector</h3>
        <p className="mt-1 text-xs text-muted-foreground">Projection DEV / Expert en lecture seule. TRACE enregistre les faits ; VAL produit uniquement les diagnostics structurels applicables.</p>
      </div>
      {lineage.length > 0 && <label className="text-xs font-medium text-muted-foreground">
        Run
        <select className="ml-2 min-h-10 max-w-[26rem] rounded-lg border bg-background px-2 font-mono text-xs text-foreground" value={effectiveRunId} onChange={(event) => {
          setSelectedRunId(event.target.value);
          setCompareRunId("");
          setViewLevel("SUMMARY");
        }}>
          {lineage.map((entry) => <option key={entry.traceRunId} value={entry.traceRunId}>{entry.captureLevel} · {entry.traceRunId}</option>)}
        </select>
      </label>}
    </div>

    {!run ? <p className="mt-4 rounded-xl border bg-background p-3 text-sm text-muted-foreground">Aucun run TRACE disponible dans cette session.</p> : <>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Niveau d'affichage TRACE">
        {(["SUMMARY", "DIAGNOSTIC_DETAILS", "FORENSIC_DETAILS"] as const).map((level) => <button key={level} type="button" aria-pressed={viewLevel === level} onClick={() => setViewLevel(level)} className={`min-h-10 rounded-lg border px-3 text-xs font-medium ${viewLevel === level ? "bg-primary text-primary-foreground" : "bg-background"}`}>
          {level}
        </button>)}
      </div>

      <p className="mt-2 font-mono text-[11px] text-muted-foreground">CAPTURE_LEVEL={run.captureLevel} · VIEW_LEVEL={viewLevel}</p>

      {viewLevel === "SUMMARY" && <div className="mt-4 space-y-4" data-testid="trace-inspector-summary-view">
        <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <LabelValue label="traceRunId" value={run.traceRunId} />
          <LabelValue label="captureLevel" value={run.captureLevel} />
          <LabelValue label="captureReason" value={run.captureReason} />
          <LabelValue label="replayOfTraceRunId" value={run.replayOfTraceRunId} />
          <LabelValue label="status" value={run.status} />
          <LabelValue label="turn count" value={run.turnCount} />
          <LabelValue label="event count" value={run.eventCount} />
          <LabelValue label="duration" value={`${run.durationMs} ms`} />
          <LabelValue label="Project identity" value={run.projectId} />
          <LabelValue label="Project version" value={run.projectVersion} />
          <LabelValue label="Project digest" value={run.projectDigest} />
        </dl>

        <div>
          <h4 className="text-sm font-semibold">Chronologie structurée</h4>
          <div className="mt-2 space-y-2">{run.events.map((event) => <EventDetail key={event.eventId} event={event} />)}</div>
        </div>

        {lineage.length > 1 && <div className="rounded-xl border bg-background p-3">
          <h4 className="text-sm font-semibold">Replay lineage / comparaison</h4>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{lineage.map((entry) => `${entry.captureLevel}:${entry.traceRunId} ← ${entry.replayOfTraceRunId}`).join("\n")}</p>
          <label className="mt-3 block text-xs font-medium text-muted-foreground">Comparer avec
            <select className="ml-2 min-h-10 rounded-lg border bg-background px-2 font-mono text-xs text-foreground" value={compareRunId} onChange={(event) => setCompareRunId(event.target.value)}>
              <option value="">Aucun</option>
              {lineage.filter((entry) => entry.traceRunId !== run.traceRunId).map((entry) => <option key={`compare:${entry.traceRunId}`} value={entry.traceRunId}>{entry.captureLevel} · {entry.traceRunId}</option>)}
            </select>
          </label>
          {comparison && <div className="mt-3 space-y-2 text-xs" data-testid="trace-inspector-comparison">
            <p className="font-mono">PRODUCT_ENVELOPE_EQUIVALENT={String(comparison.productEnvelopeEquivalent).toUpperCase()}</p>
            <p className="font-mono">DIAGNOSTIC_DETAIL_EQUIVALENT={String(comparison.diagnosticDetailEquivalent).toUpperCase()}</p>
            {comparison.differences.map((difference, index) => <p key={`${difference.stage}:${index}`} className="rounded-lg bg-muted p-2 font-mono">{difference.stage}: {difference.fields.join(", ")}</p>)}
          </div>}
        </div>}
      </div>}

      {viewLevel === "DIAGNOSTIC_DETAILS" && <div className="mt-4"><DiagnosticDetails run={run} /></div>}
      {viewLevel === "FORENSIC_DETAILS" && <div className="mt-4"><ForensicDetails key={run.traceRunId} run={run} /></div>}
    </>}
  </section>;
}
