import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const SegmentationIRM = () => {
  return (
    <>
      <Helmet>
        <title>
          Segmentation IRM en recherche clinique | NOXIA
        </title>

        <meta
          name="description"
          content="Segmentation IRM cérébrale et cardiaque en recherche clinique. Approche signal-driven, validation méthodologique et extraction de biomarqueurs quantitatifs."
        />

        <link
          rel="canonical"
          href="https://noxia-imagerie.fr/segmentation-irm"
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">

          <div className="max-w-4xl mx-auto space-y-16">

            {/* ================= HEADER ================= */}
            <section className="space-y-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Segmentation IRM en recherche clinique
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Développement d’approches robustes et reproductibles
                pour la segmentation lésionnelle et tissulaire
                en imagerie par résonance magnétique.
              </p>
            </section>

            {/* ================= CONTEXTE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                La segmentation IRM constitue une étape centrale dans
                l’extraction de biomarqueurs quantitatifs exploitables
                en recherche clinique. Qu’il s’agisse de lésions
                cérébrales, d’infarctus myocardiques ou de structures
                anatomiques complexes, la rigueur méthodologique
                conditionne directement la validité des résultats.
              </p>

              <p>
                L’approche développée repose sur une compréhension fine
                du signal, des séquences (T1, T2, FLAIR, DWI, PSIR),
                des paramètres d’acquisition et des contraintes
                physiopathologiques propres à chaque indication.
              </p>
            </section>

            {/* ================= DOMAINES ================= */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Domaines d’application
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold mb-2 text-foreground">
                    Neuro-imagerie
                  </h3>
                  <p>
                    Segmentation de lésions ischémiques, tumorales
                    ou inflammatoires. Intégration DWI/ADC,
                    cartographies de perfusion et suivi longitudinal.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <h3 className="font-semibold mb-2 text-foreground">
                    IRM cardiaque
                  </h3>
                  <p>
                    Segmentation endocardique / épicardique,
                    détection d’infarctus en rehaussement tardif (LGE),
                    quantification volumique et tissulaire.
                  </p>
                </div>

              </div>
            </section>

            {/* ================= MÉTHODO ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Approche méthodologique
              </h2>

              <p>
                Les outils développés ne sont pas des boîtes noires.
                Chaque étape — pré-traitement, normalisation,
                segmentation, post-traitement morphologique —
                est explicitement définie et documentée.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Contrôle des métadonnées DICOM et géométrie</li>
                <li>Harmonisation inter-centre</li>
                <li>Validation intra et inter-observateur</li>
                <li>Export reproductible des volumes et métriques</li>
              </ul>

              <p>
                Lorsque des approches IA sont utilisées,
                elles sont encadrées par une validation
                méthodologique rigoureuse et une cohérence
                physiopathologique systématique.
              </p>
            </section>

            {/* ================= POUR QUI ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Pour quels projets ?
              </h2>

              <p>
                Interventions adaptées aux équipes hospitalières,
                aux unités INSERM, aux études multicentriques
                et aux projets industriels nécessitant
                une quantification fiable et traçable.
              </p>

              <p className="font-medium text-foreground">
                Objectif : produire des biomarqueurs interprétables,
                scientifiquement défendables et exploitables
                pour publication ou validation réglementaire.
              </p>
            </section>

          </div>

        </main>

        <Footer />
      </div>
    </>
  );
};

export default SegmentationIRM;