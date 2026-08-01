import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { scientificSyntheses } from "../src/knowledge-graph/scientific-corpus/synthesis.mjs";

const topicArgument = process.argv.find((argument) => argument.startsWith("--topic="));
const topicIndex = process.argv.indexOf("--topic");
const topic = topicArgument?.split("=")[1] ?? (topicIndex >= 0 ? process.argv[topicIndex + 1] : "ecv");
const synthesis = scientificSyntheses.find((item) => item.key === topic);
if (!synthesis) throw new Error(`Unknown scientific synthesis topic: ${topic}`);
console.log(stableStringify(process.argv.includes("--summary") ? {
  synthesisId: synthesis.synthesisId,
  key: synthesis.key,
  assertionCount: synthesis.applicableAssertions.length,
  evidenceLinkCount: synthesis.evidenceLinks.length,
  sourceCount: synthesis.sourcesConsidered.length,
  contradictionCount: synthesis.contradictions.length,
  convergence: synthesis.convergence,
  consensus: synthesis.consensus,
  confidence: synthesis.confidence,
  missingData: synthesis.missingData,
  deterministicDigest: synthesis.deterministicDigest,
  statisticalMetaAnalysisPerformed: synthesis.statisticalMetaAnalysisPerformed,
  generatedEditorialText: synthesis.generatedEditorialText,
} : synthesis));
