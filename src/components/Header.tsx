import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X, ChevronRight, Home, Mail } from "lucide-react";
import { projects as _projects } from "@/data/projects";

/* =========================
   NAV CONFIG
========================= */
const projects = Array.isArray(_projects) ? _projects : [];

type Child = { label: string; path: string; children?: Child[] };
type NavItemType = { label: string; path: string; children?: Child[] };

const NAV_CONFIG: NavItemType[] = [
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
   DESKTOP ITEM (Le code PC que tu aimes)
============================================================ */
const DesktopNavItem = ({ item }: { item: NavItemType }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMega = item.label === "Expertise";
  const parentActive = isBranchActive(item, location.pathname, location.hash);
  const [activeSub, setActiveSub] = useState<Child | null>(isMega ? (item.children?.[0] as Child) : null);

  const openMenu = () => { if (timerRef.current) clearTimeout(timerRef.current); setOpen(true); };
  const closeMenu = () => { timerRef.current = setTimeout(() => setOpen(false), 180); };

  useEffect(() => {
    if (!open || !isMega) return;
    const match = item.children?.find((c: any) => isBranchActive(c, location.pathname, location.hash));
    if (match) setActiveSub(match as Child);
  }, [open]);

  return (
    <div className="relative h-full flex items-center" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <Link to={item.path} onClick={() => window.scrollTo(0, 0)}
        className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1",
          parentActive || open ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent")}>
        {item.label}
        {item.children?.length && <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />}
      </Link>
      {open && item.children?.length && (
        <div className="absolute top-full left-0 pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {isMega ? (
            <div className="w-[680px] bg-background border border-border rounded-xl shadow-2xl flex min-h-[320px] overflow-hidden">
              <div className="w-[220px] bg-muted/20 border-r border-border p-2 flex flex-col gap-1">
                {item.children.map((child: any) => (
                  <Link key={child.path} to={child.path} onMouseEnter={() => setActiveSub(child)} onClick={() => setOpen(false)}
                    className={cn("px-3 py-3 rounded-lg text-sm font-medium flex items-center justify-between transition-all",
                      (isBranchActive(child, location.pathname, location.hash) || activeSub?.label === child.label) ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:bg-muted")}>
                    {child.label}
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  </Link>
                ))}
              </div>
              <div className="flex-1 p-5 bg-background">
                <h4 className="text-lg font-bold border-b pb-2 mb-4">{activeSub?.label}</h4>
                <div className="grid grid-cols-1 gap-1">
                  <Link to={activeSub?.path || ""} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-primary/70 italic hover:underline">Voir la vue d'ensemble</Link>
                  {activeSub?.children?.map((sub: any) => (
                    <Link key={sub.path} to={sub.path} onClick={() => setOpen(false)}
                      className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm", location.pathname === sub.path ? "text-primary font-semibold bg-primary/5" : "text-foreground/80 hover:bg-muted")}>
                      <div className={cn("h-1.5 w-1.5 rounded-full", location.pathname === sub.path ? "bg-primary" : "bg-muted-foreground/40")} />
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-72 bg-background border border-border rounded-xl shadow-xl p-2 flex flex-col gap-1">
              <Link to={item.path} onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-bold border-b mb-1">Vue d'ensemble</Link>
              {item.children.map((child: any) => (
                <Link key={child.path} to={child.path} onClick={() => setOpen(false)}
                  className={cn("px-4 py-2 text-sm rounded-md", isBranchActive(child, location.pathname, location.hash) ? "bg-primary/5 text-primary font-semibold" : "text-muted-foreground hover:bg-muted")}>
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
   MOBILE ITEM (L'accordéon "Pro")
============================================================ */
const MobileNavItem = ({ item, closeMenu }: { item: NavItemType; closeMenu: () => void }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = isBranchActive(item, location.pathname, location.hash);

  useEffect(() => { if (isActive) setOpen(true); }, [isActive]);

  return (
    <div className="flex flex-col">
      <div className={cn("flex items-center justify-between rounded-lg transition-colors", isActive ? "bg-primary/5 text-primary" : "text-foreground")}>
        <Link to={item.path} onClick={() => { closeMenu(); window.scrollTo(0, 0); }} className="flex-1 py-3 px-4 text-lg font-bold">
          {item.label}
        </Link>
        {item.children && (
          <button onClick={() => setOpen(!open)} className="p-4 border-l border-border/20">
            <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", open && "rotate-180")} />
          </button>
        )}
      </div>

      <div className={cn("overflow-hidden transition-all duration-300 ease-in-out pl-4", open ? "max-h-[1000px] opacity-100 mt-1" : "max-h-0 opacity-0")}>
        <div className="border-l-2 border-primary/20 flex flex-col gap-1 ml-1 py-1">
          {item.children?.map((child) => (
            <div key={child.path} className="flex flex-col">
              <div className="flex items-center justify-between">
                <Link to={child.path} onClick={closeMenu} className={cn("flex-1 py-2.5 px-4 text-base font-medium", 
                  isBranchActive(child, location.pathname, location.hash) ? "text-primary" : "text-muted-foreground")}>
                  {child.label}
                </Link>
                {child.children && (
                  <button className="p-3 text-muted-foreground/50"><ChevronRight className="h-4 w-4" /></button>
                )}
              </div>
              
              {child.children && (
                <div className="flex flex-col gap-1 ml-4 border-l border-border/50">
                  {child.children.map((sub) => (
                    <Link key={sub.path} to={sub.path} onClick={closeMenu}
                      className={cn("py-2 px-4 text-sm transition-colors", location.pathname === sub.path ? "text-primary font-bold" : "text-muted-foreground/70")}>
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   HEADER
============================================================ */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.hash]);
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" onClick={() => window.scrollTo(0, 0)} className="text-2xl font-black tracking-tighter text-primary">NOXIA</Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-1 h-full">
          <NavLink to="/" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent")}>Accueil</NavLink>
          {NAV_CONFIG.map((item) => <DesktopNavItem key={item.label} item={item} />)}
          <NavLink to="/contact" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent")}>Contact</NavLink>
        </nav>

        {/* MOBILE TOGGLE */}
        <button className="md:hidden p-2 rounded-lg bg-muted" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* MOBILE FULLSCREEN MENU */}
      <div className={cn("fixed inset-0 top-[64px] z-[99] bg-background md:hidden transition-transform duration-300 ease-in-out", mobileOpen ? "translate-x-0" : "translate-x-full")}>
        <div className="h-full flex flex-col overflow-y-auto bg-slate-50/50">
          <nav className="flex flex-col gap-2 p-4">
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-4 text-lg font-bold rounded-lg hover:bg-primary/5">
              <Home className="h-5 w-5 text-primary" /> Accueil
            </Link>
            
            <div className="h-px bg-border/50 my-2" />

            <div className="flex flex-col gap-1">
              {NAV_CONFIG.map((item) => (
                <MobileNavItem key={item.label} item={item} closeMenu={() => setMobileOpen(false)} />
              ))}
            </div>

            <div className="h-px bg-border/50 my-2" />

            <Link to="/contact" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-4 text-lg font-bold rounded-lg hover:bg-primary/5">
              <Mail className="h-5 w-5 text-primary" /> Contact
            </Link>
          </nav>

          <div className="mt-auto p-8 text-center text-xs text-muted-foreground">
            © 2024 NOXIA - Imagerie Quantitative
          </div>
        </div>
      </div>
    </header>
  );
}