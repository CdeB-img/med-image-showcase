// ============================================================
// src/components/NeuroOncoViewer.tsx
// Neuro-oncologie IRM – Segmentation guidée par le signal
// ============================================================

import * as React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Target,
  Layers,
  FileSearch,
  Microscope,
  Database,
  MessageSquare,
} from "lucide-react";

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

const SLICE_COUNT = 5;

const nativeSlices = Array.from({ length: SLICE_COUNT }, (_, i) =>
  `${RAW_BASE}/neuro-onco/natives/slice_${String(i).padStart(3, "0")}.png`
);

const overlaySlices = Array.from({ length: SLICE_COUNT }, (_, i) =>
  `${RAW_BASE}/neuro-onco/overlays/slice_${String(i).padStart(3, "0")}.png`
);

interface Props {
  className?: string;
}

export default function NeuroOncoViewer({ className }: Props) {
  const [sliceIndex, setSliceIndex] = React.useState(0);

  return (
    <div className={cn("space-y-16", className)}>
      {/* ===================== HEADER ===================== */}
      <header className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mx-auto">
          <Brain className="w-4 h-4" />
          Neuro-oncologie IRM
        </div>

        <h1 className="text-3xl md:text-4xl font-bold">
          Segmentation des lésions oncologiques cérébrales
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Approche de segmentation guidée par le signal appliquée aux lésions
          tumorales cérébrales en IRM, avec  focus  sur les lésions
          hétérogènes à cœur nécrotique et leurs anneaux.
        </p>
      </header>

      {/* ===================== INTRO ===================== */}
      <section className="max-w-4xl mx-auto bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 text-center">
        <h2 className="text-xl font-semibold">
          Analyse et structuration des lésions en neuro-oncologie
        </h2>

        <div className="space-y-3 text-muted-foreground leading-relaxed md:text-justify">
          <p>
            <strong>Objectif du module</strong> : Illustrer une approche de
            segmentation appliquée à des images IRM cérébrales en contexte
            neuro-oncologique, avec un contrôle explicite des régions d’intérêt.
          </p>

          <p>
            <strong>Ce que montre l’exemple</strong> : Comparaison entre l’image
            native et des masques de segmentation permettant d’évaluer la
            cohérence spatiale, l’architecture des lésions et leur
            interprétation physiopathologique.
          </p>

          <p className="text-sm italic border-l-2 border-primary/50 pl-4 text-left">
            Ce module ne repose pas sur une segmentation générique
            automatisée, mais sur des choix méthodologiques adaptés aux
            contraintes réelles des données.
          </p>
        </div>
      </section>

      {/* ===================== VISUALISATION ===================== */}
      <section className="max-w-5xl mx-auto bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-8">
        <h2 className="text-xl font-semibold text-center">
          Illustration visuelle
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              IRM native (T1)
            </p>
            <div className="aspect-square bg-black rounded-lg overflow-hidden">
              <img
                src={nativeSlices[sliceIndex]}
                alt={`Native slice ${sliceIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Segmentation superposée
            </p>
            <div className="aspect-square bg-black rounded-lg overflow-hidden">
              <img
                src={overlaySlices[sliceIndex]}
                alt={`Overlay slice ${sliceIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 max-w-xl mx-auto">
          <span className="text-sm text-muted-foreground w-12">Slice</span>
          <Slider
            value={[sliceIndex]}
            onValueChange={([v]) => setSliceIndex(v)}
            min={0}
            max={SLICE_COUNT - 1}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-mono w-12 text-right">
            {sliceIndex + 1}/{SLICE_COUNT}
          </span>
        </div>

        <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto">
          Le défilement slice-par-slice met en évidence des lésions de tailles variées, des atteintes multiples et des architectures internes complexes incluant des cœurs nécrotiques.
        </p>
      </section>

      {/* ===================== PRINCIPE ===================== */}
      <section className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-center">
          Principe méthodologique
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <Principle
            icon={<Layers />}
            title="Exploitation des contrastes IRM"
            text="Analyse conjointe des séquences T1 pré et post-contraste pour une caractérisation optimale."
          />
          <Principle
            icon={<Target />}
            title="Logique multi-composants"
            text="Distinction entre cœur nécrotique, anneau tumoral actif."
          />
          <Principle
            icon={<FileSearch />}
            title="Critères contrôlés"
            text="Paramètres explicites limitant la sur-segmentation et préservant la réalité anatomique."
          />
        </div>

        <div className="bg-muted/30 border border-border rounded-xl p-6 text-center">
          <p className="italic text-muted-foreground">
            Chaque masque est le résultat de choix explicites, traçables et
            interprétables, jamais d’une optimisation opaque.
          </p>
        </div>
      </section>

      {/* ===================== CADRE ===================== */}
      <section className="max-w-5xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-center">
          Cadre méthodologique
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <Principle
            icon={<Microscope />}
            title="Compréhension du signal"
            text="Approche orientée physiopathologie et cohérence clinique, y compris sur des cas complexes."
          />
          <Principle
            icon={<Database />}
            title="Données exploitables"
            text="Préparation de données fiables pour analyses quantitatives, études longitudinales ou validation méthodologique."
          />
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-2">
          <p className="font-medium text-primary">
            La segmentation n’est pas une boîte noire.
          </p>
          <p className="text-sm text-muted-foreground">
            Chaque région identifiée correspond à une hypothèse
            physiopathologique contrôlée, indépendante des solutions
            propriétaires.
          </p>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="max-w-2xl mx-auto bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 text-center">
        <h3 className="text-lg font-semibold">
          Discuter d’un besoin spécifique
        </h3>
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
}

/* ===================== SUB COMPONENT ===================== */

function Principle({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-card/50 border border-border rounded-xl p-6 space-y-3 text-center">
      <div className="w-10 h-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}