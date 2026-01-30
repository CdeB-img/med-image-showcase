// src/pages/ProjectDetail.tsx

import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SliceViewer from "@/components/SliceViewer";
import RegistrationViewer from "@/components/RegistrationViewer";

import { getProjectById, getAdjacentProjects } from "@/data/projects";

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

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

  // Registration pairs for recalage project
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

  return (
    <main className="min-h-screen py-8">
      <div className="container px-4 md:px-6">
        {/* Top navigation */}
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

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Project info */}
          <section className="space-y-6 animate-fade-in">
            <header className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">{project.title}</h1>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/50 text-primary"
                >
                  {project.modality}
                </Badge>
                <Badge variant="secondary">{project.analysisType}</Badge>
              </div>
            </header>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-muted-foreground">
                Description
              </h2>
              <p className="leading-relaxed">{project.description}</p>
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

          {/* Viewer */}
          <section
            className="animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-muted-foreground mb-4">
                Visualization
              </h2>

              {/* Standard viewer */}
              {project.id !== "recalage" && (
                <SliceViewer
                  nativeSlices={project.nativeSlices}
                  processedSlices={project.processedSlices}
                  useSliderOverlay={project.useSliderOverlay}
                  className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4"
                />
              )}

              {/* Registration viewer */}
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

        {/* Bottom navigation */}
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
