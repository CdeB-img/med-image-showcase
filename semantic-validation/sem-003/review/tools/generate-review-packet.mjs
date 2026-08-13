import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOOLS_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REVIEW_ROOT = path.resolve(TOOLS_ROOT, "..");
const REPOSITORY_ROOT = path.resolve(REVIEW_ROOT, "../../..");
const CORPUS_ROOT = path.resolve(REVIEW_ROOT, "../corpus");
const EVALUATOR_ROOT = path.resolve(REVIEW_ROOT, "../evaluator");
const GENERATED_AT = "2026-08-13T19:05:53.000Z";

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
  "docs/sem-003b3-human-reference-review-packet.md",
);
for (const directory of [reviewUnitDir, decisionRecordDir, artifactDir]) {
  fs.mkdirSync(directory, { recursive: true });
}

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

const assistanceFlags = {
  "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY": [
    {
      code: "DOCUMENTARY_MODALITY_TERM_MISMATCH_TO_REVIEW",
      observation:
        "The source request names ovarian ultrasound while the current ambiguity description says MRI. This is an objective documentary inconsistency to adjudicate; no correction is applied in B3 packet preparation.",
      disposition: "OPEN_HUMAN_REVIEW_POINT",
    },
  ],
};

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
      contractType: "SEM003B3_HUMAN_REVIEW_UNIT",
      reviewUnitId: unitIdForCase(benchmarkCase.caseId),
      caseId: benchmarkCase.caseId,
      candidateSet:
        benchmarkCase.purpose === "CALIBRATION_AUTHORING" ? "CALIBRATION" : "DEVELOPMENT",
      priority,
      state: "HUMAN_REVIEW_REQUIRED",
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
      assistanceFlags: assistanceFlags[benchmarkCase.caseId] || [],
      humanSheetPath,
      equivalencePair: equivalenceRow ? loadEquivalencePair(equivalenceRow) : null,
      humanDecisionRecords: [],
      limits: [
        "Codex prepared this unit but is not the human reviewer.",
        "No scientific, methodological, ambiguity, parentage, equivalence or admission decision is inferred.",
        "All parentage comparisons are REVIEW_ASSISTANCE_ONLY.",
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

**Statut :** \`HUMAN_REVIEW_REQUIRED\`

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

## Open review points

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

## Decision form

${renderDecisionForm(unit)}

${unit.candidateSet === "CALIBRATION" ? `**Recommended disposition — à renseigner par l’humain :**

\`CALIBRATION_VISIBLE\` / \`REJECTED\` / \`NEEDS_SPECIALIST_REVIEW\`

**Impact d’exposition :** état courant \`${unit.exposureImpact.currentStatus}\` ; aucune décision isolée ne promeut le cas ; le blind reste inéligible.` : `**Impact d’exposition :** \`${unit.exposureImpact.acceptedAfterAllApplicableGates}\` ; aucune promotion Calibration ou blind n’est possible depuis cette fiche.`}

## Règles de preuve

- Au moins trois évaluateurs indépendants doivent établir une référence experte critique conformément à PD-011.
- Codex n’est pas reviewer humain et n’enregistre aucune décision dans cette phase.
- Toute révision doit préciser le delta ; toute décision incomplète reste ouverte.
- La décision structurée future doit respecter \`semantic-validation/sem-003/review/contracts/human-decision-record.schema.json\`.
`;
};

const priorityUnits = reviewUnits.filter(
  (unit) => unit.priority !== "NONBLOCKING_DEVELOPMENT_REFERENCE",
);
for (const unit of priorityUnits) {
  fs.writeFileSync(path.join(REPOSITORY_ROOT, unit.humanSheetPath), renderUnitMarkdown(unit));
}

const decisionsTable = priorityUnits.flatMap((unit) =>
  unit.decisionRequirements.map((reviewType) => ({
    reviewUnitId: unit.reviewUnitId,
    caseId: unit.caseId,
    candidateSet: unit.candidateSet,
    reviewType,
    status: "OPEN",
    humanDecisionId: null,
  })),
);

