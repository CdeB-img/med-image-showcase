import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { projects } from "@/data/projects";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">

        {/* Logo */}
        <Link to="/" className="font-semibold tracking-tight text-lg">
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

          {/* Projets dropdown */}
          <div className="relative group">
            <span className="cursor-default text-muted-foreground hover:text-foreground transition">
              Projets
            </span>

            <div className="absolute left-0 mt-2 hidden min-w-[220px] rounded-md border border-border bg-background shadow-lg group-hover:block">
              <ul className="py-2">
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      to={`/projet/${project.id}`}
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {project.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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
}