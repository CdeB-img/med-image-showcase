import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { internalScientificProjections, projectionReadiness, projectionSummary } from "../src/knowledge-graph/scientific-corpus/projections.mjs";

const invalid = internalScientificProjections.filter((item) => !item.internalOnly || item.route !== null || item.canonical !== null || item.indexable || item.inSitemap || item.rendered || item.publicNavigation || item.prose !== null);
const readinessInvalid = projectionReadiness.filter((item) => item.publicPublicationReady.ready || item.editorialProjectionReady.ready || item.seoReady.ready);
const result = { valid: invalid.length === 0 && readinessInvalid.length === 0 && projectionSummary.count === 12, summary: projectionSummary, invalidProjectionIds: invalid.map((item) => item.projectionId), invalidReadinessIds: readinessInvalid.map((item) => item.subjectId) };
console.log(stableStringify(result));
if (!result.valid) process.exitCode = 1;
