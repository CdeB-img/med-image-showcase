import { Link } from "react-router-dom";
import { Brain, Mail, FileText, Home } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-semibold">NOXIA</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Numerical Observation × Imaging Analysis
              <br />
               <br />
              Analyse et quantification d'images médicales pour la recherche clinique
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4 text-center">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Navigation
            </h4>

            <nav className="flex flex-col items-center gap-2">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors grid grid-cols-[16px_1fr] items-center gap-2"
              >
                <span className="flex items-center justify-center w-4 h-4">
                  <Home className="w-4 h-4" />
                </span>
                <span>Accueil</span>
              </Link>

              <Link
                to="/projets"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors grid grid-cols-[16px_1fr] items-center gap-2"
              >
                <span className="flex items-center justify-center w-4 h-4">
                  <FileText className="w-4 h-4" />
                </span>
                <span>Projets</span>
              </Link>

              <Link
                to="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 leading-none"
              >
                <span className="inline-block w-[0px]" />
                <Mail className="w-4 h-4 shrink-0" />
                <span>Contact</span>
              </Link>
            </nav>  


          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Données et confidentialité
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Les images et données présentées sur ce site sont issues de jeux de données 
              entièrement anonymisés ou simulés, utilisés exclusivement à des fins de démonstration 
              méthodologique et scientifique. Elles ne permettent en aucun cas l'identification de patients.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NOXIA. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;