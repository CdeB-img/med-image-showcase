import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  appendDrciDocumentGeneration,
  DRCI_DOCUMENT_KINDS,
  normalizeDrciDraftPackGenerations,
  type DrciDraftPack,
} from "@/features/document-projection/drci-draft-contract";
import type { StudyDeliverablePortfolio, StudyDeliverableStatus } from "@/features/document-projection";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession } from "../session";
import StudyDeliverableWorkspace, { documentGenerationsForProject } from "../StudyDeliverableWorkspace";

const pack = (
  projectId: string,
  projectVersion: string,
  projectDigest: string,
  generatedAt: string,
  marker: string,
): DrciDraftPack => ({
  contract: "DRCI_DRAFT_PACK_V1",
  editorialVersion: "CONCISE_V2",
  project: { projectId, projectVersion, projectDigest },
  generatedAt,
  protocolProjectionId: `projection:${marker}`,
  handoffDecisionDigest: `handoff:${marker}`,
  sourceFacts: [],
  canonicalCrfPackageRef: `crf:${marker}`,
  documents: DRCI_DOCUMENT_KINDS.map((kind) => ({
    kind,
    title: `${kind} ${marker}`,
    sections: [{ title: "Contenu", paragraphs: [`contenu-exact-${marker}-${kind}`], sourceRefs: [] }],
    missingElements: [],
  })),
  crfRows: [],
  packDigest: `pack:${marker}`,
  crossConsistency: "SOURCE_BINDINGS_CHECKED_HUMAN_REVIEW_PENDING",
  projectWriteAuthorized: false,
  reusedProtocolEvidenceRef: null,
  preparationBinding: `preparation:${marker}`,
});

const portfolio = (
  source: DrciDraftPack,
  marker: string,
  status: StudyDeliverableStatus = "PARTIAL",
): StudyDeliverablePortfolio => {
  const artifact = {
    artifactId: `artifact:${marker}`,
    artifactVersion: "1.0.0" as const,
    kind: "PROTOCOL_FULL" as const,
    sourceProject: source.project,
    name: `PROTOCOL_FULL ${marker}`,
    status,
    preview: marker,
    files: [{ fileName: `protocol-${marker}.html`, format: "HTML" as const, mimeType: "text/html;charset=utf-8", content: `fichier-exact-${marker}` }],
    sourceObjectRefs: [],
    canonicalVariableRefs: [],
    missingDecisions: [],
    limitations: [],
  };
  const portfolioId = `portfolio:${marker}`;
  return {
    contract: "V1_STUDY_DELIVERABLE_PORTFOLIO",
    contractVersion: "1.0.0",
    portfolioId,
    projectRef: source.project,
    generatedAt: source.generatedAt,
    owner: "DOC-001",
    artifacts: [artifact],
    manifest: {
      manifestVersion: "1.0.0",
      portfolioId,
      generatedAt: source.generatedAt,
      project: source.project,
      projectionOwner: "DOC-001",
      sourceOfTruth: false,
      projectWriteAuthorized: false,
      regulatoryComplianceClaim: false,
      redcapProfile: "REDCAP_DATA_DICTIONARY_CSV_BASE_PROFILE_1.0",
      redcapInstanceCompatibility: "REQUIRES_LOCAL_REDCAP_VALIDATION",
      artifacts: [{ artifactId: artifact.artifactId, artifactVersion: artifact.artifactVersion, kind: artifact.kind,
        sourceProject: artifact.sourceProject, status: artifact.status,
        files: artifact.files.map(({ fileName, format, mimeType }) => ({ fileName, format, mimeType })),
        sourceObjectRefs: [], canonicalVariableRefs: [] }],
      variableMappings: [],
      canonicalCrfPackageRef: source.canonicalCrfPackageRef,
    },
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };
};

const readBlob = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(reader.error);
  reader.onload = () => resolve(String(reader.result));
  reader.readAsText(blob);
});

