import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { conceptReadiness, readinessRules, readinessSummary, synthesisReadiness } from "../src/knowledge-graph/scientific-corpus/readiness.mjs";
import { projectionReadiness } from "../src/knowledge-graph/scientific-corpus/projections.mjs";

const invalidPublic = [...conceptReadiness, ...synthesisReadiness, ...projectionReadiness].filter((item) => item.publicPublicationReady.ready || item.seoReady.ready);
const result = { valid: invalidPublic.length === 0 && Object.keys(readinessRules).length === 7 && readinessSummary.scoreUsed === false, rules: readinessRules, summary: readinessSummary, invalidPublicSubjects: invalidPublic.map((item) => item.subjectId) };
console.log(stableStringify(result));
if (!result.valid) process.exitCode = 1;
