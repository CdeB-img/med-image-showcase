import { readFileSync } from "node:fs";
import { logicalDigest } from "../src/features/knowledge-engine/canonical";
import { decodeSessionStorage } from "../src/features/protocol-designer/functional-reset/session-storage-codec";
import type { FunctionalResetSession } from "../src/features/protocol-designer/functional-reset/session";
import { confirmResearchProjectContribution } from "../src/features/research-project-construction/contribution-owner-boundary";
import { parseVerifiedProjectSnapshot, PROJECT_SNAPSHOT_MAX_BYTES } from "../server/protocol-designer-project-snapshot";
import { makeFunctionalResetContribution } from "../src/features/protocol-designer/functional-reset/__tests__/functional-reset-fixtures";

const source = process.argv[2];
if (!source) throw new Error("HUMAN_EXPORT_PATH_REQUIRED");
const expectedDigest = process.argv[3] ?? "ke1-818493a24316bd66";
const exported = JSON.parse(readFileSync(source, "utf8")) as { matches: Array<[string, string]> };
const session = exported.matches.map(([, raw]) => decodeSessionStorage(raw) as FunctionalResetSession)
  .find((item) => item.project?.projectDigest === expectedDigest);
if (!session?.project) throw new Error("EXACT_HUMAN_PROJECT_NOT_FOUND");
const initialDigest = session.project.projectDigest;
const initialJson = JSON.stringify(session.project);
const axes = ["reproductibilité", "qualité de mesure", "standardisation", "variabilité interlecteur",
  "données manquantes", "calibration", "sensibilité analytique", "traçabilité", "hétérogénéité intercentre"];
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
const samples: Array<Record<string, unknown>> = [];
let project = session.project;
for (let factor = 1; factor <= 10; factor += 1) {
  if (factor > 1) {
    const axis = axes[factor - 2]!;
    const turn = { turnId: `synthetic-scale-turn:${factor}`, role: "USER" as const,
      content: `Essai structurel hors produit : intégrer 36 variables distinctes de ${axis} pour l'étude ECV et âge.`,
      createdAt: new Date(Date.parse(session.updatedAt) + factor * 1_000).toISOString() };
    const base = makeFunctionalResetContribution([turn]);
    const template = base.scientificContent.candidateObjects[0]!;
    const items = Array.from({ length: 36 }, (_, index) => ({ ...template,
      itemId: `synthetic-scale:${factor}:${index}`,
      semanticIdentity: `ECV_AGE:${axis}:${factor}:${index}`,
      proposedType: "MEASURED_VARIABLE", studyRole: "EXPLORATORY_COVARIATE",
      content: `Variable synthétique ${index + 1} de ${axis} pour l'analyse ECV selon l'âge.`,
      epistemicBoundary: { ...template.epistemicBoundary, sourceTurnIds: [turn.turnId], sourceText: turn.content },
    }));
    const contribution = { ...base,
      identity: { ...base.identity, contributionId: `synthetic-scale-contribution:${factor}`,
        previousContributionId: `synthetic-scale-contribution:${factor - 1}`,
        contributionDigest: logicalDigest({ factor, axis, items }) },
      scientificContent: { ...base.scientificContent,
        normalizedUnderstanding: turn.content,
        candidateObjects: items,
        candidateRelations: [], temporalElements: [],
      },
    };
    project = confirmResearchProjectContribution({ contribution, current: project,
      projectId: session.projectId, authority: session.projectAuthority, confirmedAt: turn.createdAt });
  }
  if (![1, 2, 5, 10].includes(factor)) continue;
  parseVerifiedProjectSnapshot(project, session.sessionId);
  const ref = { projectId: project.projectId, versionId: project.versionId, projectDigest: project.projectDigest };
  const chatBody = {
    apiVersion: "1.0.0", requestKind: "USER_TURN", evaluatePersistentDelta: true,
    observabilityContext: { sessionId: session.sessionId, conversationId: session.conversationId,
      turnId: `synthetic-scale-continuation:${factor}`, clientRequestId: `synthetic-scale-request:${factor}`, testSessionId: null },
    conversation: { conversationId: session.conversationId, language: "fr", turns: [
      ...session.runtimeTurns, { turnId: `synthetic-scale-continuation:${factor}`, role: "USER", content: "on continue" },
    ] },
    currentProject: null, currentProjectRef: ref,
    // Keep the measured CURRENT composition as a size envelope. Its V1 binding is
    // not asserted as valid for later synthetic revisions.
    studyProposalContext: session.studyProposal,
  };
  samples.push({ factor, version: project.revision,
    canonicalProjectBytes: bytes(project), snapshotUploadBytes: bytes({ sessionId: session.sessionId, project }),
    chatRequestBytes: bytes(chatBody), projectRefBytes: bytes(ref),
    currentObjects: project.canonicalState?.objects.filter((item) => item.actuality === "CURRENT").length,
    currentRelations: project.canonicalState?.relations.filter((item) => item.actuality === "CURRENT").length });
}
if (session.project.projectDigest !== initialDigest || JSON.stringify(session.project) !== initialJson) {
  throw new Error("HUMAN_PROJECT_MUTATED");
}
console.log(JSON.stringify({ sourceDigest: initialDigest, snapshotMaxBytes: PROJECT_SNAPSHOT_MAX_BYTES,
  canonicalHumanProjectUnchanged: true, samples }));
