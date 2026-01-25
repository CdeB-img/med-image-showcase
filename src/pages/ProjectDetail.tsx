import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          <h1 className="text-2xl font-bold">Projet non trouvé</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8">
      <div className="container px-4 md:px-6">
        {/* Navigation header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour aux projets
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
          {/* Project info */}
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">{project.title}</h1>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/50 text-primary">
                  {project.modality}
                </Badge>
                <Badge variant="secondary">
                  {project.analysisType}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-muted-foreground">Description</h2>
              <p className="text-foreground leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Technologies */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">Technologies utilisées</h2>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 text-sm font-mono bg-secondary/50 border border-border rounded-md text-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Project stats */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-surface rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{project.sliceCount}</div>
                <div className="text-sm text-muted-foreground">Coupes disponibles</div>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{project.technologies.length}</div>
                <div className="text-sm text-muted-foreground">Technologies</div>
              </div>
            </div>
          </div>

          {/* Slice viewer */}
          <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-muted-foreground mb-4">
                Visualiseur de coupes
              </h2>
              <SliceViewer
                nativeSlices={project.nativeSlices}
                processedSlices={project.processedSlices}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4"
              />
            </div>
          </div>
        </div>

        {/* Navigation footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex justify-between items-center">
            {adjacentProjects.prev ? (
              <Link to={`/projet/${adjacentProjects.prev.id}`} className="group">
                <div className="text-sm text-muted-foreground mb-1">Projet précédent</div>
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
                <div className="text-sm text-muted-foreground mb-1">Projet suivant</div>
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
