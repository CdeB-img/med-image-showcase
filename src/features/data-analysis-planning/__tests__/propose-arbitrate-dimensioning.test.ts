import { describe, expect, it } from "vitest";
import oracle from "./fixtures/noncentral-f-oracle.json";
import { calculateFDimensioning, prospectiveFPower, type FDimensioningInput } from "../dimensioning-calculator";
const makeInput = (o = oracle.cases[0]!): FDimensioningInput => ({
  method: o.method as FDimensioningInput["method"], alpha: o.alpha, power: o.power, effectSize: o.effectSize,
  groups: o.groups, testedPredictors: o.testedPredictors, totalPredictors: o.totalPredictors,
  allocation: o.method === "ONE_WAY_ANOVA" ? "BALANCED_GROUPS" : o.strata > 1 ? "BALANCED_QUOTAS" : "UNSTRATIFIED",
  quotaStrata: o.strata, anticipatedNonEvaluableRate: o.rate, visits: "SINGLE", nonEvaluableReasons: ["Incomplete or uninterpretable collection"],
  assumptions: [["alpha", o.alpha], ["power", o.power], ["effectSize", o.effectSize], ["anticipatedNonEvaluableRate", o.rate]].map(([parameter, value]) => ({ parameter: String(parameter), value: Number(value), provenance: "PROVISIONAL_ASSUMPTION", sourceRef: "SCIPY_ORACLE_SCENARIO_NOT_EVIDENCE" })),
});
describe("Existing BIOSTATISTICS calculator — generic prospective F tests", () => {
  it.each(oracle.cases)("matches independent SciPy oracle: $method / $groups groups / $strata strata", o => {
    const input = makeInput(o), result = calculateFDimensioning(input);
    expect(result.evaluableTotal).toBe(o.evaluableTotal); expect(result.recruitedPerStratum).toBe(o.recruitedPerStratum);
    expect(result.totalSampleSize).toBe(o.recruitedPerStratum * o.strata);
    expect(result.achievedPower).toBeCloseTo(o.achievedPower, 9);
    expect(prospectiveFPower(o.evaluableTotal - o.strata, input)).toBeLessThan(o.power);
    expect(result.projectWriteAuthorized).toBe(false);
  });
  it("preserves seven strata and inflates within strata, not by a two-group shortcut", () => {
    const result = calculateFDimensioning(makeInput()); expect(result.strata).toBe(7);
    expect(result.evaluableTotal).toBe(231); expect(result.totalSampleSize).toBe(259);
    expect(result.effectSizeMeaning).toBe("COHEN_F");
  });
  it("does not apply longitudinal lost-to-follow-up to a single visit", () => {
    expect(() => calculateFDimensioning({ ...makeInput(), nonEvaluableReasons: ["LOST_TO_FOLLOW_UP"] })).toThrow("SINGLE_VISIT");
    expect(calculateFDimensioning({ ...makeInput(), visits: "REPEATED", nonEvaluableReasons: ["LOST_TO_FOLLOW_UP"] }).totalSampleSize).toBe(259);
  });
  it.each([NaN, Infinity, -1, 0, 1])("rejects invalid alpha %s", alpha => {
    expect(() => calculateFDimensioning({ ...makeInput(), alpha })).toThrow();
  });
  it("requires labelled assumptions and compatible allocation", () => {
    expect(() => calculateFDimensioning({ ...makeInput(), assumptions: [] })).toThrow("ASSUMPTION_REQUIRED");
    expect(() => calculateFDimensioning({ ...makeInput(), allocation: "UNSTRATIFIED" })).toThrow("ALLOCATION_INVALID");
    expect(() => calculateFDimensioning({ ...makeInput(), nonEvaluableReasons: [] })).toThrow("REASONS_REQUIRED");
  });
  it("distinguishes regression f-squared, quotas, and omnibus ANOVA", () => {
    const result = calculateFDimensioning(makeInput(oracle.cases[4]!));
    expect(result.effectSizeMeaning).toBe("INCREMENTAL_COHEN_F_SQUARED"); expect(result.strata).toBe(7);
    expect(result.evaluableTotal).toBe(224); expect(result.methodIdentity).toBe("LINEAR_REGRESSION");
  });
  it("rejects recruitment inflation outside exact integer arithmetic", () => {
    const rate = 1 - Number.EPSILON;
    const input = makeInput(); input.anticipatedNonEvaluableRate = rate;
    input.assumptions.find(a => a.parameter === "anticipatedNonEvaluableRate")!.value = rate;
    expect(() => calculateFDimensioning(input)).toThrow("RECRUITMENT_SCOPE_EXCEEDED");
  });
});
