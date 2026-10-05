import "@testing-library/jest-dom";
import { afterEach, beforeEach, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { installTestProjectSessionLocks } from "../features/protocol-designer/functional-reset/__tests__/project-session-lock-fixture";

// jsdom lacks Web Locks. Model the supported browser's exclusive scheduling,
// not persistence success: real storage/codec/Project validation still run.
// Unsupported/acquisition-failure tests explicitly remove/deny this primitive.
beforeEach(installTestProjectSessionLocks);
// jsdom does not expose SubtleCrypto. Use the real native SHA-256 primitive,
// never a successful hash stub, for the browser DOC byte-integrity boundary.
beforeEach(() => { if (!globalThis.crypto?.subtle) vi.stubGlobal("crypto", webcrypto); });
afterEach(() => vi.unstubAllGlobals());

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
