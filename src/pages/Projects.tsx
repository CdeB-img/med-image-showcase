import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

const Projects = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6 space-y-12">

          {/* Header */}
          <section className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight">
              Projets & expertises en imagerie médicale
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Cette page présente une vue structurée des projets et outils développés
              autour de l’imagerie CT et IRM.  
              Chaque projet illustre une problématique méthodologique précise :
              segmentation, recalage, quantification ou prototypage d’outils dédiés.
            </p>
          </section>

          {/* Segmentation */}
          <section className="space-y-6">
            <h2 className="text-xl font-medium">
              Segmentation & analyse lésionnelle
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter(p => p.analysisType === "Segmentation")
                .map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
            </div>
          </section>

          {/* Registration */}
          <section className="space-y-6">
            <h2 className="text-xl font-medium">
              Recalage et alignement multimodal
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter(p => p.analysisType === "Registration")
                .map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
            </div>
          </section>

          {/* Quantification */}
          <section className="space-y-6">
            <h2 className="text-xl font-medium">
              Quantification et analyse fonctionnelle
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter(p => p.analysisType === "Quantification")
                .map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
            </div>
          </section>

          {/* Outils */}
          <section className="space-y-6">
            <h2 className="text-xl font-medium">
              Outils sur mesure & prototypage
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter(p => p.analysisType === "Prototypage")
                .map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Projects;