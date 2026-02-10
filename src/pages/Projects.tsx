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
    <section className="space-y-8 w-full">
      <h2 className="text-2xl font-medium text-center">
        {title}
      </h2>

      <div className="flex flex-wrap justify-center gap-8">
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
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-16 px-4">
        <div className="max-w-7xl mx-auto w-full space-y-24">

          {/* ================= HEADER ================= */}
          <section className="max-w-3xl mx-auto space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Projets & expertises en imagerie médicale
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Vue structurée de projets et d’outils développés autour de
              l’imagerie CT et IRM, en contexte clinique et de recherche.
            </p>
          </section>

          {/* ================= CONTEXTE ÉDITORIAL ================= */}
          <section className="max-w-4xl mx-auto space-y-4 text-muted-foreground leading-relaxed text-center">
            <p>
              Les projets présentés sur cette page constituent des exemples
              représentatifs de problématiques rencontrées en imagerie médicale
              (CT, IRM, multimodal).
            </p>

            <p>
              Ils ne correspondent pas à des solutions figées ni à des produits
              standardisés. Chaque étude, chaque jeu de données et chaque
              contexte clinique ou de recherche présente des contraintes
              spécifiques.
            </p>

            <p>
              La démarche repose avant tout sur l’échange et la compréhension du
              besoin réel afin de définir une approche adaptée&nbsp;:
              segmentation, recalage, quantification, développement d’outils sur
              mesure ou accompagnement méthodologique.
            </p>

            <p>
              Les aspects pratiques — périmètre, délais et cadre tarifaire — sont
              abordés de manière simple, transparente et proportionnée, en
              fonction du projet et de ses objectifs.
            </p>

            <p className="font-medium text-foreground">
              Ces exemples servent de point de départ&nbsp;: un échange permet
              d’évaluer rapidement la faisabilité et les options possibles.
            </p>
          </section>

          {/* ================= SECTIONS ================= */}
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
      </main>

      <Footer />
    </div>
  );
};

export default Projects;