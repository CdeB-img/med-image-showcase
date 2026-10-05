import "@testing-library/jest-dom";
import { afterEach, beforeEach, vi } from "vitest";
import { installTestProjectSessionLocks } from "../features/protocol-designer/functional-reset/__tests__/project-session-lock-fixture";

// jsdom lacks Web Locks. Model the supported browser's exclusive scheduling,
// not persistence success: real storage/codec/Project validation still run.
// Unsupported/acquisition-failure tests explicitly remove/deny this primitive.
beforeEach(installTestProjectSessionLocks);
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
