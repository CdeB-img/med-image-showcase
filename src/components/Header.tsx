import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { projects } from "@/data/projects";
import { useRef, useState } from "react";

export default function Header() {
  const location = useLocation();

  /* ===============================
     DROPDOWN HOOK
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
     ACTIVE DETECTION
  =============================== */

  const isIRM = location.pathname.startsWith("/irm") ||
                location.pathname.includes("segmentation-irm") ||
                location.pathname.includes("cardiaque") ||
                location.pathname.includes("perfusion-metabolique");

  const isCT = location.pathname.startsWith("/ct") ||
               location.pathname.includes("quantification-ct");

  const isMethodo =
    location.pathname.includes("ingenierie") ||
    location.pathname.includes("bases-multicentriques") ||
    location.pathname.includes("analyse-dicom") ||
    location.pathname.includes("recalage");

  const isProjets =
    location.pathname.startsWith("/projet") ||
    location.pathname.startsWith("/projets");

  /* ===============================
     STYLES
  =============================== */

  const topItem = (active: boolean) =>
    cn(
      "relative px-3 py-2 font-medium tracking-wide transition duration-200",
      "text-muted-foreground hover:text-foreground",
      active && "text-foreground"
    );

  const underline = (active: boolean) =>
    cn(
      "absolute left-0 -bottom-[2px] h-[2px] w-full bg-white transition-opacity duration-200",
      active ? "opacity-100" : "opacity-0"
    );

  const subItem =
    "block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition rounded-md";

  /* ===============================
     COMPONENT
  =============================== */

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">

        {/* LOGO */}
        <Link
          to="/"
          className="text-lg font-semibold tracking-[0.15em] hover:opacity-90 transition"
        >
          NOXIA
        </Link>

        <nav className="flex items-center gap-10 text-sm">

          {/* ACCUEIL */}
          <NavLink to="/" className={({ isActive }) => topItem(isActive)}>
            {({ isActive }) => (
              <span className="relative">
                Accueil
                <span className={underline(isActive)} />
              </span>
            )}
          </NavLink>

          {/* ================= IRM ================= */}
          <div
            className="relative"
            onMouseEnter={irm.openMenu}
            onMouseLeave={irm.closeMenu}
          >
            <Link to="/irm-imagerie-quantitative" className={topItem(isIRM)}>
              <span className="relative">
                IRM
                <span className={underline(isIRM)} />
              </span>
            </Link>

            {irm.open && (
              <div className="absolute left-0 mt-4 w-72 rounded-lg border border-border bg-background shadow-xl p-3">
                <ul className="space-y-1">
                  <li><Link to="/segmentation-irm" className={subItem}>Segmentation IRM</Link></li>
                  <li><Link to="/biomarqueurs-irm-cardiaque-essais-cliniques" className={subItem}>Biomarqueurs cardiaques</Link></li>
                  <li><Link to="/ecv-mapping-t1-t2-irm-cardiaque" className={subItem}>ECV & Mapping</Link></li>
                  <li><Link to="/perfusion-metabolique-neuro-imagerie" className={subItem}>Perfusion métabolique neuro</Link></li>
                  <li><Link to="/corelab-essais-cliniques" className={subItem}>Corelab IRM</Link></li>
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
            <Link to="/ct-imagerie-quantitative" className={topItem(isCT)}>
              <span className="relative">
                CT
                <span className={underline(isCT)} />
              </span>
            </Link>

            {ct.open && (
              <div className="absolute left-0 mt-4 w-72 rounded-lg border border-border bg-background shadow-xl p-3">
                <ul className="space-y-1">
                  <li><Link to="/quantification-ct" className={subItem}>Quantification CT</Link></li>
                  <li><Link to="/ct-quantitatif-avance-imagerie-spectrale" className={subItem}>CT spectral avancé</Link></li>
                  <li><Link to="/ct-perfusion-quantitative-avc" className={subItem}>CT perfusion AVC</Link></li>
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
            <Link to="/methodologie-imagerie-quantitative" className={topItem(isMethodo)}>
              <span className="relative">
                Méthodologie
                <span className={underline(isMethodo)} />
              </span>
            </Link>

            {methodo.open && (
              <div className="absolute left-0 mt-4 w-72 rounded-lg border border-border bg-background shadow-xl p-3">
                <ul className="space-y-1">
                  <li><Link to="/ingenierie-imagerie-quantitative" className={subItem}>Ingénierie quantitative</Link></li>
                  <li><Link to="/bases-multicentriques" className={subItem}>Bases multicentriques</Link></li>
                  <li><Link to="/analyse-dicom" className={subItem}>Analyse DICOM</Link></li>
                  <li><Link to="/recalage-multimodal" className={subItem}>Recalage multimodal</Link></li>
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
            <Link to="/projets" className={topItem(isProjets)}>
              <span className="relative">
                Projets
                <span className={underline(isProjets)} />
              </span>
            </Link>

            {projets.open && (
              <div className="absolute left-0 mt-4 w-72 rounded-lg border border-border bg-background shadow-xl p-3">
                <ul className="space-y-1 max-h-80 overflow-y-auto">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <Link
                        to={`/projet/${project.id}`}
                        className={subItem}
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
          <NavLink to="/contact" className={({ isActive }) => topItem(isActive)}>
            {({ isActive }) => (
              <span className="relative">
                Contact
                <span className={underline(isActive)} />
              </span>
            )}
          </NavLink>

        </nav>
      </div>
    </header>
  );
}