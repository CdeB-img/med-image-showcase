// src/components/PerfusionSegmentationViewer.tsx

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
  Activity,
  Scan
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

const keyFeatures = [
  {
    icon: Crosshair,
    title: "Segmentation automatique des lésions de perfusion",
    items: ["Pénombre, cœur ischémique, territoires à risque", "Approche mono- ou multi-seuil selon les paramètres étudiés"]
  },
  {
    icon: SlidersHorizontal,
    title: "Paramétrabilité complète des seuils",
    items: ["Ajustement fin des critères de segmentation", "Exploration de plusieurs scénarios sans recalcul lourd du pipeline"]
  },
  {
    icon: Layers,
    title: "Visualisation multi-cartes synchronisée",
    items: ["Lecture conjointe des cartes de perfusion et des masques générés", "Détection immédiate des incohérences spatiales ou physiologiques"]
  },
  {
    icon: CheckCircle,
    title: "Validation experte intégrée",
    items: ["Inspection slice-by-slice", "Vérification de la cohérence anatomique et fonctionnelle avant quantification"]
  }
];

const useCases = [
  { icon: Brain, text: "Études de perfusion cérébrale (CT ou IRM)" },
  { icon: FlaskConical, text: "Comparaison de stratégies de seuillage" },
  { icon: Microscope, text: "Validation de méthodologies de segmentation" },
  { icon: Database, text: "Préparation de données pour analyses quantitatives ou modèles d'apprentissage" }
];

const paramMaps = [
  { label: "Tmax", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { label: "CBF", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { label: "OEF", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { label: "CMRO₂", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  { label: "Diffusion", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
];

export default function PerfusionSegmentationViewer({ pairs, className }: Props) {
  return (
    <div className={cn("space-y-12", className)}>
      {/* Header */}
      <header className="space-y-6 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-sm border-primary/30 bg-primary/5">
            <Scan className="w-3.5 h-3.5" />
            Segmentation experte
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-sm border-cyan-500/30 bg-cyan-500/5 text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
            Perfusion
          </Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Segmentation et analyse des lésions de perfusion CT/IRM
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Approche experte de la <span className="text-foreground font-medium">segmentation automatique</span> des lésions de perfusion cérébrale 
          en imagerie CT et IRM, basée sur des <span className="text-primary">seuils paramétrables</span> et une validation 
          physiopathologique rigoureuse.
        </p>
      </header>

      {/* Intro Viewer - Restructured with icons */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Objectif */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-primary">Objectif</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed pl-10">
              Identifier et quantifier des régions de <span className="text-foreground font-medium">perfusion pathologique</span> à partir d'IRM multi-paramétriques, dans un cadre méthodologique reproductible.
            </p>
          </div>

          {/* Ce que montre le viewer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Eye className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-cyan-400">Ce que montre le viewer</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed pl-10">
              Segmentation des régions de perfusion (<span className="text-foreground">cœur de lésion</span>, zones périphériques, régions de référence) et leur superposition sur les cartes paramétriques.
            </p>
          </div>
        </div>

        {/* Note importante */}
        <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground italic">
            Cette approche ne correspond pas à une classification binaire simpliste, mais à une <span className="text-amber-400 font-medium">segmentation guidée par le signal</span> et la compréhension physiopathologique.
          </p>
        </div>
      </section>

      {/* Principe - Enhanced with badges */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Principe de l'approche</h2>
        </div>

        <p className="text-muted-foreground">
          La segmentation des lésions de perfusion repose sur :
        </p>

        {/* Cartes paramétriques badges */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">Cartes fonctionnelles exploitées :</p>
          <div className="flex flex-wrap gap-2">
            {paramMaps.map(map => (
              <Badge key={map.label} variant="outline" className={cn("px-3 py-1", map.color)}>
                {map.label}
              </Badge>
            ))}
          </div>
        </div>

        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span>Des <span className="text-foreground font-medium">seuils ajustables</span>, définis selon les objectifs de l'étude (clinique, recherche, validation méthodologique)</span>
          </li>
          <li className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span>Une approche <span className="text-cyan-400 font-medium italic">signal-driven</span>, sans post-traitement arbitraire masquant la réalité physiologique</span>
          </li>
        </ul>

        <p className="text-sm text-muted-foreground/80 italic border-l-2 border-primary/50 pl-4 mt-4">
          L'outil permet une visualisation synchronisée image / masque, garantissant une lecture directe 
          de l'impact des choix de seuils sur la segmentation finale.
        </p>
      </section>

      {/* Interactive Viewer */}
      <section className="space-y-4">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="gap-1.5 mb-2">
            <Layers className="w-3 h-3" />
            Visualisation interactive
          </Badge>
          <h2 className="text-xl font-semibold">Explorer les cartes de perfusion</h2>
          <p className="text-sm text-muted-foreground">
            Navigation clavier synchronisée • Superposition masque/image ajustable
          </p>
        </div>
        <QCViewer 
          pairs={pairs} 
          patientName="Démonstration | Cartes de perfusion" 
          className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6" 
        />
      </section>

      {/* Fonctionnalités clés */}
      <section className="space-y-6">
        <div className="text-center">
          <Badge variant="outline" className="gap-1.5 mb-3">
            <CheckCircle className="w-3 h-3" />
            Fonctionnalités
          </Badge>
          <h2 className="text-xl font-semibold">Fonctionnalités clés</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {keyFeatures.map(feature => (
            <div 
              key={feature.title} 
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-sm">{feature.title}</h3>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground pl-12">
                {feature.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">–</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="space-y-6">
        <div className="text-center">
          <Badge variant="outline" className="gap-1.5 mb-3">
            <FlaskConical className="w-3 h-3" />
            Applications
          </Badge>
          <h2 className="text-xl font-semibold">Cas d'usage</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {useCases.map(useCase => (
            <div 
              key={useCase.text} 
              className="flex items-center gap-3 bg-gradient-to-br from-card/80 to-card/40 border border-border/50 rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <useCase.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{useCase.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Positionnement */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Microscope className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Cadre méthodologique</h2>
        </div>
        <p className="text-muted-foreground">
          Ce module présente une expertise de la chaîne de segmentation des lésions de perfusion, depuis le signal brut jusqu'aux masques exploitables.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-sm text-muted-foreground">Indépendante des solutions propriétaires</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-sm text-muted-foreground">Orientée compréhension physiopathologique</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-sm text-muted-foreground">Résultats traçables et reproductibles</span>
          </div>
        </div>
      </section>

      {/* Message clé */}
      <section className="text-center space-y-4 py-8 border-t border-border">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Message clé</span>
        </div>
        <p className="text-xl font-semibold">
          La segmentation n'est pas une boîte noire.
        </p>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Chaque masque est le résultat de <span className="text-foreground font-medium">choix explicites</span>, justifiés et contrôlés.
        </p>
      </section>

      {/* CTA Contact */}
      <section className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-sm">
          <MessageSquare className="w-3.5 h-3.5 text-primary" />
          <span className="text-primary">Discussion</span>
        </div>
        <h3 className="text-lg font-semibold">Discuter d'un besoin spécifique</h3>
        <p className="text-sm text-muted-foreground">
          Ces exemples illustrent des cas réels rencontrés en recherche clinique.
          Pour discuter d'un projet, d'un jeu de données ou d'une problématique méthodologique, vous pouvez me contacter.
        </p>
        <Button variant="outline" asChild className="mt-2 gap-2">
          <Link to="/contact">
            <MessageSquare className="w-4 h-4" />
            Initier une discussion
          </Link>
        </Button>
      </section>
    </div>
  );
}