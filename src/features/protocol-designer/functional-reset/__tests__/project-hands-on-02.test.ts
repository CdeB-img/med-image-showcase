import { describe, expect, it } from "vitest";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  PERSISTENT_PROJECT_OBJECT_TYPES,
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
  type PersistentProjectRelation,
  type PersistentTemporalQualification,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  validateHumanReviewProjectionCoverage,
} from "@/features/research-project-construction";
import { projectDocumentSourceFromFunctionalProject } from "@/features/document-projection";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import type { PersistentExtractionProviderArtifact, PersistentProjectDeltaCandidate } from "@/features/protocol-designer/product-bridge";
import c1IndependentEvidence from "../../../../../validation/project-hands-on-02r1/c1-independent-provider-evidence.json";
import c2ExplicitObjectiveEvidence from "../../../../../validation/project-hands-on-02r1/c2-explicit-objective-provider-evidence.json";

const RAW = "Le traitement étudié sera comparé au contrôle. L'objectif est d'évaluer sa disparition complète. Une acquisition CT aura lieu avant le traitement, puis le CT et l'IRM seront réalisés dans les trois mois. Le CT quantifiera l'évolution de la présence et l'IRM caractérisera la composition.";

const authority = {
  actorRef: "hands-on-02:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const change = (
  candidateRef: string,
  proposedType: PersistentProjectDeltaChange["proposedType"],
  content: string,
  studyRole: PersistentProjectDeltaChange["studyRole"] = null,
): PersistentProjectDeltaChange => ({
  operation: "ADD",
  sourceText: RAW,
  targetProjectRef: null,
  candidateRef,
  semanticIdentity: candidateRef,
  proposedType,
  content,
  polarity: "AFFIRMED",
  studyRole,
  epistemicStatus: "EXPLICIT_USER_STATED",
  assertionKind: "USER_STATED",
  proposalSourceText: null,
  evidenceRefs: [],
});

const relation = (
  relationRef: string,
  relationType: string,
  sourceObjectRef: string,
  targetObjectRef: string,
): PersistentProjectRelation => ({
  relationRef,
  sourceText: RAW,
  relationType,
  sourceObjectRef,
  targetObjectRef,
  polarity: "AFFIRMED",
  epistemicStatus: "EXPLICIT_USER_STATED",
  assertionKind: "USER_STATED",
  proposalSourceText: null,
  evidenceRefs: [],
});

const temporal = (
  qualificationId: string,
  subjectProjectRef: string,
  anchor: PersistentTemporalQualification["anchor"],
): PersistentTemporalQualification => ({
  operation: "ADD",
  qualificationId,
  sourceText: RAW,
  subjectProjectRef,
  temporalRole: "ACQUISITION_TIME",
  anchor,
  assertionKind: "USER_STATED",
  proposalSourceText: null,
  evidenceRefs: [],
});

const conversation: ScientificInterpretationConversation = {
  conversationId: "conversation:hands-on-02",
  language: "fr",
  turns: [{ turnId: "turn:hands-on-02", role: "USER", content: RAW, createdAt: "2026-08-24T10:00:00.000Z" }],
};

