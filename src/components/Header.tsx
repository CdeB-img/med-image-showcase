import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X, ChevronRight } from "lucide-react";
import { projects as _projects } from "@/data/projects";

/* ============================================================
   CONFIGURATION & DATA
============================================================ */
const projects = Array.isArray(_projects) ? _projects : [];

const NAV_CONFIG = [
  {
    label: "Expertise",
    path: "/expertise",
    children: [
      {
        label: "IRM",
        path: "/irm-imagerie-quantitative",
        description: "Imagerie par Résonance Magnétique",
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
        description: "Tomodensitométrie & Scanner",
        children: [
          { label: "Quantification CT", path: "/quantification-ct" },
          { label: "CT spectral avancé", path: "/ct-quantitatif-avance-imagerie-spectrale" },
          { label: "CT perfusion AVC", path: "/ct-perfusion-quantitative-avc" },
        ],
      },
      {
        label: "Méthodologie",
        path: "/methodologie-imagerie-quantitative",
        description: "Processus & Analyse de données",
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

/* ============================================================
   DESKTOP COMPONENT (MEGA MENU + ACTIVE STATE)
============================================================ */
const DesktopNavItem = ({ item }: { item: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSub, setActiveSub] = useState<any>(item.children?.[0]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  const isMega = item.children?.some((c: any) => c.children && c.children.length > 0);

  // Vérifie si l'URL actuelle est dans cette branche (pour la surbrillance)
  const isBranchActive = (node: any): boolean => {
    if (location.pathname === node.path || (node.path.includes('#') && location.hash === '#' + node.path.split('#')[1])) return true;
    if (node.children) return node.children.some((child: any) => isBranchActive(child));
    return false;
  };

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  // Sync l'onglet actif du mega menu avec l'URL au chargement
  useEffect(() => {
    if (isOpen && isMega) {
      const match = item.children.find((c: any) => isBranchActive(c));
      if (match) setActiveSub(match);
    }
  }, [isOpen]);

  const parentIsActive = isBranchActive(item);

  return (
    <div className="relative h-full flex items-center" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Link
        to={item.path}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1",
          parentIsActive || isOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent"
        )}
      >
        {item.label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </Link>

      {isOpen && item.children && (
        <div className="absolute top-full left-0 pt-2 z-50">
          {isMega ? (
            /* MEGA MENU SPLIT VIEW */
            <div className="w-[650px] bg-background border border-border rounded-xl shadow-2xl flex min-h-[300px] overflow-hidden">
              <div className="w-[200px] bg-muted/20 border-r border-border p-2 flex flex-col gap-1">
                {item.children.map((child: any) => (
                  <Link
                    key={child.path}
                    to={child.path}
                    onMouseEnter={() => setActiveSub(child)}
                    className={cn(
                      "px-3 py-3 rounded-lg text-sm font-medium flex items-center justify-between transition-all",
                      isBranchActive(child) || activeSub?.label === child.label
                        ? "bg-white shadow-sm text-primary" 
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {child.label}
                    {(isBranchActive(child) || activeSub?.label === child.label) && <ChevronRight className="h-4 w-4" />}
                  </Link>
                ))}
              </div>
              <div className="flex-1 p-5 bg-background">
                <div className="space-y-4">
                  <h4 className="text-lg font-bold">{activeSub?.label}</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {activeSub?.children?.map((sub: any) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          location.pathname === sub.path ? "bg-primary/5 text-primary font-bold" : "text-foreground/80 hover:bg-muted"
                        )}
                      >
                        <div className={cn("h-1.5 w-1.5 rounded-full", location.pathname === sub.path ? "bg-primary" : "bg-muted-foreground/30")} />
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* DROPDOWN SIMPLE (Prestations) */
            <div className="w-64 bg-background border border-border rounded-xl shadow-xl p-2">
              {item.children.map((child: any) => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={cn(
                    "block px-4 py-2.5 text-sm rounded-md transition-colors",
                    isBranchActive(child) ? "bg-primary/5 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
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
   MOBILE COMPONENT (ACCORDIONS IMBRIQUÉS)
============================================================ */
const MobileNavItem = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isBranchActive = (node: any): boolean => {
    if (location.pathname === node.path || (node.path.includes('#') && location.hash === '#' + node.path.split('#')[1])) return true;
    if (node.children) return node.children.some((child: any) => isBranchActive(child));
    return false;
  };

  useEffect(() => { if (isBranchActive(item)) setOpen(true); }, []);

  return (
    <div className="border-b border-border/40">
      <div className="flex items-center justify-between py-4">
        <Link to={item.path} onClick={onClose} className={cn("font-semibold text-lg", isBranchActive(item) ? "text-primary" : "text-foreground")}>
          {item.label}
        </Link>
        {item.children && (
          <button onClick={() => setOpen(!open)} className="p-2 outline-none">
            <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>
      <div className={cn("overflow-hidden transition-all duration-300", open ? "max-h-[1000px] opacity-100 pb-4" : "max-h-0 opacity-0")}>
        <div className="pl-4 space-y-4 border-l-2 border-border/50 ml-1">
          {item.children?.map((child: any) => (
            <div key={child.path}>
              {child.children ? (
                <div className="space-y-2">
                  <Link to={child.path} onClick={onClose} className={cn("block font-medium text-sm", isBranchActive(child) ? "text-primary" : "text-foreground")}>
                    {child.label}
                  </Link>
                  <div className="pl-3 space-y-2 border-l border-border/20">
                    {child.children.map((sub: any) => (
                      <Link key={sub.path} to={sub.path} onClick={onClose} className={cn("block text-sm py-1", location.pathname === sub.path ? "text-primary font-bold" : "text-muted-foreground")}>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link to={child.path} onClick={onClose} className={cn("block text-sm", isBranchActive(child) ? "text-primary font-bold" : "text-muted-foreground")}>
                  {child.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   HEADER PRINCIPAL
============================================================ */
export default function Header() {
  const [mobOpen, setMobOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobOpen(false); }, [location]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="text-xl font-bold tracking-tighter transition-opacity hover:opacity-80">NOXIA</Link>

        {/* DESKTOP */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md", isActive ? "text-primary bg-primary/10" : "text-muted-foreground")}>
            Accueil
          </NavLink>
          {NAV_CONFIG.map((item) => <DesktopNavItem key={item.label} item={item} />)}
          <NavLink to="/contact" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md", isActive ? "text-primary bg-primary/10" : "text-muted-foreground")}>
            Contact
          </NavLink>
        </nav>

        {/* MOBILE TOGGLE */}
        <button className="md:hidden p-2" onClick={() => setMobOpen(!mobOpen)}>
          {mobOpen ? <X /> : <Menu />}
        </button>

        {/* MOBILE OVERLAY */}
        <div className={cn("fixed inset-0 top-16 z-50 bg-background md:hidden transition-all duration-300 px-6 overflow-y-auto pb-20", mobOpen ? "translate-x-0" : "translate-x-full")}>
            <nav className="flex flex-col pt-4">
                <Link to="/" onClick={() => setMobOpen(false)} className="py-4 text-lg font-semibold border-b border-border/40">Accueil</Link>
                {NAV_CONFIG.map(item => <MobileNavItem key={item.label} item={item} onClose={() => setMobOpen(false)} />)}
                <Link to="/contact" onClick={() => setMobOpen(false)} className="py-4 text-lg font-semibold border-b border-border/40">Contact</Link>
            </nav>
        </div>
      </div>
    </header>
  );
}