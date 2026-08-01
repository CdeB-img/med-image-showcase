import { sha256Digest } from "../migration/stable-json.mjs";
import { P5_PUBLICATION_GUARDS } from "./constants.mjs";
import { multidomainSynthesisByKey } from "./synthesis.mjs";

const definitions = [
  ["adc-scientific-sheet", "diffusion-adc", "Internal scientific sheet — ADC", "diffusion-definition-methods"],
  ["adc-limitations-state-of-knowledge", "diffusion-adc", "Internal state of knowledge — ADC limitations", "diffusion-technical-limitations"],
  ["tmax-scientific-sheet", "cerebral-perfusion", "Internal scientific sheet — Tmax", "perfusion-parameters-methods"],
  ["cbf-cbv-tmax-documentary-comparison", "cerebral-perfusion", "Internal documentary comparison — CBF, CBV and Tmax", "perfusion-software-differences"],
  ["lge-scientific-sheet", "myocardial-tissue-characterization", "Internal scientific sheet — LGE", "myocardial-definitions-acquisitions"],
  ["lge-mvo-hemorrhage-documentary-comparison", "myocardial-tissue-characterization", "Internal documentary comparison — LGE, MVO and intramyocardial hemorrhage", "myocardial-value-limitations"],
  ["spectral-ct-scientific-sheet", "spectral-ct", "Internal scientific sheet — Spectral CT", "spectral-technologies"],
  ["iodine-quantification-state-of-knowledge", "spectral-ct", "Internal state of knowledge — iodine quantification", "spectral-quantitative-outputs"],
];

export const multidomainInternalProjections = Object.freeze(definitions.map(([key, domainId, label, synthesisKey]) => {
  const synthesis = multidomainSynthesisByKey[synthesisKey];
  const material = { key, domainId, synthesisDigest: synthesis.deterministicDigest, guards: P5_PUBLICATION_GUARDS };
  return Object.freeze({
    projectionId: `noxia:radiology:scientific-projection:p5:${domainId}:${key}`,
    key,
    domainId,
    label,
    fixtureType: "INTERNAL_SCIENTIFIC_PROJECTION",
    concepts: synthesis.concepts,
    definitions: Object.freeze(synthesis.applicableAssertions.filter((item) => /IS_|HAS_|REPRESENTS|USES|ENABLES/.test(item.predicate))),
    assertions: synthesis.applicableAssertions,
    evidenceLinks: synthesis.evidenceLinks,
    sources: synthesis.sources,
    contexts: synthesis.contexts,
    limitations: synthesis.limitations,
    contradictions: synthesis.contradictions,
    convergence: synthesis.convergence,
    questionsOpen: synthesis.openQuestions,
    history: synthesis.history,
    confidence: synthesis.confidence,
    gaps: synthesis.missingData,
    prose: null,
    ...P5_PUBLICATION_GUARDS,
    deterministicDigest: sha256Digest(material),
  });
}).sort((a, b) => a.key.localeCompare(b.key)));
