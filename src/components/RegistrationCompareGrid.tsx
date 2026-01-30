// src/components/RegistrationCompareGrid.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface ImagePair {
  reference: string;   // image de référence
  registered: string;  // image recalée
  label?: string;      // ex: "Z basal"
}

interface Props {
  title: string;
  referenceLabel: string;
  registeredLabel: string;
  pairs: ImagePair[];  // ex: 3 paires → grille 2×3
  initialOpacity?: number;
  className?: string;
}

const ROTATION_CLASS = "-rotate-90 scale-[1.42]";

export default function RegistrationCompareGrid({
  title,
  referenceLabel,
  registeredLabel,
  pairs,
  initialOpacity = 0.5,
  className,
}: Props) {
  const [opacity, setOpacity] = React.useState(initialOpacity);

  return (
    <section className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold">{title}</h3>

      {/* En-têtes de lignes */}
      <div
        className="grid gap-2 text-sm text-muted-foreground font-medium"
        style={{ gridTemplateColumns: `repeat(${pairs.length}, 1fr)` }}
      >
        <div className="col-span-full grid grid-cols-2 gap-4">
          <div className="text-center">{referenceLabel}</div>
          <div className="text-center">{registeredLabel}</div>
        </div>
      </div>

      {/* =========================
          GRILLE 2 × N
      ========================= */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${pairs.length}, 1fr)` }}
      >
        {/* ===== Ligne 1 : références ===== */}
        {pairs.map((pair, idx) => (
          <div
            key={`ref-${idx}`}
            className="aspect-square bg-black rounded overflow-hidden relative"
          >
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                ROTATION_CLASS
              )}
            >
              <img
                src={pair.reference}
                alt={`Reference ${idx + 1}`}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>

            {pair.label && (
              <div className="absolute bottom-1 right-2 text-xs text-white/70">
                {pair.label}
              </div>
            )}
          </div>
        ))}

        {/* ===== Ligne 2 : recalées (overlay) ===== */}
        {pairs.map((pair, idx) => (
          <div
            key={`reg-${idx}`}
            className="aspect-square bg-black rounded overflow-hidden relative"
          >
            {/* fond : référence */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                ROTATION_CLASS
              )}
            >
              <img
                src={pair.reference}
                alt={`Reference bg ${idx + 1}`}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>

            {/* overlay : recalée */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center pointer-events-none",
                ROTATION_CLASS
              )}
              style={{ opacity }}
            >
              <img
                src={pair.registered}
                alt={`Registered ${idx + 1}`}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>

            {pair.label && (
              <div className="absolute bottom-1 right-2 text-xs text-white/70">
                {pair.label}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* =========================
          SLIDER OPACITÉ GLOBAL
      ========================= */}
      <div className="flex items-center gap-4 pt-2">
        <span className="text-sm text-muted-foreground w-24">
          Opacité
        </span>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[Math.round(opacity * 100)]}
          onValueChange={([val]) => setOpacity(val / 100)}
          className="flex-1"
        />
        <span className="text-sm font-mono w-12 text-right">
          {Math.round(opacity * 100)}%
        </span>
      </div>
    </section>
  );
} 