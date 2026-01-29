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

      const vmin = p(20);
      const vmax = p(90);
      const range = vmax - vmin || 1;

      // ===== Fenêtrage =====
      for (let i = 0; i < data.length; i += 4) {
        const v = data[i];
        let nv = (v - vmin) / range;
        nv = Math.max(0, Math.min(1, nv));

        // ===============================
        // Compression des hypers
        // ===============================
        const knee = 0.75;   // seuil à partir duquel on calme l’hyper
        const strength = 0.6; // 0.5 = fort, 0.7 = doux

        if (nv > knee) {
        const t = (nv - knee) / (1 - knee); // 0 → 1
        nv = knee + Math.pow(t, strength) * (1 - knee);
        }

        // Légère correction perceptuelle globale
        nv = Math.pow(nv, 1.05);

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