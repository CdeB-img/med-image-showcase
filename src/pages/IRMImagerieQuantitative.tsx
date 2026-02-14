import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CANONICAL =
  "https://noxia-imagerie.fr/irm-imagerie-quantitative";

const IRMImagerieQuantitative = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "IRM quantitative en recherche clinique",
    description:
      "Développement, validation et harmonisation multicentrique de biomarqueurs IRM quantitatifs en cardiologie et neuro-imagerie. Segmentation, mapping, perfusion et structuration Core Lab.",
    about: [
      "Quantitative MRI",
      "Cardiac MRI biomarkers",
      "Neuro MRI perfusion",
      "T1 mapping",
      "T2 mapping",
      "Extracellular volume MRI",
      "MRI segmentation",
      "Multicenter MRI harmonization"
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
        <title>
          IRM quantitative & biomarqueurs reproductibles | NOXIA
        </title>

        <meta
          name="description"
          content="IRM quantitative en recherche clinique : segmentation robuste, mapping T1/T2, ECV, perfusion cérébrale, harmonisation multicentrique et structuration Core Lab."
        />

        <link rel="canonical" href={CANONICAL} />

        <meta property="og:title" content="IRM quantitative en recherche clinique" />
        <meta
          property="og:description"
          content="Structuration et validation de biomarqueurs IRM en cardiologie et neuro-imagerie multicentrique."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-24">

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                IRM quantitative en recherche clinique
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Développement et validation de biomarqueurs IRM
                reproductibles, multicentriques et physiopathologiquement cohérents,
                en cardiologie et neuro-imagerie.
              </p>
            </section>

            {/* POSITIONNEMENT */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                De l’image morphologique au biomarqueur défendable
              </h2>

              <p>
                L’IRM moderne permet une quantification fine des altérations tissulaires,
                mais cette puissance technique n’a de valeur que si la chaîne méthodologique
                est explicite : normalisation, segmentation contrôlée,
                séparation inférence / quantification, traçabilité.
              </p>

              <p>
                L’objectif n’est pas seulement de produire un masque,
                mais un biomarqueur exploitable statistiquement,
                stable inter-centre et défendable en publication.
              </p>
            </section>

            {/* CARDIO */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                IRM cardiaque quantitative
              </h2>

              <p>
                En cardiologie, l’IRM constitue un surrogate endpoint
                dans de nombreux essais randomisés.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Quantification LGE et obstruction microvasculaire</li>
                <li>Volumes ventriculaires et remodelage longitudinal</li>
                <li>ECV – fraction volumique extracellulaire</li>
                <li>T1 natif (inflammation / fibrose diffuse)</li>
                <li>T2 mapping (œdème actif)</li>
              </ul>

              <p>
                Voir :
                {" "}
                <Link to="/biomarqueurs-irm-cardiaque-essais-cliniques" className="text-primary hover:underline">
                  Biomarqueurs IRM cardiaque
                </Link>
                {" "}et{" "}
                <Link to="/ecv-mapping-t1-t2-irm-cardiaque" className="text-primary hover:underline">
                  ECV & Mapping T1/T2
                </Link>.
              </p>
            </section>

            {/* NEURO */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Perfusion et métabolisme cérébral
              </h2>

              <p>
                En neuro-imagerie, les cartes OEF, CMRO2, CBF et Tmax
                nécessitent une structuration algorithmique rigoureuse.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Normalisation hémisphérique miroir</li>
                <li>Modélisation D_core guidée par diffusion</li>
                <li>Propagation par hystérésis 3D contrôlée</li>
                <li>Analyse multi-seuils pour robustesse inter-patient</li>
                <li>Évaluation Dice automatisée</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">
                  Perfusion & Métabolisme cérébral
                </Link>.
              </p>
            </section>

            {/* SEGMENTATION */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Segmentation contrôlée & architecture pipeline
              </h2>

              <p>
                Une segmentation robuste repose sur :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Pré-traitement géométrique documenté</li>
                <li>Normalisation intra-sujet</li>
                <li>Seeds physiopathologiques explicites</li>
                <li>Nettoyage morphologique 2D puis filtrage 3D</li>
                <li>Extraction métrique versionnée</li>
              </ul>

              <p>
                Voir{" "}
                <Link to="/segmentation-irm" className="text-primary hover:underline">
                  Segmentation IRM
                </Link>
                {" "}et{" "}
                <Link to="/ingenierie-imagerie-quantitative" className="text-primary hover:underline">
                  Ingénierie quantitative
                </Link>.
              </p>
            </section>

            {/* MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Harmonisation multicentrique
              </h2>

              <p>
                Les valeurs T1/T2, ECV ou perfusion varient selon constructeur,
                champ magnétique et implémentation séquence.
              </p>

              <p>
                Une harmonisation méthodologique est indispensable
                pour garantir que la variabilité technique
                ne dépasse pas l’effet biologique étudié.
              </p>

              <p>
                Voir{" "}
                <Link to="/bases-multicentriques" className="text-primary hover:underline">
                  Bases multicentriques
                </Link>.
              </p>
            </section>

            {/* CORE LAB */}
            <section className="space-y-6 text-center text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Structuration Core Lab IRM
              </h2>

              <p>
                L’IRM quantitative devient un endpoint robuste
                lorsqu’elle est centralisée, auditée et analysée
                dans une logique Core Lab multicentrique.
              </p>

              <Link
                to="/corelab-essais-cliniques"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
              >
                Découvrir l’approche Core Lab
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

            {/* CTA FINAL */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                Structurer un biomarqueur IRM robuste
                est un travail méthodologique avant d’être logiciel.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un projet IRM
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

export default IRMImagerieQuantitative;