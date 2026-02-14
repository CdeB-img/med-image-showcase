import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X, ChevronRight } from "lucide-react";
import { projects as _projects } from "@/data/projects";

/* ============================================================
   CONFIGURATION & DONNÉES
============================================================ */
const projects = Array.isArray(_projects) ? _projects : [];

const NAV_CONFIG = [
  {
    label: "Expertise",
    path: "/expertise",
    // La présence de sous-sous-menus (children -> children) déclenche la "Vue Divisée" (Mega Menu)
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
    // Menu simple (liste déroulante classique)
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
   COMPOSANT DESKTOP (Gère le Mega Menu Split & Dropdown Simple)
============================================================ */
const DesktopNavItem = ({ item }: { item: typeof NAV_CONFIG[0] }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Par défaut, on affiche le premier élément, ou celui qui correspond à l'URL en cours
  const [activeSubCategory, setActiveSubCategory] = useState<any>(item.children?.[0]);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  // Détecte si c'est un "Mega Menu" complexe (Expertise) ou une liste simple (Prestations)
  const isMegaMenu = item.children?.some(c => c.children && c.children.length > 0);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  // Mise à jour intelligente de la catégorie active à l'ouverture
  useEffect(() => {
    if (isOpen && item.children && isMegaMenu) {
        const currentMatch = item.children.find(c => location.pathname.includes(c.path));
        if (currentMatch) setActiveSubCategory(currentMatch);
        else setActiveSubCategory(item.children[0]);
    }
  }, [isOpen, item.children, location.pathname, isMegaMenu]);

  const isActive = location.pathname.startsWith(item.path);

  return (
    <div
      className="relative flex items-center h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md transition-colors",
          "hover:bg-accent hover:text-accent-foreground outline-none",
          isActive || isOpen ? "text-primary bg-primary/10" : "text-muted-foreground"
        )}
      >
        {item.label}
        {item.children && (
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")}
          />
        )}
      </Link>

      {/* ZONE DÉROULANTE */}
      {isOpen && item.children && (
        <div className="absolute top-full left-0 pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* CAS 1 : MEGA MENU (Expertise - Vue Divisée) */}
          {isMegaMenu ? (
            <div className="w-[650px] bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex min-h-[320px]">
              
              {/* Colonne GAUCHE : Les Catégories (CLIQUABLES) */}
              <div className="w-[200px] bg-muted/30 border-r border-border p-2 flex flex-col gap-1">
                {item.children.map((child) => (
                  <Link
                    key={child.path}
                    to={child.path}
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => setActiveSubCategory(child)} // Le survol change la droite
                    className={cn(
                      "group px-3 py-3 rounded-lg text-sm font-medium flex items-center justify-between transition-all outline-none",
                      activeSubCategory?.label === child.label
                        ? "bg-white shadow-sm text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {child.label}
                    {/* Petite flèche active */}
                    {activeSubCategory?.label === child.label && <ChevronRight className="h-4 w-4" />}
                  </Link>
                ))}
              </div>

              {/* Colonne DROITE : Les Sous-liens (Segmentation, etc.) */}
              <div className="flex-1 p-5 bg-background">
                {activeSubCategory && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300 key={activeSubCategory.label}">
                    <div className="border-b border-border/50 pb-2 mb-4">
                        <h4 className="text-lg font-bold text-foreground">
                            {activeSubCategory.label}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">{activeSubCategory.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-1">
                      {activeSubCategory.children?.map((sub: any) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm",
                             location.pathname === sub.path ? "bg-primary/5 text-primary font-medium" : "text-foreground/80"
                          )}
                        >
                          <div className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              location.pathname === sub.path ? "bg-primary" : "bg-muted-foreground/30"
                          )} />
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            
            /* CAS 2 : MENU SIMPLE (Prestations, Projets) */
            <div className="w-64 bg-background border border-border rounded-xl shadow-xl overflow-hidden p-2">
                {item.children.map((child) => (
                    <Link
                        key={child.path}
                        to={child.path}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            "block px-4 py-2.5 text-sm rounded-md transition-colors",
                            location.pathname === child.path || (child.path.includes('#') && location.hash === '#' + child.path.split('#')[1])
                            ? "bg-primary/5 text-primary font-medium" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
   COMPOSANT MOBILE (Accordéons imbriqués)
============================================================ */
const MobileNavItem = ({ item, onClose }: { item: any, onClose: () => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const location = useLocation();

    // Ouvre automatiquement la section si on est sur une page enfant
    useEffect(() => {
        if (location.pathname.startsWith(item.path)) setIsExpanded(true);
    }, [location.pathname, item.path]);

    return (
        <div className="border-b border-border/40">
            <div className="flex items-center justify-between py-4 pr-2">
                <Link 
                    to={item.path} 
                    onClick={onClose} 
                    className={cn(
                        "font-semibold text-lg hover:text-primary transition-colors",
                        location.pathname === item.path ? "text-primary" : "text-foreground"
                    )}
                >
                    {item.label}
                </Link>
                {item.children && (
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="p-3 active:bg-muted rounded-full"
                    >
                        <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                    </button>
                )}
            </div>

            <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isExpanded ? "max-h-[1000px] opacity-100 pb-4" : "max-h-0 opacity-0")}>
                <div className="pl-4 space-y-4 border-l-2 border-border/50 ml-1">
                    {item.children?.map((child: any) => (
                        <div key={child.path}>
                            {/* Cas Menu Complexe (Expertise -> IRM -> ...) */}
                            {child.children ? (
                                <div className="space-y-2">
                                    <Link to={child.path} onClick={onClose} className="block font-medium text-foreground/90 text-sm mb-2 hover:text-primary">
                                        {child.label}
                                    </Link>
                                    <div className="pl-3 space-y-2 border-l border-border/30 ml-1">
                                        {child.children.map((sub: any) => (
                                            <Link 
                                                key={sub.path} 
                                                to={sub.path} 
                                                onClick={onClose}
                                                className={cn(
                                                    "block text-sm py-1 transition-colors", 
                                                    location.pathname === sub.path ? "text-primary font-medium" : "text-muted-foreground"
                                                )}
                                            >
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Cas Menu Simple (Prestations -> Audit) */
                                <Link 
                                    to={child.path} 
                                    onClick={onClose}
                                    className={cn(
                                        "block text-sm py-1 transition-colors", 
                                        location.pathname === child.path || (child.path.includes('#') && location.hash === '#' + child.path.split('#')[1])
                                            ? "text-primary font-medium" 
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {child.label}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ============================================================
   HEADER PRINCIPAL
============================================================ */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Bloque le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : 'unset';
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* LOGO */}
        <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center space-x-2 transition-opacity hover:opacity-80">
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            NOXIA
          </span>
        </Link>

        {/* --- DESKTOP NAVIGATION --- */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
              )
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
              cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
              )
            }
          >
            Contact
          </NavLink>
        </nav>

        {/* --- MOBILE TOGGLE --- */}
        <button
          className="md:hidden p-2 text-foreground z-[60]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* --- MOBILE MENU FULLSCREEN OVERLAY --- */}
        <div className={cn(
            "fixed inset-0 top-16 z-50 bg-background md:hidden transition-all duration-300 flex flex-col px-6 overflow-y-auto pb-32",
            mobileOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        )}>
            <nav className="flex flex-col pt-4 pb-20">
                <Link to="/" onClick={() => setMobileOpen(false)} className="py-4 text-lg font-semibold border-b border-border/40 hover:text-primary">
                    Accueil
                </Link>
                
                {NAV_CONFIG.map(item => (
                    <MobileNavItem key={item.label} item={item} onClose={() => setMobileOpen(false)} />
                ))}
                
                <Link to="/contact" onClick={() => setMobileOpen(false)} className="py-4 text-lg font-semibold border-b border-border/40 hover:text-primary">
                    Contact
                </Link>
            </nav>
        </div>
      </div>
    </header>
  );
}