import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

/* ============================================================
   HELPERS
============================================================ */

function gridClass(count: number) {
  if (count === 1) {
    return "flex";
  }
  if (count === 2) {
    return "grid gap-6 sm:grid-cols-2";
  }
  return "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";
}

function renderSection(
  title: string,
  filter: (p: typeof projects[number]) => boolean
) {
  const items = projects.filter(filter);

  if (items.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-medium">{title}</h2>

      <div className={gridClass(items.length)}>
        {items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   PAGE
============================================================ */

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

          {renderSection(
            "Segmentation & analyse lésionnelle",
            (p) => p.analysisType === "Segmentation"
          )}

          {renderSection(
            "Recalage et alignement multimodal",
            (p) => p.analysisType === "Registration"
          )}

          {renderSection(
            "Quantification et analyse fonctionnelle",
            (p) => p.analysisType === "Quantification"
          )}

          {renderSection(
            "Outils sur mesure & prototypage",
            (p) => p.analysisType === "Prototypage"
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Projects;