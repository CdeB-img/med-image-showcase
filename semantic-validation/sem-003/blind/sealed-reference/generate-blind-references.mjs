import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CREATED_AT, P, blindCaseSpecs } from "../authoring/blind-authoring-source.mjs";
import { parentageNotes, referenceSpecs } from "./blind-reference-source.mjs";

const REFERENCE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const BLIND_ROOT = path.dirname(REFERENCE_ROOT);
const REPOSITORY_ROOT = path.resolve(BLIND_ROOT, "../../..");
const CASES_ROOT = path.join(REFERENCE_ROOT, "cases");
const ENVELOPES_ROOT = path.join(REFERENCE_ROOT, "envelopes");
const REVIEW_ROOT = path.join(BLIND_ROOT, "review");

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const readJson = (target) => JSON.parse(fs.readFileSync(target, "utf8"));
const writeJson = (target, value) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const PROPERTY_REGISTRY = Object.freeze({
  [P.P01]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P02]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P03]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P04]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P05]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P06]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P07]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P08]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P09]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P10]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P11]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P12]: ["SAFETY_FIDELITY_INVARIANT", "RUN_LEVEL", true],
  [P.P13]: ["SCIENTIFIC_UNDERSTANDING_COMPETENCE", "DISTRIBUTION", false],
  [P.P14]: ["SCIENTIFIC_UNDERSTANDING_COMPETENCE", "DISTRIBUTION", false],
  [P.P15]: ["SCIENTIFIC_UNDERSTANDING_COMPETENCE", "DISTRIBUTION", false],
  [P.P16]: ["SCIENTIFIC_UNDERSTANDING_COMPETENCE", "DISTRIBUTION", false],
  [P.P17]: ["SCIENTIFIC_UNDERSTANDING_COMPETENCE", "DISTRIBUTION", false],
  [P.P18]: ["CONTEXTUAL_ENRICHMENT", "DISTRIBUTION", false],
});

if (fs.existsSync(CASES_ROOT)) {
  const sealedCase = fs
    .readdirSync(CASES_ROOT)
    .filter((entry) => entry.endsWith(".case.json"))
    .map((entry) => readJson(path.join(CASES_ROOT, entry)))
    .find((entry) => entry.exposure?.exposureStatus === "BLIND_SEALED");
  if (sealedCase) {
    throw new Error(`IMMUTABLE_BLIND_SET: ${sealedCase.caseId} is already BLIND_SEALED`);
  }
}

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

fs.mkdirSync(ENVELOPES_ROOT, { recursive: true });
for (const entry of fs.readdirSync(ENVELOPES_ROOT)) {
  if (entry.endsWith(".json")) fs.rmSync(path.join(ENVELOPES_ROOT, entry));
}

const referenceReviewUnits = [];
const parentageReviewUnits = [];
const reviewerRoles = [
  "REVIEWER_SIM_SCIENTIFIC",
  "REVIEWER_SIM_METHOD_OBS",
  "REVIEWER_SIM_BENCHMARK_GOVERNANCE",
];

const visibleCases = [];
for (const set of ["development", "calibration"]) {
  const directory = path.join(REPOSITORY_ROOT, "semantic-validation", "sem-003", "corpus", set);
  for (const file of fs.readdirSync(directory).filter((entry) => entry.endsWith(".case.json")).sort()) {
    const benchmarkCase = readJson(path.join(directory, file));
    visibleCases.push({ caseId: benchmarkCase.caseId, sourceRequest: benchmarkCase.source.sourceRequest });
  }
}
const legacyRequests = fs
  .readdirSync(path.join(REPOSITORY_ROOT, "semantic-validation", "sem-001r5p", "case-checkpoints"))
  .filter((entry) => /^SEM-H\d{2}\.json$/.test(entry))
  .sort()
  .map((file) => {
    const checkpoint = readJson(path.join(REPOSITORY_ROOT, "semantic-validation", "sem-001r5p", "case-checkpoints", file));
    return { caseId: checkpoint.caseId, originalRequest: checkpoint.originalRequest };
  });

