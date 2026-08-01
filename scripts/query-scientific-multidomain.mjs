import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { queryScientificMultidomain } from "../src/knowledge-graph/scientific-multidomain/query.mjs";

const supported = new Set(["domainId", "concept", "modality", "pathology", "technique", "measurement", "finding", "manufacturer", "method", "context", "polarity", "source", "quality", "maturity", "status", "documentStatus", "sourceAccess"]);
const aliases = Object.freeze({ domain: "domainId" });
const query = {};
for (let index = 2; index < process.argv.length; index += 1) {
  const token = process.argv[index];
  if (!token.startsWith("--")) continue;
  const rawKey = token.slice(2);
  const key = aliases[rawKey] ?? rawKey;
  if (!supported.has(key)) throw new Error(`Unsupported scientific query filter: ${rawKey}`);
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for --${rawKey}`);
  query[key] = value;
  index += 1;
}

const result = queryScientificMultidomain(query);
console.log(stableStringify(result));

