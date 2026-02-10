import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

/* ============================================================
   SECTION - Nettoyée pour le centrage
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
    <section className="space-y-8 w-full">
      <h2 className="text-2xl font-medium text-center">{title}</h2>

      {/* CHANGEMENT ICI :
         On remplace 'grid' par 'flex'.
         - flex-wrap : permet de passer à la ligne
         - justify-center : centre les éléments horizontalement (la clé du succès !)
         - gap-8 : garde l'espacement
      */}
      <div className="flex flex-wrap justify-center gap-8 mx-auto">
        {items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   PAGE - Structure simplifiée
============================================================ */
const Projects = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-16 px-4">
        {/* On remplace container par un max-width explicite */}
        <div className="max-w-7xl mx-auto w-full space-y-20">

          {/* Header */}
          <section className="max-w-3xl mx-auto space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Projets & expertises en imagerie médicale
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Vue structurée des projets et outils développés autour de l’imagerie
              CT et IRM. Chaque projet illustre une problématique méthodologique
              précise.
            </p>
          </section>

          <div className="space-y-24">
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