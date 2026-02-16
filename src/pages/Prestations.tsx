import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import ExpertiseHero from "@/components/ExpertiseHero";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  Layers,
  Settings2,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/prestations-imagerie-medicale";

const Prestations = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace("#", "");
    const timeout = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [location.hash]);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Prestations en imagerie médicale quantitative",
    description:
      "CoreLab IRM & CT, structuration multicentrique, audit méthodologique, reprise d'études existantes et ingénierie quantitative en recherche clinique.",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "France & Europe",
    serviceType: [
      "CoreLab externalisé",
      "Audit DICOM et harmonisation multicentrique",
      "Reprise d'études et sécurisation méthodologique",
      "Ingénierie quantitative sur mesure",
    ],
    url: CANONICAL,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://noxia-imagerie.fr/" },
      { "@type": "ListItem", position: 2, name: "Expertise", item: "https://noxia-imagerie.fr/expertise" },
      { "@type": "ListItem", position: 3, name: "Prestations", item: CANONICAL },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "À quel moment intervenir dans une étude ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "L'intervention est possible en amont pour cadrer protocole et critères, pendant l'étude pour structurer QA et pipeline, ou en aval pour reprendre et sécuriser des résultats avant publication.",
        },
      },
      {
        "@type": "Question",
        name: "Pouvez-vous reprendre une base déjà constituée ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Oui. Nous auditons la qualité DICOM, les incohérences géométriques, la traçabilité des traitements et reconstruisons un flux reproductible avec exclusions documentées.",
        },
      },
      {
        "@type": "Question",
        name: "Les prestations couvrent-elles IRM et CT ?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Oui. Les pipelines sont adaptés à chaque modalité avec harmonisation multicentrique, calibration CT lorsque nécessaire et livrables compatibles analyses statistiques.",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Prestations | CoreLab & Imagerie Quantitative | NOXIA</title>
        <meta
          name="description"
          content="CoreLab IRM et CT externalisé, audit DICOM, harmonisation multicentrique, reprise d'études existantes et développement d'outils sur mesure en recherche clinique."
        />
        <link rel="canonical" href={CANONICAL} />
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
                { label: "Prestations" },
              ]}
            />

            <ExpertiseHero
              badge="Prestations"
              badgeIcon={Workflow}
              title="CoreLab IRM & CT externalisé pour études cliniques"
              description="Intervention en amont, en cours ou en reprise d'étude pour sécuriser la méthodologie, fiabiliser les biomarqueurs et livrer un dossier exploitable en analyse statistique et publication."
              chips={["CHU & académique", "Promoteurs industriels", "France & Europe", "Livrables auditables"]}
              actions={[
                { label: "Planifier un échange de cadrage", to: "/contact", variant: "primary", icon: ArrowRight },
                { label: "Voir la méthodologie", to: "/methodologie-imagerie-quantitative", variant: "secondary", icon: BarChart3 },
              ]}
            />

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground text-center">Choisir un point d'entrée selon votre situation</h2>

              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/prestations-imagerie-medicale#corelab"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  CoreLab IRM & CT
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/prestations-imagerie-medicale#reprise"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Reprise d'étude
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/prestations-imagerie-medicale#audit"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Audit & harmonisation
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/prestations-imagerie-medicale#ingenierie"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
                >
                  Ingénierie sur mesure
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-border bg-card/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Décision rapide
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Diagnostic du bon niveau d'intervention en fonction de vos contraintes d'étude.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Database className="w-5 h-5 text-primary" />
                    Intervention ciblée
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Entrée possible sur un bloc précis (audit, reprise, pipeline, endpoint).
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/60 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <FileText className="w-5 h-5 text-primary" />
                    Exécution traçable
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Livrables structurés, QA, logs et documentation prête pour audit scientifique.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground text-center">Ce que vous obtenez concrètement</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-background/70 p-5 space-y-3">
                  <p className="font-semibold text-foreground">Plan d'action opérationnel</p>
                  <p className="text-sm text-muted-foreground">
                    Priorisation des risques méthodologiques, étapes de remédiation et calendrier de mise en oeuvre.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-5 space-y-3">
                  <p className="font-semibold text-foreground">Pipeline versionné et reproductible</p>
                  <p className="text-sm text-muted-foreground">
                    Paramètres figés, exécution contrôlée et séparation explicite entre inférence et mesure.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-5 space-y-3">
                  <p className="font-semibold text-foreground">Dossier QA et exclusions documentées</p>
                  <p className="text-sm text-muted-foreground">
                    Contrôles entrée/sortie, gestion des non-conformités et justification des décisions analytiques.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-5 space-y-3">
                  <p className="font-semibold text-foreground">Livrables prêts pour stats/publication</p>
                  <p className="text-sm text-muted-foreground">
                    Tables patient/temps, exports masques, overlays QC et notes méthodologiques réutilisables.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-10">
              <h2 className="text-2xl font-semibold text-foreground text-center">Offres principales</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <article id="corelab" className="scroll-mt-28 rounded-2xl border border-border bg-card/50 p-7 space-y-4">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Layers className="w-5 h-5 text-primary" />
                    CoreLab IRM & CT externalisé
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Mise en place et pilotage d'un circuit image complet pour essais cliniques, cohortes et projets translationnels.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Idéal si vous démarrez une étude multicentrique ou si vous voulez externaliser l'ensemble du flux image.
                  </p>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Définition protocolaire imagerie et critères QA</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Centralisation sécurisée et contrôle qualité continu</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Production d'endpoints quantitatifs reproductibles</span></li>
                  </ul>

                  <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    Cadrer un CoreLab
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>

                <article id="reprise" className="scroll-mt-28 rounded-2xl border border-border bg-card/50 p-7 space-y-4">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Reprise et sécurisation d'études
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Intervention sur études en difficulté méthodologique pour reconstruire un flux défendable avant analyse finale.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Idéal si les données sont déjà acquises et que la robustesse des résultats est incertaine.
                  </p>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Audit des incohérences DICOM et géométriques</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Détection doublons, séries non conformes, dérives</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Reconstruction pipeline + traçabilité complète</span></li>
                  </ul>

                  <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    Évaluer une reprise
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>

                <article id="audit" className="scroll-mt-28 rounded-2xl border border-border bg-card/50 p-7 space-y-4">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Audit méthodologique & harmonisation
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Analyse critique d'un pipeline existant et plan d'action concret pour gagner en robustesse statistique.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Idéal pour un avis externe indépendant avant verrouillage des analyses ou soumission.
                  </p>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Évaluation reproductibilité inter-centre</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Harmonisation inter-constructeurs IRM/CT</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Calibration phantom CT et contrôle des biais</span></li>
                  </ul>

                  <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    Demander un audit
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>

                <article id="ingenierie" className="scroll-mt-28 rounded-2xl border border-border bg-card/50 p-7 space-y-4">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Settings2 className="w-5 h-5 text-primary" />
                    Développement & ingénierie sur mesure
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Développement d'outils et d'architectures data en support des objectifs scientifiques et opérationnels.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Idéal si vous avez un besoin technique spécifique non couvert par les outils standards.
                  </p>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Automatisation flux DICOM/NIfTI et QA</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Modules dédiés (Python, 3D Slicer, pipelines)</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Architecture versionnée, audit-ready, maintenable</span></li>
                  </ul>

                  <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    Lancer un développement
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground text-center">Formats d'intervention</h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Audit flash</h3>
                  <p className="text-xs text-primary font-medium uppercase tracking-wide">2 à 4 semaines</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Relecture méthodologique ciblée et plan d'actions priorisé pour sécuriser rapidement une étude.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Mission structurée</h3>
                  <p className="text-xs text-primary font-medium uppercase tracking-wide">4 à 12 semaines</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Intervention opérationnelle sur un périmètre défini : reprise, harmonisation multicentrique ou endpoint.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-3">
                  <h3 className="font-semibold text-foreground">CoreLab externalisé</h3>
                  <p className="text-xs text-primary font-medium uppercase tracking-wide">Suivi longitudinal</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pilotage global de la chaîne imagerie sur la durée de l'étude, avec gouvernance et reporting.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground text-center">Méthode de collaboration</h2>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card/70 p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary">01</p>
                  <p className="font-medium text-foreground">Cadrage</p>
                  <p className="text-xs text-muted-foreground">Objectifs, endpoints, contraintes data et calendrier.</p>
                </div>
                <div className="rounded-xl border border-border bg-card/70 p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary">02</p>
                  <p className="font-medium text-foreground">Audit</p>
                  <p className="text-xs text-muted-foreground">Qualité DICOM, géométrie, hétérogénéité multicentrique.</p>
                </div>
                <div className="rounded-xl border border-border bg-card/70 p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary">03</p>
                  <p className="font-medium text-foreground">Production</p>
                  <p className="text-xs text-muted-foreground">Pipeline validé, QA, livrables quantitatifs traçables.</p>
                </div>
                <div className="rounded-xl border border-border bg-card/70 p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary">04</p>
                  <p className="font-medium text-foreground">Transfert</p>
                  <p className="text-xs text-muted-foreground">Documentation, restitution et support publication.</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/50 p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground text-center">Préparer le premier échange (30 min)</h2>

              <p className="text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed">
                Un échange court suffit pour qualifier la mission. Si vous avez ces éléments, le cadrage est plus rapide et plus précis.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Contexte d'étude</p>
                  <p>Indication clinique, objectif principal, endpoints visés.</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Périmètre data</p>
                  <p>Modalité (IRM/CT), nombre de centres, volumes approximatifs.</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Niveau de maturité</p>
                  <p>Étude en préparation, en cours, ou reprise d'un existant.</p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Contraintes opérationnelles</p>
                  <p>Échéances, exigences qualité, besoins statistiques/publication.</p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground text-center">Questions fréquentes</h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-2">
                  <h3 className="font-semibold text-foreground">Quand démarrer ?</h3>
                  <p className="text-sm text-muted-foreground">
                    Idéalement avant inclusion du premier patient, mais une reprise en cours d'étude reste possible.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-2">
                  <h3 className="font-semibold text-foreground">Quels livrables ?</h3>
                  <p className="text-sm text-muted-foreground">
                    Tables métriques, masques, exports QA, logs d'exécution et dossier méthodologique structuré.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-6 space-y-2">
                  <h3 className="font-semibold text-foreground">IRM et CT ensemble ?</h3>
                  <p className="text-sm text-muted-foreground">
                    Oui, avec règles adaptées à chaque modalité et harmonisation pour analyses multicentriques.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card/80 to-primary/5 p-8 text-center space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">Initier une collaboration</h2>
              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Un échange initial permet d'identifier les risques méthodologiques,
                de définir le niveau d'intervention et de proposer un plan d'action réaliste.
              </p>

              <div className="flex justify-center">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
                >
                  Planifier un échange de cadrage
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <p className="text-sm text-muted-foreground">
                Besoin d'abord d'un cadre technique ?{" "}
                <Link to="/methodologie-imagerie-quantitative" className="text-primary hover:underline">
                  Voir la méthodologie
                </Link>
                .
              </p>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Prestations;
