import { beforeAll, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import App from "@/App";

beforeAll(() => {
  window.scrollTo = vi.fn();
});

it("route cmro2 renders route body", () => {
  window.history.pushState({}, "", "/cmro2-imagerie-cerebrale");
  render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );

  const text = document.body.textContent || "";
  expect(text).toMatch(/Réponse courte/i);
  expect(text).toMatch(/metabolisme cerebral/i);
});
