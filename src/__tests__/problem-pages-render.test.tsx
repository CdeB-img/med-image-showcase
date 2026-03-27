import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import CMRO2Imagerie from "@/pages/CMRO2Imagerie";
import OEFImagerie from "@/pages/OEFImagerie";
import PerfusionMetaboliqueNeuro from "@/pages/PerfusionMetaboliqueNeuro";
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

describe("Problem pages render", () => {
  it("renders CMRO2", () => {
    expect(() => render(wrap(<CMRO2Imagerie />))).not.toThrow();
  });

  it("renders OEF", () => {
    expect(() => render(wrap(<OEFImagerie />))).not.toThrow();
  });

  it("renders Perfusion", () => {
    expect(() => render(wrap(<PerfusionMetaboliqueNeuro />))).not.toThrow();
  });

  it("renders CT spectral", () => {
    expect(() => render(wrap(<CTQuantitatifAvance />))).not.toThrow();
  });

  it("renders CT perfusion", () => {
    expect(() => render(wrap(<CTPerfusionQuantitative />))).not.toThrow();
  });

  it("renders CorelabEC", () => {
    expect(() => render(wrap(<CorelabEC />))).not.toThrow();
  });

  it("renders Biomarqueurs", () => {
    expect(() => render(wrap(<BiomarqueursIRMCardiaqueEssais />))).not.toThrow();
  });

  it("renders ECV", () => {
    expect(() => render(wrap(<ECVMappingCardiaque />))).not.toThrow();
  });
});
