import * as React from "react";
import { cn } from "@/lib/utils";

interface Props {
  nativeSlices: string[];
  processedSlices: string[];
  useSliderOverlay?: boolean;
  className?: string;
}

const SliceViewer = React.forwardRef<HTMLDivElement, Props>(
  ({ nativeSlices, processedSlices, className }, ref) => {
    const [sliceIndex, setSliceIndex] = React.useState(0);

    const maxSlices = Math.min(
      nativeSlices.length,
      processedSlices.length
    );

    if (maxSlices === 0) {
      return (
        <div ref={ref} className="text-red-500">
          No images
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        {/* Images */}
        <div className="grid grid-cols-2 gap-4">
        <img
          src={nativeSlices[sliceIndex]}
          alt={`native slice ${sliceIndex}`}
          className="w-full border rounded bg-black transform -rotate-45"
        />

        <img
          src={processedSlices[sliceIndex]}
          alt={`processed slice ${sliceIndex}`}
          className="w-full border rounded bg-black transform -rotate-45"
        />
          />
        </div>

        {/* Slider */}
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