import { logicalDigest } from "../knowledge-engine/canonical.js";

/** Prospective scenarios owned by BIOSTATISTICS. f is Cohen's f for ANOVA;
 * fSquared is the incremental explained/unexplained variance for regression.
 * Quotas do not turn a regression into an omnibus comparison. */
export type FDimensioningInput = {
  method: "ONE_WAY_ANOVA" | "LINEAR_REGRESSION";
  alpha: number; power: number; effectSize: number;
  groups: number; testedPredictors: number; totalPredictors: number;
  allocation: "BALANCED_GROUPS" | "UNSTRATIFIED" | "BALANCED_QUOTAS";
  quotaStrata: number;
  anticipatedNonEvaluableRate: number;
  visits: "SINGLE" | "REPEATED";
  nonEvaluableReasons: string[];
  assumptions: Array<{ parameter: string; value: number; provenance: "PROVISIONAL_ASSUMPTION" | "USER_ASSUMPTION" | "EVIDENCE_SUPPORTED_PROPOSAL"; sourceRef: string }>;
};

// Lanczos log-gamma and continued-fraction incomplete beta. Numerical work is
// deliberately local to the existing calculator, with no provider dependency.
const logGamma = (z: number): number => {
  const coefficients = [676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1; let x = 0.9999999999998099;
  coefficients.forEach((c, i) => { x += c / (z + i + 1); });
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
};
const betaFraction = (a: number, b: number, x: number) => {
  const floor = 1e-300;
  const protect = (v: number) => Math.abs(v) < floor ? floor : v;
  let c = 1, d = 1 / protect(1 - (a + b) * x / (a + 1)), h = d;
  for (let m = 1; m <= 1000; m += 1) {
    const m2 = 2 * m;
    for (const aa of [m * (b - m) * x / ((a + m2 - 1) * (a + m2)),
      -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1))]) {
      d = 1 / protect(1 + aa * d); c = protect(1 + aa / c);
      const delta = d * c; h *= delta;
      if (aa < 0 && Math.abs(delta - 1) < 3e-14) return h;
    }
  }
  throw new Error("DIMENSIONING_BETA_DID_NOT_CONVERGE");
};
const regularizedBeta = (x: number, a: number, b: number): number => {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log1p(-x));
  return x < (a + 1) / (a + b + 2) ? front * betaFraction(a, b, x) / a
    : 1 - front * betaFraction(b, a, 1 - x) / b;
};
export const prospectiveFPower = (n: number, input: Pick<FDimensioningInput, "method" | "groups" | "testedPredictors" | "totalPredictors" | "alpha" | "effectSize">) => {
  const numeratorDf = input.method === "ONE_WAY_ANOVA" ? input.groups - 1 : input.testedPredictors;
  const denominatorDf = input.method === "ONE_WAY_ANOVA" ? n - input.groups : n - input.totalPredictors - 1;
  if (numeratorDf <= 0 || denominatorDf <= 0) throw new Error("DIMENSIONING_DEGREES_OF_FREEDOM_INVALID");
  // Critical central F quantile in its beta coordinate; this coordinate remains
  // unchanged in every Poisson term of the noncentral distribution.
  let lo = 0, hi = 1;
  for (let i = 0; i < 80; i += 1) {
    const mid = (lo + hi) / 2;
    if (regularizedBeta(mid, numeratorDf / 2, denominatorDf / 2) < 1 - input.alpha) lo = mid; else hi = mid;
  }
  const x = (lo + hi) / 2;
  const lambda = n * (input.method === "ONE_WAY_ANOVA" ? input.effectSize ** 2 : input.effectSize);
  const mean = lambda / 2;
  if (!Number.isFinite(mean) || mean > 10000) throw new Error("DIMENSIONING_NUMERICAL_SCOPE_EXCEEDED");
  if (mean === 0) return input.alpha;
  // Start at the Poisson mode to avoid exp(-lambda/2) underflow.
  const mode = Math.floor(mean), weight = Math.exp(-mean + mode * Math.log(mean) - logGamma(mode + 1));
  const tail = (j: number) => regularizedBeta(1 - x, denominatorDf / 2, numeratorDf / 2 + j);
  let power = weight * tail(mode), mass = weight, down = weight, up = weight;
  for (let step = 1; step <= 2000; step += 1) {
    if (step <= mode) { down *= (mode - step + 1) / mean; power += down * tail(mode - step); mass += down; }
    up *= mean / (mode + step); power += up * tail(mode + step); mass += up;
    if (step > Math.sqrt(mean) * 10 + 10 && up < 1e-15 && (step > mode || down < 1e-15)) break;
  }
  if (Math.abs(mass - 1) > 1e-10) throw new Error("DIMENSIONING_POISSON_DID_NOT_CONVERGE");
  return Math.max(0, Math.min(1, power));
};

