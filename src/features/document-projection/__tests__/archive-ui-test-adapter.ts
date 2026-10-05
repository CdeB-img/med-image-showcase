import { fireEvent, screen, within } from "@testing-library/react";
import { expect } from "vitest";
import type { FunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import { offlineArchiveClient } from "./offline-archive-client";

/** CURRENT_STRUCTURAL_INVARIANT: exercise the real lazy view and archive.
 * No scientific fixture is substituted; native content comes from each suite. */
export const openArchivedProtocolPreview = async (ordinal?: number) => {
  await screen.findByTestId("durable-document-history");
  const scope = ordinal ? within(await screen.findByTestId(`archived-generation-${ordinal}`)) : screen;
  const buttons = await scope.findAllByRole("button", { name: "Ouvrir protocol-complet.html" });
  fireEvent.click(buttons[0]);
  return screen.findByTestId("functional-protocol-preview");
};
export const archivedProtocol = async (session: FunctionalResetSession, id = session.documentArchive!.currentProjectionId!) => {
  const { body } = await offlineArchiveClient(session.sessionId, session.project!).body(id);
  expect(body.native.family).toBe("TEMPLATE");
  if (body.native.family !== "TEMPLATE") throw new Error("EXPECTED_NATIVE_TEMPLATE");
  return body.native.value;
};
