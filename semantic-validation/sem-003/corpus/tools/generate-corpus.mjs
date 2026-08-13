import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASE_GIT_COMMIT,
  CREATED_AT,
  P,
  corpusSpecs,
} from "./corpus-authoring-source.mjs";

const TOOLS_ROOT = path.dirname(fileURLToPath(import.meta.url));
const CORPUS_ROOT = path.dirname(TOOLS_ROOT);
const REPOSITORY_ROOT = path.resolve(CORPUS_ROOT, "../../..");
const VERSION = "1.0.0";
const CASE_SCHEMA_VERSION = "1.1.0";
const ENVELOPE_SCHEMA_VERSION = "1.0.0";

const PROPERTY_REGISTRY = Object.freeze({
  [P.content]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.relations]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.polarity]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.timing]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.correction]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.causal]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.context]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.knowledge]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.ambiguity]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.invention]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.ownership]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.provenance]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.missing]: ["SCIENTIFIC_UNDERSTANDING_COMPETENCE", "DISTRIBUTION", false],
  [P.plan]: ["SCIENTIFIC_UNDERSTANDING_COMPETENCE", "DISTRIBUTION", false],
  [P.equivalence]: ["SCIENTIFIC_UNDERSTANDING_COMPETENCE", "DISTRIBUTION", false],
  [P.clarification]: ["SCIENTIFIC_UNDERSTANDING_COMPETENCE", "DISTRIBUTION", false],
  [P.variation]: ["SCIENTIFIC_UNDERSTANDING_COMPETENCE", "DISTRIBUTION", false],
  [P.enrichment]: ["CONTEXTUAL_ENRICHMENT", "DISTRIBUTION", false],
});

const CATEGORIES = Object.freeze([
  "COMPLETE_SCIENTIFIC_REQUEST",
  "UNDER_SPECIFIED_REQUEST",
  "ELLIPSIS",
  "NECESSARY_IMPLICIT",
  "STRONG_CONTEXTUAL_IMPLICIT",
  "KNOWLEDGE_CANDIDATE",
  "SCIENTIFIC_AMBIGUITY",
  "COMPARISON_AND_TIMING",
  "NEGATION_AND_NON_CAUSALITY",
  "MULTI_TURN_CORRECTION",
  "CHANGE_OF_MIND",
  "METHOD_VERSUS_MEASUREMENT",
  "PHENOMENON_VERSUS_OBSERVABLE",
  "INTERVENTION_AND_IMAGING",
  "MULTIDIMENSIONAL_REQUEST",
]);

const CARDIOVASCULAR_SLUGS = new Set([
  "CARDIAC-AGING-TRAJECTORY",
  "CORONARY-PERFUSION-PRIORITY",
  "CT-FUNCTIONAL-ESTIMATE-ROLE",
  "VALVE-HEMODYNAMICS-MULTIMODAL",
  "PERICARDIAL-FAT-NONCAUSAL",
  "PLAQUE-INTERVENTION-CONTEXT",
  "PULMONARY-HEMODYNAMICS-FOLLOWUP",
  "ATRIAL-FIBROSIS-ABLATION",
  "CONGENITAL-FLOW-ELLIPSIS",
  "CARDIO-RHYTHM-REMODELING",
]);

const OTHER_IMAGING_SLUGS = new Set([
  "RETINAL-VASCULAR-OUTCOME-UNKNOWN",
  "BODY-COMPOSITION-AMBIGUITY",
  "PANCREATIC-COMPOSITION-LONGITUDINAL",
  "INTESTINAL-MOTILITY-METHOD",
  "NEURODEGENERATION-PROGRESSION",
  "OVARIAN-ULTRASOUND-AMBIGUITY",
  "MSK-INFLAMMATION-RESPONSE",
]);

const domainGroupFor = (slug) => {
  if (CARDIOVASCULAR_SLUGS.has(slug)) return "CARDIOVASCULAR_IMAGING";
  if (OTHER_IMAGING_SLUGS.has(slug)) return "OTHER_MEDICAL_IMAGING";
  return "TRANSVERSAL_CLINICAL_BIOMEDICAL_RESEARCH";
};

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(filePath, serialized, "utf8");
  return sha256(serialized);
};

const listFilesRecursive = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFilesRecursive(entryPath) : [entryPath];
    })
    .sort();

