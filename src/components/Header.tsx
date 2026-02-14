import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X, ChevronRight } from "lucide-react";
import { projects as _projects } from "@/data/projects";

/* =========================
   NAV CONFIG
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
    children: projects.map((p: any) => ({ label: p.title, path: `/projet/${p.id}` })),
  },
];

/* =========================
   HELPERS
========================= */
const isBranchActive = (node: any, pathname: string, hash: string) => {
  const currentFull = `${pathname}${hash || ""}`;
  if (!node) return false;
  if (node.path === currentFull || node.path === pathname) return true;
  if (node.children?.length) {
    return node.children.some((c: any) => isBranchActive(c, pathname, hash));
  }
  return false;
};

/* ============================================================
   DESKTOP ITEM (MEGA MENU SPLIT VIEW)
============================================================ */
const DesktopNavItem = ({ item }: { item: any }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const timerRef = useRef<any>(null);
  const isMega = item.label === "Expertise";
  const parentActive = isBranchActive(item, location.pathname, location.hash);
  const [activeSub, setActiveSub] = useState(item.children?.[0]);

  const openMenu = () => { if (timerRef.current) clearTimeout(timerRef.current); setOpen(true); };
  const closeMenu = () => { timerRef.current = setTimeout(() => setOpen(false), 200); };

  useEffect(() => {
    if (open && isMega) {
      const match = item.children?.find((c: any) => isBranchActive(c, location.pathname, location.hash));
      if (match) setActiveSub(match);
    }
  }, [open, location.pathname]);

  return (
    <div className="relative h-full flex items-center" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <Link to={item.path} onClick={() => window.scrollTo(0,0)}
        className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1",
          parentActive || open ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent")}>
        {item.label}
        {item.children && <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />}
      </Link>

      {open && item.children && (
        <div className="absolute top-full left-0 pt-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          {isMega ? (
            <div className="w-[680px] bg-background border border-border rounded-xl shadow-2xl flex min-h-[320px] overflow-hidden">
              <div className="w-[220px] bg-muted/20 border-r border-border p-2 flex flex-col gap-1">
                {item.children.map((child: any) => (
                  <Link key={child.path} to={child.path} onMouseEnter={() => setActiveSub(child)} onClick={() => setOpen(false)}
                    className={cn("px-3 py-3 rounded-lg text-sm font-medium flex items-center justify-between transition-all",
                      (isBranchActive(child, location.pathname, location.hash) || activeSub?.label === child.label) ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:bg-muted")}>
                    {child.label} <ChevronRight className="h-4 w-4 opacity-40" />
                  </Link>
                ))}
              </div>
              <div className="flex-1 p-5 bg-background">
                <h4 className="text-lg font-bold border-b pb-2 mb-4">{activeSub?.label}</h4>
                <div className="flex flex-col gap-1">
                  {activeSub?.children?.map((sub: any) => (
                    <Link key={sub.path} to={sub.path} onClick={() => setOpen(false)}
                      className={cn("px-3 py-2 rounded-md text-sm", location.pathname === sub.path ? "text-primary font-bold bg-primary/5" : "text-foreground/80 hover:bg-muted")}>
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-64 bg-background border border-border rounded-xl shadow-xl p-2 flex flex-col gap-1">
              {item.children.map((child: any) => (
                <Link key={child.path} to={child.path} onClick={() => setOpen(false)}
                  className={cn("px-4 py-2 text-sm rounded-md", isBranchActive(child, location.pathname, location.hash) ? "text-primary font-bold bg-primary/5" : "text-muted-foreground hover:bg-muted")}>
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
   MOBILE ITEM (TON CODE ORIGINAL QUI MARCHAIT)
============================================================ */
const MobileNavItem = ({ item, closeMenu }: { item: any, closeMenu: () => void }) => {
  const location = useLocation();
  const [openRoot, setOpenRoot] = useState(false);
  const active = isBranchActive(item, location.pathname, location.hash);

  return (
    <div className="w-full border-b border-border/10">
      <div className="flex items-center justify-between">
        <Link to={item.path} onClick={() => { closeMenu(); window.scrollTo(0,0); }} className={cn("flex-1 py-4 px-3 text-lg font-semibold", active ? "text-primary" : "text-foreground")}>
          {item.label}
        </Link>
        {item.children && (
          <button onClick={() => setOpenRoot(!openRoot)} className="p-4 outline-none">
            <ChevronDown className={cn("h-5 w-5 transition-transform", openRoot && "rotate-180")} />
          </button>
        )}
      </div>

      {openRoot && item.children && (
        <div className="pl-4 pb-4 flex flex-col gap-2">
          {item.children.map((child: any) => (
            <div key={child.label} className="flex flex-col">
               <Link to={child.path} onClick={closeMenu} className={cn("py-2 text-sm font-medium", isBranchActive(child, location.pathname, location.hash) ? "text-primary" : "text-muted-foreground")}>
                {child.label}
              </Link>
              {child.children && (
                <div className="pl-4 border-l-2 border-border/50 flex flex-col gap-1 my-1">
                  {child.children.map((sub: any) => (
                    <Link key={sub.path} to={sub.path} onClick={closeMenu} className={cn("py-1.5 text-xs", location.pathname === sub.path ? "text-primary font-bold" : "text-muted-foreground")}>
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
   HEADER
============================================================ */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" onClick={() => window.scrollTo(0, 0)} className="text-xl font-bold tracking-tighter">NOXIA</Link>

        {/* DESKTOP */}
        <nav className="hidden md:flex items-center gap-1 h-full">
          <NavLink to="/" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent")}>Accueil</NavLink>
          {NAV_CONFIG.map((item) => <DesktopNavItem key={item.label} item={item} />)}
          <NavLink to="/contact" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent")}>Contact</NavLink>
        </nav>

        {/* HAMBURGER MOBILE */}
        <button className="md:hidden p-2 rounded-md hover:bg-muted" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* OVERLAY MOBILE - Affichage direct sans fioritures pour éviter les bugs */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[64px] z-[99] bg-background md:hidden overflow-y-auto">
          <nav className="flex flex-col p-4">
            <Link to="/" onClick={() => setMobileOpen(false)} className="py-4 px-3 text-lg font-semibold border-b border-border/10">Accueil</Link>
            {NAV_CONFIG.map((item) => <MobileNavItem key={item.label} item={item} closeMenu={() => setMobileOpen(false)} />)}
            <Link to="/contact" onClick={() => setMobileOpen(false)} className="py-4 px-3 text-lg font-semibold border-b border-border/10">Contact</Link>
          </nav>
        </div>
      )}
    </header>
  );
}