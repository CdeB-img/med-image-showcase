import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const OG_IMAGE = "https://noxia-imagerie.fr/og-home.png";
const PROJECTS_BANNER_IMAGE = "https://noxia-imagerie.fr/og-projets.png";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>
          Imagerie médicale quantitative & Corelab IRM / CT | NOXIA
        </title>

        <meta
          name="description"
          content="Expert indépendant en imagerie médicale quantitative : biomarqueurs IRM et CT, corelab d’essais cliniques, structuration multicentrique et développement de pipelines reproductibles pour la recherche hospitalière."
        />

        <link rel="canonical" href="https://noxia-imagerie.fr/" />

        <meta property="og:title" content="Imagerie médicale quantitative & Corelab IRM / CT | NOXIA" />
        <meta
          property="og:description"
          content="Biomarqueurs IRM et CT, corelab d’essais cliniques, structuration multicentrique et ingénierie méthodologique en recherche hospitalière."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://noxia-imagerie.fr/" />
        <meta property="og:image" content={OG_IMAGE} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Imagerie médicale quantitative & Corelab IRM / CT | NOXIA" />
        <meta
          name="twitter:description"
          content="Corelab indépendant, biomarqueurs IRM et CT, harmonisation multicentrique et pipelines reproductibles."
        />
        <meta name="twitter:image" content={OG_IMAGE} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["ProfessionalService", "MedicalBusiness"],
              name: "NOXIA Imagerie",
              url: "https://noxia-imagerie.fr",
              description:
                "Expert indépendant en imagerie médicale quantitative spécialisé en biomarqueurs IRM et CT, corelab d’essais cliniques et structuration multicentrique.",
              areaServed: "Europe",
              serviceType: [
                "Corelab IRM",
                "Corelab CT",
                "Biomarqueurs d'imagerie",
                "Structuration multicentrique",
                "Segmentation quantitative",
                "Imagerie de perfusion",
              ],
              knowsAbout: [
                "IRM cardiaque",
                "IRM cérébrale",
                "ECV mapping",
                "CT spectral",
                "CT perfusion AVC",
                "Essais cliniques randomisés",
                "Biomarqueurs quantitatifs",
              ],
            }),
          }}
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">

          <HeroSection />

          {/* INTRO POSITIONNEMENT */}
          <section className="max-w-4xl mx-auto py-20 px-4 space-y-6">
            <h2 className="text-3xl font-semibold">
              Imagerie médicale quantitative pour recherche clinique et essais multicentriques
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              NOXIA intervient comme expert indépendant en imagerie médicale quantitative,
              avec une expérience consolidée en corelab IRM et CT pour essais cliniques
              randomisés, études longitudinales et cohortes institutionnelles.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              L’approche repose sur une ingénierie méthodologique explicite :
              normalisation du signal, segmentation physiopathologique,
              validation volumétrique, harmonisation inter-centre et
              reproductibilité algorithmique.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              L’objectif n’est pas uniquement de segmenter,
              mais de produire des biomarqueurs défendables,
              exploitables statistiquement et robustes en environnement multicentrique.
            </p>
          </section>

          {/* BLOC PROJETS */}
          <section className="py-24 px-4">
            <div className="max-w-6xl mx-auto space-y-16">

              <Link
                to="/projets"
                className="block group rounded-2xl overflow-hidden border border-border/40 bg-black transition hover:border-primary/40 hover:shadow-xl"
              >
                <div className="aspect-[21/9] overflow-hidden">
                  <img
                    src={PROJECTS_BANNER_IMAGE}
                    alt="Projets en imagerie médicale quantitative : IRM, CT, corelab et biomarqueurs"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="bg-background p-10">
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Projets & cas d’usage en imagerie quantitative
                  </h2>

                  <p className="mt-4 text-lg text-muted-foreground max-w-4xl">
                    Corelab IRM et CT, biomarqueurs myocardiques et cérébraux,
                    imagerie spectrale, perfusion AVC, recalage longitudinal
                    et structuration méthodologique multicentrique.
                  </p>

                  <div className="mt-6 text-primary font-medium">
                    Explorer les projets →
                  </div>
                </div>
              </Link>

              {/* 3 AXES STRATÉGIQUES */}
              <div className="grid gap-10 md:grid-cols-3 pt-6">

                <div className="rounded-xl border border-border/50 bg-muted/20 p-8">
                  <h3 className="font-semibold text-xl mb-3">
                    IRM quantitative & biomarqueurs
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    IRM cardiaque et cérébrale, mapping T1/T2, ECV,
                    segmentation lésionnelle, validation histologique
                    et corrélations cliniques dans essais randomisés.
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-8">
                  <h3 className="font-semibold text-xl mb-3">
                    CT avancé & imagerie spectrale
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Quantification perfusionnelle, CT spectral,
                    extraction de paramètres physico-mathématiques
                    et développement de modèles robustes multi-constructeurs.
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-8">
                  <h3 className="font-semibold text-xl mb-3">
                    Corelab & structuration multicentrique
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Centralisation d’images, anonymisation rigoureuse,
                    détection d’examens incomplets ou doublons,
                    harmonisation inter-centre et pipelines reproductibles.
                  </p>
                </div>

              </div>
            </div>
          </section>

          <AboutSection />

        </main>

        <Footer />
      </div>
    </>
  );
};

export default Index;