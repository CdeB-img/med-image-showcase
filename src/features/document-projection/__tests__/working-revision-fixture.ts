import { confirmResearchProjectContribution, authorizeResearchProjectDocumentHandoff, buildProjectContextSnapshot } from "../../research-project-construction";
import { COLCHICINE_INITIAL, COLCHICINE_MODIFICATION, COLCHICINE_LATER_MODIFICATION, makeFunctionalResetContribution } from "../../protocol-designer/functional-reset/__tests__/functional-reset-fixtures";
import { memoryProjectSnapshotStore } from "../../protocol-designer/functional-reset/__tests__/fixtures/memory-project-snapshot-store";
import { createPostgresDocumentArchive, documentArchiveCapacity, docSha256, type DocumentArchiveAccess } from "../../../../server/protocol-designer-document-archive";
import { DRCI_DOCUMENT_KINDS, materializeDrciDraftPack, prepareDrciDraftPack } from "../drci-draft-pack";
import { buildCanonicalCrfPackage } from "../study-deliverable-portfolio";
import { refreshFunctionalResetDocumentPortfolio } from "../functional-reset-boundary";
import { DOC_ARCHIVE_CONTRACT, documentNativeGeneratedAt, type DocumentGenerationBody } from "../generation-persistence";
import { archiveSqlFixture } from "./archive-sql-fixture";

/** SYNTHETIC_CURRENT_CONTRACT. Native PRJ/DOC builders preserve meaningful
 * infarction/colchicine/placebo/IRM science. These tests qualify editorial
 * persistence and binding, not clinical acceptability or provider output. */
export const workingRevisionFixture = async (options: { monocentric?: boolean } = {}) => {
  const sessionId = "protocol-designer-session:working-revision";
  const identity = { sessionId, clientAddress: "192.0.2.1" };
  const authority = { actorRef: "synthetic-owner", mandateRef: "PROJECT_OWNER" as const,
    authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const, verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const };
  const initial = options.monocentric ? COLCHICINE_INITIAL.replace("multicentrique", "monocentrique") : COLCHICINE_INITIAL;
  const turns = [initial, COLCHICINE_MODIFICATION, COLCHICINE_LATER_MODIFICATION].map((content, index) => ({
    turnId: `source-${index}`, role: "USER" as const, content, createdAt: `2026-10-07T10:0${index}:00.000Z`,
  }));
  const contribution = (source: typeof turns) => {
    const result = makeFunctionalResetContribution(source);
    if (options.monocentric) for (const items of Object.values(result.scientificContent)) {
      if (Array.isArray(items)) for (const item of items) {
        if ("itemId" in item && item.itemId === "design:multicentric") item.content = "étude monocentrique";
      }
    }
    if (options.monocentric) result.scientificContent.normalizedUnderstanding = result.scientificContent.normalizedUnderstanding.replace("multicentrique", "monocentrique");
    return result;
  };
  const project1 = confirmResearchProjectContribution({ contribution: contribution(turns.slice(0, 1)),
    current: null, projectId: `${sessionId}:research-project`, authority, confirmedAt: turns[0].createdAt });
  const project2 = confirmResearchProjectContribution({ contribution: contribution(turns.slice(0, 2)),
    current: project1, projectId: project1.projectId, authority, confirmedAt: turns[1].createdAt });
  const project3 = confirmResearchProjectContribution({ contribution: contribution(turns),
    current: project2, projectId: project1.projectId, authority, confirmedAt: turns[2].createdAt });
  const snapshots = memoryProjectSnapshotStore(), fixture = archiveSqlFixture();
  const register = async (project: typeof project1, proof: string | null) => {
    const registration = await snapshots.persist(identity, project, proof);
    fixture.recordSnapshot(docSha256(sessionId), project);
    return { identity, project: registration.ref, proof: registration.proof } satisfies DocumentArchiveAccess;
  };
  const access1 = await register(project1, null), access2 = await register(project2, access1.proof);
  const archive = createPostgresDocumentArchive("postgres://offline", snapshots, documentArchiveCapacity({}), fixture.sql);
  const commit = async (access: DocumentArchiveAccess, requestId: string, body: DocumentGenerationBody) => {
    await archive.admit(access, { requestId, requestSha256: docSha256(JSON.stringify(body)),
      generatedAt: documentNativeGeneratedAt(body.native), reservedBytes: 1_000_000 });
    return (await archive.commit(access, requestId, body)).generation;
  };
  const generation = async (project: typeof project1, access: DocumentArchiveAccess) => {
    const generatedAt = `2026-10-07T11:0${project.revision}:00.000Z`;
    const handoffDecision = authorizeResearchProjectDocumentHandoff({ project, authority, confirmedAt: generatedAt });
    const projection = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision, requestedAt: generatedAt, generateProtocol: true }).projections.at(-1)!;
    const source = { handoffDecision, protocolProjection: projection, crf: buildCanonicalCrfPackage(project) };
    const packet = prepareDrciDraftPack(project, source);
    // Temporal elements belong to their native qualifications, not to objects.
    // Include the owner's display projection so V2/V3 scientific timing changes
    // are actually present in the paragraph exercised by reconciliation tests.
    const prose = [...buildProjectContextSnapshot({ project }).objects.map(object => object.content),
      ...project.sections.flatMap(section => section.elements.filter(element => element.sourceProposedType === "TEMPORAL_ELEMENT").map(element => element.content))].join(". ");
    const pack = materializeDrciDraftPack({ documents: DRCI_DOCUMENT_KINDS.map(kind => ({ kind,
      title: `Document de qualification ${kind}`, sections: [{ title: "Source scientifique adoptée",
        paragraphs: [prose + (kind === "PROTOCOL_SYNOPSIS" ? " Qualification éditoriale déterministe, sans validation clinique ou réglementaire.".repeat(80) : "")],
        sourceRefs: packet.sourceFacts.map(fact => fact.ref) }], missingElements: ["Effectif et procédures détaillées de sécurité ouverts"] })),
      crfRows: source.crf.fields.map((field, index) => ({ variableRef: field.canonicalVariableId, variableId: `F_${index}`, label: field.label,
        domain: "Mesures", visit: "À préciser", definition: field.label, entryType: "Texte", unit: field.unit, categories: null,
        dataOrigin: "UNSPECIFIED", source: "À préciser", required: "À préciser", condition: null, derivedFrom: [], derivation: null,
        controls: [], analysisImpact: null, specificationStatus: "UNSPECIFIED" })) }, { project, packet, generatedAt });
    // Native source only. No rendered file is necessary to qualify this primitive.
    const body = (native: DocumentGenerationBody["native"]): DocumentGenerationBody => ({
      contract: DOC_ARCHIVE_CONTRACT, native, files: [], rendererVersion: "1.0.0", buildCommit: null,
    });
    const projectionBody = body({ family: "TEMPLATE", value: projection });
    await commit(access, `projection-${project.revision}`, projectionBody);
    const nativeBody = body({ family: "DRCI", value: pack });
    const ref = await commit(access, `generation-${project.revision}`, nativeBody);
    return { ref, body: nativeBody, projection, projectionBody };
  };
  const g1 = await generation(project1, access1), g2 = await generation(project2, access2);
  const createInput = { revisionId: "document-working-revision:qualification", baseGenerationId: g2.ref.generationId,
    baseGenerationBodyDigest: g2.ref.bodySha256, nativeDocumentRef: "PROTOCOL_FULL" };
  return { sessionId, identity, archive, owner: archive.workingRevisions!, snapshots, fixture, project1, project2, project3,
    access1, access2, register, generation, g1, g2, createInput };
};
