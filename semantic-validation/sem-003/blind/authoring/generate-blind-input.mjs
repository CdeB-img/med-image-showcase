import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CREATED_AT, blindCaseSpecs } from "./blind-authoring-source.mjs";

const AUTHORING_ROOT = path.dirname(fileURLToPath(import.meta.url));
const BLIND_ROOT = path.dirname(AUTHORING_ROOT);
const INPUT_CASES_ROOT = path.join(BLIND_ROOT, "input", "cases");
const REFERENCE_CASES_ROOT = path.join(BLIND_ROOT, "sealed-reference", "cases");

const writeJson = (target, value) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const clearJson = (directory) => {
  fs.mkdirSync(directory, { recursive: true });
  for (const entry of fs.readdirSync(directory)) {
    if (entry.endsWith(".json")) fs.rmSync(path.join(directory, entry));
  }
};

clearJson(INPUT_CASES_ROOT);
clearJson(REFERENCE_CASES_ROOT);

for (const spec of blindCaseSpecs) {
  const slug = spec.slug.toLowerCase();
  const caseId = `SEM3-BLIND-${spec.slug}`;
  const envelopeId = `SEM3-AE-BLIND-${spec.slug}`;
  const conversationTurns = spec.turns.map((text, index) => ({
    turnId: `turn-${index + 1}`,
    role: "USER",
    text,
  }));
  const sourceRequest = spec.turns
    .map((text, index) => `Tour ${index + 1}: ${text}`)
    .join("\n");

  writeJson(path.join(INPUT_CASES_ROOT, `${slug}.input.json`), {
    schemaVersion: "1.0.0",
    contractType: "SEM003C_BLIND_RUNTIME_INPUT",
    caseId,
    version: "1.0.0",
    language: "fr-FR",
    sourceRequest,
    conversationTurns,
  });

  writeJson(path.join(REFERENCE_CASES_ROOT, `${slug}.case.json`), {
    schemaVersion: "1.0.0",
    contractType: "SEM003C_BLIND_BENCHMARK_CASE",
    purpose: "BLIND_QUALIFICATION_AUTHORING",
    caseId,
    version: "1.0.0",
    title: spec.title,
    createdAt: CREATED_AT,
    authorRole: "CODEX_INDEPENDENT_BLIND_DOCUMENTARY_AUTHOR",
    reviewStatus: "SIMULATED_REFERENCE_REVIEW_PENDING",
    source: {
      sourceRequest,
      language: "fr-FR",
      conversationTurns,
      sourceContext: `Conversation synthétique indépendante de ${spec.domain}; aucun output SEM ou provider n'a été utilisé.`,
      provenance: {
        originType: "SYNTHETIC_AUTHORED",
        originalSource: "Original independent SEM-003C blind authoring; not translated, paraphrased, adapted or generated from SEM output.",
        author: "Codex acting as documentary blind benchmark author, not as human scientific reviewer",
        createdAt: CREATED_AT,
        inspirationRefs: [
          "docs/sem-002-scientific-understanding-competence-contract.md",
          "docs/sem-003-independent-scientific-understanding-benchmark-architecture.md",
        ],
      },
    },
    scientificScope: {
      domainGroup: spec.domainGroup,
      domain: spec.domain,
      scenarioCategory: spec.category,
      secondaryCategories: spec.secondaryCategories,
      difficultyTarget: spec.difficulty,
      intentionallyMissingInformation: spec.missing.map((description, index) => ({
        informationId: `missing-${index + 1}`,
        description,
        intentional: true,
      })),
    },
    exposure: {
      exposureStatus: "BLIND_DESIGN_ONLY",
      exposureHistory: [
        {
          eventId: `exposure-${slug}-authored`,
          fromStatus: null,
          toStatus: "BLIND_DESIGN_ONLY",
          occurredAt: CREATED_AT,
          actorRole: "CODEX_INDEPENDENT_BLIND_DOCUMENTARY_AUTHOR",
          reason: "Independent authoring before parentage review, reference review and sealing.",
        },
      ],
      parentageStatus: "REQUIRES_PARENTAGE_REVIEW",
      contaminationReview: {
        status: "NOT_REVIEWED",
        reviewedAt: null,
        reviewerRole: null,
        notes: "Parentage and contamination review must complete before sealing.",
      },
      eligibleForBlindQualification: false,
    },
    reference: {
      acceptanceEnvelopeId: envelopeId,
      applicableSEM002Properties: [...new Set(spec.properties)].sort(),
      adjudicationRequirements: [
        {
          expertise: "SCIENTIFIC_DOMAIN",
          rationale: "Review the scientific obligations without inventing human authority.",
          mandatory: true,
        },
        {
          expertise: "METHODOLOGICAL_SEM",
          rationale: "Review semantic equivalence, epistemic status, ownership and evaluability.",
          mandatory: true,
        },
        {
          expertise: "INDEPENDENT_ADJUDICATION",
          rationale: "Preserve unresolved limitations for future PD-011 review.",
          mandatory: true,
        },
      ],
    },
  });
}

console.log(`Generated ${blindCaseSpecs.length} BLIND_DESIGN_ONLY cases and runtime inputs.`);

