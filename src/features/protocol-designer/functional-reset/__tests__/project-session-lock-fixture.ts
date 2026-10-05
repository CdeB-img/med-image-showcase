import { vi } from "vitest";

/** CURRENT_STRUCTURAL_INVARIANT: deterministic native-lock scheduling only.
 * The real persistence/codec/Project owners remain exercised, not mocked.
 */
export const createTestProjectSessionLocks = () => {
  const tails = new Map<string, Promise<unknown>>();
  const request = vi.fn(<T>(name: string, options: LockOptions, callback: (lock: Lock) => T | PromiseLike<T>): Promise<T> => {
    if (options.mode !== "exclusive") throw new Error("EXCLUSIVE_LOCK_REQUIRED");
    const pending = (tails.get(name) ?? Promise.resolve()).then(() => callback({ name, mode: "exclusive" }));
    // Rejection releases the native lock; no orphaned application lock state.
    tails.set(name, pending.catch(() => undefined));
    return pending;
  });
  return { request };
};

export const installTestProjectSessionLocks = () => {
  const locks = createTestProjectSessionLocks();
  vi.stubGlobal("navigator", new Proxy(navigator, { get: (target, key) => key === "locks" ? locks : Reflect.get(target, key, target) }));
  return locks;
};
