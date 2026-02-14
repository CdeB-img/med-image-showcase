import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X, ChevronRight } from "lucide-react";
import { projects as _projects } from "@/data/projects";

/* =========================
   CONFIGURATION & HELPERS
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
    path: "/prestations-imagerie-medicale",
    children: [
      { label: "CoreLab externalisé", path: "/prestations-imagerie-medicale#corelab" },
      { label: "Reprise d’études", path: "/prestations-imagerie-medicale#reprise" },
      { label: "Audit méthodologique", path: "/prestations-imagerie-medicale#audit" },
      { label: "Développement sur mesure", path: "/prestations-imagerie-medicale#ingenierie" },
    ],
  },
  {
    label: "Projets",
    path: "/projets",
    children: projects.map((p) => ({ label: p.title, path: `/projet/${p.id}` })),
  },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

// Fonction pour savoir si un lien ou un de ses enfants est actif
const isBranchActive = (node: any, currentPath: string, currentHash: string): boolean => {
  const fullCurrent = `${currentPath}${currentHash}`;
  if (node.path === fullCurrent || node.path === currentPath) return true;
  if (node.children) {
    return node.children.some((child: any) => isBranchActive(child, currentPath, currentHash));
  }
  return false;
};

/* ============================================================
   VERSION PC : MEGA MENU STABLE (Split View)
   ============================================================ */
const DesktopNavItem = ({ item }: { item: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSub, setActiveSub] = useState(item.children?.[0]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  const isMega = item.label === "Expertise";
  const parentActive = isBranchActive(item, location.pathname, location.hash);

  const openMenu = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const closeMenu = () => {
    timerRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  // Sync l'onglet actif avec la page réelle au survol
  useEffect(() => {
    if (isOpen && isMega) {
      const currentMatch = item.children.find((c: any) => isBranchActive(c, location.pathname, location.hash));
      if (currentMatch) setActiveSub(currentMatch);
    }
  }, [isOpen, location.pathname]);

  return (
    <div className="relative h-full flex items-center" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <Link
        to={item.path}
        onClick={() => window.scrollTo(0, 0)}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1",
          parentActive || isOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent"
        )}
      >
        {item.label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </Link>

      {isOpen && item.children && (
        <div className="absolute top-full left-0 pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {isMega ? (
            <div className="w-[650px] bg-background border border-border rounded-xl shadow-2xl flex min-h-[300px] overflow-hidden">
              {/* Colonne Gauche */}
              <div className="w-[200px] bg-muted/20 border-r border-border p-2 flex flex-col gap-1">
                {item.children.map((child: any) => (
                  <Link
                    key={child.path}
                    to={child.path}
                    onMouseEnter={() => setActiveSub(child)}
                    className={cn(
                      "px-3 py-3 rounded-lg text-sm font-medium flex items-center justify-between transition-all",
                      isBranchActive(child, location.pathname, location.hash) || activeSub?.label === child.label
                        ? "bg-white shadow-sm text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {child.label}
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                ))}
              </div>
              {/* Colonne Droite */}
              <div className="flex-1 p-5 bg-background">
                <h4 className="text-lg font-bold mb-4">{activeSub?.label}</h4>
                <div className="grid grid-cols-1 gap-1">
                  {activeSub?.children?.map((sub: any) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                        location.pathname === sub.path ? "text-primary font-bold bg-primary/5" : "text-foreground/80 hover:bg-muted"
                      )}
                    >
                      <div className={cn("h-1 w-1 rounded-full", location.pathname === sub.path ? "bg-primary" : "bg-muted-foreground/40")} />
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-64 bg-background border border-border rounded-xl shadow-xl p-2 flex flex-col gap-1">
              {item.children.map((child: any) => (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-2 text-sm rounded-md",
                    isBranchActive(child, location.pathname, location.hash) ? "bg-primary/5 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   VERSION MOBILE : TON ARCHITECTURE PRÉFÉRÉE (NavItem récursif)
   ============================================================ */
const MobileNavItem = ({ item, closeMenu }: { item: any; closeMenu: () => void }) => {
  const location = useLocation();
  const [openRoot, setOpenRoot] = useState(false);
  const parentActive = isBranchActive(item, location.pathname, location.hash);

  return (
    <div className="w-full border-b border-border/10">
      <div className="flex items-center justify-between py-2">
        <Link
          to={item.path}
          onClick={() => { closeMenu(); window.scrollTo(0,0); }}
          className={cn("px-3 py-2 text-lg font-semibold", parentActive ? "text-primary" : "text-foreground")}
        >
          {item.label}
        </Link>
        {item.children && (
          <button onClick={() => setOpenRoot(!openRoot)} className="p-4">
            <ChevronDown className={cn("h-5 w-5 transition-transform", openRoot && "rotate-180")} />
          </button>
        )}
      </div>

      {openRoot && item.children && (
        <div className="pl-4 pb-4 flex flex-col gap-2">
          {item.children.map((child: any) => (
            <div key={child.label}>
              <div className="flex items-center justify-between py-1">
                <Link
                  to={child.path}
                  onClick={closeMenu}
                  className={cn("text-sm py-1", isBranchActive(child, location.pathname, location.hash) ? "text-primary font-bold" : "text-muted-foreground")}
                >
                  {child.label}
                </Link>
              </div>
              {child.children && (
                <div className="pl-4 border-l border-border/50 flex flex-col gap-1 mt-1">
                  {child.children.map((sub: any) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={closeMenu}
                      className={cn("text-xs py-1.5", location.pathname === sub.path ? "text-primary font-bold" : "text-muted-foreground")}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   HEADER PRINCIPAL
   ============================================================ */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" onClick={() => window.scrollTo(0, 0)} className="text-xl font-bold tracking-tighter">
          NOXIA
        </Link>

        {/* NAV PC */}
        <nav className="hidden md:flex items-center gap-1 h-full">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn("px-4 py-2 text-sm font-medium rounded-md", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent")
            }
          >
            Accueil
          </NavLink>

          {NAV_CONFIG.map((item) => (
            <DesktopNavItem key={item.label} item={item} />
          ))}

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              cn("px-4 py-2 text-sm font-medium rounded-md", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent")
            }
          >
            Contact
          </NavLink>
        </nav>

        {/* HAMBURGER MOBILE */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* PANNEAU MOBILE */}
      <div className={cn(
        "fixed inset-0 top-16 z-40 bg-background md:hidden transition-all duration-300 overflow-y-auto px-4 pb-20",
        mobileOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}>
        <nav className="flex flex-col pt-4">
          <Link to="/" onClick={() => setMobileOpen(false)} className="px-3 py-4 text-lg font-semibold border-b border-border/10">
            Accueil
          </Link>
          {NAV_CONFIG.map((item) => (
            <MobileNavItem key={item.label} item={item} closeMenu={() => setMobileOpen(false)} />
          ))}
          <Link to="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-4 text-lg font-semibold border-b border-border/10">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}