import { describe, expect, it } from "vitest";
import { executeKnowledgeEngine } from "@/features/knowledge-engine";
import {
  collectProjectKnowledgeSources,
  emptyProjectSourceLibrary,
  recordSourceInterest,
  type ProjectSourceLibrary,
} from "@/features/knowledge-engine/project-source-library";
import { authorizeResearchProjectDocumentHandoff } from "@/features/research-project-construction";
import {
  adoptBehaviorContribution,
  behaviorAuthority,
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
} from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import { resolveDocumentaryIntent } from "@/features/protocol-designer/functional-reset/documentary-conversation";
import { projectDocumentSourceFromFunctionalProject, refreshFunctionalResetDocumentPortfolio } from "../functional-reset-boundary";
import {
  availableDocumentEvidence,
  contradictoryDocumentEvidence,
  documentEvidenceSections,
  initialDocumentEvidence,
  reviseScientificDocument,
  validateDocumentEvidence,
} from "../scientific-document-revision";
import {
  buildScientificNarrative,
  explainDocumentSourceComparison,
  explainDocumentSourceSelection,
  narrativeProjectContext,
  prioritizeDocumentEvidence,
  type DocumentNarrativeProjectContext,
} from "../scientific-narrative";

const AT = "2026-09-15T19:00:00.000Z";
const turn = behaviorTurn(
  "turn:scientific-narrative-v1:cardiac",
  "Étudier chez des patients diabétiques les lésions myocardiques après circulation extracorporelle par rehaussement tardif, T1, T2 et ECV.",
);
const cardiacProject = adoptBehaviorContribution(behaviorContribution({
  contributionId: "contribution:scientific-narrative-v1:cardiac",
  turns: [turn],
  candidateObjects: [
    behaviorItem({ itemId: "question:cec-fibrosis", proposedType: "SCIENTIFIC_QUESTION", content: "Après circulation extracorporelle, les lésions myocardiques des patients diabétiques sont-elles focales, diffuses ou inflammatoires en IRM ?", turnId: turn.turnId }),
    behaviorItem({ itemId: "objective:cec-fibrosis", proposedType: "OBJECTIVE", content: "Caractériser la distribution et la nature des lésions myocardiques après circulation extracorporelle", turnId: turn.turnId }),
    behaviorItem({ itemId: "population:diabetes", proposedType: "POPULATION", content: "Patients diabétiques exposés à une circulation extracorporelle", turnId: turn.turnId }),
    behaviorItem({ itemId: "condition:diabetes", proposedType: "CONDITION", content: "Diabète", turnId: turn.turnId }),
    behaviorItem({ itemId: "exposure:cec", proposedType: "EXPOSURE", content: "Circulation extracorporelle", turnId: turn.turnId }),
    behaviorItem({ itemId: "design:prospective", proposedType: "STUDY_DESIGN", content: "Cohorte prospective", turnId: turn.turnId, studyRole: "PROSPECTIVE_LONGITUDINAL_COHORT" }),
    behaviorItem({ itemId: "modality:cardiac-mri", proposedType: "MODALITY", content: "IRM cardiaque", turnId: turn.turnId }),
    behaviorItem({ itemId: "measurement:lge", proposedType: "MEASUREMENT", content: "Rehaussement tardif focal ou diffus", turnId: turn.turnId }),
    behaviorItem({ itemId: "measurement:t1-ecv", proposedType: "MEASUREMENT", content: "T1 natif, T1 après contraste et fraction de volume extracellulaire ECV", turnId: turn.turnId }),
    behaviorItem({ itemId: "measurement:t2", proposedType: "MEASUREMENT", content: "T2 myocardique comme marqueur d’inflammation", turnId: turn.turnId }),
  ],
}), null, 2);

const cardiacKnowledge = executeKnowledgeEngine({
  originalQuestion: "Comprendre ECV myocardique et fibrose en IRM",
  scientificObjectTerms: [{ term: "ECV myocardique", role: "SUBJECT" }],
  context: {},
  externalSearchPolicy: "INTERNAL_ONLY",
  researchProjectId: cardiacProject.projectId,
  researchProjectVersion: cardiacProject.versionId,
  researchProjectDigest: cardiacProject.projectDigest,
  createdAt: AT,
});
const cardiacLibrary = collectProjectKnowledgeSources(emptyProjectSourceLibrary(cardiacProject.projectId), cardiacKnowledge);

