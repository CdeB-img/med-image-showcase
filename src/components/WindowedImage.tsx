// src/components/WindowedImage.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  className?: string;
  windowCenter?: number;
  windowWidth?: number;
  onWindowChange?: (next: { center: number; width: number }) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function WindowedImage({
  src,
  className,
  windowCenter = 128,
  windowWidth = 256,
  onWindowChange,
}: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const sourceImageRef = React.useRef<ImageData | null>(null);
  const [imageVersion, setImageVersion] = React.useState(0);
  const dragRef = React.useRef<{
    x: number;
    y: number;
    center: number;
    width: number;
  } | null>(null);

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
      sourceImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setImageVersion((version) => version + 1);
    };
  }, [src]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const source = sourceImageRef.current;
    if (!canvas || !source) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const output = new ImageData(
      new Uint8ClampedArray(source.data),
      source.width,
      source.height
    );
    const data = output.data;
    const low = windowCenter - windowWidth / 2;
    const width = Math.max(1, windowWidth);

    for (let i = 0; i < data.length; i += 4) {
      const luminance = 0.2126 * source.data[i] + 0.7152 * source.data[i + 1] + 0.0722 * source.data[i + 2];
      const normalized = clamp((luminance - low) / width, 0, 1);
      const out = Math.round(normalized * 255);

      data[i] = out;
      data[i + 1] = out;
      data[i + 2] = out;
    }

    ctx.putImageData(output, 0, 0);
  }, [windowCenter, windowWidth, imageVersion]);

  const updateWindow = React.useCallback(
    (next: { center: number; width: number }) => {
      onWindowChange?.({
        center: Math.round(clamp(next.center, -255, 510)),
        width: Math.round(clamp(next.width, 1, 512)),
      });
    },
    [onWindowChange]
  );

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={(event) => {
        if (!onWindowChange) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
          x: event.clientX,
          y: event.clientY,
          center: windowCenter,
          width: windowWidth,
        };
      }}
      onPointerMove={(event) => {
        if (!dragRef.current || !onWindowChange) return;

        const dx = event.clientX - dragRef.current.x;
        const dy = event.clientY - dragRef.current.y;

        updateWindow({
          center: dragRef.current.center - dy * 0.8,
          width: dragRef.current.width + dx * 1.2,
        });
      }}
      onPointerUp={(event) => {
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
      className={cn("block w-full h-full touch-none select-none", onWindowChange && "cursor-crosshair", className)}
    />
  );
}
