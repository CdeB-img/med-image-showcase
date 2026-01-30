// src/components/RegistrationCompareGrid.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface ImagePair {
  reference: string;
  registered: string;
  label?: string;
}

interface Props {
  title: string;
  referenceLabel: string;
  registeredLabel: string;
  pairs: ImagePair[];
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

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground font-medium">
        <div className="text-center">{referenceLabel}</div>
        <div className="text-center">{registeredLabel}</div>
      </div>

      {/* Image grid: 2 columns x N rows */}
      <div className="grid grid-cols-2 gap-4">
        {pairs.map((pair, idx) => (
          <React.Fragment key={idx}>
            {/* LEFT: Reference image (e.g., CT or Diff J0) */}
            <div className="aspect-square bg-black rounded overflow-hidden relative">
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
            </div>

            {/* RIGHT: Reference + Registered overlay */}
            <div className="aspect-square bg-black rounded overflow-hidden relative">
              {/* Background: Reference */}
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

              {/* Overlay: Registered with opacity */}
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
                  className="w-full h-full object-contain mix-blend-screen"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Opacity slider */}
      <div className="flex items-center gap-4 pt-2">
        <span className="text-sm text-muted-foreground w-24">Opacity</span>
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
