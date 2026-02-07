// src/components/PerfusionSegmentationViewer.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Crosshair,
  SlidersHorizontal,
  Layers,
  CheckCircle,
  Brain,
  FlaskConical,
  Database,
  Microscope,
  MessageSquare,
  Target,
  Eye,
  AlertTriangle,
  Zap,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QCViewer from "@/components/QCViewer";

interface ImagePair {
  label: string;
  native: string[];
  mask: string[];
}

interface Props {
  pairs: ImagePair[];
  className?: string;
}

const keyFeatures = [
  {
    icon: Crosshair,
    title: "Segmentation automatique des lésions de perfusion",
    items: [
      "Pénombre, cœur ischémique, territoires à risque",
      "Approche mono- ou multi-seuil selon les paramètres étudiés",
    ],
  },
  {
    icon: SlidersHorizontal,
    title: "Paramétrabilité complète des seuils",
    items: [
      "Ajustement fin des critères de segmentation",
      "Exploration de plusieurs scénarios sans recalcul lourd du pipeline",
    ],
  },
  {
    icon: Layers,
    title: "Visualisation multi-cartes synchronisée",
    items: [
      "Lecture conjointe des cartes de perfusion et des masques générés",
      "Détection immédiate des incohérences spatiales ou physiologiques",
    ],
  },
  {
    icon: CheckCircle,
    title: "Validation experte intégrée",
    items: [
      "Inspection slice-by-slice",
      "Vérification de la cohérence anatomique et fonctionnelle avant quantification",
    ],
  },
];

const useCases = [
  { icon: Brain, text: "Études de perfusion cérébrale (CT ou IRM)" },
  { icon: FlaskConical, text: "Comparaison de stratégies de seuillage" },
  { icon: Microscope, text: "Validation de méthodologies de segmentation" },
  { icon: Database, text: "Préparation de données pour analyses quantitatives ou modèles d'apprentissage" },
];

const paramMaps = [
  { label: "Tmax", color: "bg-primary/20 text-primary border-primary/30" },
  { label: "CBF", color: "bg-primary/15 text-primary/80 border-primary/25" },
  { label: "OEF", color: "bg-primary/15 text-primary/80 border-primary/25" },
  { label: "CMRO₂", color: "bg-primary/15 text-primary/80 border-primary/25" },
  { label: "Diffusion", color: "bg-primary/10 text-primary/70 border-primary/20" },
];

export default function PerfusionSegmentationViewer({ pairs, className }: Props) {
  return (
    <div className={cn("space-y-12", className)}>

      {/* HEADER */}
      <header className="space-y-6 text-center max-w-4xl mx-auto">
        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-sm border-primary/30 bg-primary/5 text-primary">
          <Activity className="w-3.5 h-3.5" />
          Perfusion
        </Badge>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Segmentation et analyse des lésions de perfusion CT/IRM
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Approche experte de la <span className="text-foreground font-medium">segmentation automatique</span> des lésions de perfusion cérébrale
          en imagerie CT et IRM, basée sur des <span className="text-primary">seuils paramétrables</span> et une validation physiopathologique rigoureuse.
        </p>
      </header>

      {/* INTRO */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-primary">Objectif</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed pl-10">
              Identifier et quantifier des régions de <span className="text-foreground font-medium">perfusion pathologique</span>.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-primary">Ce que montre le viewer</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed pl-10">
              Segmentation des régions de perfusion et superposition sur les cartes paramétriques.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-muted/30 border border-border rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground italic">
            Segmentation guidée par le signal et la compréhension physiopathologique.
          </p>
        </div>
      </section>

      {/* CARTES */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold">Principe de l'approche</h2>

        <div className="flex flex-wrap gap-2">
          {paramMaps.map((map) => (
            <Badge key={map.label} variant="outline" className={map.color}>
              {map.label}
            </Badge>
          ))}
        </div>
      </section>

      {/* VIEWER */}
      <QCViewer
        pairs={pairs}
        patientName="Démonstration | Cartes de perfusion"
        className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
      />

      {/* POSITIONNEMENT */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Cadre méthodologique</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            "Indépendante des solutions propriétaires",
            "Orientée compréhension physiopathologique",
            "Résultats traçables et reproductibles",
          ].map((txt) => (
            <div key={txt} className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">{txt}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card/50 border border-border rounded-xl p-6 max-w-2xl mx-auto text-center space-y-4">
        <h3 className="text-lg font-semibold">Discuter d'un besoin spécifique</h3>
        <Button variant="outline" asChild>
          <Link to="/contact" className="inline-flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Initier une discussion
          </Link>
        </Button>
      </section>
    </div>
  );
}