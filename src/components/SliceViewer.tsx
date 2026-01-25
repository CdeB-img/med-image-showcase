import { useState, useCallback, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Columns2, Layers, ChevronLeft, ChevronRight } from "lucide-react";

interface SliceViewerProps {
  nativeSlices: string[];
  processedSlices: string[];
  className?: string;
}

const SliceViewer = ({ nativeSlices, processedSlices, className = "" }: SliceViewerProps) => {
  const [currentSlice, setCurrentSlice] = useState(0);
  const [viewMode, setViewMode] = useState<"side-by-side" | "overlay">("side-by-side");
  const [overlayPosition, setOverlayPosition] = useState(50);
  const sliceCount = nativeSlices.length;

  // Preload adjacent images
  useEffect(() => {
    const preloadImages = [
      nativeSlices[currentSlice - 1],
      nativeSlices[currentSlice + 1],
      processedSlices[currentSlice - 1],
      processedSlices[currentSlice + 1],
    ].filter(Boolean);

    preloadImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [currentSlice, nativeSlices, processedSlices]);

  const handleSliceChange = useCallback((value: number[]) => {
    setCurrentSlice(value[0]);
  }, []);

  const handleOverlayChange = useCallback((value: number[]) => {
    setOverlayPosition(value[0]);
  }, []);

  const navigateSlice = (direction: "prev" | "next") => {
    if (direction === "prev" && currentSlice > 0) {
      setCurrentSlice(currentSlice - 1);
    } else if (direction === "next" && currentSlice < sliceCount - 1) {
      setCurrentSlice(currentSlice + 1);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* View mode toggle */}
      <div className="flex justify-center">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="side-by-side" className="gap-2">
              <Columns2 className="w-4 h-4" />
              Côte à côte
            </TabsTrigger>
            <TabsTrigger value="overlay" className="gap-2">
              <Layers className="w-4 h-4" />
              Superposition
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Image viewer */}
      <div className="relative bg-surface rounded-lg overflow-hidden border border-border">
        {viewMode === "side-by-side" ? (
          <div className="grid grid-cols-2 gap-px bg-border">
            {/* Native image */}
            <div className="relative bg-surface aspect-square">
              <div className="absolute top-2 left-2 px-2 py-1 text-xs font-mono bg-background/80 backdrop-blur-sm rounded z-10">
                Image native
              </div>
              <img
                src={nativeSlices[currentSlice]}
                alt={`Native slice ${currentSlice + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Processed image */}
            <div className="relative bg-surface aspect-square">
              <div className="absolute top-2 right-2 px-2 py-1 text-xs font-mono bg-primary/20 text-primary backdrop-blur-sm rounded z-10">
                Production
              </div>
              <img
                src={processedSlices[currentSlice]}
                alt={`Processed slice ${currentSlice + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="relative aspect-video md:aspect-[4/3]">
            {/* Base layer (processed) */}
            <img
              src={processedSlices[currentSlice]}
              alt={`Processed slice ${currentSlice + 1}`}
              className="absolute inset-0 w-full h-full object-contain"
            />
            
            {/* Overlay layer (native) with clip */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - overlayPosition}% 0 0)` }}
            >
              <img
                src={nativeSlices[currentSlice]}
                alt={`Native slice ${currentSlice + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Divider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
              style={{ left: `${overlayPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                <ChevronLeft className="w-3 h-3 -mr-1" />
                <ChevronRight className="w-3 h-3 -ml-1" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-2 left-2 px-2 py-1 text-xs font-mono bg-background/80 backdrop-blur-sm rounded">
              Native
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 text-xs font-mono bg-primary/20 text-primary backdrop-blur-sm rounded">
              Production
            </div>
          </div>
        )}
      </div>

      {/* Overlay slider (only in overlay mode) */}
      {viewMode === "overlay" && (
        <div className="px-4">
          <Slider
            value={[overlayPosition]}
            onValueChange={handleOverlayChange}
            min={0}
            max={100}
            step={1}
            className="py-2"
          />
        </div>
      )}

      {/* Slice navigation */}
      <div className="flex items-center gap-4 px-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateSlice("prev")}
          disabled={currentSlice === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <Slider
            value={[currentSlice]}
            onValueChange={handleSliceChange}
            min={0}
            max={sliceCount - 1}
            step={1}
            className="py-2"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateSlice("next")}
          disabled={currentSlice === sliceCount - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Slice indicator */}
      <div className="text-center text-sm font-mono text-muted-foreground">
        Coupe {currentSlice + 1} / {sliceCount}
      </div>
    </div>
  );
};

export default SliceViewer;
