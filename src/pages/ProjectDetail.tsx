// ============================================================
// src/pages/ProjectDetail.tsx
// ============================================================

import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";

import RegistrationViewer from "@/components/RegistrationViewer";
import PerfusionSegmentationViewer from "@/components/PerfusionSegmentationViewer";
import CardiacViewer from "@/components/CardiacViewer";
import CTScanViewer from "@/components/CTScanViewer";
import NeuroOncoViewer from "@/components/NeuroOncoViewer";
import OutilsViewer from "@/components/OutilsViewer";

import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { getProjectById, getAdjacentProjects } from "@/data/projects";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";

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
  const projectCanonical = `https://noxia-imagerie.fr/projet/${id ?? ""}`;

  if (!project) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h1>Projet non trouvé</h1>
      </main>
    );
  }

  const projectJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: projectCanonical,
    image: project.thumbnailUrl,
    about: [project.modality, project.analysisType],
    keywords: project.technologies.join(", "),
    creator: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Projets", item: "https://noxia-imagerie.fr/projets" },
      { "@type": "ListItem", position: 3, name: project.title, item: projectCanonical },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{project.title} | NOXIA</title>

        <meta name="description" content={project.description} />
        <meta name="robots" content="index, follow" />

        <link
          rel="canonical"
          href={projectCanonical}
        />

        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="NOXIA Imagerie" />
        <meta property="og:title" content={`${project.title} | NOXIA`} />
        <meta property="og:description" content={project.description} />
        <meta
          property="og:url"
          content={projectCanonical}
        />

        {project.thumbnailUrl && (
          <meta property="og:image" content={project.thumbnailUrl} />
        )}

        <script type="application/ld+json">{JSON.stringify(projectJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Projets", path: "/projets" },
                { label: project.title }
              ]}
            />

            <ExpertiseHero
              badge="Projet démonstrateur"
              badgeIcon={Workflow}
              title={project.title}
              description={project.description}
              chips={[
                project.modality,
                project.analysisType,
                ...project.technologies.slice(0, 2),
              ]}
              actions={[
                { label: "Discuter de ce projet", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir tous les projets", to: "/projets", variant: "secondary", icon: ArrowLeft },
              ]}
            />

            {/* NAVIGATION */}
            <div className="flex items-center justify-between">
              <Link to="/projets">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Tous les projets
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
              <PerfusionSegmentationViewer pairs={qcPairs} hideHero />
            )}

            {project.id === "recalage" && (
              <RegistrationViewer
                multimodalPairs={multimodalPairs}
                monomodalPairs={monomodalPairs}
                hideHero
              />
            )}

            {project.id === "neuro-onco" && <NeuroOncoViewer hideHero />}
            {project.id === "cardiac" && <CardiacViewer hideHero />}
            {project.id === "ct-scan" && <CTScanViewer hideHero />}
            {project.id === "outils" && <OutilsViewer hideHero />}

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ProjectDetail;
