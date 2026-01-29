import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const thumbnail = project.nativeSlices[8] || project.nativeSlices[0] || "";

  return (
    <Link to={`/projet/${project.id}`}>
      <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:glow-primary hover:bg-card">
        <div className="relative aspect-video overflow-hidden bg-surface">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-2 right-2 px-2 py-1 text-xs font-mono bg-background/80 backdrop-blur-sm rounded border border-border">
            {project.nativeSlices.length} slices
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
            {project.title}
          </h3>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectCard;
