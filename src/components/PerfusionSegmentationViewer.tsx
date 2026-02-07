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
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QCViewer from "@/components/QCViewer";

/* ============================================================
   TYPES
============================================================ */

interface ImagePair {
  label: string;
  native: string[];
  mask: string[];
}

interface Props {
  pairs: ImagePair[];
  className?: string;
}

/* ============================================================
   STATIC CONTENT
============================================================ */

const keyFeatures = [
  {
    icon: Crosshair,
    title: "Segmentation automatique des lésions de perfusion",
    items: [
      "Pénombre, cœur ischémique, territoires à risque",
      "Approche mono- ou multi-seuil selon les paramètres étudiés"
    ]
  },
  {
    icon: SlidersHorizontal,
    title: "Paramétrabilité complète des seuils",
    items: [
      "Ajustement fin des critères de segmentation",
      "Exploration de scénarios sans recalcul du pipeline"
    ]
  },
  {
    icon: Layers,
    title: "Visualisation multi-cartes synchronisée",
    items: [
      "Lecture conjointe cartes / masques",
      "Détection immédiate d’incohérences spatiales"
    ]
  },
  {
    icon: CheckCircle,
    title: "Validation experte intégrée",
    items: [
      "Inspection slice-by-slice",
      "Contrôle physiopathologique avant quantification"
    ]
  }
];

const useCases = [
  { icon: Brain, text: "Perfusion cérébrale CT / IRM" },
  { icon: FlaskConical, text: "Comparaison de stratégies de seuillage" },
  { icon: Microscope, text: "Validation méthodologique" },
  { icon: Database, text: "Préparation de données quantitatives" }
];

const paramMaps = ["Tmax", "CBF", "OEF", "CMRO₂", "Diffusion"];

/* ============================================================
   COMPONENT
============================================================ */

export default function PerfusionSegmentationViewer({
  pairs,
  className
}: Props) {
  return (
    <div className={cn("space-y-16", className)}>

      {/* ======================================================
         HEADER
      ====================================================== */}
      <header className="max-w-5xl mx-auto text-center space-y-6 px-4">
        <Badge
          variant="outline"
          className="gap-1.5 px-3 py-1 border-cyan-500/30 bg-cyan-500/5 text-cyan-400"
        >
          <Activity className="w-3.5 h-3.5" />
          Perfusion
        </Badge>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Segmentation et analyse des lésions de perfusion CT / IRM
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Segmentation <span className="text-foreground font-medium">guidée par le signal</span>,
          basée sur des <span className="text-primary">seuils paramétrables</span> et
          validée visuellement à chaque étape.
        </p>
      </header>
      <section className="max-w-4xl mx-auto space-y-4 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold">
          Inspection visuelle des segmentations
        </h2>

        <p className="text-muted-foreground leading-relaxed">
          Module dédié à la validation visuelle des résultats de segmentation,
          permettant une inspection slice par slice des images natives et des masques
          afin d’évaluer la cohérence anatomique et la présence d’artefacts.
        </p>

        <p className="text-sm italic text-muted-foreground">
          Relecture experte préalable à toute quantification ou analyse statistique.
        </p>
      </section>
      {/* ======================================================
        VIEWER — SECTION DOMINANTE
      ====================================================== */}
      <section className="w-full py-8 md:py-12">
        <div className="w-full space-y-6 px-0 md:px-4 md:max-w-7xl md:mx-auto">

          {/* En-tête viewer */}
          <div className="text-center space-y-2">
            <Badge variant="outline" className="gap-1.5">
              <Layers className="w-3 h-3" />
              Visualisation interactive
            </Badge>

            <h2 className="text-xl font-semibold">
              Exploration synchronisée cartes / masques
            </h2>

            <p className="text-sm text-muted-foreground">
              Navigation clavier • Superposition ajustable • Lecture physiopathologique
            </p>
          </div>

          {/* Conteneur ISOLÉ du viewer */}
          <div
            className={cn(
              "relative",
              "w-full",
              "bg-card",
              "border border-border",
              "rounded-xl",
              "p-4"
            )}
          >
            <QCViewer
              pairs={pairs}
              patientName="Démonstration | Cartes de perfusion"
              className="w-full"
            />
          </div>

        </div>
      </section>

      {/* ======================================================
         INTRO MÉTHODOLOGIQUE
      ====================================================== */}
      <section className="max-w-6xl mx-auto space-y-8 px-4">

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-primary">
                Objectif
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Identifier et quantifier des régions de perfusion pathologique
              dans un cadre méthodologique contrôlé et reproductible.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-cyan-400">
                Ce que montre le viewer
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Superposition des masques de segmentation
              sur les cartes paramétriques, slice par slice.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-muted/30 border border-border rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground italic">
            Il ne s’agit pas d’une classification binaire,
            mais d’une segmentation <span className="text-foreground font-medium">
              pilotée par le signal
            </span>.
          </p>
        </div>
      </section>

      {/* ======================================================
         PRINCIPE
      ====================================================== */}
      <section className="max-w-6xl mx-auto space-y-6 px-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Principe de l’approche</h2>
        </div>

        <p className="text-muted-foreground">
          La segmentation repose sur l’analyse conjointe de plusieurs cartes fonctionnelles :
        </p>

        <div className="flex flex-wrap gap-2">
          {paramMaps.map(m => (
            <Badge key={m} variant="outline">
              {m}
            </Badge>
          ))}
        </div>
      </section>

      {/* ======================================================
         FONCTIONNALITÉS
      ====================================================== */}
      <section className="max-w-6xl mx-auto space-y-8 px-4">
        <h2 className="text-xl font-semibold text-center">
          Fonctionnalités clés
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {keyFeatures.map(f => (
            <div
              key={f.title}
              className="bg-card/50 border border-border rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <f.icon className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-sm">{f.title}</h3>
              </div>
              <ul className="pl-8 space-y-1.5 text-sm text-muted-foreground">
                {f.items.map((i, idx) => (
                  <li key={idx}>– {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
         CAS D'USAGE
      ====================================================== */}
      <section className="max-w-6xl mx-auto space-y-6 px-4">
        <h2 className="text-xl font-semibold text-center">
          Cas d’usage
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {useCases.map(u => (
            <div
              key={u.text}
              className="flex items-center gap-3 bg-muted/30 border border-border rounded-lg p-4"
            >
              <u.icon className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">{u.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
         CTA
      ====================================================== */}
      <section className="max-w-3xl mx-auto text-center space-y-4 px-4 py-10 border-t border-border">
        <h3 className="text-lg font-semibold">
          Discuter d’un besoin spécifique
        </h3>
        <p className="text-sm text-muted-foreground">
          Ces exemples illustrent des cas réels de recherche clinique.
        </p>
        <Button variant="outline" asChild>
          <Link to="/contact">
            <MessageSquare className="w-4 h-4 mr-2" />
            Initier une discussion
          </Link>
        </Button>
      </section>

    </div>
  );
}
