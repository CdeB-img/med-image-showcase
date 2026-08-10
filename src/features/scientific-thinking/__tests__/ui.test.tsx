import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ScientificThinkingView from "../ScientificThinkingView";
import { createScientificThinkingSession } from "../session";
import { makeThinkingInput } from "./fixtures";

describe("ST-001 — projection UX", () => {
  afterEach(cleanup);

  it("rend la conversation, le statut candidat et la progression sans formulaire de protocole", () => {
    const session = createScientificThinkingSession(makeThinkingInput());
    render(<ScientificThinkingView session={session} onChange={() => undefined} onReturnToUnderstand={() => undefined} onEnterResearchDesign={() => undefined} />);
    expect(screen.getByRole("heading", { name: "NOXIA structure votre idée sans décider à votre place" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Questions scientifiques candidates" })).toBeInTheDocument();
    expect(screen.getByText("1 · Construire la question")).toBeInTheDocument();
    expect(screen.queryByText(/plan statistique détaillé/i)).not.toBeInTheDocument();
  });

  it("permet la confirmation humaine native au clavier", () => {
    let current = createScientificThinkingSession(makeThinkingInput());
    const view = render(<ScientificThinkingView session={current} onChange={(next) => { current = next; }} onReturnToUnderstand={() => undefined} onEnterResearchDesign={() => undefined} />);
    const button = screen.getByRole("button", { name: "Confirmer cette question" });
    expect(button.tagName).toBe("BUTTON");
    fireEvent.change(screen.getByLabelText("Acteur humain"), { target: { value: "Responsable scientifique" } });
    fireEvent.change(screen.getByLabelText("Mandat"), { target: { value: "mandate:st-ui-test" } });
    fireEvent.click(button);
    expect(current.selectedQuestionId).toBe("ST-Q-001");
    view.unmount();
  });
});
