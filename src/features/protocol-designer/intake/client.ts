import { parseScientificIntakeInterpretation, type scientificIntakeRequestSchema } from "./schema";
import type { ScientificIntakeInterpretation } from "./types";
import type { z } from "zod";

export class IntakeClientError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

export const requestScientificInterpretation = async (request: z.infer<typeof scientificIntakeRequestSchema>) => {
  const response = await fetch("/api/scientific-intake", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request), credentials: "same-origin",
  });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new IntakeClientError(value?.error?.code ?? "API_UNAVAILABLE", value?.error?.message ?? "Interprétation indisponible.");
  const parsed = parseScientificIntakeInterpretation(value);
  if (!parsed.success) throw new IntakeClientError("INVALID_PROVIDER_RESPONSE", "Réponse structurée invalide.");
  return parsed.data as ScientificIntakeInterpretation;
};