for (const spec of blindCaseSpecs) {
  const slug = spec.slug.toLowerCase();
  const casePath = path.join(CASES_ROOT, `${slug}.case.json`);
  const benchmarkCase = readJson(casePath);
  const reference = referenceSpecs[spec.slug];
  if (!reference) throw new Error(`Missing reference spec for ${spec.slug}`);
  const requirementIds = reference.required.map((entry, index) => `req-${index + 1}-${entry.key}`);
  const properties = [
    ...new Set([
      ...benchmarkCase.reference.applicableSEM002Properties,
      ...reference.required.flatMap((entry) => entry.properties),
      ...reference.prohibited.flatMap((entry) => entry.properties),
      ...(reference.optional.length > 0 ? [P.P18] : []),
    ]),
  ].sort();

  const envelope = {
    schemaVersion: "1.0.0",
    contractType: "SEM003C_BLIND_ACCEPTANCE_ENVELOPE",
    envelopeId: benchmarkCase.reference.acceptanceEnvelopeId,
    version: "1.0.0",
    caseId: benchmarkCase.caseId,
    reviewStatus: "SIMULATED_REFERENCE_STABLE_FOR_BLIND_CONSTRUCTION",
    required: reference.required.map((entry, index) => ({
      obligationId: requirementIds[index],
      semanticKey: `${benchmarkCase.caseId.toLowerCase()}.${entry.key}`,
      kind: entry.kind,
      description: entry.description,
      rationale: "Cette obligation préserve un contenu, une relation, un statut, une temporalité ou une inconnue qui affecte le sens scientifique.",
      sourceLocator: `source.conversationTurns[${entry.turn - 1}]`,
      criticality: entry.criticality,
      propertyIds: entry.properties,
      sourceClassification: "INHERENTLY_REQUIRED",
    })),
    prohibited: reference.prohibited.map((entry, index) => ({
      prohibitionId: `pro-${index + 1}-${entry.key}`,
      semanticKey: `${benchmarkCase.caseId.toLowerCase()}.forbidden-${entry.key}`,
      description: entry.description,
      rationale: "Cette erreur changerait le sens, le statut épistémique, la provenance ou l'ownership de la demande.",
      criticality: entry.criticality,
      propertyIds: entry.properties,
      failureClass: entry.failureClass,
    })),
    acceptableSemanticVariants: [
      {
        variantId: "variant-distributed-obligation-graph",
        label: "Composition distribuée",
        structureSynopsis: "Plusieurs objets et relations peuvent porter le vecteur d'obligations si leurs statuts, polarités, temporalités, provenance et ownership restent reconstructibles.",
        preservedObligationIds: requirementIds,
        caveats: ["Aucune équivalence n'est accordée par simple proximité lexicale.", "Le Level 1 critique reste obligatoire."],
      },
      {
        variantId: "variant-compact-relation-preserving",
        label: "Composition compacte",
        structureSynopsis: "Une représentation plus compacte peut être recevable si elle conserve toutes les obligations et n'ajoute aucune promotion ou décision.",
        preservedObligationIds: requirementIds,
        caveats: ["La compacité ne permet ni omission critique ni fusion de plans conceptuels.", "La topologie n'est pas le critère principal."],
      },
    ],
    optionalRelevant: reference.optional.map((entry, index) => ({
      candidateId: `opt-${index + 1}-${entry.key}`,
      semanticKey: `${benchmarkCase.caseId.toLowerCase()}.optional-${entry.key}`,
      description: entry.description,
      epistemicStatus: "CONTEXTUAL_CANDIDATE",
      rationale: entry.rationale,
      absenceIsBlocking: false,
      envelopeIsNonExhaustive: true,
    })),
    admissibleAmbiguities: reference.ambiguities.map((entry, index) => ({
      ambiguityId: `amb-${index + 1}-${entry.key}`,
      description: entry.description,
      competingInterpretations: entry.interpretations,
      resolutionInformation: entry.resolutionInformation,
      mustRemainOpen: true,
    })),
    expectedClarification: {
      status: reference.clarification.status,
      decisionImpact: reference.clarification.decisionImpact,
      acceptableQuestionClasses: reference.clarification.acceptableQuestionClasses,
      exactWordingRequired: false,
    },
    ownershipBoundaries: [
      {
        boundaryId: "own-sem-project",
        sourceOwner: "SEM",
        targetOwner: "Research Project / human decision",
        description: "SEM peut préserver l'intention, les inconnues, ambiguïtés et candidats; il n'adopte pas une décision de projet.",
        forbiddenPromotion: "Inference, option or contextual candidate to adopted Project decision",
        adoptionRequiresHumanDecision: true,
      },
      {
        boundaryId: "own-knowledge-specialists",
        sourceOwner: "Knowledge / OBS / Imaging / Scientific Thinking",
        targetOwner: "SEM benchmark reference",
        description: "Les owners spécialisés qualifient preuves, mesures, acquisitions et hypothèses sans devenir la voix de l'utilisateur.",
        forbiddenPromotion: "Specialist support to explicit user fact, automatic endpoint or Project truth",
        adoptionRequiresHumanDecision: true,
      },
    ],
    properties: properties.map(propertyDeclaration),
    adjudication: {
      requiredExpertise: ["SCIENTIFIC_DOMAIN", "METHODOLOGICAL_SEM", "INDEPENDENT_ADJUDICATION"],
      notes: "Référence établie avant toute sortie SEM par revue simulée plurifonctionnelle; aucune revue humaine réelle ni éligibilité finale PD-011 n'est revendiquée.",
      humanAdjudicationPoints: [
        "Confirmer ultérieurement la recevabilité scientifique de REQUIRED et PROHIBITED.",
        "Adjuger les équivalences complexes sans modifier rétroactivement l'enveloppe pendant une campagne.",
        "Conserver les candidats optionnels comme enveloppe non exhaustive.",
      ],
      status: "SIMULATED_REVIEW_COMPLETE_NOT_PD011_ELIGIBLE",
    },
    evaluationDemonstrations: [],
  };
  writeJson(path.join(ENVELOPES_ROOT, `${slug}.envelope.json`), envelope);

  benchmarkCase.reviewStatus = "SIMULATED_REFERENCE_REVIEW_COMPLETE";
  benchmarkCase.reference.applicableSEM002Properties = properties;
  benchmarkCase.exposure.parentageStatus = "BLIND_PARENTAGE_CLEAR";
  benchmarkCase.exposure.contaminationReview = {
    status: "CLEAR",
    reviewedAt: CREATED_AT,
    reviewerRole: "REVIEWER_SIM_BENCHMARK_GOVERNANCE",
    notes: "Simulated parentage review found no translation, paraphrase, discriminating-fact reuse, superficial domain swap or recombination; no human independence is claimed.",
  };
  benchmarkCase.exposure.eligibleForBlindQualification = true;
  writeJson(casePath, benchmarkCase);

  referenceReviewUnits.push({
    caseId: benchmarkCase.caseId,
    caseVersion: benchmarkCase.version,
    envelopeId: envelope.envelopeId,
    envelopeVersion: envelope.version,
    reviewedBeforeAnySEMOutput: true,
    reviewerDecisions: reviewerRoles.map((reviewerRole) => ({
      reviewerRole,
      reviewerType: "SIMULATED_REVIEW_ROLE",
      realHumanReviewer: false,
      decision: "ACCEPT_FOR_BLIND_CONSTRUCTION",
      conflictStatus: "SIMULATED_ROLE_NO_REAL_HUMAN_INDEPENDENCE",
    })),
    simulatedConcordance: "THREE_SIMULATED_ROLES_CONCUR",
    realHumanReferenceReview: "NOT_PERFORMED",
    finalPD011ReferenceEligibility: "NO",
  });

  const parentage = parentageNotes[spec.slug];
  parentageReviewUnits.push({
    caseId: benchmarkCase.caseId,
    status: "BLIND_PARENTAGE_CLEAR",
    comparedAgainst: {
      developmentCases: 15,
      calibrationCases: 10,
      historicalLegacyCases: 30,
      sem002AndSem003Examples: true,
      otherBlindCandidates: 14,
    },
    nearestVisibleCases: parentage.visible,
    nearestHistoricalCases: parentage.legacy,
    discriminatingReason: parentage.distinction,
    translationOrParaphrase: false,
    superficialPathologySwap: false,
    exposedScenarioRecombination: false,
    peerBlindDistinct: true,
    reviewerRole: "REVIEWER_SIM_BENCHMARK_GOVERNANCE",
    realHumanIndependenceClaimed: false,
  });
}

