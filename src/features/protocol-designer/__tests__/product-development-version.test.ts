import { describe, expect, it } from "vitest";
import { formatProductDevelopmentVersion } from "../product-development-version";

describe("Protocol Designer development version marker", () => {
  it("shows the seven-character SHA supplied by the build", () => {
    const gitSha = "153E87093F3216D71BDD3BA18499E7EC0443628E";

    expect(formatProductDevelopmentVersion(gitSha)).toBe("DEV · 153e870");
  });

  it.each([undefined, null, "", "not-a-sha"])("falls back safely to LOCAL for %s", (value) => {
    const marker = formatProductDevelopmentVersion(value);

    expect(marker).toBe("DEV · LOCAL");
    expect(marker).not.toMatch(/undefined|null/i);
  });
});
