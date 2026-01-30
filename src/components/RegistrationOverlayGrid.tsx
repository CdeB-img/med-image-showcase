// src/components/RegistrationOverlayGrid.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import WindowedImage from "@/components/WindowedImage";
import MaskOverlay from "@/components/MaskOverlay";

interface OverlayPair {
  background: string;
  overlay: string;
}

interface Props {
  title: string;
  pairs: OverlayPair[];
  columns?: number;
  initialOpacity?: number;
  className?: string;
}

const ROTATION_CLASS = "-rotate-90 scale-[1.42]";

export default function RegistrationOverlayGrid({
  title,
  pairs,
  columns = 2,
  initialOpacity = 0.35,
  className,
}: Props) {
  const [opacity, setOpacity] = React.useState(initialOpacity);

  return (
    <section className={cn("space-y-6", className)}>
      <h3 className="text-lg font-semibold">{title}</h3>

      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {pairs.map((pair, idx) => (
          <div
            key={idx}
            className="aspect-square bg-black rounded overflow-hidden relative"
          >
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                ROTATION_CLASS
              )}
            >
              <WindowedImage
                src={pair.background}
                className="w-full h-full"
              />
            </div>

            <div
              className={cn(
                "absolute inset-0 pointer-events-none",
                ROTATION_CLASS
              )}
            >
              <MaskOverlay
                src={pair.overlay}
                opacity={opacity}
                className="w-full h-full"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={70}
          value={Math.round(opacity * 100)}
          onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          className="w-full"
        />
        <span className="text-sm font-mono w-16 text-right">
          {Math.round(opacity * 100)}%
        </span>
      </div>
    </section>
  );
}