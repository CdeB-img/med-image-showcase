import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

/* ============================================================
   SECTION — LISTE DE PROJETS
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
    <section className="space-y-10 w-full">
      <h2 className="text-2xl font-semibold tracking-tight text-center">
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
   PAGE — PROJETS
============================================================ */
const Projects = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-20 px-4">
        <div className="max-w-7xl mx-auto w-full space-y-28">

          {/* ================= TITRE ================= */}
          <section className="max-w-3xl mx-auto space-y-6 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Projets & expertises en imagerie médicale
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Exemples de projets et d’outils développés en imagerie CT et IRM,
              en contexte clinique et de recherche.
            </p>
          </section>

          {/* ================= POSITIONNEMENT ================= */}
          <section className="max-w-4xl mx-auto space-y-6">
            <div className="
              rounded-2xl
              border border-border/50
              bg-muted/20
              px-8 py-8
              text-muted-foreground
              leading-relaxed
            ">
              <p>
                <span className="font-medium text-foreground">
                  Des exemples concrets, pas des solutions génériques.
                </span>{" "}
                Les projets présentés ici illustrent des problématiques
                fréquemment rencontrées en imagerie médicale
                (CT, IRM, multimodal).
              </p>

              <p>
                Ils ne constituent ni des produits standardisés ni des réponses
                figées. Chaque étude, chaque jeu de données et chaque contexte
                clinique ou de recherche impose des contraintes spécifiques.
              </p>

              <p>
                La démarche repose avant tout sur l’échange et la compréhension
                du besoin réel afin de définir une approche adaptée&nbsp;:
                segmentation, recalage, quantification, développement d’outils
                sur mesure ou accompagnement méthodologique.
              </p>

              <p>
                Les aspects pratiques — périmètre, délais et cadre tarifaire —
                sont abordés de manière simple, transparente et proportionnée,
                en fonction du projet et de ses objectifs.
              </p>

              <p className="pt-6 mt-6 border-t border-border/40 font-medium text-foreground">
                Ces exemples servent de point de départ.{" "}
                <span className="text-primary">
                  Un échange permet d’évaluer rapidement la faisabilité et les
                  options possibles.
                </span>
              </p>
            </div>
          </section>

          {/* ================= SÉPARATEUR ================= */}
          <div className="flex justify-center">
            <div className="h-px w-24 bg-border/60" />
          </div>

          {/* ================= PROJETS ================= */}
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