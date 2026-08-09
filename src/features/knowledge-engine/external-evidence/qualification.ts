import { logicalDigest, normalizeScientificText, uniqueSorted } from "../canonical";
import { evaluateAssertionApplicability } from "../applicability";
import type { KnowledgeRequest, RuntimeAssertion } from "../types";
import type { ExternalCandidateAssertion, ExternalCandidateSource, ExternalEvidenceLink, ExternalQueryPlan } from "./types";

const UNSUPPORTED_PUBLICATION_TYPES = new Set(["Editorial", "Letter", "Comment", "News", "Newspaper Article"]);

export const qualifyAndDeduplicateSources = (sources: ExternalCandidateSource[]) => {
  const kept = new Map<string, ExternalCandidateSource>();
  const excluded: ExternalCandidateSource[] = [];

  for (const source of sources) {
    const persistentKey = source.pmid ? `pmid:${source.pmid}` : source.doi ? `doi:${source.doi}` : source.sourceIdentity;
    const doiKey = source.doi ? `doi:${source.doi}` : null;
    const duplicate = kept.get(persistentKey) ?? (doiKey ? kept.get(doiKey) : undefined);
    if (duplicate) {
      duplicate.branchIds = uniqueSorted([...duplicate.branchIds, ...source.branchIds]);
      excluded.push({ ...source, eligibility: "DUPLICATE", duplicateOf: duplicate.sourceIdentity, exclusionReasons: [`Duplicate de ${duplicate.sourceIdentity} par identifiant persistant.`] });
      continue;
    }
    const unsupported = source.publicationTypes.length > 0 && source.publicationTypes.every((type) => UNSUPPORTED_PUBLICATION_TYPES.has(type));
    let qualified = source;
    if (source.documentStatus === "RETRACTED") qualified = { ...source, eligibility: "RETRACTED", exclusionReasons: ["La source rétractée est conservée pour l’historique mais exclue de toute preuve positive courante."] };
    else if (source.documentStatus === "CORRECTED") qualified = { ...source, eligibility: "CORRECTED", exclusionReasons: ["La relation de correction doit être résolue vers la révision courante avant extraction positive."] };
    else if (unsupported) qualified = { ...source, eligibility: "UNSUPPORTED_DOCUMENT_TYPE", exclusionReasons: ["Le type documentaire n’est pas retenu pour une extraction scientifique candidate V1.2."] };
    if (["RETRACTED", "CORRECTED", "UNSUPPORTED_DOCUMENT_TYPE", "INACCESSIBLE"].includes(qualified.eligibility)) excluded.push(qualified);
    else {
      kept.set(persistentKey, qualified);
      if (doiKey) kept.set(doiKey, qualified);
    }
  }

  const eligible = [...new Map([...kept.values()].map((source) => [source.sourceIdentity, source])).values()]
    .sort((left, right) => left.sourceIdentity.localeCompare(right.sourceIdentity));
  return { eligible, excluded: excluded.sort((left, right) => `${left.sourceIdentity}:${left.eligibility}`.localeCompare(`${right.sourceIdentity}:${right.eligibility}`)) };
};

const exactExcerpt = (text: string, maxWords = 50) => {
  const normalized = normalizeScientificText(text);
  const firstSentence = normalized.match(/^.*?(?:[.!?](?:\s|$)|$)/)?.[0]?.trim() || normalized;
  const words = firstSentence.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return { text: firstSentence, truncated: false };
  return { text: words.slice(0, maxWords).join(" "), truncated: true };
};

const explicitModality = (source: ExternalCandidateSource, plan: ExternalQueryPlan) => {
  const searchable = `${source.title} ${source.abstractText ?? ""}`.toLocaleLowerCase("en-US");
  const branchModalities = plan.branches.filter((branch) => source.branchIds.includes(branch.branchId)).map((branch) => branch.modality);
  if (branchModalities.includes("MRI") && /magnetic resonance|\bmri\b/.test(searchable)) return "MRI";
  if (branchModalities.includes("CT") && /computed tomography|\bct\b/.test(searchable)) return "CT";
  if (branchModalities.includes("PET") && /positron emission tomography|\bpet\b/.test(searchable)) return "PET";
  return undefined;
};

