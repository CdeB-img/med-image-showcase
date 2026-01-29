// src/components/WindowedImage.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  className?: string;
}

/**
 * Fenêtrage robuste pour IRM diffusion
 * - Ignore le fond (pixels nuls)
 * - Percentiles 5–95
 * - Mapping linéaire propre
 */
export default function WindowedImage({ src, className }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // ===== Collecte des intensités non nulles =====
      const values: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const v = data[i]; // grayscale
        if (v > 0) values.push(v);
      }

      if (values.length === 0) return;

      values.sort((a, b) => a - b);

      const p = (q: number) =>
        values[Math.floor((q / 100) * (values.length - 1))];

      const vmin = p(50);
      const vmax = p(95);
      const range = vmax - vmin || 1;

      // ===== Fenêtrage =====
      for (let i = 0; i < data.length; i += 4) {
        const v = data[i];
        let nv = (v - vmin) / range;
        nv = Math.max(0, Math.min(1, nv));

        // Gamma < 1 = boost des basses/moyennes intensités
        nv = Math.pow(nv, 0.7);

        const out = Math.round(nv * 255);

        data[i] = data[i + 1] = data[i + 2] = out;
      }

      ctx.putImageData(imageData, 0, 0);
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("block w-full h-full", className)}
    />
  );
}