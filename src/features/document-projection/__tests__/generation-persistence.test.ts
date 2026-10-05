import { describe, expect, it } from "vitest";
import { portableDrciFixture } from "./portable-drci-fixture";
import { documentGenerationsForProject } from "../history";
import { documentNativeIdentity, documentNativeProject, documentNativeGeneratedAt, documentNativePredecessor, documentFileManifest } from "../generation-persistence";

describe("DOC archive references preserve native identities", () => {
  it("uses the native pack digest identity, Project binding and exact date", () => {
    const { project, ancestor, polished } = portableDrciFixture();
    const native = { family: "DRCI" as const, value: ancestor };
    expect(documentNativeIdentity(native)).toBe(documentGenerationsForProject([ancestor], project.projectId)[0].documentGenerationId);
    expect(documentNativeProject(native)).toEqual(ancestor.project);
    expect(documentNativeGeneratedAt(native)).toBe(ancestor.generatedAt);
    expect(documentNativePredecessor({ family: "DRCI", value: polished })).toBe(documentNativeIdentity(native));
  });
  it("retains the template identity/series/version/ancestor without a second identity", () => {
    const { source } = portableDrciFixture();
    const native = { family: "TEMPLATE" as const, value: source.protocolProjection };
    const before = JSON.stringify(native.value);
    expect(documentNativeIdentity(native)).toBe(native.value.projectionId);
    expect(documentNativeProject(native)).toEqual(native.value.source);
    expect(documentNativePredecessor(native)).toBe(native.value.priorProjectionId);
    expect(JSON.stringify(native.value)).toBe(before);
  });
  it("excludes export bodies from history manifests", () => {
    expect(documentFileManifest({ artifactId: "native-artifact", fileName: "protocol.html", format: "HTML", mimeType: "text/html",
      content: "<p>ÉCV et limites</p>", byteLength: 21, sha256: "a".repeat(64), renderOrigin: "GENERATION_TIME" })).not.toHaveProperty("content");
  });
});
