import type { StudyDeliverableArtifact } from "./study-deliverable-contract.js";
import { DOCUMENT_PROJECTION_RENDERER_VERSION } from "./types.js";
import { DOC_ARCHIVE_CONTRACT, type DocumentGenerationBody, type DocumentNativeGeneration } from "./generation-persistence.js";

/** Freeze the existing DOC owner's files/IDs, without a new renderer or document identity. */
export const freezeDocumentGeneration = async (input: {
  native: DocumentNativeGeneration; artifacts: readonly Pick<StudyDeliverableArtifact, "artifactId" | "files">[];
  sha256: (text: string) => string | Promise<string>;
  buildCommit?: string | null; renderOrigin: "GENERATION_TIME";
}): Promise<DocumentGenerationBody> => ({
  contract: DOC_ARCHIVE_CONTRACT, native: input.native,
  rendererVersion: DOCUMENT_PROJECTION_RENDERER_VERSION,
  buildCommit: input.buildCommit ?? null,
  files: await Promise.all(input.artifacts.flatMap(artifact => artifact.files.map(async file => ({
    ...file, artifactId: artifact.artifactId, byteLength: new TextEncoder().encode(file.content).byteLength,
    sha256: await input.sha256(file.content), renderOrigin: input.renderOrigin,
  })))),
});
