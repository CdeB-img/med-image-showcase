// src/components/SliceViewer.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import WindowedImage from "@/components/WindowedImage";

interface Props {
  nativeSlices: string[];
  processedSlices: string[];
  useSliderOverlay?: boolean;
  className?: string;
}

const ROTATION = -90;

const SliceViewer = React.forwardRef<HTMLDivElement, Props>(
  ({ nativeSlices, processedSlices, className }, ref) => {
    const [sliceIndex, setSliceIndex] = React.useState(0);

    const maxSlices = Math.min(
      nativeSlices?.length ?? 0,
      processedSlices?.length ?? 0
    );

    if (maxSlices === 0) {
      return (
        <div ref={ref} className="text-red-500">
          No images
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("space-y-6", className)}>
        {/* IMAGES */}
        <div className="grid grid-cols-2 gap-6">
          {/* Native (fenêtrée) */}
          <div className="aspect-square bg-black rounded overflow-hidden flex items-center justify-center">
            <WindowedImage
              src={nativeSlices[sliceIndex]}
              rotationDeg={ROTATION}
              className="w-full h-full"
            />
          </div>

          {/* Masque / image traitée (brute) */}
          <div className="aspect-square bg-black rounded overflow-hidden flex items-center justify-center">
            <img
              src={processedSlices[sliceIndex]}
              alt={`processed slice ${sliceIndex}`}
              className="w-full h-full object-contain transform -rotate-90 scale-[1.42]"
            />
          </div>
        </div>

        {/* SLIDER */}
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