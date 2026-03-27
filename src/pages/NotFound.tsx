import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Page non trouvée | NOXIA</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow, noarchive" />
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center space-y-4 px-4">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="text-xl text-muted-foreground">La page demandée n’existe pas ou a été déplacée.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/" className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-muted/40 transition">
              Retour à l’accueil
            </Link>
            <Link to="/expertise" className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-muted/40 transition">
              Voir les expertises
            </Link>
            <Link to="/projets" className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-muted/40 transition">
              Explorer les projets
            </Link>
            <Link to="/contact" className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-muted/40 transition">
              Contacter NOXIA
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