describe("document generation history", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("assigns G1/G2 per exact Project version without mutating or renumbering prior generations", () => {
    const v1g1 = pack("project:A", "project:A:version:1", "digest:1", "2026-09-24T08:00:00.000Z", "V1-G1");
    const v1g2 = pack("project:A", "project:A:version:1", "digest:1", "2026-09-24T09:00:00.000Z", "V1-G2");
    const afterG1 = appendDrciDocumentGeneration([], v1g1, portfolio(v1g1, "V1-G1"));
    const frozenG1 = JSON.stringify(afterG1[0]);
    const afterG2 = appendDrciDocumentGeneration(afterG1, v1g2, portfolio(v1g2, "V1-G2", "PROFILE_REQUIRED"));

    expect(afterG2.map((item) => item.documentGeneration?.generationNumber)).toEqual([1, 2]);
    expect(new Set(afterG2.map((item) => item.documentGeneration?.generationId)).size).toBe(2);
    expect(JSON.stringify(afterG2[0])).toBe(frozenG1);
    expect(afterG2[1].documentGeneration?.portfolioSnapshot?.artifacts[0].status).toBe("PROFILE_REQUIRED");
  });

  it("keeps G1/G2 stable when G3 is appended and starts again at G1 for Project V2", () => {
    const v1g1 = pack("project:A", "project:A:version:1", "digest:1", "2026-09-24T08:00:00.000Z", "V1-G1");
    const v1g2 = pack("project:A", "project:A:version:1", "digest:1", "2026-09-24T09:00:00.000Z", "V1-G2");
    const v1g3 = pack("project:A", "project:A:version:1", "digest:1", "2026-09-24T10:00:00.000Z", "V1-G3");
    const v2g1 = pack("project:A", "project:A:version:2", "digest:2", "2026-09-24T11:00:00.000Z", "V2-G1");
    const two = appendDrciDocumentGeneration(
      appendDrciDocumentGeneration([], v1g1, portfolio(v1g1, "V1-G1")),
      v1g2,
      portfolio(v1g2, "V1-G2"),
    );
    const idsBefore = two.map((item) => item.documentGeneration!.generationId);
    const three = appendDrciDocumentGeneration(two, v1g3, portfolio(v1g3, "V1-G3"));
    const four = appendDrciDocumentGeneration(three, v2g1, portfolio(v2g1, "V2-G1"));
    const history = documentGenerationsForProject(four, "project:A");

    expect(four.slice(0, 2).map((item) => item.documentGeneration!.generationId)).toEqual(idsBefore);
    expect(history.map((item) => [item.projectVersionId, item.generationNumber])).toEqual([
      ["project:A:version:1", 1],
      ["project:A:version:1", 2],
      ["project:A:version:1", 3],
      ["project:A:version:2", 1],
    ]);
    expect(history.map((item) => item.projectDigest)).toEqual(["digest:1", "digest:1", "digest:1", "digest:2"]);
  });

  it("persists generation IDs across a browser reload", () => {
    const session = createFunctionalResetSession();
    const first = pack(session.projectId, `${session.projectId}:version:1`, "digest:1", session.updatedAt, "RELOAD-G1");
    const generations = appendDrciDocumentGeneration([], first, portfolio(first, "RELOAD-G1"));
    persistFunctionalResetSession(localStorage, { ...session, drciDraftPacks: generations });
    const reloaded = loadFunctionalResetSession(localStorage, undefined, true);

    expect(reloaded.drciDraftPacks?.[0].documentGeneration).toEqual(generations[0].documentGeneration);
    expect(reloaded.drciDraftPacks?.[0].documentGeneration?.portfolioSnapshot?.artifacts[0].files[0].content)
      .toBe("fichier-exact-RELOAD-G1");
  });

  it("stabilizes legacy packs deterministically without inventing a missing portfolio snapshot", () => {
    const legacy1 = pack("project:A", "project:A:version:1", "digest:1", "2026-09-24T08:00:00.000Z", "LEGACY-1");
    const legacy2 = pack("project:A", "project:A:version:1", "digest:1", "2026-09-24T09:00:00.000Z", "LEGACY-2");
    const firstRead = normalizeDrciDraftPackGenerations([legacy1, legacy2]);
    const secondRead = normalizeDrciDraftPackGenerations(JSON.parse(JSON.stringify([legacy1, legacy2])) as DrciDraftPack[]);

    expect(secondRead.map((item) => item.documentGeneration?.generationId))
      .toEqual(firstRead.map((item) => item.documentGeneration?.generationId));
    expect(firstRead.map((item) => item.documentGeneration?.generationNumber)).toEqual([1, 2]);
    expect(firstRead.every((item) => item.documentGeneration?.identitySource === "LEGACY_PACK_MIGRATION")).toBe(true);
    expect(firstRead.every((item) => item.documentGeneration?.portfolioSnapshot === null)).toBe(true);
  });

  it("opens and downloads the exact historical generation, never the current Project portfolio", async () => {
    const v1g1 = pack("project:A", "project:A:version:1", "digest:1", "2026-09-24T08:00:00.000Z", "V1-G1");
    const v1g2 = pack("project:A", "project:A:version:1", "digest:1", "2026-09-24T09:00:00.000Z", "V1-G2");
    const v2g1 = pack("project:A", "project:A:version:2", "digest:2", "2026-09-24T10:00:00.000Z", "V2-G1");
    const generations = appendDrciDocumentGeneration(
      appendDrciDocumentGeneration(
        appendDrciDocumentGeneration([], v1g1, portfolio(v1g1, "V1-G1")),
        v1g2,
        portfolio(v1g2, "V1-G2"),
      ),
      v2g1,
      portfolio(v2g1, "V2-G1"),
    );
    const createObjectURL = vi.fn((_blob: Blob) => "blob:historical-generation");
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    render(<StudyDeliverableWorkspace portfolio={portfolio(v2g1, "V2-G1")} documentPacks={generations}
      projectId="project:A" onClose={() => undefined} />);

    fireEvent.click(screen.getByText("Project V1"));
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir PROTOCOL_FULL V1-G1 — Project V1, génération 1" }));
    expect(screen.getByTitle("Project V1 · Génération 1 · PROTOCOL_FULL V1-G1")).toHaveAttribute("srcdoc", "fichier-exact-V1-G1");

    fireEvent.click(screen.getByRole("button", { name: "Télécharger protocol-V1-G1.html — Project V1, génération 1" }));
    const downloaded = createObjectURL.mock.calls.at(-1)?.[0] as Blob;
    expect(await readBlob(downloaded)).toBe("fichier-exact-V1-G1");
    expect(await readBlob(createObjectURL.mock.calls.at(-1)?.[0] as Blob)).not.toContain("V2-G1");
  });
});
