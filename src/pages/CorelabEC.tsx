import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Database,
  Workflow,
  ShieldCheck,
  BarChart3,
  Microscope,
  ArrowRight,
} from "lucide-react";

const CANONICAL = "https://noxia-imagerie.fr/corelab-essais-cliniques";

const CorelabEC = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Core Lab IRM pour essais cliniques",
    provider: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr",
    },
    areaServed: "Europe",
    serviceType: [
      "Core Lab IRM",
      "Lecture centralisée multicentrique",
      "Validation biomarqueurs",
      "Quantification IRM",
    ],
    description:
      "Core Lab IRM pour essais cliniques multicentriques : définition d’endpoints, harmonisation inter-centre, validation translationnelle et quantification reproductible.",
    url: CANONICAL,
  };

  return (
    <>
      <Helmet>
        <title>Core Lab IRM & Essais Cliniques | NOXIA</title>
        <meta
          name="description"
          content="Core Lab IRM pour essais cliniques multicentriques. Définition d’endpoints, validation translationnelle, harmonisation inter-centre et quantification reproductible."
        />
        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="Core Lab IRM & Essais Cliniques | NOXIA" />
        <meta
          property="og:description"
          content="Pilotage et quantification IRM comme endpoint d’essais thérapeutiques multicentriques."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-16">

            {/* HERO */}
            <section className="space-y-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Core Lab IRM & Essais Cliniques Multicentriques
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Pilotage, harmonisation et quantification de biomarqueurs IRM
                utilisés comme endpoints d’essais thérapeutiques randomisés
                et cohortes prospectives de grande ampleur.
              </p>
            </section>

            {/* ROLE CORE LAB */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Rôle en tant que Core Lab imagerie
              </h2>

              <p>
                Dans plusieurs essais multicentriques randomisés et cohortes
                longitudinales, l’IRM a été utilisée comme endpoint quantitatif
                principal ou secondaire. Le rôle du Core Lab consiste à garantir
                l’homogénéité méthodologique, la traçabilité et la robustesse des mesures.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Définition d’endpoints IRM reproductibles</li>
                <li>Lecture centralisée et harmonisation inter-centre</li>
                <li>Contrôle qualité systématique des acquisitions</li>
                <li>Quantification de nécrose, MVO, remodelage ventriculaire</li>
                <li>Extraction de biomarqueurs tissulaires (LGE, T1, T2, ECV)</li>
              </ul>
            </section>

            {/* VALIDATION TRANSLATIONNELLE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Validation translationnelle des biomarqueurs
              </h2>

              <p>
                Certaines études ont intégré une validation histologique directe,
                permettant de corréler les biomarqueurs IRM à des analyses tissulaires.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>IRM pré-biopsie avec quantification sectorielle AHA</li>
                <li>Mesure précise de l’hématocrite juste avant injection</li>
                <li>Contrôle des biais liés à l’hydratation et à la décantation</li>
                <li>Corrélation ECV ↔ analyse histologique</li>
              </ul>

              <p>
                Ces travaux ont permis de renforcer la validité physiopathologique
                de l’ECV comme marqueur de l’espace extracellulaire et de la fibrose diffuse.
              </p>

              <p>
                Rappels méthodologiques essentiels :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>T1 → marqueur inflammatoire et fibrose diffuse</li>
                <li>T2 → marqueur d’œdème (distinction importante en pratique clinique)</li>
              </ul>
            </section>

            {/* COHORTES */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Gestion de cohortes multicentriques à grande échelle
              </h2>

              <p>
                Expérience sur essais thérapeutiques post-IDM, études médicament vs placebo,
                cohortes longitudinales de grande ampleur et relectures institutionnelles massives.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Centralisation et audit complet des DICOM</li>
                <li>Anonymisation harmonisée et structurée</li>
                <li>Détection des doublons et examens incomplets</li>
                <li>Structuration patient / temps / séquence</li>
                <li>Extraction volumétrique standardisée</li>
              </ul>

              <p>
                L’objectif est de transformer des données hétérogènes
                en une base exploitable, statistiquement robuste et défendable.
              </p>
            </section>

            {/* MÉTHODES ET LOGICIELS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Comparaison d’algorithmes et validation inter-logiciels
              </h2>

              <p>
                Les méthodes de segmentation et de quantification doivent être
                comparées et validées. L’utilisation d’un outil ne garantit
                pas en soi la validité scientifique du biomarqueur produit.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Comparaison tagging vs speckle tracking (strain)</li>
                <li>Validation inter-logiciels (solutions cliniques vs recherche)</li>
                <li>Analyse de concordance et dispersion statistique</li>
                <li>Évaluation de séquences avancées (T1 rho, mapping…)</li>
              </ul>

              <p>
                L’objectif est d’identifier la méthode la plus robuste,
                reproductible et scientifiquement défendable.
              </p>
            </section>
            {/* RÉFÉRENCES INSTITUTIONNELLES */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Références institutionnelles et structuration d’unités Core Lab
              </h2>

              <p>
                Expérience acquise au sein de centres hospitalo-universitaires
                reconnus en imagerie cardiovasculaire, dans un contexte
                d’essais multicentriques et de recherche clinique certifiée.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Core Lab IRM cardiaque pour équipes hospitalo-universitaires
                  expertes en imagerie cardiovasculaire
                </li>
                <li>
                  Gestion complète de l’imagerie au sein d’un Centre d’Investigation
                  Clinique certifié ISO 9001 (IRM comme endpoint thérapeutique)
                </li>
                <li>
                  Lecture centralisée multicentrique pour essais randomisés
                  post-infarctus et pathologies myocardiques
                </li>
                <li>
                  Recrutement au sein d’une cellule recherche imagerie
                  hospitalière transversale pour structuration d’une unité
                  de relecture cardiothoracique
                </li>
              </ul>

              <p>
                Cette expérience combine exigence scientifique,
                structuration organisationnelle et maîtrise des contraintes
                réglementaires et multicentriques.
              </p>
            </section>
            {/* VALEUR AJOUTÉE */}

            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Ce que cela apporte à votre étude
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Endpoints IRM définis et reproductibles</li>
                <li>Réduction du bruit méthodologique</li>
                <li>Harmonisation multicentrique documentée</li>
                <li>Biomarqueurs exploitables statistiquement</li>
                <li>Support publication et validation réglementaire</li>
              </ul>

              <p>
                L’imagerie devient un outil décisionnel quantitatif,
                et non un simple examen illustratif.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Besoin d’un Core Lab IRM pour un essai multicentrique ?
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
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

export default CorelabEC;