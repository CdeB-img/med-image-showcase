import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/ct-perfusion-quantitative-avc";

const CTPerfusionQuantitative = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "CT Perfusion quantitative en phase aiguë",
    description:
      "Structuration, validation et harmonisation multicentrique de biomarqueurs CT perfusion (Tmax, CBF, CBV, mismatch) en AVC ischémique.",
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

  return (
    <>
      <Helmet>
        <title>CT Perfusion quantitative & AVC aigu | NOXIA</title>

        <meta
          name="description"
          content="Quantification robuste Tmax, CBF, CBV et mismatch en CT perfusion. Validation méthodologique, stabilité volumique et harmonisation multicentrique."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-28">

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                CT Perfusion quantitative en phase aiguë
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Transformation des cartographies colorimétriques en biomarqueurs
                volumétriques reproductibles pour l’AVC ischémique
                et les essais thérapeutiques multicentriques.
              </p>
            </section>

            {/* PROBLÈME STRUCTUREL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Le seuil Tmax ≥ 6s n’est pas une constante physique
              </h2>

              <p>
                Les cartes de perfusion CT dépendent :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Du modèle de déconvolution (SVD, block-circulant, etc.)</li>
                <li>Du choix et du positionnement de l’AIF</li>
                <li>Du filtrage temporel et spatial</li>
                <li>Du lissage automatique implémenté par la plateforme</li>
                <li>De la résolution temporelle réelle de l’acquisition</li>
              </ul>

              <p>
                Deux logiciels différents peuvent produire des volumes de mismatch
                divergents pour un même patient.  
                Sans cadre méthodologique explicite, le biomarqueur devient dépendant
                de l’outil et non de la physiopathologie.
              </p>
            </section>

            {/* ARCHITECTURE PIPELINE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture d’un pipeline quantitatif robuste
              </h2>

              <p>
                La robustesse volumique repose sur une chaîne documentée :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit exhaustif des séries dynamiques DICOM</li>
                <li>Contrôle cohérence temporelle du bolus</li>
                <li>Vérification de la stabilité AIF</li>
                <li>Masque cérébral automatisé contrôlé</li>
                <li>Resampling géométrique documenté</li>
                <li>Seuils explicitement définis et versionnés</li>
                <li>Nettoyage morphologique 2D puis filtrage 3D</li>
                <li>Extraction volumique traçable</li>
              </ul>

              <p>
                L’objectif n’est pas de produire une image,
                mais un volume exploitable statistiquement et reproductible inter-centre.
              </p>
            </section>

            {/* ANALYSE MULTI-SEUIL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Stabilité volumique & analyse multi-seuil
              </h2>

              <p>
                Les seuils classiques (Tmax ≥ 6s, CBF &lt; 30%)
                sont historiquement établis mais sensibles
                aux implémentations.
              </p>

              <p>
                Une approche plus robuste consiste à analyser :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>La stabilité volumique entre seuils 4–8s</li>
                <li>L’évolution volumique CBF 20–40%</li>
                <li>La cohérence morphologique du mismatch</li>
                <li>La sensibilité du volume aux choix méthodologiques</li>
              </ul>

              <p>
                Cette logique relève d’une{" "}
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie quantitative explicite
                </Link>.
              </p>
            </section>

            {/* MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Harmonisation multicentrique
              </h2>

              <p>
                En études multicentriques AVC, la variabilité technique
                peut dépasser l’effet thérapeutique étudié.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Comparaison inter-logiciels</li>
                <li>Stratification centre-dépendante si nécessaire</li>
                <li>Détection automatique des anomalies d’acquisition</li>
                <li>Stabilisation statistique des distributions volumétriques</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Harmonisation multicentrique
                </Link>.
              </p>
            </section>

            {/* LIEN NEURO IRM */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Comparaison CT perfusion vs IRM métabolique
              </h2>

              <p>
                Les volumes Tmax et CBF peuvent être confrontés
                aux cartographies OEF, CMRO2 et diffusion IRM
                afin d’analyser la cohérence physiopathologique
                du mismatch.
              </p>

              <p>
                Voir{" "}
                <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">
                  Perfusion & Métabolisme cérébral IRM
                </Link>.
              </p>
            </section>

            {/* POSITIONNEMENT FINAL */}
            <section className="text-center space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                De la carte colorée à l’endpoint défendable
              </h2>

              <p>
                La perfusion CT ne doit pas rester un outil visuel.
                Elle devient un biomarqueur décisionnel lorsque
                la chaîne méthodologique est explicitement définie,
                auditée et harmonisée.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer ou auditer un pipeline CT perfusion multicentrique ?
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un projet AVC
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

export default CTPerfusionQuantitative;