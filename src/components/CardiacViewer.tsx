// src/components/CardiacViewer.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

interface Props {
  className?: string;
}

const CardiacViewer = ({ className }: Props) => {
  return (
    <div className={cn("space-y-12", className)}>
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Cardiac MRI</h1>
        <p className="text-muted-foreground max-w-3xl">
          Cardiac function assessment through cine imaging (diastole/systole comparison) 
          and late gadolinium enhancement (LGE) analysis for myocardial scar quantification 
          across basal, mid-ventricular and apical segments.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 text-xs font-medium rounded-md border border-primary/50 text-primary">
            MRI Cardiac
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-secondary text-secondary-foreground">
            Quantification
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            Python
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            SimpleITK
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            NumPy
          </span>
        </div>
      </div>

      {/* Section 1: Cardiac Function */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">
            Cardiac Function Assessment
          </h2>
          <p className="text-sm text-muted-foreground">
            Cine MRI comparison between end-diastole (maximum ventricular filling) 
            and end-systole (maximum contraction) for ejection fraction calculation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Diastole */}
          <div className="space-y-3">
            <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
              <img
                src={`${RAW_BASE}/cardio/diastole.png`}
                alt="End-Diastole"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">End-Diastole</span>
              <p className="text-xs text-muted-foreground">Maximum ventricular volume</p>
            </div>
          </div>

          {/* Systole */}
          <div className="space-y-3">
            <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
              <img
                src={`${RAW_BASE}/cardio/systole.png`}
                alt="End-Systole"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">End-Systole</span>
              <p className="text-xs text-muted-foreground">Minimum ventricular volume</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Late Gadolinium Enhancement */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-primary">
            Late Gadolinium Enhancement (LGE)
          </h2>
          <p className="text-sm text-muted-foreground">
            T1-weighted imaging 10-15 minutes post-gadolinium injection for 
            myocardial scar and fibrosis detection across three ventricular levels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Base */}
          <div className="space-y-3">
            <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
              <img
                src={`${RAW_BASE}/cardio/base.png`}
                alt="Basal Level"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">Basal</span>
              <p className="text-xs text-muted-foreground">Near mitral valve</p>
            </div>
          </div>

          {/* Mid */}
          <div className="space-y-3">
            <div className="aspect-square bg-black rounded-lg overflow overflow-hidden border border-border">
              <img
                src={`${RAW_BASE}/cardio/mid.png`}
                alt="Mid-Ventricular Level"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">Mid-Ventricular</span>
              <p className="text-xs text-muted-foreground">Papillary muscles level</p>
            </div>
          </div>

          {/* Apex */}
          <div className="space-y-3">
            <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
              <img
                src={`${RAW_BASE}/cardio/apex.png`}
                alt="Apical Level"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">Apical</span>
              <p className="text-xs text-muted-foreground">Ventricular apex</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CardiacViewer;
