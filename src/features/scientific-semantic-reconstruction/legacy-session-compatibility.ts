import { legacySemanticModelToContribution } from "@/features/scientific-interpretation/legacy-adapter";
import type { ScientificSemanticModel } from "./types";

/** Rollback/history-only bridge. It is loaded only when an old SEM workspace session exists. */
export const convertLegacySessionModel = (value: unknown) => legacySemanticModelToContribution(value as ScientificSemanticModel);