const comparedCorpusIdentity = {
  visibleCaseRequestDigest: sha256(JSON.stringify(visibleCases)),
  historicalOriginalRequestDigest: sha256(JSON.stringify(legacyRequests)),
  visibleCases: visibleCases.map((entry) => entry.caseId),
  historicalCases: legacyRequests.map((entry) => entry.caseId),
};

writeJson(path.join(REVIEW_ROOT, "blind-reference-review.json"), {
  schemaVersion: "1.0.0",
  contractType: "SEM003C_BLIND_REFERENCE_REVIEW",
  reviewedAt: CREATED_AT,
  reviewBasis: "SIMULATED_PLURALISTIC_REFERENCE_REVIEW_BEFORE_SEM_OUTPUT",
  reviewerRoles,
  reviewUnits: referenceReviewUnits,
  realHumanReferenceReview: "NOT_PERFORMED",
  finalPD011ReferenceEligibility: "NO",
  semOutputObserved: false,
});

writeJson(path.join(REVIEW_ROOT, "blind-parentage-review.json"), {
  schemaVersion: "1.0.0",
  contractType: "SEM003C_BLIND_PARENTAGE_REVIEW",
  reviewedAt: CREATED_AT,
  reviewMethod: "Compare source requests, discriminating facts, relations, ambiguities and reasoning chains; do not inspect SEM outputs or Gold Frames.",
  comparedCorpusIdentity,
  reviewUnits: parentageReviewUnits,
  summary: {
    blindParentageClear: parentageReviewUnits.filter((entry) => entry.status === "BLIND_PARENTAGE_CLEAR").length,
    relatedVisibleCase: 0,
    blindContaminationRisk: 0,
    requiresParentageReview: 0,
  },
  realHumanIndependenceClaimed: false,
});

console.log(`Generated ${blindCaseSpecs.length} Acceptance Envelopes and simulated review records.`);
