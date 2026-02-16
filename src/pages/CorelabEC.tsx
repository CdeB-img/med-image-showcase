import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  ShieldCheck,
  Database,
  Workflow,
  BarChart3,
  Layers,
  Microscope,
  AlertTriangle
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/corelab-essais-cliniques";

const CorelabEC = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Core Lab IRM cardiovasculaire pour essais cliniques multicentriques",
    description:
      "Structuration d'endpoints IRM cardiovasculaires reproductibles : LGE, MVO, ECV, volumes ventriculaires et remodelage, avec harmonisation multicentrique.",
    about: [
      "Cardiovascular MRI Core Lab",
      "Late Gadolinium Enhancement",
      "Microvascular Obstruction",
      "Extracellular Volume",
      "Multicenter imaging harmonization"
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
    "@type": "ProfessionalService",
    name: "Core Lab IRM cardiovasculaire pour essais cliniques multicentriques",
    url: CANONICAL,
    areaServed: "Europe",
    serviceType: [
      "Cardiovascular MRI Core Lab",
      "Imaging surrogate endpoints",
      "Multicenter harmonization",
      "ECV validation",
      "LGE quantification",
      "MVO assessment",
      "Left ventricular remodeling analysis"
    ],
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "IRM", item: "https://noxia-imagerie.fr/irm-imagerie-quantitative" },
      { "@type": "ListItem", position: 4, name: "Core Lab IRM essais cliniques", item: CANONICAL }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Pourquoi un Core Lab est-il indispensable en essai multicentrique ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Parce que la variabilité inter-centre peut dépasser l'effet traitement. Un Core Lab standardise acquisition, segmentation, seuils et exports pour réduire la dispersion statistique de l'endpoint."
        }
      },
      {
        "@type": "Question",
        name: "Quelle variabilité peut-on attendre en IRM cardiaque sans harmonisation ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "La littérature rapporte des variabilités inter-observateur de l'ordre de 5 à 15% pour certaines mesures comme le LGE. Une lecture centralisée et des règles formalisées permettent de réduire cette dispersion."
        }
      },
      {
        "@type": "Question",
        name: "Un biomarqueur IRM peut-il devenir un endpoint primaire ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Oui, si la métrique est définie, reproductible, physiopathologiquement pertinente et auditée dans un cadre méthodologique multicentrique strict."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Core Lab IRM cardiovasculaire pour essais cliniques multicentriques | NOXIA</title>
        <meta
          name="description"
          content="Core Lab IRM cardiovasculaire pour essais randomisés : structuration d'endpoints LGE, MVO, ECV et remodelage VG, harmonisation multicentrique et validation méthodologique publication-ready."
        />
        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-20">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "IRM", path: "/irm-imagerie-quantitative" },
                { label: "Core Lab IRM essais cliniques" }
              ]}
            />

            {/* HERO */}
            <ExpertiseHero
              badge="Lecture centralisée IRM"
              badgeIcon={Workflow}
              title="Core Lab IRM cardiovasculaire multicentrique"
              description="Structuration d'endpoints quantitatifs robustes (LGE, MVO, ECV, volumes ventriculaires, remodelage VG), harmonisation inter-centres et traçabilité complète du pipeline."
              chips={["Essais cliniques", "Endpoints robustes", "Traçabilité"]}
              actions={[
                { label: "Structurer un Core Lab", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir IRM quantitative", to: "/irm-imagerie-quantitative", variant: "secondary", icon: Database },
              ]}
            />

            {/* TLDR */}
            <section className="grid md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Reproductibilité
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Cadre de lecture harmonisé, règles de segmentation formalisées et QA continue
                  pour réduire la variabilité inter-observateur et inter-centre.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Workflow className="w-5 h-5 text-primary" />
                  Architecture pipeline
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Audit DICOM, contrôle géométrique, inférence/mesure séparées,
                  livrables versionnés et auditables.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Database className="w-5 h-5 text-primary" />
                  Multicentrique
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Harmonisation des pratiques entre centres, constructeurs et sequences
                  pour stabiliser l'endpoint statistique.
                </p>
              </div>
            </section>

            {/* POSITIONNEMENT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Du signal IRM au surrogate endpoint opposable
              </h2>

              <p>
                En essai thérapeutique cardiovasculaire, l'effet traitement peut être plus faible
                que la variabilité technique de mesure. Sans standardisation stricte,
                l'endpoint d'imagerie perd sa puissance statistique.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Définition explicite des endpoints primaires et secondaires</li>
                <li>Règles de segmentation et de seuils formalisées (SD, FWHM, etc.)</li>
                <li>Séparation lecture, mesure, et interprétation clinique</li>
                <li>Traçabilité complète (versioning code + paramètres + exports)</li>
                <li>Archivage QA structuré pour audit scientifique</li>
              </ul>

              <p>
                Cette logique s'inscrit dans une architecture globale d'
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  ingénierie en imagerie quantitative
                </Link>
                .
              </p>
            </section>

            {/* WORKFLOW + CHECKLIST */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture type d'un Core Lab IRM
              </h2>

              <div className="grid md:grid-cols-2 gap-6 items-stretch">
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Workflow opérationnel
                  </h3>

                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>1. Qualification des données DICOM et des séquences par centre</li>
                    <li>2. Standardisation des règles de lecture et des ROI</li>
                    <li>3. Extraction LGE, MVO, ECV, volumes VG et remodelage</li>
                    <li>4. QA intra-centre et inter-centre sur les metriques critiques</li>
                    <li>5. Exports statistiquement exploitables (CSV/Excel + overlays QC)</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4 h-full">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Checklist qualité
                  </h3>

                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>Règles de segmentation documentées et versionnées</li>
                    <li>Double lecture ou adjudication pour cas litigieux</li>
                    <li>Contrôle des exclusions (artefacts, mauvaise inversion, SNR insuffisant)</li>
                    <li>Traçabilité des ajustements de seuils et des reruns</li>
                    <li>Journal d'audit conservant décisions et versions de pipeline</li>
                  </ul>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Cette architecture prolonge l'
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  audit DICOM
                </Link>
                {" "}et s'inscrit dans une logique de
                {" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  bases multicentriques harmonisées
                </Link>
                .
              </p>
            </section>

            {/* ENDPOINTS */}
            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground text-center">
                Endpoints cardiaques suivis
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Microscope className="w-5 h-5 text-primary" />
                    Biomarqueurs principaux
                  </h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>LGE: quantification de nécrose et hétérogénéité cicatricielle</li>
                    <li>MVO: caractérisation de l'obstruction microvasculaire</li>
                    <li>ECV: estimation de la fibrose diffuse</li>
                    <li>Volumes VG et FEVG: remodelage longitudinal</li>
                    <li>T1/T2 mapping: caractérisation tissulaire complémentaire</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card/50 p-8 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Livrables Core Lab
                  </h3>
                  <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-2">
                    <li>Tables patient/temps prêtes pour analyse biostatistique</li>
                    <li>Masques et contours pour revue qualité indépendante</li>
                    <li>Dossiers QA par centre et par endpoint</li>
                    <li>Historique versionné des règles et des paramètres</li>
                    <li>Rapport de robustesse inter-centre (CV, ICC, outliers)</li>
                  </ul>
                </div>
              </div>

              <p className="text-center text-muted-foreground">
                Pour le détail clinique et méthodologique des marqueurs myocardiques, voir{" "}
                <Link
                  to="/biomarqueurs-irm-cardiaque-essais-cliniques"
                  className="text-primary hover:underline"
                >
                  biomarqueurs IRM cardiaques en essais cliniques
                </Link>.
              </p>
            </section>

            {/* CHIFFRES */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <BarChart3 className="w-5 h-5 text-primary" />
                Repères chiffrés rapportés en littérature
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Variabilité et reproductibilité</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
                    <li>LGE: variabilité inter-observateur typiquement 5-15% sans harmonisation</li>
                    <li>LGE: réduction possible vers 1-3% avec pipeline centralisé validé</li>
                    <li>ECV: écarts absolus inter-centres souvent de l'ordre de 2-4%</li>
                    <li>Volumes ventriculaires: ICC souvent supérieur à 0.9 en conditions contrôlées</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Interprétation pratique</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
                    <li>Une dérive technique peut masquer un effet traitement réel</li>
                    <li>Le gain statistique vient d'abord de la réduction de variance</li>
                    <li>Un endpoint exploitable nécessite méthode + QA + traçabilité</li>
                    <li>Les seuils doivent rester liés à un protocole explicitement documenté</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* RISQUES */}
            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Risques qui dégradent un endpoint d'imagerie
              </div>

              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Règles de segmentation implicites ou changeantes en cours d'étude</li>
                <li>Hétérogénéité séquence/champ non prise en compte (1.5T vs 3T)</li>
                <li>Corrections manuelles non tracées</li>
                <li>Absence de politique de relecture des cas limites</li>
                <li>Exports non versionnés ou non reliés à un run identifiable</li>
              </ul>
            </section>

            {/* REFERENCES */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Références & standards utiles</h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>SCMR recommendations (acquisition, mapping T1/T2, reporting)</li>
                <li>AHA 17-segment model pour analyses myocardiques regionales</li>
                <li>Consensus CMR en essais cliniques multicentriques</li>
                <li>Guides de bonnes pratiques pour surrogate endpoints d'imagerie</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages associées</h2>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/irm-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  IRM quantitative <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/ingenierie-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Ingénierie quantitative <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* FAQ */}
            <section className="space-y-8">
                <h2 className="text-2xl font-semibold text-center text-foreground">
                Questions fréquentes - Core Lab IRM
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Pourquoi centraliser la lecture ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Pour appliquer les mêmes règles de segmentation et de contrôle qualité à tous les centres,
                    et limiter les biais locaux.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6">
                  <h3 className="font-semibold">Quel est le role du QA statistique ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Détecter précocement les dérives centre-dépendantes et documenter la stabilité
                    des métriques critiques de l'endpoint.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 md:col-span-2">
                  <h3 className="font-semibold">Un endpoint IRM peut-il être audité ?</h3>
                  <p className="text-muted-foreground mt-2">
                    Oui, si le pipeline est versionné, que les décisions de lecture sont tracées,
                    et que les livrables permettent une vérification indépendante.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center space-y-6 pt-4">
              <p className="text-muted-foreground">
                Structurer un endpoint IRM multicentrique exige un cadre méthodologique stable,
                des règles explicites et un audit continu de la qualité.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Échanger sur votre essai clinique
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

export default CorelabEC;
