import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <Link
      to={`/projet/${project.id}`}
      className="block w-full sm:w-[350px] shrink-0 transition-transform duration-300 hover:-translate-y-1"
    >
      <Card className="h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 hover:shadow-lg transition-all">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>

        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-lg leading-tight">
            {project.title}
          </h3>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">
              {project.modality}
            </Badge>
            <Badge variant="secondary">{project.analysisType}</Badge>
          </div>

          <p className="text-sm text-muted-foreground font-mono truncate">
            {project.technologies.slice(0, 3).join(" – ")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectCard;