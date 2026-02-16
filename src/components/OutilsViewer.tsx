// ============================================================
// src/components/OutilsViewer.tsx
// Développement d'outils sur mesure – version recentrée
// ============================================================

import React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  Layers,
  FileSpreadsheet,
  Microscope,
  Atom,
  Blend,
  Settings,
  Database,
  Ruler,
  Eye,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

const RAW_BASE = "/images";

interface OutilsViewerProps {
  className?: string;
  hideHero?: boolean;
}

/* ===================== Image zoomable ===================== */
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-zoom-in">
          <img
            src={src}
            alt={alt}
            className="w-full h-auto object-contain"
            loading="lazy"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-border overflow-auto">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-contain"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      </DialogContent>
    </Dialog>
  );
}

const OutilsViewer: React.FC<OutilsViewerProps> = ({ className, hideHero = false }) => {
  return (
    <div className={cn("space-y-20", className)}>
      {/* ===================== HEADER ===================== */}
      {!hideHero && (
        <header className="text-center space-y-6 mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold">
            Développement d’outils sur mesure
          </h1>
          <p className="text-lg text-muted-foreground">
            Quantification robuste et prototypage méthodologique
          </p>
        </header>
      )}

      {/* ===================== POSITIONNEMENT ===================== */}
      <section className="mx-auto max-w-4xl bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 text-center">
        <h2 className="text-xl font-semibold">
          Conception d’outils d’analyse adaptés aux contraintes réelles
        </h2>

        <div className="space-y-3 text-muted-foreground leading-relaxed md:text-justify">
          <p>
            Cette section illustre une capacité à concevoir des outils
            d’analyse, de quantification et de visualisation spécifiquement
            adaptés à des problématiques méthodologiques en imagerie médicale.
            L’approche est orientée usage réel, compréhension du signal et
            maîtrise des données.
          </p>
          <p className="text-sm italic border-l-2 border-primary/50 pl-4 text-left md:text-justify">
            Il ne s’agit pas de proposer des logiciels standardisés, mais de
            développer des outils ciblés, construits à partir des contraintes
            scientifiques, techniques et réglementaires propres à chaque projet.
          </p>
        </div>
      </section>

      {/* ===================== MODULE PNEUMO ===================== */}
      <section className="space-y-8 mx-auto max-w-5xl">
        <ModuleTitle
          icon={<Stethoscope />}
          title="Analyse CT thoracique — exploration pneumologique"
        />

        <ModuleText>
          <Feature icon={<Layers />} title="Analyse régionale structurée">
            Découpage angulaire et radial permettant une lecture spatiale fine
            du parenchyme pulmonaire.
          </Feature>
          <Feature icon={<FileSpreadsheet />} title="Quantification explicite">
            Scores de fibrose, emphysème et atteintes mixtes avec métriques
            traçables et interprétables.
          </Feature>
          <Feature icon={<Eye />} title="Aide à la lecture experte">
            Structuration de l’information sans substitution au raisonnement
            clinique ou physiopathologique.
          </Feature>
        </ModuleText>

        <ImageBlock>
          <ZoomableImage
            src={`${RAW_BASE}/outils/pneumo.webp`}
            alt="Analyse quantitative du parenchyme pulmonaire en scanner thoracique"
          />
        </ImageBlock>
      </section>

      {/* ===================== MODULE SPECTRAL ===================== */}
      <section className="space-y-8 mx-auto max-w-5xl">
        <ModuleTitle
          icon={<Atom />}
          title="CT spectral — exploration multi-énergie"
        />

        <ModuleText>
          <Feature icon={<Microscope />} title="Reconstructions mono-énergie">
            Visualisation à différents niveaux d’énergie pour améliorer le
            contraste et la lisibilité anatomique.
          </Feature>
          <Feature icon={<Blend />} title="Cartographies matériaux">
            Premières briques de décomposition (iode, Zeff), pensées comme des
            mesures physiques interprétables.
          </Feature>
          <Feature icon={<Layers />} title="Fusion contrôlée">
            Superposition multicanal maîtrisée, ancrée dans la géométrie CT
            native.
          </Feature>
        </ModuleText>

        <ImageBlock>
          <ZoomableImage
            src={`${RAW_BASE}/outils/spectral.webp`}
            alt="Cartographies matériaux et imagerie CT spectrale"
          />
        </ImageBlock>
      </section>

      {/* ===================== CADRE MÉTHODOLOGIQUE ===================== */}
      <section className="mx-auto max-w-4xl bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6 text-center">
        <h2 className="text-xl font-semibold">Cadre méthodologique</h2>

        <p className="text-muted-foreground leading-relaxed md:text-justify">
          Le développement d’outils repose sur une compréhension fine du signal,
          des métadonnées DICOM, de la géométrie et des unités physiques, avec une
          séparation stricte entre visualisation, quantification et
          interprétation.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-left">
          <Feature icon={<Settings />} title="Développement sur mesure">
            Outils construits spécifiquement pour une problématique donnée.
          </Feature>
          <Feature icon={<Database />} title="Audit de pipelines existants">
            Relecture, validation ou adaptation de chaînes déjà en place.
          </Feature>
          <Feature icon={<Ruler />} title="Préparation de données">
            Données robustes, comparables et exploitables quantitativement.
          </Feature>
          <Feature icon={<Eye />} title="Transparence méthodologique">
            Indépendance vis-à-vis des solutions propriétaires et boîtes noires.
          </Feature>
        </div>

        <p className="text-sm italic text-muted-foreground pt-4 border-t border-border">
          Chaque outil est conçu comme un objet méthodologique interprétable,
          jamais comme une solution opaque.
        </p>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 max-w-2xl mx-auto text-center">
        <h3 className="text-lg font-semibold">
          Discuter d’un besoin méthodologique
        </h3>
        <p className="text-sm text-muted-foreground">
          Ces exemples illustrent des situations réelles rencontrées en recherche
          clinique et translationnelle. Pour discuter d’un outil, d’un jeu de
          données ou d’une problématique spécifique, vous pouvez me contacter.
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
};

export default OutilsViewer;

/* ===================== Sous-composants UI ===================== */

function ModuleTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h2 className="text-2xl font-semibold">{title}</h2>
    </div>
  );
}

function ModuleText({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 max-w-3xl">{children}</div>;
}

function ImageBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-surface">
      {children}
    </div>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-primary mt-0.5 shrink-0">{icon}</div>
      <p className="text-sm text-muted-foreground">
        <strong>{title}</strong> — {children}
      </p>
    </div>
  );
}
