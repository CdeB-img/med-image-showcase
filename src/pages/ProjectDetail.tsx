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

// ============================================================
// HELPERS
// ============================================================

const slices = (relativePath: string, start = 0, end = 15): string[] =>
  Array.from({ length: end - start + 1 }, (_, i) =>
    `${RAW_BASE}/${PERF_BASE}/${relativePath}/slice_${String(start + i).padStart(3, "0")}.png`
  );

// ============================================================
// QC DATA (CAS SPÉCIAL, ASSUMÉ)
// ============================================================

const qcPairs = [
  {
    label: "TMAX",
    native: slices("Tmax_seq"),
    mask: slices("MASK_TMAX6"),
  },
  {
    label: "CBF30",
    native: slices("rCBF_seq"),
    mask: slices("MASK_CBF30"),
  },
  {
    label: "CBF60",
    native: slices("rCBF_seq"),
    mask: slices("MASK_CBF60"),
  },
  {
    label: "OEF",
    native: slices("OEF_seq"),
    mask: slices("MASK_OEF"),
  },
  {
    label: "CMRO2",
    native: slices("rCMRO2_seq"),
    mask: slices("MASK_CMRO2"),
  },
  {
    label: "DIFF",
    native: Array.from({ length: 16 }, (_, i) =>
      `${RAW_BASE}/diffusion/native/slice_${String(i).padStart(3, "0")}.png`
    ),
    mask: Array.from({ length: 16 }, (_, i) =>
      `${RAW_BASE}/diffusion/mask/slice_${String(i).padStart(3, "0")}.png`
    ),
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
    <main className="min-h-screen py-8">
      <div className="container px-4 md:px-6">

        {/* Navigation */}
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

        {/* ================= QC ================= */}
        {project.id === "qc" && (
          <QCViewer
            pairs={qcPairs}
            patientName="Example patient"
            className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
          />
        )}

        {/* ================= AUTRES PROJETS ================= */}
        {project.id !== "qc" && (
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
              {project.id !== "recalage" && (
                <SliceViewer
                  nativeSlices={project.nativeSlices}
                  processedSlices={project.processedSlices}
                  useSliderOverlay={project.useSliderOverlay}
                />
              )}

              {project.id === "recalage" && (
                <RegistrationViewer />
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProjectDetail;