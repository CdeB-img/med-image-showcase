import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { internalScientificProjections, projectionReadiness, projectionSummary } from "../src/knowledge-graph/scientific-corpus/projections.mjs";

console.log(stableStringify(process.argv.includes("--summary") ? { summary: projectionSummary, projectionKeys: internalScientificProjections.map((item) => item.key), publicReadyIds: projectionReadiness.filter((item) => item.publicPublicationReady.ready).map((item) => item.subjectId) } : { summary: projectionSummary, projections: internalScientificProjections, readiness: projectionReadiness }));
