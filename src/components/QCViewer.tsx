// ============================================================
// src/components/QCViewer.tsx
// Contrôle qualité – Inspection slice-par-slice
// 4 colonnes fixes, sans scroll horizontal
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
      <div className="text-destructive text-center py-6">
        Aucune image disponible
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-2", className)}>

      {/* ===== Header ultra-compact ===== */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-muted-foreground truncate">
          {patientName}
        </span>
        <span className="text-[11px] font-mono text-muted-foreground">
          {sliceIndex + 1}/{maxSlices}
        </span>
      </div>

      {/* ===== Grille 4 colonnes fixes ===== */}
      <div className="grid grid-cols-4 gap-[2px]">
        {pairs.map((pair) => (
          <React.Fragment key={pair.label}>
            <ImageCell
              src={pair.native[sliceIndex]}
              label={pair.label}
            />
            <ImageCell
              src={pair.native[sliceIndex]}
              mask={pair.mask[sliceIndex]}
              label={`${pair.label}+mask`}
            />
          </React.Fragment>
        ))}
      </div>

      {/* ===== Slider ===== */}
      <input
        type="range"
        min={0}
        max={maxSlices - 1}
        value={sliceIndex}
        onChange={(e) => setSliceIndex(+e.target.value)}
        className="w-full"
        style={{ accentColor: "currentColor" }}
      />
    </div>
  );
}

/* ============================================================
   CELLULE IMAGE – OPTIMISÉE MOBILE
============================================================ */

function ImageCell({
  src,
  mask,
  label,
}: {
  src: string;
  mask?: string;
  label: string;
}) {
  return (
    <div className="relative aspect-square bg-black overflow-hidden">
      <img
        src={src}
        alt={label}
        className={cn(
          "absolute inset-0 w-full h-full object-contain",
          ROTATION_CLASS
        )}
      />

      {mask && (
        <div className={cn("absolute inset-0 pointer-events-none", ROTATION_CLASS)}>
          <MaskOverlay src={mask} opacity={0.45} className="w-full h-full" />
        </div>
      )}

      {/* Label minimal */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-[2px] py-[1px] md:px-1 md:py-0.5">
        <span className="block font-mono text-white/80 truncate
                        text-[8px] leading-none
                        md:text-[10px] md:leading-tight">
          {label}
        </span>
      </div>
    </div>
  );
}