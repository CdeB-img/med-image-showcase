import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import { projects as _projects } from "@/data/projects";
import { T } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";

/* =========================
   CONFIGURATION NAV
   - "Expertise" regroupe IRM / CT / Méthodologie
   - Prestations utilise des ancres (#corelab, ...)
   ========================= */
const projects = Array.isArray(_projects) ? _projects : [];

const NAV_CONFIG = [
  {
    label: "Expertise",
    path: "/expertise",
    children: [
      {
        label: "IRM",
        path: "/irm-imagerie-quantitative",
        children: [
          { label: "Segmentation IRM", path: "/segmentation-irm" },
          { label: "Biomarqueurs cardiaques", path: "/biomarqueurs-irm-cardiaque-essais-cliniques" },
          { label: "ECV & Mapping", path: "/ecv-mapping-t1-t2-irm-cardiaque" },
          { label: "Perfusion métabolique neuro", path: "/perfusion-metabolique-neuro-imagerie" },
          { label: "Corelab IRM", path: "/corelab-essais-cliniques" },
        ],
      },
      {
        label: "CT",
        path: "/ct-imagerie-quantitative",
        children: [
          { label: "Quantification CT", path: "/quantification-ct" },
          { label: "CT spectral avancé", path: "/ct-quantitatif-avance-imagerie-spectrale" },
          { label: "CT perfusion AVC", path: "/ct-perfusion-quantitative-avc" },
        ],
      },
      {
        label: "Méthodologie",
        path: "/methodologie-imagerie-quantitative",
        children: [
          { label: "Ingénierie quantitative", path: "/ingenierie-imagerie-quantitative" },
          { label: "Bases multicentriques", path: "/bases-multicentriques" },
          { label: "Analyse DICOM", path: "/analyse-dicom" },
          { label: "Recalage multimodal", path: "/recalage-multimodal" },
        ],
      },
    ],
  },
  {
    label: "Prestations",
    path: "/prestations",
    children: [
      { label: "CoreLab externalisé", path: "/prestations#corelab" },
      { label: "Reprise d’études", path: "/prestations#reprise" },
      { label: "Audit méthodologique", path: "/prestations#audit" },
      { label: "Développement sur mesure", path: "/prestations#ingenierie" },
    ],
  },
  {
    label: "Projets",
    path: "/projets",
    children: projects.map((p) => ({ label: p.title, path: `/projet/${p.id}` })),
  },
];

/* =========================
   Helpers
   ========================= */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const parsePathWithHash = (p: string) => {
  const [pathnamePart, hashPart] = p.split("#");
  return {
    pathname: pathnamePart || "/",
    hash: hashPart ? `#${hashPart}` : "",
    original: p,
  };
};

/* =========================
   NavItem (gère 2 niveaux : children et grandchildren)
   - desktop: hover + bridge pour éviter fermetures intempestives
   - mobile: collapsible, label navigue, chevron toggle
   ========================= */