const candidate = {
  changes: [
    change("objective:efficacy", "OBJECTIVE", "Évaluer l'efficacité sur la disparition complète"),
    change("endpoint:disappearance", "ENDPOINT", "Disparition complète, définition opérationnelle à préciser"),
    change("intervention:treatment", "INTERVENTION", "Traitement étudié", "INTERVENTION_ARM"),
    change("comparator:control", "COMPARATOR", "Contrôle", "COMPARATOR_ARM"),
    change("modality:ct", "IMAGING_MODALITY", "CT"),
    change("modality:mri", "IMAGING_MODALITY", "IRM"),
    change("acquisition:ct", "ACQUISITION", "Acquisition CT"),
    change("acquisition:mri", "ACQUISITION", "Acquisition IRM"),
    change("data-need:quantification", "DATA_NEED", "Quantification de l'évolution de la présence"),
    change("data-need:composition", "DATA_NEED", "Caractérisation de la composition"),
  ],
  relations: [
    relation("relation:arms", "COMPARES_WITH", "intervention:treatment", "comparator:control"),
    relation("relation:ct-purpose", "OPERATIONALIZES", "acquisition:ct", "data-need:quantification"),
    relation("relation:mri-purpose", "OPERATIONALIZES", "acquisition:mri", "data-need:composition"),
  ],
  temporalQualifications: [
    temporal("timing:ct-baseline", "acquisition:ct", {
      kind: "RELATIVE_EVENT",
      direction: "BEFORE",
      unit: "DAY",
      offset: null,
      lowerBound: null,
      upperBound: null,
      relativeEventLabel: "traitement",
      tolerance: null,
      reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
    }),
    temporal("timing:ct-follow-up", "acquisition:ct", {
      kind: "WINDOW",
      direction: "AFTER",
      unit: "MONTH",
      offset: null,
      lowerBound: 0,
      upperBound: 3,
      relativeEventLabel: "traitement",
      tolerance: null,
      reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
    }),
    temporal("timing:mri-follow-up", "acquisition:mri", {
      kind: "WINDOW",
      direction: "AFTER",
      unit: "MONTH",
      offset: null,
      lowerBound: 0,
      upperBound: 3,
      relativeEventLabel: "traitement",
      tolerance: null,
      reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
    }),
  ],
  expectedVariableOccasions: [],
};

