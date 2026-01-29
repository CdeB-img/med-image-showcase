import { projects } from "@/data/projects";
import ProjectCard from "./ProjectCard";

/**
 * Charge TOUTES les images présentes dans /public/images
 */
const imageGlob = import.meta.glob(
  "/public/images/**/**/*.png",
  { eager: true, as: "url" }
) as Record<string, string>;

function getSlicesForDir(dirPath: string): string[] {
  return Object.entries(imageGlob)
    .filter(([path]) => path.includes(`/images/${dirPath}/`))
    .map(([, url]) => url)
    .sort();
}

const ProjectGallery = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Projets & Réalisations
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sélection de projets en imagerie médicale.
            Chaque projet est piloté directement par les données.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const firstDir = project.imageDirs[0];
            const slices = getSlicesForDir(firstDir.path);

            return (
              <div
                key={project.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProjectCard
                  project={project}
                  sliceCount={slices.length}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProjectGallery;