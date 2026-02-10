import { Link, NavLink, useMatch } from "react-router-dom";
import { cn } from "@/lib/utils";
import { projects } from "@/data/projects";
import { useRef, useState } from "react";

export default function Header() {
  const isProjectDetail = useMatch("/projet/:id");

  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };

  const closeMenuWithDelay = () => {
    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 300); // ← délai volontaire (300 ms)
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">

        {/* Logo */}
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight hover:opacity-90 transition"
        >
          NOXIA
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm">

          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "text-muted-foreground hover:text-foreground transition",
                isActive && "text-foreground font-medium"
              )
            }
          >
            Accueil
          </NavLink>

          {/* PROJETS — ZONE ENGLOBANTE */}
          <div
            className="relative"
            onMouseEnter={openMenu}
            onMouseLeave={closeMenuWithDelay}
          >
            <NavLink
              to="/projets"
              className={({ isActive }) =>
                cn(
                  "text-muted-foreground hover:text-foreground transition",
                  (isActive || isProjectDetail) &&
                    "text-foreground font-medium"
                )
              }
            >
              Projets
            </NavLink>

            {open && (
              <div className="absolute left-0 mt-2 min-w-[260px] rounded-md border border-border bg-background shadow-lg">
                <ul className="py-2">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <Link
                        to={`/projet/${project.id}`}
                        className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                        onClick={() => setOpen(false)}
                      >
                        {project.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              cn(
                "text-muted-foreground hover:text-foreground transition",
                isActive && "text-foreground font-medium"
              )
            }
          >
            Contact
          </NavLink>

        </nav>
      </div>
    </header>
  );
}d