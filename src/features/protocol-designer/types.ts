export type ScenarioId = "spectral" | "cardiac" | "neuro";

export type EvidenceReference = {
  label: string;
  locator: string;
  contribution: string;
};

export type MissingInformation = {
  id: string;
  label: string;
  why: string;
  critical: boolean;
};

export type StrategyOption = {
  id: string;
  title: string;
  benefit: string;
  tradeoff: string;
  condition: string;
};

export type DemonstratorScenario = {
  id: ScenarioId;
  shortLabel: string;
  title: string;
  intent: string;
  program: {
    id: "NXP-000001" | "NXP-000002" | "NXP-000003";
    title: string;
    version: string;
  };
  reasoningBook: {
    id: "RB-003" | "RB-004" | "RB-005";
    title: string;
    version: string;
  };
  comprehension: string;
  constructs: string[];
  hypotheses: string[];
  missingInformation: MissingInformation[];
  strategies: StrategyOption[];
  evidence: EvidenceReference[];
  limitations: string[];
  controversy: string;
  openQuestion: string;
};

export type IntentChoice = {
  id: string;
  label: string;
  explanation: string;
};
