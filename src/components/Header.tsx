import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X, LayoutGrid } from "lucide-react"; 
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
   MOBILE ITEM - VERSION DEPLOYÉE (ESPACE MAXIMUM)
============================================================ */
const MobileNavItem = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.path);

  return (
    <div className="flex flex-col border-b border-border/40">
      {/* HEADER DE SECTION */}
      <div className="flex items-center justify-between h-16 px-4">
        <Link 
          to={item.path} 
          onClick={onClose}
          className={cn(
            "text-lg font-bold tracking-tight transition-colors",
            isActive ? "text-primary" : "text-foreground"
          )}
        >
          {item.label}
        </Link>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full transition-all",
            isExpanded ? "bg-primary text-white" : "bg-muted text-muted-foreground"
          )}
        >
          <span className="text-xs font-medium">{isExpanded ? "Fermer" : "Explorer"}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "rotate-180")} />
        </button>
      </div>

      {/* ZONE DE DÉPLOIEMENT (GRID) */}
      <div 
        className={cn(
          "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isExpanded ? "max-h-[800px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-4"
        )}
      >
        <div className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-3">
            {item.children.map((child: any) => (
              <Link
                key={child.path}
                to={child.path}
                onClick={onClose}
                className={cn(
                  "flex flex-col gap-1 p-4 rounded-2xl border transition-all active:scale-95",
                  location.pathname === child.path 
                    ? "bg-primary/10 border-primary/30 text-primary" 
                    : "bg-muted/30 border-transparent text-muted-foreground"
                )}
              >
                <LayoutGrid className="h-4 w-4 opacity-40" />
                <span className="text-[13px] font-medium leading-snug">{child.label}</span>
              </Link>
            ))}
          </div>
          
          <Link 
            to={item.path} 
            onClick={onClose}
            className="mt-4 w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-primary bg-primary/5 rounded-xl border border-primary/10"
          >
            Voir la page {item.label}
          </Link>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   HEADER PRINCIPAL
============================================================ */
export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Verrouillage du scroll
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        
        {/* LOGO */}
        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="z-[110]">
          <span className="text-2xl font-black tracking-tighter uppercase">Noxia</span>
        </Link>

        {/* --- DESKTOP NAV --- */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={({isActive}) => cn("px-4 py-2 text-sm font-medium rounded-full transition-colors", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>Accueil</NavLink>
          {NAV_CONFIG.map(item => <DesktopNavItem key={item.label} item={item} />)}
          <NavLink to="/contact" className={({isActive}) => cn("px-4 py-2 text-sm font-medium rounded-full transition-colors", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>Contact</NavLink>
        </nav>

        {/* --- MOBILE TOGGLE --- */}
        <button 
          className="md:hidden z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-foreground text-background" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* --- FULLSCREEN MOBILE OVERLAY --- */}
        <div className={cn(
          "fixed inset-0 z-[105] bg-background md:hidden transition-all duration-500 ease-in-out flex flex-col pt-24",
          isMobileMenuOpen ? "translate-y-0" : "translate-y-[-100%]"
        )}>
          <div className="flex-1 overflow-y-auto pb-20">
            <div className="flex flex-col">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-20 flex items-center px-6 text-2xl font-bold border-b border-border/40"
              >
                Accueil
              </Link>
              
              {NAV_CONFIG.map((item) => (
                <MobileNavItem key={item.label} item={item} onClose={() => setIsMobileMenuOpen(false)} />
              ))}

              <Link 
                to="/contact" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-20 flex items-center px-6 text-2xl font-bold"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* --- DESKTOP NAV ITEM --- */
const DesktopNavItem = ({ item }: { item: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.path);

  return (
    <div className="relative h-20 flex items-center" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <Link 
        to={item.path} 
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-full flex items-center gap-1 transition-all",
          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
        )}
      >
        {item.label} <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </Link>
      
      <div className={cn(
        "absolute top-[80%] left-0 w-72 pt-4 transition-all duration-200",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}>
        <div className="bg-background border border-border/50 shadow-2xl rounded-2xl overflow-hidden p-3 backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-1">
            {item.children.map((child: any) => (
              <Link 
                key={child.path} 
                to={child.path} 
                className="flex items-center px-4 py-3 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};