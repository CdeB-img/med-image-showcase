import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SIMULATED_REVIEW_AT,
  SIMULATED_REVIEW_RECORD,
} from "./simulated-review-source.mjs";

const TOOLS_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REVIEW_ROOT = path.resolve(TOOLS_ROOT, "..");
const REPOSITORY_ROOT = path.resolve(REVIEW_ROOT, "../../..");
const CORPUS_ROOT = path.resolve(REVIEW_ROOT, "../corpus");
const EVALUATOR_ROOT = path.resolve(REVIEW_ROOT, "../evaluator");
const GENERATED_AT = SIMULATED_REVIEW_AT;

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) =>
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
const sha256File = (filePath) =>
  crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
const relative = (filePath) => path.relative(REPOSITORY_ROOT, filePath);
const slugForCase = (caseId) => caseId.toLowerCase().replace(/^sem3-(dev|cal)-/, "");
const unitIdForCase = (caseId) => `SEM3B3-RU-${caseId.replace(/^SEM3-/, "")}`;
const pairIdForCase = (caseId) => `SEM3B3-EQ-${caseId.replace(/^SEM3-DEV-/, "")}`;

const loadPairs = (directory) => {
  const files = fs.readdirSync(directory).sort();
  return {
    cases: files
      .filter((file) => file.endsWith(".case.json"))
      .map((file) => readJson(path.join(directory, file))),
    envelopes: files
      .filter((file) => file.endsWith(".envelope.json"))
      .map((file) => readJson(path.join(directory, file))),
  };
};

const development = loadPairs(path.join(CORPUS_ROOT, "development"));
const calibration = loadPairs(path.join(CORPUS_ROOT, "calibration"));
const cases = [...development.cases, ...calibration.cases];
const envelopes = [...development.envelopes, ...calibration.envelopes];
const envelopeByCaseId = new Map(envelopes.map((entry) => [entry.caseId, entry]));
const registry = readJson(path.join(CORPUS_ROOT, "registry/corpus-registry.json"));
const registryByCaseId = new Map(registry.entries.map((entry) => [entry.caseId, entry]));
const reviewQueue = readJson(path.join(CORPUS_ROOT, "registry/review-queue.json"));
const parentage = readJson(
  path.join(CORPUS_ROOT, "registry/parentage-contamination-summary.json"),
);
const evaluatorIdentity = readJson(
  path.join(EVALUATOR_ROOT, "registry/evaluator-identity.json"),
);
const testMatrix = readJson(path.join(EVALUATOR_ROOT, "artifacts/test-matrix.json"));
const equivalenceRows = testMatrix.rows.filter((row) =>
  row.fixture.includes("-distributed.candidate.json"),
);
const equivalenceByCaseId = new Map(equivalenceRows.map((entry) => [entry.caseId, entry]));

const reviewUnitDir = path.join(REVIEW_ROOT, "review-units");
const decisionRecordDir = path.join(REVIEW_ROOT, "decision-records");
const artifactDir = path.join(REVIEW_ROOT, "artifacts");
const docsPacketPath = path.join(
  REPOSITORY_ROOT,
  "docs/sem-003b3-simulated-pluralistic-expert-review-record.md",
);
for (const directory of [reviewUnitDir, decisionRecordDir, artifactDir]) {
  fs.mkdirSync(directory, { recursive: true });
}

const REVIEW_TYPE_TO_QUEUE_TYPE = Object.freeze({
  SCIENTIFIC_REFERENCE: "SCIENTIFIC_REVIEW_REQUIRED",
  METHODOLOGICAL_REFERENCE: "METHODOLOGICAL_REVIEW_REQUIRED",
  AMBIGUITY: "AMBIGUITY_ADJUDICATION_REQUIRED",
  PARENTAGE: "PARENTAGE_REVIEW_REQUIRED",
  CALIBRATION_ADMISSION: "CALIBRATION_REVIEW_REQUIRED",
});
const simulatedDecisions = SIMULATED_REVIEW_RECORD.reviewUnits.flatMap((unit) =>
  Object.entries(unit.consensus.decisions).map(([reviewType, decision]) => ({
    decisionId: `SEM3B3-SIMDEC-${unit.caseId.replace(/^SEM3-(CAL|DEV)-/, "")}-${reviewType.replaceAll("_", "-")}`,
    caseId: unit.caseId,
    reviewUnitId: unitIdForCase(unit.caseId),
    reviewType,
    decision,
    recommendedDisposition:
      reviewType === "CALIBRATION_ADMISSION" ? "CALIBRATION_VISIBLE" : null,
    rationale: unit.consensus.rationale,
    reviewItemIds: reviewQueue.items
      .filter(
        (item) =>
          item.caseId === unit.caseId &&
          item.reviewType === REVIEW_TYPE_TO_QUEUE_TYPE[reviewType],
      )
      .map((item) => item.reviewId),
    simulatedReviewId: SIMULATED_REVIEW_RECORD.reviewId,
    simulatedReviewerRefs: SIMULATED_REVIEW_RECORD.roles.map((role) => role.reviewerId),
    recordedAt: SIMULATED_REVIEW_RECORD.recordedAt,
    sourceCaseVersion:
      unit.caseId === "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY" ? "1.0.0" : "1.0.0",
    sourceEnvelopeVersion:
      unit.caseId === "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY" ? "1.0.0" : "1.0.0",
    revisionRef: unit.consensus.revision?.revisionId || null,
  })),
);
const simulatedDecisionsByCaseId = new Map();
for (const decision of simulatedDecisions) {
  const values = simulatedDecisionsByCaseId.get(decision.caseId) || [];
  values.push(decision);
  simulatedDecisionsByCaseId.set(decision.caseId, values);
}
const simulatedDecisionByReviewItemId = new Map();
for (const decision of simulatedDecisions) {
  for (const reviewItemId of decision.reviewItemIds) {
    simulatedDecisionByReviewItemId.set(reviewItemId, decision);
  }
}
const simulatedReviewUnitByCaseId = new Map(
  SIMULATED_REVIEW_RECORD.reviewUnits.map((entry) => [entry.caseId, entry]),
);
writeJson(
  path.join(decisionRecordDir, "sem003b3-simulated-pluralistic-expert-review.json"),
  SIMULATED_REVIEW_RECORD,
);

const queueByCaseId = new Map();
for (const item of reviewQueue.items) {
  const values = queueByCaseId.get(item.caseId) || [];
  values.push(item);
  queueByCaseId.set(item.caseId, values);
}

const commonValues = (left, right) => left.filter((value) => right.includes(value)).sort();
const relationAssistance = (benchmarkCase) => {
  const entry = registryByCaseId.get(benchmarkCase.caseId);
  const compare = (candidate) => {
    const compared = registryByCaseId.get(candidate.caseId);
    return {
      caseId: candidate.caseId,
      title: candidate.title,
      sharedCategories: commonValues(
        [entry.scenarioCategory, ...entry.secondaryCategories],
        [compared.scenarioCategory, ...compared.secondaryCategories],
      ),
      sharedFeatures: commonValues(entry.features, compared.features),
      sameDomainGroup: entry.domainGroup === compared.domainGroup,
      conclusion: "REVIEW_ASSISTANCE_ONLY",
    };
  };
  const rank = (values) =>
    values
      .map(compare)
      .sort((left, right) => {
        const leftCount =
          left.sharedCategories.length + left.sharedFeatures.length + Number(left.sameDomainGroup);
        const rightCount =
          right.sharedCategories.length + right.sharedFeatures.length + Number(right.sameDomainGroup);
        return rightCount - leftCount || left.caseId.localeCompare(right.caseId);
      })
      .slice(0, 3);
  return {
    method:
      "Metadata overlap for reviewer orientation only; no distance threshold and no parentage decision.",
    closestDevelopmentForReview: rank(
      development.cases.filter((entry) => entry.caseId !== benchmarkCase.caseId),
    ),
    closestCalibrationForReview:
      benchmarkCase.purpose === "CALIBRATION_AUTHORING"
        ? rank(calibration.cases.filter((entry) => entry.caseId !== benchmarkCase.caseId))
        : [],
    b1HistoricalAudit:
      benchmarkCase.purpose === "CALIBRATION_AUTHORING"
        ? parentage.calibrationAssessments.find((entry) => entry.caseId === benchmarkCase.caseId)
        : null,
    exposedExampleComparison:
      "SEM-002/SEM-003 exposed examples remain ineligible as Calibration sources; no reuse was declared by B1.",
    historicalComparison:
      "B1 compared originalRequest only across H01-H30 and reported no source reuse; this is not an independent human conclusion.",
    humanConclusionRequired: true,
  };
};