const artifactClassFor = (filePath) => {
  if (filePath.endsWith(".case.json")) return "BENCHMARK_CASE";
  if (filePath.endsWith(".envelope.json")) return "ACCEPTANCE_ENVELOPE";
  if (filePath.includes(`${path.sep}coverage${path.sep}`)) return "COVERAGE_MATRIX";
  if (filePath.includes(`${path.sep}registry${path.sep}`)) return "REGISTRY_OR_GOVERNANCE";
  if (filePath.endsWith("corpus-authoring-source.mjs")) return "AUTHORING_SOURCE";
  if (filePath.endsWith("generate-corpus.mjs")) return "DETERMINISTIC_GENERATOR";
  if (filePath.endsWith(".test.mjs")) return "STRUCTURAL_TEST";
  return "STRUCTURAL_VALIDATOR";
};

const clearGeneratedPairs = (setDirectory) => {
  if (!fs.existsSync(setDirectory)) return;
  for (const entry of fs.readdirSync(setDirectory, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".json")) {
      fs.rmSync(path.join(setDirectory, entry.name));
    }
  }
};

clearGeneratedPairs(path.join(CORPUS_ROOT, "development"));
clearGeneratedPairs(path.join(CORPUS_ROOT, "calibration"));

const relative = (filePath) => path.relative(REPOSITORY_ROOT, filePath);

const caseIdentity = (spec) => {
  const prefix = spec.set === "DEVELOPMENT" ? "DEV" : "CAL";
  return {
    caseId: `SEM3-${prefix}-${spec.slug}`,
    envelopeId: `SEM3-AE-${prefix}-${spec.slug}`,
    fileSlug: spec.slug.toLowerCase(),
  };
};

const withStateEvolutionRequirements = (spec) => {
  if (!spec.features.includes("CORRECTION")) return spec.required;
  const lastTurn = spec.turns.length;
  return [
    ...spec.required,
    {
      key: "current-state",
      kind: "CORRECTION",
      text: "L'état scientifique courant, tel que défini après la dernière correction, doit rester actif.",
      properties: [P.correction],
      turn: lastTurn,
      criticality: "CRITICAL",
    },
    {
      key: "historical-state",
      kind: "PROVENANCE",
      text: "Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives.",
      properties: [P.correction, P.provenance],
      turn: lastTurn,
      criticality: "MAJOR",
    },
  ];
};

const propertiesFor = (spec) => {
  const properties = new Set([P.equivalence, P.clarification, P.variation]);
  for (const requirement of withStateEvolutionRequirements(spec)) {
    requirement.properties.forEach((property) => properties.add(property));
  }
  for (const prohibition of spec.prohibited) {
    prohibition.properties.forEach((property) => properties.add(property));
  }
  if (spec.features.includes("CONTEXTUAL_ENRICHMENT")) properties.add(P.enrichment);
  return [...properties].sort();
};

const propertyDeclaration = (propertyId) => {
  const [family, evaluationMode, absolute] = PROPERTY_REGISTRY[propertyId];
  return {
    propertyId,
    family,
    criticality: absolute ? "CRITICAL" : "MAJOR",
    evaluationMode,
    absolute,
    compensable: false,
  };
};

