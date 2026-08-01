import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { ctEcvBranchAudit } from "../src/knowledge-graph/scientific-consolidation/report.mjs";
import { sourceConsolidationSummary } from "../src/knowledge-graph/scientific-consolidation/sources.mjs";

const domainIndex = process.argv.indexOf("--domain");
const domain = domainIndex >= 0 ? process.argv[domainIndex + 1] : "ecv-t1";
if (domain !== "ecv-t1") throw new Error(`P4R reports ecv-t1 gaps only; received ${domain}`);
console.log(stableStringify({
  domain,
  abstractOnlySources: sourceConsolidationSummary.abstractOnly,
  ctEcv: ctEcvBranchAudit,
  gaps: ["CT_ECV_INTERSITE_REPRODUCIBILITY_NOT_DOCUMENTED", "SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED", "THREE_NON_PILOT_ONTOLOGY_DECISIONS_DEFERRED"],
  publicPublicationReady: false,
}));

