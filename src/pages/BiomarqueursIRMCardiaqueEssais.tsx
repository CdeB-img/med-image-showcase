import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/Breadcrumb";
import {
  ArrowRight,
  BarChart3,
  Database,
  ShieldCheck,
  Workflow,
  Microscope,
  HeartPulse,
  Activity,
  Layers,
  Timer,
  CheckCircle2
} from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/biomarqueurs-irm-cardiaque-essais-cliniques";

const BiomarqueursIRMCardiaqueEssais = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Biomarqueurs IRM cardiaque en essais cliniques multicentriques",
    description:
      "Définition, validation méthodologique et harmonisation multicentrique de biomarqueurs IRM cardiaque utilisés comme endpoints primaires ou secondaires d’essais thérapeutiques randomisés.",
    about: [
      "Cardiac MRI",
      "Clinical trial imaging endpoints",
      "Late Gadolinium Enhancement",
      "Microvascular Obstruction",
      "Extracellular Volume Fraction",
      "T1 mapping",
      "T2 mapping",
      "Left ventricular remodeling",
      "Multicenter imaging harmonization"
    ],
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Researchers"
    },
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    },
    url: CANONICAL
  };

  return (
    <>
      <Helmet>
        <title>Biomarqueurs IRM cardiaque & Endpoints d’essais cliniques | NOXIA</title>

        <meta
          name="description"
          content="IRM cardiaque comme endpoint d’essais thérapeutiques multicentriques : LGE, MVO, ECV, T1, T2, remodelage VG. Validation translationnelle, harmonisation inter-centre et reproductibilité."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta
          property="og:title"
          content="Biomarqueurs IRM cardiaque en essais multicentriques"
        />
        <meta
          property="og:description"
          content="Structuration, validation et harmonisation de biomarqueurs IRM cardiaque utilisés comme endpoints d’essais randomisés."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-16">
            <Breadcrumb
              items={[
                { label: "Accueil", path: "/" },
                { label: "Expertise", path: "/expertise" },
                { label: "IRM", path: "/irm-imagerie-quantitative" },
                { label: "Biomarqueurs IRM cardiaque" }
              ]}
            />

            {/* ================= HERO ================= */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Biomarqueurs IRM cardiaque comme endpoints d’essais cliniques
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                Transformer une IRM hétérogène (centres, scanners, versions, logiciels)
                en <strong>endpoints quantitatifs</strong> reproductibles :
                définition explicite, validation physiopathologique,
                harmonisation multicentrique et traçabilité.
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Discuter d’un endpoint
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/corelab-essais-cliniques"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 font-medium hover:bg-muted/40 transition"
                >
                  Voir l’approche Core Lab
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            {/* ================= TL;DR ================= */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Ce qui compte en essai
                  </div>
                  <p className="text-muted-foreground">
                    Un endpoint IRM est un objet <strong>statistique</strong> :
                    définition stable, distributions contrôlées, biais documentés.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Ce qui le rend défendable
                  </div>
                  <p className="text-muted-foreground">
                    Méthodologie explicite : règles de segmentation, timing, QA,
                    reproductibilité inter-centre / inter-lecteurs.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Database className="w-5 h-5 text-primary" />
                    Ce qui est livré
                  </div>
                  <p className="text-muted-foreground">
                    Extractions versionnées, logs, mapping, exports analytiques
                    et documentation directement réutilisable (SAP, protocole, publication).
                  </p>
                </div>
              </div>
            </section>

            {/* ================= POSITIONNEMENT ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                De l’image descriptive au surrogate endpoint
              </h2>

              <p>
                Un biomarqueur IRM cardiaque devient un endpoint d’essai
                uniquement lorsque sa définition est strictement contrôlée :
                <strong>quoi</strong> est mesuré, <strong>où</strong>, <strong>quand</strong>,
                <strong>comment</strong> (règles, seuils, exclusions), et <strong>avec quel niveau d’incertitude</strong>.
              </p>

              <p>
                En multicentrique, la variabilité technique (constructeur, champ, implémentation de séquence,
                logiciel de post-traitement, versions) peut dépasser l’effet thérapeutique.
                La conséquence est immédiate : baisse de puissance, dilution de signal, et résultats difficiles à défendre.
              </p>

              <p>
                L’approche NOXIA se place au niveau méthodologique : structurer l’endpoint
                pour qu’il soit robuste à l’hétérogénéité réelle, pas uniquement “propre” sur un sous-groupe idéal.
              </p>
            </section>

            {/* ================= BIOMARQUEURS ================= */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Biomarqueurs structurants en IRM cardiaque
              </h2>

              <div className="grid md:grid-cols-2 gap-6 text-muted-foreground leading-relaxed">
                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <HeartPulse className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        Nécrose / cicatrice (LGE)
                      </h3>
                      <p>
                        Définition de règles de segmentation robustes (seuils, ROI de référence,
                        exclusions artefacts, gestion des bords), extraction de volumes / masses,
                        et stabilité inter-reconstruction.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        Obstruction microvasculaire (MVO)
                      </h3>
                      <p>
                        Quantification MVO comme endpoint sensible : dépendance au timing, au contraste,
                        aux artefacts, et aux règles d’inclusion. Stabilisation via QA + protocole explicite.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        Volumes / FE / remodelage VG
                      </h3>
                      <p>
                        Standardisation de contours endo/épi, gestion des plans de base,
                        cohérence temporelle (baseline, M6, etc.), et métriques longitudinales.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <Microscope className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        T1 / T2 / ECV
                      </h3>
                      <p>
                        Biomarqueurs diffus à forte sensibilité aux séquences et au champ.
                        Nécessitent une séparation stricte acquisition ↔ segmentation ↔ quantification.
                      </p>
                      <p className="mt-3">
                        Voir{" "}
                        <Link to="/ecv-mapping-t1-t2-irm-cardiaque" className="text-primary hover:underline">
                          ECV & Mapping T1/T2
                        </Link>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                L’enjeu n’est pas d’empiler des mesures, mais d’obtenir des variables
                <strong>stables</strong>, <strong>comparables</strong> et <strong>publiables</strong>
                avec une traçabilité complète.
              </p>
            </section>

            {/* ================= PIPELINE ENDPOINT ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Architecture méthodologique d’un endpoint IRM
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Workflow className="w-5 h-5 text-primary" />
                    Chaîne “défendable”
                  </div>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Audit DICOM : cohérence séries, champs, paramètres critiques</li>
                    <li>Normalisation géométrique contrôlée (si nécessaire) + logs</li>
                    <li>Règles de segmentation explicites (cas limites, exclusions)</li>
                    <li>Extraction métrique versionnée (volumes, masses, ratios)</li>
                    <li>QA systématique (visuel + checks automatiques)</li>
                    <li>Exports analytiques : tableaux, distributions, flags</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Timer className="w-5 h-5 text-primary" />
                    Points sensibles en essai
                  </div>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Timing post-contraste (LGE, MVO, ECV) et traçabilité</li>
                    <li>1.5T vs 3T : distributions différentes → stratification ou harmonisation</li>
                    <li>Logiciels multiples : mêmes “labels”, résultats différents</li>
                    <li>Artefacts (arythmie, motion, inhomogénéités) : règles d’exclusion</li>
                    <li>Multi-reconstructions / duplicates : détection obligatoire</li>
                  </ul>
                </div>
              </div>

              <p>
                L’objectif est une chaîne qui résiste à l’hétérogénéité réelle,
                et qui supporte une discussion méthodologique en comité, SAP ou publication.
              </p>
            </section>
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">
                Points méthodologiques clés en essai multicentrique
              </h2>

              <div className="grid md:grid-cols-2 gap-6">

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Définition unique de l’endpoint
                  </div>
                  <p className="text-muted-foreground">
                    Un endpoint ne peut pas varier selon le centre ou le lecteur.
                    Les règles sont fixées avant analyse et versionnées.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Contrôle de la variance
                  </div>
                  <p className="text-muted-foreground">
                    La variance inter-centre peut dépasser 10–20% selon la séquence.
                    Elle doit être mesurée, pas ignorée.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Robustesse aux logiciels
                  </div>
                  <p className="text-muted-foreground">
                    Deux logiciels peuvent produire des valeurs différentes
                    pour un même label. Une validation croisée est indispensable.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-6 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Traçabilité SAP-compatible
                  </div>
                  <p className="text-muted-foreground">
                    Les exports doivent être directement intégrables
                    dans un Statistical Analysis Plan.
                  </p>
                </div>

              </div>
            </section>
            {/* ================= VALIDATION TRANSLATIONNELLE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Validation translationnelle : quand “mesure” signifie “physiopathologie”
              </h2>

              <p>
                Un endpoint gagne de la valeur lorsqu’il est relié à une réalité
                physiopathologique indépendante (histologie, biologie, outcomes).
                En particulier, l’ECV et certains marqueurs tissulaires exigent
                une rigueur sur l’hématocrite, le timing et la sectorisation.
              </p>

              <div className="p-6 rounded-xl border border-border/50 bg-muted/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Ce que “validation” implique concrètement
                    </h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Définition explicite du biomarqueur (et de ses variantes)</li>
                      <li>Contrôle des biais systématiques (centre, champ, logiciel)</li>
                      <li>Règles de ROI (AHA, exclusion zones, qualité)</li>
                      <li>Traçabilité : valeurs sources, transformations, versions</li>
                    </ul>
                    <p className="mt-3">
                      Détails méthodologiques :{" "}
                      <Link to="/ecv-mapping-t1-t2-irm-cardiaque" className="text-primary hover:underline">
                        ECV & Mapping T1/T2
                      </Link>.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= MULTICENTRIQUE ================= */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Variabilité inter-centre : l’ennemi silencieux de la puissance statistique
              </h2>

              <p>
                Une harmonisation structurée n’a pas pour but “d’effacer” la variabilité,
                mais de la <strong>maîtriser</strong>, la <strong>documenter</strong> et
                l’intégrer dans le modèle analytique (stratification, covariables, exclusions).
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Analyse des distributions par centre / champ / constructeur</li>
                <li>Détection d’examens incompatibles (protocol drift, paramètres manquants)</li>
                <li>Stabilisation des règles de segmentation et des exports</li>
                <li>Rapports QA exploitables (et non “screenshots” isolés)</li>
              </ul>

              <p>
                Voir :{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques & harmonisation
                </Link>{" "}
                et{" "}
                <Link to="/analyse-dicom" className="text-primary hover:underline">
                  Analyse DICOM
                </Link>.
              </p>
            </section>

            {/* ================= PAGES LIEES ================= */}
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">Pages liées</h2>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/ecv-mapping-t1-t2-irm-cardiaque"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  ECV & Mapping T1/T2
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/corelab-essais-cliniques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Core Lab IRM
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/irm-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  IRM quantitative
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/bases-multicentriques"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Bases multicentriques
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/methodologie-imagerie-quantitative"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Méthodologie quantitative
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
            <section className="space-y-8">
              <h2 className="text-2xl font-semibold text-center">
                Questions méthodologiques fréquentes
              </h2>

              <div className="space-y-6">

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Quelle est la variabilité inter-centre en IRM cardiaque ?
                  </h3>
                  <p className="text-muted-foreground">
                    Selon la littérature, la variabilité peut atteindre 10–25% 
                    pour certains biomarqueurs diffus (T1 natif, T2)
                    si aucune harmonisation n’est appliquée.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Pourquoi l’endpoint IRM peut-il diluer l’effet thérapeutique ?
                  </h3>
                  <p className="text-muted-foreground">
                    Une variabilité non contrôlée augmente la variance résiduelle
                    et diminue la puissance statistique,
                    pouvant masquer un effet réel.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">
                    Un biomarqueur IRM est-il automatiquement un surrogate endpoint ?
                  </h3>
                  <p className="text-muted-foreground">
                    Non. Un surrogate endpoint exige validation
                    physiopathologique et corrélation indépendante
                    avec outcomes cliniques.
                  </p>
                </div>

              </div>
            </section>
            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-semibold">
                Références & consensus internationaux
              </h2>

              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>SCMR consensus on LGE quantification</li>
                <li>AHA 17-segment model</li>
                <li>EACVI recommendations for mapping reproducibility</li>
                <li>Guidelines on imaging biomarkers in clinical trials</li>
              </ul>

              <p className="text-muted-foreground">
                L’architecture proposée s’aligne sur les standards
                internationaux en imagerie cardiovasculaire.
              </p>
            </section>
            {/* ================= CTA FINAL ================= */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Un endpoint IRM robuste est un travail méthodologique avant d’être un travail logiciel.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter du projet
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

export default BiomarqueursIRMCardiaqueEssais;