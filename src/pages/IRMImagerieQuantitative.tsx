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
      "Développement, validation et harmonisation multicentrique de biomarqueurs IRM quantitatifs en cardiologie et neuro-imagerie. Segmentation contrôlée, mapping T1/T2, perfusion cérébrale et structuration Core Lab.",
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
        <title>IRM quantitative & biomarqueurs reproductibles | NOXIA</title>

        <meta
          name="description"
          content="IRM quantitative en recherche clinique : segmentation robuste, mapping T1/T2, ECV, perfusion cérébrale, harmonisation multicentrique et structuration Core Lab."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-28">

            {/* HERO */}
            <section className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                IRM quantitative en recherche clinique
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Transformation du signal IRM en biomarqueurs mesurables,
                reproductibles et physiopathologiquement cohérents,
                en cardiologie et neuro-imagerie multicentrique.
              </p>
            </section>

            {/* POSITIONNEMENT GLOBAL */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Du contraste visuel au paramètre quantitatif
              </h2>

              <p>
                L’IRM moderne permet d’accéder à des informations
                morphologiques, fonctionnelles et tissulaires d’une grande finesse.
                Toutefois, un contraste visuel ne constitue pas un biomarqueur.
              </p>

              <p>
                La valeur scientifique d’un paramètre IRM repose sur :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Une définition explicite de la métrique</li>
                <li>Une segmentation contrôlée et documentée</li>
                <li>Une séparation claire entre inférence et quantification</li>
                <li>Un contrôle des biais géométriques et intensité</li>
                <li>Une reproductibilité intra et inter-centre démontrable</li>
              </ul>

              <p>
                L’objectif est de produire un biomarqueur exploitable statistiquement,
                défendable méthodologiquement et robuste pour publication.
              </p>
            </section>

            {/* IRM CARDIAQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                IRM cardiaque quantitative
              </h2>

              <p>
                En cardiologie, l’IRM constitue un véritable surrogate endpoint
                dans de nombreux essais thérapeutiques randomisés.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Quantification LGE (nécrose myocardique)</li>
                <li>Microvascular Obstruction (MVO)</li>
                <li>Volumes ventriculaires et fraction d’éjection</li>
                <li>Remodelage ventriculaire longitudinal</li>
                <li>Extracellular Volume (ECV)</li>
                <li>T1 natif (fibrose / inflammation diffuse)</li>
                <li>T2 mapping (œdème actif)</li>
              </ul>

              <p>
                Ces paramètres sont détaillés dans :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <Link to="/biomarqueurs-irm-cardiaque-essais-cliniques" className="text-primary hover:underline">
                    Biomarqueurs IRM cardiaque en essais cliniques
                  </Link>
                </li>
                <li>
                  <Link to="/ecv-mapping-t1-t2-irm-cardiaque" className="text-primary hover:underline">
                    ECV & Mapping T1/T2
                  </Link>
                </li>
                <li>
                  <Link to="/corelab-essais-cliniques" className="text-primary hover:underline">
                    Structuration Core Lab IRM
                  </Link>
                </li>
              </ul>
            </section>

            {/* NEURO PERFUSION */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Perfusion et métabolisme cérébral
              </h2>

              <p>
                En neuro-imagerie, les cartes OEF, CMRO2, CBF et Tmax
                nécessitent une structuration algorithmique stricte.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Normalisation hémisphérique miroir</li>
                <li>Définition explicite du D_core</li>
                <li>Propagation métabolique par hystérésis 3D</li>
                <li>Filtrage morphologique multi-échelle</li>
                <li>Analyse multi-seuils pour robustesse statistique</li>
                <li>Évaluation Dice automatisée</li>
              </ul>

              <p>
                Voir :
                {" "}
                <Link to="/perfusion-metabolique-neuro-imagerie" className="text-primary hover:underline">
                  Perfusion & Métabolisme cérébral
                </Link>.
              </p>
            </section>

            {/* SEGMENTATION & PIPELINE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Segmentation contrôlée & architecture pipeline
              </h2>

              <p>
                La segmentation constitue l’étape structurante
                de toute IRM quantitative.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Audit DICOM et cohérence géométrique</li>
                <li>Normalisation intra-sujet ou hémisphérique</li>
                <li>Seeds physiopathologiques documentés</li>
                <li>Post-traitement morphologique 2D puis volumique 3D</li>
                <li>Extraction métrique versionnée et tracée</li>
              </ul>

              <p>
                Voir :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <Link to="/segmentation-irm" className="text-primary hover:underline">
                    Segmentation IRM
                  </Link>
                </li>
                <li>
                  <Link to="/analyse-dicom" className="text-primary hover:underline">
                    Analyse DICOM & structuration
                  </Link>
                </li>
                <li>
                  <Link to="/bases-multicentriques" className="text-primary hover:underline">
                    Harmonisation multicentrique
                  </Link>
                </li>
              </ul>
            </section>

            {/* VARIABILITÉ MULTICENTRIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Variabilité technique et harmonisation
              </h2>

              <p>
                Les valeurs T1, T2, ECV ou perfusion varient selon :
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Constructeur (Siemens, GE, Philips)</li>
                <li>Champ magnétique (1.5T vs 3T)</li>
                <li>Implémentation séquence</li>
                <li>Reconstruction et filtres appliqués</li>
              </ul>

              <p>
                Sans harmonisation méthodologique,
                la variabilité technique peut dépasser
                l’effet physiopathologique étudié.
              </p>
            </section>

            {/* CORE LAB FINAL */}
            <section className="space-y-6 text-center text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Structuration Core Lab
              </h2>

              <p>
                L’IRM quantitative atteint son niveau maximal
                lorsqu’elle est centralisée, auditée,
                harmonisée et analysée dans un cadre Core Lab.
              </p>

              <Link
                to="/corelab-essais-cliniques"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/40 transition"
              >
                Approche Core Lab IRM
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>

            {/* CTA FINAL */}
            <section className="text-center space-y-4">
              <p className="text-muted-foreground">
                L’IRM quantitative exige une architecture méthodologique explicite.
                La robustesse du biomarqueur précède l’algorithme.
              </p>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
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