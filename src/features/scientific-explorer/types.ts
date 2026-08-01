export type ExplorerDisplayItem = {
  id: string;
  label: string;
};

export type ExplorerConcept = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  type: string;
  assertionCount: number;
};

export type ExplorerFacetOption = {
  id: string;
  key: string;
  label: string;
};

export type ExplorerAssertion = {
  id: string;
  subjectId: string;
  subjectLabel: string;
  predicate: string;
  objectId: string | null;
  objectLabel: string | null;
  statementText: string | null;
  assertionType: string;
  status: string;
  reviewState: string | null;
  polarity: string;
  confidence: string;
  evidenceQuality: string;
  scientificMaturity: string;
  humanReviewed: boolean;
  conceptIds: string[];
  modalityIds: string[];
  metricKeys: string[];
  taskKeys: string[];
  evidenceTypeKey: string;
  contexts: Array<{
    dimension: string;
    label: string;
    operator: string;
    value: string | null;
    unknown: string | null;
  }>;
  limitations: ExplorerDisplayItem[];
  evidenceLinkIds: string[];
};

export type ExplorerEvidenceLink = {
  id: string;
  assertionId: string;
  sourceId: string;
  relationType: string;
  locator: string | null;
  confidence: string;
  extractionType: string | null;
  analyticalSummary: string | null;
  limitations: ExplorerDisplayItem[];
};

export type ExplorerSource = {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  journal: string | null;
  sourceType: string;
  documentStatus: string;
  doi: string | null;
  pmid: string | null;
  url: string | null;
  fullTextUrl: string | null;
  abstractOnly: boolean;
};

export type ExplorerSynthesis = {
  id: string;
  key: string;
  label: string;
  assertionIds: string[];
  conceptIds: string[];
  modalityIds: string[];
  limitations: ExplorerDisplayItem[];
  contradictions: Array<{ id: string; classification: string; label: string }>;
  convergence: string | null;
  consensus: { detected: boolean; state: string };
  openQuestions: ExplorerDisplayItem[];
  missingData: ExplorerDisplayItem[];
  confidence: string;
  statisticalMetaAnalysisPerformed: boolean;
  humanReviewed: boolean;
};

export type ScientificExplorerData = {
  version: string;
  digest: string;
  sourceCatalog: {
    catalogId: string;
    version: string;
    digest: string;
    planningDigest: string;
  };
  selectedDomain: {
    id: string;
    key: string;
    label: string;
    description: string;
    status: string;
    selection: {
      rule: string;
      score: number;
      components: Record<string, number>;
      tieBreaker: string;
    };
    metrics: Record<string, number>;
    readiness: {
      scientific: boolean;
      provenance: boolean;
      synthesis: boolean;
      editorialProjection: boolean;
      publicPublication: boolean;
    };
  };
  defaultConceptKey: string | null;
  concepts: ExplorerConcept[];
  facets: {
    metrics: Array<ExplorerFacetOption & { assertionCount: number }>;
    tasks: Array<ExplorerFacetOption & { assertionCount: number }>;
    evidenceTypes: Array<ExplorerFacetOption & { assertionCount: number }>;
  };
  assertions: ExplorerAssertion[];
  evidenceLinks: ExplorerEvidenceLink[];
  sources: ExplorerSource[];
  syntheses: ExplorerSynthesis[];
  contradictions: Array<{ id: string; classification: string; label: string }>;
  projectionIds: string[];
  editorialLinks: Array<{ label: string; to: string }>;
  illustration: null | {
    src: string;
    alt: string;
    caption?: string;
    credit?: string;
  };
  safeguards: {
    sourceOfTruth: string;
    mentionsAreEvidence: boolean;
    missingDataVisible: boolean;
    humanScientificReviewPerformed: boolean;
    publicPublicationReady: boolean;
  };
};
