import { User, Lightbulb, Target, Stethoscope, FlaskConical, Database, Brain, Heart, Scan, Wrench } from "lucide-react";

const AboutSection = () => {
  return (
    <section className="py-20 bg-secondary/20">
      <div className="container px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">À propos</h2>
            <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
          </div>

          {/* Introduction */}
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Je suis expert indépendant en imagerie médicale, spécialisé dans le traitement, 
              l'analyse et la quantification d'images issues de données cliniques réelles, 
              principalement en IRM et en scanner (CT).
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Mon travail s'inscrit dans une approche <em className="text-foreground">signal-driven</em>, 
              rigoureuse et transparente, où chaque outil, chaque masque et chaque métrique repose 
              sur des choix explicites, traçables et interprétables, jamais sur une boîte noire.
            </p>
          </div>

          {/* Origine */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Origine de l'approche</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Mon expertise s'est construite sur plus de dix ans de pratique en recherche hospitalo-universitaire, 
              au contact direct des données cliniques hétérogènes, des contraintes méthodologiques réelles, 
              des exigences de reproductibilité et de validation scientifique.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Cet environnement a profondément structuré ma manière de travailler : concevoir des outils robustes, 
              compréhensibles et adaptés aux données, plutôt que des solutions génériques déconnectées du terrain.
            </p>
          </div>

          {/* Philosophie */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Philosophie de travail</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Je ne propose pas des logiciels figés, mais des <strong className="text-foreground">outils méthodologiques sur mesure</strong>, 
              pensés pour répondre à des problématiques précises, adaptés aux contraintes d'un projet, 
              d'une étude ou d'un jeu de données donné.
            </p>
            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-background border border-border">
                <p className="text-sm text-muted-foreground">
                  Compréhension fine du signal et des métadonnées (DICOM/NIfTI, géométrie, unités)
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background border border-border">
                <p className="text-sm text-muted-foreground">
                  Séparation claire entre visualisation, segmentation et quantification
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background border border-border">
                <p className="text-sm text-muted-foreground">
                  Attention particulière à la cohérence physiopathologique des résultats
                </p>
              </div>
            </div>
          </div>

          {/* Domaines */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Domaines d'expertise</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background border border-border">
                <Brain className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Segmentation experte de lésions</p>
                  <p className="text-xs text-muted-foreground">Neuro, Cardio</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background border border-border">
                <Heart className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">IRM cardiaque</p>
                  <p className="text-xs text-muted-foreground">Quantification fonctionnelle et tissulaire</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background border border-border">
                <Scan className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">CT thoracique et cardiovasculaire</p>
                  <p className="text-xs text-muted-foreground">Analyse morphologique et quantification</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background border border-border">
                <FlaskConical className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">CT spectral</p>
                  <p className="text-xs text-muted-foreground">Reconstruction multi-énergies, Coroscan</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background border border-border">
                <Database className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Bases de données multicentriques</p>
                  <p className="text-xs text-muted-foreground">Préparation, structuration et harmonisation</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-background border border-border">
                <Wrench className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Outils spécifiques</p>
                  <p className="text-xs text-muted-foreground">Développement pour la recherche</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pour quoi */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Pour quoi</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {["Recherche académique et clinique", "Études multicentriques et longitudinales", "Validation méthodologique et reproductibilité", "Préparation et structuration de données", "Conception d’approches algorithmiques sur mesure"].map(item => (
                <span key={item} className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary border border-primary/20">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Positionnement */}
          <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
            <h3 className="text-xl font-semibold">Cadre méthodologique</h3>
            <p className="text-muted-foreground leading-relaxed">
              Je travaille de manière indépendante, sans dépendance à des solutions propriétaires, 
              avec pour objectif de produire des résultats <strong className="text-foreground">fiables</strong>, 
              <strong className="text-foreground"> interprétables</strong> et 
              <strong className="text-foreground"> directement exploitables</strong> pour l'analyse scientifique, 
              la validation d'algorithmes ou la recherche clinique.
            </p>
            <p className="text-sm italic text-muted-foreground pt-2 border-t border-primary/20">
              Chaque outil est conçu comme un objet méthodologique explicite, au service de la compréhension des données, jamais comme une simple démonstration technologique.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;