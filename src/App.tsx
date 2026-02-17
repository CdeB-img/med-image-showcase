import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Header from "@/components/Header";
import GlobalEntitySchema from "@/components/GlobalEntitySchema";

const Index = lazy(() => import("./pages/Index"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const SegmentationIRM = lazy(() => import("@/pages/SegmentationIRM"));
const AnalyseDICOM = lazy(() => import("@/pages/AnalyseDICOM"));
const QuantificationCT = lazy(() => import("@/pages/QuantificationCT"));
const RecalageMultimodal = lazy(() => import("@/pages/RecalageMultimodal"));
const BasesMulticentriques = lazy(() => import("@/pages/BasesMulticentriques"));
const CorelabEC = lazy(() => import("@/pages/CorelabEC"));
const BiomarqueursIRMCardiaqueEssais = lazy(() => import("@/pages/BiomarqueursIRMCardiaqueEssais"));
const ECVMappingCardiaque = lazy(() => import("@/pages/ECVMappingCardiaque"));
const PerfusionMetaboliqueNeuro = lazy(() => import("@/pages/PerfusionMetaboliqueNeuro"));
const IngenierieImagerieQuantitative = lazy(() => import("@/pages/IngenierieImagerieQuantitative"));
const CTQuantitatifAvance = lazy(() => import("@/pages/CTQuantitatifAvance"));
const CTPerfusionQuantitative = lazy(() => import("@/pages/CTPerfusionQuantitative"));
const IRMImagerieQuantitative = lazy(() => import("@/pages/IRMImagerieQuantitative"));
const CTImagerieQuantitative = lazy(() => import("@/pages/CTImagerieQuantitative"));
const MethodologieImagerieQuantitative = lazy(() => import("@/pages/MethodologieImagerieQuantitative"));
const APropos = lazy(() => import("@/pages/APropos"));
const Prestations = lazy(() => import("@/pages/Prestations"));
const Expertise = lazy(() => import("@/pages/Expertise"));
const ReferencesPublications = lazy(() => import("@/pages/ReferencesPublications"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

const RouteFallback = () => (
  <div className="px-4 py-24">
    <div className="mx-auto max-w-5xl h-24 rounded-xl border border-border bg-card/40 animate-pulse" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter basename="/">
        <ScrollToTop />

        {/* 🔹 NAVBAR GLOBALE */}
        <Header />
        <GlobalEntitySchema />

        <Suspense fallback={<RouteFallback />}>
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
            <Route path="/ingenierie-imagerie-quantitative" element={<IngenierieImagerieQuantitative />} />
            <Route path="/ct-quantitatif-avance-imagerie-spectrale" element={<CTQuantitatifAvance />} />
            <Route path="/ct-perfusion-quantitative-avc" element={<CTPerfusionQuantitative />} />
            <Route path="/irm-imagerie-quantitative" element={<IRMImagerieQuantitative />} />
            <Route path="/ct-imagerie-quantitative" element={<CTImagerieQuantitative />} />
            <Route path="/methodologie-imagerie-quantitative" element={<MethodologieImagerieQuantitative />} />
            <Route path="/a-propos" element={<APropos />} />
            <Route path="/prestations-imagerie-medicale" element={<Prestations />} />
            <Route path="/expertise" element={<Expertise />} />
            <Route path="/references-publications" element={<ReferencesPublications />} />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;
