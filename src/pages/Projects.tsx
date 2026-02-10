import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

/* ============================================================
   SECTION - Centrage de la grille et des titres
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
    <section className="space-y-6 flex flex-col items-center">
      {/* Titre centré */}
      <h2 className="text-xl font-medium text-center">{title}</h2>

      <div className="w-full flex justify-center">
        <div
          className="
            grid
            gap-6
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            justify-items-center
          "
        >
          {items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PAGE - Centrage du layout global
============================================================ */
const Projects = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12">
        {/* Ajout de mx-auto pour centrer le container */}
        <div className="container mx-auto px-4 md:px-6 space-y-16">

          {/* Header - Ajout de mx-auto et text-center */}
          <section className="max-w-3xl mx-auto space-y-4 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Projets & expertises en imagerie médicale
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Vue structurée des projets et outils développés autour de l’imagerie
              CT et IRM. Chaque projet illustre une problématique méthodologique
              précise : segmentation, recalage, quantification ou prototypage.
            </p>
          </section>

          {/* Wrapper pour l'espacement des sections */}
          <div className="space-y-16">
            <Section
              title="Segmentation & analyse lésionnelle"
              filter={(p) => p.analysisType === "Segmentation"}
            />

            <Section
              title="Quantification et analyse fonctionnelle"
              filter={(p) => p.analysisType === "Quantification"}
            />
            
            <Section
              title="Méthodologie & outils transverses"
              filter={(p) =>
                p.analysisType === "Registration" ||
                p.analysisType === "Prototypage"
              }
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Projects;