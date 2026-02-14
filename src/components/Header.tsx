import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type Child = { label: string; path: string };
type NavItemType = { label: string; path: string; children: Child[] };

const NavItem: React.FC<{
  item: NavItemType;
  mobileMode: boolean;
  closeMobileMenu?: () => void;
}> = ({ item, mobileMode, closeMobileMenu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bridgeDelay = 300; // délai plus tolérant en ms
  const submenuId = `submenu-${item.label.replace(/\s+/g, "-").toLowerCase()}`;

  const isActive =
    location.pathname === item.path || item.children.some((c) => location.pathname === c.path);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  // ouvre immédiatement sur hover desktop
  const openNow = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsOpen(true);
  };

  // ferme avec délai (utilisé par bridge et leave)
  const closeWithDelay = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
      timerRef.current = null;
    }, bridgeDelay);
  };

  // handlers pour desktop (ignorés en mobile)
  const handleParentMouseEnter = () => {
    if (mobileMode) return;
    openNow();
  };
  const handleParentMouseLeave = () => {
    if (mobileMode) return;
    closeWithDelay();
  };

  // bridge: zone invisible entre parent et dropdown pour capter la souris
  // height peut être ajustée (ex: 12-28px) selon la distance visuelle
  const BRIDGE_HEIGHT = 18;

  return (
    <div className="relative flex items-center h-full">
      {/* Parent link + chevron */}
      <div
        className="flex items-center gap-2"
        onMouseEnter={handleParentMouseEnter}
        onMouseLeave={handleParentMouseLeave}
      >
        <Link
          to={item.path}
          onClick={() => {
            if (mobileMode && closeMobileMenu) closeMobileMenu();
          }}
          className={cn(
            "group flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md",
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none",
            isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>

        {item.children.length > 0 && (
          <button
            aria-expanded={isOpen}
            aria-controls={submenuId}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((s) => !s);
            }}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md transition-transform",
              isOpen && "rotate-180"
            )}
            title={isOpen ? "Fermer sous-menu" : "Ouvrir sous-menu"}
          >
            <ChevronDown className={cn("h-4 w-4 opacity-60", isOpen && "rotate-180")} />
          </button>
        )}
      </div>

      {/* --- BRIDGE INVISIBLE (seulement desktop) --- */}
      {!mobileMode && item.children.length > 0 && (
        <div
          // zone placée juste sous le parent, largeur = largeur du parent (ici on prend left 0 full width)
          onMouseEnter={() => {
            // si la souris passe sur le bridge, on garde ouvert
            openNow();
          }}
          onMouseLeave={() => {
            // si la souris quitte le bridge, on commence le délai de fermeture
            closeWithDelay();
          }}
          style={{
            position: "absolute",
            top: "100%", // juste sous le parent
            left: 0,
            width: "100%",
            height: `${BRIDGE_HEIGHT}px`,
            // visible pour debug: background: "rgba(255,0,0,0.2)"
            pointerEvents: "auto",
            zIndex: 40,
          }}
        />
      )}

      {/* DROPDOWN PANEL */}
      {!mobileMode && item.children.length > 0 && (
        <div
          className={cn(
            "absolute top-full left-0 pt-2 w-72 z-50 transition-all duration-150 ease-in-out origin-top-left",
            isOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 invisible pointer-events-none"
          )}
          onMouseEnter={() => {
            // si on survole le panneau, on garde ouvert
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            setIsOpen(true);
          }}
          onMouseLeave={() => {
            // quand on quitte le panneau, on ferme avec délai
            closeWithDelay();
          }}
        >
          <div className="overflow-hidden rounded-lg border border-border/50 bg-background/95 shadow-xl backdrop-blur-md ring-1 ring-black/5">
            <ul className="py-2 flex flex-col">
              {item.children.map((child) => (
                <li key={child.path}>
                  <NavLink
                    to={child.path}
                    className={({ isActive: navIsActive }) =>
                      cn(
                        "relative block px-4 py-2.5 text-sm transition-colors hover:bg-muted/50",
                        navIsActive ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:text-foreground"
                      )
                    }
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-[2px] bg-primary transition-opacity duration-200",
                        location.pathname === child.path ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {child.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Mobile rendering handled elsewhere; ici on ne touche pas au mobile */}
    </div>
  );
};

export default NavItem;
