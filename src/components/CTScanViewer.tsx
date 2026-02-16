// src/components/CTScanViewer.tsx

import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Heart,
  Database,
  CheckCircle,
  Calculator,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const RAW_BASE = "/images";

interface Props {
  className?: string;
  hideHero?: boolean;
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
      "Relecture critique, correction manuelle ciblée et contrôle qualité de segmentations existantes, avec une approche orientée précision anatomique, cohérence inter-sujets et reproductibilité.",
  },
  {
    icon: Calculator,
    title: "Quantification volumique basée sur les métadonnées DICOM",
    description:
      "Calcul de volumes, masses et métriques dérivées en s’appuyant exclusivement sur les métadonnées DICOM (géométrie, orientation, espacements), garantissant la traçabilité et la robustesse des résultats.",
  },
];

const CTScanViewer = ({ className, hideHero = false }: Props) => {
  return (
    <div className={cn("space-y-16", className)}>
      {/* ===================== HEADER ===================== */}
      {!hideHero && (
        <header className="space-y-6 text-center mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold">
            CT Scan
            <span className="block text-lg md:text-xl font-normal text-muted-foreground mt-2">
              Expertise en analyse et quantification
            </span>
          </h1>

          <p className="text-muted-foreground leading-relaxed md:text-justify">
            Cette page présente une expertise en imagerie CT orientée analyse
            morphologique, structuration des données et quantification anatomique,
            dans des contextes cliniques et de recherche. L’approche repose sur une
            lecture rigoureuse des images et des métadonnées, avec un accent
            particulier sur les structures thoraciques et cardiovasculaires.
          </p>

          <div className="flex flex-wrap justify-center gap-2 pt-4">
            {["CT Scan", "Quantification", "DICOM", "Python", "SimpleITK"].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </header>
      )}

      {/* ===================== POSITIONNEMENT ===================== */}
      <section className="mx-auto max-w-4xl bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 text-center">
        <h2 className="text-xl font-semibold">
          Analyse et interprétation d’images CT
        </h2>

        <div className="space-y-3 text-muted-foreground leading-relaxed md:text-justify">
          <p>
            Cette expertise couvre l’ensemble de la chaîne d’analyse CT, depuis
            l’examen brut jusqu’à l’exploitation quantitative des structures
            anatomiques. Elle s’inscrit dans des projets où la fiabilité des
            mesures, la traçabilité des choix méthodologiques et la compréhension
            anatomique priment sur l’automatisation.
          </p>

          <p className="text-sm italic border-l-2 border-primary/50 pl-4 text-left md:text-justify">
            Il ne s’agit pas de proposer un outil logiciel ou une solution
            automatisée, mais une lecture experte, contrôlée et reproductible des
            données CT, adaptée aux contraintes de la recherche clinique et
            méthodologique.
          </p>
        </div>
      </section>

      {/* ===================== ILLUSTRATION ===================== */}
      <section className="space-y-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
            <img
              src={`${RAW_BASE}/cardio/ct-coeur.webp`}
              alt="CT Cardiaque"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Exemple de reconstruction CT cardiaque — illustration de structures
            cardiovasculaires à des fins méthodologiques
          </p>
        </div>
      </section>

      {/* ===================== COMPÉTENCES ===================== */}
      <section className="space-y-6 mx-auto max-w-5xl">
        <h2 className="text-xl font-semibold text-primary text-center">
          Compétences clés
        </h2>

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

      {/* ===================== CADRE MÉTHODOLOGIQUE ===================== */}
      <section className="mx-auto max-w-4xl p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4 text-center">
        <h3 className="text-lg font-semibold">Cadre méthodologique</h3>
        <p className="text-muted-foreground leading-relaxed md:text-justify">
          L’approche repose sur une expertise humaine assumée, une utilisation
          stricte des métadonnées DICOM pour toute quantification, et une
          séparation claire entre visualisation, segmentation et calcul des
          métriques. Elle est conçue pour des projets de recherche, de validation
          méthodologique ou de préparation de données, où la robustesse et la
          reproductibilité priment sur la performance automatisée.
        </p>
      </section>

      {/* ===================== CTA CONTACT ===================== */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 max-w-2xl mx-auto text-center">
        <h3 className="text-lg font-semibold">Discuter d’un besoin spécifique</h3>
        <p className="text-sm text-muted-foreground">
          Ces exemples illustrent des situations réelles rencontrées en recherche
          clinique et méthodologique. Pour discuter d’un projet, d’un jeu de
          données ou d’une problématique liée à l’imagerie CT, vous pouvez me
          contacter.
        </p>
        <Button variant="outline" asChild>
          <Link to="/contact" className="inline-flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Initier une discussion
          </Link>
        </Button>
      </section>
    </div>
  );
};

export default CTScanViewer;