describe("PROJECT-HANDS-ON-02 — Project fidelity contract", () => {
  it("G01–G08 adjudicates C1 by explicit semantic obligations and preserves M3 without requiring OBJECTIVE", () => {
    const requiredC1Obligations = ["INTERVENTION", "COMPARATOR", "COMPARES_WITH", "PLAQUE_REDUCTION", "MRI", "M3"];
    expect(requiredC1Obligations).not.toContain("OBJECTIVE");

    const artifact = c1IndependentEvidence.extraction.providerArtifact as PersistentExtractionProviderArtifact;
    const raw = c1IndependentEvidence.rawUserTurn;
    expect(JSON.stringify(artifact.structuredArgsExact)).toBe(artifact.structuredArgsSerialized);
    const c1Conversation: ScientificInterpretationConversation = {
      conversationId: "project-hands-on-02r1:c1-independent-diagnostic",
      language: "fr",
      turns: [{ turnId: artifact.requestTurnRef, role: "USER", content: raw }],
    };
    const checked = validatePersistentProjectDelta(artifact.structuredArgsExact, raw, null, c1Conversation);

    expect(checked.wireCandidate?.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ proposedType: "INTERVENTION", content: "médicament" }),
      expect.objectContaining({ proposedType: "COMPARATOR", content: "placebo" }),
      expect.objectContaining({ proposedType: "IMAGING_MODALITY", content: "IRM" }),
      expect.objectContaining({ content: "réduction des plaques carotiennes" }),
    ]));
    expect(checked.wireCandidate?.relations).toEqual([
      expect.objectContaining({ relationType: "COMPARES_WITH", sourceObjectRef: "cand_intervention_01", targetObjectRef: "cand_comparator_01" }),
    ]);
    expect(checked.validation).toMatchObject({
      valid: true,
      blocks: [],
      normalizations: [{
        code: "IMAGING_MODALITY_TEMPORAL_SUBJECT_NORMALIZED_TO_ACQUISITION",
        sourceCandidateRef: "cand_imaging_01",
        fromObjectType: "IMAGING_MODALITY",
        toObjectType: "ACQUISITION",
        reason: "ACQUISITION_TIME_SUBJECT",
      }],
      acceptedTemporalQualifications: [expect.objectContaining({
        sourceText: "M3",
        subjectProjectRef: "cand_imaging_01",
        temporalRole: "ACQUISITION_TIME",
        anchor: expect.objectContaining({
          kind: "TIMEPOINT",
          unit: "MONTH",
          offset: 3,
          reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
        }),
      })],
    });
    expect(checked.candidate?.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ candidateRef: "cand_imaging_01", proposedType: "ACQUISITION", content: "IRM" }),
    ]));

    const contribution = contributionFromPersistentDelta({
      candidate: checked.candidate!,
      conversation: c1Conversation,
      currentProject: null,
      providerArtifact: artifact,
    })!;
    const prepared = prepareResearchProjectContributionCandidate(contribution, null);
    expect(prepared).toMatchObject({
      status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
      projectWriteAuthorized: false,
      humanReviewProjection: { status: "COMPLETE", missingChangeRefs: [] },
    });
    const reviewText = prepared.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content)).join("\n");
    expect(reviewText).toContain("médicament");
    expect(reviewText).toContain("placebo");
    expect(reviewText).toContain("comparaison avec");
    expect(reviewText).not.toContain("COMPARES_WITH");
    expect(reviewText).toContain("réduction des plaques carotiennes");
    expect(reviewText).toContain("IRM");
    expect(reviewText).toContain("M3");
    expect(reviewText).not.toContain("PRIMARY_ENDPOINT");
    expect(reviewText).not.toContain("démontrer l'efficacité");
  });

  it("G09–G10/G15 preserves C2 explicit objective without endpoint promotion and exposes its complete meaning in review", () => {
    const c1Artifact = c1IndependentEvidence.extraction.providerArtifact as PersistentExtractionProviderArtifact;
    const c1Conversation: ScientificInterpretationConversation = {
      conversationId: "project-hands-on-02r1:live-gate",
      language: "fr",
      turns: [{ turnId: c1Artifact.requestTurnRef, role: "USER", content: c1IndependentEvidence.rawUserTurn }],
    };
    const c1Checked = validatePersistentProjectDelta(c1Artifact.structuredArgsExact, c1IndependentEvidence.rawUserTurn, null, c1Conversation);
    const c1Contribution = contributionFromPersistentDelta({
      candidate: c1Checked.candidate!,
      conversation: c1Conversation,
      currentProject: null,
      providerArtifact: c1Artifact,
    })!;
    const c1Prepared = prepareResearchProjectContributionCandidate(c1Contribution, null);
    const projectV1 = confirmResearchProjectContribution({
      contribution: c1Contribution,
      current: null,
      projectId: "project:project-hands-on-02r1-live",
      authority,
      confirmedAt: "2026-08-24T09:30:00.000Z",
      reviewedProjection: c1Prepared.humanReviewProjection,
    });

    const artifact = c2ExplicitObjectiveEvidence.extraction.providerArtifact as PersistentExtractionProviderArtifact;
    expect(JSON.stringify(artifact.structuredArgsExact)).toBe(artifact.structuredArgsSerialized);
    expect((artifact.structuredArgsExact as PersistentProjectDeltaCandidate).changes).toEqual([
      expect.objectContaining({
        proposedType: "OBJECTIVE",
        content: "disparition totale de la plaque",
        sourceText: "démontrer l'efficacité du traitement sur la disparition totale de la plaque",
        studyRole: null,
      }),
    ]);
    const c2Conversation: ScientificInterpretationConversation = {
      conversationId: "project-hands-on-02r1:live-gate",
      language: "fr",
      turns: [
        ...c1Conversation.turns,
        { turnId: "project-hands-on-02r1:c1:noxia", role: "NOXIA", content: c1IndependentEvidence.conversation.assistantReply },
        { turnId: artifact.requestTurnRef, role: "USER", content: c2ExplicitObjectiveEvidence.rawUserTurn },
      ],
    };
    const checked = validatePersistentProjectDelta(artifact.structuredArgsExact, c2ExplicitObjectiveEvidence.rawUserTurn, projectV1, c2Conversation);
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    const contribution = contributionFromPersistentDelta({
      candidate: checked.candidate!,
      conversation: c2Conversation,
      currentProject: projectV1,
      providerArtifact: artifact,
    })!;
    const prepared = prepareResearchProjectContributionCandidate(contribution, projectV1);
    expect(prepared).toMatchObject({
      status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION",
      humanReviewProjection: { status: "COMPLETE", missingChangeRefs: [] },
    });
    expect(prepared.canonicalChangeSet.objectChanges).toEqual([
      expect.objectContaining({
        candidate: expect.objectContaining({
          objectType: "OBJECTIVE",
          scientificRole: null,
          provenance: expect.objectContaining({
            sourceText: "démontrer l'efficacité du traitement sur la disparition totale de la plaque",
          }),
        }),
      }),
    ]);
    const reviewText = prepared.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content)).join("\n");
    expect(reviewText.toLocaleLowerCase("fr-FR")).toContain("démontrer l'efficacité du traitement sur la disparition totale de la plaque");
    expect(reviewText).not.toContain("PRIMARY_ENDPOINT");

    const projectV2 = confirmResearchProjectContribution({
      contribution,
      current: projectV1,
      projectId: projectV1.projectId,
      authority,
      confirmedAt: "2026-08-24T09:36:00.000Z",
      reviewedProjection: prepared.humanReviewProjection,
    });
    expect(projectV2).toMatchObject({ revision: 2, previousVersionId: projectV1.versionId });
    expect(projectV2.canonicalState?.objects).toEqual(expect.arrayContaining([
      expect.objectContaining({
        objectType: "OBJECTIVE",
        content: "disparition totale de la plaque",
        scientificRole: null,
        provenance: expect.objectContaining({ sourcePlan: "USER", sourceText: expect.stringContaining("efficacité du traitement") }),
      }),
    ]));
  });

  it("F01–F09/F17 preserves multi-object meaning, typed relations and same-turn temporal qualifications", () => {
    const checked = validatePersistentProjectDelta(candidate, RAW, null, conversation);
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.validation.acceptedChanges).toHaveLength(10);
    expect(checked.validation.acceptedRelations).toHaveLength(3);
    expect(checked.validation.acceptedTemporalQualifications).toHaveLength(3);

    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation, currentProject: null })!;
    const projectCandidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(projectCandidate).toMatchObject({ projectWriteAuthorized: false, status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION" });
    expect(projectCandidate.humanReviewProjection).toMatchObject({
      status: "COMPLETE",
      missingChangeRefs: [],
      unexpectedChangeRefs: [],
      duplicateChangeRefs: [],
    });
    expect(projectCandidate.humanReviewProjection.coveredChangeRefs).toHaveLength(16);
    expect(projectCandidate.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.changeKind))).toEqual(expect.arrayContaining([
      "OBJECT",
      "RELATION",
      "TEMPORAL_QUALIFICATION",
    ]));
    expect(projectCandidate.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content))).toEqual(expect.arrayContaining([
      expect.stringContaining("comparaison avec"),
      expect.stringContaining("met en œuvre"),
      expect.stringContaining("avant traitement"),
      expect.stringContaining("Acquisition IRM"),
    ]));
    expect(projectCandidate.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content)).join("\n"))
      .not.toMatch(/COMPARES_WITH|OPERATIONALIZES/);
    expect(projectCandidate.canonicalChangeSet).toMatchObject({
      status: "READY_FOR_HUMAN_DECISION",
      relationChanges: expect.arrayContaining([
        expect.objectContaining({ candidate: expect.objectContaining({ relationType: "COMPARES_WITH" }) }),
        expect.objectContaining({ candidate: expect.objectContaining({ relationType: "OPERATIONALIZES" }) }),
      ]),
      temporalQualificationChanges: expect.arrayContaining([
        expect.objectContaining({ candidate: expect.objectContaining({ subjectProjectRef: "acquisition:ct", temporalRole: "ACQUISITION_TIME", anchor: expect.objectContaining({ direction: "BEFORE", reference: expect.objectContaining({ status: "UNKNOWN" }) }) }) }),
        expect.objectContaining({ candidate: expect.objectContaining({ subjectProjectRef: "acquisition:mri", anchor: expect.objectContaining({ upperBound: 3, unit: "MONTH" }) }) }),
      ]),
    });

    const project = confirmResearchProjectContribution({
      contribution,
      current: null,
      projectId: "project:hands-on-02",
      authority,
      confirmedAt: "2026-08-24T10:01:00.000Z",
    });
    const objects = project.canonicalState!.objects.filter((item) => item.actuality === "CURRENT");
    expect(objects).toEqual(expect.arrayContaining([
      expect.objectContaining({ objectType: "OBJECTIVE" }),
      expect.objectContaining({ objectType: "ENDPOINT" }),
      expect.objectContaining({ objectType: "INTERVENTION_OR_EXPOSURE" }),
      expect.objectContaining({ objectType: "GROUP", content: "Contrôle" }),
      expect.objectContaining({ objectType: "IMAGING_MODALITY", content: "CT" }),
      expect.objectContaining({ objectType: "IMAGING_MODALITY", content: "IRM" }),
      expect.objectContaining({ objectType: "ACQUISITION", content: "Acquisition CT" }),
      expect.objectContaining({ objectType: "ACQUISITION", content: "Acquisition IRM" }),
      expect.objectContaining({ objectType: "DATA_NEED", content: expect.stringContaining("Quantification") }),
    ]));
    expect(project.canonicalState!.relations.filter((item) => item.actuality === "CURRENT")).toHaveLength(3);
    expect(project.canonicalState!.temporalQualifications.filter((item) => item.actuality === "CURRENT")).toHaveLength(3);
    expect(project.sections.find((section) => section.sectionId === "QUESTION")?.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceProposedType: "OBJECTIVE", content: expect.stringContaining("efficacité") }),
    ]));
    expect(project.sections.find((section) => section.sectionId === "IMAGING")?.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceProposedType: "ACQUISITION", content: "Acquisition CT" }),
      expect.objectContaining({ sourceProposedType: "ACQUISITION", content: "Acquisition IRM" }),
    ]));
    expect(project.sections.find((section) => section.sectionId === "TEMPORALITY")?.elements).toHaveLength(3);
    expect(project.confirmationDecision).toMatchObject({ status: "ADOPTED", mandate: "PROJECT_OWNER" });
    expect(project.llmProjectWrites).toBe(0);

    const documentSource = projectDocumentSourceFromFunctionalProject(project, project.confirmationDecision);
    expect(documentSource.groups).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: "EXPOSURE", label: "Traitement étudié" }),
      expect.objectContaining({ role: "COMPARATOR", label: "Contrôle" }),
    ]));
    expect(documentSource.comparators).toHaveLength(1);
    expect(documentSource.imagingContribution.acquisitionRefs).toEqual(expect.arrayContaining([
      "CT",
      "IRM",
      "Acquisition CT",
      "Acquisition IRM",
    ]));
    expect(documentSource.visits.map((visit) => visit.timingValue)).toEqual(expect.arrayContaining([
      expect.stringContaining("avant traitement"),
      expect.stringContaining("MONTH"),
    ]));
    expect(documentSource.provenance.sourceRefs).not.toContain(RAW);
    expect(JSON.stringify(documentSource)).not.toContain("pizza");
  });

  it("F10 keeps a noise-only turn outside Project truth", () => {
    const raw = "Je voudrais que pizza arrive dans dix minutes.";
    const checked = validatePersistentProjectDelta({ changes: [], relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, raw, null, {
      conversationId: "conversation:noise",
      language: "fr",
      turns: [{ turnId: "turn:noise", role: "USER", content: raw }],
    });
    expect(checked.validation).toMatchObject({ valid: true, acceptedChanges: [], acceptedRelations: [], acceptedTemporalQualifications: [] });
    expect(contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: { conversationId: "conversation:noise", language: "fr", turns: [{ turnId: "turn:noise", role: "USER", content: raw }] }, currentProject: null })).toBeNull();
  });

  it("R08–R10 preserves distinct population facts and explicit ambiguity", () => {
    const raw = "Population 35 à 75 ans, sans antécédent, avec plaque carotidienne et sténose supérieure à 40 %.";
    const populationConversation: ScientificInterpretationConversation = {
      conversationId: "conversation:population-fidelity",
      language: "fr",
      turns: [{ turnId: "turn:population-fidelity", role: "USER", content: raw }],
    };
    const populationCandidate = {
      changes: [
        { ...change("population:cohort", "POPULATION", "Population avec plaque carotidienne"), sourceText: raw },
        { ...change("eligibility:age", "ELIGIBILITY_CRITERION", "Âge de 35 à 75 ans"), sourceText: raw },
        { ...change("condition:carotid-plaque", "CONDITION", "Plaque carotidienne"), sourceText: raw },
        { ...change("eligibility:stenosis", "ELIGIBILITY_CRITERION", "Sténose supérieure à 40 %"), sourceText: raw },
        { ...change("eligibility:no-history", "ELIGIBILITY_CRITERION", "Absence d'antécédent, portée à préciser"), sourceText: raw, epistemicStatus: "AMBIGUOUS" as const },
      ],
      relations: [],
      temporalQualifications: [],
      expectedVariableOccasions: [],
    };
    const checked = validatePersistentProjectDelta(populationCandidate, raw, null, populationConversation);
    expect(checked.validation).toMatchObject({ valid: true, acceptedChanges: expect.arrayContaining([
      expect.objectContaining({ proposedType: "POPULATION" }),
      expect.objectContaining({ proposedType: "ELIGIBILITY_CRITERION", content: "Âge de 35 à 75 ans" }),
      expect.objectContaining({ proposedType: "CONDITION" }),
      expect.objectContaining({ proposedType: "ELIGIBILITY_CRITERION", content: "Sténose supérieure à 40 %" }),
      expect.objectContaining({ epistemicStatus: "AMBIGUOUS" }),
    ]) });
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: populationConversation, currentProject: null })!;
    expect(contribution.scientificContent.candidateObjects).toHaveLength(5);
    expect(prepareResearchProjectContributionCandidate(contribution, null).humanReviewProjection).toMatchObject({ status: "COMPLETE" });
  });

  it("R04/R07 binds an explicit M3 anchor to an MRI acquisition created in the same turn", () => {
    const raw = "Le projet prévoit une évaluation IRM à M3.";
    const m3Conversation: ScientificInterpretationConversation = {
      conversationId: "conversation:mri-m3",
      language: "fr",
      turns: [{ turnId: "turn:mri-m3", role: "USER", content: raw }],
    };
    const checked = validatePersistentProjectDelta({
      changes: [
        { ...change("modality:mri-m3", "IMAGING_MODALITY", "IRM"), sourceText: raw },
        { ...change("acquisition:mri-m3", "ACQUISITION", "Acquisition IRM"), sourceText: raw },
      ],
      relations: [],
      temporalQualifications: [{
        ...temporal("timing:mri-m3", "acquisition:mri-m3", {
          kind: "TIMEPOINT",
          direction: "AT",
          unit: "MONTH",
          offset: 3,
          lowerBound: null,
          upperBound: null,
          relativeEventLabel: null,
          tolerance: null,
          reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
        }),
        sourceText: raw,
      }],
      expectedVariableOccasions: [],
    }, raw, null, m3Conversation);
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: m3Conversation, currentProject: null })!;
    const prepared = prepareResearchProjectContributionCandidate(contribution, null);
    expect(prepared.canonicalChangeSet.temporalQualificationChanges).toEqual([
      expect.objectContaining({ candidate: expect.objectContaining({ subjectProjectRef: "acquisition:mri-m3", anchor: expect.objectContaining({ unit: "MONTH", offset: 3, reference: expect.objectContaining({ status: "UNKNOWN" }) }) }) }),
    ]);
    expect(prepared.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content))).toEqual(expect.arrayContaining([
      expect.stringContaining("M3"),
    ]));
  });

  it("R14–R18 blocks Human Decision when any engaging canonical change is hidden", () => {
    const checked = validatePersistentProjectDelta(candidate, RAW, null, conversation);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation, currentProject: null })!;
    const prepared = prepareResearchProjectContributionCandidate(contribution, null);
    const [firstSection, ...rest] = prepared.humanReviewProjection.sections;
    const incompleteProjection = {
      ...prepared.humanReviewProjection,
      sections: firstSection ? [{ ...firstSection, items: firstSection.items.slice(1) }, ...rest] : rest,
    };
    expect(validateHumanReviewProjectionCoverage(prepared.canonicalChangeSet, incompleteProjection)).toMatchObject({
      status: "INCOMPLETE",
      missingChangeRefs: [prepared.humanReviewProjection.expectedChangeRefs[0]],
    });
    expect(() => confirmResearchProjectContribution({
      contribution,
      current: null,
      projectId: "project:incomplete-review",
      authority,
      confirmedAt: "2026-08-24T10:02:00.000Z",
      reviewedProjection: incompleteProjection,
    })).toThrow("REVIEW_PROJECTION_INCOMPLETE");
  });

  it("R17/R22 reviews a role replacement and preserves non-destructive supersession after reload", () => {
    const initialChecked = validatePersistentProjectDelta(candidate, RAW, null, conversation);
    const initialContribution = contributionFromPersistentDelta({ candidate: initialChecked.candidate!, conversation, currentProject: null })!;
    const project = confirmResearchProjectContribution({
      contribution: initialContribution,
      current: null,
      projectId: "project:role-review",
      authority,
      confirmedAt: "2026-08-24T10:03:00.000Z",
    });
    const raw = "Le contrôle devient le groupe de référence principal.";
    const correctionConversation: ScientificInterpretationConversation = {
      conversationId: "conversation:role-review",
      language: "fr",
      turns: [{ turnId: "turn:role-review", role: "USER", content: raw }],
    };
    const correction = validatePersistentProjectDelta({
      changes: [{
        operation: "REPLACE",
        sourceText: raw,
        targetProjectRef: "comparator:control",
        candidateRef: "candidate:comparator-role-replacement",
        semanticIdentity: "comparator:control",
        proposedType: "COMPARATOR",
        content: "Contrôle",
        polarity: "AFFIRMED",
        studyRole: "PRIMARY_REFERENCE_ARM",
        epistemicStatus: "EXPLICIT_USER_STATED",
        assertionKind: "USER_STATED",
        proposalSourceText: null,
        evidenceRefs: [],
      }],
      relations: [],
      temporalQualifications: [],
      expectedVariableOccasions: [],
    }, raw, project, correctionConversation);
    expect(correction.validation).toMatchObject({ valid: true, blocks: [] });
    const contribution = contributionFromPersistentDelta({ candidate: correction.candidate!, conversation: correctionConversation, currentProject: project })!;
    const prepared = prepareResearchProjectContributionCandidate(contribution, project);
    expect(prepared.humanReviewProjection).toMatchObject({ status: "COMPLETE" });
    expect(prepared.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content))).toEqual(expect.arrayContaining([
      expect.stringContaining("rôle : COMPARATOR_ARM → PRIMARY_REFERENCE_ARM"),
    ]));
    const updated = confirmResearchProjectContribution({
      contribution,
      current: project,
      projectId: project.projectId,
      authority,
      confirmedAt: "2026-08-24T10:04:00.000Z",
      reviewedProjection: prepared.humanReviewProjection,
    });
    const serialized = JSON.stringify(updated);
    const reloaded = JSON.parse(serialized) as typeof updated;
    expect(reloaded.canonicalState?.objects.filter((item) => item.objectId === "comparator:control")).toEqual(expect.arrayContaining([
      expect.objectContaining({ actuality: "SUPERSEDED", scientificRole: "COMPARATOR_ARM" }),
      expect.objectContaining({ actuality: "CURRENT", scientificRole: "PRIMARY_REFERENCE_ARM" }),
    ]));
  });

  it("bounds the live function schema to Project-owned object types without a lexical product special case", () => {
    const request: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      requestKind: "USER_TURN",
      conversation,
      currentProject: null,
      evaluatePersistentDelta: true,
    };
    const declaration = buildPersistentDeltaPayload(request).tools[0].functionDeclarations[0].parametersJsonSchema;
    expect(declaration.properties.changes.items.properties.proposedType.enum).toEqual(PERSISTENT_PROJECT_OBJECT_TYPES);
    expect(declaration.properties.temporalQualifications.items.properties.subjectProjectRef.description).toContain("candidateRef");
    expect(NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION).toContain("deux à cinq phrases");
    expect(NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION).toContain("une question principale");
  });
});
