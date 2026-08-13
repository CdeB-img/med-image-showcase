import { validateReviewPackage } from "./review-workflow.mjs";

const result = validateReviewPackage();

console.log(JSON.stringify(result, null, 2));

if (!result.valid) {
  process.exitCode = 1;
}