const loadEquivalencePair = (row) => {
  const distributedPath = path.join(EVALUATOR_ROOT, row.fixture);
  const baselinePath = distributedPath.replace(
    "-distributed.candidate.json",
    "-baseline.candidate.json",
  );
  const candidateA = readJson(baselinePath);
  const candidateB = readJson(distributedPath);
  const statusMap = (values, idKey) =>
    Object.fromEntries(values.map((entry) => [entry[idKey], entry.status]));
  return {
    pairId: pairIdForCase(row.caseId),
    status: "ADJUDICATION_REQUIRED",
    candidateA: {
      candidateId: candidateA.candidateId,
      path: relative(baselinePath),
      structureProfile: candidateA.structureProfile,
      obligationMappings: statusMap(candidateA.obligationMappings, "obligationId"),
      prohibitionSignals: statusMap(candidateA.prohibitionSignals, "prohibitionId"),
      ambiguityMappings: statusMap(candidateA.ambiguityMappings, "ambiguityId"),
      ownershipMappings: statusMap(candidateA.ownershipMappings, "boundaryId"),
      provenanceStatus: candidateA.provenanceSummary.status,
    },
    candidateB: {
      candidateId: candidateB.candidateId,
      path: relative(distributedPath),
      structureProfile: candidateB.structureProfile,
      obligationMappings: statusMap(candidateB.obligationMappings, "obligationId"),
      prohibitionSignals: statusMap(candidateB.prohibitionSignals, "prohibitionId"),
      ambiguityMappings: statusMap(candidateB.ambiguityMappings, "ambiguityId"),
      ownershipMappings: statusMap(candidateB.ownershipMappings, "boundaryId"),
      provenanceStatus: candidateB.provenanceSummary.status,
    },
    level1Observation: {
      candidateA: "PASS",
      candidateB: row.expected.level1,
      criticalVectorMatches: row.expected.criticalVectorMatchesCandidateId,
      limitation:
        "Level 1 equality is necessary but insufficient; no semantic equivalence is inferred.",
    },
    decisionsAllowed: [
      "SEMANTICALLY_EQUIVALENT",
      "NONCRITICAL_VARIATION",
      "NOT_EQUIVALENT",
      "NOT_ADJUDICABLE",
    ],
  };
};

const assistanceFlagsFor = (benchmarkCase, envelope) =>
  benchmarkCase.caseId === "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY" &&
  envelope.admissibleAmbiguities.some((entry) => /IRM/.test(entry.description))
    ? [
        {
          code: "DOCUMENTARY_MODALITY_TERM_MISMATCH_TO_REVIEW",
          observation:
            "The source request names ovarian ultrasound while the current ambiguity description says MRI.",
          disposition: "OPEN_HUMAN_REVIEW_POINT",
        },
      ]
    : [];

const decisionTypesFor = (items, hasEquivalence) => {
  const mapping = {
    SCIENTIFIC_REVIEW_REQUIRED: "SCIENTIFIC_REFERENCE",
    METHODOLOGICAL_REVIEW_REQUIRED: "METHODOLOGICAL_REFERENCE",
    AMBIGUITY_ADJUDICATION_REQUIRED: "AMBIGUITY",
    PARENTAGE_REVIEW_REQUIRED: "PARENTAGE",
    CALIBRATION_REVIEW_REQUIRED: "CALIBRATION_ADMISSION",
  };
  return [
    ...new Set(items.map((item) => mapping[item.reviewType]).filter(Boolean)),
    ...(hasEquivalence ? ["SEMANTIC_EQUIVALENCE"] : []),
  ];
};