const buildCase = (spec) => {
  const { caseId, envelopeId } = caseIdentity(spec);
  const development = spec.set === "DEVELOPMENT";
  const status = development ? "DEVELOPMENT_VISIBLE" : "DESIGN_ONLY";
  const sourceRequest = spec.turns
    .map((text, index) => `Tour ${index + 1}: ${text}`)
    .join("\n");
  const adjudicationRequirements = [
    {
      expertise: "SCIENTIFIC_DOMAIN",
      rationale: "Confirmer la lisibilité scientifique des obligations candidates sans inventer une approbation.",
      mandatory: true,
    },
    {
      expertise: "METHODOLOGICAL_SEM",
      rationale: "Vérifier équivalence, failure classes, statut épistémique et absence de Gold structurel caché.",
      mandatory: true,
    },
  ];
  if (spec.clarification[0] !== "NOT_EXPECTED") {
    adjudicationRequirements.push({
      expertise: "PD009_CLARIFICATION",
      rationale: "Confirmer la valeur décisionnelle de la clarification candidate sans imposer sa formulation.",
      mandatory: spec.clarification[0] === "REQUIRED",
    });
  }
  if (
    spec.features.includes("METHOD_MEASUREMENT") ||
    spec.features.includes("PHENOMENON_OBSERVABLE")
  ) {
    adjudicationRequirements.push({
      expertise: "OBS_MEASUREMENT",
      rationale: "Vérifier la séparation méthode, observable, image quantitative, mesure et rôle de biomarqueur.",
      mandatory: true,
    });
  }

  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    contractType: "BENCHMARK_AUTHORING_CASE",
    purpose: development ? "DEVELOPMENT_AUTHORING" : "CALIBRATION_AUTHORING",
    caseId,
    version: VERSION,
    title: spec.title,
    createdAt: CREATED_AT,
    authorRole: "CODEX_DOCUMENTARY_AUTHOR",
    reviewStatus: "SCIENTIFIC_REVIEW_REQUIRED",
    source: {
      sourceRequest,
      language: "fr-FR",
      conversationTurns: spec.turns.map((text, index) => ({
        turnId: `turn-${index + 1}`,
        role: "USER",
        text,
      })),
      sourceContext: spec.context,
      provenance: {
        originType: "SYNTHETIC_AUTHORED",
        originalSource: "Original synthetic scientific conversation authored for SEM-003B1; no SEM or provider output was used.",
        author: "Codex acting as documentary benchmark author, not as human scientific reviewer",
        createdAt: CREATED_AT,
        inspirationRefs: [
          "docs/sem-002-scientific-understanding-competence-contract.md",
          "docs/sem-003-independent-scientific-understanding-benchmark-architecture.md",
          "docs/sem-003b-benchmark-case-authoring-protocol.md",
        ],
      },
    },
    scientificScope: {
      domain: spec.domain,
      scenarioCategory: spec.category,
      secondaryCategories: spec.secondary,
      difficultyTarget: spec.difficulty,
      intentionallyMissingInformation: spec.missing.map((description, index) => ({
        informationId: `missing-${index + 1}`,
        description,
        intentional: true,
      })),
    },
    exposure: {
      exposureStatus: status,
      exposureHistory: [
        {
          eventId: `exposure-${caseId.toLowerCase()}-created`,
          fromStatus: null,
          toStatus: status,
          occurredAt: CREATED_AT,
          actorRole: "CODEX_DOCUMENTARY_AUTHOR",
          reason: development
            ? "Authored as an exposed Development case; permanently ineligible for blind qualification."
            : "Authored as a Calibration candidate; human review gate not yet satisfied, therefore DESIGN_ONLY.",
        },
      ],
      parentageStatus: development ? "PARENTAGE_CLEAR" : "PARENTAGE_REVIEW_REQUIRED",
      parentageAssessment: {
        discriminatingConcepts: [spec.title, spec.domain],
        reasoningStructure: spec.independenceNote || `Original ${spec.category} reasoning chain authored for Development use.`,
        criticalRelations: spec.required.map((entry) => entry.text),
        ambiguities: spec.ambiguities.map((entry) => entry.description),
        knownSimilarities: {
          development: [],
          calibration: [],
          historicalLegacy: [],
        },
      },
      contaminationReview: development
        ? {
            status: "CLEAR",
            reviewedAt: CREATED_AT,
            reviewerRole: "CODEX_DOCUMENTARY_PARENTAGE_AUDIT",
            notes: "No lexical or conceptual source reuse was used; this authoring audit is not a human scientific approval and the case remains exposed.",
          }
        : {
            status: "REVIEW_REQUIRED",
            reviewedAt: null,
            reviewerRole: null,
            notes: "No obvious inter-set duplication was identified during authoring; independent human parentage review remains required before Calibration use.",
          },
      eligibleForCalibration: false,
      eligibleForBlindQualification: false,
    },
    reference: {
      acceptanceEnvelopeId: envelopeId,
      applicableSEM002Properties: propertiesFor(spec),
      adjudicationRequirements,
    },
  };
};

