import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const CANONICAL = "https://noxia-imagerie.fr/a-propos";

const APropos = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Charles de Bourguignon",
    jobTitle: "Expert en imagerie médicale de recherche",
    description:
      "Expert en IRM et CT quantitatif. CoreLab multicentrique, biomarqueurs cœur–cerveau, ingénierie d’analyse et harmonisation inter-centres.",
    email: "debourguignoncharles@gmail.com",
    url: CANONICAL,
    worksFor: {
      "@type": "Organization",
      name: "NOXIA Imagerie",
      url: "https://noxia-imagerie.fr"
    }
  };

  return (
    <>
      <Helmet>
        <title>
          À propos | Charles de Bourguignon – NOXIA Imagerie
        </title>

        <meta
          name="description"
          content="Charles de Bourguignon, expert en imagerie médicale de recherche. IRM cardiaque et neuro, CT quantitatif, CoreLab multicentrique, ingénierie et biomarqueurs reproductibles."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-24">

            {/* HERO */}
            <section className="grid md:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center md:justify-start">
                <img
                  src="/images/branding/portrait-charles.webp"
                  alt="Charles de Bourguignon – Expert imagerie médicale"
                  className="w-56 h-56 object-cover rounded-full shadow-xl"
                />
              </div>

              <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Charles de Bourguignon
              </h1>

              <p className="text-lg text-muted-foreground">
                Expert en imagerie médicale de recherche
              </p>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  Interface clinique – Recherche – Ingénierie – Innovation
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Expert en imagerie médicale de recherche, spécialisé en IRM et CT
                  quantitatif dans des environnements hospitalo-universitaires et
                  multicentriques.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Plus de 5000 examens analysés en contexte clinique et
                  scientifique (cardiaque, neurologique et pré-clinique),
                  au sein de projets institutionnels, RHU, ANR, PHRC et
                  partenariats industriels.
                </p>
              </div>
            </section>

            {/* PARCOURS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Parcours hospitalo-universitaire
              </h2>

              <p>
                Formation en neurosciences et imagerie biomédicale
                (Université de Caen), complétée par un DIU FARC-TEC
                à l’Université Lyon 1.
              </p>

              <p>
                De 2013 à 2018, immersion en radiologie au CHU Saint-Étienne
                avec spécialisation en IRM cardiaque avancée.
              </p>

              <p>
                De 2017 à 2025, création et structuration d’un CoreLab
                imagerie cœur–cerveau aux Hospices Civils de Lyon :
                coordination multicentrique, contrôle qualité,
                harmonisation protocolaire et interface clinique–recherche.
              </p>
            </section>

            {/* EXPERTISE CLINIQUE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Expertise clinique spécialisée
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>IRM cardiaque : LGE, T1/T2 mapping, ECV, fonction</li>
                <li>IRM neuro post-AVC : Tmax, ADC, OEF, CMRO2, pénombre</li>
                <li>Scanner thoracique et coronarien (CAD-RADS)</li>
              </ul>

              <p>
                L’analyse est guidée par une compréhension physiopathologique
                du signal et une exigence de cohérence clinique.
              </p>
            </section>

            {/* CORELAB */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                CoreLab & coordination multicentrique
              </h2>

              <p>
                Mise en place de circuits image complets :
                protocoles, formation des centres, centralisation,
                contrôle qualité et relectures médicales.
              </p>

              <p>
                Expérience sur des projets RHU et essais randomisés
                (ex : COVERT-MI, MARVELOUS, CARIOCA),
                avec exigence de reproductibilité inter-site
                et documentation traçable.
              </p>
            </section>

            {/* INGENIERIE */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Ingénierie & automatisation
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Développement d’outils Python et modules 3D Slicer</li>
                <li>Anonymisation avancée DICOM</li>
                <li>Automatisation des flux d’analyse</li>
                <li>Validation et intégration d’outils IA</li>
                <li>Architecture data, NAS et sécurisation des flux</li>
              </ul>

              <p>
                L’objectif est la transformation du signal en biomarqueur
                robuste, statistiquement exploitable et réglementairement
                défendable.
              </p>
            </section>

            {/* PUBLICATIONS */}
            <section className="space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Publications sélectionnées
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Circulation – COVERT-MI (2021)</li>
                <li>Neurology – Biomarkers & penumbra (2022)</li>
                <li>Stroke – OEF & recovery (2024)</li>
                <li>Stroke – Perfusion & collaterals (2024)</li>
              </ul>
            </section>

            {/* POSITIONNEMENT FINAL */}
            <section className="text-center space-y-6 text-muted-foreground leading-relaxed">
              <h2 className="text-2xl font-semibold text-foreground">
                Une expertise indépendante et structurée
              </h2>

              <p>
                NOXIA s’inscrit à l’interface entre clinique,
                recherche translationnelle et ingénierie quantitative.
              </p>

              <p>
                L’approche privilégie la rigueur méthodologique,
                la traçabilité des flux et la robustesse
                inter-constructeurs et inter-centres.
              </p>

              <Link
                to="/contact"
                className="inline-block mt-4 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
              >
                Discuter d’un projet
              </Link>
            </section>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default APropos;