export const calculateFDimensioning = (input: FDimensioningInput) => {
  if (![input.alpha, input.power, input.effectSize, input.anticipatedNonEvaluableRate].every(Number.isFinite)
    || input.alpha <= 0 || input.alpha >= 0.5 || input.power <= input.alpha || input.power >= 1
    || input.effectSize <= 0 || input.anticipatedNonEvaluableRate < 0 || input.anticipatedNonEvaluableRate >= 1)
    throw new Error("DIMENSIONING_PARAMETERS_INVALID");
  if (![input.groups, input.testedPredictors, input.totalPredictors, input.quotaStrata].every(Number.isSafeInteger)
    || input.groups < 2 || input.groups > 100 || input.testedPredictors < 1 || input.totalPredictors < input.testedPredictors
    || input.totalPredictors > 100 || input.quotaStrata < 1 || input.quotaStrata > 100)
    throw new Error("DIMENSIONING_MODEL_INVALID");
  if (input.method === "ONE_WAY_ANOVA" && input.allocation !== "BALANCED_GROUPS"
    || input.method === "LINEAR_REGRESSION" && input.allocation === "BALANCED_GROUPS") throw new Error("DIMENSIONING_ALLOCATION_INVALID");
  if (input.visits === "SINGLE" && input.nonEvaluableReasons.some(r => /LOST_TO_FOLLOW_UP|perte.*suivi/iu.test(r)))
    throw new Error("DIMENSIONING_SINGLE_VISIT_NOT_LOST_TO_FOLLOW_UP");
  if (input.anticipatedNonEvaluableRate > 0 && !input.nonEvaluableReasons.length) throw new Error("DIMENSIONING_NON_EVALUABLE_REASONS_REQUIRED");
  const parameters: Record<string, number> = { alpha: input.alpha, power: input.power, effectSize: input.effectSize,
    anticipatedNonEvaluableRate: input.anticipatedNonEvaluableRate };
  for (const [parameter, value] of Object.entries(parameters)) {
    const assumption = input.assumptions.find(a => a.parameter === parameter);
    if (!assumption?.sourceRef.trim() || assumption.value !== value) throw new Error(`DIMENSIONING_ASSUMPTION_REQUIRED:${parameter}`);
  }
  const strata = input.allocation === "BALANCED_GROUPS" ? input.groups : input.allocation === "BALANCED_QUOTAS" ? input.quotaStrata : 1;
  const minimum = (input.method === "ONE_WAY_ANOVA" ? input.groups + 1 : input.totalPredictors + 2);
  let lo = Math.ceil(minimum / strata), hi = lo;
  while (prospectiveFPower(hi * strata, input) < input.power) {
    hi *= 2;
    if (hi * strata > 1000000) throw new Error("DIMENSIONING_SAMPLE_SIZE_SCOPE_EXCEEDED");
  }
  while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (prospectiveFPower(mid * strata, input) >= input.power) hi = mid; else lo = mid + 1; }
  const evaluableTotal = lo * strata, recruitedPerStratum = Math.ceil(lo / (1 - input.anticipatedNonEvaluableRate));
  if (!Number.isSafeInteger(recruitedPerStratum * strata)) throw new Error("DIMENSIONING_RECRUITMENT_SCOPE_EXCEEDED");
  return Object.freeze({ owner: "BIOSTATISTICS" as const, calculationId: `dimensioning:${logicalDigest(input)}`,
    methodVersion: "NONCENTRAL_F_1", methodIdentity: input.method,
    effectSizeMeaning: input.method === "ONE_WAY_ANOVA" ? "COHEN_F" : "INCREMENTAL_COHEN_F_SQUARED",
    inputs: structuredClone(input), evaluableTotal, evaluablePerStratum: lo, recruitedPerStratum,
    totalSampleSize: recruitedPerStratum * strata, strata, achievedPower: prospectiveFPower(evaluableTotal, input),
    allocation: input.allocation, roundingPolicy: "CEILING_WITHIN_EACH_GROUP_OR_QUOTA_AFTER_NON_EVALUABILITY",
    status: "CALCULATED_SCENARIO_NOT_PROJECT_DECISION", projectWriteAuthorized: false as const,
    limitations: ["Independent observations; normal errors; common residual variance; prespecified F test.",
      "No guarantee for nonlinearity, unequal variances, clustering, missing-not-at-random or multiplicity.",
      "Numerical hypotheses are not literature evidence, recruitment decisions or Project adoption."] });
};
export type FDimensioningCandidate = ReturnType<typeof calculateFDimensioning>;

