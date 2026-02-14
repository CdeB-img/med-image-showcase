import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X, ChevronRight } from "lucide-react";
import { projects as _projects } from "@/data/projects";

/* =========================
   NAV CONFIG (UNIFIÉ)
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
const parsePathWithHash = (p: string) => {
  const [pathnamePart, hashPart] = p.split("#");
  return {
    pathname: pathnamePart || "/",
    hash: hashPart ? `#${hashPart}` : "",
  };
};

const isBranchActive = (node: any, pathname: string, hash: string) => {
  const currentFull = `${pathname}${hash || ""}`;
  if (!node) return false;

  const p = parsePathWithHash(node.path || "");
  const nodeFull = `${p.pathname}${p.hash || ""}`;

  // match exact full (avec hash) ou match pathname (pour parents)
  if (nodeFull === currentFull) return true;
  if (p.hash === "" && p.pathname === pathname) return true;

  if (node.children?.length) {
    return node.children.some((c: any) => isBranchActive(c, pathname, hash));
  }
  return false;
};

/* ============================================================
   DESKTOP ITEM
   - Mega menu split pour "Expertise"
   - Dropdown simple pour Prestations / Projets
============================================================ */
const DesktopNavItem = ({ item }: { item: NavItemType }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMega = item.label === "Expertise";
  const parentActive = isBranchActive(item, location.pathname, location.hash);

  const [activeSub, setActiveSub] = useState<Child | null>(
    isMega ? (item.children?.[0] as Child) : null
  );

  const openMenu = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };
  const closeMenu = () => {
    timerRef.current = setTimeout(() => setOpen(false), 180);
  };

  // Quand on ouvre "Expertise", synchroniser la colonne droite avec la page courante si possible
  useEffect(() => {
    if (!open || !isMega) return;
    const match = item.children?.find((c: any) =>
      isBranchActive(c, location.pathname, location.hash)
    );
    if (match) setActiveSub(match as Child);
    else setActiveSub((item.children?.[0] as Child) || null);
  }, [open, isMega, item.children, location.pathname, location.hash]);

  return (
    <div className="relative h-full flex items-center" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <Link
        to={item.path}
        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "auto" })}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1",
          parentActive || open ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-accent"
        )}
      >
        {item.label}
        {item.children?.length ? (
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        ) : null}
      </Link>

      {open && item.children?.length ? (
        <div className="absolute top-full left-0 pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {isMega ? (
            <div className="w-[680px] bg-background border border-border rounded-xl shadow-2xl flex min-h-[320px] overflow-hidden">
              {/* Colonne gauche : catégories */}
              <div className="w-[220px] bg-muted/20 border-r border-border p-2 flex flex-col gap-1">
                {item.children.map((child: any) => {
                  const active = isBranchActive(child, location.pathname, location.hash) || activeSub?.label === child.label;
                  return (
                    <Link
                      key={child.path}
                      to={child.path}
                      onMouseEnter={() => setActiveSub(child)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "px-3 py-3 rounded-lg text-sm font-medium flex items-center justify-between transition-all",
                        active ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {child.label}
                      <ChevronRight className={cn("h-4 w-4", active ? "opacity-80" : "opacity-40")} />
                    </Link>
                  );
                })}
              </div>

              {/* Colonne droite : sous-pages */}
              <div className="flex-1 p-5 bg-background">
                <div className="border-b border-border/50 pb-3 mb-4">
                  <h4 className="text-lg font-bold">{activeSub?.label}</h4>
                  <p className="text-xs text-muted-foreground">
                    Vue d’ensemble & modules spécialisés
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {/* lien "Vue d’ensemble" du bloc (IRM/CT/Méthodo) */}
                  {activeSub?.path ? (
                    <Link
                      to={activeSub.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                        location.pathname === activeSub.path ? "text-primary font-semibold bg-primary/5" : "text-foreground/80 hover:bg-muted"
                      )}
                    >
                      <div className={cn("h-1.5 w-1.5 rounded-full", location.pathname === activeSub.path ? "bg-primary" : "bg-muted-foreground/40")} />
                      {activeSub.label} – Vue d’ensemble
                    </Link>
                  ) : null}

                  {/* sous-pages */}
                  {activeSub?.children?.map((sub: any) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                        location.pathname === sub.path ? "text-primary font-semibold bg-primary/5" : "text-foreground/80 hover:bg-muted"
                      )}
                    >
                      <div className={cn("h-1.5 w-1.5 rounded-full", location.pathname === sub.path ? "bg-primary" : "bg-muted-foreground/40")} />
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-72 bg-background border border-border rounded-xl shadow-xl p-2 flex flex-col gap-1">
              {/* IMPORTANT : sur Prestations, on ajoute en haut "Vue d’ensemble" */}
              <Link
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-4 py-2 text-sm rounded-md",
                  location.pathname === item.path ? "bg-primary/5 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {item.label} – Vue d’ensemble
              </Link>

              {item.children.map((child: any) => {
                const parsed = parsePathWithHash(child.path);
                const isHashTarget =
                  parsed.pathname === location.pathname &&
                  parsed.hash &&
                  parsed.hash === (location.hash || "");

                return (
                  <Link
                    key={child.path}
                    to={parsed.hash ? { pathname: parsed.pathname, hash: parsed.hash } : child.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-4 py-2 text-sm rounded-md",
                      isHashTarget || isBranchActive(child, location.pathname, location.hash)
                        ? "bg-primary/5 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {child.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

/* ============================================================
   MOBILE ITEM (Accordéon propre + hash-aware)
============================================================ */
const MobileNavItem = ({ item, closeMenu }: { item: NavItemType; closeMenu: () => void }) => {
  const location = useLocation();
  const [openRoot, setOpenRoot] = useState(false);
  const parentActive = isBranchActive(item, location.pathname, location.hash);

  useEffect(() => {
    // ouvre automatiquement si on est dans la branche
    if (parentActive) setOpenRoot(true);
  }, [parentActive]);

  return (
    <div className="w-full border-b border-border/10">
      <div className="flex items-center justify-between py-2">
        <Link
          to={item.path}
          onClick={() => {
            closeMenu();
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
          }}
          className={cn("px-3 py-2 text-lg font-semibold", parentActive ? "text-primary" : "text-foreground")}
        >
          {item.label}
        </Link>

        {item.children?.length ? (
          <button onClick={() => setOpenRoot(!openRoot)} className="p-4" aria-label="Ouvrir">
            <ChevronDown className={cn("h-5 w-5 transition-transform", openRoot && "rotate-180")} />
          </button>
        ) : null}
      </div>

      {openRoot && item.children?.length ? (
        <div className="pl-4 pb-4 flex flex-col gap-3">
          {/* Vue d’ensemble */}
          <Link
            to={item.path}
            onClick={closeMenu}
            className={cn(
              "text-sm py-1.5",
              location.pathname === item.path ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            {item.label} – Vue d’ensemble
          </Link>

          {item.children.map((child: any) => (
            <div key={child.label} className="space-y-2">
              <Link
                to={child.path}
                onClick={closeMenu}
                className={cn(
                  "text-sm py-1",
                  isBranchActive(child, location.pathname, location.hash) ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                {child.label}
              </Link>

              {child.children?.length ? (
                <div className="pl-4 border-l border-border/50 flex flex-col gap-1">
                  {/* Vue d’ensemble du sous-pilier (IRM/CT/Méthodo) */}
                  <Link
                    to={child.path}
                    onClick={closeMenu}
                    className={cn(
                      "text-xs py-1.5",
                      location.pathname === child.path ? "text-primary font-semibold" : "text-muted-foreground"
                    )}
                  >
                    {child.label} – Vue d’ensemble
                  </Link>

                  {child.children.map((sub: any) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={closeMenu}
                      className={cn(
                        "text-xs py-1.5",
                        isBranchActive(sub, location.pathname, location.hash) ? "text-primary font-semibold" : "text-muted-foreground"
                      )}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/* ============================================================
   HEADER
============================================================ */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname, location.hash]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "auto" })} className="text-xl font-bold tracking-tighter">
          NOXIA
        </Link>

        {/* DESKTOP */}
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

        {/* MOBILE TOGGLE */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen((s) => !s)} aria-label="Menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* MOBILE PANEL */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-40 bg-background md:hidden transition-all duration-300 overflow-y-auto px-4 pb-20",
          mobileOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
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