const buildEnvelope = (spec) => {
  const { caseId, envelopeId } = caseIdentity(spec);
  const requirements = withStateEvolutionRequirements(spec);
  const required = requirements.map((entry, index) => ({
    obligationId: `req-${index + 1}-${entry.key}`,
    semanticKey: `${caseId.toLowerCase()}.${entry.key}`,
    kind: entry.kind,
    description: entry.text,
    rationale: "Cette obligation modifie le sens scientifique ou le statut épistémique si elle est perdue.",
    sourceLocator: `source.conversationTurns[${entry.turn - 1}]`,
    criticality: entry.criticality,
    propertyIds: entry.properties,
    sourceClassification: "INHERENTLY_REQUIRED",
  }));
  const allRequiredIds = required.map((entry) => entry.obligationId);
  const evaluationDemonstrations = spec.demonstrations
    ? [
        {
          representationId: "representation-a",
          label: "Synthèse structurée par obligations",
          structureSynopsis: "Une structure regroupe les concepts et relations tout en conservant toutes les obligations.",
          declaredDisposition: "ACCEPTABLE_SEMANTIC_EQUIVALENT",
          declarationBasis: "Disposition candidate écrite pour développer le futur évaluateur ; aucune sortie SEM n'est impliquée.",
          notAutomaticallyEvaluated: true,
        },
        {
          representationId: "representation-b",
          label: "Structure distribuée équivalente",
          structureSynopsis: "Une structure différente distribue les mêmes obligations sans changer leur statut, leur provenance ou leur ownership.",
          declaredDisposition: "ACCEPTABLE_SEMANTIC_EQUIVALENT",
          declarationBasis: "Équivalence déclarée dans la référence candidate et soumise à adjudication humaine.",
          notAutomaticallyEvaluated: true,
        },
        {
          representationId: "representation-c",
          label: "Violation critique synthétique",
          structureSynopsis: `Une structure proche commet la violation suivante : ${spec.prohibited[0].text}`,
          declaredDisposition: "SEMANTIC_FAILURE",
          declarationBasis: "La disposition est candidate et illustre une violation PROHIBITED ; elle ne mesure aucun moteur.",
          notAutomaticallyEvaluated: true,
        },
      ]
    : [];

  return {
    schemaVersion: ENVELOPE_SCHEMA_VERSION,
    contractType: "BENCHMARK_AUTHORING_ACCEPTANCE_ENVELOPE",
    envelopeId,
    version: VERSION,
    caseId,
    reviewStatus: "SCIENTIFIC_REVIEW_REQUIRED",
    required,
    prohibited: spec.prohibited.map((entry, index) => ({
      prohibitionId: `pro-${index + 1}-${entry.key}`,
      semanticKey: `${caseId.toLowerCase()}.forbidden-${entry.key}`,
      description: entry.text,
      rationale: "Cette erreur modifierait une obligation scientifique, une provenance, une polarité ou une frontière d'ownership.",
      criticality: entry.criticality,
      propertyIds: entry.properties,
      failureClass: entry.failureClass,
    })),
    acceptableSemanticVariants: [
      {
        variantId: "variant-obligation-vector",
        label: "Vecteur d'obligations indépendant de la topologie",
        structureSynopsis: "Les obligations peuvent être portées par un objet composé ou par plusieurs objets reliés si leur sens, provenance, polarité et ownership sont préservés.",
        preservedObligationIds: allRequiredIds,
        caveats: [
          "Aucune variante n'est acceptée par simple similarité lexicale.",
          "Toute équivalence scientifique complexe reste soumise à adjudication humaine.",
        ],
      },
    ],
    optionalRelevant: spec.optional.map((entry, index) => ({
      candidateId: `opt-${index + 1}-${entry.key}`,
      semanticKey: `${caseId.toLowerCase()}.optional-${entry.key}`,
      description: entry.text,
      epistemicStatus: entry.epistemicStatus,
      rationale: "Candidat contextualisé à examiner sans attribution à l'utilisateur ni adoption par le Project.",
      absenceIsBlocking: false,
      envelopeIsNonExhaustive: true,
    })),
    admissibleAmbiguities: spec.ambiguities.map((entry, index) => ({
      ambiguityId: `amb-${index + 1}-${entry.key}`,
      description: entry.description,
      competingInterpretations: entry.interpretations,
      resolutionInformation: entry.resolution,
      mustRemainOpen: true,
    })),
    expectedClarification: {
      status: spec.clarification[0],
      decisionImpact: spec.clarification[1],
      acceptableQuestionClasses: spec.clarification[2],
      exactWordingRequired: false,
    },
    ownershipBoundaries: [
      {
        boundaryId: "own-sem-project",
        sourceOwner: "SEM",
        targetOwner: "Research Project / human decision",
        description: "SEM peut préserver et structurer l'intention, les unknowns et les candidats ; il n'adopte pas une décision de projet.",
        forbiddenPromotion: "Inference, option or contextual candidate to adopted Project decision",
        adoptionRequiresHumanDecision: true,
      },
      {
        boundaryId: "own-knowledge-specialists",
        sourceOwner: "Knowledge / OBS / Imaging / Scientific Thinking",
        targetOwner: "SEM benchmark reference",
        description: "Les owners spécialisés qualifient preuves, mesures, acquisition ou hypothèses ; leur support n'est pas une déclaration utilisateur.",
        forbiddenPromotion: "Specialist support to explicit user fact or automatic endpoint",
        adoptionRequiresHumanDecision: true,
      },
    ],
    properties: propertiesFor(spec).map(propertyDeclaration),
    adjudication: {
      requiredExpertise: ["SCIENTIFIC_DOMAIN", "METHODOLOGICAL_SEM"],
      notes: "Référence candidate préparée sans exécution SEM, sans provider et sans approbation humaine inventée.",
      humanAdjudicationPoints: [
        "Confirmer que REQUIRED contient uniquement les obligations nécessaires.",
        "Confirmer la plausibilité et le caractère non exhaustif des candidats optionnels.",
        "Confirmer les équivalences sémantiques au-delà des contrôles structurels.",
      ],
      status: "REVIEW_REQUIRED",
    },
    evaluationDemonstrations,
  };
};

