// src/components/QCViewer.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import WindowedImage from "@/components/WindowedImage";
import MaskOverlay from "@/components/MaskOverlay";

interface ImagePair {
  label: string;
  native: string[]; // urls slice_000.png, slice_001.png, ...
  mask: string[];   // urls slice_000.png, slice_001.png, ...
}

interface Props {
  pairs: ImagePair[];
  patientName?: string;
  className?: string;
}

const ROTATION_CLASS = "-rotate-90 scale-[1.42]";

/**
 * Viewer de contrôle qualité
 * Grille 3×4 (6 paires → 12 tuiles)
 * Clavier : ↑/↓ ±1, PageUp/PageDown ±5
 */
export default function QCViewer({
  pairs,
  patientName = "Patient",
  className,
}: Props) {
  const maxSlices = pairs?.[0]?.native?.length ?? 0;

  const [sliceIndex, setSliceIndex] = React.useState(() =>
    maxSlices > 0 ? Math.floor(maxSlices / 2) : 0
  );

  // Keep sliceIndex valid if data changes
  React.useEffect(() => {
    setSliceIndex((prev) => {
      if (maxSlices <= 0) return 0;
      return Math.min(maxSlices - 1, Math.max(0, prev));
    });
  }, [maxSlices]);

  // Keyboard navigation
  React.useEffect(() => {
    if (maxSlices <= 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSliceIndex((prev) => Math.min(maxSlices - 1, prev + 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSliceIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "PageUp") {
        e.preventDefault();
        setSliceIndex((prev) => Math.min(maxSlices - 1, prev + 5));
      } else if (e.key === "PageDown") {
        e.preventDefault();
        setSliceIndex((prev) => Math.max(0, prev - 5));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [maxSlices]);

  if (maxSlices === 0) {
    return (
      <div className="text-destructive text-center py-8">
        Aucune image disponible
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{patientName}</h2>

        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-muted-foreground">
            Slice {sliceIndex + 1}/{maxSlices}
          </span>
          <div className="text-xs text-muted-foreground font-mono bg-secondary/50 px-3 py-1.5 rounded">
            ↑/↓ ±1 • PgUp/PgDn ±5
          </div>
        </div>
      </div>

      {/* Grid 3×4: for each pair -> 2 tiles (native, native+mask) */}
      <div className="grid grid-cols-4 gap-3">
        {pairs.map((pair) => (
          <React.Fragment key={pair.label}>
            {/* Native */}
            <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  ROTATION_CLASS
                )}
              >
                <WindowedImage
                  src={pair.native[sliceIndex]}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <span className="text-xs font-mono text-white/90">
                  {pair.label}
                </span>
              </div>
            </div>

            {/* Native + Mask */}
            <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  ROTATION_CLASS
                )}
              >
                <WindowedImage
                  src={pair.native[sliceIndex]}
                  className="w-full h-full object-contain"
                />
              </div>

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

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <span className="text-xs font-mono text-white/90">
                  {pair.label} + mask
                </span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Slice slider */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-16">Slice</span>
        <input
          type="range"
          min={0}
          max={maxSlices - 1}
          value={sliceIndex}
          onChange={(e) => setSliceIndex(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="text-sm font-mono text-foreground w-20 text-right">
          {sliceIndex + 1}/{maxSlices}
        </span>
      </div>
    </div>
  );
}