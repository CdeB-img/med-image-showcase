import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      to={`/projet/${project.id}`}
      className="block h-full"
    >
      <Card
        className="
          group h-full
          overflow-hidden
          border-border/50
          bg-card/50
          backdrop-blur-sm
          transition-all duration-300
          hover:border-primary/50
          hover:bg-card
        "
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-surface">
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="
              h-full w-full
              object-cover
              transition-transform duration-500
              group-hover:scale-105
            "
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
        </div>

        {/* Content */}
        <CardContent className="space-y-3 p-4">
          <h3 className="text-lg font-semibold leading-tight line-clamp-2 transition-colors group-hover:text-primary">
            {project.title}
          </h3>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="border-primary/50 text-primary"
            >
              {project.modality}
            </Badge>

            <Badge variant="secondary">
              {project.analysisType}
            </Badge>
          </div>

          <p className="truncate font-mono text-sm text-muted-foreground">
            {project.technologies.slice(0, 3).join(" – ")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}