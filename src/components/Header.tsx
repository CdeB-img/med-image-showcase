import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import { projects as _projects } from "@/data/projects";

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

const NavItem: React.FC<{
  item: NavItemType;
  mobileMode: boolean;
  closeMobileMenu?: () => void;
}> = ({ item, mobileMode, closeMobileMenu }) => {
  const location = useLocation();
  const [openRoot, setOpenRoot] = useState(false); // top-level dropdown open
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BRIDGE_DELAY = 300; // ms
  const BRIDGE_HEIGHT = 20; // px
  const idRoot = `submenu-${slugify(item.label)}`;

  const currentFull = `${location.pathname}${location.hash || ""}`;

  useEffect(() => {
    // fermer quand on navigue
    setOpenRoot(false);
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
      timerRef.current = null;
    }, BRIDGE_DELAY);
  };

  // détection d'activité (pour style actif du parent)
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

  /* Render d'un child (peut avoir grandchildren) */
  const ChildRow: React.FC<{ child: Child }> = ({ child }) => {
    const parsed = parsePathWithHash(child.path);
    const childFull = `${parsed.pathname}${parsed.hash || ""}`;
    const childActive =
      childFull === currentFull ||
      (child.children || []).some((g) => {
        const pg = parsePathWithHash(g.path);
        return `${pg.pathname}${pg.hash || ""}` === currentFull;
      });

    const [openSecond, setOpenSecond] = useState(false);
    useEffect(() => setOpenSecond(false), [location.pathname, location.hash]);

    return (
      <div className="w-full">
        <div className="flex items-center justify-between">
          <Link
            to={parsed.hash ? { pathname: parsed.pathname, hash: parsed.hash } : parsed.pathname}
            onClick={() => mobileMode && closeMobileMenu && closeMobileMenu()}
            className={cn(
              "px-3 py-2 text-sm w-full text-left rounded-md",
              childActive ? "text-primary bg-primary/5 font-medium" : "text-muted-foreground hover:bg-muted/10"
            )}
          >
            {child.label}
          </Link>

          {child.children && child.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenSecond((s) => !s);
              }}
              aria-expanded={openSecond}
              aria-controls={`sub2-${slugify(child.label)}`}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent/10"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", openSecond && "rotate-180")} />
            </button>
          )}
        </div>

        {/* grandchildren (mobile collapsible) */}
        {mobileMode && child.children && child.children.length > 0 && (
          <div
            id={`sub2-${slugify(child.label)}`}
            className={cn(
              "pl-4 overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out",
              openSecond ? "max-h-[30rem] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <ul className="flex flex-col">
              {child.children.map((g) => {
                const pg = parsePathWithHash(g.path);
                const toProp = pg.hash ? { pathname: pg.pathname, hash: pg.hash } : pg.pathname;
                return (
                  <li key={g.path}>
                    <NavLink
                      to={toProp}
                      onClick={() => closeMobileMenu && closeMobileMenu()}
                      className={({ isActive }) =>
                        cn(
                          "block px-4 py-2 text-sm rounded-md",
                          isActive ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:bg-muted/10"
                        )
                      }
                    >
                      {g.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
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

      {/* Desktop dropdown panel */}
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
          <div className="overflow-hidden rounded-lg border border-border/50 bg-background/95 shadow-xl backdrop-blur-md ring-1 ring-black/5 p-3 w-80">
            <div className="grid grid-cols-1 gap-2">
              {item.children.map((child) => (
                <div key={child.label} className="group">
                  <div className="flex items-start justify-between">
                    <Link
                      to={parsePathWithHash(child.path).hash ? { pathname: parsePathWithHash(child.path).pathname, hash: parsePathWithHash(child.path).hash } : child.path}
                      className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted/10"
                    >
                      {child.label}
                    </Link>

                    {child.children && child.children.length > 0 && (
                      <div className="hidden group-hover:flex flex-col ml-2">
                        <div className="bg-muted/5 rounded-md p-2">
                          {child.children.map((g) => (
                            <NavLink
                              key={g.path}
                              to={parsePathWithHash(g.path).hash ? { pathname: parsePathWithHash(g.path).pathname, hash: parsePathWithHash(g.path).hash } : g.path}
                              className={({ isActive }) =>
                                cn(
                                  "block px-3 py-1 text-sm rounded-md",
                                  isActive ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:text-foreground"
                                )
                              }
                            >
                              {g.label}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
