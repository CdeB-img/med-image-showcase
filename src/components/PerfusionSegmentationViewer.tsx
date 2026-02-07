// ============================================================
// src/components/PerfusionSegmentationViewer.tsx
// Segmentation de perfusion – Approche méthodologique contrôlée
// ============================================================

import * as React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Activity,
  Layers,
  Scan,
  Eye,
  Microscope,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QCViewer from "@/components/QCViewer";

interface ImagePair {
  label: string;
  native: string[];
  mask: string[];
}

interface Props {
  pairs: ImagePair[];
  className?: string;
}

const PARAM_MAPS = ["Tmax", "CBF", "OEF", "CMRO₂", "Diffusion"];

export default function PerfusionSegmentationViewer({
  pairs,
  className,
}: Props) {
  return (
    <div className={cn("space-y-16", className)}>
      {/* ===================== HEADER ===================== */}
      <header className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm text-muted-foreground mx-auto">
          <Activity className="w-4 h-4" />
          Perfusion cérébrale
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold">
          Segmentation et analyse des lésions de perfusion CT / IRM
        </h1>

        <p className="text-muted-foreground leading-relaxed md:text-justify">
          Ce module illustre une approche de segmentation des lésions de perfusion
          cérébrale reposant sur des seuils paramétrables et une lecture guidée par
          le signal, dans un cadre méthodologique explicite et contrôlé.
        </p>
      </header>

      {/* ===================== INTRO ===================== */}
      <section className="max-w-4xl mx-auto border border-border rounded-xl p-6 space-y-6 bg-background">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium uppercase tracking-wide">
                Objectif
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Identifier et structurer des régions de perfusion pathologique à
              partir de cartes paramétriques, dans une logique reproductible et
              interprétable.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium uppercase tracking-wide">
                Ce que montre le viewer
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Superposition des masques de segmentation sur les cartes natives,
              permettant une inspection spatiale et physiopathologique directe.
            </p>
          </div>
        </div>

        <p className="text-sm italic text-muted-foreground border-l-2 border-border pl-4">
          Cette approche ne correspond pas à une classification automatique
          binaire, mais à une segmentation guidée par le signal et validée par
          relecture experte.
        </p>
      </section>

      {/* ===================== PRINCIPE ===================== */}
      <section className="max-w-5xl mx-auto border border-border rounded-xl p-6 space-y-6 bg-background">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Principe méthodologique</h2>
        </div>

        <p className="text-muted-foreground">
          La segmentation repose sur l’exploitation conjointe de plusieurs cartes
          fonctionnelles, avec des seuils définis en fonction des objectifs de
          l’étude.
        </p>

        <div className="flex flex-wrap gap-2">
          {PARAM_MAPS.map((label) => (
            <Badge
              key={label}
              variant="outline"
              className="bg-muted/40 text-muted-foreground border-border"
            >
              {label}
            </Badge>
          ))}
        </div>

        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
            <span className="font-mono text-xs">1.</span>
            <span>
              Seuils paramétrables définis selon le contexte clinique,
              méthodologique ou exploratoire.
            </span>
          </li>
          <li className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
            <span className="font-mono text-xs">2.</span>
            <span>
              Absence de post-traitement arbitraire masquant la réalité
              physiopathologique.
            </span>
          </li>
        </ul>

        <p className="text-sm italic text-muted-foreground border-l-2 border-border pl-4">
          La visualisation synchronisée image / masque permet une évaluation
          immédiate de l’impact des choix méthodologiques.
        </p>
      </section>

      {/* ===================== QC VIEWER ===================== */}
      <section className="space-y-4">
        <div className="text-center space-y-2">
          <Badge variant="outline">Inspection interactive</Badge>
          <h2 className="text-xl font-semibold">
            Contrôle qualité slice par slice
          </h2>
          <p className="text-sm text-muted-foreground">
            Navigation synchronisée et relecture experte
          </p>
        </div>

        <QCViewer
          pairs={pairs}
          patientName="Démonstration – Cartes de perfusion"
          className="border border-border rounded-xl p-6 bg-background"
        />
      </section>

      {/* ===================== CADRE ===================== */}
      <section className="max-w-4xl mx-auto border border-border rounded-xl p-6 space-y-4 bg-background">
        <div className="flex items-center gap-2">
          <Microscope className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Cadre méthodologique</h2>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          Cette approche privilégie une lecture experte du signal, une traçabilité
          complète des choix de segmentation et une indépendance vis-à-vis des
          solutions propriétaires.
        </p>

        <p className="text-sm italic text-muted-foreground border-t border-border pt-4">
          La segmentation est considérée comme un objet d’analyse à part entière,
          conditionnant toute quantification ultérieure.
        </p>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="max-w-2xl mx-auto border border-border rounded-xl p-6 space-y-4 text-center bg-background">
        <h3 className="text-lg font-semibold">
          Discuter d’un besoin méthodologique
        </h3>
        <p className="text-sm text-muted-foreground">
          Ces exemples illustrent des cas réels rencontrés en recherche clinique.
          Pour discuter d’un jeu de données ou d’une problématique spécifique,
          vous pouvez me contacter.
        </p>
        <Button variant="outline" asChild>
          <Link to="/contact" className="inline-flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Initier une discussion
          </Link>
        </Button>
      </section>
    </div>
  );
}