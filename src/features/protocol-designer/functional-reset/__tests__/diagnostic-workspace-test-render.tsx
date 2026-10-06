import { fireEvent, render, screen, type RenderOptions } from "@testing-library/react";

/** LEGACY_COMPATIBILITY / CURRENT_STRUCTURAL_INVARIANT: the governed internal
 * Review/owner UI remains supported in diagnostics. Standard is now protected
 * separately by the source-backed single-action two-version vertical suite.
 * This helper changes presentation mode via the real UI, not product logic. */
export function openWorkspaceDiagnostic() {
  const button = screen.queryByRole("button", { name: "Diagnostic technique" });
  if (button) {
    fireEvent.click(screen.getByLabelText("Plus d’options"));
    fireEvent.click(button);
  }
}
export const renderDiagnosticWorkspace = (ui: Parameters<typeof render>[0], options?: RenderOptions) => {
  const view = render(ui, options);
  openWorkspaceDiagnostic();
  return view;
};
