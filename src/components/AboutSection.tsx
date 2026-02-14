import {
  Brain,
  Heart,
  Scan,
  Database,
  FlaskConical,
  Wrench,
  Lightbulb
} from "lucide-react";

const AboutSection = () => {
  return (
    <section className="py-20 bg-secondary/20">
      <div className="container px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* HEADER */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Une expertise structurée au service du signal
            </h2>
            <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Ingénierie quantitative en IRM et CT pour la recherche clinique,
              les essais multicentriques et la production de biomarqueurs reproductibles.
            </p>
          </div>

          {/* POSITIONNEMENT */}
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              NOXIA intervient à l’interface entre clinique, recherche et ingénierie.
              Chaque flux d’analyse est conçu comme une chaîne méthodologique explicite :
              contrôle DICOM, cohérence géométrique, segmentation, normalisation,
              quantification et traçabilité complète.
            </p>

            <p>
              L’approche est <em className="text-foreground">signal-driven</em> :
              aucune métrique n’est produite sans justification physiopathologique,
              ni validation de robustesse inter-centre.
            </p>
          </div>

          {/* DOMAINES */}
          <div className="grid md:grid-cols-2 gap-6">

            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">IRM cardiaque avancée</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                LGE, T1/T2 mapping, ECV, biomarqueurs myocardiques,
                structuration CoreLab et essais randomisés.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Neuro-imagerie AVC</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Perfusion CT, segmentation lésionnelle,
                pénombre, OEF/CMRO₂ et analyse longitudinale.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Scan className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">CT quantitatif</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Spectral, monoénergétique, décomposition matière,
                calibration phantom et harmonisation inter-constructeurs.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Multicentrique & data</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Anonymisation avancée, détection d’incohérences,
                normalisation géométrique et structuration des bases.
              </p>
            </div>

          </div>

          {/* PHILOSOPHIE */}
          <div className="p-8 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">
                Principe directeur
              </h3>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              La robustesse méthodologique précède l’automatisation.
              L’IA est évaluée, validée et intégrée dans des flux contrôlés,
              jamais utilisée comme boîte noire autonome.
            </p>

            <p className="text-sm italic text-muted-foreground">
              Chaque outil est conçu pour être interprétable,
              reproductible et statistiquement exploitable.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;