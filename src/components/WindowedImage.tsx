import * as React from "react";

interface Props {
  src: string;
  width?: number;
  height?: number;
  windowCenter?: number; // 0–255
  windowWidth?: number;  // 0–255
  className?: string;
}

export default function WindowedImage({
  src,
  windowCenter = 120,
  windowWidth = 180,
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

      const wc = windowCenter;
      const ww = windowWidth;
      const min = wc - ww / 2;
      const max = wc + ww / 2;

      for (let i = 0; i < data.length; i += 4) {
        let v = data[i]; // grayscale → R channel
        let nv = ((v - min) / (max - min)) * 255;
        nv = Math.max(0, Math.min(255, nv));
        data[i] = data[i + 1] = data[i + 2] = nv;
      }

      ctx.putImageData(imageData, 0, 0);
    };
  }, [src, windowCenter, windowWidth]);

  return <canvas ref={canvasRef} className={className} />;
}