import type { FunctionalResetSession } from "./session";
import TraceInspector from "./TraceInspector";

type Props = {
  session: FunctionalResetSession;
};

const DiagnosticRow = ({ label, value }: { label: string; value: string | number | null }) => <div className="min-w-0 rounded-xl border bg-background p-3">
  <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
  <dd className="mt-1 break-all font-mono text-xs">{value ?? "NONE"}</dd>
</div>;

export default function DevelopmentDiagnostics({ session }: Props) {
  const decisions = session.entries.filter((entry) => entry.kind === "REVIEW" && entry.decision);
  const rawState = {
    session: {
      contract: session.contract,
      contractVersion: session.contractVersion,
      sessionId: session.sessionId,
      conversationId: session.conversationId,
    },
    project: session.project,
    queryNavigation: session.queryNavigation,
    documents: session.documents,
    decisions: decisions.map((entry) => entry.kind === "REVIEW" ? entry.decision : null),
    latestBridgeTrace: session.bridgeTraces.at(-1) ?? null,
  };

  return <section className="mb-5 rounded-3xl border bg-card p-4 shadow-sm sm:p-5" aria-labelledby="development-diagnostics-title" data-testid="protocol-designer-development-diagnostics">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">DEV / Expert</p>
      <h2 id="development-diagnostics-title" className="mt-1 text-lg font-semibold">Diagnostic technique</h2>
      <p className="mt-1 text-sm text-muted-foreground">Cette vue détaille le même état que la surface Standard. Elle ne possède aucun Project, QRY ou portefeuille documentaire distinct.</p>
    </div>

    <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <DiagnosticRow label="Session ID" value={session.sessionId} />
      <DiagnosticRow label="Conversation ID" value={session.conversationId} />
      <DiagnosticRow label="Project ID" value={session.project?.projectId ?? session.projectId} />
      <DiagnosticRow label="Project version" value={session.project?.versionId ?? null} />
      <DiagnosticRow label="Project digest" value={session.project?.projectDigest ?? null} />
      <DiagnosticRow label="QRY status" value={session.queryNavigation?.status ?? null} />
      <DiagnosticRow label="Décisions enregistrées" value={decisions.length} />
      <DiagnosticRow label="Document projections" value={session.documents.projections.length} />
    </dl>

    <TraceInspector ledger={session.scientificExecutionTraceLedger} />

    <details className="mt-4 rounded-2xl border bg-background p-3">
      <summary className="cursor-pointer text-sm font-medium">Objets, contrats et dernière trace</summary>
      <pre className="mt-3 max-h-[34rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-muted p-3 text-xs leading-relaxed">{JSON.stringify(rawState, null, 2)}</pre>
    </details>
  </section>;
}
