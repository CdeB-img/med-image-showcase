import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import CMRO2Imagerie from "@/pages/CMRO2Imagerie";
import OEFImagerie from "@/pages/OEFImagerie";
import PerfusionMetaboliqueNeuro from "@/pages/PerfusionMetaboliqueNeuro";
import PerfusionCerebrale from "@/pages/PerfusionCerebrale";
import MetabolismeCerebral from "@/pages/MetabolismeCerebral";
import CTQuantitatifAvance from "@/pages/CTQuantitatifAvance";
import CTPerfusionQuantitative from "@/pages/CTPerfusionQuantitative";
import CorelabEC from "@/pages/CorelabEC";
import BiomarqueursIRMCardiaqueEssais from "@/pages/BiomarqueursIRMCardiaqueEssais";
import ECVMappingCardiaque from "@/pages/ECVMappingCardiaque";

const wrap = (ui: React.ReactElement) => (
  <HelmetProvider>
    <MemoryRouter>{ui}</MemoryRouter>
  </HelmetProvider>
);

const renderPage = (ui: React.ReactElement) => render(wrap(ui));

describe("Problem pages render", () => {
  it("renders CMRO2", () => {
    expect(() => renderPage(<CMRO2Imagerie />)).not.toThrow();
  });

  it("renders OEF", () => {
    expect(() => renderPage(<OEFImagerie />)).not.toThrow();
  });

  it("renders Perfusion", () => {
    expect(() => renderPage(<PerfusionMetaboliqueNeuro />)).not.toThrow();
  });

  it("renders Perfusion hub", () => {
    expect(() => renderPage(<PerfusionCerebrale />)).not.toThrow();
  });

  it("renders Metabolisme hub", () => {
    expect(() => renderPage(<MetabolismeCerebral />)).not.toThrow();
  });

  it("renders CT spectral", () => {
    expect(() => renderPage(<CTQuantitatifAvance />)).not.toThrow();
  });

  it("renders CT perfusion", () => {
    expect(() => renderPage(<CTPerfusionQuantitative />)).not.toThrow();
  });

  it("renders CorelabEC", () => {
    expect(() => renderPage(<CorelabEC />)).not.toThrow();
  });

  it("renders Biomarqueurs", () => {
    expect(() => renderPage(<BiomarqueursIRMCardiaqueEssais />)).not.toThrow();
  });

  it("renders ECV", () => {
    expect(() => renderPage(<ECVMappingCardiaque />)).not.toThrow();
  });
});