const built = corpusSpecs.map((spec) => {
  const identity = caseIdentity(spec);
  return {
    spec,
    identity,
    benchmarkCase: buildCase(spec),
    envelope: buildEnvelope(spec),
  };
});

const registryEntries = [];
for (const item of built) {
  const directory = path.join(
    CORPUS_ROOT,
    item.spec.set === "DEVELOPMENT" ? "development" : "calibration",
  );
  const casePath = path.join(directory, `${item.identity.fileSlug}.case.json`);
  const envelopePath = path.join(directory, `${item.identity.fileSlug}.envelope.json`);
  const caseDigest = writeJson(casePath, item.benchmarkCase);
  const envelopeDigest = writeJson(envelopePath, item.envelope);
  registryEntries.push({
    caseId: item.identity.caseId,
    version: VERSION,
    set: item.spec.set,
    exposureStatus: item.benchmarkCase.exposure.exposureStatus,
    domain: item.spec.domain,
    domainGroup: domainGroupFor(item.spec.slug),
    scenarioCategory: item.spec.category,
    secondaryCategories: item.spec.secondary,
    turnCount: item.spec.turns.length,
    multiTurn: item.spec.turns.length > 1,
    multiTurnContextDependent: item.spec.features.includes("MULTI_TURN_CONTEXT_DEPENDENT"),
    difficultyClass: item.spec.difficulty,
    applicableProperties: item.benchmarkCase.reference.applicableSEM002Properties,
    majorProperties: [
      ...new Set(withStateEvolutionRequirements(item.spec).flatMap((entry) => entry.properties)),
    ].slice(0, 3),
    features: item.spec.features,
    contextClass: item.spec.contextClass,
    underSpecificationDisposition: item.spec.underSpecificationDisposition,
    reviewStatus: item.benchmarkCase.reviewStatus,
    calibrationDisposition:
      item.spec.set === "CALIBRATION" ? "HUMAN_REVIEW_REQUIRED" : "NOT_APPLICABLE",
    parentageStatus: item.benchmarkCase.exposure.parentageStatus,
    contaminationStatus: item.benchmarkCase.exposure.contaminationReview.status,
    sourceClassification: "ORIGINAL_SYNTHETIC_CASE",
    paths: {
      case: relative(casePath),
      acceptanceEnvelope: relative(envelopePath),
    },
    digests: {
      caseSha256: caseDigest,
      acceptanceEnvelopeSha256: envelopeDigest,
      pairSha256: sha256(`${caseDigest}:${envelopeDigest}`),
    },
  });
}

const registry = {
  registryId: "SEM-003B1-CORPUS-REGISTRY",
  version: VERSION,
  generatedAt: CREATED_AT,
  normativeStatus: "BENCHMARK_ARTIFACT_NON_NORMATIVE",
  entries: registryEntries,
};