const externalApplicability = (request: KnowledgeRequest, source: ExternalCandidateSource, plan: ExternalQueryPlan, claim: string) => {
  const runtimeAssertion: RuntimeAssertion = {
    stableId: `external-applicability:${source.sourceIdentity}`,
    revision: source.sourceRevision,
    providerId: source.providerId,
    status: "ASSERTION_CANDIDATE",
    text: claim,
    atomicContent: { sourceIdentity: source.sourceIdentity },
    conceptIds: plan.branches.filter((branch) => source.branchIds.includes(branch.branchId)).flatMap((branch) => branch.conceptIds),
    modality: explicitModality(source, plan),
    context: { dimensions: [] },
    polarity: "UNKNOWN",
    evidenceRelations: ["SUPPORTS"],
    limitations: ["EXTERNAL_CANDIDATE", "FULL_TEXT_NOT_REVIEWED"],
    reviewStatus: "HUMAN_REVIEW_REQUIRED",
    locator: source.accessLocator,
    applicability: "UNKNOWN_APPLICABILITY",
    applicabilityReasons: [],
  };
  const base = evaluateAssertionApplicability(request, runtimeAssertion);
  if (["OUT_OF_VALIDITY_DOMAIN", "CONTRADICTORY_CONTEXT"].includes(base.state)) return base;
  const criticalUndocumented = request.context.dimensions.some((dimension) => ["pathology", "population", "timing", "equipment"].includes(dimension.name) && dimension.state === "KNOWN" && dimension.values.length > 0);
  if (criticalUndocumented) return { state: "UNKNOWN_APPLICABILITY" as const, reasons: [...base.reasons, "Les dimensions cliniques ou techniques critiques ne sont pas extraites du texte accessible ; l’applicabilité reste inconnue."] };
  return { state: "PARTIALLY_APPLICABLE" as const, reasons: [...base.reasons, "La correspondance de découverte ne vaut pas preuve d’applicabilité ; une revue du document et de sa population reste requise."] };
};

export const extractCandidateAssertions = (request: KnowledgeRequest, plan: ExternalQueryPlan, sources: ExternalCandidateSource[]) => {
  const assertions: ExternalCandidateAssertion[] = [];
  const evidence: ExternalEvidenceLink[] = [];
  for (const source of sources) {
    if (!["ABSTRACT_ONLY", "FULL_TEXT_ACCESSIBLE"].includes(source.eligibility)) continue;
    const conclusion = source.abstractSections.find((section) => /CONCL/.test(section.label));
    if (!conclusion?.text) continue;
    const excerpt = exactExcerpt(conclusion.text);
    if (!excerpt.text) continue;
    const applicability = externalApplicability(request, source, plan, excerpt.text);
    const material = { sourceIdentity: source.sourceIdentity, sourceRevision: source.sourceRevision, excerpt: excerpt.text, locator: conclusion.label };
    const digest = logicalDigest(material);
    const assertion: ExternalCandidateAssertion = {
      assertionId: `external-assertion-candidate:${digest}`,
      revision: `external-assertion-revision:${digest}`,
      status: "ASSERTION_CANDIDATE",
      origin: "EXTERNAL_CANDIDATE",
      sourceIdentity: source.sourceIdentity,
      sourceRevision: source.sourceRevision,
      claim: excerpt.text,
      supportExact: excerpt.text,
      supportRepresentation: "EXACT_ABSTRACT_EXCERPT",
      supportWasTruncated: excerpt.truncated,
      locator: `PubMed abstract — ${conclusion.label}`,
      context: {
        branchIds: source.branchIds,
        extractedPopulation: "NOT_EXTRACTED",
        extractedMethod: "NOT_EXTRACTED",
        studyType: source.publicationTypes,
      },
      limitations: uniqueSorted([
        "EXTERNAL_SOURCE_NOT_ADMITTED_TO_NOXIA_CORPUS",
        "SCIENTIFIC_EVIDENCE_LEVEL_NOT_ASSIGNED",
        source.eligibility === "ABSTRACT_ONLY" ? "ABSTRACT_ONLY" : "PMC_FULL_TEXT_LINKED_BUT_NOT_EXTRACTED",
        ...(excerpt.truncated ? ["SUPPORT_EXCERPT_TRUNCATED_TO_50_WORDS"] : []),
      ]),
      extractionMethod: "DETERMINISTIC_STRUCTURED_CONCLUSION_EXCERPT_V1",
      extractionModel: null,
      technicalConfidence: excerpt.truncated ? "MEDIUM" : "HIGH",
      scientificEvidenceLevel: "NOT_ASSIGNED",
      applicability: applicability.state,
      applicabilityReasons: applicability.reasons,
    };
    assertions.push(assertion);
    evidence.push({
      evidenceId: `external-evidence-candidate:${logicalDigest({ assertionId: assertion.assertionId, sourceIdentity: source.sourceIdentity })}`,
      assertionId: assertion.assertionId,
      sourceIdentity: source.sourceIdentity,
      relation: "SUPPORTS",
      locator: assertion.locator,
      limitations: assertion.limitations,
      status: "CANDIDATE_EVIDENCE",
    });
  }
  return {
    assertions: assertions.sort((left, right) => left.assertionId.localeCompare(right.assertionId)),
    evidence: evidence.sort((left, right) => left.evidenceId.localeCompare(right.evidenceId)),
  };
};
