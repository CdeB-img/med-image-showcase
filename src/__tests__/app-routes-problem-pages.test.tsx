import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@vercel/analytics/react", () => ({ Analytics: () => null }));

const renderAt = async (path: string) => {
  window.history.pushState({}, "", path);
  const App = (await import("@/App")).default;
  return render(<App />);
};

describe("App routes for previously blank pages", () => {
  it("renders CMRO2 route", async () => {
    await renderAt("/cmro2-imagerie-cerebrale");
    expect(await screen.findByText(/CMRO2 en imagerie cerebrale/i)).toBeInTheDocument();
  });

  it("renders OEF route", async () => {
    await renderAt("/oef-imagerie-cerebrale");
    expect(await screen.findByText(/OEF en imagerie cerebrale/i)).toBeInTheDocument();
  });

  it("renders perfusion route", async () => {
    await renderAt("/perfusion-metabolique-neuro-imagerie");
    expect(await screen.findByText(/Quantification de la perfusion/i)).toBeInTheDocument();
  });

  it("renders corelab route", async () => {
    await renderAt("/corelab-essais-cliniques");
    expect(await screen.findByText(/Core Lab IRM/i)).toBeInTheDocument();
  });

  it("renders CT spectral route", async () => {
    await renderAt("/ct-quantitatif-avance-imagerie-spectrale");
    expect(await screen.findByText(/CT quantitatif avancé/i)).toBeInTheDocument();
  });

  it("renders CT perfusion route", async () => {
    await renderAt("/ct-perfusion-quantitative-avc");
    expect(await screen.findByText(/CT Perfusion quantitative/i)).toBeInTheDocument();
  });

  it("renders biomarqueurs route", async () => {
    await renderAt("/biomarqueurs-irm-cardiaque-essais-cliniques");
    expect(await screen.findByText(/Biomarqueurs IRM cardiaques/i)).toBeInTheDocument();
  });

  it("renders ECV route", async () => {
    await renderAt("/ecv-mapping-t1-t2-irm-cardiaque");
    expect(await screen.findByText(/ECV, T1 & T2 Mapping/i)).toBeInTheDocument();
  });
});
