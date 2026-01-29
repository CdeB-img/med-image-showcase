import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjectById, getAdjacentProjects } from "@/data/projects";
import SliceViewer from "@/components/SliceViewer";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = id ? getProjectById(id) : undefined;
  const adjacentProjects = id ? getAdjacentProjects(id) : { prev: null, next: null };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Project not found</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8">
      <div className="container px-4 md:px-6">
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
              disabled={!adjacentProjects.prev}
              onClick={() => adjacentProjects.prev && navigate(`/projet/${adjacentProjects.prev.id}`)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!adjacentProjects.next}
              onClick={() => adjacentProjects.next && navigate(`/projet/${adjacentProjects.next.id}`)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold">{project.title}</h1>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{project.nativeSlices.length}</div>
                <div className="text-sm text-muted-foreground">Slices</div>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{project.useSliderOverlay ? "Overlay" : "Side by side"}</div>
                <div className="text-sm text-muted-foreground">Mode</div>
              </div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-muted-foreground mb-4">Slice Viewer</h2>
              <SliceViewer
                nativeSlices={project.nativeSlices}
                processedSlices={project.processedSlices}
                useSliderOverlay={project.useSliderOverlay}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex justify-between items-center">
            {adjacentProjects.prev ? (
              <Link to={`/projet/${adjacentProjects.prev.id}`} className="group">
                <div className="text-sm text-muted-foreground mb-1">Previous</div>
                <div className="font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  {adjacentProjects.prev.title}
                </div>
              </Link>
            ) : (
              <div />
            )}

            {adjacentProjects.next && (
              <Link to={`/projet/${adjacentProjects.next.id}`} className="group text-right">
                <div className="text-sm text-muted-foreground mb-1">Next</div>
                <div className="font-medium group-hover:text-primary transition-colors flex items-center gap-2 justify-end">
                  {adjacentProjects.next.title}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProjectDetail;
