import { useState } from "react";
import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

/* ============================================================
   COLLAPSIBLE SECTION
============================================================ */
function CollapsibleSection({
  id,
  title,
  subtitle,
  isOpen,
  onToggle,
  filter,
}: {
  id: string;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  filter: (p: typeof projects[number]) => boolean;
}) {
  const items = projects.filter(filter);

  return (
    <section className="w-full border-b border-border/40 pb-8">
      {/* Header cliquable */}
      <button
        onClick={() => onToggle(id)}
        className="w-full text-left space-y-2 group"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            {title}
          </h2>

          <span
            className={`
              text-muted-foreground transition-transform duration-300
              ${isOpen ? "rotate-90" : ""}
            `}
          >
            ▸
          </span>
        </div>

        <p className="text-muted-foreground max-w-3xl">
          {subtitle}
        </p>
      </button>

      {/* Contenu déroulant */}
      <div
        className={`
          overflow-hidden transition-all duration-500 ease-in-out
          ${isOpen ? "max-h-[2000px] opacity-100 mt-8" : "max-h-0 opacity-0"}
        `}
      >
        <div className="flex flex-wrap justify-center gap-8">
          {items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PAGE
============================================================ */
const Projects = () => {
  const [active, setActive] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setActive((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-24">

          {/* ================= HEADER ================= */}
          <section className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Projets & expertises en imagerie médicale
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Exemples de problématiques et d’approches méthodologiques en
              imagerie CT et IRM, en contexte clinique et de recherche.
            </p>
          </section>

          {/* ================= CONTEXTE ================= */}
          <section className="max-w-4xl mx-auto rounded-xl border border-border/50 bg-muted/20 px-8 py-6 text-muted-foreground leading-relaxed space-y-4">
            <p>
              Les projets présentés ci-dessous sont des exemples représentatifs.
              Ils ne constituent pas des solutions standardisées.
            </p>

            <p>
              Chaque collaboration débute par un échange afin de définir une
              approche adaptée&nbsp;: segmentation, recalage, quantification ou
              développement d’outils sur mesure.
            </p>

            <p className="font-medium text-foreground pt-4 border-t border-border/40">
              Ces exemples servent de point de départ.
              <span className="text-primary">
                {" "}Un échange permet d’évaluer rapidement la faisabilité.
              </span>
            </p>
          </section>

          {/* ================= AXES ================= */}
          <div className="space-y-12">

            <CollapsibleSection
              id="segmentation"
              title="Segmentation & analyse lésionnelle"
              subtitle="Approches guidées par le signal, validées sur données cliniques réelles."
              isOpen={active === "segmentation"}
              onToggle={toggleSection}
              filter={(p) => p.analysisType === "Segmentation"}
            />

            <CollapsibleSection
              id="quantification"
              title="Quantification et analyse fonctionnelle"
              subtitle="Extraction de biomarqueurs quantitatifs avec contrôle méthodologique."
              isOpen={active === "quantification"}
              onToggle={toggleSection}
              filter={(p) => p.analysisType === "Quantification"}
            />

            <CollapsibleSection
              id="methodo"
              title="Méthodologie & outils transverses"
              subtitle="Recalage multimodal, prototypage et outils indépendants des solutions propriétaires."
              isOpen={active === "methodo"}
              onToggle={toggleSection}
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