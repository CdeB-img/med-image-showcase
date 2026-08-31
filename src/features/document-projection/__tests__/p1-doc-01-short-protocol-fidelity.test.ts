import { describe, expect, it } from "vitest";
import {
  authorizeResearchProjectDocumentHandoff,
  ensureCanonicalProjectState,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  adoptBehaviorContribution,
  behaviorAuthority,
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
} from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import {
  buildStandardProtocolPresentation,
  createEmptyFunctionalResetDocumentPortfolio,
  projectDocumentSourceFromFunctionalProject,
  refreshFunctionalResetDocumentPortfolio,
  renderProjection,
} from "..";

const AT = "2026-09-01T08:00:00.000Z";
const turn = behaviorTurn(
  "turn:p1-doc-01:generic",
  "Construire une étude générique multimodale avec prélèvement, critères, mesures et temporalité, en conservant une incertitude méthodologique.",
);

const item = (
  itemId: string,
  proposedType: string,
  content: string,
  studyRole: string | null = null,
  epistemicState: "KNOWN" | "ASSUMED" | "UNKNOWN" | "WITHHELD" = "KNOWN",
) => behaviorItem({ itemId, proposedType, content, studyRole, epistemicState, turnId: turn.turnId });

const genericProject = () => adoptBehaviorContribution(behaviorContribution({
  contributionId: "contribution:p1-doc-01:generic:v1",
  turns: [turn],
  candidateObjects: [
    item("question:generic", "SCIENTIFIC_QUESTION", "Quel est l’effet de l’exposition E sur la réponse R dans la population P ?"),
    item("objective:effect", "OBJECTIVE", "Estimer l’effet de l’exposition E sur la réponse R", "PRIMARY_OBJECTIVE"),
    item("objective:feasibility", "OBJECTIVE", "Décrire la faisabilité du recueil multimodal", "SECONDARY_OBJECTIVE"),
    item("hypothesis:effect", "HYPOTHESIS", "L’exposition E est associée à une variation de la réponse R", "WORKING_HYPOTHESIS", "ASSUMED"),
    item("population:p", "POPULATION", "Participants répondant aux critères de la population P"),
    item("design:prospective", "STUDY_DESIGN", "Cohorte prospective observationnelle"),
    item("exposure:e", "INTERVENTION", "Exposition E", "EXPOSURE"),
    item("comparator:unexposed", "COMPARATOR", "Participants non exposés", "COMPARATOR_ARM"),
    item("imaging:modality", "IMAGING_MODALITY", "Imagerie quantitative de modalité M"),
    item("imaging:acquisition", "ACQUISITION", "Acquisition standardisée de modalité M"),
    item("sample:collection", "ACQUISITION", "Prélèvement de matériau biologique au temps initial", "SAMPLE_COLLECTION"),
    item("endpoint:response", "ENDPOINT", "Variation de la réponse R à six mois", "SECONDARY_ENDPOINT"),
    item("variable:response", "CANONICAL_VARIABLE", "Mesure quantitative de la réponse R"),
    item("analysis:association", "ANALYSIS_SPECIFICATION", "Estimation de l’association entre exposition E et réponse R"),
    item("uncertainty:threshold", "UNCERTAINTY", "Le seuil de pertinence clinique reste à définir", null, "UNKNOWN"),
  ],
  temporalElements: [
    item("time:six-months", "TIMEPOINT", "Évaluation à six mois"),
  ],
}), null, 1);

const handoffFor = (project: ResearchProjectOwnerProjection, at = AT) => authorizeResearchProjectDocumentHandoff({
  project,
  authority: behaviorAuthority,
  confirmedAt: at,
});

const sectionValues = (presentation: ReturnType<typeof buildStandardProtocolPresentation>, sectionId: string) => presentation.sections
  .find((section) => section.sectionId === sectionId)?.entries.map((entry) => entry.value) ?? [];

describe("P1-DOC-01 — canonical Project to existing short Protocol", () => {
  it("preserves canonical identities and semantic categories without inventing legacy roles", () => {
    const project = genericProject();
    const before = JSON.stringify(project);
    const source = projectDocumentSourceFromFunctionalProject(project, handoffFor(project));
    const nodes = source.impactGraph.nodes;

    expect(nodes.filter((node) => node.type === "OBJECTIVE")).toHaveLength(2);
    expect(nodes.filter((node) => node.type === "HYPOTHESIS")).toHaveLength(1);
    expect(nodes.find((node) => node.scientificRole === "SAMPLE_COLLECTION")).toMatchObject({
      type: "ACQUISITION",
      sectionId: "BIOSPECIMENS",
      label: "Prélèvement de matériau biologique au temps initial",
    });
    expect(source.endpointCandidates).toHaveLength(1);
    expect(source.variables).toHaveLength(1);
    expect(source.variables[0]?.definition).toBe("Mesure quantitative de la réponse R");
    expect(source.variables.map((variable) => variable.definition)).not.toContain("Prélèvement de matériau biologique au temps initial");
    expect(source.analysisRequirements.map((requirement) => requirement.reason)).toEqual([
      "Estimation de l’association entre exposition E et réponse R",
    ]);
    expect(source.missingInformation).toContain("Le seuil de pertinence clinique reste à définir");
    expect(source.objectives).toEqual([]);
    expect(source.hypotheses).toEqual([]);
    expect(JSON.stringify(project)).toBe(before);
  });

  it("executes PROTOCOL:SHORT and keeps Standard/HTML semantic parity", () => {
    const project = genericProject();
    const before = JSON.stringify(project);
    const portfolio = refreshFunctionalResetDocumentPortfolio({
      project,
      previous: createEmptyFunctionalResetDocumentPortfolio(),
      handoffDecision: handoffFor(project),
      requestedAt: AT,
      generateProtocol: true,
    });
    const projection = portfolio.projections.at(-1)!;
    const presentation = buildStandardProtocolPresentation(projection);
    const html = renderProjection(projection, "HTML").content;

    expect(projection).toMatchObject({
      projectionType: "PROTOCOL",
      profile: "SHORT_PROTOCOL_DRAFT",
      source: {
        projectVersion: project.versionId,
        projectDigest: project.projectDigest,
        template: { requestedDetailLevel: "SHORT" },
      },
    });
    expect(sectionValues(presentation, "objectives")).toHaveLength(2);
    expect(sectionValues(presentation, "hypotheses")).toContain("L’exposition E est associée à une variation de la réponse R");
    expect(sectionValues(presentation, "population").join(" ")).toMatch(/population P/i);
    expect(sectionValues(presentation, "design")).toContain("Cohorte prospective observationnelle.");
    expect(sectionValues(presentation, "imaging")).toEqual(expect.arrayContaining([
      "Imagerie quantitative de modalité M.",
      "Acquisition standardisée de modalité M.",
    ]));
    expect(sectionValues(presentation, "biospecimens")).toContain("Prélèvement de matériau biologique au temps initial");
    expect(sectionValues(presentation, "endpoints")).toContain("Variation de la réponse R à six mois");
    expect(sectionValues(presentation, "measurements")).toContain("Mesure quantitative de la réponse R");
    expect(sectionValues(presentation, "temporality").join(" ")).toMatch(/six mois/i);
    expect(sectionValues(presentation, "analysis")).toContain("Estimation de l’association entre exposition E et réponse R.");
    expect(presentation.sections.find((section) => section.sectionId === "title")).toMatchObject({ completeness: "MISSING", entries: [] });
    expect(sectionValues(presentation, "limitations")).toContain("Le seuil de pertinence clinique reste à définir");

    const importantValues = [
      ...sectionValues(presentation, "objectives"),
      ...sectionValues(presentation, "hypotheses"),
      ...sectionValues(presentation, "population"),
      ...sectionValues(presentation, "design"),
      ...sectionValues(presentation, "imaging"),
      ...sectionValues(presentation, "biospecimens"),
      ...sectionValues(presentation, "endpoints"),
      ...sectionValues(presentation, "measurements"),
      ...sectionValues(presentation, "temporality"),
      ...sectionValues(presentation, "analysis"),
    ];
    importantValues.forEach((value) => expect(html).toContain(value));
    expect(html).toContain("Titre de travail");
    expect(html).toContain("À préciser.");
    expect(html).toContain("Le seuil de pertinence clinique reste à définir");
    expect(JSON.stringify(presentation)).not.toMatch(/canonicalState|objectId|MOTIVATES_DATA_NEED|OPERATIONALIZES|OWNER_CONTRIBUTION|PRJ001|TMP-|DOC-/i);
    expect(JSON.stringify(project)).toBe(before);
  });

  it("preserves the old projection, marks it stale, and regenerates from the exact next Project version", () => {
    const projectV1 = genericProject();
    const p1 = refreshFunctionalResetDocumentPortfolio({
      project: projectV1,
      handoffDecision: handoffFor(projectV1),
      requestedAt: AT,
      generateProtocol: true,
    });
    const additionTurn = behaviorTurn("turn:p1-doc-01:v2", "Ajouter une contrainte organisationnelle explicitement adoptée.");
    const projectV2 = adoptBehaviorContribution(behaviorContribution({
      contributionId: "contribution:p1-doc-01:generic:v2",
      previousContributionId: projectV1.contributionRef,
      turns: [turn, additionTurn],
      candidateObjects: [behaviorItem({
        itemId: "constraint:coordination",
        proposedType: "CONSTRAINT",
        content: "Coordination centralisée des acquisitions",
        turnId: additionTurn.turnId,
      })],
    }), projectV1, 2);

    const stale = refreshFunctionalResetDocumentPortfolio({ project: projectV2, previous: p1, requestedAt: "2026-09-01T08:01:00.000Z" });
    expect(stale.projections).toEqual(p1.projections);
    expect(stale.cards.find((card) => card.kind === "PROTOCOL")?.freshness).toBe("STALE");

    const p2 = refreshFunctionalResetDocumentPortfolio({
      project: projectV2,
      previous: stale,
      handoffDecision: handoffFor(projectV2, "2026-09-01T08:02:00.000Z"),
      requestedAt: "2026-09-01T08:02:00.000Z",
      generateProtocol: true,
    });
    expect(p2.projections).toHaveLength(2);
    expect(p2.projections[0]).toEqual(p1.projections[0]);
    expect(p2.projections[1]?.source).toMatchObject({
      projectVersion: projectV2.versionId,
      projectDigest: projectV2.projectDigest,
      template: { requestedDetailLevel: "SHORT" },
    });
    expect(p2.projections[1]?.projectionId).not.toBe(p2.projections[0]?.projectionId);
    expect(ensureCanonicalProjectState(projectV2).objects.some((object) => object.content === "Coordination centralisée des acquisitions")).toBe(true);
  });
});