const reviewUnits = cases
  .map((benchmarkCase) => {
    const envelope = envelopeByCaseId.get(benchmarkCase.caseId);
    const registryEntry = registryByCaseId.get(benchmarkCase.caseId);
    const items = (queueByCaseId.get(benchmarkCase.caseId) || []).sort((a, b) =>
      a.reviewId.localeCompare(b.reviewId),
    );
    const equivalenceRow = equivalenceByCaseId.get(benchmarkCase.caseId);
    const caseSimulatedDecisions = (
      simulatedDecisionsByCaseId.get(benchmarkCase.caseId) || []
    ).sort((left, right) => left.decisionId.localeCompare(right.decisionId));
    const simulatedReviewUnit = simulatedReviewUnitByCaseId.get(benchmarkCase.caseId) || null;
    const priority =
      benchmarkCase.purpose === "CALIBRATION_AUTHORING"
        ? "CALIBRATION_GATE"
        : equivalenceRow
          ? "DEVELOPMENT_EQUIVALENCE"
          : "NONBLOCKING_DEVELOPMENT_REFERENCE";
    const humanSheetPath =
      priority === "NONBLOCKING_DEVELOPMENT_REFERENCE"
        ? null
        : relative(path.join(reviewUnitDir, `${slugForCase(benchmarkCase.caseId)}.review.md`));
    return {
      schemaVersion: "1.0.0",
      contractType: "SEM003B3_SIMULATED_REVIEW_UNIT",
      reviewUnitId: unitIdForCase(benchmarkCase.caseId),
      caseId: benchmarkCase.caseId,
      candidateSet:
        benchmarkCase.purpose === "CALIBRATION_AUTHORING" ? "CALIBRATION" : "DEVELOPMENT",
      priority,
      state:
        caseSimulatedDecisions.length === 0
          ? "HUMAN_REVIEW_REQUIRED"
          : benchmarkCase.purpose === "CALIBRATION_AUTHORING"
            ? "CALIBRATION_VISIBLE_SIMULATED_REVIEW"
            : "SIMULATED_EQUIVALENCE_RECORDED",
      identity: {
        title: benchmarkCase.title,
        domain: benchmarkCase.scientificScope.domain,
        difficulty: benchmarkCase.scientificScope.difficultyTarget,
        turnCount: benchmarkCase.source.conversationTurns.length,
        language: benchmarkCase.source.language,
        scenarioCategory: benchmarkCase.scientificScope.scenarioCategory,
      },
      sourcePaths: {
        case: registryEntry.paths.case,
        acceptanceEnvelope: registryEntry.paths.acceptanceEnvelope,
      },
      sourceVersions: {
        case: benchmarkCase.version,
        acceptanceEnvelope: envelope.version,
      },
      sourceDigests: {
        caseSha256: registryEntry.digests.caseSha256,
        acceptanceEnvelopeSha256: registryEntry.digests.acceptanceEnvelopeSha256,
        pairSha256: registryEntry.digests.pairSha256,
      },
      scientificRequest: {
        sourceRequest: benchmarkCase.source.sourceRequest,
        conversationTurns: benchmarkCase.source.conversationTurns,
        sourceContext: benchmarkCase.source.sourceContext,
      },
      currentInterpretation: {
        candidateSummary: benchmarkCase.source.sourceContext,
        activeFinalState: envelope.required
          .filter((entry) => !entry.semanticKey.endsWith(".historical-state"))
          .map((entry) => entry.description),
        supersededOrHistorical: envelope.required
          .filter((entry) => entry.semanticKey.endsWith(".historical-state"))
          .map((entry) => entry.description),
        unknowns: benchmarkCase.scientificScope.intentionallyMissingInformation.map(
          (entry) => entry.description,
        ),
        ambiguities: envelope.admissibleAmbiguities.map((entry) => ({
          description: entry.description,
          alternatives: entry.competingInterpretations,
          resolutionInformation: entry.resolutionInformation,
        })),
      },
      acceptanceEnvelope: {
        required: envelope.required.map((entry) => ({
          description: entry.description,
          sourceClassification: entry.sourceClassification,
          criticality: entry.criticality,
          sourceLocator: entry.sourceLocator,
        })),
        prohibited: envelope.prohibited.map((entry) => ({
          description: entry.description,
          failureClass: entry.failureClass,
          criticality: entry.criticality,
        })),
        optionalRelevant: envelope.optionalRelevant.map((entry) => ({
          description: entry.description,
          epistemicStatus: entry.epistemicStatus,
          absenceIsBlocking: entry.absenceIsBlocking,
          nonExhaustive: entry.envelopeIsNonExhaustive,
        })),
        admissibleAmbiguities: envelope.admissibleAmbiguities,
        expectedClarification: envelope.expectedClarification,
        ownershipBoundaries: envelope.ownershipBoundaries,
      },
      properties: envelope.properties.map((entry) => ({
        propertyId: entry.propertyId,
        family: entry.family,
        absolute: entry.absolute,
      })),
      reviewItemIds: items.map((entry) => entry.reviewId),
      reviewTypes: [...new Set(items.map((entry) => entry.reviewType))].sort(),
      decisionRequirements: decisionTypesFor(items, Boolean(equivalenceRow)),
      exposureImpact: {
        currentStatus: benchmarkCase.exposure.exposureStatus,
        acceptedAfterAllApplicableGates:
          benchmarkCase.purpose === "CALIBRATION_AUTHORING"
            ? "CALIBRATION_VISIBLE"
            : "DEVELOPMENT_VISIBLE_UNCHANGED",
        rejected: "REJECTED_WITH_HISTORY_PRESERVED",
        specialistReview: "HUMAN_REVIEW_REQUIRED_AND_NO_PROMOTION",
        blindEligibility: false,
      },
      openReviewPoints: items.map((entry) => ({
        reviewId: entry.reviewId,
        reviewType: entry.reviewType,
        subject: entry.subject,
        currentProposal: entry.currentProposal,
        alternatives: entry.alternatives,
        consequenceIfUnresolved: entry.impactIfUnresolved,
        reviewerCompetence: entry.ownerCompetence,
      })),
      adjudicationRequirements: benchmarkCase.reference.adjudicationRequirements,
      parentageReviewAssistance: relationAssistance(benchmarkCase),
      assistanceFlags: assistanceFlagsFor(benchmarkCase, envelope),
      humanSheetPath,
      equivalencePair: equivalenceRow
        ? {
            ...loadEquivalencePair(equivalenceRow),
            status: caseSimulatedDecisions.some(
              (entry) => entry.reviewType === "SEMANTIC_EQUIVALENCE",
            )
              ? "SIMULATED_EXPERT_CONSENSUS_RECORDED"
              : "ADJUDICATION_REQUIRED",
          }
        : null,
      humanDecisionRecords: [],
      simulatedReviewRecord:
        caseSimulatedDecisions.length > 0 ? SIMULATED_REVIEW_RECORD.reviewId : null,
      simulatedRoleOpinions: simulatedReviewUnit?.roleOpinions || [],
      simulatedDisagreements: simulatedReviewUnit?.disagreements || [],
      simulatedConsensus: simulatedReviewUnit?.consensus || null,
      simulatedDecisions: caseSimulatedDecisions.map((entry) => ({
        decisionId: entry.decisionId,
        reviewType: entry.reviewType,
        decision: entry.decision,
        recommendedDisposition: entry.recommendedDisposition,
        revisionRef: entry.revisionRef,
      })),
      limits: [
        "All three reviewer roles are simulated personas, never human reviewers.",
        "The simulated consensus is usable only for benchmark development and calibration preparation.",
        "All parentage comparisons are REVIEW_ASSISTANCE_ONLY.",
        "REAL_HUMAN_REFERENCE_REVIEW is NOT_PERFORMED and FINAL_PD011_REFERENCE_ELIGIBILITY is NO.",
      ],
    };
  })
  .sort((left, right) => {
    const rank = {
      CALIBRATION_GATE: 0,
      DEVELOPMENT_EQUIVALENCE: 1,
      NONBLOCKING_DEVELOPMENT_REFERENCE: 2,
    };
    return rank[left.priority] - rank[right.priority] || left.caseId.localeCompare(right.caseId);
  });

for (const unit of reviewUnits) {
  writeJson(path.join(reviewUnitDir, `${slugForCase(unit.caseId)}.review-unit.json`), unit);
}

const bulletList = (values, render = (value) => value) =>
  values.length > 0 ? values.map((value) => `- ${render(value)}`).join("\n") : "- Aucun élément déclaré.";
const checkbox = (value) => `- [ ] \`${value}\``;

const renderConversation = (unit) =>
  unit.scientificRequest.conversationTurns
    .map((turn) => `> **${turn.turnId} — ${turn.role}.** ${turn.text}`)
    .join("\n>\n");

const renderParentage = (unit) => {
  const assistance = unit.parentageReviewAssistance;
  const developmentLines = assistance.closestDevelopmentForReview.map(
    (entry) =>
      `- \`${entry.caseId}\` — catégories communes : ${entry.sharedCategories.join(", ") || "aucune"} ; caractéristiques communes : ${entry.sharedFeatures.join(", ") || "aucune"} ; même groupe de domaine : ${entry.sameDomainGroup ? "oui" : "non"}.`,
  );
  const calibrationLines = assistance.closestCalibrationForReview.map(
    (entry) =>
      `- \`${entry.caseId}\` — catégories communes : ${entry.sharedCategories.join(", ") || "aucune"} ; caractéristiques communes : ${entry.sharedFeatures.join(", ") || "aucune"}.`,
  );
  return [
    "**Statut de cette comparaison :** `REVIEW_ASSISTANCE_ONLY` — aucun seuil numérique et aucune conclusion automatique.",
    "",
    "Development à comparer en priorité :",
    "",
    developmentLines.join("\n") || "- Sans objet pour cette unité.",
    ...(calibrationLines.length
      ? ["", "Autres candidats Calibration à comparer en priorité :", "", calibrationLines.join("\n")]
      : []),
    ...(assistance.b1HistoricalAudit
      ? [
          "",
          `Conclusion candidate B1, non humaine : \`${assistance.b1HistoricalAudit.disposition}\` ; ${assistance.b1HistoricalAudit.independenceNote} Contamination évidente identifiée : ${assistance.b1HistoricalAudit.obviousContaminationIdentified ? "oui" : "non"}.`,
        ]
      : []),
    "",
    `Historique H01–H30 : ${assistance.historicalComparison}`,
    "",
    `Exemples exposés : ${assistance.exposedExampleComparison}`,
  ].join("\n");
};

