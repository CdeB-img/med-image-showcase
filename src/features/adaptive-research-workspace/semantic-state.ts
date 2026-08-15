import type { WorkspaceSemanticState, WorkspaceSemanticStatePresentation } from "./contracts";

const PRESENTATIONS: Record<WorkspaceSemanticState, Omit<WorkspaceSemanticStatePresentation, "state">> = {
  UNKNOWN: { label: "Information inconnue", visualIntent: "INFORMATION", indicator: "QUESTION", actionable: true, explanation: "L’information n’est pas disponible et ne doit pas être complétée artificiellement." },
  AMBIGUOUS: { label: "Ambiguïté ouverte", visualIntent: "CAUTION", indicator: "QUESTION", actionable: true, explanation: "Plusieurs interprétations restent recevables." },
  CANDIDATE: { label: "Proposition candidate", visualIntent: "INFORMATION", indicator: "RING", actionable: true, explanation: "La proposition n’est pas encore une décision adoptée." },
  ADOPTED: { label: "Adopté", visualIntent: "POSITIVE", indicator: "DOT", actionable: false, explanation: "Une décision humaine référencée a adopté cet élément." },
  REJECTED: { label: "Rejeté", visualIntent: "INACTIVE", indicator: "LOCK", actionable: false, explanation: "La proposition a été explicitement rejetée." },
  DEFERRED: { label: "Différé", visualIntent: "INACTIVE", indicator: "PAUSE", actionable: true, explanation: "L’élément reste ouvert jusqu’à un déclencheur explicite." },
  BLOCKING: { label: "Bloquant", visualIntent: "CRITICAL", indicator: "LOCK", actionable: true, explanation: "Une action propriétaire ne peut pas poursuivre dans l’état courant." },
  WARNING: { label: "Point de vigilance", visualIntent: "CAUTION", indicator: "RING", actionable: true, explanation: "La poursuite reste possible avec cette limite visible." },
  NOT_APPLICABLE: { label: "Non applicable", visualIntent: "INACTIVE", indicator: "DOT", actionable: false, explanation: "L’élément ne s’applique pas au contexte courant ; il ne manque pas." },
  NOT_EVALUABLE: { label: "Non évaluable", visualIntent: "CAUTION", indicator: "QUESTION", actionable: false, explanation: "Les preuves techniques nécessaires à l’évaluation ne sont pas disponibles." },
  NOT_GENERATABLE: { label: "Non générable", visualIntent: "CAUTION", indicator: "LOCK", actionable: true, explanation: "La projection documentaire ne peut pas encore être composée par DOC." },
  DEFERRED_TO_REALIZED_TIME: { label: "Différé au temps réalisé", visualIntent: "INACTIVE", indicator: "PAUSE", actionable: false, explanation: "L’évaluation appartient à une phase ultérieure et ne requiert pas d’action immédiate." },
  STALE: { label: "À réévaluer", visualIntent: "CAUTION", indicator: "RING", actionable: true, explanation: "La source a changé depuis la projection affichée." },
};

export const projectSemanticStateForWorkspace = (state: WorkspaceSemanticState): WorkspaceSemanticStatePresentation => ({ state, ...PRESENTATIONS[state] });
