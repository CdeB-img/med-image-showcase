import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
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
        name: "CT",
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
            "Non. Les HU dépendent du kernel, de l’énergie effective, de la reconstruction itérative et du constructeur. Une calibration phantom et une harmonisation sont nécessaires."
        }
      },
      {
        "@type": "Question",
        name: "Le CT spectral supprime-t-il la variabilité constructeur ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. Il améliore la séparation matérielle mais introduit une dépendance au modèle de décomposition et à la calibration énergétique."
        }
      },
      {
        "@type": "Question",
        name: "Quelle est la variabilité inter-scanner des densités ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Des écarts de ±5 à ±10 HU peuvent être observés selon reconstruction et énergie. Sans harmonisation, la variabilité technique peut dépasser l’effet biologique étudié."
        }
      },
      {
        "@type": "Question",
        name: "L’intelligence artificielle suffit-elle pour stabiliser un biomarqueur CT ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. L’IA doit s’intégrer dans une architecture comprenant calibration, audit DICOM, validation physique et analyse statistique de robustesse."
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
                { label: "CT" }
              ]}
            />

            {/* HERO */}
            <ExpertiseHero
              badge="CT quantitative"
              badgeIcon={Workflow}
              title="CT quantitatif multicentrique"
              description="Calibration phantom, stabilité HU, imagerie spectrale, perfusion quantitative et harmonisation inter-constructeurs."
              chips={["HU stables", "Spectral CT", "Inter-constructeurs"]}
              actions={[
                { label: "CT quantitatif avancé", to: "/ct-quantitatif-avance-imagerie-spectrale", variant: "secondary", icon: ArrowRight },
                { label: "CT Perfusion AVC", to: "/ct-perfusion-quantitative-avc", variant: "secondary", icon: ArrowRight },
              ]}
            />

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

              <p>
                Cette structuration s’inscrit dans une logique d’
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  audit DICOM complet
                </Link>,
                préalable à toute quantification exploitable.
              </p>
            </section>
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture Core Lab CT quantitative
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit initial DICOM multicentrique (kVp, mAs, kernel, IR)</li>
                <li>Calibration phantom (eau ±3 HU tolérance cible)</li>
                <li>Stabilité énergétique inter-kVp (80–140 kVp)</li>
                <li>Validation reconstruction itérative</li>
                <li>Versioning pipeline & traçabilité complète</li>
                <li>Exports statistiques exploitables (CSV, NIfTI, logs)</li>
              </ul>

              <p>
                L’objectif n’est pas d’extraire une densité,
                mais de produire une densité opposable scientifiquement.
              </p>



              <p>
                Cette organisation est indispensable en contexte {" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  multicentrique
                </Link>
                , notamment lorsque plusieurs constructeurs sont impliqués.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Contrôle énergie effective & spectrale</li>
                <li>Calibration phantom eau / matériaux</li>
                <li>Stabilité inter-kernel</li>
                <li>Analyse de reproductibilité (CV, ICC)</li>
                <li>Versioning pipeline & traçabilité</li>
              </ul>

                <p>
                  À la différence de l’
                  <Link to="/irm-imagerie-quantitative" className="text-primary hover:underline">
                    IRM quantitative
                  </Link>,
                  {" "} la quantification CT dépend directement de l’énergie effective
                  et de la modélisation physique des interactions photon-matière.
                </p>
              
            </section>
            {/* INTÉGRITÉ DONNÉES */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Intégrité des données et conformité essais cliniques
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Traçabilité complète des paramètres de reconstruction</li>
                <li>Versioning pipeline horodaté</li>
                <li>Logs reproductibles</li>
                <li>Archivage structuré pour audit scientifique</li>
              </ul>

              <p>
                Un biomarqueur exploitable doit être défendable lors d’un audit méthodologique
                ou réglementaire.
              </p>
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
                    <p>
                    L’intégration avec des pipelines de {" "}
                    <Link to="/recalage-multimodal" className="text-primary hover:underline">
                      recalage multimodal CT–IRM
                    </Link>
                    {" "} permet d’assurer cohérence anatomique et comparabilité longitudinale.
                  </p>
            </section>
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Modélisation physique et décomposition énergétique
              </h2>

              <p>
                Les reconstructions spectrales reposent sur la séparation
                des interactions Compton et photoélectriques
                (modèle de type Alvarez-Macovski).
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Stabilité des coefficients de décomposition</li>
                <li>Sensibilité accrue sous 70 keV</li>
                <li>Propagation d’erreur vers monoénergétique</li>
                <li>Calibration multi-matériaux phantom</li>
              </ul>

              <p>
                Une validation indépendante est indispensable avant utilisation
                comme biomarqueur quantitatif.
              </p>

              <p>
                Voir{" "}
                <Link to="/ct-quantitatif-avance-imagerie-spectrale" className="text-primary hover:underline">
                  CT spectral avancé
                </Link>.
              </p>
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
                    <li>
                      Extraction volumique 3D contrôlée (voir {" "}
                      <Link to="/segmentation-irm" className="text-primary hover:underline">
                        segmentation contrôlée
                      </Link>)
                    </li>
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
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Harmonisation inter-kVp et inter-constructeurs
              </h2>

              <p>
                La densité apparente varie avec l’énergie effective.
                Un biomarqueur CT doit rester stable
                entre 80 kVp et 120/140 kVp.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Normalisation énergétique</li>
                <li>Correction densité massique</li>
                <li>Gestion reconstruction itérative constructeur</li>
                <li>Stabilité inter-plateformes GE / Siemens / Philips</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Harmonisation multicentrique
                </Link>.
              </p>
              <p>
                Les problématiques d’harmonisation sont comparables à celles décrites en {" "}
                <Link to="/irm-imagerie-quantitative" className="text-primary hover:underline">
                  IRM multicentrique
                </Link>,
                bien que la source de variabilité soit ici énergétique et non magnétique.
              </p>
            </section>
            {/* DONNÉES LITTÉRATURE */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Données issues de la littérature
              </h2>

                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Variabilité HU inter-scanner : ±5–10 HU selon kernel (ACR phantom studies)</li>
                  <li>Reconstruction itérative : impact mesurable sur densité moyenne</li>
                  <li>ICC densité musculaire &gt; 0.85 sous conditions harmonisées</li>
                  <li>Spectral CT : sensibilité accrue aux erreurs de calibration</li>
                  <li>Perfusion CT : divergences volumétriques inter-logiciels documentées</li>
                </ul>

              <p className="text-muted-foreground">
                La robustesse dépend d’abord de la structuration méthodologique,
                non de l’algorithme seul.
              </p>
            </section>
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Erreur de mesure et puissance statistique
              </h2>

              <p>
                Une variabilité technique de ±5–10 HU peut réduire significativement
                la puissance statistique d’un essai clinique.
              </p>

              <p>
                Stabiliser le biomarqueur permet souvent d’augmenter la sensibilité
                sans augmenter la taille d’échantillon.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Réduction de la variance inter-centre</li>
                <li>Amélioration du signal-to-noise biologique</li>
                <li>Optimisation du calcul de puissance</li>
              </ul>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes – CT quantitatif
              </h2>

              <div className="space-y-6">

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Les unités Hounsfield sont-elles comparables entre centres ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non. Les HU dépendent du kernel, de l’énergie effective,
                    de la reconstruction itérative et du constructeur.
                    Une calibration phantom est indispensable.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Le CT spectral est-il intrinsèquement quantitatif ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Il améliore la séparation matérielle mais nécessite
                    une validation énergétique indépendante.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    L’IA suffit-elle pour produire un biomarqueur CT publiable ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Non. Elle doit s’intégrer dans une architecture incluant
                    audit DICOM, calibration et validation statistique.
                  </p>
                </div>

              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages associées</h2>

              <div className="flex flex-wrap gap-3">
                <Link to="/analyse-dicom" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Audit DICOM
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link to="/ct-quantitatif-avance-imagerie-spectrale" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CT spectral avancé
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link to="/ct-perfusion-quantitative-avc" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Perfusion CT
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link to="/irm-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  IRM quantitative
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
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
