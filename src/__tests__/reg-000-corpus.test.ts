import { describe, expect, it } from "vitest";

import corpus from "../../regulatory-funding-corpus/reg-000/reg-000.corpus.json";
import schema from "../../regulatory-funding-corpus/reg-000/reg-000.schema.json";

const temporalStatuses = [
  "CURRENT",
  "UPCOMING",
  "SUPERSEDED",
  "ARCHIVED",
  "UNKNOWN_CURRENTNESS",
];

const normativeStrengths = [
  "LEGAL_MANDATORY",
  "REGULATORY_MANDATORY",
  "PROGRAM_MANDATORY",
  "CONDITIONAL_MANDATORY",
  "OFFICIAL_RECOMMENDATION",
  "METHODOLOGICAL_GUIDANCE",
  "REPORTING_GUIDANCE",
  "INFORMATIONAL_ONLY",
];

const documentQualificationStatuses = [
  "MANDATORY",
  "CONDITIONAL_MANDATORY",
  "RECOMMENDED",
  "OPTIONAL",
  "NOT_APPLICABLE",
  "PROHIBITED_IF_EXPLICIT",
  "UNKNOWN",
  "SUPERSEDED",
];

const requiredRequirementFields = [
  "identifier",
  "authority",
  "authorityType",
  "sourceType",
  "jurisdiction",
  "applicabilityBasis",
  "source",
  "version",
  "revision",
  "publishedAt",
  "effectiveFrom",
  "effectiveUntil",
  "verifiedAt",
  "sourceRevision",
  "programEdition",
  "supersedes",
  "supersededBy",
  "studyTypes",
  "fundingPrograms",
  "requiredDocuments",
  "requiredSections",
  "requiredFields",
  "requiredAnnexes",
  "submissionWorkflow",
  "deadlines",
  "constraints",
  "conditions",
  "references",
  "officialURL",
  "verificationDate",
] as const;

const requiredSourceTemporalFields = [
  "publishedAt",
  "effectiveFrom",
  "effectiveUntil",
  "verifiedAt",
  "sourceRevision",
  "programEdition",
  "supersedes",
  "supersededBy",
  "status",
] as const;

const officialSourceHosts = new Set([
  "www.legifrance.gouv.fr",
  "www.cnil.fr",
  "eur-lex.europa.eu",
  "health.ec.europa.eu",
  "www.ema.europa.eu",
  "sante.gouv.fr",
  "anr.fr",
  "database.ich.org",
  "www.consort-spirit.org",
  "www.equator-network.org",
  "www.prisma-statement.org",
  "clinicaltrials.gov",
  "grants.nih.gov",
  "red.ecrin.org",
]);

const byId = <T extends Record<string, unknown>>(
  values: T[],
  key: keyof T,
  id: string,
) => values.find((value) => value[key] === id);

