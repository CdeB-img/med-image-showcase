import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
  sliceCount: number;
}

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

const ProjectCard = ({ project, sliceCount }: ProjectCardProps) => {
  return (
    <Link to={`/projet/${project.id}`}>
      <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card">
        <div className="relative aspect-video overflow-hidden bg-surface">
          <img
            src={`${RAW_BASE}/${project.thumbnailPath}`}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />

          <div className="absolute bottom-2 right-2 px-2 py-1 text-xs font-mono bg-background/80 backdrop-blur-sm rounded border border-border">
            {sliceCount} slices
          </div>
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

export default ProjectCard;