const reviewProgress = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_REVIEW_PROGRESS",
  generatedAt: GENERATED_AT,
  sourceQueueId: reviewQueue.queueId,
  sourceQueueVersion: reviewQueue.version,
  counts: {
    originalReviewQueueItems: reviewQueue.items.length,
    open: reviewQueue.items.length,
    resolved: 0,
    deferred: 0,
    rejected: 0,
    superseded: 0,
    humanDecisionsRecorded: 0,
    openEquivalenceAdjudications: equivalenceRows.length,
  },
  items: reviewQueue.items.map((item) => ({
    reviewId: item.reviewId,
    caseId: item.caseId,
    reviewType: item.reviewType,
    priority: item.priority,
    status: "OPEN",
    reviewUnitId: unitIdForCase(item.caseId),
    decisionId: null,
  })),
  note: "No original Review Queue item is deleted, closed or deferred during packet preparation.",
};

const calibrationGateStatus = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_CALIBRATION_GATE_STATUS",
  generatedAt: GENERATED_AT,
  status: "HUMAN_REVIEW_REQUIRED",
  candidatesInitial: calibration.cases.length,
  admitted: 0,
  designOnly: calibration.cases.length,
  rejected: 0,
  specialistReview: 0,
  calibrationVisible: 0,
  cases: reviewUnits
    .filter((unit) => unit.candidateSet === "CALIBRATION")
    .map((unit) => ({
      caseId: unit.caseId,
      reviewUnitId: unit.reviewUnitId,
      status: "HUMAN_REVIEW_REQUIRED",
      exposureStatus: "DESIGN_ONLY",
      promotionApplied: false,
      eligibleForCalibration: false,
      eligibleForBlindQualification: false,
      requiredDecisionTypes: unit.decisionRequirements,
      recommendedReviewerCompetencies: unit.adjudicationRequirements
        .filter((entry) => entry.mandatory)
        .map((entry) => entry.expertise),
      unmetGates: [
        "PLURALISTIC_SCIENTIFIC_REFERENCE_REVIEW_REQUIRED",
        ...(unit.reviewTypes.includes("METHODOLOGICAL_REVIEW_REQUIRED")
          ? ["METHODOLOGICAL_REVIEW_REQUIRED"]
          : []),
        ...(unit.reviewTypes.includes("AMBIGUITY_ADJUDICATION_REQUIRED")
          ? ["AMBIGUITY_DISPOSITION_REQUIRED"]
          : []),
        "PARENTAGE_REVIEW_REQUIRED",
        "CONTAMINATION_REVIEW_REQUIRED",
        "CALIBRATION_APPROVAL_REQUIRED",
        "REVIEWER_CONFLICT_INFORMATION_REQUIRED",
      ],
    })),
  calibrationPerformed: false,
  metricsComputed: false,
  thresholdsFixed: false,
  nFixed: false,
};

const equivalenceReviewStatus = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_EQUIVALENCE_REVIEW_STATUS",
  generatedAt: GENERATED_AT,
  resolved: 0,
  open: equivalenceRows.length,
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
      status: "ADJUDICATION_REQUIRED",
      humanDecisionId: null,
    })),
  rule: "Level 1 PASS does not establish semantic equivalence.",
};

const versionRegistry = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_REFERENCE_VERSION_REGISTRY",
  generatedAt: GENERATED_AT,
  references: cases
    .map((benchmarkCase) => {
      const envelope = envelopeByCaseId.get(benchmarkCase.caseId);
      const registryEntry = registryByCaseId.get(benchmarkCase.caseId);
      return {
        caseId: benchmarkCase.caseId,
        currentCaseVersion: benchmarkCase.version,
        currentEnvelopeVersion: envelope.version,
        caseSha256: registryEntry.digests.caseSha256,
        envelopeSha256: registryEntry.digests.acceptanceEnvelopeSha256,
        pairSha256: registryEntry.digests.pairSha256,
        previousVersions: [],
        resultingVersions: [],
        humanDecisionIds: [],
        modifiedInB3PacketPreparation: false,
      };
    })
    .sort((left, right) => left.caseId.localeCompare(right.caseId)),
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
  `# SEM-003B3 Human Decision Records\n\nNo human decision is recorded in the packet-preparation phase.\n\nA future record belongs here only after a real reviewer has supplied the decision, rationale, competence, scope, date and conflict declaration. It must validate against \`../contracts/human-decision-record.schema.json\`. A draft or template must never be placed in this directory as if it were evidence.\n`,
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

**Points ouverts**

${bulletList(unit.openReviewPoints, (entry) => `\`${entry.reviewType}\` — ${entry.subject}`)}
${unit.assistanceFlags.length ? `\n${bulletList(unit.assistanceFlags, (entry) => `**À arbitrer :** ${entry.observation}`)}\n` : ""}
**Parenté — assistance only**

- Development à comparer : ${parentageLines.join(" ; ") || "sans objet"}.
- Conclusion humaine : requise. L’audit B1 ciblé H01–H30 ne vaut pas indépendance humaine.

**Décisions à fournir :** ${unit.decisionRequirements.map((entry) => `\`${entry}\``).join(" ; ")}.

Fiche détaillée : \`${unit.humanSheetPath}\`.
`;
};

const calibrationUnits = priorityUnits.filter((unit) => unit.candidateSet === "CALIBRATION");
const developmentEquivalenceUnits = priorityUnits.filter(
  (unit) => unit.priority === "DEVELOPMENT_EQUIVALENCE",
);

const packet = `# SEM-003B3 — Human Reference Review Packet

| Champ | Valeur |
|---|---|
| Statut | \`HUMAN_REVIEW_REQUIRED\` |
| Nature | Dossier humain de niveau 3, sans autorité scientifique autonome |
| Baseline | SEM-003B1 corpus 1.0.0 ; évaluateur SEM-003 v${evaluatorIdentity.version} |
| Evaluator digest | \`${evaluatorIdentity.configurationDigest}\` |
| Review Units | ${reviewUnits.length} total ; ${priorityUnits.length} prioritaires |
| Décisions humaines enregistrées | 0 |
| Calibration visible | 0 |
| Date de préparation | 13 août 2026 |

## A. Instructions de revue

Le reviewer doit répondre à deux questions : « Est-ce bien ce que cette conversation signifie scientifiquement ? » et « L’espace des réponses acceptables est-il correctement défini ? » Il ne valide ni JSON, ni performance de SEM.

Pour chaque cas, examiner séparément \`REQUIRED\`, \`PROHIBITED\`, \`OPTIONAL_RELEVANT\`, ambiguïtés, clarification, ownership et parenté. Une décision \`ACCEPT_WITH_REVISION\` doit décrire le delta exact. Une compétence insuffisante conduit à \`NEEDS_SPECIALIST_REVIEW\`, jamais à une approbation forcée.

PD-011 impose au moins trois évaluateurs indépendants couvrant les compétences pertinentes pour établir une référence experte critique. Chaque reviewer conserve un identifiant stable, son rôle, ses compétences, sa déclaration de conflit, sa rationale et sa date. Codex n’est pas reviewer humain.

## B. Vue synthétique des dix candidats Calibration

| Case | Domaine | Difficulté | Revues ouvertes | Parenté | Exposition |
|---|---|---|---:|---|---|
${calibrationUnits.map((unit) => `| \`${unit.caseId}\` | ${unit.identity.domain} | \`${unit.identity.difficulty}\` | ${unit.reviewItemIds.length} | \`PARENTAGE_REVIEW_REQUIRED\` | \`DESIGN_ONLY\` |`).join("\n")}

## C. Review Units Calibration

${calibrationUnits.map(renderCompactUnit).join("\n\n---\n\n")}

## D. Cinq équivalences Development

Ces paires ont toutes obtenu Level 1 vert sur le même vecteur critique. Cela ne constitue aucune équivalence humaine. Comparer explicitement obligations, relations, polarité, timing, provenance, unknowns, ambiguïtés, ownership et conséquences scientifiques.

${developmentEquivalenceUnits.map((unit) => `${renderCompactUnit(unit)}\n\n${renderEquivalence(unit)}`).join("\n\n---\n\n")}

## E. Décisions transversales