const countBy = (values) =>
  Object.fromEntries(
    [...new Set(values)]
      .sort()
      .map((value) => [value, values.filter((entry) => entry === value).length]),
  );

const categoryCounts = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
const propertyCounts = Object.fromEntries(
  Object.keys(PROPERTY_REGISTRY).map((property) => [property, 0]),
);
for (const entry of registryEntries) {
  categoryCounts[entry.scenarioCategory] += 1;
  entry.secondaryCategories.forEach((category) => {
    categoryCounts[category] += 1;
  });
  entry.applicableProperties.forEach((property) => {
    propertyCounts[property] += 1;
  });
}

const minimumPropertyCount = Math.min(...Object.values(propertyCounts));
const coverage = {
  coverageId: "SEM-003B1-COVERAGE-MATRIX",
  version: VERSION,
  generatedAt: CREATED_AT,
  summary: {
    totalCases: registryEntries.length,
    developmentCases: registryEntries.filter((entry) => entry.set === "DEVELOPMENT").length,
    calibrationDesignOnly: registryEntries.filter(
      (entry) => entry.set === "CALIBRATION" && entry.exposureStatus === "DESIGN_ONLY",
    ).length,
    calibrationVisible: registryEntries.filter(
      (entry) => entry.set === "CALIBRATION" && entry.exposureStatus === "CALIBRATION_VISIBLE",
    ).length,
    totalConversationTurns: registryEntries.reduce((sum, entry) => sum + entry.turnCount, 0),
    singleTurnCases: registryEntries.filter((entry) => !entry.multiTurn).length,
    multiTurnCases: registryEntries.filter((entry) => entry.multiTurn).length,
    multiTurnContextDependentCases: registryEntries.filter(
      (entry) => entry.multiTurnContextDependent,
    ).length,
    casesOverSevenTurns: registryEntries.filter((entry) => entry.turnCount > 7).length,
  },
  turnDistribution: {
    oneTurn: registryEntries.filter((entry) => entry.turnCount === 1).length,
    twoTurns: registryEntries.filter((entry) => entry.turnCount === 2).length,
    threeToFiveTurns: registryEntries.filter(
      (entry) => entry.turnCount >= 3 && entry.turnCount <= 5,
    ).length,
    sixToSevenTurns: registryEntries.filter(
      (entry) => entry.turnCount >= 6 && entry.turnCount <= 7,
    ).length,
    eightToTenTurns: registryEntries.filter(
      (entry) => entry.turnCount >= 8 && entry.turnCount <= 10,
    ).length,
  },
  domainCounts: countBy(registryEntries.map((entry) => entry.domain)),
  domainGroupCounts: countBy(registryEntries.map((entry) => entry.domainGroup)),
  categoryCounts,
  uncoveredCategories: Object.entries(categoryCounts)
    .filter(([, count]) => count === 0)
    .map(([category]) => category),
  propertyCounts,
  uncoveredProperties: Object.entries(propertyCounts)
    .filter(([, count]) => count === 0)
    .map(([property]) => property),
  lowestCoverageProperties: Object.entries(propertyCounts)
    .filter(([, count]) => count === minimumPropertyCount)
    .map(([property, count]) => ({ property, count })),
  featureCounts: countBy(registryEntries.flatMap((entry) => entry.features)),
  matrix: registryEntries.map((entry) => ({
    caseId: entry.caseId,
    set: entry.set,
    categories: [entry.scenarioCategory, ...entry.secondaryCategories],
    properties: entry.applicableProperties,
    majorProperties: entry.majorProperties,
    domain: entry.domain,
    turnCount: entry.turnCount,
    multiTurnContextDependent: entry.multiTurnContextDependent,
    features: entry.features,
  })),
};

let reviewSequence = 0;
const reviewItems = [];
const addReview = (entry, reviewType, priority, subject, reason, impact, ownerCompetence) => {
  reviewSequence += 1;
  reviewItems.push({
    reviewId: `SEM3B1-REVIEW-${String(reviewSequence).padStart(3, "0")}`,
    reviewType,
    priority,
    caseId: entry.caseId,
    title: built.find((item) => item.identity.caseId === entry.caseId).spec.title,
    candidateSet: entry.set,
    subject,
    reason,
    currentProposal: "Acceptance Envelope candidate as versioned in the corpus.",
    alternatives: ["Accept as authored", "Revise with a new version", "Reject from active corpus"],
    impactIfUnresolved: impact,
    ownerCompetence,
    blocksDevelopment: false,
    blocksCalibration: entry.set === "CALIBRATION" || priority === "HIGH",
  });
};

