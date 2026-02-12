import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const META_IMAGE = "https://noxia-imagerie.fr/og-image-2026.png";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>
          Consultant en imagerie médicale quantitative | Segmentation IRM, Analyse DICOM & Quantification CT | NOXIA
        </title>

        <meta
          name="description"
          content="Consultant indépendant en imagerie médicale quantitative : segmentation IRM cérébrale et cardiaque, analyse DICOM, quantification perfusion CT et développement de pipelines reproductibles pour la recherche clinique."
        />

        <link rel="canonical" href="https://noxia-imagerie.fr/" />

        {/* Open Graph */}
        <meta property="og:title" content="Consultant en imagerie médicale quantitative | NOXIA" />
        <meta property="og:description" content="Segmentation IRM, analyse DICOM, quantification CT et structuration de bases multicentriques pour la recherche clinique." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://noxia-imagerie.fr/" />
        <meta property="og:image" content={META_IMAGE} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Consultant en imagerie médicale quantitative | NOXIA" />
        <meta name="twitter:description" content="Segmentation IRM, analyse DICOM et quantification CT pour projets hospitaliers et études multicentriques." />
        <meta name="twitter:image" content={META_IMAGE} />

        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "NOXIA Imagerie",
              url: "https://noxia-imagerie.fr",
              description:
                "Consultant indépendant en imagerie médicale quantitative spécialisé en segmentation IRM, analyse DICOM et quantification CT pour la recherche clinique.",
              areaServed: "Europe",
              serviceType: [
                "Segmentation IRM",
                "Analyse DICOM",
                "Quantification CT",
                "Imagerie de perfusion"
              ]
            })
          }}
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">

          {/* HERO (contient le H1 stratégique) */}
          <HeroSection />

          {/* SECTION STRATÉGIQUE SEO */}
          <section className="max-w-4xl mx-auto py-16 px-4">
            <h2 className="text-2xl font-semibold mb-6">
              Consultant indépendant en imagerie médicale quantitative
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              NOXIA accompagne équipes hospitalières, unités de recherche et projets
              multicentriques dans l’analyse avancée d’images médicales.
              Expertise en segmentation IRM cérébrale et cardiaque,
              analyse DICOM, quantification de perfusion CT et extraction
              de biomarqueurs quantitatifs exploitables.
            </p>

            <p className="text-muted-foreground leading-relaxed mt-4">
              Approche signal-driven, validation physiopathologique,
              reproductibilité méthodologique et structuration rigoureuse
              des bases d’images cliniques (DICOM / NIfTI).
            </p>
          </section>

          {/* PROJETS */}
          <section className="py-24 px-4">
            <div className="max-w-6xl mx-auto space-y-12">

              <Link
                to="/projets"
                className="block group rounded-2xl overflow-hidden border border-border/40 bg-black transition hover:border-primary/40 hover:shadow-xl"
              >
                <div className="aspect-[21/9] overflow-hidden">
                  <img
                    src={META_IMAGE}
                    alt="Segmentation IRM, analyse DICOM et quantification CT en recherche clinique"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="bg-background p-8 sm:p-10">
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Projets & expertises en imagerie médicale
                  </h2>

                  <p className="mt-4 text-lg text-muted-foreground max-w-4xl">
                    Segmentation lésionnelle IRM, quantification CT,
                    recalage multimodal longitudinal et développement
                    d’outils méthodologiques robustes pour la recherche clinique.
                  </p>

                  <div className="mt-6 text-primary font-medium">
                    Voir les projets →
                  </div>
                </div>
              </Link>

              {/* DOMAINES */}
              <div className="grid gap-8 md:grid-cols-3 pt-6">

                <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    Segmentation IRM experte
                  </h3>
                  <p className="text-muted-foreground">
                    Segmentation cérébrale et cardiaque,
                    extraction quantitative et validation scientifique.
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    Analyse DICOM & Structuration
                  </h3>
                  <p className="text-muted-foreground">
                    Harmonisation multicentrique,
                    normalisation et préparation de bases d’images cliniques.
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-6">
                  <h3 className="font-semibold text-lg mb-2">
                    Quantification CT & Perfusion
                  </h3>
                  <p className="text-muted-foreground">
                    Extraction de biomarqueurs fonctionnels
                    et analyse quantitative robuste.
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