// src/components/SliceViewer.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import WindowedImage from "@/components/WindowedImage";
import MaskOverlay from "@/components/MaskOverlay";

interface Props {
  nativeSlices: string[];
  processedSlices: string[];
  useSliderOverlay?: boolean;
  className?: string;
}

const ROTATION_CLASS = "-rotate-90 scale-[1.42]";

const SliceViewer = React.forwardRef<HTMLDivElement, Props>(
  ({ nativeSlices, processedSlices, className }, ref) => {
    const [sliceIndex, setSliceIndex] = React.useState(0);

    const maxSlices = Math.min(
      nativeSlices?.length ?? 0,
      processedSlices?.length ?? 0
    );


    return (
      <div ref={ref} className={cn("space-y-6", className)}>
        {/* =========================
            IMAGES
        ========================= */}
        <div className="grid grid-cols-2 gap-6">

          {/* =========================
              GAUCHE — Native seule
          ========================= */}
          <div className="aspect-square bg-black rounded overflow-hidden flex items-center justify-center">
            <div className={cn("w-full h-full", ROTATION_CLASS)}>
              <WindowedImage
                src={nativeSlices[sliceIndex]}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* =========================
              DROITE — Native + masque
          ========================= */}
          <div className="aspect-square bg-black rounded overflow-hidden relative">

            {/* Fond : image native */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                ROTATION_CLASS
              )}
            >
              <WindowedImage
                src={nativeSlices[sliceIndex]}
                className="w-full h-full"
              />
            </div>

            {/* Masque rouge propre */}
            <div
              className={cn(
                "absolute inset-0",
                ROTATION_CLASS,
                "pointer-events-none"
              )}
            >
              <MaskOverlay
                src={processedSlices[sliceIndex]}
                opacity={0.45}
                className="w-full h-full"
              />
            </div>

          </div> {/* ✅ FIN COLONNE DROITE */}

        </div> {/* ✅ FIN GRID */}

        {/* =========================
            SLIDER
        ========================= */}
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={maxSlices - 1}
            value={sliceIndex}
            onChange={(e) => setSliceIndex(Number(e.target.value))}
            className="w-full"
          />
          <span className="text-sm font-mono w-16 text-right">
            {sliceIndex + 1}/{maxSlices}
          </span>
        </div>
      </div>
    );
  }
);

SliceViewer.displayName = "SliceViewer";

export default SliceViewer;