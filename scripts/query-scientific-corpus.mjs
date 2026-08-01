import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { queryScientificCorpus } from "../src/knowledge-graph/scientific-corpus/query.mjs";

const aliases = Object.freeze({
  concept: "concept", modality: "modality", disease: "disease", method: "method", sequence: "sequence",
  "field-strength": "fieldStrength", manufacturer: "manufacturer", model: "model", software: "software",
  population: "population", "source-type": "sourceType", "evidence-quality": "evidenceQuality",
  "scientific-maturity": "scientificMaturity", polarity: "polarity", "document-status": "documentStatus",
  "year-from": "yearFrom", "year-to": "yearTo", "review-state": "reviewState",
});
const query = {};
const summaryOnly = process.argv.includes("--summary");
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === "--limitations") { query.limitationsOnly = true; continue; }
  if (argument === "--human-reviewed") { query.humanReviewedOnly = true; continue; }
  const [rawName, inlineValue] = argument.startsWith("--") ? argument.slice(2).split("=") : [null, null];
  if (!rawName || !aliases[rawName]) continue;
  const value = inlineValue ?? process.argv[++index];
  const key = aliases[rawName];
  if (query[key] === undefined) query[key] = value;
  else query[key] = Array.isArray(query[key]) ? [...query[key], value] : [query[key], value];
}
const result = queryScientificCorpus(query);
console.log(stableStringify(summaryOnly ? {
  queryId: result.queryId,
  query: result.query,
  dataPresent: result.dataPresent,
  dataAbsent: result.dataAbsent,
  outOfContextAssertionCount: result.outOfContextAssertions.length,
  contradictionCount: result.contradictions.length,
  primarySourceCount: result.primarySources.length,
  secondarySourceCount: result.secondarySources.length,
  unresolvedElements: result.unresolvedElements,
  deterministicDigest: result.deterministicDigest,
} : result));