const renderDecisionForm = (unit) => {
  if (unit.simulatedConsensus) {
    const opinions = unit.simulatedRoleOpinions
      .map(
        (entry) =>
          `- **${entry.reviewerId}** — \`${entry.disposition}\` — ${entry.analysis}${entry.reservation ? ` Réserve : ${entry.reservation}` : ""}`,
      )
      .join("\n");
    const disagreements = unit.simulatedDisagreements.length
      ? unit.simulatedDisagreements
          .map(
            (entry) =>
              `- **${entry.subject}** — ${entry.resolution}`,
          )
          .join("\n")
      : "- Aucun désaccord non résolu.";
    const decisions = unit.simulatedDecisions
      .map(
        (entry) =>
          `- \`${entry.reviewType}\` → \`${entry.decision}\` (${entry.decisionId})`,
      )
      .join("\n");
    return `### Avis séparés des trois personas\n\n${opinions}\n\n### Désaccords et résolution\n\n${disagreements}\n\n### Consensus simulé\n\n${unit.simulatedConsensus.rationale}\n\n${decisions}`;
  }
  const sections = [];
  for (const type of unit.decisionRequirements) {
    const options = {
      SCIENTIFIC_REFERENCE: ["ACCEPT", "ACCEPT_WITH_REVISION", "REJECT", "NEEDS_SPECIALIST_REVIEW"],
      METHODOLOGICAL_REFERENCE: [
        "ACCEPT",
        "ACCEPT_WITH_REVISION",
        "REJECT",
        "NEEDS_SPECIALIST_REVIEW",
        "NOT_REQUIRED",
      ],
      AMBIGUITY: [
        "AMBIGUITY_CONFIRMED",
        "AMBIGUITY_REVISED",
        "NOT_ACTUALLY_AMBIGUOUS",
        "SPECIALIST_REVIEW_REQUIRED",
      ],
      PARENTAGE: [
        "PARENTAGE_CLEAR",
        "RELATED_VISIBLE_CASE",
        "CONTAMINATED_FOR_CALIBRATION",
        "PARENTAGE_REVIEW_UNRESOLVED",
      ],
      CALIBRATION_ADMISSION: ["APPROVE", "DO_NOT_APPROVE", "DEFER"],
      SEMANTIC_EQUIVALENCE: [
        "SEMANTICALLY_EQUIVALENT",
        "NONCRITICAL_VARIATION",
        "NOT_EQUIVALENT",
        "NOT_ADJUDICABLE",
      ],
    }[type];
    sections.push(`**${type}**\n\n${options.map(checkbox).join("\n")}`);
  }
  return `${sections.join("\n\n")}\n\n**Rationale :**\n\n**Reviewer reference (pseudonyme stable accepté) :**\n\n**Reviewer role / compétence :**\n\n**Indépendance pour le périmètre déclaré :** \`INDEPENDENT_FOR_STATED_SCOPE\` / \`NOT_INDEPENDENT\`\n\n**Conflit :** \`NO_CONFLICT_DECLARED\` / \`CONFLICT_DECLARED_AND_MANAGED\` / \`CONFLICT_REQUIRES_SECOND_REVIEW\`\n\n**Date :**`;
};

const renderEquivalence = (unit) => {
  if (!unit.equivalencePair) return "";
  const pair = unit.equivalencePair;
  const envelope = envelopeByCaseId.get(unit.caseId);
  return [
    "## Paire d’équivalence B2",
    "",
    `**Pair ID :** \`${pair.pairId}\` · **État :** \`${pair.status}\``,
    "",
    `- Candidate A : \`${pair.candidateA.candidateId}\` — profil \`${pair.candidateA.structureProfile}\`.` ,
    `- Candidate B : \`${pair.candidateB.candidateId}\` — profil \`${pair.candidateB.structureProfile}\`.` ,
    "",
    "Vecteur scientifique à comparer :",
    "",
    bulletList(envelope.required, (entry) => entry.description),
    "",
    "Contrôles Level 1 observés : les deux candidats déclarent les mêmes obligations préservées, les mêmes interdictions absentes, les mêmes ambiguïtés ouvertes, les mêmes frontières d’ownership et une provenance reconstructible.",
    "",
    "**Limite :** cette égalité contractuelle ne prouve pas l’équivalence scientifique. L’humain doit comparer conséquences scientifiques, statuts épistémiques, unknowns, clarification, ownership et provenance.",
  ].join("\n");
};

const renderUnitMarkdown = (unit) => {
  const envelope = unit.acceptanceEnvelope;
  return `# ${unit.reviewUnitId} — ${unit.identity.title}

**Statut :** \`${unit.state}\`

**Set :** \`${unit.candidateSet}\` · **Priorité :** \`${unit.priority}\`

**Case :** \`${unit.caseId}\` v${unit.sourceVersions.case} · **Envelope :** v${unit.sourceVersions.acceptanceEnvelope}

## Identity

| Champ | Valeur |
|---|---|
| Domaine | ${unit.identity.domain} |
| Catégorie | \`${unit.identity.scenarioCategory}\` |
| Difficulté | \`${unit.identity.difficulty}\` |
| Langue | \`${unit.identity.language}\` |
| Tours | ${unit.identity.turnCount} |

## Scientific request

${renderConversation(unit)}

## Current interpretation — candidate only

${unit.currentInterpretation.candidateSummary}

État actif et obligations reconstructibles :

${bulletList(unit.currentInterpretation.activeFinalState)}

Historique/superseded :

${bulletList(unit.currentInterpretation.supersededOrHistorical)}

Unknowns intentionnels :

${bulletList(unit.currentInterpretation.unknowns)}

Ambiguïtés candidates :

${bulletList(unit.currentInterpretation.ambiguities, (entry) => `${entry.description} — alternatives : ${entry.alternatives.join(" / ")}`)}

## Acceptance Envelope — human view

### Required

${bulletList(envelope.required, (entry) => `${entry.description} — ${entry.sourceClassification}, ${entry.criticality}, source : \`${entry.sourceLocator}\``)}

### Prohibited

${bulletList(envelope.prohibited, (entry) => `${entry.description} — \`${entry.failureClass}\`, ${entry.criticality}`)}

### Optional relevant

${bulletList(envelope.optionalRelevant, (entry) => `${entry.description} — \`${entry.epistemicStatus}\`, absence bloquante : ${entry.absenceIsBlocking ? "oui" : "non"}, enveloppe non exhaustive : ${entry.nonExhaustive ? "oui" : "non"}`)}

### Clarification

- Statut candidat : \`${envelope.expectedClarification.status}\`.
- Impact décisionnel : ${envelope.expectedClarification.decisionImpact}
- Classes recevables : ${envelope.expectedClarification.acceptableQuestionClasses.join(" ; ") || "aucune"}.
- Formulation exacte imposée : ${envelope.expectedClarification.exactWordingRequired ? "oui" : "non"}.

### Ownership

${bulletList(envelope.ownershipBoundaries, (entry) => `${entry.sourceOwner} → ${entry.targetOwner} : ${entry.description} Promotion interdite : ${entry.forbiddenPromotion}`)}

## Propriétés SEM-002 concernées

${bulletList(unit.properties, (entry) => `\`${entry.propertyId}\` — \`${entry.family}\`, absolue : ${entry.absolute ? "oui" : "non"}`)}

## Review points hérités de la queue B1

