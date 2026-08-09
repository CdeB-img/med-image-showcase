import { logicalDigest, normalizeScientificText } from "@/features/knowledge-engine/canonical";
import type { ChangeEvent, ScientificThinkingOutput } from "./types";

const tokens = (value: string) => new Set(normalizeScientificText(value).toLocaleLowerCase("fr-FR").split(/[^\p{L}\p{N}-]+/u).filter((item) => item.length > 3));

export const assessScientificThinkingChange = (
  previousExpression: string,
  nextExpression: string,
  previousOutput?: ScientificThinkingOutput,
): ChangeEvent => {
  const before = tokens(previousExpression);
  const after = tokens(nextExpression);
  const shared = [...before].filter((item) => after.has(item)).length;
  const overlap = shared / Math.max(1, Math.min(before.size, after.size));
  const major = overlap < 0.55;
  const affectedElementIds = previousOutput ? [
    ...previousOutput.questions.map((item) => item.questionId),
    ...previousOutput.hypotheses.map((item) => item.hypothesisId),
    ...previousOutput.objectives.map((item) => item.objectiveId),
    ...previousOutput.mechanisms.map((item) => item.mechanismId),
  ] : [];
  const material = { previousExpression, nextExpression, major, affectedElementIds };
  return {
    changeId: `scientific-thinking-change:${logicalDigest(material)}`,
    kind: major ? "MAJOR" : "MINOR",
    description: major
      ? "La modification change l’objet, la relation ou la portée de la question et exige une reconstruction visible."
      : "La modification affine la formulation sans changer la branche scientifique principale.",
    affectedElementIds: major ? affectedElementIds : previousOutput?.questions.map((item) => item.questionId) ?? [],
    requiresHumanConfirmation: major,
    status: major ? "PENDING_CONFIRMATION" : "RECORDED",
  };
};

export const decideScientificThinkingChange = (change: ChangeEvent, approved: boolean): ChangeEvent => ({
  ...change,
  status: approved ? "CONFIRMED" : "REJECTED",
});
