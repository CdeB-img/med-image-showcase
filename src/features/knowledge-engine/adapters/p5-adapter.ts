import { multidomainAssertionRevisions, multidomainEvidenceLinks } from "@/knowledge-graph/scientific-multidomain/assertions.mjs";
import { multidomainSourceRevisions } from "@/knowledge-graph/scientific-multidomain/sources.mjs";
import { multidomainContradictionAssessments } from "@/knowledge-graph/scientific-multidomain/contradictions.mjs";
import { uniqueSorted } from "../canonical";
import type { AdapterResult } from "../types";
import { baseAssertion, normalizeEvidenceLink, normalizeSource, representationDigest, type ExternalAssertionRecord, type ExternalEvidenceRecord, type ExternalSourceRecord } from "./adapter-utils";
import type { CorpusAdapter, CorpusAdapterInput } from "./corpus-adapter";

type ExternalConflictRecord = { contradictionId: string; assertionRevisionIds: string[]; finalClassification: string; rationale: string };
const p5Assertions = multidomainAssertionRevisions as ExternalAssertionRecord[];
const p5Evidence = multidomainEvidenceLinks as ExternalEvidenceRecord[];
const p5Sources = multidomainSourceRevisions as ExternalSourceRecord[];
const p5Conflicts = multidomainContradictionAssessments as ExternalConflictRecord[];

const p5Adapter: CorpusAdapter = {
  adapterId: "p5-adapter-v1",
  adapterVersion: "1.0.0",
  supports: (provider) => provider.id === "p5-multidomain",
  query: ({ request, queryPlan, provider }: CorpusAdapterInput): AdapterResult => {
    const providerConcepts = uniqueSorted(queryPlan.resolvedConcepts.flatMap((concept) => concept.providerConcepts[provider.id] ?? []));
    const modalities = request.context.dimensions.find((item) => item.name === "modality")?.values ?? [];
    const selected = p5Assertions.filter((assertion) => {
      const facets = assertion.facets ?? {};
      const searchable = [...(facets.concepts ?? []), ...(facets.techniques ?? []), ...(facets.measurements ?? []), ...(facets.findings ?? [])];
      const conceptMatch = providerConcepts.some((concept) => searchable.includes(concept) || assertion.subjectEntityId?.endsWith(`:${concept}`) || assertion.objectEntityId?.endsWith(`:${concept}`));
      const assertionModalities = facets.modalities ?? [];
      const modalityMatch = !modalities.length || !assertionModalities.length || modalities.some((modality) => assertionModalities.includes(modality === "MRI" ? "MR" : modality));
      return conceptMatch && modalityMatch;
    }).sort((left, right) => left.revisionId.localeCompare(right.revisionId));
    const selectedIds = new Set(selected.map((item) => item.revisionId));
    const evidence = p5Evidence.filter((link) => selectedIds.has(link.assertionRevisionId)).map(normalizeEvidenceLink).sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));
    const sourceIds = new Set(evidence.map((link) => link.sourceId));
    const sources = p5Sources.filter((source) => sourceIds.has(source.revisionId)).map(normalizeSource).sort((left, right) => left.sourceId.localeCompare(right.sourceId));
    const assertions = selected.map((assertion) => baseAssertion(assertion, provider.id, evidence));
    const conflicts = p5Conflicts.filter((item) => item.assertionRevisionIds.some((id) => selectedIds.has(id))).map((item) => ({
      conflictId: item.contradictionId,
      state: item.finalClassification === "TRUE_CONTRADICTION" ? "CONTRADICTION" as const : item.finalClassification === "CONTEXT_DIFFERENCE" ? "CONTEXTUAL_DIFFERENCE" as const : "INSUFFICIENT_TO_COMPARE" as const,
      positionIds: item.assertionRevisionIds,
      explanation: item.rationale,
    }));
    return {
      providerId: provider.id,
      providerVersion: provider.version,
      executionStatus: assertions.length ? "SUCCESS" : "NO_MATCH",
      declaredCoverage: provider.domains,
      assertions,
      documentaryStatements: [],
      sources,
      evidenceLinks: evidence,
      conflicts,
      limitations: provider.limitations,
      continuation: "EXHAUSTED",
      diagnostics: assertions.length ? [`${assertions.length}_ATOMIC_ASSERTIONS_RETURNED`] : ["NO_EXACT_P5_ASSERTION_MATCH"],
      sourceRepresentationDigest: representationDigest(provider.id, provider.version, [p5Assertions.length, p5Evidence.length, p5Sources.length]),
    };
  },
};

export default p5Adapter;
