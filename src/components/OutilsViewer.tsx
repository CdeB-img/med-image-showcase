// ============================================================
// src/components/OutilsViewer.tsx
// Custom Tools Development Module Viewer
// ============================================================

import React from "react";
import { cn } from "@/lib/utils";
import {
  Stethoscope,
  Layers,
  FileSpreadsheet,
  Microscope,
  Atom,
  Blend,
  Settings,
  Database,
  Ruler,
  Eye,
} from "lucide-react";

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

interface OutilsViewerProps {
  className?: string;
}

const OutilsViewer: React.FC<OutilsViewerProps> = ({ className }) => {
  return (
    <div className={cn("space-y-12", className)}>
      {/* Header */}
      <header className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">
          Développement d'outils sur mesure
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Analyse CT avancée, quantification robuste et prototypage méthodologique
        </p>
      </header>

      {/* Introduction */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          Ce projet regroupe le développement d'outils dédiés à l'analyse, à la quantification 
          et à l'exploration avancée des données d'imagerie médicale, avec une approche 
          résolument <em>signal-driven</em>, transparente et orientée usages réels en recherche 
          comme en clinique.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          L'objectif n'est pas de proposer un logiciel figé, mais une{" "}
          <strong>capacité de conception d'outils sur mesure</strong>, adaptés à des 
          problématiques spécifiques, à des données hétérogènes et à des contraintes 
          méthodologiques précises.
        </p>
      </section>

      {/* Module Pneumologie CT */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Stethoscope className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">
            Module Pneumologie CT — Analyse et quantification expertes
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Ce module illustre une approche structurée de l'analyse du parenchyme pulmonaire 
              en scanner thoracique. Il combine une méthodologie rigoureuse avec une interface 
              d'exploration interactive.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong>Segmentation régionale contrôlée</strong> — Logique angulaire et radiale 
                  pour une analyse spatiale fine du parenchyme
                </p>
              </div>
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong>Scores quantitatifs explicites</strong> — Fibrose, emphysème, atteintes 
                  mixtes avec production de résultats traçables (exports CSV / images)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong>Lecture experte assistée</strong> — L'algorithme structure l'information 
                  sans se substituer au raisonnement clinique
                </p>
              </div>
            </div>
          </div>

          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface">
            <img
              src={`${RAW_BASE}/outils/pneumo.png`}
              alt="Module Pneumologie CT"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Module CT Spectral */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Atom className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">
            Module CT Spectral — Exploration multi-énergie et cartographies matériaux
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface order-2 lg:order-1">
            <img
              src={`${RAW_BASE}/outils/spectral.png`}
              alt="Module CT Spectral"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-4 order-1 lg:order-2">
            <p className="text-muted-foreground leading-relaxed">
              Ce module présente un travail exploratoire autour du CT spectral et des 
              reconstructions dérivées, dans une logique de validation méthodologique et 
              de préparation de données pour des analyses avancées.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Microscope className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong>Images mono-énergie</strong> — Reconstruction à différents niveaux 
                  d'énergie pour optimiser le contraste tissulaire
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Blend className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong>Cartographies Zeff et iode</strong> — Premières briques de K-edge 
                  et de décomposition matériau
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong>Fusion multicanal</strong> — Superposition contrôlée sur l'anatomie 
                  à partir de modèles physiques explicites
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Positionnement */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold">Positionnement général</h2>

        <p className="text-muted-foreground leading-relaxed">
          Ces outils traduisent une approche fondée sur la compréhension fine du signal et des 
          métadonnées DICOM, la maîtrise de la géométrie, des unités physiques et des résolutions 
          spatiales, avec une séparation claire entre visualisation, segmentation et quantification.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
            <Settings className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Développement sur mesure</p>
              <p className="text-xs text-muted-foreground">
                Conception d'outils spécifiques adaptés à vos besoins
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
            <Database className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Audit de pipelines</p>
              <p className="text-xs text-muted-foreground">
                Adaptation ou validation de chaînes de traitement existantes
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
            <Ruler className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Préparation de données</p>
              <p className="text-xs text-muted-foreground">
                Données robustes pour études quantitatives ou développements ultérieurs
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg">
            <Eye className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Transparence méthodologique</p>
              <p className="text-xs text-muted-foreground">
                Indépendance vis-à-vis des solutions propriétaires
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-center text-sm italic text-muted-foreground">
            Chaque outil est conçu comme un objet méthodologique explicite, interprétable 
            et reproductible — jamais comme une boîte noire.
          </p>
        </div>
      </section>
    </div>
  );
};

export default OutilsViewer;
