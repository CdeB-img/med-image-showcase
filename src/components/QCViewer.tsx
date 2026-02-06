// ============================================================
// src/components/QCViewer.tsx
// Contrôle qualité – Inspection slice-par-slice
// ============================================================

import * as React from "react";
import { cn } from "@/lib/utils";
import MaskOverlay from "@/components/MaskOverlay";

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
    <div className={cn("space-y-6 max-w-5xl mx-auto", className)}>
      {/* ===================== INTRO TEXTE ===================== */}
      <section className="max-w-4xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold">
          Contrôle qualité et inspection des segmentations
        </h2>
        <p className="text-muted-foreground leading-relaxed md:text-justify">
          Ce module est dédié au contrôle qualité visuel des résultats de
          segmentation. Il permet une inspection slice par slice des images
          natives et des masques associés, afin de vérifier la cohérence
          anatomique, la localisation des régions segmentées et l’absence
          d’artefacts évidents.
        </p>
        <p className="text-sm italic text-muted-foreground border-l-2 border-primary/50 pl-4 text-left">
          L’objectif n’est pas l’automatisation, mais la validation experte des
          résultats avant toute quantification ou analyse statistique.
        </p>
      </section>

      {/* ===================== HEADER VIEWER ===================== */}
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <h3 className="text-xl font-semibold">{patientName}</h3>
        <span className="text-sm font-mono text-muted-foreground">
          Slice {sliceIndex + 1}/{maxSlices}
        </span>
      </div>

      {/* ===================== GRID ===================== */}
      <div className="grid grid-cols-4 gap-3 max-w-6xl mx-auto">
        {pairs.map((pair) => (
          <React.Fragment key={pair.label}>
            {/* Native */}
            <div className="aspect-square bg-black rounded overflow-hidden relative">
              <img
                src={pair.native[sliceIndex]}
                className={cn(
                  "absolute inset-0 w-full h-full object-contain",
                  ROTATION_CLASS
                )}
              />
              <div className="absolute bottom-0 left-0 right-0 h-[14px] md:h-[24px] bg-black/70 flex items-center px-1 md:px-2">
                <span className="text-[9px] md:text-xs font-mono text-white/90 truncate w-full">
                  {pair.label}
                </span>
              </div>
            </div>

            {/* Native + Mask */}
            <div className="aspect-square bg-black rounded overflow-hidden relative">
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

              <div className="absolute bottom-0 left-0 right-0 h-[14px] md:h-[24px] bg-black/70 flex items-center px-1 md:px-2">
                <span className="text-[9px] md:text-xs font-mono text-white/90 truncate w-full">
                  {pair.label} + mask
                </span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ===================== SLIDER ===================== */}
      <div className="max-w-4xl mx-auto">
        <input
          type="range"
          min={0}
          max={maxSlices - 1}
          value={sliceIndex}
          onChange={(e) => setSliceIndex(+e.target.value)}
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}