import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumb";

const CANONICAL = "https://noxia-imagerie.fr/prestations-imagerie-medicale";

const Prestations = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace("#", "");
    const timeout = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [location.hash]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Prestations en imagerie médicale quantitative",
    description:
      "CoreLab IRM & CT, structuration multicentrique, audit méthodologique, reprise d’études existantes et ingénierie quantitative en recherche clinique.",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    areaServed: "France & Europe",
    url: CANONICAL
  };

  return (
    <>
      <Helmet>
        <title>Prestations | CoreLab & Imagerie Quantitative | NOXIA</title>
        <meta
          name="description"
          content="CoreLab IRM et CT externalisé, audit DICOM, harmonisation multicentrique, reprise d’études existantes et développement d’outils sur mesure en recherche clinique."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-24 px-4">
          <div className="max-w-5xl mx-auto space-y-28">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "Prestations" }
              ]}
            />

            {/* HERO */}
            <section className="text-center space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Prestations en imagerie médicale quantitative
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Structuration méthodologique, production de biomarqueurs robustes
                et accompagnement multicentrique en IRM et CT.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="max-w-4xl mx-auto text-muted-foreground leading-relaxed space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Une expertise indépendante et architecturée
              </h2>

              <p>
                NOXIA intervient comme partenaire méthodologique indépendant
                auprès d’équipes hospitalo-universitaires,
                promoteurs académiques et industriels.
              </p>

              <p>
                L’objectif n’est pas seulement d’extraire des résultats,
                mais de sécuriser toute la chaîne d’analyse :
                audit DICOM, harmonisation multicentrique,
                segmentation contrôlée, extraction métrique traçable
                et validation statistique.
              </p>
            </section>

            {/* CORELAB */}
            <section id="corelab" className="space-y-8 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-foreground">
                CoreLab IRM & CT externalisé
              </h2>

              <p className="text-muted-foreground leading-relaxed">
                Mise en place et pilotage complet d’un circuit image multicentrique.
              </p>

              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Définition protocolaire imagerie</li>
                <li>Audit des séquences et reconstructions</li>
                <li>Formation centres investigateurs</li>
                <li>Centralisation sécurisée & contrôle qualité</li>
                <li>Relectures expertes et gestion des écarts</li>
                <li>Production d’endpoints quantitatifs validés</li>
              </ul>

              <p className="text-muted-foreground">
                Adapté aux RHU, PHRC, ANR, cohortes longitudinales
                et essais randomisés industriels.
              </p>
            </section>

            {/* REPRISE */}
            <section id="reprise" className="space-y-8 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-foreground">
                Reprise et sécurisation d’études existantes
              </h2>

              <p className="text-muted-foreground leading-relaxed">
                Intervention sur études présentant fragilités méthodologiques
                ou difficultés de publication.
              </p>

              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Anonymisation hétérogène</li>
                <li>Spacing ou orientation incohérents</li>
                <li>Reconstructions multiples non documentées</li>
                <li>Pipelines non reproductibles</li>
                <li>Absence de traçabilité des traitements</li>
              </ul>

              <p className="text-muted-foreground">
                Reconstruction complète possible :
                hiérarchisation base multicentrique,
                détection doublons, harmonisation inter-centres
                et production d’un flux scientifiquement défendable.
              </p>
            </section>

            {/* AUDIT */}
            <section id="audit" className="space-y-8 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-foreground">
                Audit méthodologique & harmonisation
              </h2>

              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Analyse critique d’un pipeline existant</li>
                <li>Évaluation reproductibilité inter-centre</li>
                <li>Harmonisation inter-constructeurs (IRM & CT)</li>
                <li>Calibration phantom en CT</li>
                <li>Évaluation et intégration contrôlée d’IA</li>
              </ul>
            </section>

            {/* INGÉNIERIE */}
            <section id="ingenierie" className="space-y-8 scroll-mt-28">
              <h2 className="text-2xl font-semibold text-foreground">
                Développement & ingénierie sur mesure
              </h2>

              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Développement Python scientifique dédié</li>
                <li>Automatisation flux DICOM / NIfTI</li>
                <li>Modules spécifiques 3D Slicer</li>
                <li>Architecture data & structuration serveur</li>
              </ul>

              <p className="text-muted-foreground">
                Chaque outil est conçu comme un objet méthodologique explicite,
                jamais comme une simple démonstration technique isolée.
              </p>
            </section>

            {/* MODALITÉS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Modalités d’intervention
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Mission ciblée ponctuelle</li>
                <li>Accompagnement complet d’étude</li>
                <li>Support expert sur problématique complexe</li>
                <li>Partenariat R&D industriel</li>
              </ul>

              <p>
                Intervention possible en amont (conception protocolaire),
                pendant l’étude (structuration & QA)
                ou en aval (reprise, consolidation, publication).
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-6">
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Toute collaboration débute par un échange exploratoire
                permettant d’identifier les enjeux méthodologiques
                et le niveau d’intervention nécessaire.
              </p>

              <Link
                to="/contact"
                className="inline-block rounded-md bg-primary px-8 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Initier une collaboration
              </Link>
            </section>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Prestations;