${unit.openReviewPoints.map((entry) => `### \`${entry.reviewId}\` — \`${entry.reviewType}\`

- Point : ${entry.subject}.
- Proposition actuelle : ${entry.currentProposal}
- Alternatives raisonnables : ${entry.alternatives.join(" ; ")}.
- Compétence : ${entry.reviewerCompetence}.
- Conséquence si ouvert : ${entry.consequenceIfUnresolved}`).join("\n\n")}

${unit.assistanceFlags.length ? `### Incohérences documentaires détectées — à arbitrer\n\n${bulletList(unit.assistanceFlags, (entry) => `\`${entry.code}\` — ${entry.observation}`)}\n` : ""}
## Parentage — assistance only

${renderParentage(unit)}

- Conclusion candidate : \`UNDETERMINED — HUMAN_REVIEW_REQUIRED\`.
- Incertitude restante : l’assistance par métadonnées ne mesure ni dérivation sémantique, ni contamination, ni indépendance d’authoring.

${renderEquivalence(unit)}

## Revue et disposition

${renderDecisionForm(unit)}

${unit.candidateSet === "CALIBRATION" ? `**Recommended disposition — à renseigner par l’humain :**

\`CALIBRATION_VISIBLE\` / \`REJECTED\` / \`NEEDS_SPECIALIST_REVIEW\`

**Impact d’exposition :** état courant \`${unit.exposureImpact.currentStatus}\` ; aucune décision isolée ne promeut le cas ; le blind reste inéligible.` : `**Impact d’exposition :** \`${unit.exposureImpact.acceptedAfterAllApplicableGates}\` ; aucune promotion Calibration ou blind n’est possible depuis cette fiche.`}

## Règles de preuve

- Les trois rôles enregistrés ici sont des personas simulées et ne valent jamais revue humaine.
- La revue simulée peut rendre une référence visible pour la calibration de développement, sans satisfaire la preuve confirmatoire PD-011.
- Toute révision doit préciser le delta ; toute décision incomplète reste ouverte.
- La trace structurée respecte \`semantic-validation/sem-003/review/contracts/simulated-pluralistic-review-record.schema.json\`.
`;
};

const priorityUnits = reviewUnits.filter(
  (unit) => unit.priority !== "NONBLOCKING_DEVELOPMENT_REFERENCE",
);
for (const unit of priorityUnits) {
  fs.writeFileSync(path.join(REPOSITORY_ROOT, unit.humanSheetPath), renderUnitMarkdown(unit));
}

const decisionsTable = priorityUnits.flatMap((unit) =>
  unit.decisionRequirements.map((reviewType) => {
    const decision = (simulatedDecisionsByCaseId.get(unit.caseId) || []).find(
      (entry) => entry.reviewType === reviewType,
    );
    return {
      reviewUnitId: unit.reviewUnitId,
      caseId: unit.caseId,
      candidateSet: unit.candidateSet,
      reviewType,
      status: decision ? "SIMULATED_EXPERT_CONSENSUS_RECORDED" : "OPEN",
      simulatedDecisionId: decision?.decisionId || null,
      simulatedReviewId: decision?.simulatedReviewId || null,
      disposition: decision?.decision || null,
    };
  }),
);

const progressItems = reviewQueue.items.map((item) => {
  const decision = simulatedDecisionByReviewItemId.get(item.reviewId);
  return {
    reviewId: item.reviewId,
    caseId: item.caseId,
    reviewType: item.reviewType,
    priority: item.priority,
    status: decision ? "RESOLVED" : "OPEN",
    reviewUnitId: unitIdForCase(item.caseId),
    decisionId: decision?.decisionId || null,
    simulatedReviewId: decision?.simulatedReviewId || null,
    disposition: decision?.decision || null,
    resultingVersion:
      item.caseId === "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY" && decision
        ? "1.0.1"
        : null,
  };
});
const progressCount = (status) =>
  progressItems.filter((item) => item.status === status).length;

const reviewProgress = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_REVIEW_PROGRESS",
  generatedAt: GENERATED_AT,
  sourceQueueId: reviewQueue.queueId,
  sourceQueueVersion: reviewQueue.version,
  counts: {
    originalReviewQueueItems: reviewQueue.items.length,
    open: progressCount("OPEN"),
    resolved: progressCount("RESOLVED"),
    deferred: 0,
    rejected: 0,
    superseded: 0,
    simulatedReviewRecords: 1,
    simulatedReviewerPersonas: SIMULATED_REVIEW_RECORD.roles.length,
    simulatedDecisionsRecorded: simulatedDecisions.length,
    realHumanDecisionsRecorded: 0,
    openEquivalenceAdjudications: equivalenceRows.filter(
      (row) =>
        !(simulatedDecisionsByCaseId.get(row.caseId) || []).some(
          (entry) => entry.reviewType === "SEMANTIC_EQUIVALENCE",
        ),
    ).length,
  },
  items: progressItems,
  note:
    "The original B1 Review Queue remains immutable. This derived view records simulated review only: 39 Calibration queue items are resolved for development calibration, while 23 nonblocking Development items remain open.",
};

const calibrationGateStatus = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_CALIBRATION_GATE_STATUS",
  generatedAt: GENERATED_AT,
  status: "SIMULATED_CALIBRATION_REFERENCE_SET_READY",
  candidatesInitial: calibration.cases.length,
  admitted: calibration.cases.length,
  designOnly: 0,
  rejected: 0,
  specialistReview: 0,
  calibrationVisible: calibration.cases.length,
  cases: reviewUnits
    .filter((unit) => unit.candidateSet === "CALIBRATION")
    .map((unit) => ({
      caseId: unit.caseId,
      reviewUnitId: unit.reviewUnitId,
      status: "CALIBRATION_VISIBLE_SIMULATED_REVIEW",
      exposureStatus: "CALIBRATION_VISIBLE",
      promotionApplied: true,
      eligibleForCalibration: true,
      eligibleForBlindQualification: false,
      eligibleForFormalIndependentQualification: false,
      referenceReviewBasis: "SIMULATED_PLURALISTIC_EXPERT_REVIEW",
      simulatedReferenceReview: "COMPLETE",
      realHumanReferenceReview: "NOT_PERFORMED",
      finalPD011ReferenceEligibility: "NO",
      requiredDecisionTypes: unit.decisionRequirements,
      recordedSimulatedReviewId: SIMULATED_REVIEW_RECORD.reviewId,
      recordedSimulatedDecisionIds: unit.simulatedDecisions.map(
        (entry) => entry.decisionId,
      ),
      simulatedReviewerPersonaCount: SIMULATED_REVIEW_RECORD.roles.length,
      recommendedReviewerCompetencies: unit.adjudicationRequirements
        .filter((entry) => entry.mandatory)
        .map((entry) => entry.expertise),
      unmetDevelopmentCalibrationGates: [],
      unmetFinalQualificationGates: [
        "REAL_HUMAN_REFERENCE_REVIEW_REQUIRED",
        "PD011_INDEPENDENT_REFERENCE_PANEL_REQUIRED",
        "FORMAL_QUALIFICATION_PROTOCOL_REQUIRED",
        "BLIND_PACKAGE_REQUIRED",
      ],
    })),
  calibrationEntryRequirements: [],
  futureIndependentQualificationRequirements: [
    "Evaluator calibration under PD-011",
    "Pre-specified N, metrics and thresholds",
    "A separately constructed and sealed blind package",
    "An independent immutable qualification campaign",
    "A distinct PD-011 campaign decision",
  ],
  calibrationPerformed: false,
  metricsComputed: false,
  thresholdsFixed: false,
  nFixed: false,
};

