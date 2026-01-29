// src/components/MaskOverlay.tsx

import * as React from "react";

interface Props {
  src: string;
  opacity?: number; // 0 → 1
  className?: string;
}

export default function MaskOverlay({
  src,
  opacity = 0.5,
  className,
}: Props) {
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

      for (let i = 0; i < data.length; i += 4) {
        const v = data[i]; // grayscale

        if (v < 10) {
          // fond → totalement transparent
          data[i + 3] = 0;
        } else {
          // masque → rouge
          data[i] = 255;     // R
          data[i + 1] = 0;   // G
          data[i + 2] = 0;   // B
          data[i + 3] = Math.round(opacity * 255);
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };
  }, [src, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
    />
  );
}