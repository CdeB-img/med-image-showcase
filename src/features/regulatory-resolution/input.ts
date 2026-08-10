import type { ResearchProjectDesignResult } from "@/features/research-project-construction";
import { REG000_CORPUS_DIGEST, REG000_CORPUS_VERSION } from "./corpus";
import { parseRegulatoryResolutionInput, REGULATORY_RESOLUTION_VERSION, type ProjectFact, type RegulatoryResolutionInput } from "./types";

export const knownFact = <T>(value: T, reason: string, provenance: string[]): ProjectFact<T> => ({ state: "KNOWN", value, reason, provenance: [...new Set(provenance)].sort() });
export const candidateFact = <T>(value: T, reason: string, provenance: string[]): ProjectFact<T> => ({ state: "CANDIDATE", value, reason, provenance: [...new Set(provenance)].sort() });
export const unknownFact = <T>(reason: string, provenance: string[] = []): ProjectFact<T> => ({ state: "UNKNOWN", value: null, reason, provenance: [...new Set(provenance)].sort() });
export const notApplicableFact = <T>(reason: string, provenance: string[]): ProjectFact<T> => ({ state: "NOT_APPLICABLE", value: null, reason, provenance: [...new Set(provenance)].sort() });
export const conflictingFact = <T>(value: T, reason: string, provenance: string[]): ProjectFact<T> => ({ state: "CONFLICTING", value, reason, provenance: [...new Set(provenance)].sort() });

export type RegulatoryFactProjection = Omit<RegulatoryResolutionInput,
  "contractVersion" | "researchProjectId" | "researchProjectVersion" | "researchProjectDigest" | "regulatoryCorpusVersion" | "regulatoryCorpusDigest"
>;

export const buildRegulatoryResolutionInput = (
  project: Pick<ResearchProjectDesignResult, "resultDigest" | "candidateVersion" | "documentHandoff">,
  projection: RegulatoryFactProjection,
): RegulatoryResolutionInput => parseRegulatoryResolutionInput({
  contractVersion: REGULATORY_RESOLUTION_VERSION,
  researchProjectId: project.documentHandoff.projectId,
  researchProjectVersion: project.candidateVersion.versionId,
  researchProjectDigest: project.resultDigest,
  ...projection,
  humanDecisions: [...project.documentHandoff.humanDecisions, ...projection.humanDecisions]
    .filter((decision, index, all) => all.findIndex((candidate) => candidate.decisionId === decision.decisionId && candidate.version === decision.version) === index),
  regulatoryCorpusVersion: REG000_CORPUS_VERSION,
  regulatoryCorpusDigest: REG000_CORPUS_DIGEST,
});

export const createRegulatoryResolutionInput = (
  input: Omit<RegulatoryResolutionInput, "contractVersion" | "regulatoryCorpusVersion" | "regulatoryCorpusDigest"> & Partial<Pick<RegulatoryResolutionInput, "regulatoryCorpusVersion" | "regulatoryCorpusDigest">>,
): RegulatoryResolutionInput => parseRegulatoryResolutionInput({
  contractVersion: REGULATORY_RESOLUTION_VERSION,
  ...input,
  regulatoryCorpusVersion: input.regulatoryCorpusVersion ?? REG000_CORPUS_VERSION,
  regulatoryCorpusDigest: input.regulatoryCorpusDigest ?? REG000_CORPUS_DIGEST,
});
