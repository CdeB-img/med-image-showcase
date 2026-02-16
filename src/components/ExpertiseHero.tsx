import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type HeroAction = {
  label: string;
  to: string;
  variant?: "primary" | "secondary";
  icon?: LucideIcon;
};

type ExpertiseHeroProps = {
  badge?: string;
  badgeIcon?: LucideIcon;
  title: ReactNode;
  description: ReactNode;
  chips?: string[];
  actions?: HeroAction[];
  enhanced?: boolean;
};

const ExpertiseHero = ({
  badge,
  badgeIcon: BadgeIcon,
  title,
  description,
  chips = [],
  actions = [],
  enhanced = false,
}: ExpertiseHeroProps) => {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-8 md:p-12 space-y-8",
        enhanced
          ? "shadow-[0_16px_48px_hsl(var(--primary)/0.12)]"
          : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
      {enhanced ? (
        <>
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_25%,hsl(var(--primary)/0.2),transparent_45%),radial-gradient(circle_at_80%_75%,hsl(var(--primary)/0.15),transparent_42%)]" />
        </>
      ) : null}

      <div className="relative text-center space-y-6">
        {badge && (
          <div
            className={[
              "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary",
              enhanced ? "opacity-0 motion-safe:animate-fade-in" : "",
            ].join(" ")}
            style={enhanced ? { animationDelay: "70ms" } : undefined}
          >
            {BadgeIcon ? <BadgeIcon className="h-3.5 w-3.5" /> : null}
            {badge}
          </div>
        )}

        <h1
          className={[
            "text-4xl md:text-5xl font-bold tracking-tight text-foreground",
            enhanced ? "opacity-0 motion-safe:animate-fade-in text-glow" : "",
          ].join(" ")}
          style={enhanced ? { animationDelay: "140ms" } : undefined}
        >
          {title}
        </h1>

        <p
          className={[
            "text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto",
            enhanced ? "opacity-0 motion-safe:animate-fade-in" : "",
          ].join(" ")}
          style={enhanced ? { animationDelay: "220ms" } : undefined}
        >
          {description}
        </p>

        {chips.length > 0 && (
          <div
            className={[
              "flex flex-wrap items-center justify-center gap-2 pt-1",
              enhanced ? "opacity-0 motion-safe:animate-fade-in" : "",
            ].join(" ")}
            style={enhanced ? { animationDelay: "300ms" } : undefined}
          >
            {chips.map((chip) => (
              <span
                key={chip}
                className={[
                  "rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-foreground transition",
                  enhanced ? "hover:border-primary/40 hover:bg-primary/10 hover:text-primary" : "",
                ].join(" ")}
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      {actions.length > 0 && (
        <div
          className={[
            "relative flex flex-col sm:flex-row flex-wrap gap-3 justify-center pt-1",
            enhanced ? "opacity-0 motion-safe:animate-fade-in" : "",
          ].join(" ")}
          style={enhanced ? { animationDelay: "360ms" } : undefined}
        >
          {actions.map((action, index) => {
            const Icon = action.icon ?? ArrowRight;
            const isPrimary = (action.variant ?? (index === 0 ? "primary" : "secondary")) === "primary";

            return (
              <Link
                key={`${action.to}-${action.label}`}
                to={action.to}
                className={
                  isPrimary
                    ? [
                        "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium transition",
                        enhanced
                          ? "hover:opacity-100 hover:-translate-y-0.5 shadow-[0_10px_28px_hsl(var(--primary)/0.28)]"
                          : "hover:opacity-95",
                      ].join(" ")
                    : [
                        "inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-medium transition",
                        enhanced
                          ? "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                          : "hover:bg-muted/40",
                      ].join(" ")
                }
              >
                {action.label}
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ExpertiseHero;
