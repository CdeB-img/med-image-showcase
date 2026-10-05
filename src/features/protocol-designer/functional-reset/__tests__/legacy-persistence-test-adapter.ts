import type { FunctionalResetSession, SessionPersistenceResult, SessionSave } from "../session";

/** CURRENT_STRUCTURAL_INVARIANT: keep historical test observers/failed-save
 * mocks at a TEST-ONLY seam. No scientific fixture/assertion is changed; the
 * observer still executes (including real Storage writes/exceptions), and the
 * native product persistence boundary receives only an explicit M1 verdict.
 * Tests of the verdict boundary itself must not use this adapter.
 */
export const explicitTestSave = (observe: (session: FunctionalResetSession) => SessionPersistenceResult | boolean | void): SessionSave =>
  session => {
    const result = observe(session);
    return result && typeof result === "object" ? result
      : result === false ? { scientificPersisted: false, error: new Error("PROJECT_PERSISTENCE_FAILED") }
        : { scientificPersisted: true, navigationPointer: "NOT_APPLICABLE" };
  };
