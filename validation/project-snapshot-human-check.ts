import { readFileSync } from "node:fs";
import { decodeSessionStorage } from "../src/features/protocol-designer/functional-reset/session-storage-codec";
import { parseVerifiedProjectSnapshot } from "../server/protocol-designer-project-snapshot";
import { parseProductBridgeRequest, relevantProjectContext, validatePersistentProjectDelta } from "../src/features/protocol-designer/product-bridge";
import type { FunctionalResetSession } from "../src/features/protocol-designer/functional-reset/session";

const source = process.argv[2];
if (!source) throw new Error("HUMAN_EXPORT_PATH_REQUIRED");
const expectedDigest = process.argv[3] ?? "ke1-818493a24316bd66";
const exported = JSON.parse(readFileSync(source, "utf8")) as { matches: Array<[string, string]> };
const sessions = exported.matches.map(([, raw]) => decodeSessionStorage(raw) as FunctionalResetSession);
const session = sessions.find((item) => item.project?.projectDigest === expectedDigest);
if (!session?.project) throw new Error("EXACT_HUMAN_PROJECT_NOT_FOUND");
const project = parseVerifiedProjectSnapshot(session.project, session.sessionId);
const ref = { projectId: project.projectId, versionId: project.versionId, projectDigest: project.projectDigest };
const conversation = {
  conversationId: session.conversationId,
  language: "fr",
  turns: [...session.runtimeTurns, { turnId: "offline-continuation", role: "USER", content: "on continue" }],
};
const common = {
  apiVersion: "1.0.0",
  requestKind: "USER_TURN",
  observabilityContext: {
    sessionId: session.sessionId, conversationId: session.conversationId,
    turnId: "offline-continuation", clientRequestId: "offline-continuation", testSessionId: null,
  },
  conversation,
  evaluatePersistentDelta: true,
  studyProposalContext: session.studyProposal,
};
const before = Buffer.byteLength(JSON.stringify({ ...common, currentProject: project }));
const after = Buffer.byteLength(JSON.stringify({ ...common, currentProject: null, currentProjectRef: ref }));
const resolved = parseProductBridgeRequest(JSON.parse(JSON.stringify({ ...common, currentProject: project })));
if (!resolved?.currentProject) throw new Error("EXACT_HUMAN_BRIDGE_PARSE_FAILED");
if (JSON.stringify(relevantProjectContext(resolved.currentProject)) !== JSON.stringify(relevantProjectContext(project))) {
  throw new Error("PROJECT_CONTEXT_CHANGED_AFTER_RESOLUTION");
}
const rawTurn = "Ajouter une variable synthétique de reproductibilité de la mesure ECV.";
const delta = { changes: [{ operation: "ADD", targetSectionId: "MEASUREMENTS", targetProjectRef: null,
  candidateRef: "synthetic:reproducibility", semanticIdentity: "ECV_REPRODUCIBILITY", proposedType: "MEASURED_VARIABLE",
  content: rawTurn, sourceText: rawTurn, polarity: "AFFIRMED", studyRole: null,
  epistemicStatus: "EXPLICIT_USER_STATED", assertionKind: "USER_STATED", proposalSourceText: null, evidenceRefs: [] }],
  relations: [], temporalQualifications: [], expectedVariableOccasions: [] };
const deltaConversation = { conversationId: session.conversationId, language: "fr" as const,
  turns: [{ turnId: "offline-delta", role: "USER" as const, content: rawTurn, createdAt: session.updatedAt }] };
const beforeValidation = validatePersistentProjectDelta(delta, rawTurn, project, deltaConversation);
const afterValidation = validatePersistentProjectDelta(delta, rawTurn, resolved.currentProject, deltaConversation);
if (!beforeValidation.validation.valid || JSON.stringify(beforeValidation) !== JSON.stringify(afterValidation)) {
  throw new Error("PROJECT_DELTA_VALIDATION_CHANGED_AFTER_RESOLUTION");
}
console.log(JSON.stringify({
  sessionId: session.sessionId,
  projectId: project.projectId,
  versionId: project.versionId,
  projectDigest: project.projectDigest,
  currentObjects: project.canonicalState?.objects.filter((item) => item.actuality === "CURRENT").length,
  currentRelations: project.canonicalState?.relations.filter((item) => item.actuality === "CURRENT").length,
  projectBytes: Buffer.byteLength(JSON.stringify(project)),
  snapshotUploadBytes: Buffer.byteLength(JSON.stringify({ sessionId: session.sessionId, project })),
  bodyBefore: before,
  bodyAfter: after,
  bridgeParse: true,
  ownerContextEquivalent: true,
  persistentDeltaEquivalent: true,
}));
