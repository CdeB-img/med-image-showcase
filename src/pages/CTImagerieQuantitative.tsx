import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ArrowRight,
  ShieldCheck,
  Database,
  Workflow,
  BarChart3,
  Scale,
  Atom,
  Globe2,
  Layers
} from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/ct-imagerie-quantitative";

const CTImagerieQuantitative = () => {

  /* =========================
     JSON-LD – PAGE PRINCIPALE
  ========================== */

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CT quantitatif en recherche clinique multicentrique",
    description:
      "CT quantitatif : stabilité des unités Hounsfield, calibration phantom, imagerie spectrale, perfusion CT et harmonisation inter-constructeurs pour biomarqueurs robustes.",
    about: [
      "Quantitative CT",
      "Hounsfield Units",
      "Phantom calibration",
      "Spectral CT",
      "Dual-energy CT",
      "Iterative reconstruction",
      "CT perfusion",
      "Multicenter reproducibility"
    ],
    specialty: [
      "Radiology",
      "Clinical research imaging",
      "Quantitative imaging biomarkers"
    ],
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Researchers"
    },
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    url: CANONICAL
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: "https://noxia-imagerie.fr/"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Expertise",
        item: "https://noxia-imagerie.fr/expertise"
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "CT quantitatif",
        item: CANONICAL
      }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Les unités Hounsfield sont-elles comparables entre centres ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. Les HU dépendent du kernel, de l’énergie effective, de la reconstruction itérative et de l’implémentation constructeur. Une harmonisation et une calibration phantom sont nécessaires."
        }
      },
      {
        "@type": "Question",
        name: "Le CT spectral est-il intrinsèquement quantitatif ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Le spectral améliore la séparation matérielle, mais la robustesse dépend du modèle de décomposition et de la calibration. Il nécessite validation indépendante."
        }
      },
      {
        "@type": "Question",
        name: "Un algorithme IA suffit-il pour produire un biomarqueur CT publiable ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. L’IA doit s’intégrer dans une architecture incluant audit DICOM, validation physique, calibration et analyse de reproductibilité."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>CT quantitatif multicentrique & biomarqueurs physiques | NOXIA</title>

        <meta
          name="description"
          content="CT quantitatif en recherche clinique : stabilité HU, calibration phantom, spectral CT, perfusion et harmonisation multicentrique."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>

        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>

        <script type="application/ld+json">
          {JSON.stringify(faqJsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-20">

            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "CT quantitatif" }
              ]}
            />

            {/* HERO */}
            <section className="text-center space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                CT quantitatif multicentrique
                <span className="block text-primary mt-2">
                  Biomarkers physiquement cohérents & reproductibles
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Calibration phantom, stabilité HU, imagerie spectrale,
                perfusion quantitative et harmonisation inter-constructeurs.
              </p>
            </section>

            {/* REPRODUCTIBILITÉ */}
            <section className="grid md:grid-cols-3 gap-6">

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Reproductibilité
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Variabilité HU inter-scanner pouvant dépasser ±5–10 HU
                  selon kernel et reconstruction.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Workflow className="w-5 h-5 text-primary" />
                  Architecture pipeline
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Audit DICOM, calibration phantom,
                  contrôle énergétique et validation statistique.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Database className="w-5 h-5 text-primary" />
                  Multicentrique
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Harmonisation GE / Siemens / Philips,
                  gestion kernel et reconstruction itérative.
                </p>
              </div>

            </section>

            {/* POSITIONNEMENT CENTRAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Du pixel au biomarqueur physiquement défendable
              </h2>

              <p>
                Une valeur HU isolée ne constitue pas un biomarqueur.
                Un biomarqueur CT exige calibration,
                stabilité énergétique et validation inter-constructeurs.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Contrôle énergie effective & spectrale</li>
                <li>Calibration phantom eau / matériaux</li>
                <li>Stabilité inter-kernel</li>
                <li>Analyse de reproductibilité (CV, ICC)</li>
                <li>Versioning pipeline & traçabilité</li>
              </ul>
            </section>

            {/* SPECTRAL */}
            <section className="space-y-10">
              <h2 className="text-3xl font-semibold text-center">
                CT spectral & avancé
              </h2>

              <div className="grid md:grid-cols-2 gap-8">

                <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Atom className="w-5 h-5 text-primary" />
                    Décomposition matérielle
                  </div>

                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>Compton / Photoélectrique</li>
                    <li>Monoénergétique (keV)</li>
                    <li>Validation phantom multi-matériaux</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Données de littérature
                  </div>

                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>Variabilité monoénergétique dépendante constructeur</li>
                    <li>Déviation HU sous 70 keV plus instable</li>
                    <li>Sensibilité reconstruction itérative documentée</li>
                  </ul>
                </div>

              </div>
            </section>

            {/* PERFUSION */}
            <section className="space-y-10">
              <h2 className="text-3xl font-semibold text-center">
                Perfusion CT quantitative
              </h2>

              <div className="grid md:grid-cols-2 gap-8">

                <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Layers className="w-5 h-5 text-primary" />
                    Biomarqueurs
                  </div>

                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>Tmax</li>
                    <li>CBF</li>
                    <li>CBV</li>
                    <li>Mismatch volumique</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <Globe2 className="w-5 h-5 text-primary" />
                    Variabilité inter-logiciels
                  </div>

                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>Divergences volumétriques documentées</li>
                    <li>Sensibilité AIF / VOF</li>
                    <li>Impact résolution temporelle</li>
                  </ul>
                </div>

              </div>

              <div className="text-center">
                <Link
                  to="/ct-perfusion-quantitative-avc"
                  className="text-primary hover:underline"
                >
                  Voir perfusion CT détaillée →
                </Link>
              </div>
            </section>

            {/* HARMONISATION */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Variabilité technique et harmonisation
              </h2>

              <p>
                La variabilité HU peut dépasser la variation biologique étudiée
                si kernel, énergie et reconstruction ne sont pas harmonisés.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Kernel standard vs sharp</li>
                <li>IR faible vs élevée</li>
                <li>Énergie effective variable</li>
                <li>Implémentation constructeur</li>
              </ul>
            </section>

            {/* DONNÉES LITTÉRATURE */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Données issues de la littérature
              </h2>

              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Variabilité HU inter-scanner : ±5–10 HU selon kernel</li>
                <li>ICC densité graisse / muscle : souvent &gt; 0.85 en conditions contrôlées</li>
                <li>CT spectral : sensibilité accrue aux erreurs de calibration</li>
                <li>Perfusion CT : divergences volumétriques inter-logiciels documentées</li>
              </ul>

              <p className="text-muted-foreground">
                La robustesse dépend d’abord de la structuration méthodologique,
                non de l’algorithme seul.
              </p>
            </section>

            {/* CTA FINAL */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Le CT quantitatif exige une architecture physique explicite.
                La cohérence énergétique précède l’algorithme.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium"
              >
                Discuter d’un projet CT
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

export default CTImagerieQuantitative;