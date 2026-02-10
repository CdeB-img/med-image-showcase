import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

/* ============================================================
   TYPES
============================================================ */

type ProjectType = (typeof projects)[number];

/* ============================================================
   SECTION COMPONENT
============================================================ */

function ProjectSection({
  title,
  description,
  filter,
}: {
  title: string;
  description?: string;
  filter: (p: ProjectType) => boolean;
}) {
  const items = projects.filter(filter);

  if (!items.length) return null;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {title}
        </h2>

        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      <main className="flex-1 py-16">
        <div className="container px-4 md:px-6 space-y-20">

          {/* ================= HEADER ================= */}
          <section className="max-w-3xl space-y-4">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Projets & expertises en imagerie médicale
            </h1>

            <p className="text-muted-foreground leading-relaxed">
              Cette page présente une vue structurée des projets et outils
              développés autour de l’imagerie CT et IRM.
              Chaque projet illustre une problématique méthodologique précise :
              segmentation, recalage, quantification ou prototypage d’outils
              dédiés à la recherche clinique et translationnelle.
            </p>
          </section>

          {/* ================= SEGMENTATION ================= */}
          <ProjectSection
            title="Segmentation & analyse lésionnelle"
            description="Méthodes de segmentation guidées par le signal, avec validation experte et contrôle physiopathologique."
            filter={(p) => p.analysisType === "Segmentation"}
          />

          {/* ================= QUANTIFICATION ================= */}
          <ProjectSection
            title="Quantification et analyse fonctionnelle"
            description="Extraction de biomarqueurs quantitatifs à partir de données CT et IRM, avec contrôle méthodologique et reproductibilité."
            filter={(p) => p.analysisType === "Quantification"}
          />

          {/* ================= OUTILS & MÉTHODOLOGIE ================= */}
          <ProjectSection
            title="Méthodologie & outils transverses"
            description="Outils de recalage, d’alignement multimodal et de prototypage méthodologique, indépendants des solutions propriétaires."
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