import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import { projects as _projects } from "@/data/projects";

/* =========================
   NAV CONFIG (sécurisé si projects undefined)
   ========================= */
const projects = Array.isArray(_projects) ? _projects : [];

const NAV_CONFIG = [
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

type Child = { label: string; path: string };
type NavItemType = { label: string; path: string; children: Child[] };

/**
 * Parse un chemin qui peut contenir un hash.
 * Ex: "/prestations#corelab" => { pathname: "/prestations", hash: "#corelab" }
 * Ex: "/segmentation-irm" => { pathname: "/segmentation-irm", hash: "" }
 */
const parsePathWithHash = (p: string) => {
  const [pathnamePart, hashPart] = p.split("#");
  return {
    pathname: pathnamePart || "/",
    hash: hashPart ? `#${hashPart}` : "",
    original: p,
  };
};

/* =========================
   NavItem component
   ========================= */
const NavItem: React.FC<{
  item: NavItemType;
  mobileMode: boolean;
  closeMobileMenu?: () => void;
}> = ({ item, mobileMode, closeMobileMenu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submenuId = `submenu-${slugify(item.label)}`;

  // Détermine si le parent est actif : on compare pathname et hash
  const parentParsed = parsePathWithHash(item.path);
  const currentFull = `${location.pathname}${location.hash || ""}`;
  const parentFull = `${parentParsed.pathname}${parentParsed.hash || ""}`;

  const isActive =
    currentFull === parentFull ||
    item.children.some((c) => {
      const parsed = parsePathWithHash(c.path);
      return `${parsed.pathname}${parsed.hash || ""}` === currentFull;
    });

  useEffect(() => {
    // fermer le sous-menu au changement de route
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  // Hover desktop
  const handleMouseEnter = () => {
    if (mobileMode) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };
  const handleMouseLeave = () => {
    if (mobileMode) return;
    timerRef.current = setTimeout(() => setIsOpen(false), 120);
  };

  return (
    <div
      className="relative flex items-center h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-2">
        {/* Label parent : toujours navigable. Si hash présent, on navigue vers pathname (hash géré par children). */}
        <Link
          to={parentParsed.hash ? { pathname: parentParsed.pathname, hash: parentParsed.hash } : parentParsed.pathname}
          onClick={() => {
            if (mobileMode && closeMobileMenu) closeMobileMenu();
          }}
          className={cn(
            "group flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md",
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none",
            isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>

        {/* Chevron visible partout ; toggle le sous-menu sans naviguer */}
        {item.children.length > 0 && (
          <button
            aria-expanded={isOpen}
            aria-controls={submenuId}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((s) => !s);
            }}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md transition-transform",
              "hover:bg-accent/10",
              isOpen && "rotate-180"
            )}
            title={isOpen ? "Fermer sous-menu" : "Ouvrir sous-menu"}
          >
            <ChevronDown className={cn("h-4 w-4 opacity-70", isOpen && "rotate-180")} />
          </button>
        )}
      </div>

      {/* Desktop absolute dropdown */}
      {!mobileMode && item.children.length > 0 && (
        <div
          className={cn(
            "absolute top-full left-0 pt-2 w-64 z-50 transition-all duration-180 ease-in-out origin-top-left",
            isOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 invisible pointer-events-none"
          )}
        >
          <div className="overflow-hidden rounded-lg border border-border/50 bg-background/95 shadow-xl backdrop-blur-md ring-1 ring-black/5">
            <ul className="py-2 flex flex-col">
              {item.children.map((child) => {
                const parsed = parsePathWithHash(child.path);
                const childFull = `${parsed.pathname}${parsed.hash || ""}`;
                const activeChild = childFull === currentFull;

                return (
                  <li key={child.path}>
                    <NavLink
                      to={parsed.hash ? { pathname: parsed.pathname, hash: parsed.hash } : parsed.pathname}
                      className={({ isActive: navIsActive }) =>
                        cn(
                          "relative block px-4 py-2.5 text-sm transition-colors hover:bg-muted/50",
                          activeChild || navIsActive
                            ? "text-primary font-medium bg-primary/5"
                            : "text-muted-foreground hover:text-foreground"
                        )
                      }
                    >
                      <span
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-[2px] bg-primary transition-opacity duration-200",
                          activeChild ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {child.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Mobile inline collapsible list */}
      {mobileMode && item.children.length > 0 && (
        <div className="w-full">
          <div
            id={submenuId}
            className={cn(
              "overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out",
              isOpen ? "max-h-[40rem] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <ul className="flex flex-col pl-4">
              {item.children.map((child) => {
                const parsed = parsePathWithHash(child.path);
                const toProp = parsed.hash ? { pathname: parsed.pathname, hash: parsed.hash } : parsed.pathname;

                return (
                  <li key={child.path}>
                    <NavLink
                      to={toProp}
                      onClick={() => closeMobileMenu && closeMobileMenu()}
                      className={({ isActive: navIsActive }) =>
                        cn(
                          "block px-4 py-2 text-sm transition-colors rounded-md",
                          navIsActive ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:bg-muted/10"
                        )
                      }
                    >
                      {child.label}
                    </NavLink>
                  </li>
                );
              })}
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

  // fermer le menu mobile au changement de route
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* LOGO */}
        <Link to="/" className="mr-4 flex items-center space-x-2 transition-opacity hover:opacity-80">
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            NOXIA
          </span>
        </Link>

        {/* NAV Desktop */}
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