const equivalenceReviewStatus = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_EQUIVALENCE_REVIEW_STATUS",
  generatedAt: GENERATED_AT,
  resolved: equivalenceRows.filter((row) =>
    (simulatedDecisionsByCaseId.get(row.caseId) || []).some(
      (entry) => entry.reviewType === "SEMANTIC_EQUIVALENCE",
    ),
  ).length,
  open: equivalenceRows.filter(
    (row) =>
      !(simulatedDecisionsByCaseId.get(row.caseId) || []).some(
        (entry) => entry.reviewType === "SEMANTIC_EQUIVALENCE",
      ),
  ).length,
  pairs: reviewUnits
    .filter((unit) => unit.equivalencePair)
    .map((unit) => ({
      pairId: unit.equivalencePair.pairId,
      caseId: unit.caseId,
      reviewUnitId: unit.reviewUnitId,
      candidateA: unit.equivalencePair.candidateA.candidateId,
      candidateB: unit.equivalencePair.candidateB.candidateId,
      level1A: "PASS",
      level1B: "PASS",
      status: unit.equivalencePair.status,
      simulatedDecisionId:
        unit.simulatedDecisions.find(
          (entry) => entry.reviewType === "SEMANTIC_EQUIVALENCE",
        )?.decisionId || null,
      simulatedReviewId: unit.simulatedReviewRecord,
      disposition:
        unit.simulatedDecisions.find(
          (entry) => entry.reviewType === "SEMANTIC_EQUIVALENCE",
        )?.decision || null,
      independentQualificationEvidence: false,
    })),
  rule:
    "The five equivalences are adjudicated by three distinct simulated roles, not inferred from Level 1. They are usable for Development evaluator tests but are not independent qualification evidence.",
};

const versionRegistry = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_REFERENCE_VERSION_REGISTRY",
  generatedAt: GENERATED_AT,
  references: cases
    .map((benchmarkCase) => {
      const envelope = envelopeByCaseId.get(benchmarkCase.caseId);
      const registryEntry = registryByCaseId.get(benchmarkCase.caseId);
      const caseDecisions = simulatedDecisionsByCaseId.get(benchmarkCase.caseId) || [];
      const ovarianRevision =
        benchmarkCase.caseId === "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY";
      return {
        caseId: benchmarkCase.caseId,
        currentCaseVersion: benchmarkCase.version,
        currentEnvelopeVersion: envelope.version,
        caseSha256: registryEntry.digests.caseSha256,
        envelopeSha256: registryEntry.digests.acceptanceEnvelopeSha256,
        pairSha256: registryEntry.digests.pairSha256,
        previousVersions: ovarianRevision
          ? [
              {
                caseVersion: "1.0.0",
                envelopeVersion: "1.0.0",
                caseSha256:
                  "607a9e1bcd206d0df6ca9118efd8dbb74822f9427cce921d959a84861406eee6",
                envelopeSha256:
                  "677ebcfee9b54a537bcfe926986f866951a1bd89c0fac20acb1aedbe469fb185",
                pairSha256:
                  "a174a9f6802e66dbedb53e0c818d5d568133065d228e1681b49adae3e4428ef1",
                sourceGitCommit: "8aad0e7",
              },
            ]
          : [],
        resultingVersions: ovarianRevision
          ? [
              {
                caseVersion: benchmarkCase.version,
                envelopeVersion: envelope.version,
                caseSha256: registryEntry.digests.caseSha256,
                envelopeSha256: registryEntry.digests.acceptanceEnvelopeSha256,
                pairSha256: registryEntry.digests.pairSha256,
                revisionId: "SEM3B3-REV-OVARIAN-ULTRASOUND-1-0-1",
              },
            ]
          : [],
        simulatedDecisionIds: caseDecisions.map((entry) => entry.decisionId).sort(),
        simulatedReviewId:
          caseDecisions.length > 0 ? SIMULATED_REVIEW_RECORD.reviewId : null,
        modifiedInB3PacketPreparation: false,
        modifiedInSimulatedReview: ovarianRevision,
      };
    })
    .sort((left, right) => left.caseId.localeCompare(right.caseId)),
};

const ovarianRegistryEntry = registryByCaseId.get(
  "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY",
);
const referenceRevisionLineage = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_REFERENCE_REVISION_LINEAGE",
  generatedAt: GENERATED_AT,
  revisions: [
    {
      revisionId: "SEM3B3-REV-OVARIAN-ULTRASOUND-1-0-1",
      caseId: "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY",
      simulatedReviewId: SIMULATED_REVIEW_RECORD.reviewId,
      decisionIds: [
        "SEM3B3-SIMDEC-OVARIAN-ULTRASOUND-AMBIGUITY-SCIENTIFIC-REFERENCE",
        "SEM3B3-SIMDEC-OVARIAN-ULTRASOUND-AMBIGUITY-AMBIGUITY",
        "SEM3B3-SIMDEC-OVARIAN-ULTRASOUND-AMBIGUITY-METHODOLOGICAL-REFERENCE",
      ],
      sourceGitCommit: "8aad0e7",
      previous: {
        caseVersion: "1.0.0",
        envelopeVersion: "1.0.0",
        caseSha256:
          "607a9e1bcd206d0df6ca9118efd8dbb74822f9427cce921d959a84861406eee6",
        envelopeSha256:
          "677ebcfee9b54a537bcfe926986f866951a1bd89c0fac20acb1aedbe469fb185",
        pairSha256:
          "a174a9f6802e66dbedb53e0c818d5d568133065d228e1681b49adae3e4428ef1",
      },
      resulting: {
        caseVersion: "1.0.1",
        envelopeVersion: "1.0.1",
        caseSha256: ovarianRegistryEntry.digests.caseSha256,
        envelopeSha256: ovarianRegistryEntry.digests.acceptanceEnvelopeSha256,
        pairSha256: ovarianRegistryEntry.digests.pairSha256,
      },
      changes: [
        {
          target: "CASE",
          jsonPointer: "/exposure/parentageAssessment/ambiguities/0",
          from: "L'usage scientifique de l'IRM est indécis.",
          to: "L'usage scientifique de l'échographie ovarienne est indécis.",
        },
        {
          target: "ACCEPTANCE_ENVELOPE",
          jsonPointer: "/admissibleAmbiguities/0/description",
          from: "L'usage scientifique de l'IRM est indécis.",
          to: "L'usage scientifique de l'échographie ovarienne est indécis.",
        },
      ],
      semanticScopePreserved: ["détection", "caractérisation", "suivi"],
      reason:
        "Explicit simulated pluralistic review correction of an objective modality wording error; no scientific scope was added or removed.",
    },
  ],
};

const antiOverfitting = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_ANTI_OVERFITTING_AUDIT",
  generatedAt: GENERATED_AT,
  semOutputsReadForReferenceRevision: false,
  calibrationEvaluatorResultsUsed: false,
  referenceAdaptedToObservedOutput: false,
  calibrationContentUsedForEvaluatorTuning: false,
  localDecisionPromotedToGenericRule: false,
  developmentCasePromotedToCalibration: false,
  exposedCaseDeclaredBlindEligible: false,
  semModified: false,
  semExecuted: false,
  llmProviderCalls: 0,
  calibrationExecuted: false,
  blindSetCreated: false,
  qualificationDecisionProduced: false,
};

