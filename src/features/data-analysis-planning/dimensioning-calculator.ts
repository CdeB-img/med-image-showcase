import { logicalDigest } from "@/features/knowledge-engine/canonical";

export const TWO_GROUP_CONTINUOUS_DIMENSIONING_VERSION = "1.0.0" as const;
export const TWO_GROUP_CONTINUOUS_DIMENSIONING_METHOD = "TWO_GROUP_CONTINUOUS_NORMAL_APPROXIMATION_EQUAL_ALLOCATION" as const;

export type TwoGroupContinuousDimensioningInput = {
  difference: number;
  commonStandardDeviation: number;
  twoSidedAlpha: number;
  power: number;
  anticipatedNonEvaluableRate: number;
  sourceRefs: {
    difference: string;
    commonStandardDeviation: string;
    twoSidedAlpha: string;
    power: string;
    anticipatedNonEvaluableRate: string;
  };
};

export type DimensioningCalculationCandidate = {
  calculationId: string;
  methodIdentity: typeof TWO_GROUP_CONTINUOUS_DIMENSIONING_METHOD;
  methodVersion: typeof TWO_GROUP_CONTINUOUS_DIMENSIONING_VERSION;
  formula: "n_per_group = ceil(2 * (z_(1-alpha/2) + z_power)^2 * sigma^2 / delta^2 / (1-non_evaluable_rate))";
  inputs: TwoGroupContinuousDimensioningInput;
  quantiles: { alpha: number; power: number };
  unadjustedPerGroup: number;
  adjustedPerGroup: number;
  totalSampleSize: number;
  roundingPolicy: "CEILING_PER_GROUP_AFTER_NON_EVALUABLE_ADJUSTMENT";
  assumptions: readonly [
    "TWO_INDEPENDENT_GROUPS",
    "EQUAL_ALLOCATION",
    "COMMON_STANDARD_DEVIATION",
    "NORMAL_APPROXIMATION",
    "TWO_SIDED_ALPHA",
  ];
  limitations: readonly string[];
  epistemicStatus: "CALCULATION_CANDIDATE_NOT_PROJECT_DECISION";
  projectWriteAuthorized: false;
};

// Acklam's deterministic approximation, used only inside the bounded formula above.
const inverseStandardNormal = (probability: number) => {
  if (!(probability > 0 && probability < 1)) throw new Error("DIMENSIONING_PROBABILITY_OUT_OF_RANGE");
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  const high = 1 - low;
  if (probability < low) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!)
      / ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  if (probability > high) {
    const q = Math.sqrt(-2 * Math.log(1 - probability));
    return -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!)
      / ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  const q = probability - 0.5;
  const r = q * q;
  return (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q
    / (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
};

export const calculateTwoGroupContinuousSampleSize = (
  input: Readonly<TwoGroupContinuousDimensioningInput>,
): Readonly<DimensioningCalculationCandidate> => {
  if (!Number.isFinite(input.difference) || input.difference <= 0) throw new Error("DIMENSIONING_DIFFERENCE_INVALID");
  if (!Number.isFinite(input.commonStandardDeviation) || input.commonStandardDeviation <= 0) throw new Error("DIMENSIONING_STANDARD_DEVIATION_INVALID");
  if (!(input.twoSidedAlpha > 0 && input.twoSidedAlpha < 1)) throw new Error("DIMENSIONING_ALPHA_INVALID");
  if (!(input.power > 0 && input.power < 1)) throw new Error("DIMENSIONING_POWER_INVALID");
  if (!(input.anticipatedNonEvaluableRate >= 0 && input.anticipatedNonEvaluableRate < 1)) throw new Error("DIMENSIONING_NON_EVALUABLE_RATE_INVALID");
  if (Object.values(input.sourceRefs).some((ref) => !ref.trim())) throw new Error("DIMENSIONING_SOURCE_REFERENCE_REQUIRED");
  const alphaQuantile = inverseStandardNormal(1 - input.twoSidedAlpha / 2);
  const powerQuantile = inverseStandardNormal(input.power);
  const unadjustedPerGroup = 2 * ((alphaQuantile + powerQuantile) ** 2)
    * (input.commonStandardDeviation ** 2) / (input.difference ** 2);
  const adjustedPerGroup = Math.ceil(unadjustedPerGroup / (1 - input.anticipatedNonEvaluableRate));
  const material = {
    methodIdentity: TWO_GROUP_CONTINUOUS_DIMENSIONING_METHOD,
    methodVersion: TWO_GROUP_CONTINUOUS_DIMENSIONING_VERSION,
    input,
  };
  return Object.freeze({
    calculationId: `dimensioning-calculation:${logicalDigest(material)}`,
    methodIdentity: TWO_GROUP_CONTINUOUS_DIMENSIONING_METHOD,
    methodVersion: TWO_GROUP_CONTINUOUS_DIMENSIONING_VERSION,
    formula: "n_per_group = ceil(2 * (z_(1-alpha/2) + z_power)^2 * sigma^2 / delta^2 / (1-non_evaluable_rate))",
    inputs: structuredClone(input),
    quantiles: { alpha: alphaQuantile, power: powerQuantile },
    unadjustedPerGroup,
    adjustedPerGroup,
    totalSampleSize: adjustedPerGroup * 2,
    roundingPolicy: "CEILING_PER_GROUP_AFTER_NON_EVALUABLE_ADJUSTMENT",
    assumptions: ["TWO_INDEPENDENT_GROUPS", "EQUAL_ALLOCATION", "COMMON_STANDARD_DEVIATION", "NORMAL_APPROXIMATION", "TWO_SIDED_ALPHA"] as const,
    limitations: [
      "Calcul candidat limité à deux groupes indépendants avec allocation égale et outcome continu.",
      "La pertinence des hypothèses numériques et de cette approximation exige une décision humaine mandatée.",
      "Ce calcul n’est ni une AnalysisExecution ni un AnalysisResult.",
    ],
    epistemicStatus: "CALCULATION_CANDIDATE_NOT_PROJECT_DECISION",
    projectWriteAuthorized: false,
  });
};
