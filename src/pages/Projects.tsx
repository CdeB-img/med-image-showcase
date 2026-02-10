import { useState } from "react";
import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

/* ============================================================
   COLLAPSIBLE SECTION
============================================================ */
interface CollapsibleSectionProps {
  id: string;
  title: string;
  subtitle: string;
  iconImage: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  filter: (p: typeof projects[number]) => boolean;
}

function CollapsibleSection({
  id,
  title,
  subtitle,
  iconImage,
  isOpen,
  onToggle,
  filter,
}: CollapsibleSectionProps) {
  const items = projects.filter(filter);

  return (
    <section className="w-full border-b border-border/40">
      {/* ================= HEADER ================= */}
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className={`
          w-full text-left
          rounded-xl px-5 py-5
          transition-all duration-200
          group
          hover:bg-muted/40
          ${isOpen ? "bg-muted/50" : ""}
        `}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Texte */}
          <div className="space-y-1">
            <h2
              className="
                text-2xl font-semibold tracking-tight
                transition-colors
                group-hover:text-primary
              "
            >
              {title}
            </h2>

            <p className="text-muted-foreground max-w-3xl">
              {subtitle}
            </p>
          </div>

          {/* Icône + chevron */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src={iconImage}
              alt=""
              className="
                w-12 h-12
                rounded-md
                object-cover
                border border-border/40
                opacity-80
                transition-all
                group-hover:opacity-100
              "
              loading="lazy"
            />

            <span
              aria-hidden
              className={`
                text-2xl
                transition-transform duration-300
                ${isOpen
                  ? "rotate-90 text-primary"
                  : "text-muted-foreground group-hover:text-primary"}
              `}
            >
              ▸
            </span>
          </div>
        </div>

        {/* Indication mobile */}
        <span className="block sm:hidden text-xs mt-3 text-muted-foreground/70">
          Appuyer pour afficher les projets
        </span>
      </button>

      {/* ================= CONTENU DÉROULÉ ================= */}
      <div
        className={`
          overflow-hidden transition-all duration-500 ease-in-out
          ${isOpen ? "max-h-[2000px] opacity-100 mt-8" : "max-h-0 opacity-0"}
        `}
      >
        <div className="flex flex-wrap justify-center gap-8 pb-10">
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
              Exemples de problématiques et d’approches méthodologiques
              en imagerie CT et IRM, en contexte clinique et de recherche.
            </p>
          </section>

          {/* ================= CONTEXTE ================= */}
          <section
            className="
              max-w-4xl mx-auto
              rounded-xl border border-border/50
              bg-muted/20 px-8 py-6
              text-muted-foreground leading-relaxed space-y-4
            "
          >
            <p>
              Les projets présentés ci-dessous sont des exemples représentatifs.
              Ils ne constituent pas des solutions standardisées.
            </p>

            <p>
              Chaque collaboration débute par un échange afin de définir une
              approche adaptée&nbsp;: segmentation, recalage, quantification
              ou développement d’outils sur mesure.
            </p>

            <p className="font-medium text-foreground pt-4 border-t border-border/40">
              Ces exemples servent de point de départ.
              <a
                href="#/contact"
                className="text-primary hover:underline underline-offset-4"
              >
                {" "}Un échange permet d’évaluer rapidement la faisabilité.
              </a>
            </p>
          </section>

          {/* ================= AXES ================= */}
          <div className="space-y-6">

            {/* SEGMENTATION → neuro-onco */}
            <CollapsibleSection
              id="segmentation"
              title="Segmentation & analyse lésionnelle"
              subtitle="Approches guidées par le signal, validées sur données cliniques réelles."
              iconImage="https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images/projets/neuro-onco.png"
              isOpen={active === "segmentation"}
              onToggle={toggleSection}
              filter={(p) => p.analysisType === "Segmentation"}
            />

            {/* QUANTIFICATION → CT scan expertise */}
            <CollapsibleSection
              id="quantification"
              title="Quantification et analyse fonctionnelle"
              subtitle="Extraction de biomarqueurs quantitatifs avec contrôle méthodologique."
              iconImage="https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images/projets/ct.png"
              isOpen={active === "quantification"}
              onToggle={toggleSection}
              filter={(p) => p.analysisType === "Quantification"}
            />

            {/* MÉTHODO → coregistration */}
            <CollapsibleSection
              id="methodo"
              title="Méthodologie & outils transverses"
              subtitle="Recalage multimodal, prototypage et outils indépendants des solutions propriétaires."
              iconImage="https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images/projets/registration.png"
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