describe("REG-000 governed regulatory and funding corpus", () => {
  it("conforms to the declared top-level schema contract", () => {
    expect(Object.keys(corpus).sort()).toEqual(Object.keys(schema.properties).sort());
    for (const field of schema.required) {
      expect(corpus).toHaveProperty(field);
      const value = corpus[field as keyof typeof corpus];
      if (Array.isArray(value)) expect(value.length).toBeGreaterThan(0);
      else expect(value).toBeTypeOf("object");
    }

    expect(corpus.corpus).toMatchObject({
      identifier: "REG-000",
      version: "1.0.0",
      documentLevel: "NIVEAU_2_CANDIDATE",
      admissionStatus: "CANDIDATE_NOT_ADMITTED",
      masterFormat: "JSON",
    });
  });

  it("keeps controlled vocabularies exact and complete", () => {
    expect(corpus.controlledVocabularies.temporalStatuses).toEqual(temporalStatuses);
    expect(corpus.controlledVocabularies.normativeStrengths).toEqual(normativeStrengths);
    expect(corpus.controlledVocabularies.documentQualificationStatuses).toEqual(
      documentQualificationStatuses,
    );
    expect(corpus.controlledVocabularies.unknownQualificationReason).toBe(
      "UNKNOWN_REQUIRES_QUALIFICATION",
    );
    expect(corpus.controlledVocabularies.ruleRelations).toEqual([
      "appliesIf",
      "doesNotApplyIf",
      "requires",
      "dependsOn",
      "conflictsWith",
      "supersedes",
      "jurisdiction",
      "effectivePeriod",
    ]);
    expect(corpus.controlledVocabularies.qualificationAxes).toEqual([
      "REGULATORY_FRAMEWORK",
      "SCIENTIFIC_DESIGN",
      "FUNDING_PROGRAM",
      "DATA_SOURCES",
      "PROJECT_NATURE",
    ]);
  });

  it("implements every minimum object type", () => {
    expect(corpus.objectCatalog.map((entry) => entry.type)).toEqual([
      "Authority",
      "RequirementProfile",
      "Requirement",
      "RequirementRevision",
      "RequirementCondition",
      "RequirementSource",
      "RequirementEvidence",
      "FundingProgram",
      "ProgramEdition",
      "SubmissionRequirement",
      "DocumentRequirement",
      "SectionRequirement",
      "FieldRequirement",
      "AnnexRequirement",
      "ApprovalRequirement",
      "ReviewRequirement",
      "ApplicabilityRule",
      "VerificationRecord",
    ]);
  });

  it("keeps every requirement complete and its references resolvable", () => {
    const authorityIds = new Set(corpus.authorities.map((entry) => entry.authorityId));
    const authorityTypes = new Map(
      corpus.authorities.map((entry) => [entry.authorityId, entry.authorityType]),
    );
    const sourceIds = new Set(corpus.requirementSources.map((entry) => entry.sourceId));
    const conditionIds = new Set(corpus.requirementConditions.map((entry) => entry.conditionId));
    const evidenceIds = new Set(corpus.requirementEvidence.map((entry) => entry.evidenceId));

    for (const requirement of corpus.requirements) {
      for (const field of requiredRequirementFields) expect(requirement).toHaveProperty(field);
      expect(authorityIds.has(requirement.authority)).toBe(true);
      expect(requirement.authorityType).toBe(authorityTypes.get(requirement.authority));
      expect(requirement.source.every((id) => sourceIds.has(id))).toBe(true);
      expect(requirement.conditions.every((id) => conditionIds.has(id))).toBe(true);
      expect(requirement.references.every((id) => evidenceIds.has(id))).toBe(true);
      expect(normativeStrengths).toContain(requirement.normativeStrength);
      expect(temporalStatuses).toContain(requirement.status);
    }
  });

  it("never labels a source CURRENT without dated primary-source verification", () => {
    for (const source of corpus.requirementSources) {
      for (const field of requiredSourceTemporalFields) expect(source.temporal).toHaveProperty(field);
      expect(normativeStrengths).toContain(source.normativeStrength);
      expect(temporalStatuses).toContain(source.temporal.status);
      expect(officialSourceHosts.has(new URL(source.officialURL).hostname)).toBe(true);
      expect(source.sourceType).not.toMatch(/BLOG|FORUM|LINKEDIN|CONSULTANCY|PERSONAL_SLIDE/);

      const verification = corpus.verificationRecords.find(
        (record) => record.sourceId === source.sourceId,
      );
      expect(verification).toBeDefined();
      expect(verification?.verifiedAt).toBe(source.temporal.verifiedAt);

      if (source.temporal.status === "CURRENT") {
        expect(verification?.outcome).toBe("VERIFIED_CURRENT");
        expect(verification?.checkedSignals).toContain("primaryAuthority");
        expect(verification?.checkedSignals).toContain("effectiveStatus");
      } else if (source.temporal.status === "ARCHIVED") {
        expect(verification?.outcome).toBe("VERIFIED_HISTORICAL_EDITION");
      }
    }
  });

  it("keeps methodological and reporting standards outside silent regulatory promotion", () => {
    const guidanceIds = [
      "REQ_ICH_E6_R3",
      "REQ_SPIRIT_2025",
      "REQ_CONSORT_2025",
      "REQ_STROBE",
      "REQ_RECORD",
      "REQ_TRIPOD",
      "REQ_STARD",
      "REQ_PRISMA_2020",
    ];

    for (const id of guidanceIds) {
      const requirement = byId(corpus.requirements, "identifier", id);
      expect(["METHODOLOGICAL_GUIDANCE", "REPORTING_GUIDANCE"]).toContain(
        requirement?.normativeStrength,
      );
      expect(requirement?.conditions).toContain("COND_NO_SILENT_NORMATIVE_PROMOTION");
    }
  });

  it("makes unknown document qualification explicit and non-engaging", () => {
    for (const documentRequirement of corpus.documentRequirements) {
      expect(documentQualificationStatuses).toContain(documentRequirement.qualificationStatus);
      if (documentRequirement.qualificationStatus === "UNKNOWN") {
        expect(documentRequirement.qualificationReasonCode).toBe(
          "UNKNOWN_REQUIRES_QUALIFICATION",
        );
      }
    }
  });

  it("defines five-axis applicability and every required rule relation", () => {
    const axes = corpus.controlledVocabularies.qualificationAxes;
    const relations = corpus.controlledVocabularies.ruleRelations;
    for (const rule of corpus.applicabilityRules) {
      expect(Object.keys(rule.axes).sort()).toEqual([...axes].sort());
      expect(Object.keys(rule.relations).sort()).toEqual([...relations].sort());
      expect(rule.unknownResult).toBe("UNKNOWN_REQUIRES_QUALIFICATION");
    }
  });

  it("answers whether PHRC requires a protocol without flattening the stage", () => {
    const query = byId(corpus.competencyQueries, "queryId", "CQ_PHRC_PROTOCOL");
    expect(query?.answer).toContain("sans dépôt de protocole");
    expect(query?.answer).toContain("obligatoire au stade 2");
    expect(query?.expectedRequirementIds).toEqual(["REQ_PHRC_STAGE1", "REQ_PHRC_STAGE2"]);

    const stage1 = byId(corpus.documentRequirements, "documentRequirementId", "DOCREQ_PHRC_STAGE1_PROTOCOL");
    const stage2 = byId(corpus.documentRequirements, "documentRequirementId", "DOCREQ_PHRC_STAGE2_PROTOCOL");
    expect(stage1?.qualificationStatus).toBe("NOT_APPLICABLE");
    expect(stage2?.qualificationStatus).toBe("MANDATORY");
  });

  it("answers the RHU annex query with the three verified V6 annexes", () => {
    const query = byId(corpus.competencyQueries, "queryId", "CQ_RHU_ANNEXES");
    expect(query?.expectedAnnexIds).toEqual([
      "ANNEX_RHU_CONCEPT",
      "ANNEX_RHU_METHODOLOGY",
      "ANNEX_RHU_IMPACT",
    ]);
    expect(query?.expectedSourceIds).toEqual(["SRC_ANR_RHU_V6_2023"]);
  });

  it("answers RIPH 1 versus RIPH 3 with CPP, protocol, ANSM and participation distinctions", () => {
    const query = byId(corpus.competencyQueries, "queryId", "CQ_RIPH1_VS_RIPH3");
    expect(query?.expectedRequirementIds).toEqual(
      expect.arrayContaining([
        "REQ_FR_CPP_OPINION",
        "REQ_FR_CPP_PROTOCOL",
        "REQ_FR_ANSM_RIPH1_AUTHORIZATION",
        "REQ_FR_RIPH_CONSENT_OR_OPPOSITION",
      ]),
    );
    expect(query?.answer).toContain("RIPH 1");
    expect(query?.answer).toContain("RIPH 3");
    expect(query?.provenanceRequired).toBe(true);
  });

  it.each([
    ["CQ_CNIL", ["REQ_CNIL_MR_ROUTE", "REQ_CNIL_MR_ANNEXES"]],
    ["CQ_ANSM", ["REQ_FR_ANSM_RIPH1_AUTHORIZATION", "REQ_EU_CTR_CTIS"]],
    ["CQ_CPP", ["REQ_FR_CPP_OPINION", "REQ_FR_CPP_PROTOCOL"]],
    ["CQ_DGOS", ["REQ_PHRC_STAGE1", "REQ_PHRC_STAGE2"]],
    [
      "CQ_STANDARDS_ONLY",
      [
        "REQ_ICH_E6_R3",
        "REQ_SPIRIT_2025",
        "REQ_CONSORT_2025",
        "REQ_STROBE",
        "REQ_RECORD",
        "REQ_TRIPOD",
        "REQ_STARD",
        "REQ_PRISMA_2020",
      ],
    ],
  ])("answers %s with resolvable requirement and source provenance", (queryId, expectedIds) => {
    const requirementIds = new Set(corpus.requirements.map((entry) => entry.identifier));
    const sourceIds = new Set(corpus.requirementSources.map((entry) => entry.sourceId));
    const query = byId(corpus.competencyQueries, "queryId", queryId as string);

    expect(query?.expectedRequirementIds).toEqual(expectedIds);
    expect(query?.expectedRequirementIds.every((id) => requirementIds.has(id))).toBe(true);
    expect(query?.expectedSourceIds.every((id) => sourceIds.has(id))).toBe(true);
    expect(query?.provenanceRequired).toBe(true);
  });
});
