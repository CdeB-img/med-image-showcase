import { projects } from "@/data/projects";
import ProjectGallery from "@/components/ProjectGallery";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Projects = () => {
  return (
    <main className="min-h-screen py-8">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Accueil
            </Button>
          </Link>
        </div>

        <ProjectGallery />
      </div>
    </main>
  );
};

export default Projects;