for (const entry of registryEntries) {
  addReview(
    entry,
    "SCIENTIFIC_REVIEW_REQUIRED",
    entry.set === "CALIBRATION" ? "HIGH" : "NORMAL",
    "Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT",
    "Codex prepared a candidate reference but cannot invent pluralistic human scientific approval.",
    entry.set === "CALIBRATION"
      ? "Candidate remains DESIGN_ONLY and cannot enter formal Calibration."
      : "Development use remains possible for evaluator development with the limitation visible.",
    "Scientific domain expert familiar with the scenario",
  );
  if (entry.set === "CALIBRATION") {
    addReview(
      entry,
      "CALIBRATION_REVIEW_REQUIRED",
      "HIGH",
      "SEM-003B Calibration gate",
      "No human approval, reviewer conflict declaration or calibration admission event exists.",
      "CALIBRATION_VISIBLE is forbidden; candidate remains DESIGN_ONLY.",
      "PD-011 methodological governance and scientific reviewer",
    );
    addReview(
      entry,
      "PARENTAGE_REVIEW_REQUIRED",
      "HIGH",
      "Independent inter-set parentage review",
      "Authoring audit found no obvious duplicate, but independence requires a reviewer distinct from the authoring process.",
      "Candidate cannot be used for formal Calibration until reviewed.",
      "Independent benchmark methodologist",
    );
  }
  if (entry.features.includes("AMBIGUITY")) {
    addReview(
      entry,
      "AMBIGUITY_ADJUDICATION_REQUIRED",
      "NORMAL",
      "Competing interpretations and resolution information",
      "The Acceptance Envelope deliberately preserves multiple interpretations.",
      "Future evaluator decisions remain provisional until the envelope is adjudicated.",
      "Scientific domain expert and SEM methodologist",
    );
  }
  if (
    entry.features.includes("METHOD_MEASUREMENT") ||
    entry.features.includes("PHENOMENON_OBSERVABLE")
  ) {
    addReview(
      entry,
      "METHODOLOGICAL_REVIEW_REQUIRED",
      "NORMAL",
      "Conceptual-plan separation and OBS boundary",
      "The case distinguishes method, observable, image, measurement or biomarker role.",
      "The evaluator cannot be trained on this distinction as final before OBS-aware review.",
      "OBS measurement expert and SEM methodologist",
    );
  }
}

const reviewQueue = {
  queueId: "SEM-003B1-HUMAN-REVIEW-QUEUE",
  version: VERSION,
  generatedAt: CREATED_AT,
  blockingItems: reviewItems.filter((item) => item.priority === "BLOCKING").length,
  countsByType: countBy(reviewItems.map((item) => item.reviewType)),
  countsByPriority: countBy(reviewItems.map((item) => item.priority)),
  items: reviewItems,
};

const calibrationEntries = registryEntries.filter((entry) => entry.set === "CALIBRATION");
const parentageSummary = {
  summaryId: "SEM-003B1-PARENTAGE-CONTAMINATION",
  version: VERSION,
  generatedAt: CREATED_AT,
  method: "Authoring-level conceptual comparison of discriminating facts, reasoning chains, ambiguities, timing, corrections and mechanisms against the Development set, the exposed SEM examples and the source requests of H01-H30; no lexical-identity shortcut and no claim of independent human approval.",
  historicalComparisonBasis: {
    corpus: "SEM-001 R5P historical checkpoints",
    inspectedField: "originalRequest",
    inspectedCaseCount: 30,
    limitation: "Targeted contamination review only; historical outputs, Gold structures and evaluator decisions were not used as authoring sources.",
  },
  sourceReuse: {
    historicalH01H30: false,
    sem002OrSem003ExampleAsCalibration: false,
    developmentTranslationOrParaphraseAsCalibration: false,
  },
  interSetOverlap: {
    obviousDuplicateCount: 0,
    contaminationBlockerCount: 0,
    humanReviewRequiredCount: calibrationEntries.length,
    conclusion: "No obvious duplicate or shared discriminating chain was authored; all Calibration candidates remain DESIGN_ONLY pending independent human parentage review.",
  },
  calibrationAssessments: calibrationEntries.map((entry) => ({
    caseId: entry.caseId,
    disposition: "PARENTAGE_REVIEW_REQUIRED",
    independenceNote: built.find((item) => item.identity.caseId === entry.caseId).spec.independenceNote,
    obviousContaminationIdentified: false,
    eligibleForCalibrationBeforeReview: false,
  })),
};

