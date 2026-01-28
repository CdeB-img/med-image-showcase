import { useState, useCallback, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SliceViewerProps {
  nativeSlices: string[];
  processedSlices: string[];
  useSliderOverlay?: boolean;
  className?: string;
}

const GITHUB_RAW_PUBLIC_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public";

// Normalize and resolve image source - handles all edge cases
const resolveImageSrc = (src: string | undefined | null): string => {
  // Guard against invalid values
  if (!src || typeof src !== "string" || src.trim() === "") {
    return "";
  }

  // Already an absolute URL (http/https) - return as-is
  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  // Normalize: ensure path starts with /images/
  let normalizedPath = src.trim();
  
  // If it's a relative path without /images/ prefix, assume it's relative to /images/
  if (!normalizedPath.startsWith("/")) {
    // Could be something like "MASK_OEF/slice_010.png" - prefix with /images/
    normalizedPath = `/images/${normalizedPath}`;
  } else if (!normalizedPath.startsWith("/images/")) {
    // Starts with / but not /images/ - prefix properly
    normalizedPath = `/images${normalizedPath}`;
  }

  return normalizedPath;
};

// Build GitHub raw fallback URL
const resolveGithubFallback = (normalizedPath: string): string => {
  if (!normalizedPath || normalizedPath.startsWith("http")) {
    return normalizedPath;
  }
  return `${GITHUB_RAW_PUBLIC_BASE}${normalizedPath}`;
};

// Image component with automatic GitHub fallback
const ImageWithFallback = ({
  src,
  alt,
  className,
}: {
  src: string | undefined | null;
  alt: string;
  className?: string;
}) => {
  const resolvedSrc = resolveImageSrc(src);

  // Don't render broken img if no valid source
  if (!resolvedSrc) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <span className="text-xs text-muted-foreground">Image non disponible</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        const img = e.currentTarget;
        // Prevent infinite loop - only try fallback once
        if (!img.dataset.fallback) {
          img.dataset.fallback = "true";
          const fallbackUrl = resolveGithubFallback(resolvedSrc);
          if (fallbackUrl !== resolvedSrc) {
            img.src = fallbackUrl;
          }
        }
      }}
    />
  );
};

const SliceViewer = ({
  nativeSlices,
  processedSlices,
  useSliderOverlay = false,
  className = "",
}: SliceViewerProps) => {
  const [currentSlice, setCurrentSlice] = useState(0);
  const [overlayPosition, setOverlayPosition] = useState(50);
  
  // Guard against empty arrays
  const safeNativeSlices = Array.isArray(nativeSlices) ? nativeSlices : [];
  const safeProcessedSlices = Array.isArray(processedSlices) ? processedSlices : [];
  const sliceCount = Math.max(safeNativeSlices.length, 1);

  // Preload adjacent images with fallback
  useEffect(() => {
    const preload = (src: string | undefined | null) => {
      const resolvedSrc = resolveImageSrc(src);
      if (!resolvedSrc) return;

      const img = new Image();
      img.onerror = () => {
        const fallbackUrl = resolveGithubFallback(resolvedSrc);
        if (fallbackUrl !== resolvedSrc) {
          img.src = fallbackUrl;
        }
      };
      img.src = resolvedSrc;
    };

    const preloadImages = [
      safeNativeSlices[currentSlice - 1],
      safeNativeSlices[currentSlice + 1],
      safeProcessedSlices[currentSlice - 1],
      safeProcessedSlices[currentSlice + 1],
    ].filter((src): src is string => Boolean(src));

    preloadImages.forEach(preload);
  }, [currentSlice, safeNativeSlices, safeProcessedSlices]);

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

  // Get current slice sources with guards
  const currentNativeSrc = safeNativeSlices[currentSlice];
  const currentProcessedSrc = safeProcessedSlices[currentSlice];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image viewer */}
      <div className="relative bg-surface rounded-lg overflow-hidden border border-border">
        {useSliderOverlay ? (
          // Slider overlay mode for registration projects
          <div className="relative aspect-square">
            {/* Base layer (processed/CT) */}
            <ImageWithFallback
              src={currentProcessedSrc}
              alt={`Processed slice ${currentSlice + 1}`}
              className="absolute inset-0 w-full h-full object-contain bg-black"
            />

            {/* Overlay layer (native/IRM) with clip */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - overlayPosition}% 0 0)` }}
            >
              <ImageWithFallback
                src={currentNativeSrc}
                alt={`Native slice ${currentSlice + 1}`}
                className="w-full h-full object-contain bg-black"
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
              IRM Diffusion
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 text-xs font-mono bg-primary/20 text-primary backdrop-blur-sm rounded">
              Scanner
            </div>
          </div>
        ) : (
          // Side by side mode with mask overlay on native
          <div className="grid grid-cols-2 gap-px bg-border">
            {/* Native image */}
            <div className="relative bg-black aspect-square">
              <div className="absolute top-2 left-2 px-2 py-1 text-xs font-mono bg-background/80 backdrop-blur-sm rounded z-10">
                Image native
              </div>
              <ImageWithFallback
                src={currentNativeSrc}
                alt={`Native slice ${currentSlice + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Native + Mask overlay */}
            <div className="relative bg-black aspect-square">
              <div className="absolute top-2 right-2 px-2 py-1 text-xs font-mono bg-primary/20 text-primary backdrop-blur-sm rounded z-10">
                Masque
              </div>
              {/* Native as base */}
              <ImageWithFallback
                src={currentNativeSrc}
                alt={`Native slice ${currentSlice + 1}`}
                className="absolute inset-0 w-full h-full object-contain"
              />
              {/* Mask overlay with color blend */}
              <ImageWithFallback
                src={currentProcessedSrc}
                alt={`Mask slice ${currentSlice + 1}`}
                className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-80"
              />
            </div>
          </div>
        )}
      </div>

      {/* Overlay slider (only in slider overlay mode) */}
      {useSliderOverlay && (
        <div className="px-4">
          <div className="text-xs text-muted-foreground text-center mb-2">
            Déplacez le curseur pour comparer le recalage
          </div>
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
