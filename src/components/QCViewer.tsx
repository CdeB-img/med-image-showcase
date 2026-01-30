// src/components/QCViewer.tsx

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
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{patientName}</h2>
        <span className="text-sm font-mono text-muted-foreground">
          Slice {sliceIndex + 1}/{maxSlices}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-3">
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
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                <span className="text-xs font-mono text-white">
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

              <div
                className="
                  absolute bottom-0 left-0 right-0
                  bg-black/70
                  px-2 py-1
                  md:px-2 md:py-2
                "
              >
                <span
                  className="
                    text-[10px] md:text-xs
                    font-mono text-white/90
                    leading-tight
                    truncate
                  "
                >
                  {pair.label} + mask
                </span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={maxSlices - 1}
        value={sliceIndex}
        onChange={(e) => setSliceIndex(+e.target.value)}
        className="w-full accent-primary"
      />
    </div>
  );
}