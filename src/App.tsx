import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense, Component, type ErrorInfo, type ReactNode } from "react";
import Header from "@/components/Header";
import GlobalEntitySchema from "@/components/GlobalEntitySchema";
import CorelabEC from "@/pages/CorelabEC";
import BiomarqueursIRMCardiaqueEssais from "@/pages/BiomarqueursIRMCardiaqueEssais";
import ECVMappingCardiaque from "@/pages/ECVMappingCardiaque";
import PerfusionMetaboliqueNeuro from "@/pages/PerfusionMetaboliqueNeuro";
import CMRO2Imagerie from "@/pages/CMRO2Imagerie";
import OEFImagerie from "@/pages/OEFImagerie";
import CTQuantitatifAvance from "@/pages/CTQuantitatifAvance";
import CTPerfusionQuantitative from "@/pages/CTPerfusionQuantitative";

const Index = lazy(() => import("./pages/Index"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const SegmentationIRM = lazy(() => import("@/pages/SegmentationIRM"));
const AnalyseDICOM = lazy(() => import("@/pages/AnalyseDICOM"));
const QuantificationCT = lazy(() => import("@/pages/QuantificationCT"));
const RecalageMultimodal = lazy(() => import("@/pages/RecalageMultimodal"));
const BasesMulticentriques = lazy(() => import("@/pages/BasesMulticentriques"));
const IngenierieImagerieQuantitative = lazy(() => import("@/pages/IngenierieImagerieQuantitative"));
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

type RouteRenderBoundaryProps = {
  children: ReactNode;
};

type RouteRenderBoundaryState = {
  hasError: boolean;
  message: string;
};

class AppShellBoundary extends Component<RouteRenderBoundaryProps, RouteRenderBoundaryState> {
  state: RouteRenderBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: unknown): RouteRenderBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Erreur de rendu inconnue",
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("App shell render error:", error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-destructive/30 bg-card/70 p-6 space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Erreur de rendu globale</h1>
          <p className="text-sm text-muted-foreground">
            Une erreur JavaScript empêche l’affichage complet du site. Recharge la page, puis ouvre la console navigateur si le problème persiste.
          </p>
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground break-all">
            {this.state.message || "Aucun message d’erreur disponible"}
          </div>
        </div>
      </div>
    );
  }
}

class RouteRenderBoundary extends Component<RouteRenderBoundaryProps, RouteRenderBoundaryState> {
  state: RouteRenderBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: unknown): RouteRenderBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Erreur de rendu inconnue",
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Route render error:", error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-destructive/30 bg-card/70 p-6 space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Erreur de rendu de la page</h1>
          <p className="text-sm text-muted-foreground">
            Une erreur JavaScript empêche l’affichage de cette route. Recharge la page, puis ouvre la console navigateur si le problème persiste.
          </p>
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground break-all">
            {this.state.message || "Aucun message d’erreur disponible"}
          </div>
        </div>
      </div>
    );
  }
}

function RouteRenderBoundaryWithReset({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <RouteRenderBoundary key={location.pathname}>
      {children}
    </RouteRenderBoundary>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter basename="/">
        <ScrollToTop />

        <AppShellBoundary>
          {/* 🔹 NAVBAR GLOBALE */}
          <Header />
          <GlobalEntitySchema />

          <RouteRenderBoundaryWithReset>
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
              <Route path="/perfusion-metabolique-neuro-imagerie/CMRO2Imagerie" element={<Navigate to="/cmro2-imagerie-cerebrale" replace />} />
              <Route path="/cmro2-imagerie-cerebrale" element={<CMRO2Imagerie />} />
              <Route path="/perfusion-metabolique-neuro-imagerie/OEFImagerie" element={<Navigate to="/oef-imagerie-cerebrale" replace />} />
              <Route path="/oef-imagerie-cerebrale" element={<OEFImagerie />} />
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

              {/* Legacy/case variants -> canonical lowercase routes */}
              <Route path="/Corelab-essais-cliniques" element={<Navigate to="/corelab-essais-cliniques" replace />} />
              <Route path="/Corelab-essais-cliniques/" element={<Navigate to="/corelab-essais-cliniques" replace />} />
              <Route path="/Biomarqueurs-irm-cardiaque-essais-cliniques" element={<Navigate to="/biomarqueurs-irm-cardiaque-essais-cliniques" replace />} />
              <Route path="/Biomarqueurs-irm-cardiaque-essais-cliniques/" element={<Navigate to="/biomarqueurs-irm-cardiaque-essais-cliniques" replace />} />
              <Route path="/Ct-quantitatif-avance-imagerie-spectrale" element={<Navigate to="/ct-quantitatif-avance-imagerie-spectrale" replace />} />
              <Route path="/Ct-quantitatif-avance-imagerie-spectrale/" element={<Navigate to="/ct-quantitatif-avance-imagerie-spectrale" replace />} />
              <Route path="/Ct-perfusion-quantitative-avc" element={<Navigate to="/ct-perfusion-quantitative-avc" replace />} />
              <Route path="/Ct-perfusion-quantitative-avc/" element={<Navigate to="/ct-perfusion-quantitative-avc" replace />} />
              <Route path="/Ecv-mapping-t1-t2-irm-cardiaque" element={<Navigate to="/ecv-mapping-t1-t2-irm-cardiaque" replace />} />
              <Route path="/Ecv-mapping-t1-t2-irm-cardiaque/" element={<Navigate to="/ecv-mapping-t1-t2-irm-cardiaque" replace />} />
              <Route path="/Perfusion-metabolique-neuro-imagerie" element={<Navigate to="/perfusion-metabolique-neuro-imagerie" replace />} />
              <Route path="/Perfusion-metabolique-neuro-imagerie/" element={<Navigate to="/perfusion-metabolique-neuro-imagerie" replace />} />
              <Route path="/Cmro2-imagerie-cerebrale" element={<Navigate to="/cmro2-imagerie-cerebrale" replace />} />
              <Route path="/Cmro2-imagerie-cerebrale/" element={<Navigate to="/cmro2-imagerie-cerebrale" replace />} />
              <Route path="/Oef-imagerie-cerebrale" element={<Navigate to="/oef-imagerie-cerebrale" replace />} />
              <Route path="/Oef-imagerie-cerebrale/" element={<Navigate to="/oef-imagerie-cerebrale" replace />} />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RouteRenderBoundaryWithReset>
        </AppShellBoundary>

      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;
