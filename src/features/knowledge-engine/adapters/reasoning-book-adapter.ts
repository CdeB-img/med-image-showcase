import { DEMONSTRATOR_SCENARIOS } from "@/features/protocol-designer/fixtures";
import { logicalDigest, uniqueSorted } from "../canonical";
import type { AdapterResult, GovernedDocumentaryStatement, RuntimeSource } from "../types";
import type { CorpusAdapter, CorpusAdapterInput } from "./corpus-adapter";

const scenarioByProvider = {
  "rb-003": DEMONSTRATOR_SCENARIOS.find((item) => item.reasoningBook.id === "RB-003")!,
  "rb-004": DEMONSTRATOR_SCENARIOS.find((item) => item.reasoningBook.id === "RB-004")!,
  "rb-005": DEMONSTRATOR_SCENARIOS.find((item) => item.reasoningBook.id === "RB-005")!,
} as const;

const providerConceptTerms = (input: CorpusAdapterInput) => input.queryPlan.resolvedConcepts.filter((concept) => input.provider.coverageConcepts.includes(concept.conceptId)).flatMap((concept) => [concept.preferredLabel, ...concept.originalTerms]).map((item) => item.toLocaleLowerCase("fr-FR"));

const reasoningBookAdapter: CorpusAdapter = {
  adapterId: "reasoning-book-adapter-v1",
  adapterVersion: "1.0.0",
  supports: (provider) => provider.type === "REASONING_BOOK" && provider.id in scenarioByProvider,
  query: (input: CorpusAdapterInput): AdapterResult => {
    const { provider } = input;
    const scenario = scenarioByProvider[provider.id as keyof typeof scenarioByProvider];
    const terms = providerConceptTerms(input);
    const exactNoReflowRequest = input.queryPlan.resolvedConcepts.some((item) => item.conceptId === "phenomenon:no-reflow") && !scenario.constructs.some((item) => /no[- ]?reflow|obstruction microvascul/i.test(item));
    const applicable = terms.length > 0 && !exactNoReflowRequest;
    const sourceId = `${scenario.reasoningBook.id}:v${scenario.reasoningBook.version}`;
    const source: RuntimeSource = { sourceId, revision: scenario.reasoningBook.version, title: scenario.reasoningBook.title, status: "OFFICIAL", locator: scenario.reasoningBook.id };
    const conceptIds = uniqueSorted(input.queryPlan.resolvedConcepts.filter((concept) => provider.coverageConcepts.includes(concept.conceptId)).map((item) => item.conceptId));
    const evidenceLocator = scenario.evidence.map((item) => item.locator).join(" ; ");
    const blocks = applicable ? [
      ...scenario.constructs.map((text, index) => ({ text, type: "CONSTRUCT" as const, locator: scenario.evidence[index % scenario.evidence.length]?.locator ?? evidenceLocator })),
      ...scenario.limitations.map((text) => ({ text, type: "LIMITATION" as const, locator: evidenceLocator })),
      { text: scenario.controversy, type: "CONTROVERSY" as const, locator: scenario.contradictionPositions.map((item) => item.locator).join(" ; ") },
      { text: scenario.comprehension, type: "CONTEXT" as const, locator: evidenceLocator },
    ] : [];
    const documentaryStatements: GovernedDocumentaryStatement[] = blocks.map((block, index) => ({
      statementId: `${sourceId}:block:${index + 1}:${logicalDigest(block)}`,
      providerId: provider.id,
      status: "GOVERNED_DOCUMENTARY",
      text: block.text,
      statementType: block.type,
      conceptIds,
      locator: block.locator,
      sourceId,
      applicability: "APPLICABLE_WITH_LIMITATIONS",
      applicabilityReasons: ["Projection documentaire contrôlée du Reasoning Book ; ne vaut pas ScientificAssertion atomique."],
    }));
    return {
      providerId: provider.id,
      providerVersion: provider.version,
      executionStatus: documentaryStatements.length ? "SUCCESS" : "NO_MATCH",
      declaredCoverage: provider.domains,
      assertions: [],
      documentaryStatements,
      sources: documentaryStatements.length ? [source] : [],
      evidenceLinks: [],
      conflicts: [],
      limitations: provider.limitations,
      continuation: "EXHAUSTED",
      diagnostics: exactNoReflowRequest ? ["RB_PROJECTION_HAS_NO_EXACT_NO_REFLOW_BLOCK"] : documentaryStatements.length ? [`${documentaryStatements.length}_DOCUMENTARY_BLOCKS_RETURNED`] : ["NO_EXACT_REASONING_BOOK_MATCH"],
      sourceRepresentationDigest: logicalDigest({ sourceId, fixtureStatus: scenario.fixtureStatus, scenario }),
    };
  },
};

export default reasoningBookAdapter;