type Child = { label: string; path: string; children?: Child[] };
type NavItemType = { label: string; path: string; children: Child[] };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const NavItem: React.FC<{
  item: NavItemType;
  mobileMode: boolean;
  closeMobileMenu?: () => void;
}> = ({ item, mobileMode, closeMobileMenu }) => {
  const location = useLocation();
  const [openRoot, setOpenRoot] = useState(false);
  const [hoveredChild, setHoveredChild] = useState<string | null>(null); // slug du child survolé (desktop)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BRIDGE_DELAY = 300;
  const BRIDGE_HEIGHT = 20;
  const idRoot = `submenu-${slugify(item.label)}`;
  const currentFull = `${location.pathname}${location.hash || ""}`;

  useEffect(() => {
    setOpenRoot(false);
    setHoveredChild(null);
  }, [location.pathname, location.hash]);

  const openNow = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpenRoot(true);
  };
  const closeWithDelay = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setOpenRoot(false);
      setHoveredChild(null);
      timerRef.current = null;
    }, BRIDGE_DELAY);
  };

  // parent actif si un descendant correspond à la route courante
  const parentActive = (item.children || []).some((c) => {
    const p = c.path.split("#");
    const childFull = `${p[0]}${p[1] ? `#${p[1]}` : ""}`;
    if (childFull === currentFull) return true;
    if (c.children) {
      return c.children.some((g) => {
        const pg = g.path.split("#");
        return `${pg[0]}${pg[1] ? `#${pg[1]}` : ""}` === currentFull;
      });
    }
    return false;
  });

  /* --- Desktop child hover handler: set hoveredChild to show grandchildren column --- */
  const onChildEnter = (childLabel: string) => {
    if (mobileMode) return;
    setHoveredChild(slugify(childLabel));
  };
  const onChildLeave = () => {
    if (mobileMode) return;
    // on ne clear pas immédiatement : on laisse hoveredChild pour fluidité,
    // mais on lance la fermeture différée si on sort du panneau (handled elsewhere)
    setHoveredChild(null);
  };

  return (
    <div className="relative flex items-center h-full">
      {/* Parent label + chevron */}
      <div
        className="flex items-center gap-2"
        onMouseEnter={() => !mobileMode && openNow()}
        onMouseLeave={() => !mobileMode && closeWithDelay()}
      >
        <Link
          to={item.path}
          onClick={() => mobileMode && closeMobileMenu && closeMobileMenu()}
          className={cn(
            "group flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md",
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none",
            parentActive ? "text-primary bg-primary/10" : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>

        {item.children && item.children.length > 0 && (
          <button
            aria-expanded={openRoot}
            aria-controls={idRoot}
            onClick={(e) => {
              e.stopPropagation();
              setOpenRoot((s) => !s);
            }}
            className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent/10", openRoot && "rotate-180")}
            title={openRoot ? "Fermer" : "Ouvrir"}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", openRoot && "rotate-180")} />
          </button>
        )}
      </div>

      {/* Bridge invisible (desktop only) */}
      {!mobileMode && item.children && item.children.length > 0 && (
        <div
          onMouseEnter={() => openNow()}
          onMouseLeave={() => closeWithDelay()}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            height: `${BRIDGE_HEIGHT}px`,
            pointerEvents: "auto",
            zIndex: 40,
          }}
        />
      )}

      {/* Dropdown panel (desktop) : contient 2 colonnes côte à côte
          - colonne gauche : liste des children (IRM, CT, Méthodologie)
          - colonne droite : grandchildren du child survolé (ou du premier child actif)
      */}
      {!mobileMode && item.children && item.children.length > 0 && (
        <div
          className={cn(
            "absolute top-full left-0 pt-2 z-50 transition-all duration-150 ease-in-out origin-top-left",
            openRoot ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 invisible pointer-events-none"
          )}
          onMouseEnter={() => {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            setOpenRoot(true);
          }}
          onMouseLeave={() => closeWithDelay()}
        >
          <div className="overflow-hidden rounded-lg border border-border/50 bg-background/95 shadow-xl backdrop-blur-md ring-1 ring-black/5 p-3 w-[720px]">
            <div className="flex gap-4">
              {/* Colonne gauche : children */}
              <div className="w-1/2">
                <ul className="flex flex-col gap-1">
                  {item.children.map((child) => {
                    const parsed = child.path.split("#");
                    const toPath = parsed[0];
                    const childSlug = slugify(child.label);
                    const childFull = `${parsed[0]}${parsed[1] ? `#${parsed[1]}` : ""}`;
                    const isActiveChild = childFull === currentFull || (child.children || []).some((g) => {
                      const pg = g.path.split("#");
                      return `${pg[0]}${pg[1] ? `#${pg[1]}` : ""}` === currentFull;
                    });

                    return (
                      <li
                        key={child.label}
                        onMouseEnter={() => onChildEnter(child.label)}
                        onMouseLeave={() => onChildLeave()}
                        className="rounded-md"
                      >
                        <Link
                          to={child.path.includes("#") ? { pathname: toPath, hash: `#${child.path.split("#")[1]}` } : toPath}
                          className={cn(
                            "block px-3 py-2 text-sm rounded-md",
                            isActiveChild ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:bg-muted/10"
                          )}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Colonne droite : grandchildren du child survolé (ou du premier child actif) */}
              <div className="w-1/2 border-l border-border/10 pl-4">
                {(() => {
                  // priorité : hoveredChild, sinon premier child actif, sinon premier child
                  const activeChild =
                    hoveredChild
                      ? item.children.find((c) => slugify(c.label) === hoveredChild)
                      : item.children.find((c) =>
                          (c.path.split("#")[0] === location.pathname) ||
                          (c.children || []).some((g) => g.path.split("#")[0] === location.pathname)
                        ) || item.children[0];

                  if (!activeChild) return null;
                  const grandchildren = activeChild.children || [];

                  return (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">{activeChild.label}</h4>
                      <ul className="flex flex-col gap-1">
                        {grandchildren.length === 0 ? (
                          <li className="text-sm text-muted-foreground">Aucun sous-élément</li>
                        ) : (
                          grandchildren.map((g) => {
                            const pg = g.path.split("#");
                            const toProp = pg[1] ? { pathname: pg[0], hash: `#${pg[1]}` } : pg[0];
                            return (
                              <li key={g.path}>
                                <NavLink
                                  to={toProp}
                                  className={({ isActive }) =>
                                    cn(
                                      "block px-3 py-2 text-sm rounded-md",
                                      isActive ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:bg-muted/10"
                                    )
                                  }
                                >
                                  {g.label}
                                </NavLink>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}







      {/* Mobile collapsible panel */}
      {mobileMode && item.children && item.children.length > 0 && (
        <div className="w-full">
          <div
            id={idRoot}
            className={cn(
              "overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out",
              openRoot ? "max-h-[60rem] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <ul className="flex flex-col pl-2">
              {item.children.map((child) => (
                <li key={child.label} className="w-full border-b border-border/10">
                  <ChildRow child={child} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================
   Header principal
   ========================= */
export default function Header(): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="mr-4 flex items-center space-x-2 transition-opacity hover:opacity-80">
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            NOXIA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground",
                isActive ? "text-foreground bg-accent/50" : "text-muted-foreground"
              )
            }
          >
            Accueil
          </NavLink>

          {NAV_CONFIG.map((item) => (
            <NavItem key={item.label} item={item as NavItemType} mobileMode={false} />
          ))}

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              cn(
                "px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground",
                isActive ? "text-foreground bg-accent/50" : "text-muted-foreground"
              )
            }
          >
            Contact
          </NavLink>
        </nav>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setMobileOpen((s) => !s)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent/10"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        className={cn(
          "md:hidden border-t border-border/30 bg-background/95 transition-[max-height,opacity] duration-200 ease-in-out overflow-hidden",
          mobileOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="container mx-auto px-4 py-4">
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 text-sm font-medium rounded-md",
                  isActive ? "text-foreground bg-accent/50" : "text-muted-foreground hover:bg-muted/10"
                )
              }
            >
              Accueil
            </NavLink>

            {NAV_CONFIG.map((item) => (
              <div key={item.label} className="w-full">
                <NavItem item={item as NavItemType} mobileMode={true} closeMobileMenu={() => setMobileOpen(false)} />
              </div>
            ))}

            <NavLink
              to="/contact"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 text-sm font-medium rounded-md",
                  isActive ? "text-foreground bg-accent/50" : "text-muted-foreground hover:bg-muted/10"
                )
              }
            >
              Contact
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
