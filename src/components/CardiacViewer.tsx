// src/components/CardiacViewer.tsx

import * as React from "react";
import { cn } from "@/lib/utils";
const RAW_BASE = "https://raw.githubusercontent.com/CdeB-img/expert-imagerie/main/public/images";
interface Props {
  className?: string;
}
const CardiacViewer = ({
  className
}: Props) => {
  return <div className={cn("space-y-12", className)}>
      {/* Header */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          IRM Cardiaque — Analyse fonctionnelle, tissulaire et physiopathologique
        </h1>
        <p className="text-muted-foreground max-w-4xl leading-relaxed">
          Ce module présente une expertise approfondie en IRM cardiaque, couvrant l'analyse 
          fonctionnelle, la caractérisation tissulaire et l'exploration physiopathologique du myocarde, 
          dans des contextes cliniques, translationnels et de recherche.
        </p>
        <p className="text-muted-foreground max-w-4xl leading-relaxed">
          L'approche ne se limite pas à la visualisation d'images ou à des métriques standardisées, 
          mais vise une compréhension fine du signal IRM, de ses déterminants physiques et de sa 
          traduction physiologique.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 text-xs font-medium rounded-md border border-primary/50 text-primary">
            IRM Cardiaque
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
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            NiBabel
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            3D Slicer
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            OsiriX
          </span>
        </div>
      </div>

      {/* Section 1: Analyse fonctionnelle */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-primary">
            Analyse fonctionnelle multi-paramétrique
          </h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Les séquences ciné constituent la base de l'évaluation cardiaque, mais sont ici exploitées 
            au-delà du simple calcul de fraction d'éjection. L'analyse inclut les volumes ventriculaires 
            télédiastolique et télésystolique, la fraction d'éjection globale et segmentaire, 
            la cinétique régionale et la cohérence inter-plans.
          </p>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Cette lecture fonctionnelle est pensée comme un outil d'exploration dynamique, permettant 
            d'identifier des altérations subtiles de la contraction, parfois dissociées des anomalies 
            morphologiques visibles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Diastole */}
          <div className="space-y-3">
            <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
              <img src={`${RAW_BASE}/cardio/diastole.png`} alt="Télédiastole" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">Télédiastole</span>
              <p className="text-xs text-muted-foreground">Volume ventriculaire maximal</p>
            </div>
          </div>

          {/* Systole */}
          <div className="space-y-3">
            <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
              <img src={`${RAW_BASE}/cardio/systole.png`} alt="Télésystole" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">Télésystole</span>
              <p className="text-xs text-muted-foreground">Volume ventriculaire minimal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Caractérisation tissulaire */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-primary">
            Caractérisation tissulaire myocardique
          </h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            L'IRM cardiaque permet une exploration unique du tissu myocardique, au cœur de nombreuses 
            pathologies inflammatoires, infiltratives ou ischémiques. Le module intègre notamment 
            l'analyse du rehaussement tardif (LGE) pour la détection de fibrose, cicatrice ou nécrose.
          </p>
          <p className="text-sm text-muted-foreground max-w-3xl">L'évaluation distingue les atteintes sous-endocardiques, sous-épicardiques, transmurales, focales ou diffuses, ainsi que les zones de no-reflow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Base */}
          <div className="space-y-3">
            <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
              <img src={`${RAW_BASE}/cardio/base.png`} alt="Étage basal" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">Basal</span>
              <p className="text-xs text-muted-foreground">Niveau valvulaire mitral</p>
            </div>
          </div>

          {/* Mid */}
          <div className="space-y-3">
            <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
              <img src={`${RAW_BASE}/cardio/mid.png`} alt="Étage médio-ventriculaire" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">Médio-ventriculaire</span>
              <p className="text-xs text-muted-foreground">Niveau des muscles papillaires</p>
            </div>
          </div>

          {/* Apex */}
          <div className="space-y-3">
            <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border">
              <img src={`${RAW_BASE}/cardio/apex.png`} alt="Étage apical" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">Apical</span>
              <p className="text-xs text-muted-foreground">Apex ventriculaire</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Approches quantitatives */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-primary">
            Approches quantitatives et paramétriques
          </h2>
          <p className="text-sm text-muted-foreground max-w-3xl">Au-delà du rehaussement tardif, l'IRM cardiaque repose sur des mesures paramétriques quantitatives. Ce module s'inscrit dans cette dynamique avec l'exploitation de cartes (T1, T2, T2*), l'analyse des distributions de valeurs plutôt que de seuils arbitraires, et la comparaison intra-sujet dans des cadres longitudinaux.</p>
          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h4 className="font-medium text-sm mb-2">Pathologies explorées</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Myocardites aiguës et chroniques</li>
                <li>• Maladies infiltratives (surcharge, fibrose diffuse)</li>
                <li>• IDM</li>
                <li>• Modèles expérimentaux et précliniques</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h4 className="font-medium text-sm mb-2">Contextes d'application</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Cohortes cliniques complexes</li>
                <li>• Études translationnelles</li>
                <li>• Modèles animaux (petits et grands)</li>
                <li>• Protocoles multicentriques</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Intégration méthodologique */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-primary">
            Intégration méthodologique
          </h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            L'ensemble des analyses repose sur une maîtrise des formats IRM et de leurs métadonnées, 
            des outils de traitement transparents et traçables, et une séparation claire entre 
            acquisition, visualisation, segmentation et quantification.
          </p>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Une attention particulière est portée à la comparabilité inter-séquences, à la stabilité 
            des mesures et à la gestion des contraintes expérimentales et physiologiques spécifiques.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary border border-primary/20">
            Étude des maladies inflammatoires
          </span>
          <span className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary border border-primary/20">
            Évaluation thérapeutique
          </span>
          <span className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary border border-primary/20">
            Études longitudinales
          </span>
          <span className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary border border-primary/20">
            Validation de biomarqueurs IRM
          </span>
          <span className="px-4 py-2 text-sm rounded-full bg-primary/10 text-primary border border-primary/20">
            Préparation de données
          </span>
        </div>
      </section>

      {/* Conclusion */}
      <section className="p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
        <h3 className="text-lg font-semibold">Cadre méthodologique</h3>
        <p className="text-muted-foreground leading-relaxed">Cette approche reflète une pratique de l'IRM cardiaque orientée compréhension du signal et de son acquisition, ancrée dans la physiopathologie, indépendante des solutions propriétaires, et conçue pour la recherche exigeante autant que pour l'exploration clinique.</p>
        <p className="text-sm italic text-muted-foreground pt-4 border-t border-primary/20">
          L'IRM cardiaque n'est pas un simple outil d'imagerie. C'est un instrument de mesure 
          physiologique, dont la valeur dépend de la rigueur de l'analyse plus que de la 
          sophistication des algorithmes.
        </p>
      </section>
    </div>;
};
export default CardiacViewer;