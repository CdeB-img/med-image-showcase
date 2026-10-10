import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter } from "react-router-dom";
import { SiteViewport } from "@/App";
import ProjectContinuum from "@/features/protocol-designer/functional-reset/ProjectContinuum";

vi.mock("@/components/Header", () => ({ default: () => <header data-testid="site-header">En-tête de hauteur naturelle</header> }));
afterEach(cleanup);

describe("Protocol Designer viewport — structural contract (geometry verified in Chrome)", () => {
  it("keeps narrow-screen navigation above the content instead of overflowing a thin rail", () => {
    const workspace = readFileSync(resolve(process.cwd(), "src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx"), "utf8");
    expect(workspace).toContain("grid-cols-1 items-start gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]");
    expect(workspace).not.toContain("grid-cols-[5.5rem_minmax(0,1fr)]");
    const conversation = vi.fn();
    const documents = vi.fn();
    render(<ProjectContinuum documentsAvailable documentsOpen={false} disabled={false}
      onConversation={conversation} onDocuments={documents} />);
    const navigation = screen.getByRole("navigation", { name: "Parcours longitudinal du projet" });
    expect(navigation).toHaveClass("self-stretch", "sm:self-start", "sticky");
    expect(screen.getByRole("list")).toHaveClass("flex-row", "sm:flex-col");
    fireEvent.click(screen.getByRole("button", { name: "Documents" }));
    fireEvent.click(screen.getByRole("button", { name: "Conception" }));
    expect(documents).toHaveBeenCalledOnce();
    expect(conversation).toHaveBeenCalledOnce();
  });

  it("constrains only the demo route and releases the shell on public navigation", () => {
    render(<MemoryRouter initialEntries={["/protocol-designer/demo"]}>
      <SiteViewport><Link to="/expertise">Site public</Link><p>Contenu</p></SiteViewport>
    </MemoryRouter>);
    const header = screen.getByTestId("site-header");
    expect(header.parentElement).toHaveClass("protocol-designer-viewport");
    expect(screen.getByText("Contenu").parentElement).toHaveClass("protocol-designer-route");
    fireEvent.click(screen.getByRole("link", { name: "Site public" }));
    expect(header.parentElement).not.toHaveClass("protocol-designer-viewport");
    expect(screen.getByText("Contenu").parentElement).not.toHaveClass("protocol-designer-route");
  });

  it("does not constrain the public Protocol Designer introduction", () => {
    render(<MemoryRouter initialEntries={["/protocol-designer"]}><SiteViewport><p>Introduction</p></SiteViewport></MemoryRouter>);
    expect(screen.getByTestId("site-header").parentElement).not.toHaveClass("protocol-designer-viewport");
  });

  it("uses natural header sizing, shrinkable children and internal scrolling without clipping", () => {
    const css = readFileSync(resolve(process.cwd(), "src/features/protocol-designer/functional-reset/workspace-layout.css"), "utf8");
    expect(css).toContain("grid-template-rows: auto minmax(0, 1fr)");
    expect(css).toContain("height: 100dvh");
    expect(css).toContain("min-height: 0");
    // Must outrank the later Tailwind min-h-96/items-start utilities, not
    // merely contain the right declarations in an ineffective cascade.
    expect(css).toContain(".protocol-designer-viewport .protocol-designer-conversation");
    expect(css).toContain(".protocol-designer-viewport .protocol-designer-workspace-grid");
    expect(css).toContain('data-testid="conversation-scroll-panel"');
    expect(css).toContain('data-testid="conversation-composer"');
    expect(css).toContain('data-testid="document-studio"');
    expect(css).not.toMatch(/overflow(?:-y)?:\s*(?:hidden|clip)\s*;/u);
    expect(css).not.toMatch(/calc\(|\bbody\s*\{|\bhtml\s*\{/u);
    expect(css).toContain("(min-width: 1024px) and (min-height: 480px)");
  });
});
