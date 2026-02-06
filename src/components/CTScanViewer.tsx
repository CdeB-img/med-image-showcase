// src/components/CTScanViewer.tsx

import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Heart, Database, CheckCircle, Calculator, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const RAW_BASE = "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

interface Props {
  className?: string;
}

const skills = [
  {
    icon: Heart,
    title: "Évaluation CT cardiovasculaire et coronarienne",
    description: "Analyse morphologique des structures cardiaques et coronaires, lecture experte des reconstructions CT et interprétation quantitative adaptée aux objectifs cliniques et de recherche."
  },
  {
    icon: Database,
    title: "Préparation et harmonisation de données CT multi-organes",
    description: "Structuration de données hétérogènes issues de protocoles et de scanners différents, normalisation des volumes, gestion des résolutions spatiales et cohérence inter-examens."
  },
  {
    icon: CheckCircle,
    title: "Validation et correction experte de segmentations anatomiques",
    description: "Relecture critique, correction manuelle ciblée et contrôle qualité de segmentations anatomiques multi-organes, avec une approche orientée précision et reproductibilité."
  },
  {
    icon: Calculator,
    title: "Quantification volumique basée sur les métadonnées DICOM",
    description: "Calcul de volumes, masses et métriques dérivées en s'appuyant exclusivement sur les métadonnées DICOM (espacements, géométrie, orientation), garantissant la traçabilité et la robustesse des résultats."
  }
];

const CTScanViewer = ({ className }: Props) => {
  return (
    <div className={cn("space-y-16", className)}>

      {/* ===================== HEADER ===================== */}
      <header className="space-y-6 text-center mx-auto max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold">
          CT Scan
          <span className="block text-lg md:text-xl font-normal text-muted-foreground mt-2">
            Expertise en analyse et quantification
          </span>
        </h1>

        <p className="text-muted-foreground leading-relaxed md:text-justify">
          Cette section présente une expertise en imagerie CT couvrant l’analyse
          morphologique, la préparation de données et la quantification
          anatomique, dans des contextes cliniques et de recherche. L’accent est
          mis sur les structures thoraciques et cardiovasculaires, avec une
          attention particulière portée à la traçabilité et à la robustesse des
          mesures.
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

      {/* ===================== CADRE DU VIEWER ===================== */}
      <section className="mx-auto max-w-4xl bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 text-center">
        <h2 className="text-xl font-semibold">
          Analyse et visualisation d’images CT
        </h2>

        <div className="space-y-3 text-muted-foreground leading-relaxed md:text-justify">
          <p>
            <strong>Objectif du module</strong> — Illustrer une chaîne d’analyse
            appliquée à des données CT, depuis l’image brute jusqu’à la
            visualisation de structures ou de régions segmentées.
          </p>
          <p>
            <strong>Ce que montre le viewer</strong> — Navigation interactive
            dans les coupes CT avec superposition des résultats de segmentation
            ou de traitement, permettant une inspection qualitative fine.
          </p>
          <p className="text-sm italic border-l-2 border-primary/50 pl-4 text-left md:text-justify">
            Le viewer ne vise pas l’automatisation complète, mais une analyse
            contrôlée, interprétable et méthodologiquement explicite des données.
          </p>
        </div>
      </section>

      {/* ===================== ILLUSTRATION ===================== */}
      <section className="space-y-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
            <img
              src={`${RAW_BASE}/cardio/ct-coeur.png`}
              alt="CT Cardiaque"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Reconstruction CT cardiaque — visualisation des structures
            cardiovasculaires
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

      {/* ===================== CADRE MÉTHODO ===================== */}
      <section className="mx-auto max-w-4xl p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4 text-center">
        <h3 className="text-lg font-semibold">Cadre méthodologique</h3>
        <p className="text-muted-foreground leading-relaxed md:text-justify">
          L’approche repose sur une lecture experte des données CT, une
          utilisation stricte des métadonnées DICOM pour toute quantification,
          et une séparation claire entre visualisation, segmentation et calcul
          des métriques. Elle est conçue pour des projets de recherche,
          d’évaluation méthodologique ou de préparation de données.
        </p>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 max-w-2xl mx-auto text-center">
        <h3 className="text-lg font-semibold">Discuter d’un besoin spécifique</h3>
        <p className="text-sm text-muted-foreground">
          Ces exemples illustrent des cas réels rencontrés en recherche clinique.
          Pour discuter d’un projet, d’un jeu de données ou d’une problématique
          méthodologique, vous pouvez me contacter.
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