const calibrationReferenceSet = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_DEVELOPMENT_CALIBRATION_REFERENCE_SET",
  referenceSetId: "SEM3-CALIBRATION-REFERENCE-SET-SIMULATED-1",
  version: "1.0.0",
  generatedAt: GENERATED_AT,
  status: "READY_FOR_B4_DEVELOPMENT_CALIBRATION",
  referenceReviewBasis: "SIMULATED_PLURALISTIC_EXPERT_REVIEW",
  simulatedReferenceReview: "COMPLETE",
  realHumanReferenceReview: "NOT_PERFORMED",
  finalPD011ReferenceEligibility: "NO",
  blindEligibility: "NO",
  eligibleForFormalIndependentQualification: false,
  calibrationExecutionAuthorizedInB3: false,
  cases: calibration.cases
    .map((benchmarkCase) => {
      const registryEntry = registryByCaseId.get(benchmarkCase.caseId);
      const envelope = envelopeByCaseId.get(benchmarkCase.caseId);
      const reviewUnit = reviewUnits.find((unit) => unit.caseId === benchmarkCase.caseId);
      return {
        caseId: benchmarkCase.caseId,
        caseVersion: benchmarkCase.version,
        envelopeVersion: envelope.version,
        exposureStatus: benchmarkCase.exposure.exposureStatus,
        eligibleForDevelopmentCalibration: benchmarkCase.exposure.eligibleForCalibration,
        eligibleForFormalIndependentQualification: false,
        eligibleForBlindQualification: false,
        reviewUnitId: reviewUnit.reviewUnitId,
        simulatedReviewId: SIMULATED_REVIEW_RECORD.reviewId,
        simulatedDecisionIds: reviewUnit.simulatedDecisions.map(
          (entry) => entry.decisionId,
        ),
        digests: registryEntry.digests,
      };
    })
    .sort((left, right) => left.caseId.localeCompare(right.caseId)),
  evaluator: {
    version: evaluatorIdentity.version,
    configurationDigest: evaluatorIdentity.configurationDigest,
    modifiedFromCalibrationEvidence: false,
  },
  exclusions: [
    "No Calibration B4 execution",
    "No SEM execution",
    "No LLM/provider call",
    "No formal independent qualification evidence",
    "No blind eligibility",
    "No PD-011 PASS/FAIL decision",
  ],
};

const decisionImportTemplate = {
  templateOnly: true,
  schema: "semantic-validation/sem-003/review/contracts/human-decision-record.schema.json",
  instructions: [
    "Create one JSON record per reviewer, Case and review type.",
    "Do not place a template or draft in decision-records/.",
    "A pseudonymous stable reviewerRef is accepted; do not invent independence or conflict information.",
    "ACCEPT_WITH_REVISION and AMBIGUITY_REVISED require a complete revision plan.",
  ],
  fields: {
    schemaVersion: "1.0.0",
    contractType: "SEM003B3_HUMAN_REFERENCE_DECISION_RECORD",
    decisionId: "SEM3B3-HDR-TO-BE-ASSIGNED",
    caseId: "SEM3-CAL-TO-BE-SELECTED",
    reviewUnitId: "SEM3B3-RU-CAL-TO-BE-SELECTED",
    reviewType: "SCIENTIFIC_REFERENCE",
    reviewerRef: "REVIEWER-TO-BE-ASSIGNED",
    reviewerRole: "TO_BE_COMPLETED_BY_HUMAN",
    competencies: ["TO_BE_COMPLETED_BY_HUMAN"],
    decision: "TO_BE_COMPLETED_BY_HUMAN",
    recommendedDisposition: null,
    rationale: "TO_BE_COMPLETED_BY_HUMAN",
    scope: "TO_BE_COMPLETED_BY_HUMAN",
    createdAt: "TO_BE_COMPLETED_BY_HUMAN",
    conflictDeclared: "TO_BE_COMPLETED_BY_HUMAN",
    independenceDeclaration: "TO_BE_COMPLETED_BY_HUMAN",
    sourceCaseVersion: "1.0.0",
    sourceEnvelopeVersion: "1.0.0",
    reviewItemIds: [],
    evidenceReviewed: ["TO_BE_COMPLETED_BY_HUMAN"],
    supersedes: null,
    authority: "HUMAN_REFERENCE_REVIEW",
    status: "FINAL"
  },
};

writeJson(path.join(artifactDir, "review-progress.json"), reviewProgress);
writeJson(path.join(artifactDir, "calibration-gate-status.json"), calibrationGateStatus);
writeJson(path.join(artifactDir, "equivalence-review-status.json"), equivalenceReviewStatus);
writeJson(path.join(artifactDir, "reference-version-registry.json"), versionRegistry);
writeJson(path.join(artifactDir, "reference-revision-lineage.json"), referenceRevisionLineage);
writeJson(path.join(artifactDir, "calibration-reference-set.json"), calibrationReferenceSet);
writeJson(path.join(artifactDir, "decision-table.json"), {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_CONSOLIDATED_DECISION_TABLE",
  generatedAt: GENERATED_AT,
  rows: decisionsTable,
});
writeJson(path.join(artifactDir, "human-decision-import-template.json"), decisionImportTemplate);
writeJson(path.join(artifactDir, "anti-overfitting-audit.json"), antiOverfitting);

fs.writeFileSync(
  path.join(decisionRecordDir, "README.md"),
  `# SEM-003B3 Review Records\n\n\`sem003b3-simulated-pluralistic-expert-review.json\` is explicitly SIMULATED_EXPERT_REVIEW_EVIDENCE. Its three personas are not human reviewers, do not satisfy the PD-011 independent panel and grant no formal or blind qualification eligibility.\n\nA future real human decision belongs here only after a real reviewer has supplied provenance, rationale, competence, scope, date and conflict declaration. It must validate against \`../contracts/human-decision-record.schema.json\` and must never reuse a simulated reviewer identity.\n`,
);

const renderCompactUnit = (unit) => {
  const envelope = unit.acceptanceEnvelope;
  const parentageLines = unit.parentageReviewAssistance.closestDevelopmentForReview.map(
    (entry) =>
      `\`${entry.caseId}\` (${[...entry.sharedCategories, ...entry.sharedFeatures].join(", ") || "aucun recouvrement déclaré"})`,
  );
  return `### ${unit.identity.title}

**Case :** \`${unit.caseId}\` · **Review Unit :** \`${unit.reviewUnitId}\` · **Domaine :** ${unit.identity.domain} · **Difficulté :** \`${unit.identity.difficulty}\` · **Tours :** ${unit.identity.turnCount}

${renderConversation(unit)}

**Required**

${bulletList(envelope.required, (entry) => entry.description)}

**Prohibited**

${bulletList(envelope.prohibited, (entry) => `${entry.description} — \`${entry.failureClass}\``)}

**Optional relevant**

${bulletList(envelope.optionalRelevant, (entry) => `${entry.description} — ${entry.epistemicStatus}, non exhaustif`)}

**Ambiguïtés et clarification**

${bulletList(envelope.admissibleAmbiguities, (entry) => `${entry.description} — ${entry.competingInterpretations.join(" / ")}`)}

- Clarification : \`${envelope.expectedClarification.status}\` — ${envelope.expectedClarification.decisionImpact}

**Points de revue B1**

${bulletList(unit.openReviewPoints, (entry) => `\`${entry.reviewType}\` — ${entry.subject}`)}
${unit.assistanceFlags.length ? `\n${bulletList(unit.assistanceFlags, (entry) => `**À arbitrer :** ${entry.observation}`)}\n` : ""}
**Parenté — assistance only**

- Development à comparer : ${parentageLines.join(" ; ") || "sans objet"}.
- Conclusion simulée : \`${unit.simulatedConsensus?.status || "NOT_REVIEWED"}\`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** ${unit.simulatedDecisions.length ? unit.simulatedDecisions.map((entry) => `\`${entry.reviewType}=${entry.decision}\``).join(" ; ") : "aucune"}.

