/** Existing dated technical declarations, not live availability, security
 * authorization, budget or qualification evidence. No model is added here.
 * Pricing stays in provider-call-observability and is referenced by model ID.
 */
type ModelDeclaration = Readonly<{
  provider: "OPENAI" | "GOOGLE_GEMINI";
  azureDeployment: string | null;
  azureLocalAdmission: boolean;
  limits: Readonly<{ context: number; input: number; output: number }>;
}>;
export const PROVIDER_MODEL_DECLARATIONS: Readonly<Record<string, ModelDeclaration>> = Object.freeze({
  "gpt-6-sol": { provider: "OPENAI", azureDeployment: "gpt-6-sol", azureLocalAdmission: true,
    limits: { context: 1_050_000, input: 922_000, output: 128_000 } },
  "gpt-5.6-sol": { provider: "OPENAI", azureDeployment: "gpt-5.6-sol", azureLocalAdmission: true,
    limits: { context: 1_050_000, input: 1_050_000, output: 128_000 } },
  "gpt-5.6-luna": { provider: "OPENAI", azureDeployment: "gpt-5.6-terra", azureLocalAdmission: false,
    limits: { context: 1_050_000, input: 1_050_000, output: 128_000 } },
  "gpt-5.6-terra": { provider: "OPENAI", azureDeployment: "gpt-6-sol", azureLocalAdmission: true,
    limits: { context: 1_050_000, input: 1_050_000, output: 128_000 } },
  "gemini-3.5-flash-lite": { provider: "GOOGLE_GEMINI", azureDeployment: null, azureLocalAdmission: false,
    limits: { context: 1_048_576, input: 1_048_576, output: 65_536 } },
});
export const providerModelDeclaration = (model: string): ModelDeclaration | null =>
  Object.prototype.hasOwnProperty.call(PROVIDER_MODEL_DECLARATIONS, model) ? PROVIDER_MODEL_DECLARATIONS[model] : null;
export const TERRA_REQUESTED_MODEL = "gpt-5.6-terra" as const;
