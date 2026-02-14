import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X, ChevronRight } from "lucide-react";
import { projects as _projects } from "@/data/projects";

/* =========================
   CONFIG & TYPES
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
   Helpers
   ========================= */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const parsePathWithHash = (p: string) => {
  const [pathnamePart, hashPart] = p.split("#");
  return {
    pathname: pathnamePart || "/",
    hash: hashPart ? `#${hashPart}` : "",
    original: p,
  };
};

const isBranchActive = (item: NavItemType | Child | undefined, pathname: string, hash: string | undefined) => {
  if (!item || !item.path) return false;
  const parsed = parsePathWithHash(item.path);
  if (parsed.pathname === pathname && (parsed.hash || "") === (hash || "")) return true;
  if ((item as any).children) {
    return (item as any).children.some((c: any) => {
      const pc = parsePathWithHash(c.path);
      if (pc.pathname === pathname && (pc.hash || "") === (hash || "")) return true;
      if (c.children) {
        return c.children.some((g: any) => {
          const pg = parsePathWithHash(g.path);
          return pg.pathname === pathname && (pg.hash || "") === (hash || "");
        });
      }
      return false;
    });
  }
  return false;
};

/* =========================
   DesktopNavItem
   - Expertise = mega menu 2 colonnes
   - highlight adouci (fond translucide)
   ========================= */
