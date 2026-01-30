// ============================================================
// src/pages/ProjectDetail.tsx
// ============================================================

import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import SliceViewer from "@/components/SliceViewer";
import RegistrationViewer from "@/components/RegistrationViewer";
import QCViewer from "@/components/QCViewer";

import { getProjectById, getAdjacentProjects } from "@/data/projects";

// ============================================================
// CONSTANTES
// ============================================================

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

const PERF_BASE = "perfusion/exemple";

// Chemins URL-encodés (fidèles à l’arborescence Git)
const PATHS = {
  TMAX_NATIVE:
    "Tmax_Basic_(aaif,ctp,dn,moco,mono,ncu,pp)_%23Not_for_clinical_use%23_1025000001",

  CBF_NATIVE:
    "rCBF_(aaif,ctp,dn,moco,mono,ncu,pp)_%23Not_for_clinical_use%23_1034000001",

  OEF_NATIVE:
    "OEF_Model_Based_(aaif,ctp,dn,moco,mono,ncu,pp)_%23Not_for_clini..._1039000001",

  CMRO2_NATIVE:
    "rCMRO2_Model_Based_(aaif,ctp,dn,moco,mono,ncu,pp)_%23Not_for_cl..._1040000001",

  MASK_TMAX: "MASK_TMAX6",
  MASK_CBF30: "MASK_CBF30_SEEDED",
  MASK_CBF60: "MASK_CBF60_SEEDED",
  MASK_OEF: "oef",
  MASK_CMRO2: "MASK_CMRO2_30",
};

// ============================================================
// HELPERS
// ============================================================

const slices = (path: string, start = 0, end = 15): string[] =>
  Array.from({ length: end - start + 1 }, (_, i) =>
    `${RAW_BASE}/${PERF_BASE}/${path}/slice_${String(start + i).padStart(3, "0")}.png`
  );

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

  // ============================================================
  // RECALAGE — DONNÉES
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
  // QC — DONNÉES (FIDÈLES AU VIEWER PYTHON)
  // ============================================================

  const qcPairs = [
    {
      label: "TMAX",
      native: slices(PATHS.TMAX_NATIVE),
      mask: slices(PATHS.MASK_TMAX),
    },
    {
      label: "CBF30",
      native: slices(PATHS.CBF_NATIVE),
      mask: slices(PATHS.MASK_CBF30),
    },
    {
      label: "CBF60",
      native: slices(PATHS.CBF_NATIVE),
      mask: slices(PATHS.MASK_CBF60),
    },
    {
      label: "OEF",
      native: slices(PATHS.OEF_NATIVE),
      mask: slices(PATHS.MASK_OEF),
    },
    {
      label: "CMRO2",
      native: slices(PATHS.CMRO2_NATIVE),
      mask: slices(PATHS.MASK_CMRO2),
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="min-h-screen py-8">
      <div className="container px-4 md:px-6">

        {/* Navigation haute */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
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

        {/* ================= QC PROJECT ================= */}
        {project.id === "qc" && (
          <div className="space-y-8 animate-fade-in">

            <header className="space-y-4 max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold">
                {project.title}
              </h1>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/50 text-primary">
                  {project.modality}
                </Badge>
                <Badge variant="secondary">
                  {project.analysisType}
                </Badge>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 text-sm font-mono bg-secondary/50 border border-border rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </header>

            <QCViewer
              pairs={qcPairs}
              patientName="Example patient"
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
            />
          </div>
        )}

        {/* ================= AUTRES PROJETS ================= */}
        {project.id !== "qc" && (
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

            <section className="space-y-6 animate-fade-in">
              <header className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {project.title}
                </h1>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    {project.modality}
                  </Badge>
                  <Badge variant="secondary">
                    {project.analysisType}
                  </Badge>
                </div>
              </header>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-muted-foreground">
                  Description
                </h2>
                <p className="leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-muted-foreground">
                  Technologies
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1.5 text-sm font-mono bg-secondary/50 border border-border rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              <div className="sticky top-8">
                <h2 className="text-lg font-semibold text-muted-foreground mb-4">
                  Visualization
                </h2>

                {project.id !== "recalage" && (
                  <SliceViewer
                    nativeSlices={project.nativeSlices}
                    processedSlices={project.processedSlices}
                    useSliderOverlay={project.useSliderOverlay}
                    className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4"
                  />
                )}

                {project.id === "recalage" && (
                  <RegistrationViewer
                    multimodalPairs={multimodalPairs}
                    monomodalPairs={monomodalPairs}
                    initialOpacity={0.5}
                    className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4"
                  />
                )}
              </div>
            </section>
          </div>
        )}

        {/* Navigation basse */}
        <footer className="mt-12 pt-8 border-t border-border">
          <div className="flex justify-between items-center">
            {prev ? (
              <Link to={`/projet/${prev.id}`} className="group">
                <div className="text-sm text-muted-foreground mb-1">
                  Previous project
                </div>
                <div className="font-medium flex items-center gap-2 group-hover:text-primary">
                  <ChevronLeft className="w-4 h-4" />
                  {prev.title}
                </div>
              </Link>
            ) : (
              <div />
            )}

            {next && (
              <Link to={`/projet/${next.id}`} className="group text-right">
                <div className="text-sm text-muted-foreground mb-1">
                  Next project
                </div>
                <div className="font-medium flex items-center gap-2 justify-end group-hover:text-primary">
                  {next.title}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            )}
          </div>
        </footer>

      </div>
    </main>
  );
};

export default ProjectDetail;