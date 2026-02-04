// src/components/RegistrationViewer.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
interface RegistrationPair {
  reference: string;
  registered: string;
  label: string;
}
interface Props {
  multimodalPairs: RegistrationPair[];
  monomodalPairs: RegistrationPair[];
  initialOpacity?: number;
  className?: string;
}
const ROTATION_CLASS = "-rotate-90 scale-[1.42]";
export default function RegistrationViewer({
  multimodalPairs,
  monomodalPairs,
  initialOpacity = 0.5,
  className
}: Props) {
  const [opacity, setOpacity] = React.useState(initialOpacity);
  return <div className={cn("space-y-12", className)}>
      {/* Header */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Recalage multimodal CT / IRM
        </h1>
        <p className="text-muted-foreground max-w-4xl leading-relaxed">
          Ce module illustre une approche rigoureuse du recalage multimodal entre images CT et IRM, 
          conçue pour permettre une évaluation qualitative et méthodologique directe de l'alignement 
          spatial entre différentes modalités et séquences.
        </p>
        <p className="text-muted-foreground max-w-4xl leading-relaxed">
          L'objectif n'est pas de produire une transformation opaque, mais de rendre lisible, 
          contrôlable et vérifiable la qualité du recalage, au plus près du signal et de l'anatomie.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 text-xs font-medium rounded-md border border-primary/50 text-primary">
            CT / IRM
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-secondary text-secondary-foreground">
            Recalage
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            ANTsPy
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            SimpleITK
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            NiBabel
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            Python
          </span>
        </div>
      </div>

      {/* Principe de visualisation */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">
          Principe de visualisation
        </h2>
        <p className="text-sm text-muted-foreground max-w-3xl">
          L'interface repose sur une comparaison interactive coupe par coupe. Les images CT et IRM 
          (ou IRM-IRM) sont affichées sur des coupes homologues. Le curseur permet de faire varier 
          dynamiquement la contribution relative de chaque modalité.
        </p>
        <p className="text-sm text-muted-foreground max-w-3xl">Cette transition continue met en évidence les concordances et les écarts spatiaux, sans artifice visuel. Elle permet d'apprécier la cohérence des structures corticales et sous-corticales, l'alignement des ventricules, sillons et contours anatomiques, ainsi que les éventuelles distorsions résiduelles.</p>
      </section>

      {/* Grid: 3 multimodal + 3 monomodal = 6 images in 2 rows of 3 */}
      <div className="space-y-4">
        {/* Row labels */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center text-sm font-medium text-muted-foreground col-span-3">Multimodal  CT / IRM</div>
        </div>

        {/* Multimodal row */}
        <div className="grid grid-cols-3 gap-3">
          {multimodalPairs.map((pair, idx) => <div key={`multi-${idx}`} className="aspect-square bg-black rounded-lg overflow-hidden relative border border-border/50">
              {/* Background: Reference */}
              <div className={cn("absolute inset-0 flex items-center justify-center", ROTATION_CLASS)}>
                <img src={pair.reference} alt={`Reference ${idx + 1}`} className="w-full h-full object-contain" crossOrigin="anonymous" />
              </div>

              {/* Overlay: Registered with opacity */}
              <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none", ROTATION_CLASS)} style={{
            opacity
          }}>
                <img src={pair.registered} alt={`Registered ${idx + 1}`} className="w-full h-full object-contain mix-blend-screen" crossOrigin="anonymous" />
              </div>

              {/* Label */}
              <div className="absolute bottom-1 left-1 right-1 text-center">
                <span className="text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
                  {pair.label}
                </span>
              </div>
            </div>)}
        </div>

        {/* Monomodal label */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center text-sm font-medium text-muted-foreground col-span-3">
            Monomodal IRM (Diffusion → Flair)
          </div>
        </div>

        {/* Monomodal row */}
        <div className="grid grid-cols-3 gap-3">
          {monomodalPairs.map((pair, idx) => <div key={`mono-${idx}`} className="aspect-square bg-black rounded-lg overflow-hidden relative border border-border/50">
              {/* Background: Reference */}
              <div className={cn("absolute inset-0 flex items-center justify-center", ROTATION_CLASS)}>
                <img src={pair.reference} alt={`Reference ${idx + 1}`} className="w-full h-full object-contain" crossOrigin="anonymous" />
              </div>

              {/* Overlay: Registered with opacity */}
              <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none", ROTATION_CLASS)} style={{
            opacity
          }}>
                <img src={pair.registered} alt={`Registered ${idx + 1}`} className="w-full h-full object-contain mix-blend-screen" crossOrigin="anonymous" />
              </div>

              {/* Label */}
              <div className="absolute bottom-1 left-1 right-1 text-center">
                <span className="text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
                  {pair.label}
                </span>
              </div>
            </div>)}
        </div>
      </div>

      {/* Single opacity slider */}
      <div className="flex items-center gap-4 pt-4 border-t border-border/50">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Superposition
        </span>
        <Slider min={0} max={100} step={1} value={[Math.round(opacity * 100)]} onValueChange={([val]) => setOpacity(val / 100)} className="flex-1" />
        <span className="text-sm font-mono w-12 text-right text-muted-foreground">
          {Math.round(opacity * 100)}%
        </span>
      </div>

      {/* Cas d'usage */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Cas d'usage</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <p className="text-sm text-muted-foreground">
              Validation méthodologique de chaînes de recalage
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <p className="text-sm text-muted-foreground">
              Évaluation comparative de stratégies d'alignement
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <p className="text-sm text-muted-foreground">
              Préparation de données pour analyses multimodales
            </p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <p className="text-sm text-muted-foreground">
              Revue experte avant quantification clinique
            </p>
          </div>
        </div>
      </section>

      {/* Positionnement */}
      <section className="p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
        <h3 className="text-lg font-semibold">Cadre méthodologique</h3>
        <p className="text-muted-foreground leading-relaxed">
          Cette approche privilégie une lecture experte directe, sans sur-interprétation algorithmique, 
          une séparation claire entre alignement géométrique et analyse du signal, et une indépendance 
          vis-à-vis des solutions propriétaires.
        </p>
        <p className="text-sm italic text-muted-foreground pt-4 border-t border-primary/20">
          Le recalage n'est pas une étape intermédiaire invisible. C'est un objet d'analyse à part 
          entière, qui conditionne la validité de toute analyse multimodale ultérieure.
        </p>
      </section>
    </div>;
}