const cardiacContext: DocumentNarrativeProjectContext = {
  sourceProjectVersion: cardiacProject.versionId,
  sourceProjectDigest: cardiacProject.projectDigest,
  question: "Après circulation extracorporelle, les lésions myocardiques des patients diabétiques sont-elles focales, diffuses ou inflammatoires en IRM ?",
  population: ["Patients diabétiques exposés à une circulation extracorporelle"],
  pathologies: ["Diabète"],
  modalities: ["IRM cardiaque"],
  techniques: ["Rehaussement tardif", "T1 natif", "T1 après contraste", "ECV", "T2 myocardique"],
  objectives: ["Caractériser la distribution et la nature des lésions myocardiques après circulation extracorporelle"],
  design: "Cohorte prospective",
  measurements: ["Rehaussement tardif focal ou diffus", "T1 natif, T1 après contraste et ECV", "T2 myocardique"],
};

const generate = () => refreshFunctionalResetDocumentPortfolio({
  project: cardiacProject,
  knowledgeLibrary: cardiacLibrary,
  requestedAt: AT,
  generateProtocol: true,
  handoffDecision: authorizeResearchProjectDocumentHandoff({ project: cardiacProject, authority: behaviorAuthority, confirmedAt: AT }),
}).projections.at(-1)!;

const nonPrimarySource = (library: ProjectSourceLibrary) => {
  const ordered = prioritizeDocumentEvidence(library, availableDocumentEvidence(library));
  const primary = new Set(ordered[0]!.sourceRefs);
  const paragraph = ordered.find((candidate) => candidate.sourceRefs.some((sourceId) => !primary.has(sourceId)));
  if (!paragraph) throw new Error("TEST_REQUIRES_TWO_INDEPENDENT_DOCUMENT_SOURCES");
  return library.sources.find((source) => paragraph.sourceRefs.includes(source.source.sourceId) && !primary.has(source.source.sourceId))!;
};

