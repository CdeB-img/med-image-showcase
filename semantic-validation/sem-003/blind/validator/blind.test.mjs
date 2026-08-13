import assert from "node:assert/strict";
import test from "node:test";
import { CHECK_IDS, validateBlindSet } from "./validate.mjs";

const result = validateBlindSet();
const checks = new Map(result.checks.map((entry) => [entry.id, entry]));

for (const checkId of CHECK_IDS) {
  test(`SEM003C-${checkId}`, () => {
    const check = checks.get(checkId);
    assert.ok(check, `${checkId} must be reported`);
    assert.equal(check.pass, true, `${check.label}: ${check.evidence}`);
  });
}

