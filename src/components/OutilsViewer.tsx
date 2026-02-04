// ============================================================
// src/components/OutilsViewer.tsx
// Développement d'outils – Viewer avec zoom sécurisé mobile
// ============================================================

import React from "react";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

interface OutilsViewerProps {
  className?: string;
}

/* ============================================================
   Composant Image Zoomable Sécurisé
============================================================ */
function SecureZoomImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Image inline */}
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-contain cursor-zoom-in"
        draggable={false}
        onClick={() => {
          setZoom(1);
          setOpen(true);
        }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {open && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Header controls */}
          <div className="absolute top-4 right-4 z-50 flex gap-3">
            <button
              className="text-white text-xl"
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            >
              −
            </button>
            <button
              className="text-white text-xl"
              onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
            >
              +
            </button>
            <button
              className="text-white text-2xl ml-2"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          {/* Viewer */}
          <div
            className="w-full h-full flex items-center justify-center overflow-auto"
            onContextMenu={(e) => e.preventDefault()}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="select-none"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease",
                maxWidth: "90vw",
                maxHeight: "90vh",
              }}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   Page principale
============================================================ */

const OutilsViewer: React.FC<OutilsViewerProps> = ({ className }) => {
  return (
    <div className={cn("space-y-12", className)}>
      {/* Header */}
      <header className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">
          Développement d’outils sur mesure
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Analyse CT avancée, quantification robuste et prototypage méthodologique
        </p>
      </header>

      {/* Introduction */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          Développement d’outils dédiés à l’analyse, à la quantification et à
          l’exploration avancée des données d’imagerie médicale, selon une
          approche <em>signal-driven</em>, explicite et orientée usages réels.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          L’objectif n’est pas de produire un logiciel générique, mais une{" "}
          <strong>capacité de conception d’outils sur mesure</strong>, adaptés à
          des données hétérogènes et à des contraintes méthodologiques précises.
        </p>
      </section>

      {/* Module Pneumologie */}
      <section className="space-y-6">
        <ModuleTitle
          icon={<Stethoscope />}
          title="Module Pneumologie CT — Analyse et quantification expertes"
        />

        <ModuleText>
          <Feature
            icon={<Layers />}
            title="Segmentation régionale contrôlée"
          >
            Logique angulaire et radiale pour une analyse spatiale fine du
            parenchyme
          </Feature>
          <Feature
            icon={<FileSpreadsheet />}
            title="Scores quantitatifs explicites"
          >
            Fibrose, emphysème et atteintes mixtes avec résultats traçables
          </Feature>
          <Feature icon={<Eye />} title="Lecture experte assistée">
            Structuration de l’information sans substitution au raisonnement
            clinique
          </Feature>
        </ModuleText>

        <ImageBlock>
          <SecureZoomImage
            src={`${RAW_BASE}/outils/pneumo.png`}
            alt="Analyse quantitative du parenchyme pulmonaire en scanner thoracique"
          />
        </ImageBlock>
      </section>

      {/* Module CT Spectral */}
      <section className="space-y-6">
        <ModuleTitle
          icon={<Atom />}
          title="Module CT Spectral — Exploration multi-énergie"
        />

        <ModuleText>
          <Feature icon={<Microscope />} title="Images mono-énergie">
            Reconstructions à différents niveaux d’énergie
          </Feature>
          <Feature icon={<Blend />} title="Cartographies matériaux">
            Zeff, iode et premières briques de décomposition
          </Feature>
          <Feature icon={<Layers />} title="Fusion multicanal">
            Superposition contrôlée sur l’anatomie
          </Feature>
        </ModuleText>

        <ImageBlock>
          <SecureZoomImage
            src={`${RAW_BASE}/outils/spectral.png`}
            alt="Cartographies matériaux et imagerie CT spectrale"
          />
        </ImageBlock>
      </section>

      {/* Positionnement */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-semibold">Positionnement général</h2>

        <p className="text-muted-foreground leading-relaxed">
          Approche fondée sur la compréhension fine du signal, des métadonnées
          DICOM, de la géométrie et des unités physiques, avec séparation claire
          entre visualisation, segmentation et quantification.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Feature icon={<Settings />} title="Développement sur mesure">
            Outils spécifiques adaptés à vos besoins
          </Feature>
          <Feature icon={<Database />} title="Audit de pipelines">
            Validation ou adaptation de chaînes existantes
          </Feature>
          <Feature icon={<Ruler />} title="Préparation de données">
            Données robustes pour analyses quantitatives
          </Feature>
          <Feature icon={<Eye />} title="Transparence méthodologique">
            Indépendance vis-à-vis des solutions propriétaires
          </Feature>
        </div>

        <p className="text-center text-sm italic text-muted-foreground pt-4 border-t border-border">
          Chaque outil est conçu comme un objet méthodologique interprétable —
          jamais comme une boîte noire.
        </p>
      </section>
    </div>
  );
};

export default OutilsViewer;

/* ============================================================
   Sous-composants UI
============================================================ */

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