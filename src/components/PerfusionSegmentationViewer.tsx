// ============================================================
// src/components/PerfusionSegmentationViewer.tsx
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Scan, 
  Activity, 
  Target, 
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Brain,
  AlertCircle
} from "lucide-react";
import MaskOverlay from "./MaskOverlay";

// ============================================================
// TYPES
// ============================================================

interface QCPair {
  label: string;
  native: string[];
  mask: string[];
}

interface Props {
  pairs: QCPair[];
  className?: string;
}

// ============================================================
// PARAMETRIC MAPS CONFIG
// ============================================================

const paramMaps = [
  { label: "Tmax", color: "bg-primary/20 text-primary border-primary/30" },
  { label: "CBF", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { label: "OEF", color: "bg-primary/20 text-primary border-primary/30" },
  { label: "CMRO₂", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { label: "Diffusion", color: "bg-primary/20 text-primary border-primary/30" },
];

// ============================================================
// COMPONENT
// ============================================================

const PerfusionSegmentationViewer = ({ pairs, className = "" }: Props) => {
  const [currentSlice, setCurrentSlice] = useState(0);
  const maxSlices = pairs[0]?.native.length ?? 0;

  const prev = useCallback(() => {
    setCurrentSlice((s) => Math.max(0, s - 1));
  }, []);

  const next = useCallback(() => {
    setCurrentSlice((s) => Math.min(maxSlices - 1, s + 1));
  }, [maxSlices]);

  const jump = useCallback(
    (delta: number) => {
      setCurrentSlice((s) => Math.max(0, Math.min(maxSlices - 1, s + delta)));
    },
    [maxSlices]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "PageUp") jump(-5);
      else if (e.key === "PageDown") jump(5);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next, jump]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Scan className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Perfusion CT/IRM</h1>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline">CT Perfusion / MRI</Badge>
          <Badge variant="secondary">Segmentation</Badge>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Left: Description */}
        <div className="space-y-6">
          {/* Objectif */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Objectif</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Segmentation automatique des lésions de perfusion cérébrale basée sur des 
              seuils paramétrables et une validation physiopathologique rigoureuse.
            </p>
          </div>

          {/* Principe */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Principe</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Approche signal-driven pour l'identification de la pénombre ischémique 
              et du cœur nécrotique via des seuils ajustables sur les cartes fonctionnelles :
            </p>
            <div className="flex flex-wrap gap-2">
              {paramMaps.map((map) => (
                <Badge 
                  key={map.label} 
                  className={`${map.color} border`}
                >
                  {map.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Cas d'usage */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Cas d'usage</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>AVC aigu : quantification pénombre/core</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Suivi longitudinal post-traitement</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Recherche : extraction de biomarqueurs</span>
              </li>
            </ul>
          </div>

          {/* Note */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong>Note :</strong> Les seuils sont configurables selon les recommandations 
                cliniques et peuvent être adaptés aux protocoles spécifiques de chaque centre.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Viewer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span className="font-medium">Visualisation des cartes</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Coupe {currentSlice + 1} / {maxSlices}
            </span>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-3 gap-2">
            {pairs.map((pair) => (
              <div key={pair.label} className="space-y-1">
                <span className="text-xs text-muted-foreground block text-center">
                  {pair.label}
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {/* Native */}
                  <div className="aspect-square bg-black rounded overflow-hidden">
                    <img
                      src={pair.native[currentSlice]}
                      alt={`${pair.label} native`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Overlay: native + mask */}
                  <div className="aspect-square bg-black rounded overflow-hidden relative">
                    <img
                      src={pair.native[currentSlice]}
                      alt={`${pair.label} native`}
                      className="w-full h-full object-contain absolute inset-0"
                    />
                    <MaskOverlay
                      src={pair.mask[currentSlice]}
                      opacity={0.6}
                      className="w-full h-full object-contain absolute inset-0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => jump(-5)}
              disabled={currentSlice === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              <ChevronLeft className="w-4 h-4 -ml-2" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              disabled={currentSlice === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              ← → : ±1 | PgUp/PgDn : ±5
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              disabled={currentSlice === maxSlices - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => jump(5)}
              disabled={currentSlice === maxSlices - 1}
            >
              <ChevronRight className="w-4 h-4 -mr-2" />
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center pt-4 border-t border-border">
        <Link to="/contact">
          <Button className="gap-2">
            Discuter de votre projet
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default PerfusionSegmentationViewer;
