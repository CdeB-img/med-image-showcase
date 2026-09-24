import { describe, expect, it } from "vitest";
import type { DrciDraftPack } from "@/features/document-projection/drci-draft-contract";
import { documentGenerationsForProject } from "../StudyDeliverableWorkspace";

const pack = (projectId: string, projectVersion: string, projectDigest: string, generatedAt: string) => ({
  project: { projectId, projectVersion, projectDigest }, generatedAt,
}) as DrciDraftPack;

describe("document generation history", () => {
  it("keeps V1 after V2, with exact Project bindings and stable identities on reload", () => {
    const v1 = pack("project:A", "project:A:version:1", "digest:1", "2026-09-24T08:00:00.000Z");
    const v2 = pack("project:A", "project:A:version:2", "digest:2", "2026-09-24T09:00:00.000Z");
    const other = pack("project:B", "project:B:version:1", "digest:B", "2026-09-24T10:00:00.000Z");
    const before = documentGenerationsForProject([v1, other, v2], "project:A");
    const after = documentGenerationsForProject(JSON.parse(JSON.stringify([v1, other, v2])) as DrciDraftPack[], "project:A");
    expect(after).toEqual(before);
    expect(before.map((item) => [item.documentGenerationId, item.documentVersion, item.projectVersionId, item.projectDigest, item.status])).toEqual([
      ["project:A:document-generation:1", 1, "project:A:version:1", "digest:1", "AVAILABLE"],
      ["project:A:document-generation:2", 2, "project:A:version:2", "digest:2", "AVAILABLE"],
    ]);
    expect(before[0]?.documentDraftPack).toBe(v1);
    expect(before[1]?.documentDraftPack).toBe(v2);
    expect(documentGenerationsForProject([v1, other, v2], "project:B")).toHaveLength(1);
  });
});
