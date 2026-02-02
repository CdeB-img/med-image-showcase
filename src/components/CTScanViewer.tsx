// src/components/CTScanViewer.tsx

import { cn } from "@/lib/utils";
import { Heart, Database, CheckCircle, Calculator } from "lucide-react";

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

interface Props {
  className?: string;
}

const skills = [
  {
    icon: Heart,
    title: "Évaluation CT cardiovasculaire et coronarienne",
    description:
      "Analyse morphologique des structures cardiaques et coronaires, lecture experte des reconstructions CT et interprétation quantitative adaptée aux objectifs cliniques et de recherche.",
  },
  {
    icon: Database,
    title: "Préparation et harmonisation de données CT multi-organes",
    description:
      "Structuration de données hétérogènes issues de protocoles et de scanners différents, normalisation des volumes, gestion des résolutions spatiales et cohérence inter-examens.",
  },
  {
    icon: CheckCircle,
    title: "Validation et correction experte de segmentations anatomiques",
    description:
      "Relecture critique, correction manuelle ciblée et contrôle qualité de segmentations anatomiques multi-organes, avec une approche orientée précision et reproductibilité.",
  },
  {
    icon: Calculator,
    title: "Quantification volumique basée sur les métadonnées DICOM",
    description:
      "Calcul de volumes, masses et métriques dérivées en s'appuyant exclusivement sur les métadonnées DICOM (espacements, géométrie, orientation), garantissant la traçabilité et la robustesse des résultats.",
  },
];

const CTScanViewer = ({ className }: Props) => {
  return (
    <div className={cn("space-y-12", className)}>
      {/* Header */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          CT Scan — Expertise avancée en analyse et quantification
        </h1>
        <p className="text-muted-foreground max-w-4xl text-lg leading-relaxed">
          Expertise en imagerie CT couvrant l'analyse morphologique, la
          préparation de données et la quantification anatomique dans des
          contextes cliniques et de recherche, avec un focus particulier sur les
          structures thoraciques et cardiovasculaires.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 text-xs font-medium rounded-md border border-primary/50 text-primary">
            CT Scan
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-secondary text-secondary-foreground">
            Quantification
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            DICOM
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            Python
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            SimpleITK
          </span>
        </div>
      </div>

      {/* Hero Image */}
      <section className="space-y-4">
        <div className="max-w-2xl mx-auto">
          <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
            <img
              src={`${RAW_BASE}/cardio/ct-coeur.png`}
              alt="CT Cardiaque"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-3">
            Reconstruction CT cardiaque — Visualisation des structures
            cardiovasculaires
          </p>
        </div>
      </section>

      {/* Compétences clés */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-primary">Compétences clés</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border border-border bg-card/50 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <skill.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-sm leading-tight">
                  {skill.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {skill.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Positionnement */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Positionnement</h2>
        <div className="p-6 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-muted-foreground leading-relaxed">
            Approche centrée sur la fiabilité des données, l'expertise humaine
            et la quantification rigoureuse, indépendante des outils
            propriétaires et adaptée à des projets de recherche, de validation
            méthodologique ou de préparation de données pour analyses avancées.
          </p>
        </div>
      </section>
    </div>
  );
};

export default CTScanViewer;
