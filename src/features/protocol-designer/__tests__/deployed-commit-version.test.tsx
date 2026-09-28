import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DeployedCommitVersion from "../DeployedCommitVersion";
import { deployedCommitVersion } from "../product-development-version";

const SHA = "a06879d5d8375438eeff00fcc32473e1d91a7d14";

afterEach(cleanup);

describe("Protocol Designer deployed commit version", () => {
  it("displays exactly eight characters while retaining the full build SHA in the title", () => {
    expect(deployedCommitVersion(SHA)).toEqual({ fullSha: SHA, label: "a06879d5" });
    render(<DeployedCommitVersion sha={SHA} />);
    expect(screen.getByTestId("protocol-designer-deployed-version")).toHaveTextContent(/^a06879d5$/);
    expect(screen.getByTestId("protocol-designer-deployed-version")).toHaveAttribute("title", SHA);
  });

  it.each([undefined, "", "a06879d5", "not-a-commit"])("shows no potentially stale SHA for missing or invalid metadata: %s", (sha) => {
    expect(deployedCommitVersion(sha)).toEqual({ fullSha: null, label: "unknown" });
    render(<DeployedCommitVersion sha={sha ?? ""} />);
    expect(screen.getByTestId("protocol-designer-deployed-version")).toHaveTextContent(/^unknown$/);
    expect(screen.getByTestId("protocol-designer-deployed-version")).not.toHaveAttribute("title");
    cleanup();
  });
});
