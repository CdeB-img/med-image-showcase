import { Link, NavLink, useMatch } from "react-router-dom";
import { cn } from "@/lib/utils";
import { projects } from "@/data/projects";
import { useRef, useState } from "react";

export default function Header() {
  const isProjectDetail = useMatch("/projet/:id");

  /* ===============================
     GENERIC DROPDOWN HANDLER
  =============================== */
  const useDropdown = () => {
    const [open, setOpen] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const openMenu = () => {
      if (timer.current) clearTimeout(timer.current);
      setOpen(true);
    };

    const closeMenu = () => {
      timer.current = setTimeout(() => setOpen(false), 200);
    };

    return { open, openMenu, closeMenu, setOpen };
  };

  const irm = useDropdown();
  const ct = useDropdown();
  const methodo = useDropdown();
  const projets = useDropdown();

  /* ===============================
     STYLE
  =============================== */

  const topLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      "px-2 py-1 rounded-md transition",
      "text-muted-foreground hover:text-foreground",
      isActive && "text-foreground bg-white/10"
    );

  const subLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      "block px-4 py-2 text-sm rounded-md transition",
      "text-muted-foreground hover:bg-muted hover:text-foreground",
      isActive && "bg-white/10 text-foreground"
    );

  /* ===============================
     COMPONENT
  =============================== */

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

        <nav className="flex items-center gap-6 text-sm">

          {/* ACCUEIL */}
          <NavLink to="/" className={topLink}>
            Accueil
          </NavLink>

          {/* ================= IRM ================= */}
          <div
            className="relative"
            onMouseEnter={irm.openMenu}
            onMouseLeave={irm.closeMenu}
          >
            <NavLink
              to="/irm-imagerie-quantitative"
              className={topLink}
            >
              IRM
            </NavLink>

            {irm.open && (
              <div className="absolute left-0 mt-2 w-64 rounded-md border border-border bg-background shadow-lg">
                <ul className="py-2">
                  <li><NavLink to="/segmentation-irm" className={subLink}>Segmentation IRM</NavLink></li>
                  <li><NavLink to="/biomarqueurs-irm-cardiaque-essais-cliniques" className={subLink}>Biomarqueurs cardiaques</NavLink></li>
                  <li><NavLink to="/ecv-mapping-t1-t2-irm-cardiaque" className={subLink}>ECV & Mapping</NavLink></li>
                  <li><NavLink to="/perfusion-metabolique-neuro-imagerie" className={subLink}>Perfusion métabolique neuro</NavLink></li>
                  <li><NavLink to="/corelab-essais-cliniques" className={subLink}>Corelab IRM</NavLink></li>
                </ul>
              </div>
            )}
          </div>

          {/* ================= CT ================= */}
          <div
            className="relative"
            onMouseEnter={ct.openMenu}
            onMouseLeave={ct.closeMenu}
          >
            <NavLink
              to="/ct-imagerie-quantitative"
              className={topLink}
            >
              CT
            </NavLink>

            {ct.open && (
              <div className="absolute left-0 mt-2 w-64 rounded-md border border-border bg-background shadow-lg">
                <ul className="py-2">
                  <li><NavLink to="/quantification-ct" className={subLink}>Quantification CT</NavLink></li>
                  <li><NavLink to="/ct-quantitatif-avance-imagerie-spectrale" className={subLink}>CT spectral avancé</NavLink></li>
                  <li><NavLink to="/ct-perfusion-quantitative-avc" className={subLink}>CT perfusion AVC</NavLink></li>
                </ul>
              </div>
            )}
          </div>

          {/* ================= MÉTHODOLOGIE ================= */}
          <div
            className="relative"
            onMouseEnter={methodo.openMenu}
            onMouseLeave={methodo.closeMenu}
          >
            <NavLink
              to="/methodologie-imagerie-quantitative"
              className={topLink}
            >
              Méthodologie
            </NavLink>

            {methodo.open && (
              <div className="absolute left-0 mt-2 w-64 rounded-md border border-border bg-background shadow-lg">
                <ul className="py-2">
                  <li><NavLink to="/ingenierie-imagerie-quantitative" className={subLink}>Ingénierie quantitative</NavLink></li>
                  <li><NavLink to="/bases-multicentriques" className={subLink}>Bases multicentriques</NavLink></li>
                  <li><NavLink to="/analyse-dicom" className={subLink}>Analyse DICOM</NavLink></li>
                  <li><NavLink to="/recalage-multimodal" className={subLink}>Recalage multimodal</NavLink></li>
                </ul>
              </div>
            )}
          </div>

          {/* ================= PROJETS ================= */}
          <div
            className="relative"
            onMouseEnter={projets.openMenu}
            onMouseLeave={projets.closeMenu}
          >
            <NavLink to="/projets" className={topLink}>
              Projets
            </NavLink>

            {projets.open && (
              <div className="absolute left-0 mt-2 w-64 rounded-md border border-border bg-background shadow-lg">
                <ul className="py-2">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <NavLink
                        to={`/projet/${project.id}`}
                        className={subLink}
                      >
                        {project.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CONTACT */}
          <NavLink to="/contact" className={topLink}>
            Contact
          </NavLink>

        </nav>
      </div>
    </header>
  );
}