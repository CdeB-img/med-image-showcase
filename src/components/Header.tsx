import { Link, NavLink, useMatch } from "react-router-dom";
import { cn } from "@/lib/utils";
import { projects } from "@/data/projects";
import { useRef, useState } from "react";

export default function Header() {
  const isProjectDetail = useMatch("/projet/:id");

  /* ===============================
     PROJETS MENU STATE
  =============================== */
  const [projectsOpen, setProjectsOpen] = useState(false);
  const projectsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openProjects = () => {
    if (projectsTimer.current) {
      clearTimeout(projectsTimer.current);
      projectsTimer.current = null;
    }
    setProjectsOpen(true);
  };

  const closeProjectsWithDelay = () => {
    projectsTimer.current = setTimeout(() => {
      setProjectsOpen(false);
    }, 300);
  };

  /* ===============================
     EXPERTISE MENU STATE
  =============================== */
  const [expertiseOpen, setExpertiseOpen] = useState(false);
  const expertiseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openExpertise = () => {
    if (expertiseTimer.current) {
      clearTimeout(expertiseTimer.current);
      expertiseTimer.current = null;
    }
    setExpertiseOpen(true);
  };

  const closeExpertiseWithDelay = () => {
    expertiseTimer.current = setTimeout(() => {
      setExpertiseOpen(false);
    }, 300);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">

        {/* LOGO */}
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight hover:opacity-90 transition"
        >
          NOXIA
        </Link>

        {/* NAVIGATION */}
        <nav className="flex items-center gap-6 text-sm">

          {/* ACCUEIL */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "text-muted-foreground hover:text-foreground transition",
                isActive && "text-foreground font-medium"
              )
            }
          >
            Accueil
          </NavLink>

          {/* ================= EXPERTISES ================= */}
          <div
            className="relative"
            onMouseEnter={openExpertise}
            onMouseLeave={closeExpertiseWithDelay}
          >
            <span className="text-muted-foreground hover:text-foreground transition cursor-pointer">
              Expertises
            </span>

            {expertiseOpen && (
              <div className="absolute left-0 mt-2 min-w-[260px] rounded-md border border-border bg-background shadow-lg">
                <ul className="py-2">

                  <li>
                    <Link
                      to="/segmentation-irm"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      onClick={() => setExpertiseOpen(false)}
                    >
                      Segmentation IRM
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/analyse-dicom"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      onClick={() => setExpertiseOpen(false)}
                    >
                      Analyse DICOM
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/quantification-ct"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      onClick={() => setExpertiseOpen(false)}
                    >
                      Quantification CT
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/recalage-multimodal"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      onClick={() => setExpertiseOpen(false)}
                    >
                      Recalage multimodal
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/bases-multicentriques"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      onClick={() => setExpertiseOpen(false)}
                    >
                      Bases multicentriques
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/corelab-essais-cliniques"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      onClick={() => setExpertiseOpen(false)}
                    >
                      Corelab & Essais Cliniques
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/biomarqueurs-irm-cardiaque-essais-cliniques"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      onClick={() => setExpertiseOpen(false)}
                    >
                      Biomarqueurs IRM Cardiaque en Essais Randomisés
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/ecv-mapping-t1-t2-irm-cardiaque"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      onClick={() => setExpertiseOpen(false)}
                    >
                      ECV Mapping
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/perfusion-metabolique-neuro-imagerie"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      onClick={() => setExpertiseOpen(false)}
                    >
                      Perfusion métabolique en neuro-imagerie
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/ingenierie-imagerie-quantitative"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      onClick={() => setExpertiseOpen(false)}
                    >
                      Perfusion métabolique en neuro-imagerie
                    </Link>
                  </li>



                </ul>
              </div>
            )}
          </div>

          {/* ================= PROJETS ================= */}
          <div
            className="relative"
            onMouseEnter={openProjects}
            onMouseLeave={closeProjectsWithDelay}
          >
            <NavLink
              to="/projets"
              className={({ isActive }) =>
                cn(
                  "text-muted-foreground hover:text-foreground transition",
                  (isActive || isProjectDetail) &&
                    "text-foreground font-medium"
                )
              }
            >
              Projets
            </NavLink>

            {projectsOpen && (
              <div className="absolute left-0 mt-2 min-w-[260px] rounded-md border border-border bg-background shadow-lg">
                <ul className="py-2">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <Link
                        to={`/projet/${project.id}`}
                        className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                        onClick={() => setProjectsOpen(false)}
                      >
                        {project.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CONTACT */}
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              cn(
                "text-muted-foreground hover:text-foreground transition",
                isActive && "text-foreground font-medium"
              )
            }
          >
            Contact
          </NavLink>

        </nav>
      </div>
    </header>
  );
}