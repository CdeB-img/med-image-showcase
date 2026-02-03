// src/components/NeuroOncoViewer.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Brain, Target, Layers, FileSearch, Microscope, Database } from "lucide-react";

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
    <div className={cn("space-y-12", className)}>
      {/* ============================================================
          HEADER
      ============================================================ */}
      <header className="text-center space-y-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Brain className="w-4 h-4" />
          Neuro-Oncologie IRM
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">
          Segmentation experte des lésions oncologiques cérébrales
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Approche signal-driven de la segmentation automatique des lésions tumorales cérébrales,
          avec focus sur les lésions hétérogènes à cœur nécrotique et leurs régions périphériques.
        </p>
      </header>

      {/* ============================================================
          VIEWER — Native | Overlay synchronisés
      ============================================================ */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold text-center">Démonstration visuelle</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Native */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center font-medium">
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

          {/* Overlay */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center font-medium">
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

        {/* Slider */}
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
          Le défilement slice-par-slice met en évidence des lésions de tailles variées,
          des atteintes multiples et des architectures internes complexes incluant des cœurs nécrotiques.
        </p>
      </section>

      {/* ============================================================
          PRINCIPE
      ============================================================ */}
      <section className="space-y-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center">Principe de l'approche</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card/50 border border-border rounded-lg p-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">Contrastes IRM</h3>
            <p className="text-sm text-muted-foreground">
              Exploitation conjointe des séquences T1 pré et post-contraste pour une caractérisation optimale.
            </p>
          </div>

          <div className="bg-card/50 border border-border rounded-lg p-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">Logique multi-composants</h3>
            <p className="text-sm text-muted-foreground">
              Distinction fine entre cœur nécrotique, anneau tumoral actif et régions périphériques altérées.
            </p>
          </div>

          <div className="bg-card/50 border border-border rounded-lg p-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSearch className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">Critères adaptatifs</h3>
            <p className="text-sm text-muted-foreground">
              Paramètres contrôlés préservant la réalité anatomique, évitant sur-segmentation et lissage excessif.
            </p>
          </div>
        </div>

        <div className="bg-muted/30 border border-border rounded-lg p-6 text-center">
          <p className="text-muted-foreground italic">
            Chaque masque produit est le résultat de choix explicites, traçables et interprétables —
            et non d'une optimisation opaque.
          </p>
        </div>
      </section>

      {/* ============================================================
          POSITIONNEMENT
      ============================================================ */}
      <section className="space-y-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center">Positionnement</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card/50 border border-border rounded-lg p-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Microscope className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">Compréhension du signal</h3>
            <p className="text-sm text-muted-foreground">
              Expertise orientée physiopathologie et robustesse méthodologique, y compris sur des cas complexes.
            </p>
          </div>

          <div className="bg-card/50 border border-border rounded-lg p-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">Données exploitables</h3>
            <p className="text-sm text-muted-foreground">
              Préparation de données fiables pour analyses quantitatives, études longitudinales ou apprentissage.
            </p>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center space-y-2">
          <p className="font-medium text-primary">
            La segmentation n'est pas une boîte noire.
          </p>
          <p className="text-sm text-muted-foreground">
            Chaque région identifiée correspond à une hypothèse physiopathologique contrôlée,
            indépendante des solutions propriétaires.
          </p>
        </div>
      </section>
    </div>
  );
}
