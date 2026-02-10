import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

/* ============================================================
   SECTION
============================================================ */

function Section({
  title,
  filter,
}: {
  title: string;
  filter: (p: typeof projects[number]) => boolean;
}) {
  const items = projects.filter(filter);

  if (!items.length) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-medium">{title}</h2>

      <div
        className="
          grid gap-6
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          place-content-start
          justify-items-center
        "
      >
        {items.map((project) => (
          <div key={project.id} className="w-full max-w-sm">
            <ProjectCard project={project} />
          </div>
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
              Vue structurée des projets et outils développés autour de l’imagerie
              CT et IRM. Chaque projet illustre une problématique méthodologique
              précise : segmentation, recalage, quantification ou prototypage.
            </p>
          </section>

          <Section
            title="Segmentation & analyse lésionnelle"
            filter={(p) => p.analysisType === "Segmentation"}
          />

          <Section
            title="Recalage et alignement multimodal"
            filter={(p) => p.analysisType === "Registration"}
          />

          <Section
            title="Quantification et analyse fonctionnelle"
            filter={(p) => p.analysisType === "Quantification"}
          />

          <Section
            title="Outils sur mesure & prototypage"
            filter={(p) => p.analysisType === "Prototypage"}
          />

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Projects;