import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

type AuthorExpertiseBlockProps = {
  context: ReactNode;
  title?: string;
  links?: Array<{ label: string; to: string }>;
};

const AuthorExpertiseBlock = ({
  context,
  title = "Repère d'expertise",
  links = [],
}: AuthorExpertiseBlockProps) => (
  <aside className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-4">
    <div className="flex items-center gap-2 font-semibold text-foreground">
      <ShieldCheck className="h-5 w-5 text-primary" />
      <h2 className="text-xl">{title}</h2>
    </div>

    <p className="text-muted-foreground leading-relaxed">
      Cette page s'inscrit dans les domaines de travail présentés par{" "}
      <Link to="/a-propos" className="text-primary hover:underline">
        Charles de Bourguignon
      </Link>
      , consultant indépendant en imagerie médicale quantitative.
    </p>

    <p className="text-muted-foreground leading-relaxed">{context}</p>

    {links.length > 0 ? (
      <div className="flex flex-wrap gap-3 pt-1">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="text-sm text-primary hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </div>
    ) : null}
  </aside>
);

export default AuthorExpertiseBlock;

