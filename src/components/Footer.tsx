import { Link } from "react-router-dom";
import { Brain, Mail, FileText, Home, User, BookOpen } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-10">

          {/* ================= BRAND ================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-semibold tracking-tight">NOXIA</span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Numerical Observation × Imaging Analysis
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Expertise indépendante en imagerie médicale quantitative.
              IRM, CT et biomarqueurs reproductibles pour la recherche clinique
              et les essais multicentriques.
            </p>
          </div>

          {/* ================= NAVIGATION ================= */}
          <div className="space-y-4 text-center">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Navigation
            </h4>

            <nav className="flex flex-col items-center gap-3">

              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors grid grid-cols-[18px_1fr] items-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Accueil</span>
              </Link>

              <Link
                to="/projets"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors grid grid-cols-[18px_1fr] items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Projets</span>
              </Link>

              <Link
                to="/a-propos"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors grid grid-cols-[18px_1fr] items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>À propos</span>
              </Link>

              <Link
                to="/references-publications"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors grid grid-cols-[18px_1fr] items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Références</span>
              </Link>

              <Link
                to="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors grid grid-cols-[18px_1fr] items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>Contact</span>
              </Link>

            </nav>
          </div>

          {/* ================= CONFIDENTIALITÉ ================= */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Données & Confidentialité
            </h4>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Les images et jeux de données présentés sur ce site sont issus
              de bases entièrement anonymisées ou simulées, utilisés
              exclusivement à des fins de démonstration méthodologique
              et scientifique.
            </p>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Aucune donnée patient identifiable n’est publiée.
              L’ensemble des flux d’analyse respecte les standards
              de confidentialité et de traçabilité en vigueur.
            </p>
          </div>

        </div>

        {/* ================= BOTTOM BAR ================= */}
        <div className="mt-10 pt-8 border-t border-border text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NOXIA Imagerie — Tous droits réservés.
          </p>

          <p className="text-[11px] text-muted-foreground/70">
            Imagerie quantitative · CoreLab · IRM & CT · Recherche clinique
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
