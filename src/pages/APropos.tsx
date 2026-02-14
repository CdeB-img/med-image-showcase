import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const CANONICAL = "https://noxia-imagerie.fr/a-propos";

const APropos = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Charles de Bourguignon",
    jobTitle: "Expert en imagerie médicale quantitative",
    description:
      "Expert indépendant en IRM et CT quantitatif. CoreLab multicentrique, biomarqueurs cœur–cerveau, ingénierie d’analyse et harmonisation inter-centres.",
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
          Charles de Bourguignon | Expert Imagerie Médicale – NOXIA
        </title>

        <meta
          name="description"
          content="Charles de Bourguignon, expert indépendant en imagerie médicale quantitative. IRM cardiaque et neuro, CT avancé, CoreLab multicentrique et ingénierie de biomarqueurs reproductibles."
        />

        <link rel="canonical" href={CANONICAL} />

        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-24 px-4">
          <div className="max-w-6xl mx-auto space-y-32">

            {/* ================= HERO ================= */}
            <section className="grid md:grid-cols-2 gap-16 items-center">

              <div className="flex justify-center md:justify-start">
                <img
                  src="/images/branding/portrait-charles.webp"
                  alt="Charles de Bourguignon – Expert imagerie médicale quantitative"
                  className="w-64 h-64 object-cover rounded-full shadow-2xl"
                />
              </div>

              <div className="space-y-8">

                <div className="space-y-4">
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                    Charles de Bourguignon
                  </h1>

                  <p className="text-xl text-muted-foreground">
                    Expert indépendant en imagerie médicale quantitative
                  </p>

                  <div className="text-sm uppercase tracking-wider text-primary font-medium">
                    CoreLab IRM & CT • Multicentrique • Essais cliniques
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  J’interviens à l’interface entre clinique, recherche translationnelle
                  et ingénierie quantitative. Mon activité est dédiée à la conception
                  de flux d’analyse robustes, traçables et inter-constructeurs,
                  transformant le signal d’imagerie en biomarqueurs exploitables.
                </p>

                {/* Preuve chiffrée */}
                <div className="grid grid-cols-3 gap-6 pt-6">
                  <div>
                    <div className="text-2xl font-semibold">5000+</div>
                    <div className="text-xs text-muted-foreground">
                      Examens analysés
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">3700+</div>
                    <div className="text-xs text-muted-foreground">
                      Cardiaque
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">1500+</div>
                    <div className="text-xs text-muted-foreground">
                      Neuro & préclinique
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* ================= POSITIONNEMENT ================= */}
            <section className="space-y-8 max-w-4xl">
              <h2 className="text-3xl font-semibold">
                Positionnement
              </h2>

              <p className="text-muted-foreground leading-relaxed">
                Après plus de dix années en environnement hospitalo-universitaire,
                j’ai structuré et piloté un CoreLab imagerie cœur–cerveau
                impliqué dans des projets RHU, ANR, PHRC et partenariats industriels.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Aujourd’hui, j’interviens de manière indépendante auprès
                d’équipes académiques, de centres hospitaliers et de promoteurs
                industriels pour concevoir, harmoniser et fiabiliser
                des flux d’imagerie quantitative à haute exigence scientifique.
              </p>
            </section>

            {/* ================= EXPERTISE ================= */}
            <section className="grid md:grid-cols-2 gap-16">

              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">
                  Expertise clinique spécialisée
                </h3>

                <ul className="space-y-3 text-muted-foreground">
                  <li>• IRM cardiaque : LGE, T1/T2 mapping, ECV, fonction</li>
                  <li>• IRM neuro post-AVC : Tmax, ADC, OEF, CMRO₂, pénombre</li>
                  <li>• Scanner thoracique & coronarien (CAD-RADS)</li>
                  <li>• CT spectral & mono-énergétique avancé</li>
                </ul>

                <p className="text-muted-foreground leading-relaxed">
                  L’analyse est systématiquement guidée par une cohérence
                  physiopathologique du signal et une exigence de reproductibilité
                  inter-centre.
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">
                  Ingénierie & méthodologie
                </h3>

                <ul className="space-y-3 text-muted-foreground">
                  <li>• Structuration CoreLab mono & multicentrique</li>
                  <li>• Harmonisation protocoles et contrôle qualité</li>
                  <li>• Anonymisation DICOM avancée</li>
                  <li>• Développement Python & modules 3D Slicer</li>
                  <li>• Évaluation et intégration d’outils IA</li>
                </ul>

                <p className="text-muted-foreground leading-relaxed">
                  Chaque outil est conçu comme un objet méthodologique explicite,
                  documenté et statistiquement exploitable.
                </p>
              </div>

            </section>

            {/* ================= PUBLICATIONS ================= */}
            <section className="space-y-6 max-w-4xl">
              <h2 className="text-3xl font-semibold">
                Publications sélectionnées
              </h2>

              <ul className="space-y-2 text-muted-foreground">
                <li>• Circulation – COVERT-MI (2021)</li>
                <li>• Neurology – Inflammation biomarkers & penumbra (2022)</li>
                <li>• Stroke – OEF & recovery after thrombectomy (2024)</li>
                <li>• Stroke – Perfusion biomarkers & collaterals (2024)</li>
              </ul>
            </section>

            {/* ================= CADRE ================= */}
            <section className="bg-primary/5 border border-primary/20 rounded-xl p-10 text-center space-y-6">
              <h2 className="text-2xl font-semibold">
                Cadre méthodologique
              </h2>

              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                La robustesse méthodologique précède l’automatisation.
                Les solutions IA sont évaluées, validées et intégrées
                dans des flux contrôlés. L’objectif est la production
                de biomarqueurs fiables, interprétables et réglementairement défendables.
              </p>

              <Link
                to="/contact"
                className="inline-block rounded-md bg-primary px-8 py-3 text-primary-foreground font-medium hover:opacity-95 transition"
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