import React, { useState, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react"; // Assure-toi d'avoir lucide-react
import { projects } from "@/data/projects";

/* ============================================================
   CONFIGURATION DU MENU
   (Centralise la structure ici pour ne pas polluer le JSX)
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
    // On mappe tes projets dynamiques ici
    children: projects.map((p) => ({ label: p.title, path: `/projet/${p.id}` })),
  },
];

/* ============================================================
   SOUS-COMPOSANT : NAV ITEM AVEC DROPDOWN
============================================================ */
const NavItem = ({ item }: { item: (typeof NAV_CONFIG)[0] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Vérifie si l'utilisateur est sur le lien parent OU un des enfants
  // Cela permet de garder le parent "allumé" quand on navigue dans le sous-menu
  const isActive =
    location.pathname === item.path ||
    item.children.some((child) => location.pathname === child.path);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // Petit délai pour éviter les fermetures frustrantes
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
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none",
          isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
        )}
      >
        {item.label}
        {/* Petite flèche animée */}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200 opacity-50 group-hover:opacity-100",
            isOpen && "rotate-180" // La flèche se retourne quand ouvert
          )}
        />
      </Link>

      {/* DROPDOWN AREA */}
      {/* Astuce : Un padding invisible (pt-4) sert de pont pour la souris */}
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
                        ? "text-primary font-medium bg-primary/5" // Style page active
                        : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  {/* Petit indicateur visuel sur le survol ou actif */}
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
   COMPOSANT PRINCIPAL
============================================================ */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
        
        {/* LOGO */}
        <Link
          to="/"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            NOXIA
          </span>
        </Link>

        {/* NAVIGATION DESKTOP */}
        <nav className="hidden md:flex items-center gap-2 ml-auto">
          
          {/* ACCUEIL */}
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

          {/* DROPDOWNS */}
          {NAV_CONFIG.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}

          {/* CONTACT */}
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

      </div>
    </header>
  );
}