import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react"; 
import { projects } from "@/data/projects";

const NAV_CONFIG = [
  {
    label: "IRM",
    path: "/irm-imagerie-quantitative",
    children: [
      { label: "Segmentation", path: "/segmentation-irm" },
      { label: "Cardiaque", path: "/biomarqueurs-irm-cardiaque-essais-cliniques" },
      { label: "Mapping", path: "/ecv-mapping-t1-t2-irm-cardiaque" },
      { label: "Neuro", path: "/perfusion-metabolique-neuro-imagerie" },
      { label: "Corelab", path: "/corelab-essais-cliniques" },
    ],
  },
  {
    label: "CT",
    path: "/ct-imagerie-quantitative",
    children: [
      { label: "Quantification", path: "/quantification-ct" },
      { label: "Spectral", path: "/ct-quantitatif-avance-imagerie-spectrale" },
      { label: "AVC", path: "/ct-perfusion-quantitative-avc" },
    ],
  },
  {
    label: "Méthodologie",
    path: "/methodologie-imagerie-quantitative",
    children: [
      { label: "Ingénierie", path: "/ingenierie-imagerie-quantitative" },
      { label: "Bases", path: "/bases-multicentriques" },
      { label: "DICOM", path: "/analyse-dicom" },
      { label: "Recalage", path: "/recalage-multimodal" },
    ],
  },
  {
    label: "Projets",
    path: "/projets",
    children: projects.map((p) => ({ label: p.title, path: `/projet/${p.id}` })),
  },
];

/* ============================================================
   MOBILE NAV ITEM (SPLIT & GRID BLOCK)
============================================================ */
const MobileNavItem = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.path);

  return (
    <div className="flex flex-col border-b border-border/40 overflow-hidden">
      {/* LIGNE PRINCIPALE : Séparation Lien / Toggle */}
      <div className="flex items-stretch h-14">
        {/* Partie Gauche : Le lien direct vers la page parente */}
        <Link 
          to={item.path} 
          onClick={onClose}
          className={cn(
            "flex-1 flex items-center px-4 text-base font-semibold transition-colors",
            isActive ? "text-primary bg-primary/5" : "text-foreground/90"
          )}
        >
          {item.label}
        </Link>

        {/* Partie Droite : Le bouton pour déplier le bloc */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-14 flex items-center justify-center border-l border-border/20 transition-colors",
            isExpanded ? "bg-accent text-primary" : "text-muted-foreground"
          )}
        >
          <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", isExpanded && "rotate-180")} />
        </button>
      </div>

      {/* BLOC DE SOUS-MENU : Apparition en Grille (Grid) */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden bg-muted/30",
          isExpanded ? "max-h-96 opacity-100 py-3" : "max-h-0 opacity-0"
        )}
      >
        <div className="overflow-hidden">
        <div className="flex flex-col gap-2 px-2">
          {item.children.map((child: any) => (
            <Link
              key={child.path}
              to={child.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-all",
                location.pathname === child.path
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
              {child.label}
            </Link>
          ))}
            {/* Petit lien pour voir toute la section */}
            <Link 
              to={item.path} 
              onClick={onClose}
              className="col-span-2 flex items-center justify-center gap-2 p-2 text-xs text-primary/70 font-medium"
            >
              Voir toute la section <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   COMPOSANT PRINCIPAL (HEADER COMPLET)
============================================================ */
export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* LOGO */}
        <Link to="/" className="z-[110] flex items-center">
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            NOXIA
          </span>
        </Link>

        {/* --- DESKTOP (Inchangé car il fonctionne bien) --- */}
        <nav className="hidden md:flex items-center gap-2">
            {/* ... Tes Navlinks Desktop (Accueil, NavItem, Contact) ... */}
            <NavLink to="/" className={({isActive}) => cn("px-3 py-2 text-sm", isActive ? "text-primary" : "text-muted-foreground")}>Accueil</NavLink>
            {NAV_CONFIG.map(item => <DesktopNavItem key={item.label} item={item} />)}
            <NavLink to="/contact" className={({isActive}) => cn("px-3 py-2 text-sm", isActive ? "text-primary" : "text-muted-foreground")}>Contact</NavLink>
        </nav>

        {/* --- MOBILE TOGGLE --- */}
        <button className="md:hidden z-[110] p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* --- MOBILE MENU OVERLAY (SIDE PANEL) --- */}
        <div
          className={cn(
            "fixed inset-0 z-[105] md:hidden transition-all duration-300",
            isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
              isMobileMenuOpen ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Sliding panel */}
          <div
            className={cn(
              "absolute top-0 right-0 h-full w-[85%] max-w-sm bg-background shadow-2xl transition-transform duration-300 flex flex-col",
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="flex-1 overflow-y-auto pt-20 px-6 pb-10">
              <nav className="flex flex-col gap-4">

                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-semibold py-3 border-b border-border/40"
                >
                  Accueil
                </Link>

                {NAV_CONFIG.map((item) => (
                  <MobileNavItem
                    key={item.label}
                    item={item}
                    onClose={() => setIsMobileMenuOpen(false)}
                  />
                ))}

                <Link
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-semibold py-3 border-t border-border/40"
                >
                  Contact
                </Link>

              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* On garde le DesktopNavItem tel quel, il était déjà propre */
const DesktopNavItem = ({ item }: { item: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const isActive = location.pathname.startsWith(item.path);

    return (
        <div className="relative h-full flex items-center" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            <Link to={item.path} className={cn("px-3 py-2 text-sm font-medium transition-colors rounded-md flex items-center gap-1", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground")}>
                {item.label} <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </Link>
            {isOpen && (
                <div className="absolute top-full left-0 w-64 pt-2">
                    <div className="bg-background border border-border shadow-xl rounded-xl overflow-hidden p-2 backdrop-blur-xl">
                        {item.children.map((child: any) => (
                            <Link key={child.path} to={child.path} className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg">
                                {child.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};