import { Link, NavLink, useLocation, useMatch } from "react-router-dom";
import { cn } from "@/lib/utils";
import { projects } from "@/data/projects";
import { useRef, useState } from "react";

export default function Header() {
  const location = useLocation();
  const isProjectDetail = useMatch("/projet/:id");

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
      timer.current = setTimeout(() => setOpen(false), 250);
    };

    return { open, openMenu, closeMenu, setOpen };
  };

  const irm = useDropdown();
  const ct = useDropdown();
  const methodo = useDropdown();
  const projets = useDropdown();

  /* ===============================
     PATH HELPERS
  =============================== */
  const path = location.pathname;
  const isProjectPage = path === "/projets" || path.startsWith("/projet/");
  const projectId = path.startsWith("/projet/") ? path.split("/projet/")[1]?.split("/")[0] : null;

  // ✅ IMPORTANT : ici on classe les projets (pour avoir IRM+Projets ou CT+Projets)
  // Ajustez ces listes selon vos IDs réels dans projects.ts
  const IRM_PROJECT_IDS = new Set([
    "cardiac",
    "neuro-onco",
    "perfusion-segmentation",
  ]);

  const CT_PROJECT_IDS = new Set([
    "ct-scan",
  ]);

  // Si vous avez un projet "recalage" qui est à cheval IRM/CT, vous choisissez :
  // - soit le mettre nulle part (seulement Projets actif),
  // - soit le mettre dans IRM, CT, ou les deux.
  // Ici : on le laisse neutre (uniquement Projets).
  const NEUTRAL_PROJECT_IDS = new Set([
    "recalage",
  ]);

  const isProjectIRM =
    isProjectPage && !!projectId && (IRM_PROJECT_IDS.has(projectId) || false);

  const isProjectCT =
    isProjectPage && !!projectId && (CT_PROJECT_IDS.has(projectId) || false);

  // ===============================
  // ACTIVE SECTIONS (déterministes)
  // ===============================

  // IRM : pages IRM + projets IRM
  const isIRM =
    path === "/irm-imagerie-quantitative" ||
    path === "/segmentation-irm" ||
    path === "/biomarqueurs-irm-cardiaque-essais-cliniques" ||
    path === "/ecv-mapping-t1-t2-irm-cardiaque" ||
    path === "/perfusion-metabolique-neuro-imagerie" ||
    path === "/corelab-essais-cliniques" || // ✅ vous aviez un cas où ça ne marchait pas
    isProjectIRM;

  // CT : pages CT + projets CT
  const isCT =
    path === "/ct-imagerie-quantitative" ||
    path === "/quantification-ct" ||
    path === "/ct-quantitatif-avance-imagerie-spectrale" ||
    path === "/ct-perfusion-quantitative-avc" ||
    isProjectCT;

  // Méthodologie : uniquement pages méthodo (jamais sur projets)
  const isMethodo =
    path === "/methodologie-imagerie-quantitative" ||
    path === "/ingenierie-imagerie-quantitative" ||
    path === "/bases-multicentriques" ||
    path === "/analyse-dicom" ||
    path === "/recalage-multimodal";

  // Projets : /projets et /projet/:id (comme votre ancienne logique)
  const isProjets = path === "/projets" || !!isProjectDetail;

  /* ===============================
     STYLES
  =============================== */
  const topLinkBase =
    "relative px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition";
  const topLinkActive = "text-foreground font-medium";

  const underline = (active: boolean) =>
    cn(
      "absolute left-0 -bottom-[6px] h-[2px] w-full bg-white/90 transition-opacity duration-200",
      active ? "opacity-100" : "opacity-0"
    );

  const menuItemBase =
    "block px-4 py-2 text-sm rounded-md transition";
  const menuItemInactive =
    "text-muted-foreground hover:bg-muted hover:text-foreground";
  const menuItemActive =
    "bg-muted text-foreground";

  const MenuLink = ({
    to,
    children,
    onClick,
  }: {
    to: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          menuItemBase,
          isActive ? menuItemActive : menuItemInactive
        )
      }
      onClick={onClick}
    >
      {children}
    </NavLink>
  );

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

        <nav className="flex items-center gap-6">
          {/* ACCUEIL */}
          <NavLink
            to="/"
            className={({ isActive }) => cn(topLinkBase, isActive && topLinkActive)}
          >
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
            <NavLink
              to="/irm-imagerie-quantitative"
              className={cn(topLinkBase, isIRM && topLinkActive)}
            >
              <span className="relative">
                IRM
                <span className={underline(isIRM)} />
              </span>
            </NavLink>

            {irm.open && (
              <div className="absolute left-0 mt-2 min-w-[280px] rounded-md border border-border bg-background shadow-lg p-2">
                <ul className="space-y-1">
                  <li><MenuLink to="/irm-imagerie-quantitative" onClick={() => irm.setOpen(false)}>Vue d’ensemble IRM</MenuLink></li>
                  <li><MenuLink to="/segmentation-irm" onClick={() => irm.setOpen(false)}>Segmentation IRM</MenuLink></li>
                  <li><MenuLink to="/biomarqueurs-irm-cardiaque-essais-cliniques" onClick={() => irm.setOpen(false)}>Biomarqueurs cardiaques</MenuLink></li>
                  <li><MenuLink to="/ecv-mapping-t1-t2-irm-cardiaque" onClick={() => irm.setOpen(false)}>ECV & Mapping</MenuLink></li>
                  <li><MenuLink to="/perfusion-metabolique-neuro-imagerie" onClick={() => irm.setOpen(false)}>Perfusion métabolique neuro</MenuLink></li>
                  <li><MenuLink to="/corelab-essais-cliniques" onClick={() => irm.setOpen(false)}>Corelab IRM</MenuLink></li>
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
              className={cn(topLinkBase, isCT && topLinkActive)}
            >
              <span className="relative">
                CT
                <span className={underline(isCT)} />
              </span>
            </NavLink>

            {ct.open && (
              <div className="absolute left-0 mt-2 min-w-[280px] rounded-md border border-border bg-background shadow-lg p-2">
                <ul className="space-y-1">
                  <li><MenuLink to="/ct-imagerie-quantitative" onClick={() => ct.setOpen(false)}>Vue d’ensemble CT</MenuLink></li>
                  <li><MenuLink to="/quantification-ct" onClick={() => ct.setOpen(false)}>Quantification CT</MenuLink></li>
                  <li><MenuLink to="/ct-quantitatif-avance-imagerie-spectrale" onClick={() => ct.setOpen(false)}>CT spectral avancé</MenuLink></li>
                  <li><MenuLink to="/ct-perfusion-quantitative-avc" onClick={() => ct.setOpen(false)}>CT perfusion AVC</MenuLink></li>
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
              className={cn(topLinkBase, isMethodo && topLinkActive)}
            >
              <span className="relative">
                Méthodologie
                <span className={underline(isMethodo)} />
              </span>
            </NavLink>

            {methodo.open && (
              <div className="absolute left-0 mt-2 min-w-[280px] rounded-md border border-border bg-background shadow-lg p-2">
                <ul className="space-y-1">
                  <li><MenuLink to="/methodologie-imagerie-quantitative" onClick={() => methodo.setOpen(false)}>Vue d’ensemble</MenuLink></li>
                  <li><MenuLink to="/ingenierie-imagerie-quantitative" onClick={() => methodo.setOpen(false)}>Ingénierie quantitative</MenuLink></li>
                  <li><MenuLink to="/bases-multicentriques" onClick={() => methodo.setOpen(false)}>Bases multicentriques</MenuLink></li>
                  <li><MenuLink to="/analyse-dicom" onClick={() => methodo.setOpen(false)}>Analyse DICOM</MenuLink></li>
                  <li><MenuLink to="/recalage-multimodal" onClick={() => methodo.setOpen(false)}>Recalage multimodal</MenuLink></li>
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
              className={cn(topLinkBase, isProjets && topLinkActive)}
            >
              <span className="relative">
                Projets
                <span className={underline(isProjets)} />
              </span>
            </NavLink>

            {projets.open && (
              <div className="absolute left-0 mt-2 min-w-[320px] rounded-md border border-border bg-background shadow-lg p-2">
                <ul className="space-y-1 max-h-80 overflow-y-auto">
                  <li>
                    <MenuLink to="/projets" onClick={() => projets.setOpen(false)}>
                      Vue d’ensemble
                    </MenuLink>
                  </li>

                  <li className="my-1 border-t border-border/60" />

                  {projects.map((project) => (
                    <li key={project.id}>
                      <NavLink
                        to={`/projet/${project.id}`}
                        className={({ isActive }) =>
                          cn(
                            menuItemBase,
                            isActive ? menuItemActive : menuItemInactive
                          )
                        }
                        onClick={() => projets.setOpen(false)}
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
          <NavLink
            to="/contact"
            className={({ isActive }) => cn(topLinkBase, isActive && topLinkActive)}
          >
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