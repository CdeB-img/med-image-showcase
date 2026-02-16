import { useState } from "react";
import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import { Helmet } from "react-helmet-async";
import { ArrowRight, BarChart3, Workflow } from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/projets";

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
              loading="lazy"
              className="
                w-16 h-16 sm:w-20 sm:h-20
                rounded-lg
                object-cover
                border border-border/40
                opacity-85
                transition-all duration-200
                group-hover:opacity-100
                group-hover:scale-[1.03]
              "
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

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Projets en imagerie médicale quantitative",
    description:
      "Exemples de projets en segmentation, quantification et méthodologie IRM/CT en recherche clinique.",
    url: CANONICAL,
    hasPart: projects.map((p) => ({
      "@type": "CreativeWork",
      name: p.title,
      url: `https://noxia-imagerie.fr/projet/${p.id}`,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Projets", item: CANONICAL },
    ],
  };

  const toggleSection = (id: string) => {
    setActive((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <Helmet>
        <title>Projets en imagerie médicale quantitative | NOXIA</title>
        <meta
          name="description"
          content="Exemples de projets en segmentation, quantification et méthodologie IRM/CT avec approche reproductible et multicentrique."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(collectionJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-24">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Projets" }
              ]}
            />

            <ExpertiseHero
              badge="Démonstrateurs"
              badgeIcon={Workflow}
              title="Projets & expertises en imagerie médicale"
              description="Exemples de problématiques et d’approches méthodologiques en imagerie CT et IRM, en contexte clinique et de recherche."
              chips={["Segmentation", "Quantification", "Méthodologie"]}
              actions={[
                { label: "Discuter d'un projet", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir les expertises", to: "/expertise", variant: "secondary", icon: BarChart3 },
              ]}
            />

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
                <Link
                  to="/contact"
                  className="text-primary hover:underline underline-offset-4"
                >
                  {" "}Un échange permet d’évaluer rapidement la faisabilité.
                </Link>
              </p>
            </section>

            {/* ================= AXES ================= */}
            <div className="space-y-6">

              {/* SEGMENTATION → neuro-onco */}
              <CollapsibleSection
                id="segmentation"
                title="Segmentation & analyse lésionnelle"
                subtitle="Approches guidées par le signal, validées sur données cliniques réelles."
                iconImage="/images/projets/neuro-onco.webp"
                isOpen={active === "segmentation"}
                onToggle={toggleSection}
                filter={(p) => p.analysisType === "Segmentation"}
              />

              {/* QUANTIFICATION → CT scan expertise */}
              <CollapsibleSection
                id="quantification"
                title="Quantification et analyse fonctionnelle"
                subtitle="Extraction de biomarqueurs quantitatifs avec contrôle méthodologique."
                iconImage="/images/projets/ct.webp"
                isOpen={active === "quantification"}
                onToggle={toggleSection}
                filter={(p) => p.analysisType === "Quantification"}
              />

              {/* MÉTHODO → coregistration */}
              <CollapsibleSection
                id="methodo"
                title="Méthodologie & outils transverses"
                subtitle="Recalage multimodal, prototypage et outils indépendants des solutions propriétaires."
                iconImage="/images/projets/registration.webp"
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
    </>
  );
};

export default Projects;
