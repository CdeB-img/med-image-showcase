import { beforeAll, describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import App from "@/App";
import CMRO2Imagerie from "@/pages/CMRO2Imagerie";
import OEFImagerie from "@/pages/OEFImagerie";
import PerfusionMetaboliqueNeuro from "@/pages/PerfusionMetaboliqueNeuro";
import CTQuantitatifAvance from "@/pages/CTQuantitatifAvance";
import CTPerfusionQuantitative from "@/pages/CTPerfusionQuantitative";
import CorelabEC from "@/pages/CorelabEC";
import BiomarqueursIRMCardiaqueEssais from "@/pages/BiomarqueursIRMCardiaqueEssais";
import ECVMappingCardiaque from "@/pages/ECVMappingCardiaque";

beforeAll(() => {
  // jsdom does not implement scrollTo
  window.scrollTo = vi.fn();
});

const wrap = (ui: React.ReactElement) => (
  <HelmetProvider>
    <MemoryRouter>{ui}</MemoryRouter>
  </HelmetProvider>
);

describe("Direct page renders", () => {
  it("renders all affected pages directly", () => {
    const pages = [
      <CMRO2Imagerie key="cmro2" />,
      <OEFImagerie key="oef" />,
      <PerfusionMetaboliqueNeuro key="perfusion" />,
      <CorelabEC key="corelab" />,
      <BiomarqueursIRMCardiaqueEssais key="bio" />,
      <ECVMappingCardiaque key="ecv" />,
      <CTQuantitatifAvance key="ctspectral" />,
      <CTPerfusionQuantitative key="ctperfusion" />,
    ];

    for (const page of pages) {
      expect(() => render(wrap(page))).not.toThrow();
      cleanup();
    }
  });
});

describe("App route renders", () => {
  const checkRoute = async (path: string, mustContain: RegExp) => {
    window.history.pushState({}, "", path);
    render(
      <HelmetProvider>
        <App />
      </HelmetProvider>
    );

    const bodyText = document.body.textContent || "";
    expect(bodyText).toMatch(mustContain);
    cleanup();
  };

  it("all affected routes are resolved in App", async () => {
    await checkRoute("/cmro2-imagerie-cerebrale", /CMRO2/i);
    await checkRoute("/oef-imagerie-cerebrale", /OEF/i);
    await checkRoute("/perfusion-metabolique-neuro-imagerie", /perfusion/i);
    await checkRoute("/corelab-essais-cliniques", /Core Lab/i);
    await checkRoute("/biomarqueurs-irm-cardiaque-essais-cliniques", /Biomarqueurs/i);
    await checkRoute("/ecv-mapping-t1-t2-irm-cardiaque", /ECV/i);
    await checkRoute("/ct-quantitatif-avance-imagerie-spectrale", /CT quantitatif avanc/i);
    await checkRoute("/ct-perfusion-quantitative-avc", /CT Perfusion/i);
  });
});
