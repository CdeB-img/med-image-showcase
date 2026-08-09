import { consolidatedAssertionRevisions, consolidatedEvidenceLinks } from "@/knowledge-graph/scientific-consolidation/review.mjs";
import { consolidatedSourceRevisions } from "@/knowledge-graph/scientific-consolidation/sources.mjs";
import { p4rContradictionAssessments } from "@/knowledge-graph/scientific-consolidation/contradictions.mjs";
import { uniqueSorted } from "../canonical";
import type { AdapterResult } from "../types";
import { baseAssertion, normalizeEvidenceLink, normalizeSource, representationDigest, type ExternalAssertionRecord, type ExternalEvidenceRecord, type ExternalSourceRecord } from "./adapter-utils";
import type { CorpusAdapter, CorpusAdapterInput } from "./corpus-adapter";

type ExternalConflictRecord = { contradictionId: string; assertionRevisionIds: string[]; finalClassification: string; rationale: string };
const p4Assertions = consolidatedAssertionRevisions as ExternalAssertionRecord[];
const p4Evidence = consolidatedEvidenceLinks as ExternalEvidenceRecord[];
const p4Sources = consolidatedSourceRevisions as ExternalSourceRecord[];
const p4Conflicts = p4rContradictionAssessments as ExternalConflictRecord[];

const p4rAdapter: CorpusAdapter = {
  adapterId: "p4r-adapter-v1",
  adapterVersion: "1.0.0",
  supports: (provider) => provider.id === "p4r-ecv-t1",
  query: ({ request, queryPlan, provider }: CorpusAdapterInput): AdapterResult => {
    const providerConcepts = uniqueSorted(queryPlan.resolvedConcepts.flatMap((concept) => concept.providerConcepts[provider.id] ?? []));
    const modalities = request.context.dimensions.find((item) => item.name === "modality")?.values ?? [];
    const selected = p4Assertions.filter((assertion) => {
      const assertionConcepts = assertion.facets?.concepts ?? [];
      const conceptMatch = providerConcepts.some((concept) => assertionConcepts.includes(concept) || assertion.subjectEntityId === concept || assertion.objectEntityId === concept);
      const assertionModalities = assertion.facets?.modalities ?? [];
      const modalityMatch = !modalities.length || !assertionModalities.length || modalities.some((modality) => assertionModalities.some((value) => value.toLocaleLowerCase().includes(modality.toLocaleLowerCase() === "mri" ? "irm" : modality.toLocaleLowerCase())));
      return conceptMatch && modalityMatch;
    }).sort((left, right) => left.revisionId.localeCompare(right.revisionId));
    const selectedIds = new Set(selected.map((item) => item.revisionId));
    const inadmissibleSourceIds = new Set(p4Sources.filter((source) => ["SUPERSEDED", "RETRACTED"].includes(source.metadata?.documentStatus ?? "") || ["SUPERSEDED", "RETRACTED"].includes(source.status ?? "")).map((source) => source.revisionId));
    const evidence = p4Evidence.filter((link) => selectedIds.has(link.assertionRevisionId) && !inadmissibleSourceIds.has(link.sourceRevisionId)).map(normalizeEvidenceLink).sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));
    const evidencedAssertionIds = new Set(evidence.map((link) => link.assertionId));
    const sourceIds = new Set(evidence.map((link) => link.sourceId));
    const sources = p4Sources.filter((source) => sourceIds.has(source.revisionId)).map(normalizeSource).sort((left, right) => left.sourceId.localeCompare(right.sourceId));
    const assertions = selected.filter((assertion) => evidencedAssertionIds.has(assertion.revisionId)).map((assertion) => baseAssertion(assertion, provider.id, evidence));
    const conflicts = p4Conflicts.filter((item) => item.assertionRevisionIds.some((id) => evidencedAssertionIds.has(id))).map((item) => ({
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
      diagnostics: assertions.length ? [`${assertions.length}_ATOMIC_ASSERTIONS_RETURNED`, `${inadmissibleSourceIds.size}_SUPERSEDED_OR_RETRACTED_SOURCE_REVISIONS_EXCLUDED`] : ["NO_EXACT_P4R_ASSERTION_MATCH"],
      sourceRepresentationDigest: representationDigest(provider.id, provider.version, [p4Assertions.length, p4Evidence.length, p4Sources.length]),
    };
  },
};

export default p4rAdapter;
