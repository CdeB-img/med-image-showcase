/ src/components/PerfusionSegmentationViewer.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Crosshair,
  SlidersHorizontal,
  Layers,
  CheckCircle,
  Brain,
  FlaskConical,
  Database,
  Microscope,
  MessageSquare,
  Target,
  Eye,
  AlertTriangle,
  Zap,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QCViewer from "@/components/QCViewer";

/* ============================================================
   TYPES
============================================================ */

interface ImagePair {
  label: string;
  native: string[];
  mask: string[];
}

interface Props {
  pairs: ImagePair[];
  className?: string;
}

/* ============================================================
   STATIC CONTENT
============================================================ */

const keyFeatures = [
  {
    icon: Crosshair,
    title: "Segmentation automatique des lésions de perfusion",
    items: [
      "Pénombre, cœur ischémique, territoires à risque",
      "Approche mono- ou multi-seuil selon les paramètres étudiés"
    ]
  },
  {
    icon: SlidersHorizontal,
    title: "Paramétrabilité complète des seuils",
    items: [
      "Ajustement fin des critères de segmentation",
      "Exploration de scénarios sans recalcul du pipeline"
    ]
  },
  {
    icon: Layers,
    title: "Visualisation multi-cartes synchronisée",
    items: [
      "Lecture conjointe cartes / masques",
      "Détection immédiate d’incohérences spatiales"
    ]
  },
  {
    icon: CheckCircle,
    title: "Validation experte intégrée",
    items: [
      "Inspection slice-by-slice",
      "Contrôle physiopathologique avant quantification"
    ]
  }
];

const useCases = [
  { icon: Brain, text: "Perfusion cérébrale CT / IRM" },
  { icon: FlaskConical, text: "Comparaison de stratégies de seuillage" },
  { icon: Microscope, text: "Validation méthodologique" },
  { icon: Database, text: "Préparation de données quantitatives" }
];

const paramMaps = ["Tmax", "CBF", "OEF", "CMRO₂", "Diffusion"];

/* ============================================================
   COMPONENT
============================================================ */

export default function PerfusionSegmentationViewer({
  pairs,
  className
}: Props) {
  return (
    <div className={cn("space-y-16", className)}>

      {/* ======================================================
         HEADER
      ====================================================== */}
      <header className="max-w-5xl mx-auto text-center space-y-6 px-4">
        <Badge
          variant="outline"
          className="gap-1.5 px-3 py-1 border-cyan-500/30 bg-cyan-500/5 text-cyan-400"
        >
          <Activity className="w-3.5 h-3.5" />
          Perfusion
        </Badge>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Segmentation et analyse des lésions de perfusion CT / IRM
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed">
          Segmentation <span className="text-foreground font-medium">guidée par le signal</span>,
          basée sur des <span className="text-primary">seuils paramétrables</span> et
          validée visuellement à chaque étape.
        </p>
      </header>

      {/* ======================================================
        VIEWER — SECTION DOMINANTE
      ====================================================== */}
      <section className="w-full py-12">
        <div className="max-w-7xl mx-auto space-y-6 px-4">

          {/* En-tête viewer */}
          <div className="text-center space-y-2">
            <Badge variant="outline" className="gap-1.5">
              <Layers className="w-3 h-3" />
              Visualisation interactive
            </Badge>

            <h2 className="text-xl font-semibold">
              Exploration synchronisée cartes / masques
            </h2>

            <p className="text-sm text-muted-foreground">
              Navigation clavier • Superposition ajustable • Lecture physiopathologique
            </p>
          </div>

          {/* Conteneur ISOLÉ du viewer */}
          <div
            className={cn(
              "relative",                 // référentiel pour tous les absolute internes
              "w-full",
              "h-[75vh] min-h-[650px]",    // hauteur réelle de viewer
              "bg-card",
              "border border-border",
              "rounded-xl",
              "overflow-hidden"            // empêche toute fuite visuelle
            )}
          >
            <QCViewer
              pairs={pairs}
              patientName="Démonstration | Cartes de perfusion"
              className="w-full h-full"
            />
          </div>

        </div>
      </section>

      {/* ======================================================
         INTRO MÉTHODOLOGIQUE
      ====================================================== */}
      <section className="max-w-6xl mx-auto space-y-8 px-4">

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-primary">
                Objectif
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Identifier et quantifier des régions de perfusion pathologique
              dans un cadre méthodologique contrôlé et reproductible.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-cyan-400">
                Ce que montre le viewer
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Superposition des masques de segmentation
              sur les cartes paramétriques, slice par slice.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-muted/30 border border-border rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground italic">
            Il ne s’agit pas d’une classification binaire,
            mais d’une segmentation <span className="text-foreground font-medium">
              pilotée par le signal
            </span>.
          </p>
        </div>
      </section>

      {/* ======================================================
         PRINCIPE
      ====================================================== */}
      <section className="max-w-6xl mx-auto space-y-6 px-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Principe de l’approche</h2>
        </div>

        <p className="text-muted-foreground">
          La segmentation repose sur l’analyse conjointe de plusieurs cartes fonctionnelles :
        </p>

        <div className="flex flex-wrap gap-2">
          {paramMaps.map(m => (
            <Badge key={m} variant="outline">
              {m}
            </Badge>
          ))}
        </div>
      </section>

      {/* ======================================================
         FONCTIONNALITÉS
      ====================================================== */}
      <section className="max-w-6xl mx-auto space-y-8 px-4">
        <h2 className="text-xl font-semibold text-center">
          Fonctionnalités clés
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {keyFeatures.map(f => (
            <div
              key={f.title}
              className="bg-card/50 border border-border rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <f.icon className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-sm">{f.title}</h3>
              </div>
              <ul className="pl-8 space-y-1.5 text-sm text-muted-foreground">
                {f.items.map((i, idx) => (
                  <li key={idx}>– {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
         CAS D'USAGE
      ====================================================== */}
      <section className="max-w-6xl mx-auto space-y-6 px-4">
        <h2 className="text-xl font-semibold text-center">
          Cas d’usage
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {useCases.map(u => (
            <div
              key={u.text}
              className="flex items-center gap-3 bg-muted/30 border border-border rounded-lg p-4"
            >
              <u.icon className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">{u.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
         CTA
      ====================================================== */}
      <section className="max-w-3xl mx-auto text-center space-y-4 px-4 py-10 border-t border-border">
        <h3 className="text-lg font-semibold">
          Discuter d’un besoin spécifique
        </h3>
        <p className="text-sm text-muted-foreground">
          Ces exemples illustrent des cas réels de recherche clinique.
        </p>
        <Button variant="outline" asChild>
          <Link to="/contact">
            <MessageSquare className="w-4 h-4 mr-2" />
            Initier une discussion
          </Link>
        </Button>
      </section>

    </div>
  );
}

(screenshot) y a une bulle en trop qui limite le viewer. Sinon faudrait mettre un truc qui donne la possibilité de l'afficher en plein ecran un peu comme 
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

const RAW_BASE =
  "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";

interface OutilsViewerProps {
  className?: string;
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

const OutilsViewer: React.FC<OutilsViewerProps> = ({ className }) => {
  return (
    <div className={cn("space-y-20", className)}>
      {/* ===================== HEADER ===================== */}
      <header className="text-center space-y-6 mx-auto max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold">
          Développement d’outils sur mesure
        </h1>
        <p className="text-lg text-muted-foreground">
          Quantification robuste et prototypage méthodologique
        </p>
      </header>

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
            src={${RAW_BASE}/outils/pneumo.png}
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
            src={${RAW_BASE}/outils/spectral.png}
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