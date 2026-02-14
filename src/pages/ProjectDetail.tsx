// ============================================================
// src/pages/ProjectDetail.tsx
// ============================================================

import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import RegistrationViewer from "@/components/RegistrationViewer";
import PerfusionSegmentationViewer from "@/components/PerfusionSegmentationViewer";
import CardiacViewer from "@/components/CardiacViewer";
import CTScanViewer from "@/components/CTScanViewer";
import NeuroOncoViewer from "@/components/NeuroOncoViewer";
import OutilsViewer from "@/components/OutilsViewer";

import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { getProjectById, getAdjacentProjects } from "@/data/projects";

// ============================================================
// CONSTANTES
// ============================================================

const RAW_BASE = "/images";

// ============================================================
// HELPERS
// ============================================================

const slices = (basePath: string, count = 3): string[] =>
  Array.from({ length: count }, (_, i) =>
    `${RAW_BASE}/${basePath}/slice_${String(i).padStart(3, "0")}.webp`
  );

// ============================================================
// RECALAGE DATA
// ============================================================

const multimodalPairs = [
  {
    reference: `${RAW_BASE}/recalage/maxip/slice_000.webp`,
    registered: `${RAW_BASE}/recalage/ct/slice_000.webp`,
    label: "Axial 1",
  },
  {
    reference: `${RAW_BASE}/recalage/maxip/slice_001.webp`,
    registered: `${RAW_BASE}/recalage/ct/slice_001.webp`,
    label: "Axial 2",
  },
  {
    reference: `${RAW_BASE}/recalage/maxip/slice_002.webp`,
    registered: `${RAW_BASE}/recalage/ct/slice_002.webp`,
    label: "Axial 3",
  },
];

const monomodalPairs = [
  {
    reference: `${RAW_BASE}/recalage/mdiff/slice_000.webp`,
    registered: `${RAW_BASE}/recalage/mflair/slice_000.webp`,
    label: "Axial 1",
  },
  {
    reference: `${RAW_BASE}/recalage/mdiff/slice_001.webp`,
    registered: `${RAW_BASE}/recalage/mflair/slice_001.webp`,
    label: "Axial 2",
  },
  {
    reference: `${RAW_BASE}/recalage/mdiff/slice_002.webp`,
    registered: `${RAW_BASE}/recalage/mflair/slice_002.webp`,
    label: "Axial 3",
  },
];

// ============================================================
// PERFUSION QC DATA
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
        <h1>Projet non trouvé</h1>
      </main>
    );
  }
  return (
    <>
      <Helmet>
        <title>{project.title} | NOXIA</title>

        <meta name="description" content={project.description} />
        <meta name="robots" content="index, follow" />

        <link
          rel="canonical"
          href={`https://noxia-imagerie.fr/projet/${project.id}`}
        />

        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="NOXIA Imagerie" />
        <meta property="og:title" content={`${project.title} | NOXIA`} />
        <meta property="og:description" content={project.description} />
        <meta
          property="og:url"
          content={`https://noxia-imagerie.fr/projet/${project.id}`}
        />

        {project.thumbnailUrl && (
          <meta property="og:image" content={project.thumbnailUrl} />
        )}
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <main className="flex-1 py-8">
          <div className="container px-4 md:px-6">

            {/* NAVIGATION */}
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



            {/* ============================= */}
            {/* DYNAMIC VIEWERS */}
            {/* ============================= */}

            {project.id === "perfusion-segmentation" && (
              <PerfusionSegmentationViewer pairs={qcPairs} />
            )}

            {project.id === "recalage" && (
              <RegistrationViewer
                multimodalPairs={multimodalPairs}
                monomodalPairs={monomodalPairs}
              />
            )}

            {project.id === "neuro-onco" && <NeuroOncoViewer />}
            {project.id === "cardiac" && <CardiacViewer />}
            {project.id === "ct-scan" && <CTScanViewer />}
            {project.id === "outils" && <OutilsViewer />}

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ProjectDetail;