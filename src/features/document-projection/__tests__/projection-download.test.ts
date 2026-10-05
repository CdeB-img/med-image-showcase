import { describe, expect, it, vi, afterEach } from "vitest";
import { downloadProjection } from "../renderer";
import { projectDocument } from "../template-integration";
import { makeAuthorizedProject, makeTemplateProjectionRequest } from "./fixtures";

afterEach(() => vi.unstubAllGlobals());

// CURRENT_STRUCTURAL_INVARIANT: passive export / immutability.
// Unrouted DocumentProjectionView presentation assertions are superseded.
// Semantic rendering, provenance and diffs: contracts-history-renderers.test.ts.
describe("native DOC passive download", () => {
  it("exports both formats without changing the native scientific projection", () => {
    const result = projectDocument(makeTemplateProjectionRequest(makeAuthorizedProject()));
    if (!result.ok) throw new Error("PROJECTION_FAILED");
    const before = JSON.stringify(result.projection);
    const createObjectURL = vi.fn(() => "blob:doc"), revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    try {
      downloadProjection(result.projection, "MARKDOWN");
      downloadProjection(result.projection, "HTML");
      expect(createObjectURL).toHaveBeenCalledTimes(2);
      expect(revokeObjectURL).toHaveBeenCalledTimes(2);
      expect(click).toHaveBeenCalledTimes(2);
      expect(JSON.stringify(result.projection)).toBe(before);
    } finally { click.mockRestore(); }
  });
});
