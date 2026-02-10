import { projects, projectsEditorial } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

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
    <section className="space-y-10">
      <h2 className="text-2xl font-semibold text-center">{title}</h2>

      <div className="flex flex-wrap justify-center gap-8">
        {items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

const Projects = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-20 px-4">
        <div className="max-w-7xl mx-auto space-y-24">

          {/* HEADER */}
          <section className="max-w-3xl mx-auto space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Projets & expertises en imagerie médicale
            </h1>
          </section>

          {/* EDITORIAL */}
          <section className="max-w-4xl mx-auto space-y-4 text-muted-foreground leading-relaxed">
            {projectsEditorial.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>

          {/* SECTIONS */}
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