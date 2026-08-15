import { useState } from "react";
import type { ConversationalWorkspaceSession } from "./ConversationalWorkspaceSession";
import ProjectPanel, { type ProjectPanelProjection, type ProjectPanelSection } from "./ProjectPanel";

type Props = {
  session: ConversationalWorkspaceSession;
  project: ProjectPanelProjection;
  timeline: React.ReactNode;
  mode?: "STANDARD" | "EXPERT";
  expertProjection?: React.ReactNode;
  onModeChange?: (mode: "STANDARD" | "EXPERT") => void;
  onRequestProjectEdit?: (sectionId: ProjectPanelSection["sectionId"]) => void;
};

export default function ConversationalProtocolDesignerShell({ session, project, timeline, mode = session.currentMode, expertProjection, onModeChange, onRequestProjectEdit }: Props) {
  const [mobileProjectOpen, setMobileProjectOpen] = useState(session.presentation.mobileProjectOpen);
  return <main id="demo-main" className="min-h-screen bg-background text-foreground" data-testid="conversational-protocol-designer-shell" data-session-id={session.sessionId}>
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Protocol Designer</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Construisons votre projet scientifique</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">Une conversation persistante, avec une projection du Research Project toujours accessible.</p>
        </div>
        <div className="inline-flex rounded-full border p-1" aria-label="Niveau de détail">
          <button type="button" aria-pressed={mode === "STANDARD"} onClick={() => onModeChange?.("STANDARD")} className="min-h-9 rounded-full px-3 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Standard</button>
          <button type="button" aria-pressed={mode === "EXPERT"} onClick={() => onModeChange?.("EXPERT")} className="min-h-9 rounded-full px-3 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">Expert</button>
        </div>
      </header>

      {mode === "EXPERT" && expertProjection}

      <button
        type="button"
        aria-expanded={mobileProjectOpen}
        aria-controls="conversational-mobile-project"
        onClick={() => setMobileProjectOpen((open) => !open)}
        className="sticky top-2 z-20 mb-5 min-h-11 w-full rounded-xl border bg-background px-4 py-3 text-left font-semibold shadow-sm lg:hidden"
      >
        {mobileProjectOpen ? "Masquer le Research Project" : "Voir le Research Project"}
      </button>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(300px,.65fr)_minmax(0,1.35fr)]">
        <div id="conversational-mobile-project" className={`${mobileProjectOpen ? "block" : "hidden"} min-w-0 lg:block`}>
          <ProjectPanel projection={project} mode={mode} onRequestEdit={onRequestProjectEdit} />
        </div>
        <div className="min-w-0">{timeline}</div>
      </div>
    </div>
  </main>;
}
