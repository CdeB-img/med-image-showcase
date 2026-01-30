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
    `${RAW_BASE}/${relativePath}/slice_${String(start + i).padStart(3, "0")}.png`
  );

// ============================================================
// QC DATA
// ============================================================

const qcPairs = [
  {
    label: "TMAX",
    native: slices(`${PERF_BASE}/Tmax_seq`),
    mask: slices(`${PERF_BASE}/MASK_TMAX6`),
  },
  {
    label: "CBF30",
    native: slices(`${PERF_BASE}/rCBF_seq`),
    mask: slices(`${PERF_BASE}/MASK_CBF30`),
  },
  {
    label: "CBF60",
    native: slices(`${PERF_BASE}/rCBF_seq`),
    mask: slices(`${PERF_BASE}/MASK_CBF60`),
  },
  {
    label: "OEF",
    native: slices(`${PERF_BASE}/OEF_seq`),
    mask: slices(`${PERF_BASE}/MASK_OEF`),
  },
  {
    label: "CMRO2",
    native: slices(`${PERF_BASE}/rCMRO2_seq`),
    mask: slices(`${PERF_BASE}/MASK_CMRO2`),
  },
  {
    label: "DIFF",
    native: slices("diffusion/native"),
    mask: slices("diffusion/mask"),
  },
];

// ============================================================
// RECALAGE DATA
// ============================================================

const multimodalPairs = [
  {
    label: "CT → IRM",
    reference: `${RAW_BASE}/recalage/ct/slice_008.png`,
    registered: `${RAW_BASE}/recalage/ct_to_mri/slice_008.png`,
  },
  {
    label: "CT → IRM (affine)",
    reference: `${RAW_BASE}/recalage/ct/slice_008.png`,
    registered: `${RAW_BASE}/recalage/ct_to_mri_affine/slice_008.png`,
  },
  {
    label: "CT → IRM (non-linéaire)",
    reference: `${RAW_BASE}/recalage/ct/slice_008.png`,
    registered: `${RAW_BASE}/recalage/ct_to_mri_nl/slice_008.png`,
  },
];

const monomodalPairs = [
  {
    label: "DWI → FLAIR",
    reference: `${RAW_BASE}/recalage/dwi/slice_008.png`,
    registered: `${RAW_BASE}/recalage/dwi_to_flair/slice_008.png`,
  },
  {
    label: "DWI → FLAIR (affine)",
    reference: `${RAW_BASE}/recalage/dwi/slice_008.png`,
    registered: `${RAW_BASE}/recalage/dwi_to_flair_affine/slice_008.png`,
  },
  {
    label: "DWI → FLAIR (non-linéaire)",
    reference: `${RAW_BASE}/recalage/dwi/slice_008.png`,
    registered: `${RAW_BASE}/recalage/dwi_to_flair_nl/slice_008.png`,
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
              {project.id === "recalage" ? (
                <RegistrationViewer
                  multimodalPairs={multimodalPairs}
                  monomodalPairs={monomodalPairs}
                />
              ) : (
                <SliceViewer
                  nativeSlices={project.nativeSlices}
                  processedSlices={project.processedSlices}
                  useSliderOverlay={project.useSliderOverlay}
                />
              )}
            </section>

          </div>
        )}
      </div>
    </main>
  );
};

export default ProjectDetail;