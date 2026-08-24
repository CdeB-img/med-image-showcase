import { closeSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { projectDocumentSourceFromFunctionalProject } from "../../src/features/document-projection/index.ts";
import { buildFunctionalResetQueryNavigation } from "../../src/features/query-navigation/index.ts";
import type { ResearchProjectOwnerProjection } from "../../src/features/research-project-construction/index.ts";

const STATE_PATH = "/Users/charles/Documents/Projets/NOXIA/noxia-dev/validation/project-hands-on-02r4/c-adopted-state.json";
const OUTPUT_PATH = "/Users/charles/Documents/Projets/NOXIA/noxia-dev/validation/project-hands-on-02r4/consumer-canary.json";

const state = JSON.parse(readFileSync(STATE_PATH, "utf8")) as { project: ResearchProjectOwnerProjection };
const project = state.project;
const queryNavigation = buildFunctionalResetQueryNavigation({
  project,
  recordedAt: "2026-08-24T12:10:00.000Z",
  forceRebuild: true,
});
const documentSource = projectDocumentSourceFromFunctionalProject(project, project.confirmationDecision);
const serializedDocument = JSON.stringify(documentSource);
const projectSourceTexts = new Set(project.canonicalState?.objects.flatMap((object) => [
  object.content,
  object.provenance.sourceText,
]).filter(Boolean) ?? []);

const output = {
  contract: "PROJECT_HANDS_ON_02R4_CONSUMER_CANARY",
  contractVersion: "1.0.0",
  sourceProject: {
    projectId: project.projectId,
    versionId: project.versionId,
    projectDigest: project.projectDigest,
  },
  queryNavigation: {
    owner: queryNavigation.owner,
    projectVersion: queryNavigation.projectVersion,
    projectDigest: queryNavigation.projectDigest,
    status: queryNavigation.status,
    activeNeedRefs: queryNavigation.currentAction?.navigationNeedRefs ?? [],
    scopeSectionIds: queryNavigation.standardQuestion?.scopeSectionIds ?? [],
    standardQuestion: queryNavigation.standardQuestion?.text ?? null,
    projectWriteAuthorized: queryNavigation.projectWriteAuthorized,
  },
  documentCanary: {
    resultId: documentSource.resultId,
    resultDigest: documentSource.resultDigest,
    status: documentSource.status,
    scientificQuestion: documentSource.scientificQuestion,
    objectives: documentSource.objectives,
    population: documentSource.populationDesign,
    groups: documentSource.groups,
    comparators: documentSource.comparators,
    imaging: documentSource.imagingContribution,
    visits: documentSource.visits,
    missingInformation: documentSource.missingInformation,
    limitations: documentSource.limitations,
    sourceRefs: documentSource.provenance.sourceRefs,
    containsTranscriptOnlyMaterial: [...projectSourceTexts].every((text) => serializedDocument.includes(text))
      ? false
      : null,
    sourceOfTruth: false,
  },
};

const descriptor = openSync(OUTPUT_PATH, "wx", 0o600);
try {
  writeFileSync(descriptor, `${JSON.stringify(output, null, 2)}\n`, "utf8");
} finally {
  closeSync(descriptor);
}
console.log(JSON.stringify({ outputPath: OUTPUT_PATH, queryNavigation: output.queryNavigation, documentCanary: output.documentCanary }));
