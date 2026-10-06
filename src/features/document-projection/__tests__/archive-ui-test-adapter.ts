import { fireEvent, screen, within, waitFor } from "@testing-library/react";
import { expect } from "vitest";
import type { FunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import { offlineArchiveClient } from "./offline-archive-client";

/** CURRENT_STRUCTURAL_INVARIANT: explicit internal projection request, not a
 * provider-backed document generation. Uses the actual diagnostic control. */
export const requestTechnicalProjection = async () => {
  if (!screen.queryByTestId("protocol-designer-development-diagnostics")) {
    fireEvent.click(screen.getByLabelText("Plus d’options"));
    fireEvent.click(screen.getByRole("button", { name: "Diagnostic technique" }));
  }
  const button = screen.getByRole("button", { name: "Calculer la projection technique" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
};

/** CURRENT_STRUCTURAL_INVARIANT: exercise the diagnostic-only lazy projection
 * view. SUPERSEDED_CONTRACT: projections are not user document generations.
 * No scientific fixture is substituted; native content comes from each suite. */
export const openArchivedProtocolPreview = async (ordinal?: number) => {
  await screen.findByTestId("durable-document-history");
  if (!screen.queryByRole("button", { name: "Ouvrir la projection technique" })) {
    fireEvent.click(screen.getByLabelText("Plus d’options"));
    fireEvent.click(screen.getByRole("button", { name: "Diagnostic technique" }));
  }
  const scope = within(screen.getByRole("complementary", { name: "Projection technique interne" }));
  fireEvent.click(scope.getByRole("button", { name: ordinal ? "Ouvrir la projection technique précédente" : "Ouvrir la projection technique" }));
  return screen.findByTestId("functional-protocol-preview");
};
export const archivedProtocol = async (session: FunctionalResetSession, id = session.documentArchive!.currentProjectionId!) => {
  const { body } = await offlineArchiveClient(session.sessionId, session.project!).body(id);
  expect(body.native.family).toBe("TEMPLATE");
  if (body.native.family !== "TEMPLATE") throw new Error("EXPECTED_NATIVE_TEMPLATE");
  return body.native.value;
};
