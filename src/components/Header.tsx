import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react"; 
import { projects } from "@/data/projects";

/* ============================================================
   CONFIGURATION DU MENU
============================================================ */
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
    label: "Projets",
    path: "/projets",
    children: projects.map((p) => ({ label: p.title, path: `/projet/${p.id}` })),
  },
];

/* ============================================================
   COMPOSANT : DESKTOP NAV ITEM (HOVER)
============================================================ */
const DesktopNavItem = ({ item }: { item: (typeof NAV_CONFIG)[0] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive =
    location.pathname === item.path ||
    item.children.some((child) => location.pathname === child.path);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div
      className="relative flex items-center h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        to={item.path}
        className={cn(
          "group flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md",
          "hover:bg-accent hover:text-accent-foreground outline-none",
          isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
        )}
      >
        {item.label}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200 opacity-50 group-hover:opacity-100",
            isOpen && "rotate-180"
          )}
        />
      </Link>

      <div
        className={cn(
          "absolute top-full left-0 pt-2 w-64 z-50 transition-all duration-200 ease-in-out origin-top-left",
          isOpen
            ? "opacity-100 translate-y-0 visible"
            : "opacity-0 -translate-y-2 invisible pointer-events-none"
        )}
      >
        <div className="overflow-hidden rounded-lg border border-border/50 bg-background/95 shadow-xl backdrop-blur-md ring-1 ring-black/5">
          <ul className="py-2 flex flex-col">
            {item.children.map((child) => (
              <li key={child.path}>
                <NavLink
                  to={child.path}
                  className={({ isActive }) =>
                    cn(
                      "relative block px-4 py-2.5 text-sm transition-colors hover:bg-muted/50",
                      isActive
                        ? "text-primary font-medium bg-primary/5"
                        : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  <span className={cn(
                     "absolute left-0 top-0 bottom-0 w-[2px] bg-primary transition-opacity duration-200",
                      location.pathname === child.path ? "opacity-100" : "opacity-0"
                  )}/>
                  {child.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   COMPOSANT : MOBILE NAV ITEM (ACCORDION)
============================================================ */
const MobileNavItem = ({ 
  item, 
  onClose 
}: { 
  item: (typeof NAV_CONFIG)[0]; 
  onClose: () => void; 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  // Ouvre automatiquement si on est sur une page enfant
  useEffect(() => {
    if (item.children.some(child => child.path === location.pathname)) {
      setIsExpanded(true);
    }
  }, [location.pathname, item.children]);

  return (
    <div className="border-b border-border/40 last:border-0">
      <div className="flex items-center justify-between py-4 pr-4">
        <Link 
          to={item.path} 
          onClick={onClose}
          className="text-base font-medium hover:text-primary transition-colors"
        >
          {item.label}
        </Link>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 active:bg-accent rounded-full transition-colors"
        >
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-300",
              isExpanded && "rotate-180"
            )} 
          />
        </button>
      </div>

      {/* Animation d'ouverture simple via CSS classes ou conditionnel */}
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[500px] opacity-100 mb-4" : "max-h-0 opacity-0"
        )}
      >
        <ul className="pl-4 space-y-1 border-l-2 border-border/50 ml-2">
          {item.children.map((child) => (
            <li key={child.path}>
              <Link
                to={child.path}
                onClick={onClose}
                className={cn(
                  "block py-2 px-2 text-sm rounded-md transition-colors",
                  location.pathname === child.path
                    ? "text-primary font-medium bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ============================================================
   COMPOSANT PRINCIPAL (HEADER)
============================================================ */
export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Empêche le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* LOGO */}
        <Link to="/" className="z-50 flex items-center gap-2 transition-opacity hover:opacity-80">
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            NOXIA
          </span>
        </Link>

        {/* --- DESKTOP NAVIGATION --- */}
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
            <DesktopNavItem key={item.label} item={item} />
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

        {/* --- MOBILE TOGGLE BUTTON --- */}
        <button
          className="md:hidden z-50 p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* --- MOBILE MENU OVERLAY --- */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-background/95 backdrop-blur-sm md:hidden transition-transform duration-300 ease-in-out flex flex-col pt-24 px-6 pb-6 overflow-y-auto",
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <nav className="flex flex-col space-y-2">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium py-4 border-b border-border/40 hover:text-primary transition-colors"
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
              className="text-lg font-medium py-4 hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>

      </div>
    </header>
  );
}