export const TWO_GROUP_CONTINUOUS_DIMENSIONING_VERSION = "1.0.0" as const;
export const TWO_GROUP_CONTINUOUS_DIMENSIONING_METHOD = "TWO_GROUP_CONTINUOUS_NORMAL_APPROXIMATION_EQUAL_ALLOCATION" as const;

/** Conversation adapter to the existing bounded calculator, not an extractor
 * or a Project decision. Only explicitly labelled numerical assumptions enter. */
export const prepareConversationalDimensioning = (input: {
  turns: readonly Readonly<{ turnRef: string; role: string; content: string | null }>[];
  acceptedVisibleProposal?: Readonly<{ turnRef: string; content: string; decisionTurnRef: string }>;
}) => {
  const latest = [...input.turns].reverse().find(turn => turn.role === "USER");
  const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const userSources = input.turns.filter(turn => turn.role === "USER" && turn.content !== null)
    .map(turn => ({ turnRef: turn.turnRef, content: turn.content!, origin: "USER_DECLARED_ASSUMPTION" as const, decisionTurnRef: null as string | null }));
  const sources = [...userSources, ...(input.acceptedVisibleProposal ? [{ ...input.acceptedVisibleProposal,
    origin: "MODEL_SUGGESTED_ASSUMPTION" as const }] : [])];
  const requested = Boolean(latest?.content && /calcul|dimensionn|combien/u.test(fold(latest.content))
    && sources.some(source => /effectif|sujets|participants|echantillon|puissance|\bsd\b|ecart.type/u.test(fold(source.content))))
    || Boolean(input.acceptedVisibleProposal && /effectif|puissance|\bsd\b|ecart.type/u.test(fold(input.acceptedVisibleProposal.content)));
  const specifications = [
    ["difference", "(?:difference(?: cible)?|effet cible|delta)"],
    ["commonStandardDeviation", "(?:sd|ecart[ -]type|dispersion)"],
    ["twoSidedAlpha", "alpha(?: bilateral)?"],
    ["power", "(?:puissance|power)"],
    ["anticipatedNonEvaluableRate", "(?:non[ -]evaluabilite|taux(?: anticipe)? de non[ -]evaluables|pertes(?: de suivi)?|nonEvaluableRate)"],
  ] as const;
  const assumptions: Array<{ parameter: typeof specifications[number][0]; value: number; unit: string | null;
    origin: "USER_DECLARED_ASSUMPTION" | "MODEL_SUGGESTED_ASSUMPTION"; sourceTurnRef: string;
    sourceText: string; decisionTurnRef: string | null; status: "CALCULATION_INPUT_NOT_PROJECT_DECISION" }> = [];
  const ambiguous: string[] = [];
  for (const [parameter, label] of specifications) {
    // The latest source with this labelled parameter is authoritative for this
    // calculation scenario. Two values in the same source remain ambiguous.
    for (const source of [...sources].reverse()) {
      const matches = [...fold(source.content).matchAll(new RegExp(`\\b${label}\\s*(?:=|:|de|a)?\\s*([+-]?\\d+(?:[.,]\\d+)?)\\s*(%|points?|unites?)?(?![\\p{L}\\d]|[.,]\\d)`, "giu"))];
      if (!matches.length) continue;
      if (matches.length !== 1 || /^[–—-]\s*\d/u.test(fold(source.content).slice(matches[0]!.index! + matches[0]![0].length))) { ambiguous.push(parameter); break; }
      const match = matches[0]!; let value = Number(match[1]!.replace(",", "."));
      const proportion = ["twoSidedAlpha", "power", "anticipatedNonEvaluableRate"].includes(parameter);
      if (proportion && match[2] === "%") value /= 100;
      assumptions.push({ parameter, value, unit: match[2] ?? null, origin: source.origin,
        sourceTurnRef: source.turnRef, sourceText: source.content.slice(match.index, match.index! + match[0].length).trim(),
        decisionTurnRef: source.decisionTurnRef, status: "CALCULATION_INPUT_NOT_PROJECT_DECISION" });
      break;
    }
  }
  const missing: string[] = specifications.map(([parameter]) => parameter).filter(parameter => !assumptions.some(a => a.parameter === parameter));
  const scoped = [...sources].reverse().find(source => /\b(?:\d+|deux|trois|quatre|six) groupes\b/u.test(fold(source.content)));
  const scopeText = fold(scoped?.content ?? "");
  const scopeSupported = /\b(?:deux|2) groupes independants\b/u.test(scopeText)
    && !/\b(?:pas|sans) (?:deux|2) groupes\b/u.test(scopeText)
    && /moyenn|(?:variable|critere|marqueur) continu/u.test(scopeText)
    && /allocation egale|allocation 1\s*[:/]\s*1/u.test(scopeText);
  if (!scopeSupported) missing.push("explicitSupportedTwoGroupComparison");
  const differenceUnit = assumptions.find(a => a.parameter === "difference")?.unit;
  const sdUnit = assumptions.find(a => a.parameter === "commonStandardDeviation")?.unit;
  if (differenceUnit && sdUnit && differenceUnit.replace(/s$/u, "") !== sdUnit.replace(/s$/u, "")) ambiguous.push("incompatibleDifferenceAndDispersionUnits");
  const base = { owner: "BIOSTATISTICS" as const, requested, assumptions, missingInputs: [...missing, ...ambiguous],
    methodIdentity: TWO_GROUP_CONTINUOUS_DIMENSIONING_METHOD,
    literatureDerivedAssumptions: [] as readonly string[], projectWriteAuthorized: false as const,
    interpretation: "Numerical assumptions are calculation inputs, not scientific evidence or adopted Project decisions." };
  if (!requested || missing.length || ambiguous.length) return { ...base,
    status: !requested ? "NOT_REQUESTED" as const : "INPUTS_OR_SUPPORTED_METHOD_REQUIRED" as const, calculation: null };
  const values = Object.fromEntries(assumptions.map(a => [a.parameter, a.value]));
  const sourceRefs = Object.fromEntries(assumptions.map(a => [a.parameter, `${a.sourceTurnRef}:${a.parameter}`]));
  try {
    const calculation = calculateTwoGroupContinuousSampleSize({ ...values, sourceRefs } as TwoGroupContinuousDimensioningInput);
    return { ...base, status: "CALCULATED_SCENARIO_NOT_PROJECT_DECISION" as const, calculation };
  } catch (error) {
    return { ...base, status: "INVALID_INPUTS" as const, calculation: null,
      missingInputs: [...base.missingInputs, error instanceof Error ? error.message : "DIMENSIONING_INPUT_INVALID"] };
  }
};

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