Fiche détaillée : \`${unit.humanSheetPath}\`.
`;
};

const calibrationUnits = priorityUnits.filter((unit) => unit.candidateSet === "CALIBRATION");
const developmentEquivalenceUnits = priorityUnits.filter(
  (unit) => unit.priority === "DEVELOPMENT_EQUIVALENCE",
);

const packet = `# SEM-003B3 — Simulated Pluralistic Expert Review Record

| Champ | Valeur |
|---|---|
| Statut | \`SIMULATED_CALIBRATION_REFERENCE_SET_READY\` |
| Nature | Revue pluraliste simulée pour développement et préparation Calibration uniquement |
| Baseline | SEM-003B1 corpus 1.0.0 ; évaluateur SEM-003 v${evaluatorIdentity.version} |
| Evaluator digest | \`${evaluatorIdentity.configurationDigest}\` |
| Review Units | ${reviewUnits.length} total ; ${priorityUnits.length} prioritaires |
| Personas simulées | 3 rôles distincts |
| Décisions simulées | ${simulatedDecisions.length} |
| Décisions humaines réelles | 0 |
| Calibration visible | ${calibrationUnits.length} |
| Date d’état | 13 août 2026 |

## A. Frontière de preuve

Les trois rôles \`REVIEWER_SIM_1\`, \`REVIEWER_SIM_2\` et \`REVIEWER_SIM_3\` sont des personas de simulation. Ils ne sont ni des humains, ni un panel indépendant, ni une preuve confirmatoire PD-011. Leur consensus rend les références utilisables pour tester et calibrer l’instrument de mesure en B4 ; il n’autorise ni qualification finale, ni blind set, ni exécution dans B3.

## B. Dix références Calibration

| Case | Domaine | Disposition | Base | Formal/Blind |
|---|---|---|---|---|
${calibrationUnits.map((unit) => `| \`${unit.caseId}\` | ${unit.identity.domain} | \`CALIBRATION_VISIBLE\` | \`SIMULATED_PLURALISTIC_EXPERT_REVIEW\` | \`NO / NO\` |`).join("\n")}

${calibrationUnits.map(renderCompactUnit).join("\n\n---\n\n")}

## C. Cinq équivalences Development

Le Level 1 n’établit aucune équivalence à lui seul. Les dispositions ci-dessous proviennent des trois avis simulés séparés et de leur consensus ; elles peuvent servir aux tests Development de l’évaluateur, jamais comme preuve indépendante finale.

${developmentEquivalenceUnits.map((unit) => `${renderCompactUnit(unit)}\n\n${renderEquivalence(unit)}`).join("\n\n---\n\n")}

## D. Correction versionnée

\`SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY\` passe de 1.0.0 à 1.0.1. La seule correction scientifique documentaire est « IRM » → « échographie ovarienne » dans l’ambiguïté. Détection, caractérisation et suivi restent ouverts. L’ancienne version, les anciens digests, le commit source et les nouveaux digests sont conservés dans \`reference-revision-lineage.json\`.

## E. État et limites

- 39/62 items de la queue B1 sont résolus par la revue simulée ; 23/62 Development non bloquants restent ouverts.
- 10/10 références sont \`CALIBRATION_VISIBLE\` et 0 reste \`DESIGN_ONLY\`.
- 5/5 équivalences Development portent une disposition simulée.
- \`REAL_HUMAN_REFERENCE_REVIEW = NOT_PERFORMED\`.
- \`FINAL_PD011_REFERENCE_ELIGIBILITY = NO\` et \`BLIND_ELIGIBILITY = NO\`.
- Aucune Calibration B4, aucun SEM, aucun provider, aucun blind set et aucune décision PASS/FAIL n’ont été exécutés.
`;
fs.writeFileSync(docsPacketPath, packet);

const inventory = [
  ...fs.readdirSync(reviewUnitDir).map((file) => path.join(reviewUnitDir, file)),
  ...fs.readdirSync(decisionRecordDir).map((file) => path.join(decisionRecordDir, file)),
  ...fs
    .readdirSync(path.join(REVIEW_ROOT, "contracts"))
    .map((file) => path.join(REVIEW_ROOT, "contracts", file)),
  ...fs
    .readdirSync(artifactDir)
    .filter((file) => file !== "review-unit-manifest.json")
    .map((file) => path.join(artifactDir, file)),
  ...fs
    .readdirSync(path.join(REVIEW_ROOT, "validator"))
    .map((file) => path.join(REVIEW_ROOT, "validator", file)),
  ...fs
    .readdirSync(path.join(REVIEW_ROOT, "tools"))
    .map((file) => path.join(REVIEW_ROOT, "tools", file)),
  docsPacketPath,
]
  .filter((filePath) => fs.statSync(filePath).isFile())
  .sort((left, right) => relative(left).localeCompare(relative(right)));

const manifest = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_REVIEW_UNIT_MANIFEST",
  packetId: "SEM-003B3-SIMULATED-PLURALISTIC-EXPERT-REVIEW",
  version: "1.0.0",
  generatedAt: GENERATED_AT,
  status: "SIMULATED_CALIBRATION_REFERENCE_SET_READY",
  decision: "SEM003B3_SIMULATED_CALIBRATION_REFERENCE_SET_READY",
  counts: {
    reviewUnits: reviewUnits.length,
    priorityReviewSheets: priorityUnits.length,
    calibrationReviewUnits: calibrationUnits.length,
    equivalenceReviewUnits: developmentEquivalenceUnits.length,
    nonblockingDevelopmentUnits: reviewUnits.filter(
      (unit) => unit.priority === "NONBLOCKING_DEVELOPMENT_REFERENCE",
    ).length,
    originalReviewQueueItems: reviewQueue.items.length,
    simulatedReviewerPersonas: SIMULATED_REVIEW_RECORD.roles.length,
    simulatedDecisionsRecorded: simulatedDecisions.length,
    realHumanDecisionsRecorded: 0,
    calibrationVisible: calibrationUnits.length,
  },
  units: reviewUnits.map((unit) => ({
    reviewUnitId: unit.reviewUnitId,
    caseId: unit.caseId,
    candidateSet: unit.candidateSet,
    priority: unit.priority,
    reviewItemIds: unit.reviewItemIds,
    decisionRequirements: unit.decisionRequirements,
    reviewSheetPath: unit.humanSheetPath,
    simulatedReviewId: unit.simulatedReviewRecord,
  })),
  evaluator: {
    version: evaluatorIdentity.version,
    configurationDigest: evaluatorIdentity.configurationDigest,
    modified: false,
  },
  inventory: inventory.map((filePath) => ({
    path: relative(filePath),
    sha256: sha256File(filePath),
  })),
  exclusions: [
    "No real human decision record",
    "No formal independent qualification evidence",
    "No evaluator modification",
    "No SEM execution",
    "No LLM/provider call",
    "No threshold or N",
    "No blind set",
    "No PASS/FAIL qualification",
  ],
};
writeJson(path.join(artifactDir, "review-unit-manifest.json"), manifest);

console.log(
  JSON.stringify(
    {
      generated: true,
      reviewUnits: reviewUnits.length,
      priorityReviewSheets: priorityUnits.length,
      calibrationReviewUnits: calibrationUnits.length,
      equivalenceReviewUnits: developmentEquivalenceUnits.length,
      queueItemsLinked: reviewQueue.items.length,
      simulatedDecisionsRecorded: simulatedDecisions.length,
      calibrationVisible: calibrationUnits.length,
      packet: relative(docsPacketPath),
    },
    null,
    2,
  ),
);
