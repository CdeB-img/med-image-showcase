import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/ecv-mapping-t1-t2-irm-cardiaque";

const ECVMappingCardiaque = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "ECV et Mapping T1/T2 en IRM cardiaque",
    description:
      "Validation, quantification et interprétation des biomarqueurs ECV, T1 natif et T2 mapping en IRM cardiaque. Approche méthodologique rigoureuse et validation translationnelle.",
    about: [
      "Extracellular Volume",
      "T1 mapping cardiac MRI",
      "T2 mapping cardiac MRI",
      "Diffuse fibrosis",
      "Myocardial edema",
      "Histological validation"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    url: CANONICAL
  };

  return (
    <>
      <Helmet>
        <title>ECV & Mapping T1/T2 en IRM cardiaque | NOXIA</title>
        <meta
          name="description"
          content="ECV, T1 natif et T2 mapping en IRM cardiaque : validation histologique, précision de l’hématocrite, sectorisation AHA et contrôle des biais méthodologiques."
        />
        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="ECV & Mapping T1/T2 en IRM cardiaque | NOXIA" />
        <meta
          property="og:description"
          content="Biomarqueurs tissulaires IRM cardiaque : validation translationnelle et rigueur méthodologique."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-16">

            {/* HERO */}
            <section className="space-y-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                ECV & Mapping T1/T2 en IRM cardiaque
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Quantification précise de l’espace extracellulaire,
                de l’inflammation et de l’œdème myocardique
                dans un cadre translationnel et multicentrique.
              </p>
            </section>

            {/* CONTEXTE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Pourquoi ces biomarqueurs sont sensibles
              </h2>

              <p>
                L’ECV, le T1 natif et le T2 mapping sont devenus des biomarqueurs centraux
                pour l’évaluation de la fibrose diffuse, de l’inflammation et de l’œdème.
                Leur interprétation influence directement les décisions cliniques
                et les conclusions des essais thérapeutiques.
              </p>

              <p>
                Cependant, ces paramètres sont extrêmement sensibles
                aux conditions d’acquisition, aux paramètres séquence,
                à l’hématocrite, à l’hydratation et aux méthodes de segmentation.
              </p>
            </section>

            {/* ECV */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                ECV : validation histologique et précision méthodologique
              </h2>

              <p>
                Dans un contexte hypertrophique avec biopsies septales,
                la validation de l’ECV a reposé sur une approche rigoureuse :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Prélèvement sanguin immédiat avant injection de gadolinium</li>
                <li>Mesure précise de l’hématocrite (centrifugation sur place)</li>
                <li>Contrôle des biais liés à la décantation en position allongée</li>
                <li>Prise en compte de l’état d’hydratation</li>
                <li>Sectorisation myocardique selon le modèle AHA</li>
                <li>Corrélation quantitative IRM ↔ histologie</li>
              </ul>

              <p>
                Cette méthodologie permet d’éviter une dérive systématique
                de l’ECV liée à une valeur d’hématocrite approximative,
                source majeure d’erreur dans de nombreuses études.
              </p>
            </section>

            {/* T1 T2 */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Distinction critique entre T1 et T2
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>T1 natif : inflammation diffuse et fibrose interstitielle</li>
                <li>T2 mapping : œdème actif</li>
              </ul>

              <p>
                La confusion entre ces deux marqueurs est fréquente.
                Leur signification physiopathologique diffère,
                et leur évolution temporelle après un événement aigu
                (IDM, myocardite) n’est pas superposable.
              </p>

              <p>
                La validation nécessite une homogénéité stricte des séquences,
                un contrôle du positionnement des ROI
                et une reproductibilité inter-centre documentée.
              </p>
            </section>

            {/* VARIABILITE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Sources majeures de variabilité
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Champ magnétique (1.5T vs 3T)</li>
                <li>Constructeur et version logicielle</li>
                <li>Paramètres MOLLI / ShMOLLI</li>
                <li>Timing post-contraste</li>
                <li>Segmentation myocardique</li>
                <li>Erreurs d’hématocrite</li>
              </ul>

              <p>
                Sans harmonisation multicentrique,
                la variabilité technique peut dépasser
                la variation physiopathologique recherchée.
              </p>
            </section>

            {/* STRUCTURATION */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Structuration multicentrique
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit des séquences et paramètres d’acquisition</li>
                <li>Harmonisation des méthodes de segmentation</li>
                <li>Contrôle qualité systématique</li>
                <li>Analyse des biais inter-centre</li>
                <li>Extraction standardisée des biomarqueurs</li>
              </ul>

              <p>
                L’objectif est de produire un biomarqueur exploitable
                statistiquement, défendable scientifiquement
                et robuste pour publication internationale.
              </p>
            </section>

            {/* LIENS INTERNES */}
            <section className="space-y-6 text-center">
              <h2 className="text-xl font-semibold">
                Voir également
              </h2>

              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/biomarqueurs-irm-cardiaque-essais"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Biomarqueurs & Essais
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/corelab-essais-cliniques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Core Lab IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/segmentation-irm"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Segmentation IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin d’une validation méthodologique ECV / T1 / T2 ?
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter du projet
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ECVMappingCardiaque;