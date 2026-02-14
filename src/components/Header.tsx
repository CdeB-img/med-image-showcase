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
      timer.current = setTimeout(() => {
        setOpen(false);
      }, 250);
    };

    return { open, openMenu, closeMenu, setOpen };
  };

  const irm = useDropdown();
  const ct = useDropdown();
  const methodo = useDropdown();
  const projets = useDropdown();

  const menuItem =
    "block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition";

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

          {/* ================= IRM ================= */}
          <div
            className="relative"
            onMouseEnter={irm.openMenu}
            onMouseLeave={irm.closeMenu}
          >
            <span className="cursor-pointer text-muted-foreground hover:text-foreground transition">
              IRM
            </span>

            {irm.open && (
              <div className="absolute left-0 mt-2 min-w-[260px] rounded-md border border-border bg-background shadow-lg">
                <ul className="py-2">
                  <li><Link to="/irm-imagerie-quantitative" className={menuItem}>IRM – Vue d’ensemble</Link></li>
                  <li><Link to="/segmentation-irm" className={menuItem}>Segmentation IRM</Link></li>
                  <li><Link to="/biomarqueurs-irm-cardiaque-essais-cliniques" className={menuItem}>Biomarqueurs cardiaques</Link></li>
                  <li><Link to="/ecv-mapping-t1-t2-irm-cardiaque" className={menuItem}>ECV & Mapping</Link></li>
                  <li><Link to="/perfusion-metabolique-neuro-imagerie" className={menuItem}>Perfusion métabolique neuro</Link></li>
                  <li><Link to="/corelab-essais-cliniques" className={menuItem}>Corelab IRM</Link></li>
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
            <span className="cursor-pointer text-muted-foreground hover:text-foreground transition">
              CT
            </span>

            {ct.open && (
              <div className="absolute left-0 mt-2 min-w-[260px] rounded-md border border-border bg-background shadow-lg">
                <ul className="py-2">
                  <li><Link to="/ct-imagerie-quantitative" className={menuItem}>CT – Vue d’ensemble</Link></li>
                  <li><Link to="/quantification-ct" className={menuItem}>Quantification CT</Link></li>
                  <li><Link to="/ct-quantitatif-avance-imagerie-spectrale" className={menuItem}>CT spectral avancé</Link></li>
                  <li><Link to="/ct-perfusion-quantitative-avc" className={menuItem}>CT perfusion AVC</Link></li>
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
            <span className="cursor-pointer text-muted-foreground hover:text-foreground transition">
              Méthodologie
            </span>

            {methodo.open && (
              <div className="absolute left-0 mt-2 min-w-[260px] rounded-md border border-border bg-background shadow-lg">
                <ul className="py-2">
                  <li><Link to="/ingenierie-imagerie-quantitative" className={menuItem}>Ingénierie quantitative</Link></li>
                  <li><Link to="/bases-multicentriques" className={menuItem}>Bases multicentriques</Link></li>
                  <li><Link to="/analyse-dicom" className={menuItem}>Analyse DICOM</Link></li>
                  <li><Link to="/recalage-multimodal" className={menuItem}>Recalage multimodal</Link></li>
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
            <NavLink
              to="/projets"
              className={({ isActive }) =>
                cn(
                  "text-muted-foreground hover:text-foreground transition",
                  (isActive || isProjectDetail) && "text-foreground font-medium"
                )
              }
            >
              Projets
            </NavLink>

            {projets.open && (
              <div className="absolute left-0 mt-2 min-w-[260px] rounded-md border border-border bg-background shadow-lg">
                <ul className="py-2">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <Link
                        to={`/projet/${project.id}`}
                        className={menuItem}
                        onClick={() => projets.setOpen(false)}
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