import { canonicalizeQueryNavigation, makeQueryNavigationId, queryNavigationDigest } from "./canonical";
import type { QueryNavigationMemory, QuestionResponseEnvelope, SelectedNavigationAction } from "./lifecycle-contracts";

export const canonicalizeSelectedNavigationAction = (action: SelectedNavigationAction) => canonicalizeQueryNavigation({ ...action, digest: "", reason: "" });

export const canonicalizeQuestionResponseEnvelope = (response: QuestionResponseEnvelope) => canonicalizeQueryNavigation({
  ...response,
  receivedAt: "",
  digest: "",
});

export const canonicalizeQueryNavigationMemory = (memory: QueryNavigationMemory) => canonicalizeQueryNavigation({
  ...memory,
  events: memory.events.map((event) => ({ ...event, recordedAt: "" })),
  responses: memory.responses.map((response) => ({ ...response, receivedAt: "", digest: "" })),
  selectedActions: memory.selectedActions.map((action) => ({ ...action, reason: "", digest: "" })),
  digest: "",
});

export const computeSelectedActionDigest = (action: SelectedNavigationAction) => queryNavigationDigest(JSON.parse(canonicalizeSelectedNavigationAction(action)));
export const computeQuestionResponseDigest = (response: QuestionResponseEnvelope) => queryNavigationDigest(JSON.parse(canonicalizeQuestionResponseEnvelope(response)));
export const computeNavigationMemoryDigest = (memory: QueryNavigationMemory) => queryNavigationDigest(JSON.parse(canonicalizeQueryNavigationMemory(memory)));
export const makeLifecycleId = (kind: string, value: unknown) => makeQueryNavigationId(`qry-${kind}`, value);
