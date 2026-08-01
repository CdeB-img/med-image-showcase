import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { validateScientificCorpus } from "../src/knowledge-graph/scientific-corpus/validate.mjs";

const result = validateScientificCorpus({ root: process.cwd() });
console.log(stableStringify({
  valid: result.valid,
  corpusVersion: result.corpusVersion,
  perimeter: result.perimeter,
  counts: result.counts,
  errors: result.errors,
  layerStatus: Object.fromEntries(Object.entries(result.layers).map(([key, value]) => [key, value.valid])),
  protectedSurfacesUnchanged: result.protectedSurfaces.protectedSurfacesUnchanged,
  editorialEngineUnchanged: result.protectedSurfaces.editorialEngineUnchanged,
  publicPublicationReady: false,
}));
if (!result.valid) process.exitCode = 1;
