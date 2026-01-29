import * as React from "react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  className?: string;
}

/**
 * Rendu volontairement "mou" pour diffusion IRM (présentation / portfolio)
 *
 * Objectifs :
 * - Pas de blanc cramé
 * - Pas de noir dur
 * - Hyperintensités visibles mais calmes
 * - Contraste global réduit (non clinique)
 *
 * Hypothèses :
 * - Image déjà en niveaux de gris (PNG 8 bits)
 * - Fond majoritairement à 0
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

      // ================================
      // Collecte des intensités utiles
      // ================================
      const values: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const v = data[i]; // grayscale (R)
        if (v > 0) values.push(v);
      }

      if (values.length === 0) return;

      values.sort((a, b) => a - b);

      const percentile = (q: number) =>
        values[Math.floor((q / 100) * (values.length - 1))];

      // Fenêtrage volontairement large
      const vmin = percentile(10);
      const vmax = percentile(98);
      const range = vmax - vmin || 1;

      // ================================
      // Mapping doux et écrasé
      // ================================
      for (let i = 0; i < data.length; i += 4) {
        const v = data[i];

        // Normalisation
        let nv = (v - vmin) / range;
        nv = Math.max(0, Math.min(1, nv));

        // Gamma > 1 → contraste global réduit
        nv = Math.pow(nv, 1.6);

        // Compression volontaire de la dynamique affichée
        // (évite noir pur et blanc pur)
        const out = Math.round(30 + nv * 180);

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