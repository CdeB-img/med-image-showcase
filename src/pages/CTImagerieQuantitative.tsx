import React from "react";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ArrowRight,
  Scale,
  Atom,
  Activity,
  Globe2,
  BarChart3,
  ShieldCheck,
  FileText
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/ct-imagerie-quantitative";

const CTImagerieQuantitative = () => {

  /* ============================================================
     JSON-LD STRUCTURED DATA
  ============================================================ */

  const medicalWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CT quantitatif en recherche clinique",
    description:
      "Développement, validation et harmonisation multicentrique de biomarqueurs CT : stabilité HU, calibration phantom, imagerie spectrale, perfusion et robustesse inter-constructeurs.",
    url: CANONICAL,
    inLanguage: "fr-FR",
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Healthcare Professionals"
    },
    about: [
      "Quantitative CT",
      "Hounsfield Units",
      "Phantom calibration",
      "Iterative reconstruction",
      "Spectral CT",
      "Dual-energy CT",
      "CT perfusion",
      "Multicenter harmonization",
      "Imaging biomarkers"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    }
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Développement de biomarqueurs CT quantitatifs",
    serviceType: [
      "Calibration phantom CT",
      "Validation HU",
      "Imagerie spectrale quantitative",
      "CT perfusion quantitative",
      "Harmonisation multicentrique"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    areaServed: "Europe",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceLocation: {
        "@type": "Place",
        name: "Remote quantitative core-lab"
      }
    },
    url: CANONICAL,
    description:
      "Audit physique, validation méthodologique et stabilisation statistique de biomarqueurs CT en contexte monocentrique ou multicentrique."
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "CT quantitatif", item: CANONICAL }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Les unités Hounsfield sont-elles universelles ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. Les HU dépendent du kernel, de l’énergie effective, de la reconstruction itérative et de l’implémentation constructeur. Une validation phantom et une harmonisation sont nécessaires pour garantir la comparabilité."
        }
      },
      {
        "@type": "Question",
        name: "Pourquoi harmoniser un CT multicentrique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Parce que la variabilité inter-scanners peut dépasser la variation biologique étudiée. Sans harmonisation, le signal technique peut masquer l’effet clinique."
        }
      }
    ]
  };

  /* ============================================================
     UI
  ============================================================ */

  return (
    <>
      <Helmet>
        <title>CT quantitatif & biomarqueurs physiques | NOXIA</title>
        <meta
          name="description"
          content="CT quantitatif en recherche clinique : stabilité HU, calibration phantom, spectral CT, perfusion et harmonisation multicentrique."
        />
        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">{JSON.stringify(medicalWebPageJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-24">

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
                CT quantitatif en recherche clinique
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Transformer le scanner en outil décisionnel quantitatif :
                des biomarqueurs physiquement cohérents,
                multicentriques et statistiquement exploitables.
              </p>
            </section>

            {/* MANIFESTO */}
            <section className="rounded-2xl border border-border bg-card/50 p-10 space-y-6">
              <h2 className="text-2xl font-semibold flex items-center gap-3">
                <Scale className="w-6 h-6 text-primary" />
                La physique avant l’algorithme
              </h2>

              <p className="text-muted-foreground leading-relaxed">
                Une unité Hounsfield (HU) n’est pas une constante universelle.
                Elle dépend du kernel, de l’énergie effective, de la reconstruction itérative,
                et des implémentations propriétaires.
                Sans calibration ni contrôle méthodologique,
                la variabilité technique peut dépasser la variation biologique étudiée.
              </p>
            </section>

            {/* DONNÉES CHIFFRÉES */}
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold">
                Ordres de grandeur issus de la littérature
              </h2>

              <div className="grid md:grid-cols-3 gap-6 text-muted-foreground">

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <p>
                    Variabilité HU inter-scanners rapportée :
                    plusieurs unités Hounsfield selon kernel et IR.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <p>
                    Reproductibilité intra-scanner :
                    ICC généralement &gt; 0.85 en conditions contrôlées.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <Atom className="w-5 h-5 text-primary" />
                  <p>
                    Spectral CT : amélioration du contraste matériel
                    dépendante du modèle de décomposition et calibration.
                  </p>
                </div>

              </div>
            </section>

            {/* DOMAINES */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-center">
                Domaines d’intervention
              </h2>

              <div className="grid md:grid-cols-3 gap-8">

                <Link to="/ct-quantitatif-avance-imagerie-spectrale" className="group">
                  <div className="h-full rounded-2xl border border-border bg-background p-8 space-y-4 hover:border-primary/50 transition-all">
                    <Atom className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-semibold">CT Spectral</h3>
                    <p className="text-sm text-muted-foreground">
                      Monoénergétique, décomposition matérielle,
                      validation physique indépendante.
                    </p>
                  </div>
                </Link>

                <Link to="/ct-perfusion-quantitative-avc" className="group">
                  <div className="h-full rounded-2xl border border-border bg-background p-8 space-y-4 hover:border-primary/50 transition-all">
                    <Activity className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-semibold">Perfusion</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantification core/pénombre robuste et harmonisée.
                    </p>
                  </div>
                </Link>

                <Link to="/bases-multicentriques" className="group">
                  <div className="h-full rounded-2xl border border-border bg-background p-8 space-y-4 hover:border-primary/50 transition-all">
                    <Globe2 className="w-8 h-8 text-primary" />
                    <h3 className="text-xl font-semibold">Harmonisation</h3>
                    <p className="text-sm text-muted-foreground">
                      Stabilisation inter-constructeurs et validation multicentrique.
                    </p>
                  </div>
                </Link>

              </div>
            </section>

            {/* FAQ visible */}
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center">
                Questions fréquentes
              </h2>

              <div className="grid md:grid-cols-2 gap-6">

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Les HU sont-ils comparables entre centres ?
                  </h3>
                  <p className="text-muted-foreground text-sm mt-2">
                    Pas sans harmonisation. Kernel, IR et énergie effective
                    modifient la valeur absolue.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Le spectral est-il intrinsèquement quantitatif ?
                  </h3>
                  <p className="text-muted-foreground text-sm mt-2">
                    Il dépend du modèle physique et des hypothèses de décomposition.
                    Une validation indépendante reste nécessaire.
                  </p>
                </div>

              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-6 pt-8">
              <p className="text-muted-foreground">
                Développer ou auditer un biomarqueur CT multicentrique ?
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-primary-foreground font-medium hover:opacity-95 transition"
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