import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import SegmentationIRM from "@/pages/SegmentationIRM";
import AnalyseDICOM from "@/pages/AnalyseDICOM";
import QuantificationCT from "@/pages/QuantificationCT";
import RecalageMultimodal from "@/pages/RecalageMultimodal";
import BasesMulticentriques from "@/pages/BasesMulticentriques";
import BiomarqueursIRMCardiaqueEssais from "@/pages/BiomarqueursIRMCardiaqueEssais";
import ECVMappingCardiaque from "@/pages/ECVMappingCardiaque";

import PerfusionMetaboliqueNeuro from "@/pages/PerfusionMetaboliqueNeuro";
import CorelabEC from "@/pages/CorelabEC";

import Header from "@/components/Header";

import Index from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/**
 * Scroll to top on route change
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter basename="/">
        <ScrollToTop />

        {/* 🔹 NAVBAR GLOBALE */}
        <Header />

        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projets" element={<Projects />} />
          <Route path="/projet/:id" element={<ProjectDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/segmentation-irm" element={<SegmentationIRM />} />
          <Route path="/analyse-dicom" element={<AnalyseDICOM />} />
          <Route path="/quantification-ct" element={<QuantificationCT />} />
          <Route path="/recalage-multimodal" element={<RecalageMultimodal />} />
          <Route path="/bases-multicentriques" element={<BasesMulticentriques />} />
          <Route path="/corelab-essais-cliniques" element={<CorelabEC />} />
          <Route path="/biomarqueurs-irm-cardiaque-essais-cliniques" element={<BiomarqueursIRMCardiaqueEssais />} />
          <Route path="/ecv-mapping-t1-t2-irm-cardiaque" element={<ECVMappingCardiaque />} />
          <Route path="/perfusion-metabolique-neuro-imagerie" element={<PerfusionMetaboliqueNeuro />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>

      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;