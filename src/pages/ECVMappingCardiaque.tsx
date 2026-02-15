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
      "Validation histologique, harmonisation multicentrique et quantification rigoureuse des biomarqueurs ECV, T1 natif et T2 mapping en IRM cardiaque.",
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
          content="ECV, T1 natif et T2 mapping en IRM cardiaque : validation histologique, contrôle de l’hématocrite, harmonisation multicentrique et robustesse statistique."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-20">

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                ECV & Mapping T1/T2 en IRM cardiaque
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Biomarqueurs tissulaires avancés pour l’évaluation
                de la fibrose diffuse, de l’inflammation et de l’œdème myocardique,
                avec validation translationnelle et harmonisation multicentrique.
              </p>
            </section>

            {/* ENJEU FONDAMENTAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Des biomarqueurs puissants, mais extrêmement sensibles
              </h2>

              <p>
                L’Extracellular Volume (ECV), le T1 natif et le T2 mapping
                sont devenus des piliers de l’IRM cardiaque moderne.
                Ils permettent une quantification non invasive
                de la fibrose interstitielle diffuse, de l’inflammation
                et de l’œdème myocardique actif.
              </p>

              <p>
                Cependant, leur valeur dépend entièrement
                de la rigueur méthodologique.
                Ces paramètres sont sensibles :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Aux paramètres d’acquisition et aux implémentations constructeur</li>
                <li>Au champ magnétique (1.5T vs 3T)</li>
                <li>Au timing post-contraste</li>
                <li>À la précision de l’hématocrite</li>
                <li>À la méthode de segmentation myocardique</li>
              </ul>

              <p>
                Sans contrôle structuré, la variabilité technique
                peut dépasser la variation physiopathologique recherchée.
              </p>
            </section>

            {/* ECV VALIDATION */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                ECV : validation histologique et contrôle des biais
              </h2>

              <p>
                Dans des protocoles hypertrophiques intégrant biopsies septales,
                la validation de l’ECV a été conduite dans un cadre strictement contrôlé.
                L’objectif était de garantir une corrélation quantitative fiable
                entre IRM et fibrose histologique réelle.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Prélèvement sanguin immédiatement avant injection</li>
                <li>Mesure précise de l’hématocrite (centrifugation sur site)</li>
                <li>Contrôle des biais liés à la décantation en décubitus</li>
                <li>Prise en compte de l’état d’hydratation</li>
                <li>Sectorisation myocardique standardisée (modèle AHA)</li>
                <li>Corrélation quantitative IRM ↔ histologie</li>
              </ul>

              <p>
                L’erreur la plus fréquente dans la littérature
                provient d’un hématocrite approximatif,
                introduisant une dérive systématique de l’ECV.
                Ce biais peut modifier artificiellement
                l’interprétation de la fibrose diffuse.
              </p>
            </section>

            {/* T1 T2 DISTINCTION */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Distinction physiopathologique entre T1 et T2
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>T1 natif</strong> : expansion interstitielle,
                  inflammation diffuse, fibrose
                </li>
                <li>
                  <strong>T2 mapping</strong> : œdème actif,
                  activité inflammatoire aiguë
                </li>
              </ul>

              <p>
                Leur signification biologique est différente.
                Leur évolution temporelle après un IDM ou une myocardite
                n’est pas superposable.
              </p>

              <p>
                Une confusion méthodologique entre ces marqueurs
                conduit à des conclusions physiopathologiques erronées,
                particulièrement dans les essais thérapeutiques.
              </p>
            </section>

            {/* VARIABILITÉ MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Variabilité inter-constructeurs et inter-centres
              </h2>

              <p>
                En contexte multicentrique, les variations suivantes doivent être maîtrisées :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Implémentations MOLLI / ShMOLLI différentes</li>
                <li>Décalages systématiques 1.5T vs 3T</li>
                <li>Versions logicielles constructeur</li>
                <li>Différences de reconstruction</li>
                <li>Stratégies de segmentation myocardique</li>
              </ul>

              <p>
                Cette étape relève directement de la{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  structuration multicentrique
                </Link>{" "}
                et s’intègre dans une approche globale de{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  méthodologie quantitative
                </Link>.
              </p>
            </section>

            {/* INTÉGRATION CORELAB */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Intégration en Core Lab et essais thérapeutiques
              </h2>

              <p>
                Lorsqu’un biomarqueur T1/T2/ECV devient endpoint
                d’un essai randomisé, la robustesse méthodologique
                conditionne directement la puissance statistique.
              </p>

              <p>
                Cette structuration s’inscrit dans une activité de{" "}
                <Link to="/corelab-essais-cliniques" className="text-primary hover:underline">
                  Core Lab IRM multicentrique
                </Link>{" "}
                et participe à la définition de{" "}
                <Link to="/biomarqueurs-irm-cardiaque-essais-cliniques" className="text-primary hover:underline">
                  biomarqueurs utilisés comme endpoints cliniques
                </Link>.
              </p>

              <p>
                La reproductibilité prime sur la sophistication algorithmique.
                La traçabilité prime sur la simplification.
              </p>
            </section>

            {/* LIENS TRANSVERSAUX */}
            <section className="space-y-6 text-center">
              <h2 className="text-xl font-semibold">
                Approches complémentaires
              </h2>

              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/segmentation-irm"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Segmentation IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/analyse-dicom"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Analyse DICOM
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/bases-multicentriques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Harmonisation multicentrique
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin d’une validation rigoureuse ECV / T1 / T2
                dans un cadre multicentrique ou translationnel ?
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
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