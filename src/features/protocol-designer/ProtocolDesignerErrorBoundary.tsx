import { clearProtocolDesignerConversationalWorkspace } from "./conversation/reset";
import { Component, type ErrorInfo, type ReactNode } from "react";

type ProtocolDesignerErrorBoundaryProps = {
  children: ReactNode;
};

type PresentationDiagnostic = {
  code: "PROTOCOL_DESIGNER_PRESENTATION_FAILURE";
  path: string | null;
  owner: "PROTOCOL_DESIGNER_PRESENTATION";
  message: string;
};

type ProtocolDesignerErrorBoundaryState = {
  diagnostic: PresentationDiagnostic | null;
};

const diagnosticFrom = (error: unknown): PresentationDiagnostic => {
  const candidate = error && typeof error === "object" ? error as { issues?: Array<{ path?: unknown[] }>; message?: unknown } : null;
  const path = candidate?.issues?.[0]?.path?.map(String).join(".") || null;
  return {
    code: "PROTOCOL_DESIGNER_PRESENTATION_FAILURE",
    path,
    owner: "PROTOCOL_DESIGNER_PRESENTATION",
    message: typeof candidate?.message === "string" ? candidate.message : "Une exception de présentation non qualifiée a été interceptée.",
  };
};

export default class ProtocolDesignerErrorBoundary extends Component<ProtocolDesignerErrorBoundaryProps, ProtocolDesignerErrorBoundaryState> {
  state: ProtocolDesignerErrorBoundaryState = { diagnostic: null };

  static getDerivedStateFromError(error: unknown): ProtocolDesignerErrorBoundaryState {
    return { diagnostic: diagnosticFrom(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("PROTOCOL_DESIGNER_PRESENTATION_FAILURE", {
      diagnostic: diagnosticFrom(error),
      componentStack: info.componentStack,
    });
  }

  private retry = () => this.setState({ diagnostic: null });

  private reset = () => {
    clearProtocolDesignerConversationalWorkspace(window.localStorage);
    this.setState({ diagnostic: null });
  };

  render() {
    const { diagnostic } = this.state;
    if (!diagnostic) return this.props.children;
    return <main className="min-h-[60vh] bg-background px-4 py-16 text-foreground">
      <section role="alert" className="mx-auto max-w-3xl rounded-2xl border border-amber-500/50 bg-card p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-700 dark:text-amber-200">Récupération de l’affichage</p>
        <h1 className="mt-3 text-2xl font-bold">L’espace Protocol Designer a rencontré une erreur d’affichage.</h1>
        <p className="mt-3 text-muted-foreground">L’application reste disponible. Aucun contenu scientifique n’a été inventé et aucune écriture Project n’a été autorisée.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={this.retry} className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">Réessayer l’affichage</button>
          <button type="button" onClick={this.reset} className="rounded-lg border px-4 py-2">Réinitialiser l’espace Protocol Designer</button>
        </div>
        <details className="mt-5 rounded-xl border p-4 text-sm">
          <summary className="cursor-pointer font-medium">Diagnostic technique</summary>
          <dl className="mt-3 grid gap-2 text-muted-foreground">
            <div><dt className="font-medium text-foreground">Code</dt><dd>{diagnostic.code}</dd></div>
            <div><dt className="font-medium text-foreground">Owner</dt><dd>{diagnostic.owner}</dd></div>
            {diagnostic.path && <div><dt className="font-medium text-foreground">Schema path</dt><dd>{diagnostic.path}</dd></div>}
          </dl>
        </details>
      </section>
    </main>;
  }
}

