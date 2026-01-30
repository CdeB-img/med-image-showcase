// src/components/RegistrationViewer.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface RegistrationPair {
  reference: string;
  registered: string;
  label: string;
}

interface Props {
  multimodalPairs: RegistrationPair[];
  monomodalPairs: RegistrationPair[];
  initialOpacity?: number;
  className?: string;
}

const ROTATION_CLASS = "-rotate-90 scale-[1.42]";

export default function RegistrationViewer({
  multimodalPairs,
  monomodalPairs,
  initialOpacity = 0.5,
  className,
}: Props) {
  const [opacity, setOpacity] = React.useState(initialOpacity);

  const allPairs = [...multimodalPairs, ...monomodalPairs];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Grid: 3 multimodal + 3 monomodal = 6 images in 2 rows of 3 */}
      <div className="space-y-4">
        {/* Row labels */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center text-sm font-medium text-muted-foreground col-span-3">
            Multimodal CT / IRM
          </div>
        </div>

        {/* Multimodal row */}
        <div className="grid grid-cols-3 gap-3">
          {multimodalPairs.map((pair, idx) => (
            <div
              key={`multi-${idx}`}
              className="aspect-square bg-black rounded-lg overflow-hidden relative border border-border/50"
            >
              {/* Background: Reference */}
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

              {/* Label */}
              <div className="absolute bottom-1 left-1 right-1 text-center">
                <span className="text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
                  {pair.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Monomodal label */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center text-sm font-medium text-muted-foreground col-span-3">
            Monomodal IRM (Diff → Flair)
          </div>
        </div>

        {/* Monomodal row */}
        <div className="grid grid-cols-3 gap-3">
          {monomodalPairs.map((pair, idx) => (
            <div
              key={`mono-${idx}`}
              className="aspect-square bg-black rounded-lg overflow-hidden relative border border-border/50"
            >
              {/* Background: Reference */}
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

              {/* Label */}
              <div className="absolute bottom-1 left-1 right-1 text-center">
                <span className="text-[10px] text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
                  {pair.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Single opacity slider */}
      <div className="flex items-center gap-4 pt-4 border-t border-border/50">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Overlay
        </span>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[Math.round(opacity * 100)]}
          onValueChange={([val]) => setOpacity(val / 100)}
          className="flex-1"
        />
        <span className="text-sm font-mono w-12 text-right text-muted-foreground">
          {Math.round(opacity * 100)}%
        </span>
      </div>
    </div>
  );
}
