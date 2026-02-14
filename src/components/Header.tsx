import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import { projects as _projects } from "@/data/projects";

/* =========================
   CONFIG NAV
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
          { label: "Ingénierie quantitative", path: "/ingenierie-imagerie-imagerie-quantitative" },
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
   NavItem component (desktop + mobile)
   - Desktop: hover + bridge + hoveredChild + clickedChild
   - Mobile: collapsible, label navigue, chevron toggle
   ========================= */
type Child = { label: string; path: string; children?: Child[] };
type NavItemType = { label: string; path: string; children: Child[] };

const NavItem: React.FC<{
  item: NavItemType;
  mobileMode: boolean;
  closeMobileMenu?: () => void;
}> = ({ item, mobileMode, closeMobileMenu }) => {
  const location = useLocation();
  const [openRoot, setOpenRoot] = useState(false);
  const [hoveredChild, setHoveredChild] = useState<string | null>(null);
  const [clickedChild, setClickedChild] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BRIDGE_DELAY = 300;
  const BRIDGE_HEIGHT = 20;
  const idRoot = `submenu-${slugify(item.label)}`;
  const currentFull = `${location.pathname}${location.hash || ""}`;

  useEffect(() => {
    // fermer dropdown et reset hoveredChild au changement de route
    setOpenRoot(false);
    setHoveredChild(null);
    // keep clickedChild (soit on veut qu'il persiste après navigation)
    // si tu préfères le reset, décommenter la ligne suivante :
    // setClickedChild(null);
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
    const p = parsePathWithHash(c.path);
    if (`${p.pathname}${p.hash || ""}` === currentFull) return true;
    if (c.children) {
      return c.children.some((g) => {
        const pg = parsePathWithHash(g.path);
        return `${pg.pathname}${pg.hash || ""}` === currentFull;
      });
    }
    return false;
  });

  // handlers desktop
  const onChildEnter = (childLabel: string) => {
    if (mobileMode) return;
    setHoveredChild(slugify(childLabel));
  };
  const onChildLeave = () => {
    if (mobileMode) return;
    setHoveredChild(null);
  };

  // when user clicks a child (desktop), remember it so it becomes the active column
  const onChildClick = (childLabel: string) => {
    setClickedChild(slugify(childLabel));
    // do not close dropdown here; navigation will occur and Header effect will close mobile if needed
  };

  // compute which child to show in right column:
  // priority: hoveredChild > clickedChild > routeActiveChild > first child
  const computeActiveChild = (): Child | undefined => {
    if (!item.children || item.children.length === 0) return undefined;
    if (hoveredChild) {
      return item.children.find((c) => slugify(c.label) === hoveredChild) || undefined;
    }
    if (clickedChild) {
      return item.children.find((c) => slugify(c.label) === clickedChild) || undefined;
    }
    // route active child
    const routeChild =
      item.children.find((c) => {
        const p = parsePathWithHash(c.path);
        if (`${p.pathname}${p.hash || ""}` === currentFull) return true;
        if (c.children) {
          return c.children.some((g) => {
            const pg = parsePathWithHash(g.path);
            return `${pg.pathname}${pg.hash || ""}` === currentFull;
          });
        }
        return false;
      }) || undefined;
    if (routeChild) return routeChild;
    return item.children[0];
  };

  const activeChild = computeActiveChild();

  return (
    <div className="relative flex items-center h-full">
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

      {/* Desktop dropdown panel with two columns */}
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
              {/* left column: children (IRM, CT, Méthodologie) */}
              <div className="w-1/2">
                <ul className="flex flex-col gap-1">
                  {item.children.map((child) => {
                    const parsed = parsePathWithHash(child.path);
                    const toProp = parsed.hash ? { pathname: parsed.pathname, hash: parsed.hash } : parsed.pathname;
                    const childSlug = slugify(child.label);
                    const childFull = `${parsed.pathname}${parsed.hash || ""}`;
                    const isActiveChild =
                      childFull === currentFull ||
                      (child.children || []).some((g) => {
                        const pg = parsePathWithHash(g.path);
                        return `${pg.pathname}${pg.hash || ""}` === currentFull;
                      });

                    return (
                      <li
                        key={child.label}
                        onMouseEnter={() => onChildEnter(child.label)}
                        onMouseLeave={() => onChildLeave()}
                        className="rounded-md"
                      >
                        <Link
                          to={toProp}
                          onClick={() => onChildClick(child.label)}
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

              {/* right column: grandchildren of activeChild */}
              <div className="w-1/2 border-l border-border/10 pl-4">
                {activeChild ? (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{activeChild.label}</h4>
                    <ul className="flex flex-col gap-1">
                      {activeChild.children && activeChild.children.length > 0 ? (
                        activeChild.children.map((g) => {
                          const pg = parsePathWithHash(g.path);
                          const toProp = pg.hash ? { pathname: pg.pathname, hash: pg.hash } : pg.pathname;
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
                      ) : (
                        <li className="text-sm text-muted-foreground">Aucun sous-élément</li>
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile collapsible handled in Header mobile panel */}
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
                <MobileNavItem item={item as NavItemType} closeMobileMenu={() => setMobileOpen(false)} />
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

/* =========================
   MobileNavItem component
   ========================= */
const MobileNavItem: React.FC<{ item: NavItemType; closeMobileMenu: () => void }> = ({ item, closeMobileMenu }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <Link
          to={item.path}
          onClick={() => closeMobileMenu()}
          className="px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted/10"
        >
          {item.label}
        </Link>
        {item.children && item.children.length > 0 && (
          <button
            onClick={() => setOpen((s) => !s)}
            aria-expanded={open}
            aria-controls={`mobile-${slugify(item.label)}`}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent/10"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>

      {item.children && item.children.length > 0 && (
        <div
          id={`mobile-${slugify(item.label)}`}
          className={cn(
            "overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out pl-4",
            open ? "max-h-[60rem] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <ul className="flex flex-col">
            {item.children.map((child) => (
              <li key={child.label} className="border-b border-border/10">
                <div className="flex items-center justify-between">
                  <Link
                    to={parsePathWithHash(child.path).hash ? { pathname: parsePathWithHash(child.path).pathname, hash: parsePathWithHash(child.path).hash } : child.path}
                    onClick={() => closeMobileMenu()}
                    className="block px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-muted/10"
                  >
                    {child.label}
                  </Link>

                  {child.children && child.children.length > 0 && (
                    <div className="pl-2">
                      <details className="group">
                        <summary className="cursor-pointer list-none px-2 py-2 text-sm rounded-md hover:bg-muted/10">Voir</summary>
                        <ul className="pl-4">
                          {child.children.map((g) => (
                            <li key={g.path}>
                              <NavLink
                                to={parsePathWithHash(g.path).hash ? { pathname: parsePathWithHash(g.path).pathname, hash: parsePathWithHash(g.path).hash } : g.path}
                                onClick={() => closeMobileMenu()}
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
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