const DesktopNavItem: React.FC<{ item: NavItemType }> = ({ item }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [hoveredChild, setHoveredChild] = useState<Child | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMega = item.label === "Expertise";

  useEffect(() => {
    if (!open) setHoveredChild(null);
  }, [open, location.pathname, location.hash]);

  const openMenu = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };
  const closeMenu = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setOpen(false);
      setHoveredChild(null);
    }, 220);
  };

  useEffect(() => {
    if (!open || !isMega) return;
    const match = item.children?.find((c: any) => isBranchActive(c, location.pathname, location.hash));
    setHoveredChild((match as Child) || (item.children?.[0] as Child) || null);
  }, [open, isMega, item.children, location.pathname, location.hash]);

  const parentActive = isBranchActive(item, location.pathname, location.hash);

  return (
    <div className="relative h-full flex items-center" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <Link
        to={item.path}
        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "auto" })}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1",
          parentActive || open ? "text-primary bg-muted/10" : "text-muted-foreground hover:bg-accent"
        )}
      >
        {item.label}
        {item.children?.length ? <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} /> : null}
      </Link>

      {open && item.children?.length ? (
        <div className="absolute top-full left-0 pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {isMega ? (
            <div className="w-[680px] bg-background/80 border border-border rounded-xl shadow-2xl flex min-h-[320px] overflow-hidden backdrop-blur-sm">
              {/* colonne gauche */}
              <div className="w-[220px] bg-muted/5 border-r border-border p-2 flex flex-col gap-1">
                {item.children!.map((child: any) => {
                  const active = isBranchActive(child, location.pathname, location.hash) || hoveredChild?.label === child.label;
                  return (
                    <Link
                      key={child.path}
                      to={child.path}
                      onMouseEnter={() => setHoveredChild(child)}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "px-3 py-3 rounded-lg text-sm font-medium flex items-center justify-between transition-all",
                        active ? "bg-muted/20 text-primary" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {child.label}
                      <ChevronRight className={cn("h-4 w-4", active ? "opacity-80" : "opacity-40")} />
                    </Link>
                  );
                })}
              </div>

              {/* colonne droite */}
              <div className="flex-1 p-5 bg-background/90">
                <div className="border-b border-border/50 pb-3 mb-4">
                  <h4 className="text-lg font-semibold">{hoveredChild?.label}</h4>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {hoveredChild?.children?.map((sub: any) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                        isBranchActive(sub, location.pathname, location.hash)
                          ? "text-primary font-semibold bg-primary/5"
                          : "text-foreground/80 hover:bg-muted"
                      )}
                    >
                      <div className={cn("h-1.5 w-1.5 rounded-full", isBranchActive(sub, location.pathname, location.hash) ? "bg-primary" : "bg-muted-foreground/40")} />
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-72 bg-background border border-border rounded-xl shadow-xl p-2 flex flex-col gap-1">
              {item.children!.map((child: any) => {
                const parsed = parsePathWithHash(child.path);
                const isHashTarget = parsed.pathname === location.pathname && parsed.hash === (location.hash || "");
                return (
                  <Link
                    key={child.path}
                    to={parsed.hash ? { pathname: parsed.pathname, hash: parsed.hash } : child.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-4 py-2 text-sm rounded-md",
                      isHashTarget || isBranchActive(child, location.pathname, location.hash)
                        ? "bg-muted/10 text-primary font-semibold"
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

/* =========================
   Mobile: un seul top-level ouvert, un seul sous-level ouvert
   - sections principales en gras
   - highlight cascade
   ========================= */
const MobileChildRow: React.FC<{ child: Child; closeMobileMenu: () => void; pathname: string; hash?: string; openChildKey: string | null; setOpenChildKey: (k: string | null) => void }> = ({
  child,
  closeMobileMenu,
  pathname,
  hash,
  openChildKey,
  setOpenChildKey,
}) => {
  const parsed = parsePathWithHash(child.path);
  const toProp = parsed.hash ? { pathname: parsed.pathname, hash: parsed.hash } : parsed.pathname;
  const childActive = isBranchActive(child, pathname, hash);
  const key = slugify(child.label);
  const open = openChildKey === key;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <Link
          to={toProp}
          onClick={() => closeMobileMenu()}
          className={cn(
            "block px-3 py-2 text-sm rounded-md",
            childActive ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground hover:bg-muted/10"
          )}
        >
          {child.label}
        </Link>

        {child.children && child.children.length > 0 && (
          <button
            onClick={() => setOpenChildKey(open ? null : key)}
            aria-expanded={open}
            aria-controls={`mobile-sub-${key}`}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent/10"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>

      {child.children && child.children.length > 0 && (
        <div
          id={`mobile-sub-${key}`}
          className={cn(
            "overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out pl-4",
            open ? "max-h-[40rem] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <ul className="flex flex-col">
            {child.children.map((g) => {
              const pg = parsePathWithHash(g.path);
              const to = pg.hash ? { pathname: pg.pathname, hash: pg.hash } : pg.pathname;
              const active = isBranchActive(g, pathname, hash);
              return (
                <li key={g.path}>
                  <NavLink
                    to={to}
                    onClick={() => closeMobileMenu()}
                    className={({ isActive }) =>
                      cn(
                        "block px-3 py-2 text-sm rounded-md",
                        active || isActive ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:bg-muted/10"
                      )
                    }
                  >
                    {g.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

const MobileNavItem: React.FC<{ item: NavItemType; closeMobileMenu: () => void; pathname: string; hash?: string; openTopKey: string | null; setOpenTopKey: (k: string | null) => void }> = ({
  item,
  closeMobileMenu,
  pathname,
  hash,
  openTopKey,
  setOpenTopKey,
}) => {
  const parentActive = isBranchActive(item, pathname, hash);
  const topKey = slugify(item.label);
  const open = openTopKey === topKey;

  // state to allow only one child open at a time inside this top-level
  const [openChildKey, setOpenChildKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setOpenChildKey(null);
  }, [open]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <Link
          to={item.path}
          onClick={() => closeMobileMenu()}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-md",
            parentActive ? "text-primary font-bold bg-primary/5" : "text-muted-foreground hover:bg-muted/10"
          )}
        >
          {item.label}
        </Link>

        {item.children && item.children.length > 0 && (
          <button
            onClick={() => setOpenTopKey(open ? null : topKey)}
            aria-expanded={open}
            aria-controls={`mobile-${topKey}`}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent/10"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>

      {item.children && item.children.length > 0 && (
        <div
          id={`mobile-${topKey}`}
          className={cn(
            "overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out pl-4",
            open ? "max-h-[60rem] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <ul className="flex flex-col">
            {item.children.map((child) => (
              <li key={child.label} className="border-b border-border/10">
                <MobileChildRow
                  child={child}
                  closeMobileMenu={closeMobileMenu}
                  pathname={pathname}
                  hash={hash}
                  openChildKey={openChildKey}
                  setOpenChildKey={setOpenChildKey}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* =========================
   Header principal
   ========================= */
export default function Header(): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openTopKey, setOpenTopKey] = useState<string | null>(null); // only one top-level open at a time
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setOpenTopKey(null);
  }, [location.pathname, location.hash]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="mr-4 flex items-center space-x-2 transition-opacity hover:opacity-80">
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            NOXIA
          </span>
        </Link>

        {/* Desktop */}
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

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setMobileOpen((s) => !s)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent/10"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        className={cn(
          "md:hidden border-t border-border/30 bg-background/95 transition-[max-height,opacity] duration-200 ease-in-out overflow-hidden",
          mobileOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="container mx-auto px-4 py-4">
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 text-sm font-medium rounded-md",
                  isActive ? "text-foreground bg-accent/50" : "text-muted-foreground hover:bg-muted/10"
                )
              }
            >
              Accueil
            </NavLink>

            {NAV_CONFIG.map((item) => (
              <div key={item.label} className="w-full">
                <MobileNavItem
                  item={item}
                  closeMobileMenu={() => setMobileOpen(false)}
                  pathname={location.pathname}
                  hash={location.hash}
                  openTopKey={openTopKey}
                  setOpenTopKey={setOpenTopKey}
                />
              </div>
            ))}

            <NavLink
              to="/contact"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 text-sm font-medium rounded-md",
                  isActive ? "text-foreground bg-accent/50" : "text-muted-foreground hover:bg-muted/10"
                )
              }
            >
              Contact
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
