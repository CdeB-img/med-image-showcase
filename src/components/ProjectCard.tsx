// src/components/ProjectCard.tsx

import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
}

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <Link to={`/projet/${project.id}`}>
      <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card">
        <div className="relative aspect-video overflow-hidden bg-surface">
          <img
            src={`${RAW_BASE}/${project.thumbnailPath}`}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-lg leading-tight">
            {project.title}
          </h3>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{project.modality}</Badge>
            <Badge variant="secondary">{project.analysisType}</Badge>
          </div>

          <p className="text-sm text-muted-foreground font-mono truncate">
            {project.technologies.join(" - ")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectCard;