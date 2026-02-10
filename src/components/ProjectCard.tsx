import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    // Ajout de block, w-full, max-w-sm (pour éviter que l'image soit immense) et mx-auto
    <Link to={`/projet/${project.id}`} className="block w-full max-w-[400px] mx-auto">
      <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card h-full">
        <div className="relative aspect-square overflow-hidden bg-surface">
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            // h-full w-full object-cover pour remplir parfaitement le carré
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {project.title}
          </h3>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-primary/50 text-primary">
              {project.modality}
            </Badge>
            <Badge variant="secondary">
              {project.analysisType}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground font-mono truncate">
            {project.technologies.slice(0, 3).join(" - ")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};