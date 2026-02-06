// src/components/PerfusionSegmentationViewer.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Crosshair, SlidersHorizontal, Layers, CheckCircle, Brain, FlaskConical, Database, Microscope, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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
const keyFeatures = [{
  icon: Crosshair,
  title: "Segmentation automatique des lésions de perfusion",
  items: ["Pénombre, cœur ischémique, territoires à risque", "Approche mono- ou multi-seuil selon les paramètres étudiés"]
}, {
  icon: SlidersHorizontal,
  title: "Paramétrabilité complète des seuils",
  items: ["Ajustement fin des critères de segmentation", "Exploration de plusieurs scénarios sans recalcul lourd du pipeline"]
}, {
  icon: Layers,
  title: "Visualisation multi-cartes synchronisée",
  items: ["Lecture conjointe des cartes de perfusion et des masques générés", "Détection immédiate des incohérences spatiales ou physiologiques"]
}, {
  icon: CheckCircle,
  title: "Validation experte intégrée",
  items: ["Inspection slice-by-slice", "Vérification de la cohérence anatomique et fonctionnelle avant quantification"]
}];
const useCases = [{
  icon: Brain,
  text: "Études de perfusion cérébrale (CT ou IRM)"
}, {
  icon: FlaskConical,
  text: "Comparaison de stratégies de seuillage"
}, {
  icon: Microscope,
  text: "Validation de méthodologies de segmentation"
}, {
  icon: Database,
  text: "Préparation de données pour analyses quantitatives ou modèles d'apprentissage"
}];
export default function PerfusionSegmentationViewer({
  pairs,
  className
}: Props) {
  return <div className={cn("space-y-12", className)}>
      {/* Header */}
      <header className="space-y-6 text-center max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Segmentation experte et analyse des lésions de perfusion CT/IRM
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Approche experte de la segmentation automatique des lésions de perfusion cérébrale 
          en imagerie CT et IRM, basée sur des seuils paramétrables et une validation 
          physiopathologique rigoureuse.
        </p>
      </header>

      {/* Intro Viewer */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold">Segmentation et quantification des lésions de perfusion</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <p>Objectif du module : Identifier et quantifier des régions de perfusion pathologique à partir d'IRM multi-paramétriques, dans un cadre méthodologique reproductible.<strong>Objectif du module</strong> | Identifier et quantifier des régions de perfusion pathologique à partir d'IRM multi-paramétriques, dans un cadre méthodologique reproductible.
          </p>
          <p>Ce que montre le viewer : Segmentation des régions de perfusio et leur superposition sur les cartes paramétriques.<strong>Ce que montre le viewer</strong> | Segmentation des régions de perfusion (cœur de lésion, zones périphériques, régions de référence) et leur superposition sur les cartes paramétriques.
          </p>
          <p className="text-sm italic border-l-2 border-primary/50 pl-4">
            Cette approche ne correspond pas à une classification binaire simpliste, mais à une segmentation guidée par le signal et la compréhension physiopathologique.
          </p>
        </div>
      </section>

      {/* Principe */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Principe de l'approche</h2>
        <p className="text-muted-foreground">
          La segmentation des lésions de perfusion repose sur :
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>L'exploitation conjointe de plusieurs cartes fonctionnelles (Tmax, CBF, OEF, CMRO₂, diffusion)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Des seuils ajustables, définis selon les objectifs de l'étude (clinique, recherche, validation méthodologique)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>guidée par le signal<em>signal-driven</em>, sans post-traitement arbitraire masquant la réalité physiologique</span>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground/80 italic border-l-2 border-primary/50 pl-4 mt-4">
          L'outil permet une visualisation synchronisée image / masque, garantissant une lecture directe 
          de l'impact des choix de seuils sur la segmentation finale.
        </p>
      </section>

      {/* Interactive Viewer */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Visualisation interactive</h2>
        <p className="text-sm text-muted-foreground text-center">
      </p>
        <QCViewer pairs={pairs} patientName="Démonstration | Cartes de perfusion" className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6" />
      </section>

      {/* Fonctionnalités clés */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-center">Fonctionnalités clés</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {keyFeatures.map(feature => <div key={feature.title} className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium">{feature.title}</h3>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground pl-12">
                {feature.items.map((item, i) => <li key={i} className="flex items-start gap-2">
                    <span className="text-primary/60">–</span>
                    <span>{item}</span>
                  </li>)}
              </ul>
            </div>)}
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-center">Cas d'usage</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {useCases.map(useCase => <div key={useCase.text} className="flex items-center gap-3 bg-card/30 border border-border/50 rounded-lg p-4">
              <useCase.icon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">{useCase.text}</span>
            </div>)}
        </div>
      </section>

      {/* Positionnement */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Cadre méthodologique</h2>
        <p className="text-muted-foreground">Ce module présente une expertise de la chaîne de segmentation des lésions de perfusion, depuis le signal brut jusqu'au masque exploitables.</p>
        <p className="text-muted-foreground">L'approche est :</p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Indépendante des solutions propriétaires</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Orientée compréhension physiopathologique</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Conçue pour produire des résultats traçables, interprétables et reproductibles</span>
          </li>
        </ul>
      </section>

      {/* Message clé */}
      <section className="text-center space-y-4 py-8 border-t border-border">
        <p className="text-lg font-medium">
          La segmentation n'est pas une boîte noire.
        </p>
        <p className="text-muted-foreground">
          Chaque masque est le résultat de choix explicites, justifiés et contrôlés.
        </p>
      </section>

      {/* CTA Contact */}
      <section className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4 max-w-2xl mx-auto text-center">
        <h3 className="text-lg font-semibold">Discuter d'un besoin spécifique</h3>
        <p className="text-sm text-muted-foreground">
          Ces exemples illustrent des cas réels rencontrés en recherche clinique.
          Pour discuter d'un projet, d'un jeu de données ou d'une problématique méthodologique, vous pouvez me contacter.
        </p>
        <Button variant="outline" asChild className="mt-2">
          <Link to="/contact" className="inline-flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Initier une discussion
          </Link>
        </Button>
      </section>
    </div>;
}