import { DEMONSTRATOR_SCENARIOS } from "@/features/protocol-designer/fixtures";
import { logicalDigest, uniqueSorted } from "../canonical";
import type { AdapterResult, GovernedDocumentaryStatement, RuntimeSource } from "../types";
import type { CorpusAdapter, CorpusAdapterInput } from "./corpus-adapter";

const scenarioByProvider = {
  "rb-003": DEMONSTRATOR_SCENARIOS.find((item) => item.reasoningBook.id === "RB-003")!,
  "rb-004": DEMONSTRATOR_SCENARIOS.find((item) => item.reasoningBook.id === "RB-004")!,
  "rb-005": DEMONSTRATOR_SCENARIOS.find((item) => item.reasoningBook.id === "RB-005")!,
} as const;

const sectionFamiliesByProvider = {
  "rb-003": ["SCIENTIFIC_CONSTRUCTS", "OBJECTIVES", "HYPOTHESES", "DECISIONS", "LIMITATIONS", "CONTROVERSIES", "OPEN_QUESTIONS", "REFUSAL_CONDITIONS", "EVIDENCE_MAP", "REFERENCES"],
  "rb-004": ["SCIENTIFIC_CONSTRUCTS", "OBJECTIVES", "HYPOTHESES", "DECISIONS", "LIMITATIONS", "CONTROVERSIES", "OPEN_QUESTIONS", "REFUSAL_CONDITIONS", "EVIDENCE_MAP", "REFERENCES"],
  "rb-005": ["SCIENTIFIC_CONSTRUCTS", "OBJECTIVES", "HYPOTHESES", "DECISIONS", "LIMITATIONS", "CONTROVERSIES", "OPEN_QUESTIONS", "REFUSAL_CONDITIONS", "EVIDENCE_MAP", "REFERENCES"],
} as const;

const providerConceptTerms = (input: CorpusAdapterInput) => input.queryPlan.resolvedConcepts
  .filter((concept) => input.provider.coverageConcepts.includes(concept.conceptId))
  .flatMap((concept) => [concept.preferredLabel, ...concept.originalTerms])
  .map((item) => item.toLocaleLowerCase("fr-FR"));

type DocumentaryBlock = Pick<GovernedDocumentaryStatement, "text" | "statementType" | "locator">;

const controlledBlocks = (scenario: (typeof DEMONSTRATOR_SCENARIOS)[number]): DocumentaryBlock[] => {
  const broadLocator = scenario.evidence.map((item) => item.locator).join(" ; ");
  const noPreciseLocator = `${scenario.reasoningBook.id} v${scenario.reasoningBook.version} — bloc structuré de démonstration, localisateur RB précis non encodé`;
  return [
    { text: scenario.comprehension, statementType: "CONTEXT", locator: broadLocator },
    ...scenario.constructs.map((text, index) => ({ text, statementType: "CONSTRUCT" as const, locator: scenario.evidence[index % scenario.evidence.length]?.locator ?? broadLocator })),
    ...scenario.hypotheses.map((text) => ({ text, statementType: "HYPOTHESIS" as const, locator: noPreciseLocator })),
    ...scenario.strategies.map((item) => ({
      text: `${item.title} — bénéfice documenté : ${item.benefit} Limite : ${item.tradeoff} Condition : ${item.condition}`,
      statementType: "DECISION_CANDIDATE" as const,
      locator: noPreciseLocator,
    })),
    ...scenario.evidence.map((item) => ({ text: `${item.label} — ${item.contribution}`, statementType: "EVIDENCE_MAP" as const, locator: item.locator })),
    ...scenario.limitations.map((text) => ({ text, statementType: "LIMITATION" as const, locator: broadLocator })),
    { text: scenario.controversy, statementType: "CONTROVERSY", locator: broadLocator },
    ...scenario.contradictionPositions.map((item) => ({ text: `${item.label} — ${item.statement}`, statementType: "CONTROVERSY" as const, locator: item.locator })),
    { text: scenario.openQuestion, statementType: "OPEN_QUESTION", locator: noPreciseLocator },
  ];
};

const reasoningBookAdapter: CorpusAdapter = {
  adapterId: "reasoning-book-adapter-v1-1",
  adapterVersion: "1.1.0",
  supports: (provider) => provider.type === "REASONING_BOOK" && provider.id in scenarioByProvider,
  query: (input: CorpusAdapterInput): AdapterResult => {
    const { provider } = input;
    const scenario = scenarioByProvider[provider.id as keyof typeof scenarioByProvider];
    const terms = providerConceptTerms(input);
    const blocks = controlledBlocks(scenario);
    const exactNoReflowRequest = input.queryPlan.resolvedConcepts.some((item) => item.conceptId === "phenomenon:no-reflow")
      && !blocks.some((item) => /no[- ]?reflow/i.test(item.text));
    const applicable = terms.length > 0 && !exactNoReflowRequest;
    const sourceId = `${scenario.reasoningBook.id}:v${scenario.reasoningBook.version}`;
    const source: RuntimeSource = {
      sourceId,
      revision: scenario.reasoningBook.version,
      title: scenario.reasoningBook.title,
      status: "OFFICIAL_GOVERNED_DOCUMENTARY",
      locator: provider.authoritySource,
    };
    const conceptIds = uniqueSorted(input.queryPlan.resolvedConcepts
      .filter((concept) => provider.coverageConcepts.includes(concept.conceptId))
      .map((item) => item.conceptId));
    const documentaryStatements: GovernedDocumentaryStatement[] = (applicable ? blocks : []).map((block, index) => ({
      statementId: `${sourceId}:block:${index + 1}:${logicalDigest(block)}`,
      providerId: provider.id,
      status: "GOVERNED_DOCUMENTARY",
      text: block.text,
      statementType: block.statementType,
      conceptIds,
      locator: block.locator,
      sourceId,
      applicability: "APPLICABLE_WITH_LIMITATIONS",
      applicabilityReasons: ["Projection documentaire contrôlée du Reasoning Book ; ne vaut ni assertion atomique ni validation scientifique PD-011."],
    }));
    const sectionFamilies = sectionFamiliesByProvider[provider.id as keyof typeof sectionFamiliesByProvider];
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
      limitations: [...provider.limitations, "DOCUMENTARY_SECTIONS_WITHOUT_CONTROLLED_TEXT_REMAIN_UNSTRUCTURED"],
      continuation: "EXHAUSTED",
      diagnostics: exactNoReflowRequest
        ? ["RB_HAS_NO_CONTROLLED_EXACT_NO_REFLOW_TEXT_BLOCK", `${sectionFamilies.length}_RELIABLE_SECTION_FAMILIES_INVENTORIED`]
        : documentaryStatements.length
          ? [`${documentaryStatements.length}_CONTROLLED_DOCUMENTARY_BLOCKS_RETURNED`, `${sectionFamilies.length}_RELIABLE_SECTION_FAMILIES_INVENTORIED`, "NON_STRUCTURED_SECTIONS_NOT_HEURISTICALLY_CONVERTED"]
          : ["NO_EXACT_REASONING_BOOK_MATCH", `${sectionFamilies.length}_RELIABLE_SECTION_FAMILIES_INVENTORIED`],
      sourceRepresentationDigest: logicalDigest({ sourceId, programOwner: provider.programOwner, sectionFamilies, fixtureStatus: scenario.fixtureStatus, scenario }),
    };
  },
};

export default reasoningBookAdapter;
