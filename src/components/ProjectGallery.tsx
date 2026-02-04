import { projects } from "@/data/projects";
import ProjectCard from "./ProjectCard";
const ProjectGallery = () => {
  return <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        {/* Section header */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Projets & Réalisations
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Découvrez une sélection de projets réalisés dans différentes modalités d'imagerie médicale. Cliquez sur un projet pour en savoir plus.</p>
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => <div key={project.id} className="animate-fade-in" style={{
          animationDelay: `${index * 100}ms`
        }}>
              <ProjectCard project={project} />
            </div>)}
        </div>
      </div>
    </section>;
};
export default ProjectGallery;