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
    if (!nativeSlices?.length || !processedSlices?.length) {
      return (
        <div ref={ref} className="text-red-500">
          No images
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("grid grid-cols-2 gap-4", className)}
      >
        <img
          src={nativeSlices[8]}
          alt="native"
          className="w-full border rounded"
        />
        <img
          src={processedSlices[8]}
          alt="mask"
          className="w-full border rounded"
        />
      </div>
    );
  }
);

SliceViewer.displayName = "SliceViewer";

export default SliceViewer;