- Panel : au moins trois évaluateurs indépendants pour toute référence critique.
- Conflits : aucune indépendance organisationnelle n’est présumée ; une déclaration est obligatoire.
- Parenté : les comparaisons calculées ne sont que \`REVIEW_ASSISTANCE_ONLY\`.
- Versionnement : toute révision crée une nouvelle version et conserve l’ancienne avec lineage et digest.
- Calibration : aucune sortie d’évaluateur ne doit être présentée aux reviewers des candidats Calibration.

## F. Table consolidée des décisions

| Review Unit | Case | Set | Décision requise | État |
|---|---|---|---|---|
${decisionsTable.map((entry) => `| \`${entry.reviewUnitId}\` | \`${entry.caseId}\` | ${entry.candidateSet} | \`${entry.reviewType}\` | \`OPEN\` |`).join("\n")}

Les formulaires détaillés sont intégrés à chaque fiche sous \`semantic-validation/sem-003/review/review-units/\`. Le contrat d’import machine se trouve sous \`semantic-validation/sem-003/review/contracts/\` et son template sous \`semantic-validation/sem-003/review/artifacts/human-decision-import-template.json\`.

## G. Conséquences des décisions

- \`ACCEPT\` documente une revue ; il ne suffit pas seul à satisfaire le panel PD-011.
- \`ACCEPT_WITH_REVISION\` exige une révision bornée, une nouvelle version, un lineage et de nouveaux digests.
- \`REJECT\` conserve l’historique et exclut le cas ; aucun remplaçant n’est créé automatiquement.
- \`NEEDS_SPECIALIST_REVIEW\` ou une ambiguïté/parenté non résolue maintient le cas \`DESIGN_ONLY\`.
- Une admission Calibration exige toutes les gates applicables et reste distincte d’une calibration, d’une qualification ou d’un PASS.

## H. Éléments restant ouverts

- 62/62 items de la Review Queue sont \`OPEN\` ; 0 résolu, 0 différé, 0 rejeté.
- 10/10 candidats Calibration restent \`DESIGN_ONLY\`.
- 5/5 équivalences Development restent \`ADJUDICATION_REQUIRED\`.
- 0 décision humaine est enregistrée.
- L’incohérence « échographie ovarienne » / « IRM » est exposée au reviewer, sans correction.
- Les 10 autres unités Development restent ouvertes et non bloquantes ; elles sont présentes dans le manifeste machine mais ne sont pas reproduites ici.

## Formulaire minimal de reprise

Pour chaque reviewer et type de revue :

1. sélectionner exactement une disposition dans la fiche ;
2. fournir rationale, rôle, compétences, identifiant reviewer stable, date et conflit ;
3. préciser tout delta si révision ;
4. convertir la décision dans le contrat machine ;
5. relancer SEM-003B3 pour validation et application déterministe.

**STOP :** aucune décision, promotion, calibration, exécution SEM, sortie provider ou création blind n’appartient à cette phase.
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
  packetId: "SEM-003B3-HUMAN-REFERENCE-REVIEW-PACKET",
  version: "1.0.0",
  generatedAt: GENERATED_AT,
  status: "HUMAN_REVIEW_REQUIRED",
  decision: "SEM003B3_HUMAN_REVIEW_PACKET_READY_DECISIONS_REQUIRED",
  counts: {
    reviewUnits: reviewUnits.length,
    priorityHumanSheets: priorityUnits.length,
    calibrationReviewUnits: calibrationUnits.length,
    equivalenceReviewUnits: developmentEquivalenceUnits.length,
    nonblockingDevelopmentUnits: reviewUnits.filter(
      (unit) => unit.priority === "NONBLOCKING_DEVELOPMENT_REFERENCE",
    ).length,
    originalReviewQueueItems: reviewQueue.items.length,
    humanDecisionsRecorded: 0,
  },
  units: reviewUnits.map((unit) => ({
    reviewUnitId: unit.reviewUnitId,
    caseId: unit.caseId,
    candidateSet: unit.candidateSet,
    priority: unit.priority,
    reviewItemIds: unit.reviewItemIds,
    decisionRequirements: unit.decisionRequirements,
    humanSheetPath: unit.humanSheetPath,
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
    "No human decision record",
    "No Calibration promotion",
    "No Calibration Reference Set manifest",
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
      priorityHumanSheets: priorityUnits.length,
      calibrationReviewUnits: calibrationUnits.length,
      equivalenceReviewUnits: developmentEquivalenceUnits.length,
      queueItemsLinked: reviewQueue.items.length,
      humanDecisionsRecorded: 0,
      packet: relative(docsPacketPath),
    },
    null,
    2,
  ),
);