describe("V1 scientific narrative and evidence synthesis", () => {
  it("builds a substantial, sourced scientific argument from Project facts and qualified Knowledge assertions", () => {
    const content = initialDocumentEvidence(cardiacLibrary, cardiacContext);
    const narrative = content.narrative!;
    expect(validateDocumentEvidence(content)).toBe(true);
    expect(narrative.contract).toBe("DOC_SCIENTIFIC_NARRATIVE_V1");
    expect(narrative.coverage).toEqual(expect.arrayContaining([
      "PROBLEM", "METHODS_OR_BIOMARKERS", "SCIENTIFIC_GAP", "STUDY_JUSTIFICATION", "QUESTION_AND_OBJECTIVES",
    ]));
    expect(narrative.blocks.find((block) => block.role === "PROBLEM")!.text).toContain("importance scientifique");
    expect(narrative.blocks.map((block) => block.text).join("\n").length).toBeGreaterThan(900);
    expect(narrative.blocks.map((block) => block.text).join("\n")).toContain("preuves disponibles ici sont indirectes ou limitées");
    expect(documentEvidenceSections(content).find((section) => section.sectionId === "scientific-background")!.blocks[0]!.items)
      .toEqual(narrative.blocks.map((block) => block.text));
  });

  it("keeps every scientific sentence bound to an admissible assertion, source and locator", () => {
    const content = initialDocumentEvidence(cardiacLibrary, cardiacContext);
    for (const block of content.narrative!.blocks.filter((item) => item.basis !== "PROJECT")) {
      for (const assertionRef of block.assertionRefs) {
        expect(content.sources.some((source) => source.assertions.some((assertion) => assertion.revision === assertionRef))).toBe(true);
      }
      for (const sourceRef of block.sourceRefs) {
        const source = content.sources.find((candidate) => candidate.source.sourceId === sourceRef)!;
        expect(source.evidence.some((link) => block.assertionRefs.includes(link.assertionId) && link.locator !== "LOCALISATEUR_NON_DOCUMENTE")).toBe(true);
      }
    }
    expect(new Set(content.sources.map((source) => source.source.sourceId)))
      .toEqual(new Set(content.narrative!.blocks.flatMap((block) => block.sourceRefs)));
  });

  it("preserves corpus maturity, quality, source type, population, pathology, technique and measurement facets", () => {
    const assertions = cardiacLibrary.sources.flatMap((source) => source.assertions);
    expect(assertions.some((assertion) => assertion.scientificQualification?.maturity)).toBe(true);
    expect(assertions.some((assertion) => assertion.scientificQualification?.methodologicalQuality === "HIGH")).toBe(true);
    expect(assertions.some((assertion) => assertion.scientificQualification?.sourceTypes.length)).toBe(true);
    expect(assertions.some((assertion) => assertion.scientificQualification?.populations.length)).toBe(true);
    expect(assertions.some((assertion) => assertion.scientificQualification?.pathologies.length)).toBe(true);
    expect(assertions.some((assertion) => assertion.scientificQualification?.techniques.length)).toBe(true);
    expect(assertions.some((assertion) => assertion.scientificQualification?.measurements.length)).toBe(true);
  });

  it("keeps user preference separate from scientific priority and explains Project-axis applicability", () => {
    const target = nonPrimarySource(cardiacLibrary);
    const before = prioritizeDocumentEvidence(cardiacLibrary, availableDocumentEvidence(cardiacLibrary)).map((item) => item.paragraphId);
    const marked = recordSourceInterest(cardiacLibrary, {
      text: target.source.title,
      turnRef: "turn:source-interest",
      recordedAt: AT,
      explicitUse: true,
    });
    expect(marked.resolution.status).toBe("RESOLVED");
    const after = prioritizeDocumentEvidence(marked.library, availableDocumentEvidence(marked.library)).map((item) => item.paragraphId);
    expect(after).toEqual(before);
    const narrative = buildScientificNarrative({
      library: marked.library,
      paragraphs: availableDocumentEvidence(marked.library),
      contradictoryEvidence: [],
      projectContext: cardiacContext,
      depth: "EXPANDED",
      emphasisSourceRef: null,
    });
    const priority = narrative.sourcePriorities.find((item) => item.sourceId === target.source.sourceId)!;
    expect(priority.userPreferenceAffectedScientificPriority).toBe(false);
    expect(priority.reasons.join(" ")).toContain("portée indirecte");
    expect(priority.reasons.join(" ")).toContain("n’a pas modifié la priorité scientifique");
  });

  it("shows a qualified contradiction as two visible positions without silent arbitration", () => {
    const paragraph = availableDocumentEvidence(cardiacLibrary)[0]!;
    const contested: ProjectSourceLibrary = {
      ...cardiacLibrary,
      sources: cardiacLibrary.sources.map((source) => !paragraph.sourceRefs.includes(source.source.sourceId) ? source : {
        ...source,
        conflicts: [{
          conflictId: "conflict:test-visible",
          state: "CONTRADICTION" as const,
          positionIds: [...paragraph.assertionRefs],
          explanation: "Deux positions qualifiées restent incompatibles dans ce contexte.",
        }],
      }),
      digest: "synthetic-conflict-library-for-test",
    };
    const content = initialDocumentEvidence(contested, cardiacContext);
    expect(contradictoryDocumentEvidence(contested)).toHaveLength(1);
    expect(content.narrative!.blocks.some((block) => block.role === "LIMITS_OR_DISCORDANCE" && block.text.includes("aucune position n’est arbitrée"))).toBe(true);
    expect(content.narrative!.sourcePriorities.some((priority) => priority.role === "CONTRADICTORY_EVIDENCE")).toBe(true);
    expect(validateDocumentEvidence(content)).toBe(true);
  });

  it("develops the rationale without modifying the canonical Research Project", () => {
    const projection = generate();
    const beforeProject = JSON.stringify(cardiacProject);
    const expanded = reviseScientificDocument({ projection, library: cardiacLibrary, transformation: "EXPAND", instruction: "Développe la justification scientifique.", turnRef: "doc:expand", timestamp: AT }).projection;
    expect(expanded.projectionVersion).not.toBe(projection.projectionVersion);
    expect(expanded.evidenceContent!.depth).toBe("EXPANDED");
    expect(expanded.evidenceContent!.paragraphs.length).toBeGreaterThanOrEqual(projection.evidenceContent!.paragraphs.length);
    expect(expanded.documentaryRevision).toMatchObject({ scientificImpact: "DOCUMENT_ONLY", validation: { citationAssertionConsistency: "PASS" } });
    expect(JSON.stringify(cardiacProject)).toBe(beforeProject);
  });

  it("focuses a requested source while preserving the strongest scientific support", () => {
    const projection = generate();
    const target = nonPrimarySource(cardiacLibrary);
    const marked = recordSourceInterest(cardiacLibrary, { text: target.source.title, turnRef: "doc:focus-interest", recordedAt: AT, explicitUse: true }).library;
    const focused = reviseScientificDocument({ projection, library: marked, transformation: "FOCUS_SOURCE", sourceId: target.source.sourceId,
      instruction: `Mets davantage en avant ${target.authors[0]} (${target.year}) dans l’introduction.`, turnRef: "doc:focus", timestamp: AT }).projection;
    expect(focused.evidenceContent!.emphasisSourceRef).toBe(target.source.sourceId);
    expect(focused.evidenceContent!.paragraphs.some((paragraph) => paragraph.sourceRefs.includes(target.source.sourceId))).toBe(true);
    expect(focused.evidenceContent!.narrative!.sourcePriorities.some((priority) => priority.role === "PRIMARY_SUPPORT")).toBe(true);
    expect(focused.evidenceContent!.narrative!.sourcePriorities.find((priority) => priority.sourceId === target.source.sourceId))
      .toMatchObject({ role: "CONTEXTUAL_USER_SOURCE", userPreferenceAffectedScientificPriority: false });
    expect(focused.evidenceContent!.libraryDigest).toBe(marked.digest);
  });

  it("shortens the text without removing problem, gap, justification, question or citation integrity", () => {
    const projection = generate();
    const expanded = reviseScientificDocument({ projection, library: cardiacLibrary, transformation: "EXPAND", instruction: "Développe cette partie.", turnRef: "doc:expand-before-short", timestamp: AT }).projection;
    const shortened = reviseScientificDocument({ projection: expanded, library: cardiacLibrary, transformation: "SHORTEN", instruction: "Raccourcis sans perdre la justification scientifique.", turnRef: "doc:short", timestamp: AT }).projection;
    const retainedRoles = shortened.evidenceContent!.narrative!.coverage;
    expect(retainedRoles).toEqual(expect.arrayContaining(["PROBLEM", "SCIENTIFIC_GAP", "STUDY_JUSTIFICATION", "QUESTION_AND_OBJECTIVES"]));
    expect(shortened.evidenceContent!.narrative!.blocks.map((block) => block.text).join("\n").length)
      .toBeLessThan(expanded.evidenceContent!.narrative!.blocks.map((block) => block.text).join("\n").length);
    expect(validateDocumentEvidence(shortened.evidenceContent!)).toBe(true);
  });

  it("explains why one source is used with applicability, directness, quality and preference boundaries", () => {
    const content = initialDocumentEvidence(cardiacLibrary, cardiacContext);
    const sourceId = content.narrative!.sourcePriorities[0]!.sourceId;
    const answer = explainDocumentSourceSelection(cardiacLibrary, content.narrative, sourceId);
    expect(answer).toContain("Applicabilité Knowledge");
    expect(answer).toMatch(/SUPPORTS|qualifie ou contextualise/u);
    expect(answer).toContain("Robustesse méthodologique");
    expect(answer).toContain("Population");
    expect(answer).toContain("préférence utilisateur");
  });

  it("explains the relative priority of two named sources without letting preference change scientific weight", () => {
    const content = initialDocumentEvidence(cardiacLibrary, cardiacContext);
    const primary = content.narrative!.sourcePriorities.find((item) => item.role === "PRIMARY_SUPPORT")!;
    const alternative = content.narrative!.sourcePriorities.find((item) => item.sourceId !== primary.sourceId)!;
    const answer = explainDocumentSourceComparison(cardiacLibrary, content.narrative, [alternative.sourceId, primary.sourceId]);
    expect(answer).toContain("ordre lexicographique KE-001");
    expect(answer).toContain("privilégiée pour les affirmations principales");
    expect(answer).toContain("préférence utilisateur");
    expect(answer).toContain(cardiacLibrary.sources.find((source) => source.source.sourceId === primary.sourceId)!.authors[0]!);
    expect(answer).toContain(cardiacLibrary.sources.find((source) => source.source.sourceId === alternative.sourceId)!.authors[0]!);
  });

  it("routes the four required researcher commands to the bounded documentary owner", () => {
    const source = nonPrimarySource(cardiacLibrary);
    expect(resolveDocumentaryIntent("Développe davantage la justification scientifique dans l’introduction.", true)).toMatchObject({ kind: "DOCUMENT_REVISION", transformation: "EXPAND" });
    expect(resolveDocumentaryIntent(`Mets davantage en avant la source ${source.authors[0]} (${source.year}) dans l’introduction.`, true)).toMatchObject({ kind: "DOCUMENT_REVISION", transformation: "FOCUS_SOURCE", sourceRequired: true });
    expect(resolveDocumentaryIntent("Raccourcis le contexte sans perdre la justification scientifique.", true)).toMatchObject({ kind: "DOCUMENT_REVISION", transformation: "SHORTEN" });
    expect(resolveDocumentaryIntent("Pourquoi as-tu privilégié Schulz-Menger J et al. (2020) plutôt que Miller CA et al. (2013) ?", true)).toEqual({ kind: "EXPLAIN_SOURCE" });
  });

  it("smoke-tests the same mechanism on neuro-perfusion without cardiac hard-coding", () => {
    const neuroTurn = behaviorTurn(
      "turn:scientific-narrative-v1:neuro",
      "Étudier si un débit cérébral préservé reflète une compensation hémodynamique ou une consommation d’oxygène normale.",
    );
    const neuroProject = adoptBehaviorContribution(behaviorContribution({
      contributionId: "contribution:scientific-narrative-v1:neuro",
      turns: [neuroTurn],
      candidateObjects: [
        behaviorItem({ itemId: "objective:neuro", proposedType: "OBJECTIVE", content: "Distinguer compensation hémodynamique et consommation cérébrale d’oxygène normale lorsque le débit cérébral au repos paraît préservé", turnId: neuroTurn.turnId }),
        behaviorItem({ itemId: "population:neuro", proposedType: "POPULATION", content: "Adultes avec occlusion carotidienne unilatérale chronique et symptômes stables", turnId: neuroTurn.turnId }),
        behaviorItem({ itemId: "condition:carotid", proposedType: "CONDITION", content: "Occlusion carotidienne unilatérale chronique", turnId: neuroTurn.turnId }),
        behaviorItem({ itemId: "design:observation", proposedType: "STUDY_DESIGN", content: "Étude observationnelle", turnId: neuroTurn.turnId, studyRole: "OBSERVATIONAL_COHORT" }),
        behaviorItem({ itemId: "modality:neuro-mri", proposedType: "MODALITY", content: "IRM cérébrale", turnId: neuroTurn.turnId }),
      ],
    }), null, 2);
    const neuroKnowledge = executeKnowledgeEngine({
      originalQuestion: "Le débit cérébral préservé reflète-t-il une compensation hémodynamique ou une consommation d’oxygène normale ?",
      scientificObjectTerms: [{ term: "débit cérébral", role: "SUBJECT" }, { term: "consommation d’oxygène", role: "CONTEXT" }],
      context: { domain: "NEURO_IMAGING", modality: "MRI" },
      externalSearchPolicy: "INTERNAL_ONLY",
      researchProjectId: neuroProject.projectId,
      researchProjectVersion: neuroProject.versionId,
      researchProjectDigest: neuroProject.projectDigest,
      createdAt: AT,
    });
    const neuroLibrary = collectProjectKnowledgeSources(emptyProjectSourceLibrary(neuroProject.projectId), neuroKnowledge);
    const neuroSource = projectDocumentSourceFromFunctionalProject(neuroProject, authorizeResearchProjectDocumentHandoff({
      project: neuroProject,
      authority: behaviorAuthority,
      confirmedAt: AT,
    }));
    const projectContext = narrativeProjectContext(neuroSource);
    const paragraphs = availableDocumentEvidence(neuroLibrary);
    const narrative = buildScientificNarrative({
      library: neuroLibrary,
      paragraphs,
      contradictoryEvidence: contradictoryDocumentEvidence(neuroLibrary),
      projectContext,
      depth: "SHORT",
      emphasisSourceRef: null,
    });
    expect(neuroKnowledge.resolvedConcepts.map((concept) => concept.conceptId))
      .toEqual(expect.arrayContaining(["biomarker:cerebral-perfusion", "biomarker:cmro2"]));
    expect(projectContext).toMatchObject({
      framingKind: "OBJECTIVE",
      question: "Distinguer compensation hémodynamique et consommation cérébrale d’oxygène normale lorsque le débit cérébral au repos paraît préservé",
    });
    expect(paragraphs.length).toBeGreaterThan(0);
    expect(narrative.coverage).toEqual(expect.arrayContaining(["PROBLEM", "SCIENTIFIC_GAP", "STUDY_JUSTIFICATION", "QUESTION_AND_OBJECTIVES"]));
    expect(narrative.blocks.find((block) => block.role === "PROBLEM")!.text).toContain("objectif adopté");
    expect(narrative.blocks.find((block) => block.role === "QUESTION_AND_OBJECTIVES")!.text).toContain("Formulation documentaire de la question");
    expect(narrative.blocks.map((block) => block.text).join(" ")).toMatch(/débit cérébral|CBF/u);
    expect(narrative.blocks.map((block) => block.text).join(" ")).not.toContain("«  »");
    expect(narrative.blocks.map((block) => block.text).join(" ")).not.toMatch(/myocard|ECV/u);
    expect(neuroLibrary.sources.flatMap((source) => source.assertions).some((assertion) => assertion.scientificQualification?.sourceTypes.length)).toBe(true);
  });
});