const registryPath = path.join(CORPUS_ROOT, "registry", "corpus-registry.json");
const coveragePath = path.join(CORPUS_ROOT, "coverage", "coverage-matrix.json");
const reviewQueuePath = path.join(CORPUS_ROOT, "registry", "review-queue.json");
const parentagePath = path.join(CORPUS_ROOT, "registry", "parentage-contamination-summary.json");
const registryDigest = writeJson(registryPath, registry);
const coverageDigest = writeJson(coveragePath, coverage);
const reviewQueueDigest = writeJson(reviewQueuePath, reviewQueue);
const parentageDigest = writeJson(parentagePath, parentageSummary);
const manifestPath = path.join(CORPUS_ROOT, "registry", "corpus-manifest.json");
const fileInventory = listFilesRecursive(CORPUS_ROOT)
  .filter((filePath) => filePath !== manifestPath)
  .map((filePath) => ({
    path: relative(filePath),
    artifactClass: artifactClassFor(filePath),
    version: VERSION,
    createdAt: CREATED_AT,
    sha256: sha256(fs.readFileSync(filePath)),
  }));

const manifest = {
  corpusId: "SEM-003B1-DEVELOPMENT-CALIBRATION-CORPUS",
  version: VERSION,
  generatedAt: CREATED_AT,
  baseGitCommit: BASE_GIT_COMMIT,
  status: "DEVELOPMENT_READY_CALIBRATION_REVIEW_REQUIRED",
  counts: {
    developmentCases: coverage.summary.developmentCases,
    calibrationCandidates: coverage.summary.calibrationDesignOnly,
    calibrationVisible: coverage.summary.calibrationVisible,
    totalCases: coverage.summary.totalCases,
    inventoriedCorpusFilesExcludingManifest: fileInventory.length,
  },
  exposureSummary: {
    DEVELOPMENT_VISIBLE: registryEntries.filter(
      (entry) => entry.exposureStatus === "DEVELOPMENT_VISIBLE",
    ).length,
    DESIGN_ONLY: registryEntries.filter((entry) => entry.exposureStatus === "DESIGN_ONLY").length,
    CALIBRATION_VISIBLE: coverage.summary.calibrationVisible,
    BLIND_SEALED: 0,
    QUALIFICATION_EXECUTED: 0,
  },
  contractVersions: {
    caseSchema: CASE_SCHEMA_VERSION,
    acceptanceEnvelopeSchema: ENVELOPE_SCHEMA_VERSION,
    sem002: "1.0",
    sem003: "1.0",
    sem003b: "1.0",
  },
  artifacts: {
    registry: { path: relative(registryPath), sha256: registryDigest },
    coverage: { path: relative(coveragePath), sha256: coverageDigest },
    reviewQueue: { path: relative(reviewQueuePath), sha256: reviewQueueDigest },
    parentage: { path: relative(parentagePath), sha256: parentageDigest },
  },
  fileInventory,
  cases: registryEntries.map((entry) => ({
    caseId: entry.caseId,
    version: entry.version,
    caseSha256: entry.digests.caseSha256,
    acceptanceEnvelopeSha256: entry.digests.acceptanceEnvelopeSha256,
    pairSha256: entry.digests.pairSha256,
  })),
  exclusions: {
    performanceMetrics: true,
    semResults: true,
    qualificationDecision: true,
    thresholds: true,
    fixedRunCount: true,
    blindPackage: true,
  },
};

writeJson(manifestPath, manifest);

console.log(
  JSON.stringify(
    {
      generated: true,
      corpusRoot: relative(CORPUS_ROOT),
      developmentCases: coverage.summary.developmentCases,
      calibrationCandidates: coverage.summary.calibrationDesignOnly,
      totalCases: coverage.summary.totalCases,
      totalConversationTurns: coverage.summary.totalConversationTurns,
      reviewItems: reviewItems.length,
    },
    null,
    2,
  ),
);
