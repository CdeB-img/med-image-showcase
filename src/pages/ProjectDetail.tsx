// ============================================================
// src/pages/ProjectDetail.tsx
// ============================================================

import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import SliceViewer from "@/components/SliceViewer";
import RegistrationViewer from "@/components/RegistrationViewer";
import PerfusionSegmentationViewer from "@/components/PerfusionSegmentationViewer";
import CardiacViewer from "@/components/CardiacViewer";
import CTScanViewer from "@/components/CTScanViewer";
import NeuroOncoViewer from "@/components/NeuroOncoViewer";
import OutilsViewer from "@/components/OutilsViewer";
import Footer from "@/components/Footer";

import { getProjectById, getAdjacentProjects } from "@/data/projects";
 ============================================================
// CONSTANTES
// ============================================================

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

// ============================================================
// HELPERS
// ============================================================

const slices = (basePath: string, count = 3): string[] =>
  Array.from({ length: count }, (_, i) =>
    `${RAW_BASE}/${basePath}/slice_${String(i).padStart(3, "0")}.png`
  );

// ============================================================
// RECALAGE DATA (SOURCE UNIQUE)
// ============================================================

const multimodalPairs = [
  {
    reference: `${RAW_BASE}/recalage/maxip/slice_000.png`,
    registered: `${RAW_BASE}/recalage/ct/slice_000.png`,
    label: "Axial 1",
  },
  {
    reference: `${RAW_BASE}/recalage/maxip/slice_001.png`,
    registered: `${RAW_BASE}/recalage/ct/slice_001.png`,
    label: "Axial 2",
  },
  {
    reference: `${RAW_BASE}/recalage/maxip/slice_002.png`,
    registered: `${RAW_BASE}/recalage/ct/slice_002.png`,
    label: "Axial 3",
  },
];

const monomodalPairs = [
  {
    reference: `${RAW_BASE}/recalage/mdiff/slice_000.png`,
    registered: `${RAW_BASE}/recalage/mflair/slice_000.png`,
    label: "Axial 1",
  },
  {
    reference: `${RAW_BASE}/recalage/mdiff/slice_001.png`,
    registered: `${RAW_BASE}/recalage/mflair/slice_001.png`,
    label: "Axial 2",
  },
  {
    reference: `${RAW_BASE}/recalage/mdiff/slice_002.png`,
    registered: `${RAW_BASE}/recalage/mflair/slice_002.png`,
    label: "Axial 3",
  },
];

// ============================================================
// QC DATA
// ============================================================

const qcPairs = [
  {
    label: "TMAX",
    native: slices("perfusion/exemple/Tmax_seq", 16),
    mask: slices("perfusion/exemple/MASK_TMAX6", 16),
  },
  {
    label: "CBF30",
    native: slices("perfusion/exemple/rCBF_seq", 16),
    mask: slices("perfusion/exemple/MASK_CBF30", 16),
  },
  {
    label: "CBF60",
    native: slices("perfusion/exemple/rCBF_seq", 16),
    mask: slices("perfusion/exemple/MASK_CBF60", 16),
  },
  {
    label: "OEF",
    native: slices("perfusion/exemple/OEF_seq", 16),
    mask: slices("perfusion/exemple/MASK_OEF", 16),
  },
  {
    label: "CMRO2",
    native: slices("perfusion/exemple/rCMRO2_seq", 16),
    mask: slices("perfusion/exemple/MASK_CMRO2", 16),
  },
  {
    label: "DIFF",
    native: slices("diffusion/native", 16),
    mask: slices("diffusion/mask", 16),
  },
];

// ============================================================
// COMPONENT
// ============================================================

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const project = id ? getProjectById(id) : undefined;
  const { prev, next } = id
    ? getAdjacentProjects(id)
    : { prev: null, next: null };

  if (!project) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Project not found</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">

          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Accueil
              </Button>
            </Link>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={!prev}
                onClick={() => prev && navigate(`/projet/${prev.id}`)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={!next}
                onClick={() => next && navigate(`/projet/${next.id}`)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* ================= PERFUSION SEGMENTATION ================= */}
          {project.id === "perfusion-segmentation" && (
            <PerfusionSegmentationViewer
              pairs={qcPairs}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
            />
          )}

          {/* ================= RECALAGE ================= */}
          {project.id === "recalage" && (
            <RegistrationViewer
              multimodalPairs={multimodalPairs}
              monomodalPairs={monomodalPairs}
              initialOpacity={0.5}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4"
            />
          )}

          {/* ================= CARDIAC ================= */}
          {project.id === "cardiac" && (
            <CardiacViewer
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
            />
          )}

          {/* ================= CT SCAN ================= */}
          {project.id === "ct-scan" && (
            <CTScanViewer
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
            />
          )}

          {/* ================= NEURO-ONCO ================= */}
          {project.id === "neuro-onco" && (
            <NeuroOncoViewer
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
            />
          )}

          {/* ================= OUTILS SUR MESURE ================= */}
          {project.id === "outils" && (
            <OutilsViewer
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
            />
          )}

          {/* ================= AUTRES PROJETS ================= */}
          {project.id !== "perfusion-segmentation" &&
           project.id !== "recalage" &&
           project.id !== "cardiac" &&
           project.id !== "ct-scan" &&
           project.id !== "neuro-onco" &&
           project.id !== "outils" && (
            <div className="grid lg:grid-cols-2 gap-8">
              <section className="space-y-6">
                <h1 className="text-3xl font-bold">{project.title}</h1>

                <div className="flex gap-2">
                  <Badge variant="outline">{project.modality}</Badge>
                  <Badge variant="secondary">{project.analysisType}</Badge>
                </div>

                <p>{project.description}</p>
              </section>

              <section className="sticky top-8">
                <SliceViewer
                  nativeSlices={project.nativeSlices}
                  processedSlices={project.processedSlices}
                  useSliderOverlay={project.useSliderOverlay}
                />
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectDetail;