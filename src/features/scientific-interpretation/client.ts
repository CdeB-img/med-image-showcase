import { SCIENTIFIC_INTERPRETATION_API_VERSION, isScientificInterpretationApiResponse, type ScientificInterpretationApiRequest, type ScientificInterpretationApiResponse } from "./transport";

export class ScientificInterpretationClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly technicalStatus: string = "FAIL_CLOSED",
    readonly rawOutputRef: string | null = null,
  ) { super(message); }
}

export const requestScientificInterpretationRuntime = async (
  request: Omit<ScientificInterpretationApiRequest, "apiVersion">,
): Promise<ScientificInterpretationApiResponse> => {
  const response = await fetch("/api/scientific-interpretation", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...request, apiVersion: SCIENTIFIC_INTERPRETATION_API_VERSION }),
    credentials: "same-origin",
  });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new ScientificInterpretationClientError(
    value?.error?.code ?? "API_UNAVAILABLE",
    value?.error?.message ?? "Interprétation scientifique indisponible.",
    value?.technicalStatus ?? "FAIL_CLOSED",
    value?.error?.rawOutputRef ?? null,
  );
  if (!isScientificInterpretationApiResponse(value)) throw new ScientificInterpretationClientError("INVALID_RUNTIME_RESPONSE", "Réponse Scientific Interpretation invalide.");
  return value;
};
