import { useState } from "react";
import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import { Helmet } from "react-helmet-async";
import { ArrowRight, BarChart3, ChevronRight, Workflow } from "lucide-react";

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
  const previewTitles = items.slice(0, 2).map((p) => p.title).join(" • ");
  const remainingCount = Math.max(items.length - 2, 0);
  const previewText =
    remainingCount > 0
      ? `${previewTitles} • +${remainingCount} autre${remainingCount > 1 ? "s" : ""}`
      : previewTitles;

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

            {!isOpen && (
              <p className="text-sm text-muted-foreground/80 max-w-3xl pt-1">
                {items.length} projet{items.length > 1 ? "s" : ""} : {previewText}
              </p>
            )}
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
              className={`
                inline-flex items-center gap-1.5 text-sm font-medium
                transition-colors
                ${isOpen ? "text-primary" : "text-muted-foreground group-hover:text-primary"}
              `}
            >
              {isOpen ? "Masquer" : "Voir le détail"}
              <ChevronRight
                className={`
                  w-4 h-4 transition-transform duration-300
                  ${isOpen ? "rotate-90" : "rotate-0"}
                `}
              />
            </span>
          </div>
        </div>

        {/* Indication mobile */}
        <span className="block text-xs mt-3 text-muted-foreground/70">
          Cliquer pour {isOpen ? "replier" : "afficher"} les projets
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
  const [active, setActive] = useState<string | null>("segmentation");

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
        <title>Projets d’imagerie quantitative IRM/CT en recherche | NOXIA</title>
        <meta
          name="description"
          content="Projets NOXIA en segmentation, quantification et méthodologie IRM/CT: cas multicentriques, validation technique et biomarqueurs pour recherche clinique."
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
              badge="Cas d'usage"
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
                ou développement d’outils sur mesure. Les pages{" "}
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  segmentation IRM
                </Link>
                ,{" "}
                <Link to="/quantification-ct" className="text-primary hover:underline">
                  quantification CT
                </Link>{" "}
                et{" "}
                <Link to="/recalage-multimodal" className="text-primary hover:underline">
                  recalage multimodal
                </Link>{" "}
                détaillent les briques méthodologiques utilisées.
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

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Compléter la lecture des cas</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pour relier ces exemples opérationnels au cadre global, voir la{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  méthodologie imagerie quantitative
                </Link>
                , la page{" "}
                <Link to="/expertise" className="text-primary hover:underline">
                  expertise
                </Link>{" "}
                et les{" "}
                <Link to="/prestations-imagerie-medicale" className="text-primary hover:underline">
                  formats d’accompagnement
                </Link>.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/expertise" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Architecture d’expertise
                </Link>
                <Link to="/methodologie-imagerie-quantitative" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Pipeline méthodologique
                </Link>
                <Link to="/prestations-imagerie-medicale" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Prestations de conseil
                </Link>
                <Link to="/contact" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Cadrer un projet
                </Link>
              </div>
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
