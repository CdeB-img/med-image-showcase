// ============================================================
// src/components/QCViewer.tsx
// Contrôle qualité – Inspection slice-par-slice
// ============================================================

import * as React from "react";
import { cn } from "@/lib/utils";
import MaskOverlay from "@/components/MaskOverlay";
import { Brain } from "lucide-react";

interface ImagePair {
  label: string;
  native: string[];
  mask: string[];
}

interface Props {
  pairs: ImagePair[];
  patientName?: string;
  className?: string;
}

const ROTATION_CLASS = "-rotate-90 scale-[1.42]";

export default function QCViewer({
  pairs,
  patientName = "Patient",
  className,
}: Props) {
  const maxSlices = pairs?.[0]?.native?.length ?? 0;

  const [sliceIndex, setSliceIndex] = React.useState(
    maxSlices > 0 ? Math.floor(maxSlices / 2) : 0
  );

  React.useEffect(() => {
    setSliceIndex((prev) =>
      maxSlices > 0 ? Math.min(maxSlices - 1, Math.max(0, prev)) : 0
    );
  }, [maxSlices]);

  React.useEffect(() => {
    if (maxSlices <= 0) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") setSliceIndex((s) => Math.min(maxSlices - 1, s + 1));
      if (e.key === "ArrowDown") setSliceIndex((s) => Math.max(0, s - 1));
      if (e.key === "PageUp") setSliceIndex((s) => Math.min(maxSlices - 1, s + 5));
      if (e.key === "PageDown") setSliceIndex((s) => Math.max(0, s - 5));
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maxSlices]);

  if (maxSlices === 0) {
    return (
      <div className="text-destructive text-center py-8">
        Aucune image disponible
      </div>
    );
  }

  return (
    <div className={cn("space-y-16", className)}>

      {/* ===================== HEADER ===================== */}
      <header className="mx-auto max-w-4xl bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-sm mx-auto">
          <Brain className="w-4 h-4" />
          Contrôle qualité
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold">
          Inspection visuelle des segmentations
        </h1>

        <p className="text-muted-foreground leading-relaxed md:text-justify">
          Ce module est dédié à la validation visuelle des résultats de
          segmentation. Il permet une inspection slice par slice des images
          natives et des masques associés afin d’évaluer la cohérence
          anatomique, la localisation des régions segmentées et la présence
          d’artefacts évidents.
        </p>

        <p className="text-sm italic text-muted-foreground border-l-2 border-border pl-4 text-left md:text-justify">
          L’objectif n’est pas l’automatisation, mais une relecture experte
          préalable à toute quantification ou analyse statistique.
        </p>
      </header>

      {/* ===================== VIEWER ===================== */}
      <section className="mx-auto max-w-6xl bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6">

        {/* Viewer header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{patientName}</h3>
          <span className="text-sm font-mono text-muted-foreground">
            Slice {sliceIndex + 1}/{maxSlices}
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-3">
          {pairs.map((pair) => (
            <React.Fragment key={pair.label}>
              {/* Native */}
              <div className="aspect-square bg-black rounded-lg overflow-hidden relative border border-border">
                <img
                  src={pair.native[sliceIndex]}
                  className={cn(
                    "absolute inset-0 w-full h-full object-contain",
                    ROTATION_CLASS
                  )}
                />
                <div className="absolute bottom-0 left-0 right-0 h-[20px] bg-black/70 flex items-center px-2">
                  <span className="text-[10px] font-mono text-white/80 truncate w-full">
                    {pair.label}
                  </span>
                </div>
              </div>

              {/* Native + Mask */}
              <div className="aspect-square bg-black rounded-lg overflow-hidden relative border border-border">
                <img
                  src={pair.native[sliceIndex]}
                  className={cn(
                    "absolute inset-0 w-full h-full object-contain",
                    ROTATION_CLASS
                  )}
                />
                <div
                  className={cn(
                    "absolute inset-0 pointer-events-none",
                    ROTATION_CLASS
                  )}
                >
                  <MaskOverlay
                    src={pair.mask[sliceIndex]}
                    opacity={0.4}
                    className="w-full h-full"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[20px] bg-black/70 flex items-center px-2">
                  <span className="text-[10px] font-mono text-white/80 truncate w-full">
                    {pair.label} + mask
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Slider */}
        <div className="pt-2">
          <input
            type="range"
            min={0}
            max={maxSlices - 1}
            value={sliceIndex}
            onChange={(e) => setSliceIndex(+e.target.value)}
            className="w-full accent-muted-foreground"
          />
        </div>
      </section>
    </div>
  );
}