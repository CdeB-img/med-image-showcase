/* ============================================================
   ProjectCard.tsx
============================================================ */
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
      // CORRECTION ICI :
      // 1. w-full : prend toute la largeur sur mobile
      // 2. sm:w-[350px] : se bloque à 350px dès qu'on est sur tablette/PC
      // 3. shrink-0 : empêche la carte de s'écraser si l'écran est petit
      className="block w-full sm:w-[350px] shrink-0 transition-transform hover:-translate-y-1 duration-300"
    >
      <Card className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm h-full hover:border-primary/50 hover:bg-card hover:shadow-lg transition-all">
        <div className="relative aspect-square overflow-hidden bg-surface">
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Gradient subtil pour la lisibilité si besoin */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {project.title}
          </h3>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">
              {project.modality}
            </Badge>
            <Badge variant="secondary" className="bg-secondary/50">
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