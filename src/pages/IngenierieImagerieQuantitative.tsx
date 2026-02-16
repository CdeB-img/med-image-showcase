import React from "react";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import { 
  ArrowRight, 
  Workflow, 
  FileCode, 
  CheckCircle2, 
  Settings2, 
  Database,
  BarChart3,
  Layers
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/ingenierie-imagerie-quantitative";

const IngenierieImagerieQuantitative = () => {
  const qualityChecklist = [
    {
      title: "Versioning du code",
      detail: "Historique Git explicite pour relier chaque résultat à une version pipeline traçable.",
      tag: "Fondation"
    },
    {
      title: "Traçabilité des paramètres",
      detail: "Journalisation systématique des paramètres de pré-traitement, segmentation et extraction.",
      tag: "Audit"
    },
    {
      title: "Séparation inférence / mesure",
      detail: "Découplage des étapes IA et des calculs quantitatifs pour limiter les biais d’interprétation.",
      tag: "Méthodo"
    },
    {
      title: "Gestion des échecs",
      detail: "Fallbacks contrôlés, motifs d’échec documentés, et reprise robuste des traitements.",
      tag: "Résilience"
    },
    {
      title: "Reproductibilité binaire",
      detail: "Environnements conteneurisés pour reproduire exactement les sorties entre centres.",
      tag: "Multicentre"
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Ingénierie en imagerie quantitative IRM & CT",
    description:
      "Conception de pipelines robustes pour la segmentation, la normalisation, l’harmonisation multicentrique et l’extraction de biomarqueurs quantitatifs en IRM et CT.",
    about: [
      "Medical image processing pipelines",
      "DICOM to NIfTI conversion",
      "Multicenter imaging harmonization",
      "Quantitative MRI",
      "Quantitative CT",
      "Image normalization",
      "Reproducible biomarkers"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    url: CANONICAL
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Ingénierie de pipelines d’imagerie quantitative",
    serviceType: [
      "Audit DICOM multicentrique",
      "Conception pipeline IRM",
      "Conception pipeline CT",
      "Harmonisation inter-constructeurs",
      "Extraction biomarqueurs reproductibles"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    areaServed: "Europe",
    url: CANONICAL,
    description:
      "Structuration, versioning et validation de pipelines IRM et CT pour biomarqueurs quantitativement robustes et auditables."
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Ingénierie quantitative", item: CANONICAL }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Pourquoi un pipeline structuré est-il indispensable en recherche multicentrique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Parce que la variabilité inter-centre peut dépasser l’effet biologique étudié. Un pipeline versionné et conteneurisé garantit la reproductibilité mathématique du traitement."
        }
      },
      {
        "@type": "Question",
        name: "La segmentation automatique suffit-elle pour produire un biomarqueur robuste ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Non. La segmentation doit être intégrée dans une architecture incluant audit DICOM, normalisation, validation géométrique et analyse de reproductibilité."
        }
      },
      {
        "@type": "Question",
        name: "Quelle est la différence entre ingénierie et simple post-traitement ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "L’ingénierie formalise l’ensemble de la chaîne méthodologique, assure la traçabilité des paramètres et permet l’audit scientifique des résultats."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Ingénierie en Imagerie Quantitative IRM & CT | NOXIA</title>
        <meta
          name="description"
          content="Architecture de pipelines reproductibles en IRM et CT : conversion DICOM, normalisation du signal, segmentation multi-seuils, harmonisation multicentrique."
        />
        <link rel="canonical" href={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-24">
            
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "Ingénierie quantitative" }
              ]}
            />

            {/* HERO */}
            <section className="text-center space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Ingénierie en imagerie quantitative
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                Conception de pipelines méthodologiques robustes pour transformer
                des données DICOM hétérogènes en biomarqueurs
                scientifiquement défendables.
              </p>
            </section>

            {/* CONCEPT CLÉ : PIPELINE */}
            <section className="rounded-2xl border border-border bg-card/50 p-10 space-y-6">
              <div className="flex items-center gap-3 font-semibold text-foreground text-lg">
                <Workflow className="w-6 h-6 text-primary"/>
                Au-delà de la segmentation : L'architecture
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Un biomarqueur d’imagerie n’est pas un simple masque binaire. 
                Il est le résultat d’une chaîne complète : contrôle des métadonnées, 
                cohérence géométrique, normalisation du signal, post-traitement morphologique 
                et extraction métrique. L'ingénierie vise à rendre cette chaîne 
                explicite, versionnée et reproductible.
              </p>
            </section>

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Robustesse statistique et reproductibilité
              </h2>

              <p>
                Un pipeline structuré permet de réduire la variance technique inter-centre,
                d’améliorer le signal-to-noise biologique et d’optimiser la puissance statistique
                des essais cliniques.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Analyse ICC et coefficient de variation</li>
                <li>Validation inter-scanner et inter-séquence</li>
                <li>Contrôle géométrique (spacing, orientation, FOV)</li>
                <li>Logs et export reproductibles (CSV, NIfTI, rapports QA)</li>
              </ul>

              <p>
                Cette approche complète les travaux en
                <Link to="/ct-imagerie-quantitative" className="text-primary hover:underline">
                  CT quantitatif
                </Link>{" "}
                et en{" "}
                <Link to="/irm-imagerie-quantitative" className="text-primary hover:underline">
                  IRM quantitative
                </Link>.
              </p>
            </section>
            {/* MÉTHODOLOGIE */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-primary" />
                Méthodologie : du DICOM brut au biomarqueur opposable
              </div>

              <p className="text-muted-foreground leading-relaxed">
                La valeur d’un pipeline n’est pas d’« exécuter un script », mais de rendre chaque étape
                explicite, testable et traçable : hypothèses, paramètres, qualité des entrées, contrôles
                de sortie, et gestion des cas non conformes.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Layers className="w-5 h-5 text-primary" />
                    Principes non négociables
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Audit DICOM systématique (géométrie, métadonnées, séries, cohérence temporelle)</li>
                    <li>Séparation <strong className="text-foreground">inférence</strong> / <strong className="text-foreground">mesure</strong></li>
                    <li>Versioning code + paramètres + dépendances (environnement figé)</li>
                    <li>Contrôles QA entrée/sortie + critères d’exclusion documentés</li>
                    <li>Livrables opposables (tables + masques + overlays + logs)</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Gestion des cas difficiles
                  </div>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>DICOM incomplets / séries non conformes / anonymisation destructrice</li>
                    <li>Incohérences spacing/orientation/FOV, obliques non attendues</li>
                    <li>Défauts de recalage, artefacts, mouvement, truncation (perfusions)</li>
                    <li>Dérive de calibration CT ou dérive d’intensité IRM</li>
                    <li>Échecs IA : détection, fallback, et signalement systématique</li>
                  </ul>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Voir <Link to="/analyse-dicom" className="text-primary hover:underline">Analyse DICOM</Link>,
                <span> </span>
                <Link to="/bases-multicentriques" className="text-primary hover:underline">Bases multicentriques</Link>,
                <span> </span>
                et <Link to="/recalage-multimodal" className="text-primary hover:underline">Recalage multimodal</Link>.
              </p>
            </section>
            {/* LES ÉTAPES (Liste visuelle) */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture type d’un pipeline
              </h2>
              
              <div className="grid md:grid-cols-2 gap-12 items-start">
                
               <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-6">
  <h3 className="font-semibold text-foreground flex items-center gap-2">
    <Workflow className="w-5 h-5 text-primary" />
    Maillage du pipeline
  </h3>

  <p className="text-muted-foreground leading-relaxed">
    Nous déployons des solutions conteneurisées afin que le traitement appliqué au patient A
    du centre 1 soit mathématiquement identique à celui du patient B du centre 10.
    L’objectif est de stabiliser l’algorithme <em>et</em> l’environnement.
  </p>

  <ul className="space-y-4 pt-2">
    <li className="flex gap-4">
      <FileCode className="w-6 h-6 text-primary shrink-0" />
      <div>
        <strong className="text-foreground block text-sm">Standardisation des données</strong>
        <span className="text-sm text-muted-foreground">
          Audit DICOM, anonymisation structurée, conversion NIfTI contrôlée, conventions de nommage.
        </span>
      </div>
    </li>

    <li className="flex gap-4">
      <Settings2 className="w-6 h-6 text-primary shrink-0" />
      <div>
        <strong className="text-foreground block text-sm">Pré-traitement & normalisation</strong>
        <span className="text-sm text-muted-foreground">
          Resampling géométrique, correction de biais, normalisation d’intensité/énergie, masques/exclusions.
        </span>
      </div>
    </li>

    <li className="flex gap-4">
      <Database className="w-6 h-6 text-primary shrink-0" />
      <div>
        <strong className="text-foreground block text-sm">Extraction, QA & livrables</strong>
        <span className="text-sm text-muted-foreground">
          Métriques, exports (CSV/Excel/NIfTI/DICOM), overlays QC, logs, et synthèse par patient/temps.
        </span>
      </div>
    </li>
  </ul>
</div>

                <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card/80 to-primary/5 p-8 space-y-6 h-full shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Checklist Qualité
                    </h3>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      5 contrôles actifs
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Chaque pipeline livré inclut ces garde-fous pour garantir l’auditabilité scientifique,
                    la robustesse opérationnelle et la comparabilité inter-centres.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Couverture QA</p>
                      <p className="text-lg font-semibold text-foreground">100%</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Sortie</p>
                      <p className="text-lg font-semibold text-foreground">Audit-ready</p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {qualityChecklist.map((item) => (
                      <li key={item.title} className="rounded-xl border border-border/70 bg-card/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-foreground">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-sm font-medium">{item.title}</span>
                          </div>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {item.tag}
                          </span>
                        </div>
                        <p className="mt-2 pl-6 text-xs leading-relaxed text-muted-foreground">
                          {item.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </section>

            {/* APPLICATION IRM vs CT */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground text-center">
                Spécificités par modalité
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                
                {/* BLOC IRM */}
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Application IRM</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    En IRM, l'intensité du signal est arbitraire. La normalisation est critique.
                  </p>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>Normalisation médiane + IQR</li>
                    <li>Référence tissu sain controlatéral</li>
                    <li>Seeds physiopathologiques pour segmentation</li>
                    <li>Harmonisation des champs de vue</li>
                  </ul>
                  <div className="pt-2">
                     <Link to="/segmentation-irm" className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1">
                      Voir Segmentation IRM <ArrowRight className="w-3 h-3"/>
                    </Link>
                  </div>
                </div>

                {/* BLOC CT */}
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Application CT</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    En CT, le signal est physique mais instable. La calibration est critique.
                  </p>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>Contrôle des kernels de reconstruction</li>
                    <li>Calibration phantom (Eau / Matériaux)</li>
                    <li>Harmonisation inter-constructeurs (GE/Siemens)</li>
                    <li>Décomposition spectrale</li>
                  </ul>
                   <div className="pt-2">
                     <Link to="/ct-imagerie-quantitative" className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1">
                      Voir Quantification CT <ArrowRight className="w-3 h-3"/>
                    </Link>
                  </div>
                </div>

              </div>
            </section>

            {/* ORDRES DE GRANDEUR – LITTÉRATURE */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-primary" />
                Ordres de grandeur rapportés : pourquoi l’ingénierie compte
              </div>

              <p className="text-muted-foreground leading-relaxed">
                En imagerie quantitative, deux pipelines « plausibles » peuvent produire des biomarqueurs
                suffisamment différents pour impacter des analyses multicentriques. L’amplitude dépend du protocole,
                de la modalité, du constructeur et du post-traitement.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">IRM</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Variations inter-centres dues aux séquences, champs, corrections et normalisation.</li>
                    <li>Gains majeurs quand références, métriques robustes et QA sont explicités.</li>
                    <li>Reproductibilité améliorée quand la mesure est dissociée de la visualisation.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">CT</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Variations liées aux kernels, IR, énergie effective et implémentations constructeurs.</li>
                    <li>La calibration phantom + traçabilité réduisent les biais systématiques.</li>
                    <li>En spectral, sensibilité accrue aux erreurs de décomposition/calibration.</li>
                  </ul>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Objectif : stabiliser la variance technique avant d’interpréter la variance biologique.
              </p>
            </section>
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes – Ingénierie quantitative
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Pourquoi conteneuriser un pipeline ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    La conteneurisation garantit que l’environnement logiciel est strictement
                    identique entre centres, évitant les dérives liées aux dépendances.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">
                    Comment assurer la traçabilité des paramètres ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Par versioning Git, horodatage des traitements et stockage structuré
                    des paramètres d’inférence et de post-traitement.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 md:col-span-2">
                  <h3 className="font-semibold">
                    Un pipeline peut-il être audité scientifiquement ?
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Oui. La séparation inférence / mesure, la conservation des logs et la
                    reproductibilité binaire permettent une auditabilité complète.
                  </p>
                </div>
              </div>
            </section>
            {/* GLOSSAIRE */}
            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Acronymes & livrables</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-muted-foreground">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">QA / QC</div>
                  <p className="text-sm">Contrôle qualité : cohérences, alertes, exclusions et justification.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">ICC / CV</div>
                  <p className="text-sm">Reproductibilité : intraclass correlation / coefficient de variation.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">DICOM / NIfTI</div>
                  <p className="text-sm">Standard clinique vs format analytique ; conversion contrôlée et traçable.</p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">Overlays</div>
                  <p className="text-sm">Images QC : masques/contours superposés pour relecture.</p>
                </div>
              </div>

              <p className="text-muted-foreground">
                Livrables typiques : masques (NIfTI/DICOM selon besoin), tableaux patient/temps (CSV/Excel),
                exports de métriques, logs, et un dossier QC structuré.
              </p>
            </section>

            {/* PAGES ASSOCIÉES */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages associées</h2>

              <div className="flex flex-wrap gap-3">
                <Link to="/analyse-dicom" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Analyse DICOM <ArrowRight className="w-4 h-4" />
                </Link>

                <Link to="/bases-multicentriques" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Bases multicentriques <ArrowRight className="w-4 h-4" />
                </Link>

                <Link to="/recalage-multimodal" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Recalage multimodal <ArrowRight className="w-4 h-4" />
                </Link>

                <Link to="/irm-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  IRM quantitative <ArrowRight className="w-4 h-4" />
                </Link>

                <Link to="/ct-imagerie-quantitative" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  CT quantitatif <ArrowRight className="w-4 h-4" />
                </Link>

                <Link to="/segmentation-irm" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition">
                  Segmentation <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
            {/* CTA */}
            <section className="text-center space-y-6 pt-8">
              <p className="text-muted-foreground max-w-2xl mx-auto">
                L’imagerie devient un outil décisionnel quantitatif, structuré et audit-able, 
                plutôt qu’un simple support visuel.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Définir une architecture
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default IngenierieImagerieQuantitative;
