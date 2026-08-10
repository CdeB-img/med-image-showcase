import { queryPatternCatalog } from "./model";
import type { PatternCatalog, PatternCategory, PatternConsumerAdapterResult } from "./types";

const CONSUMER_CATEGORIES: Record<PatternConsumerAdapterResult["consumer"], PatternCategory[]> = {
  "TMP-001": ["Document Structure", "Editorial", "Workflow", "Human Decision", "CoreLab", "Acquisition", "Imaging", "Equipment", "Quality", "Training", "Troubleshooting", "Project", "Decision", "Risk"],
  DOCUMENT_PROJECTION: ["Document Structure", "Editorial", "Workflow", "Human Decision", "CoreLab"],
  CLINICAL_OPERATIONS: ["Operational", "Workflow", "Monitoring", "Deviation", "Training", "CoreLab", "Acquisition", "Imaging", "Equipment", "Quality", "Troubleshooting", "Communication", "Project"],
  DATA_MANAGEMENT: ["Data", "Validation", "Quality", "Workflow"],
  "QRY-001": ["Decision", "Workflow", "Review", "Risk"],
  "UX-001": ["Editorial", "Decision", "Review", "Human Decision", "Communication"],
  REGULATORY_ENGINE: ["Regulatory Interaction", "Human Decision", "Workflow", "Document Structure"],
  BIOSTATISTICS: ["Data", "Validation", "Risk", "Document Structure"],
  KNOWLEDGE: ["Document Structure", "Review", "Quality", "Data"],
};

export const adaptPatternCatalogForConsumer = (catalog: PatternCatalog, consumer: PatternConsumerAdapterResult["consumer"]): PatternConsumerAdapterResult => {
  const patterns = queryPatternCatalog(catalog, { categories: CONSUMER_CATEGORIES[consumer] }).patterns;
  return {
    consumer,
    catalogDigest: catalog.digest,
    patternRefs: patterns.map((pattern) => ({
      patternId: pattern.patternId,
      name: pattern.name,
      category: pattern.category,
      status: pattern.status,
      limitations: [...pattern.limitations],
    })),
    boundary: "REFERENCE_ONLY_NO_CONSUMER_MUTATION_NO_AUTOMATIC_DECISION",
  };
};

export const buildAllConsumerAdapters = (catalog: PatternCatalog) => (Object.keys(CONSUMER_CATEGORIES) as PatternConsumerAdapterResult["consumer"][])
  .map((consumer) => adaptPatternCatalogForConsumer(catalog, consumer));
