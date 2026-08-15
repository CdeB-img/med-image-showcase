import fs from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { DEMONSTRATOR_SCENARIOS } from "../fixtures";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

describe("P-WEB-02 — preserved demonstrator foundations after P-WEB-04R", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("keeps the three admitted deterministic scenarios", () => {
    expect(DEMONSTRATOR_SCENARIOS.map((item) => item.reasoningBook.id)).toEqual(["RB-003", "RB-004", "RB-005"]);
  });
  it("keeps their exact owners", () => {
    expect(DEMONSTRATOR_SCENARIOS.map((item) => item.program.id)).toEqual(["NXP-000001", "NXP-000002", "NXP-000003"]);
  });
  it("starts from the scientific question instead of an internal corpus", () => {
    renderDemo();
    expect(screen.getByRole("heading", { name: "Construisons votre projet scientifique" })).toBeInTheDocument();
    expect(screen.queryByText("RB-003")).not.toBeInTheDocument();
  });
  it("retains the public landing and private demo routes", () => {
    const app = read("src/App.tsx");
    expect(app).toContain('path="/protocol-designer"');
    expect(app).toContain('path="/protocol-designer/demo"');
  });
  it("keeps the demo out of the sitemap", () => {
    const sitemap = read("public/sitemap.xml");
    expect(sitemap).toContain("https://noxia-imagerie.fr/protocol-designer</loc>");
    expect(sitemap).not.toContain("https://noxia-imagerie.fr/protocol-designer/demo");
  });
  it("keeps the demo noindex follow", () => expect(read("src/pages/ProtocolDesignerDemo.tsx")).toContain('<meta name="robots" content="noindex, follow" />'));
  it("keeps evidence, limitations and controversies in every fixture", () => {
    expect(DEMONSTRATOR_SCENARIOS.every((item) => item.evidence.length && item.limitations.length && item.controversy)).toBeTruthy();
  });
  it("keeps acquisition parameters absent from fixtures", () => {
    expect(read("src/features/protocol-designer/fixtures.ts")).not.toMatch(/\b(?:TR|TE|dose|ml\/kg)\s*[:=]\s*\d+/i);
  });
  it("keeps the external Editorial Engine out of the guided page", () => expect(read("src/pages/ProtocolDesignerDemo.tsx")).not.toContain("@editorial-engine"));
  it("keeps the reset confirmation", () => {
    renderDemo();
    expect(screen.getByRole("button", { name: /Réinitialiser cet espace/ })).toBeInTheDocument();
  });
});
