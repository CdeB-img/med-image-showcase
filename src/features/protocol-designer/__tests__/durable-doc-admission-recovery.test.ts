import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPostgresProtocolDesignerDurableGuard } from "../../../../server/protocol-designer-durable-guard";

const fixture = vi.hoisted(() => ({ row: null as Record<string, unknown> | null,
  operations: [] as Record<string, unknown>[], queries: [] as string[] }));
vi.mock("postgres", () => ({ default: () => Object.assign(async (parts: TemplateStringsArray) => {
  const query = parts.join("?").replace(/\s+/g, " "); fixture.queries.push(query);
  if (query.includes("from noxia_durable.public_bridge_admission")) return fixture.row ? [fixture.row] : [];
  if (query.includes("from noxia_durable.public_provider_operation")) return fixture.operations;
  throw new Error("DOC_RECOVERY_MUST_ONLY_READ_EXISTING_EVIDENCE");
}, { end: async () => {} }) }));
afterEach(() => { fixture.row = null; fixture.operations = []; fixture.queries = []; });

// CURRENT_STRUCTURAL_INVARIANT: admission state/authentication and no dispatch.
// This fixture does not assert DOC scientific validity or substitute a DOC pack.
const setup = () => {
  const hash = (text: string) => createHash("sha256").update(text).digest("hex");
  const input = { sessionId: "protocol-designer-session:synthetic", clientRequestId: "drci-draft:ke1-1234567890abcdef:turn:synthetic",
    headers: { "x-forwarded-for": "192.0.2.50" } };
  fixture.row = { session_key_hash: hash(input.sessionId), client_request_id_hash: hash(input.clientRequestId),
    client_key_hash: hash("192.0.2.50"), state: "ADMITTED", created_at: new Date().toISOString() };
  const guard = createPostgresProtocolDesignerDurableGuard("postgres://offline-only");
  return { input, guard, read: () => guard.readDocumentGenerationResult!(input) };
};
describe("existing durable DOC admission recovery (read only)", () => {
  it("distinguishes usable completed result from work genuinely in flight", async () => {
    const run = setup();
    expect(await run.read()).toEqual({ state: "IN_PROGRESS" });
    Object.assign(fixture.row!, { state: "COMPLETED", response_status: 200, response_body: { documentDraftPack: { ref: "STRUCTURAL_PLACEHOLDER_NOT_A_VALID_PACK" } } });
    expect(await run.read()).toEqual({ state: "COMPLETED", response: fixture.row!.response_body });
    expect(fixture.queries.every(query => query.trim().startsWith("select"))).toBe(true);
  });
  it("returns terminal failure, never a usable pack or permission to call the provider", async () => {
    const run = setup(); Object.assign(fixture.row!, { state: "COMPLETED", response_status: 422, response_body: { error: { code: "DRCI_DRAFT_FAILED" } } });
    expect(await run.read()).toEqual({ state: "FAILED", errorCode: "DRCI_DRAFT_FAILED" });
  });
  it("preserves physical-operation uncertainty even when a failed HTTP result was finalized", async () => {
    const run = setup(); Object.assign(fixture.row!, { state: "COMPLETED", response_status: 503, response_body: { error: { code: "PROVIDER_FAILED" } } });
    fixture.operations = [{ state: "QUALIFICATION_INVALID" }];
    expect(await run.read()).toEqual({ state: "UNKNOWN" });
  });
  it.each(["UNKNOWN_AFTER_DISPATCH", "COUNT_UNKNOWN_AFTER_DISPATCH", "INPUT_TOKEN_DIVERGENCE", "QUALIFICATION_INVALID"])(
    "never unlocks %s", async state => {
      const run = setup(); fixture.operations = [{ state }]; expect(await run.read()).toEqual({ state: "UNKNOWN" });
    });
  it("does not treat an expired lease or a missing completed body as a recoverable success", async () => {
    const run = setup(); fixture.row!.created_at = "2000-01-01T00:00:00.000Z";
    fixture.operations = [{ state: "CONSUMED", dispatch_lease_expires_at: "2000-01-01T00:00:00.000Z" }];
    expect(await run.read()).toEqual({ state: "UNKNOWN" });
    Object.assign(fixture.row!, { state: "COMPLETED", response_status: 200, response_body: null });
    expect(await run.read()).toEqual({ state: "UNKNOWN" });
  });
  it.each(["session_key_hash", "client_request_id_hash", "client_key_hash"])("rejects a foreign %s", async key => {
    const run = setup(); fixture.row![key] = "foreign";
    expect(await run.read()).toEqual({ state: "REJECTED", status: 404, code: "DOC_ARCHIVE_RECOVERY_NOT_FOUND" });
  });
  it("fails closed when the existing evidence is absent", async () => {
    const run = setup(); fixture.row = null;
    expect(await run.read()).toEqual({ state: "REJECTED", status: 404, code: "DOC_ARCHIVE_RECOVERY_NOT_FOUND" });
  });
});
