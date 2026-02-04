import { Link } from "react-router-dom";
import { Brain, Mail, FileText, Home } from "lucide-react";
const Footer = () => {
  return <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-semibold">Expert Imagerie Médicale</span>
            </div>
            <p className="text-sm text-muted-foreground">Analyse et quantification d'images médicales pour la recherche clinique</p>
          </div>

          {/* Navigation */}
          <div className="space-y-4 my-0 py-0 px-0 border-0">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Navigation
            </h4>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <Home className="w-4 h-4" />
                Accueil
              </Link>
              <Link to="/projets" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Projets
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact
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
              entièrement anonymisés, utilisés exclusivement à des fins de démonstration 
              méthodologique et scientifique. Elles ne permettent en aucun cas l'identification de patients.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Expert Imagerie Médicale. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;